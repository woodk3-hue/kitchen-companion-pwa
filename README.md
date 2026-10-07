# PantryFit: Kitchen & Food Tracker

*(Formerly Kitchen Companion.)*

Personal kitchen inventory PWA. Offline-capable, no backend, all data stored locally in IndexedDB on your device.

## What's in Phase 1

- Bottom nav shell: Today, Meal Planner, Recipes, Kitchen, Shopping, Settings
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
git commit -m "PantryFit"
git remote add origin <your-repo-url>
git push -u origin main
```

Then in repo Settings → Pages, set source to the branch/folder containing these files.

> **Why `index.html`?** GitHub Pages serves `index.html` at a folder's root automatically. If that file doesn't exist, GitHub falls back to rendering `README.md` instead — which is why the README was showing up rather than the app.

## Installing on your phone

PantryFit installs like a normal app (home-screen icon, full screen, works offline), with no app store needed:
- **Chrome on Android**: open the site and tap **📲 Install PantryFit** on the Home screen (or in Settings), then **Install**. If that button only shows instructions, use Chrome's ⋮ menu → **Add to home screen** / **Install app**.
- **Long-press the app icon** for shortcuts: Scan barcode, Stocktake, Suggest meals.
- Once installed, the Install button is replaced by "Installed as an app" in Settings.
- Your data stays in that browser's storage on the phone, so keep exporting backups from Settings.

## Sharing the app

Send the link: **https://woodk3-hue.github.io/kitchen-companion-pwa/**
- It opens in the browser; on Android tap **📲 Install PantryFit**, on iPhone use Safari → Share → **Add to Home Screen**.
- Each person's data lives only on their own phone, so they start with an empty app and never see yours. For a quick tour: **Settings → Starter recipes → Add the 30 starter recipes**, then try Stocktake, the Planner and the Today diary.
- AI features need their own Anthropic API key in Settings. Never share yours: their AI use would be charged to your account. Everything else, including barcode lookups, works without a key.
- iPhone Safari can't read barcodes with the camera; type the number under the barcode instead.
- To give someone a copy of your setup: **Settings → Export kitchen data**, send the file, and they use **Settings → Import kitchen data**. It's a one-off copy, not live syncing.

## File structure

```
index.html                    — the entire app (HTML, CSS, JS)
sw.js                         — service worker (must stay a separate file)
manifest.json                 — PWA install metadata
recipes-seed.json             — built-in recipes, loaded into the app on first open
icon-192.png, icon-512.png   — app icons, rendered from icon.svg (orange tile, cooking pot with steam and a green leaf inside a green progress ring)
icon.svg                      — icon source; edit this and re-render the PNGs to change the icon
fonts/                        — Plus Jakarta Sans (SIL Open Font License), served with the app so it works offline
tests/                        — automatic browser tests (only for checking the app; not part of the app itself)
.github/workflows/tests.yml   — runs the tests on GitHub for every pull request
```

## Data upgrades

The database is at version 2. Opening the app over v1 data converts inventory items automatically:
- Old categories are mapped to the fixed list ("meat" → Protein, "grain" → Carbs & Grains, "produce" → Vegetables, "homemade-meal" → Ready Meals). Anything else becomes **Other**.
- The single `state` becomes a `states` list (e.g. "frozen" → Frozen + Raw, "prepared-component" → Prepared).
- Every item gets `isStaple: false` until you flag it.

Not yet converted: quick-add templates saved by a v1 install, and backups exported from v1 (imports are restored as-is).

Later versions only add things: version 3 added the food diary (`foodLog`), version 4 the shopping list (`shoppingList`). Upgrading keeps everything already saved.

## Data safety

IndexedDB is local to the browser/device. Clearing browser data, switching browsers, or a new phone will lose everything. **Use Settings → Export Kitchen Data** regularly — it downloads a single `pantryfit_backup_YYYY-MM-DD.json` you can keep on your NAS or wherever. Import restores from that file (it fully replaces current data, so it'll ask you to confirm first).

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
- **Health goals** (Settings): calories per meal (default 450–500 kcal) and the cuisines you like (see Cuisines below). Recipes show **✓ 480 kcal** inside the range and **590 kcal · over** above it.
- **✨ Suggest meals** (Recipes tab): sends your kitchen list, use-by dates and health goals to Claude (`claude-opus-5-5`), which suggests 3 meals that use expiring food first and aim for your calorie target, each with ingredients, method, approximate kcal and protein, and what you'd need to buy. **Save to my recipes** keeps one. Needs your own Anthropic API key, pasted into **Settings → AI suggestions** (stored only in this browser's localStorage, not in backups). Roughly 10–15 Australian cents per set of suggestions.
- **🔎 Search online** (Recipes tab): free search of TheMealDB by ingredient or dish name, or browse by cuisine. Saved recipes have no calories, so the edit form opens to let you add them.
- The service worker now leaves API calls (Anthropic, TheMealDB) to the network instead of caching them.

### Getting an Anthropic API key
1. Sign in at console.anthropic.com (same email as your Claude account works, but API billing is separate from a Claude subscription).
2. **Billing**: add a small prepaid credit (e.g. US$5–10). Under **Limits**, set a monthly spend limit.
3. **API keys → Create key**: name it "PantryFit" and copy the `sk-ant-…` key. Skip workload identity federation; that is for servers, not phone apps.
4. In the app: **Settings → AI suggestions**, paste the key, **Save key**. It is tested automatically.

## Photo scan & item calories

- **📸 Scan photo** (Kitchen tab): pick Pantry, Fridge or Freezer and take or choose up to 5 photos (a shelf, the fridge door, a few jars). Photos are shrunk on the phone (longest edge 1568 px) and sent to Claude, which lists each food item it can see, reading brand names, pack sizes and nutrition panels where visible. You get an editable list: untick anything wrong, fix names, amounts, categories and calories, then **Save**. Items already in the kitchen at that location are updated (calories, plus amount if it had none) instead of duplicated. Uses the same API key as AI suggestions; roughly 8–15 Australian cents per photo. Photos aren't stored.
- **Calories per item**: each item can hold kcal per 100 g or 100 ml, shown on its card, marked "from label", "estimated" or "entered". Edit it in the item's More details, or tap **✨ Estimate** to fill it from the item's name.
- For the most accurate calories, photograph the nutrition panel on the back of jars and packets.
- **▦ Barcode** (Kitchen tab): point the camera at a barcode (uses Chrome on Android's built-in barcode reader), or type the number. The product is looked up in [Open Food Facts](https://world.openfoodfacts.org) for its name, brand, pack size and calories per 100 g/ml, and you confirm or edit before saving. Cans, jars and sauce bottles start as a count ("1 can"), other products as their pack size. Scanning something already in that location adds to it (e.g. 1 can → 2 cans). Products not in the database can be filled in on the same screen, with ✨ Estimate for calories. The camera keeps going for the next item until you close the sheet. Barcodes are saved on items.

## Step 3: Meal plan

- **Planner tab**: the week from Monday to Sunday, with lunch, dinner and **snacks** for each day (Settings → Meal plan: **Plan breakfast too** adds breakfast, **Plan snacks** turns the snacks row off). **+ Add** on snacks also offers snack foods from your kitchen (snacks, fruit, yoghurt and other dairy); Fill my week only fills snacks with recipes marked as snacks. Use ‹ › to move between weeks. Each planned meal shows its kcal (✓ inside your target), food it uses up ("Uses Spinach") and how many ingredients you'd need to buy, with a daily kcal total.
- **What you eat shows in the planner**: anything logged on Today appears in the planner on that day and meal, marked **✓ Eaten** (breakfast and snacks rows appear when something's logged there). A planned meal you log with ✓ Ate this is ticked as eaten rather than added twice. A meal can hold several things, with **+ Add to dinner** under them. Tap a planned meal you didn't eat to remove it ("Didn't eat it: remove" on past days); removing a logged item from the planner keeps it in the diary, and removing it from the diary takes it off the planner. **Clear week** keeps what was eaten.
- **My portions**: when you add a meal (from **+ Add** or **📅 Add to plan** on a recipe), choose how many portions you'll have, 1 by default. The planner shows "1 portion · 216 kcal", the day total uses it, and tapping a planned meal lets you change it. On Today the planned meal shows its portions, and **✓ Ate this** starts with that many for you (in *I cooked this*, the servings log or the leftovers log). In *I cooked this*, **Portions cooked** is the whole pot; *Me* is your share.
- **+ Add** on a meal opens a picker: things already made (leftovers, cooked portions, ready meals in your kitchen), your recipes ranked best match first, or "Eating out / skip".
- **Leftovers**: when a recipe makes more portions than you cook for (Settings → Meal plan, default 2), the app offers to plan the spare portions as the next meal (dinner → next day's lunch). Removing the dinner removes its leftovers.
- **🪄 Fill my week**: fills empty meals from today onwards, choosing recipes that use food closest to its use-by first, then best match, inside your calorie target, with a mix of cuisines and no repeats. Dinners with enough spare portions fill the next lunch. **✨ Include new ideas from Claude** first adds 3 fresh AI recipes to choose from (uses your API key).
- **📅 Add to meal plan** on any recipe page picks a free slot in the next 10 days.
- **Home** shows today's meals.

## Start fresh

**Settings → Start fresh** clears everything (the kitchen and its history, meal plans, all recipes including the 30 starter recipes, ratings, favourites and settings) after offering a backup download. The use-by and freezer reference data and your API key are kept.

**Settings → Starter recipes** adds the 30 built-in recipes back, or removes them (any you've edited are kept). Once removed they don't come back by themselves.

## Look and feel

A modern theme sits as one layer at the end of the stylesheet ("MODERN THEME"): Plus Jakarta Sans, a brighter palette matching the icon (orange accent, green, blue, gold), white cards with soft shadows instead of borders, pill chips and buttons, a segmented control style, soft filled inputs, rounded bottom sheets, a frosted header, a floating bottom bar with line icons, and a rounded floating + button. Removing that block returns to the original look.

## Dark mode

**Settings → Appearance**: **Automatic** (the default) follows your phone's light or dark setting and switches with it, or choose **☀️ Light** or **🌙 Dark** to keep one. The choice is saved on this phone only. Dark mode is a set of colour tokens at the end of the stylesheet ("DARK MODE"), plus a small script in `<head>` that applies it before the page draws, so it never flashes white.

## Food diary (Today tab)

The **Today** tab (formerly Home) is a food diary, like a fitness tracker:
- **Calorie ring** for the day ("1,120 of 1,600 kcal · 480 left", turning rust when over) and **protein, carbs and fat** meters against your daily targets. Use ‹ › to look at earlier days.
- **Breakfast, Lunch, Dinner, Snacks**, each with its total and **+ Add**. Tap a logged entry to fix its numbers or remove it.
- **Planned meals** from the meal plan appear under their meal with **✓ Ate this**.
- **Ways to log**:
  - **From my kitchen**: pick an item, enter how much (e.g. 150 g); calories and macros are worked out from its per-100 g values. **Take out of my kitchen** is ticked by default and subtracts what you ate (or removes the item when it runs out), logged in the item's history.
  - **A recipe**: per-serving calories and protein × servings. Also **🍽️ Log a serving** on every recipe page.
  - **Scan barcode**: Open Food Facts calories, protein, carbs and fat; starts at the product's serving size. If that product is in your kitchen, it can take one out.
  - **Photo or description of my plate**: take a photo, or if you forgot, **type what you ate** ("chicken curry about a cup, 3/4 cup rice, a small naan"). Claude estimates each food's portion, calories and macros; untick or adjust, then log (uses your API key / an AI credit). Without an API key, describe it with amounts ("150 g chicken curry, 120 g cooked rice, 1 naan") and the app uses its built-in typical values; anything it can't count is listed.
  - **Packaged meal, drink or shake** (🏷️): photograph a ready meal, frozen meal, drink, protein shake or protein powder (front, plus the nutrition panel if you can). Claude reads the name, the serve size (e.g. "1 scoop (30 g)") and the calories and macros per serve; set how many serves you had. Tick **Also add to my kitchen** to keep it with its per-100 g values. Also offered when a scanned barcode isn't in Open Food Facts. Uses your API key.
  - **I cooked a recipe** (🍳): see *I cooked this* below.
  - **Quick add**: type what you had with the amount, e.g. "12 oz coffee with skim milk", and tap **✨ Estimate calories & macros**: Claude converts the amount to metric and fills in kcal, protein, carbs and fat with a note on what it assumed, for you to check. Or type the numbers in yourself.
- **Daily targets** (Settings → Health goals): **1,600 kcal, 100 g protein, 175 g carbs, 55 g fat** by default, all editable, with a check that shows the protein/carbs/fat split and whether they add up to the calorie target.
- Kitchen items now also store **protein, carbs and fat per 100 g/ml**, filled from barcodes, label photos and ✨ Estimate, or typed in the item's More details.
- Diary entries are stored in a new `foodLog` store (database version 3; the upgrade keeps all existing data) and are included in backups and cleared by Start fresh.

## Eating styles

**Settings → Health goals → Eating style**: Balanced, High protein (the default), Low carb, Keto or Low fat. Picking one sets the daily protein/carbs/fat targets for your calorie goal (e.g. at 1,600 kcal: keto ≈ 100 g protein, 25 g carbs, 125 g fat; low fat ≈ 100 g protein, 220 g carbs, 35 g fat). You can still edit the numbers.

- Recipes are tagged **High protein**, **Low carb** (20 g carbs or less a serve), **Keto** (10 g or less) and **Low fat** (12 g fat or less), with filter chips on the Recipes tab. If rice or bread is only served on the side, the tag says so: "Keto (skip the rice)".
- The 30 starter recipes now carry carbs and fat per serve (for the dish without the rice or bread served with it). Your own recipes can have them too (Edit recipe → Nutrition & details); without them the app estimates from calories, protein and fat level.
- ✨ Suggest meals and 🪄 Fill my week follow your style.

## Recipe page: serves and macros

- **How many portions are you making?** sits above the ingredients on every recipe page: tap − / + or type a number and every ingredient amount changes to match (e.g. 4 → 6 portions: 600 g mince becomes 900 g). The recipe itself isn't changed. The button below then reads **🍳 I cooked this · 6 portions** and starts with that many.
- **Calories, protein, carbs and fat** per serving are shown as four tiles on the recipe page, and as a coloured "P · C · F" line on each recipe card.
- On **Today**, every logged food shows its protein, carbs and fat under its name, and each meal shows its totals. Recipe servings logged before carbs and fat were tracked are filled in from the recipe the next time Today opens.

## Calories and macros without an API key

PantryFit has typical values (per 100 g, raw or as bought) for about 120 common foods built in: rice, pasta, flour, meats, fish, eggs, dairy, oils, vegetables, fruit, sauces, legumes and spices. They're in `FOOD_NUTRITION` in `index.html` and work offline.
- **Recipes**: leave the nutrition boxes empty and the calories, protein, carbs and fat per serve are worked out from the ingredients when you save (e.g. "240 g jasmine rice", 4 serves → 216 kcal, 47 g carbs). Or tap **🧮 Work out from ingredients** in Edit recipe → Nutrition & details. A saved recipe with no calories has a **🧮 Work out from the ingredients** button on its page. Ingredients the app doesn't know, or without an amount, are listed as not counted. Amounts are treated as uncooked; write "cooked rice" for cooked. Kitchen items with their own values (from a label or barcode) are used first. Food bought on the bone (whole chicken, drumsticks, chops) only counts the part you eat.
- **Kitchen items**: typing a name such as "Jasmine rice" fills in typical calories and macros per 100 g, marked *typical values*; change them if your pack says different. Items added by stocktake or from the shopping list get them too, and logging an item with no calories saved uses them.
- **Quick add** without an API key: type an amount and a food ("240 g jasmine rice") and tap ✨ Estimate. With an API key, Claude estimates anything ("12 oz coffee with skim milk").
- The **High protein** tag uses the protein grams per serve when a recipe has them (25 g or more).

## Fast & easy meals

- Recipes tab: **⚡ 15 min** and **≤ 30 min** filters (prep + cooking time). Recipes 15 minutes or under show ⚡ next to their time.
- ✨ Suggest meals: choose **Time: Any / ≤ 30 min / ⚡ 15 min**.
- Planner: **⏱️ Quick weeknights** makes Fill my week pick only recipes of 30 minutes or less Monday to Friday.

## Step 4: Shopping list

The **Shopping** tab:
- **📅 From my meal plan**: everything the next 7 days of planned recipes need that isn't in your kitchen, with amounts added up across recipes (e.g. garlic for three recipes) and which recipe it's for. Untick what you don't want and add the rest. Staples and optional ingredients are left out.
- **Type to add**: "1 kg basmati rice" or just "milk".
- **Running low**: on any kitchen item, tap **🛒 Running low: add to shopping list**. The item shows *Running low* until you buy more.
- Grouped by aisle (category). Tap the box to tick as you shop, × to remove.
- **🧺 Put ticked items in my kitchen**: check where each thing goes (pantry, fridge or freezer is guessed) and how much you bought. Items you already have get topped up (1 kg rice + the 2 kg you had = 3 kg) and lose the running-low flag; new ones are added with a suggested use-by date. Each is logged in the item's history.
- **📤 Share list**: sends the unticked items as text (to Messages, WhatsApp, etc.) or copies it.

## Step 5: I cooked this

**🍳 I cooked this** on any recipe page, on a planned meal, from **✓ Ate this** on a planned meal you haven't cooked yet, or from + Add on the Today tab:
- **Portions made** (the serves you chose on the recipe page), then **where each portion goes**, each with − / + buttons: **🙋 Me** (goes in your food diary, for the meal you pick), **💑 your partner** (name set in Settings → Meal plan), **👥 Others** (family or guests), **🧊 Fridge** and **❄️ Freezer**. It starts as 1 for you, 1 for your partner (if you cook for two or more) and the rest in the fridge. Once every portion is placed, + on another place moves one from the fridge (then the freezer), so a chicken curry for 4 becomes "1 me · 1 Sam · 1 fridge · 1 freezer" in one tap. Coloured dots show each portion, and a line shows anything still to place.
- **Add my portion to the food diary**: how many portions you had and for which meal (e.g. 1 for today's lunch), with calories, protein, carbs and fat from the recipe.
- **Take out of my kitchen**: the ingredients you have, with the amount the recipe uses already worked out (800 g chicken thigh → 0.8 of your 1 kg). Untick or change any.
- The fridge and freezer portions become kitchen items ("Home-Style Chicken Curry, 2 portions" in Leftovers, use within 3 days; 1 portion in the Freezer, about 3 months), linked to the recipe. Logging one later (from my kitchen, or ✓ Ate this on a planned leftover) uses the recipe's nutrition and takes a portion away.
- The planned meal shows **✓ Cooked**, and the cook is saved in `batchCookEvents`.

## Automatic tests and reporting problems

- **Tests**: `tests/` holds browser tests that open the app on a simulated phone and check the main flows: every tab opens, starter recipes and the quick/low-carb/keto/low-fat filters, eating styles, the shopping list into the kitchen, I cooked this with fridge and freezer portions, and the food diary (Claude is faked in tests, so no API key or cost). GitHub runs them on every pull request (**Actions** tab, workflow *Tests*); a red ✗ on a pull request means something broke and shouldn't be merged yet. To run them on a computer: `cd tests`, `npm ci`, `npx playwright install chromium`, `npm test`.
- **Settings → Help → Report a problem** opens a new GitHub issue with the screen, app version, browser and phone details filled in; you add what happened. It never includes your kitchen, diary or API key. (While the repository is private, only people with access to it can file reports.)

## Suggest recipes from my kitchen

Once the kitchen has food in it, **🍳 Suggest recipes from my kitchen** appears on the Kitchen tab and the Home screen. It opens one sheet with: food to use soon (expiring within 3 days); your saved recipes that are at least a 50% match, best first and favouring ones that use food going off, each showing what you'd still need; **✨ AI ideas from my kitchen** (Claude, needs your API key); and **🔎 Free ideas online** (TheMealDB, with quick buttons for meat and fish you have).

## Cuisines

45 cuisines in 8 regions: South Asian, East Asian, Southeast Asian, Middle Eastern & African, European, Americas, Oceania, and Other. The Recipes tab only shows tabs for cuisines you have recipes in. **Settings → Health goals → Cuisines you like** lists them by region; choosing none means any cuisine, and AI suggestions follow whatever is chosen. Online search results keep their cuisine (e.g. TheMealDB Jamaican → Caribbean).

## Roadmap

### Still to build (for personal use)
- Shopping list prices and a weekly budget (the `purchaseEvents` store is ready for it).
- Reminders for food about to go off.

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

#### Lean option: just above break-even

The same costs, with prices set to cover them plus a ~15% safety buffer (exchange rates, since AI and Apple costs are in US dollars; refunds; heavier-than-average AI use). Stores use fixed price points, so prices are rounded to those.

| | Price | Received (~77%) | Cost | Margin |
|---|---|---|---|---|
| 1 AI credit | A$0.20 | A$0.154 | ~A$0.13 | ~A$0.02 |
| **10 credits** | **A$1.99** | A$1.53 | A$1.30 | A$0.23 |
| **50 credits** | **A$9.99** | A$7.69 | A$6.50 | A$1.19 |

| Unlock price | Received after 5 welcome credits (~A$0.65) | Sales a year to cover ~A$300 fixed costs |
|---|---|---|
| A$2.99 | ~A$1.65 | ~180 |
| **A$4.99** | **~A$3.19** | **~95** |
| A$7.99 | ~A$5.50 | ~55 |

- **Lean pick**: A$4.99 unlock, credits at 10 for A$1.99 or 50 for A$9.99. About 95 unlocks a year covers fixed costs; every sale and credit pack after that is a small profit.
- **To go cheaper**: a cheaper Claude model for photo scans and calorie estimates (test quality first) and prompt caching could bring credits down to about A$0.10; fewer welcome credits (3 instead of 5) lowers the break-even.
- **Don't price exactly at break-even**: one heavy AI user could tip it into a loss.
- **Tax**: profit is income, so keep records. GST registration is only needed above A$75,000 turnover; the stores collect GST on sales.
