// Planning a meal: choose how many portions you'll have; calories follow.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore } from './helpers.mjs';

test('plan 1 portion of a 4-serve recipe, change it to 2, then eat it', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Jasmine rice');
  await page.fill('#r-servings', '4');
  await page.fill('#r-ingredients', '240 g jasmine rice');
  await page.click('#recipe-form button[type="submit"]');
  await expect(page.locator('.macro-tiles')).toContainText('216');

  await page.click('#plan-recipe-btn');
  await expect(page.locator('#plan-portions')).toHaveValue('1');
  await page.locator('.plan-pick:not([disabled])').first().click();
  await expect.poll(async () => (await readStore(page, 'mealPlans'))[0]?.portions).toBe(1);

  await reopen(page, 'planner', '.plan-slot.filled');
  const slot = page.locator('.plan-slot.filled').first();
  await expect(slot).toContainText('1 portion');
  await expect(slot).toContainText('216 kcal');
  await slot.click();
  await page.click('.pp-btn[data-d="1"]');
  await expect.poll(async () => (await readStore(page, 'mealPlans'))[0]?.portions).toBe(2);
  await page.click('#modal-close');
  await expect(page.locator('.plan-slot.filled').first()).toContainText('432 kcal');

  await reopen(page, 'home', '.diary-planned');
  await expect(page.locator('.diary-planned').first()).toContainText('2 portions');
  await page.locator('.diary-ate').first().click();
  await expect(page.locator('#ck-me')).toHaveValue('2');
  expect(errors).toEqual([]);
});

test('describing a plate (no API key) logs it, and it shows in the planner', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'home', '.diary-add');
  await page.click('.diary-add[data-meal="dinner"]');
  await page.click('.add-food-opt[data-how="photo"]');
  await page.fill('#pp-text', '150 g chicken curry, 120 g cooked rice, some pickle');
  await page.click('#pp-action');
  await expect(page.locator('.ps-row')).toHaveCount(2);
  await expect(page.locator('#pp-body')).toContainText('Not counted');
  await page.click('#pp-action');
  await expect.poll(async () => (await readStore(page, 'foodLog')).length).toBe(2);

  await reopen(page, 'planner', '.plan-day.today');
  const today = page.locator('.plan-day.today');
  await expect(today.locator('.plan-slot.type-logged')).toHaveCount(2);
  await expect(today).toContainText('✓ Eaten');

  // Removing a diary entry removes it from the planner too
  await reopen(page, 'home', '.diary-entry');
  await page.locator('.diary-entry').first().click();
  await page.click('#le-delete');
  await expect.poll(async () => (await readStore(page, 'mealPlans')).filter((p) => p.type === 'logged').length).toBe(1);
  expect(errors).toEqual([]);
});

test('eating a planned meal ticks it off; removing the log un-ticks it', async ({ page }) => {
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Toast');
  await page.fill('#r-servings', '1');
  await page.fill('#r-ingredients', '2 slices bread');
  await page.click('#recipe-form button[type="submit"]');
  await page.click('#plan-recipe-btn');
  await page.locator('.plan-pick:not([disabled])').first().click();
  await reopen(page, 'home', '.diary-ate');
  await page.locator('.diary-ate').first().click();
  await page.click('#ck-save');
  await expect.poll(async () => (await readStore(page, 'mealPlans')).map((p) => `${p.type}:${!!p.eaten}`)).toEqual(['recipe:true']);
  await reopen(page, 'home', '.diary-entry');
  await page.locator('.diary-entry').first().click();
  await page.click('#le-delete');
  await expect.poll(async () => (await readStore(page, 'mealPlans')).map((p) => `${p.type}:${!!p.eaten}`)).toEqual(['recipe:false']);
});
