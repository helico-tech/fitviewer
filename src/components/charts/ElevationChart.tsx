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
import { toElevationData } from "../../lib/chart-data.ts";
import { NeonGradient, GlowFilter } from "./ChartDefs.tsx";
import {
  NEON_PURPLE,
  CHART_MARGINS,
  AXIS_STYLE,
  GRID_STYLE,
  TOOLTIP_STYLE,
} from "./chart-theme.ts";
import "./charts.css";

type Props = { records: ActivityRecord[]; startTime: number };

export function ElevationChart({ records, startTime }: Props) {
  const data = toElevationData(records, startTime);

  return (
    <div className="chart-panel chart-panel--half">
      <span className="chart-panel__label">Elevation</span>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGINS}>
          <defs>
            <NeonGradient id="elevGrad" color={NEON_PURPLE} />
            <GlowFilter id="elevGlow" color={NEON_PURPLE} />
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="elapsed"
            {...AXIS_STYLE}
            tickFormatter={(v: number) => `${Math.floor(v)}m`}
          />
          <YAxis
            domain={["dataMin - 5", "dataMax + 10"]}
            {...AXIS_STYLE}
            tickFormatter={(v: number) => `${Math.round(v)}m`}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={NEON_PURPLE}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: NEON_PURPLE }}
            fill="url(#elevGrad)"
            filter="url(#elevGlow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
