# Price estimator

An instant cleaning-cost estimator. Visitors pick a service, home size,
frequency, and add-ons, and see an itemized estimate update as they go, with no
contact details required.

- **Main file:** [`src/estimator.ts`](./src/estimator.ts) (pricing rules)
- **UI:** [`src/Estimator.tsx`](./src/Estimator.tsx) plus one component per question in [`src/components/`](./src/components)

## The problem

A residential cleaning client wanted visitors to get a realistic price
instantly, matching their actual pricing sheet. The sheet has rules that
interact: square-footage tiers that differ by service, services that are only
offered at certain frequencies, recurring discounts, and per-room surcharges
for rental turnovers.

## Key decisions

- **Rules as data plus pure functions.** `estimator.ts` has no React in it.
  Prices are typed tables, and `calculateEstimate()` returns either an itemized
  result or `{ ok: false, reason }`. Shared tier bounds keep every table aligned,
  and services with identical prices share one table.
- **No invalid states.** When the service changes, the same state update snaps
  the home size to a tier the new service offers (`snapSqftToTier`) and swaps in
  an allowed frequency (`coerceFrequency`). If a size can't be priced anyway,
  the summary asks for a custom quote instead of showing $0.
- **Derived, not synced.** The estimate is computed during render from the
  current answers, with no `useEffect`, so it can't go stale.
- **Native, labelled controls.** Each question is a `<fieldset>` with a
  `<legend>`. Services and frequencies are radio buttons styled as cards (so
  arrow keys work), add-ons are checkboxes, and every input has a `<label>`.
  The total is an `<output>` with `aria-live="polite"`.
- **Ask only what affects the price.** Bedroom and bathroom fields appear only
  for rental turnovers, the one service priced by room.
- Responsive CSS Grid layout with a sticky summary on wide screens, `:has()`
  for selected and focus states, and control borders that meet WCAG 3:1 contrast.

## Run and test

```sh
npm install
npm test          # Vitest + Testing Library
npm run build     # type-check, then production build
npm run dev       # demo page at http://localhost:5173
```

`estimator.test.ts` covers tier boundaries, discounts, rental surcharges,
snapping, and the out-of-range case. It also checks that every table is
contiguous. `Estimator.test.tsx` covers labels and fieldsets, the live total,
and service changes that would otherwise leave the form invalid.

## Origin

This was adapted from an estimator I built for a client's site (shared with
permission). The business name, branding, contact details, location-specific
copy, and real prices have been replaced with placeholders. The structure and
rules mirror what shipped, with the fixes and component split described above.
