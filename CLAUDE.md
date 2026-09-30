# CLAUDE.md

Unicorn Storage: a household inventory / expiry-date tracker PWA. Scan a retail barcode, file the item with an expiry date, get an FCM web-push reminder before it expires.

## Commands

No test framework. `scripts/` holds admin-SDK one-offs run with `GOOGLE_APPLICATION_CREDENTIALS`: `scripts/check/check.js` (inspect/migrate Firestore items; mutating lines kept commented) and `scripts/import/import.js` (bulk-import items from `scripts/import/firestore_items.json`).

## Architecture

Entry `src/main.jsx` mounts React Router 7 routes inside MUI `ThemeProvider` + `StyledEngineProvider enableCssLayer` with a `@layer theme, base, mui, components, utilities` GlobalStyles — this is how MUI v7 and Tailwind CSS v4 coexist without specificity fights.

## Data model (Firestore)

- `storage/{warehouseId}/items/{docId}` — items; `warehouseId` currently hardcoded `'1'` (`constants/firestore.js`), doc id = `Date.now()` string; fields include `name`, `expiry` (epoch **millis**), `created`, `updated`.
- `/code/{barcode}` — scanned-barcode → name mapping, so re-scanning a known product pre-fills its name.
- `/fcm-tokens/1/user-tokens/{email}` — `{ tokens: [] }` per user.

## Expiry notification flow

`expirynotify` computes end-of-today in Asia/Taipei via date-fns-tz (`fromZonedTime(endOfDay(now))`), queries items with `expiry <= endOfToday + 7d`, splits **expired** (`<= endOfToday`) vs **expiring soon**, then `sendEachForMulticast` to every registered token with counts in `message.data`. The SW renders the zh-TW notification body from those counts. All expiry math must stay timezone-anchored — items store end-of-day epoch millis, not naive dates.

## Gotchas

- **Camera permission fallback** (`Scan.jsx`): first denial sets `sessionStorage.cameraDenied` and bounces to `/items`; a second entry shows the "permission denied" screen instead of looping.
- The messaging SW must be imported with `?worker&url` (not a static `public/` file) or Vite won't bundle its module imports.
- Firebase web config + VAPID key in source are public-by-design; security relies on Auth + Firestore rules — verify rules before making the repo public.
- **`scripts/import/firestore_items.json` is real personal inventory data — gitignored and scrubbed from history (2026-07); never commit it.**
