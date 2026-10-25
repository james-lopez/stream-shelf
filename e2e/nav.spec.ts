import { expect, test, type Page } from '@playwright/test';

import { expectFocus, openHome, press } from './helpers';

// Sidebar sections behave like tabs over a Home root: switching never builds Back history.

const onHome = (page: Page) => expect(page.getByText('Trending')).toBeVisible();
const onMyList = (page: Page) => expect(page.getByText('Your list is empty.')).toBeVisible();

test.beforeEach(async ({ page }) => {
  await openHome(page);
  await expectFocus(page, 'Under the Dome', 'rail-trending');
});

test('switching sections back and forth leaves no Back history', async ({ page }) => {
  await press(page, 'ArrowLeft', 'ArrowDown', 'Enter'); // sidebar → My List
  await onMyList(page);
  await press(page, 'ArrowUp', 'Enter'); // sidebar → Home
  await onHome(page);

  await press(page, 'Escape');
  await onHome(page);
  await expect(page.getByText('Your list is empty.')).toBeHidden();
});

test('Back from My List returns to Home', async ({ page }) => {
  await press(page, 'ArrowLeft', 'ArrowDown', 'Enter');
  await onMyList(page);
  await press(page, 'Escape');
  await onHome(page);
});

test('Home stays mounted across a section switch, keeping its focus memory', async ({ page }) => {
  await page.evaluate(() => {
    document.getElementById('focus-guide-screen-home')!.dataset.marker = 'original';
  });
  // Trending remembers Person of Interest; a remounted Home would forget it and land on
  // Under the Dome. Leave via Top Rated so the path to the sidebar doesn't pass tile 1.
  await press(page, 'ArrowRight', 'ArrowDown');
  await expectFocus(page, 'Breaking Bad', 'rail-top-rated');
  await press(page, 'ArrowLeft', 'ArrowDown', 'Enter'); // sidebar → My List
  await onMyList(page);
  await press(page, 'ArrowUp', 'Enter', 'ArrowRight'); // sidebar Home → nearest rail (Trending)

  await expectFocus(page, 'Person of Interest', 'rail-trending');
  const marker = await page.evaluate(() => document.getElementById('focus-guide-screen-home')?.dataset.marker);
  expect(marker).toBe('original');
});

test('Browse shows pops back to Home rather than stacking another', async ({ page }) => {
  await press(page, 'ArrowLeft', 'ArrowDown', 'Enter', 'ArrowRight'); // My List, into its content
  await expectFocus(page, 'Browse shows');
  await press(page, 'Enter');
  await onHome(page);

  await press(page, 'Escape');
  await onHome(page);
  await expect(page.getByText('Your list is empty.')).toBeHidden();
});

test('a section switch from detail drops the detail page', async ({ page }) => {
  await press(page, 'Enter');
  await expectFocus(page, 'Add to My List');
  await page.getByRole('tab', { name: 'My List' }).click();
  await onMyList(page);

  await press(page, 'Escape');
  await onHome(page);
});
