import "./DashboardSkeleton.css";

function GhostStatCard({ label }: { label: string }) {
  return (
    <div className="stat-card stat-card--ghost">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">--</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton__stats-row">
        <GhostStatCard label="Distance" />
        <GhostStatCard label="Duration" />
        <GhostStatCard label="Avg Pace" />
        <GhostStatCard label="Max Pace" />
        <GhostStatCard label="Avg HR" />
        <GhostStatCard label="Max HR" />
        <GhostStatCard label="Cadence" />
        <GhostStatCard label="Elevation" />
      </div>

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
