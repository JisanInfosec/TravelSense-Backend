import { ReviewStatus } from '../generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export interface RatingSummary {
  average: number | null;
  count: number;
}

/** Average rating per destination, computed from APPROVED reviews only. */
export async function approvedRatings(
  prisma: PrismaService,
  destinationIds: string[],
): Promise<Map<string, RatingSummary>> {
  const rows = destinationIds.length
    ? await prisma.review.groupBy({
        by: ['destinationId'],
        where: { status: ReviewStatus.APPROVED, destinationId: { in: destinationIds } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const map = new Map<string, RatingSummary>();
  for (const id of destinationIds) map.set(id, { average: null, count: 0 });
  for (const row of rows) {
    map.set(row.destinationId, {
      average: row._avg.rating === null ? null : Math.round(row._avg.rating * 10) / 10,
      count: row._count._all,
    });
  }
  return map;
}
