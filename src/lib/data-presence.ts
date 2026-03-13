import type { ActivityRecord } from "../types/activity";

export type DataChannels = {
  hasGps: boolean;
  hasHeartRate: boolean;
  hasCadence: boolean;
  hasAltitude: boolean;
};

export function detectChannels(records: ActivityRecord[]): DataChannels {
  const result: DataChannels = {
    hasGps: false,
    hasHeartRate: false,
    hasCadence: false,
    hasAltitude: false,
  };

  for (const r of records) {
    if (r.positionLat !== null && r.positionLong !== null) result.hasGps = true;
    if (r.heartRate !== null) result.hasHeartRate = true;
    if (r.cadence !== null) result.hasCadence = true;
    if (r.altitude !== null) result.hasAltitude = true;

    // Short-circuit if all channels found
    if (result.hasGps && result.hasHeartRate && result.hasCadence && result.hasAltitude) {
      break;
    }
  }

  return result;
}
