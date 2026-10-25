/**
 * End-to-end checks against a running API with seeded data.
 *   npm run db:seed && npm run start:dev   (in another terminal)
 *   npm run test:e2e
 */
const API = process.env.API_URL ?? 'http://localhost:4000/api';

async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const login = async (email: string, password: string) =>
  (await call('POST', '/auth/login', { body: { email, password } })).body.accessToken as string;

describe('TravelSense API', () => {
  let admin: string;
  let moderator: string;
  let tourist: string;
  const email = `e2e-${Date.now()}@travelsense.test`;

  beforeAll(async () => {
    admin = await login('admin@travelsense.test', 'Admin@12345');
    moderator = await login('moderator@travelsense.test', 'Moderator@123');
  });

  it('registers tourists only, rejects duplicates and weak passwords', async () => {
    const weak = await call('POST', '/auth/register', { body: { name: 'E2E', email, password: 'short' } });
    expect(weak.status).toBe(400);

    const ok = await call('POST', '/auth/register', {
      body: { name: 'E2E Tourist', email, password: 'Password1' },
    });
    expect(ok.status).toBe(201);
    expect(ok.body.user.role).toBe('TOURIST');
    expect(ok.body.user.passwordHash).toBeUndefined();
    tourist = ok.body.accessToken;

    const roleInjection = await call('POST', '/auth/register', {
      body: { name: 'Sneaky', email: `x${email}`, password: 'Password1', role: 'ADMIN' },
    });
    expect(roleInjection.status).toBe(400);

    const dup = await call('POST', '/auth/register', { body: { name: 'Dup', email, password: 'Password1' } });
    expect(dup.status).toBe(409);
  });

  it('combines keyword search with a category filter', async () => {
    const res = await call('GET', '/destinations?q=dhaka&category=MUSEUM');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const d of res.body.items) expect(d.category).toBe('MUSEUM');
    const none = await call('GET', '/destinations?q=zzzz-no-match');
    expect(none.body.total).toBe(0);
  });

  it('runs the review lifecycle: pending → hidden → approved → counted', async () => {
    const list = await call('GET', '/destinations?q=panam');
    const dest = list.body.items[0];

    const created = await call('POST', `/destinations/${dest.id}/reviews`, {
      token: tourist,
      body: { rating: 5, comment: 'An end-to-end test review of this place.' },
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('PENDING');

    const again = await call('POST', `/destinations/${dest.id}/reviews`, {
      token: tourist,
      body: { rating: 4, comment: 'Trying to review twice should fail.' },
    });
    expect(again.status).toBe(409);

    let pub = await call('GET', `/destinations/${dest.id}/reviews`);
    expect(pub.body.items.find((r: { id: string }) => r.id === created.body.id)).toBeUndefined();

    // Tourists cannot moderate; moderators can.
    expect((await call('PATCH', `/moderation/reviews/${created.body.id}`, { token: tourist, body: { status: 'APPROVED' } })).status).toBe(403);
    const mod = await call('PATCH', `/moderation/reviews/${created.body.id}`, { token: moderator, body: { status: 'APPROVED' } });
    expect(mod.status).toBe(200);

    pub = await call('GET', `/destinations/${dest.id}/reviews`);
    expect(pub.body.items.some((r: { id: string }) => r.id === created.body.id)).toBe(true);
    const detail = await call('GET', `/destinations/${dest.slug}`);
    expect(detail.body.rating.count).toBeGreaterThan(0);

    const mine = await call('GET', '/reviews/mine', { token: tourist });
    expect(mine.body[0].status).toBe('APPROVED');
  });

  it('manages favorites and wishlist without duplicates', async () => {
    const dest = (await call('GET', '/destinations?limit=1')).body.items[0];
    await call('PUT', `/me/favorites/${dest.id}`, { token: tourist });
    await call('PUT', `/me/favorites/${dest.id}`, { token: tourist });
    expect((await call('GET', '/me/favorites', { token: tourist })).body).toHaveLength(1);

    await call('PUT', `/me/wishlist/${dest.id}`, { token: tourist });
    const visited = await call('PATCH', `/me/wishlist/${dest.id}`, { token: tourist, body: { visited: true } });
    expect(visited.body.visited).toBe(true);
    await call('DELETE', `/me/wishlist/${dest.id}`, { token: tourist });
    expect((await call('GET', '/me/wishlist', { token: tourist })).body).toHaveLength(0);
  });

  it('enforces role boundaries on the server', async () => {
    expect((await call('GET', '/admin/reports')).status).toBe(401);
    expect((await call('GET', '/admin/reports', { token: tourist })).status).toBe(403);
    expect((await call('GET', '/admin/reports', { token: moderator })).status).toBe(403);
    expect((await call('GET', '/admin/users', { token: moderator })).status).toBe(403);
    expect((await call('GET', '/moderation/reviews?status=PENDING', { token: moderator })).status).toBe(200);
    const reports = await call('GET', '/admin/reports', { token: admin });
    expect(reports.status).toBe(200);
    expect(reports.body.totals).toHaveProperty('pendingReviews');
  });

  it('lets admins create staff and delete users, never exposing password hashes', async () => {
    const staff = await call('POST', '/admin/users', {
      token: admin,
      body: { name: 'E2E Moderator', email: `mod-${email}`, password: 'Password1', role: 'MODERATOR' },
    });
    expect(staff.status).toBe(201);
    const users = await call('GET', `/admin/users?q=${encodeURIComponent('e2e')}`, { token: admin });
    expect(JSON.stringify(users.body)).not.toContain('passwordHash');
    for (const u of users.body.items) {
      expect((await call('DELETE', `/admin/users/${u.id}`, { token: admin })).status).toBe(204);
    }
    // Deleted accounts lose access immediately.
    expect((await call('GET', '/auth/me', { token: tourist })).status).toBe(401);
  });

  it('lets admins create, update and delete destinations', async () => {
    const body = {
      name: 'E2E Test Destination',
      category: 'PARK',
      district: 'Dhaka',
      division: 'Dhaka',
      shortDescription: 'A destination created by the e2e test.',
      description: 'This destination exists only for the duration of the automated test run.',
      images: [{ url: 'https://example.com/a.jpg' }],
      facilities: [],
      emergencyContacts: [],
      safety: { tips: ['Test tip'], warnings: [] },
      links: { website: 'https://example.com' },
    };
    const created = await call('POST', '/admin/destinations', { token: admin, body });
    expect(created.status).toBe(201);
    expect(created.body.slug).toBe('e2e-test-destination');
    const updated = await call('PUT', `/admin/destinations/${created.body.id}`, {
      token: admin,
      body: { ...body, entryFee: 'Free' },
    });
    expect(updated.body.entryFee).toBe('Free');
    expect((await call('DELETE', `/admin/destinations/${created.body.id}`, { token: admin })).status).toBe(204);
  });
});
