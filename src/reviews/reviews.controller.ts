import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthUser } from '../common/types.js';
import { ModerateReviewDto, ModerationQuery, ReviewDto } from './reviews.dto.js';
import { ReviewsService } from './reviews.service.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('destinations/:id/reviews')
  list(@Param('id') destinationId: string, @Query() query: PaginationDto) {
    return this.reviews.listApproved(destinationId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TOURIST)
  @Post('destinations/:id/reviews')
  create(@CurrentUser() user: AuthUser, @Param('id') destinationId: string, @Body() dto: ReviewDto) {
    return this.reviews.create(user.sub, destinationId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TOURIST)
  @Get('reviews/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.reviews.mine(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TOURIST)
  @Patch('reviews/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.reviews.update(user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TOURIST)
  @Delete('reviews/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.reviews.remove(user.sub, id);
  }
}

/** Review moderation is available to moderators and administrators only. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN)
@Controller('moderation/reviews')
export class ModerationController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query() query: ModerationQuery) {
    return this.reviews.moderationList(query);
  }

  @Get('summary')
  summary() {
    return this.reviews.moderationSummary();
  }

  @Patch(':id')
  moderate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviews.moderate(user.sub, id, dto);
  }
}
