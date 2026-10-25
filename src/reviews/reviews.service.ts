import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { ReviewStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate, PaginationDto } from '../common/dto/pagination.dto.js';
import type { ModerateReviewDto, ModerationQuery, ReviewDto } from './reviews.dto.js';

const destinationSummary = {
  select: {
    id: true,
    slug: true,
    name: true,
    district: true,
    images: { orderBy: { sortOrder: 'asc' as const }, take: 1, select: { url: true } },
  },
};

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public list: approved reviews only. Only the reviewer's display name is exposed. */
  async listApproved(destinationId: string, { page, limit }: PaginationDto) {
    const where = { destinationId, status: ReviewStatus.APPROVED };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async create(userId: string, destinationId: string, dto: ReviewDto) {
    const destination = await this.prisma.destination.findUnique({ where: { id: destinationId } });
    if (!destination) throw new NotFoundException('Destination not found.');
    try {
      return await this.prisma.review.create({
        data: { userId, destinationId, rating: dto.rating, comment: dto.comment, status: ReviewStatus.PENDING },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('You have already reviewed this destination. You can edit your existing review instead.');
      }
      throw e;
    }
  }

  /** Editing a review sends it back to moderation. */
  async update(userId: string, reviewId: string, dto: ReviewDto) {
    await this.assertOwner(userId, reviewId);
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { rating: dto.rating, comment: dto.comment, status: ReviewStatus.PENDING, moderatedAt: null, moderatedById: null },
    });
  }

  async remove(userId: string, reviewId: string) {
    await this.assertOwner(userId, reviewId);
    await this.prisma.review.delete({ where: { id: reviewId } });
  }

  mine(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        moderatedAt: true,
        destination: destinationSummary,
      },
    });
  }

  // ---------- Moderation (MODERATOR, ADMIN) ----------

  async moderationList(query: ModerationQuery) {
    const where: Prisma.ReviewWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      const contains = { contains: query.q, mode: 'insensitive' as const };
      where.OR = [{ comment: contains }, { destination: { name: contains } }, { user: { name: contains } }];
    }
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        // Oldest pending first so nothing waits too long.
        orderBy: { createdAt: query.status === ReviewStatus.PENDING ? 'asc' : 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          createdAt: true,
          moderatedAt: true,
          user: { select: { id: true, name: true, email: true } },
          moderatedBy: { select: { name: true } },
          destination: destinationSummary,
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async moderationSummary() {
    const rows = await this.prisma.review.groupBy({ by: ['status'], _count: { _all: true } });
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of rows) counts[r.status] = r._count._all;
    return counts;
  }

  async moderate(moderatorId: string, reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found.');
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { status: dto.status, moderatedAt: new Date(), moderatedById: moderatorId },
      select: { id: true, status: true, moderatedAt: true },
    });
  }

  private async assertOwner(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found.');
    if (review.userId !== userId) throw new ForbiddenException('You can only change your own reviews.');
  }
}
