// Pasted ingredient lists with bullets and section headers should parse cleanly.
import { test, expect } from '@playwright/test';
import { watchErrors, open, readStore } from './helpers.mjs';

const PASTED = [
  '• 500g lean ground chicken',
  'For the Sauce & Rice:',
  '• 1 cup uncooked jasmine',
  '• 1 can (400ml) light coconut milk',
  '• Pinch of salt and pepper',
  '• 1 tsp minced garlic and ginger'
].join('\n');

test('a bulleted ingredient paste resolves every line with real macros', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Pasted test');
  await page.fill('#r-servings', '2');
  await page.fill('#r-ingredients', PASTED);
  await page.click('#recipe-form button[type="submit"]');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Pasted test');
  // Chicken mince ~700 + jasmine rice ~666 + light coconut milk ~380 ≈ 1746 kcal / 2 = ~870 kcal/serve
  expect(r.caloriesPerServing).toBeGreaterThan(700);
  expect(r.caloriesPerServing).toBeLessThan(1050);
  // The section header "For the Sauce & Rice:" was dropped, so no ingredient has that name
  for (const ing of r.ingredients) expect(ing.name.toLowerCase()).not.toContain('for the sauce');
  // garlic and ginger were each kept
  const names = r.ingredients.map((i) => i.name.toLowerCase()).join(' ');
  expect(names).toContain('garlic');
  expect(names).toContain('ginger');
  // Chicken mince (aliased from "ground chicken")
  expect(names).toMatch(/chicken/);
  expect(errors).toEqual([]);
});

test('chicken bone broth prefers the broth entry over the chicken-meat entry', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Broth check');
  await page.fill('#r-servings', '1');
  await page.fill('#r-ingredients', '1/2 cup chicken bone broth or stock');
  await page.click('#recipe-form button[type="submit"]');
  const r = (await readStore(page, 'recipes')).find((x) => x.name === 'Broth check');
  // 0.5 cup = 120 ml of bone broth @ 17 kcal/100 ml ≈ 20 kcal; definitely under 40
  expect(r.caloriesPerServing).toBeLessThan(40);
  expect(errors).toEqual([]);
});

test('the live breakdown shows no warning tags for the pasted list', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Pasted test 2');
  await page.fill('#r-servings', '2');
  await page.fill('#r-ingredients', PASTED);
  await expect(page.locator('#r-live-list li')).not.toHaveCount(0);
  // No "no amount" or "not recognised" tag should appear — section headers are dropped,
  // bullets are stripped, pinch is marked as a staple, and the can bracket size is used.
  await expect(page.locator('#r-live-list .r-live-tag.warn', { hasText: /no amount/i })).toHaveCount(0);
  await expect(page.locator('#r-live-list .r-live-tag.warn', { hasText: /not recognised/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});
