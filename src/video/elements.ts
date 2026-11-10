// Two tiny helper elements for the Phatta markup. It does not re-implement player behaviour:
// <phatta-rate> only mirrors the playback rate as the speed button's painted "1×" label;
// <phatta-clock> pads the minutes of the v10 <media-time> text it wraps ("02:14").

const formatRate = (rate: number) => `${Number.isFinite(rate) ? Number(rate.toFixed(2)) : 1}×`;

/** Shows the media's current playback rate ("1×", "1.5×") as the speed/settings trigger's face. */
class PhattaRateElement extends HTMLElement {
  #abort: AbortController | null = null;

  connectedCallback() {
    const container = this.closest('media-container');
    if (!container) return;
    this.#abort = new AbortController();
    const media = () => container.querySelector<HTMLMediaElement>('video, audio, mux-video, hls-video');
    const sync = (rate?: number) => {
      const value = rate ?? media()?.playbackRate ?? 1;
      const next = formatRate(value);
      if (this.textContent !== next) this.textContent = next;
      // the standalone (desk) paint reads "1.0x"
      this.dataset.desk = `${Number.isFinite(value) ? (Number.isInteger(value) ? value.toFixed(1) : Number(value.toFixed(2))) : '1.0'}x`;
    };
    // `ratechange` does not bubble; a capturing listener on the container still sees it.
    container.addEventListener(
      'ratechange',
      (event) => sync((event.target as HTMLMediaElement | null)?.playbackRate),
      { capture: true, signal: this.#abort.signal },
    );
    sync();
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = null;
  }
}

/**
 * Sign-painter clock face: the painted plate reads "02:14 / 07:48", so pad single-digit minutes ("2:14" -> "02:14").
 * Wraps v10 <media-time> elements and only rewrites their visible text after v10 updates it; the elements, their
 * accessible labels and their behaviour are untouched.
 */
const pad = (text: string) => text.replace(/^(-?)(\d):(\d\d)$/, (_m, sign: string, m: string, s: string) => `${sign}0${m}:${s}`);

class PhattaClockElement extends HTMLElement {
  #observer: MutationObserver | null = null;

  connectedCallback() {
    const fix = () => {
      const walker = document.createTreeWalker(this, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const value = node.nodeValue ?? '';
        const next = pad(value.trim());
        if (next !== value.trim()) node.nodeValue = next;
      }
    };
    this.#observer = new MutationObserver(fix);
    this.#observer.observe(this, { subtree: true, childList: true, characterData: true });
    fix();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
  }
}

export function definePhattaElements(): void {
  const registry = globalThis.customElements;
  if (!registry) return;
  if (!registry.get('phatta-rate')) registry.define('phatta-rate', PhattaRateElement);
  if (!registry.get('phatta-clock')) registry.define('phatta-clock', PhattaClockElement);
}
