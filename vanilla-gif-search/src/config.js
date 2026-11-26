/**
 * Runtime configuration. The only setting the browser needs is where the
 * search proxy lives; API keys are configured on the server (see README).
 * A deployment can override it by defining window.GIF_SEARCH_CONFIG before
 * this module loads.
 */
const overrides = globalThis.GIF_SEARCH_CONFIG ?? {};

export const config = Object.freeze({
  proxyBaseUrl: overrides.proxyBaseUrl ?? '/api',
  randomWordUrl: overrides.randomWordUrl ?? 'https://random-word-api.vercel.app/api?words=1',
});
