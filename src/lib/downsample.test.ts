import { test, expect, describe } from "bun:test";
import { downsampleTimeSeries } from "./downsample.ts";

describe("downsampleTimeSeries", () => {
  test("returns original data when length <= targetPoints", () => {
    const data = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
    ];
    const result = downsampleTimeSeries(data, 5);
    expect(result).toEqual(data);
    expect(result).toBe(data); // same reference
  });

  test("returns original data when length equals targetPoints", () => {
    const data = [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
    ];
    const result = downsampleTimeSeries(data, 3);
    expect(result).toEqual(data);
  });

  test("returns exactly targetPoints entries when data exceeds target", () => {
    // Create 100 data points
    const data = Array.from({ length: 100 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 10) * 100,
    }));
    const targetPoints = 20;
    const result = downsampleTimeSeries(data, targetPoints);
    expect(result.length).toBe(targetPoints);
  });

  test("preserves the first data point", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 10) * 100,
    }));
    const result = downsampleTimeSeries(data, 20);
    expect(result[0]).toEqual(data[0]);
  });

  test("preserves the last data point", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 10) * 100,
    }));
    const result = downsampleTimeSeries(data, 20);
    expect(result[result.length - 1]).toEqual(data[data.length - 1]);
  });

  test("returns empty array for empty input", () => {
    const result = downsampleTimeSeries([], 10);
    expect(result).toEqual([]);
  });

  test("returns single element for single element input", () => {
    const data = [{ x: 0, y: 42 }];
    const result = downsampleTimeSeries(data, 10);
    expect(result).toEqual(data);
  });
});
