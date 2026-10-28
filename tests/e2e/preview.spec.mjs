// One-off preview capture — not for CI, used only to send a design screenshot to the user.
import { test } from '@playwright/test';
import { open, addItem } from './helpers.mjs';

test('PR A preview — Today screen in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  // Seed a few kitchen items so the stat tiles are not zero
  await page.goto('/index.html#home');
  for (const i of [
    { name: 'Chicken breast', quantity: 500, unit: 'g', location: 'pantry' },
    { name: 'Basmati rice', quantity: 1000, unit: 'g', location: 'pantry' },
    { name: 'Olive oil', quantity: 500, unit: 'ml', location: 'pantry' },
    { name: 'Natural yoghurt', quantity: 1, unit: 'each', location: 'fridge' },
    { name: 'Butter', quantity: 250, unit: 'g', location: 'fridge' },
    { name: 'Frozen peas', quantity: 500, unit: 'g', location: 'freezer' }
  ]) await addItem(page, i);
  await open(page, 'home', '.diary-summary');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kitchen-companion-pwa/1f81d550-1357-57f5-ade9-96f5770f3e7b/scratchpad/today-light-after.png', fullPage: true });
});

test('PR A preview — Today screen in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/index.html#home');
  for (const i of [
    { name: 'Chicken breast', quantity: 500, unit: 'g', location: 'pantry' },
    { name: 'Basmati rice', quantity: 1000, unit: 'g', location: 'pantry' },
    { name: 'Natural yoghurt', quantity: 1, unit: 'each', location: 'fridge' },
    { name: 'Frozen peas', quantity: 500, unit: 'g', location: 'freezer' }
  ]) await addItem(page, i);
  await open(page, 'home', '.diary-summary');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-kitchen-companion-pwa/1f81d550-1357-57f5-ade9-96f5770f3e7b/scratchpad/today-dark-after.png', fullPage: true });
});
