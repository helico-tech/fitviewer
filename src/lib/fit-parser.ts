import type { RunData } from "@/types/run";
import type {
  WorkerRequest,
  WorkerResponse,
  SerializedRunData,
} from "@/workers/fit-parser.worker";

/**
 * Hydrate serialized dates (ISO strings) back into Date objects.
 */
function hydrateRunData(serialized: SerializedRunData): RunData {
  return {
    summary: {
      ...serialized.summary,
      startTime: new Date(serialized.summary.startTime),
    },
    records: serialized.records.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    })),
    laps: serialized.laps,
    sessions: serialized.sessions.map((s) => ({
      ...s,
      startTime: new Date(s.startTime),
    })),
  };
}

/**
 * Parse a FIT file and return structured RunData.
 *
 * Runs the FIT parsing in a Web Worker to keep the UI responsive
 * for large files (1-5 MB).
 */
export function parseFitFile(file: File): Promise<RunData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/fit-parser.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      if (response.type === "success") {
        resolve(hydrateRunData(response.data));
      } else {
        reject(new Error(response.message));
      }

      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(new Error(error.message || "Worker failed unexpectedly"));
      worker.terminate();
    };

    file.arrayBuffer().then((buffer) => {
      worker.postMessage(
        { type: "parse", buffer } satisfies WorkerRequest,
        [buffer] // Transfer the ArrayBuffer for zero-copy
      );
    }).catch(reject);
  });
}
