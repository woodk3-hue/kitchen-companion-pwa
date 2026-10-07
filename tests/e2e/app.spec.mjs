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
