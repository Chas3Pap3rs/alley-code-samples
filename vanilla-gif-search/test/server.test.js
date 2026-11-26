// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildUpstreamUrl } from '../server/server.js';

const params = (query) => new URLSearchParams(query);
const env = { GIPHY_API_KEY: 'test-giphy' };

describe('buildUpstreamUrl', () => {
  it('attaches the key from the environment and clamps the limit', () => {
    const { url } = buildUpstreamUrl(params('q=cats&limit=500'), env);
    const upstream = new URL(url);
    expect(upstream.origin + upstream.pathname).toBe('https://api.giphy.com/v1/gifs/search');
    expect(upstream.searchParams.get('api_key')).toBe('test-giphy');
    expect(upstream.searchParams.get('limit')).toBe('50');
  });

  it('rejects empty queries and a missing key', () => {
    expect(buildUpstreamUrl(params('q=%20'), env)).toMatchObject({ status: 400 });
    expect(buildUpstreamUrl(params('q=cats'), {})).toMatchObject({ status: 503 });
  });
});
