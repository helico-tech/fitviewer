# Stack Research

**Domain:** Client-side FIT file viewer / running telemetry dashboard
**Researched:** 2026-03-12
**Confidence:** MEDIUM-HIGH (no web access during research; based on training data + tsconfig/lockfile analysis; versions flagged where uncertain)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^19.x | UI framework | Already configured in tsconfig (`jsx: react-jsx`). Standard choice. Bun HTML imports support it natively with zero config. |
| TypeScript | ^5.9 | Type safety | Already installed (5.9.3 in lockfile). Strict mode enabled. |
| Bun | ^1.3 | Dev server, bundler, test runner | Existing project constraint. `Bun.serve()` for dev + `bun build` for static production output. |
| Tailwind CSS | ^4.x | Styling | Fastest path to dark/dense/neon aesthetic. Utility-first means no fighting a component library's light-mode defaults. Bun's bundler handles PostCSS. |
| Zustand | ^5.x | State management | Multi-run comparison (overlay/side-by-side) requires cross-component state for loaded FIT data. Zustand is minimal, avoids Context performance issues when chart data updates, zero boilerplate vs Redux. |

### FIT File Parsing

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `fit-file-parser` | ^1.9.x | Parse binary FIT files in the browser | Most widely used FIT parser for JS/TS. Works via `FileReader` / `ArrayBuffer` in the browser with zero server dependency. Handles the full FIT message vocabulary (records, laps, sessions, HRV data). More community usage than Garmin's own SDK meaning better issue coverage. |

