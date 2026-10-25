import { defineConfig, devices } from '@playwright/test';

const PORT = 8090;

// Web end-to-end: drives real arrow keys in Chromium at a 1920x1080 ten-foot layout,
// where layout-dependent focus behaviour can actually be measured (jsdom has no layout).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { CI: '1' }, // keeps the Expo CLI non-interactive
  },
});
