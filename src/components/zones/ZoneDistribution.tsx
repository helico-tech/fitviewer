import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZONE_NAMES } from "@/lib/calculations";
import type { ZoneDistribution as ZoneDistributionData } from "@/lib/calculations";

interface ZoneDistributionProps {
  distribution: ZoneDistributionData[];
}

export function ZoneDistribution({ distribution }: ZoneDistributionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Zone Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-8 rounded-md overflow-hidden"
          data-testid="zone-distribution-bar"
        >
          {distribution.map(
            (d, i) =>
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
              ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
