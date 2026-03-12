import { create } from "zustand";
import type { NormalizedActivity, SummaryStats, ActivityMetadata } from "../types/activity.ts";

type ActivityState = {
  status: "empty" | "loading" | "loaded" | "error";
  activity: NormalizedActivity | null;
  summary: SummaryStats | null;
  error: { message: string; details?: string } | null;
  metadata: ActivityMetadata | null;
  // Actions
  startLoading: () => void;
  setActivity: (activity: NormalizedActivity) => void;
  setError: (message: string, details?: string) => void;
  reset: () => void;
};

export const useActivityStore = create<ActivityState>((set) => ({
  status: "empty",
  activity: null,
  summary: null,
  error: null,
  metadata: null,
  startLoading: () => set({ status: "loading", error: null }),
  setActivity: (activity) =>
    set({
      status: "loaded",
      activity,
      summary: activity.summary,
      metadata: activity.metadata,
    }),
  setError: (message, details) =>
    set({
      status: "error",
      error: { message, details },
    }),
  reset: () =>
    set({
      status: "empty",
      activity: null,
      summary: null,
      error: null,
      metadata: null,
    }),
}));
