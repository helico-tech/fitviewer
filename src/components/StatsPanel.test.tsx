import { test, expect, describe } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { StatsPanel } from "./StatsPanel";
import type { SummaryStats } from "../types/activity";

const fullFixture: SummaryStats = {
  totalDistance: 10000,
  totalDuration: 3600,
  totalTimerTime: 3500,
  avgSpeed: 3.33,
  maxSpeed: 4.0,
  avgHeartRate: 155,
  maxHeartRate: 180,
  avgCadence: 170,
  totalAscent: 250,
  totalDescent: 230,
};

const partialFixture: SummaryStats = {
  ...fullFixture,
  avgHeartRate: null,
  maxHeartRate: null,
  avgCadence: null,
  totalAscent: null,
};

describe("StatsPanel", () => {
  test("renders all stat cards", () => {
    const html = renderToString(<StatsPanel summary={fullFixture} />);
    // Should contain all 8 stat labels
    expect(html).toContain("Distance");
    expect(html).toContain("Duration");
    expect(html).toContain("Avg Pace");
    expect(html).toContain("Max Pace");
    expect(html).toContain("Avg HR");
    expect(html).toContain("Max HR");
    expect(html).toContain("Cadence");
    expect(html).toContain("Elevation");
  });

  test("formats distance from meters to km", () => {
    const html = renderToString(<StatsPanel summary={fullFixture} />);
    expect(html).toContain("10.00");
  });

  test("formats duration correctly for >= 1 hour", () => {
    const html = renderToString(<StatsPanel summary={fullFixture} />);
    expect(html).toContain("1:00:00");
  });

  test("formats duration correctly for < 1 hour", () => {
    const shortFixture: SummaryStats = { ...fullFixture, totalDuration: 300 };
    const html = renderToString(<StatsPanel summary={shortFixture} />);
    expect(html).toContain("5:00");
  });

  test("formats pace from speed", () => {
    const html = renderToString(<StatsPanel summary={fullFixture} />);
    // 3.33 m/s = ~5:00 min/km
    expect(html).toContain("5:00");
  });

  test("shows -- for null values", () => {
    const html = renderToString(<StatsPanel summary={partialFixture} />);
    expect(html).toContain("--");
  });

  test("does not show literal null or undefined text", () => {
    const html = renderToString(<StatsPanel summary={partialFixture} />);
    expect(html).not.toContain(">null<");
    expect(html).not.toContain(">undefined<");
  });

  test("full fixture renders all values with correct formatting", () => {
    const html = renderToString(<StatsPanel summary={fullFixture} />);
    expect(html).toContain("10.00"); // distance km
    expect(html).toContain("155"); // avg HR
    expect(html).toContain("180"); // max HR
    expect(html).toContain("170"); // cadence
    expect(html).toContain("250"); // elevation
  });
});
