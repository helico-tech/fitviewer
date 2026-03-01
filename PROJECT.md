# FitView — Browser-Based FIT File Viewer for Running

## Project Vision

FitView is a fully static, browser-only web application that lets runners load `.fit` files from their GPS watches and explore their run data through an interactive dashboard. No backend, no accounts, no data leaves the browser — just drag, drop, and analyze.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | React 18+ with TypeScript | Type safety, ecosystem, component model |
| **Build tool** | Vite | Fast builds, great DX, simple static output |
| **UI components** | shadcn/ui + Tailwind CSS | Polished, accessible, copy-paste component library |
| **FIT parsing** | `fit-file-parser` (npm) | Pure JS, runs in-browser, parses Garmin/Wahoo/etc FIT files |
| **Mapping** | MapLibre GL JS + community vector tiles | Open-source, GPU-accelerated, no API key required |
| **Charts** | Recharts | React-native charting, composable, works well with shadcn |
| **State management** | Zustand | Lightweight, no boilerplate, perfect for single-page tool |
| **Deployment** | GitHub Pages (via `gh-pages` or GitHub Actions) | Free, automatic, custom domain support |

### Map Tile Source

Use free community tile providers compatible with MapLibre:

- **Primary:** OpenFreeMap or MapTiler free tier (no key needed for basic styles)
- **Fallback:** Stadia Maps free tier or self-hosted PMTiles for zero-dependency setup

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ File Drop │───▶│  FIT Parser  │───▶│   Store    │ │
│  │   Zone    │    │  (Worker*)   │    │  (Zustand) │ │
│  └──────────┘    └──────────────┘    └─────┬──────┘ │
│                                            │        │
│                    ┌───────────────────┬────┴───┐    │
│                    ▼                   ▼        ▼    │
│             ┌────────────┐   ┌──────────┐ ┌───────┐ │
│             │  Dashboard  │   │   Map    │ │Charts │ │
│             │  (Summary)  │   │(MapLibre)│ │(Re-   │ │
│             │             │   │          │ │charts)│ │
│             └────────────┘   └──────────┘ └───────┘ │
│                                                      │
│  * FIT parsing in Web Worker for large files         │
└─────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

1. **Web Worker for parsing** — FIT files can be 1-5MB. Parsing on a worker thread keeps the UI responsive. The worker posts back structured JSON.

2. **Zustand store as single source of truth** — Once parsed, the run data lives in a normalized store. All components (map, charts, summary) subscribe to slices of this store.

3. **No routing needed initially** — Single-page app with tab-based navigation within the dashboard. If multi-file is added later, add `react-router` for `/compare` route.

4. **All computation client-side** — Pace calculations, zone bucketing, split generation, smoothing — all done in utility functions after parsing. No server roundtrips.

### Data Flow

```
.fit file  →  ArrayBuffer  →  Web Worker (parse)  →  Structured Run Data
                                                          │
                                    ┌─────────────────────┼──────────────┐
                                    ▼                     ▼              ▼
                              Summary Stats         GPS Records    Lap Records
                              (distance, time,      (lat, lon,     (auto splits,
                               avg pace, avg HR,     timestamp,     manual laps,
                               total ascent...)      HR, pace,      per-lap stats)
                                                     cadence,
                                                     altitude)
```

### Parsed Data Model (TypeScript)

```typescript
interface RunData {
  summary: RunSummary;
  records: DataPoint[];        // time-series GPS + metrics
  laps: Lap[];                 // auto + manual laps
  sessions: Session[];         // FIT session records
}

interface RunSummary {
  startTime: Date;
  totalDistance: number;        // meters
  totalTime: number;           // seconds
  movingTime: number;
  avgPace: number;             // sec/km
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  totalAscent: number;
  totalDescent: number;
  calories: number;
}

interface DataPoint {
  timestamp: Date;
  lat: number;
  lon: number;
  altitude: number;
  heartRate: number;
  pace: number;                // sec/km
  speed: number;               // m/s
  cadence: number;
  strideLength: number;        // meters
  distance: number;            // cumulative meters
}

interface Lap {
  type: 'auto' | 'manual';
  startIndex: number;
  endIndex: number;
  distance: number;
  totalTime: number;
  avgPace: number;
  avgHeartRate: number;
  avgCadence: number;
  elevationGain: number;
}
```

---

## Feature Set & Backlog

### Epic 1 — File Handling & Parsing

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.1 | Drag & drop zone | Full-page drop zone + file picker button for `.fit` files | Must |
| 1.2 | FIT file parsing | Parse FIT binary format in a Web Worker, extract records/laps/sessions | Must |
| 1.3 | Parse error handling | Friendly error messages for corrupt, non-FIT, or unsupported files | Must |
| 1.4 | Sample file loader | "Try with sample data" button that loads a bundled example FIT file | Should |
| 1.5 | Recent files (session) | Remember recently loaded files in memory during session | Could |

### Epic 2 — Dashboard Summary

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 2.1 | Summary cards | Key stats in shadcn cards: distance, duration, avg pace, avg HR, calories, elevation | Must |
| 2.2 | Pace unit toggle | Switch between min/km and min/mile across all views | Must |
| 2.3 | Dark/light mode | Theme toggle using shadcn's built-in theming | Should |
| 2.4 | Run title & date | Display start time, day of week, and inferred run name | Must |

### Epic 3 — Interactive Map

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 3.1 | Route polyline | Draw the GPS route on MapLibre with a colored polyline | Must |
| 3.2 | Color by metric | Color the route by pace, HR, elevation, or cadence (gradient) | Must |
| 3.3 | Start/finish markers | Distinct markers for start and finish points | Must |
| 3.4 | Km/mile markers | Show split markers along the route | Should |
| 3.5 | Hover sync | Hovering on the map highlights the corresponding point on charts (and vice versa) | Must |
| 3.6 | Lap segments | Visually distinguish lap boundaries on the map | Should |
| 3.7 | Auto-fit bounds | Auto-zoom to fit the entire route on load | Must |