**Confidence:** MEDIUM — this is training-data knowledge. Verify `fit-file-parser` is still actively maintained before committing. Alternative is `@garmin/fitsdk` (Garmin's official TS SDK, released ~2023), which has better type definitions but less community validation.

### Data Visualization — Time-Series Charts

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `uplot` | ^1.6.x | High-performance time-series chart (pace, HR, cadence, elevation over time) | Canvas-based, not SVG. A 1-hour run at 1Hz = ~3600 records; a marathon = ~15k records. SVG-based libraries (Recharts, Nivo, Victory) will choke. uPlot handles millions of points. Used by Grafana. Minimal footprint (~40KB). Dark-background aesthetics are trivial with canvas. |
| `recharts` | ^2.x | Summary/aggregate charts (pace distribution, HR zone pie, lap splits bar) | SVG-based, excellent React integration, good TypeScript types. Fine for low-data-density charts. Do NOT use for the main time-series panels. |

**Confidence (uPlot):** MEDIUM-HIGH — uPlot's performance characteristics are well-established. The React integration story is thinner (no official wrapper; use `react-uplot` or wrap in `useEffect`/`useRef`). This is the correct architectural call for telemetry data but requires more integration work than dropping in Recharts everywhere.

**Confidence (Recharts):** HIGH — stable, widely used, well-typed.

### Data Visualization — Map

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `maplibre-gl` | ^4.x | GPS route map with dark vector tile basemap | WebGL-based vector tiles. Supports Carto Dark Matter basemap (free, no API token required for basic use). Renders route as a glowing polyline over a dark map — exactly the F1/mission-control aesthetic. Leaflet + OSM tiles look like a hiking app by comparison. |
| `react-map-gl` | ^7.x | React wrapper for MapLibre GL | Provides React component API over MapLibre. Maintained by Visgl (same org as Deck.gl). Reduces imperative map lifecycle management. |

**Confidence:** MEDIUM — MapLibre GL fork of Mapbox GL JS is stable and widely adopted post-Mapbox license change (2020). Carto tile availability as free-tier needs verification as of 2026.

**Note on tile tokens:** Carto Dark Matter style is available without a token via the public style URL `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`. Verify this is still true before building the map feature.

### Animation

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `framer-motion` | ^12.x | UI transitions, animated stat counters, panel enter/exit | Best-in-class React animation. Handles layout animations (panel resize, comparison mode toggle), value interpolation for live-updating numbers, and spring physics. The "dashboard loading" sequence will look dramatically better with Framer Motion than CSS transitions. |

**Confidence:** HIGH — Framer Motion is the clear standard for React animation.

**Gauges:** Build custom SVG gauges rather than pulling in a gauge library. Semi-circular HR zone dials, pace ring gauges, etc. are ~50 lines of SVG math. A dedicated gauge library forces you into its aesthetic constraints, which will fight the custom neon look. Animate gauge needles with Framer Motion's `animate` prop.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` | ^19.x | UI runtime | Always |
| `react-dom` | ^19.x | DOM renderer | Always |
| `clsx` | ^2.x | Conditional className composition | Whenever building conditional dark/active/highlight states (which is everywhere in this UI) |
| `date-fns` | ^4.x | Date/time formatting for timestamps and durations | Pace formatting, split times, activity date display. Do NOT use moment.js. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Bun 1.3+ | Dev server + bundler + test runner | `bun --hot index.ts` for dev with HMR. `bun build index.html --outdir dist` for production static output. |
| TypeScript 5.9 | Type checking | Already configured. `strict: true` is on — keep it. |
| `@types/react` | React type definitions | Install alongside React |

---

## Installation

```bash
# Core UI
bun add react react-dom
bun add -D @types/react @types/react-dom

# FIT parsing
bun add fit-file-parser

# Charts
bun add uplot recharts

# Map
bun add maplibre-gl react-map-gl

# Animation
bun add framer-motion

# Utilities
bun add clsx date-fns

# Styling
bun add tailwindcss @tailwindcss/vite
# OR if using PostCSS with Bun:
bun add tailwindcss postcss autoprefixer
```

**Note on Tailwind v4 + Bun:** Tailwind CSS v4 changed its integration model significantly (CSS-first config, no more `tailwind.config.js`). Verify the correct integration path for Bun's bundler — the `@tailwindcss/bun` plugin or PostCSS approach. This is a known rough edge as of early 2025.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `uplot` (canvas) | `recharts` for all charts | Only if data volume per run is guaranteed small (<500 records). Never for a full-run time series. |
| `uplot` (canvas) | `ECharts` (Apache) | ECharts handles large datasets AND has richer built-in styling. Use ECharts if the uPlot React integration friction proves too high — `echarts-for-react` wrapper is more ergonomic. |
| `maplibre-gl` | `leaflet` + `react-leaflet` | If you prioritize simplicity over aesthetics. Leaflet is much easier to integrate but raster tiles look like a hiking app. |
| `maplibre-gl` | `deck.gl` PathLayer | If you need multiple overlapping routes, heatmaps, or 3D terrain. Massive overkill for a single route polyline. |
| `framer-motion` | `react-spring` | If animation needs are purely physics-based (e.g., bouncy gauge needles). Framer Motion is more general-purpose. |
| `zustand` | React Context | If state shape is extremely simple and you have only one loaded file. Context becomes a performance problem quickly when chart-linked data updates. |
| `fit-file-parser` | `@garmin/fitsdk` | If TypeScript type coverage of FIT message fields is critical (Garmin's SDK has better generated types). More official but less community tested. |
| `date-fns` | `luxon` | If you need heavy timezone handling. `date-fns` is simpler and tree-shakeable. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `recharts` for time-series with full run data | SVG rendering with 3k–15k data points causes visible frame drops and browser janking. This will make your "alive" telemetry feel dead. | `uplot` or `ECharts` |
| `moment.js` | 300KB+ bundle, deprecated project. No tree-shaking. | `date-fns` |
| `d3` as primary chart library | D3 is a toolkit, not a chart library. You'll spend 3 weeks writing chart primitives that libraries already solved. Appropriate only for highly custom visualizations where no library fits. | `uplot` + `recharts` for standard charts |
| `styled-components` / `emotion` | Runtime CSS-in-JS adds parse + inject overhead on every render. Adds complexity for zero benefit when Tailwind covers 95% of cases. | Tailwind CSS |
| `mapbox-gl` (official) | Requires API token with usage billing. MapLibre GL is the open-source fork with identical API. | `maplibre-gl` |
| `plotly.js` | 3MB+ bundle. Designed for data science notebooks, not production web apps. Complete overkill. | `uplot` for performance, `recharts` for simplicity |
| `victory` | Heavier than Recharts with worse TypeScript types. No performance advantage. | `recharts` for SVG charts |
| Express / any server framework | Project is client-side only. Bun.serve() is for dev only. | Static export via `bun build` |
| `webpack` / `vite` | Bun's bundler handles TypeScript + React + HTML imports natively. Adding Vite creates redundant config. | `bun build` |

---

## Stack Patterns by Variant

**For the main time-series dashboard panels (pace/HR/cadence/elevation):**
- Use `uplot` with a thin React wrapper (`useRef` + `useEffect` imperative initialization)
- Each panel is its own uPlot instance sharing the same time axis
- Sync cursor position across panels using uPlot's `setCursor` API

**For summary statistics (total distance, avg pace, HR zones, lap splits):**
- Use `recharts` (PieChart for HR zones, BarChart for lap splits, single-value displays)
- These have low data counts; SVG is fine and easier to style

**For the route map:**
- Use `maplibre-gl` + `react-map-gl`
- Carto Dark Matter basemap for the aesthetic
- Route polyline with a neon glow via MapLibre paint properties (`line-blur`, bright `line-color`)

**For multi-run comparison (overlay mode):**
- uPlot natively supports multiple data series — pass additional arrays to the same chart
- Color each run with a distinct neon color (cyan, magenta, yellow on black)

**For multi-run comparison (side-by-side mode):**
- Render two independent dashboard instances from the same component
- Sync scroll/time cursor position via Zustand store

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `react@19` | `recharts@2.x` | recharts 2.x supports React 18+. Verify React 19 compatibility before installing — recharts may have peer dep warnings. |
| `react@19` | `react-map-gl@7.x` | react-map-gl 7.x targets React 18. Verify React 19 compat. |
| `react@19` | `framer-motion@12.x` | framer-motion 12 supports React 19. |
| `maplibre-gl@4.x` | `react-map-gl@7.x` | react-map-gl 7.x supports maplibre-gl v3/v4 via the `mapLib` prop. |
| `tailwindcss@4.x` | Bun bundler | Tailwind v4 integration with Bun's native bundler is a rough edge — verify docs at time of implementation. May require PostCSS config. |
| `fit-file-parser` | Browser (no Node APIs) | fit-file-parser uses `DataView` / `ArrayBuffer` — browser-safe. Does NOT use `fs` or Node streams. Confirm for current version. |

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| FIT parsing library choice | MEDIUM | `fit-file-parser` is well-known but web verification was unavailable. `@garmin/fitsdk` may have overtaken it since 2024. |
| uPlot for time-series | MEDIUM-HIGH | Performance characteristics are established fact. React integration roughness is well-documented. |
| MapLibre GL + react-map-gl | MEDIUM | Stable choices, but Carto free tile availability in 2026 needs verification. |
| Recharts for aggregate charts | HIGH | Stable, widely used, well-typed. |
| Framer Motion | HIGH | Clear category leader, stable API. |
| Zustand | HIGH | Standard choice, no serious competition at this scale. |
| Tailwind v4 + Bun | LOW-MEDIUM | Tailwind v4 changed integration significantly; Bun compatibility is the unknown here. Needs hands-on verification at implementation time. |
| React 19 peer deps | LOW | React 19 is recent. Several libraries may have peer dependency warnings until they update. Test at install time. |

---

## Sources

- Training data (August 2025 cutoff) — primary source for all recommendations
- `/Users/avanwieringen/Development/helico/fitviewer/tsconfig.json` — confirmed `jsx: react-jsx`, `strict: true`, TypeScript 5.9.3
- `/Users/avanwieringen/Development/helico/fitviewer/bun.lock` — confirmed Bun 1.3.x, TypeScript 5.9.3
- `/Users/avanwieringen/Development/helico/fitviewer/.planning/PROJECT.md` — confirmed client-side only, React, static deployment constraint
- No web access was available during this research session — all version numbers and library activity status should be verified at implementation time

---

*Stack research for: Client-side FIT file viewer / running telemetry dashboard*
*Researched: 2026-03-12*
