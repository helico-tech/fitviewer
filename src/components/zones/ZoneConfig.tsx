import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRunStore } from "@/store/useRunStore";
import {
  buildZones,
  calculateZoneDistribution,
  ZONE_COLORS,
  ZONE_NAMES,
} from "@/lib/calculations";

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

export function ZoneConfig() {
  const records = useRunStore((s) => s.runData?.records);
  const maxHR = useRunStore((s) => s.maxHR);
  const zoneBoundaries = useRunStore((s) => s.zoneBoundaries);
  const setMaxHR = useRunStore((s) => s.setMaxHR);

  const zones = useMemo(() => buildZones(maxHR, zoneBoundaries), [maxHR, zoneBoundaries]);

  const distribution = useMemo(() => {
    if (!records || records.length === 0) return [];
    return calculateZoneDistribution(records, zones);
  }, [records, zones]);

  return (
    <div className="space-y-6" data-testid="zone-config">
      {/* Max HR setting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Heart Rate Zone Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="max-hr" className="whitespace-nowrap text-sm">
              Max HR
            </Label>
            <Input
              id="max-hr"
              type="number"
              min={100}
              max={230}
              value={maxHR}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setMaxHR(val);
              }}
              className="w-24"
              data-testid="max-hr-input"
            />
            <span className="text-sm text-muted-foreground">bpm</span>
          </div>
        </CardContent>
      </Card>

      {/* Zone boundaries table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Zone Boundaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2" data-testid="zone-boundaries">
            {zones.map((zone, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                data-testid={`zone-row-${i + 1}`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: ZONE_COLORS[i] }}
                  data-testid={`zone-color-${i + 1}`}
                />
                <span className="text-sm w-40 truncate">{ZONE_NAMES[i]}</span>
                <span className="text-sm text-muted-foreground w-28 text-right tabular-nums">
                  {zone.minBpm}–{zone.maxBpm} bpm
                </span>
                <span className="text-sm text-muted-foreground w-16 text-right tabular-nums">
                  {Math.round(zoneBoundaries[i].min * 100)}–{Math.round(zoneBoundaries[i].max * 100)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone distribution */}
      {distribution.length > 0 && (
        <>
          {/* Stacked bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Zone Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex h-8 rounded-md overflow-hidden"
                data-testid="zone-distribution-bar"
              >
                {distribution.map((d, i) => (
                  d.percentage > 0 && (
                    <div
                      key={i}
                      className="flex items-center justify-center text-xs font-medium text-white"
                      style={{
                        width: `${d.percentage}%`,
                        backgroundColor: d.zone.color,
                        minWidth: d.percentage > 3 ? undefined : "2px",
                      }}
                      title={`${ZONE_NAMES[i]}: ${d.percentage.toFixed(1)}%`}
                      data-testid={`zone-bar-${i + 1}`}
                    >
                      {d.percentage >= 8 ? `Z${i + 1}` : ""}
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time table */}
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
                    <tr key={i} className="border-b last:border-0" data-testid={`zone-time-row-${i + 1}`}>
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
        </>
      )}
    </div>
  );
}
