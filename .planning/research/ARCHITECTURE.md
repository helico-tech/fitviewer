# Architecture Research

**Domain:** Client-side FIT file viewer / running telemetry dashboard (browser-only SPA)
**Researched:** 2026-03-12
**Confidence:** HIGH (well-established patterns for browser-only data viz apps; FIT parsing library APIs are stable and well-documented)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (SPA)                               │
├─────────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  UploadView  │  │ DashboardView│  │  CompareView │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
│  ┌──────┴─────────────────┴──────────────────┴───────────────────┐  │
│  │              Component Library (charts, gauges, map)          │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
├───────────────────────────────┼─────────────────────────────────────┤
│  APPLICATION STATE LAYER      │                                     │
│  ┌────────────────────────────┴──────────────────────────────────┐  │
│  │   RunStore (Zustand / React Context)                          │  │
│  │   [ ParsedRun[] | selectedRun | comparisonMode | viewport ]   │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
├───────────────────────────────┼─────────────────────────────────────┤
│  DATA / PROCESSING LAYER      │                                     │
│  ┌──────────────┐  ┌──────────┴─────┐  ┌──────────────────────┐    │
│  │  FIT Parser  │  │ Data Processor │  │  Derived Metrics     │    │
│  │ (fit-file-   │  │ (normalize,    │  │  (pace, splits,      │    │
│  │  parser)     │  │  downsample,   │  │   elevation gain)    │    │
│  │              │  │  window)       │  │                      │    │
│  └──────────────┘  └────────────────┘  └──────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  BROWSER I/O                                                        │
│  ┌──────────────────────┐   ┌─────────────────────────────────┐     │
│  │  File API            │   │  Optional: localStorage cache   │     │
│  │  (drag-drop, picker) │   │  (recent runs, tab survive)     │     │
│  └──────────────────────┘   └─────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘

  Bun.serve() + HTML imports = DEV only (HMR).
  Production = bun build → static HTML/JS/CSS to CDN / GitHub Pages.
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| UploadView | Accept FIT files via drag-drop or picker; trigger parse pipeline | React drop zone, File API |
| DashboardView | Primary telemetry display for a single run | Full-screen layout of chart/gauge components |
| CompareView | Overlay or side-by-side multi-run comparison | Mode toggle + shared viewport state |
| FIT Parser | Binary FIT → structured JS records array | `fit-file-parser` npm library |
| Data Processor | Normalize timestamps; downsample for performance; compute windows | Pure TS functions, no deps |
| Derived Metrics | Pace series, km/mile splits, elevation gain/loss, HR zones | Pure TS functions from records |
| RunStore | Single source of truth: loaded runs, selected run, UI state | Zustand atom or React Context + useReducer |
| Chart components | Render data channels (pace, HR, cadence, elevation, power) | Recharts or lightweight canvas library |
| Map component | GPS route rendering with optional playback cursor | Leaflet (browser) or MapLibre GL |
| Gauge/stat tiles | Single-value or sparkline displays | CSS + SVG or canvas |

## Recommended Project Structure

```
src/
├── lib/                    # Pure processing — no React, no side effects
│   ├── fit/
│   │   ├── parser.ts       # Thin wrapper around fit-file-parser
│   │   └── types.ts        # FitRecord, FitSummary, RawActivity types
│   ├── processing/
│   │   ├── normalize.ts    # Timestamp gaps, missing-value interpolation
│   │   ├── downsample.ts   # LTTB or min/max for large record sets
│   │   ├── splits.ts       # Compute per-km/mile splits from records
│   │   ├── zones.ts        # HR/power zone bucketing
│   │   └── derived.ts      # Pace series, elevation gain/loss, cadence avg
│   └── format.ts           # Unit formatting (m/s → min/km, m → ft, etc.)
├── store/
│   └── runs.ts             # RunStore: ParsedRun[], active run, compare state
├── components/
│   ├── upload/
│   │   └── DropZone.tsx
│   ├── charts/
│   │   ├── TimeSeriesChart.tsx   # Shared chart for any data channel
│   │   ├── ElevationChart.tsx    # Elevation profile with fill
│   │   └── HRZoneBar.tsx         # Stacked HR zone distribution
│   ├── map/
│   │   └── RouteMap.tsx          # GPS track + optional playback cursor
│   ├── gauges/
│   │   ├── StatTile.tsx          # Single metric tile (avg pace, total dist)
│   │   └── Sparkline.tsx         # Mini inline chart
│   ├── layout/
│   │   └── DashboardGrid.tsx     # CSS grid layout for dense telemetry view
│   └── compare/
│       ├── OverlayChart.tsx      # Multi-run lines on same axis
│       └── SideBySide.tsx        # Synced scrolling dual dashboards
├── views/
│   ├── UploadView.tsx
│   ├── DashboardView.tsx
│   └── CompareView.tsx
└── app.tsx                 # Root: router / view switcher + global providers
index.html                  # Bun HTML import entry point
index.ts                    # Bun.serve() dev-only server
```

