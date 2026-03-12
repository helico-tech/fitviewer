# Phase 1: Data Foundation - Research

**Researched:** 2026-03-12
**Domain:** FIT file parsing, Web Workers, React state management, client-side data pipeline
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 is a data pipeline: accept a FIT file (drag-drop or file picker), parse it in a Web Worker, normalize the data, and display summary stats on a skeleton dashboard. The critical technical decisions are: which FIT parser to use, how to handle Web Workers in Bun's fullstack dev server (which has a known gap), how to manage parsed data state, and how to deliver the "cinematic" drop zone experience the user wants.

The **@garmin/fitsdk** is the recommended FIT parser -- it's the official Garmin SDK, actively maintained (v21.195.0 published March 2026), works with browser ArrayBuffers, and has rich decode options. The tradeoff is zero TypeScript type definitions (community or official), so we'll need to write our own `.d.ts` file. For Web Workers, Bun's fullstack dev server does NOT auto-bundle worker files referenced via `new Worker()` -- the documented workaround is to serve the worker file through a `Bun.build()` route handler in development. State management via Zustand (v5, ~3KB) is the right fit: simple, TypeScript-first, no providers needed.

**Primary recommendation:** Use `@garmin/fitsdk` with a manually-served Web Worker (Bun.build route workaround), Zustand for state, and native HTML5 drag-and-drop (no react-dropzone -- it's unnecessary complexity for a single-file drop zone).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full-screen takeover drop zone -- entire viewport is the drop zone when no file is loaded
- Ghosted/dimmed dashboard wireframe visible behind the drop zone as a cinematic tease
- On drag-over: wireframe "powers on" -- starts lighting up and animating as if the system is activating
- Inviting text prompt with file picker button as fallback
- Sims-style fake loading sequence with fun status messages, 1-2 seconds max
- Dissolve transition: drop zone fades out, dashboard fades in
- File metadata in persistent header bar: "Garmin FR965 - Mar 10, 2026 - Running - 42:15"
- After parse, ghosted dashboard skeleton fills in with real summary stats
- Playful error tone, errors shown in-place on drop zone, no modals
- Running activities only -- reject non-running FIT files with playful message
- Expandable "Show details" for technical error info
- Dashboard skeleton with full summary stats: distance, duration, average pace, average/max HR, cadence, total elevation gain
- Replace button in header bar for new file upload

### Claude's Discretion
- Exact boot sequence message content and timing
- Dashboard skeleton wireframe layout design
- Specific neon color palette and glow intensity
- File picker button placement and styling
- Summary stat formatting (e.g., pace as min/km vs min/mi)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILE-01 | Drag-and-drop FIT file upload | Native HTML5 DnD API with React event handlers; full-screen drop zone pattern |
| FILE-02 | File picker button upload | Standard `<input type="file" accept=".fit">` triggered by button click |
| FILE-03 | Friendly error on non-FIT/malformed file | `Decoder.isFIT()` and `Decoder.checkIntegrity()` from @garmin/fitsdk; sport type check via session message |
| FILE-04 | File metadata display (device, date, sport) | `fileIdMesgs` (device/manufacturer), `sessionMesgs` (sport, startTime, totalElapsedTime) from decoded messages |
| DATA-01 | Client-side FIT parsing | @garmin/fitsdk Decoder + Stream.fromArrayBuffer() runs entirely in browser |
| DATA-02 | Semicircle to decimal degree conversion | Manual conversion: `degrees = semicircles * (180 / 2^31)` -- NOT handled by applyScaleAndOffset |
| DATA-03 | Summary stats computation | Derive from sessionMesgs (totals) and recordMesgs (time-series for avg/max calculations) |
| DATA-04 | LTTB downsampling | `downsample` npm package (v1.4.0) -- TypeScript, multiple algorithms, TypedArray support |
| DATA-05 | Web Worker parsing | Browser Web Worker with Bun.build() route workaround for dev server; transferable ArrayBuffer |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @garmin/fitsdk | 21.195.0 | FIT file decoding | Official Garmin SDK, actively maintained, browser-compatible, rich decode options |
| react | 19.2.x | UI framework | Already configured in tsconfig, Bun HTML imports support it |
| react-dom | 19.2.x | DOM rendering | Required by React |
| zustand | 5.0.x | State management | ~3KB, TypeScript-first, no providers, fine-grained subscriptions |
| downsample | 1.4.0 | LTTB time-series downsampling | TypeScript, multiple algorithms (LTTB/LTOB/LTD), TypedArray support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Phase 1 has minimal dependencies by design |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @garmin/fitsdk | fit-file-parser | fit-file-parser has TypeScript built-in but is community-maintained, not official Garmin. @garmin/fitsdk is authoritative and has richer decode options (mergeHeartRates, expandComponents). We write our own types -- not a big deal for the subset of fields we use. |
| zustand | jotai | Jotai is atomic/bottom-up; zustand is centralized. For this app with one main data object (parsed activity), a single zustand store is simpler and more natural. |
| zustand | React Context | Context causes full re-renders. Zustand gives fine-grained subscriptions without provider wrapping. Worth the 3KB. |
| native DnD | react-dropzone | react-dropzone is ~7KB for something we can do in ~30 lines of native HTML5 DnD. Our drop zone is full-screen with custom animations -- react-dropzone's defaults would fight us. |
| downsample | hand-rolled LTTB | LTTB is a ~50-line algorithm but downsample handles edge cases, TypedArrays, and multiple algorithm variants. Not worth hand-rolling. |

**Installation:**
```bash
bun install @garmin/fitsdk react react-dom zustand downsample
bun install -d @types/react @types/react-dom
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # React application layer
│   ├── App.tsx             # Root component, state-driven view switching
│   ├── index.html          # HTML entry point (Bun HTML import)
│   ├── index.tsx           # React mount point
│   └── index.css           # Global styles
├── components/
│   ├── DropZone.tsx        # Full-screen drop zone with drag-over activation
│   ├── BootSequence.tsx    # Sims-style loading animation
│   ├── DashboardSkeleton.tsx  # Ghosted wireframe / filled summary view
│   ├── HeaderBar.tsx       # Persistent header with metadata + replace button
│   └── ErrorDisplay.tsx    # In-place error with expandable details
├── lib/                    # React-free data processing layer
│   ├── fit-parser.ts       # @garmin/fitsdk wrapper (decode, validate, normalize)
│   ├── fit-types.d.ts      # TypeScript declarations for @garmin/fitsdk messages
│   ├── normalize.ts        # Semicircle conversion, unit transforms, stat computation
│   ├── downsample.ts       # LTTB wrapper for time-series data
│   └── worker.ts           # Web Worker entry point
├── store/
│   └── activity-store.ts   # Zustand store for parsed activity data
└── types/
    └── activity.ts         # App-level type definitions (NormalizedActivity, SummaryStats, etc.)
```

### Pattern 1: Web Worker with Bun Dev Server Workaround
**What:** Bun's fullstack dev server does NOT auto-bundle Web Worker files. The HTML bundler scans `<script>` and `<link>` tags but does not detect `new Worker()` calls. The workaround is to serve the worker file through a Bun.build() route handler.
**When to use:** Always, until Bun adds native worker bundling support.
**Example:**
```typescript
// index.ts (server entry point)
import homepage from "./src/app/index.html";

Bun.serve({
  routes: {
    "/": homepage,
    // Serve the worker as a separately bundled JS file
    "/worker.js": async () => {
      const result = await Bun.build({
        entrypoints: ["./src/lib/worker.ts"],
        target: "browser",
      });
      return new Response(result.outputs[0], {
        headers: { "Content-Type": "application/javascript" },
      });
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});
```
```typescript
// In React component or lib code (browser-side):
const worker = new Worker("/worker.js");
```
Source: [Bun GitHub Issue #17705](https://github.com/oven-sh/bun/issues/17705), [Bun Discussion #14069](https://github.com/oven-sh/bun/discussions/14069)

### Pattern 2: Zustand Store for Activity Data
**What:** Single zustand store holding the entire parsed activity state, with actions for loading/error/reset.
**When to use:** All components that need activity data subscribe to slices of this store.
**Example:**
```typescript
// store/activity-store.ts
import { create } from 'zustand';
import type { NormalizedActivity, SummaryStats } from '../types/activity';

type ActivityState = {
  status: 'empty' | 'loading' | 'loaded' | 'error';
  activity: NormalizedActivity | null;
  summary: SummaryStats | null;
  error: { message: string; details?: string } | null;
  metadata: { device: string; date: Date; sport: string; duration: string } | null;
  // Actions
  startLoading: () => void;
  setActivity: (activity: NormalizedActivity) => void;
  setError: (message: string, details?: string) => void;
  reset: () => void;
};

export const useActivityStore = create<ActivityState>((set) => ({
  status: 'empty',
  activity: null,
  summary: null,
  error: null,
  metadata: null,
  startLoading: () => set({ status: 'loading', error: null }),
  setActivity: (activity) => set({
    status: 'loaded',
    activity,
    summary: activity.summary,
    metadata: activity.metadata,
  }),
  setError: (message, details) => set({
    status: 'error',
    error: { message, details },
  }),
  reset: () => set({
    status: 'empty',
    activity: null,
    summary: null,
    error: null,
    metadata: null,
  }),
}));
```

### Pattern 3: Worker Message Protocol
**What:** Typed message protocol between main thread and Web Worker for FIT parsing.
**When to use:** All worker communication.
**Example:**
```typescript
// types/worker-messages.ts
export type WorkerRequest = {
  type: 'parse';
  buffer: ArrayBuffer;
};

export type WorkerResponse =
  | { type: 'success'; activity: NormalizedActivity }
  | { type: 'error'; message: string; details?: string };

// lib/worker.ts
declare var self: Worker;
import { parseFitFile } from './fit-parser';

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, buffer } = event.data;
  if (type === 'parse') {
    try {
      const activity = parseFitFile(buffer);
      self.postMessage({ type: 'success', activity } satisfies WorkerResponse);
    } catch (err) {
      self.postMessage({
        type: 'error',
        message: 'Failed to parse FIT file',
        details: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResponse);
    }
  }
};
```

### Pattern 4: @garmin/fitsdk Decode Pattern
**What:** Reading a FIT file from ArrayBuffer using the official SDK.
**When to use:** Inside the Web Worker for parsing.
**Example:**
```typescript
// lib/fit-parser.ts
import { Decoder, Stream } from '@garmin/fitsdk';

export function parseFitFile(buffer: ArrayBuffer) {
  const stream = Stream.fromArrayBuffer(buffer);

  if (!Decoder.isFIT(stream)) {
    throw new Error('Not a valid FIT file');
  }

  if (!Decoder.checkIntegrity(stream)) {
    throw new Error('FIT file integrity check failed');
  }

  const decoder = new Decoder(stream);
  const { messages, errors } = decoder.read({
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    mergeHeartRates: true,
  });

  if (errors.length > 0) {
    throw new Error(`FIT decode errors: ${errors.map(e => e.message).join(', ')}`);
  }

  return messages;
}
```
Source: [Garmin FIT JavaScript SDK README](https://github.com/garmin/fit-javascript-sdk)

### Pattern 5: State-Driven View Switching
**What:** App renders different views based on `status` field in the zustand store. No router needed.
**When to use:** Root App component.
**Example:**
```typescript
// app/App.tsx
export function App() {
  const status = useActivityStore((s) => s.status);

  return (
    <>
      {status === 'empty' && <DropZone />}
      {status === 'loading' && <BootSequence />}
      {(status === 'loaded' || status === 'empty') && <DashboardSkeleton />}
      {status === 'error' && <DropZone />}  {/* Error shown on drop zone */}
      {status === 'loaded' && <HeaderBar />}
    </>
  );
}
```

### Anti-Patterns to Avoid
- **Parsing on main thread:** FIT files can be 1MB+. Always use a Web Worker. The UI MUST remain responsive during parsing (DATA-05).
- **Transferring parsed data as structured clone:** After parsing, the data is plain objects with primitives -- this hits Bun's fast path for postMessage (2-241x faster). Don't try to use transferable objects for the parsed result, only for the raw ArrayBuffer going IN.
- **Using react-dropzone for a full-screen custom drop zone:** react-dropzone's abstractions would fight the full-screen takeover UX and custom drag-over animations. Native DnD events give full control.
- **Storing raw FIT messages in state:** Normalize BEFORE putting data in the store. Components shouldn't need to know about FIT message structure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FIT binary parsing | Custom binary parser | @garmin/fitsdk | FIT protocol is complex (compressed timestamps, field components, developer fields). Garmin maintains the profile definitions. |
| Time-series downsampling | Custom LTTB implementation | downsample | Edge cases around small datasets, TypedArray handling, bucket boundary math. 50 lines that look simple but have subtle bugs. |
| Semicircle conversion | (nothing -- it's trivial) | Hand-roll this one | It's literally `semicircles * (180 / 2**31)`. Two lines. A library would be absurd. |
| File type detection | Extension checking | `Decoder.isFIT()` + `Decoder.checkIntegrity()` | Checks actual binary header, not just file extension. Someone could rename a .png to .fit. |

**Key insight:** FIT parsing is the one thing you absolutely must NOT hand-roll. The protocol has compressed timestamps, field components, developer fields, and a profile that Garmin updates with new device releases. Everything else in this phase is straightforward enough.

## Common Pitfalls

### Pitfall 1: Semicircle Coordinates Not Auto-Converted
**What goes wrong:** Latitude/longitude show as huge integers (e.g., 519828467) instead of decimal degrees.
**Why it happens:** `applyScaleAndOffset: true` does NOT convert semicircles to degrees. Semicircles are the native FIT coordinate format with no scale/offset defined in the profile.
**How to avoid:** Always apply manual conversion: `degrees = semicircles * (180 / 2**31)`
**Warning signs:** Map shows nothing or coordinates are wildly wrong.

### Pitfall 2: Web Worker File Not Bundled by Bun
**What goes wrong:** `new Worker("./worker.ts")` returns 404 or serves HTML instead of JavaScript.
**Why it happens:** Bun's fullstack dev server scans HTML for `<script>` tags but does NOT detect `new Worker()` calls. Worker files are not auto-bundled.
**How to avoid:** Use the `Bun.build()` route handler workaround (see Pattern 1 above). Serve the worker as a separate route.
**Warning signs:** Console errors about wrong MIME type, 404s, or "unexpected token <" (HTML being served as JS).

### Pitfall 3: @garmin/fitsdk Has No TypeScript Types
**What goes wrong:** All imports from `@garmin/fitsdk` are `any`. No autocomplete, no type checking on message fields.
**Why it happens:** Garmin has no plans to add TypeScript definitions. The SDK uses plain JS with JSDoc comments on Decoder/Stream only.
**How to avoid:** Write a focused `.d.ts` declaration file covering only the exports we use (Decoder, Stream, Profile). Keep it minimal -- we don't need types for the entire profile.
**Warning signs:** Widespread `any` types leaking into application code.

### Pitfall 4: Not Checking Sport Type
**What goes wrong:** User uploads a cycling/swimming FIT file and sees confusing data (no cadence in expected format, wrong pace calculations).
**Why it happens:** The user decision says "Running activities only." But without checking, all FIT files are accepted.
**How to avoid:** After decoding, check `messages.sessionMesgs[0].sport` (with `convertTypesToStrings: true`, this will be a string like "running"). Reject non-running files with the playful error message.
**Warning signs:** Summary stats that make no sense (cycling cadence is RPM, running cadence is SPM).

### Pitfall 5: Blocking Parse on Large Files
**What goes wrong:** UI freezes for 500ms-2s while parsing a large FIT file.
**Why it happens:** Parsing on the main thread. FIT files from long runs can be 1-3MB with thousands of records.
**How to avoid:** Always parse in Web Worker. Transfer the ArrayBuffer (not copy): `worker.postMessage({ type: 'parse', buffer }, [buffer])`.
**Warning signs:** `Total Blocking Time` spikes in DevTools during file upload.

### Pitfall 6: Forgetting to Handle Missing Data Channels
**What goes wrong:** App crashes or shows NaN when a FIT file lacks HR, GPS, or cadence data.
**Why it happens:** Not all devices record all channels. Old watches may lack GPS. Indoor treadmill runs have no GPS.
**How to avoid:** Every data channel must be optional in the type definitions. Null-check before computing derived stats. Summary stats gracefully omit missing channels.
**Warning signs:** `TypeError: Cannot read property of undefined` on record fields.

## Code Examples

### FIT File Decode and Normalize (Worker-side)
```typescript
// lib/fit-parser.ts
// Source: @garmin/fitsdk README + Garmin Developer docs
import { Decoder, Stream } from '@garmin/fitsdk';
import type { NormalizedActivity } from '../types/activity';

const SEMICIRCLE_TO_DEGREES = 180 / 2 ** 31;

function semicirclesToDegrees(semicircles: number): number {
  return semicircles * SEMICIRCLE_TO_DEGREES;
}

export function parseFitFile(buffer: ArrayBuffer): NormalizedActivity {
  const stream = Stream.fromArrayBuffer(buffer);

  if (!Decoder.isFIT(stream)) {
    throw new Error('Not a valid FIT file');
  }

  if (!Decoder.checkIntegrity(stream)) {
    throw new Error('FIT file failed integrity check — the file may be corrupted');
  }

  const decoder = new Decoder(stream);
  const { messages, errors } = decoder.read({
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    mergeHeartRates: true,
  });

  if (errors.length > 0) {
    throw new Error(`FIT decode errors: ${errors.map((e: Error) => e.message).join('; ')}`);
  }

  // Check sport type
  const session = messages.sessionMesgs?.[0];
  if (!session) {
    throw new Error('FIT file contains no session data');
  }
  if (session.sport !== 'running') {
    throw new Error(`SPORT_MISMATCH:${session.sport}`);
  }

  // Normalize records
  const records = (messages.recordMesgs ?? []).map((r: any) => ({
    timestamp: r.timestamp,
    heartRate: r.heartRate ?? null,
    cadence: r.cadence != null ? r.cadence * 2 : null, // FIT stores half-cycles
    speed: r.enhancedSpeed ?? r.speed ?? null,
    altitude: r.enhancedAltitude ?? r.altitude ?? null,
    distance: r.distance ?? null,
    positionLat: r.positionLat != null ? semicirclesToDegrees(r.positionLat) : null,
    positionLong: r.positionLong != null ? semicirclesToDegrees(r.positionLong) : null,
  }));

  // Build summary from session
  const summary = {
    totalDistance: session.totalDistance, // meters
    totalDuration: session.totalElapsedTime, // seconds
    totalTimerTime: session.totalTimerTime, // seconds (moving time)
    avgSpeed: session.enhancedAvgSpeed ?? session.avgSpeed,
    maxSpeed: session.enhancedMaxSpeed ?? session.maxSpeed,
    avgHeartRate: session.avgHeartRate ?? null,
    maxHeartRate: session.maxHeartRate ?? null,
    avgCadence: session.avgRunningCadence ?? (session.avgCadence != null ? session.avgCadence * 2 : null),
    totalAscent: session.totalAscent ?? null,
    totalDescent: session.totalDescent ?? null,
  };

  // Extract metadata
  const fileId = messages.fileIdMesgs?.[0];
  const metadata = {
    device: fileId?.manufacturer
      ? `${fileId.manufacturer} ${fileId.garminProduct ?? fileId.product ?? ''}`
      : 'Unknown Device',
    date: session.startTime ?? session.timestamp,
    sport: session.sport,
    duration: session.totalTimerTime,
  };

  return { records, summary, metadata, laps: messages.lapMesgs ?? [] };
}
```

### Native HTML5 Drag-and-Drop Drop Zone
```typescript
// components/DropZone.tsx
import { useState, useCallback, type DragEvent } from 'react';

export function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleFilePicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fit';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onFile(file);
    };
    input.click();
  }, [onFile]);

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drop-zone--active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p>Drop your FIT file to launch telemetry</p>
      <button onClick={handleFilePicker}>Choose File</button>
    </div>
  );
}
```

### Worker Integration (Main Thread Side)
```typescript
// lib/parse-file.ts
import type { WorkerRequest, WorkerResponse } from '../types/worker-messages';
import { useActivityStore } from '../store/activity-store';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/worker.js');
  }
  return worker;
}

export async function handleFileUpload(file: File): Promise<void> {
  const store = useActivityStore.getState();

  // Validate file extension as quick pre-check
  if (!file.name.toLowerCase().endsWith('.fit')) {
    store.setError(
      "That's not a FIT file, chief. We need the goods from your watch.",
      `Expected .fit extension, got: ${file.name}`
    );
    return;
  }

  store.startLoading();

  const buffer = await file.arrayBuffer();
  const w = getWorker();

  w.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    if (response.type === 'success') {
      store.setActivity(response.activity);
    } else {
      // Check for sport mismatch
      if (response.details?.startsWith('SPORT_MISMATCH:')) {
        const sport = response.details.split(':')[1];
        store.setError(
          `Nice ${sport}, but we're a running crew.`,
          `FIT file contains ${sport} activity data. Only running activities are supported.`
        );
      } else {
        store.setError(response.message, response.details);
      }
    }
  };

  // Transfer the ArrayBuffer (not copy) for performance
  w.postMessage({ type: 'parse', buffer } satisfies WorkerRequest, [buffer]);
}
```

### LTTB Downsampling
```typescript
// lib/downsample.ts
import { LTTB } from 'downsample';

