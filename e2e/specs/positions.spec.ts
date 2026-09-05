import { expect, test } from '@playwright/test';
import { box, CONTAINER, openFixture, pinned, settled, TOAST } from './helpers';
import type { ToastPosition } from '../../src/types';

const OFFSET = 24;

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

const anchors: Array<{
  position: ToastPosition;
  check: (b: Awaited<ReturnType<typeof box>>, vw: number, vh: number) => void;
}> = [
  {
    position: 'top-left',
    check: (b) => {
      expect(b.top).toBeCloseTo(OFFSET, 0);
      expect(b.left).toBeCloseTo(OFFSET, 0);
    },
  },
  {
    position: 'top-right',
    check: (b, vw) => {
      expect(b.top).toBeCloseTo(OFFSET, 0);
      expect(b.right).toBeCloseTo(vw - OFFSET, 0);
    },
  },
  {
    position: 'top-center',
    check: (b, vw) => {
      expect(b.top).toBeCloseTo(OFFSET, 0);
      expect(b.left + b.width / 2).toBeCloseTo(vw / 2, 0);
    },
  },
  {
    position: 'bottom-left',
    check: (b, _vw, vh) => {
      expect(b.bottom).toBeCloseTo(vh - OFFSET, 0);
      expect(b.left).toBeCloseTo(OFFSET, 0);
    },
  },
  {
    position: 'bottom-right',
    check: (b, vw, vh) => {
      expect(b.bottom).toBeCloseTo(vh - OFFSET, 0);
      expect(b.right).toBeCloseTo(vw - OFFSET, 0);
    },
  },
  {
    position: 'bottom-center',
    check: (b, vw, vh) => {
      expect(b.bottom).toBeCloseTo(vh - OFFSET, 0);
      expect(b.left + b.width / 2).toBeCloseTo(vw / 2, 0);
    },
  },
  {
    position: 'center',
    check: (b, vw, vh) => {
      expect(b.left + b.width / 2).toBeCloseTo(vw / 2, 0);
      expect(b.top + b.height / 2).toBeCloseTo(vh / 2, 0);
    },
  },
];

for (const { position, check } of anchors) {
  test(`anchors a ${position} toast once it has settled`, async ({ page }) => {
    await pinned(page, 'info', position, { position });
    await settled(page);

    const size = page.viewportSize()!;
    const target = position === 'center' ? TOAST : CONTAINER;
    check(await box(page, target), size.width, size.height);
  });
}

test('gives each position in use its own container', async ({ page }) => {
  await pinned(page, 'info', 'a', { position: 'top-left' });
  await pinned(page, 'info', 'b', { position: 'bottom-right' });
  await pinned(page, 'info', 'c', { position: 'top-left' });
  await settled(page);

  await expect(page.locator(CONTAINER)).toHaveCount(2);
  await expect(page.locator('[data-position="top-left"] .vue-toast')).toHaveCount(2);
});

test('grows a top stack downwards, newest on top', async ({ page }) => {
  await pinned(page, 'info', 'older', { position: 'top-left' });
  await pinned(page, 'info', 'newer', { position: 'top-left' });
  await settled(page);

  const newer = await box(page, '.vue-toast-container [data-type="info"]');
  const messages = await page.locator('.vue-toast__message').allTextContents();
  expect(messages[0]).toBe('newer');
  expect(newer.top).toBeCloseTo(OFFSET, 0);
});

test('grows a bottom stack upwards, newest at the bottom', async ({ page }) => {
  await pinned(page, 'info', 'older', { position: 'bottom-left' });
  await pinned(page, 'info', 'newer', { position: 'bottom-left' });
  await settled(page);

  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('.vue-toast')].map((el) => ({
      text: el.querySelector('.vue-toast__message')!.textContent,
      top: el.getBoundingClientRect().top,
    })),
  );

  const newer = boxes.find((b) => b.text === 'newer')!;
  const older = boxes.find((b) => b.text === 'older')!;
  expect(newer.top).toBeGreaterThan(older.top);
});

test('keeps a toast inside the viewport on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 700 });
  await pinned(page, 'info', 'narrow');
  await settled(page);

  const b = await box(page, TOAST);
  expect(b.left).toBeGreaterThanOrEqual(0);
  expect(b.right).toBeLessThanOrEqual(380);
});
