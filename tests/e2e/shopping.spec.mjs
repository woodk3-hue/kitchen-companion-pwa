// Shopping list: add, running low, tick, and put bought things into the kitchen.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore, addItem } from './helpers.mjs';

test('typed items and running-low items go into the kitchen when ticked', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'shopping', '#shop-new');
  await addItem(page, { name: 'Basmati rice', quantity: 2, unit: 'kg', location: 'pantry', states: ['Raw'], category: 'Carbs & Grains' });
  await addItem(page, { name: 'Onions', quantity: 1, unit: 'each', location: 'pantry', states: ['Raw'], category: 'Vegetables' });

  // Mark onions as running low from the kitchen
  await reopen(page, 'kitchen', '.item-card');
  await page.locator('.item-card', { hasText: 'Onions' }).click();
  await page.click('#low-item-btn');
  await expect(page.locator('.item-card', { hasText: 'Onions' })).toContainText('Running low');

  await reopen(page, 'shopping', '#shop-new');
  await page.fill('#shop-new', '1 kg basmati rice');
  await page.press('#shop-new', 'Enter');
  await expect(page.locator('.shop-row', { hasText: 'Basmati rice' })).toBeVisible();
  await page.fill('#shop-new', '2 L milk');
  await page.click('#shop-new-add');
  await expect(page.locator('.shop-row')).toHaveCount(3);

  for (const name of ['Basmati rice', 'Milk', 'Onions']) {
    await page.locator('.shop-row', { hasText: name }).locator('.shop-tick').click();
    await expect(page.locator('.shop-row.done', { hasText: name })).toBeVisible();
  }
  await page.click('#shop-to-kitchen');
  await page.locator('.sk-row', { hasText: 'Onions' }).locator('.sk-qty').fill('3');
  await page.click('#sk-save');
  await expect(page.locator('.empty-state')).toBeVisible();

  const items = await readStore(page, 'inventoryItems');
  const byName = Object.fromEntries(items.map((i) => [i.name, i]));
  expect(byName['Basmati rice'].quantity).toBe(3);
  expect(byName.Onions.quantity).toBe(4);
  expect(byName.Onions.runningLow).toBe(false);
  expect(byName.Milk.location).toBe('fridge');
  expect(errors).toEqual([]);
});
