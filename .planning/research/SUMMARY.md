# Project Research Summary

**Project:** FitViewer — client-side FIT file viewer / running telemetry dashboard
**Domain:** Browser-only SPA for GPS/fitness activity visualization
**Researched:** 2026-03-12
**Confidence:** MEDIUM (training data; no live web access; versions need verification at implementation time)

## Executive Summary

FitViewer is a browser-only SPA that parses Garmin FIT binary files client-side and presents the data as a high-density, dark/neon "mission-control" telemetry dashboard — zero server, zero account, zero data upload. The recommended approach is a React 19 + TypeScript + Bun stack with `fit-file-parser` for binary parsing, `uplot` for high-performance time-series charts (the main data channels), `recharts` for aggregate summary charts, and `maplibre-gl` for the route map. The competitive differentiation is the aesthetic plus privacy: every existing tool (Garmin Connect, Strava, Intervals.icu) requires an account and uploads your data to their servers. This one doesn't.

The critical architectural decision is to build a strict parse-then-store pipeline from day one: raw bytes enter through a Web Worker, get normalized (unit conversions, GPS semicircle-to-degrees, LTTB downsampling), and land in a Zustand store. Components are read-only consumers. This is not optional gold-plating — it directly prevents the three highest-recovery-cost failure modes: main-thread UI freeze on large files, SVG chart collapse under high-density data, and unit/coordinate bugs that infect every visualization component simultaneously.

