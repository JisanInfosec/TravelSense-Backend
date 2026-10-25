import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/client.js';
import { ReviewStatus, Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/dto/pagination.dto.js';
import { BCRYPT_ROUNDS } from '../common/utils/password.js';
import { publicUserSelect } from '../users/users.service.js';
import { CATEGORY_LABELS } from '../destinations/destinations.service.js';
import type { CreateStaffDto, UsersQuery } from './admin.dto.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async reports() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [users, roleRows, newUsers, destinations, categoryRows, reviewRows, favorites, wishlist, visited] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
        this.prisma.user.count({ where: { createdAt: { gte: since } } }),
        this.prisma.destination.count(),
        this.prisma.destination.groupBy({ by: ['category'], _count: { _all: true } }),
        this.prisma.review.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.favorite.count(),
        this.prisma.wishlistItem.count(),
        this.prisma.wishlistItem.count({ where: { visited: true } }),
      ]);

    const reviews = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of reviewRows) reviews[r.status] = r._count._all;
    const roles = { TOURIST: 0, MODERATOR: 0, ADMIN: 0 };
    for (const r of roleRows) roles[r.role] = r._count._all;

    const ranked = await this.prisma.destination.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        district: true,
        _count: {
          select: {
            favorites: true,
            wishlist: true,
            reviews: true,
          },
        },
      },
    });
    const approvedByDestination = await this.prisma.review.groupBy({
      by: ['destinationId'],
      where: { status: ReviewStatus.APPROVED },
      _count: { _all: true },
      _avg: { rating: true },
    });
    const approvedMap = new Map(approvedByDestination.map((r) => [r.destinationId, r]));

    const rows = ranked.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      district: d.district,
      favorites: d._count.favorites,
      wishlist: d._count.wishlist,
      saves: d._count.favorites + d._count.wishlist,
      totalReviews: d._count.reviews,
      approvedReviews: approvedMap.get(d.id)?._count._all ?? 0,
      averageRating:
        approvedMap.get(d.id)?._avg.rating != null
          ? Math.round(approvedMap.get(d.id)!._avg.rating! * 10) / 10
          : null,
    }));

    return {
      totals: {
        users,
        newUsersLast30Days: newUsers,
        destinations,
        reviews: reviews.PENDING + reviews.APPROVED + reviews.REJECTED,
        approvedReviews: reviews.APPROVED,
        pendingReviews: reviews.PENDING,
        rejectedReviews: reviews.REJECTED,
        favorites,
        wishlist,
        visited,
      },
      usersByRole: roles,
      destinationsByCategory: categoryRows
        .map((r) => ({ category: r.category, label: CATEGORY_LABELS[r.category], count: r._count._all }))
        .sort((a, b) => b.count - a.count),
      mostSaved: rows
        .filter((r) => r.saves > 0)
        .sort((a, b) => b.saves - a.saves || a.name.localeCompare(b.name))
        .slice(0, 10),
      mostReviewed: rows
        .filter((r) => r.totalReviews > 0)
        .sort((a, b) => b.totalReviews - a.totalReviews || a.name.localeCompare(b.name))
        .slice(0, 10),
      generatedAt: new Date(),
    };
  }

  async users(query: UsersQuery) {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.q) {
      const contains = { contains: query.q, mode: 'insensitive' as const };
      where.OR = [{ name: contains }, { email: contains }];
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: { ...publicUserSelect, _count: { select: { reviews: true, favorites: true, wishlist: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async createStaff(dto: CreateStaffDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('An account with this email already exists.');
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      },
      select: publicUserSelect,
    });
  }

  async removeUser(actorId: string, userId: string) {
    if (actorId === userId) throw new BadRequestException('You cannot delete your own account.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (user.role === Role.ADMIN) {
      const admins = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (admins <= 1) throw new BadRequestException('The last administrator account cannot be deleted.');
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
