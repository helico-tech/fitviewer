import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZONE_NAMES } from "@/lib/calculations";
import type { ZoneDistribution } from "@/lib/calculations";

interface ZoneTimeTableProps {
  distribution: ZoneDistribution[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${remainMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ZoneTimeTable({ distribution }: ZoneTimeTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Time in Zones</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm" data-testid="zone-time-table">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="text-left py-2 font-medium">Zone</th>
              <th className="text-right py-2 font-medium">HR Range</th>
              <th className="text-right py-2 font-medium">Time</th>
              <th className="text-right py-2 font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((d, i) => (
              <tr
                key={i}
                className="border-b last:border-0"
                data-testid={`zone-time-row-${i + 1}`}
              >
                <td className="py-2 flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: d.zone.color }}
                  />
                  {ZONE_NAMES[i]}
                </td>
                <td className="text-right py-2 tabular-nums text-muted-foreground">
                  {d.zone.minBpm}–{d.zone.maxBpm} bpm
                </td>
                <td className="text-right py-2 tabular-nums">
                  {formatTime(d.seconds)}
                </td>
                <td className="text-right py-2 tabular-nums">
                  {d.percentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
