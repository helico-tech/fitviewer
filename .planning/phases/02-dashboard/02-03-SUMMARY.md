---
phase: 02-dashboard
plan: 03
subsystem: ui
tags: [maplibre, geojson, react, gps, map, table, lap-splits]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: ActivityRecord and LapRecord types, FIT file parsing pipeline
  - phase: 02-dashboard
    plan: 01
    provides: React, MapLibre GL, react-maplibre dependencies installed
provides:
  - RouteMap component with GPS track visualization on dark basemap
  - LapTable component with formatted per-split metrics
  - Pure utility functions recordsToCoords and computeBounds
affects: [02-dashboard, dashboard-assembly]

# Tech tracking
tech-stack:
  added: []
  patterns: [geojson-linestring-rendering, maplibre-bounds-auto-zoom, ssr-component-testing]

key-files:
  created:
    - src/components/RouteMap.tsx
    - src/components/RouteMap.css
    - src/components/RouteMap.test.tsx
    - src/components/LapTable.tsx
    - src/components/LapTable.css
    - src/components/LapTable.test.tsx
  modified: []

key-decisions:
  - "LayerSpecification typed route style object for MapLibre type safety"
  - "SSR-based testing with renderToString for LapTable (same pattern as StatsPanel)"

patterns-established:
  - "GeoJSON coordinate order: [lng, lat] enforced via recordsToCoords pure function"
  - "Component returns null guard for insufficient data (RouteMap < 2 GPS coords)"
  - "Pace/duration/distance formatting functions local to component (not shared with StatsPanel)"

requirements-completed: [DASH-06, DASH-07]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 2 Plan 3: Route Map and Lap Table Summary

**MapLibre GL route map with neon green GPS track on Carto Dark Matter basemap, and lap splits table with per-split metric formatting and null-safe display**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T10:10:23Z
- **Completed:** 2026-03-13T10:13:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- RouteMap renders neon green GeoJSON LineString on Carto Dark Matter basemap with auto-zoom bounding box
- Pure functions (recordsToCoords, computeBounds) fully tested with 10 behavioral tests
- LapTable renders per-split metrics with monospace font, neon pace accent, and hover highlights
- LapTable tested with 8 behavioral tests including null handling and empty state
- Full test suite: 70 tests across 8 files, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: RouteMap component with MapLibre GL and tested pure functions** - `c7d9541` (feat)
2. **Task 2: LapTable component with neon styling and behavioral tests** - `0abed79` (feat)

_Note: TDD tasks combined RED+GREEN into single commits (pure function tests + implementation)_

## Files Created/Modified
- `src/components/RouteMap.tsx` - MapLibre GL map component with GPS track rendering
- `src/components/RouteMap.css` - Dark translucent container with border-radius
- `src/components/RouteMap.test.tsx` - 10 tests for recordsToCoords and computeBounds pure functions
- `src/components/LapTable.tsx` - Per-lap metrics table with formatting helpers
- `src/components/LapTable.css` - Neon HUD styled table with monospace font and hover effects
- `src/components/LapTable.test.tsx` - 8 tests for rendering, formatting, and null handling

## Decisions Made
- Used LayerSpecification type from maplibre-gl for route layer style object (type safety)
- SSR-based testing with renderToString for LapTable (consistent with StatsPanel test pattern from 02-02)
- Pace/duration/distance formatters defined locally in LapTable rather than importing from StatsPanel (avoiding coupling, slightly different behavior -- LapTable duration is M:SS only, StatsPanel supports h:mm:ss)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- RouteMap and LapTable components ready for dashboard assembly (Plan 02-04)
- Both components accept typed props from NormalizedActivity (records, laps)
- All 70 tests pass with zero regressions

## Self-Check: PASSED

- All 7 files verified present on disk
- Both task commits (c7d9541, 0abed79) verified in git log
- 70 tests pass across 8 files, zero regressions
- TypeScript compiles cleanly (bunx tsc --noEmit)

---
*Phase: 02-dashboard*
*Completed: 2026-03-13*
