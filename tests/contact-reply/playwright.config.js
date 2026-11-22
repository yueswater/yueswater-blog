// Playwright config for the admin reply feature. Demo backend + mocked Supabase: nothing reaches the
// real project or Resend. The dev server is reused when already running.
const { defineConfig, devices } = require('@playwright/test');
const path = require('node:path');
const { BASE_URL, PORT } = require('../contact/e2e/support/server');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.js',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  outputDir: path.join(__dirname, '.results'),
  use: { baseURL: BASE_URL, trace: 'retain-on-failure', viewport: { width: 1280, height: 900 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
  webServer: {
    command: `npx hexo server -p ${PORT}`,
    cwd: path.join(__dirname, '..', '..'),
    url: `${BASE_URL}/contact/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
