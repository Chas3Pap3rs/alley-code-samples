# Vanilla GIF search

A framework-free GIF search that queries either GIPHY or Tenor and copies a
GIF's link to the clipboard in one click. It's a rework of
[IDGIF](https://idgif.com), a project I first built in a software engineering
bootcamp and have kept improving since.

- **Main file:** [`src/app.js`](./src/app.js) (page behavior and URL state)
- **Supporting files:**
  - [`src/providers.js`](./src/providers.js): provider adapters
  - [`src/search.js`](./src/search.js): fetching
  - [`src/render.js`](./src/render.js): DOM output
  - [`src/provider-toggle.js`](./src/provider-toggle.js): Web Component switch
  - [`server/server.js`](./server/server.js): key-holding proxy

## The problem

Supporting a second GIF API without forking the UI, keeping API keys out of
the browser, and making a plain-JavaScript page feel like an app: shareable
URLs, working Back and Forward buttons, and clear loading and error feedback
that also reaches screen-reader users.

## Key decisions

- **Provider adapters.** Each provider has a `parse` function that normalizes
  its JSON into one shape, `{ id, url, width, height, title }`. Adding a
  provider means adding an entry to `providers.js`; the UI never changes.
- **No keys in the browser.** The front end calls a same-origin proxy
  (`/api/:provider/search`). The proxy adds the key from an environment variable,
  validates the query, and caps the result count. The repository contains no keys.
- **The URL is the state.** `?q=…&provider=…` drives what's on screen.
  Searches use `history.pushState`, and a `popstate` listener replays them on
  Back/Forward. Shared links reproduce the same results.
- **Safe rendering.** Results are built with `createElement`, `textContent`, and
  element properties, never HTML strings, so an API-supplied title can't inject
  markup. One delegated click listener handles every result.
- **Accessible feedback.** A polite live region announces loading, result
  counts, empty results, errors, and "Link copied". Each result is a real
  `<button>` labelled "Copy link: *title*". The page has one `<h1>`, a `<main>`
  landmark, a labelled search field, and a skip link.
- **Stale requests are cancelled.** Each search aborts the previous one with an
  `AbortController`, so a slow response can't overwrite a newer search.
- **Encapsulated toggle.** `<provider-toggle>` is a custom element with a
  Shadow DOM, an accessible `role="switch"`, and a standard `change` event.
- Every `fetch` checks `response.ok`, and the random-word lookup falls back
  gracefully if that service is down.

## Run and test

```sh
npm install
npm test        # Vitest + jsdom: adapters, rendering, page behavior, proxy validation

# Run locally (Node 20+). Keys come from the environment and are never committed.
GIPHY_API_KEY=your-giphy-key TENOR_API_KEY=your-tenor-key npm start
# open http://localhost:8080
```

| Variable | Purpose |
| --- | --- |
| `GIPHY_API_KEY` | Key from [developers.giphy.com](https://developers.giphy.com) |
| `TENOR_API_KEY` | Google Cloud API key with the Tenor API enabled |
| `PORT` | Optional, defaults to `8080` |

Without a key, the page still loads and shows a clear error for that provider.
To deploy the static files elsewhere, point the front end at your proxy by
defining `window.GIF_SEARCH_CONFIG = { proxyBaseUrl: 'https://…' }` before
`src/main.js` loads.
