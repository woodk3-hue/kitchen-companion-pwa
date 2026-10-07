// I cooked this: ingredients come out, my portion is logged, leftovers go to the fridge and freezer.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore, addItem, waitForStarterRecipes } from './helpers.mjs';

test('cook 4: 1 for me, 1 for my partner, 1 in the fridge, 1 in the freezer, then eat the leftover', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await addItem(page, { name: 'Chicken thigh', quantity: 1, unit: 'kg', location: 'fridge', states: ['Fresh', 'Raw'], category: 'Protein' });

  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Home-Style Chicken');
  await page.locator('.recipe-card').first().click();
  await page.click('#cooked-recipe-btn');
  await expect(page.locator('#ck-made')).toHaveValue('4');
  // Starts as 1 me, 1 partner, 2 in the fridge; one tap moves a fridge portion to the freezer
  await expect(page.locator('#ck-me')).toHaveValue('1');
  await expect(page.locator('#ck-partner')).toHaveValue('1');
  await expect(page.locator('#ck-fridge')).toHaveValue('2');
  await page.click('.step-btn[data-for="ck-freezer"][data-d="1"]');
  await expect(page.locator('#ck-fridge')).toHaveValue('1');
  await expect(page.locator('#ck-freezer')).toHaveValue('1');
  await expect(page.locator('#ck-check')).toContainText('All 4 placed');
  await expect(page.locator('#ck-dots .pdot')).toHaveCount(4);
  await page.click('#log-meal button[data-val="lunch"]');
  await expect(page.locator('.cook-use', { hasText: 'Chicken thigh' }).locator('.ck-use-qty')).toHaveValue('0.8');
  await page.click('#ck-save');
  await expect.poll(async () => (await readStore(page, 'foodLog')).length).toBe(1);

  const items = await readStore(page, 'inventoryItems');
  expect(items.find((i) => i.name === 'Chicken thigh').quantity).toBeCloseTo(0.2);
  const portions = items.filter((i) => i.recipeId).map((i) => `${i.location}:${i.portionCount}`).sort();
  expect(portions).toEqual(['freezer:1', 'leftovers:1']);
  const log = await readStore(page, 'foodLog');
  expect(log).toHaveLength(1);
  expect(log[0]).toMatchObject({ meal: 'lunch', source: 'cooked', kcal: 420, protein: 38, carbs: 15, fat: 23 });

  // Eat one fridge portion for dinner
  await reopen(page, 'home', '.diary-add');
  await page.click('.diary-add[data-meal="dinner"]');
  await page.click('.add-food-opt[data-how="kitchen"]');
  await page.locator('#lk-list .pick-row', { hasText: 'Home-Style' }).first().click();
  await page.click('#lo-save');
  await expect.poll(async () => (await readStore(page, 'inventoryItems')).filter((i) => i.location === 'leftovers').length).toBe(0);
  expect(errors).toEqual([]);
});

test('changing serves scales the ingredient amounts', async ({ page }) => {
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Kofta');
  await page.locator('.recipe-card').first().click();
  const firstQty = page.locator('#ingredients-box .ing-qty').first();
  await expect(firstQty).toHaveText('600 g');
  await page.click('#serves-up');
  await page.click('#serves-up');
  await expect(page.locator('#serves-val')).toHaveValue('6');
  await expect(page.locator('#cooked-recipe-btn')).toContainText('6 portions');
  await expect(firstQty).toHaveText('900 g');
  await expect(page.locator('.macro-tiles')).toContainText('Protein');
  await page.click('#cooked-recipe-btn');
  await expect(page.locator('#ck-made')).toHaveValue('6');
});

test('recipe amounts can be shown in grams instead of spoons and cups', async ({ page }) => {
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Tadka Dal');
  await page.locator('.recipe-card').first().click();
  const turmeric = page.locator('#ingredients-box li', { hasText: 'Turmeric' }).locator('.ing-qty');
  await expect(turmeric).toHaveText(/tsp/);
  await page.click('#measure-pref button[data-val="grams"]');
  await expect(turmeric).toHaveText(/^[\d.]+ g$/);
  // Remembered next time
  await page.click('#modal-close');
  await page.locator('.recipe-card').first().click();
  await expect(page.locator('#measure-pref button[data-val="grams"]')).toHaveClass(/selected/);
});
