// /phatta page chrome: day/night toggle (night by default, choice remembered), plate vs phone layout,
// and the "playing" state that lights the headlights and swings the bells.

type Mode = 'day' | 'night';

const KEY = 'phatta-mode';
const PLATE_QUERY = '(min-width: 700px)';

export function initPhattaPage(): void {
  const root = document.documentElement;
  const plate = document.querySelector<HTMLElement>('.ph-plate');
  const button = document.querySelector<HTMLButtonElement>('.ph-mode');

  // ── day / night ──
  const apply = (mode: Mode) => {
    root.dataset.mode = mode;
    root.dataset.phattaTheme = mode;
    button?.setAttribute('aria-pressed', String(mode === 'day'));
  };
  apply(root.dataset.mode === 'day' ? 'day' : 'night');
  button?.addEventListener('click', () => {
    const next: Mode = root.dataset.mode === 'day' ? 'night' : 'day';
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  });

  // ── layout: controls registered on the painted plate (wide), or a strip under the video (phones) ──
  const wide = globalThis.matchMedia?.(PLATE_QUERY);
  const layout = () => {
    if (!plate) return;
    const isWide = wide?.matches ?? true;
    plate.toggleAttribute('data-phatta-plate', isWide);
    plate.toggleAttribute('data-phatta-below', !isWide);
  };
  layout();
  wide?.addEventListener('change', layout);

  // ── playing: headlights brighten, bells swing ──
  const stage = document.getElementById('stage');
  const sync = (event?: Event) => {
    const media = (event?.target as HTMLMediaElement | null) ?? stage?.querySelector('video') ?? null;
    if (!plate || !media || !(media instanceof HTMLMediaElement)) return;
    plate.toggleAttribute('data-playing', !media.paused && !media.ended);
  };
  for (const type of ['play', 'playing', 'pause', 'ended', 'emptied']) {
    stage?.addEventListener(type, sync, { capture: true });
  }

  // ── phones: the live strip hangs under the video; reserve its height ──
  const reserve = () => {
    const bar = stage?.querySelector<HTMLElement>('.video-controls-bottom');
    if (!stage || !bar) return false;
    new ResizeObserver(() => {
      const below = plate?.hasAttribute('data-phatta-below');
      stage.style.setProperty('--ph-strip-h', below ? `${bar.offsetHeight}px` : '0px');
    }).observe(bar);
    return true;
  };
  if (!reserve()) {
    const mo = new MutationObserver(() => reserve() && mo.disconnect());
    if (stage) mo.observe(stage, { childList: true, subtree: true });
  }

  // ── About: move focus to the section so keyboard users land there ──
  document.querySelector<HTMLAnchorElement>('.ph-link-about')?.addEventListener('click', (event) => {
    const about = document.getElementById('about');
    if (!about) return;
    event.preventDefault();
    const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    about.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    about.focus({ preventScroll: true });
    history.replaceState(null, '', '#about');
  });
}
