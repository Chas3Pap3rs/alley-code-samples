import { config } from './config.js';
import './provider-toggle.js';
import { DEFAULT_PROVIDER, PROVIDERS, isProvider } from './providers.js';
import { clearResults, renderResults, setStatus } from './render.js';
import { SearchError, getRandomWord, searchGifs } from './search.js';

const STORAGE_KEY = 'gif-search:provider';

/**
 * Wire up the page. The URL (?q=…&provider=…) is the source of truth for what
 * is on screen, so searches are shareable and Back/Forward replay them.
 *
 * Dependencies are injectable so tests can supply fakes.
 * @param {{ storage?: Storage, fetchImpl?: typeof fetch, clipboard?: Clipboard }} [deps]
 */
export function initGifSearch({
  storage = localStorage,
  fetchImpl = (...args) => fetch(...args),
  clipboard = navigator.clipboard,
} = {}) {
  const form = document.querySelector('#search-form');
  const input = document.querySelector('#search-input');
  const toggle = document.querySelector('provider-toggle');
  const surpriseButton = document.querySelector('#surprise');
  const results = document.querySelector('#results');
  const status = document.querySelector('#status');
  const attribution = document.querySelector('#attribution');

  let activeRequest = null;

  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('provider');
    const saved = storage.getItem(STORAGE_KEY);
    return {
      query: (params.get('q') ?? '').trim(),
      provider: isProvider(fromUrl) ? fromUrl : isProvider(saved) ? saved : DEFAULT_PROVIDER,
    };
  };

  const writeUrl = ({ query, provider }, mode) => {
    const url = new URL(location.href);
    url.search = new URLSearchParams(query ? { q: query, provider } : { provider }).toString();
    history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', url);
  };

  const showProvider = (provider) => {
    toggle.value = provider;
    input.placeholder = `Search ${PROVIDERS[provider].label}`;
    attribution.textContent = `Powered by ${PROVIDERS[provider].label}`;
  };

  async function runSearch({ query, provider }) {
    activeRequest?.abort();
    if (!query) {
      clearResults(results);
      setStatus(status, '');
      return;
    }

    const request = new AbortController();
    activeRequest = request;
    const label = PROVIDERS[provider].label;
    results.setAttribute('aria-busy', 'true');
    setStatus(status, `Searching ${label} for “${query}”…`);

    try {
      const gifs = await searchGifs({
        provider,
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
    const state = { query, provider: toggle.value };
    input.value = query;
    writeUrl(state, 'push');
    return runSearch(state);
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

  // Re-run the search on screen (from the URL), not whatever is half-typed in the field.
  toggle.addEventListener('change', () => {
    const state = { query: readUrl().query, provider: toggle.value };
    storage.setItem(STORAGE_KEY, state.provider);
    showProvider(state.provider);
    writeUrl(state, 'replace');
    runSearch(state);
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
    const state = readUrl();
    input.value = state.query;
    showProvider(state.provider);
    runSearch(state);
  });

  const initial = readUrl();
  input.value = initial.query;
  showProvider(initial.provider);
  writeUrl(initial, 'replace');
  return runSearch(initial);
}
