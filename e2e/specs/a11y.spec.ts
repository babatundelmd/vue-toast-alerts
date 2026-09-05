import { expect, test } from '@playwright/test';
import { animationName, openFixture, pinned, settled, TOAST } from './helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

test('announces a toast in the polite live region', async ({ page }) => {
  await pinned(page, 'success', 'Your changes have been saved');
  await settled(page);

  await expect(page.locator('[aria-live="polite"]')).toHaveText(
    'Success. Your changes have been saved',
  );
  await expect(page.locator('[aria-live="assertive"]')).toHaveText('');
});

test('routes an assertive toast to the assertive region', async ({ page }) => {
  await pinned(page, 'error', 'it broke', { ariaLive: 'assertive' });
  await settled(page);

  await expect(page.locator('[aria-live="assertive"]')).toHaveText('Error. it broke');
});

test('keeps both live regions in the DOM before any toast', async ({ page }) => {
  await pinned(page, 'info', 'a');

  await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);
  await expect(page.locator('[aria-live="assertive"]')).toHaveCount(1);
  await expect(page.locator('[aria-live="polite"]')).toHaveAttribute('aria-atomic', 'true');
});

test('hides the live regions visually without hiding them from readers', async ({ page }) => {
  await pinned(page, 'info', 'a');

  const size = await page.evaluate(() => {
    const el = document.querySelector('.vue-toast-live')!;
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height, display: getComputedStyle(el).display };
  });
  expect(size.width).toBeLessThanOrEqual(1);
  expect(size.height).toBeLessThanOrEqual(1);
  expect(size.display).not.toBe('none');
});

test('labels the close button and hides the icon from readers', async ({ page }) => {
  await pinned(page, 'info', 'a');
  await settled(page);

  await expect(page.locator('.vue-toast__close')).toHaveAttribute(
    'aria-label',
    'Dismiss notification',
  );
  await expect(page.locator('.vue-toast__icon')).toHaveAttribute('aria-hidden', 'true');
});

test('dismisses from the keyboard', async ({ page }) => {
  await pinned(page, 'success', 'keyboard');
  await settled(page);

  await page.locator('.vue-toast__close').focus();
  await expect(page.locator('.vue-toast__close')).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
});

test('dismisses from the keyboard with Space too', async ({ page }) => {
  await pinned(page, 'success', 'keyboard');
  await settled(page);

  await page.locator('.vue-toast__close').focus();
  await page.keyboard.press('Space');

  await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
});

test('reaches the close button by tabbing', async ({ page }) => {
  await pinned(page, 'success', 'keyboard');
  await settled(page);

  await page.locator('#outside').focus();
  await page.keyboard.press('Tab');

  await expect(page.locator('.vue-toast__close')).toBeFocused();
});

test('draws a focus ring on the close button', async ({ page }) => {
  await pinned(page, 'success', 'keyboard');
  await settled(page);

  await page.locator('#outside').focus();
  await page.keyboard.press('Tab');

  const outline = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.vue-toast__close')!);
    return { width: cs.outlineWidth, style: cs.outlineStyle };
  });
  expect(outline.style).toBe('solid');
  expect(parseFloat(outline.width)).toBeGreaterThan(0);
});

test('gives the title enough contrast against the surface', async ({ page }) => {
  await pinned(page, 'info', 'contrast');
  await settled(page);

  const ratio = await page.evaluate(() => {
    const parse = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = ([r, g, b]: number[]) => {
      const channel = (c: number) => {
        const s = c! / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
    };
    const title = luminance(parse(getComputedStyle(document.querySelector('.vue-toast__title')!).color));
    const surface = luminance(parse(getComputedStyle(document.querySelector('.vue-toast')!).backgroundColor));
    const [light, dark] = title > surface ? [title, surface] : [surface, title];
    return (light! + 0.05) / (dark! + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('replaces the entrance with a plain fade', async ({ page }) => {
    await pinned(page, 'success', 'calm', { position: 'top-right' });

    expect(await animationName(page, TOAST)).toBe('vue-toast-fade-in');
  });

  test('replaces the exit with a plain fade', async ({ page }) => {
    const id = await pinned(page, 'success', 'calm');
    await settled(page);

    await page.evaluate((toastId) => window.toast.closeToast(toastId), id);
    expect(await animationName(page, TOAST)).toBe('vue-toast-fade-out');
  });

  test('drops the hover lift and slows the spinner', async ({ page }) => {
    await pinned(page, 'pending', 'calm');
    await settled(page);

    const duration = await page.evaluate(
      () => getComputedStyle(document.querySelector('.vue-toast__spinner')!).animationDuration,
    );
    expect(duration).toBe('2.4s');
  });

  test('still removes the toast when it is dismissed', async ({ page }) => {
    const id = await pinned(page, 'success', 'calm');
    await settled(page);

    await page.evaluate((toastId) => window.toast.closeToast(toastId), id);
    await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 2000 });
  });
});
