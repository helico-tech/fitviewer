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
import { toCadenceData } from "../../lib/chart-data.ts";
import { NeonGradient, GlowFilter } from "./ChartDefs.tsx";
import {
  NEON_AMBER,
  CHART_MARGINS,
  AXIS_STYLE,
  GRID_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme.ts";
import "./charts.css";

type Props = { records: ActivityRecord[]; startTime: number };

export function CadenceChart({ records, startTime }: Props) {
  const data = toCadenceData(records, startTime);

  return (
    <div className="chart-panel chart-panel--half">
      <span className="chart-panel__label">Cadence</span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGINS}>
          <defs>
            <NeonGradient id="cadGrad" color={NEON_AMBER} />
            <GlowFilter id="cadGlow" color={NEON_AMBER} />
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="elapsed"
            {...AXIS_STYLE}
            tickFormatter={(v: number) => `${Math.floor(v)}m`}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            {...AXIS_STYLE}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={NEON_AMBER}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: NEON_AMBER }}
            fill="url(#cadGrad)"
            filter="url(#cadGlow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
