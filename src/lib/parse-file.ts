import type { WorkerRequest, WorkerResponse } from "../types/worker-messages.ts";
import { useActivityStore } from "../store/activity-store.ts";

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker("/worker.js");
  }
  return worker;
}

export async function handleFileUpload(file: File): Promise<void> {
  const store = useActivityStore.getState();

  // Quick pre-check: validate file extension
  if (!file.name.toLowerCase().endsWith(".fit")) {
    store.setError(
      "That's not a FIT file, chief. We need the goods from your watch.",
      `Expected .fit file, got: ${file.name}`,
    );
    return;
  }

  store.startLoading();

  const buffer = await file.arrayBuffer();
  const w = getWorker();

  w.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    if (response.type === "success") {
      useActivityStore.getState().setActivity(response.activity);
    } else {
      // Check for sport mismatch
      if (response.details?.startsWith("SPORT_MISMATCH:")) {
        const sport = response.details.split(":")[1];
        useActivityStore.getState().setError(
          `Nice ${sport}, but we're a running crew.`,
          `FIT file contains ${sport} activity. Only running activities are supported.`,
        );
      } else {
        useActivityStore.getState().setError(response.message, response.details);
      }
    }
  };

  w.onerror = (error: ErrorEvent) => {
    useActivityStore.getState().setError(
      "Something went wrong during parsing.",
      error.message,
    );
  };

  // Transfer the ArrayBuffer (not copy) for performance
  w.postMessage({ type: "parse", buffer } satisfies WorkerRequest, [buffer]);
}
