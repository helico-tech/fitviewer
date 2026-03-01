import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRunStore } from "@/store/useRunStore";
import { rollingAverage } from "@/lib/smoothing";

const DEFAULT_SMOOTHING_WINDOW = 10;
const METERS_PER_FOOT = 3.28084;

interface ChartDataPoint {
  distanceKm: number;
  distanceMi: number;
  altitude: number; // smoothed, in display unit (m or ft)
  rawAltitude: number; // in display unit
}

export function ElevationChart() {
  const records = useRunStore((s) => s.runData?.records);
  const unitSystem = useRunStore((s) => s.unitSystem);

  const data = useMemo<ChartDataPoint[]>(() => {
    if (!records || records.length === 0) return [];

    const rawAltitudes = records.map((r) => r.altitude);
    const smoothed = rollingAverage(rawAltitudes, DEFAULT_SMOOTHING_WINDOW);

    const isImperial = unitSystem === "imperial";

    return records.map((r, i) => ({
      distanceKm: r.distance / 1000,
      distanceMi: r.distance / 1000 / 1.60934,
      altitude: isImperial ? smoothed[i] * METERS_PER_FOOT : smoothed[i],
      rawAltitude: isImperial ? r.altitude * METERS_PER_FOOT : r.altitude,
    }));
  }, [records, unitSystem]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No elevation data available
      </div>
    );
  }

  const isMetric = unitSystem === "metric";
  const distanceKey = isMetric ? "distanceKm" : "distanceMi";
  const distanceLabel = isMetric ? "Distance (km)" : "Distance (mi)";
  const elevationUnit = isMetric ? "m" : "ft";

  // Compute Y-axis domain from valid altitude values
  const validAlts = data
    .map((d) => d.altitude)
    .filter((v) => isFinite(v));
  const minAlt = Math.floor(Math.min(...validAlts) / 10) * 10;
  const maxAlt = Math.ceil(Math.max(...validAlts) / 10) * 10;

  return (
    <div data-testid="elevation-chart" className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey={distanceKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: distanceLabel, position: "bottom", offset: 5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[minAlt, maxAlt]}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            label={{
              value: `Elevation (${elevationUnit})`,
              angle: -90,
              position: "insideLeft",
              offset: 5,
              style: { textAnchor: "middle" },
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as ChartDataPoint;
              const dist = isMetric ? d.distanceKm : d.distanceMi;
              return (
                <div className="bg-popover border border-border rounded-md px-3 py-2 text-sm shadow-md">
                  <p className="text-muted-foreground">
                    {dist.toFixed(2)} {isMetric ? "km" : "mi"}
                  </p>
                  <p className="font-medium">
                    {Math.round(d.altitude)} {elevationUnit}
                  </p>
                </div>
              );
            }}
          />
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="altitude"
            stroke="hsl(142, 60%, 45%)"
            strokeWidth={1.5}
            fill="url(#elevationGradient)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
