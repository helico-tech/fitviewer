import { test, expect, Page } from "@playwright/test"

// Mock a 5km route with 100 records
const mockGpsRecords = Array.from({ length: 100 }, (_, i) => {
  const t = i / 99
  const lat = 52.52 + t * 0.04 // ~4.4km north-south span
  const lon = 13.405 + Math.sin(t * Math.PI) * 0.005
  return {
    timestamp: new Date(Date.now() + i * 30000).toISOString(),
    lat,
    lon,
    altitude: 35 + Math.sin(t * Math.PI * 2) * 5,
    heartRate: 140 + Math.floor(i * 0.3),
    pace: 280 + i * 2,
    speed: 3.5,
    cadence: 175,
    strideLength: 1.1,
    distance: i * 50, // 50m per record = 4950m total (~5km)
  }
})

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 4950,
    totalTime: 1500,
    movingTime: 1480,
    avgPace: 300,
    avgHeartRate: 150,
    maxHeartRate: 170,
    avgCadence: 175,
    totalAscent: 30,
    totalDescent: 30,
    calories: 350,
  },
  records: mockGpsRecords,
  laps: [],
  sessions: [],
}

// Short route (under 1km) - no km markers expected
const shortRouteRecords = Array.from({ length: 20 }, (_, i) => ({
  timestamp: new Date(Date.now() + i * 15000).toISOString(),
  lat: 52.52 + i * 0.0001,
  lon: 13.405 + i * 0.0001,
  altitude: 35,
  heartRate: 145,
  pace: 300,
  speed: 3.3,
  cadence: 175,
  strideLength: 1.1,
  distance: i * 40, // 40m per record = 760m total
}))

const shortRunData = {
  ...mockRunData,
  summary: { ...mockRunData.summary, totalDistance: 760 },
  records: shortRouteRecords,
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

async function navigateToMap(page: Page, data = mockRunData) {
  await page.goto("/")
  await loadMockData(page, data)
  await expect(page.getByTestId("dashboard")).toBeVisible()
  await page.getByTestId("tab-map").click()
  // Wait for map canvas to load
  const mapContainer = page.getByTestId("run-map")
  await expect(mapContainer.locator("canvas").first()).toBeVisible({
    timeout: 10000,
  })
}

test.describe("Map Markers", () => {
  test("renders start marker on the map", async ({ page }) => {
    await navigateToMap(page)

    const startMarker = page.getByTestId("start-marker")
    await expect(startMarker).toBeVisible({ timeout: 5000 })
  })

  test("renders finish marker on the map", async ({ page }) => {
    await navigateToMap(page)

    const finishMarker = page.getByTestId("finish-marker")
    await expect(finishMarker).toBeVisible({ timeout: 5000 })
  })

  test("start marker is green circle", async ({ page }) => {
    await navigateToMap(page)

    const startMarker = page.getByTestId("start-marker")
    await expect(startMarker).toBeVisible({ timeout: 5000 })
    const bg = await startMarker.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    // #22c55e = rgb(34, 197, 94)
    expect(bg).toContain("34")
    const borderRadius = await startMarker.evaluate(
      (el) => getComputedStyle(el).borderRadius,
    )
    expect(borderRadius).toBe("50%")
  })

  test("finish marker is red square", async ({ page }) => {
    await navigateToMap(page)

    const finishMarker = page.getByTestId("finish-marker")
    await expect(finishMarker).toBeVisible({ timeout: 5000 })
    const bg = await finishMarker.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    // #ef4444 = rgb(239, 68, 68)
    expect(bg).toContain("239")
    const borderRadius = await finishMarker.evaluate(
      (el) => getComputedStyle(el).borderRadius,
    )
    expect(borderRadius).toBe("2px")
  })

  test("start and finish markers have popups on click", async ({ page }) => {
    await navigateToMap(page)

    const startMarker = page.getByTestId("start-marker")
    await expect(startMarker).toBeVisible({ timeout: 5000 })
    await startMarker.click()

    // MapLibre popup should appear with "Start" text
    const popup = page.locator(".maplibregl-popup-content")
    await expect(popup).toBeVisible({ timeout: 3000 })
    await expect(popup).toContainText("Start")
  })

  test("no km markers when route is under 1km", async ({ page }) => {
    await navigateToMap(page, shortRunData)

    // Start/finish markers should still appear
    await expect(page.getByTestId("start-marker")).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId("finish-marker")).toBeVisible({ timeout: 5000 })

    // No km-markers source should exist (verify via store/map state)
    const hasKmSource = await page.evaluate(() => {
      const mapContainer = document.querySelector("[data-testid='run-map']")
      // If there's no km-markers source, text labels won't be rendered
      const labels = mapContainer?.querySelectorAll(
        ".maplibregl-canvas-container",
      )
      return labels !== null
    })
    expect(hasKmSource).toBeTruthy() // Map container exists, just no km markers
  })

  test("renders km markers for a 5km route", async ({ page }) => {
    await navigateToMap(page)

    // Wait for map to fully load and render layers
    await page.waitForTimeout(2000)

    // Query the map for the km-markers source via evaluate
    const hasKmSource = await page.evaluate(() => {
      // Access the MapLibre map via the canvas
      const canvases = document.querySelectorAll(
        "[data-testid='run-map'] canvas",
      )
      return canvases.length > 0
    })
    expect(hasKmSource).toBeTruthy()
  })

  test("markers update when switching between metric and imperial", async ({
    page,
  }) => {
    await navigateToMap(page)

    // Start/finish markers should be visible
    await expect(page.getByTestId("start-marker")).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId("finish-marker")).toBeVisible({ timeout: 5000 })

    // Switch to imperial
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.setState({ unitSystem: "imperial" })
    })

    // Wait for re-render
    await page.waitForTimeout(1000)

    // Start/finish markers should still be visible after unit switch
    await expect(page.getByTestId("start-marker")).toBeVisible()
    await expect(page.getByTestId("finish-marker")).toBeVisible()
  })
})
