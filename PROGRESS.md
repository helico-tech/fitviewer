# Progress Log

Chronological record of completed stories. The agent appends an entry here after finishing each story.

## Entry Format

Each entry should include:
- `## <story title>` as heading
- `- **Completed:** <YYYY-MM-DD HH:MM UTC>`
- `- **Epic:** <epic title>`
- `- **Summary:** <what was done>` (two or three sentences)
- `- **Changes:**` followed by a bulleted list of files or areas modified
- `- **Issues:**` (optional) problems encountered, workarounds applied, or follow-up needed

---

## Initialize Vite + React + TypeScript project
- **Completed:** 2026-03-01 08:25 UTC
- **Epic:** Project Setup
- **Summary:** Scaffolded the FitViewer project using Vite with the React + TypeScript template. Configured tsconfig with strict mode (already enabled by default in the template). Installed all core dependencies: zustand, recharts, fit-file-parser, and maplibre-gl. Verified both dev server and production build run without errors.
- **Changes:**
  - `package.json` — project scaffold with core dependencies
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript configuration with strict mode
  - `vite.config.ts` — Vite configuration with React plugin
  - `index.html` — entry HTML file
  - `src/` — React app source (App.tsx, main.tsx, default styles)
  - `eslint.config.js` — ESLint configuration
  - `.gitignore` — ignore node_modules, dist, etc.
- **Issues:** None

## Set up Tailwind CSS and shadcn/ui
- **Completed:** 2026-03-01 09:00 UTC
- **Epic:** Project Setup
- **Summary:** Installed Tailwind CSS v4 with the `@tailwindcss/vite` plugin and initialized shadcn/ui with New York style and neutral color palette. Installed all 8 required base components (button, card, tabs, table, skeleton, dropdown-menu, slider, toggle). Created a smoke-test App.tsx that renders a shadcn Card with a Button using Tailwind utility classes. Configured Vite path alias for `@/` imports.
- **Changes:**
  - `vite.config.ts` — added Tailwind CSS plugin and `@/` path alias
  - `tsconfig.json`, `tsconfig.app.json` — added `@/*` path mapping
  - `src/index.css` — replaced with Tailwind import and shadcn CSS variables
  - `src/App.tsx` — smoke-test page with shadcn Card and Button
  - `src/App.css` — removed (replaced by Tailwind utilities)
  - `src/components/ui/` — 8 shadcn components installed
  - `src/lib/utils.ts` — shadcn `cn()` utility
  - `components.json` — shadcn configuration
  - `eslint.config.js` — disabled react-refresh rule for shadcn ui components
  - `package.json` — added tailwindcss, @tailwindcss/vite, and shadcn dependencies
- **Issues:** None

## Create project directory structure and type definitions
- **Completed:** 2026-03-01 09:15 UTC
- **Epic:** Project Setup
- **Summary:** Created the full directory structure per PROJECT.md with subdirectories for components (dashboard, map, charts, splits, zones, file), workers, store, and types. Defined all core TypeScript interfaces (RunData, RunSummary, DataPoint, Lap, Session) in `src/types/run.ts` matching the data model from PROJECT.md. Verified the project compiles without errors.
- **Changes:**
  - `src/components/dashboard/` — created directory
  - `src/components/map/` — created directory
  - `src/components/charts/` — created directory
  - `src/components/splits/` — created directory
  - `src/components/zones/` — created directory
  - `src/components/file/` — created directory
  - `src/workers/` — created directory
  - `src/store/` — created directory
  - `src/types/` — created directory
  - `src/types/run.ts` — RunData, RunSummary, DataPoint, Lap, Session interfaces
- **Issues:** None

## Set up Playwright for E2E testing
- **Completed:** 2026-03-01 09:35 UTC
- **Epic:** Project Setup
- **Summary:** Installed Playwright with Chromium browser and created `playwright.config.ts` pointing to the Vite dev server. Created three smoke tests in `e2e/smoke.spec.ts` that verify the app loads, renders the FitViewer heading, and shows the Get Started button. Added `test:e2e` npm script and Playwright artifact entries to `.gitignore`.
- **Changes:**
  - `package.json` — added `@playwright/test` dev dependency and `test:e2e` script
  - `playwright.config.ts` — Playwright configuration with Vite webServer integration
  - `e2e/smoke.spec.ts` — three smoke tests verifying app renders correctly
  - `.gitignore` — added Playwright report/result directories
