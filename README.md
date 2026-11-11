# Phatta

**A Pakistani truck-art skin for the Video.js v10 player.** Built for the Contra × Mux Video.js v10 Skins Design Challenge.

- **Live demo:** https://phatta.vercel.app (no login) · player on its own: `/player.html`
- **Mux playback ID:** `9H1YMgeKpZMqJuvARY1SYw4B1jDRUedM3RGgT00N5XdE`
- Built on `@videojs/html@10.3.0` (HTML custom elements + CSS), started from the v10 Scaffold skin via `@videojs/cli skin create`.
- Part of the [panj](https://github.com/MuhammadFaizan-prog/panj) set of six skins; this repo is Phatta on its own.

## Design thinking

Phatta borrows from the painted backs of Pakistani goods trucks: every surface is decorated, yet the road still has to read the plate. So the loud art lives on the truck around the picture, and the controls sit in one calm black-lacquer strip with cream numerals that read over bright and dark footage.

The seek bar is *chamak-patti*, the reflective foil truck artists cut into patterns: gold beads for what you have watched, silver for what is left, a brass ball for the playhead and a cream tag with the time.

The paint is raster on purpose. The truck and every control sprite are cut from our own AI-generated reference art, so the page matches it pixel for pixel; the time, the speed and every state stay live Video.js v10 controls with 44 px targets, keyboard access and a visible focus ring.

The crown reads “Dekh magar pyar se”: look, but with love. The bells sway while the video plays and the lights twinkle at night, and both stay still if you prefer reduced motion.

## Controls

- **Seek bar:** crystal-bead strip, gold for played, silver for the rest, brass ball playhead, cream tag with the live time.
- **Rail:** black lacquer strip with a red-green floral border and a chrome rim.
- **Buttons:** round brass-ringed buttons with cream painted icons: play/pause, mute with an inline brass volume rail, captions, speed (`1×`, opens the settings menu) and fullscreen. Gold glow on hover, open and captions-on; pressed state.
- **Time:** sign-painter serif numerals (`02:14 / 07:48`).
- **Page:** the back of the truck, night by default, day on the toggle (remembered); bells, LEDs and headlights react to playback. On phones the strip hangs under the video.

## Accessibility

- Every control is a real Video.js v10 element with an accessible name; every visible target is at least 44 × 44 px.
- Keyboard: Tab reaches every control in order; a cream ring plus black halo shows focus over bright video. Hotkeys: Space/K play-pause, ←/→ seek, Home/End, M mute, ↑/↓ volume, F fullscreen, C captions; Esc closes the menu and returns focus.
- Status announcer for screen readers; decorative art is `aria-hidden`, the truck crown has a text alternative.
- `prefers-reduced-motion` stops every transition and animation. WebVTT captions sit above the controls.

## Use the skin

```ts
import '@videojs/html/i18n';
import { createSkinnedPlayer } from './src/index.ts'; // copy src/ into your project

const player = createSkinnedPlayer(
  `<video src="https://stream.mux.com/9H1YMgeKpZMqJuvARY1SYw4B1jDRUedM3RGgT00N5XdE/highest.mp4" playsinline crossorigin preload="metadata"></video>`,
  'https://image.mux.com/9H1YMgeKpZMqJuvARY1SYw4B1jDRUedM3RGgT00N5XdE/thumbnail.webp',
);
document.querySelector('#stage')!.append(player);
```

Needs `@videojs/html@10.3.0`. Fix the cascade-layer order once, before any stylesheet:

```html
<style>@layer base, base.theme, base.preset, base.preferences, components, utilities, phatta, phatta-page;</style>
```

Palette: `data-phatta-theme="night" | "day" | "desk"` on an ancestor. Layouts: **flow** by default (strip over the video; `data-phatta-below` hangs it underneath), **plate** inside `data-phatta-plate` (controls on their painted spots, scaled by `--phatta-k`; see `demo/phatta-page.css`).

## Layout

`src/` the skin (markup `video/skin.html`, `video/phatta.css`, generated `phatta-geometry.css`, sprites, subset fonts) · `src/shared/` focus/target/motion tokens · `index.html`, `player.html`, `demo/` the demo pages · `tests/` Playwright gates (controls, keyboard, Esc, focus, 44 px, reduced motion at 1440/390/320) · `tools/` asset-cutting scripts.

```sh
pnpm install && pnpm dev   # pnpm build → dist/, pnpm typecheck, pnpm test:install && pnpm test
```

## Licence

Apache-2.0 © 2026 Muhammad Faizan. Reference art is our own AI-generated work under the same licence. Source Serif 4 and Inter: SIL OFL 1.1. The demo streams Mux's public sample; no media is bundled.
