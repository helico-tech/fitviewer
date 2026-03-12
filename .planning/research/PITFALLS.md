# Pitfalls Research

**Domain:** Client-side FIT file viewer / running telemetry dashboard
**Researched:** 2026-03-12
**Confidence:** MEDIUM (training knowledge; external tools unavailable for verification — flag for validation before implementation)

---

## Critical Pitfalls

### Pitfall 1: FIT Semicircle Coordinates Used Raw as Degrees

**What goes wrong:**
GPS latitude/longitude in FIT files are stored as 32-bit signed integers in "semicircle" units, not decimal degrees. Plotting them directly on a map produces coordinates wildly off from the actual location (typically somewhere in the ocean or at 0,0).

**Why it happens:**
The FIT protocol uses its own coordinate encoding for precision and storage efficiency. Most parsers (including `fit-file-parser`) expose raw numeric values. Developers assume parsed `position_lat` / `position_long` fields are already decimal degrees because they look like large integers, not obviously encoded values.

**How to avoid:**
Convert immediately at parse time: `degrees = semicircles * (180 / 2^31)`. Build a dedicated data normalization layer that runs all unit conversions before any data reaches the visualization layer. Never let raw FIT values touch the chart or map code.

**Warning signs:**
- Route line renders in the ocean or at an impossible location
- Latitude/longitude values in the range ±2,000,000,000 (should be ±90/±180 after conversion)
- Map marker appears at 0,0 (null island)

**Phase to address:**
FIT parsing / data normalization phase (before any visualization work begins)

---

### Pitfall 2: Blocking the Main Thread with Large File Parsing

**What goes wrong:**
Parsing a large FIT file (marathon, long ride — can be 5–20MB) synchronously on the main thread freezes the browser UI for several seconds. The app appears to hang. Users assume it crashed and close the tab.

**Why it happens:**
`fit-file-parser` and similar libraries operate synchronously. It feels fine on small test files (5k race, 30 minutes). The problem only manifests with real-world long activity files. Developers test with their own recent 5K and ship something that breaks on an 8-hour endurance event.

**How to avoid:**
Parse in a Web Worker. The main thread must never block. Pass the ArrayBuffer to the worker via transferable objects (zero-copy). Post the parsed result back. Show a loading state while parsing. This is not optional for any production-quality experience.

**Warning signs:**
- "Unresponsive page" browser dialog during upload
- UI freezes on file drop/select
- Test files are all under 1MB
- No loading/progress UI at all

**Phase to address:**
FIT parsing phase — design the Worker boundary before writing any parsing code, not after

---

### Pitfall 3: Assuming All FIT Fields Are Always Present

**What goes wrong:**
The app crashes or renders broken charts when a FIT file from a GPS-only watch (no heart rate), a cycling computer (no running cadence), or a treadmill activity (no GPS) is loaded. Different devices record different fields. A file from a Garmin Fenix has a completely different field set than one from a Forerunner or a Wahoo.

**Why it happens:**
Developers build and test with one device's files — their own. All their test data has every field. The FIT protocol explicitly allows any subset of fields to be absent. When a user uploads a file missing expected fields, `undefined` or `null` values flow into chart libraries that expect numbers, producing NaN, rendering artifacts, or thrown exceptions.

**How to avoid:**
After parsing, audit every field access with explicit null-checking. Build a "capabilities detection" step: determine what data channels are available in this specific file and render only those panels. Never attempt to render a chart for a field that isn't present. Treat `undefined` from any FIT field as expected, not exceptional.

**Warning signs:**
- Charts render as flat lines at 0
- JavaScript errors about `Cannot read property of undefined`
- App only tested with one user's watch files
- No null/undefined handling in data mapping code

**Phase to address:**
FIT parsing + data model phase — the capabilities detection pattern must be established before building any charts

---

### Pitfall 4: GPS Smoothing / Noisy Position Data Unhandled

**What goes wrong:**
Raw GPS data from consumer devices contains jitter, dropouts, and outlier spikes. An unfiltered route map shows erratic lines jumping hundreds of meters off the actual path. Derived metrics (distance, speed calculated from position) are wildly inflated. A "1km lap" appears as 1.3km because of GPS noise.

**Why it happens:**
FIT files store raw device output. Devices do apply some on-device filtering but significant noise remains, especially at tunnel entry/exit, under trees, at race start corrals, or during device warm-up. Developers assume the stored data is already clean.

**How to avoid:**
Apply a simple smoothing pass (e.g., moving average or Kalman-like filter) to GPS position data before rendering. Filter out obvious outlier points (velocity-based: if a point implies movement at 100km/h for a runner, discard it). Use the `distance` field from the FIT file for distance metrics rather than computing from GPS coordinates.

