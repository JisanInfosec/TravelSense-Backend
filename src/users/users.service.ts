import { BadRequestException, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BCRYPT_ROUNDS } from '../common/utils/password.js';
import type { ChangePasswordDto, UpdateProfileDto } from './users.dto.js';

/** Fields that are safe to return to clients. Never includes the password hash. */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  city: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        ...publicUserSelect,
        _count: { select: { favorites: true, wishlist: true, reviews: true } },
      },
    });
    const visited = await this.prisma.wishlistItem.count({ where: { userId, visited: true } });
    const { _count, ...rest } = user;
    return { ...rest, stats: { ..._count, visited } };
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: publicUserSelect });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Your current password is incorrect.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
    });
  }
}
