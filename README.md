# Repochan

Light HACCP logging app for exception-based daily hygiene records.

## Setup

1. Keep the Firebase service account JSON in the repo root. It is ignored by git.
2. In Firebase Console, enable Cloud Firestore for the `repochan` project.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Seed Firestore:

   ```bash
   npm run seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

The web app runs on `http://localhost:5173` and the local API runs on `http://localhost:5174`.

## Render

Create a Render Web Service from this repository.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variable: `FIREBASE_SERVICE_ACCOUNT_JSON`

For `FIREBASE_SERVICE_ACCOUNT_JSON`, paste the full contents of the local Firebase service account JSON file. Do not commit that JSON file.

## GitHub Pages Wake Screen

The `docs/` folder contains a static wake screen for GitHub Pages. It appears instantly, polls Render, and opens Repochan when the Render service is awake.

In GitHub repository settings, enable Pages with:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

The starter page will be available at `https://hanenashi.github.io/repochan/`.

## Data Model

- `shops/main-shop`
- `shops/main-shop/staff`
- `shops/main-shop/checkItems`
- `shops/main-shop/dailyChecks/{yyyy-mm-dd}`

Daily records use an exception-based HACCP model: normal days are saved with one confirmation, and only unusual/problem events are recorded in detail.
