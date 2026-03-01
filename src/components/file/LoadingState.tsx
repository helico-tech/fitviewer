import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingState() {
  return (
    <div className="min-h-screen bg-background" data-testid="loading-state">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Run header skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <Skeleton className="h-7 sm:h-8 w-40" data-testid="skeleton-header-title" />
            <Skeleton className="h-4 sm:h-5 w-64" data-testid="skeleton-header-date" />
          </div>
          <Skeleton className="h-9 w-28 shrink-0" data-testid="skeleton-header-button" />
        </div>

        {/* Tab bar skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" data-testid="skeleton-tab-bar" />

        {/* Parsing indicator */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Parsing FIT file…</span>
        </div>

        {/* Summary card skeletons — matches OverviewTab grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" data-testid="skeleton-cards">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart area skeleton */}
        <Card data-testid="skeleton-chart">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 sm:h-64 w-full" />
          </CardContent>
        </Card>

        {/* Map area skeleton */}
        <Card data-testid="skeleton-map">
          <CardHeader>
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 sm:h-80 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
