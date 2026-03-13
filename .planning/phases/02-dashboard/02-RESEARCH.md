# Phase 2: Dashboard - Research

**Researched:** 2026-03-13
**Domain:** React charting (Recharts), map rendering (MapLibre GL JS), dark/neon HUD styling, data-driven dashboard layout
**Confidence:** HIGH

## Summary

Phase 2 transforms the skeleton placeholders from Phase 1 into a fully functional telemetry dashboard. The existing codebase already provides the complete data pipeline: `NormalizedActivity` with `records[]` (time-series), `summary` (stats), `laps[]` (splits), and `metadata` are all available in the Zustand store. The `DashboardSkeleton` component already renders placeholder slots for every panel (stats row, 4 charts, route map, lap table). The work is replacing those placeholders with real visualizations.

**Recharts v3.8.0** is the standard React charting library and is verified compatible with React 19 (peer deps include `^19.0.0`). It requires `react-is@^19.0.0` as a peer dependency. **MapLibre GL JS v5.20.0** with `@vis.gl/react-maplibre@8.1.0` provides the route map with no API key required, using Carto Dark Matter vector tiles as the basemap. Both libraries resolve cleanly with `bun add` against the existing dependency tree.

The dashboard's dark/neon aesthetic is achievable through Recharts' SVG customization (custom gradients, glow filters via `<defs>`, CSS variable-driven colors) and MapLibre's built-in Dark Matter style. The existing CSS custom properties (`--neon-primary: #00ffaa`, `--neon-secondary: #00ccff`) established in Phase 1 carry forward.

**Primary recommendation:** Use Recharts v3 for all four charts (pace, HR, elevation, cadence) with shared SVG `<defs>` for neon glow filters, MapLibre GL JS with `@vis.gl/react-maplibre` for the route map, and plain CSS grid for the dense single-screen layout.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Summary stats panel with key metrics after upload | Stats row already renders in DashboardSkeleton with real data when loaded; enhance with HUD styling |
| DASH-02 | Pace chart over time | Recharts AreaChart with speed-to-pace conversion, neon gradient fill |
| DASH-03 | Heart rate chart over time | Recharts AreaChart with HR data from records[], neon secondary color |
| DASH-04 | Elevation profile chart | Recharts AreaChart with altitude data, gradient fill |
| DASH-05 | Cadence chart over time | Recharts AreaChart with cadence data from records[] |
| DASH-06 | GPS route map | @vis.gl/react-maplibre + maplibre-gl with Carto Dark Matter vector tiles |
| DASH-07 | Lap/split table with per-split metrics | HTML table with LapRecord[] from store, styled with neon borders |
| DASH-08 | Gracefully hide panels when data channels absent | Conditional rendering based on data presence checks on records[] |
| STYLE-01 | Dark background with neon/glowing accent lines | Recharts SVG glow filters, CSS custom properties already in place |
| STYLE-02 | All data visible on one screen - dense layout | CSS grid layout, compact chart heights, no scrolling on 1080p+ |
| STYLE-04 | HUD-style gauges and overlays for key metrics | Enhanced stat cards with border glow, monospace values, scan-line effects |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 | All 4 time-series charts (pace, HR, elevation, cadence) | Declarative React SVG charts, v3 supports React 19 natively, tree-shakable, gradient/filter support |
| @vis.gl/react-maplibre | 8.1.0 | React wrapper for GPS route map | Official visgl MapLibre wrapper, spun off from react-map-gl, supports maplibre-gl >= 4 |
| maplibre-gl | 5.20.0 | WebGL map rendering engine | Free, open-source, no API key needed, excellent dark basemap support |
| react-is | ^19.0.0 | Peer dependency for Recharts | Required by Recharts v3; version must match React 19 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Carto Dark Matter (vector tiles) | N/A (hosted) | Dark basemap style for route map | Always for the map; style URL: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | visx (Airbnb) | Lower-level, more control but requires building chart components from scratch; overkill for standard time-series |
| Recharts | lightweight-charts (TradingView) | Canvas-based, better for huge datasets, but not React-native and financial-chart focused |
| @vis.gl/react-maplibre | Leaflet + react-leaflet | Simpler but raster-only tiles, no vector Dark Matter style, heavier for this use case |

