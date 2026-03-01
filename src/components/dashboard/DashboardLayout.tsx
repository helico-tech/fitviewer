import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRunStore } from "@/store/useRunStore"
import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { RunHeader } from "@/components/dashboard/RunHeader"
import { RunMap } from "@/components/map/RunMap"
import { MapControls } from "@/components/map/MapControls"
import { PaceChart } from "@/components/charts/PaceChart"
import { HeartRateChart } from "@/components/charts/HeartRateChart"
import { ElevationChart } from "@/components/charts/ElevationChart"
import { CadenceChart } from "@/components/charts/CadenceChart"
import { ChartControls } from "@/components/charts/ChartControls"
import { ZoneConfig } from "@/components/zones/ZoneConfig"
import { SplitsTable } from "@/components/splits/SplitsTable"
import { LapsTable } from "@/components/splits/LapsTable"
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
            <div className="space-y-6">
              <ChartControls />
              <PaceChart />
              <HeartRateChart />
              <ElevationChart />
              <CadenceChart />
            </div>
          </TabsContent>
          <TabsContent value="splits" data-testid="tab-content-splits">
            <div className="space-y-6">
              <SplitsTable />
              <LapsTable />
            </div>
          </TabsContent>
          <TabsContent value="zones" data-testid="tab-content-zones">
            <ZoneConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
