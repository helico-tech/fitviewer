import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRunStore } from "@/store/useRunStore";
import { computeSplits } from "@/lib/calculations";
import { formatPace, type UnitSystem } from "@/lib/units";

function formatSplitTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSplitDistance(meters: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    return `${(meters / 1609.344).toFixed(2)}`;
  }
  return `${(meters / 1000).toFixed(2)}`;
}

function formatElevationChange(gain: number, loss: number, unit: UnitSystem): string {
  const g = unit === "imperial" ? Math.round(gain * 3.28084) : Math.round(gain);
  const l = unit === "imperial" ? Math.round(loss * 3.28084) : Math.round(loss);
  const suffix = unit === "imperial" ? "ft" : "m";
  return `+${g} / -${l} ${suffix}`;
}

export function SplitsTable() {
  const runData = useRunStore((state) => state.runData);
  const unitSystem = useRunStore((state) => state.unitSystem);
  const selectedSplitIndex = useRunStore((state) => state.selectedSplitIndex);
  const setSelectedSplitIndex = useRunStore((state) => state.setSelectedSplitIndex);

  const splits = useMemo(() => {
    if (!runData) return [];
    return computeSplits(runData.records, unitSystem);
  }, [runData, unitSystem]);

  if (!runData) return null;

  const distLabel = unitSystem === "metric" ? "km" : "mi";

  return (
    <Card data-testid="splits-table-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Auto Splits ({unitSystem === "metric" ? "per km" : "per mile"})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {splits.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="no-splits">
            No split data available
          </p>
        ) : (
          <Table data-testid="splits-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="text-right">Dist ({distLabel})</TableHead>
                <TableHead className="text-right">Pace</TableHead>
                <TableHead className="text-right">Avg HR</TableHead>
                <TableHead className="text-right">Avg Cad</TableHead>
                <TableHead className="text-right">Elev +/-</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((split, idx) => (
                <TableRow
                  key={split.number}
                  data-testid={`split-row-${split.number}`}
                  className={`cursor-pointer transition-colors ${selectedSplitIndex === idx ? "bg-accent" : "hover:bg-muted/50"}`}
                  onClick={() => setSelectedSplitIndex(selectedSplitIndex === idx ? null : idx)}
                >
                  <TableCell className="font-medium">{split.number}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSplitDistance(split.distance, unitSystem)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPace(split.avgPace, unitSystem)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {split.avgHeartRate > 0
                      ? `${Math.round(split.avgHeartRate)} bpm`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {split.avgCadence > 0
                      ? `${Math.round(split.avgCadence)} spm`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatElevationChange(
                      split.elevationGain,
                      split.elevationLoss,
                      unitSystem,
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSplitTime(split.time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
