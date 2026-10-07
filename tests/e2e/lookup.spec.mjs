// Wider food lookup: plurals, regional names, typos, prep-word stripping.
import { test, expect } from '@playwright/test';
import { watchErrors, open, readStore } from './helpers.mjs';

async function addRecipeAndSave(page, name, servings, ingredients) {
  await page.click('#fab-btn');
  await page.fill('#r-name', name);
  await page.fill('#r-servings', String(servings));
  await page.fill('#r-ingredients', ingredients);
  await page.click('#recipe-form button[type="submit"]');
}

test('a chicken breast recipe parses with the raw/skinless prep words stripped', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await addRecipeAndSave(page, 'Grilled chicken', 2, '400 g chicken breast, raw and skinless, trimmed');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Grilled chicken');
  expect(r.caloriesPerServing).toBeGreaterThan(180);
  expect(r.caloriesPerServing).toBeLessThan(260);
  expect(r.proteinGramsPerServing).toBeGreaterThanOrEqual(44);
  expect(errors).toEqual([]);
});

test('regional names like bell pepper, cilantro and ground beef resolve to the Aussie food', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await addRecipeAndSave(page, 'Taco mix', 4, '500 g ground beef\n160 g bell pepper, diced\n10 g cilantro, chopped');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Taco mix');
  // beef mince alone is ~250 kcal/serve; capsicum and coriander add a little
  expect(r.caloriesPerServing).toBeGreaterThan(230);
  expect(r.caloriesPerServing).toBeLessThan(320);
  expect(errors).toEqual([]);
});

test('plurals and typos are tolerated by the lookup', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  // "potatoes" → "potato", "tomatoe paste" → tomato paste alias, "jasmin rice" → jasmine rice (fuzzy)
  await addRecipeAndSave(page, 'Rice and spuds', 4, '240 g jasmin rice\n200 g potatoes\n30 g tomatoe paste');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Rice and spuds');
  // 864 kcal rice + 154 potato + 25 tomato paste ≈ 1043, /4 serves ≈ 260
  expect(r.caloriesPerServing).toBeGreaterThan(240);
  expect(r.caloriesPerServing).toBeLessThan(290);
  expect(errors).toEqual([]);
});

test('new foods in the expanded list are matched', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await addRecipeAndSave(page, 'Breakfast bowl', 1, '200 g greek yoghurt\n60 g muesli\n80 g blueberries');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Breakfast bowl');
  // greek yoghurt ~200 + muesli ~270 + blueberries ~40 ≈ 510
  expect(r.caloriesPerServing).toBeGreaterThan(430);
  expect(r.caloriesPerServing).toBeLessThan(600);
  expect(errors).toEqual([]);
});

test('the live breakdown panel shows a "≈ close match" tag on a typo', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Fuzzy test');
  await page.fill('#r-servings', '2');
  await page.fill('#r-ingredients', '240 g jasmin rice');
  // Wait for the live panel debounce
  await expect(page.locator('#r-live-list .r-live-tag.warn', { hasText: /close match/i })).toBeVisible();
  expect(errors).toEqual([]);
});
