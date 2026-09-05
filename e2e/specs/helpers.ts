import type { Page } from '@playwright/test';
import type { ToastAlertsConfig, ToastType } from '../../src/types';

export const TOAST = '.vue-toast';
export const CONTAINER = '.vue-toast-container';
export const BACKDROP = '.vue-toast-backdrop';

export async function openFixture(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => window.toastReady === true);
}

export function show(
  page: Page,
  type: ToastType,
  message: string,
  config: ToastAlertsConfig = {},
) {
  return page.evaluate(
    (args) => window.toast.show(args.type, args.message, args.config),
    { type, message, config },
  );
}

export function pinned(page: Page, type: ToastType, message: string, config: ToastAlertsConfig = {}) {
  return show(page, type, message, { disableTimeout: true, ...config });
}

/**
 * Wait for the entrance animation on the matched elements. Only their own
 * animations count — the spinner loops forever and the progress bar runs for
 * the whole timeout.
 */
export async function settled(page: Page, selector = TOAST) {
  await page.waitForFunction((sel) => {
    const nodes = [...document.querySelectorAll(sel)];
    return (
      nodes.length > 0 &&
      nodes.every((node) =>
        node
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .every((a) => a.playState === 'finished'),
      )
    );
  }, selector);
}

/** The CSS animation currently driving an element, by name. */
export function animationName(page: Page, selector: string, index = 0) {
  return page.evaluate(
    (args) =>
      getComputedStyle(document.querySelectorAll(args.selector)[args.index]!)
        .animationName,
    { selector, index },
  );
}

export function box(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const rect = document.querySelector(sel)!.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }, selector);
}

export function token(page: Page, name: string, selector = '.vue-toast-root') {
  return page.evaluate(
    (args) =>
      getComputedStyle(document.querySelector(args.selector)!)
        .getPropertyValue(args.name)
        .trim(),
    { name, selector },
  );
}
