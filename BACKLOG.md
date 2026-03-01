# Backlog: FitView

## Meta
- **Goal:** Browser-only FIT file viewer that lets runners drag-drop .fit files and explore run data through an interactive dashboard — no backend, no accounts, no data leaves the browser.
- **Tech Stack:** React 18+, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, MapLibre GL JS, Recharts, fit-file-parser, Playwright
- **Repository:** https://github.com/helico/fitviewer

---

## Epic: Project Setup

Initialize the project scaffolding, install dependencies, and configure the development toolchain so all subsequent epics have a working foundation.

### Story: Initialize Vite + React + TypeScript project
- **Status:** [x] done
- **Priority:** high
- **Description:** Create the Vite project with React and TypeScript template, configure tsconfig, and install core dependencies (zustand, recharts, fit-file-parser, maplibre-gl).
- **Acceptance Criteria:**
  - `npm create vite` scaffold with React + TypeScript template
  - tsconfig.json configured with strict mode
  - All core dependencies installed: zustand, recharts, fit-file-parser, maplibre-gl
  - `npm run dev` starts without errors
  - `npm run build` compiles without errors

### Story: Set up Tailwind CSS and shadcn/ui
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Initialize Vite + React + TypeScript project
- **Description:** Install and configure Tailwind CSS v4, then initialize shadcn/ui with a base set of components (button, card, tabs, table, skeleton, dropdown-menu, slider).
- **Acceptance Criteria:**
  - Tailwind CSS configured and working with Vite
  - shadcn/ui initialized with New York style and neutral color palette
  - Base components installed: button, card, tabs, table, skeleton, dropdown-menu, slider, toggle
  - A smoke-test page renders a shadcn button with Tailwind styling

### Story: Create project directory structure and type definitions
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Set up Tailwind CSS and shadcn/ui
- **Description:** Create the folder structure per PROJECT.md and define the core TypeScript interfaces (RunData, RunSummary, DataPoint, Lap) in `src/types/run.ts`.
- **Acceptance Criteria:**
  - Directory structure matches PROJECT.md (components/, workers/, store/, lib/, types/)
  - `src/types/run.ts` contains RunData, RunSummary, DataPoint, Lap, and Session interfaces
  - All interfaces match the data model from PROJECT.md
  - Project still compiles without errors

### Story: Set up Playwright for E2E testing
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Set up Tailwind CSS and shadcn/ui
- **Description:** Install Playwright, configure it for the Vite dev server, and create a basic smoke test that verifies the app loads.
- **Acceptance Criteria:**
  - Playwright installed and configured with `playwright.config.ts`
  - Config points to Vite dev server (webServer config)
  - Smoke test navigates to the app and verifies the page title or root element renders
  - `npx playwright test` passes
- **Technical Notes:** Use the playwright-cli skill for writing and running tests.

---

## Epic: File Handling & Parsing

Implement the file drop zone, FIT file parsing in a Web Worker, and error handling so users can load their run data into the app.

### Story: Build the drag-and-drop zone UI
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Create project directory structure and type definitions
- **Description:** Create a full-page `DropZone` component with drag-and-drop support and a file picker button. This is the landing page when no file is loaded.
- **Acceptance Criteria:**
  - `src/components/file/DropZone.tsx` renders a visually appealing drop zone with instructions
  - Supports drag-over visual feedback (border highlight, icon change)
  - File picker button opens native file dialog filtered to `.fit` files
  - Accepts only `.fit` files, rejects others with a toast message
  - Drop zone is the full-page empty state of the app
- **Technical Notes:** Use shadcn card and button components. Verify drag-drop interaction works using the playwright-cli skill.

### Story: Implement FIT file parsing in a Web Worker
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Create project directory structure and type definitions
- **Description:** Create `src/workers/fit-parser.worker.ts` that receives an ArrayBuffer, parses it with `fit-file-parser`, and posts back structured RunData. Create `src/lib/fit-parser.ts` as the wrapper that manages the worker lifecycle.
- **Acceptance Criteria:**
  - Web Worker receives ArrayBuffer via postMessage and returns parsed RunData
  - Parser wrapper in `src/lib/fit-parser.ts` provides a Promise-based API: `parseFitFile(file: File): Promise<RunData>`
  - Extracts records (GPS + metrics), laps, and session data from FIT files
  - Handles the mapping from raw FIT fields to the RunData/DataPoint/Lap interfaces
- **Technical Notes:** `fit-file-parser` returns raw objects — map fields like `position_lat`/`position_long` (semicircles) to decimal degrees. Speed (m/s) needs conversion to pace (sec/km).

