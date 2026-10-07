// Shared helpers: open the app on a screen, read and write its IndexedDB, and fake Claude.
import { expect } from '@playwright/test';

// Collects JavaScript errors so every test can check the page stayed healthy
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  return errors;
}

export async function open(page, route, waitFor) {
  await page.addInitScript(() => { try { localStorage.setItem('pantryfit.skipSetup', '1'); } catch (_) {} });
  await page.goto(`/index.html#${route}`);
  await page.waitForSelector(waitFor);
}

export async function reopen(page, route, waitFor) {
  await page.addInitScript(() => { try { localStorage.setItem('pantryfit.skipSetup', '1'); } catch (_) {} });
  await page.goto(`/index.html#${route}`);
  await page.reload();
  await page.waitForSelector(waitFor);
}

export function readStore(page, store) {
  return page.evaluate((store) => new Promise((resolve) => {
    const r = indexedDB.open('KitchenCompanionDB');
    r.onsuccess = (e) => { e.target.result.transaction(store).objectStore(store).getAll().onsuccess = (ev) => resolve(ev.target.result); };
  }), store);
}

export function addItem(page, item) {
  const now = new Date().toISOString();
  const record = {
    portionCount: null, portionSize: null, subLocation: null, isStaple: false, purchaseDate: null,
    expiryDate: null, useByOverrideDays: null, cost: null, notes: '', states: ['Fresh'], category: 'Other',
    createdAt: now, updatedAt: now, ...item
  };
  return page.evaluate((record) => new Promise((resolve) => {
    const r = indexedDB.open('KitchenCompanionDB');
    r.onsuccess = (e) => { e.target.result.transaction('inventoryItems', 'readwrite').objectStore('inventoryItems').put(record).onsuccess = (ev) => resolve(ev.target.result); };
  }), record);
}

// Waits until the built-in recipes have loaded on first run
export async function waitForStarterRecipes(page) {
  await expect.poll(async () => (await readStore(page, 'recipes')).length, { timeout: 15_000 }).toBeGreaterThanOrEqual(30);
}

// Pretends to be the Claude API: answers by looking at which JSON schema the app asked for
export async function fakeClaude(page, answers) {
  // Offline machines can point this at a saved copy of the Anthropic SDK; CI loads it from the CDN
  if (process.env.ANTHROPIC_SDK_BUNDLE) {
    const fs = await import('node:fs');
    const bundle = fs.readFileSync(process.env.ANTHROPIC_SDK_BUNDLE, 'utf8');
    await page.route('https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@*/+esm', (route) => route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: bundle }));
  }
  await page.addInitScript(() => localStorage.setItem('kitchenCompanion.anthropicApiKey', 'sk-ant-test-key'));
  const seen = { prompts: [] };
  await page.route('https://api.anthropic.com/**', async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const body = req.postDataJSON();
    const content = body.messages[0].content; seen.prompts.push(typeof content === 'string' ? content : content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n'));
    const props = body.output_config.format.schema.properties;
    const key = Object.keys(answers).find((k) => props[k] !== undefined);
    const result = key ? answers[key] : {};
    return route.fulfill({
      status: 200,
      headers: { ...cors, 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_sequence: null, content: [{ type: 'text', text: JSON.stringify(result) }], usage: { input_tokens: 1, output_tokens: 1 } })
    });
  });
  return seen;
}