**Installation:**
```bash
bun add recharts react-is@^19.0.0 @vis.gl/react-maplibre maplibre-gl
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    Dashboard.tsx           # Main dashboard container (replaces DashboardSkeleton content)
    Dashboard.css           # Grid layout for dense single-screen
    StatsPanel.tsx          # Enhanced stat cards with HUD styling
    StatsPanel.css
    charts/
      ChartDefs.tsx         # Shared SVG <defs> for gradients and glow filters
      PaceChart.tsx         # AreaChart for pace over time
      HeartRateChart.tsx    # AreaChart for HR over time
      ElevationChart.tsx    # AreaChart for elevation profile
      CadenceChart.tsx      # AreaChart for cadence over time
      chart-theme.ts        # Shared chart config: colors, margins, tick styles
    RouteMap.tsx            # MapLibre route map component
    RouteMap.css
    LapTable.tsx            # Lap/split metrics table
    LapTable.css
  lib/
    chart-data.ts           # Transform ActivityRecord[] to chart-ready format
    data-presence.ts        # Utility: check which data channels are present
```

### Pattern 1: Data Presence Detection
**What:** Before rendering any panel, check if the data channel exists in the records
**When to use:** Every conditional panel (DASH-08)
**Example:**
```typescript
// src/lib/data-presence.ts
import type { ActivityRecord } from "../types/activity.ts";

export type DataChannels = {
  hasGps: boolean;
  hasHeartRate: boolean;
  hasCadence: boolean;
  hasAltitude: boolean;
};

export function detectChannels(records: ActivityRecord[]): DataChannels {
  return {
    hasGps: records.some((r) => r.positionLat !== null && r.positionLong !== null),
    hasHeartRate: records.some((r) => r.heartRate !== null),
    hasCadence: records.some((r) => r.cadence !== null),
    hasAltitude: records.some((r) => r.altitude !== null),
  };
}
```

### Pattern 2: Chart Data Transformation
**What:** Convert ActivityRecord[] to Recharts-compatible data arrays
**When to use:** Before passing data to any chart
**Example:**
```typescript
// src/lib/chart-data.ts
import type { ActivityRecord } from "../types/activity.ts";

export type ChartPoint = { elapsed: number; value: number };

/** Convert speed (m/s) to pace (min/km). Clamp to avoid infinity. */
export function speedToPace(speedMs: number): number {
  if (speedMs <= 0.2) return 15; // cap at 15:00/km for near-zero speeds
  return (1000 / speedMs) / 60;
}

export function toPaceData(records: ActivityRecord[], startTime: number): ChartPoint[] {
  return records
    .filter((r) => r.speed !== null)
    .map((r) => ({
      elapsed: (r.timestamp.getTime() - startTime) / 1000 / 60, // minutes
      value: speedToPace(r.speed!),
    }));
}

export function toHrData(records: ActivityRecord[], startTime: number): ChartPoint[] {
  return records
    .filter((r) => r.heartRate !== null)
    .map((r) => ({
      elapsed: (r.timestamp.getTime() - startTime) / 1000 / 60,
      value: r.heartRate!,
    }));
}

// Similar for elevation and cadence
```

### Pattern 3: Shared SVG Glow Defs
**What:** Reusable SVG filter/gradient definitions for neon aesthetic
**When to use:** Injected once inside each chart's `<AreaChart>` wrapper
**Example:**
```tsx
// src/components/charts/ChartDefs.tsx
export function NeonGradient({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );
}

export function GlowFilter({ id, color }: { id: string; color: string }) {
  return (
    <filter id={id} height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <feFlood floodColor={color} floodOpacity="0.6" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
```

