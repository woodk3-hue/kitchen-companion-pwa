// Swap-suggestion safeguards: prepared meals / ready-meal brand names must not
// be offered as a swap for a raw ingredient.
import { test, expect } from '@playwright/test';
import { watchErrors, open } from './helpers.mjs';

async function addKitchenItem(page, name) {
  await page.evaluate(async (n) => {
    const now = new Date().toISOString();
    await new Promise((resolve) => {
      const r = indexedDB.open('KitchenCompanionDB');
      r.onsuccess = (e) => {
        const tx = e.target.result.transaction('inventoryItems', 'readwrite');
        tx.objectStore('inventoryItems').put({
          name: n, quantity: 1, unit: 'each', location: 'freezer',
          states: ['Frozen'], category: 'Other', createdAt: now, updatedAt: now
        }).onsuccess = () => resolve();
      };
    });
  }, name);
}

async function addRecipeAndOpen(page, name, ingredients) {
  await page.click('#fab-btn');
  await page.fill('#r-name', name);
  await page.fill('#r-servings', '4');
  await page.fill('#r-ingredients', ingredients);
  await page.click('#recipe-form button[type="submit"]');
  // The detail opens in the same modal after save
  await page.waitForSelector('.ingredient-list');
}

test('a ready-meal "High protein chicken biryani" is never offered as a swap for raw chicken breast', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await addKitchenItem(page, 'High protein chicken biryani');
  await addRecipeAndOpen(page, 'Chicken bake', '600 g raw chicken breast (cut into pieces)');
  await expect(page.locator('.ing-swap-chip', { hasText: /biryani/i })).toHaveCount(0);
  // And no swap chip at all for the chicken line (nothing in the kitchen qualifies)
  await expect(page.locator('.ing-swap-chip')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a "my muscle chef" style ready meal is skipped too', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await addKitchenItem(page, 'My Muscle Chef chicken pesto pasta');
  await addRecipeAndOpen(page, 'Pasta night', '500 g chicken breast');
  await expect(page.locator('.ing-swap-chip', { hasText: /muscle chef|pasta/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a plain in-family kitchen item is still suggested (gingelly oil → olive oil)', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  for (const n of ['Olive oil', 'Grapeseed oil']) await addKitchenItem(page, n);
  await addRecipeAndOpen(page, 'Fish curry', '2 tbsp gingelly oil');
  await expect(page.locator('.ing-swap-chip', { hasText: /olive oil/i })).toBeVisible();
  expect(errors).toEqual([]);
});
