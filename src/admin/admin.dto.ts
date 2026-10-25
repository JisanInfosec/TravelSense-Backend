import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../generated/prisma/enums.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../common/utils/password.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UsersQuery extends PaginationDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

/** Staff accounts (moderators/administrators) can only be created here, by an administrator. */
export class CreateStaffDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(80)
  name: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @IsIn([Role.MODERATOR, Role.ADMIN], { message: 'Role must be MODERATOR or ADMIN.' })
  role: 'MODERATOR' | 'ADMIN';
}
