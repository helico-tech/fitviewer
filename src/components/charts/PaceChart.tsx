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

const DEFAULT_SMOOTHING_WINDOW = 10;

interface ChartDataPoint {
  distanceKm: number;
  distanceMi: number;
  pace: number; // sec per unit (km or mi), after smoothing
  rawPace: number; // for tooltip
}

export function PaceChart() {
  const records = useRunStore((s) => s.runData?.records);
  const unitSystem = useRunStore((s) => s.unitSystem);

  const data = useMemo<ChartDataPoint[]>(() => {
    if (!records || records.length === 0) return [];

    // Extract raw paces and smooth them
    const rawPaces = records.map((r) => r.pace);
    const smoothed = rollingAverage(rawPaces, DEFAULT_SMOOTHING_WINDOW);

    return records.map((r, i) => ({
      distanceKm: r.distance / 1000,
      distanceMi: r.distance / 1000 / 1.60934,
      pace: convertPace(smoothed[i], unitSystem),
      rawPace: convertPace(r.pace, unitSystem),
    }));
  }, [records, unitSystem]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No pace data available
      </div>
    );
  }

  const isMetric = unitSystem === "metric";
  const distanceKey = isMetric ? "distanceKm" : "distanceMi";
  const distanceLabel = isMetric ? "Distance (km)" : "Distance (mi)";
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
            dataKey={distanceKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: distanceLabel, position: "bottom", offset: 5 }}
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
                    {dist.toFixed(2)} {isMetric ? "km" : "mi"}
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
