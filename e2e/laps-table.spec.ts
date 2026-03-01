import { test, expect, Page } from "@playwright/test"

const startTime = new Date("2026-03-01T07:30:00Z")

// Generate mock records spanning ~5.2 km with realistic data
function generateMockRecords(count: number, totalDistanceM: number) {
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
      pace: 290 + Math.round(Math.sin(fraction * Math.PI * 2) * 20),
      speed: 3.3 + Math.sin(fraction * Math.PI * 2) * 0.3,
      cadence: 170 + Math.round(fraction * 10),
      strideLength: 1.05,
      distance,
    })
  }
  return records
}

const mockRecords = generateMockRecords(200, 5200)

function makeLaps(types: Array<"auto" | "manual">) {
  const perLap = Math.floor(mockRecords.length / types.length)
  return types.map((type, i) => ({
    type,
    startIndex: i * perLap,
    endIndex: Math.min((i + 1) * perLap - 1, mockRecords.length - 1),
    distance: 5200 / types.length,
    totalTime: 1600 / types.length,
    avgPace: 308,
    avgHeartRate: 155,
    avgCadence: 175,
    elevationGain: 10,
  }))
}

const mockRunData = {
  summary: {
    startTime: startTime.toISOString(),
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
  laps: makeLaps(["manual", "manual", "auto"]),
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

test.describe("Laps table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToSplits(page)
  })

  test("renders laps table card with title", async ({ page }) => {
    await expect(page.getByTestId("laps-table-card")).toBeVisible()
    await expect(page.getByText("Laps")).toBeVisible()
  })

  test("renders the correct number of lap rows", async ({ page }) => {
    const table = page.getByTestId("laps-table")
    await expect(table).toBeVisible()
    const rows = table.locator("tbody tr")
    await expect(rows).toHaveCount(3)
  })

  test("displays all required columns", async ({ page }) => {
    const table = page.getByTestId("laps-table")
    await expect(table.getByText("#")).toBeVisible()
    await expect(table.getByText("Dist (km)")).toBeVisible()
    await expect(table.getByText("Pace")).toBeVisible()
    await expect(table.getByText("Avg HR")).toBeVisible()
    await expect(table.getByText("Avg Cad")).toBeVisible()
    await expect(table.getByText("Elev +/-")).toBeVisible()
    await expect(table.getByText("Time")).toBeVisible()
  })

  test("shows type column when both auto and manual laps exist", async ({
    page,
  }) => {
    const table = page.getByTestId("laps-table")
    await expect(table.getByText("Type")).toBeVisible()
    // First two laps are manual, third is auto
    await expect(page.getByTestId("lap-type-1")).toContainText("Manual")
    await expect(page.getByTestId("lap-type-2")).toContainText("Manual")
    await expect(page.getByTestId("lap-type-3")).toContainText("Auto")
  })

  test("hides type column when all laps are the same type", async ({
    page,
  }) => {
    const dataAllManual = {
      ...mockRunData,
      laps: makeLaps(["manual", "manual"]),
    }
    await loadMockData(page, dataAllManual)
    await navigateToSplits(page)
    const table = page.getByTestId("laps-table")
    await expect(table).toBeVisible()
    // Type column should NOT be visible
    await expect(table.getByText("Type")).not.toBeVisible()
  })

  test("lap rows contain pace in M:SS format", async ({ page }) => {
    const firstRow = page.getByTestId("lap-row-1")
    await expect(firstRow).toContainText(/\d+:\d{2}\s*\/km/)
  })

  test("lap rows contain heart rate in bpm", async ({ page }) => {
    const firstRow = page.getByTestId("lap-row-1")
    await expect(firstRow).toContainText(/\d+\s*bpm/)
  })

  test("lap rows contain cadence in spm", async ({ page }) => {
    const firstRow = page.getByTestId("lap-row-1")
    await expect(firstRow).toContainText(/\d+\s*spm/)
  })

  test("lap rows contain elevation change", async ({ page }) => {
    const firstRow = page.getByTestId("lap-row-1")
    await expect(firstRow).toContainText(/\+\d+\s*\/\s*-\d+\s*m/)
  })

  test("lap rows contain time", async ({ page }) => {
    const firstRow = page.getByTestId("lap-row-1")
    const timeCell = firstRow.locator("td").last()
    await expect(timeCell).toContainText(/\d+:\d{2}/)
  })

  test("switching to imperial changes distance and pace units", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "mi" }).click()
    const table = page.getByTestId("laps-table")
    await expect(table.getByText("Dist (mi)")).toBeVisible()
    const firstRow = page.getByTestId("lap-row-1")
    await expect(firstRow).toContainText(/\/mi/)
  })
})

test.describe("Laps table — no laps", () => {
  test("shows no-laps message when laps array is empty", async ({ page }) => {
    await page.goto("/")
    const noLapsData = {
      ...mockRunData,
      laps: [],
    }
    await loadMockData(page, noLapsData)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("no-laps")).toBeVisible()
    await expect(page.getByText("No laps recorded")).toBeVisible()
  })
})
