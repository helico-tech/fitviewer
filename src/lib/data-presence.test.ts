import { test, expect, describe } from "bun:test";
import { detectChannels } from "./data-presence";
import type { ActivityRecord } from "../types/activity";

function makeRecord(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    timestamp: new Date("2024-01-01T00:00:00Z"),
    heartRate: null,
    cadence: null,
    speed: null,
    altitude: null,
    distance: null,
    positionLat: null,
    positionLong: null,
    ...overrides,
  };
}

describe("detectChannels", () => {
  test("returns all true for records with all fields present", () => {
    const records: ActivityRecord[] = [
      makeRecord({
        heartRate: 150,
        cadence: 85,
        speed: 3.5,
        altitude: 100,
        positionLat: 47.5,
        positionLong: 8.5,
      }),
    ];
    const channels = detectChannels(records);
    expect(channels).toEqual({
      hasGps: true,
      hasHeartRate: true,
      hasCadence: true,
      hasAltitude: true,
    });
  });

  test("returns all false for records with all null fields", () => {
    const records: ActivityRecord[] = [makeRecord()];
    const channels = detectChannels(records);
    expect(channels).toEqual({
      hasGps: false,
      hasHeartRate: false,
      hasCadence: false,
      hasAltitude: false,
    });
  });

  test("returns partial channels when only some data is present", () => {
    const records: ActivityRecord[] = [
      makeRecord({ heartRate: 140 }),
      makeRecord({ heartRate: 145, cadence: 80 }),
    ];
    const channels = detectChannels(records);
    expect(channels).toEqual({
      hasGps: false,
      hasHeartRate: true,
      hasCadence: true,
      hasAltitude: false,
    });
  });

  test("requires both lat and long for GPS", () => {
    const records: ActivityRecord[] = [
      makeRecord({ positionLat: 47.5 }), // only lat, no long
    ];
    const channels = detectChannels(records);
    expect(channels.hasGps).toBe(false);
  });

  test("returns all false for empty records array", () => {
    const channels = detectChannels([]);
    expect(channels).toEqual({
      hasGps: false,
      hasHeartRate: false,
      hasCadence: false,
      hasAltitude: false,
    });
  });
});
