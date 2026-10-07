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

test('a scanned curry-mix packet replaces the generic mix, with its own values', async ({ page }) => {
  const errors = watchErrors(page);
  await page.route('https://world.openfoodfacts.org/**', (route) => route.fulfill({
    status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: JSON.stringify({ status: 1, product: { product_name: 'Butter Chicken Spice Mix', brands: 'Masterfoods', quantity: '35 g', product_quantity: 35, product_quantity_unit: 'g', categories_tags: ['en:spices'], serving_quantity: 9, nutriments: { 'energy-kcal_100g': 320, proteins_100g: 8, carbohydrates_100g: 50, fat_100g: 9 } } })
  }));
  await page.addInitScript(() => { window.BarcodeDetector = undefined; });
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Railway Lamb');
  await page.locator('.recipe-card').first().click();
  await page.click('#myway-recipe-btn');
  await page.click('#mw-spice');
  await expect(page.locator('.mw-row.added')).toHaveCount(1);
  await page.click('#mw-scan');
  await page.fill('#bc-manual', '9300633000000');
  await page.click('#bc-manual-go');
  await expect(page.locator('#pk-name')).toHaveValue('Masterfoods Butter Chicken Spice Mix');
  await expect(page.locator('#pk-grams')).toHaveValue('35');
  // Use 3 tablespoons in the recipe; the packet goes in the pantry
  await page.locator('.pk-chip', { hasText: '3 tbsp' }).click();
  await expect(page.locator('#pk-pantry')).toBeChecked();
  await page.click('#bc-action');
  // Back in Make it my way: the generic mix is replaced, the earlier changes are kept
  await expect(page.locator('.mw-row.added')).toHaveCount(1);
  await expect(page.locator('.mw-row.added')).toContainText('3 tbsp Masterfoods Butter Chicken Spice Mix');
  await expect(page.locator('.mw-row.added')).toContainText('from the barcode: 320 kcal');
  const pantry = (await readStore(page, 'inventoryItems')).find((i) => i.barcode === '9300633000000');
  expect(pantry).toMatchObject({ location: 'pantry', quantity: 35, unit: 'g', caloriesPer100: 320 });
  await expect(page.locator('.mw-row.removed').first()).toBeVisible();
  await page.click('#mw-save-new');
  await expect.poll(async () => (await readStore(page, 'recipes')).find((r) => r.name === 'Railway Lamb Curry (my way)')?.ingredients.find((i) => i.nutrition)?.nutrition.kcal).toBe(320);
  // Cooking it takes the 3 tbsp (about 27 g) out of the packet in the pantry
  await page.click('#cooked-recipe-btn');
  await expect(page.locator('.cook-use', { hasText: 'Spice Mix' }).locator('.ck-use-qty')).toHaveValue('27');
  expect(errors).toEqual([]);
});

test('a packet label photo can be read for its values (faked)', async ({ page }) => {
  await fakeClaude(page, { packAmount: { found: true, name: 'Curry Paste', kind: 'other', servingDescription: '1 tbsp (20 g)', servingAmount: 20, servingUnit: 'g', perServing: { kcal: 30, protein: 0.4, carbs: 2, fat: 2 }, per100: { kcal: 150, protein: 2, carbs: 10, fat: 11 }, fromLabel: true, packAmount: 200 } });
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Egg Curry');
  await page.locator('.recipe-card').first().click();
  await page.click('#myway-recipe-btn');
  await page.click('#mw-label');
  await page.setInputFiles('#pk-file', '../icon-192.png');
  await page.click('#pk-go');
  await expect(page.locator('#pk-name')).toHaveValue('Curry Paste');
  await page.locator('.pk-chip', { hasText: '1 serve' }).click();
  await page.click('#pk-go');
  await expect(page.locator('.mw-row.added')).toContainText('20 g Curry Paste');
  await expect(page.locator('.mw-row.added')).toContainText('from the label');
});
