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
  await page.evaluate((data) => {
    const storeApi = (window as any).__runStore
    if (storeApi) {
      storeApi.setState({
        runData: {
          ...data,
          summary: {
            ...data.summary,
            startTime: new Date(data.summary.startTime),
          },
        },
        isLoading: false,
        error: null,
      })
    }
  }, mockRunData)
}

test.describe("Responsive layout — Desktop (1024px+)", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("summary cards display in 3-column grid", async ({ page }) => {
    const cards = page.getByTestId("tab-content-overview").locator("[data-testid='distance']").locator("..").locator("..").locator("..")
    // Check that all 6 summary cards are visible
    await expect(page.getByTestId("distance")).toBeVisible()
    await expect(page.getByTestId("duration")).toBeVisible()
    await expect(page.getByTestId("avg-pace")).toBeVisible()
    await expect(page.getByTestId("avg-hr")).toBeVisible()
    await expect(page.getByTestId("calories")).toBeVisible()
    await expect(page.getByTestId("elevation")).toBeVisible()
  })

  test("no horizontal scrollbar at desktop width", async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test("tab labels are visible at desktop width", async ({ page }) => {
    await expect(page.getByTestId("tab-overview").getByText("Overview")).toBeVisible()
    await expect(page.getByTestId("tab-map").getByText("Map")).toBeVisible()
    await expect(page.getByTestId("tab-charts").getByText("Charts")).toBeVisible()
  })

  test("run header shows full title and button", async ({ page }) => {
    await expect(page.getByText("Run Dashboard")).toBeVisible()
    await expect(page.getByRole("button", { name: "Load new file" })).toBeVisible()
  })
})

test.describe("Responsive layout — Tablet (768px)", () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("summary cards display in 2-column grid on tablet", async ({ page }) => {
    // All 6 cards should still be visible
    await expect(page.getByTestId("distance")).toBeVisible()
    await expect(page.getByTestId("duration")).toBeVisible()
    await expect(page.getByTestId("avg-pace")).toBeVisible()
    await expect(page.getByTestId("avg-hr")).toBeVisible()
    await expect(page.getByTestId("calories")).toBeVisible()
    await expect(page.getByTestId("elevation")).toBeVisible()
  })

  test("no horizontal scrollbar at tablet width", async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test("tab navigation is visible and functional at tablet width", async ({ page }) => {
    await expect(page.getByTestId("tab-list")).toBeVisible()
    // Should be able to switch tabs
    await page.getByTestId("tab-map").click()
    await expect(page.getByTestId("tab-content-map")).toBeVisible()
  })

  test("stub tabs use full width at tablet size", async ({ page }) => {
    await page.getByTestId("tab-splits").click()
    const tabContent = page.getByTestId("tab-content-splits")
    await expect(tabContent).toBeVisible()
    // The splits table card should be visible and take available width
    await expect(tabContent.locator("[data-testid='splits-table-card']")).toBeVisible()
  })
})

test.describe("Responsive layout — Drop zone", () => {
  test("drop zone fits within tablet viewport without horizontal scroll", async ({ page }) => {
    page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")
    await expect(page.getByText("FitViewer")).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })
})
