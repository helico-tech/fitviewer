import { test, expect, describe } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { LapTable } from "./LapTable";
import type { LapRecord } from "../types/activity";

const lapsFixture: LapRecord[] = [
  {
    startTime: new Date("2024-01-01T00:00:00Z"),
    totalDistance: 1000,
    totalTimerTime: 300,
    avgSpeed: 3.33,
    avgHeartRate: 155,
    avgCadence: 170,
    maxHeartRate: 165,
    maxSpeed: 4.0,
  },
  {
    startTime: new Date("2024-01-01T00:05:00Z"),
    totalDistance: 1000,
    totalTimerTime: 310,
    avgSpeed: 3.23,
    avgHeartRate: 160,
    avgCadence: 168,
    maxHeartRate: 172,
    maxSpeed: 3.8,
  },
  {
    startTime: new Date("2024-01-01T00:10:00Z"),
    totalDistance: 1000,
    totalTimerTime: 290,
    avgSpeed: null,
    avgHeartRate: null,
    avgCadence: null,
    maxHeartRate: null,
    maxSpeed: null,
  },
];

describe("LapTable", () => {
  test("renders correct number of rows", () => {
    const html = renderToString(<LapTable laps={lapsFixture} />);
    // Count data rows by matching lap-table__row class
    const rowMatches = html.match(/lap-table__row/g);
    expect(rowMatches).not.toBeNull();
    expect(rowMatches!.length).toBe(3);
  });

  test("formats distance as km", () => {
    const html = renderToString(<LapTable laps={lapsFixture} />);
    // 1000m = 1.00 km
    expect(html).toContain("1.00");
  });

  test("formats duration as M:SS", () => {
    const html = renderToString(<LapTable laps={lapsFixture} />);
    // 300s = 5:00
    expect(html).toContain("5:00");
  });

  test("formats pace from speed", () => {
    const html = renderToString(<LapTable laps={lapsFixture} />);
    // 3.33 m/s => ~5:00 min/km
    expect(html).toContain("5:00");
  });

  test("shows -- for null HR and cadence", () => {
    const html = renderToString(<LapTable laps={lapsFixture} />);
    // Lap 3 has null avgHeartRate and avgCadence
    expect(html).toContain("--");
  });

  test("shows -- for null pace", () => {
    // Render only the null-speed lap to isolate
    const nullLap: LapRecord[] = [lapsFixture[2]!];
    const html = renderToString(<LapTable laps={nullLap} />);
    expect(html).toContain("--");
  });

  test("renders empty table for no laps", () => {
    const html = renderToString(<LapTable laps={[]} />);
    // Should have table header
    expect(html).toContain("Split");
    expect(html).toContain("Distance");
    expect(html).toContain("Time");
    // Should have no data rows
    const rowMatches = html.match(/lap-table__row/g);
    expect(rowMatches).toBeNull();
  });

  test("does not show literal null or undefined text", () => {
    const html = renderToString(<LapTable laps={lapsFixture} />);
    expect(html).not.toContain(">null<");
    expect(html).not.toContain(">undefined<");
  });
});