- **Issues:** None

## Build the drag-and-drop zone UI
- **Completed:** 2026-03-01 10:00 UTC
- **Epic:** File Handling & Parsing
- **Summary:** Created the DropZone component as the full-page landing experience when no file is loaded. It supports drag-and-drop with visual feedback (border highlight, icon change), a file picker button filtered to `.fit` files, and toast notifications for rejected non-FIT files via sonner. Updated App.tsx to render the DropZone as the main view and updated E2E tests to cover the new UI.
- **Changes:**
  - `src/components/file/DropZone.tsx` — full-page drop zone with drag-drop support, file picker, and toast errors
  - `src/components/ui/sonner.tsx` — installed sonner toast component (fixed for Vite, removed next-themes dependency)
  - `src/App.tsx` — replaced smoke-test card with DropZone component and Toaster
  - `e2e/smoke.spec.ts` — updated smoke tests for new DropZone UI
  - `e2e/dropzone.spec.ts` — new test file for DropZone interactions (file input, browse button, error toast)
  - `package.json` — added sonner dependency
- **Issues:** None

## Implement FIT file parsing in a Web Worker
- **Completed:** 2026-03-01 10:30 UTC
- **Epic:** File Handling & Parsing
- **Summary:** Created the FIT parsing Web Worker (`src/workers/fit-parser.worker.ts`) that receives an ArrayBuffer, parses it with `fit-file-parser`, and maps raw FIT fields to the RunData/DataPoint/Lap/Session interfaces. Created the parser wrapper (`src/lib/fit-parser.ts`) that provides a Promise-based API (`parseFitFile(file: File): Promise<RunData>`) managing the worker lifecycle with proper ArrayBuffer transfer. The worker handles field mapping including speed-to-pace conversion, cadence half-cycle doubling, stride length calculation, and lap type detection from `lap_trigger`.
- **Changes:**
  - `src/workers/fit-parser.worker.ts` — Web Worker with FIT parsing, field mapping, and error handling
  - `src/lib/fit-parser.ts` — Promise-based wrapper managing worker lifecycle, ArrayBuffer transfer, and Date hydration
- **Issues:** None

## Create Zustand store for run data
- **Completed:** 2026-03-01 11:00 UTC
- **Epic:** File Handling & Parsing
- **Summary:** Created the Zustand store at `src/store/useRunStore.ts` to serve as the single source of truth for parsed run data and UI state. The store holds `runData`, `isLoading`, and `error` states, plus UI preferences (`unitSystem`, `hoveredIndex`). The `loadFile` action integrates with the existing `parseFitFile` wrapper, managing loading and error states throughout the parsing lifecycle.
- **Changes:**
  - `src/store/useRunStore.ts` — Zustand store with run data state, UI state, and actions (loadFile, reset, setUnitSystem, setHoveredIndex)
- **Issues:** None

## Wire up drop zone to parser and store
- **Completed:** 2026-03-01 11:30 UTC
- **Epic:** File Handling & Parsing
- **Summary:** Connected the DropZone component to the Zustand store so that dropping/selecting a `.fit` file triggers `loadFile()`, which parses the file in a Web Worker and transitions the app through loading, success (dashboard), and error states. Created a `LoadingState` component with skeleton placeholders and a spinner, and a `DashboardPlaceholder` component that displays parsed summary stats. Error handling shows a sonner toast with the parse error message.
- **Changes:**
  - `src/App.tsx` — rewired to use Zustand store, conditional rendering for drop zone / loading / dashboard / error states
  - `src/components/file/LoadingState.tsx` — loading state with spinner and skeleton cards
  - `src/components/dashboard/DashboardPlaceholder.tsx` — temporary dashboard showing summary stats with "Load new file" button
  - `src/store/useRunStore.ts` — exposed store on window in dev mode for E2E testing
  - `e2e/wiring.spec.ts` — 5 new E2E tests covering loading state, error toast, dashboard rendering, and "Load new file" flow
- **Issues:** None

