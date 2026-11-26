import { describe, it, expect } from 'vitest';
import { PROVIDERS, buildSearchUrl, isProvider } from '../src/providers.js';

describe('provider adapters', () => {
  it('normalizes a GIPHY response', () => {
    const json = {
      data: [
        { id: 'abc', title: 'Happy cat', images: { fixed_width: { url: 'https://g/1.gif', width: '200', height: '150' } } },
        { id: 'broken', title: 'No image', images: {} },
      ],
    };
    expect(PROVIDERS.giphy.parse(json)).toEqual([
      { id: 'abc', url: 'https://g/1.gif', width: 200, height: 150, title: 'Happy cat' },
    ]);
  });

  it('normalizes a Tenor response, preferring the lighter tinygif rendition', () => {
    const json = {
      results: [
        {
          id: 42,
          content_description: 'Dancing dog',
          media_formats: {
            gif: { url: 'https://t/full.gif', dims: [498, 280] },
            tinygif: { url: 'https://t/tiny.gif', dims: [220, 124] },
          },
        },
      ],
    };
    expect(PROVIDERS.tenor.parse(json)).toEqual([
      { id: '42', url: 'https://t/tiny.gif', width: 220, height: 124, title: 'Dancing dog' },
    ]);
  });

  it('returns an empty list for missing or malformed payloads', () => {
    expect(PROVIDERS.giphy.parse(undefined)).toEqual([]);
    expect(PROVIDERS.tenor.parse({ results: null })).toEqual([]);
  });

  it('falls back to a readable title', () => {
    const [gif] = PROVIDERS.giphy.parse({ data: [{ id: 1, title: '', images: { fixed_width: { url: 'u' } } }] });
    expect(gif.title).toBe('Untitled GIF');
  });
});

describe('buildSearchUrl', () => {
  it('targets the proxy, never the provider, and encodes the query', () => {
    expect(buildSearchUrl('/api/', 'tenor', 'cats & dogs')).toBe('/api/tenor/search?q=cats+%26+dogs&limit=30');
  });
});

describe('isProvider', () => {
  it('accepts known providers only', () => {
    expect(isProvider('giphy')).toBe(true);
    expect(isProvider('toString')).toBe(false);
    expect(isProvider(null)).toBe(false);
  });
});
