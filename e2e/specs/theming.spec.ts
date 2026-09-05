import { expect, test } from '@playwright/test';
import { openFixture, pinned, settled, token, TOAST } from './helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page);
});

async function styleOf(page: import('@playwright/test').Page, selector: string, prop: string) {
  return page.evaluate(
    (args) =>
      getComputedStyle(document.querySelector(args.selector)!).getPropertyValue(args.prop),
    { selector, prop },
  );
}

test('lets a :root override beat the library default', async ({ page }) => {
  await page.addStyleTag({
    content: ':root { --vue-toast-radius: 4px; --vue-toast-success: rgb(1, 2, 3); }',
  });
  await pinned(page, 'success', 'themed');
  await settled(page);

  expect(await styleOf(page, TOAST, 'border-radius')).toBe('4px');
  expect(await styleOf(page, '.vue-toast__icon', 'background-color')).toBe('rgb(1, 2, 3)');
});

test('honours an override added after the toast is on screen', async ({ page }) => {
  await pinned(page, 'success', 'themed');
  await settled(page);

  await page.addStyleTag({ content: ':root { --vue-toast-width: 260px; }' });
  await page.waitForTimeout(100);

  const width = await page.evaluate(
    () => document.querySelector('.vue-toast-container')!.getBoundingClientRect().width,
  );
  expect(width).toBeCloseTo(260, 0);
});

test('never declares a public token itself', async ({ page }) => {
  await pinned(page, 'success', 'themed');

  const declared = await page.evaluate(() => {
    const found: string[] = [];
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list: CSSRuleList) => {
        for (const rule of [...list]) {
          if (rule instanceof CSSStyleRule) {
            for (const prop of [...rule.style]) {
              if (prop.startsWith('--vue-toast-')) found.push(prop);
            }
          } else if ('cssRules' in rule) {
            walk((rule as CSSGroupingRule).cssRules);
          }
        }
      };
      walk(rules);
    }
    return found;
  });

  expect(declared).toEqual([]);
});

test('moves every toast with a single offset override', async ({ page }) => {
  await page.addStyleTag({ content: ':root { --vue-toast-offset: 60px; }' });
  await pinned(page, 'success', 'themed', { position: 'top-left' });
  await settled(page);

  const b = await page.evaluate(
    () => document.querySelector('.vue-toast-container')!.getBoundingClientRect(),
  );
  expect(b.top).toBeCloseTo(60, 0);
  expect(b.left).toBeCloseTo(60, 0);
});

const radii: Array<[string, string]> = [
  ['soft', '12px'],
  ['round', '20px'],
  ['pill', '999px'],
];

for (const [radius, expected] of radii) {
  test(`rounds a ${radius} toast to ${expected}`, async ({ page }) => {
    await pinned(page, 'info', radius, { radius: radius as 'soft' });
    await settled(page);

    expect(await styleOf(page, TOAST, 'border-radius')).toBe(expected);
  });
}

const accents: Array<[string, string]> = [
  ['success', 'rgb(52, 200, 138)'],
  ['error', 'rgb(224, 121, 109)'],
  ['warning', 'rgb(239, 178, 101)'],
  ['info', 'rgb(154, 162, 174)'],
  ['pending', 'rgb(143, 162, 245)'],
];

for (const [type, colour] of accents) {
  test(`tints a ${type} icon with its accent`, async ({ page }) => {
    await pinned(page, type as 'info', type);
    await settled(page);

    expect(await styleOf(page, '.vue-toast__icon', 'background-color')).toBe(colour);
  });
}

test('uses the light surface by default', async ({ page }) => {
  await pinned(page, 'info', 'light');
  await settled(page);

  expect(await styleOf(page, TOAST, 'background-color')).toBe('rgb(255, 255, 255)');
});

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('switches the surface from prefers-color-scheme', async ({ page }) => {
    await pinned(page, 'info', 'dark');
    await settled(page);

    expect(await styleOf(page, TOAST, 'background-color')).toBe('rgb(23, 26, 33)');
    expect(await token(page, '--_title')).toBe('#f3f5f8');
  });

  test('still lets a consumer override win', async ({ page }) => {
    await page.addStyleTag({ content: ':root { --vue-toast-surface: rgb(9, 9, 9); }' });
    await pinned(page, 'info', 'dark');
    await settled(page);

    expect(await styleOf(page, TOAST, 'background-color')).toBe('rgb(9, 9, 9)');
  });
});