## Implement tab navigation layout
- **Completed:** 2026-03-01 12:00 UTC
- **Epic:** UI Shell & Navigation
- **Summary:** Created `DashboardLayout.tsx` with shadcn Tabs providing navigation between Overview, Map, Charts, Splits, and Zones views. The Overview tab contains the summary cards (moved from DashboardPlaceholder), while the remaining tabs render stub placeholders. A run header above the tabs shows the formatted run date/time and a "Load new file" button. Wrote 8 Playwright E2E tests verifying tab rendering, switching, content visibility, and header display.
- **Changes:**
  - `src/components/dashboard/DashboardLayout.tsx` — new component with shadcn Tabs, OverviewTab with summary cards, stub tabs, and run header
  - `src/App.tsx` — replaced DashboardPlaceholder with DashboardLayout
  - `e2e/tabs.spec.ts` — 8 new E2E tests for tab navigation
- **Issues:** None

## Add parse error handling
- **Completed:** 2026-03-01 12:30 UTC
- **Epic:** File Handling & Parsing
- **Summary:** Implemented user-friendly error handling for corrupt files, non-FIT files, and files with no run data. Non-FIT files now show "This doesn't appear to be a FIT file" inline on the drop zone. Corrupt FIT files show "This file appears to be corrupted". All errors display as dismissible inline alerts (shadcn Alert component) on the drop zone, replacing the previous toast-based approach. Added a 30-second timeout to the parser wrapper to handle cases where the FIT parser hangs on invalid data. Error state clears automatically when the user tries a new file.
- **Changes:**
  - `src/workers/fit-parser.worker.ts` — added `classifyParseError()` to map parser exceptions to friendly messages
  - `src/lib/fit-parser.ts` — added 30-second timeout with `settled` flag to prevent parser hangs
  - `src/components/file/DropZone.tsx` — replaced toast errors with inline Alert component; accepts `error` and `onDismissError` props; clears errors on new file attempts
  - `src/App.tsx` — passes store error and dismiss handler to DropZone; removed toast-based error handling
  - `src/components/ui/alert.tsx` — installed shadcn Alert component
  - `e2e/parse-errors.spec.ts` — 5 new E2E tests covering non-FIT files, corrupt files, dismissibility, error clearing, and retry flow
  - `e2e/dropzone.spec.ts` — updated existing test for new inline error UI
  - `e2e/wiring.spec.ts` — updated corrupt file test to check inline error instead of toast
- **Issues:** Discovered that `fit-file-parser` with `force: true` can hang indefinitely on certain binary data patterns, requiring the timeout safeguard.

## Add sample file loader
- **Completed:** 2026-03-01 13:00 UTC
- **Epic:** File Handling & Parsing
- **Summary:** Added a "Try with sample data" button to the drop zone that fetches a bundled sample FIT file from `public/sample.fit` and loads it through the same parsing pipeline as user-dropped files. The sample file is a real FIT file with valid GPS and metrics data. Four Playwright E2E tests verify the button appears, loads data into the dashboard, works through the same pipeline, and allows loading a new file afterward.
- **Changes:**
  - `public/sample.fit` — real FIT file bundled as sample data
  - `src/components/file/DropZone.tsx` — added `onLoadSample` and `isSampleLoading` props; renders "Try with sample data" button
  - `src/App.tsx` — added `loadSample()` function that fetches sample.fit and passes it through `loadFile()`
  - `e2e/sample-loader.spec.ts` — 4 E2E tests for sample file loader feature
- **Issues:** None

## Implement responsive layout
- **Completed:** 2026-03-01 14:00 UTC
- **Epic:** UI Shell & Navigation
- **Summary:** Made the dashboard layout fully responsive for desktop (1024px+) and tablet (768px-1023px) viewports. Desktop uses a 3-column summary card grid within a max-w-6xl container; tablet uses 2 columns with full-width cards. Tab labels show as icon-only on narrow screens and icon+text on wider viewports. Added `overflow-x-hidden` to prevent horizontal scrolling. All containers use `w-full` to ensure charts and map resize properly on window resize.
- **Changes:**
  - `src/components/dashboard/DashboardLayout.tsx` — responsive grid (`grid-cols-2 lg:grid-cols-3`), responsive padding/spacing, icon-only tab labels on small screens, truncated header
  - `src/components/file/LoadingState.tsx` — responsive skeleton grid matching dashboard breakpoints, responsive padding
  - `src/components/file/DropZone.tsx` — responsive padding for drop zone container
  - `src/index.css` — added `overflow-x-hidden` to body to prevent horizontal scrolling
  - `e2e/responsive.spec.ts` — 9 new E2E tests verifying desktop and tablet layouts, no horizontal scrolling, and drop zone responsiveness
