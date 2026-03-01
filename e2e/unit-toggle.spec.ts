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
        },
        isLoading: false,
        error: null,
      })
    }
  }, mockRunData)
}

test.describe("Unit toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("renders unit toggle with km selected by default", async ({ page }) => {
    const toggle = page.getByTestId("unit-toggle")
    await expect(toggle).toBeVisible()
    const kmBtn = page.getByTestId("unit-km")
    await expect(kmBtn).toHaveAttribute("aria-checked", "true")
    const miBtn = page.getByTestId("unit-mi")
    await expect(miBtn).toHaveAttribute("aria-checked", "false")
  })

  test("shows metric values by default", async ({ page }) => {
    await expect(page.getByTestId("distance")).toContainText("10.23 km")
    await expect(page.getByTestId("avg-pace")).toContainText("5:06 /km")
    await expect(page.getByTestId("elevation")).toContainText("85 m")
  })

  test("switching to miles updates distance, pace, and elevation", async ({
    page,
  }) => {
    await page.getByTestId("unit-mi").click()

    // 10230m / 1609.34 = 6.356 → 6.36 mi
    await expect(page.getByTestId("distance")).toContainText("6.36 mi")
    // 306 sec/km * 1.60934 = 492.46 sec/mi → 8:12 /mi
    await expect(page.getByTestId("avg-pace")).toContainText("8:12 /mi")
    // 85m * 3.28084 = 279 ft
    await expect(page.getByTestId("elevation")).toContainText("279 ft")
  })

  test("switching back to km restores metric values", async ({ page }) => {
    // Switch to miles first
    await page.getByTestId("unit-mi").click()
    await expect(page.getByTestId("distance")).toContainText("mi")

    // Switch back to km
    await page.getByTestId("unit-km").click()
    await expect(page.getByTestId("distance")).toContainText("10.23 km")
    await expect(page.getByTestId("avg-pace")).toContainText("5:06 /km")
    await expect(page.getByTestId("elevation")).toContainText("85 m")
  })

  test("duration, heart rate, and calories are not affected by toggle", async ({
    page,
  }) => {
    // Note original values
    await expect(page.getByTestId("duration")).toContainText("52:14")
    await expect(page.getByTestId("avg-hr")).toContainText("155 bpm")
    await expect(page.getByTestId("calories")).toContainText("620")

    // Switch to miles
    await page.getByTestId("unit-mi").click()

    // These should remain the same
    await expect(page.getByTestId("duration")).toContainText("52:14")
    await expect(page.getByTestId("avg-hr")).toContainText("155 bpm")
    await expect(page.getByTestId("calories")).toContainText("620")
  })

  test("toggle highlights the active unit button", async ({ page }) => {
    // km should be active initially
    const kmBtn = page.getByTestId("unit-km")
    const miBtn = page.getByTestId("unit-mi")
    await expect(kmBtn).toHaveAttribute("aria-checked", "true")
    await expect(miBtn).toHaveAttribute("aria-checked", "false")

    // Switch to mi
    await miBtn.click()
    await expect(miBtn).toHaveAttribute("aria-checked", "true")
    await expect(kmBtn).toHaveAttribute("aria-checked", "false")
  })
})
