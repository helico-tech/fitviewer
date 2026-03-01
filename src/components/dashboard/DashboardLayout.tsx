import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRunStore } from "@/store/useRunStore"
import { Card, CardContent } from "@/components/ui/card"
import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { RunHeader } from "@/components/dashboard/RunHeader"
import { RunMap } from "@/components/map/RunMap"
import { MapControls } from "@/components/map/MapControls"
import {
  LayoutDashboard,
  Map,
  BarChart3,
  SplitSquareVertical,
  Heart,
} from "lucide-react"

interface DashboardLayoutProps {
  onLoadNew: () => void
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <SummaryCards />
    </div>
  )
}

function StubTab({ title }: { title: string }) {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center py-16 sm:py-24">
        <p className="text-muted-foreground text-lg">{title} — coming soon</p>
      </CardContent>
    </Card>
  )
}

export function DashboardLayout({ onLoadNew }: DashboardLayoutProps) {
  const runData = useRunStore((state) => state.runData)

  if (!runData) return null

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Run header */}
        <RunHeader onLoadNew={onLoadNew} />

        {/* Tab navigation */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full" data-testid="tab-list">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <LayoutDashboard className="size-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">
              <Map className="size-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="charts" data-testid="tab-charts">
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="splits" data-testid="tab-splits">
              <SplitSquareVertical className="size-4" />
              <span className="hidden sm:inline">Splits</span>
            </TabsTrigger>
            <TabsTrigger value="zones" data-testid="tab-zones">
              <Heart className="size-4" />
              <span className="hidden sm:inline">Zones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" data-testid="tab-content-overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="map" data-testid="tab-content-map">
            <div className="space-y-3">
              <MapControls />
              <RunMap />
            </div>
          </TabsContent>
          <TabsContent value="charts" data-testid="tab-content-charts">
            <StubTab title="Charts" />
          </TabsContent>
          <TabsContent value="splits" data-testid="tab-content-splits">
            <StubTab title="Splits" />
          </TabsContent>
          <TabsContent value="zones" data-testid="tab-content-zones">
            <StubTab title="Zones" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
