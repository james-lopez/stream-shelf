import { expect, test } from '@playwright/test';

import { openHome } from './helpers';

test('rails show skeletons while loading, then tiles', async ({ page }) => {
  await openHome(page, '&latency=1500');
  await expect(page.getByLabel('Loading Trending')).toBeVisible();
  await expect(page.getByTestId('rail-title-loading')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Under the Dome' }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByLabel('Loading Trending')).toHaveCount(0);
  await expect(page.getByText('Drama', { exact: true })).toBeVisible();
});

test('each rail shows its own error with a focusable retry', async ({ page }) => {
  await openHome(page, '&fail=1');
  await expect(page.getByText("Couldn't load Trending.")).toBeVisible();
  await expect(page.getByText("Couldn't load Top Rated.")).toBeVisible();
  await expect(page.getByText("Couldn't load By Genre.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(3);
});

test('posters fall back to the title when artwork fails', async ({ page }) => {
  await openHome(page); // artwork requests are aborted
  const tile = page.getByRole('button', { name: 'Firefly' }).first();
  await expect(tile.getByTestId('poster-missing')).toBeVisible();
  await expect(tile.getByTestId('poster-image')).toHaveCount(0);
});

test('posters fade in once artwork loads', async ({ page }) => {
  await openHome(page, '', { images: true });
  const image = page.getByRole('button', { name: 'Under the Dome' }).first().getByTestId('poster-image');
  await expect(image).toHaveCSS('opacity', '1', { timeout: 10_000 });
});
