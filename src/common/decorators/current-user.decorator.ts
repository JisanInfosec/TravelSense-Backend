import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    ctx.switchToHttp().getRequest<{ user?: AuthUser }>().user,
);
