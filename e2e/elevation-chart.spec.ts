import { test, expect, Page } from "@playwright/test"

const mockRecords = Array.from({ length: 100 }, (_, i) => ({
  timestamp: new Date(Date.now() + i * 30000).toISOString(),
  lat: 52.52 + (i / 99) * 0.01,
  lon: 13.405 + (i / 99) * 0.01,
  altitude: 50 + Math.sin((i / 99) * Math.PI * 2) * 30, // 20–80m range
  heartRate: 150,
  pace: 300,
  speed: 3.5,
  cadence: 175,
  strideLength: 1.1,
  distance: i * 100, // 0 to 9900m
}))

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 9900,
    totalTime: 3000,
    movingTime: 2950,
    avgPace: 300,
    avgHeartRate: 150,
    maxHeartRate: 185,
    avgCadence: 175,
    totalAscent: 60,
    totalDescent: 60,
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

test.describe("ElevationChart", () => {
  test("renders elevation chart on Charts tab", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")
    await expect(chart).toBeVisible()

    // Should contain an SVG (Recharts renders as SVG)
    await expect(chart.locator("svg").first()).toBeVisible()
  })

  test("chart has X-axis with distance labels", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")
    const svgText = await chart.locator("svg").first().textContent()
    expect(svgText).toContain("Distance")
    expect(svgText).toContain("km")
  })

  test("chart has Y-axis with elevation labels", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")
    const svgText = await chart.locator("svg").first().textContent()
    expect(svgText).toContain("Elevation")
  })

  test("renders as a filled area chart", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")
    // AreaChart renders with .recharts-area class containing a filled path
    const area = chart.locator(".recharts-area")
    await expect(area).toBeVisible()
  })

  test("chart is responsive and fills container", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")
    const box = await chart.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(300)
    expect(box!.height).toBeGreaterThanOrEqual(280)
  })

  test("updates to imperial units when unit system changes", async ({
    page,
  }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")

    // Default: metric (km, m)
    let svgText = await chart.locator("svg").first().textContent()
    expect(svgText).toContain("km")
    expect(svgText).toContain("(m)")

    // Switch to imperial
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.setState({ unitSystem: "imperial" })
    })

    // Should now show miles and feet
    svgText = await chart.locator("svg").first().textContent()
    expect(svgText).toContain("mi")
    expect(svgText).toContain("(ft)")
  })

  test("shows tooltip on hover with elevation and distance", async ({
    page,
  }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("elevation-chart")
    await chart.scrollIntoViewIfNeeded()
    const box = await chart.boundingBox()

    // Hover near the middle of the chart
    await page.mouse.move(
      box!.x + box!.width / 2,
      box!.y + box!.height / 2,
    )

    // Tooltip should appear with elevation data
    const tooltip = chart.locator(".recharts-tooltip-wrapper")
    await expect(tooltip).toBeVisible({ timeout: 5000 })
    const tooltipText = await tooltip.textContent()
    expect(tooltipText).toMatch(/\d+\s*m/)
    expect(tooltipText).toMatch(/km/)
  })

  test("all four charts render on Charts tab", async ({ page }) => {
    await navigateToCharts(page)

    await expect(page.getByTestId("pace-chart")).toBeVisible()
    await expect(page.getByTestId("heart-rate-chart")).toBeVisible()
    await expect(page.getByTestId("elevation-chart")).toBeVisible()
    await expect(page.getByTestId("cadence-chart")).toBeVisible()
  })
})
