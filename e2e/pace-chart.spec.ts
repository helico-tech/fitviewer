import { test, expect, Page } from "@playwright/test"

const mockRecords = Array.from({ length: 100 }, (_, i) => ({
  timestamp: new Date(Date.now() + i * 30000).toISOString(),
  lat: 52.52 + (i / 99) * 0.01,
  lon: 13.405 + (i / 99) * 0.01,
  altitude: 35 + Math.sin((i / 99) * Math.PI * 2) * 10,
  heartRate: 140 + Math.floor(i * 0.3),
  pace: 270 + Math.sin((i / 99) * Math.PI) * 30, // varies ~4:00–5:00 /km
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

test.describe("PaceChart", () => {
  test("renders pace chart on Charts tab", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    await expect(chart).toBeVisible()

    // Should contain an SVG (Recharts renders as SVG)
    await expect(chart.locator("svg").first()).toBeVisible()
  })

  test("chart has X-axis with distance labels", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    // X-axis should have distance tick labels (numbers like 1.0, 2.0, etc.)
    const svgText = await chart.locator("svg").first().textContent()
    // Should contain distance values and the label
    expect(svgText).toContain("Distance")
    expect(svgText).toContain("km")
  })

  test("chart has Y-axis with pace labels", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    const svgText = await chart.locator("svg").first().textContent()
    // Should contain pace label and formatted pace values (M:SS format)
    expect(svgText).toContain("Pace")
    expect(svgText).toMatch(/\d+:\d{2}/)
  })

  test("Y-axis is inverted (faster pace at top)", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    // Collect all Y-axis tick values with their Y positions from the SVG
    const tickData = await chart.evaluate((el) => {
      const svg = el.querySelector("svg")
      if (!svg) return []
      // Find all text elements that contain M:SS pace format
      const texts = svg.querySelectorAll("text")
      const paceTexts: { text: string; y: number }[] = []
      texts.forEach((t) => {
        const content = t.textContent?.trim() || ""
        if (/^\d+:\d{2}$/.test(content)) {
          const rect = t.getBoundingClientRect()
          paceTexts.push({ text: content, y: rect.y })
        }
      })
      return paceTexts
    })

    expect(tickData.length).toBeGreaterThan(1)

    // Parse M:SS to seconds
    const parseTime = (t: string) => {
      const [m, s] = t.split(":").map(Number)
      return m * 60 + s
    }

    // Sort by Y position (top = smallest Y)
    tickData.sort((a, b) => a.y - b.y)
    const topValue = parseTime(tickData[0].text)
    const bottomValue = parseTime(tickData[tickData.length - 1].text)

    // With reversed Y-axis, top value (faster pace) should be smaller
    expect(topValue).toBeLessThan(bottomValue)
  })

  test("chart is responsive and fills container", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    const box = await chart.boundingBox()
    expect(box).not.toBeNull()
    // Chart should have significant width (fill parent container)
    expect(box!.width).toBeGreaterThan(300)
    // Chart should have the expected height (h-72 = 18rem = 288px or h-80 = 320px)
    expect(box!.height).toBeGreaterThanOrEqual(280)
  })

  test("updates to imperial units when unit system changes", async ({
    page,
  }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")

    // Default: metric (km)
    let svgText = await chart.locator("svg").first().textContent()
    expect(svgText).toContain("km")

    // Switch to imperial
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) storeApi.setState({ unitSystem: "imperial" })
    })

    // Should now show miles
    svgText = await chart.locator("svg").first().textContent()
    expect(svgText).toContain("mi")
  })

  test("shows tooltip on hover with pace and distance", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    const box = await chart.boundingBox()

    // Hover near the middle of the chart
    await page.mouse.move(
      box!.x + box!.width / 2,
      box!.y + box!.height / 2,
    )

    // Tooltip should appear with pace data (M:SS format and unit)
    const tooltip = chart.locator(".recharts-tooltip-wrapper")
    await expect(tooltip).toBeVisible({ timeout: 5000 })
    const tooltipText = await tooltip.textContent()
    expect(tooltipText).toMatch(/\d+:\d{2}/)
    expect(tooltipText).toMatch(/km/)
  })

  test("renders chart line (path element exists)", async ({ page }) => {
    await navigateToCharts(page)

    const chart = page.getByTestId("pace-chart")
    // Recharts renders the Line as a path inside .recharts-line
    const line = chart.locator(".recharts-line-curve")
    await expect(line).toBeVisible()
  })
})