### Story: Create Zustand store for run data
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Implement FIT file parsing in a Web Worker
- **Description:** Create `src/store/useRunStore.ts` with Zustand to hold parsed run data, loading state, error state, and UI preferences (unit system, selected metric).
- **Acceptance Criteria:**
  - Store holds: `runData: RunData | null`, `isLoading: boolean`, `error: string | null`
  - Store holds UI state: `unitSystem: 'metric' | 'imperial'`, `hoveredIndex: number | null`
  - `loadFile(file: File)` action triggers the parser and updates state
  - Loading and error states are managed correctly during parsing
  - Store is typed with TypeScript

### Story: Wire up drop zone to parser and store
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Build the drag-and-drop zone UI, Create Zustand store for run data
- **Description:** Connect the DropZone component to the Zustand store so dropping a file triggers parsing and transitions the app from empty state to dashboard.
- **Acceptance Criteria:**
  - Dropping a valid `.fit` file triggers `loadFile()` on the store
  - A loading spinner/skeleton shows while parsing
  - On success, the app transitions to the dashboard view
  - On error, a toast or alert shows a user-friendly error message
  - The drop zone disappears once data is loaded (replaced by dashboard)
- **Technical Notes:** Use the playwright-cli skill to verify the full flow: drop a sample .fit file, confirm loading state appears, confirm dashboard renders.

### Story: Add parse error handling
- **Status:** [~] in-progress
- **Priority:** medium
- **Depends on:** Wire up drop zone to parser and store
- **Description:** Handle corrupt files, non-FIT files, and unsupported FIT file types with friendly error messages.
- **Acceptance Criteria:**
  - Non-FIT files show "This doesn't appear to be a FIT file" message
  - Corrupt FIT files show "This file appears to be corrupted" message
  - Files with no GPS/record data show "No run data found in this file" message
  - Errors are dismissible and return user to the drop zone
  - Error state is cleared when user tries a new file

### Story: Add sample file loader
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Wire up drop zone to parser and store
- **Description:** Bundle a sample `.fit` file in `public/sample.fit` and add a "Try with sample data" button on the drop zone.
- **Acceptance Criteria:**
  - A real `.fit` file is placed in `public/sample.fit`
  - "Try with sample data" button on the drop zone fetches and loads the sample file
  - Sample file loads through the same parsing pipeline as user-dropped files
  - Loading the sample file transitions to the dashboard
- **Technical Notes:** Use the playwright-cli skill to test: click the sample button, verify dashboard appears with valid data.

---

## Epic: UI Shell & Navigation

Build the app shell with tab navigation, responsive layout, and loading/empty states that frame all content.

### Story: Implement tab navigation layout
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Wire up drop zone to parser and store
- **Description:** Create `DashboardLayout.tsx` with shadcn Tabs component providing navigation between Overview, Map, Charts, Splits, and Zones views.
- **Acceptance Criteria:**
  - `src/components/dashboard/DashboardLayout.tsx` renders shadcn Tabs
  - Tabs: Overview, Map, Charts, Splits, Zones
  - Tab content area renders the corresponding view component (stub placeholders initially)
  - Active tab is visually highlighted
  - App header shows the run title/date when data is loaded
- **Technical Notes:** Use the playwright-cli skill to verify tab switching renders the correct content area.

### Story: Implement responsive layout
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Implement tab navigation layout
- **Description:** Make the dashboard layout responsive for desktop and tablet. Summary cards should reflow, charts should resize, and the map should fill available space.
- **Acceptance Criteria:**
  - Desktop (1024px+): full layout with sidebar or wide cards
  - Tablet (768px-1023px): stacked layout with full-width cards
  - No horizontal scrolling on tablet or desktop viewports
  - Charts and map resize properly on window resize
- **Technical Notes:** Use the playwright-cli skill to take screenshots at different viewport sizes and verify layout.

### Story: Add loading skeletons
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Implement tab navigation layout
- **Description:** Show shadcn Skeleton components in place of summary cards, charts, and map while the FIT file is being parsed.
- **Acceptance Criteria:**
  - Skeleton placeholders render during the loading state for summary cards, chart areas, and map
  - Skeletons match the approximate dimensions of the real components
  - Skeletons disappear once data is loaded

---

## Epic: Dashboard Summary

Display key run statistics in summary cards with unit toggling and run metadata.

