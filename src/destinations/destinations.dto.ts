import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Category, FacilityType } from '../generated/prisma/enums.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;
const toBool = ({ value }: { value: unknown }) =>
  value === 'true' || value === true ? true : value === 'false' || value === false ? false : value;
const url = (message: string) =>
  IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message });

export const SORTS = ['popular', 'rating', 'name', 'newest'] as const;

export class ListDestinationsQuery extends PaginationDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(Category, { message: 'Unknown category.' })
  category?: Category;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hiddenGem?: boolean;

  @IsOptional()
  @IsIn(SORTS)
  sort: (typeof SORTS)[number] = 'popular';
}

export class ImageDto {
  @url('Each image must have a valid URL.')
  url: string;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(200)
  caption?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  credit?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @url('Image source must be a valid URL.')
  sourceUrl?: string | null;
}

export class SafetyDto {
  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(400, { each: true })
  tips: string[] = [];

  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(400, { each: true })
  warnings: string[] = [];

  @IsOptional() @IsBoolean()
  isVerified?: boolean;
}

export class FacilityDto {
  @IsEnum(FacilityType)
  type: FacilityType;

  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Facility name is required.' }) @MaxLength(160)
  name: string;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  address?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(40)
  phone?: string | null;

  @IsOptional() @IsBoolean()
  isVerified?: boolean;
}

export class EmergencyContactDto {
  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Contact label is required.' }) @MaxLength(120)
  label: string;

  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Contact phone is required.' }) @MaxLength(40)
  phone: string;

  @IsOptional() @IsBoolean()
  isVerified?: boolean;
}

export class LinksDto {
  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @url('Website must be a valid URL.')
  website?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(120)
  websiteLabel?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @url('Facebook link must be a valid URL.')
  facebook?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @url('YouTube link must be a valid URL.')
  youtube?: string | null;
}

export class UpsertDestinationDto {
  @Transform(trim) @IsString() @MinLength(2, { message: 'Name is required.' }) @MaxLength(120)
  name: string;

  @IsEnum(Category, { message: 'Please choose a valid category.' })
  category: Category;

  @Transform(trim) @IsString() @IsNotEmpty({ message: 'District is required.' }) @MaxLength(80)
  district: string;

  @Transform(trim) @IsString() @IsNotEmpty({ message: 'Division is required.' }) @MaxLength(80)
  division: string;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  address?: string | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsLatitude({ message: 'Latitude is invalid.' })
  latitude?: number | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsLongitude({ message: 'Longitude is invalid.' })
  longitude?: number | null;

  @Transform(trim) @IsString() @MinLength(10, { message: 'Short description must be at least 10 characters.' }) @MaxLength(240)
  shortDescription: string;

  @Transform(trim) @IsString() @MinLength(30, { message: 'Description must be at least 30 characters.' }) @MaxLength(10000)
  description: string;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  openingHours?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  entryFee?: string | null;

  @IsOptional() @Transform(emptyToNull) @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  bestTimeToVisit?: string | null;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsBoolean()
  isHiddenGem?: boolean;

  @IsOptional() @IsBoolean()
  isVerified?: boolean;

  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ImageDto)
  images: ImageDto[] = [];

  @IsOptional() @ValidateNested() @Type(() => SafetyDto)
  safety?: SafetyDto;

  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => FacilityDto)
  facilities: FacilityDto[] = [];

  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => EmergencyContactDto)
  emergencyContacts: EmergencyContactDto[] = [];

  @IsOptional() @ValidateNested() @Type(() => LinksDto)
  links?: LinksDto;
}

export class NearbyQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  radiusKm = 80;
}
