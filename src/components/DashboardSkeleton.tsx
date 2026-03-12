import { useActivityStore } from "../store/activity-store.ts";
import type { SummaryStats } from "../types/activity.ts";
import "./DashboardSkeleton.css";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(avgSpeedMs: number | null): string {
  if (avgSpeedMs === null || avgSpeedMs <= 0) return "--";
  const paceSecondsPerKm = 1000 / avgSpeedMs;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

function formatNullable(value: number | null, decimals = 0): string {
  if (value === null) return "--";
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  ghost?: boolean;
};

function StatCard({ label, value, unit, ghost }: StatCardProps) {
  return (
    <div className={`stat-card ${ghost ? "stat-card--ghost" : ""}`}>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">
        {value}
        {unit && <span className="stat-card__unit"> {unit}</span>}
      </span>
    </div>
  );
}

function StatsRow({ summary }: { summary: SummaryStats }) {
  return (
    <div className="dashboard-skeleton__stats-row">
      <StatCard
        label="Distance"
        value={formatDistance(summary.totalDistance)}
        unit="km"
      />
      <StatCard
        label="Duration"
        value={formatDuration(summary.totalTimerTime)}
      />
      <StatCard
        label="Avg Pace"
        value={formatPace(summary.avgSpeed)}
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
        label="Elevation"
        value={formatNullable(summary.totalAscent)}
        unit="m"
      />
    </div>
  );
}

function GhostStatsRow() {
  return (
    <div className="dashboard-skeleton__stats-row">
      <StatCard label="Distance" value="--" unit="km" ghost />
      <StatCard label="Duration" value="--:--" ghost />
      <StatCard label="Avg Pace" value="--" unit="min/km" ghost />
      <StatCard label="Avg HR" value="--" unit="bpm" ghost />
      <StatCard label="Max HR" value="--" unit="bpm" ghost />
      <StatCard label="Cadence" value="--" unit="spm" ghost />
      <StatCard label="Elevation" value="--" unit="m" ghost />
    </div>
  );
}

export function DashboardSkeleton() {
  const status = useActivityStore((s) => s.status);
  const summary = useActivityStore((s) => s.summary);

  const showReal = status === "loaded" && summary !== null;

  return (
    <div className="dashboard-skeleton">
      {showReal ? <StatsRow summary={summary} /> : <GhostStatsRow />}

      <div className="dashboard-skeleton__charts">
        <div className="dashboard-skeleton__placeholder dashboard-skeleton__placeholder--wide">
          <span className="dashboard-skeleton__placeholder-label">
            Pace Chart
          </span>
        </div>
        <div className="dashboard-skeleton__placeholder dashboard-skeleton__placeholder--wide">
          <span className="dashboard-skeleton__placeholder-label">
            Heart Rate Chart
          </span>
        </div>
        <div className="dashboard-skeleton__placeholder dashboard-skeleton__placeholder--half">
          <span className="dashboard-skeleton__placeholder-label">
            Elevation Profile
          </span>
        </div>
        <div className="dashboard-skeleton__placeholder dashboard-skeleton__placeholder--half">
          <span className="dashboard-skeleton__placeholder-label">
            Cadence Chart
          </span>
        </div>
      </div>

      <div className="dashboard-skeleton__bottom">
        <div className="dashboard-skeleton__placeholder dashboard-skeleton__placeholder--map">
          <span className="dashboard-skeleton__placeholder-label">
            Route Map
          </span>
        </div>
        <div className="dashboard-skeleton__placeholder dashboard-skeleton__placeholder--table">
          <span className="dashboard-skeleton__placeholder-label">
            Lap Splits
          </span>
        </div>
      </div>
    </div>
  );
}
