import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, type Page } from '@playwright/test';

export const SKINS = ['phatta'] as const;
export type Skin = (typeof SKINS)[number];

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)));
const CLIPS = { dark: fixture('dark.webm'), bright: fixture('bright.webm') };
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');

/** Serve the public Mux sample from local fixtures so tests run offline and deterministically. */
export async function routeMedia(page: Page, footage: keyof typeof CLIPS = 'dark') {
  // Honour Range requests so the media is seekable, like the real CDN.
  await page.route('https://stream.mux.com/**', (route) => {
    const body = CLIPS[footage];
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] ?? '');
    const base = { 'content-type': 'video/webm', 'access-control-allow-origin': '*', 'accept-ranges': 'bytes' };
    if (!range) return route.fulfill({ status: 200, body, headers: base });
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    return route.fulfill({
      status: 206,
      body: body.subarray(start, end + 1),
      headers: { ...base, 'content-range': `bytes ${start}-${end}/${body.length}` },
    });
  });
  await page.route('https://image.mux.com/**', (route) =>
    route.fulfill({ status: 200, body: PIXEL, headers: { 'content-type': 'image/png', 'access-control-allow-origin': '*' } }),
  );
}

export async function openSkin(page: Page, skin: Skin, footage: keyof typeof CLIPS = 'dark') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await routeMedia(page, footage);
  await page.goto('/');
  const container = page.locator(`.media-skin[data-skin="${skin}"]`);
  await expect(container).toBeVisible();
  await page.waitForFunction(() => (document.querySelector('video')?.readyState ?? 0) >= 1, null, { timeout: 15_000 });
  return { container, errors };
}

export const video = {
  get: <T>(page: Page, fn: (v: HTMLVideoElement) => T) => page.evaluate(fn, undefined as never) as Promise<T>,
};

export async function videoProp<K extends keyof HTMLVideoElement>(page: Page, key: K) {
  return page.evaluate((k) => (document.querySelector('video') as HTMLVideoElement)[k as keyof HTMLVideoElement], key as string) as Promise<HTMLVideoElement[K]>;
}

/** Keep controls showing: pointer over the player. */
export async function wake(page: Page, skin: Skin) {
  await page.locator(`.media-skin[data-skin="${skin}"]`).hover({ position: { x: 20, y: 20 } });
}