**Warning signs:**
- Route map has sudden spikes or jumps
- Displayed distance doesn't match the watch's recorded distance
- Speed spikes to physically impossible values
- Map trace doubles back on itself briefly

**Phase to address:**
Data normalization/processing phase, before map rendering

---

### Pitfall 5: Chart Performance Collapse with High-Density Data

**What goes wrong:**
A 1-hour run at 1-second recording interval = 3,600 data points. A 4-hour marathon = 14,400 points. Rendering this naively with Chart.js, Recharts, or D3 causes severe frame drops, laggy interactions, and in some cases browser crashes. Zooming and panning become unusable.

**Why it happens:**
High-level charting libraries render every data point as a DOM element or canvas path segment. This is fine up to ~500 points. Above that, rendering cost scales linearly and interaction (hover, zoom) creates event storms. The project's "dense, animated telemetry" aesthetic compounds this — multiple simultaneous charts all rendering 14k-point series.

**How to avoid:**
Downsample before rendering. Implement Largest Triangle Three Buckets (LTTB) algorithm — the standard for time-series downsampling that preserves visual shape. Use canvas-based chart renderers (Chart.js canvas mode, uPlot) rather than SVG for large series. Only render detail (full resolution) in zoomed views. WebGL-based renderers (e.g., echarts with WebGL extension) for extreme density.

**Warning signs:**
- Charts feel sluggish during interaction
- FPS drops below 30 when hovering over charts
- Multiple chart components all receiving the same 14k-point array

**Phase to address:**
Chart rendering phase — LTTB downsampling must be built into the data pipeline before charts are wired up, not retrofitted

---

### Pitfall 6: Pace Calculation Inverted or Unit-Confused

**What goes wrong:**
Pace (min/km or min/mile) is displayed inverted (showing high values for fast running, low for slow) or the unit is wrong (displaying speed in km/h when the user expects pace). FIT files store speed in meters/second. The conversion chain has multiple opportunities to invert.

**Why it happens:**
Speed and pace are inverse relationships: faster running = higher speed but lower pace value. `speed_m_s → km/h` is multiplication; `km/h → min/km` is division with inversion. Developers who think in speed (cycling background) write the conversion backwards for running context. Additionally, FIT `enhanced_speed` field may differ from `speed` field — using the wrong one produces subtly wrong values.

**How to avoid:**
Write explicit, named unit conversion functions with tests. `metersPerSecondToPaceMinPerKm(mps: number): number`. Test against known values from the source device display. Use the `enhanced_speed` field when available (it has higher precision). Display pace as time formatting (`4:30/km`), not as a raw decimal.

**Warning signs:**
- Pace chart shows slowest sections at the top
- Pace values don't match what the runner's watch displayed
- Using raw `speed` values in any formula without a named conversion function

**Phase to address:**
Data normalization phase — all unit conversions before any visualization

---

### Pitfall 7: Map Tile Loading Exposes External Dependency

**What goes wrong:**
Using OpenStreetMap tiles (default Leaflet setup) or Google Maps tiles creates a hard external dependency that requires network access, has usage limits, and can break the "no data leaves the browser" privacy promise if the tile server can infer the route from requested tile coordinates.

**Why it happens:**
Leaflet's default tile layer points to OSM tile servers. It's one line of code to get a map working. Developers ship the demo tile config into production without thinking about the implications.

**How to avoid:**
Use a self-hosted tile provider or a CDN-backed tile service that doesn't log individual tile requests in a way that could reveal routes. Consider rendering the route on a blank canvas with just the GPS trace (no map tiles) as a privacy-preserving option. If using map tiles, document the privacy implication clearly. MapTiler, Maptbox, or Stadia Maps with proper API key handling are better than raw OSM tiles.

**Warning signs:**
- Default Leaflet `TileLayer` pointing to `tile.openstreetmap.org`
- No discussion of tile provider policy in design
- "No data leaves the browser" claim combined with tile requests that encode GPS bounding box

**Phase to address:**
Map visualization phase — select tile strategy before implementing the map

---

### Pitfall 8: Multi-Run Comparison Alignment Ignores Distance vs. Time

**What goes wrong:**
In overlay/comparison mode, aligning two runs by elapsed time produces meaningless charts when comparing runs of different paces or with different stop patterns. A 5K in 25 minutes vs. a 5K in 30 minutes, aligned by time, shows one runner "ahead" of the other for the entire chart even though they ran the same course.

