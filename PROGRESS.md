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
