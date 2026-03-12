# Feature Research

**Domain:** Client-side FIT file viewer / running telemetry dashboard
**Researched:** 2026-03-12
**Confidence:** MEDIUM (external tools unavailable; analysis drawn from training knowledge of Garmin Connect, Strava, Intervals.icu, Runalyze, VeloViewer, FIT File Viewer, and related tools — all mature, well-documented products)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop FIT file upload | Every modern file tool has this; clicking "upload" feels 2010 | LOW | File input fallback required for accessibility |
| Parsed summary stats (distance, duration, moving time, avg/max pace, avg/max HR, total elevation gain) | This IS the run. If you can't see these numbers the tool is useless | LOW | These are in every FIT record's session message |
| Pace/speed chart over time | Core running metric; users want to see where they slowed down | MEDIUM | Time-series line chart; distinguish GPS-derived vs recorded pace |
| Heart rate chart over time | Second most-watched metric after pace | MEDIUM | Same time-series pattern as pace |
| GPS route map | Users visually identify where they ran before looking at data | MEDIUM | Leaflet or Mapbox; tile provider required |
| Elevation profile chart | Explains pace variation; critical for trail/hilly runs | MEDIUM | Often rendered below or linked to map |
| Lap / split table | Garmin auto-laps and manual laps; runners compare km/mile splits obsessively | MEDIUM | FIT `lap` messages; handle both auto-lap and manual |
| Cadence chart over time | Standard metric on any running watch since 2015 | MEDIUM | Some files have left/right foot cadence separately |
| Basic file metadata display (device, date, sport type, file version) | Context for what you're looking at | LOW | Available in FIT `file_id` and `device_info` messages |
| Error handling for malformed or non-FIT files | Users will try uploading GPX, TCX, or random files | LOW | Friendly error state, not a crash |

### Differentiators (Competitive Advantage)

Features that set the product apart. Aligned to the core value proposition: mission-control aesthetic and dense telemetry presentation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Tony Stark / F1 telemetry visual style (dark, neon, glowing) | The aesthetic IS the product — nowhere else shows running data like this | HIGH | CSS design system; HUD-style gauges, glow effects, scanline overlays; this is ongoing design work, not a one-shot feature |
| Dense HUD layout with simultaneous data channels | Runners who care about data want everything visible at once, not buried in tabs | HIGH | Grid layout with many charts visible simultaneously; requires good responsive design thinking |
| Animated / reactive charts | Makes data feel alive vs static screenshots; shareable moment | MEDIUM | Chart library with animation support; entrance animations on load; hover state reactivity |
| Real-time scrubbing — hover chart to sync map position | Makes the dashboard interactive and spatial — "where was I at km 8?" | HIGH | Bidirectional sync between all charts and map via shared cursor/time position |
| Power data channel (if available in file) | Running power (Stryd, Garmin) is increasingly common; serious runners want it | MEDIUM | Conditionally rendered — only shown if power records exist in FIT file |
| Ground contact time / vertical oscillation channels | Advanced running dynamics from Garmin HRM-Run/HRM-Pro; no casual tool surfaces these | MEDIUM | Conditionally rendered; niche but impressive to target audience |
| Running Stress Score / Training Load indicators | Quantified fatigue gives runners actionable insight, not just raw data | HIGH | Requires TRIMP or similar algorithm; needs HR zones configured |
| Multi-run overlay comparison | "How did today compare to my PR attempt?" — comparison is a core user job | HIGH | Multiple parsed files in memory; color-coded data lines per run |
| Side-by-side synced comparison | Alternative to overlay for when you want to see two dashboards without occlusion | HIGH | Shared time cursor; layout with two dashboard panes |
| Keyboard shortcuts and power-user navigation | Target audience (data-obsessed runners) appreciates efficiency | LOW | Space to play/pause scrubber, arrow keys to step, etc. |
| Export chart as image / PNG | Runners share on Strava comments, Twitter/X, Discord; shareworthy moment | MEDIUM | html2canvas or similar; canvas export |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / save runs to a profile | "I want to come back to my runs" | Requires auth, backend, database, compliance; destroys the "no server" constraint and privacy promise; Garmin Connect already does this better | Store parsed data in browser IndexedDB/localStorage with explicit user action; show "load recent" from local cache |
| Cloud sync / Garmin Connect API integration | "Pull my runs automatically" | OAuth flow, server-side token storage, API rate limits, Garmin TOS; massive scope expansion for a viewer | Stick to drag-and-drop; it is a feature that it requires no accounts |
| Social features (sharing, comments, kudos) | "Show my friends my run" | Needs backend, user identity, moderation; Strava already does this | PNG export for sharing; static URL with encoded data is theoretically possible but complex |
| Training plan builder | Runners want to plan future runs | Completely different product domain; writers-of-training-plans need expertise | Out of scope — this is a viewer, not a coach |
| Live GPS streaming from device | "See my run as it happens" | Requires native BLE/ANT+ access, device pairing; browser BLE is experimental and device-specific; Garmin LiveTrack already does this | Upload post-run; that's the use case |
| Automatic unit conversion toggle (km/mi) | Seems simple | Requires threading units through every calculation, every display label, every chart axis; every new metric doubles testing surface | Pick one per user preference, detect from locale, make it a one-time setting — don't toggle mid-session |
| Full FIT file raw message inspector / hex viewer | Debugging FIT files | Useful for developers, not target users; adds UI complexity | Separate dev tool; not in the dashboard |

