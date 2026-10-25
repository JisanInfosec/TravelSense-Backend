import { distanceKm } from './geo.js';
import { PASSWORD_REGEX } from './password.js';
import { slugify } from './slug.js';

describe('slugify', () => {
  it('creates URL-safe slugs', () => {
    expect(slugify("Cox's Bazar Sea Beach")).toBe('coxs-bazar-sea-beach');
    expect(slugify('  Somapura Mahavihara (Paharpur) ')).toBe('somapura-mahavihara-paharpur');
  });
});

describe('distanceKm', () => {
  it('measures the distance between two Dhaka landmarks', () => {
    const lalbagh = { latitude: 23.719, longitude: 90.3882 };
    const museum = { latitude: 23.7375, longitude: 90.3945 };
    expect(distanceKm(lalbagh, museum)).toBeGreaterThan(1.5);
    expect(distanceKm(lalbagh, museum)).toBeLessThan(3);
  });
});

describe('password policy', () => {
  it.each([
    ['Password1', true],
    ['password', false],
    ['12345678', false],
    ['Ab1', false],
  ])('%s → %s', (pw, ok) => expect(PASSWORD_REGEX.test(pw)).toBe(ok));
});
