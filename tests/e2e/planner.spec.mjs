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
