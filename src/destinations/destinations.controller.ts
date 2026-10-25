import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthUser } from '../common/types.js';
import { ListDestinationsQuery, UpsertDestinationDto } from './destinations.dto.js';
import { DestinationsService } from './destinations.service.js';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get()
  list(@Query() query: ListDestinationsQuery) {
    return this.destinations.list(query);
  }

  @Get('categories')
  categories() {
    return this.destinations.categories();
  }

  /** Public details. When a valid token is sent, also returns the viewer's favorite/wishlist/review state. */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.destinations.findBySlug(slug, user);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/destinations')
export class AdminDestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.destinations.adminList(q?.trim() || undefined);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.destinations.adminGet(id);
  }

  @Post()
  create(@Body() dto: UpsertDestinationDto) {
    return this.destinations.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpsertDestinationDto) {
    return this.destinations.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.destinations.remove(id);
  }
}
