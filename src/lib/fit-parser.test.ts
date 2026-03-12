import { test, expect, describe, beforeAll } from "bun:test";
import { parseFitFile } from "./fit-parser.ts";

// Load test fixtures once
let runningBuffer: ArrayBuffer;
let cyclingBuffer: ArrayBuffer;
let garbageBuffer: ArrayBuffer;

beforeAll(async () => {
  runningBuffer = await Bun.file("tests/fixtures/running.fit").arrayBuffer();
  cyclingBuffer = await Bun.file("tests/fixtures/cycling.fit").arrayBuffer();
  garbageBuffer = await Bun.file("tests/fixtures/garbage.bin").arrayBuffer();
});

describe("parseFitFile", () => {
  describe("valid running FIT file", () => {
    test("returns a NormalizedActivity with non-empty records", () => {
      const activity = parseFitFile(runningBuffer);
      expect(activity.records).toBeArray();
      expect(activity.records.length).toBeGreaterThan(0);
    });

    test("returns populated summary stats", () => {
      const activity = parseFitFile(runningBuffer);
      expect(activity.summary.totalDistance).toBeGreaterThan(0);
      expect(activity.summary.totalDuration).toBeGreaterThan(0);
      expect(activity.summary.totalTimerTime).toBeGreaterThan(0);
    });

    test("returns metadata with sport as running", () => {
      const activity = parseFitFile(runningBuffer);
      expect(activity.metadata.sport).toBe("running");
    });

    test("returns metadata with device as non-empty string", () => {
      const activity = parseFitFile(runningBuffer);
      expect(activity.metadata.device).toBeString();
      expect(activity.metadata.device.length).toBeGreaterThan(0);
    });

    test("returns metadata with date as Date", () => {
      const activity = parseFitFile(runningBuffer);
      expect(activity.metadata.date).toBeInstanceOf(Date);
    });

    test("returns laps array", () => {
      const activity = parseFitFile(runningBuffer);
      expect(activity.laps).toBeArray();
      expect(activity.laps.length).toBeGreaterThan(0);
    });
  });

  describe("coordinate conversion", () => {
    test("returns positionLat/positionLong as decimal degrees", () => {
      const activity = parseFitFile(runningBuffer);
      const record = activity.records[0]!;

      // Should be decimal degrees, not raw semicircles
      expect(record.positionLat).not.toBeNull();
      expect(record.positionLong).not.toBeNull();

      // Decimal degrees should be between -180 and 180
      expect(record.positionLat!).toBeGreaterThan(-180);
      expect(record.positionLat!).toBeLessThan(180);
      expect(record.positionLong!).toBeGreaterThan(-180);
      expect(record.positionLong!).toBeLessThan(180);

      // Should NOT be raw semicircles (which would be > 1 million)
      expect(Math.abs(record.positionLat!)).toBeLessThan(180);
      expect(Math.abs(record.positionLong!)).toBeLessThan(180);
    });
  });

  describe("cadence doubling", () => {
    test("returns records with cadence doubled (steps per minute)", () => {
      const activity = parseFitFile(runningBuffer);
      const record = activity.records[0]!;

      // Fixture has cadence=85 half-cycles, should be doubled to 170 SPM
      expect(record.cadence).not.toBeNull();
      expect(record.cadence!).toBe(170);
    });
  });

  describe("error handling", () => {
    test("throws on non-FIT garbage data", () => {
      expect(() => parseFitFile(garbageBuffer)).toThrow("Not a valid FIT file");
    });

    test("throws SPORT_MISMATCH on cycling FIT file", () => {
      expect(() => parseFitFile(cyclingBuffer)).toThrow("SPORT_MISMATCH:cycling");
    });
  });

  describe("record structure", () => {
    test("records have all required fields", () => {
      const activity = parseFitFile(runningBuffer);
      const record = activity.records[0]!;

      expect(record).toHaveProperty("timestamp");
      expect(record).toHaveProperty("heartRate");
      expect(record).toHaveProperty("cadence");
      expect(record).toHaveProperty("speed");
      expect(record).toHaveProperty("altitude");
      expect(record).toHaveProperty("distance");
      expect(record).toHaveProperty("positionLat");
      expect(record).toHaveProperty("positionLong");
    });

    test("record timestamp is a Date", () => {
      const activity = parseFitFile(runningBuffer);
      const record = activity.records[0]!;
      expect(record.timestamp).toBeInstanceOf(Date);
    });
  });
});
