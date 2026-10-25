import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../types.js';

function extractToken(req: Request): string | undefined {
  const [type, token] = req.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' && token ? token : undefined;
}

/**
 * Verifies the bearer token and re-loads the user so that deleted accounts and
 * role changes take effect immediately, not only when the token expires.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  protected optional = false;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = extractToken(req);
    if (!token) {
      if (this.optional) return true;
      throw new UnauthorizedException('Please log in to continue.');
    }
    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, name: true },
      });
      if (!user) throw new Error('User no longer exists');
      req.user = { sub: user.id, email: user.email, role: user.role, name: user.name };
      return true;
    } catch {
      if (this.optional) return true;
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }
  }
}

/** Attaches `request.user` when a valid token is present but never rejects. */
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  protected override optional = true;
}
