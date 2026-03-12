# Requirements: FIT Viewer

**Defined:** 2026-03-12
**Core Value:** Upload a FIT file and instantly see your run data presented like mission control telemetry. The visual experience is the product.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### File Handling

- [ ] **FILE-01**: User can upload a FIT file via drag-and-drop onto the page
- [ ] **FILE-02**: User can upload a FIT file via file picker button
- [x] **FILE-03**: User sees a friendly error when uploading a non-FIT or malformed file
- [ ] **FILE-04**: User sees file metadata after upload (device, date, sport type)

### Data Processing

- [x] **DATA-01**: FIT file is parsed entirely client-side (no server)
- [x] **DATA-02**: FIT GPS semicircle coordinates are converted to decimal degrees
- [x] **DATA-03**: Summary stats are computed (distance, duration, avg/max pace, avg/max HR, cadence, total elevation gain)
- [x] **DATA-04**: Time-series data is downsampled (LTTB) for chart performance
- [x] **DATA-05**: FIT parsing runs in a Web Worker to avoid blocking the UI

### Dashboard

- [ ] **DASH-01**: User sees a summary stats panel with key metrics after upload
- [ ] **DASH-02**: User sees a pace chart over time
- [ ] **DASH-03**: User sees a heart rate chart over time
- [ ] **DASH-04**: User sees an elevation profile chart
- [ ] **DASH-05**: User sees a cadence chart over time
- [ ] **DASH-06**: User sees a GPS route map of the run
- [ ] **DASH-07**: User sees a lap/split table with per-split metrics
- [ ] **DASH-08**: Dashboard gracefully hides panels when data channels are absent (e.g., no GPS = no map)

### Interactivity

- [ ] **INTX-01**: User can hover/scrub any chart and see synced position on all other charts and the map

### Visual Style

- [ ] **STYLE-01**: Dashboard uses a dark background with neon/glowing accent lines
- [ ] **STYLE-02**: All data is visible on one screen — dense layout, no tabs
- [ ] **STYLE-03**: Charts animate on load and react to hover
- [ ] **STYLE-04**: HUD-style gauges and overlays for key metrics

### Export

- [ ] **EXPORT-01**: User can export the dashboard view as a PNG image

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Comparison

- **COMP-01**: User can upload multiple FIT files for comparison
- **COMP-02**: User can view multi-run overlay (same chart, color-coded lines)
- **COMP-03**: User can view side-by-side synced dashboards
- **COMP-04**: Comparison aligns by distance, not time (for same-course runs)
- **COMP-05**: User can toggle between overlay and side-by-side modes

### Additional Data Channels

- **CHAN-01**: User sees power data channel (conditional — only if FIT file contains power)
- **CHAN-02**: User sees running dynamics (ground contact time, vertical oscillation — conditional)
- **CHAN-03**: User sees Running Stress Score / Training Load indicators

### Polish

- **PLSH-01**: Keyboard shortcuts for scrubbing and navigation
- **PLSH-02**: IndexedDB cache for recently viewed files

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Privacy-first, no persistence needed — defeats the "no server" constraint |
| Cloud storage of FIT files | Data stays local — this IS the differentiator vs Garmin Connect / Strava |
| Garmin Connect API / cloud sync | Requires OAuth, server, API rate limits — massive scope expansion |
| Social features (sharing, comments) | Strava does this; PNG export covers the sharing need |
| Training plan builder | Different product domain entirely |
| Live GPS streaming from device | Requires BLE/ANT+ — browser support is experimental |
| Raw FIT message inspector | Dev tool, not user tool |
| Mobile native app | Web-first; responsive layout is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILE-01 | Phase 1 | Pending |
| FILE-02 | Phase 1 | Pending |
| FILE-03 | Phase 1 | Complete |
| FILE-04 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| DASH-05 | Phase 2 | Pending |
| DASH-06 | Phase 2 | Pending |
| DASH-07 | Phase 2 | Pending |
| DASH-08 | Phase 2 | Pending |
| INTX-01 | Phase 3 | Pending |
| STYLE-01 | Phase 2 | Pending |
| STYLE-02 | Phase 2 | Pending |
| STYLE-03 | Phase 3 | Pending |
| STYLE-04 | Phase 2 | Pending |
| EXPORT-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation*
