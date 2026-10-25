import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { cardSelect, DestinationsService } from '../destinations/destinations.service.js';

@Injectable()
export class SavedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly destinations: DestinationsService,
  ) {}

  async favorites(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, destination: { select: cardSelect } },
    });
    const cards = await this.destinations.toCards(rows.map((r) => r.destination));
    return cards.map((card, i) => ({ savedAt: rows[i].createdAt, destination: card }));
  }

  async addFavorite(userId: string, destinationId: string) {
    await this.assertDestination(destinationId);
    await this.prisma.favorite.upsert({
      where: { userId_destinationId: { userId, destinationId } },
      create: { userId, destinationId },
      update: {},
    });
    return { isFavorite: true };
  }

  async removeFavorite(userId: string, destinationId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, destinationId } });
    return { isFavorite: false };
  }

  async wishlist(userId: string) {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: [{ visited: 'asc' }, { createdAt: 'desc' }],
      select: { createdAt: true, visited: true, visitedAt: true, destination: { select: cardSelect } },
    });
    const cards = await this.destinations.toCards(rows.map((r) => r.destination));
    return cards.map((card, i) => ({
      addedAt: rows[i].createdAt,
      visited: rows[i].visited,
      visitedAt: rows[i].visitedAt,
      destination: card,
    }));
  }

  async addToWishlist(userId: string, destinationId: string) {
    await this.assertDestination(destinationId);
    const item = await this.prisma.wishlistItem.upsert({
      where: { userId_destinationId: { userId, destinationId } },
      create: { userId, destinationId },
      update: {},
    });
    return { visited: item.visited, visitedAt: item.visitedAt };
  }

  async setVisited(userId: string, destinationId: string, visited: boolean) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_destinationId: { userId, destinationId } },
    });
    if (!existing) throw new NotFoundException('This destination is not in your wishlist.');
    const item = await this.prisma.wishlistItem.update({
      where: { userId_destinationId: { userId, destinationId } },
      data: { visited, visitedAt: visited ? new Date() : null },
    });
    return { visited: item.visited, visitedAt: item.visitedAt };
  }

  async removeFromWishlist(userId: string, destinationId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, destinationId } });
  }

  private async assertDestination(id: string) {
    const exists = await this.prisma.destination.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Destination not found.');
  }
}
