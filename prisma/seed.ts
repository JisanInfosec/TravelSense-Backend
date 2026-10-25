/**
 * Seeds demonstration data. Safe to re-run: it clears existing demo content first.
 *   npm run db:seed
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { destinations } from './seed-data/destinations.js';

const images = JSON.parse(
  readFileSync(new URL('./seed-data/images.json', import.meta.url), 'utf8'),
) as Record<string, { url: string; credit: string; source: string }[]>;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

/** Non-production test accounts. Change or remove before going live. */
const accounts = [
  { name: 'TravelSense Admin', email: process.env.SEED_ADMIN_EMAIL ?? 'admin@travelsense.test', password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345', role: 'ADMIN' },
  { name: 'Review Moderator', email: 'moderator@travelsense.test', password: 'Moderator@123', role: 'MODERATOR' },
  { name: 'Nusrat Jahan', email: 'tourist@travelsense.test', password: 'Tourist@123', role: 'TOURIST', city: 'Dhaka' },
  { name: 'Arif Hossain', email: 'arif@travelsense.test', password: 'Tourist@123', role: 'TOURIST', city: 'Chattogram' },
  { name: 'Mitu Akter', email: 'mitu@travelsense.test', password: 'Tourist@123', role: 'TOURIST', city: 'Sylhet' },
] as const;

/** Sample reviews written by the test tourists — demonstrates every moderation state. */
const reviews: { email: string; slug: string; rating: number; comment: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }[] = [
  { email: 'tourist@travelsense.test', slug: 'coxs-bazar-sea-beach', rating: 5, status: 'APPROVED', comment: 'Lovely long beach and beautiful sunsets. Kolatoli was crowded in the evening but the walk towards Himchari was peaceful.' },
  { email: 'arif@travelsense.test', slug: 'coxs-bazar-sea-beach', rating: 4, status: 'APPROVED', comment: 'Great for a family trip. Follow the lifeguard flags — the waves were strong on our second day.' },
  { email: 'mitu@travelsense.test', slug: 'coxs-bazar-sea-beach', rating: 4, status: 'PENDING', comment: 'Visited in December, weather was perfect. Seafood near Sugandha point was good value.' },
  { email: 'tourist@travelsense.test', slug: 'sajek-valley', rating: 5, status: 'APPROVED', comment: 'Waking up above the clouds was unforgettable. The road is long and winding, so bring motion sickness tablets.' },
  { email: 'mitu@travelsense.test', slug: 'sajek-valley', rating: 4, status: 'APPROVED', comment: 'Beautiful views from Konglak. Book a stay in advance on weekends.' },
  { email: 'arif@travelsense.test', slug: 'lalbagh-fort', rating: 4, status: 'APPROVED', comment: 'Well-kept gardens and interesting Mughal architecture. Go early in the morning to avoid crowds.' },
  { email: 'mitu@travelsense.test', slug: 'ratargul-swamp-forest', rating: 5, status: 'APPROVED', comment: 'Boating between the trees in August felt magical. Wear a life jacket and keep your phone in a dry bag.' },
  { email: 'tourist@travelsense.test', slug: 'sundarbans', rating: 5, status: 'PENDING', comment: 'Saw spotted deer and monkeys at Karamjal. The wooden walkway is a nice short introduction to the forest.' },
  { email: 'arif@travelsense.test', slug: 'ramna-park', rating: 2, status: 'REJECTED', comment: 'Visit my shop for cheap tickets!!! call now' },
  { email: 'arif@travelsense.test', slug: 'somapura-mahavihara', rating: 5, status: 'APPROVED', comment: 'Impressive scale and the terracotta plaques are worth a close look. The site museum is small but helpful.' },
  { email: 'tourist@travelsense.test', slug: 'sixty-dome-mosque', rating: 4, status: 'APPROVED', comment: 'Peaceful and historic. Combine it with the Khan Jahan Ali mausoleum nearby.' },
  { email: 'mitu@travelsense.test', slug: 'lawachara-national-park', rating: 4, status: 'PENDING', comment: 'Heard gibbons calling on the morning trail. Hire a local guide to find them.' },
];

async function main() {
  console.log('Clearing existing data…');
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: accounts.map((a) => a.email) } } });

  console.log('Creating test accounts…');
  const users = new Map<string, string>();
  for (const a of accounts) {
    const user = await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        role: a.role,
        city: 'city' in a ? a.city : null,
        passwordHash: await bcrypt.hash(a.password, 12),
      },
    });
    users.set(a.email, user.id);
  }

  console.log('Creating destinations…');
  const ids = new Map<string, string>();
  for (const d of destinations) {
    const { safety, facilities, links, ...scalars } = d;
    const created = await prisma.destination.create({
      data: {
        ...scalars,
        isVerified: false,
        images: {
          create: (images[d.slug] ?? []).map((img, i) => ({
            url: img.url,
            credit: img.credit,
            sourceUrl: img.source,
            sortOrder: i,
          })),
        },
        safety: { create: { ...safety, isVerified: false } },
        facilities: { create: facilities.map((f) => ({ ...f, isVerified: false })) },
        // 999 is Bangladesh's national emergency number (police, fire, ambulance).
        emergencyContacts: { create: [{ label: 'National Emergency Service (Police, Fire, Ambulance)', phone: '999', isVerified: true }] },
        ...(links ? { links: { create: links } } : {}),
      },
    });
    ids.set(d.slug, created.id);
  }

  console.log('Creating sample reviews, favorites and wishlist items…');
  const moderatorId = users.get('moderator@travelsense.test')!;
  for (const [i, r] of reviews.entries()) {
    const createdAt = new Date(Date.now() - (reviews.length - i) * 36 * 60 * 60 * 1000);
    await prisma.review.create({
      data: {
        userId: users.get(r.email)!,
        destinationId: ids.get(r.slug)!,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        createdAt,
        ...(r.status !== 'PENDING' ? { moderatedAt: new Date(createdAt.getTime() + 3_600_000), moderatedById: moderatorId } : {}),
      },
    });
  }

  const saved: [string, string[], string[], string[]][] = [
    // email, favorites, wishlist (not visited), wishlist (visited)
    ['tourist@travelsense.test', ['coxs-bazar-sea-beach', 'sajek-valley', 'lalbagh-fort'], ['sundarbans', 'nafakhum-waterfall'], ['sajek-valley']],
    ['arif@travelsense.test', ['coxs-bazar-sea-beach', 'somapura-mahavihara'], ['saint-martins-island'], ['lalbagh-fort']],
    ['mitu@travelsense.test', ['ratargul-swamp-forest', 'sajek-valley', 'coxs-bazar-sea-beach'], ['kantajew-temple', 'sundarbans'], []],
  ];
  for (const [email, favorites, wish, visited] of saved) {
    const userId = users.get(email)!;
    await prisma.favorite.createMany({ data: favorites.map((s) => ({ userId, destinationId: ids.get(s)! })) });
    await prisma.wishlistItem.createMany({
      data: [
        ...wish.map((s) => ({ userId, destinationId: ids.get(s)! })),
        ...visited.map((s) => ({ userId, destinationId: ids.get(s)!, visited: true, visitedAt: new Date() })),
      ],
    });
  }

  console.log(`Done: ${destinations.length} destinations, ${accounts.length} accounts, ${reviews.length} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
