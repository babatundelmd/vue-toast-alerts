import { expect, test } from '@playwright/test';
import { animationName, openFixture, pinned, settled, TOAST } from './helpers';
import type { ToastPosition } from '../../src/types';

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

const entrances: Array<[ToastPosition, string]> = [
  ['top-right', 'vue-toast-in-right'],
  ['bottom-right', 'vue-toast-in-right'],
  ['top-left', 'vue-toast-in-left'],
  ['bottom-left', 'vue-toast-in-left'],
  ['top-center', 'vue-toast-in'],
  ['bottom-center', 'vue-toast-in-up'],
  ['center', 'vue-toast-center-in'],
];

for (const [position, keyframes] of entrances) {
  test(`enters a ${position} toast with ${keyframes}`, async ({ page }) => {
    await pinned(page, 'info', position, { position });
    expect(await animationName(page, TOAST)).toBe(keyframes);
  });
}

const exits: Array<[ToastPosition, string]> = [
  ['top-right', 'vue-toast-out-right'],
  ['top-left', 'vue-toast-out-left'],
  ['top-center', 'vue-toast-out'],
  ['bottom-center', 'vue-toast-out-down'],
  ['center', 'vue-toast-center-out'],
];

for (const [position, keyframes] of exits) {
  test(`exits a ${position} toast with ${keyframes}`, async ({ page }) => {
    const id = await pinned(page, 'info', position, { position });
    await settled(page);

    await page.evaluate((toastId) => window.toast.closeToast(toastId), id);
    expect(await animationName(page, TOAST)).toBe(keyframes);
  });
}

test('actually runs the entrance animation rather than snapping into place', async ({ page }) => {
  await pinned(page, 'success', 'sliding in');

  const running = await page.evaluate(() =>
    document
      .querySelector('.vue-toast')!
      .getAnimations()
      .map((a) => a.playState),
  );
  expect(running).toContain('running');
});

test('moves the toast into place over the entrance', async ({ page }) => {
  await pinned(page, 'success', 'sliding in', { position: 'top-right' });

  const start = await page.evaluate(
    () => document.querySelector('.vue-toast')!.getBoundingClientRect().left,
  );
  await settled(page);
  const end = await page.evaluate(
    () => document.querySelector('.vue-toast')!.getBoundingClientRect().left,
  );

  expect(start).toBeGreaterThan(end);
});

test('holds the toast in the DOM while it animates out, then removes it', async ({ page }) => {
  const id = await pinned(page, 'success', 'leaving');
  await settled(page);

  await page.evaluate((toastId) => window.toast.closeToast(toastId), id);
  await expect(page.locator(TOAST)).toHaveClass(/is-leaving/);
  await expect(page.locator(TOAST)).toHaveCount(1);

  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
});

test('stops a leaving toast taking pointer events', async ({ page }) => {
  const id = await pinned(page, 'success', 'leaving');
  await settled(page);

  await page.evaluate((toastId) => window.toast.closeToast(toastId), id);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('.vue-toast')!).pointerEvents,
    ),
  ).toBe('none');
});

test('auto-dismisses when the timeout expires', async ({ page }) => {
  await pinned(page, 'success', 'brief', { disableTimeout: false, timeout: 700 });

  await expect(page.locator(TOAST)).toHaveCount(1);
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 3000 });
});

test('spins the pending icon', async ({ page }) => {
  await pinned(page, 'pending', 'uploading');

  expect(await animationName(page, '.vue-toast__spinner')).toBe('vue-toast-spin');
});
