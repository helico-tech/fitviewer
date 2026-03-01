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
import { formatPace, type UnitSystem } from "@/lib/units";
import type { Lap, DataPoint } from "@/types/run";

function formatLapTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatLapDistance(meters: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    return `${(meters / 1609.344).toFixed(2)}`;
  }
  return `${(meters / 1000).toFixed(2)}`;
}

function computeElevationLoss(
  records: DataPoint[],
  startIndex: number,
  endIndex: number,
): number {
  let loss = 0;
  const start = Math.max(0, startIndex);
  const end = Math.min(records.length - 1, endIndex);
  for (let i = start + 1; i <= end; i++) {
    const diff = records[i].altitude - records[i - 1].altitude;
    if (diff < 0) loss += Math.abs(diff);
  }
  return loss;
}

function formatElevationChange(
  gain: number,
  loss: number,
  unit: UnitSystem,
): string {
  const g =
    unit === "imperial" ? Math.round(gain * 3.28084) : Math.round(gain);
  const l =
    unit === "imperial" ? Math.round(loss * 3.28084) : Math.round(loss);
  const suffix = unit === "imperial" ? "ft" : "m";
  return `+${g} / -${l} ${suffix}`;
}

export function LapsTable() {
  const runData = useRunStore((state) => state.runData);
  const unitSystem = useRunStore((state) => state.unitSystem);

  const laps = useMemo(() => {
    if (!runData || runData.laps.length === 0) return [];
    return runData.laps;
  }, [runData]);

  const hasMultipleTypes = useMemo(() => {
    if (laps.length === 0) return false;
    const types = new Set(laps.map((l) => l.type));
    return types.size > 1;
  }, [laps]);

  if (!runData) return null;

  const distLabel = unitSystem === "metric" ? "km" : "mi";

  return (
    <Card data-testid="laps-table-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Laps</CardTitle>
      </CardHeader>
      <CardContent>
        {laps.length === 0 ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="no-laps"
          >
            No laps recorded
          </p>
        ) : (
          <Table data-testid="laps-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {hasMultipleTypes && (
                  <TableHead className="w-16">Type</TableHead>
                )}
                <TableHead className="text-right">
                  Dist ({distLabel})
                </TableHead>
                <TableHead className="text-right">Pace</TableHead>
                <TableHead className="text-right">Avg HR</TableHead>
                <TableHead className="text-right">Avg Cad</TableHead>
                <TableHead className="text-right">Elev +/-</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laps.map((lap: Lap, index: number) => {
                const elevLoss = computeElevationLoss(
                  runData.records,
                  lap.startIndex,
                  lap.endIndex,
                );
                return (
                  <TableRow
                    key={index}
                    data-testid={`lap-row-${index + 1}`}
                  >
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    {hasMultipleTypes && (
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            lap.type === "manual"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                          data-testid={`lap-type-${index + 1}`}
                        >
                          {lap.type === "manual" ? "Manual" : "Auto"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="text-right tabular-nums">
                      {formatLapDistance(lap.distance, unitSystem)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPace(lap.avgPace, unitSystem)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lap.avgHeartRate > 0
                        ? `${Math.round(lap.avgHeartRate)} bpm`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lap.avgCadence > 0
                        ? `${Math.round(lap.avgCadence)} spm`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatElevationChange(
                        lap.elevationGain,
                        elevLoss,
                        unitSystem,
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatLapTime(lap.totalTime)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