### Story: Build summary cards
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Implement tab navigation layout
- **Description:** Create `SummaryCards.tsx` displaying key run stats in shadcn Card components: distance, duration, avg pace, avg HR, calories, total elevation gain.
- **Acceptance Criteria:**
  - Six cards rendered: Distance, Duration, Avg Pace, Avg Heart Rate, Calories, Elevation Gain
  - Cards read data from the Zustand store's `runData.summary`
  - Values are formatted correctly (e.g., pace as "5:23 /km", distance as "10.2 km", duration as "52:14")
  - Cards use shadcn Card with clear labels and large values

### Story: Add run header with title and date
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards
- **Description:** Create `RunHeader.tsx` showing the run's start time, day of week, and a "Load new file" button.
- **Acceptance Criteria:**
  - Displays formatted date: e.g., "Saturday, March 1, 2026 — 7:32 AM"
  - Shows a "Load new file" button that resets state and returns to drop zone
  - Header is positioned above the tab navigation

### Story: Implement pace unit toggle
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards
- **Description:** Add a toggle in the header to switch between metric (min/km, km) and imperial (min/mile, miles) units. Create `src/lib/units.ts` with conversion helpers.
- **Acceptance Criteria:**
  - Toggle switch in the header for km/mi
  - `src/lib/units.ts` exports: `formatPace(secPerKm, unit)`, `formatDistance(meters, unit)`, `convertPace(secPerKm, unit)`
  - Toggling updates all summary cards, charts, and split tables
  - Unit preference is stored in the Zustand store
- **Technical Notes:** Use the playwright-cli skill to verify toggling the unit switch updates displayed values.

### Story: Add dark/light mode toggle
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Implement tab navigation layout
- **Description:** Add a theme toggle using shadcn's built-in theming support (class-based dark mode with Tailwind).
- **Acceptance Criteria:**
  - Toggle button in the header switches between light and dark mode
  - All shadcn components respect the theme
  - Map and chart components adapt to the theme
  - Theme preference persists via localStorage
- **Technical Notes:** Use the playwright-cli skill to screenshot both themes and verify contrast.

---

## Epic: Interactive Map

Display the GPS route on an interactive map with metric-based coloring and synchronized hover.

### Story: Render route polyline on MapLibre
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards
- **Description:** Create `RunMap.tsx` using MapLibre GL JS to render the GPS route as a polyline. Auto-fit the map bounds to the route on load.
- **Acceptance Criteria:**
  - `src/components/map/RunMap.tsx` renders a MapLibre map
  - GPS records from the store are drawn as a polyline on the map
  - Map auto-zooms to fit the entire route with padding on initial render
  - Uses OpenFreeMap or similar free tile source (no API key)
  - Map is interactive (pan, zoom)
- **Technical Notes:** Convert DataPoint lat/lon to GeoJSON LineString. Use `map.fitBounds()` for auto-fit.

### Story: Color route by metric
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Render route polyline on MapLibre
- **Description:** Add a dropdown to color the route polyline by pace, heart rate, elevation, or cadence using a gradient.
- **Acceptance Criteria:**
  - `src/components/map/MapControls.tsx` provides a metric selector dropdown
  - Route segments are colored by the selected metric using a gradient (green-yellow-red or similar)
  - A legend shows the color scale with min/max values
  - Default coloring is by pace
  - Changing the metric re-renders the route colors smoothly

### Story: Add start/finish markers and km markers
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Render route polyline on MapLibre
- **Description:** Show distinct markers at the start and finish points. Add kilometer (or mile) markers along the route.
- **Acceptance Criteria:**
  - Green marker at start point, red/checkered marker at finish point
  - Numbered km markers placed along the route at each kilometer
  - Markers respect the unit toggle (km vs mile markers)
  - Markers don't overlap or clutter at high zoom levels

### Story: Implement map-chart hover sync
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Color route by metric
- **Description:** Hovering on the map highlights the corresponding point on charts, and hovering on charts shows a marker on the map. Use `hoveredIndex` in the Zustand store.
- **Acceptance Criteria:**
  - Hovering the route on the map sets `hoveredIndex` in the store
  - A dot/marker appears on the map at the hovered position
  - Charts show a crosshair at the corresponding data point
  - Hovering a chart updates the map marker position
  - Smooth performance with no visible lag
- **Technical Notes:** Throttle hover events to ~60fps. Use the playwright-cli skill to verify hover interaction between map and charts.

---

## Epic: Charts & Graphs

Build time-series charts for pace, heart rate, elevation, and cadence with shared controls and synchronized hover.