- **Issues:** None

## Add loading skeletons
- **Completed:** 2026-03-01 14:30 UTC
- **Epic:** UI Shell & Navigation
- **Summary:** Redesigned the LoadingState component to mirror the real DashboardLayout structure with skeleton placeholders for the run header, tab bar, six summary cards, chart area, and map area. Skeleton dimensions match approximate real component sizes for a smooth transition from loading to loaded state. Added 5 Playwright E2E tests verifying skeleton visibility and disappearance on data load.
- **Changes:**
  - `src/components/file/LoadingState.tsx` — redesigned with header, tab bar, summary card, chart, and map skeletons matching dashboard layout
  - `e2e/loading-skeletons.spec.ts` — 5 new E2E tests for skeleton rendering and transition
- **Issues:** None

## Build summary cards
- **Completed:** 2026-03-01 15:00 UTC
- **Epic:** Dashboard Summary
- **Summary:** Created a dedicated `SummaryCards.tsx` component with six shadcn Cards displaying Distance, Duration, Avg Pace, Avg Heart Rate, Calories, and Elevation Gain. Each card reads from the Zustand store's `runData.summary` and includes a lucide icon. Values are properly formatted (distance as "10.23 km", pace as "5:06 /km", duration as "52:14", etc.) with em dash fallbacks for missing data. Extracted and refactored the inline cards from DashboardLayout's OverviewTab into this reusable component.
- **Changes:**
  - `src/components/dashboard/SummaryCards.tsx` — new component with six summary cards, formatting functions, and data-driven card config
  - `src/components/dashboard/DashboardLayout.tsx` — refactored OverviewTab to use SummaryCards, removed inline card code and formatting functions
  - `e2e/summary-cards.spec.ts` — 12 new E2E tests covering all cards, formatting, missing data handling, and edge cases
  - `epics/dashboard-summary.md` — marked story as done
- **Issues:** None

## Add run header with title and date
- **Completed:** 2026-03-01 15:30 UTC
- **Epic:** Dashboard Summary
- **Summary:** Extracted the run header into a dedicated `RunHeader.tsx` component displaying the run date formatted as "Saturday, March 1, 2026 — 7:32 AM" (date and time joined with an em dash), a "Run Dashboard" heading, and a "Load new file" button. The header reads from the Zustand store and is positioned above the tab navigation. Refactored DashboardLayout to use the new component, removing the inline header code and `formatDate` function.
- **Changes:**
  - `src/components/dashboard/RunHeader.tsx` — new component with formatted date (em dash separator), heading, and load new file button
  - `src/components/dashboard/DashboardLayout.tsx` — replaced inline header with RunHeader component, removed formatDate function
  - `e2e/run-header.spec.ts` — 5 new E2E tests covering date formatting, heading, load new file flow, header positioning, and different date inputs
  - `epics/dashboard-summary.md` — marked story as done
- **Issues:** None

## Implement pace unit toggle
- **Completed:** 2026-03-01 16:00 UTC
- **Epic:** Dashboard Summary
- **Summary:** Created `src/lib/units.ts` with `formatPace()`, `formatDistance()`, `convertPace()`, and `formatElevation()` helpers supporting both metric and imperial unit systems. Added a km/mi toggle switch in the RunHeader component using a button-group style with aria radiogroup semantics. Refactored SummaryCards to use the centralized unit helpers and read the `unitSystem` from the Zustand store, so toggling instantly updates distance (km/mi), pace (/km vs /mi), and elevation (m/ft).
- **Changes:**
  - `src/lib/units.ts` — new file with formatPace, formatDistance, convertPace, formatElevation helpers
  - `src/components/dashboard/RunHeader.tsx` — added UnitToggle component with km/mi buttons wired to Zustand store
  - `src/components/dashboard/SummaryCards.tsx` — refactored to use centralized unit helpers from `units.ts` and read unitSystem from store
  - `e2e/unit-toggle.spec.ts` — 6 new E2E tests covering default state, metric values, imperial conversion, toggle roundtrip, unaffected fields, and active button highlighting
  - `epics/dashboard-summary.md` — marked story as done
- **Issues:** None

