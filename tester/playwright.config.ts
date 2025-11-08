import { defineConfig, devices } from '@playwright/test';

// Dynamically set the base URL depending on environment
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // 👇 Automatically use the correct base URL
    baseURL: BASE_URL,

    // Collect trace when retrying failed tests
    trace: 'on-first-retry',
  },
  timeout: 60000, // each test can run up to 60 seconds
  expect: {
    timeout: 15000, // expect(...) waits up to 15 seconds
  },

  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // You can re-enable Chrome/WebKit if needed:
    // { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Optional: start a dev server automatically (for local use only)
  // Uncomment if you want `npx playwright test` to auto-start the frontend locally.
  /*
  webServer: {
    command: 'npm run dev --prefix ../frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  */
});

