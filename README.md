# Kitchen Companion

Personal kitchen inventory PWA. Offline-capable, no backend, all data stored locally in IndexedDB on your device.

## What's in Phase 1

- Bottom nav shell: Home, Meal Planner, Recipes, Kitchen, Shopping, Settings (Planner and Shopping are placeholders until later phases)
- Full IndexedDB schema (10 stores, database version 2), so later phases won't need migrations
- **Kitchen Inventory**: add, edit, delete items; filter by location; portion support; expiry flagging
- **Categories & states** match `PROJECT_VISION.md`: every item has one of 11 fixed categories, and any combination of states (Fresh, Frozen, Defrosting, Raw, Cooked, Leftover, Opened, Prepared)
- **Stocktake** (Kitchen tab → 📋 Stocktake): tick off what's in your pantry, fridge and freezer from a list of about 100 common items, or add your own (e.g. Kokum). Amounts are optional, e.g. `2 can`, `1 kg`, `500 g`; items without one show "In stock". Everything is added in one go with category, state and staple flag filled in, fresh food gets a suggested use-by date, and items already in your kitchen are marked so they aren't added twice. The list is `STOCKTAKE_LIST` in `index.html`.
- **Units**: metric (g, kg, ml, L) plus counts for packaged goods (each, can, jar, bottle, pack)
- **Inventory history trail**: every create/edit/discard is logged per item (tap an item card to view its history)
- **Home dashboard**: item counts by location, items expiring within 3 days
- Pre-seeded, editable freezer suitability reference (chicken, fish, bok choy, coriander, etc.)
- **Pantry staples**: items can be flagged as staples (shown with a Staple badge) for future meal planning
- **Smart use-by suggestions**: 42 pre-seeded entries for raw/cooked meat, fish, eggs and fresh/cooked vegetables, matched on the item's name and states
- **Quick-add chips**: 15 pre-seeded templates (Chicken Breast, Basmati Rice, Salt, Turmeric, etc.) shown above the inventory list; tapping one prefills the add-item form
- **Settings → Export/Import**: full JSON backup and restore, since this is your only copy of the data

## Running it

No build step. Two ways to use it:

1. **Locally for testing**: open `index.html` directly in a mobile browser. The service worker won't register over `file://`, but the app works fine — you just won't get offline caching until it's served over http(s).
2. **GitHub Pages (recommended)**: push this folder to a repo, enable Pages on the `main` branch root (or `/docs`), then visit the URL on your phone and "Add to Home Screen." Offline caching and the install prompt both need a real http(s) origin.

```
git init
git add .
git commit -m "Kitchen Companion Phase 1"
git remote add origin <your-repo-url>
git push -u origin main
```

Then in repo Settings → Pages, set source to the branch/folder containing these files.

> **Why `index.html`?** GitHub Pages serves `index.html` at a folder's root automatically. If that file doesn't exist, GitHub falls back to rendering `README.md` instead — which is why the README was showing up rather than the app.

## Installing on your phone

Kitchen Companion installs like a normal app (home-screen icon, full screen, works offline), with no app store needed:
- **Chrome on Android**: open the site and tap **📲 Install Kitchen Companion** on the Home screen (or in Settings), then **Install**. If that button only shows instructions, use Chrome's ⋮ menu → **Add to home screen** / **Install app**.
- **Long-press the app icon** for shortcuts: Scan barcode, Stocktake, Suggest meals.
- Once installed, the Install button is replaced by "Installed as an app" in Settings.
- Your data stays in that browser's storage on the phone, so keep exporting backups from Settings.

## File structure

```
index.html                    — the entire app (HTML, CSS, JS)
sw.js                         — service worker (must stay a separate file)
manifest.json                 — PWA install metadata
recipes-seed.json             — built-in recipes, loaded into the app on first open
icon-192.png, icon-512.png
```

## Data upgrades

The database is at version 2. Opening the app over v1 data converts inventory items automatically:
- Old categories are mapped to the fixed list ("meat" → Protein, "grain" → Carbs & Grains, "produce" → Vegetables, "homemade-meal" → Ready Meals). Anything else becomes **Other**.
- The single `state` becomes a `states` list (e.g. "frozen" → Frozen + Raw, "prepared-component" → Prepared).
- Every item gets `isStaple: false` until you flag it.

Not yet converted: quick-add templates saved by a v1 install, and backups exported from v1 (imports are restored as-is).

## Data safety

