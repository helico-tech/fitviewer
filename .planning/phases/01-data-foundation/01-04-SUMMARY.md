---
phase: 01-data-foundation
plan: 04
subsystem: ui
tags: [react, zustand, web-worker, integration, file-upload, state-machine]

# Dependency graph
requires:
  - phase: 01-01
    provides: Zustand activity store, type contracts, Bun.serve entry point
  - phase: 01-02
    provides: FIT parser, normalizer, downsampler, Web Worker entry point
  - phase: 01-03
    provides: DropZone, BootSequence, DashboardSkeleton, HeaderBar, ErrorDisplay components
provides:
  - App root component with status-driven view switching (empty/loading/loaded/error)
  - handleFileUpload bridge between DropZone and Web Worker with file validation
  - Complete end-to-end flow from file drop to summary stats display
  - CSS layer management with z-index stacking and dissolve transitions
affects: [02-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Status-driven view switching via Zustand store", "Web Worker lazy initialization with transferable ArrayBuffer", "CSS z-index layer management for overlay stacking", "Dissolve transitions (300ms opacity) between application states"]

key-files:
  created: ["src/app/App.tsx", "src/app/App.css", "src/lib/parse-file.ts"]
  modified: ["src/app/index.tsx"]

key-decisions:
  - "Lazy Web Worker initialization -- worker created on first file upload, not at page load"
  - "DashboardSkeleton renders always as background layer; overlays (DropZone, BootSequence) stack above via z-index"
  - "Boot sequence is decorative -- parse may finish before animation, animation always completes regardless"

patterns-established:
  - "Status-driven rendering: useActivityStore status field drives which overlay renders"
  - "Transferable ArrayBuffer pattern: postMessage with transfer list to avoid copy overhead"
  - "Sport-mismatch detection: worker error details prefixed with SPORT_MISMATCH: parsed for user-friendly message"

requirements-completed: [FILE-01, FILE-02, FILE-03, FILE-04, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 1 Plan 04: Integration Wiring Summary

**App root component with state-driven view switching, Web Worker file upload bridge, and end-to-end flow from FIT file drop through boot animation to summary stats display**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T09:00:00Z
- **Completed:** 2026-03-13T09:21:13Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- App.tsx wires all Phase 1 components into a status-driven view switcher with DashboardSkeleton as permanent background, DropZone/BootSequence as z-indexed overlays, and HeaderBar appearing on successful load
- parse-file.ts validates .fit extension before processing, creates Web Worker lazily, transfers ArrayBuffer to worker, and routes success/error/sport-mismatch responses to Zustand store actions
- CSS dissolve transitions (300ms opacity) provide smooth visual flow between drop zone, boot sequence, and loaded dashboard states
- Human-verified complete end-to-end flow: drag-drop, file picker, boot animation, stats display, error handling, Replace button, UI responsiveness during parse

## Task Commits

Each task was committed atomically:

1. **Task 1: Create App component and handleFileUpload integration** - `94ef800` (feat)
2. **Task 2: End-to-end verification** - checkpoint:human-verify (approved, no commit needed)

## Files Created/Modified
- `src/app/App.tsx` - Root component with status-driven view switching between DropZone, BootSequence, and loaded Dashboard
- `src/app/App.css` - Z-index layer management (dashboard 0, header 40, dropzone 50, boot 60) with dissolve transitions
- `src/lib/parse-file.ts` - File validation, lazy Web Worker init, ArrayBuffer transfer, response routing to store
- `src/app/index.tsx` - Updated to render App component instead of placeholder

## Decisions Made
- Lazy Web Worker initialization -- worker is created on first file upload rather than at page load, avoiding unnecessary resource allocation
- DashboardSkeleton renders permanently as the background layer; other views overlay on top via z-index stacking
- Boot sequence animation is decorative and always runs to completion regardless of parse timing -- parse result is stored and displayed after boot finishes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete Phase 1 data foundation is in place: FIT parsing, normalization, downsampling, Web Worker ingest, and store-driven UI
- Phase 2 can build visualization on top of the existing NormalizedActivity data in Zustand store
- DashboardSkeleton is ready to be replaced/enhanced with real chart components
- All component patterns (BEM CSS, Zustand selectors, component-scoped styles) are established for Phase 2 to follow

## Self-Check: PASSED

All 4 files verified on disk. Task commit (94ef800) verified in git log.

---
*Phase: 01-data-foundation*
*Completed: 2026-03-13*
