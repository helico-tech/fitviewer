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