### Epic 4 — Charts & Graphs

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 4.1 | Pace chart | Pace over distance/time with smoothing options | Must |
| 4.2 | Heart rate chart | HR over distance/time, with zone background bands | Must |
| 4.3 | Elevation profile | Area chart showing altitude over distance | Must |
| 4.4 | Cadence chart | Cadence (spm) over distance/time | Must |
| 4.5 | Chart axis toggle | Switch X-axis between distance and time on all charts | Must |
| 4.6 | Brush/zoom on charts | Select a range on any chart to zoom in, synced across all charts | Should |
| 4.7 | Smoothing control | Slider to adjust data smoothing (rolling average window) | Should |
| 4.8 | Hover crosshair sync | Hovering any chart shows crosshair on all charts + map at same point | Must |

### Epic 5 — Heart Rate Zone Analysis

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 5.1 | Zone configuration | Set max HR and zone boundaries (default: 5-zone model) | Must |
| 5.2 | Zone distribution bar | Horizontal stacked bar showing % time in each zone | Must |
| 5.3 | Zone time table | Table with time spent in each zone | Must |
| 5.4 | Zone colors on HR chart | Background bands on the HR chart colored by zone | Must |

### Epic 6 — Splits & Laps Table

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 6.1 | Auto splits table | Per-km (or per-mile) table: pace, HR, cadence, elevation, time | Must |
| 6.2 | Manual laps table | Separate table for watch-triggered manual laps | Must |
| 6.3 | Split comparison bar chart | Visual bar chart of split paces for quick comparison | Should |
| 6.4 | Highlight split on map | Click a split row to highlight that segment on the map | Should |
| 6.5 | Best/worst split badges | Visual indicators on fastest and slowest splits | Should |

### Epic 7 — UI Shell & Navigation

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 7.1 | Tab navigation | Tabs for: Overview, Map, Charts, Splits, Zones | Must |
| 7.2 | Responsive layout | Works well on desktop and tablet (mobile is a stretch) | Must |
| 7.3 | Loading skeleton | shadcn skeleton components while parsing | Should |
| 7.4 | Empty state | Attractive landing/drop zone when no file is loaded | Must |
| 7.5 | Keyboard shortcuts | Quick navigation between tabs | Could |

### Epic 8 — Deployment & DX

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 8.1 | Vite build config | Production-ready static build with code splitting | Must |
| 8.2 | GitHub Actions CI/CD | Auto-deploy to GitHub Pages on push to `main` | Must |
| 8.3 | PWA support | Service worker + manifest for offline use after first load | Could |
| 8.4 | Lighthouse ≥ 90 | Performance, accessibility, best practices audit | Should |

### Epic 9 — Future / Nice-to-Have

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 9.1 | Multi-file comparison | Load two FIT files and overlay routes/metrics side by side | Later |
| 9.2 | Export to PNG/PDF | Export charts or the full dashboard as an image or PDF | Later |
| 9.3 | Strava-style "share card" | Generate a shareable summary image of the run | Later |
| 9.4 | GPX/TCX import | Support additional file formats beyond FIT | Later |
| 9.5 | Training load / TRIMP | Calculate training impulse from HR data | Later |

---

## Project Structure

```
fitviewer/
├── public/
│   └── sample.fit                    # bundled sample file
├── src/
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── RunHeader.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── map/
│   │   │   ├── RunMap.tsx
│   │   │   └── MapControls.tsx
│   │   ├── charts/
│   │   │   ├── PaceChart.tsx
│   │   │   ├── HeartRateChart.tsx
│   │   │   ├── ElevationChart.tsx
│   │   │   ├── CadenceChart.tsx
│   │   │   └── ChartControls.tsx
│   │   ├── splits/
│   │   │   ├── SplitsTable.tsx
│   │   │   ├── LapsTable.tsx
│   │   │   └── SplitBarChart.tsx
│   │   ├── zones/
│   │   │   ├── ZoneConfig.tsx
│   │   │   ├── ZoneDistribution.tsx
│   │   │   └── ZoneTimeTable.tsx
│   │   └── file/
│   │       ├── DropZone.tsx
│   │       └── FileLoader.tsx
│   ├── workers/
│   │   └── fit-parser.worker.ts      # Web Worker for parsing
│   ├── store/
│   │   └── useRunStore.ts            # Zustand store
│   ├── lib/
│   │   ├── fit-parser.ts             # Parser wrapper
│   │   ├── calculations.ts           # Pace, zones, splits logic
│   │   ├── smoothing.ts              # Data smoothing utilities
│   │   └── units.ts                  # Unit conversion helpers
│   ├── types/
│   │   └── run.ts                    # TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Pages deploy
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Deployment Strategy

```
Developer pushes to main
        │
        ▼
GitHub Actions triggered
        │
        ▼
npm ci → npm run build
        │
        ▼
dist/ folder deployed to gh-pages branch
        │
        ▼
Live at: https://<username>.github.io/fitviewer/
```

The GitHub Action uses `peaceiris/actions-gh-pages` to publish the `dist/` output. Vite is configured with `base: '/fitviewer/'` for correct asset paths under the repo subpath.

---

## Non-Goals (Explicit Exclusions)

- **No backend or server** — everything runs in the browser
- **No user accounts or cloud storage** — files are processed locally and never uploaded
- **No real-time sync** — this is a post-run analysis tool
- **No mobile-first design** — desktop/tablet first, mobile is a stretch goal
- **No FIT writing** — read-only analysis, no file modification
