# CLAUDE.md

Unicorn Storage: a household inventory / expiry-date tracker PWA. Scan a retail barcode, file the item with an expiry date, get an FCM web-push reminder before it expires. React 19 SPA on Firebase (Hosting / Auth / Firestore / Cloud Functions v2, region `asia-east1`).

## Commands

```bash
yarn dev            # vite dev server
yarn build          # vite build -> dist/
yarn deploy         # vite build && firebase deploy (hosting + functions)
yarn lint           # eslint .
```

No test framework. `scripts/` holds admin-SDK one-offs run with `GOOGLE_APPLICATION_CREDENTIALS`: `scripts/check/check.js` (inspect/migrate Firestore items; mutating lines kept commented) and `scripts/import/import.js` (bulk-import items from `scripts/import/firestore_items.json`).

## Architecture

Entry `src/main.jsx` mounts React Router 7 routes inside MUI `ThemeProvider` + `StyledEngineProvider enableCssLayer` with a `@layer theme, base, mui, components, utilities` GlobalStyles — this is how MUI v7 and Tailwind CSS v4 coexist without specificity fights.

| Route | Page | Purpose |
|---|---|---|
| `/` | `pages/List.jsx` | item list: sort (`constants/sort.js`), expiry status colors (`constants/status.js`), swipe actions (react-swipeable-list) |
| `/items/scan` | `pages/Scan.jsx` | camera barcode scanning |
| `/items/:itemId`, `/items` | `pages/Item.jsx` | edit / create item |

`App.jsx` is the auth shell: FirebaseUI Google popup sign-in gates the outlet; once signed in it registers the messaging service worker and upserts the FCM token into `/fcm-tokens/1/user-tokens/{email}` (deduped array).

| Module | Responsibility |
|---|---|
| `src/services/firebase.js` | Firebase init, FirebaseUI, `registerServiceWorker()` — imports the SW via Vite `?worker&url` so it's bundled, and requests the FCM token with the VAPID key |
| `src/services/firebase-messaging-sw.js` | background `onBackgroundMessage` → zh-TW notification; `notificationclick` opens the app |
| `src/services/item.js` | Firestore CRUD for items + the `/code/{barcode}` collection (barcode → product-name dictionary) |
| `src/hooks/useQrcodeScanner.js` | React hook over html5-qrcode: retail formats (EAN-13/8, Code 128/39/93), 45fps, pause-on-decode, cleanup on unmount |
| `functions/index.js` | `expirynotify`: Cloud Functions v2 `onSchedule` daily 12:00 Asia/Taipei |

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
- Firebase Hosting serves `dist/` with SPA rewrite to `/index.html` and no-cache headers on `/`.
