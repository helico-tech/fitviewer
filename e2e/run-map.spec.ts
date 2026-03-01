import { test, expect, Page } from "@playwright/test"

// Mock GPS records forming a short route (roughly a 1km loop in Berlin)
const mockGpsRecords = Array.from({ length: 50 }, (_, i) => {
  const t = i / 49
  // Simple path along a street
  const lat = 52.52 + t * 0.005
  const lon = 13.405 + Math.sin(t * Math.PI) * 0.002
  return {
    timestamp: new Date(Date.now() + i * 30000).toISOString(),
    lat,
    lon,
    altitude: 35 + Math.sin(t * Math.PI * 2) * 5,
    heartRate: 140 + Math.floor(Math.random() * 20),
    pace: 280 + Math.floor(Math.random() * 40),
    speed: 3.0 + Math.random() * 0.5,
    cadence: 170 + Math.floor(Math.random() * 10),
    strideLength: 1.1 + Math.random() * 0.1,
    distance: i * 20,
  }
})

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 1000,
    totalTime: 300,
    movingTime: 295,
    avgPace: 300,
    avgHeartRate: 150,
    maxHeartRate: 170,
    avgCadence: 175,
    totalAscent: 10,
    totalDescent: 10,
    calories: 80,
  },
  records: mockGpsRecords,
  laps: [],
  sessions: [],
}

const mockRunDataNoGps = {
  ...mockRunData,
  records: [],
}

async function loadMockData(page: Page, data: typeof mockRunData) {
  await page.evaluate((d) => {
    const storeApi = (window as any).__runStore
    if (storeApi) {
      storeApi.setState({
        runData: {
          ...d,
          summary: {
            ...d.summary,
            startTime: new Date(d.summary.startTime),
          },
          records: d.records.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })),
        },
        isLoading: false,
        error: null,
      })
    }
  }, data)
}

test.describe("RunMap", () => {
  test("renders map container on Map tab", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, mockRunData)
    await expect(page.getByTestId("dashboard")).toBeVisible()

    await page.getByTestId("tab-map").click()
    await expect(page.getByTestId("run-map")).toBeVisible()
  })

  test("initializes MapLibre canvas with GPS data", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, mockRunData)
    await page.getByTestId("tab-map").click()

    // MapLibre renders to a canvas element
    const canvas = page.getByTestId("run-map").locator("canvas")
    await expect(canvas.first()).toBeVisible({ timeout: 10000 })
  })

  test("shows navigation controls", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, mockRunData)
    await page.getByTestId("tab-map").click()

    // MapLibre navigation control renders zoom buttons
    const mapContainer = page.getByTestId("run-map")
    await expect(mapContainer.locator("canvas").first()).toBeVisible({
      timeout: 10000,
    })
    await expect(
      mapContainer.locator(".maplibregl-ctrl-zoom-in")
    ).toBeVisible()
    await expect(
      mapContainer.locator(".maplibregl-ctrl-zoom-out")
    ).toBeVisible()
  })

  test("renders map container even without GPS records", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, mockRunDataNoGps)
    await page.getByTestId("tab-map").click()

    // Container should still be visible, just no map initialized
    await expect(page.getByTestId("run-map")).toBeVisible()
  })

  test("map is interactive with zoom controls", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, mockRunData)
    await page.getByTestId("tab-map").click()

    const mapContainer = page.getByTestId("run-map")
    await expect(mapContainer.locator("canvas").first()).toBeVisible({
      timeout: 10000,
    })

    // Click zoom in button and verify map is still functional
    const zoomIn = mapContainer.locator(".maplibregl-ctrl-zoom-in")
    await zoomIn.click()

    // Map should still be visible and interactive after zooming
    await expect(mapContainer.locator("canvas").first()).toBeVisible()
  })
})
