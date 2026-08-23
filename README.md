# Leeds Departure Board

A realistic UK-style train departure board **Progressive Web App** for **Leeds station (CRS: LDS)**.

**Live demo** (after enabling GitHub Pages):  
https://winowongo2024.github.io/leeds-departure-board/

## Features (current)
- Full day of simulated departures (05:00 – 23:00)
- **Deterministic delays** – calculated from service ID so the same train always gets the same delay/cancellation
- Realistic UK digital board layout (dark theme)
- Operator badges (Northern, TransPennine Express, LNER, CrossCountry)
- Live clock
- Auto-advancing list based on current time
- Mobile-friendly + PWA-ready (manifest included)

## How to view it

1. Go to the repository **Settings → Pages**
2. Under “Build and deployment”, set Source to **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)`
4. Save – after a minute the site will be live at the URL above

You can also open `index.html` locally (a simple local server is recommended because of `fetch`).

## Project structure
```
/
├── index.html
├── css/style.css
├── js/app.js
├── data/departures.json
├── manifest.json
└── README.md
```

## Technical notes
- Pure vanilla HTML / CSS / JavaScript
- Delays use a simple hash of the service `id` (stable across refreshes)
- Status colours: green = On time, amber = Delayed, red = Cancelled
- Designed to feel calm and authentic rather than game-like

## Next ideas
- Real operator logos (SVG)
- Arrivals board toggle
- Subtle animations when rows update
- Service worker for true offline support
- Custom icons & splash screen for “Add to Home Screen”

---

Built as a fun realistic simulation of a British railway departure board.
