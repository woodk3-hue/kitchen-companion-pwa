// Cuisine picker is a text input with datalist suggestions and accepts custom values.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore } from './helpers.mjs';

test('typing a built-in cuisine with the wrong case saves it with the right case', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Pad Thai');
  // Type lowercase; normaliseCuisine should match "Thai" and store the built-in casing
  await page.fill('#r-cuisine', 'thai');
  await page.fill('#r-ingredients', '200 g rice noodles');
  await page.click('#recipe-form button[type="submit"]');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Pad Thai');
  expect(r.cuisine).toBe('Thai');
  expect(errors).toEqual([]);
});

test('a custom cuisine saves verbatim and is offered in the datalist next time', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Fusion curry');
  await page.fill('#r-cuisine', 'thai-chinese fusion');
  await page.fill('#r-ingredients', '200 g chicken breast');
  await page.click('#recipe-form button[type="submit"]');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Fusion curry');
  // Title-cased, with the hyphen kept
  expect(r.cuisine).toBe('Thai-Chinese Fusion');

  // Open a second recipe form — the custom cuisine should be in the datalist
  await reopen(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  const datalistValues = await page.locator('#r-cuisine-list option').evaluateAll((els) => els.map((e) => e.value));
  expect(datalistValues).toContain('Thai-Chinese Fusion');
  expect(errors).toEqual([]);
});

test('the cuisine input is a text field with a datalist (not a select)', async ({ page }) => {
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  const input = page.locator('#r-cuisine');
  await expect(input).toHaveAttribute('list', 'r-cuisine-list');
  const tag = await input.evaluate((el) => el.tagName.toLowerCase());
  expect(tag).toBe('input');
});
