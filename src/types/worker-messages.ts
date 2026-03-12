import type { NormalizedActivity } from "./activity.ts";

export type WorkerRequest = {
  type: "parse";
  buffer: ArrayBuffer;
};

export type WorkerResponse =
  | { type: "success"; activity: NormalizedActivity }
  | { type: "error"; message: string; details?: string };