### Structure Rationale

- **lib/**: Zero React dependency. All FIT processing, normalization, and derived metrics live here. This keeps logic unit-testable in isolation with `bun test` — no DOM, no component mocking required.
- **store/**: Centralized run data store. Components read from it; the parse pipeline writes to it. No prop drilling of raw FIT data through component trees.
- **components/**: Organized by UI concern (charts, map, gauges, layout, compare) not by page. Components are reused across DashboardView and CompareView.
- **views/**: Page-level components that compose lib, store, and component primitives. Views own layout decisions; they do not own data logic.
- **index.html + index.ts**: Per project constraints, Bun HTML import serves as the dev bundling mechanism. Production output is `bun build index.html` → static assets.

## Architectural Patterns

### Pattern 1: Parse-then-Store Pipeline

**What:** File input triggers a one-way pipeline: raw bytes → parsed records → normalized records → derived metrics → stored in RunStore. Components never touch raw FIT data directly.

**When to use:** Always. FIT parsing is the single data ingestion path. Keeping it linear and side-effect-free makes it testable and debuggable.

**Trade-offs:** Upfront pipeline adds a little structure. Payoff is immediate: derived metrics are pre-computed once at parse time, not recalculated on every render.

**Example:**
```typescript
// lib/fit/parser.ts
import FitParser from 'fit-file-parser';

export async function parseFitFile(buffer: ArrayBuffer): Promise<RawActivity> {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({ force: true, speedUnit: 'm/s', lengthUnit: 'm' });
    parser.parse(buffer, (error, data) => {
      if (error) reject(error);
      else resolve(data as RawActivity);
    });
  });
}

// store/runs.ts — called from DropZone after file is read
async function loadRun(file: File) {
  const buffer = await file.arrayBuffer();
  const raw = await parseFitFile(buffer);
  const records = normalizeRecords(raw.activity.sessions[0].laps);
  const derived = computeDerived(records);
  store.addRun({ id: crypto.randomUUID(), name: file.name, records, derived });
}
```

### Pattern 2: Downsampling Before Render

**What:** FIT files from a 1-hour run at 1-second recording intervals contain ~3,600 records. At 4-second intervals: ~900. Rendering all points on a chart causes noticeable jank. Downsample to ~300–500 visible points using LTTB (Largest Triangle Three Buckets) algorithm before passing data to chart components.

**When to use:** Any chart displaying time series data. Apply downsampling in the processing layer at parse time, not inside chart components. Store the downsampled series alongside the full record set.

**Trade-offs:** Downsampling at parse time costs a few milliseconds once. Not downsampling costs 16ms+ on every re-render — frame drops become visible during chart zoom/pan interactions and animated transitions.

**Example:**
```typescript
// lib/processing/downsample.ts
export function lttb<T extends { timestamp: number; value: number }>(
  data: T[],
  threshold: number
): T[] {
  if (data.length <= threshold) return data;
  // LTTB: preserve visual shape with minimal points
  // ... standard LTTB implementation
}
```

### Pattern 3: Shared Viewport State for Synced Compare Mode

**What:** In side-by-side comparison mode, both dashboards must show the same time window (domain) when one is zoomed or panned. Store the current zoom domain in RunStore, not in individual chart component state.

**When to use:** Side-by-side compare view. This pattern is overkill for single-run dashboard.

**Trade-offs:** Viewport state in global store means any chart update re-renders all synced charts. For 2–3 charts this is fine. For 20+ charts consider a separate viewport context. For this app: global store is correct.

**Example:**
```typescript
// store/runs.ts
interface RunStore {
  runs: ParsedRun[];
  compareMode: 'overlay' | 'side-by-side';
  viewport: { startTime: number | null; endTime: number | null };
  setViewport: (v: Viewport) => void;
}
```

## Data Flow

### File Upload Flow

```
User drops / selects .fit file
    ↓
DropZone (File API) → ArrayBuffer
    ↓
lib/fit/parser.ts → RawActivity (fit-file-parser)
    ↓
lib/processing/normalize.ts → NormalizedRecord[]
    ↓
lib/processing/derived.ts → DerivedMetrics (pace series, splits, zone totals)
    ↓
RunStore.addRun(ParsedRun)
    ↓
React components subscribe → re-render with new run data
```

### Chart Render Flow

```
RunStore (ParsedRun)
    ↓ (selector)
Downsampled time series (computed once at parse, stored)
    ↓ (props)
TimeSeriesChart → SVG/Canvas render
    ↓ (user zoom event)
RunStore.setViewport(domain)
    ↓ (all subscribed charts)
Re-render at new domain
```

### State Management

```
RunStore (Zustand or Context + useReducer)
    ↓ (subscribe via selector)
Chart/Gauge/Map components
    ↑ (dispatch)
User interactions (zoom, compare toggle, run selection)
    ↑ (write)
Parse pipeline (file load → addRun)
```

### Key Data Flows

1. **File ingestion:** DropZone → parse pipeline → RunStore. One-way, no component touches raw bytes after this.
2. **Chart synchronization:** Viewport state in RunStore → all visible charts subscribe → zoom on one chart propagates to all via store update.
3. **Multi-run compare:** RunStore holds `selectedRunIds[]`. CompareView reads multiple ParsedRun objects. Overlay mode renders multiple data series on one chart. Side-by-side mode renders separate chart instances sharing viewport.

## Scaling Considerations

This is a client-side-only app. "Scaling" means data size and UI complexity, not server load.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 run, <60 min | No adjustments. Direct render. |
| 1 run, 4+ hours (ultramarathon, 14,000+ records) | LTTB downsampling critical. Consider Web Worker for parse pipeline to avoid blocking UI thread. |
| 3–5 runs in memory simultaneously | Keep full records in store; derive per-view. Memory budget ~50–100MB for 5 parsed runs — fine for modern browsers. |
| 10+ runs | Add "unload run" UX. localStorage persistence for parsed run cache to avoid re-parsing. |

### Scaling Priorities

1. **First bottleneck:** Parse + derive on main thread blocking UI during file load. Fix: move `parseFitFile` and `computeDerived` into a Web Worker. This is not needed for MVP (sub-1s for typical runs) but becomes necessary for long efforts or batch loading.
2. **Second bottleneck:** Too many SVG nodes in charts during animation. Fix: switch from SVG-based charting to canvas-based rendering for animated data (e.g., `uPlot` or raw Canvas 2D API) for performance-sensitive channels.

## Anti-Patterns

### Anti-Pattern 1: Parsing Inside React Components

**What people do:** Call `FitParser` inside a `useEffect` or event handler in the DropZone component.
**Why it's wrong:** Couples I/O to rendering. Can't test the parse logic without mounting a component. Blocks the render thread for large files. Impossible to reuse in a Web Worker later without rewriting.
**Do this instead:** Parse in `lib/fit/parser.ts` as a pure async function. DropZone calls it, awaits the result, then dispatches to the store. No parsing logic inside any component.

### Anti-Pattern 2: Storing Raw FIT Records in Component State

**What people do:** `const [records, setRecords] = useState<FitRecord[]>([])` inside DashboardView.
**Why it's wrong:** Records get lost on navigation. CompareView can't access them. No way to load a second run without a prop-drilling mess. Re-parsing on every mount.
**Do this instead:** All parsed runs live in RunStore. Components are read-only consumers via selectors.

### Anti-Pattern 3: Computing Derived Metrics in Render

**What people do:** Calculate pace series, HR zone totals, and split tables inside `useMemo` inside the component.
**Why it's wrong:** `useMemo` caches by identity. FIT record arrays are large; identity checks are expensive. Derived metrics that depend on multiple records recalculate more than expected. Also: untestable without rendering.
**Do this instead:** Compute all derived metrics in `lib/processing/derived.ts` at parse time. Store the results in `ParsedRun.derived`. Components read pre-computed values directly.

### Anti-Pattern 4: One Chart Component Per Data Channel

**What people do:** `PaceChart.tsx`, `HeartRateChart.tsx`, `CadenceChart.tsx`, `ElevationChart.tsx` — each a separate component with duplicated axis/zoom/tooltip logic.
**Why it's wrong:** Any change to chart interaction behavior (zoom syncing, tooltip style, animation) must be made in 4+ places.
**Do this instead:** One `TimeSeriesChart.tsx` that accepts a data series and channel config (label, unit, color, domain hint). Per-channel components are thin wrappers with config props if needed.

### Anti-Pattern 5: Using Bun.serve() or a Backend for File Processing

**What people do:** POST the file to a server endpoint, parse server-side, return JSON.
**Why it's wrong:** Violates the privacy constraint. Requires a running server in production. Adds round-trip latency. Breaks the "static file deployment" requirement.
**Do this instead:** All processing happens in the browser. Bun.serve() is dev-only for HMR. Production build is pure static assets.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Tile map provider (OpenStreetMap / MapTiler) | HTTP fetch from browser for map tiles | Free OSM tiles work without API key. MapTiler/Mapbox needs key but gives better style options for dark theme. |
| None — intentionally | No analytics, no auth, no CDN APIs | Privacy-first means zero data leaves browser. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| lib/fit ↔ lib/processing | Direct function calls (pure TS) | No React, no state — import and call |
| lib/processing ↔ RunStore | One-way write: pipeline calls `store.addRun()` | Store never calls lib directly |
| RunStore ↔ Components | React hooks / selectors (read) + dispatch functions (write) | Components never mutate store directly |
| Components ↔ Charts | Props (data series + config) | Charts are dumb renderers — no store access |
| DropZone ↔ Parse Pipeline | DropZone calls `loadRun(file)` from store module | This is the only entry point for data |

## Build Order Implications (for Roadmap)

The dependency graph dictates this build order:

1. **lib/fit/parser.ts** — Nothing works without this. Must be first.
2. **lib/processing/** — Can be built and unit-tested without any UI.
3. **store/runs.ts** — Depends on the types from lib/. Testable with unit tests.
4. **UploadView + DropZone** — First visible feature. Depends on parser + store.
5. **TimeSeriesChart + DashboardView** — Core visualization. Depends on store + processing.
6. **RouteMap** — GPS visualization. Parallel to charts once store is ready. Leaflet integration.
7. **Split/zone views** — Derived metrics display. Depends on lib/processing/splits + zones.
8. **CompareView (overlay)** — Depends on store multi-run support. Build after single-run dashboard works.
9. **CompareView (side-by-side + viewport sync)** — Depends on overlay working. Last major feature.

Phases should mirror this order. Attempting to build compare mode before single-run dashboard is working is how you end up rewriting state management halfway through.

## Sources

- FIT SDK specification: https://developer.garmin.com/fit/protocol/ — Garmin's official FIT binary format documentation (HIGH confidence)
- fit-file-parser npm package: https://github.com/jimmykane/fit-file-parser — De facto JS client-side FIT parser (HIGH confidence, widely used in open source cycling/running tools)
- LTTB downsampling algorithm: Sveinn Steinarsson, "Downsampling Time Series for Visual Representation" (HIGH confidence — standard algorithm for time series visualization)
- Bun.serve() + HTML imports pattern: project CLAUDE.md and Bun official docs (HIGH confidence)
- Architecture patterns inferred from: open-source equivalents (FIT File Viewer, Intervals.icu, Golden Cheetah web views) and general browser-only SPA patterns (HIGH confidence from training data, MEDIUM from direct source verification since web search unavailable)

---
*Architecture research for: client-side FIT file viewer / running telemetry dashboard*
*Researched: 2026-03-12*
