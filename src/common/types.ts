import type { Role } from '../generated/prisma/enums.js';

/** The payload stored in the JWT and attached to `request.user`. */
export interface AuthUser {
  sub: string;
  email: string;
  role: Role;
  name: string;
}