---

## Feature Dependencies

```
File Upload (drag-drop)
    └──requires──> FIT Parser (client-side)
                       └──requires──> Summary Stats
                       └──requires──> Time-series Data Extraction
                                          └──requires──> Pace Chart
                                          └──requires──> HR Chart
                                          └──requires──> Cadence Chart
                                          └──requires──> Power Chart (conditional)
                                          └──requires──> Ground Contact / Vert Osc (conditional)
                       └──requires──> GPS Track Extraction
                                          └──requires──> Route Map
                                          └──requires──> Elevation Profile
                       └──requires──> Lap Message Extraction
                                          └──requires──> Lap / Split Table

Route Map
    └──enhances──> Real-time Scrubbing (map↔chart cursor sync)

Time-series Data Extraction
    └──enhances──> Real-time Scrubbing

Real-time Scrubbing
    └──requires──> Shared time-position state (all charts + map use same cursor)

Multi-run Comparison (overlay)
    └──requires──> File Upload (must support multiple files)
    └──requires──> FIT Parser
    └──requires──> Time-series Data Extraction
    └──enhances──> Real-time Scrubbing (must sync across all loaded runs)

Multi-run Comparison (side-by-side)
    └──requires──> Multi-run Comparison (overlay) [same data model, different layout]
    └──conflicts──> Single-dashboard dense layout (layout must adapt)

Export as PNG
    └──requires──> Rendered charts/map (capture what's on screen)

Running Stress Score
    └──requires──> HR data
    └──requires──> Duration
    └──requires──> HR zone configuration (user input or auto-detected from FIT max HR)
```

### Dependency Notes

- **Everything requires FIT Parser:** The parser is the absolute foundation. Nothing else is buildable without it. This must be Phase 1.
- **Route Map requires GPS data:** Not all FIT files have GPS (treadmill runs, indoor cycling). Map must be conditionally rendered.
- **Power/dynamics channels require conditional rendering:** These fields are absent in most FIT files. The UI must handle sparse data gracefully without showing empty panels.
- **Real-time scrubbing requires shared state:** All charts and the map must share a single time-position cursor. This is an architectural concern — if chart components are designed without this, retrofitting is expensive.
- **Multi-run comparison conflicts with single-run dense layout:** When two dashboards are shown side-by-side, the dense full-screen layout breaks. This needs a responsive layout mode designed upfront, not bolted on.
- **Side-by-side comparison requires overlay first:** The data model (multiple parsed runs in memory, color-coded) is the same. Side-by-side is a rendering variation, not a separate feature.

---

## MVP Definition

### Launch With (v1)

Minimum viable product that validates the concept and delivers the core value proposition.

- [ ] Drag-and-drop FIT file upload — without this, there's nothing
- [ ] Client-side FIT parsing (session + record messages) — the foundation of everything
- [ ] Summary stats panel (distance, duration, pace, HR, cadence, elevation gain) — instant payoff on upload
- [ ] Pace chart over time — primary running metric
- [ ] Heart rate chart over time — second primary metric
- [ ] Elevation profile chart — explains pace variation
- [ ] GPS route map — visual anchor of the run
- [ ] Lap / split table — every runner compares their splits
- [ ] Dark / neon / HUD aesthetic — this IS the differentiator; shipping with generic chart styles defeats the point
- [ ] Error state for non-FIT files — basic robustness

### Add After Validation (v1.x)

