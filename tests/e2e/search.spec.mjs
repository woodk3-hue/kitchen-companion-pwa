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
