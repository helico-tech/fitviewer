import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRunStore } from "@/store/useRunStore"
import {
  Route,
  Clock,
  Gauge,
  Heart,
  Flame,
  TrendingUp,
} from "lucide-react"

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm)) return "--:--"
  const m = Math.floor(secPerKm / 60)
  const s = Math.floor(secPerKm % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2)
}

const cardConfig = [
  {
    label: "Distance",
    testId: "distance",
    icon: Route,
    format: (s: { totalDistance: number }) => `${formatDistance(s.totalDistance)} km`,
  },
  {
    label: "Duration",
    testId: "duration",
    icon: Clock,
    format: (s: { totalTime: number }) => formatDuration(s.totalTime),
  },
  {
    label: "Avg Pace",
    testId: "avg-pace",
    icon: Gauge,
    format: (s: { avgPace: number }) => `${formatPace(s.avgPace)} /km`,
  },
  {
    label: "Avg Heart Rate",
    testId: "avg-hr",
    icon: Heart,
    format: (s: { avgHeartRate: number }) =>
      s.avgHeartRate ? `${Math.round(s.avgHeartRate)} bpm` : "—",
  },
  {
    label: "Calories",
    testId: "calories",
    icon: Flame,
    format: (s: { calories: number }) =>
      s.calories ? `${Math.round(s.calories)}` : "—",
  },
  {
    label: "Elevation Gain",
    testId: "elevation",
    icon: TrendingUp,
    format: (s: { totalAscent: number }) =>
      s.totalAscent ? `${Math.round(s.totalAscent)} m` : "—",
  },
] as const

export function SummaryCards() {
  const runData = useRunStore((state) => state.runData)
  if (!runData) return null
  const { summary } = runData

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      data-testid="summary-cards"
    >
      {cardConfig.map(({ label, testId, icon: Icon, format }) => (
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
