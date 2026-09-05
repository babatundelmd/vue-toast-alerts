import { expect, test } from '@playwright/test';
import { BACKDROP, box, openFixture, settled, TOAST } from './helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

function centre(page: import('@playwright/test').Page, message: string, config = {}) {
  return page.evaluate(
    (args) => window.toast.center(args.message, 'pending', { disableTimeout: true, ...args.config }),
    { message, config },
  );
}

test('dims and blurs the page behind a centred toast', async ({ page }) => {
  await centre(page, 'read this');
  await settled(page, BACKDROP);

  const backdrop = page.locator(BACKDROP);
  await expect(backdrop).toBeVisible();

  const style = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.vue-toast-backdrop')!);
    return { filter: cs.backdropFilter, background: cs.backgroundColor };
  });
  expect(style.filter).toContain('blur');
  expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
});

test('covers the whole viewport with the backdrop', async ({ page }) => {
  await centre(page, 'read this');
  await settled(page, BACKDROP);

  const size = page.viewportSize()!;
  const b = await box(page, BACKDROP);
  expect(b.left).toBeCloseTo(0, 0);
  expect(b.top).toBeCloseTo(0, 0);
  expect(b.width).toBeCloseTo(size.width, 0);
  expect(b.height).toBeCloseTo(size.height, 0);
});

test('sits the backdrop behind the toast', async ({ page }) => {
  await centre(page, 'read this');
  await settled(page, TOAST);

  const layers = await page.evaluate(() => ({
    backdrop: Number(getComputedStyle(document.querySelector('.vue-toast-backdrop')!).zIndex),
    container: Number(getComputedStyle(document.querySelector('.vue-toast-container')!).zIndex),
  }));
  expect(layers.backdrop).toBeLessThan(layers.container);
});

test('dismisses the toast when the backdrop is clicked', async ({ page }) => {
  await centre(page, 'read this');
  await settled(page, TOAST);

  await page.locator(BACKDROP).click({ position: { x: 20, y: 20 } });
  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator(BACKDROP)).toHaveCount(0);
});

test('skips the backdrop when asked', async ({ page }) => {
  await centre(page, 'read this', { backdrop: false });
  await settled(page, TOAST);

  await expect(page.locator(BACKDROP)).toHaveCount(0);
  await expect(page.locator(TOAST)).toHaveCount(1);
});

test('keeps a centred toast that opted out of click-to-close', async ({ page }) => {
  await centre(page, 'read this', { clickToClose: false });
  await settled(page, TOAST);

  await page.locator(BACKDROP).click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(400);
  await expect(page.locator(TOAST)).toHaveCount(1);
});

test('overshoots and settles, rather than fading in', async ({ page }) => {
  await centre(page, 'springy');

  const scales = new Set<string>();
  for (let i = 0; i < 8; i++) {
    scales.add(
      await page.evaluate(
        () => getComputedStyle(document.querySelector('.vue-toast')!).transform,
      ),
    );
    await page.waitForTimeout(50);
  }

  expect(scales.size).toBeGreaterThan(3);
});

test('uses the custom title when given one', async ({ page }) => {
  await page.evaluate(() =>
    window.toast.center('Read the full tutorial', 'pending', {
      title: 'Notifications UI design',
      disableTimeout: true,
    }),
  );
  await settled(page);

  await expect(page.locator('.vue-toast__title')).toHaveText('Notifications UI design');
});
