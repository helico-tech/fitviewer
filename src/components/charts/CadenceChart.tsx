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

interface ChartDataPoint {
  distanceKm: number;
  distanceMi: number;
  elapsedMin: number;
  cadence: number; // smoothed spm
  rawCadence: number;
}

export function CadenceChart() {
  const records = useRunStore((s) => s.runData?.records);
  const startTime = useRunStore((s) => s.runData?.summary.startTime);
  const unitSystem = useRunStore((s) => s.unitSystem);
  const chartXAxis = useRunStore((s) => s.chartXAxis);
  const smoothingWindow = useRunStore((s) => s.smoothingWindow);

  const data = useMemo<ChartDataPoint[]>(() => {
    if (!records || records.length === 0) return [];

    const rawCadences = records.map((r) => r.cadence);
    const smoothed = rollingAverage(rawCadences, smoothingWindow);

    const start = startTime ? startTime.getTime() : records[0].timestamp.getTime();

    return records.map((r, i) => ({
      distanceKm: r.distance / 1000,
      distanceMi: r.distance / 1000 / 1.60934,
      elapsedMin: (r.timestamp.getTime() - start) / 60000,
      cadence: smoothed[i],
      rawCadence: r.cadence,
    }));
  }, [records, unitSystem, smoothingWindow, startTime]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No cadence data available
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

  // Compute Y-axis domain from valid cadence values
  const validCadences = data
    .map((d) => d.cadence)
    .filter((v) => v > 0 && isFinite(v));
  const minCad = Math.floor(Math.min(...validCadences) / 10) * 10;
  const maxCad = Math.ceil(Math.max(...validCadences) / 10) * 10;

  return (
    <div data-testid="cadence-chart" className="w-full h-72 sm:h-80">
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
            domain={[minCad, maxCad]}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            label={{
              value: "Cadence (spm)",
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
                    {Math.round(d.cadence)} spm
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="cadence"
            stroke="hsl(280, 60%, 55%)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
