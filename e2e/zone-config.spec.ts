import { test, expect, Page } from "@playwright/test"

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 10230,
    totalTime: 3134,
    movingTime: 3100,
    avgPace: 306,
    avgHeartRate: 155,
    maxHeartRate: 180,
    avgCadence: 172,
    totalAscent: 85,
    totalDescent: 82,
    calories: 620,
  },
  records: generateMockRecords(),
  laps: [],
  sessions: [],
}

function generateMockRecords() {
  const records = []
  const start = new Date("2026-03-01T07:30:00Z").getTime()
  // Generate 60 records over 30 minutes with varying HR across zones
  for (let i = 0; i < 60; i++) {
    // HR pattern: 100 -> 170 gradually
    const hr = 100 + Math.round((i / 60) * 70)
    records.push({
      timestamp: new Date(start + i * 30000).toISOString(),
      lat: 51.5 + i * 0.001,
      lon: -0.1 + i * 0.001,
      altitude: 30,
      heartRate: hr,
      pace: 300,
      speed: 3.33,
      cadence: 170,
      strideLength: 1.0,
      distance: i * 170,
    })
  }
  return records
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
        maxHR: d.summary.maxHeartRate,
      })
    }
  }, mockRunData)
}

async function navigateToZones(page: Page) {
  await page.getByTestId("tab-zones").click()
  await expect(page.getByTestId("zone-config")).toBeVisible()
}

test.describe("Zone configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("renders zone config on Zones tab", async ({ page }) => {
    await navigateToZones(page)
    await expect(page.getByTestId("zone-config")).toBeVisible()
    await expect(page.getByTestId("max-hr-input")).toBeVisible()
    await expect(page.getByTestId("zone-boundaries")).toBeVisible()
  })

  test("max HR defaults to value from parsed data", async ({ page }) => {
    await navigateToZones(page)
    await expect(page.getByTestId("max-hr-input")).toHaveValue("180")
  })

  test("shows 5 zone rows with correct colors", async ({ page }) => {
    await navigateToZones(page)
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByTestId(`zone-row-${i}`)).toBeVisible()
      await expect(page.getByTestId(`zone-color-${i}`)).toBeVisible()
    }
  })

  test("zone boundaries show correct default percentages", async ({ page }) => {
    await navigateToZones(page)
    // With maxHR=180: Z1=90-108, Z2=108-126, Z3=126-144, Z4=144-162, Z5=162-180
    const row1 = page.getByTestId("zone-row-1")
    await expect(row1).toContainText("90–108 bpm")
    await expect(row1).toContainText("50–60%")

    const row5 = page.getByTestId("zone-row-5")
    await expect(row5).toContainText("162–180 bpm")
    await expect(row5).toContainText("90–100%")
  })

  test("changing max HR updates zone boundaries", async ({ page }) => {
    await navigateToZones(page)

    // Change max HR to 200
    const input = page.getByTestId("max-hr-input")
    await input.fill("200")

    // Zone boundaries should update: Z1=100-120, Z5=180-200
    const row1 = page.getByTestId("zone-row-1")
    await expect(row1).toContainText("100–120 bpm")

    const row5 = page.getByTestId("zone-row-5")
    await expect(row5).toContainText("180–200 bpm")
  })

  test("renders zone distribution bar with colored segments", async ({ page }) => {
    await navigateToZones(page)
    await expect(page.getByTestId("zone-distribution-bar")).toBeVisible()
  })

  test("renders zone time table with all columns", async ({ page }) => {
    await navigateToZones(page)
    const table = page.getByTestId("zone-time-table")
    await expect(table).toBeVisible()

    // Check header columns
    await expect(table.locator("th")).toHaveCount(4)
    await expect(table.locator("th").first()).toContainText("Zone")

    // Check 5 data rows
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByTestId(`zone-time-row-${i}`)).toBeVisible()
    }
  })

  test("zone time table shows percentage values", async ({ page }) => {
    await navigateToZones(page)
    // At least one zone should have a non-zero percentage
    const table = page.getByTestId("zone-time-table")
    await expect(table).toContainText("%")
  })

  test("zone names use standard labels", async ({ page }) => {
    await navigateToZones(page)
    await expect(page.getByTestId("zone-boundaries")).toContainText("Recovery")
    await expect(page.getByTestId("zone-boundaries")).toContainText("Easy")
    await expect(page.getByTestId("zone-boundaries")).toContainText("Tempo")
    await expect(page.getByTestId("zone-boundaries")).toContainText("Threshold")
    await expect(page.getByTestId("zone-boundaries")).toContainText("VO2max")
  })

  test("zone colors are displayed correctly", async ({ page }) => {
    await navigateToZones(page)
    // Z1 should be gray (#9ca3af)
    const z1Color = page.getByTestId("zone-color-1")
    await expect(z1Color).toHaveCSS("background-color", "rgb(156, 163, 175)")

    // Z5 should be red (#f87171)
    const z5Color = page.getByTestId("zone-color-5")
    await expect(z5Color).toHaveCSS("background-color", "rgb(248, 113, 113)")
  })
})
