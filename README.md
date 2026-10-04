# Kitchen Companion

Personal kitchen inventory PWA. Offline-capable, no backend, all data stored locally in IndexedDB on your device.

## What's in Phase 1

- Bottom nav shell: Home, Meal Planner, Recipes, Kitchen, Shopping, Settings (Planner and Shopping are placeholders until later phases)
- Full IndexedDB schema (10 stores, database version 2), so later phases won't need migrations
- **Kitchen Inventory**: add, edit, delete items; filter by location; portion support; expiry flagging
- **Categories & states** match `PROJECT_VISION.md`: every item has one of 11 fixed categories, and any combination of states (Fresh, Frozen, Defrosting, Raw, Cooked, Leftover, Opened, Prepared)
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

## Next

- **Phase 2b**: ingredient match % against your inventory ("95% match, need coriander"), "Use What I Own" and "I don't want to cook" modes.
- **Phase 2c**: Meal Planner.
