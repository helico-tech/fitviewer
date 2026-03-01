import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { useRunStore } from "@/store/useRunStore";
import { rollingAverage } from "@/lib/smoothing";
import { useChartHover } from "@/lib/chart-hover";

/** Default 5-zone model based on percentage of max HR */
const HR_ZONES = [
  { name: "Zone 1", pctMin: 0.5, pctMax: 0.6, color: "rgba(96, 165, 250, 0.15)" },  // blue - recovery
  { name: "Zone 2", pctMin: 0.6, pctMax: 0.7, color: "rgba(74, 222, 128, 0.15)" },   // green - easy
  { name: "Zone 3", pctMin: 0.7, pctMax: 0.8, color: "rgba(250, 204, 21, 0.15)" },   // yellow - tempo
  { name: "Zone 4", pctMin: 0.8, pctMax: 0.9, color: "rgba(251, 146, 60, 0.15)" },   // orange - threshold
  { name: "Zone 5", pctMin: 0.9, pctMax: 1.0, color: "rgba(248, 113, 113, 0.15)" },  // red - VO2max
];

interface ChartDataPoint {
  distanceKm: number;
  distanceMi: number;
  elapsedMin: number;
  heartRate: number; // smoothed
  rawHeartRate: number;
}

export function HeartRateChart() {
  const records = useRunStore((s) => s.runData?.records);
  const maxHeartRate = useRunStore((s) => s.runData?.summary.maxHeartRate);
  const startTime = useRunStore((s) => s.runData?.summary.startTime);
  const unitSystem = useRunStore((s) => s.unitSystem);
  const chartXAxis = useRunStore((s) => s.chartXAxis);
  const smoothingWindow = useRunStore((s) => s.smoothingWindow);

  const data = useMemo<ChartDataPoint[]>(() => {
    if (!records || records.length === 0) return [];

    const rawHRs = records.map((r) => r.heartRate);
    const smoothed = rollingAverage(rawHRs, smoothingWindow);

    const start = startTime ? startTime.getTime() : records[0].timestamp.getTime();

    return records.map((r, i) => ({
      distanceKm: r.distance / 1000,
      distanceMi: r.distance / 1000 / 1.60934,
      elapsedMin: (r.timestamp.getTime() - start) / 60000,
      heartRate: smoothed[i],
      rawHeartRate: r.heartRate,
    }));
  }, [records, unitSystem, smoothingWindow, startTime]);

  const isMetric = unitSystem === "metric";
  const isTime = chartXAxis === "time";
  const xKey = isTime ? "elapsedMin" : isMetric ? "distanceKm" : "distanceMi";

  const { hoveredX, onMouseMove, onMouseLeave } = useChartHover(data, xKey);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No heart rate data available
      </div>
    );
  }

  const xLabel = isTime
    ? "Time (min)"
    : isMetric
      ? "Distance (km)"
      : "Distance (mi)";

  // Compute Y-axis domain from valid HR values
  const validHRs = data
    .map((d) => d.heartRate)
    .filter((v) => v > 0 && isFinite(v));
  const minHR = Math.floor(Math.min(...validHRs) / 10) * 10; // round down to nearest 10
  const maxHR = Math.ceil(Math.max(...validHRs) / 10) * 10; // round up to nearest 10

  // Use max HR from data for zone bands (if maxHeartRate from summary is available, use that)
  const effectiveMaxHR = maxHeartRate && maxHeartRate > 0 ? maxHeartRate : maxHR;

  return (
    <div data-testid="heart-rate-chart" className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 20, left: 10 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />

          {/* HR zone background bands */}
          {effectiveMaxHR > 0 &&
            HR_ZONES.map((zone) => {
              const y1 = Math.round(effectiveMaxHR * zone.pctMin);
              const y2 = Math.round(effectiveMaxHR * zone.pctMax);
              // Only render bands that overlap with the visible Y-axis range
              if (y2 < minHR || y1 > maxHR) return null;
              return (
                <ReferenceArea
                  key={zone.name}
                  y1={Math.max(y1, minHR)}
                  y2={Math.min(y2, maxHR)}
                  fill={zone.color}
                  fillOpacity={1}
                  label={{
                    value: zone.name,
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "currentColor",
                    className: "opacity-40",
                  }}
                />
              );
            })}

          <XAxis
            dataKey={xKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => isTime ? Math.round(v).toString() : v.toFixed(1)}
            label={{ value: xLabel, position: "bottom", offset: 5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[minHR, maxHR]}
            tickFormatter={(v: number) => `${v}`}
            label={{
              value: "Heart Rate (bpm)",
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
                    {Math.round(d.heartRate)} bpm
                  </p>
                </div>
              );
            }}
          />
          {hoveredX != null && (
            <ReferenceLine
              x={hoveredX}
              stroke="hsl(var(--foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              className="hover-crosshair"
            />
          )}
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="hsl(0, 80%, 55%)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
