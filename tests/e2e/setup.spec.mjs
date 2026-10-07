// First-run setup wizard: pick household, goals, cuisines and starter recipes.
import { test, expect } from '@playwright/test';
import { watchErrors, readStore } from './helpers.mjs';

test('fresh install opens the setup wizard, picks starter recipes by cuisine', async ({ page }) => {
  const errors = watchErrors(page);
  // Fresh install (no skipSetup flag), the wizard shows and holds back the starter recipes
  await page.goto('/index.html#home');
  await page.waitForSelector('.sw-nav');
  await expect(page.locator('.modal-title-row h2')).toContainText('Welcome');
  await page.click('#sw-next'); // welcome → household
  await page.fill('#sw-household', '2');
  await page.click('#sw-next'); // → goals
  await expect(page.locator('#sw-style')).toBeVisible();
  await page.click('#sw-next'); // → cuisines
  // Clear every pre-selected cuisine and pick only Indian
  while (await page.locator('#sw-cuisines button.selected').count()) {
    await page.locator('#sw-cuisines button.selected').first().click();
  }
  await page.locator('#sw-cuisines button[data-val="Indian"]').click();
  await page.click('#sw-next'); // → starters
  await page.waitForSelector('.sw-starter-list');
  // Should see Indian recipes only
  await expect(page.locator('.sw-starter-list li')).not.toHaveCount(0);
  const names = await page.locator('.sw-starter-list .sw-starter-row small').allTextContents();
  for (const n of names) expect(n.toLowerCase()).toContain('indian');
  await page.click('#sw-next'); // finish
  await expect(page.locator('#modal-overlay.open')).toHaveCount(0);
  // Only Indian recipes made it into the recipe book
  await expect.poll(async () => (await readStore(page, 'recipes')).length).toBeGreaterThan(0);
  const recipes = await readStore(page, 'recipes');
  for (const r of recipes) expect(r.cuisine).toBe('Indian');
  // Setup flag written
  const settings = await readStore(page, 'settings');
  expect(settings.find((s) => s.key === 'setupComplete')).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Settings has Run setup again at the top and backup at the bottom', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('pantryfit.skipSetup', '1'); } catch (_) {} });
  await page.goto('/index.html#settings');
  await page.waitForSelector('#setup-row');
  // Setup row is above the Appearance heading
  const headings = await page.locator('.section-heading h2').allTextContents();
  expect(headings[0]).toBe('Appearance');
  expect(headings[headings.length - 1]).toBe('Backup');
  // Export/Import rows exist under the Backup heading
  await expect(page.locator('#export-row')).toBeVisible();
  await expect(page.locator('#import-row')).toBeVisible();
  await expect(page.locator('#import-recipes-row')).toBeVisible();
});
