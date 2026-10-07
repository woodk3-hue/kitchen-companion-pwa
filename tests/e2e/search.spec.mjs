// Online recipe search: forgiving words and spellings, your own recipes first, and Ask Claude.
import { test, expect } from '@playwright/test';
import { watchErrors, open, reopen, readStore, waitForStarterRecipes, fakeClaude } from './helpers.mjs';

const meal = (id, name, area) => ({ idMeal: id, strMeal: name, strArea: area, strMealThumb: '' });
const MEALDB = {
  'search.php?s=biryani': [meal('1', 'Chicken Biryani', 'Indian')],
  'search.php?s=chicken': [meal('2', 'Chicken Handi', 'Indian'), meal('3', 'Chicken Alfredo', 'Italian'), meal('1', 'Chicken Biryani', 'Indian')],
  'filter.php?i=chicken': [meal('3', 'Chicken Alfredo'), meal('4', 'Teriyaki Chicken'), meal('2', 'Chicken Handi')],
  'filter.php?a=Indian': [meal('1', 'Chicken Biryani'), meal('2', 'Chicken Handi'), meal('5', 'Dal fry')]
};

async function fakeMealDb(page) {
  await page.route('https://www.themealdb.com/**', (route) => {
    const key = route.request().url().split('/api/json/v1/1/')[1];
    return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify({ meals: MEALDB[key] || null }) });
  });
}

test('a long, misspelt search still finds biryani, best match first', async ({ page }) => {
  const errors = watchErrors(page);
  await fakeMealDb(page);
  await open(page, 'recipes', '#recipe-list');
  await waitForStarterRecipes(page);
  await reopen(page, 'recipes', '#online-search-btn');
  await page.click('#online-search-btn');
  await page.fill('#online-q', 'south indian style chicken briyani');
  await page.press('#online-q', 'Enter');
  // The built-in Chicken Biryani is offered from your own recipes
  await expect(page.locator('.mine-result').first()).toContainText('Chicken Biryani');
  // TheMealDB results: biryani first, and only dishes that match a word
  await expect(page.locator('.online-result').first()).toContainText('Chicken Biryani');
  await expect(page.locator('.online-result', { hasText: 'Dal fry' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Ask Claude gets a recipe for exactly the dish searched (faked) and saves it', async ({ page }) => {
  await fakeMealDb(page);
  await fakeClaude(page, { meals: { meals: [{
    name: 'South Indian Chicken Biryani', cuisine: 'Indian', mealTypes: ['Dinner'], whyThisMeal: 'Fragrant, with curry leaves and coconut.', usesExpiring: [],
    servings: 4, prepMinutes: 30, cookMinutes: 45, difficulty: 'Medium', caloriesPerServing: 560, proteinGramsPerServing: 36, carbsGramsPerServing: 64, fatGramsPerServing: 16,
    fatLevel: 'Medium', primaryProtein: 'Chicken', freezerFriendly: true, leftoverFriendly: true,
    ingredients: [{ name: 'Chicken thigh', quantity: 800, unit: 'g', prepNote: '', category: 'Protein', matchTerms: ['chicken thigh', 'chicken'], optional: false, assumedStaple: false, inKitchen: false }],
    method: ['Marinate the chicken.', 'Layer with rice and cook.']
  }] } });
  await open(page, 'recipes', '#online-search-btn');
  await page.click('#online-search-btn');
  await page.fill('#online-q', 'south indian chicken briyani');
  await page.press('#online-q', 'Enter');
  await page.click('#online-ai');
  await expect(page.locator('#online-ai-result')).toContainText('South Indian Chicken Biryani');
  await page.click('#online-ai-result .ai-save-btn');
  await expect.poll(async () => (await readStore(page, 'recipes')).some((r) => r.name === 'South Indian Chicken Biryani')).toBe(true);
});

test('a recipe needing gingelly oil suggests an in-kitchen swap', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'recipes', '#recipe-list');
  // Pantry: no gingelly oil, but grapeseed, olive oil, coconut oil and ghee
  for (const name of ['Grapeseed oil', 'Olive oil', 'Coconut oil', 'Ghee']) {
    await page.evaluate(async (n) => {
      await new Promise((res) => { const r = indexedDB.open('KitchenCompanionDB'); r.onsuccess = (e) => { e.target.result.transaction('inventoryItems', 'readwrite').objectStore('inventoryItems').put({ name: n, quantity: 1, unit: 'each', location: 'pantry', states: ['Raw'], category: 'Other', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).onsuccess = () => res(); }; }, n);
    }, name);
  }
  await page.click('#fab-btn');
  await page.fill('#r-name', 'Fish curry');
  await page.fill('#r-servings', '4');
  await page.fill('#r-ingredients', '500 g fish fillets\n2 tbsp gingelly oil\n1 tsp mustard seeds');
  await page.click('#recipe-form button[type="submit"]');
  // Swap chip appears: the first in-family item the kitchen has (olive oil)
  const chip = page.locator('.ing-swap-chip', { hasText: /olive oil/ });
  await expect(chip).toBeVisible();
  await chip.click();
  // The recipe is updated in place
  await expect(page.locator('.ing-name', { hasText: 'Olive oil' })).toBeVisible();
  await expect(page.locator('.ing-name', { hasText: /^Gingelly oil/ })).toHaveCount(0);
  // Saved to the recipe
  await expect.poll(async () => (await readStore(page, 'recipes')).find((r) => r.name === 'Fish curry')?.ingredients.find((i) => /gingelly/i.test(i.name))).toBeUndefined();
  expect(errors).toEqual([]);
});

test('the online search switches get sent to Claude', async ({ page }) => {
  await fakeMealDb(page);
  let seenPrompt = null;
  await fakeClaude(page, {});  // installs the SDK bundle and the key
  await page.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const body = req.postDataJSON();
    seenPrompt = body.messages[0].content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    const result = { meals: [{ name: 'Fish Curry', cuisine: 'Indian', mealTypes: ['Dinner'], whyThisMeal: 'South Indian.', usesExpiring: [], servings: 4, prepMinutes: 15, cookMinutes: 25, difficulty: 'Easy', caloriesPerServing: 400, proteinGramsPerServing: 30, carbsGramsPerServing: 10, fatGramsPerServing: 22, fatLevel: 'Medium', primaryProtein: 'Fish', freezerFriendly: false, leftoverFriendly: true, ingredients: [{ name: 'Fish fillets', quantity: 500, unit: 'g', prepNote: '', category: 'Protein', matchTerms: ['fish'], optional: false, assumedStaple: false, inKitchen: false }], method: ['Cook it.'] }] };
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_sequence: null, content: [{ type: 'text', text: JSON.stringify(result) }], usage: { input_tokens: 1, output_tokens: 1 } }) });
  });
  await open(page, 'recipes', '#online-search-btn');
  await page.click('#online-search-btn');
  await page.fill('#online-q', 'kerala fish curry');
  await page.press('#online-q', 'Enter');
  await page.check('#ask-macros');
  await page.check('#ask-pantry');
  await page.click('#online-ai');
  await expect(page.locator('#online-ai-result')).toContainText('Fish Curry');
  expect(seenPrompt).toContain('Match my eating style');
  expect(seenPrompt).toContain('Mostly use ingredients from my kitchen');
});
