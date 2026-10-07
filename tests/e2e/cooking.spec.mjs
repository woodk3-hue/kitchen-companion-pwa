// I cooked this: ingredients come out, my portion is logged, leftovers go to the fridge and freezer.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore, addItem, waitForStarterRecipes } from './helpers.mjs';

test('cook 4, eat 1, 2 in the fridge, 1 in the freezer, then eat a leftover', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await addItem(page, { name: 'Chicken thigh', quantity: 1, unit: 'kg', location: 'fridge', states: ['Fresh', 'Raw'], category: 'Protein' });

  await reopen(page, 'recipes', '.recipe-card');
  await page.fill('#recipe-search', 'Home-Style Chicken');
  await page.locator('.recipe-card').first().click();
  await page.click('#cooked-recipe-btn');
  await expect(page.locator('#ck-made')).toHaveValue('4');
  await page.fill('#ck-eaten', '1');
  await expect(page.locator('#ck-left')).toContainText('3 portions left over');
  await expect(page.locator('#ck-fridge')).toHaveValue('3');
  await page.click('.step-btn[data-for="ck-freezer"][data-d="1"]');
  await expect(page.locator('#ck-fridge')).toHaveValue('2');
  await expect(page.locator('#ck-check')).toContainText('4 made = 1 eaten + 2 fridge + 1 freezer');
  await page.click('#log-meal button[data-val="lunch"]');
  await expect(page.locator('.cook-use', { hasText: 'Chicken thigh' }).locator('.ck-use-qty')).toHaveValue('0.8');
  await page.click('#ck-save');
  await expect.poll(async () => (await readStore(page, 'foodLog')).length).toBe(1);

  const items = await readStore(page, 'inventoryItems');
  expect(items.find((i) => i.name === 'Chicken thigh').quantity).toBeCloseTo(0.2);
  const portions = items.filter((i) => i.recipeId).map((i) => `${i.location}:${i.portionCount}`).sort();
  expect(portions).toEqual(['freezer:1', 'leftovers:2']);
  const log = await readStore(page, 'foodLog');
  expect(log).toHaveLength(1);
  expect(log[0]).toMatchObject({ meal: 'lunch', source: 'cooked', kcal: 420, protein: 38, carbs: 15, fat: 23 });

  // Eat one fridge portion for dinner
  await reopen(page, 'home', '.diary-add');
  await page.click('.diary-add[data-meal="dinner"]');
  await page.click('.add-food-opt[data-how="kitchen"]');
  await page.locator('#lk-list .pick-row', { hasText: 'Home-Style' }).first().click();
  await page.click('#lo-save');
  await expect.poll(async () => (await readStore(page, 'inventoryItems')).find((i) => i.location === 'leftovers')?.portionCount).toBe(1);
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
  await expect(page.locator('#serves-val')).toHaveText('6');
  await expect(firstQty).toHaveText('900 g');
  await expect(page.locator('.macro-tiles')).toContainText('Protein');
  await page.click('#cooked-recipe-btn');
  await expect(page.locator('#ck-made')).toHaveValue('6');
});