**Why it happens:**
Time-alignment is the obvious approach (timestamps are always available). Distance-alignment requires computing a common x-axis from accumulated distance, which involves more data processing. Developers build time-alignment first and it "looks reasonable" without considering the correct use case for comparison.

**How to avoid:**
Build comparison with both time-alignment and distance-alignment modes. Default to distance-alignment for comparing the same route across different runs. Interpolate data to a common distance grid before overlaying. This requires the normalization pipeline to be flexible enough to project any series onto an arbitrary x-axis.

**Warning signs:**
- Comparison charts only ever use timestamp as x-axis
- No interpolation logic in the data pipeline
- "Compare" feature only tested with runs of identical pace

**Phase to address:**
Multi-run comparison phase — requires the data pipeline from earlier phases to support distance-based projection

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Parse FIT on main thread | Simple code, no Worker setup | UI freezes on large files; never fixable without refactor | Never — build the Worker from the start |
| Raw FIT values to visualization layer | Skip normalization layer | Unit bugs (semicircles, m/s) infect every chart; all charts need fixing | Never — normalization layer is 20 lines |
| All data points to chart renderer | Simple data binding | Performance collapse on long activities; requires chart library swap | Only for very short demo activities (< 30 min) |
| Hardcode field presence checks | Faster initial dev | Crashes on any device that doesn't record that field | Never — costs almost nothing to check |
| Time-only x-axis for comparison | Simpler to implement | Comparison is misleading for different-pace runs | Only as a togglable fallback, not the default |
| Inline unit conversion arithmetic | No abstraction | Untestable, easy to invert; spreads across codebase | Never — a named function costs nothing |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| fit-file-parser | Calling `parse()` synchronously on main thread | Always wrap in a Web Worker; pass ArrayBuffer as transferable |
| fit-file-parser | Using the default callback API without error handling | Always handle `onError` and validate the result has expected message types |
| fit-file-parser | Assuming `records` array always exists and is non-empty | Check `result.records?.length > 0` before processing |
| Leaflet / map tiles | Using default OSM tile layer with no API key | Use a proper tile provider with usage terms; consider route-only rendering |
| Leaflet | Initializing a map in a div that has zero height | Container must have explicit CSS height before `L.map()` is called |
| Chart.js / Recharts | Passing raw FIT data directly to chart data prop | Always pass through normalization + downsampling pipeline first |
| React + charting library | Recreating chart instances on every render | Memoize data arrays; use `useMemo` for expensive transformations |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all GPS points as map markers | Map frozen on hover, lag on zoom | Use a polyline, not individual markers; simplify with Douglas-Peucker | > 500 GPS points (~8 minutes of running) |
| Full-resolution chart data on all panels | Sluggish hover interactions across the whole dashboard | LTTB downsampling to ~500 points per visible chart; full res on demand | > 2000 points (~30 min at 1s interval) |
| Recomputing derived metrics (pace, splits) on every render | CPU spike on any state change | Compute once at parse time; store in memoized derived state | Any file loaded; immediately noticeable |
| Loading all comparison runs into memory simultaneously | Memory pressure with many large files | Lazy load; keep only 2-3 parsed datasets in memory; evict LRU | > 3 large files simultaneously |
| SVG-based chart renderer for dense data | Thousands of DOM nodes; layout thrashing | Canvas-based renderer (Chart.js canvas, uPlot) for series > 1k points | > 1000 points per series |
| Synchronous file reading with FileReader | API mismatch pain with async flow | Use `file.arrayBuffer()` (modern, promise-based) instead of FileReader events | N/A — DX trap more than performance |

---

## Security Mistakes

*(This project is client-side only and processes no user credentials or sensitive server data, so the security surface is narrow. The relevant risks are:)*

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering activity metadata as raw HTML | XSS via crafted FIT file with malicious strings in activity name/notes fields | Always render metadata as text content, never `dangerouslySetInnerHTML` |
| Tile server requests that reveal GPS bounding box | User's route location exposed to tile provider's access logs | Document privacy implications; offer route-only (no tiles) rendering mode |
| Storing parsed data in localStorage | FIT data persists after session; unexpected for a privacy-first tool | Keep all parsed data in memory only; never write to Web Storage |
| Overly permissive Content-Security-Policy | Easier XSP/injection attack surface | Set strict CSP headers for map tile domains and chart assets |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading indicator during FIT parse | App appears frozen; user re-uploads or closes tab | Show spinner / "Parsing file..." state immediately on file drop, before parse completes |
| Crashing silently on unsupported/corrupt FIT file | User thinks their file is broken; no recourse | Catch all parse errors; show a friendly message with the specific file name |
| Showing empty charts for missing fields | Confusing blank panels with no explanation | Hide panels entirely when data channel is absent; show "No heart rate data in this file" |
| Displaying raw metric names from FIT spec | `enhanced_speed`, `position_lat` are meaningless to users | Map all field names to human-readable labels before any display |
| Dense layout with no visual hierarchy | Overwhelming; users can't find the key number | Lead with headline metrics (pace, distance, time) in large type; secondary data smaller |
| Comparison overlay with no color coding | Two overlapping lines are indistinguishable | Assign distinct neon colors to each run in the palette; show run label on hover |
| Scrolljacking or capturing keyboard on map | Users lose normal browser navigation | Be conservative with map interaction; don't capture scroll unless cursor is inside map |

