import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRunStore } from "@/store/useRunStore";
import { computeSplits, type Split } from "@/lib/calculations";
import { formatPace, convertPace, type UnitSystem } from "@/lib/units";

export function SplitBarChart() {
  const runData = useRunStore((state) => state.runData);
  const unitSystem = useRunStore((state) => state.unitSystem);

  const splits = useMemo(() => {
    if (!runData) return [];
    return computeSplits(runData.records, unitSystem);
  }, [runData, unitSystem]);

  if (!runData || splits.length === 0) return null;

  const paces = splits.map((s) => convertPace(s.avgPace, unitSystem));
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const fastestIdx = paces.indexOf(minPace);
  const slowestIdx = paces.indexOf(maxPace);

  return (
    <Card data-testid="split-bar-chart-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Split Pace Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5" data-testid="split-bar-chart">
          {splits.map((split, i) => (
            <SplitBar
              key={split.number}
              split={split}
              unitSystem={unitSystem}
              pace={paces[i]}
              minPace={minPace}
              maxPace={maxPace}
              isFastest={splits.length > 1 && i === fastestIdx}
              isSlowest={splits.length > 1 && i === slowestIdx}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SplitBarProps {
  split: Split;
  unitSystem: UnitSystem;
  pace: number;
  minPace: number;
  maxPace: number;
  isFastest: boolean;
  isSlowest: boolean;
}

function SplitBar({
  split,
  unitSystem,
  pace,
  minPace,
  maxPace,
  isFastest,
  isSlowest,
}: SplitBarProps) {
  // Bar width as percentage: fastest gets minimum width, slowest gets full width.
  // Use a range from 30% to 100% so even the fastest split is visible.
  const range = maxPace - minPace;
  const widthPct = range > 0
    ? 30 + ((pace - minPace) / range) * 70
    : 100;

  const barColor = isFastest
    ? "bg-green-500"
    : isSlowest
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className="flex items-center gap-2"
      data-testid={`split-bar-${split.number}`}
    >
      <span className="w-6 text-xs text-muted-foreground tabular-nums text-right shrink-0">
        {split.number}
      </span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
          <div
            className={`h-full rounded ${barColor} transition-all`}
            style={{ width: `${widthPct}%` }}
            data-testid={`split-bar-fill-${split.number}`}
          />
        </div>
        <span className="text-xs tabular-nums whitespace-nowrap shrink-0 w-16 text-right">
          {formatPace(split.avgPace, unitSystem)}
        </span>
        {isFastest && (
          <span
            className="text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap shrink-0"
            data-testid="fastest-badge"
          >
            Fastest
          </span>
        )}
        {isSlowest && (
          <span
            className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap shrink-0"
            data-testid="slowest-badge"
          >
            Slowest
          </span>
        )}
      </div>
    </div>
  );
}
