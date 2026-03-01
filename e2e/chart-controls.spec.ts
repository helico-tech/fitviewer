import { test, expect, Page } from "@playwright/test"

const mockRecords = Array.from({ length: 100 }, (_, i) => ({
  timestamp: new Date(Date.now() + i * 30000).toISOString(),
  lat: 52.52 + (i / 99) * 0.01,
  lon: 13.405 + (i / 99) * 0.01,
  altitude: 35 + Math.sin((i / 99) * Math.PI * 2) * 10,
  heartRate: 140 + Math.floor(i * 0.3),
  pace: 270 + Math.sin((i / 99) * Math.PI) * 30,
  speed: 3.5 + Math.random() * 0.5,
  cadence: 170 + Math.floor(i * 0.1),
  strideLength: 1.1 + Math.random() * 0.1,
  distance: i * 100, // 0 to 9900m
}))

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 9900,
    totalTime: 3000,
    movingTime: 2950,
    avgPace: 300,
    avgHeartRate: 155,
    maxHeartRate: 175,
    avgCadence: 175,
    totalAscent: 20,
    totalDescent: 20,
    calories: 300,
  },
  records: mockRecords,
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

async function navigateToCharts(page: Page) {
  await page.goto("/")
  await loadMockData(page)
  await expect(page.getByTestId("dashboard")).toBeVisible()
  await page.getByTestId("tab-charts").click()
}

test.describe("ChartControls", () => {
  test("renders chart controls above charts", async ({ page }) => {
    await navigateToCharts(page)

    const controls = page.getByTestId("chart-controls")
    await expect(controls).toBeVisible()

    // Controls should appear before the pace chart
    const controlBox = await controls.boundingBox()
    const chartBox = await page.getByTestId("pace-chart").boundingBox()
    expect(controlBox!.y).toBeLessThan(chartBox!.y)
  })

  test("X-axis toggle defaults to Distance", async ({ page }) => {
    await navigateToCharts(page)

    const distBtn = page.getByTestId("xaxis-distance")
    const timeBtn = page.getByTestId("xaxis-time")

    await expect(distBtn).toHaveAttribute("aria-checked", "true")
    await expect(timeBtn).toHaveAttribute("aria-checked", "false")
  })

  test("toggling X-axis to Time updates all chart labels", async ({ page }) => {
    await navigateToCharts(page)

    // Initially all charts show Distance label
    for (const chartId of ["pace-chart", "heart-rate-chart", "elevation-chart", "cadence-chart"]) {
      const text = await page.getByTestId(chartId).locator("svg").first().textContent()
      expect(text).toContain("Distance")
    }

    // Click Time toggle
    await page.getByTestId("xaxis-time").click()

    // Now all charts should show Time label
    for (const chartId of ["pace-chart", "heart-rate-chart", "elevation-chart", "cadence-chart"]) {
      const text = await page.getByTestId(chartId).locator("svg").first().textContent()
      expect(text).toContain("Time (min)")
    }
  })

  test("toggling X-axis back to Distance works", async ({ page }) => {
    await navigateToCharts(page)

    // Switch to time
    await page.getByTestId("xaxis-time").click()
    await expect(page.getByTestId("xaxis-time")).toHaveAttribute("aria-checked", "true")

    // Switch back to distance
    await page.getByTestId("xaxis-distance").click()
    await expect(page.getByTestId("xaxis-distance")).toHaveAttribute("aria-checked", "true")

    const text = await page.getByTestId("pace-chart").locator("svg").first().textContent()
    expect(text).toContain("Distance")
  })

  test("smoothing slider renders with default value", async ({ page }) => {
    await navigateToCharts(page)

    const slider = page.getByTestId("smoothing-slider")
    await expect(slider).toBeVisible()

    const value = page.getByTestId("smoothing-value")
    await expect(value).toHaveText("10")
  })

  test("changing smoothing slider updates display value", async ({ page }) => {
    await navigateToCharts(page)

    // Change smoothing via the store to verify the display updates
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.setState({ smoothingWindow: 20 })
    })

    await expect(page.getByTestId("smoothing-value")).toHaveText("20")
  })

  test("smoothing value is clamped to 1-30", async ({ page }) => {
    await navigateToCharts(page)

    // Try setting below minimum
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.getState().setSmoothingWindow(0)
    })
    await expect(page.getByTestId("smoothing-value")).toHaveText("1")

    // Try setting above maximum
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.getState().setSmoothingWindow(50)
    })
    await expect(page.getByTestId("smoothing-value")).toHaveText("30")
  })

  test("time X-axis tooltip shows minutes", async ({ page }) => {
    await navigateToCharts(page)

    // Switch to time
    await page.getByTestId("xaxis-time").click()

    const chart = page.getByTestId("pace-chart")
    const box = await chart.boundingBox()

    // Hover near the middle
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)

    const tooltip = chart.locator(".recharts-tooltip-wrapper")
    await expect(tooltip).toBeVisible({ timeout: 5000 })
    const tooltipText = await tooltip.textContent()
    expect(tooltipText).toContain("min")
  })

  test("chart controls state persists across tab switches", async ({ page }) => {
    await navigateToCharts(page)

    // Change to time axis
    await page.getByTestId("xaxis-time").click()
    await expect(page.getByTestId("xaxis-time")).toHaveAttribute("aria-checked", "true")

    // Switch to another tab and back
    await page.getByTestId("tab-overview").click()
    await page.getByTestId("tab-charts").click()

    // Settings should persist
    await expect(page.getByTestId("xaxis-time")).toHaveAttribute("aria-checked", "true")
    const text = await page.getByTestId("pace-chart").locator("svg").first().textContent()
    expect(text).toContain("Time (min)")
  })
})
