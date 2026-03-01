import type { DataPoint } from "@/types/run";

export interface HRZone {
  name: string;
  minBpm: number;
  maxBpm: number;
  color: string;
}

export interface ZoneDistribution {
  zone: HRZone;
  seconds: number;
  percentage: number;
}

/** Standard 5-zone colors: gray, blue, green, orange, red */
export const ZONE_COLORS = [
  "#9ca3af", // Z1 - gray (recovery)
  "#60a5fa", // Z2 - blue (easy)
  "#4ade80", // Z3 - green (tempo)
  "#fb923c", // Z4 - orange (threshold)
  "#f87171", // Z5 - red (VO2max)
];

export const ZONE_NAMES = [
  "Zone 1 — Recovery",
  "Zone 2 — Easy",
  "Zone 3 — Tempo",
  "Zone 4 — Threshold",
  "Zone 5 — VO2max",
];

/** Default zone boundaries as percentages of max HR */
export const DEFAULT_ZONE_PCTS = [
  { min: 0.5, max: 0.6 },
  { min: 0.6, max: 0.7 },
  { min: 0.7, max: 0.8 },
  { min: 0.8, max: 0.9 },
  { min: 0.9, max: 1.0 },
];

/** Build HRZone objects from a max HR and percentage boundaries */
export function buildZones(maxHR: number, zonePcts = DEFAULT_ZONE_PCTS): HRZone[] {
  return zonePcts.map((pct, i) => ({
    name: ZONE_NAMES[i],
    minBpm: Math.round(maxHR * pct.min),
    maxBpm: Math.round(maxHR * pct.max),
    color: ZONE_COLORS[i],
  }));
}

/**
 * Calculate time distribution across HR zones from data records.
 * Uses the time delta between consecutive records to accumulate seconds per zone.
 */
export function calculateZoneDistribution(
  records: DataPoint[],
  zones: HRZone[],
): ZoneDistribution[] {
  const secondsPerZone = new Array(zones.length).fill(0);
  let totalSeconds = 0;

  for (let i = 1; i < records.length; i++) {
    const hr = records[i].heartRate;
    if (!hr || hr <= 0) continue;

    const dt =
      (records[i].timestamp.getTime() - records[i - 1].timestamp.getTime()) /
      1000;
    if (dt <= 0 || dt > 60) continue; // skip gaps > 60s

    totalSeconds += dt;

    // Find which zone this HR falls into
    for (let z = zones.length - 1; z >= 0; z--) {
      if (hr >= zones[z].minBpm) {
        secondsPerZone[z] += dt;
        break;
      }
    }
    // If HR is below all zones, count as zone 1
    if (hr < zones[0].minBpm) {
      secondsPerZone[0] += dt;
    }
  }

  return zones.map((zone, i) => ({
    zone,
    seconds: secondsPerZone[i],
    percentage: totalSeconds > 0 ? (secondsPerZone[i] / totalSeconds) * 100 : 0,
  }));
}
