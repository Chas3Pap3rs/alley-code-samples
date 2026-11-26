import { describe, it, expect } from 'vitest';
import { parseGiphyResponse, buildSearchUrl } from '../src/giphy.js';

describe('parseGiphyResponse', () => {
  it('normalizes a GIPHY response', () => {
    const json = {
      data: [
        { id: 'abc', title: 'Happy cat', images: { fixed_width: { url: 'https://g/1.gif', width: '200', height: '150' } } },
        { id: 'broken', title: 'No image', images: {} },
      ],
    };
    expect(parseGiphyResponse(json)).toEqual([
      { id: 'abc', url: 'https://g/1.gif', width: 200, height: 150, title: 'Happy cat' },
    ]);
  });

  it('returns an empty list for missing or malformed payloads', () => {
    expect(parseGiphyResponse(undefined)).toEqual([]);
    expect(parseGiphyResponse({ data: null })).toEqual([]);
  });

  it('falls back to a readable title', () => {
    const [gif] = parseGiphyResponse({ data: [{ id: 1, title: '', images: { fixed_width: { url: 'u' } } }] });
    expect(gif.title).toBe('Untitled GIF');
  });
});

describe('buildSearchUrl', () => {
  it('targets the proxy, never GIPHY directly, and encodes the query', () => {
    expect(buildSearchUrl('/api/', 'cats & dogs')).toBe('/api/search?q=cats+%26+dogs&limit=30');
  });
});
