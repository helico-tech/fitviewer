import type { ActivityRecord } from "../types/activity";

export type ChartPoint = {
  elapsed: number;
  value: number;
};

/**
 * Convert speed in m/s to pace in min/km.
 * Returns 15 (cap) for speeds <= 0.2 m/s.
 */
export function speedToPace(speedMs: number): number {
  if (speedMs <= 0.2) return 15;
  return 1000 / speedMs / 60;
}

/**
 * Convert activity records to pace chart data.
 * Filters out records with null speed, converts to min/km pace.
 */
export function toPaceData(records: ActivityRecord[], startTime: number): ChartPoint[] {
  const result: ChartPoint[] = [];
  for (const r of records) {
    if (r.speed === null) continue;
    result.push({
      elapsed: (r.timestamp.getTime() - startTime) / 1000 / 60,
      value: speedToPace(r.speed),
    });
  }
  return result;
}

/**
 * Convert activity records to heart rate chart data.
 * Filters out records with null heartRate.
 */
export function toHrData(records: ActivityRecord[], startTime: number): ChartPoint[] {
  const result: ChartPoint[] = [];
  for (const r of records) {
    if (r.heartRate === null) continue;
    result.push({
      elapsed: (r.timestamp.getTime() - startTime) / 1000 / 60,
      value: r.heartRate,
    });
  }
  return result;
}

/**
 * Convert activity records to elevation chart data.
 * Filters out records with null altitude.
 */
export function toElevationData(records: ActivityRecord[], startTime: number): ChartPoint[] {
  const result: ChartPoint[] = [];
  for (const r of records) {
    if (r.altitude === null) continue;
    result.push({
      elapsed: (r.timestamp.getTime() - startTime) / 1000 / 60,
      value: r.altitude,
    });
  }
  return result;
}

/**
 * Convert activity records to cadence chart data.
 * Filters out records with null cadence.
 */
export function toCadenceData(records: ActivityRecord[], startTime: number): ChartPoint[] {
  const result: ChartPoint[] = [];
  for (const r of records) {
    if (r.cadence === null) continue;
    result.push({
      elapsed: (r.timestamp.getTime() - startTime) / 1000 / 60,
      value: r.cadence,
    });
  }
  return result;
}
