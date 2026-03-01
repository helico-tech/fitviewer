import { useRunStore } from "@/store/useRunStore"
import { Slider } from "@/components/ui/slider"

export function ChartControls() {
  const chartXAxis = useRunStore((s) => s.chartXAxis)
  const setChartXAxis = useRunStore((s) => s.setChartXAxis)
  const smoothingWindow = useRunStore((s) => s.smoothingWindow)
  const setSmoothingWindow = useRunStore((s) => s.setSmoothingWindow)

  return (
    <div
      className="flex flex-wrap items-center gap-4 sm:gap-6"
      data-testid="chart-controls"
    >
      {/* X-axis toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">X-axis:</span>
        <div
          className="inline-flex items-center rounded-md border border-input bg-background"
          role="radiogroup"
          aria-label="Chart X-axis"
          data-testid="xaxis-toggle"
        >
          <button
            type="button"
            role="radio"
            aria-checked={chartXAxis === "distance"}
            className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors ${
              chartXAxis === "distance"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setChartXAxis("distance")}
            data-testid="xaxis-distance"
          >
            Distance
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={chartXAxis === "time"}
            className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors ${
              chartXAxis === "time"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setChartXAxis("time")}
            data-testid="xaxis-time"
          >
            Time
          </button>
        </div>
      </div>

      {/* Smoothing slider */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Smoothing:</span>
        <Slider
          value={[smoothingWindow]}
          onValueChange={([v]) => setSmoothingWindow(v)}
          min={1}
          max={30}
          step={1}
          className="w-24 sm:w-32"
          aria-label="Smoothing window"
          data-testid="smoothing-slider"
        />
        <span
          className="text-sm tabular-nums text-muted-foreground w-6 text-right"
          data-testid="smoothing-value"
        >
          {smoothingWindow}
        </span>
      </div>
    </div>
  )
}
