import { create } from "zustand";
import type { RunData } from "@/types/run";
import { parseFitFile } from "@/lib/fit-parser";
import { DEFAULT_ZONE_PCTS } from "@/lib/calculations";

export type MapMetric = "none" | "pace" | "heartRate" | "altitude" | "cadence";
export type MapOverlayMode = "none" | "splits" | "laps";
export type ChartXAxis = "distance" | "time";

export interface ZoneBoundary {
  min: number; // percentage of max HR (0-1)
  max: number; // percentage of max HR (0-1)
}

interface RunStore {
  // Run data
  runData: RunData | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  unitSystem: "metric" | "imperial";
  hoveredIndex: number | null;
  mapMetric: MapMetric;
  mapOverlayMode: MapOverlayMode;
  chartXAxis: ChartXAxis;
  smoothingWindow: number;

  // Split highlight
  selectedSplitIndex: number | null;

  // Zone config
  maxHR: number;
  zoneBoundaries: ZoneBoundary[];

  // Actions
  loadFile: (file: File) => Promise<void>;
  reset: () => void;
  setUnitSystem: (unit: "metric" | "imperial") => void;
  setHoveredIndex: (index: number | null) => void;
  setMapMetric: (metric: MapMetric) => void;
  setMapOverlayMode: (mode: MapOverlayMode) => void;
  setChartXAxis: (axis: ChartXAxis) => void;
  setSmoothingWindow: (window: number) => void;
  setSelectedSplitIndex: (index: number | null) => void;
  setMaxHR: (maxHR: number) => void;
  setZoneBoundaries: (boundaries: ZoneBoundary[]) => void;
}

export const useRunStore = create<RunStore>((set) => ({
  runData: null,
  isLoading: false,
  error: null,

  unitSystem: "metric",
  hoveredIndex: null,
  selectedSplitIndex: null,
  mapMetric: "pace" as MapMetric,
  mapOverlayMode: "none" as MapOverlayMode,
  chartXAxis: "distance" as ChartXAxis,
  smoothingWindow: 10,

  maxHR: 190,
  zoneBoundaries: [...DEFAULT_ZONE_PCTS],

  loadFile: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const runData = await parseFitFile(file);
      const maxHR = runData.summary.maxHeartRate > 0
        ? runData.summary.maxHeartRate
        : 190;
      set({ runData, isLoading: false, maxHR });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      set({ error: message, isLoading: false, runData: null });
    }
  },

  reset: () => {
    set({ runData: null, isLoading: false, error: null, hoveredIndex: null, selectedSplitIndex: null });
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

  setMapOverlayMode: (mapOverlayMode) => {
    set({ mapOverlayMode });
  },

  setChartXAxis: (chartXAxis) => {
    set({ chartXAxis });
  },

  setSmoothingWindow: (smoothingWindow) => {
    set({ smoothingWindow: Math.max(1, Math.min(30, smoothingWindow)) });
  },

  setSelectedSplitIndex: (selectedSplitIndex) => {
    set({ selectedSplitIndex });
  },

  setMaxHR: (maxHR) => {
    set({ maxHR: Math.max(100, Math.min(230, maxHR)) });
  },

  setZoneBoundaries: (zoneBoundaries) => {
    set({ zoneBoundaries });
  },
}));

// Expose store API on window for E2E testing
if (import.meta.env.DEV) {
  (window as any).__runStore = useRunStore;
}
