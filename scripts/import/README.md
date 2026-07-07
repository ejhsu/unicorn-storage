# Firestore Item Import

One-off admin script that bulk-imports inventory items into the `storage/1/items` Firestore collection using the Firebase Admin SDK.

## Prerequisites

- Node.js
- A Firebase service-account key with Firestore access
  (Firebase Console → Project settings → Service accounts → **Generate new private key**)

## Usage

```bash
cd scripts/import
yarn install

# point the Admin SDK at your service-account key
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"

yarn start        # or: node import.js
```

Each entry is written with `.set()` keyed by its `docId`, so re-running the script is an idempotent upsert — documents with the same `docId` are overwritten, nothing is duplicated.

## Data file — `firestore_items.json`

The script reads `firestore_items.json` from this directory. The file is **gitignored** (real inventory data is personal) — create your own before running.

It must be a JSON array of item documents:

```json
[
  {
    "docId": "17471433392300",
    "name": "Instant noodles",
    "expiry": 1778025599000,
    "created": 1747143339230,
    "updated": 1747143339230
  }
]
```

| Field     | Type   | Notes                                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------------------- |
| `docId`   | string | Firestore document id, must be unique. The app generates these as `Date.now()` strings.  |
| `name`    | string | Item name shown in the list.                                                             |
| `expiry`  | number | Expiry date as epoch **milliseconds**, anchored to end-of-day in `Asia/Taipei`.          |
| `created` | number | Creation timestamp, epoch milliseconds.                                                  |
| `updated` | number | Last-update timestamp, epoch milliseconds.                                               |
