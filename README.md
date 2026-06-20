# Kitchen Companion — Phase 1

Personal kitchen inventory PWA. Offline-capable, no backend, all data stored locally in IndexedDB on your device.

## What's in Phase 1

- Bottom nav shell: Home, Meal Planner, Recipes, Kitchen, Shopping, Settings (Planner/Recipes/Shopping are placeholders until Phase 2–3)
- Full IndexedDB schema (all 9 stores), so later phases won't need migrations
- **Kitchen Inventory**: add, edit, delete items; filter by location; portion support; food state tracking; expiry flagging
- **Inventory history trail**: every create/edit/discard is logged per item (tap an item card to view its history)
- **Home dashboard**: item counts by location, items expiring within 3 days
- Pre-seeded, editable freezer suitability reference (chicken, fish, bok choy, coriander, etc.)
- Pre-seeded quick-add templates (schema only used internally for now — UI hookup comes with a later pass)
- **Settings → Export/Import**: full JSON backup and restore, since this is your only copy of the data

## Running it

No build step. Two ways to use it:

1. **Locally for testing**: open `kitchen_companion_pwa.html` directly in a mobile browser. The service worker won't register over `file://`, but the app works fine — you just won't get offline caching until it's served over http(s).
2. **GitHub Pages (recommended)**: push this folder to a repo, enable Pages on the `main` branch root (or `/docs`), then visit the URL on your phone and "Add to Home Screen." Offline caching and the install prompt both need a real http(s) origin.

```
git init
git add .
git commit -m "Kitchen Companion Phase 1"
git remote add origin <your-repo-url>
git push -u origin main
```

Then in repo Settings → Pages, set source to the branch/folder containing these files.

## File structure

```
kitchen_companion_pwa.html   — the entire app (HTML, CSS, JS)
sw.js                         — service worker (must stay a separate file)
manifest.json                 — PWA install metadata
icons/icon-192.png, icon-512.png
```

## Data safety

IndexedDB is local to the browser/device. Clearing browser data, switching browsers, or a new phone will lose everything. **Use Settings → Export Kitchen Data** regularly — it downloads a single `kitchen_backup_YYYY-MM-DD.json` you can keep on your NAS or wherever. Import restores from that file (it fully replaces current data, so it'll ask you to confirm first).

## Next: Phase 2

Recipes (~100 seeded across Indian / Anglo-Indian / Australian-Western), ingredient match scoring against your inventory, and the Meal Planner. Will be a new pass — same file, surgical additions only.
