# Roadmap: FIT Viewer

## Overview

Four phases from a working parse pipeline through an interactive, export-ready telemetry dashboard. Phase 1 builds the data foundation — all correctness problems (semicircle coordinates, main-thread blocking, field presence) are solved before any visualization exists. Phase 2 delivers the entire single-run dashboard with the dark/neon HUD aesthetic baked in from the start. Phase 3 makes the dashboard feel alive with synchronized scrubbing and animated chart entry. Phase 4 adds PNG export as a discrete capstone. The product is complete when a user can drop a FIT file and feel like a performance engineer reviewing race telemetry.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Foundation** - Working FIT parse pipeline with Web Worker ingest, unit conversions, derived metrics, and RunStore — no visualization beyond a functional drop zone (completed 2026-03-13)
- [x] **Phase 2: Dashboard** - Full single-run telemetry dashboard with dark/neon HUD aesthetic: summary stats, charts, route map, lap splits — all in one dense screen (completed 2026-03-13)
- [ ] **Phase 3: Interactivity and Animation** - Cross-chart cursor synchronization, map position sync on scrub, and animated chart entry transitions
- [ ] **Phase 4: Export** - PNG export of the complete dashboard view

## Phase Details

### Phase 1: Data Foundation
**Goal**: A FIT file can be ingested, parsed correctly, and have all normalized data available in the store — ready for any visualization layer to consume
**Depends on**: Nothing (first phase)
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. User can drag a FIT file onto the page and it is accepted for processing
  2. User can click a file picker button and select a FIT file to process
  3. User sees a clear error message when uploading a non-FIT or malformed file
  4. After a valid upload, user sees file metadata: device, date, and sport type
  5. The browser UI remains responsive during parsing of a large file (parsing happens off the main thread)
**Plans:** 4/4 plans complete

Plans:
- [x] 01-01-PLAN.md — Project setup, type contracts, Zustand store, Bun.serve entry point
- [x] 01-02-PLAN.md — FIT data pipeline: parse, normalize, downsample, Web Worker (TDD)
- [x] 01-03-PLAN.md — UI components: drop zone, boot sequence, dashboard skeleton, header bar, error display
- [x] 01-04-PLAN.md — Integration wiring: App component, file upload handler, end-to-end verification

### Phase 2: Dashboard
**Goal**: Users see their run data presented as a high-density, dark/neon telemetry dashboard on a single screen
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, STYLE-01, STYLE-02, STYLE-04
**Success Criteria** (what must be TRUE):
  1. User sees a summary stats panel with distance, duration, avg/max pace, avg/max HR, cadence, and total elevation gain
  2. User sees pace, heart rate, elevation, and cadence charts over time without leaving the main view
  3. User sees a GPS route map rendered on a dark basemap (conditional: only when GPS data is present in the file)
  4. User sees a lap/split table with per-split metrics below the charts
  5. Dashboard panels for absent data channels (e.g., no GPS, no HR) are hidden rather than rendered empty or broken
  6. The entire dashboard uses a dark background with neon/glowing accent colors and HUD-style metric overlays
**Plans:** 4/4 plans complete

Plans:
- [x] 02-01-PLAN.md — Install dependencies, data utilities (channel detection, chart transforms), HUD StatsPanel
- [x] 02-02-PLAN.md — Four Recharts time-series charts (pace, HR, elevation, cadence) with neon glow aesthetic
- [x] 02-03-PLAN.md — MapLibre GPS route map on dark basemap, lap splits table
- [x] 02-04-PLAN.md — Dashboard integration: CSS grid layout, conditional rendering, App.tsx wiring, visual verification

### Phase 3: Interactivity and Animation
**Goal**: The dashboard feels alive — charts animate on load and scrubbing any chart syncs position across all charts and the map
**Depends on**: Phase 2
**Requirements**: INTX-01, STYLE-03
**Success Criteria** (what must be TRUE):
  1. User can hover over any chart and see a synchronized cursor appear on all other time-series charts simultaneously
  2. User can hover over any chart and see the corresponding position highlighted on the route map
  3. Charts animate in on initial data load (not static renders that appear all at once)
**Plans**: TBD

### Phase 4: Export
**Goal**: Users can share a snapshot of their telemetry dashboard as a PNG image
**Depends on**: Phase 3
**Requirements**: EXPORT-01
**Success Criteria** (what must be TRUE):
  1. User can click an export button and receive a PNG image of the current dashboard view
  2. The exported PNG includes all visible panels (charts, map, stats, splits) as rendered on screen
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation | 4/4 | Complete   | 2026-03-13 |
| 2. Dashboard | 4/4 | Complete   | 2026-03-13 |
| 3. Interactivity and Animation | 0/TBD | Not started | - |
| 4. Export | 0/TBD | Not started | - |
