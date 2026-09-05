import { expect, test } from '@playwright/test';
import { openFixture, pinned, settled, TOAST } from './helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

test('mounts nothing until the first toast', async ({ page }) => {
  await expect(page.locator('[data-vue-toast-alerts]')).toHaveCount(0);
  await expect(page.locator('#vue-toast-alerts-styles')).toHaveCount(0);
});

test('mounts its own overlay and stylesheet on the first toast', async ({ page }) => {
  await pinned(page, 'success', 'hello');

  await expect(page.locator('[data-vue-toast-alerts]')).toHaveCount(1);
  await expect(page.locator('#vue-toast-alerts-styles')).toHaveCount(1);
  await expect(page.locator(TOAST)).toHaveCount(1);
});

test('keeps one overlay however many toasts are shown', async ({ page }) => {
  await pinned(page, 'success', 'one');
  await pinned(page, 'error', 'two');
  await pinned(page, 'warning', 'three');

  await expect(page.locator('[data-vue-toast-alerts]')).toHaveCount(1);
  await expect(page.locator('#vue-toast-alerts-styles')).toHaveCount(1);
  await expect(page.locator(TOAST)).toHaveCount(3);
});

test('mounts the overlay as a direct child of body', async ({ page }) => {
  await pinned(page, 'info', 'hello');

  const parent = await page.evaluate(
    () => document.querySelector('[data-vue-toast-alerts]')!.parentElement!.tagName,
  );
  expect(parent).toBe('BODY');
});

test('renders the title, message and icon', async ({ page }) => {
  await pinned(page, 'success', 'Your changes have been saved');
  await settled(page);

  await expect(page.locator('.vue-toast__title')).toHaveText('Success');
  await expect(page.locator('.vue-toast__message')).toHaveText(
    'Your changes have been saved',
  );
  await expect(page.locator('.vue-toast__icon svg')).toBeVisible();
});

test('stacks the newest toast first', async ({ page }) => {
  await pinned(page, 'success', 'first');
  await pinned(page, 'error', 'second');
  await settled(page);

  await expect(page.locator('.vue-toast__message')).toHaveText([
    'second',
    'first',
  ]);
});

test('caps the stack at maxToasts, dropping the oldest', async ({ page }) => {
  for (let i = 1; i <= 5; i++) {
    await pinned(page, 'info', `toast ${i}`, { maxToasts: 3 });
  }
  await settled(page);

  await expect(page.locator('.vue-toast__message')).toHaveText([
    'toast 5',
    'toast 4',
    'toast 3',
  ]);
});

test('lets the page underneath stay clickable around the toasts', async ({ page }) => {
  await pinned(page, 'info', 'hello', { position: 'top-left' });
  await settled(page);

  const events = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.vue-toast-container')!).pointerEvents,
  );
  expect(events).toBe('none');
  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('.vue-toast')!).pointerEvents,
    ),
  ).toBe('auto');
});
