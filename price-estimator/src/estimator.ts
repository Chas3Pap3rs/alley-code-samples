/**
 * Pricing rules for a residential cleaning estimate.
 *
 * Everything here is plain data and pure functions with no React, so the
 * rules are easy to read, change, and unit-test, and the UI can't drift from
 * them. Prices are placeholders; the structure mirrors a real client tool.
 */

export type Service = 'standard' | 'deep' | 'recurring' | 'move-out' | 'rental-turnover';
export type Frequency = 'one-time' | 'weekly' | 'biweekly' | 'monthly';
export type AddOn = 'inside-fridge' | 'inside-oven' | 'laundry' | 'windows' | 'pets';

export interface EstimateInput {
  service: Service;
  frequency: Frequency;
  /** Lower bound of the selected square-footage tier. */
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  addOns: AddOn[];
}

export interface SqftTier {
  min: number;
  /** `null` means "and up". */
  max: number | null;
  price: number;
}

export type Estimate =
  | {
      ok: true;
      total: number;
      base: number;
      rentalExtras: number;
      addOnsTotal: number;
      frequencyMultiplier: number;
    }
  | { ok: false; reason: 'sqft-out-of-range' };

export const FREQUENCY_MULTIPLIERS: Record<Frequency, number> = {
  'one-time': 1,
  weekly: 0.8,
  biweekly: 0.85,
  monthly: 0.9,
};

export const ADD_ON_PRICES: Record<AddOn, number> = {
  'inside-fridge': 50,
  'inside-oven': 50,
  laundry: 25,
  windows: 40,
  pets: 30,
};

/** Rental turnovers include two bedrooms and two bathrooms; extra rooms cost more. */
export const RENTAL_EXTRAS = {
  includedRooms: 2,
  perExtraBedroom: 20,
  perExtraBathroom: 25,
};

export const ALLOWED_FREQUENCIES: Record<Service, readonly Frequency[]> = {
  standard: ['one-time'],
  deep: ['one-time', 'biweekly', 'monthly'],
  recurring: ['weekly', 'biweekly', 'monthly'],
  'move-out': ['one-time'],
  'rental-turnover': ['one-time'],
};

/** Upper bounds shared by every service's tiers, so the tables stay aligned. */
const TIER_BOUNDS: readonly [number, number | null][] = [
  [500, 999],
  [1000, 1499],
  [1500, 1999],
  [2000, 2499],
  [2500, 2999],
  [3000, 3999],
  [4000, 4999],
  [5000, 9999],
  [10000, null],
];

/** Build a tier table from one price per bound, optionally stopping early. */
function tiers(prices: readonly number[]): SqftTier[] {
  return prices.map((price, index) => {
    const [min, max] = TIER_BOUNDS[index];
    return { min, max, price };
  });
}

// Standard and recurring visits share one table; recurring savings come from
// the frequency multiplier, not from separate prices.
const STANDARD_TIERS = tiers([120, 150, 180, 210, 240, 300, 360, 480, 600]);

export const SQFT_PRICING: Record<Service, readonly SqftTier[]> = {
  standard: STANDARD_TIERS,
  recurring: STANDARD_TIERS,
  deep: tiers([200, 250, 300, 350, 400, 500, 600, 800, 1000]),
  'move-out': tiers([250, 300, 350, 400, 450, 550, 650, 850]), // No 10,000+ tier.
  'rental-turnover': tiers([150, 180, 210, 240, 270, 330, 390, 500]),
};

export function findTier(service: Service, sqft: number): SqftTier | undefined {
  return SQFT_PRICING[service].find((tier) => sqft >= tier.min && (tier.max === null || sqft <= tier.max));
}

/**
 * Map a square footage onto a tier the service actually offers. Values inside
 * a tier snap to its lower bound; values beyond the table snap to the nearest
 * end. Used when the service changes so the form never holds an invalid size.
 */
export function snapSqftToTier(service: Service, sqft: number): number {
  const table = SQFT_PRICING[service];
  const match = findTier(service, sqft);
  if (match) return match.min;
  return sqft < table[0].min ? table[0].min : table[table.length - 1].min;
}

/** Keep the current frequency if the service allows it, otherwise use its first option. */
export function coerceFrequency(service: Service, frequency: Frequency): Frequency {
  const allowed = ALLOWED_FREQUENCIES[service];
  return allowed.includes(frequency) ? frequency : allowed[0];
}

/** "1,000–1,499 sq ft", or "10,000+ sq ft" for an open-ended tier. */
export function formatTierLabel(tier: SqftTier): string {
  const min = tier.min.toLocaleString('en-US');
  return tier.max === null ? `${min}+ sq ft` : `${min}–${tier.max.toLocaleString('en-US')} sq ft`;
}

export function calculateEstimate(input: EstimateInput): Estimate {
  const tier = findTier(input.service, input.sqft);
  if (!tier) return { ok: false, reason: 'sqft-out-of-range' };

  let rentalExtras = 0;
  if (input.service === 'rental-turnover') {
    const extraBedrooms = Math.max(0, input.bedrooms - RENTAL_EXTRAS.includedRooms);
    const extraBathrooms = Math.max(0, input.bathrooms - RENTAL_EXTRAS.includedRooms);
    rentalExtras = extraBedrooms * RENTAL_EXTRAS.perExtraBedroom + extraBathrooms * RENTAL_EXTRAS.perExtraBathroom;
  }

  const addOnsTotal = input.addOns.reduce((sum, addOn) => sum + ADD_ON_PRICES[addOn], 0);
  const frequencyMultiplier = FREQUENCY_MULTIPLIERS[coerceFrequency(input.service, input.frequency)];
  const total = Math.round((tier.price + rentalExtras + addOnsTotal) * frequencyMultiplier);

  return { ok: true, total, base: tier.price, rentalExtras, addOnsTotal, frequencyMultiplier };
}