### Pattern 4: Conditional Panel Rendering
**What:** Dashboard hides panels whose data channels are absent
**When to use:** Dashboard layout component
**Example:**
```tsx
// In Dashboard.tsx
const channels = detectChannels(activity.records);

return (
  <div className="dashboard">
    <StatsPanel summary={activity.summary} />
    <div className="dashboard__charts">
      <PaceChart records={activity.records} startTime={startTime} />
      {channels.hasHeartRate && <HeartRateChart records={activity.records} startTime={startTime} />}
      {channels.hasAltitude && <ElevationChart records={activity.records} startTime={startTime} />}
      {channels.hasCadence && <CadenceChart records={activity.records} startTime={startTime} />}
    </div>
    <div className="dashboard__bottom">
      {channels.hasGps && <RouteMap records={activity.records} />}
      {activity.laps.length > 0 && <LapTable laps={activity.laps} />}
    </div>
  </div>
);
```

### Pattern 5: MapLibre Route Rendering
**What:** Render GPS track as a GeoJSON LineString on a dark basemap
**When to use:** RouteMap component
**Example:**
```tsx
import { Map, Source, Layer } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ActivityRecord } from "../types/activity.ts";

function recordsToGeoJSON(records: ActivityRecord[]) {
  const coords = records
    .filter((r) => r.positionLat !== null && r.positionLong !== null)
    .map((r) => [r.positionLong!, r.positionLat!]);

  return {
    type: "Feature" as const,
    geometry: { type: "LineString" as const, coordinates: coords },
    properties: {},
  };
}

// Compute bounding box for auto-zoom
function computeBounds(coords: number[][]): [[number, number], [number, number]] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}
```

### Anti-Patterns to Avoid
- **Rendering empty chart containers:** Never render a chart component with empty/null data; always gate on `channels.hasX` first (DASH-08)
- **Inline SVG defs per chart instance:** Define gradients and filters once per chart type, not per data point; duplicate SVG `id` attributes cause rendering bugs
- **Pace axis with raw speed values:** Always convert m/s to min/km before charting; invert the Y axis so slower paces appear lower (convention for running charts)
- **Full-resolution data to charts:** Always use the already-downsampled records from the data pipeline; LTTB is already applied in Phase 1
- **Importing maplibre-gl CSS via JS import in a component:** The CSS must be loaded either via a `<link>` tag in the HTML or a top-level CSS import; importing it deep in a component tree can cause FOUC

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-series charts | Custom SVG/Canvas chart renderer | Recharts AreaChart + ResponsiveContainer | Axis ticks, tooltips, responsive sizing, hover states -- hundreds of edge cases |
| GPS route rendering | Custom Canvas/SVG path from lat/lng | MapLibre GL JS + GeoJSON Source + Line Layer | Projection math, tile caching, zoom/pan, retina support, bounding box fitting |
| Map basemap tiles | Self-hosted tile server | Carto Dark Matter CDN (`basemaps.cartocdn.com`) | Tile serving is infrastructure; free CDN with dark style ready |
| Data downsampling | Custom algorithm for chart performance | Already done in Phase 1 (LTTB via `downsample` package) | LTTB preserves visual shape; already integrated into pipeline |
| Responsive chart sizing | Manual resize listeners | Recharts ResponsiveContainer | Handles resize observer, debouncing, parent size tracking |

**Key insight:** The chart and map domains are deceptively complex. Even "simple" things like axis tick formatting, tooltip positioning, and map projection math have hundreds of edge cases. Use the libraries.

## Common Pitfalls

### Pitfall 1: Recharts react-is Version Mismatch
**What goes wrong:** Charts render as blank or throw errors about `react-is` checks failing
**Why it happens:** Recharts v3 has `react-is` as a peer dependency; if the wrong version is installed, React 19's element type checks fail silently
**How to avoid:** Install `react-is@^19.0.0` explicitly alongside recharts
**Warning signs:** Empty chart containers with no console errors, or `isElement` / `isValidElement` warnings

### Pitfall 2: MapLibre CSS Not Loaded
**What goes wrong:** Map renders but controls are unstyled, popups appear broken, or the map container has zero height
**Why it happens:** MapLibre GL JS requires its CSS for proper rendering; if the CSS import is missed or bundled incorrectly, the UI breaks
**How to avoid:** Add `<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.20.0/dist/maplibre-gl.css" />` in `index.html` head, or import `maplibre-gl/dist/maplibre-gl.css` in the top-level component
**Warning signs:** Map tiles load but UI controls overlay incorrectly

