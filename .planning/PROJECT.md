# FIT Viewer

## What This Is

A client-side web application that lets runners upload FIT files and visualize their data on a Tony Stark / F1 Telemetry-style dashboard. Dark, dense, glowing, animated — mission control for running. Entirely browser-based: no data leaves the user's machine.

## Core Value

Upload a FIT file and instantly see your run data presented in a way that makes you feel like a performance engineer analyzing telemetry. The visual experience is the product.

## Requirements

### Validated

- ✓ TypeScript + Bun development environment — existing
- ✓ Project scaffolding with HTML imports and React JSX — existing

### Active

- [ ] Client-side FIT file parsing (drag-drop and file picker upload)
- [ ] Dashboard with pace, heart rate, cadence, elevation data channels
- [ ] Interactive route map visualization (GPS data)
- [ ] Split analysis view
- [ ] Dark/glowing/neon aesthetic — Tony Stark / F1 telemetry visual style
- [ ] Dense data layout — charts, gauges, numbers filling the screen
- [ ] Animated/reactive data presentation — charts that feel alive
- [ ] Multi-run comparison: overlay mode (same chart, multiple data lines)
- [ ] Multi-run comparison: side-by-side mode (synced dashboards)
- [ ] Toggle between overlay and side-by-side comparison
- [ ] Deploys as static files (no backend required in production)

### Out of Scope

- Server-side processing — all parsing and rendering happens in the browser
- User accounts or authentication — no login, no persistence
- Cloud storage of FIT files — privacy-first, data stays local
- Mobile-native app — web-first, responsive is fine but not a native app
- Social features — no sharing, commenting, or profiles
- Real-time device streaming — upload only, no live Garmin/watch connection

## Context

- FIT (Flexible and Interoperable Data Transfer) is Garmin's binary protocol for fitness devices
- FIT files contain records with timestamps and data fields (HR, GPS, cadence, power, etc.)
- Existing JS libraries exist for parsing FIT files client-side (e.g., fit-file-parser)
- Target audience: runners who want a visually impressive way to review their data
- Public tool — anyone on the internet can use it
- Brownfield: Bun + TypeScript scaffolding already in place with HTML imports pattern

## Constraints

- **No server in production**: Bun.serve() for development/HMR only; deploys as static files
- **Client-side only**: FIT parsing, data processing, and rendering all happen in the browser
- **Stack**: TypeScript, Bun (dev), React, HTML imports — per project CLAUDE.md
- **Privacy**: No data transmission — FIT files never leave the browser

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client-side FIT parsing | Privacy + no server costs + simpler deployment | — Pending |
| React for UI | Already configured in tsconfig, Bun HTML imports support it | — Pending |
| Static deployment | No backend = host anywhere (GitHub Pages, Netlify, etc.) | — Pending |
| Dark/neon visual style | Core to the product identity — the aesthetic IS the differentiator | — Pending |

---
*Last updated: 2026-03-12 after initialization*
