import type { AddOn, Frequency, Service } from './estimator';

/** Display copy for the pricing rules, kept apart from the rules themselves. */

export const SERVICE_OPTIONS: { id: Service; label: string; description: string }[] = [
  { id: 'standard', label: 'Standard clean', description: 'A one-time whole-home clean' },
  { id: 'deep', label: 'Deep clean', description: 'Detailed top-to-bottom reset' },
  { id: 'recurring', label: 'Recurring clean', description: 'Weekly, biweekly, or monthly upkeep' },
  { id: 'move-out', label: 'Move in / move out', description: 'An empty home, inside cabinets and appliances' },
  { id: 'rental-turnover', label: 'Rental turnover', description: 'Reset between short-term guests' },
];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  'one-time': 'One time',
  weekly: 'Weekly',
  biweekly: 'Every two weeks',
  monthly: 'Monthly',
};

export const ADD_ON_LABELS: Record<AddOn, string> = {
  'inside-fridge': 'Inside the fridge',
  'inside-oven': 'Inside the oven',
  laundry: 'Laundry (wash and fold)',
  windows: 'Interior windows',
  pets: 'Pet hair and cleanup',
};

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
