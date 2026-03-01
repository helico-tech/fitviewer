import { test, expect, Page } from "@playwright/test"

// Generate mock records spanning ~5.2 km with varying pace
function generateMockRecords(count: number, totalDistanceM: number) {
  const startTime = new Date("2026-03-01T07:30:00Z")
  const records = []
  for (let i = 0; i < count; i++) {
    const fraction = i / (count - 1)
    const distance = fraction * totalDistanceM
    const timestamp = new Date(startTime.getTime() + fraction * 1600 * 1000)
    records.push({
      timestamp: timestamp.toISOString(),
      lat: 52.52 + fraction * 0.01,
      lon: 13.405 + fraction * 0.01,
      altitude: 50 + Math.sin(fraction * Math.PI * 4) * 10,
      heartRate: 140 + Math.round(fraction * 30),
      pace: 290 + Math.round(Math.sin(fraction * Math.PI * 2) * 30), // varying pace
      speed: 3.3 + Math.sin(fraction * Math.PI * 2) * 0.3,
      cadence: 170 + Math.round(fraction * 10),
      strideLength: 1.05,
      distance,
    })
  }
  return records
}

const mockRecords = generateMockRecords(200, 5200)

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 5200,
    totalTime: 1600,
    movingTime: 1580,
    avgPace: 308,
    avgHeartRate: 155,
    maxHeartRate: 178,
    avgCadence: 175,
    totalAscent: 40,
    totalDescent: 38,
    calories: 320,
  },
  records: mockRecords,
  laps: [],
  sessions: [],
}

async function loadMockData(page: Page, data = mockRunData) {
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

async function navigateToSplits(page: Page) {
  await page.getByTestId("tab-splits").click()
  await expect(page.getByTestId("tab-content-splits")).toBeVisible()
}

test.describe("Split bar chart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToSplits(page)
  })

  test("renders split bar chart card with title", async ({ page }) => {
    await expect(page.getByTestId("split-bar-chart-card")).toBeVisible()
    await expect(page.getByText("Split Pace Comparison")).toBeVisible()
  })

  test("renders a bar for each split", async ({ page }) => {
    const chart = page.getByTestId("split-bar-chart")
    await expect(chart).toBeVisible()
    // 5.2 km run should produce at least 5 bars
    const bars = chart.locator("[data-testid^='split-bar-']")
    const count = await bars.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test("each bar shows a pace label in M:SS format", async ({ page }) => {
    const firstBar = page.getByTestId("split-bar-1")
    await expect(firstBar).toBeVisible()
    await expect(firstBar).toContainText(/\d+:\d{2}\s*\/km/)
  })

  test("shows fastest badge on the fastest split", async ({ page }) => {
    const badge = page.getByTestId("fastest-badge")
    await expect(badge).toBeVisible()
    await expect(badge).toContainText("Fastest")
  })

  test("shows slowest badge on the slowest split", async ({ page }) => {
    const badge = page.getByTestId("slowest-badge")
    await expect(badge).toBeVisible()
    await expect(badge).toContainText("Slowest")
  })

  test("fastest bar has green fill", async ({ page }) => {
    // Find which split row contains the fastest badge, then check its fill color
    const fastestNum = await page.evaluate(() => {
      const badge = document.querySelector("[data-testid='fastest-badge']")
      const row = badge?.closest("[data-testid^='split-bar-']")
      return row?.getAttribute("data-testid")?.replace("split-bar-", "")
    })
    expect(fastestNum).toBeTruthy()
    const fill = page.getByTestId(`split-bar-fill-${fastestNum}`)
    await expect(fill).toHaveClass(/bg-green-500/)
  })

  test("slowest bar has red fill", async ({ page }) => {
    const slowestNum = await page.evaluate(() => {
      const badge = document.querySelector("[data-testid='slowest-badge']")
      const row = badge?.closest("[data-testid^='split-bar-']")
      return row?.getAttribute("data-testid")?.replace("split-bar-", "")
    })
    expect(slowestNum).toBeTruthy()
    const fill = page.getByTestId(`split-bar-fill-${slowestNum}`)
    await expect(fill).toHaveClass(/bg-red-500/)
  })

  test("bar widths vary based on pace", async ({ page }) => {
    const chart = page.getByTestId("split-bar-chart")
    const fills = chart.locator("[data-testid^='split-bar-fill-']")
    const count = await fills.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Collect widths - they should not all be the same
    const widths = new Set<string>()
    for (let i = 0; i < count; i++) {
      const style = await fills.nth(i).getAttribute("style")
      if (style) widths.add(style)
    }
    expect(widths.size).toBeGreaterThan(1)
  })

  test("switching to imperial updates pace labels", async ({ page }) => {
    await page.getByRole("radio", { name: "mi" }).click()

    const firstBar = page.getByTestId("split-bar-1")
    await expect(firstBar).toContainText(/\/mi/)
  })

  test("chart appears above the splits table", async ({ page }) => {
    const chart = page.getByTestId("split-bar-chart-card")
    const table = page.getByTestId("splits-table-card")
    await expect(chart).toBeVisible()
    await expect(table).toBeVisible()

    // Chart should be above the table in the DOM
    const chartBox = await chart.boundingBox()
    const tableBox = await table.boundingBox()
    expect(chartBox!.y).toBeLessThan(tableBox!.y)
  })
})

test.describe("Split bar chart — edge cases", () => {
  test("does not render when no records", async ({ page }) => {
    await page.goto("/")
    const emptyData = { ...mockRunData, records: [] }
    await loadMockData(page, emptyData)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("split-bar-chart-card")).not.toBeVisible()
  })

  test("no badges when only one split", async ({ page }) => {
    await page.goto("/")
    // Short run with only ~1.1 km — produces 1 full split + maybe 1 partial
    const shortRecords = generateMockRecords(50, 1100)
    const shortData = {
      ...mockRunData,
      summary: { ...mockRunData.summary, totalDistance: 1100 },
      records: shortRecords,
    }
    await loadMockData(page, shortData)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await page.getByTestId("tab-splits").click()

    // With only 1 split, no badges should appear
    const chart = page.getByTestId("split-bar-chart")
    if (await chart.isVisible()) {
      await expect(page.getByTestId("fastest-badge")).not.toBeVisible()
      await expect(page.getByTestId("slowest-badge")).not.toBeVisible()
    }
  })
})