The biggest risks are tooling compatibility (Tailwind v4 + Bun's bundler is a known rough edge, React 19 may have peer-dep warnings on several chart libraries) and scope creep (user accounts, cloud sync, and live GPS streaming are all commonly requested and all destroy the core value proposition — they must be actively refused). The product ships when the single-run dashboard with neon HUD aesthetic works well. Everything else is v1.x and beyond.

## Key Findings

### Recommended Stack

The project is already committed to Bun + TypeScript 5.9 (confirmed in lockfile and tsconfig). React 19 is the right UI layer — Bun's HTML import bundling handles it natively with zero config. Zustand is the correct state management choice for multi-run comparison where chart-linked data updates would make React Context a performance problem.

For visualization, the stack deliberately uses two charting libraries for different purposes: `uplot` (canvas-based, ~40KB) handles the main time-series panels (pace, HR, cadence, elevation, power) where data density is 3,600–14,400 points per run; `recharts` handles low-density aggregate charts (HR zone pie, lap splits bar, summary stats) where SVG integration with React is the right tradeoff. Using Recharts for the main time-series is the single most common mistake in this domain and will result in visible frame drops.

**Core technologies:**
- React 19 + TypeScript 5.9: UI and type safety — already in project config
- Bun 1.3: Dev server (HMR), bundler, test runner — project constraint
- Tailwind CSS v4: Styling — utility-first essential for dark/neon aesthetic without fighting a component library's light-mode defaults
- Zustand v5: State management — multi-run comparison requires cross-component state that Context can't handle performantly
- `fit-file-parser` ^1.9: FIT binary parsing — most widely used JS FIT parser; confirm still maintained vs. `@garmin/fitsdk`
- `uplot` ^1.6: High-performance time-series charts — canvas-based, handles 14k+ points without frame drops
- `recharts` ^2.x: Aggregate/summary charts — SVG, excellent React integration, fine for low-density data
- `maplibre-gl` ^4 + `react-map-gl` ^7: GPS route map — WebGL vector tiles, Carto Dark Matter basemap, open-source Mapbox fork
- `framer-motion` ^12: UI animations and transitions — clear category leader for React

See `STACK.md` for full alternatives analysis and version compatibility matrix.

### Expected Features

The competitive analysis reveals a clear gap: zero-account, high-aesthetic data density. Every major competitor (Garmin Connect, Strava, Intervals.icu, Runalyze) requires account creation and server-side data storage. Intervals.icu comes closest on data depth but is visually functional rather than impressive. The product wins by combining the data depth of Intervals.icu with an aesthetic that looks like a race car telemetry system.

**Must have (table stakes):**
- Drag-and-drop FIT file upload — without this, there is nothing
- Client-side FIT parsing (session + record + lap messages) — the foundation of every other feature
- Summary stats panel (distance, duration, avg/max pace, avg/max HR, elevation gain) — instant payoff on upload
- Pace chart over time — primary running metric
- Heart rate chart over time — second primary metric
- Elevation profile chart — explains pace variation
- GPS route map — visual anchor; conditional on GPS data present in file
- Lap / split table — every runner compares their splits
- Dark / neon / HUD aesthetic — this IS the differentiator; shipping with generic chart styles defeats the point
- Error handling for non-FIT files and malformed files

**Should have (competitive, v1.x):**
- Real-time scrubbing — hover chart syncs map position and all other charts to the same time index; HIGH user value but HIGH implementation complexity; requires shared cursor state upfront
- Cadence chart — natural third data channel after pace and HR
- Conditional power and running dynamics channels — conditionally rendered only when fields present in file
- Multi-run overlay comparison — core requirement per PROJECT.md; color-coded lines per run

**Defer (v2+):**
- Side-by-side comparison mode — layout complexity; validate overlay mode first
- Export as PNG — shareability; defer until base is polished
- Running Stress Score / Training Load — requires TRIMP algorithm + HR zone config; high effort for a niche feature
- IndexedDB recent files cache — convenience only; not needed for v1
- Keyboard shortcuts — power-user polish only

See `FEATURES.md` for full prioritization matrix and feature dependency graph.

### Architecture Approach

This is a browser-only SPA with a clean three-layer architecture: a pure-TypeScript data processing layer (`lib/`), a Zustand state layer (`store/`), and a React presentation layer (`components/` + `views/`). The parse-then-store pipeline is the single most important architectural decision — all FIT data enters through a Web Worker, gets normalized (unit conversions, LTTB downsampling, derived metrics computed once), and flows into `RunStore`. Components are read-only consumers via selectors and never touch raw FIT data. This makes the logic unit-testable with `bun test` without any DOM or component setup.

**Major components:**
1. `lib/fit/` — FIT binary parsing wrapper + type definitions; pure TypeScript, no React
2. `lib/processing/` — normalization, downsampling (LTTB), splits, zones, derived metrics; pure functions, unit-testable
3. `store/runs.ts` — Zustand RunStore: `ParsedRun[]`, active run, compare state, viewport (for synced zoom)
4. `components/charts/TimeSeriesChart.tsx` — single parameterized chart component for all data channels; avoids per-channel duplication
5. `components/map/RouteMap.tsx` — MapLibre GL route rendering with optional cursor playback
6. `views/DashboardView.tsx` — full-screen dense telemetry layout for single run
7. `views/CompareView.tsx` — overlay and side-by-side multi-run comparison

See `ARCHITECTURE.md` for full component diagram, data flow diagrams, and anti-pattern documentation.

### Critical Pitfalls

1. **FIT semicircle coordinates used raw as degrees** — GPS lat/lng in FIT files are 32-bit integers in semicircle units, not decimal degrees. Convert immediately at parse time: `degrees = semicircles * (180 / 2^31)`. Routes rendered without this conversion appear in the ocean or at 0,0. Recovery cost: LOW (one-line fix) but embarrassing to ship.

2. **Parsing on the main thread** — `fit-file-parser` is synchronous. A large FIT file (marathon, 8-hour ride) parsed on the main thread freezes the browser for several seconds. Use a Web Worker from day one; pass `ArrayBuffer` as a transferable object. Recovery cost: HIGH — requires architectural refactor of the entire file ingestion pipeline.

3. **Assuming all FIT fields are always present** — Different devices record different fields. A GPS-only watch has no heart rate. A treadmill activity has no GPS. If the code assumes field presence, it crashes or renders broken charts when those files are uploaded. Build capability detection at parse time and render only available panels.

4. **Chart performance collapse at high data density** — A 4-hour marathon at 1-second intervals = 14,400 data points. SVG-based chart libraries (Recharts, Nivo, Victory) collapse visibly above ~500–1,000 points. Use `uplot` (canvas) for all time-series panels. Pre-compute LTTB-downsampled series at parse time (not inside chart components). Recovery cost: MEDIUM for downsampling; HIGH if the wrong chart library is baked in.

5. **Pace unit inversion or confusion** — FIT stores speed as meters/second. Pace (min/km) is its inverse. The conversion chain has two inversion opportunities. Write explicit named functions with unit tests: `metersPerSecondToPaceMinPerKm()`. Verify displayed values match what the runner's watch showed.

6. **Multi-run comparison aligned by time, not distance** — Comparing two 5K runs with different paces by elapsed time makes the faster runner look "ahead" the entire chart. Distance-alignment is the correct default. Build interpolation onto a common distance x-axis in the processing pipeline; time-axis comparison can be a secondary toggle.

See `PITFALLS.md` for full pitfall documentation, technical debt table, integration gotchas, and performance trap analysis.

## Implications for Roadmap

Based on the dependency graph in FEATURES.md, the build order in ARCHITECTURE.md, and the pitfall-to-phase mapping in PITFALLS.md, the following phase structure is strongly recommended.

### Phase 1: Data Foundation

**Rationale:** Everything else depends on being able to parse a FIT file and get normalized, unit-correct data into the store. This phase has zero UI but is the highest-risk phase for correctness bugs. Building it first means it can be unit-tested in isolation with `bun test` before any visualization is built. All the "permanent" pitfalls (semicircle coordinates, main-thread parsing, field presence assumptions, unit conversions) must be solved here — they cannot be cost-effectively retrofitted later.

**Delivers:** Working FIT parse pipeline: Web Worker ingest → normalization → derived metrics → RunStore. No UI beyond a basic file drop area that proves the pipeline works.

**Addresses:** Drag-and-drop file upload, FIT parsing, summary stats data availability, error handling for bad files

**Avoids:** Semicircle coordinate bug (P1), main-thread blocking (P1, HIGH recovery cost), missing field crashes (P1), pace unit inversion (P1)

**Stack:** `fit-file-parser`, Zustand, Web Worker API, `bun test` for unit tests on all `lib/processing/` functions

**Research flag:** NEEDS RESEARCH — verify `fit-file-parser` current maintenance status vs. `@garmin/fitsdk`; verify Web Worker + `ArrayBuffer` transferable pattern with Bun's bundler

### Phase 2: Single-Run Dashboard (Core Visualization)

**Rationale:** Once data is in the store, build the main telemetry display. This phase is the primary value delivery — it's the "aha moment" when a user drops a file and sees their run. The dark/neon aesthetic must be included in this phase, not deferred; shipping with generic chart styles defeats the entire product concept. All primary P1 features land here.

**Delivers:** Full single-run dashboard with dark HUD aesthetic: summary stats panel, pace chart, HR chart, elevation profile, GPS route map, lap split table.

**Addresses:** Summary stats, pace chart, HR chart, elevation profile, GPS route map, lap/split table, dark/neon HUD aesthetic

**Avoids:** SVG chart performance collapse (use uplot for time-series from the start), GPS rendering without tile privacy consideration

**Stack:** `uplot` (time-series charts), `recharts` (summary/aggregate charts), `maplibre-gl` + `react-map-gl` (route map), `framer-motion` (animations), Tailwind v4 (HUD styling), `clsx`, `date-fns`

**Research flag:** NEEDS RESEARCH — verify Tailwind v4 + Bun bundler integration path; verify React 19 peer dep compatibility for `recharts`, `react-map-gl`; verify Carto Dark Matter tile availability in 2026

### Phase 3: Interactivity and Additional Data Channels

**Rationale:** Once the base dashboard is working and validated, add the features that make it feel alive rather than static. Real-time scrubbing (chart hover syncs map) is the highest-impact single feature after the base dashboard; it requires a shared cursor state that must be designed into the architecture early but built after the base charts exist. Cadence and conditional channels (power, running dynamics) extend the data model without changing the visualization architecture.

**Delivers:** Real-time chart-to-map cursor synchronization, cadence chart, conditional power/running dynamics channels for files that contain them, animated chart entry transitions.

**Addresses:** Real-time scrubbing, cadence chart, conditional power channel, conditional ground contact/vertical oscillation channels, animated/reactive charts

**Avoids:** Cursor sync state being bolted onto per-component state (must use shared RunStore viewport/cursor state)

**Stack:** Shared cursor state in Zustand RunStore, `uplot` setCursor API for cross-chart sync, `framer-motion` for entrance animations

**Research flag:** Standard patterns apply — skip additional research; uPlot's cross-instance cursor sync is well-documented

### Phase 4: Multi-Run Comparison

**Rationale:** Multi-run comparison is called out as a core requirement in PROJECT.md. It must come after the single-run dashboard is solid, because the data model (multiple ParsedRun objects in store, color-coded series), layout (CompareView), and alignment logic (distance vs. time x-axis) are significant additions. Side-by-side is a layout variation of overlay and should be built after overlay is validated.

**Delivers:** Multi-run overlay comparison (multiple color-coded runs on same chart), side-by-side synced comparison view, distance-vs-time x-axis alignment toggle.

**Addresses:** Multi-run overlay comparison, side-by-side comparison, comparison alignment by distance (default) or time

**Avoids:** Time-only comparison alignment (misleading for different-pace runs — distance alignment is the correct default), overlay without color coding (runs are indistinguishable)

**Stack:** Zustand RunStore `selectedRunIds[]`, uPlot multi-series support, shared viewport state for side-by-side sync

**Research flag:** NEEDS RESEARCH — distance-based interpolation/alignment onto a common distance grid; verify LTTB interacts correctly with distance-projected series

### Phase Ordering Rationale

- **Foundation before visualization:** The parse pipeline and data model must be correct before any chart is built. Retroactively fixing semicircle coordinates or adding capability detection when 5 charts already exist is expensive and bug-prone.
- **Single-run before multi-run:** The data model for multi-run is an extension of single-run. Building comparison before single-run works invites architectural rewrites mid-project.
- **Interactivity in Phase 3, not Phase 2:** Cursor sync requires shared state that the Phase 2 components must be designed to support, but implementing it before the basic charts exist means building on shifting ground. Design for it in Phase 2; implement in Phase 3.
- **Aesthetic in Phase 2, not deferred:** The neon HUD aesthetic is the differentiator. If it's deferred to "polish later," it never gets the integration depth it needs (chart theme, gauge SVGs, glow effects on the map). It must be built into the dashboard from the start.

### Research Flags

Phases needing deeper research during planning:

- **Phase 1 (Data Foundation):** Verify `fit-file-parser` vs. `@garmin/fitsdk` current state (training data has August 2025 cutoff); verify Bun's Web Worker support for transferable ArrayBuffers — this is critical infrastructure
- **Phase 2 (Dashboard):** Verify Tailwind v4 integration with Bun's native bundler (known rough edge per STACK.md); verify React 19 peer dep compatibility for `recharts` and `react-map-gl`; confirm Carto Dark Matter free tile URL still valid
- **Phase 4 (Comparison):** Distance-based interpolation / projection onto common distance x-axis — non-trivial algorithm, worth a dedicated research pass before implementation

Phases with standard patterns (skip research-phase):

- **Phase 3 (Interactivity):** uPlot cursor sync, Framer Motion animations, and Zustand state patterns are all well-documented; no novel integration needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices (React, TypeScript, Zustand, Framer Motion, Recharts) are HIGH confidence. FIT parser choice and Tailwind v4 + Bun integration are LOW-MEDIUM. React 19 peer deps with several libraries are LOW — test at install time. |
| Features | MEDIUM | FIT protocol field knowledge is HIGH confidence (stable spec). Competitor feature analysis is MEDIUM (no live verification). Feature priority is HIGH confidence — feature dependency graph is deterministic from the spec. |
| Architecture | HIGH | Parse-then-store pattern, Web Worker for binary parsing, LTTB downsampling, and Zustand store design are well-established patterns with strong community validation. Browser-only SPA architecture is standard. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (semicircle coords, main-thread blocking, SVG performance) are HIGH confidence — widely documented failure modes. Library-specific integration gotchas (fit-file-parser API, Leaflet init) are MEDIUM without live verification. |

**Overall confidence:** MEDIUM-HIGH

The architecture and pitfall research is well-grounded in established patterns. The main uncertainty is on specific library versions and compatibility at install time, not on the fundamental design decisions.

### Gaps to Address

- **FIT parser library choice:** Confirm `fit-file-parser` is still actively maintained and preferred over `@garmin/fitsdk`. This is a Phase 1 decision with high switching cost. Check GitHub activity and npm download trends before committing.
- **Tailwind v4 + Bun bundler integration:** This is a known rough edge. Before Phase 2, run a spike to confirm the correct integration path (CSS-first config, `@tailwindcss/bun` plugin or PostCSS). Do not attempt to integrate both simultaneously with the main chart work.
- **Carto Dark Matter tile availability:** The specific public style URL needs verification. If unavailable, the fallback plan should be decided before the map phase (MapTiler free tier, Stadia Maps, or route-only rendering with no basemap).
- **React 19 peer deps:** Install all chart and map libraries in a clean project and verify peer dependency warnings before committing to the full stack. `recharts@2.x` and `react-map-gl@7.x` both target React 18 — they may need pinned versions or forks.
- **uPlot React integration:** No official React wrapper exists. The `react-uplot` community package or a custom `useRef` + `useEffect` wrapper is required. Verify the community package is maintained before relying on it; the fallback (manual imperative wrapper) is about 40 lines and fully understood.

## Sources

### Primary (HIGH confidence)
- `tsconfig.json` and `bun.lock` in project root — confirmed React, TypeScript 5.9.3, Bun 1.3.x configuration
- `.planning/PROJECT.md` — confirmed client-side only constraint, static deployment, React, multi-run comparison requirement
- FIT Protocol SDK specification (training knowledge) — semicircle encoding, message type structure
- LTTB downsampling algorithm (Steinarson, 2013) — widely implemented, mathematically verified
- Bun.serve() + HTML imports pattern — confirmed in project CLAUDE.md

### Secondary (MEDIUM confidence)
- Training knowledge of `fit-file-parser` npm package behavior (v3.x API) — widely used in open-source fitness tools
- Training knowledge of Garmin Connect, Strava, Intervals.icu feature sets — well-established products
- MapLibre GL / react-map-gl ecosystem (post-Mapbox fork, 2020) — stable and widely adopted
- uPlot performance characteristics — used in production by Grafana; well-documented

### Tertiary (LOW confidence)
- Tailwind v4 + Bun bundler compatibility — training data notes it as a rough edge as of early 2025; needs hands-on verification
- React 19 peer dep compatibility with recharts, react-map-gl — React 19 is recent; peer dep warnings are likely
- Carto Dark Matter free tile URL availability in 2026 — needs live verification

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
