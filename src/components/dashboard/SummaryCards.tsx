import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRunStore } from "@/store/useRunStore"
import { formatPace, formatDistance, formatElevation, type UnitSystem } from "@/lib/units"
import {
  Route,
  Clock,
  Gauge,
  Heart,
  Flame,
  TrendingUp,
} from "lucide-react"
import type { RunSummary } from "@/types/run"

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function getCardConfig(unit: UnitSystem) {
  return [
    {
      label: "Distance",
      testId: "distance",
      icon: Route,
      format: (s: RunSummary) => formatDistance(s.totalDistance, unit),
    },
    {
      label: "Duration",
      testId: "duration",
      icon: Clock,
      format: (s: RunSummary) => formatDuration(s.totalTime),
    },
    {
      label: "Avg Pace",
      testId: "avg-pace",
      icon: Gauge,
      format: (s: RunSummary) => formatPace(s.avgPace, unit),
    },
    {
      label: "Avg Heart Rate",
      testId: "avg-hr",
      icon: Heart,
      format: (s: RunSummary) =>
        s.avgHeartRate ? `${Math.round(s.avgHeartRate)} bpm` : "—",
    },
    {
      label: "Calories",
      testId: "calories",
      icon: Flame,
      format: (s: RunSummary) =>
        s.calories ? `${Math.round(s.calories)}` : "—",
    },
    {
      label: "Elevation Gain",
      testId: "elevation",
      icon: TrendingUp,
      format: (s: RunSummary) => formatElevation(s.totalAscent, unit),
    },
  ]
}

export function SummaryCards() {
  const runData = useRunStore((state) => state.runData)
  const unitSystem = useRunStore((state) => state.unitSystem)
  if (!runData) return null
  const { summary } = runData
  const cards = getCardConfig(unitSystem)

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      data-testid="summary-cards"
    >
      {cards.map(({ label, testId, icon: Icon, format }) => (
        <Card key={testId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Icon className="size-4" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid={testId}>
              {format(summary)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
