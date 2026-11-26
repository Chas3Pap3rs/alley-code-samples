# Before/after comparison slider

A reusable React component for comparing two photos of the same scene. Visitors
drag a handle, click anywhere on the image, or use the keyboard to reveal the
"before" photo over the "after" photo.

- **Main file:** [`src/BeforeAfterSlider.tsx`](./src/BeforeAfterSlider.tsx)
- **Supporting files:** [`src/sliderMath.ts`](./src/sliderMath.ts) (pure interaction rules) and [`src/CompareGroup.tsx`](./src/CompareGroup.tsx) (shared row heights)

## The problem

I originally built this for a bathtub and countertop refinishing company whose
site depends on showing transformations. Side-by-side photos make visitors
compare across a gap, while an overlay slider lets them inspect the exact same
spot before and after. Those photos are rarely the same shape, so a row of
sliders needed to line up regardless of each photo's aspect ratio.

## Key decisions

- **WAI-ARIA slider pattern.** The handle is a focusable `role="slider"` with
  `aria-valuenow`/`aria-valuetext`. Arrow keys move 5%, Shift+Arrow and
  PageUp/PageDown move 10%, and Home/End jump to the ends. Keys the slider
  doesn't own (like Tab) are left alone.
- **One input path with Pointer Events.** The whole frame is the pointer
  target, and `setPointerCapture` keeps a drag tracking even when the pointer
  leaves the frame. That one code path covers mouse, touch, and pen, and
  removes the need for window-level listeners.
- **Scrolling still works on phones.** The frame uses `touch-action: pan-y`, so
  horizontal drags move the slider while vertical swipes still scroll the page.
  Only the handle disables touch gestures entirely.
- **`clip-path` instead of resizing.** The reveal position is one CSS custom
  property (`--position`) that drives both the clip and the handle, so dragging
  never triggers layout and the two can't drift apart.
- **One sizing path.** Each slider reads its image's natural aspect ratio once
  and recomputes its height with a `ResizeObserver`. Wrapping sliders in
  `<CompareGroup>` makes the row use the tallest height. That's shared through
  React context, not module-level state or direct DOM writes.
- **Opt-in loading priority.** Images lazy-load by default. Pass `priority`
  only for a slider that's above the fold.
- Respects `prefers-reduced-motion` and Windows high-contrast (`forced-colors`) mode.

## Usage

```tsx
import BeforeAfterSlider from './BeforeAfterSlider';
import { CompareGroup } from './CompareGroup';

<BeforeAfterSlider
  priority
  beforeSrc="/images/before.jpg"
  afterSrc="/images/after.jpg"
  beforeAlt="Stained bathtub before refinishing"
  afterAlt="Bathtub with a new white finish"
/>

<CompareGroup>
  <BeforeAfterSlider {...first} />
  <BeforeAfterSlider {...second} />
</CompareGroup>
```

| Prop | Default | Description |
| --- | --- | --- |
| `beforeSrc`, `afterSrc`, `beforeAlt`, `afterAlt` | required | Image sources and alt text |
| `label` | `"Before and after comparison"` | Accessible name of the slider |
| `initialPosition` | `50` | Starting reveal percentage |
| `maxHeight` | `480` | Height cap in pixels |
| `step` / `largeStep` | `5` / `10` | Keyboard increments in percent |
| `priority` | `false` | Load images eagerly with high fetch priority |

## Run and test

```sh
npm install
npm test          # Vitest + Testing Library
npm run build     # type-check, then production build
npm run dev       # demo page at http://localhost:5173
```

The tests cover the keyboard model, pointer dragging, ARIA values, lazy versus
priority loading, and row-height sharing in a `CompareGroup`.

## Origin

This was adapted from a component I built for a client site (shared with
permission). The original was Next.js-specific and mouse/touch only. This
version is framework-agnostic React, uses placeholder illustrations instead of
client photos, and adds the accessibility and pointer-event work described above.
