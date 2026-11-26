/**
 * Provider adapters.
 *
 * Each provider describes how to ask the proxy for results and how to turn its
 * response into one shared shape: { id, url, width, height, title }. The rest
 * of the app only ever sees that shape, so adding a provider means adding an
 * entry here, not touching the UI.
 *
 * No API keys live in the browser. Requests go to a same-origin proxy
 * (see server/server.js), which attaches the key from an environment variable.
 */

/** @typedef {{ id: string, url: string, width: number, height: number, title: string }} Gif */

export const RESULT_LIMIT = 30;

export const PROVIDERS = {
  giphy: {
    label: 'GIPHY',
    /** @param {any} json @returns {Gif[]} */
    parse(json) {
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
    },
  },
  tenor: {
    label: 'Tenor',
    /** @param {any} json @returns {Gif[]} */
    parse(json) {
      return (json?.results ?? [])
        .map((item) => {
          const gif = item?.media_formats?.tinygif ?? item?.media_formats?.gif;
          if (!gif?.url) return null;
          const [width, height] = gif.dims ?? [];
          return {
            id: String(item.id),
            url: gif.url,
            width: Number(width) || 200,
            height: Number(height) || 200,
            title: item.content_description || item.title || 'Untitled GIF',
          };
        })
        .filter(Boolean);
    },
  },
};

export const DEFAULT_PROVIDER = 'giphy';

/** @param {string | null | undefined} name */
export function isProvider(name) {
  return typeof name === 'string' && Object.hasOwn(PROVIDERS, name);
}

/**
 * Build the proxy URL for a search.
 * @param {string} proxyBaseUrl e.g. "/api"
 * @param {string} provider
 * @param {string} query
 */
export function buildSearchUrl(proxyBaseUrl, provider, query) {
  const params = new URLSearchParams({ q: query, limit: String(RESULT_LIMIT) });
  return `${proxyBaseUrl.replace(/\/$/, '')}/${provider}/search?${params}`;
}
