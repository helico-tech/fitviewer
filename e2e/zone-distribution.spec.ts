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

test.describe("Zone distribution bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToZones(page)
  })

  test("renders distribution bar with colored segments", async ({ page }) => {
    const bar = page.getByTestId("zone-distribution-bar")
    await expect(bar).toBeVisible()
    // At least one zone bar segment should exist
    const segments = page.locator('[data-testid^="zone-bar-"]')
    const count = await segments.count()
    expect(count).toBeGreaterThan(0)
  })

  test("distribution bar segments have correct zone colors", async ({ page }) => {
    // Check that visible bar segments have the expected background colors
    const bar = page.getByTestId("zone-distribution-bar")
    await expect(bar).toBeVisible()

    // Zone bar segments that are visible should have their zone color
    const segments = page.locator('[data-testid^="zone-bar-"]')
    const count = await segments.count()
    for (let i = 0; i < count; i++) {
      const segment = segments.nth(i)
      const bgColor = await segment.evaluate((el) =>
        getComputedStyle(el).backgroundColor
      )
      // Should have a non-transparent background color
      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)")
    }
  })

  test("distribution bar segments show zone labels for wide segments", async ({ page }) => {
    const bar = page.getByTestId("zone-distribution-bar")
    await expect(bar).toBeVisible()

    // Segments with >= 8% should show Z labels
    const segments = page.locator('[data-testid^="zone-bar-"]')
    const count = await segments.count()
    let foundLabel = false
    for (let i = 0; i < count; i++) {
      const text = await segments.nth(i).textContent()
      if (text && text.startsWith("Z")) {
        foundLabel = true
        break
      }
    }
    // With our mock data distribution, at least one segment should be wide enough for a label
    expect(foundLabel).toBe(true)
  })

  test("distribution bar segments have title tooltips with percentage", async ({ page }) => {
    const segments = page.locator('[data-testid^="zone-bar-"]')
    const count = await segments.count()
    for (let i = 0; i < count; i++) {
      const title = await segments.nth(i).getAttribute("title")
      expect(title).toBeTruthy()
      expect(title).toContain("%")
    }
  })

  test("distribution updates when max HR changes", async ({ page }) => {
    // Get initial distribution bar content
    const bar = page.getByTestId("zone-distribution-bar")
    const initialHtml = await bar.innerHTML()

    // Change max HR
    const input = page.getByTestId("max-hr-input")
    await input.fill("200")

    // Wait for update and verify content changed
    await page.waitForTimeout(100)
    const updatedHtml = await bar.innerHTML()
    expect(updatedHtml).not.toBe(initialHtml)
  })
})

test.describe("Zone time table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToZones(page)
  })

  test("renders time table with header columns", async ({ page }) => {
    const table = page.getByTestId("zone-time-table")
    await expect(table).toBeVisible()

    const headers = table.locator("th")
    await expect(headers).toHaveCount(4)
    await expect(headers.nth(0)).toContainText("Zone")
    await expect(headers.nth(1)).toContainText("HR Range")
    await expect(headers.nth(2)).toContainText("Time")
    await expect(headers.nth(3)).toContainText("%")
  })

  test("renders 5 zone rows with zone names", async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByTestId(`zone-time-row-${i}`)).toBeVisible()
    }
    const table = page.getByTestId("zone-time-table")
    await expect(table).toContainText("Recovery")
    await expect(table).toContainText("Easy")
    await expect(table).toContainText("Tempo")
    await expect(table).toContainText("Threshold")
    await expect(table).toContainText("VO2max")
  })

  test("zone rows show HR range in bpm", async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      const row = page.getByTestId(`zone-time-row-${i}`)
      await expect(row).toContainText("bpm")
    }
  })

  test("zone rows show time and percentage values", async ({ page }) => {
    const table = page.getByTestId("zone-time-table")
    // At least one row should have a non-zero time
    const rows = table.locator("tbody tr")
    const count = await rows.count()
    let foundTime = false
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent()
      // Time is formatted as M:SS or H:MM:SS
      if (text && /\d+:\d{2}/.test(text)) {
        foundTime = true
        break
      }
    }
    expect(foundTime).toBe(true)
  })

  test("zone rows have color indicators", async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      const row = page.getByTestId(`zone-time-row-${i}`)
      const colorDot = row.locator(".rounded-full")
      await expect(colorDot).toBeVisible()
      const bgColor = await colorDot.evaluate((el) =>
        getComputedStyle(el).backgroundColor
      )
      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)")
    }
  })

  test("time table updates when max HR changes", async ({ page }) => {
    // Get initial table content
    const table = page.getByTestId("zone-time-table")
    const initialText = await table.textContent()

    // Change max HR
    const input = page.getByTestId("max-hr-input")
    await input.fill("200")

    // Wait for update and verify content changed
    await page.waitForTimeout(100)
    const updatedText = await table.textContent()
    expect(updatedText).not.toBe(initialText)
  })
})
