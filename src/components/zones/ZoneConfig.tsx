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
import { ZoneDistribution } from "./ZoneDistribution";
import { ZoneTimeTable } from "./ZoneTimeTable";

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

      {/* Zone distribution and time table */}
      {distribution.length > 0 && (
        <>
          <ZoneDistribution distribution={distribution} />
          <ZoneTimeTable distribution={distribution} />
        </>
      )}
    </div>
  );
}
