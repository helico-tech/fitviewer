import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ActivityRecord } from "../../types/activity.ts";
import { toPaceData } from "../../lib/chart-data.ts";
import { NeonGradient, GlowFilter } from "./ChartDefs.tsx";
import {
  NEON_GREEN,
  CHART_MARGINS,
  AXIS_STYLE,
  GRID_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme.ts";
import "./charts.css";

type Props = { records: ActivityRecord[]; startTime: number };

function formatPace(v: number): string {
  const mins = Math.floor(v);
  const secs = Math.round((v - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function PaceChart({ records, startTime }: Props) {
  const data = toPaceData(records, startTime);

  return (
    <div className="chart-panel chart-panel--wide">
      <span className="chart-panel__label">Pace</span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGINS}>
          <defs>
            <NeonGradient id="paceGrad" color={NEON_GREEN} />
            <GlowFilter id="paceGlow" color={NEON_GREEN} />
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="elapsed"
            {...AXIS_STYLE}
            tickFormatter={(v: number) => `${Math.floor(v)}m`}
          />
          <YAxis
            reversed={true}
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            {...AXIS_STYLE}
            tickFormatter={formatPace}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={NEON_GREEN}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: NEON_GREEN }}
            fill="url(#paceGrad)"
            filter="url(#paceGlow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
