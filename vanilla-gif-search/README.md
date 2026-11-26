# Vanilla GIF search

A framework-free GIF search that queries GIPHY and copies a GIF's link to the
clipboard in one click. It's a rework of [IDGIF](https://idgif.com), a project
I first built in a software engineering bootcamp and have kept improving since.
(The live site also searched Tenor; Google shut that API down in June 2026, so
this sample uses GIPHY only.)

- **Main file:** [`src/app.js`](./src/app.js) (page behavior and URL state)
- **Supporting files:**
  - [`src/giphy.js`](./src/giphy.js): response parser and proxy URL helper
  - [`src/search.js`](./src/search.js): fetching
  - [`src/render.js`](./src/render.js): DOM output
  - [`server/server.js`](./server/server.js): key-holding proxy

## The problem

Keeping API keys out of the browser, and making a plain-JavaScript page feel
like an app: shareable URLs, working Back and Forward buttons, and clear
loading and error feedback that also reaches screen-reader users.

## Key decisions

- **A small parser, not a raw API payload.** `parseGiphyResponse` turns
  GIPHY's JSON into one shape, `{ id, url, width, height, title }`, so the
  rest of the app never depends on GIPHY's nesting.
- **No keys in the browser.** The front end calls a same-origin proxy
  (`/api/search`). The proxy adds the key from `GIPHY_API_KEY`, validates the
  query, and caps the result count. The repository contains no keys. You must
  supply your own GIPHY API key to run the app.
- **The URL is the state.** `?q=…` drives what's on screen. Searches use
  `history.pushState`, and a `popstate` listener replays them on Back/Forward.
  Shared links reproduce the same results.
- **Safe rendering.** Results are built with `createElement`, `textContent`, and
  element properties, never HTML strings, so an API-supplied title can't inject
  markup. One delegated click listener handles every result.
- **Accessible feedback.** A polite live region announces loading, result
  counts, empty results, errors, and "Link copied". Each result is a real
  `<button>` labelled "Copy link: *title*". The page has one `<h1>`, a `<main>`
  landmark, a labelled search field, and a skip link.
- **Stale requests are cancelled.** Each search aborts the previous one with an
  `AbortController`, so a slow response can't overwrite a newer search.
- Every `fetch` checks `response.ok`, and the random-word lookup falls back
  gracefully if that service is down.

## Run and test

```sh
npm install
npm test        # Vitest + jsdom: parser, rendering, page behavior, proxy validation

# Run locally (Node 20+). You must supply your own GIPHY API key.
# The key is read from the environment and is never committed.
GIPHY_API_KEY=your-giphy-key npm start
# open http://localhost:8080
```

| Variable | Purpose |
| --- | --- |
| `GIPHY_API_KEY` | **Required.** Key from [developers.giphy.com](https://developers.giphy.com) |
| `PORT` | Optional, defaults to `8080` |

Without a key, the page still loads and shows a clear error. To deploy the
static files elsewhere, point the front end at your proxy by defining
`window.GIF_SEARCH_CONFIG = { proxyBaseUrl: 'https://…' }` before `src/main.js`
loads.
