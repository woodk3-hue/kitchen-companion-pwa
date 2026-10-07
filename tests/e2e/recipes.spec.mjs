// Starter recipes, quick-meal and eating-style filters, and the eating style setting.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore, waitForStarterRecipes } from './helpers.mjs';

test('quick and eating-style filters narrow the recipe list', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '.recipe-card');
  const cards = page.locator('.recipe-card');
  const total = await cards.count();
  expect(total).toBeGreaterThanOrEqual(30);

  const check = async (selector, expectName) => {
    await page.click(selector);
    // The list redraws with the chip; wait for it before counting
    await expect(page.locator(selector)).toHaveClass(/selected/);
    await expect(cards.first()).toBeVisible();
    const n = await cards.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(total);
    if (expectName) await expect(page.locator('.recipe-card', { hasText: expectName }).first()).toBeVisible();
    await page.click(selector);
    await expect(page.locator(selector)).not.toHaveClass(/selected/);
    await expect(cards).toHaveCount(total);
  };
  await check('.recipe-time[data-mins="15"]', 'Omelette');
  await check('.recipe-time[data-mins="30"]', 'Stir Fry');
  await check('.recipe-filter[data-filter="lowCarb"]', 'Devil Chicken');
  await check('.recipe-filter[data-filter="keto"]', 'Tandoori');
  await check('.recipe-filter[data-filter="lowFat"]', 'Dal');

  // Keto recipes never list rice, pasta or potatoes as part of the dish
  await page.click('.recipe-filter[data-filter="keto"]');
  await expect(page.locator('.recipe-filter[data-filter="keto"]')).toHaveClass(/selected/);
  await expect(page.locator('.recipe-card', { hasText: 'Biryani' })).toHaveCount(0);
  await expect(page.locator('.recipe-card', { hasText: 'Bolognese' })).toHaveCount(0);

  await page.locator('.recipe-card', { hasText: 'Kerala Fish Curry' }).click();
  await expect(page.locator('.modal-scroll-area')).toContainText('skip the rice');
  await expect(page.locator('.modal-scroll-area')).toContainText('g carbs');
  expect(errors).toEqual([]);
});

test('choosing an eating style sets the daily macros', async ({ page }) => {
  await open(page, 'settings', '#goal-style');
  await page.click('#goal-style button[data-val="keto"]');
  await expect(page.locator('#goal-day-carbs')).toHaveValue('25');
  await expect(page.locator('#goal-day-fat')).toHaveValue('125');
  await expect.poll(async () => (await readStore(page, 'settings')).find((s) => s.key === 'healthGoals')?.eatingStyle).toBe('keto');
  await page.click('#goal-style button[data-val="low-fat"]');
  await expect(page.locator('#goal-day-fat')).toHaveValue('35');
});