- [ ] Real-time scrubbing (chart hover syncs map position) — users will immediately want this once the base dashboard exists
- [ ] Cadence chart — natural next data channel
- [ ] Conditional power / running dynamics channels — for users whose devices record them
- [ ] Multi-run overlay comparison — core requirement per PROJECT.md; add after single-run UX is solid

### Future Consideration (v2+)

- [ ] Side-by-side comparison mode — layout complexity; validate overlay mode first
- [ ] Export as PNG — nice shareability feature; defer until base is polished
- [ ] Running Stress Score / Training Load — requires algorithm work and user HR zone config; high effort for a niche feature
- [ ] Keyboard shortcuts — power-user polish; meaningful only after core flow is well-used
- [ ] IndexedDB "recent files" cache — convenience feature; only needed if users return repeatedly

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| FIT file upload (drag-drop) | HIGH | LOW | P1 |
| FIT parser (client-side) | HIGH | MEDIUM | P1 |
| Summary stats panel | HIGH | LOW | P1 |
| Pace chart | HIGH | MEDIUM | P1 |
| Heart rate chart | HIGH | MEDIUM | P1 |
| GPS route map | HIGH | MEDIUM | P1 |
| Elevation profile | HIGH | MEDIUM | P1 |
| Lap / split table | HIGH | MEDIUM | P1 |
| Dark / HUD aesthetic | HIGH | HIGH | P1 (differentiator, must ship v1) |
| Error handling | MEDIUM | LOW | P1 |
| Cadence chart | MEDIUM | LOW | P2 |
| Real-time scrubbing (cursor sync) | HIGH | HIGH | P2 |
| Conditional power channel | MEDIUM | MEDIUM | P2 |
| Conditional running dynamics | LOW | MEDIUM | P2 |
| Multi-run overlay comparison | HIGH | HIGH | P2 |
| Animated / reactive charts | MEDIUM | MEDIUM | P2 |
| Side-by-side comparison | MEDIUM | HIGH | P3 |
| Export as PNG | MEDIUM | MEDIUM | P3 |
| Running Stress Score | LOW | HIGH | P3 |
| IndexedDB recent files | LOW | MEDIUM | P3 |
| Keyboard shortcuts | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Garmin Connect | Strava | Intervals.icu | Runalyze | Our Approach |
|---------|----------------|--------|---------------|----------|--------------|
| File upload | Yes (but requires account) | Yes (requires account) | Yes (requires account) | Yes (requires account) | No account — drag-drop, instant |
| Pace/HR/cadence charts | Yes | Basic (free tier) | Advanced | Advanced | Full channels, HUD layout |
| GPS route map | Yes | Yes | Yes | Yes | Yes, synchronized with charts |
| Split table | Yes | Yes | Yes | Yes | Yes |
| Power channel | Yes | Yes (with device) | Yes | Yes | Conditional render |
| Running dynamics | Yes (HRM-Pro) | No | Yes | Partial | Conditional render |
| Multi-run comparison | Yes | Yes | Yes | Yes | Overlay + side-by-side |
| Visual style | Functional / bland | Consumer-friendly | Dense / data-heavy | Dense / dated | Dark neon HUD — unique |
| Privacy | Cloud required | Cloud required | Cloud optional | Self-hostable | 100% local, zero upload |
| Real-time scrubbing | Basic | No | Yes | Partial | First-class feature |
| No login required | No | No | No | No | Core differentiator |

**Key takeaway:** Every competitor requires an account and uploads your data to their servers. The combination of zero-account + high-aesthetic density is the gap this product fills. Intervals.icu is the closest in data depth, but its UX is functional rather than impressive. Garmin Connect has the data but looks like an enterprise dashboard from 2018.

---

## Sources

- Training knowledge of Garmin Connect feature set (MEDIUM confidence — well-established product, unlikely to have changed fundamentally)
- Training knowledge of Strava feature set (MEDIUM confidence)
- Training knowledge of Intervals.icu, Runalyze, VeloViewer (MEDIUM confidence)
- FIT Protocol Specification knowledge: session/record/lap message types (HIGH confidence — spec is stable)
- PROJECT.md requirements (HIGH confidence — source of truth for this project)
- External web research unavailable in this environment (WebSearch, WebFetch, Bash all blocked) — flag for manual verification if critical decisions rest on competitor feature parity

---

*Feature research for: client-side FIT file viewer / running telemetry dashboard*
*Researched: 2026-03-12*