IndexedDB is local to the browser/device. Clearing browser data, switching browsers, or a new phone will lose everything. **Use Settings → Export Kitchen Data** regularly — it downloads a single `kitchen_backup_YYYY-MM-DD.json` you can keep on your NAS or wherever. Import restores from that file (it fully replaces current data, so it'll ask you to confirm first).

## Phase 2a: Recipes

- **Recipes tab**: search by name or ingredient, filter by cuisine, plus Favourites, ≤ 30 min, High protein and Freezes well.
- **Recipe page**: servings, prep/cook time, difficulty, approximate calories and protein per serving, ingredients, method and notes. Rate each recipe 1–5 for you and your partner (your partner's name comes from Settings once that screen exists), and mark favourites.
- **Your own recipes**: tap + on the Recipes tab. Type ingredients one per line, e.g. `500 g chicken thigh, diced` or `coriander, to garnish (optional)`. Category, staple flag and match words are filled in automatically from other recipes that use the same ingredient.
- **Settings → Import recipes**: adds recipes from a `.json` file on your phone (e.g. saved in Files/iCloud Drive). It only adds: recipes with the same name as one you already have are skipped, and nothing else is changed. Use this for private recipes, such as ones from a recipe book, that shouldn't go in this public repo. A recipe can carry a `sourceName` (e.g. the book's title), shown as "From …" on its page.
- **30 built-in recipes** in `recipes-seed.json`: 12 Indian, 6 Anglo-Indian, 6 Australian, 6 Western. Calories and protein are approximate.

### How built-in recipes update

`recipes-seed.json` has a `version` number. When it goes up, the app adds new built-in recipes and refreshes untouched ones the next time it opens. It never overwrites a built-in recipe you've edited, never re-adds one you've deleted, and keeps your ratings and favourites. When changing the seed file, also bump `CACHE_NAME` in `sw.js` so phones fetch the new copy.

### Recipe matching data (used by Phase 2b)

Each ingredient stores `matchTerms` (inventory names that count as having it, e.g. `chicken thigh`, `chicken`), `assumedStaple` (salt, oil and dried spices are assumed on hand) and `optional`.

## Step 2: What can I make?

- **Match %**: each recipe shows how much of it is already in your kitchen ("71% match"), what you'd need to buy, and which food about to go off it uses ("Uses Spinach (2 days left)"). Staples (salt, oil, dried spices) and optional ingredients don't count against the score. With food in the kitchen, the list is sorted by best match, with a boost for recipes that use up expiring food.
- **Health goals** (Settings): calories per meal (default 450–500 kcal) and the cuisines you like (Indian, Anglo-Indian, Australian, Western, Chinese, Indo-Chinese, Korean, Vietnamese). Recipes show **✓ 480 kcal** inside the range and **590 kcal · over** above it.
- **✨ Suggest meals** (Recipes tab): sends your kitchen list, use-by dates and health goals to Claude (`claude-opus-5-5`), which suggests 3 meals that use expiring food first and aim for your calorie target, each with ingredients, method, approximate kcal and protein, and what you'd need to buy. **Save to my recipes** keeps one. Needs your own Anthropic API key, pasted into **Settings → AI suggestions** (stored only in this browser's localStorage, not in backups). Roughly 10–15 Australian cents per set of suggestions.
- **🔎 Search online** (Recipes tab): free search of TheMealDB by ingredient or dish name, or browse by cuisine. Saved recipes have no calories, so the edit form opens to let you add them.
- The service worker now leaves API calls (Anthropic, TheMealDB) to the network instead of caching them.

### Getting an Anthropic API key
1. Sign in at console.anthropic.com (same email as your Claude account works, but API billing is separate from a Claude subscription).
2. **Billing**: add a small prepaid credit (e.g. US$5–10). Under **Limits**, set a monthly spend limit.
3. **API keys → Create key**: name it "Kitchen Companion" and copy the `sk-ant-…` key. Skip workload identity federation; that is for servers, not phone apps.
4. In the app: **Settings → AI suggestions**, paste the key, **Save key**. It is tested automatically.

## Photo scan & item calories

