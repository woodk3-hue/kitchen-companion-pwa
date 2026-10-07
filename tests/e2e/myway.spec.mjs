// Recipe from a photo (Claude faked), and Make it my way: swapping ingredients updates the macros.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore, waitForStarterRecipes, fakeClaude } from './helpers.mjs';

test('a recipe photo is read into the Add recipe form, and macros are worked out on save', async ({ page }) => {
  const errors = watchErrors(page);
  await fakeClaude(page, { found: { found: true, name: "Nana's Chicken Curry", cuisine: 'Anglo-Indian', mealTypes: ['Dinner'], servings: 6, prepMinutes: 20, cookMinutes: 50, caloriesPerServing: 0,
    ingredients: [{ name: 'Chicken thigh', quantity: 1200, unit: 'g', prepNote: '', optional: false }, { name: 'Onions', quantity: 3, unit: 'each', prepNote: 'sliced', optional: false }, { name: 'Ghee', quantity: 2, unit: 'tbsp', prepNote: '', optional: false }],
    method: ['Fry the onions.', 'Add the chicken and simmer.'], notes: '' } });
  await open(page, 'recipes', '#photo-recipe-btn');
  await page.click('#photo-recipe-btn');
  await page.setInputFiles('#rp-file', ['../icon-512.png', '../icon-192.png']);
  await expect(page.locator('#rp-go')).toHaveText('Read the recipe (2 photos)');
  await page.click('#rp-go');
  await expect(page.locator('#r-name')).toHaveValue("Nana's Chicken Curry");
  await expect(page.locator('#r-ingredients')).toHaveValue(/1200 g Chicken thigh/);
  await page.click('#recipe-form button[type="submit"]');
  await expect.poll(async () => (await readStore(page, 'recipes')).find((r) => r.name === "Nana's Chicken Curry")?.caloriesPerServing).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('make it my way: swap lamb for chicken breast, use a packet spice mix, save as my version', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Railway Lamb');
  await page.locator('.recipe-card').first().click();
  await page.click('#myway-recipe-btn');
  const kcal = page.locator('#mw-macros .mt-kcal .mt-v');
  await expect(kcal).toContainText('440');
  await page.locator('.mw-row', { hasText: /lamb/i }).first().locator('.mw-idea').first().click();
  await expect(page.locator('.mw-row.swapped').first()).toContainText('chicken breast');
  await page.click('#mw-spice');
  await expect(page.locator('.mw-row.added')).toContainText('spice mix');
  const after = parseInt(await kcal.innerText(), 10);
  expect(after).toBeLessThan(440);
  expect(after).toBeGreaterThan(200);
  await page.click('#mw-save-new');
  await expect.poll(async () => (await readStore(page, 'recipes')).find((r) => r.name === 'Railway Lamb Curry (my way)')?.caloriesPerServing).toBe(after);
  // The original is left as it was
  expect((await readStore(page, 'recipes')).find((r) => r.name === 'Railway Lamb Curry').caloriesPerServing).toBe(440);
  expect(errors).toEqual([]);
});
