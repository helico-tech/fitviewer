import { test, expect, Page } from "@playwright/test"

// Generate mock records spanning ~5.2 km with realistic data
function generateMockRecords(count: number, totalDistanceM: number) {
  const startTime = new Date("2026-03-01T07:30:00Z")
  const records = []
  for (let i = 0; i < count; i++) {
    const fraction = i / (count - 1)
    const distance = fraction * totalDistanceM
    const timestamp = new Date(startTime.getTime() + fraction * 1600 * 1000) // ~26 min run
    records.push({
      timestamp: timestamp.toISOString(),
      lat: 52.52 + fraction * 0.01,
      lon: 13.405 + fraction * 0.01,
      altitude: 50 + Math.sin(fraction * Math.PI * 4) * 10, // oscillating elevation
      heartRate: 140 + Math.round(fraction * 30), // 140-170 bpm
      pace: 290 + Math.round(Math.sin(fraction * Math.PI * 2) * 20), // ~4:50-5:10
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

test.describe("Splits table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToSplits(page)
  })

  test("renders splits table card with title", async ({ page }) => {
    await expect(page.getByTestId("splits-table-card")).toBeVisible()
    await expect(page.getByText("Auto Splits (per km)")).toBeVisible()
  })

  test("renders the correct number of split rows", async ({ page }) => {
    const table = page.getByTestId("splits-table")
    await expect(table).toBeVisible()
    // 5.2 km run should produce 5 full splits + 1 partial (>10% of 1km)
    const rows = table.locator("tbody tr")
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test("displays all required columns", async ({ page }) => {
    const table = page.getByTestId("splits-table")
    await expect(table.getByText("#")).toBeVisible()
    await expect(table.getByText("Dist (km)")).toBeVisible()
    await expect(table.getByText("Pace")).toBeVisible()
    await expect(table.getByText("Avg HR")).toBeVisible()
    await expect(table.getByText("Avg Cad")).toBeVisible()
    await expect(table.getByText("Elev +/-")).toBeVisible()
    await expect(table.getByText("Time")).toBeVisible()
  })

  test("first split row shows split number 1", async ({ page }) => {
    const firstRow = page.getByTestId("split-row-1")
    await expect(firstRow).toBeVisible()
    await expect(firstRow.locator("td").first()).toContainText("1")
  })

  test("split rows contain pace in M:SS format", async ({ page }) => {
    const firstRow = page.getByTestId("split-row-1")
    // Pace should match pattern like "5:08 /km"
    await expect(firstRow).toContainText(/\d+:\d{2}\s*\/km/)
  })

  test("split rows contain heart rate in bpm", async ({ page }) => {
    const firstRow = page.getByTestId("split-row-1")
    await expect(firstRow).toContainText(/\d+\s*bpm/)
  })

  test("split rows contain cadence in spm", async ({ page }) => {
    const firstRow = page.getByTestId("split-row-1")
    await expect(firstRow).toContainText(/\d+\s*spm/)
  })

  test("split rows contain elevation change", async ({ page }) => {
    const firstRow = page.getByTestId("split-row-1")
    // Should match pattern like "+5 / -3 m"
    await expect(firstRow).toContainText(/\+\d+\s*\/\s*-\d+\s*m/)
  })

  test("split rows contain time", async ({ page }) => {
    const firstRow = page.getByTestId("split-row-1")
    // Should match pattern like "5:08" (M:SS)
    const timeCell = firstRow.locator("td").last()
    await expect(timeCell).toContainText(/\d+:\d{2}/)
  })

  test("switching to imperial changes to per-mile splits", async ({ page }) => {
    // Switch to imperial
    await page.getByRole("radio", { name: "mi" }).click()

    // Title should change
    await expect(page.getByText("Auto Splits (per mile)")).toBeVisible()

    // Column header should show mi
    const table = page.getByTestId("splits-table")
    await expect(table.getByText("Dist (mi)")).toBeVisible()

    // Pace should show /mi
    const firstRow = page.getByTestId("split-row-1")
    await expect(firstRow).toContainText(/\/mi/)
  })

  test("imperial splits produce fewer rows (miles > km)", async ({ page }) => {
    // Count metric rows
    const metricRows = await page
      .getByTestId("splits-table")
      .locator("tbody tr")
      .count()

    // Switch to imperial
    await page.getByRole("radio", { name: "mi" }).click()

    // Count imperial rows — should be fewer since miles > km
    const imperialRows = await page
      .getByTestId("splits-table")
      .locator("tbody tr")
      .count()

    expect(imperialRows).toBeLessThan(metricRows)
  })
})

test.describe("Splits table — empty data", () => {
  test("shows no-data message when records are empty", async ({ page }) => {
    await page.goto("/")
    const emptyData = {
      ...mockRunData,
      records: [],
    }
    await loadMockData(page, emptyData)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("no-splits")).toBeVisible()
    await expect(page.getByText("No split data available")).toBeVisible()
  })
})
