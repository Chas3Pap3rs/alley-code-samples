import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initGifSearch } from '../src/app.js';

const page = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const body = page.slice(page.indexOf('<body>') + 6, page.indexOf('</body>'));

const giphyPayload = (titles) => ({
  data: titles.map((title, i) => ({ id: String(i), title, images: { fixed_width: { url: `https://g/${i}.gif`, width: '200', height: '200' } } })),
});

const jsonResponse = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

function setup({ url = '/', fetchImpl = vi.fn(async () => jsonResponse(giphyPayload([]))) } = {}) {
  document.body.innerHTML = body;
  history.replaceState({}, '', url);
  const clipboard = { writeText: vi.fn(async () => {}) };
  const ready = initGifSearch({ fetchImpl, clipboard });
  const $ = (selector) => document.querySelector(selector);
  return { ready, fetchImpl, clipboard, $ };
}

async function submit($, query) {
  $('#search-input').value = query;
  $('#search-form').dispatchEvent(new Event('submit', { cancelable: true }));
  await vi.waitFor(() => expect($('#results').hasAttribute('aria-busy')).toBe(false));
}

describe('GIF search page', () => {
  it('has one h1, a main landmark, a labelled search field, and a live status region', () => {
    const { $ } = setup();
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect($('main')).not.toBeNull();
    expect($('label[for="search-input"]').textContent).toBe('Search GIFs');
    expect($('#status').getAttribute('aria-live')).toBe('polite');
  });

  it('searches, renders results, announces the count, and records the search in the URL', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(giphyPayload(['One', 'Two'])));
    const { $ } = setup({ fetchImpl });

    await submit($, 'cats');

    expect(fetchImpl).toHaveBeenCalledWith('/api/search?q=cats&limit=30', expect.anything());
    expect($('#results').querySelectorAll('button.result')).toHaveLength(2);
    expect($('#status').textContent).toBe('2 GIFs for “cats”. Select one to copy its link.');
    expect(location.search).toBe('?q=cats');
  });

  it('shows an empty state', async () => {
    const { $ } = setup();
    await submit($, 'zzzz');
    expect($('#status').textContent).toBe('No GIFs found for “zzzz”. Try another word.');
  });

  it('shows an error state when the proxy responds with an HTTP error', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 503));
    const { $ } = setup({ fetchImpl });
    await submit($, 'cats');
    expect($('#status').textContent).toBe('GIPHY search failed (HTTP 503). Please try again.');
    expect($('#status').dataset.tone).toBe('error');
    expect($('#results').children).toHaveLength(0);
  });

  it('asks for a word instead of searching when the field is blank', () => {
    const { $, fetchImpl } = setup();
    $('#search-input').value = '   ';
    $('#search-form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(fetchImpl).not.toHaveBeenCalled();
    expect($('#status').textContent).toBe('Enter a word to search for GIFs.');
  });

  it('copies a GIF link and confirms it in the live region', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(giphyPayload(['One'])));
    const { $, clipboard } = setup({ fetchImpl });
    await submit($, 'cats');

    $('#results button.result').click();
    await vi.waitFor(() => expect($('#status').textContent).toBe('Link copied to your clipboard.'));
    expect(clipboard.writeText).toHaveBeenCalledWith('https://g/0.gif');
  });

  it('runs the search in a shared URL on load', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(giphyPayload([])));
    const { ready, $ } = setup({ url: '/?q=owls', fetchImpl });
    await ready;
    expect(fetchImpl).toHaveBeenCalledWith('/api/search?q=owls&limit=30', expect.anything());
    expect($('#search-input').value).toBe('owls');
  });

  it('replays the previous search on Back (popstate)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(giphyPayload(['A'])));
    const { $ } = setup({ fetchImpl });
    await submit($, 'cats');
    await submit($, 'dogs');

    history.replaceState({}, '', '/?q=cats'); // jsdom's history.back() is async and unreliable.
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.waitFor(() => expect($('#status').textContent).toContain('“cats”'));
    expect($('#search-input').value).toBe('cats');
    expect(fetchImpl).toHaveBeenLastCalledWith('/api/search?q=cats&limit=30', expect.anything());
  });
});
