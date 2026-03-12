/**
 * Web Worker entry point for FIT file parsing.
 *
 * Receives ArrayBuffer via postMessage (transferred, not copied),
 * parses it using parseFitFile, and posts back a typed WorkerResponse.
 *
 * Note: Worker.ts is tested indirectly through fit-parser.test.ts.
 * The parseFitFile function is thoroughly unit-tested; this wrapper
 * is intentionally minimal to be correct by inspection.
 */
declare var self: Worker;

import { parseFitFile } from "./fit-parser.ts";
import type { WorkerRequest, WorkerResponse } from "../types/worker-messages.ts";

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, buffer } = event.data;

  if (type === "parse") {
    try {
      const activity = parseFitFile(buffer);
      self.postMessage({
        type: "success",
        activity,
      } satisfies WorkerResponse);
    } catch (err) {
      self.postMessage({
        type: "error",
        message: "Failed to parse FIT file",
        details: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResponse);
    }
  }
};
