# TravelSense API (NestJS)

See the [root README](../README.md) for setup, test accounts and architecture.

## Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | Run with watch mode on `PORT` (default 4000) |
| `npm run build` / `npm run start:prod` | Production build / run |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply existing migrations (CI/production) |
| `npm run db:seed` | Load demo data and test accounts (clears existing destinations/reviews) |
| `npm run db:reset` | Drop, re-migrate and re-seed the database |
| `npm test` / `npm run test:e2e` | Unit tests / API end-to-end tests (needs running API) |

## Endpoints (prefix `/api`)

| Method & path | Access |
|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | Public |
| `GET /auth/me`, `PATCH /users/me`, `PATCH /users/me/password` | Logged in |
| `GET /destinations?q=&category=&featured=&hiddenGem=&sort=&page=&limit=` | Public |
| `GET /destinations/categories`, `GET /destinations/:slug`, `GET /destinations/:id/reviews` | Public |
| `POST /destinations/:id/reviews`, `GET /reviews/mine`, `PATCH /reviews/:id`, `DELETE /reviews/:id` | Tourist |
| `GET/PUT/DELETE /me/favorites[/:destinationId]` | Tourist |
| `GET/PUT/PATCH/DELETE /me/wishlist[/:destinationId]` | Tourist |
| `GET /moderation/reviews?status=&q=`, `GET /moderation/reviews/summary`, `PATCH /moderation/reviews/:id` | Moderator, Admin |
| `GET/POST/PUT/DELETE /admin/destinations[/:id]` | Admin |
| `GET /admin/users`, `POST /admin/users`, `DELETE /admin/users/:id`, `GET /admin/reports` | Admin |
| `GET /admin/uploads/config`, `POST /admin/uploads` (multipart `file`) | Admin |
| `GET /health` | Public |

## Layout

```
src/
  auth/ users/ destinations/ reviews/ saved/ admin/ uploads/   feature modules
  common/       guards (JWT, roles), decorators, DTO helpers, utils
  prisma/       PrismaService (pg driver adapter)
  generated/    Prisma client (generated, git-ignored)
prisma/
  schema.prisma, migrations/, seed.ts, seed-data/
test/api.e2e-spec.ts
```