### Story: Build pace chart
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards
- **Description:** Create `PaceChart.tsx` using Recharts to display pace over distance as a line/area chart with data smoothing.
- **Acceptance Criteria:**
  - `src/components/charts/PaceChart.tsx` renders a Recharts LineChart
  - X-axis shows distance (km or miles), Y-axis shows pace (min/km or min/mile)
  - Y-axis is inverted (faster pace = higher on chart, running convention)
  - Data is smoothed with a rolling average (default window size)
  - Chart is responsive and resizes with its container
- **Technical Notes:** Create `src/lib/smoothing.ts` with `rollingAverage(data, windowSize)` utility.

### Story: Build heart rate chart
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build pace chart
- **Description:** Create `HeartRateChart.tsx` displaying heart rate over distance with zone background bands.
- **Acceptance Criteria:**
  - `src/components/charts/HeartRateChart.tsx` renders HR as a line chart
  - X-axis matches the pace chart (distance or time)
  - Zone background bands are rendered as colored rectangles behind the line (if zones are configured)
  - Y-axis shows BPM
  - Chart applies the same smoothing as other charts

### Story: Build elevation profile and cadence chart
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build pace chart
- **Description:** Create `ElevationChart.tsx` as an area chart and `CadenceChart.tsx` as a line chart.
- **Acceptance Criteria:**
  - `ElevationChart.tsx` renders altitude as a filled area chart over distance
  - `CadenceChart.tsx` renders cadence (spm) as a line chart over distance
  - Both charts share the same X-axis scale as pace and HR charts
  - Both charts are responsive

### Story: Add chart axis toggle and controls
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build elevation profile and cadence chart
- **Description:** Create `ChartControls.tsx` with a toggle to switch the X-axis between distance and time across all charts. Add a smoothing slider.
- **Acceptance Criteria:**
  - Toggle switches X-axis between distance and elapsed time on all charts simultaneously
  - Smoothing slider adjusts the rolling average window (e.g., 1-30 data points)
  - Controls are placed above the chart area
  - X-axis preference and smoothing value stored in Zustand store
- **Technical Notes:** Use the playwright-cli skill to verify that toggling the X-axis updates all charts and that the smoothing slider visually affects chart lines.

### Story: Implement crosshair sync across charts
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Add chart axis toggle and controls
- **Description:** Hovering any chart shows a crosshair on all other charts at the corresponding data point, using the shared `hoveredIndex` in the Zustand store.
- **Acceptance Criteria:**
  - Hovering one chart sets `hoveredIndex` in the store
  - All other charts render a vertical crosshair line and tooltip at the same index
  - Crosshair includes the value for that chart's metric at the hovered point
  - Moving the mouse smoothly updates all charts without lag
  - Moving the mouse off a chart clears the crosshair on all charts

---

## Epic: Heart Rate Zone Analysis

Allow users to configure HR zones and visualize time distribution across zones.

### Story: Implement zone configuration
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build heart rate chart
- **Description:** Create `ZoneConfig.tsx` allowing users to set their max HR and zone boundaries. Create `src/lib/calculations.ts` with zone calculation utilities.
- **Acceptance Criteria:**
  - `src/components/zones/ZoneConfig.tsx` provides inputs for max HR and 5-zone boundaries
  - Default zones: Z1 (50-60%), Z2 (60-70%), Z3 (70-80%), Z4 (80-90%), Z5 (90-100%) of max HR
  - `src/lib/calculations.ts` exports `calculateZoneDistribution(records, zones)` returning time per zone
  - Zone config stored in Zustand store
  - Zones have standard colors (gray, blue, green, orange, red)

### Story: Build zone distribution bar and time table
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Implement zone configuration
- **Description:** Create `ZoneDistribution.tsx` (horizontal stacked bar) and `ZoneTimeTable.tsx` showing time and percentage in each zone.
- **Acceptance Criteria:**
  - `ZoneDistribution.tsx` renders a horizontal stacked bar chart showing % time in each zone
  - Each zone segment is colored with the standard zone color
  - `ZoneTimeTable.tsx` renders a table with zone name, HR range, time, and percentage
  - Both components update when zone boundaries are changed
- **Technical Notes:** Use the playwright-cli skill to verify zone distribution renders correctly with sample data and that changing max HR updates the display.

---

## Epic: Splits & Laps

Display auto-splits and manual laps in tables with visual comparison.

