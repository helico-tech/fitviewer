import { create } from "zustand";
import type { RunData } from "@/types/run";
import { parseFitFile } from "@/lib/fit-parser";

export type MapMetric = "none" | "pace" | "heartRate" | "altitude" | "cadence";

interface RunStore {
  // Run data
  runData: RunData | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  unitSystem: "metric" | "imperial";
  hoveredIndex: number | null;
  mapMetric: MapMetric;

  // Actions
  loadFile: (file: File) => Promise<void>;
  reset: () => void;
  setUnitSystem: (unit: "metric" | "imperial") => void;
  setHoveredIndex: (index: number | null) => void;
  setMapMetric: (metric: MapMetric) => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runData: null,
  isLoading: false,
  error: null,

  unitSystem: "metric",
  hoveredIndex: null,
  mapMetric: "pace" as MapMetric,

  loadFile: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const runData = await parseFitFile(file);
      set({ runData, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      set({ error: message, isLoading: false, runData: null });
    }
  },

  reset: () => {
    set({ runData: null, isLoading: false, error: null, hoveredIndex: null });
  },

  setUnitSystem: (unitSystem) => {
    set({ unitSystem });
  },

  setHoveredIndex: (hoveredIndex) => {
    set({ hoveredIndex });
  },

  setMapMetric: (mapMetric) => {
    set({ mapMetric });
  },
}));

// Expose store API on window for E2E testing
if (import.meta.env.DEV) {
  (window as any).__runStore = useRunStore;
}
