import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { Category, ReviewStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/dto/pagination.dto.js';
import { distanceKm } from '../common/utils/geo.js';
import { slugify } from '../common/utils/slug.js';
import type { AuthUser } from '../common/types.js';
import type { ListDestinationsQuery, UpsertDestinationDto } from './destinations.dto.js';
import { approvedRatings } from './ratings.js';

export const CATEGORY_LABELS: Record<Category, string> = {
  BEACH: 'Beach',
  HILL: 'Hill',
  WATERFALL: 'Waterfall',
  FOREST: 'Forest',
  HISTORICAL: 'Historical place',
  MUSEUM: 'Museum',
  PARK: 'Park',
  RELIGIOUS_CULTURAL: 'Religious or cultural site',
};

export const cardSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  district: true,
  division: true,
  shortDescription: true,
  latitude: true,
  longitude: true,
  isFeatured: true,
  isHiddenGem: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true, caption: true } },
  _count: { select: { favorites: true, wishlist: true } },
} satisfies Prisma.DestinationSelect;

type CardRow = Prisma.DestinationGetPayload<{ select: typeof cardSelect }>;

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Turns raw rows into the card shape used across the frontend. */
  async toCards(rows: CardRow[]) {
    const ratings = await approvedRatings(this.prisma, rows.map((r) => r.id));
    return rows.map(({ images, _count, ...d }) => ({
      ...d,
      categoryLabel: CATEGORY_LABELS[d.category],
      coverImage: images[0] ?? null,
      rating: ratings.get(d.id)!,
      saves: _count.favorites + _count.wishlist,
    }));
  }

  categories() {
    return this.prisma.destination
      .groupBy({ by: ['category'], _count: { _all: true } })
      .then((rows) => {
        const counts = new Map(rows.map((r) => [r.category, r._count._all]));
        return Object.values(Category).map((value) => ({
          value,
          label: CATEGORY_LABELS[value],
          count: counts.get(value) ?? 0,
        }));
      });
  }

  async list(query: ListDestinationsQuery) {
    const where: Prisma.DestinationWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.hiddenGem !== undefined) where.isHiddenGem = query.hiddenGem;
    if (query.q) {
      const contains = { contains: query.q, mode: 'insensitive' as const };
      where.OR = [
        { name: contains },
        { district: contains },
        { division: contains },
        { address: contains },
        { shortDescription: contains },
      ];
    }

    // The catalogue is small (tens to low hundreds of rows), so rating-based sorting is done
    // in memory after aggregating approved reviews. Move to a materialised rating column if
    // the catalogue grows significantly.
    const rows = await this.prisma.destination.findMany({ where, select: cardSelect });
    const cards = await this.toCards(rows);
    const sorters: Record<ListDestinationsQuery['sort'], (a: (typeof cards)[0], b: (typeof cards)[0]) => number> = {
      popular: (a, b) =>
        b.saves + b.rating.count - (a.saves + a.rating.count) ||
        Number(b.isFeatured) - Number(a.isFeatured) ||
        a.name.localeCompare(b.name),
      rating: (a, b) =>
        (b.rating.average ?? 0) - (a.rating.average ?? 0) ||
        b.rating.count - a.rating.count ||
        a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    };
    cards.sort(sorters[query.sort]);
    const start = (query.page - 1) * query.limit;
    return paginate(cards.slice(start, start + query.limit), cards.length, query.page, query.limit);
  }

  async findBySlug(slug: string, viewer?: AuthUser) {
    const destination = await this.prisma.destination.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        safety: true,
        facilities: { orderBy: [{ type: 'asc' }, { name: 'asc' }] },
        emergencyContacts: { orderBy: { label: 'asc' } },
        links: true,
      },
    });
    if (!destination) throw new NotFoundException('Destination not found.');

    const [ratingRows, nearby, viewerState] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { destinationId: destination.id, status: ReviewStatus.APPROVED },
        _count: { _all: true },
      }),
      this.nearby(destination),
      viewer ? this.viewerState(destination.id, viewer.sub) : null,
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    for (const row of ratingRows) {
      distribution[row.rating] = row._count._all;
      total += row._count._all;
      sum += row.rating * row._count._all;
    }

    return {
      ...destination,
      categoryLabel: CATEGORY_LABELS[destination.category],
      rating: {
        average: total ? Math.round((sum / total) * 10) / 10 : null,
        count: total,
        distribution,
      },
      nearby,
      viewer: viewerState,
    };
  }

  private async nearby(d: { id: string; latitude: number | null; longitude: number | null }, radiusKm = 80) {
    if (d.latitude === null || d.longitude === null) return [];
    const origin = { latitude: d.latitude, longitude: d.longitude };
    const candidates = await this.prisma.destination.findMany({
      where: { id: { not: d.id }, latitude: { not: null }, longitude: { not: null } },
      select: cardSelect,
    });
    const close = candidates
      .map((c) => ({ row: c, km: distanceKm(origin, { latitude: c.latitude!, longitude: c.longitude! }) }))
      .filter((c) => c.km <= radiusKm)
      .sort((a, b) => a.km - b.km)
      .slice(0, 4);
    const cards = await this.toCards(close.map((c) => c.row));
    return cards.map((card, i) => ({ ...card, distanceKm: Math.round(close[i].km * 10) / 10 }));
  }

  private async viewerState(destinationId: string, userId: string) {
    const [favorite, wishlist, review] = await Promise.all([
      this.prisma.favorite.findUnique({ where: { userId_destinationId: { userId, destinationId } } }),
      this.prisma.wishlistItem.findUnique({ where: { userId_destinationId: { userId, destinationId } } }),
      this.prisma.review.findUnique({
        where: { userId_destinationId: { userId, destinationId } },
        select: { id: true, rating: true, comment: true, status: true, createdAt: true, updatedAt: true },
      }),
    ]);
    return {
      isFavorite: !!favorite,
      wishlist: wishlist ? { visited: wishlist.visited, visitedAt: wishlist.visitedAt } : null,
      review,
    };
  }

  // ---------- Admin ----------

  async adminGet(id: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        safety: true,
        facilities: true,
        emergencyContacts: true,
        links: true,
      },
    });
    if (!destination) throw new NotFoundException('Destination not found.');
    return destination;
  }

  async adminList(q?: string) {
    const rows = await this.prisma.destination.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
      select: cardSelect,
      orderBy: { updatedAt: 'desc' },
    });
    return this.toCards(rows);
  }

  async create(dto: UpsertDestinationDto) {
    const slug = await this.uniqueSlug(dto.name);
    const { id } = await this.prisma.destination.create({
      data: { ...this.scalarData(dto), slug, ...this.nestedCreate(dto) },
    });
    return this.adminGet(id);
  }

  async update(id: string, dto: UpsertDestinationDto) {
    const existing = await this.prisma.destination.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Destination not found.');
    const slug = existing.name === dto.name ? existing.slug : await this.uniqueSlug(dto.name, id);

    // Nested collections are replaced wholesale, which keeps the admin form simple.
    await this.prisma.$transaction([
      this.prisma.destinationImage.deleteMany({ where: { destinationId: id } }),
      this.prisma.nearbyFacility.deleteMany({ where: { destinationId: id } }),
      this.prisma.emergencyContact.deleteMany({ where: { destinationId: id } }),
      this.prisma.safetyInfo.deleteMany({ where: { destinationId: id } }),
      this.prisma.externalLink.deleteMany({ where: { destinationId: id } }),
      this.prisma.destination.update({
        where: { id },
        data: { ...this.scalarData(dto), slug, ...this.nestedCreate(dto) },
      }),
    ]);
    return this.adminGet(id);
  }

  async remove(id: string) {
    try {
      await this.prisma.destination.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Destination not found.');
      }
      throw e;
    }
  }

  private scalarData(dto: UpsertDestinationDto) {
    return {
      name: dto.name,
      category: dto.category,
      district: dto.district,
      division: dto.division,
      address: dto.address ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      shortDescription: dto.shortDescription,
      description: dto.description,
      openingHours: dto.openingHours ?? null,
      entryFee: dto.entryFee ?? null,
      bestTimeToVisit: dto.bestTimeToVisit ?? null,
      isFeatured: dto.isFeatured ?? false,
      isHiddenGem: dto.isHiddenGem ?? false,
      isVerified: dto.isVerified ?? false,
    };
  }

  private nestedCreate(dto: UpsertDestinationDto) {
    const hasLinks = dto.links && Object.values(dto.links).some(Boolean);
    const hasSafety = dto.safety && (dto.safety.tips.length || dto.safety.warnings.length);
    return {
      images: { create: dto.images.map((img, i) => ({ url: img.url, caption: img.caption, credit: img.credit, sourceUrl: img.sourceUrl, sortOrder: i })) },
      facilities: { create: dto.facilities },
      emergencyContacts: { create: dto.emergencyContacts },
      ...(hasSafety ? { safety: { create: dto.safety } } : {}),
      ...(hasLinks ? { links: { create: dto.links } } : {}),
    };
  }

  private async uniqueSlug(name: string, excludeId?: string) {
    const base = slugify(name) || 'destination';
    let slug = base;
    for (let i = 2; ; i++) {
      const clash = await this.prisma.destination.findUnique({ where: { slug } });
      if (!clash || clash.id === excludeId) return slug;
      slug = `${base}-${i}`;
    }
  }
}

