// The app opens, every tab draws, and the files needed to install it are there.
import { test, expect } from '@playwright/test';
import { watchErrors, open } from './helpers.mjs';

test('every tab opens without errors', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'home', '.diary-summary');
  for (const [route, title] of [['planner', 'Meal Planner'], ['recipes', 'Recipes'], ['kitchen', 'Kitchen'], ['shopping', 'Shopping'], ['settings', 'Settings'], ['home', 'Today']]) {
    await page.click(`.nav-btn[data-route="${route}"]`);
    await expect(page.locator('#header-title')).toHaveText(title);
  }
  expect(errors).toEqual([]);
});

test('install files are served', async ({ request }) => {
  const manifest = await (await request.get('/manifest.json')).json();
  expect(manifest.short_name).toBe('PantryFit');
  for (const icon of manifest.icons) expect((await request.get('/' + icon.src.replace(/^\.\//, ''))).ok()).toBeTruthy();
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).toMatch(/CACHE_NAME = 'pantryfit-v\d+'/);
  const seed = await (await request.get('/recipes-seed.json')).json();
  expect(seed.recipes.length).toBeGreaterThanOrEqual(30);
});

test('report a problem opens a prefilled bug report without personal data', async ({ page }) => {
  await page.addInitScript(() => { window.open = (url) => { window.__opened = url; }; });
  await open(page, 'settings', '#report-row');
  await page.click('#report-row');
  const url = decodeURIComponent(await page.evaluate(() => window.__opened));
  expect(url).toContain('github.com/woodk3-hue/kitchen-companion-pwa/issues/new');
  expect(url).toContain('Database version');
  expect(url).not.toContain('sk-ant');
});

test('dark mode follows the phone and can be switched in Settings', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page, 'settings', '#theme-pref');
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await theme()).toBe('dark');
  expect(await bg()).toBe('rgb(18, 20, 23)');

  await page.click('#theme-pref button[data-val="light"]');
  expect(await theme()).toBe('light');
  await page.reload();
  await page.waitForSelector('#theme-pref');
  expect(await theme()).toBe('light');
  await expect(page.locator('#theme-pref button[data-val="light"]')).toHaveClass(/selected/);

  await page.click('#theme-pref button[data-val="auto"]');
  expect(await theme()).toBe('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(theme).toBe('light');
  expect(errors).toEqual([]);
});
