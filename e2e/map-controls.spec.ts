import { test, expect, Page } from "@playwright/test"

const mockGpsRecords = Array.from({ length: 50 }, (_, i) => {
  const t = i / 49
  const lat = 52.52 + t * 0.005
  const lon = 13.405 + Math.sin(t * Math.PI) * 0.002
  return {
    timestamp: new Date(Date.now() + i * 30000).toISOString(),
    lat,
    lon,
    altitude: 35 + Math.sin(t * Math.PI * 2) * 5,
    heartRate: 140 + Math.floor(i * 0.6),
    pace: 280 + i * 2,
    speed: 3.0 + Math.random() * 0.5,
    cadence: 170 + Math.floor(i * 0.2),
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

async function loadMockData(page: Page) {
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
  }, mockRunData)
}

async function navigateToMap(page: Page) {
  await page.goto("/")
  await loadMockData(page)
  await expect(page.getByTestId("dashboard")).toBeVisible()
  await page.getByTestId("tab-map").click()
}

test.describe("MapControls", () => {
  test("renders metric selector on Map tab", async ({ page }) => {
    await navigateToMap(page)

    const controls = page.getByTestId("map-controls")
    await expect(controls).toBeVisible()
    const selector = page.getByTestId("metric-selector")
    await expect(selector).toBeVisible()
    // Default metric is pace
    await expect(selector).toContainText("Color: Pace")
  })

  test("shows color legend with min/max values for default metric", async ({
    page,
  }) => {
    await navigateToMap(page)

    const legend = page.getByTestId("color-legend")
    await expect(legend).toBeVisible()
    // Legend should have a gradient bar
    await expect(page.getByTestId("legend-gradient")).toBeVisible()
    // Legend should show min and max pace values
    const legendText = await legend.textContent()
    expect(legendText).toMatch(/\/km/)
  })

  test("opens metric dropdown with all options", async ({ page }) => {
    await navigateToMap(page)

    await page.getByTestId("metric-selector").click()

    await expect(page.getByTestId("metric-option-pace")).toBeVisible()
    await expect(page.getByTestId("metric-option-heartRate")).toBeVisible()
    await expect(page.getByTestId("metric-option-altitude")).toBeVisible()
    await expect(page.getByTestId("metric-option-cadence")).toBeVisible()
    await expect(page.getByTestId("metric-option-none")).toBeVisible()
  })

  test("switches to heart rate metric and updates legend", async ({
    page,
  }) => {
    await navigateToMap(page)

    await page.getByTestId("metric-selector").click()
    await page.getByTestId("metric-option-heartRate").click()

    await expect(page.getByTestId("metric-selector")).toContainText(
      "Color: Heart Rate",
    )
    const legend = page.getByTestId("color-legend")
    await expect(legend).toBeVisible()
    const legendText = await legend.textContent()
    expect(legendText).toMatch(/bpm/)
  })

  test("switches to elevation metric and updates legend", async ({ page }) => {
    await navigateToMap(page)

    await page.getByTestId("metric-selector").click()
    await page.getByTestId("metric-option-altitude").click()

    await expect(page.getByTestId("metric-selector")).toContainText(
      "Color: Elevation",
    )
    const legend = page.getByTestId("color-legend")
    await expect(legend).toBeVisible()
    const legendText = await legend.textContent()
    expect(legendText).toMatch(/m/)
  })

  test("switches to cadence metric and updates legend", async ({ page }) => {
    await navigateToMap(page)

    await page.getByTestId("metric-selector").click()
    await page.getByTestId("metric-option-cadence").click()

    await expect(page.getByTestId("metric-selector")).toContainText(
      "Color: Cadence",
    )
    const legend = page.getByTestId("color-legend")
    await expect(legend).toBeVisible()
    const legendText = await legend.textContent()
    expect(legendText).toMatch(/spm/)
  })

  test("hides legend when None is selected", async ({ page }) => {
    await navigateToMap(page)

    // First verify legend is visible with default metric
    await expect(page.getByTestId("color-legend")).toBeVisible()

    await page.getByTestId("metric-selector").click()
    await page.getByTestId("metric-option-none").click()

    await expect(page.getByTestId("metric-selector")).toContainText(
      "Color: None",
    )
    await expect(page.getByTestId("color-legend")).not.toBeVisible()
  })

  test("legend updates when switching unit system", async ({ page }) => {
    await navigateToMap(page)

    // Default metric is pace, default unit is metric
    const legend = page.getByTestId("color-legend")
    const initialText = await legend.textContent()
    expect(initialText).toMatch(/\/km/)

    // Switch to imperial
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.setState({ unitSystem: "imperial" })
    })

    // Legend should now show /mi
    await expect(legend).toContainText("/mi")
  })

  test("map still renders canvas when metric is colored", async ({ page }) => {
    await navigateToMap(page)

    // Map should have a canvas with gradient coloring
    const mapContainer = page.getByTestId("run-map")
    await expect(mapContainer.locator("canvas").first()).toBeVisible({
      timeout: 10000,
    })
  })
})
