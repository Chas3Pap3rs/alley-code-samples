/**
 * <provider-toggle value="giphy|tenor">
 *
 * A two-state switch for choosing the GIF provider. Its markup and styles
 * live in a Shadow DOM so they can't collide with page styles, and it
 * dispatches a standard `change` event, so the app treats it like any form
 * control.
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: inline-flex; }
    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible { outline: 3px solid var(--focus-color, #1a73e8); outline-offset: 2px; }
    .track {
      position: relative;
      width: 2.75rem;
      height: 1.5rem;
      border-radius: 999px;
      background: var(--toggle-track, #8a7f76);
    }
    .thumb {
      position: absolute;
      top: 0.1875rem;
      left: 0.1875rem;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      background: var(--toggle-thumb, #ffffff);
      transition: transform 0.2s ease;
    }
    [aria-checked='true'] .thumb { transform: translateX(1.25rem); }
    [aria-checked='true'] .track { background: var(--toggle-track-on, #b4501c); }
    @media (prefers-reduced-motion: reduce) { .thumb { transition: none; } }
  </style>
  <button type="button" role="switch" aria-checked="false" aria-label="Search Tenor instead of GIPHY">
    <span aria-hidden="true">GIPHY</span>
    <span class="track" aria-hidden="true"><span class="thumb"></span></span>
    <span aria-hidden="true">Tenor</span>
  </button>
`;

export class ProviderToggle extends HTMLElement {
  static observedAttributes = ['value'];

  #button;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
    this.#button = root.querySelector('button');
    this.#button.addEventListener('click', () => {
      this.value = this.value === 'tenor' ? 'giphy' : 'tenor';
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  get value() {
    return this.getAttribute('value') === 'tenor' ? 'tenor' : 'giphy';
  }

  set value(next) {
    this.setAttribute('value', next === 'tenor' ? 'tenor' : 'giphy');
  }

  attributeChangedCallback() {
    this.#button.setAttribute('aria-checked', String(this.value === 'tenor'));
  }
}

if (!customElements.get('provider-toggle')) {
  customElements.define('provider-toggle', ProviderToggle);
}
