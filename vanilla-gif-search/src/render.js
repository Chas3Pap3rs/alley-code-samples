/**
 * DOM rendering. Everything that comes from an API is written with
 * textContent or element properties, never interpolated into HTML, so a GIF
 * title can't inject markup.
 */

/**
 * Replace the results list with one copy button per GIF.
 * @param {HTMLElement} list
 * @param {import('./providers.js').Gif[]} gifs
 */
export function renderResults(list, gifs) {
  const items = gifs.map((gif) => {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'result';
    button.dataset.url = gif.url;

    const hint = document.createElement('span');
    hint.className = 'visually-hidden';
    hint.textContent = 'Copy link: ';

    const image = document.createElement('img');
    image.src = gif.url;
    image.alt = gif.title;
    image.width = gif.width;
    image.height = gif.height;
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');

    button.append(hint, image);
    item.append(button);
    return item;
  });

  list.replaceChildren(...items);
}

/** @param {HTMLElement} list */
export function clearResults(list) {
  list.replaceChildren();
}

/**
 * Update the polite live region that announces loading, empty, error, and
 * copy states to screen-reader users (and shows them to everyone else).
 * @param {HTMLElement} region
 * @param {string} message
 * @param {'info' | 'error'} [tone]
 */
export function setStatus(region, message, tone = 'info') {
  region.textContent = message;
  region.dataset.tone = tone;
}
