// Calories and macros worked out from built-in typical values, with no API key.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore } from './helpers.mjs';

test('a new recipe gets calories and macros from its ingredients', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Jasmine rice');
  await page.fill('#r-servings', '4');
  await page.fill('#r-ingredients', '240 g jasmine rice');
  await page.click('#recipe-form button[type="submit"]');
  await expect(page.locator('.macro-tiles')).toContainText('216');
  const rice = (await readStore(page, 'recipes')).find((r) => r.name === 'Jasmine rice');
  expect(rice).toMatchObject({ caloriesPerServing: 216, proteinGramsPerServing: 4, carbsGramsPerServing: 47, fatGramsPerServing: 0 });
  // Plain rice isn't high protein, whatever the form's default level was
  await expect(page.locator('.modal-scroll-area .tag-protein')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a kitchen item gets typical values from its name', async ({ page }) => {
  await open(page, 'kitchen', '#fab-btn');
  await page.click('#fab-btn');
  await page.fill('#f-name', 'Jasmine rice');
  await expect(page.locator('#f-kcal')).toHaveValue('360');
  await expect(page.locator('#f-carbs')).toHaveValue('79');
  await page.click('#item-form button[type="submit"]');
  await expect.poll(async () => (await readStore(page, 'inventoryItems')).find((i) => i.name === 'Jasmine rice')?.caloriesSource).toBe('typical');
});

test('quick add without an API key uses typical values for "amount + food"', async ({ page }) => {
  await open(page, 'home', '.diary-add');
  await page.click('.diary-add[data-meal="lunch"]');
  await page.click('.add-food-opt[data-how="quick"]');
  await page.fill('#qa-name', '60 g jasmine rice');
  await page.click('#qa-estimate');
  await expect(page.locator('#qa-kcal')).toHaveValue('216');
});

for (const [label, ingredients, notes] of [
  ['amount first', '240 g jasmine rice', ''],
  ['amount after the name', 'Jasmine rice 240 grams', ''],
  ['amount with no space', 'jasmine rice - 240g', ''],
  ['only an amount in ingredients', '240 grams', ''],
  ['amount only in the notes', '', 'Cook 240 grams in the rice cooker']
]) {
  test(`rice macros work with the ${label}`, async ({ page }) => {
    await open(page, 'recipes', '#recipe-list');
    await page.click('#fab-btn');
    await page.fill('#r-name', 'Jasmine rice');
    await page.fill('#r-servings', '4');
    await page.fill('#r-ingredients', ingredients);
    if (notes) {
      await page.locator('details.more-fields').evaluate((d) => { d.open = true; });
      await page.fill('#r-notes', notes);
    }
    await page.click('#recipe-form button[type="submit"]');
    await expect(page.locator('.macro-tiles')).toContainText('216');
  });
}