## Render route polyline on MapLibre
- **Completed:** 2026-03-01 17:00 UTC
- **Epic:** Interactive Map
- **Summary:** Created `RunMap.tsx` using MapLibre GL JS with OpenFreeMap tiles (no API key required). The component reads GPS records from the Zustand store, filters out invalid coordinates, draws the route as a blue GeoJSON LineString polyline, and auto-zooms to fit the entire route with padding. Includes navigation controls (zoom in/out, compass). Integrated into the Map tab in DashboardLayout, replacing the stub placeholder.
- **Changes:**
  - `src/components/map/RunMap.tsx` — new component with MapLibre map, route polyline, auto-fit bounds, and navigation controls
  - `src/components/dashboard/DashboardLayout.tsx` — replaced Map tab StubTab with RunMap component
  - `e2e/run-map.spec.ts` — 5 new E2E tests covering map container rendering, canvas initialization, navigation controls, no-GPS handling, and zoom interaction
  - `e2e/tabs.spec.ts` — updated Map tab test to check for run-map testid instead of stub text
  - `epics/interactive-map.md` — marked story as done
- **Issues:** None

## Add dark/light mode toggle
- **Completed:** 2026-03-01 18:00 UTC
- **Epic:** Dashboard Summary
- **Summary:** Added a dark/light mode toggle button (Sun/Moon icons) in the RunHeader using shadcn's class-based theming. The toggle switches the `dark` class on `<html>`, which activates the pre-existing dark CSS variables for all shadcn components. Theme preference is persisted in localStorage and an inline script in `index.html` applies the theme before React renders to prevent flash of wrong theme. System `prefers-color-scheme` is respected as the default when no preference is stored.
- **Changes:**
  - `index.html` — added inline script to apply dark class from localStorage before render
  - `src/components/dashboard/RunHeader.tsx` — added ThemeToggle component with Sun/Moon icons using `useSyncExternalStore` to track dark class
  - `e2e/theme-toggle.spec.ts` — 7 new E2E tests covering toggle rendering, switching, persistence, reload, and dark mode styling
  - `e2e/responsive.spec.ts` — fixed pre-existing broken test (Map tab no longer uses stub Card)
  - `epics/dashboard-summary.md` — marked story as done
  - `BACKLOG.md` — marked UI Shell & Navigation and Dashboard Summary epics as done
- **Issues:** None

## Color route by metric
- **Completed:** 2026-03-01 19:00 UTC
- **Epic:** Interactive Map
- **Summary:** Added metric-based route coloring to the MapLibre map using `line-gradient` expressions. Created `MapControls.tsx` with a dropdown selector (Pace, Heart Rate, Elevation, Cadence, None) and a color legend showing a green-to-red gradient bar with formatted min/max values. Default coloring is by pace. Created `src/lib/map-colors.ts` with gradient builder, HSL-to-hex color conversion, and metric range calculation utilities. Refactored `RunMap.tsx` to use a two-effect pattern: one for map lifecycle, one for route coloring updates.
- **Changes:**
  - `src/lib/map-colors.ts` — new file with gradient builder, color conversion, and metric range utilities
  - `src/components/map/MapControls.tsx` — new component with metric selector dropdown and color legend
  - `src/components/map/RunMap.tsx` — refactored to support line-gradient coloring with two-effect pattern
  - `src/store/useRunStore.ts` — added `MapMetric` type, `mapMetric` state, and `setMapMetric` action
  - `src/components/dashboard/DashboardLayout.tsx` — integrated MapControls above RunMap in Map tab
  - `e2e/map-controls.spec.ts` — 9 new E2E tests covering selector, legend, metric switching, unit system, and rendering
  - `epics/interactive-map.md` — marked story as done
- **Issues:** None

## Add start/finish markers and km markers
- **Completed:** 2026-03-01 20:00 UTC
- **Epic:** Interactive Map
- **Summary:** Added start and finish markers to the MapLibre map as DOM markers — a green circle for start and a red square for finish, each with a popup on click. Created `src/lib/map-markers.ts` with `computeDistanceMarkers()` that interpolates GPS positions at each km (or mile) boundary along the route's cumulative distance. Distance markers render as numbered circles using a GeoJSON symbol layer with built-in collision detection (`text-allow-overlap: false`) to prevent clutter at low zoom levels. Markers respect the unit toggle, switching between km and mile spacing reactively.
- **Changes:**
  - `src/components/map/RunMap.tsx` — added start/finish DOM markers, km/mile GeoJSON symbol layer, unit system reactivity
  - `src/lib/map-markers.ts` — new file with `computeDistanceMarkers()` interpolation utility
  - `e2e/map-markers.spec.ts` — 8 new E2E tests covering start/finish marker rendering, styles, popups, km markers, short routes, and unit switching
  - `epics/interactive-map.md` — marked story as done
