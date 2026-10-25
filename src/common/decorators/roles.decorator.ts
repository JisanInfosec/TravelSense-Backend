import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';
/** Restrict a route to the given roles. Must be combined with `JwtAuthGuard`. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