### Story: Build auto splits table
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build summary cards
- **Description:** Create `SplitsTable.tsx` computing per-km (or per-mile) splits from the record data and displaying them in a shadcn Table.
- **Acceptance Criteria:**
  - `src/components/splits/SplitsTable.tsx` renders a table of auto-computed splits
  - Columns: Split #, Distance, Pace, Avg HR, Avg Cadence, Elevation +/-, Time
  - Splits are computed from record data based on cumulative distance crossing km/mile boundaries
  - Split computation logic lives in `src/lib/calculations.ts`
  - Table respects the unit toggle (km vs mile splits)

### Story: Build manual laps table
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build auto splits table
- **Description:** Create `LapsTable.tsx` showing lap data from the FIT file's lap records.
- **Acceptance Criteria:**
  - `src/components/splits/LapsTable.tsx` renders laps from `runData.laps`
  - Same columns as the splits table
  - Distinguishes between auto and manual laps if both exist
  - Shows a message if no manual laps are present

### Story: Add split comparison bar chart and best/worst badges
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Build auto splits table
- **Description:** Create `SplitBarChart.tsx` showing a horizontal bar chart of split paces with visual indicators for fastest and slowest splits.
- **Acceptance Criteria:**
  - `src/components/splits/SplitBarChart.tsx` renders horizontal bars for each split's pace
  - Fastest split highlighted in green with a "Fastest" badge
  - Slowest split highlighted in red with a "Slowest" badge
  - Bar lengths are relative to the pace range
  - Chart updates when unit toggle changes

---

## Epic: Cross-Feature Integration & Polish

Wire up cross-cutting interactions, synchronization, and visual polish across all features.

### Story: Implement highlight split on map
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Build auto splits table, Render route polyline on MapLibre
- **Description:** Clicking a split row in the splits table highlights that segment on the map and scrolls the map to show it.
- **Acceptance Criteria:**
  - Clicking a split row highlights the corresponding route segment on the map with a distinct color/thickness
  - Map pans/zooms to show the selected segment
  - Clicking again or clicking another row changes the highlight
  - Highlight clears when switching away from the Splits tab

### Story: Add lap segments on map
- **Status:** [ ] todo
- **Priority:** medium
- **Depends on:** Render route polyline on MapLibre, Build manual laps table
- **Description:** Visually distinguish lap boundaries on the map with markers or color segment breaks.
- **Acceptance Criteria:**
  - Lap boundaries are shown as markers or segment breaks on the route
  - Each lap segment is visually distinguishable
  - Toggling between auto splits and manual laps updates the map markers

### Story: End-to-end UI testing with Playwright
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Build zone distribution bar and time table, Add split comparison bar chart and best/worst badges, Implement crosshair sync across charts
- **Description:** Write comprehensive Playwright E2E tests covering the core user journey: load file, verify dashboard, navigate tabs, interact with charts and map.
- **Acceptance Criteria:**
  - Test: load sample file via "Try with sample data" button, verify summary cards render with valid values
  - Test: navigate all tabs (Overview, Map, Charts, Splits, Zones) and verify content renders
  - Test: toggle unit system and verify values update
  - Test: toggle dark/light mode and verify theme changes
  - Test: verify charts render with data (check for SVG elements)
  - Test: verify map renders with a route (check for canvas element)
  - All tests pass in CI-compatible headless mode
- **Technical Notes:** Use the playwright-cli skill for all test creation and execution.

---

## Epic: Deployment & CI/CD

Configure production builds and automated deployment to GitHub Pages.

### Story: Configure Vite production build
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Implement tab navigation layout
- **Description:** Configure Vite for production with correct base path, code splitting, and asset optimization.
- **Acceptance Criteria:**
  - `vite.config.ts` sets `base: '/fitviewer/'` for GitHub Pages
  - Build produces optimized chunks with code splitting
  - Web Worker is bundled correctly
  - `npm run build` succeeds and `dist/` folder is self-contained
  - Preview with `npm run preview` works correctly

### Story: Set up GitHub Actions CI/CD
- **Status:** [ ] todo
- **Priority:** high
- **Depends on:** Configure Vite production build, End-to-end UI testing with Playwright
- **Description:** Create a GitHub Actions workflow that runs tests, builds, and deploys to GitHub Pages on push to `main`.
- **Acceptance Criteria:**
  - `.github/workflows/deploy.yml` workflow triggers on push to `main`
  - Workflow steps: install dependencies, run Playwright tests, build, deploy to gh-pages
  - Uses `peaceiris/actions-gh-pages` for deployment
  - Playwright runs in headless mode in CI
  - Build artifacts are deployed to the `gh-pages` branch
