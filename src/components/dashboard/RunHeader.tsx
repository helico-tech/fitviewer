import { useRunStore } from "@/store/useRunStore"
import { Button } from "@/components/ui/button"

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
      <Button variant="outline" onClick={onLoadNew} className="shrink-0">
        Load new file
      </Button>
    </div>
  )
}
