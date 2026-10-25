import { expect, test } from '@playwright/test';

import { expectFocus, openHome, press } from './helpers';

// Fixture order: Trending starts Under the Dome, Person of Interest…; Top Rated starts
// Breaking Bad, Firefly, Game of Thrones…

test.beforeEach(async ({ page }) => {
  await openHome(page);
  await expectFocus(page, 'Under the Dome', 'rail-trending');
});

test('first tile takes initial focus and the brand stays in view', async ({ page }) => {
  await expect(page.getByLabel('StreamShelf', { exact: true })).toBeInViewport();
});

test('left/right moves along a rail', async ({ page }) => {
  await press(page, 'ArrowRight', 'ArrowRight');
  await expectFocus(page, 'True Detective', 'rail-trending');
  await press(page, 'ArrowLeft');
  await expectFocus(page, 'Person of Interest', 'rail-trending');
});

test('up from the top rail stays put', async ({ page }) => {
  await press(page, 'ArrowUp');
  await expectFocus(page, 'Under the Dome', 'rail-trending');
});

test('entering a rail restores its last focused tile', async ({ page }) => {
  await press(page, 'ArrowDown');
  await expectFocus(page, 'Breaking Bad', 'rail-top-rated');
  await press(page, 'ArrowRight', 'ArrowRight');
  await expectFocus(page, 'Game of Thrones', 'rail-top-rated');

  await press(page, 'ArrowUp');
  await expectFocus(page, 'Under the Dome', 'rail-trending');
  await press(page, 'ArrowDown');
  await expectFocus(page, 'Game of Thrones', 'rail-top-rated');
});

test('sidebar is reachable with left and returns to the last tile with right', async ({ page }) => {
  await press(page, 'ArrowRight');
  await expectFocus(page, 'Person of Interest');
  await press(page, 'ArrowLeft', 'ArrowLeft');
  await expectFocus(page, 'Home', 'nav');
  await press(page, 'ArrowRight');
  await expectFocus(page, 'Under the Dome', 'rail-trending');
});

test('Enter activates sidebar items and Escape goes back', async ({ page }) => {
  await press(page, 'ArrowLeft', 'ArrowDown');
  await expectFocus(page, 'My List', 'nav');
  await press(page, 'Enter');
  await expect(page.getByText('Your list is empty.')).toBeVisible();

  await press(page, 'Escape');
  await expect(page.getByText('Trending')).toBeVisible();
});

test('the focused tile draws its own focus ring, not the browser outline', async ({ page }) => {
  const tile = page.getByRole('button', { name: 'Under the Dome' }).first();
  await expect(tile).toHaveCSS('outline-style', 'none');
  await expect(tile.locator('> div').first()).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
});
