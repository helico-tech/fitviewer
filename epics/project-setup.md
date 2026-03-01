# Epic: Project Setup

Initialize the project scaffolding, install dependencies, and configure the development toolchain so all subsequent epics have a working foundation.

## Story: Initialize Vite + React + TypeScript project
- **Status:** [x] done
- **Priority:** high

#### Tasks
- [x] Create the Vite project with React and TypeScript template
- [x] Configure tsconfig with strict mode
- [x] Install core dependencies: zustand, recharts, fit-file-parser, maplibre-gl

#### Acceptance Criteria
- `npm create vite` scaffold with React + TypeScript template
- tsconfig.json configured with strict mode
- All core dependencies installed: zustand, recharts, fit-file-parser, maplibre-gl
- `npm run dev` starts without errors
- `npm run build` compiles without errors

## Story: Set up Tailwind CSS and shadcn/ui
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Initialize Vite + React + TypeScript project

#### Tasks
- [x] Install and configure Tailwind CSS v4
- [x] Initialize shadcn/ui with New York style and neutral color palette
- [x] Install base components: button, card, tabs, table, skeleton, dropdown-menu, slider, toggle

#### Acceptance Criteria
- Tailwind CSS configured and working with Vite
- shadcn/ui initialized with New York style and neutral color palette
- Base components installed: button, card, tabs, table, skeleton, dropdown-menu, slider, toggle
- A smoke-test page renders a shadcn button with Tailwind styling

## Story: Create project directory structure and type definitions
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Set up Tailwind CSS and shadcn/ui

#### Tasks
- [x] Create folder structure per PROJECT.md (components/, workers/, store/, lib/, types/)
- [x] Define core TypeScript interfaces (RunData, RunSummary, DataPoint, Lap, Session) in `src/types/run.ts`

#### Acceptance Criteria
- Directory structure matches PROJECT.md (components/, workers/, store/, lib/, types/)
- `src/types/run.ts` contains RunData, RunSummary, DataPoint, Lap, and Session interfaces
- All interfaces match the data model from PROJECT.md
- Project still compiles without errors

## Story: Set up Playwright for E2E testing
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Set up Tailwind CSS and shadcn/ui

#### Tasks
- [x] Install Playwright and configure with `playwright.config.ts`
- [x] Configure Vite dev server integration (webServer config)
- [x] Create basic smoke test that verifies the app loads

#### Acceptance Criteria
- Playwright installed and configured with `playwright.config.ts`
- Config points to Vite dev server (webServer config)
- Smoke test navigates to the app and verifies the page title or root element renders
- `npx playwright test` passes

- **Technical Notes:** Use the playwright-cli skill for writing and running tests.
