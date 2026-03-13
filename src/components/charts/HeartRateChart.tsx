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
import { toHrData } from "../../lib/chart-data.ts";
import { NeonGradient, GlowFilter } from "./ChartDefs.tsx";
import {
  NEON_CYAN,
  CHART_MARGINS,
  AXIS_STYLE,
  GRID_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme.ts";
import "./charts.css";

type Props = { records: ActivityRecord[]; startTime: number };

export function HeartRateChart({ records, startTime }: Props) {
  const data = toHrData(records, startTime);

  return (
    <div className="chart-panel chart-panel--wide">
      <span className="chart-panel__label">Heart Rate</span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGINS}>
          <defs>
            <NeonGradient id="hrGrad" color={NEON_CYAN} />
            <GlowFilter id="hrGlow" color={NEON_CYAN} />
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
            stroke={NEON_CYAN}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: NEON_CYAN }}
            fill="url(#hrGrad)"
            filter="url(#hrGlow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
