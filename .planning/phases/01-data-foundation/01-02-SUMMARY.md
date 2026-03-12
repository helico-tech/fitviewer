---
phase: 01-data-foundation
plan: 02
subsystem: data-pipeline
tags: [garmin-fitsdk, fit-parser, lttb, downsample, web-worker, tdd, semicircles]

# Dependency graph
requires:
  - phase: 01-data-foundation/01
    provides: Type contracts (NormalizedActivity, WorkerRequest/Response), @garmin/fitsdk types, stub worker
provides:
  - parseFitFile function (FIT decode, validate sport, normalize coordinates/cadence)
  - semicirclesToDegrees coordinate conversion
  - computeSummaryStats session data extraction
  - downsampleTimeSeries LTTB wrapper
  - Web Worker entry point with typed parse message handler
  - Test fixtures (running.fit, cycling.fit, garbage.bin)
affects: [01-03, 01-04, 02-01]

# Tech tracking
tech-stack:
  added: []
  patterns: ["TDD red-green-refactor cycle", "FIT SDK instance checkIntegrity (not static)", "Dual stream/decoder for integrity + decode", "LTTB via downsample library with {x,y} format"]

key-files:
  created: ["src/lib/fit-parser.ts", "src/lib/normalize.ts", "src/lib/downsample.ts", "src/lib/fit-parser.test.ts", "src/lib/normalize.test.ts", "src/lib/downsample.test.ts", "tests/fixtures/running.fit", "tests/fixtures/cycling.fit", "tests/fixtures/garbage.bin", "tests/fixtures/generate.ts", "tests/fixtures/README.md"]
  modified: ["src/lib/worker.ts", "src/lib/fit-types.d.ts"]

key-decisions:
  - "Decoder.checkIntegrity() is instance method, not static -- requires dual stream/decoder pattern"
  - "avgRunningCadence from expanded subField used directly as strides/min, avgCadence doubled as fallback"
  - "Test fixtures generated programmatically with @garmin/fitsdk Encoder for reproducible tests"
  - "downsampleTimeSeries uses {x, y} object format compatible with downsample library DataPoint type"

patterns-established:
  - "FIT parse pipeline: isFIT (static) -> checkIntegrity (instance) -> read with fresh decoder"
  - "Coordinate normalization: semicircles * (180 / 2^31), applied post-decode in record mapping"
  - "Cadence normalization: record-level cadence * 2 for SPM, session uses avgRunningCadence or avgCadence * 2"
  - "Worker message pattern: satisfies WorkerResponse for type-safe postMessage"

requirements-completed: [FILE-03, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05]

# Metrics
duration: 6min
completed: 2026-03-12
---

# Phase 1 Plan 02: Data Pipeline Summary

**FIT file parsing with @garmin/fitsdk, semicircle-to-degrees coordinate conversion, LTTB downsampling, and Web Worker entry point -- all TDD with 27 passing tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T08:45:30Z
- **Completed:** 2026-03-12T08:51:46Z
- **Tasks:** 7 (TDD: 3 RED + 3 GREEN + 1 worker implementation)
- **Files modified:** 13

## Accomplishments
- Complete FIT data pipeline: parse, validate, normalize coordinates/cadence, compute summary stats
- 27 unit tests across 3 test files covering happy path, error cases, edge cases, and coordinate/cadence normalization
- Programmatic test fixture generation via @garmin/fitsdk Encoder (running, cycling, garbage files)
- LTTB downsampling wrapper with passthrough optimization for small datasets
- Web Worker entry point with typed message protocol and error handling

## Task Commits

Each task was committed atomically (TDD red-green-refactor):

1. **RED: Normalize tests** - `1299f57` (test)
2. **GREEN: Normalize implementation** - `6e05fac` (feat)
3. **RED: FIT parser tests + fixtures** - `26e9c08` (test)
4. **GREEN: FIT parser implementation** - `d06b051` (feat)
5. **RED: Downsample tests** - `f70587c` (test)
6. **GREEN: Downsample implementation** - `46dde20` (feat)
7. **Worker implementation** - `1b3d291` (feat)

## Files Created/Modified
- `src/lib/normalize.ts` - semicirclesToDegrees conversion, computeSummaryStats extraction
- `src/lib/normalize.test.ts` - 8 tests for coordinate conversion and stats computation
- `src/lib/fit-parser.ts` - FIT decode, validate, normalize pipeline (parseFitFile)
- `src/lib/fit-parser.test.ts` - 12 tests for parse success, error handling, coordinate/cadence normalization
- `src/lib/downsample.ts` - LTTB downsampling wrapper with passthrough
- `src/lib/downsample.test.ts` - 7 tests for downsampling including edge cases
- `src/lib/worker.ts` - Web Worker entry point (replaced stub from Plan 01)
- `src/lib/fit-types.d.ts` - Updated: checkIntegrity as instance method, added Encoder and Profile types
- `tests/fixtures/running.fit` - Valid running FIT file (5 records, 1 lap, 1 session)
- `tests/fixtures/cycling.fit` - Valid cycling FIT file (for sport mismatch testing)
- `tests/fixtures/garbage.bin` - 100 random bytes (for invalid file testing)
- `tests/fixtures/generate.ts` - Fixture generator script using @garmin/fitsdk Encoder
- `tests/fixtures/README.md` - Fixture documentation

## Decisions Made
- Decoder.checkIntegrity() is an instance method (not static as RESEARCH.md suggested) -- requires creating the decoder first, then a fresh decoder for read() since checkIntegrity consumes the stream
- avgRunningCadence is an expanded subField of avgCadence (strides/min) -- used directly when available, otherwise avgCadence is doubled
- Test fixtures generated programmatically rather than using external FIT files -- ensures reproducibility and known field values for assertions
- downsampleTimeSeries uses {x, y} object format matching the downsample library's XYDataPoint type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Decoder.checkIntegrity is instance method, not static**
- **Found during:** Task 3/4 (FIT parser fixture verification)
- **Issue:** RESEARCH.md Pattern 4 showed `Decoder.checkIntegrity(stream)` as a static method, but the actual SDK has it as an instance method `decoder.checkIntegrity()`
- **Fix:** Updated fit-types.d.ts to declare checkIntegrity as instance method; implementation uses dual stream/decoder pattern (one for integrity check, fresh one for decode)
- **Files modified:** src/lib/fit-types.d.ts, src/lib/fit-parser.ts
- **Verification:** All 12 parser tests pass with correct integrity checking
- **Committed in:** 26e9c08 (types update), d06b051 (implementation)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correction from research inaccuracy. No scope creep.

## Issues Encountered
None -- all TDD cycles completed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- parseFitFile is importable from src/lib/fit-parser.ts for integration with file upload handler (Plan 04)
- Worker.ts is fully implemented and ready to be served via the /worker.js route (already set up in Plan 01)
- Test fixtures available in tests/fixtures/ for any additional integration testing
- All 27 unit tests passing, TypeScript compiles cleanly

## Self-Check: PASSED

All 13 created/modified files verified on disk. All 7 task commits (1299f57, 6e05fac, 26e9c08, d06b051, f70587c, 46dde20, 1b3d291) verified in git log. 27 tests pass, `tsc --noEmit` clean.

---
*Phase: 01-data-foundation*
*Completed: 2026-03-12*
