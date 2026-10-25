import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BCRYPT_ROUNDS } from '../common/utils/password.js';
import type { AuthUser } from '../common/types.js';
import { publicUserSelect } from '../users/users.service.js';
import type { LoginDto, RegisterDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  private readonly dummyHash = bcrypt.hashSync('timing-equaliser', BCRYPT_ROUNDS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Public registration always creates TOURIST accounts. */
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('An account with this email already exists.');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        role: Role.TOURIST,
      },
      select: publicUserSelect,
    });
    return { user, accessToken: await this.sign(user) };
  }

  async login(dto: LoginDto) {
    const record = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Compare against a dummy hash when the user is missing to keep timing similar.
    const ok = await bcrypt.compare(
      dto.password,
      record?.passwordHash ?? this.dummyHash,
    );
    if (!record || !ok) throw new UnauthorizedException('Incorrect email or password.');
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: record.id },
      select: publicUserSelect,
    });
    return { user, accessToken: await this.sign(user) };
  }

  private sign(user: { id: string; email: string; role: Role; name: string }) {
    const payload: AuthUser = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return this.jwt.signAsync(payload);
  }
}
