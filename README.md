# Leeds Departure Board

A realistic UK-style train departure board **Progressive Web App** for **Leeds station (CRS: LDS)**.

- Simulated live departures covering 05:00 – 23:00
- Deterministic delays (calculated with maths so the same service always shows the same delay)
- Operator logos for Northern, TransPennine Express, LNER and CrossCountry
- Designed to closely match real National Rail / Darwin departure boards
- Fully offline after first visit
- Installable on iPhone / Android home screen

## Current Status
🚧 Just created – scaffolding in progress.

## Goals
- Look and feel like a real UK station board
- Calm, realistic simulation (not arcade-style)
- Clean, maintainable vanilla web code
- Easy to expand later (arrivals, multiple stations, etc.)

## Planned Structure
```
/
├── index.html
├── css/
├── js/
├── data/
│   └── departures.json
├── assets/
│   └── operators/
├── manifest.json
└── sw.js
```

## Licence
TBD – will be added soon.
