import { useActivityStore } from "../store/activity-store.ts";
import { detectChannels } from "../lib/data-presence.ts";
import { StatsPanel } from "./StatsPanel.tsx";
import { PaceChart } from "./charts/PaceChart.tsx";
import { HeartRateChart } from "./charts/HeartRateChart.tsx";
import { ElevationChart } from "./charts/ElevationChart.tsx";
import { CadenceChart } from "./charts/CadenceChart.tsx";
import { RouteMap } from "./RouteMap.tsx";
import { LapTable } from "./LapTable.tsx";
import "./Dashboard.css";

export function Dashboard() {
  const activity = useActivityStore((s) => s.activity);

  if (activity === null) {
    return null;
  }

  const channels = detectChannels(activity.records);
  const startTime = activity.records[0]?.timestamp.getTime() ?? 0;

  const hasBottom = channels.hasGps || activity.laps.length > 0;

  return (
    <div className="dashboard">
      <StatsPanel summary={activity.summary} />

      <div className="dashboard__charts">
        <PaceChart records={activity.records} startTime={startTime} />
        {channels.hasHeartRate && (
          <HeartRateChart records={activity.records} startTime={startTime} />
        )}
        {channels.hasAltitude && (
          <ElevationChart records={activity.records} startTime={startTime} />
        )}
        {channels.hasCadence && (
          <CadenceChart records={activity.records} startTime={startTime} />
        )}
      </div>

      {hasBottom && (
        <div className="dashboard__bottom">
          {channels.hasGps && (
            <div className="dashboard__map-slot">
              <RouteMap records={activity.records} />
            </div>
          )}
          {activity.laps.length > 0 && (
            <div className="dashboard__table-slot">
              <LapTable laps={activity.laps} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
