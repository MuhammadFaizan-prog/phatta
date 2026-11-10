// Phatta icon family: hand-drawn sign-painter glyphs, original to this skin (Apache-2.0).
// Solid, slightly chunky shapes so they read at 18 px in cream over black lacquer.
// Menu chrome glyphs (check, chevron, spinner, …) reuse the Scaffold set.
import {
  checkIcon,
  chevronIcon,
  gearIcon,
  seekIcon,
  speechIcon,
  speedIcon,
  switchesIcon,
} from '@videojs/html/icons/scaffold';

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;

const play = svg(
  '<path fill="currentColor" d="M7.2 4.6c0-.9 1-1.5 1.8-1l10.6 6.6c.8.5.8 1.6 0 2.1L9 18.9c-.8.5-1.8-.1-1.8-1V4.6Z"/>',
);

const pause = svg(
  '<rect x="5.6" y="4.2" width="4.6" height="15.6" rx="1.4" fill="currentColor"/>' +
    '<rect x="13.8" y="4.2" width="4.6" height="15.6" rx="1.4" fill="currentColor"/>',
);

const restart = svg(
  '<path stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M5.2 12a6.8 6.8 0 1 0 2.1-4.9"/>' +
    '<path fill="currentColor" d="M3.6 3.9v5.6h5.6z"/>',
);

const speaker = '<path fill="currentColor" d="M3.5 9.2c0-.6.5-1.1 1.1-1.1H7.6L12 4.5c.6-.5 1.5-.1 1.5.7v13.6c0 .8-.9 1.2-1.5.7l-4.4-3.6H4.6c-.6 0-1.1-.5-1.1-1.1V9.2Z"/>';

const volumeHigh = svg(
  speaker +
    '<path stroke="currentColor" stroke-width="2.1" stroke-linecap="round" d="M16.2 9.2a4 4 0 0 1 0 5.6"/>' +
    '<path stroke="currentColor" stroke-width="2.1" stroke-linecap="round" d="M18.6 6.6a7.6 7.6 0 0 1 0 10.8"/>',
);

const volumeLow = svg(speaker + '<path stroke="currentColor" stroke-width="2.1" stroke-linecap="round" d="M16.2 9.2a4 4 0 0 1 0 5.6"/>');

const volumeOff = svg(
  speaker +
    '<path stroke="currentColor" stroke-width="2.1" stroke-linecap="round" d="m16.4 9.4 5 5.2m0-5.2-5 5.2"/>',
);

// "CC" lettered like a painted plate.
const ccLetters =
  '<path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10.4 9.9a2.4 2.4 0 1 0 0 4.2M17 9.9a2.4 2.4 0 1 0 0 4.2"/>';
const captionsOff = svg('<rect x="2.6" y="5.2" width="18.8" height="13.6" rx="3" stroke="currentColor" stroke-width="1.8"/>' + ccLetters);
const captionsOn = svg(
  '<rect x="2.6" y="5.2" width="18.8" height="13.6" rx="3" fill="currentColor"/>' +
    '<path stroke="#120d08" stroke-width="2" stroke-linecap="round" d="M10.4 9.9a2.4 2.4 0 1 0 0 4.2M17 9.9a2.4 2.4 0 1 0 0 4.2"/>',
);

const corners = (d: string) => svg(`<path stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`);
const fullscreenEnter = corners('M4 9V5.2C4 4.5 4.5 4 5.2 4H9m6 0h3.8c.7 0 1.2.5 1.2 1.2V9m0 6v3.8c0 .7-.5 1.2-1.2 1.2H15m-6 0H5.2c-.7 0-1.2-.5-1.2-1.2V15');
const fullscreenExit = corners('M9 4v3.8C9 8.5 8.5 9 7.8 9H4m11-5v3.8c0 .7.5 1.2 1.2 1.2H20m0 6h-3.8c-.7 0-1.2.5-1.2 1.2V20M4 15h3.8c.7 0 1.2.5 1.2 1.2V20');

const pipEnter = svg(
  '<rect x="2.8" y="4.6" width="18.4" height="14.8" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="12" y="11.4" width="7" height="5.6" rx="1" fill="currentColor"/>',
);
const pipExit = svg('<rect x="2.8" y="4.6" width="18.4" height="14.8" rx="2" stroke="currentColor" stroke-width="1.8"/>');

// Brass-wheel spinner (a truck-wheel hub with eight spokes). Rotation runs through --media-spinner-animation,
// which the Scaffold sets to `none` when hidden and under prefers-reduced-motion.
const spinner = svg(
  '<style>@keyframes phatta-hub{to{transform:rotate(360deg)}}</style>' +
    '<g style="transform-box:view-box;transform-origin:center;animation:var(--media-spinner-animation, phatta-hub 1.2s linear infinite)">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="3.4 2.2"/>' +
    '<circle cx="12" cy="12" r="2.6" fill="currentColor"/>' +
    '<path stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M12 5.6v3M12 15.4v3M5.6 12h3M15.4 12h3"/>' +
    '</g>',
);

export const phattaIcons: Record<string, string> = {
  play,
  pause,
  restart,
  'volume-high': volumeHigh,
  'volume-low': volumeLow,
  'volume-off': volumeOff,
  'captions-off': captionsOff,
  'captions-on': captionsOn,
  'fullscreen-enter': fullscreenEnter,
  'fullscreen-exit': fullscreenExit,
  'pip-enter': pipEnter,
  'pip-exit': pipExit,
  spinner,
  check: checkIcon,
  chevron: chevronIcon,
  gear: gearIcon,
  seek: seekIcon,
  speech: speechIcon,
  speed: speedIcon,
  switches: switchesIcon,
};
