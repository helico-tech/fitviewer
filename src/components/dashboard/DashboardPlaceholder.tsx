import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRunStore } from "@/store/useRunStore"

interface DashboardPlaceholderProps {
  onLoadNew: () => void
}

export function DashboardPlaceholder({ onLoadNew }: DashboardPlaceholderProps) {
  const runData = useRunStore((state) => state.runData)

  if (!runData) return null

  const { summary } = runData

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const formatPace = (secPerKm: number): string => {
    if (!secPerKm || !isFinite(secPerKm)) return "--:--"
    const m = Math.floor(secPerKm / 60)
    const s = Math.floor(secPerKm % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-green-500" />
            <h1 className="text-2xl font-bold tracking-tight">Run Dashboard</h1>
          </div>
          <Button variant="outline" onClick={onLoadNew}>
            Load new file
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="distance">
                {(summary.totalDistance / 1000).toFixed(2)} km
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="duration">
                {formatDuration(summary.totalTime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Pace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="avg-pace">
                {formatPace(summary.avgPace)} /km
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Heart Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="avg-hr">
                {summary.avgHeartRate ? `${Math.round(summary.avgHeartRate)} bpm` : "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="calories">
                {summary.calories ? Math.round(summary.calories) : "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Elevation Gain</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="elevation">
                {summary.totalAscent ? `${Math.round(summary.totalAscent)} m` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {runData.records.length} GPS records, {runData.laps.length} laps, {runData.sessions.length} sessions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
