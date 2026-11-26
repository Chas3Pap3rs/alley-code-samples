/**
 * Development server and API proxy for the GIF search sample.
 *
 * - Serves the static front end (index.html, styles.css, src/*.js).
 * - Proxies GET /api/:provider/search?q=…&limit=… to GIPHY or Tenor and
 *   attaches the API key from an environment variable, so keys never reach
 *   the browser or the repository.
 *
 * Environment:
 *   GIPHY_API_KEY   key for https://developers.giphy.com
 *   TENOR_API_KEY   Google Cloud key with the Tenor API enabled
 *   PORT            optional, defaults to 8080
 *
 * No dependencies: Node 20+ built-ins only.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAX_QUERY_LENGTH = 100;
const MAX_LIMIT = 50;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const UPSTREAMS = {
  giphy: { envKey: 'GIPHY_API_KEY', base: 'https://api.giphy.com/v1/gifs/search', keyParam: 'api_key' },
  tenor: { envKey: 'TENOR_API_KEY', base: 'https://tenor.googleapis.com/v2/search', keyParam: 'key' },
};

/**
 * Build the provider URL for a validated search, or explain what is wrong.
 * @returns {{ url: string } | { status: number, error: string }}
 */
export function buildUpstreamUrl(provider, searchParams, env = process.env) {
  const upstream = UPSTREAMS[provider];
  if (!upstream) return { status: 404, error: 'Unknown provider.' };

  const query = (searchParams.get('q') ?? '').trim();
  if (!query || query.length > MAX_QUERY_LENGTH) {
    return { status: 400, error: `Query must be 1–${MAX_QUERY_LENGTH} characters.` };
  }

  const apiKey = env[upstream.envKey];
  if (!apiKey) return { status: 503, error: `${upstream.envKey} is not configured on the server.` };

  const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit'), 10) || 25, 1), MAX_LIMIT);
  const params = new URLSearchParams({ [upstream.keyParam]: apiKey, q: query, limit: String(limit) });
  if (provider === 'tenor') {
    params.set('client_key', 'gif-search-sample');
    params.set('media_filter', 'tinygif,gif');
  }
  return { url: `${upstream.base}?${params}` };
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function handleApi(response, provider, searchParams) {
  const target = buildUpstreamUrl(provider, searchParams);
  if ('error' in target) return sendJson(response, target.status, { error: target.error });

  try {
    const upstream = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
    const body = await upstream.text();
    response.writeHead(upstream.ok ? 200 : 502, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': upstream.ok ? 'public, max-age=300' : 'no-store',
    });
    response.end(upstream.ok ? body : JSON.stringify({ error: `Upstream responded ${upstream.status}.` }));
  } catch {
    sendJson(response, 504, { error: 'Upstream request failed.' });
  }
}

/** Only the front-end files are public; everything else (server code, tests, dotfiles) is not. */
function isPublicFile(relativePath) {
  return (
    relativePath === 'index.html' ||
    relativePath === 'styles.css' ||
    /^src\/[\w-]+\.js$/.test(relativePath)
  );
}

async function handleStatic(response, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!isPublicFile(relative)) return sendJson(response, 404, { error: 'Not found.' });

  try {
    const file = await readFile(join(ROOT, relative));
    response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(relative)] });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: 'Not found.' });
  }
}

export function createAppServer() {
  return createServer((request, response) => {
    const { pathname, searchParams } = new URL(request.url, 'http://localhost');
    if (request.method !== 'GET') return sendJson(response, 405, { error: 'Method not allowed.' });

    const api = pathname.match(/^\/api\/([a-z]+)\/search$/);
    if (api) return handleApi(response, api[1], searchParams);
    return handleStatic(response, pathname);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const port = Number(process.env.PORT) || 8080;
  createAppServer().listen(port, () => {
    process.stdout.write(`GIF search running at http://localhost:${port}\n`);
  });
}
