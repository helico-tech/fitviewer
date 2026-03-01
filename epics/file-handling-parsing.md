# Epic: File Handling & Parsing

Implement the file drop zone, FIT file parsing in a Web Worker, and error handling so users can load their run data into the app.

## Story: Build the drag-and-drop zone UI
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Create project directory structure and type definitions

#### Tasks
- [x] Create `src/components/file/DropZone.tsx` with drag-and-drop support and file picker button
- [x] Implement drag-over visual feedback (border highlight, icon change)
- [x] Filter to `.fit` files only, reject others with a toast message
- [x] Make drop zone the full-page empty state of the app

#### Acceptance Criteria
- `src/components/file/DropZone.tsx` renders a visually appealing drop zone with instructions
- Supports drag-over visual feedback (border highlight, icon change)
- File picker button opens native file dialog filtered to `.fit` files
- Accepts only `.fit` files, rejects others with a toast message
- Drop zone is the full-page empty state of the app

- **Technical Notes:** Use shadcn card and button components. Verify drag-drop interaction works using the playwright-cli skill.

## Story: Implement FIT file parsing in a Web Worker
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Create project directory structure and type definitions

#### Tasks
- [x] Create `src/workers/fit-parser.worker.ts` that receives an ArrayBuffer and parses with `fit-file-parser`
- [x] Create `src/lib/fit-parser.ts` wrapper with Promise-based API: `parseFitFile(file: File): Promise<RunData>`
- [x] Extract records (GPS + metrics), laps, and session data from FIT files
- [x] Map raw FIT fields to RunData/DataPoint/Lap interfaces

#### Acceptance Criteria
- Web Worker receives ArrayBuffer via postMessage and returns parsed RunData
- Parser wrapper in `src/lib/fit-parser.ts` provides a Promise-based API: `parseFitFile(file: File): Promise<RunData>`
- Extracts records (GPS + metrics), laps, and session data from FIT files
- Handles the mapping from raw FIT fields to the RunData/DataPoint/Lap interfaces

- **Technical Notes:** `fit-file-parser` returns raw objects — map fields like `position_lat`/`position_long` (semicircles) to decimal degrees. Speed (m/s) needs conversion to pace (sec/km).

## Story: Create Zustand store for run data
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Implement FIT file parsing in a Web Worker

#### Tasks
- [x] Create `src/store/useRunStore.ts` with Zustand
- [x] Hold `runData`, `isLoading`, `error` state
- [x] Hold UI state: `unitSystem`, `hoveredIndex`
- [x] Implement `loadFile(file: File)` action that triggers parser and updates state

#### Acceptance Criteria
- Store holds: `runData: RunData | null`, `isLoading: boolean`, `error: string | null`
- Store holds UI state: `unitSystem: 'metric' | 'imperial'`, `hoveredIndex: number | null`
- `loadFile(file: File)` action triggers the parser and updates state
- Loading and error states are managed correctly during parsing
- Store is typed with TypeScript

## Story: Wire up drop zone to parser and store
- **Status:** [x] done
- **Priority:** high
- **Depends on:** Build the drag-and-drop zone UI, Create Zustand store for run data

#### Tasks
- [x] Connect DropZone to Zustand store so dropping a file triggers `loadFile()`
- [x] Show loading spinner/skeleton while parsing
- [x] Transition app from empty state to dashboard on success
- [x] Show toast/alert with user-friendly error message on failure

#### Acceptance Criteria
- Dropping a valid `.fit` file triggers `loadFile()` on the store
- A loading spinner/skeleton shows while parsing
- On success, the app transitions to the dashboard view
- On error, a toast or alert shows a user-friendly error message
- The drop zone disappears once data is loaded (replaced by dashboard)

- **Technical Notes:** Use the playwright-cli skill to verify the full flow: drop a sample .fit file, confirm loading state appears, confirm dashboard renders.

## Story: Add parse error handling
- **Status:** [x] done
- **Priority:** medium
- **Depends on:** Wire up drop zone to parser and store

#### Tasks
- [x] Handle non-FIT files with "This doesn't appear to be a FIT file" message
- [x] Handle corrupt FIT files with "This file appears to be corrupted" message
- [x] Handle files with no GPS/record data with "No run data found in this file" message
- [x] Make errors dismissible and return user to the drop zone

#### Acceptance Criteria
- Non-FIT files show "This doesn't appear to be a FIT file" message
- Corrupt FIT files show "This file appears to be corrupted" message
- Files with no GPS/record data show "No run data found in this file" message
- Errors are dismissible and return user to the drop zone
- Error state is cleared when user tries a new file

## Story: Add sample file loader
- **Status:** [~] in-progress
- **Priority:** medium
- **Depends on:** Wire up drop zone to parser and store

#### Tasks
- [ ] Place a real `.fit` file in `public/sample.fit`
- [ ] Add "Try with sample data" button on the drop zone
- [ ] Fetch and load sample file through the same parsing pipeline as user-dropped files

#### Acceptance Criteria
- A real `.fit` file is placed in `public/sample.fit`
- "Try with sample data" button on the drop zone fetches and loads the sample file
- Sample file loads through the same parsing pipeline as user-dropped files
- Loading the sample file transitions to the dashboard

- **Technical Notes:** Use the playwright-cli skill to test: click the sample button, verify dashboard appears with valid data.
