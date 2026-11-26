import { describe, it, expect } from 'vitest';
import { renderResults, setStatus } from '../src/render.js';

describe('renderResults', () => {
  it('renders each GIF as a copy button without interpreting titles as HTML', () => {
    const list = document.createElement('ul');
    renderResults(list, [
      { id: '1', url: 'https://g/1.gif', width: 200, height: 100, title: '<img src=x onerror=alert(1)>' },
    ]);

    const button = list.querySelector('button.result');
    const image = button.querySelector('img');
    expect(button.dataset.url).toBe('https://g/1.gif');
    expect(button.textContent).toBe('Copy link: ');
    expect(image.alt).toBe('<img src=x onerror=alert(1)>');
    expect(list.querySelectorAll('img')).toHaveLength(1);
    expect(image.getAttribute('loading')).toBe('lazy');
  });

  it('replaces previous results', () => {
    const list = document.createElement('ul');
    renderResults(list, [{ id: '1', url: 'a', width: 1, height: 1, title: 'a' }]);
    renderResults(list, []);
    expect(list.children).toHaveLength(0);
  });
});

describe('setStatus', () => {
  it('sets the message and tone', () => {
    const region = document.createElement('p');
    setStatus(region, 'Oops', 'error');
    expect(region.textContent).toBe('Oops');
    expect(region.dataset.tone).toBe('error');
  });
});