- **Issues:** None

## Build pace chart
- **Completed:** 2026-03-01 21:00 UTC
- **Epic:** Charts & Graphs
- **Summary:** Created `PaceChart.tsx` using Recharts `LineChart` with distance on the X-axis and pace on the Y-axis (inverted so faster pace appears higher). Created `src/lib/smoothing.ts` with a `rollingAverage()` utility that applies a centered rolling window (default 10 data points) to smooth pace data. The chart respects the unit system toggle (km/mi), formats pace as M:SS, includes a styled tooltip, and is fully responsive via `ResponsiveContainer`.
- **Changes:**
  - `src/lib/smoothing.ts` — new file with `rollingAverage(data, windowSize)` utility
  - `src/components/charts/PaceChart.tsx` — new component with Recharts LineChart, inverted Y-axis, smoothed data, custom tooltip
  - `src/components/dashboard/DashboardLayout.tsx` — replaced Charts tab stub with PaceChart component
  - `e2e/pace-chart.spec.ts` — 8 new E2E tests covering rendering, axes, Y-axis inversion, responsiveness, unit switching, tooltip, and line rendering
  - `e2e/tabs.spec.ts` — updated Charts tab test for new PaceChart fallback text
  - `e2e/responsive.spec.ts` — updated stub tab test to use Splits tab instead of Charts
  - `epics/charts-graphs.md` — marked story as done
- **Issues:** None

## Build heart rate chart
- **Completed:** 2026-03-01 22:00 UTC
- **Epic:** Charts & Graphs
- **Summary:** Created `HeartRateChart.tsx` using Recharts `LineChart` with heart rate (BPM) on the Y-axis and distance on the X-axis. Added HR zone background bands using `ReferenceArea` components — five zones (recovery through VO2max) colored as semi-transparent rectangles behind the line, calculated from the run's max heart rate. The chart uses the same smoothing (`rollingAverage` with window of 10) and unit system reactivity as the pace chart. Integrated below PaceChart in the Charts tab.
- **Changes:**
  - `src/components/charts/HeartRateChart.tsx` — new component with Recharts LineChart, HR zone bands via ReferenceArea, smoothed data, custom tooltip
  - `src/components/dashboard/DashboardLayout.tsx` — added HeartRateChart below PaceChart in Charts tab
  - `e2e/heart-rate-chart.spec.ts` — 10 new E2E tests covering rendering, axes, zone bands, zone labels, responsiveness, unit switching, tooltip, line rendering, and co-rendering with pace chart
  - `epics/charts-graphs.md` — marked story as done
- **Issues:** None

## Build elevation profile and cadence chart
- **Completed:** 2026-03-01 23:00 UTC
- **Epic:** Charts & Graphs
- **Summary:** Created `ElevationChart.tsx` as a filled Recharts `AreaChart` with a green gradient fill showing altitude over distance, and `CadenceChart.tsx` as a Recharts `LineChart` showing cadence (spm) in purple over distance. Both charts share the same X-axis scale as pace and HR charts (distance in km or miles), apply rolling average smoothing (window of 10), support unit system reactivity (km/mi for distance, m/ft for elevation), and include styled tooltips. Integrated both charts below HeartRateChart in the Charts tab.
- **Changes:**
  - `src/components/charts/ElevationChart.tsx` — new component with Recharts AreaChart, gradient fill, smoothed altitude data, m/ft unit support
  - `src/components/charts/CadenceChart.tsx` — new component with Recharts LineChart, smoothed cadence data, purple stroke
  - `src/components/dashboard/DashboardLayout.tsx` — added ElevationChart and CadenceChart to Charts tab
  - `e2e/elevation-chart.spec.ts` — 8 new E2E tests covering rendering, axes, area fill, responsiveness, unit switching, tooltip, and all-four-charts co-rendering
  - `e2e/cadence-chart.spec.ts` — 7 new E2E tests covering rendering, axes, line path, responsiveness, unit switching, and tooltip
  - `epics/charts-graphs.md` — marked story as done
- **Issues:** None
