import { Module } from '@nestjs/common';
import { ModerationController, ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  controllers: [ReviewsController, ModerationController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
