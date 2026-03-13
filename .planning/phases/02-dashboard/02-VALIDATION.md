---
phase: 2
slug: dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test (built-in) |
| **Config file** | none — bun test auto-discovers *.test.ts |
| **Quick run command** | `bun test` |
| **Full suite command** | `bun test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun test`
- **After every plan wave:** Run `bun test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | DASH-01 | unit | `bun test src/components/StatsPanel.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-02 | unit | `bun test src/components/charts/PaceChart.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-03 | unit | `bun test src/components/charts/HeartRateChart.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-04 | unit | `bun test src/components/charts/ElevationChart.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-05 | unit | `bun test src/components/charts/CadenceChart.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-06 | unit | `bun test src/components/RouteMap.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-07 | unit | `bun test src/components/LapTable.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DASH-08 | unit | `bun test src/lib/data-presence.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | STYLE-01 | manual-only | N/A (visual inspection) | N/A | ⬜ pending |
| TBD | TBD | TBD | STYLE-02 | manual-only | N/A (visual inspection at 1920x1080) | N/A | ⬜ pending |
| TBD | TBD | TBD | STYLE-04 | manual-only | N/A (visual inspection) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/data-presence.test.ts` — covers DASH-08 (data channel detection)
- [ ] `src/lib/chart-data.test.ts` — covers DASH-02/03/04/05 (data transformation logic)
- [ ] `src/components/LapTable.test.tsx` — covers DASH-07 (lap rendering)
- [ ] Chart rendering tests may require `happy-dom` for DOM environment in bun:test
- [ ] MapLibre route map tests need WebGL mock or conditional skip

*Existing infrastructure covers Phase 1 tests; Wave 0 adds component and utility tests for Phase 2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark background with neon/glowing accent lines | STYLE-01 | Visual aesthetic judgment | Load a FIT file; verify dark bg, neon green/cyan accent colors, glow effects on charts |
| Dense single-screen layout | STYLE-02 | Layout density is viewport-dependent | Load a FIT file at 1920x1080; all panels visible without scrolling |
| HUD-style stat overlays | STYLE-04 | Visual design judgment | Verify stat cards have monospace values, border glow, HUD appearance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
