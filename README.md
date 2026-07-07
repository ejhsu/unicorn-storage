# 🦄 Unicorn Storage

A mobile-first PWA for tracking household inventory and expiry dates — scan a product barcode, file the item with its expiry date, and get a web-push reminder before it expires.

**Live app:** [unicorn-storage.web.app](https://unicorn-storage.web.app) (Google sign-in required)

## Features

- 📷 **Barcode scanning** — scan retail barcodes (EAN-13/8, Code 128/39/93) with the device camera to add items
- 🏷️ **Self-learning product dictionary** — every scanned barcode → name pair is saved to Firestore, so re-scanning a known product pre-fills its name
- ⏰ **Expiry push notifications** — a scheduled Cloud Function runs daily at 12:00 (Asia/Taipei), splits items into *expired* vs *expiring within 7 days*, and fans out a summary via Firebase Cloud Messaging to every registered device
- 🎨 **At-a-glance status** — list items are color-coded by expiry urgency, sortable, with swipe-to-edit/delete gestures
- 🔐 **Google sign-in** — FirebaseUI popup auth gates the app; each user's FCM tokens are registered per device
- 📱 **Installable PWA** — standalone display mode, served from Firebase Hosting with SPA rewrites

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7, React Hook Form |
| UI | MUI v7 + Tailwind CSS v4 (coexisting via CSS cascade layers), react-swipeable-list |
| Barcode | html5-qrcode (camera stream decoding wrapped in a custom React hook) |
| Backend (serverless) | Firebase Auth, Cloud Firestore, Cloud Functions v2 (Node, `asia-east1`), Cloud Messaging, Firebase Hosting |
| Dates | date-fns + date-fns-tz (timezone-anchored expiry math) |
| Tooling | ESLint 9 flat config, Prettier, simple-import-sort |

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  React SPA (Vite)           │        │  Firebase                    │
│                             │        │                              │
│  /            List          │◄──────►│  Firestore                   │
│  /items/scan  Scan (camera) │  CRUD  │   storage/{wh}/items/{id}    │
│  /items/:id   Item form     │        │   code/{barcode} → name      │
│                             │        │   fcm-tokens/…/{email}       │
│  firebase-messaging-sw.js   │        │                              │
│   (bundled by Vite)         │◄───────│  Cloud Function v2           │
│   renders push notification │  FCM   │   expirynotify               │
└─────────────────────────────┘        │   (daily 12:00 Asia/Taipei)  │
                                       └──────────────────────────────┘
```

- **`src/App.jsx`** — auth shell: gates all routes behind FirebaseUI Google sign-in, then registers the messaging service worker and upserts the device's FCM token into the per-user token registry
- **`src/services/item.js`** — Firestore CRUD for items and the barcode→name dictionary
- **`src/hooks/useQrcodeScanner.js`** — React lifecycle wrapper around html5-qrcode: retail-format allowlist, pause-on-decode, cleanup on unmount
- **`functions/index.js`** — `expirynotify` scheduled function: computes end-of-today in Asia/Taipei, queries items with `expiry <= today + 7d`, and multicasts counts to all registered tokens; the service worker renders the notification client-side

### Data model (Firestore)

| Collection | Purpose |
| --- | --- |
| `storage/{warehouseId}/items/{docId}` | Inventory items — `name`, `expiry` (end-of-day epoch millis), `created`, `updated` |
| `code/{barcode}` | Scanned barcode → product-name mapping (the self-learning dictionary) |
| `fcm-tokens/1/user-tokens/{email}` | Per-user FCM device tokens (deduped array) |

## Engineering Notes

- **MUI v7 + Tailwind v4 without specificity fights** — `StyledEngineProvider enableCssLayer` plus an explicit `@layer theme, base, mui, components, utilities` ordering puts MUI's styles in a dedicated cascade layer below Tailwind utilities, so utility classes can override component styles predictably
- **Bundled FCM service worker** — the messaging service worker is imported via Vite's `?worker&url` so its module imports are bundled, instead of being a static file in `public/` that can't use the module graph
- **Timezone-anchored expiry math** — expiry timestamps are stored as end-of-day epoch milliseconds in Asia/Taipei (computed with date-fns-tz), so "expires today" means the same thing on the client, in the scheduled function, and in Firestore queries
- **Camera-permission fallback** — a first permission denial redirects away with a session flag; re-entering the scanner shows an explanatory screen instead of re-triggering the browser prompt loop

## Getting Started

Prerequisites: Node.js, Yarn, and a Firebase project with Auth (Google provider), Firestore, Cloud Messaging, and Hosting enabled.

```bash
yarn install
yarn dev        # Vite dev server
yarn lint       # ESLint
yarn build      # production build → dist/
yarn deploy     # vite build && firebase deploy (hosting + functions)
```

To run against your own Firebase project, replace the web-app config and VAPID key in `src/services/firebase.js` and the project id in `.firebaserc`. The web config is public by design — access control lives in Auth and Firestore security rules.

## Project Structure

```
├── src/
│   ├── main.jsx              # router + MUI/Tailwind cascade-layer setup
│   ├── App.jsx               # auth shell + FCM token registration
│   ├── pages/                # List, Scan, Item
│   ├── components/           # ItemCard, Sidebar, SortDialog, AlertDialog, …
│   ├── hooks/                # useQrcodeScanner
│   ├── services/             # firebase init, item CRUD, messaging SW
│   └── constants/            # theme, sort, expiry status, firestore paths
├── functions/                # Cloud Functions v2 (expirynotify)
├── scripts/
│   ├── import/               # bulk-import items via Admin SDK (see its README)
│   └── check/                # ad-hoc Firestore inspection/migration snippets
├── firebase.json             # hosting (SPA rewrite, no-cache /) + functions
└── public/manifest.json      # PWA manifest
```
