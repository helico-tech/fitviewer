# Phase 1: Data Foundation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

FIT file ingest, parse, normalize, and store. Users can drag-drop or pick a FIT file, it gets parsed in a Web Worker, normalized data lands in the store. No charts or visualizations — just the data pipeline, upload UX, summary stats display on a dashboard skeleton, and error handling.

</domain>

<decisions>
## Implementation Decisions

### Drop zone experience
- Full-screen takeover — the entire viewport is the drop zone when no file is loaded
- Ghosted/dimmed dashboard wireframe visible behind the drop zone as a cinematic tease
- On drag-over: the wireframe "powers on" — starts lighting up and animating as if the system is activating
- Inviting text prompt: something like "Drop your FIT file to launch telemetry" with a brief tagline
- File picker button as fallback alongside the drop zone

### Post-upload feedback
- Sims-style fake loading sequence with fun/ridiculous status messages ("Analyzing stride patterns...", "Calibrating heart rate sensors...", "Reticulating splines...")
- Boot sequence is quick: 1-2 seconds max — personality without patience-testing
- Dissolve transition: drop zone fades out, dashboard fades in behind it
- File metadata displayed in a persistent header bar: "Garmin FR965 • Mar 10, 2026 • Running • 42:15"
- After parse, the ghosted dashboard skeleton fills in with real summary stats

### Error experience
- Playful tone — "That's not a FIT file, chief. We need the goods from your watch."
- Errors shown in-place on the drop zone itself — no modals, user can drop another file immediately
- Expandable "Show details" section for technical error info (for the curious)
- Running activities only — reject non-running FIT files with a playful message (e.g., "Nice ride, but we're a running crew.")

### Data presentation (Phase 1 output)
- Dashboard skeleton view: the ghosted wireframe from empty state, but with real summary numbers filled in
- Full summary stats: distance, duration, average pace, average/max HR, cadence, total elevation gain
- This is the Phase 1 deliverable — the skeleton teases what Phase 2 will fill in with charts
- Replace button in header bar for uploading a new/different file (drop zone is gone once file loaded)

### Claude's Discretion
- Exact boot sequence message content and timing
- Dashboard skeleton wireframe layout design
- Specific neon color palette and glow intensity
- File picker button placement and styling
- Summary stat formatting (e.g., pace as min/km vs min/mi)

</decisions>

<specifics>
## Specific Ideas

- "Like the Sims, with the Reticulating Splines stuff" — the boot sequence should have that same energy: playful, absurd status messages while loading
- The drag-over activation should feel like powering on a system — not just a highlight, but the dashboard wireframe coming alive
- The ghosted wireframe behind the drop zone serves double duty: cinematic tease AND context for what the tool does

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — codebase is greenfield scaffolding only (index.ts, package.json, tsconfig.json)

### Established Patterns
- Bun.serve() for dev server with HTML imports (per CLAUDE.md)
- TypeScript strict mode with bundler module resolution
- React JSX configured in tsconfig (jsx: "react-jsx")
- 2-space indentation, camelCase functions, PascalCase components

### Integration Points
- index.ts: Bun.serve() entry point — HTML routes go here
- HTML imports: .tsx files imported via <script type="module"> in HTML
- src/ directory to be created for application code
- lib/ directory recommended by research for React-free data processing layer

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-03-12*
