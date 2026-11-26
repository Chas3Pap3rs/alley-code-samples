import { buildSearchUrl, parseGiphyResponse } from './giphy.js';

export class SearchError extends Error {}

/**
 * Fetch and normalize GIFs for a query.
 * Throws SearchError for HTTP failures so the UI can show a friendly message;
 * AbortError passes through untouched so superseded searches can be ignored.
 *
 * @param {{ query: string, proxyBaseUrl: string, signal?: AbortSignal, fetchImpl?: typeof fetch }} options
 * @returns {Promise<import('./giphy.js').Gif[]>}
 */
export async function searchGifs({ query, proxyBaseUrl, signal, fetchImpl = fetch }) {
  const response = await fetchImpl(buildSearchUrl(proxyBaseUrl, query), { signal });
  if (!response.ok) {
    throw new SearchError(`GIPHY search failed (HTTP ${response.status}).`);
  }
  return parseGiphyResponse(await response.json());
}

/**
 * Get one random word for the "Surprise me" button, falling back to a fixed
 * word if the word service is unavailable.
 * @param {{ url: string, signal?: AbortSignal, fetchImpl?: typeof fetch }} options
 */
export async function getRandomWord({ url, signal, fetchImpl = fetch }) {
  try {
    const response = await fetchImpl(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const [word] = await response.json();
    return typeof word === 'string' && word.trim() ? word.trim() : 'random';
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return 'random';
  }
}
