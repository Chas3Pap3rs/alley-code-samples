/**
 * GIPHY response parser and proxy URL helper.
 *
 * parseGiphyResponse turns GIPHY's JSON into a small, UI-friendly shape:
 * { id, url, width, height, title }. The rest of the app only ever sees that
 * shape. API keys never live in the browser; requests go to a same-origin
 * proxy (see server/server.js), which attaches the key from GIPHY_API_KEY.
 */

/** @typedef {{ id: string, url: string, width: number, height: number, title: string }} Gif */

export const RESULT_LIMIT = 30;

/** @param {any} json @returns {Gif[]} */
export function parseGiphyResponse(json) {
  return (json?.data ?? [])
    .map((item) => {
      const image = item?.images?.fixed_width;
      if (!image?.url) return null;
      return {
        id: String(item.id),
        url: image.url,
        width: Number(image.width) || 200,
        height: Number(image.height) || 200,
        title: item.title || 'Untitled GIF',
      };
    })
    .filter(Boolean);
}

/**
 * Build the proxy URL for a search.
 * @param {string} proxyBaseUrl e.g. "/api"
 * @param {string} query
 */
export function buildSearchUrl(proxyBaseUrl, query) {
  const params = new URLSearchParams({ q: query, limit: String(RESULT_LIMIT) });
  return `${proxyBaseUrl.replace(/\/$/, '')}/search?${params}`;
}
