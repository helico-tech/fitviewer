import React from "react";
import type { SummaryStats } from "../types/activity";
import "./StatsPanel.css";

/** Format distance in meters to km with 2 decimal places. */
export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/** Format duration in seconds to h:mm:ss or m:ss. */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Format speed in m/s to pace string M:SS min/km. Returns "--" for null or very slow. */
export function formatPace(speedMs: number | null): string {
  if (speedMs === null || speedMs <= 0.2) return "--";
  const paceMinPerKm = 1000 / speedMs / 60;
  const minutes = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - minutes) * 60);
  // Handle edge case where rounding gives 60 seconds
  if (secs === 60) {
    return `${minutes + 1}:00`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/** Format a nullable number. Returns "--" for null. */
export function formatNullable(value: number | null, decimals?: number): string {
  if (value === null) return "--";
  return value.toFixed(decimals ?? 0);
}

type StatCardProps = {
  label: string;
  value: string;
  unit: string;
};

function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div className="stats-panel__card">
      <div className="stats-panel__label">{label}</div>
      <div className="stats-panel__value-row">
        <span className="stats-panel__value">{value}</span>
        <span className="stats-panel__unit">{unit}</span>
      </div>
    </div>
  );
}

export function StatsPanel({ summary }: { summary: SummaryStats }) {
  return (
    <div className="stats-panel">
      <StatCard
        label="Distance"
        value={formatDistance(summary.totalDistance)}
        unit="km"
      />
      <StatCard
        label="Duration"
        value={formatDuration(summary.totalDuration)}
        unit=""
      />
      <StatCard
        label="Avg Pace"
        value={formatPace(summary.avgSpeed)}
        unit="min/km"
      />
      <StatCard
        label="Max Pace"
        value={formatPace(summary.maxSpeed)}
        unit="min/km"
      />
      <StatCard
        label="Avg HR"
        value={formatNullable(summary.avgHeartRate)}
        unit="bpm"
      />
      <StatCard
        label="Max HR"
        value={formatNullable(summary.maxHeartRate)}
        unit="bpm"
      />
      <StatCard
        label="Cadence"
        value={formatNullable(summary.avgCadence)}
        unit="spm"
      />
      <StatCard
        label="Elevation Gain"
        value={formatNullable(summary.totalAscent)}
        unit="m"
      />
    </div>
  );
}