export function downsampleTimeSeries(
  data: { timestamp: Date; value: number }[],
  targetPoints: number
): { timestamp: Date; value: number }[] {
  if (data.length <= targetPoints) return data;

  // Convert to [x, y] tuples for LTTB
  const tuples: [number, number][] = data.map((d) => [
    d.timestamp.getTime(),
    d.value,
  ]);

  const downsampled = LTTB(tuples, targetPoints);

  return downsampled.map(([x, y]) => ({
    timestamp: new Date(x),
    value: y,
  }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fit-file-parser (community) | @garmin/fitsdk (official) | 2023 (initial release) | Official SDK with profile updates matching new Garmin devices |
| Redux for state | Zustand 5 | 2024 (v5 release) | 95% less boilerplate, ~3KB vs ~40KB, native useSyncExternalStore |
| react-dropzone for DnD | Native HTML5 DnD | Always available | Zero dependency, full control over custom UX |
| Vite for dev server | Bun.serve() HTML imports | Bun 1.2+ (2025) | Per project CLAUDE.md constraint -- no Vite |

**Deprecated/outdated:**
- `@garmin-fit/sdk`: Old npm package name, renamed to `@garmin/fitsdk`. Same code, different name.
- `easy-fit`: Last published 7+ years ago. Dead.
- `downsample-lttb`: Last published 11 years ago. Use `downsample` instead.

## Open Questions

1. **Bun.build() worker caching in dev**
   - What we know: The `Bun.build()` route workaround rebuilds on every request. This is fine for dev but slightly wasteful.
   - What's unclear: Whether Bun.build() result can be cached between requests, and whether HMR for the worker file works (probably not).
   - Recommendation: Accept the rebuild-per-request cost in dev. For production (static build), pre-build the worker as a separate entry point. This is a Phase 4 concern (deployment).

2. **@garmin/fitsdk field name casing**
   - What we know: The SDK documentation says "camelCase" for field names. `convertTypesToStrings` converts enum values to strings.
   - What's unclear: Exact field names for all record fields (e.g., is it `enhancedSpeed` or `enhanced_speed`?). Documentation is sparse.
   - Recommendation: Install the SDK, parse a sample FIT file, and `console.log(messages)` to discover the exact shape. Write types based on observed output. This is a 5-minute spike during implementation.

3. **FIT cadence doubling**
   - What we know: FIT stores running cadence as half-cycles (one foot). Most apps display full cycles (both feet = steps per minute). The SDK has `avgRunningCadence` on session messages which may already be doubled.
   - What's unclear: Whether record-level `cadence` field needs manual doubling, or if `expandComponents` handles it.
   - Recommendation: Check during the spike. If record-level cadence is half-cycles, multiply by 2 during normalization.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test (built into Bun 1.3.9) |
| Config file | none -- bun test works out of the box |
| Quick run command | `bun test` |
| Full suite command | `bun test --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILE-01 | Drag-drop file accepted | manual-only | N/A -- requires browser DnD interaction | N/A |
| FILE-02 | File picker selects FIT file | manual-only | N/A -- requires browser file dialog | N/A |
| FILE-03 | Error on non-FIT/malformed file | unit | `bun test src/lib/fit-parser.test.ts` | Wave 0 |
| FILE-04 | Metadata extraction (device, date, sport) | unit | `bun test src/lib/fit-parser.test.ts` | Wave 0 |
| DATA-01 | Client-side FIT parsing | unit | `bun test src/lib/fit-parser.test.ts` | Wave 0 |
| DATA-02 | Semicircle to degrees conversion | unit | `bun test src/lib/normalize.test.ts` | Wave 0 |
| DATA-03 | Summary stats computation | unit | `bun test src/lib/normalize.test.ts` | Wave 0 |
| DATA-04 | LTTB downsampling | unit | `bun test src/lib/downsample.test.ts` | Wave 0 |
| DATA-05 | Web Worker non-blocking | integration/manual | Manual: verify UI responsive during parse | N/A |

### Sampling Rate
- **Per task commit:** `bun test`
- **Per wave merge:** `bun test --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/fit-parser.test.ts` -- covers FILE-03, FILE-04, DATA-01
- [ ] `src/lib/normalize.test.ts` -- covers DATA-02, DATA-03
- [ ] `src/lib/downsample.test.ts` -- covers DATA-04
- [ ] `tests/fixtures/` -- sample FIT files for testing (a valid running .fit, a cycling .fit, a corrupted .fit)
- [ ] No framework install needed -- `bun test` is built-in

## Sources

### Primary (HIGH confidence)
- [@garmin/fitsdk npm](https://www.npmjs.com/package/@garmin/fitsdk) - version, publication date, API overview
- [Garmin FIT JavaScript SDK GitHub](https://github.com/garmin/fit-javascript-sdk) - Decoder API, Stream.fromArrayBuffer, read() options
- [Bun Workers Documentation](https://bun.com/docs/runtime/workers) - Worker API, postMessage performance, TypeScript support
- [Bun Fullstack Dev Server Docs](https://bun.com/docs/bundler/fullstack) - HTML imports, asset bundling behavior

### Secondary (MEDIUM confidence)
- [Bun Issue #17705](https://github.com/oven-sh/bun/issues/17705) - Web Worker not supported in fullstack dev server, Bun.build() workaround
- [Bun Discussion #14069](https://github.com/oven-sh/bun/discussions/14069) - Worker bundling workarounds, build plugin approaches
- [Garmin Forum: TypeScript types](https://forums.garmin.com/developer/fit-sdk/f/discussion/355839/type-definitions-for-garmin-fitsdk-typescript-or-jsdoc) - No official TS types planned
- [Garmin Forum: Semicircle conversion](https://forums.garmin.com/developer/fit-sdk/f/discussion/280125/record-the-latitude-and-longitude-format-of-the-message) - Confirmed `degrees = semicircles * (180 / 2^31)`
- [downsample GitHub](https://github.com/janjakubnanista/downsample) - LTTB API, TypedArray support, multiple algorithms

### Tertiary (LOW confidence)
- [Zustand v5 React 19 compatibility](https://github.com/pmndrs/zustand/discussions/2686) - Confirmed compatible but some peer dep edge cases reported
- Field names in @garmin/fitsdk record messages -- inferred from documentation fragments, needs spike validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK confirmed, versions verified, Bun version checked locally
- Architecture: MEDIUM-HIGH - Web Worker workaround verified via multiple sources, but not tested locally yet
- Pitfalls: HIGH - Semicircle conversion, missing types, and worker bundling are well-documented issues
- Code examples: MEDIUM - Based on SDK docs and community examples, but exact field names need spike validation

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain, low churn)
