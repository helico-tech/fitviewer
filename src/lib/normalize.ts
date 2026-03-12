import type { SummaryStats } from "../types/activity.ts";

/**
 * Conversion factor from FIT semicircles to decimal degrees.
 * FIT stores coordinates as signed 32-bit integers (semicircles).
 * degrees = semicircles * (180 / 2^31)
 */
const SEMICIRCLE_TO_DEGREES = 180 / 2 ** 31;

/**
 * Converts FIT semicircle coordinate values to decimal degrees.
 *
 * FIT files store GPS coordinates in "semicircles" -- signed 32-bit integers
 * where 2^31 = 180 degrees. This is NOT handled by the SDK's applyScaleAndOffset.
 */
export function semicirclesToDegrees(semicircles: number): number {
  return semicircles * SEMICIRCLE_TO_DEGREES;
}

/**
 * Computes SummaryStats from a decoded FIT session message.
 *
 * Prefers enhanced speed fields over plain speed fields.
 * For cadence: uses avgRunningCadence if available (already in strides/min),
 * otherwise doubles avgCadence (which is in half-cycles/rpm).
 */
export function computeSummaryStats(session: Record<string, any>): SummaryStats {
  return {
    totalDistance: session.totalDistance,
    totalDuration: session.totalElapsedTime,
    totalTimerTime: session.totalTimerTime,
    avgSpeed: session.enhancedAvgSpeed ?? session.avgSpeed ?? null,
    maxSpeed: session.enhancedMaxSpeed ?? session.maxSpeed ?? null,
    avgHeartRate: session.avgHeartRate ?? null,
    maxHeartRate: session.maxHeartRate ?? null,
    avgCadence: session.avgRunningCadence != null
      ? session.avgRunningCadence
      : session.avgCadence != null
        ? session.avgCadence * 2
        : null,
    totalAscent: session.totalAscent ?? null,
    totalDescent: session.totalDescent ?? null,
  };
}
