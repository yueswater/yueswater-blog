// Playwright config for the security specs. Reuses a running dev server; every Supabase request is
// mocked inside the specs, so nothing here can reach the real project.
const { defineConfig, devices } = require('@playwright/test');
const path = require('node:path');
const { BASE_URL, PORT } = require('../contact/e2e/support/server');

const results = path.join(__dirname, '.results');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.js',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [
    [path.join(__dirname, 'reporters', 'progress.js')],
    ['html', { outputFolder: path.join(results, 'html'), open: 'never' }],
  ],
  outputDir: path.join(results, 'artifacts'),
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
