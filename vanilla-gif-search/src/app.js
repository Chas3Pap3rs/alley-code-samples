import { config } from './config.js';
import { clearResults, renderResults, setStatus } from './render.js';
import { SearchError, getRandomWord, searchGifs } from './search.js';

/**
 * Wire up the page. The URL (?q=…) is the source of truth for what
 * is on screen, so searches are shareable and Back/Forward replay them.
 *
 * Dependencies are injectable so tests can supply fakes.
 * @param {{ fetchImpl?: typeof fetch, clipboard?: Clipboard }} [deps]
 */
export function initGifSearch({
  fetchImpl = (...args) => fetch(...args),
  clipboard = navigator.clipboard,
} = {}) {
  const form = document.querySelector('#search-form');
  const input = document.querySelector('#search-input');
  const surpriseButton = document.querySelector('#surprise');
  const results = document.querySelector('#results');
  const status = document.querySelector('#status');

  let activeRequest = null;

  const readUrl = () => (new URLSearchParams(location.search).get('q') ?? '').trim();

  const writeUrl = (query, mode) => {
    const url = new URL(location.href);
    url.search = query ? new URLSearchParams({ q: query }).toString() : '';
    history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', url);
  };

  async function runSearch(query) {
    activeRequest?.abort();
    if (!query) {
      clearResults(results);
      setStatus(status, '');
      return;
    }

    const request = new AbortController();
    activeRequest = request;
    results.setAttribute('aria-busy', 'true');
    setStatus(status, `Searching GIPHY for “${query}”…`);

    try {
      const gifs = await searchGifs({
        query,
        proxyBaseUrl: config.proxyBaseUrl,
        signal: request.signal,
        fetchImpl,
      });
      renderResults(results, gifs);
      setStatus(
        status,
        gifs.length
          ? `${gifs.length} GIF${gifs.length === 1 ? '' : 's'} for “${query}”. Select one to copy its link.`
          : `No GIFs found for “${query}”. Try another word.`,
      );
    } catch (error) {
      if (error?.name === 'AbortError') return; // A newer search replaced this one.
      clearResults(results);
      const message = error instanceof SearchError ? error.message : 'Network error.';
      setStatus(status, `${message} Please try again.`, 'error');
    } finally {
      if (activeRequest === request) {
        results.removeAttribute('aria-busy');
        activeRequest = null;
      }
    }
  }

  /** Show a search and record it in history so Back returns to the previous one. */
  function navigate(query) {
    input.value = query;
    writeUrl(query, 'push');
    return runSearch(query);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      setStatus(status, 'Enter a word to search for GIFs.', 'error');
      input.focus();
      return;
    }
    navigate(query);
  });

  surpriseButton.addEventListener('click', async () => {
    setStatus(status, 'Picking a random word…');
    navigate(await getRandomWord({ url: config.randomWordUrl, fetchImpl }));
  });

  // One delegated listener handles every result, including ones rendered later.
  results.addEventListener('click', async (event) => {
    const button = event.target.closest('button.result');
    if (!button) return;
    try {
      await clipboard.writeText(button.dataset.url);
      setStatus(status, 'Link copied to your clipboard.');
    } catch {
      setStatus(status, 'Copying is blocked in this browser. Long-press or right-click the GIF instead.', 'error');
    }
  });

  window.addEventListener('popstate', () => {
    const query = readUrl();
    input.value = query;
    runSearch(query);
  });

  const initial = readUrl();
  input.value = initial;
  writeUrl(initial, 'replace');
  return runSearch(initial);
}
