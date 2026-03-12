import { test, expect, describe } from "bun:test";
import { semicirclesToDegrees, computeSummaryStats } from "./normalize.ts";

describe("semicirclesToDegrees", () => {
  test("converts positive semicircles to degrees", () => {
    // 519828467 semicircles ~ 43.6 degrees (Toronto area latitude)
    const result = semicirclesToDegrees(519828467);
    expect(result).toBeCloseTo(43.6, 0);
    expect(Math.abs(result - 43.6)).toBeLessThan(0.1);
  });

  test("converts zero semicircles to zero degrees", () => {
    expect(semicirclesToDegrees(0)).toBe(0);
  });

  test("converts negative semicircles to negative degrees", () => {
    const result = semicirclesToDegrees(-519828467);
    expect(result).toBeCloseTo(-43.6, 0);
    expect(Math.abs(result + 43.6)).toBeLessThan(0.1);
  });

  test("uses correct conversion factor (180 / 2^31)", () => {
    // Maximum semicircle value (2^31 - 1) should be very close to 180
    const maxSemicircles = 2 ** 31 - 1;
    const result = semicirclesToDegrees(maxSemicircles);
    expect(result).toBeCloseTo(180, 0);
  });

  test("result is in valid coordinate range (-180 to 180)", () => {
    const positive = semicirclesToDegrees(519828467);
    const negative = semicirclesToDegrees(-844425437);
    expect(positive).toBeGreaterThan(-180);
    expect(positive).toBeLessThan(180);
    expect(negative).toBeGreaterThan(-180);
    expect(negative).toBeLessThan(180);
  });
});

describe("computeSummaryStats", () => {
  test("computes stats from session data", () => {
    const session = {
      totalDistance: 5000,
      totalElapsedTime: 1800,
      totalTimerTime: 1750,
      enhancedAvgSpeed: 2.78,
      enhancedMaxSpeed: 3.5,
      avgHeartRate: 155,
      maxHeartRate: 175,
      avgRunningCadence: 170,
      totalAscent: 50,
      totalDescent: 30,
    };

    const result = computeSummaryStats(session);

    expect(result.totalDistance).toBe(5000);
    expect(result.totalDuration).toBe(1800);
    expect(result.totalTimerTime).toBe(1750);
    expect(result.avgSpeed).toBe(2.78);
    expect(result.maxSpeed).toBe(3.5);
    expect(result.avgHeartRate).toBe(155);
    expect(result.maxHeartRate).toBe(175);
    expect(result.avgCadence).toBe(170);
    expect(result.totalAscent).toBe(50);
    expect(result.totalDescent).toBe(30);
  });

  test("falls back to non-enhanced speed fields", () => {
    const session = {
      totalDistance: 3000,
      totalElapsedTime: 1200,
      totalTimerTime: 1100,
      avgSpeed: 2.5,
      maxSpeed: 3.0,
      avgHeartRate: 140,
      maxHeartRate: 160,
      avgCadence: 80, // half-cycles, should be doubled
      totalAscent: 20,
      totalDescent: 10,
    };

    const result = computeSummaryStats(session);

    expect(result.avgSpeed).toBe(2.5);
    expect(result.maxSpeed).toBe(3.0);
    // avgCadence should be doubled when avgRunningCadence not available
    expect(result.avgCadence).toBe(160);
  });

  test("handles missing optional fields with null", () => {
    const session = {
      totalDistance: 1000,
      totalElapsedTime: 600,
      totalTimerTime: 580,
    };

    const result = computeSummaryStats(session);

    expect(result.totalDistance).toBe(1000);
    expect(result.totalDuration).toBe(600);
    expect(result.totalTimerTime).toBe(580);
    expect(result.avgSpeed).toBeNull();
    expect(result.maxSpeed).toBeNull();
    expect(result.avgHeartRate).toBeNull();
    expect(result.maxHeartRate).toBeNull();
    expect(result.avgCadence).toBeNull();
    expect(result.totalAscent).toBeNull();
    expect(result.totalDescent).toBeNull();
  });
});
