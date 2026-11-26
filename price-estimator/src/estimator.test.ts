import {
  ALLOWED_FREQUENCIES,
  SQFT_PRICING,
  calculateEstimate,
  coerceFrequency,
  findTier,
  formatTierLabel,
  snapSqftToTier,
  type EstimateInput,
} from './estimator';

const base: EstimateInput = {
  service: 'standard',
  frequency: 'one-time',
  sqft: 1000,
  bedrooms: 2,
  bathrooms: 2,
  addOns: [],
};

describe('findTier', () => {
  it('matches inclusive tier boundaries', () => {
    expect(findTier('standard', 999)?.min).toBe(500);
    expect(findTier('standard', 1000)?.min).toBe(1000);
    expect(findTier('standard', 1499)?.min).toBe(1000);
  });

  it('treats a null max as open-ended', () => {
    expect(findTier('deep', 250_000)?.min).toBe(10_000);
  });

  it('returns undefined outside the table', () => {
    expect(findTier('standard', 100)).toBeUndefined();
    expect(findTier('move-out', 12_000)).toBeUndefined();
  });
});

describe('calculateEstimate', () => {
  it('prices a one-time visit from the tier alone', () => {
    expect(calculateEstimate(base)).toEqual({
      ok: true,
      total: 150,
      base: 150,
      rentalExtras: 0,
      addOnsTotal: 0,
      frequencyMultiplier: 1,
    });
  });

  it('adds add-ons before applying the frequency discount', () => {
    const estimate = calculateEstimate({
      ...base,
      service: 'recurring',
      frequency: 'weekly',
      addOns: ['laundry', 'windows'],
    });
    // (150 + 25 + 40) × 0.8 = 172
    expect(estimate).toMatchObject({ ok: true, addOnsTotal: 65, frequencyMultiplier: 0.8, total: 172 });
  });

  it('charges rental turnovers only for rooms beyond the included two', () => {
    const estimate = calculateEstimate({ ...base, service: 'rental-turnover', bedrooms: 4, bathrooms: 3 });
    // 2 extra bedrooms × 20 + 1 extra bathroom × 25 = 65
    expect(estimate).toMatchObject({ ok: true, base: 180, rentalExtras: 65, total: 245 });
  });

  it('ignores room counts for services that do not price by room', () => {
    expect(calculateEstimate({ ...base, bedrooms: 9, bathrooms: 9 })).toMatchObject({ rentalExtras: 0, total: 150 });
  });

  it('never applies a discount the service does not offer', () => {
    expect(calculateEstimate({ ...base, frequency: 'weekly' })).toMatchObject({ frequencyMultiplier: 1, total: 150 });
  });

  it('reports an out-of-range size instead of returning $0', () => {
    expect(calculateEstimate({ ...base, service: 'move-out', sqft: 10_000 })).toEqual({
      ok: false,
      reason: 'sqft-out-of-range',
    });
  });
});

describe('snapSqftToTier', () => {
  it('snaps a size inside a tier to that tier', () => {
    expect(snapSqftToTier('deep', 1234)).toBe(1000);
  });

  it('snaps sizes beyond the table to the nearest end', () => {
    expect(snapSqftToTier('move-out', 10_000)).toBe(5000);
    expect(snapSqftToTier('standard', 10)).toBe(500);
  });

  it('always lands on a size the service can price', () => {
    for (const service of Object.keys(SQFT_PRICING) as (keyof typeof SQFT_PRICING)[]) {
      for (const sqft of [0, 750, 2000, 9999, 10_000, 50_000]) {
        expect(calculateEstimate({ ...base, service, frequency: ALLOWED_FREQUENCIES[service][0], sqft: snapSqftToTier(service, sqft) }).ok).toBe(true);
      }
    }
  });
});

describe('coerceFrequency', () => {
  it('keeps an allowed frequency and replaces a disallowed one', () => {
    expect(coerceFrequency('deep', 'monthly')).toBe('monthly');
    expect(coerceFrequency('recurring', 'one-time')).toBe('weekly');
  });
});

describe('formatTierLabel', () => {
  it('formats bounded and open-ended tiers', () => {
    expect(formatTierLabel({ min: 1000, max: 1499, price: 0 })).toBe('1,000–1,499 sq ft');
    expect(formatTierLabel({ min: 10_000, max: null, price: 0 })).toBe('10,000+ sq ft');
  });
});

describe('pricing tables', () => {
  it('have contiguous, non-overlapping tiers', () => {
    for (const table of Object.values(SQFT_PRICING)) {
      table.slice(1).forEach((tier, index) => {
        expect(tier.min).toBe((table[index].max ?? Infinity) + 1);
      });
    }
  });
});
