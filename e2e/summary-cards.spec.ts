import { test, expect, Page } from "@playwright/test"

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 10230,
    totalTime: 3134,
    movingTime: 3100,
    avgPace: 306,
    avgHeartRate: 155,
    maxHeartRate: 178,
    avgCadence: 172,
    totalAscent: 85,
    totalDescent: 82,
    calories: 620,
  },
  records: [],
  laps: [],
  sessions: [],
}

async function loadMockData(page: Page, overrides: Record<string, any> = {}) {
  const data = {
    ...mockRunData,
    summary: { ...mockRunData.summary, ...overrides },
  }
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
        },
        isLoading: false,
        error: null,
      })
    }
  }, data)
}

test.describe("Summary cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("renders all six summary cards", async ({ page }) => {
    await expect(page.getByTestId("summary-cards")).toBeVisible()
    await expect(page.getByTestId("distance")).toBeVisible()
    await expect(page.getByTestId("duration")).toBeVisible()
    await expect(page.getByTestId("avg-pace")).toBeVisible()
    await expect(page.getByTestId("avg-hr")).toBeVisible()
    await expect(page.getByTestId("calories")).toBeVisible()
    await expect(page.getByTestId("elevation")).toBeVisible()
  })

  test("formats distance correctly as km with two decimals", async ({
    page,
  }) => {
    // 10230 meters → 10.23 km
    await expect(page.getByTestId("distance")).toContainText("10.23 km")
  })

  test("formats duration correctly as mm:ss or h:mm:ss", async ({ page }) => {
    // 3134 seconds → 52:14
    await expect(page.getByTestId("duration")).toContainText("52:14")
  })

  test("formats average pace correctly as min:sec /km", async ({ page }) => {
    // 306 sec/km → 5:06 /km
    await expect(page.getByTestId("avg-pace")).toContainText("5:06 /km")
  })

  test("formats average heart rate with bpm unit", async ({ page }) => {
    await expect(page.getByTestId("avg-hr")).toContainText("155 bpm")
  })

  test("displays calories as whole number", async ({ page }) => {
    await expect(page.getByTestId("calories")).toContainText("620")
  })

  test("formats elevation gain with m unit", async ({ page }) => {
    await expect(page.getByTestId("elevation")).toContainText("85 m")
  })

  test("shows em dash for missing heart rate", async ({ page }) => {
    await loadMockData(page, { avgHeartRate: 0 })
    await expect(page.getByTestId("avg-hr")).toContainText("—")
  })

  test("shows em dash for missing calories", async ({ page }) => {
    await loadMockData(page, { calories: 0 })
    await expect(page.getByTestId("calories")).toContainText("—")
  })

  test("shows em dash for missing elevation", async ({ page }) => {
    await loadMockData(page, { totalAscent: 0 })
    await expect(page.getByTestId("elevation")).toContainText("—")
  })

  test("formats duration with hours for long runs", async ({ page }) => {
    // 4500 seconds → 1:15:00
    await loadMockData(page, { totalTime: 4500 })
    await expect(page.getByTestId("duration")).toContainText("1:15:00")
  })

  test("handles invalid pace gracefully", async ({ page }) => {
    await loadMockData(page, { avgPace: Infinity })
    await expect(page.getByTestId("avg-pace")).toContainText("--:--")
  })
})
