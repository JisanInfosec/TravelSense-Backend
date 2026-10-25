import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { Role } from '../generated/prisma/enums.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthUser } from '../common/types.js';
import { SavedService } from './saved.service.js';

class VisitedDto {
  @IsBoolean()
  visited: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TOURIST)
@Controller('me')
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get('favorites')
  favorites(@CurrentUser() user: AuthUser) {
    return this.saved.favorites(user.sub);
  }

  @Put('favorites/:destinationId')
  addFavorite(@CurrentUser() user: AuthUser, @Param('destinationId') id: string) {
    return this.saved.addFavorite(user.sub, id);
  }

  @Delete('favorites/:destinationId')
  removeFavorite(@CurrentUser() user: AuthUser, @Param('destinationId') id: string) {
    return this.saved.removeFavorite(user.sub, id);
  }

  @Get('wishlist')
  wishlist(@CurrentUser() user: AuthUser) {
    return this.saved.wishlist(user.sub);
  }

  @Put('wishlist/:destinationId')
  addToWishlist(@CurrentUser() user: AuthUser, @Param('destinationId') id: string) {
    return this.saved.addToWishlist(user.sub, id);
  }

  @Patch('wishlist/:destinationId')
  setVisited(@CurrentUser() user: AuthUser, @Param('destinationId') id: string, @Body() dto: VisitedDto) {
    return this.saved.setVisited(user.sub, id, dto.visited);
  }

  @Delete('wishlist/:destinationId')
  @HttpCode(204)
  async removeFromWishlist(@CurrentUser() user: AuthUser, @Param('destinationId') id: string) {
    await this.saved.removeFromWishlist(user.sub, id);
  }
}
