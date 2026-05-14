# Workouts — personal tracker

A phone-first PWA that guides you through a 4-day Upper/Lower lean-bulk mesocycle. Adapted for Planet Fitness equipment. No accounts, no cloud, no sync — data lives on your phone.

## Run locally

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm test         # vitest
npm run build    # production build to dist/
```

## Install on iPhone

1. Deploy (see below) or run locally and visit the URL from your phone (same network).
2. Open in **Safari**.
3. Tap the Share button → **Add to Home Screen** → done. The app opens full-screen, works offline.

## Deploy to Cloudflare Pages

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a project linked to the repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Cloudflare auto-deploys on push to `main`.

## Architecture overview

- React 18 + TypeScript + Vite
- Dexie (IndexedDB) for all data
- React Query for read/write coordination
- vite-plugin-pwa for service worker + manifest
- Pure-function domain layer (`src/domain/`) covers progression, mesocycle math, warmup ramp-ups — unit-tested

See `docs/superpowers/specs/2026-05-14-workout-tracker-design.md` for the full design.

## Data

All data is in your browser's IndexedDB under origin `workouts`. To back up: **Plan tab → Settings → Export data**. To reset: **Plan tab → Settings → Reset all data**.
