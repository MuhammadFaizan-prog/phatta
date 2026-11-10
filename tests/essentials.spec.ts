import { expect, test } from '@playwright/test';

import { openSkin, SKINS, videoProp, wake } from './helpers';

for (const skin of SKINS) {
  test.describe(`${skin}: essential controls`, () => {
    test('all essential controls are present and visible', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await wake(page, skin);
      const bar = container.locator('.video-controls-content');
      await expect(bar.locator('media-play-button').last()).toBeVisible();
      await expect(container.locator('media-time-slider')).toBeVisible();
      await expect(container.locator('media-time').filter({ visible: true }).first()).toBeVisible();
      await expect(container.locator('media-mute-button')).toBeVisible();
      await expect(container.locator('media-fullscreen-button')).toBeVisible();
      await expect(container.locator('media-captions-button')).toBeVisible();
      await expect(container.locator('button[commandfor]')).toBeVisible(); // settings (speed)
    });

    test('bright footage: controls stay visible, no console errors', async ({ page }) => {
      const { container, errors } = await openSkin(page, skin, 'bright');
      await wake(page, skin);
      await expect(container.locator('.video-controls-content media-play-button').last()).toBeVisible();
      await expect(container.locator('media-time-slider')).toBeVisible();
      await expect(container.locator('media-mute-button')).toBeVisible();
      await page.waitForTimeout(300);
      expect(errors).toEqual([]);
    });

    test('play / pause by button and by keyboard (Space, K)', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await wake(page, skin);
      await container.locator('.video-controls-content media-play-button').last().click();
      await expect.poll(() => videoProp(page, 'paused')).toBe(false);
      await container.focus();
      await page.keyboard.press('k');
      await expect.poll(() => videoProp(page, 'paused')).toBe(true);
      await page.keyboard.press('Space');
      await expect.poll(() => videoProp(page, 'paused')).toBe(false);
    });

    test('seek and time display (arrows, Home/End, slider keys)', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await container.focus();
      await page.keyboard.press('End');
      await expect.poll(() => videoProp(page, 'currentTime')).toBeGreaterThan(20);
      await page.keyboard.press('Home');
      await expect.poll(() => videoProp(page, 'currentTime')).toBeLessThan(1);
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => videoProp(page, 'currentTime')).toBeGreaterThan(1);
      // the time slider thumb itself is keyboard operable
      const thumb = container.locator('media-time-slider [role="slider"]');
      await thumb.focus();
      const before = await videoProp(page, 'currentTime');
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => videoProp(page, 'currentTime')).toBeGreaterThan(before);
      await expect(container.locator('media-time[type="current"], media-time').filter({ visible: true }).first()).not.toHaveText(/^\s*$/);
    });

    test('mute and volume (M, arrows, button)', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await container.focus();
      await page.keyboard.press('m');
      await expect.poll(() => videoProp(page, 'muted')).toBe(true);
      await page.keyboard.press('m');
      await expect.poll(() => videoProp(page, 'muted')).toBe(false);
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => videoProp(page, 'volume')).toBeLessThan(1);
      await wake(page, skin);
      await container.locator('media-mute-button').click();
      await expect.poll(() => videoProp(page, 'muted')).toBe(true);
    });

    test('fullscreen toggles (F, button)', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await container.focus();
      await page.keyboard.press('f');
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
      // let the player store catch up with the fullscreenchange before toggling back (cold-start race in headless)
      await page.waitForTimeout(300);
      await page.keyboard.press('f');
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
      await wake(page, skin);
      await container.locator('media-fullscreen-button').click();
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    });

    test('captions toggle (C, button)', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      const mode = () => page.evaluate(() => (document.querySelector('video') as HTMLVideoElement).textTracks[0]?.mode);
      await container.focus();
      await page.keyboard.press('c');
      await expect.poll(mode).toBe('showing');
      await wake(page, skin);
      await container.locator('media-captions-button').click();
      await expect.poll(mode).not.toBe('showing');
    });

    test('speed menu: keyboard open, choose 1.5×, Esc closes and returns focus', async ({ page }) => {
      const { container } = await openSkin(page, skin);
      await wake(page, skin);
      const trigger = container.locator('button[commandfor]');
      await trigger.focus();
      await page.keyboard.press('Enter');
      const menu = container.locator('media-menu');
      await expect(menu).toHaveAttribute('data-open', /.*/);
      await menu.locator('media-menu-item[commandfor]', { hasText: 'Speed' }).click();
      await container.locator('media-menu-radio-item', { hasText: /1\.5/ }).first().click();
      await expect.poll(() => videoProp(page, 'playbackRate')).toBe(1.5);
      if ((await menu.getAttribute('data-open')) === null) {
        await trigger.focus();
        await page.keyboard.press('Enter');
        await expect(menu).toHaveAttribute('data-open', /.*/);
      }
      await page.keyboard.press('Escape');
      await expect(menu).not.toHaveAttribute('data-open', /.*/);
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    });
  });
}
