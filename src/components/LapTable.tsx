import React from "react";
import type { LapRecord } from "../types/activity";
import "./LapTable.css";

/** Format distance in meters to km with 2 decimal places. */
function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

/** Format duration in seconds to M:SS. */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Format speed in m/s to pace string M:SS min/km. Returns "--" for null or zero. */
function formatPace(speedMs: number | null): string {
  if (speedMs === null || speedMs <= 0) return "--";
  const paceMinPerKm = 1000 / speedMs / 60;
  const minutes = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - minutes) * 60);
  if (secs === 60) {
    return `${minutes + 1}:00`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/** Format a nullable number. Returns "--" for null. */
function formatNullable(value: number | null): string {
  if (value === null) return "--";
  return String(Math.round(value));
}

export function LapTable({ laps }: { laps: LapRecord[] }) {
  return (
    <div className="lap-table">
      <table className="lap-table__table">
        <thead>
          <tr className="lap-table__header">
            <th>Split</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
            <th>Avg HR</th>
            <th>Cadence</th>
          </tr>
        </thead>
        <tbody>
          {laps.map((lap, i) => (
            <tr key={i} className="lap-table__row">
              <td className="lap-table__cell">{i + 1}</td>
              <td className="lap-table__cell">{formatDistance(lap.totalDistance)}</td>
              <td className="lap-table__cell">{formatDuration(lap.totalTimerTime)}</td>
              <td className="lap-table__cell lap-table__cell--pace">{formatPace(lap.avgSpeed)}</td>
              <td className="lap-table__cell">{formatNullable(lap.avgHeartRate)}</td>
              <td className="lap-table__cell">{formatNullable(lap.avgCadence)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