### Pitfall 3: Pace Axis Inversion
**What goes wrong:** Pace chart shows faster paces at the bottom and slower at the top, which is counterintuitive for runners
**Why it happens:** Pace in min/km is inversely proportional to speed; a "faster" pace is a smaller number
**How to avoid:** Set `reversed={true}` on the YAxis for the pace chart so faster (lower number) is at the top
**Warning signs:** Users confused by pace chart direction

### Pitfall 4: Map Container Height
**What goes wrong:** MapLibre map renders with 0px height, appearing invisible
**Why it happens:** MapLibre requires an explicit height on its container; CSS `height: 100%` only works if all ancestors have explicit heights
**How to avoid:** Set explicit height on the map container (`height: 240px` matches current skeleton placeholder)
**Warning signs:** Map API calls succeed but nothing is visible

### Pitfall 5: Chart ResponsiveContainer in Flex/Grid
**What goes wrong:** Charts render at 0 width or overflow their containers
**Why it happens:** Recharts ResponsiveContainer measures parent width; in CSS grid/flex, the parent might not have a resolved width at mount time
**How to avoid:** Give the chart container an explicit `min-width: 0` (CSS grid item fix) and `width: 100%`
**Warning signs:** Charts flash between sizes or render too narrow

### Pitfall 6: GeoJSON Coordinate Order
**What goes wrong:** Route appears in the wrong location (Atlantic Ocean, etc.)
**Why it happens:** GeoJSON uses [longitude, latitude] order, but many data sources provide [lat, lng]; the Phase 1 ActivityRecord stores `positionLat` and `positionLong` separately
**How to avoid:** When building GeoJSON coordinates, always use `[record.positionLong, record.positionLat]` (lng first)
**Warning signs:** Route appears mirrored or in the ocean

### Pitfall 7: Dense Layout Overflow on Small Screens
**What goes wrong:** Dashboard panels overflow or stack vertically, breaking the "all on one screen" requirement
**Why it happens:** Fixed-height panels with CSS grid can overflow on viewports below 1080p
**How to avoid:** Use `min-height` instead of `height` for chart containers; test at 1366x768 (common laptop resolution); allow minimal scroll rather than broken layout
**Warning signs:** Horizontal scroll bars or panels overlapping

## Code Examples

### Complete Chart Component Pattern (Pace Chart)
```tsx
// src/components/charts/PaceChart.tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from "recharts";
import type { ActivityRecord } from "../../types/activity.ts";
import { toPaceData, speedToPace } from "../../lib/chart-data.ts";

const NEON_GREEN = "#00ffaa";

type Props = { records: ActivityRecord[]; startTime: number };

export function PaceChart({ records, startTime }: Props) {
  const data = toPaceData(records, startTime);

  return (
    <div className="chart-panel">
      <span className="chart-panel__label">Pace</span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={NEON_GREEN} stopOpacity={0.35} />
              <stop offset="95%" stopColor={NEON_GREEN} stopOpacity={0.02} />
            </linearGradient>
            <filter id="paceGlow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
              <feFlood floodColor={NEON_GREEN} floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="elapsed"
            tick={{ fill: "rgba(224,224,224,0.35)", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            tickFormatter={(v: number) => `${Math.floor(v)}m`}
          />
          <YAxis
            reversed
            tick={{ fill: "rgba(224,224,224,0.35)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => {
              const min = Math.floor(v);
              const sec = Math.round((v - min) * 60);
              return `${min}:${String(sec).padStart(2, "0")}`;
            }}
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,10,15,0.9)",
              border: `1px solid ${NEON_GREEN}40`,
              borderRadius: 4,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={NEON_GREEN}
            strokeWidth={1.5}
            fill="url(#paceGrad)"
            filter="url(#paceGlow)"
            dot={false}
            activeDot={{ r: 3, fill: NEON_GREEN }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### MapLibre Route Map Pattern
```tsx
// src/components/RouteMap.tsx
import { Map, Source, Layer } from "@vis.gl/react-maplibre";
import type { ActivityRecord } from "../types/activity.ts";

