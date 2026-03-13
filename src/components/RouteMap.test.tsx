import { test, expect, describe } from "bun:test";
import type { ActivityRecord } from "../types/activity";
import { recordsToCoords, computeBounds } from "./RouteMap";

function makeRecord(
  lat: number | null,
  lng: number | null,
  overrides?: Partial<ActivityRecord>
): ActivityRecord {
  return {
    timestamp: new Date("2024-01-01T00:00:00Z"),
    heartRate: 150,
    cadence: 170,
    speed: 3.5,
    altitude: 100,
    distance: 1000,
    positionLat: lat,
    positionLong: lng,
    ...overrides,
  };
}

describe("recordsToCoords", () => {
  test("records with all GPS fields present returns [lng, lat] tuples", () => {
    const records = [makeRecord(40.0, -74.0), makeRecord(40.1, -74.1)];
    const coords = recordsToCoords(records);
    expect(coords).toHaveLength(2);
    expect(coords[0]).toEqual([-74.0, 40.0]);
    expect(coords[1]).toEqual([-74.1, 40.1]);
  });

  test("records with null positionLat are excluded", () => {
    const records = [makeRecord(null, -74.0), makeRecord(40.1, -74.1)];
    const coords = recordsToCoords(records);
    expect(coords).toHaveLength(1);
    expect(coords[0]).toEqual([-74.1, 40.1]);
  });

  test("records with null positionLong are excluded", () => {
    const records = [makeRecord(40.0, null), makeRecord(40.1, -74.1)];
    const coords = recordsToCoords(records);
    expect(coords).toHaveLength(1);
    expect(coords[0]).toEqual([-74.1, 40.1]);
  });

  test("empty records array returns empty array", () => {
    const coords = recordsToCoords([]);
    expect(coords).toEqual([]);
  });

  test("coordinate order is [positionLong, positionLat]", () => {
    const records = [makeRecord(51.5074, -0.1278)]; // London: lat 51.5074, lng -0.1278
    const coords = recordsToCoords(records);
    expect(coords[0]![0]).toBe(-0.1278); // first element is longitude
    expect(coords[0]![1]).toBe(51.5074); // second element is latitude
  });
});

describe("computeBounds", () => {
  test("two coordinates computes correct min/max for lng and lat", () => {
    const coords: [number, number][] = [
      [10, 20],
      [30, 40],
    ];
    const bounds = computeBounds(coords);
    expect(bounds).toEqual({
      minLng: 10,
      minLat: 20,
      maxLng: 30,
      maxLat: 40,
    });
  });

  test("single coordinate returns that point as both min and max", () => {
    const coords: [number, number][] = [[15, 25]];
    const bounds = computeBounds(coords);
    expect(bounds).toEqual({
      minLng: 15,
      minLat: 25,
      maxLng: 15,
      maxLat: 25,
    });
  });

  test("handles negative coordinates correctly", () => {
    const coords: [number, number][] = [
      [-74.0, 40.0],
      [-73.5, 40.5],
    ];
    const bounds = computeBounds(coords);
    expect(bounds).toEqual({
      minLng: -74.0,
      minLat: 40.0,
      maxLng: -73.5,
      maxLat: 40.5,
    });
  });
});

describe("RouteMap render guard", () => {
  test("fewer than 2 valid GPS coordinates means nothing to render", () => {
    const singleRecord = [makeRecord(40.0, -74.0)];
    const coords = recordsToCoords(singleRecord);
    expect(coords.length).toBeLessThan(2);
  });

  test("no valid GPS records means nothing to render", () => {
    const noGps = [makeRecord(null, null), makeRecord(null, null)];
    const coords = recordsToCoords(noGps);
    expect(coords.length).toBeLessThan(2);
  });
});
