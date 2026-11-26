# Code samples: Chase Poulton

Three small, self-contained samples of my front-end work, each with its own
README, demo, and automated tests. Each one is adapted from a project I shipped
and then reworked with accessibility, testability, and clarity in mind.

| Sample | What it shows | Main file |
| --- | --- | --- |
| [Before/after slider](./before-after-slider) | UI/UX craft, accessible custom controls, native pointer events in React | [`BeforeAfterSlider.tsx`](./before-after-slider/src/BeforeAfterSlider.tsx) |
| [Vanilla GIF search](./vanilla-gif-search) | Framework-free JavaScript, browser APIs (Fetch, History, Clipboard), async state | [`app.js`](./vanilla-gif-search/src/app.js) |
| [Price estimator](./price-estimator) | React component architecture with business logic separated from presentation | [`estimator.ts`](./price-estimator/src/estimator.ts) |

## Running a sample

Each folder is independent and needs Node.js 20 or newer:

```sh
cd before-after-slider   # or vanilla-gif-search, price-estimator
npm install
npm test
npm run dev              # React samples; the GIF search uses `npm start`
```

CI runs every sample's tests (plus a type-check and build for the React samples)
on each push.

## About the client-derived samples

The slider and the estimator started as features on client websites I built
through my web design business, Sapphiris Design Co. They're shared with the
clients' permission. Client names, branding, photos, contact details, and real
prices have been removed and replaced with placeholders.