const DARK_MATTER_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const NEON_PRIMARY = "#00ffaa";

type Props = { records: ActivityRecord[] };

export function RouteMap({ records }: Props) {
  const coords = records
    .filter((r) => r.positionLat !== null && r.positionLong !== null)
    .map((r) => [r.positionLong!, r.positionLat!] as [number, number]);

  if (coords.length < 2) return null;

  // Compute bounds for auto-fit
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];

  const geojson = {
    type: "Feature" as const,
    geometry: { type: "LineString" as const, coordinates: coords },
    properties: {},
  };

  return (
    <div className="route-map" style={{ height: 240 }}>
      <Map
        initialViewState={{ bounds, fitBoundsOptions: { padding: 30 } }}
        mapStyle={DARK_MATTER_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <Source id="route" type="geojson" data={geojson}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": NEON_PRIMARY,
              "line-width": 2.5,
              "line-opacity": 0.85,
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
```

### Lap Table Pattern
```tsx
// src/components/LapTable.tsx
import type { LapRecord } from "../types/activity.ts";

function formatPace(avgSpeedMs: number | null): string {
  if (avgSpeedMs === null || avgSpeedMs <= 0) return "--";
  const paceSecondsPerKm = 1000 / avgSpeedMs;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = { laps: LapRecord[] };

export function LapTable({ laps }: Props) {
  return (
    <div className="lap-table">
      <table className="lap-table__table">
        <thead>
          <tr>
            <th>Split</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
            <th>Avg HR</th>
            <th>Cadence</th>
          </tr>
        </thead>
        <tbody>
          {laps.map((lap, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{(lap.totalDistance / 1000).toFixed(2)} km</td>
              <td>{formatDuration(lap.totalTimerTime)}</td>
              <td>{formatPace(lap.avgSpeed)}</td>
              <td>{lap.avgHeartRate ?? "--"}</td>
              <td>{lap.avgCadence ?? "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-map-gl with maplibre shim | @vis.gl/react-maplibre (dedicated package) | 2025 | No more mapbox-gl placeholder package needed; cleaner types |
| recharts v2 + react-is override hack | recharts v3 with react-is as peer dep | 2025 | Works with React 19 natively; just install react-is@19 as peer |
| Mapbox GL JS (proprietary) | MapLibre GL JS v5 (BSD-3) | 2021+ | Free, no API key, community-maintained, same quality |
| Carto raster tiles | Carto vector Dark Matter style | 2024+ | Sharper rendering, resolution-independent, smaller payloads |

**Deprecated/outdated:**
- `react-map-gl/maplibre` import path: Still works but `@vis.gl/react-maplibre` is the recommended package going forward
- Recharts v2.x: Use v3.x; v2 has worse React 19 support and the react-is issue is harder to work around

## Open Questions

1. **Bun bundler + maplibre-gl CSS import**
   - What we know: Bun's CSS bundler can handle standard CSS imports. MapLibre requires its CSS for proper rendering.
   - What's unclear: Whether `import "maplibre-gl/dist/maplibre-gl.css"` works through Bun's HTML bundler pipeline or requires a `<link>` tag in HTML
   - Recommendation: Use a CDN `<link>` tag in `index.html` as the safe approach; test JS import approach during implementation

2. **MapLibre WebGL context on some CI/test environments**
   - What we know: MapLibre uses WebGL, which isn't available in headless test runners
   - What's unclear: Whether map components will cause test failures
   - Recommendation: Gate map tests behind `typeof WebGLRenderingContext !== 'undefined'` or mock the Map component in unit tests

3. **Carto Dark Matter tile availability**
   - What we know: Carto vector tiles at `basemaps.cartocdn.com` are currently live and free with attribution
   - What's unclear: Long-term availability guarantees
   - Recommendation: Document a fallback to raster tiles at `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png` (Leaflet-style) if vector tiles ever go down

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test (built-in) |
| Config file | none (bun test auto-discovers *.test.ts) |
| Quick run command | `bun test` |
| Full suite command | `bun test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Stats panel renders summary values | unit | `bun test src/components/StatsPanel.test.tsx` | No -- Wave 0 |
| DASH-02 | Pace chart renders from records with speed data | unit | `bun test src/components/charts/PaceChart.test.tsx` | No -- Wave 0 |
| DASH-03 | HR chart renders from records with HR data | unit | `bun test src/components/charts/HeartRateChart.test.tsx` | No -- Wave 0 |
| DASH-04 | Elevation chart renders from records with altitude | unit | `bun test src/components/charts/ElevationChart.test.tsx` | No -- Wave 0 |
| DASH-05 | Cadence chart renders from records with cadence | unit | `bun test src/components/charts/CadenceChart.test.tsx` | No -- Wave 0 |
| DASH-06 | Route map renders GeoJSON from GPS records | unit | `bun test src/components/RouteMap.test.tsx` | No -- Wave 0 |
| DASH-07 | Lap table renders all laps with metrics | unit | `bun test src/components/LapTable.test.tsx` | No -- Wave 0 |
| DASH-08 | Missing data channels hide their panels | unit | `bun test src/lib/data-presence.test.ts` | No -- Wave 0 |
| STYLE-01 | Dark bg, neon accents applied (visual) | manual-only | N/A (visual inspection) | N/A |
| STYLE-02 | Dense single-screen layout (visual) | manual-only | N/A (visual inspection at 1920x1080) | N/A |
| STYLE-04 | HUD-style stat overlays (visual) | manual-only | N/A (visual inspection) | N/A |

### Sampling Rate
- **Per task commit:** `bun test`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/data-presence.test.ts` -- covers DASH-08 (data channel detection)
- [ ] `src/lib/chart-data.test.ts` -- covers DASH-02/03/04/05 (data transformation logic)
- [ ] `src/components/LapTable.test.tsx` -- covers DASH-07 (lap rendering)
- [ ] Chart rendering tests may require `happy-dom` or similar for DOM environment in bun:test
- [ ] MapLibre route map tests need WebGL mock or conditional skip

## Sources

### Primary (HIGH confidence)
- recharts npm registry -- v3.8.0, peer deps verified via `bun info recharts` (2026-03-06 publish date)
- @vis.gl/react-maplibre npm registry -- v8.1.0, verified via `bun info` (2025-10-03 publish date)
- maplibre-gl npm registry -- v5.20.0, verified via `bun info` (2026-03-10 publish date)
- Carto Dark Matter style.json -- verified live at `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
- [visgl react-maplibre get-started](https://visgl.github.io/react-maplibre/docs/get-started) -- installation and usage pattern
- [Bun CSS bundler docs](https://bun.com/docs/bundler/css) -- CSS handling capabilities

### Secondary (MEDIUM confidence)
- [recharts/recharts GitHub package.json](https://github.com/recharts/recharts/blob/main/package.json) -- peerDependencies include React 19
- [recharts React 19 issue #4558](https://github.com/recharts/recharts/issues/4558) -- react-is fix documented
- [Recharts gradient/glow patterns](https://leanylabs.com/blog/awesome-react-charts-tips/) -- SVG defs patterns for gradients and filters
- [Free basemap tiles for MapLibre](https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb) -- Carto CDN free usage confirmed
- [Carto basemaps docs](https://docs.carto.com/carto-for-developers/carto-for-react/guides/basemaps) -- style URL structure

### Tertiary (LOW confidence)
- Bun bundler CSS import from node_modules -- not explicitly documented for third-party packages; recommend CDN link for maplibre CSS

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified via `bun info`, peer deps checked, dry-run installs succeed
- Architecture: HIGH -- Patterns derived from official docs and verified API surfaces; data model fully known from Phase 1 codebase
- Pitfalls: HIGH -- react-is issue is well-documented; MapLibre CSS and container height are known gotchas; pace axis inversion is domain knowledge
- Map basemap: MEDIUM -- Carto tiles are live today but no SLA guarantee; fallback documented

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days -- libraries are stable releases)
