import { expect, test } from '@playwright/test';
import { openFixture, pinned, settled, show, TOAST } from './helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

test('dismisses when the toast body is clicked', async ({ page }) => {
  await pinned(page, 'success', 'click me');
  await settled(page);

  await page.locator(TOAST).click();
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
});

test('ignores a body click when clickToClose is off', async ({ page }) => {
  await pinned(page, 'success', 'stubborn', { clickToClose: false });
  await settled(page);

  await page.locator(TOAST).click();
  await page.waitForTimeout(400);
  await expect(page.locator(TOAST)).toHaveCount(1);
});

test('shows a pointer cursor only when clicking dismisses', async ({ page }) => {
  await pinned(page, 'success', 'clickable', { position: 'top-left' });
  await pinned(page, 'error', 'not clickable', {
    position: 'bottom-left',
    clickToClose: false,
  });
  await settled(page);

  const cursors = await page.evaluate(() =>
    [...document.querySelectorAll('.vue-toast')].map(
      (el) => getComputedStyle(el).cursor,
    ),
  );
  expect(cursors).toContain('pointer');
  expect(cursors).toContain('auto');
});

test('dismisses from the close button', async ({ page }) => {
  await pinned(page, 'success', 'close me');
  await settled(page);

  await page.locator('.vue-toast__close').click();
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
});

test('does not double-fire the body handler from the close button', async ({ page }) => {
  await page.evaluate(() => {
    (window as unknown as { closes: number }).closes = 0;
    const original = window.toast.closeToast.bind(window.toast);
    window.toast.closeToast = (id, reason) => {
      (window as unknown as { closes: number }).closes += 1;
      original(id, reason);
    };
  });

  await pinned(page, 'success', 'close me');
  await settled(page);
  await page.locator('.vue-toast__close').click();

  expect(
    await page.evaluate(() => (window as unknown as { closes: number }).closes),
  ).toBe(1);
});

test('hides the close button when asked', async ({ page }) => {
  await pinned(page, 'info', 'no button', { showCloseButton: false });
  await settled(page);

  await expect(page.locator('.vue-toast__close')).toHaveCount(0);
});

test('freezes a live dismiss timer while hovered', async ({ page }) => {
  await show(page, 'success', 'hover me', { timeout: 1200 });
  await settled(page);

  await page.locator(TOAST).hover();
  await page.waitForTimeout(2200);
  await expect(page.locator(TOAST)).toHaveCount(1);

  await page.mouse.move(5, 5);
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 4000 });
});

test('does not freeze when pauseOnHover is off', async ({ page }) => {
  await show(page, 'success', 'hover me', { timeout: 800, pauseOnHover: false });
  await settled(page);

  await page.locator(TOAST).hover();
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 3000 });
});

test('deepens the shadow on hover', async ({ page }) => {
  await pinned(page, 'success', 'hover me');
  await settled(page);

  const read = () =>
    page.evaluate(
      () => getComputedStyle(document.querySelector('.vue-toast')!).boxShadow,
    );

  const before = await read();
  await page.locator(TOAST).hover();
  await page.waitForTimeout(400);

  expect(await read()).not.toBe(before);
});

// The entrance animation is `fill: both`, so its final `transform: none`
// outranks `.vue-toast:hover { transform: translateY(-2px) }` once it has
// finished. Inherited from ngx-toast-alerts; documented rather than silently
// changed. Flip this assertion if the hover lift is ever restored.
test('leaves the transform to the entrance animation after it settles', async ({ page }) => {
  await pinned(page, 'success', 'hover me');
  await settled(page);

  await page.locator(TOAST).hover();
  await page.waitForTimeout(400);

  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('.vue-toast')!).transform,
    ),
  ).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('draws a progress bar that counts the timeout down', async ({ page }) => {
  await show(page, 'success', 'progress', { timeout: 4000, showProgress: true });
  await settled(page);

  const bar = page.locator('.vue-toast__progress');
  await expect(bar).toBeVisible();

  const first = await bar.evaluate((el) => el.getBoundingClientRect().width);
  await page.waitForTimeout(900);
  const second = await bar.evaluate((el) => el.getBoundingClientRect().width);

  expect(second).toBeLessThan(first);
});

test('pauses the progress bar in step with the timer', async ({ page }) => {
  await show(page, 'success', 'progress', { timeout: 5000, showProgress: true });
  await settled(page);

  await page.locator(TOAST).hover();
  await page.waitForTimeout(300);
  const held = await page
    .locator('.vue-toast__progress')
    .evaluate((el) => el.getBoundingClientRect().width);
  await page.waitForTimeout(900);
  const still = await page
    .locator('.vue-toast__progress')
    .evaluate((el) => el.getBoundingClientRect().width);

  expect(Math.abs(still - held)).toBeLessThan(2);
});

test('draws no progress bar for a pinned toast', async ({ page }) => {
  await pinned(page, 'success', 'pinned', { showProgress: true });
  await settled(page);

  await expect(page.locator('.vue-toast__progress')).toHaveCount(0);
});

test('dismisses everything at once', async ({ page }) => {
  await pinned(page, 'success', 'a', { position: 'top-left' });
  await pinned(page, 'error', 'b', { position: 'bottom-right' });
  await settled(page);

  await page.evaluate(() => window.toast.dismissAll());
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
});
