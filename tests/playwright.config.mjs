// Browser tests for PantryFit. Run from this folder with: npm test
// The app is served as plain files from the repository root, exactly like GitHub Pages.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Pixel 7'],
    timezoneId: 'Australia/Brisbane',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'phone', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore'
  }
});
