# Golf Scorekeeper (Mobile Web App)

A mobile-first web app to keep golf scores for 1–4 players, supporting 9 or 18 holes, auto totals, undo, clear last, reset, and persistence with `localStorage`. Optional screen wake lock prevents the display from sleeping during a round.

## Features
- 9 or 18 holes selectable.
- 1–4 players with editable names.
- Numeric inputs on mobile (`type=number`, `inputmode=numeric`).
- Running per-player totals.
- **Undo** last edit, **Clear Last Cell**, **Full Reset**.
- Scores auto-save and restore using `localStorage`.
- Screen Wake Lock (where supported).

## How to Run Locally
1. Download the repo (or the ZIP provided) and unzip.
2. Open `index.html` in any modern browser (Chrome, Edge, Safari, Firefox).
3. (Optional) Serve locally for better PWA behavior:
   ```bash
   # Python 3
   python -m http.server 5173
   # then open http://localhost:5173
   ```

## Deploy
- GitHub Pages / Netlify / Vercel—drop the folder as-is.

## Known Issues
- Wake Lock API is not supported on all browsers/devices. If unsupported, you’ll see an alert.
- No service worker is included (PWA offline is optional per assignment).

## Future Work
- Add par per hole and to-par calculations.
- Add service worker for offline caching and install banner.
- Import/export rounds as JSON.
