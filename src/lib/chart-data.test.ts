import { test, expect, describe } from "bun:test";
import {
  speedToPace,
  toPaceData,
  toHrData,
  toElevationData,
  toCadenceData,
} from "./chart-data";
import type { ActivityRecord } from "../types/activity";

function makeRecord(
  offsetSeconds: number,
  overrides: Partial<ActivityRecord> = {}
): ActivityRecord {
  return {
    timestamp: new Date(Date.UTC(2024, 0, 1, 0, 0, offsetSeconds)),
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

const startTime = Date.UTC(2024, 0, 1, 0, 0, 0);

describe("speedToPace", () => {
  test("converts 3.33 m/s to approximately 5.0 min/km", () => {
    const pace = speedToPace(3.33);
    // 1000 / 3.33 / 60 = ~5.005
    expect(pace).toBeCloseTo(5.0, 0);
  });

  test("returns 15 for speed of 0", () => {
    expect(speedToPace(0)).toBe(15);
  });

  test("returns 15 for near-zero speed (0.1 m/s)", () => {
    expect(speedToPace(0.1)).toBe(15);
  });

  test("returns 15 for speed of 0.2 m/s (boundary)", () => {
    expect(speedToPace(0.2)).toBe(15);
  });

  test("converts fast speed correctly", () => {
    // 5 m/s = 1000/5/60 = 3.33 min/km
    const pace = speedToPace(5);
    expect(pace).toBeCloseTo(3.33, 1);
  });
});

describe("toPaceData", () => {
  test("filters out records with null speed", () => {
    const records: ActivityRecord[] = [
      makeRecord(0, { speed: 3.0 }),
      makeRecord(60, { speed: null }),
      makeRecord(120, { speed: 4.0 }),
    ];
    const result = toPaceData(records, startTime);
    expect(result).toHaveLength(2);
  });

  test("converts speed to pace and computes elapsed minutes", () => {
    const records: ActivityRecord[] = [
      makeRecord(0, { speed: 3.33 }),
      makeRecord(120, { speed: 4.0 }),
    ];
    const result = toPaceData(records, startTime);
    expect(result[0].elapsed).toBeCloseTo(0, 1); // 0 minutes
    expect(result[1].elapsed).toBeCloseTo(2, 1); // 2 minutes
    expect(result[0].value).toBeCloseTo(5.0, 0); // ~5 min/km pace
  });

  test("returns empty array for records with all null speed", () => {
    const records: ActivityRecord[] = [
      makeRecord(0),
      makeRecord(60),
    ];
    const result = toPaceData(records, startTime);
    expect(result).toHaveLength(0);
  });
});

describe("toHrData", () => {
  test("filters out records with null heartRate", () => {
    const records: ActivityRecord[] = [
      makeRecord(0, { heartRate: 140 }),
      makeRecord(60, { heartRate: null }),
      makeRecord(120, { heartRate: 160 }),
    ];
    const result = toHrData(records, startTime);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(140);
    expect(result[1].value).toBe(160);
  });

  test("computes elapsed minutes correctly", () => {
    const records: ActivityRecord[] = [
      makeRecord(0, { heartRate: 140 }),
      makeRecord(300, { heartRate: 160 }),
    ];
    const result = toHrData(records, startTime);
    expect(result[0].elapsed).toBeCloseTo(0, 1);
    expect(result[1].elapsed).toBeCloseTo(5, 1); // 300s = 5min
  });
});

describe("toElevationData", () => {
  test("filters out records with null altitude", () => {
    const records: ActivityRecord[] = [
      makeRecord(0, { altitude: 100 }),
      makeRecord(60, { altitude: null }),
      makeRecord(120, { altitude: 120 }),
    ];
    const result = toElevationData(records, startTime);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(100);
    expect(result[1].value).toBe(120);
  });
});

describe("toCadenceData", () => {
  test("filters out records with null cadence", () => {
    const records: ActivityRecord[] = [
      makeRecord(0, { cadence: 170 }),
      makeRecord(60, { cadence: null }),
      makeRecord(120, { cadence: 175 }),
    ];
    const result = toCadenceData(records, startTime);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(170);
    expect(result[1].value).toBe(175);
  });
});