---

## "Looks Done But Isn't" Checklist

- [ ] **FIT parsing:** Verify semicircle → degrees conversion is applied — check a known GPS coordinate against device display
- [ ] **FIT parsing:** Test with files from at least 3 different device types (GPS watch, cycling computer, treadmill)
- [ ] **FIT parsing:** Test with a file > 10MB (marathon/long ride) and verify UI remains responsive
- [ ] **GPS map:** Verify route renders at the correct real-world location, not at 0,0 or in the ocean
- [ ] **Pace display:** Verify displayed pace matches what the source device showed; check both min/km and min/mile modes
- [ ] **Charts:** Verify hover interactions remain fluid (> 30 FPS) with a 4-hour activity file
- [ ] **Missing fields:** Load a GPS-only file with no heart rate; verify no crashes and HR panel is hidden
- [ ] **Missing fields:** Load a treadmill file with no GPS; verify map panel is hidden, not broken
- [ ] **Comparison:** Test with two runs of notably different paces; verify distance-alignment mode is the default
- [ ] **Error handling:** Drop a non-FIT file (JPG, GPX, etc.) onto the uploader; verify friendly error, no crash
- [ ] **Privacy:** Verify zero network requests are made that contain activity data (check DevTools Network tab)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Semicircle coordinate bug shipped to production | LOW | One-line fix in conversion utility; deploy |
| Main-thread parsing (no Worker) | HIGH | Requires architectural refactor of file ingestion pipeline; affects all file handling code |
| No LTTB downsampling (performance on large files) | MEDIUM | Add downsampling utility + wire into data pipeline; chart components need no changes if pipeline is clean |
| Missing field null-checks | MEDIUM | Systematic audit of all field accesses; add null guards; regression-test with multi-device files |
| Time-only comparison (no distance alignment) | MEDIUM | Add distance interpolation to data pipeline; add UI toggle; existing time mode can be preserved as fallback |
| Map rendered before GPS conversion fix | LOW | Fix conversion; clear any cached parsed data; reload |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Semicircle coordinates used raw | FIT parsing + data normalization | Known-coordinate spot check against device display |
| Main thread blocking during parse | FIT parsing (architecture decision) | Chrome DevTools Performance trace shows no main thread blocking during file load |
| Missing field crashes | FIT parsing + data model | Test suite with GPS-only, HR-only, treadmill FIT files |
| GPS noise / position jitter | Data normalization | Visual inspection of rendered route; no spikes or jumps |
| Chart performance collapse | Chart rendering | FPS profiling with a 4-hour activity; > 30 FPS during hover |
| Pace unit inversion | Data normalization | Unit test for `metersPerSecondToPaceMinPerKm`; spot check vs. device |
| Map tile privacy exposure | Map visualization | DevTools Network audit; no tile requests containing route bounding box |
| Comparison alignment (time vs. distance) | Multi-run comparison | Side-by-side test of same-route different-pace runs; confirm alignment makes sense |

---

## Sources

- FIT Protocol SDK documentation (training knowledge — field encoding specs, semicircle format) — MEDIUM confidence
- `fit-file-parser` npm package behavior (training knowledge, v3.x API) — MEDIUM confidence; verify against current version
- Garmin device field availability variance (community knowledge from fitness app development) — MEDIUM confidence
- LTTB algorithm for time-series downsampling (Steinarr Hrafn Sigurdsson, 2013, widely implemented) — HIGH confidence
- Chart.js and Recharts SVG performance characteristics at scale — HIGH confidence
- Web Worker / transferable ArrayBuffer pattern for binary file processing — HIGH confidence
- Leaflet map initialization requirements (CSS height, tile layer) — HIGH confidence
- Client-side XSS via file metadata fields — HIGH confidence (standard web security principle)

---
*Pitfalls research for: client-side FIT file viewer / running telemetry dashboard*
*Researched: 2026-03-12*
