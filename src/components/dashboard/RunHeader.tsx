import { useRunStore } from "@/store/useRunStore"
import { Button } from "@/components/ui/button"
import type { UnitSystem } from "@/lib/units"

interface RunHeaderProps {
  onLoadNew: () => void
}

function formatDate(date: Date): string {
  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)

  return `${datePart} — ${timePart}`
}

function UnitToggle() {
  const unitSystem = useRunStore((state) => state.unitSystem)
  const setUnitSystem = useRunStore((state) => state.setUnitSystem)

  function handleToggle(unit: UnitSystem) {
    setUnitSystem(unit)
  }

  return (
    <div
      className="inline-flex items-center rounded-md border border-input bg-background"
      data-testid="unit-toggle"
      role="radiogroup"
      aria-label="Unit system"
    >
      <button
        type="button"
        role="radio"
        aria-checked={unitSystem === "metric"}
        className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors ${
          unitSystem === "metric"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => handleToggle("metric")}
        data-testid="unit-km"
      >
        km
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={unitSystem === "imperial"}
        className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors ${
          unitSystem === "imperial"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => handleToggle("imperial")}
        data-testid="unit-mi"
      >
        mi
      </button>
    </div>
  )
}

export function RunHeader({ onLoadNew }: RunHeaderProps) {
  const summary = useRunStore((state) => state.runData?.summary)

  if (!summary) return null

  return (
    <div
      className="flex items-center justify-between gap-4"
      data-testid="run-header"
    >
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
          Run Dashboard
        </h1>
        <p
          className="text-sm sm:text-base text-muted-foreground"
          data-testid="run-date"
        >
          {formatDate(summary.startTime)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <UnitToggle />
        <Button variant="outline" onClick={onLoadNew}>
          Load new file
        </Button>
      </div>
    </div>
  )
}
