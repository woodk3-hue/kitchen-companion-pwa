// Food diary: quick add by hand, quick add with a Claude estimate, and reading a packaged-food label.
import { test, expect } from '@playwright/test';
import { watchErrors, open, readStore, fakeClaude } from './helpers.mjs';

test('quick add by hand updates today\'s total', async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, 'home', '.diary-add');
  await page.click('.diary-add[data-meal="breakfast"]');
  await page.click('.add-food-opt[data-how="quick"]');
  await page.fill('#qa-name', 'Toast');
  await page.fill('#qa-kcal', '180');
  await page.click('#qa-save');
  await expect(page.locator('.diary-summary')).toContainText('180');
  expect(errors).toEqual([]);
});

test('quick add estimate and label photo use Claude (faked)', async ({ page }) => {
  const errors = watchErrors(page);
  await fakeClaude(page, {
    assumptions: { name: 'Coffee with skim milk', portion: '355 ml', kcal: 70, protein: 6.5, carbs: 9.5, fat: 0.4, assumptions: 'Assumed 300 ml skim milk.' },
    servingDescription: { found: true, name: 'Protein shake', kind: 'protein shake', servingDescription: '1 bottle (375 ml)', servingAmount: 375, servingUnit: 'ml', perServing: { kcal: 230, protein: 50, carbs: 6, fat: 1.5 }, per100: { kcal: 61, protein: 13.3, carbs: 1.6, fat: 0.4 }, fromLabel: true }
  });
  await open(page, 'home', '.diary-add');

  await page.click('.diary-add[data-meal="breakfast"]');
  await page.click('.add-food-opt[data-how="quick"]');
  await page.fill('#qa-name', '12oz coffee with skim milk');
  await page.click('#qa-estimate');
  await expect(page.locator('#qa-kcal')).toHaveValue('70');
  await expect(page.locator('#qa-protein')).toHaveValue('6.5');
  await page.click('#qa-save');

  await page.click('.diary-add[data-meal="snacks"]');
  await page.click('.add-food-opt[data-how="label"]');
  await page.setInputFiles('#ls-file', '../icon-192.png');
  await page.click('#ls-action');
  await page.fill('#ls-serves', '2');
  await expect(page.locator('#ls-kcal')).toHaveValue('460');
  await page.click('#ls-action');

  await expect.poll(async () => (await readStore(page, 'foodLog')).map((e) => e.kcal).sort()).toEqual([460, 70]);
  expect(errors).toEqual([]);
});
