import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRunStore } from "@/store/useRunStore";
import { rollingAverage } from "@/lib/smoothing";
import { convertPace } from "@/lib/units";

interface ChartDataPoint {
  distanceKm: number;
  distanceMi: number;
  elapsedMin: number;
  pace: number; // sec per unit (km or mi), after smoothing
  rawPace: number; // for tooltip
}

export function PaceChart() {
  const records = useRunStore((s) => s.runData?.records);
  const startTime = useRunStore((s) => s.runData?.summary.startTime);
  const unitSystem = useRunStore((s) => s.unitSystem);
  const chartXAxis = useRunStore((s) => s.chartXAxis);
  const smoothingWindow = useRunStore((s) => s.smoothingWindow);

  const data = useMemo<ChartDataPoint[]>(() => {
    if (!records || records.length === 0) return [];

    const rawPaces = records.map((r) => r.pace);
    const smoothed = rollingAverage(rawPaces, smoothingWindow);

    const start = startTime ? startTime.getTime() : records[0].timestamp.getTime();

    return records.map((r, i) => ({
      distanceKm: r.distance / 1000,
      distanceMi: r.distance / 1000 / 1.60934,
      elapsedMin: (r.timestamp.getTime() - start) / 60000,
      pace: convertPace(smoothed[i], unitSystem),
      rawPace: convertPace(r.pace, unitSystem),
    }));
  }, [records, unitSystem, smoothingWindow, startTime]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No pace data available
      </div>
    );
  }

  const isMetric = unitSystem === "metric";
  const isTime = chartXAxis === "time";
  const xKey = isTime ? "elapsedMin" : isMetric ? "distanceKm" : "distanceMi";
  const xLabel = isTime
    ? "Time (min)"
    : isMetric
      ? "Distance (km)"
      : "Distance (mi)";
  const paceLabel = isMetric ? "Pace (min/km)" : "Pace (min/mi)";

  // Compute Y-axis domain from valid smoothed values
  const validPaces = data
    .map((d) => d.pace)
    .filter((v) => v > 0 && isFinite(v));
  const minPace = Math.floor(Math.min(...validPaces) / 60) * 60; // round down to nearest minute
  const maxPace = Math.ceil(Math.max(...validPaces) / 60) * 60; // round up to nearest minute

  return (
    <div data-testid="pace-chart" className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey={xKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => isTime ? Math.round(v).toString() : v.toFixed(1)}
            label={{ value: xLabel, position: "bottom", offset: 5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            reversed
            domain={[minPace, maxPace]}
            tickFormatter={formatPaceTick}
            label={{
              value: paceLabel,
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
                    {isTime
                      ? `${Math.round(d.elapsedMin)} min`
                      : `${dist.toFixed(2)} ${isMetric ? "km" : "mi"}`}
                  </p>
                  <p className="font-medium">
                    {formatPaceTick(d.pace)} {isMetric ? "/km" : "/mi"}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatPaceTick(secPerUnit: number): string {
  if (!secPerUnit || !isFinite(secPerUnit)) return "";
  const m = Math.floor(secPerUnit / 60);
  const s = Math.floor(secPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
