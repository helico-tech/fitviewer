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

test.describe("Tab navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("renders all five tabs", async ({ page }) => {
    await expect(page.getByTestId("tab-overview")).toBeVisible()
    await expect(page.getByTestId("tab-map")).toBeVisible()
    await expect(page.getByTestId("tab-charts")).toBeVisible()
    await expect(page.getByTestId("tab-splits")).toBeVisible()
    await expect(page.getByTestId("tab-zones")).toBeVisible()
  })

  test("Overview tab is active by default and shows summary cards", async ({
    page,
  }) => {
    await expect(page.getByTestId("tab-content-overview")).toBeVisible()
    await expect(page.getByTestId("distance")).toContainText("10.23 km")
    await expect(page.getByTestId("avg-pace")).toBeVisible()
  })

  test("clicking Map tab shows map content", async ({ page }) => {
    await page.getByTestId("tab-map").click()
    await expect(page.getByTestId("tab-content-map")).toBeVisible()
    await expect(page.getByTestId("run-map")).toBeVisible()
  })

  test("clicking Charts tab shows charts content", async ({ page }) => {
    await page.getByTestId("tab-charts").click()
    await expect(page.getByTestId("tab-content-charts")).toBeVisible()
    await expect(page.getByText("Charts — coming soon")).toBeVisible()
  })

  test("clicking Splits tab shows splits content", async ({ page }) => {
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("tab-content-splits")).toBeVisible()
    await expect(page.getByText("Splits — coming soon")).toBeVisible()
  })

  test("clicking Zones tab shows zones content", async ({ page }) => {
    await page.getByTestId("tab-zones").click()
    await expect(page.getByTestId("tab-content-zones")).toBeVisible()
    await expect(page.getByText("Zones — coming soon")).toBeVisible()
  })

  test("switching tabs hides previous tab content", async ({ page }) => {
    // Overview is visible by default
    await expect(page.getByTestId("tab-content-overview")).toBeVisible()

    // Switch to Map
    await page.getByTestId("tab-map").click()
    await expect(page.getByTestId("tab-content-map")).toBeVisible()
    await expect(page.getByTestId("tab-content-overview")).not.toBeVisible()

    // Switch back to Overview
    await page.getByTestId("tab-overview").click()
    await expect(page.getByTestId("tab-content-overview")).toBeVisible()
    await expect(page.getByTestId("tab-content-map")).not.toBeVisible()
  })

  test("run header shows date and load new file button", async ({ page }) => {
    await expect(page.getByTestId("run-header")).toBeVisible()
    await expect(page.getByTestId("run-date")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Load new file" })
    ).toBeVisible()
  })
})
