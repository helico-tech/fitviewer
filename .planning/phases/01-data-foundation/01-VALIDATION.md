---
phase: 1
slug: data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test (built into Bun 1.3.9) |
| **Config file** | none — bun test works out of the box |
| **Quick run command** | `bun test` |
| **Full suite command** | `bun test --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun test`
- **After every plan wave:** Run `bun test --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FILE-03 | unit | `bun test src/lib/fit-parser.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | FILE-04 | unit | `bun test src/lib/fit-parser.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | DATA-01 | unit | `bun test src/lib/fit-parser.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | DATA-02 | unit | `bun test src/lib/normalize.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | DATA-03 | unit | `bun test src/lib/normalize.test.ts` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | DATA-04 | unit | `bun test src/lib/downsample.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 1 | FILE-01 | manual-only | N/A — requires browser DnD interaction | N/A | ⬜ pending |
| 1-04-02 | 04 | 1 | FILE-02 | manual-only | N/A — requires browser file dialog | N/A | ⬜ pending |
| 1-05-01 | 05 | 1 | DATA-05 | integration/manual | Manual: verify UI responsive during parse | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/fit-parser.test.ts` — stubs for FILE-03, FILE-04, DATA-01
- [ ] `src/lib/normalize.test.ts` — stubs for DATA-02, DATA-03
- [ ] `src/lib/downsample.test.ts` — stubs for DATA-04
- [ ] `tests/fixtures/` — sample FIT files (valid running .fit, cycling .fit, corrupted .fit)

*No framework install needed — `bun test` is built-in.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-drop file accepted | FILE-01 | Requires browser DnD interaction | Drag a .fit file onto drop zone, verify acceptance |
| File picker selects FIT file | FILE-02 | Requires browser file dialog | Click file picker, select .fit, verify processing |
| Web Worker non-blocking | DATA-05 | Requires measuring UI responsiveness during parse | Upload large .fit file, verify UI remains interactive |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
