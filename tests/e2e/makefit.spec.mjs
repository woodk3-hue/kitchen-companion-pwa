// Make it fit: Claude rewrites a recipe to a macro goal; the app recomputes
// nutrition itself, the user can save as a new recipe, and the original stays.
import { test, expect } from '@playwright/test';
import { watchErrors, open, readStore, fakeClaude } from './helpers.mjs';

async function addSimpleRecipe(page, name, ingredients) {
  await page.click('#fab-btn');
  await page.fill('#r-name', name);
  await page.fill('#r-servings', '4');
  await page.fill('#r-ingredients', ingredients);
  await page.click('#recipe-form button[type="submit"]');
  // After submit, the recipe detail opens in the same modal — wait for the Make it fit button
  await page.waitForSelector('#makefit-recipe-btn');
}

test('High protein rewrite saves as a new recipe; original is unchanged', async ({ page }) => {
  const errors = watchErrors(page);
  const seen = await fakeClaude(page, {
    ingredients: {
      ingredients: ['600 g chicken breast', '200 g greek yoghurt', '1 tsp garlic'],
      method: ['Marinate chicken in yoghurt and garlic.', 'Grill 6 minutes a side.'],
      changes: [
        { from: 'rice', to: 'greek yoghurt', why: 'bumps protein per serve' },
        { from: 'chicken thigh', to: 'chicken breast', why: 'leaner, higher protein ratio' }
      ]
    }
  });
  await open(page, 'recipes', '#recipe-list');
  await addSimpleRecipe(page, 'Chicken thigh rice', '500 g chicken thigh\n240 g jasmine rice\n1 tbsp olive oil');
  await page.click('#makefit-recipe-btn');
  await page.click('.mf-goal[data-goal="high-protein"]');
  // Result screen renders tiles + changes
  await expect(page.locator('.mf-tiles')).toBeVisible();
  await expect(page.locator('.mf-changes li').first()).toContainText('rice');
  // Save as a new recipe
  await page.click('#mf-save');
  // Original recipe is unchanged; a new "– High protein" recipe exists
  const recipes = await readStore(page, 'recipes');
  const original = recipes.find((r) => r.name === 'Chicken thigh rice');
  const fitted = recipes.find((r) => r.name === 'Chicken thigh rice – High protein');
  expect(original).toBeTruthy();
  expect(fitted).toBeTruthy();
  // The original keeps its ingredients
  expect(original.ingredients.map((i) => i.name).join(' ').toLowerCase()).toContain('chicken thigh');
  // The new recipe uses the app's own macro calculator — chicken breast + greek yoghurt per serve is well above 25g
  expect(fitted.proteinGramsPerServing).toBeGreaterThanOrEqual(25);
  // Claude's prompt mentioned the goal
  expect(seen.prompts.join('\n').toLowerCase()).toContain('high protein');
  expect(errors).toEqual([]);
});

test('Low carb goal is sent to Claude and the fitted recipe is a separate copy', async ({ page }) => {
  const errors = watchErrors(page);
  const seen = await fakeClaude(page, {
    ingredients: {
      ingredients: ['500 g chicken breast', '400 g cauliflower rice', '1 tbsp olive oil'],
      method: ['Pan-fry chicken.', 'Serve with riced cauliflower.'],
      changes: [{ from: 'basmati rice', to: 'cauliflower rice', why: 'cuts carbs' }]
    }
  });
  await open(page, 'recipes', '#recipe-list');
  await addSimpleRecipe(page, 'Rice bowl', '500 g chicken breast\n240 g basmati rice');
  await page.click('#makefit-recipe-btn');
  await page.click('.mf-goal[data-goal="low-carb"]');
  await expect(page.locator('.mf-tiles')).toBeVisible();
  await page.click('#mf-save');
  const recipes = await readStore(page, 'recipes');
  const fitted = recipes.find((r) => r.name === 'Rice bowl – Low carb');
  expect(fitted).toBeTruthy();
  // The app recomputed macros from the Claude-returned ingredients (cauliflower rice has way fewer carbs than basmati)
  expect(fitted.carbsGramsPerServing).toBeLessThan(30);
  expect(seen.prompts.join('\n').toLowerCase()).toContain('low carb');
  expect(errors).toEqual([]);
});

test('Make it fit without an API key tells you to add one', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  await addSimpleRecipe(page, 'Keyless recipe', '200 g chicken breast');
  await page.click('#makefit-recipe-btn');
  await page.click('.mf-goal[data-goal="high-protein"]');
  await expect(page.locator('#mf-error')).toContainText('Anthropic API key');
  // "Go to Settings" is visible
  await expect(page.locator('#mf-to-settings')).toBeVisible();
  expect(errors).toEqual([]);
});

test('swap suggestions skip prepared meals: biryani is never offered for chicken', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  // Put a prepared-meal item in the kitchen
  await page.evaluate(async () => {
    const now = new Date().toISOString();
    await new Promise((resolve) => {
      const r = indexedDB.open('KitchenCompanionDB');
      r.onsuccess = (e) => {
        const tx = e.target.result.transaction('inventoryItems', 'readwrite');
        tx.objectStore('inventoryItems').put({
          name: 'High protein chicken biryani', quantity: 1, unit: 'each', location: 'freezer',
          states: ['Frozen'], category: 'Other', createdAt: now, updatedAt: now
        }).onsuccess = () => resolve();
      };
    });
  });
  // A recipe needing chicken — no swap chip should offer the biryani
  await addSimpleRecipe(page, 'Chicken bake', '500 g chicken breast');
  // Recipe detail is already open after save
  await expect(page.locator('.ing-swap-chip', { hasText: /biryani/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});
