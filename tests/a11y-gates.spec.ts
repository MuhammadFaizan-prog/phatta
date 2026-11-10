import { expect, test } from '@playwright/test';

import { openSkin, SKINS, videoProp, wake } from './helpers';

const MIN = 44;

for (const skin of SKINS) {
  test.describe(`${skin}: a11y gates`, () => {
    test('every visible control is at least 44px', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await wake(page, skin);
      const small = await container.evaluate((root, min) => {
        const bad: string[] = [];
        const els = root.querySelectorAll<HTMLElement>('[role="button"], button, media-time-slider, .video-controls-content [role="slider"]');
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') continue;
          if (el.closest('media-menu, media-volume-popover, media-tooltip, media-error-dialog')) continue;
          const isSliderThumb = el.getAttribute('role') === 'slider';
          // a slider thumb is hit through its slider root; measure the root instead
          const box = isSliderThumb ? (el.closest('media-time-slider, media-volume-slider') as HTMLElement).getBoundingClientRect() : r;
          if (box.height < min - 0.5 || (!el.matches('media-time-slider') && !isSliderThumb && box.width < min - 0.5)) {
            bad.push(`${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''} ${Math.round(box.width)}x${Math.round(box.height)}`);
          }
        }
        return bad;
      }, MIN);
      expect(small).toEqual([]);
    });

    test('Tab reaches every control in order with a visible focus ring', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await wake(page, skin);
      await container.focus();
      const seen: string[] = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || !el.closest('.media-skin')) return null;
          const cs = getComputedStyle(el);
          const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none';
          return { name: el.getAttribute('aria-label') || el.tagName.toLowerCase(), ring, visible: el.getBoundingClientRect().width > 0 };
        });
        if (!info) break;
        expect(info.ring, `focus ring on ${info.name}`).toBe(true);
        expect(info.visible, `focused ${info.name} is visible`).toBe(true);
        seen.push(info.name);
      }
      const joined = seen.join(' | ');
      for (const want of [/play|pause/i, /mute|unmute/i, /fullscreen/i, /captions/i, /seek/i]) expect(joined).toMatch(want);
    });

    test('volume: Esc closes the popover, or the inline slider is keyboard-operable', async ({ page }, info) => {
      const { container } = await openSkin(page, skin);
      await wake(page, skin);
      const pop = container.locator('media-volume-popover');
      const touch = info.project.name.startsWith('mobile');
      // A hover popover on desktop if the markup has one; otherwise the inline brass rail.
      if ((await pop.count()) > 0 && !touch) {
        await container.locator('media-mute-button').hover();
        await expect(pop).toHaveAttribute('data-open', { timeout: 3000 });
        await container.locator('media-volume-slider [role="slider"]').focus();
        await page.keyboard.press('Escape');
        await page.mouse.move(1, 1);
        await expect(pop).not.toHaveAttribute('data-open');
        return;
      }
      await page.evaluate(() => { (document.querySelector('video') as HTMLVideoElement).volume = 0.5; });
      await container.focus();
      let reached = false;
      for (let i = 0; i < 25 && !reached; i++) {
        await page.keyboard.press('Tab');
        reached = await page.evaluate(() => !!document.activeElement?.closest('media-volume-slider'));
      }
      expect(reached, 'Tab reaches the volume slider').toBe(true);
      await page.keyboard.press('ArrowUp');
      await expect.poll(() => videoProp(page, 'volume')).toBeGreaterThan(0.5);
      const up = await videoProp(page, 'volume');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => videoProp(page, 'volume')).toBeLessThan(up);
    });

    test('prefers-reduced-motion stops transitions and animations', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const { container } = await openSkin(page, skin);
      const moving = await container.evaluate((root) => {
        const bad: string[] = [];
        for (const el of [root, ...root.querySelectorAll<HTMLElement>('*')]) {
          const cs = getComputedStyle(el);
          const t = cs.transitionDuration.split(',').some((d) => parseFloat(d) > 0);
          const a = cs.animationName !== 'none' && cs.animationDuration.split(',').some((d) => parseFloat(d) > 0);
          if (t || a) bad.push(`${el.tagName.toLowerCase()}.${el.className}`);
        }
        return bad.slice(0, 10);
      });
      expect(moving).toEqual([]);
    });

    test('no console errors on load', async ({ page }) => {
      const { errors } = await openSkin(page, skin);
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    });
  });
}
