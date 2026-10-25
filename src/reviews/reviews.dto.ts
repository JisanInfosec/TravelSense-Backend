import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ReviewStatus } from '../generated/prisma/enums.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ReviewDto {
  @Type(() => Number)
  @IsInt({ message: 'Rating must be a whole number.' })
  @Min(1, { message: 'Rating must be between 1 and 5 stars.' })
  @Max(5, { message: 'Rating must be between 1 and 5 stars.' })
  rating: number;

  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'Please write at least 10 characters.' })
  @MaxLength(2000, { message: 'Reviews can be at most 2000 characters.' })
  comment: string;
}

export class ModerateReviewDto {
  @IsIn([ReviewStatus.APPROVED, ReviewStatus.REJECTED], {
    message: 'Status must be APPROVED or REJECTED.',
  })
  status: 'APPROVED' | 'REJECTED';
}

export class ModerationQuery extends PaginationDto {
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;
}