- **📸 Scan photo** (Kitchen tab): pick Pantry, Fridge or Freezer and take or choose up to 5 photos (a shelf, the fridge door, a few jars). Photos are shrunk on the phone (longest edge 1568 px) and sent to Claude, which lists each food item it can see, reading brand names, pack sizes and nutrition panels where visible. You get an editable list: untick anything wrong, fix names, amounts, categories and calories, then **Save**. Items already in the kitchen at that location are updated (calories, plus amount if it had none) instead of duplicated. Uses the same API key as AI suggestions; roughly 8–15 Australian cents per photo. Photos aren't stored.
- **Calories per item**: each item can hold kcal per 100 g or 100 ml, shown on its card, marked "from label", "estimated" or "entered". Edit it in the item's More details, or tap **✨ Estimate** to fill it from the item's name.
- For the most accurate calories, photograph the nutrition panel on the back of jars and packets.
- **▦ Barcode** (Kitchen tab): point the camera at a barcode (uses Chrome on Android's built-in barcode reader), or type the number. The product is looked up in [Open Food Facts](https://world.openfoodfacts.org) for its name, brand, pack size and calories per 100 g/ml, and you confirm or edit before saving. Cans, jars and sauce bottles start as a count ("1 can"), other products as their pack size. Scanning something already in that location adds to it (e.g. 1 can → 2 cans). Products not in the database can be filled in on the same screen, with ✨ Estimate for calories. The camera keeps going for the next item until you close the sheet. Barcodes are saved on items.

## Step 3: Meal plan

- **Planner tab**: the week from Monday to Sunday, with lunch and dinner for each day (turn on **Plan breakfast too** in Settings). Use ‹ › to move between weeks. Each planned meal shows its kcal (✓ inside your target), food it uses up ("Uses Spinach") and how many ingredients you'd need to buy, with a daily kcal total.
- **+ Add** on a meal opens a picker: things already made (leftovers, cooked portions, ready meals in your kitchen), your recipes ranked best match first, or "Eating out / skip".
- **Leftovers**: when a recipe makes more portions than you cook for (Settings → Meal plan, default 2), the app offers to plan the spare portions as the next meal (dinner → next day's lunch). Removing the dinner removes its leftovers.
- **🪄 Fill my week**: fills empty meals from today onwards, choosing recipes that use food closest to its use-by first, then best match, inside your calorie target, with a mix of cuisines and no repeats. Dinners with enough spare portions fill the next lunch. **✨ Include new ideas from Claude** first adds 3 fresh AI recipes to choose from (uses your API key).
- **📅 Add to meal plan** on any recipe page picks a free slot in the next 10 days.
- **Home** shows today's meals.

## Start fresh

**Settings → Start fresh** clears the kitchen, its history, meal plans, recipes you added or saved, ratings, favourites and settings, after offering a backup download. The 30 built-in recipes come back as new; the use-by and freezer reference data and your API key are kept.

## Roadmap

### Still to build (for personal use)
- **Step 4**: Shopping list (missing ingredients from the meal plan) and running low.
- **Step 5**: "I cooked this" (e.g. cooked 4 portions, ate 2, 2 left over), taking ingredients out of the kitchen.
- **Automatic checks**: run the browser tests on every pull request with GitHub Actions; a "Report a problem" button.

### Publishing to app stores (later)
1. **Own domain** (e.g. kitchencompanion.app, ~A$20–40/year) pointed at GitHub Pages. Android needs it for its verification file.
2. **Android / Google Play**: package with PWABuilder (Trusted Web Activity); Play Console account US$25 once; store listing, privacy policy, data safety form; new personal accounts currently need a ~14-day closed test with ~12 testers. Web updates reach Play users automatically.
3. **iPhone / App Store**: wrap with Capacitor for native camera and barcode scanning (Safari has no built-in barcode reader); Apple Developer Program US$99/year; build with Xcode on a Mac or a cloud build service; test with TestFlight; App Store review.
4. **Bug catching**: Sentry crash reports (free tier) that can open GitHub issues; Dependabot for library updates; Play pre-launch reports and Apple TestFlight crash reports.

### Pricing plan (if offered to other people)

**Model: buy once, then pay only for the AI you use.** Anything that costs money to run is paid for by whoever uses it; everything else is included.

| | Price | What it covers |
|---|---|---|
| **App unlock** | A$7.99 one-off (A$4.99–7.99 range) | Everything non-AI: pantry/fridge/freezer inventory, stocktake, **barcode scanning with calories**, use-by reminders, recipes, match %, online recipe search, meal planner and Fill my week (non-AI), shopping list |
| **AI credits** | 10 for A$2.99 · 30 for A$7.99 · 100 for A$19.99 | ✨ Suggest meals (1 credit), ✨ Fill my week with new ideas (1 credit), 📸 photo scan (1 credit per photo). Calorie estimates free or 10 per credit |
| **Welcome credits** | 5 included with the unlock | Lets new users try the AI |

- **How it's sold**: free to download with a short trial, then a one-off **Unlock** in-app purchase. It brings in the same money as an upfront price, but more people try the app. Credits are in-app "consumable" purchases, as Apple and Google require for digital goods; RevenueCat handles both stores.
- **Money in**: in Australia the store price includes 10% GST and Apple/Google keep 15%, so about **77% of the sticker price** is received. A$7.99 unlock ≈ A$6.15 received.
- **AI costs per use**: meal suggestions ~A$0.10–0.15, photo scan ~A$0.08–0.15, calorie estimate ~A$0.01. Credit prices (A$0.20–0.30 each) cover this with margin.
- **Cost savings to make before launch**: run photo scans and calorie estimates on a cheaper Claude model (test quality on real labels first) and use prompt caching. Together these should roughly halve AI costs, which keeps the 100-credit pack comfortably profitable.
- **Fixed costs**: ~A$200–300 a year (Apple US$99/yr, Google US$25 once, domain, small server). About **40–65 unlocks a year** covers them.
- **Needed before charging**:
  - a small server that holds the Anthropic key, checks each person's credit balance and deducts a credit per AI use (users never see a key);
  - sign-in with Apple/Google so credits and data survive a new phone;
  - RevenueCat for the unlock and credit purchases;
  - TheMealDB supporter key (its free key is for personal/development use);
  - privacy policy and terms (photos and food lists are sent to Anthropic to process).
- **Owner use**: Kim keeps using her own API key in Settings, without credits.
- **Approach**: use the app personally for a month first to see real AI use, then confirm the prices.
