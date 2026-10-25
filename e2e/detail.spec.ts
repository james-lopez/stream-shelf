import { expect, test } from '@playwright/test';

import { expectFocus, openHome, press } from './helpers';

test.beforeEach(async ({ page }) => {
  await openHome(page);
  await expectFocus(page, 'Under the Dome', 'rail-trending');
});

test('Enter opens detail with focus on the My List action', async ({ page }) => {
  await press(page, 'Enter');

  await expect(page.getByRole('heading', { name: 'Under the Dome' })).toBeVisible();
  await expect(page.getByText('2013  ·  60 min  ·  ★ 6.6  ·  CBS  ·  Ended')).toBeVisible();
  await expectFocus(page, 'Add to My List');
});

test('Escape returns to the tile that opened detail', async ({ page }) => {
  await press(page, 'ArrowRight', 'Enter');
  await expectFocus(page, 'Add to My List');

  await press(page, 'Escape');
  await expectFocus(page, 'Person of Interest', 'rail-trending');
});

test('a show added on detail appears in My List and survives a reload', async ({ page }) => {
  await press(page, 'Enter');
  await expectFocus(page, 'Add to My List');
  await press(page, 'Enter');
  await expect(page.getByRole('button', { name: 'In My List' })).toBeVisible();

  await press(page, 'Escape', 'ArrowLeft', 'ArrowDown', 'Enter'); // back, sidebar, My List
  await expect(page.getByRole('heading', { name: /My List\s+1/ })).toBeVisible();

  await page.reload();
  await page.getByRole('tab', { name: 'My List' }).click();
  await expect(page.getByRole('heading', { name: /My List\s+1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Under the Dome' }).last()).toBeVisible();
});

test('focus is never left inside a screen as it is hidden', async ({ page }) => {
  // Browsers block aria-hidden on an ancestor of the focused element (and warn); record
  // every time that would have happened while opening and closing detail.
  await page.evaluate(() => {
    const w = window as unknown as { hiddenWhileFocused: string[] };
    w.hiddenWhileFocused = [];
    new MutationObserver((records) => {
      for (const { target } of records) {
        const el = target as HTMLElement;
        if (el.getAttribute('aria-hidden') === 'true' && el.contains(document.activeElement)) {
          w.hiddenWhileFocused.push(document.activeElement?.getAttribute('aria-label') ?? '?');
        }
      }
    }).observe(document, { attributes: true, attributeFilter: ['aria-hidden'], subtree: true });
  });

  await press(page, 'Enter');
  await expectFocus(page, 'Add to My List');
  await press(page, 'Escape');
  await expectFocus(page, 'Under the Dome', 'rail-trending');
  await press(page, 'ArrowDown', 'Enter');
  await expectFocus(page, 'Add to My List');

  const hidden = await page.evaluate(() => (window as unknown as { hiddenWhileFocused: string[] }).hiddenWhileFocused);
  expect(hidden).toEqual([]);
});

test('removing from detail empties My List', async ({ page }) => {
  await press(page, 'Enter', 'Enter'); // open, add
  await expect(page.getByRole('button', { name: 'In My List' })).toBeVisible();
  await press(page, 'Enter'); // remove
  await expect(page.getByRole('button', { name: 'Add to My List' })).toBeVisible();

  await page.getByRole('tab', { name: 'My List' }).click();
  await expect(page.getByText('Your list is empty.')).toBeVisible();
});
