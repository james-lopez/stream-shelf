import { expect, type Page } from '@playwright/test';

/** Home on the offline fixtures, with poster art blocked unless a test opts in. */
export async function openHome(page: Page, query = '', { images = false } = {}) {
  if (!images) await page.route('https://static.tvmaze.com/**', (route) => route.abort());
  await page.goto(`/?source=fixtures${query}`);
}

/** The focused element's label and the focus region (rail, nav) it sits in. */
export function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return {
      label: el?.getAttribute('aria-label') ?? null,
      region: el?.closest('[id^="focus-guide-rail"], [id="focus-guide-nav"]')?.id.replace('focus-guide-', '') ?? null,
    };
  });
}

export async function expectFocus(page: Page, label: string, region?: string) {
  await expect.poll(() => focused(page)).toMatchObject(region ? { label, region } : { label });
}

export async function press(page: Page, ...keys: string[]) {
  for (const key of keys) await page.keyboard.press(key);
}
