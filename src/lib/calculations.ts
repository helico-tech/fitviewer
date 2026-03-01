import type { DataPoint } from "@/types/run";
import type { UnitSystem } from "@/lib/units";

export interface Split {
  number: number;
  startIndex: number; // index into records array
  endIndex: number; // index into records array
  distance: number; // meters
  time: number; // seconds
  avgPace: number; // sec/km
  avgHeartRate: number; // bpm
  avgCadence: number; // spm
  elevationGain: number; // meters
  elevationLoss: number; // meters
}

const METERS_PER_KM = 1000;
const METERS_PER_MILE = 1609.344;

/**
 * Compute auto splits from record data based on cumulative distance
 * crossing km or mile boundaries.
 */
export function computeSplits(
  records: DataPoint[],
  unitSystem: UnitSystem,
): Split[] {
  if (records.length < 2) return [];

  const splitInterval = unitSystem === "metric" ? METERS_PER_KM : METERS_PER_MILE;
  const splits: Split[] = [];

  let splitStart = 0; // index of the start of current split
  let nextBoundary = splitInterval;

  for (let i = 1; i < records.length; i++) {
    if (records[i].distance >= nextBoundary) {
      splits.push(buildSplit(records, splitStart, i, splits.length + 1));
      splitStart = i;
      nextBoundary += splitInterval;
    }
  }

  // Include the final partial split if there are remaining records
  const lastIndex = records.length - 1;
  if (splitStart < lastIndex) {
    const remainingDistance = records[lastIndex].distance - records[splitStart].distance;
    // Only include if the partial split covers at least 10% of the interval
    if (remainingDistance >= splitInterval * 0.1) {
      splits.push(buildSplit(records, splitStart, lastIndex, splits.length + 1));
    }
  }

  return splits;
}

function buildSplit(
  records: DataPoint[],
  startIdx: number,
  endIdx: number,
  number: number,
): Split {
  const distance = records[endIdx].distance - records[startIdx].distance;
  const time =
    (records[endIdx].timestamp.getTime() - records[startIdx].timestamp.getTime()) / 1000;

  let hrSum = 0;
  let hrCount = 0;
  let cadSum = 0;
  let cadCount = 0;
  let elevGain = 0;
  let elevLoss = 0;

  for (let i = startIdx; i <= endIdx; i++) {
    if (records[i].heartRate > 0) {
      hrSum += records[i].heartRate;
      hrCount++;
    }
    if (records[i].cadence > 0) {
      cadSum += records[i].cadence;
      cadCount++;
    }
    if (i > startIdx) {
      const diff = records[i].altitude - records[i - 1].altitude;
      if (diff > 0) elevGain += diff;
      else elevLoss += Math.abs(diff);
    }
  }

  const avgPace = distance > 0 ? (time / distance) * 1000 : 0; // sec/km

  return {
    number,
    startIndex: startIdx,
    endIndex: endIdx,
    distance,
    time,
    avgPace,
    avgHeartRate: hrCount > 0 ? hrSum / hrCount : 0,
    avgCadence: cadCount > 0 ? cadSum / cadCount : 0,
    elevationGain: elevGain,
    elevationLoss: elevLoss,
  };
}

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
