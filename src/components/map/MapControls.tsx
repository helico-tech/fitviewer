import { useMemo } from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRunStore, type MapMetric } from "@/store/useRunStore"
import { getMetricRange, LEGEND_GRADIENT } from "@/lib/map-colors"
import { formatPace, formatElevation } from "@/lib/units"

const METRIC_OPTIONS: { value: MapMetric; label: string }[] = [
  { value: "pace", label: "Pace" },
  { value: "heartRate", label: "Heart Rate" },
  { value: "altitude", label: "Elevation" },
  { value: "cadence", label: "Cadence" },
  { value: "none", label: "None" },
]

function getMetricLabel(metric: MapMetric): string {
  return METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? "None"
}

function formatMetricValue(
  value: number,
  metric: MapMetric,
  unitSystem: "metric" | "imperial",
): string {
  switch (metric) {
    case "pace":
      return formatPace(value, unitSystem)
    case "heartRate":
      return `${Math.round(value)} bpm`
    case "altitude":
      return formatElevation(value, unitSystem)
    case "cadence":
      return `${Math.round(value)} spm`
    default:
      return ""
  }
}

export function MapControls() {
  const mapMetric = useRunStore((s) => s.mapMetric)
  const setMapMetric = useRunStore((s) => s.setMapMetric)
  const records = useRunStore((s) => s.runData?.records)
  const unitSystem = useRunStore((s) => s.unitSystem)

  const validRecords = useMemo(() => {
    if (!records) return []
    return records.filter(
      (r) =>
        r.lat != null &&
        r.lon != null &&
        isFinite(r.lat) &&
        isFinite(r.lon) &&
        r.lat !== 0 &&
        r.lon !== 0,
    )
  }, [records])

  const range = useMemo(
    () => getMetricRange(validRecords, mapMetric),
    [validRecords, mapMetric],
  )

  const showLegend = mapMetric !== "none" && range.min < range.max

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="map-controls"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" data-testid="metric-selector">
            <Palette className="size-4 mr-2" />
            Color: {getMetricLabel(mapMetric)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={mapMetric}
            onValueChange={(v) => setMapMetric(v as MapMetric)}
          >
            {METRIC_OPTIONS.map((opt) => (
              <DropdownMenuRadioItem
                key={opt.value}
                value={opt.value}
                data-testid={`metric-option-${opt.value}`}
              >
                {opt.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {showLegend && (
        <div
          className="flex items-center gap-2"
          data-testid="color-legend"
        >
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatMetricValue(range.min, mapMetric, unitSystem)}
          </span>
          <div
            className="w-24 sm:w-32 h-3 rounded-sm"
            style={{ background: LEGEND_GRADIENT }}
            data-testid="legend-gradient"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatMetricValue(range.max, mapMetric, unitSystem)}
          </span>
        </div>
      )}
    </div>
  )
}
