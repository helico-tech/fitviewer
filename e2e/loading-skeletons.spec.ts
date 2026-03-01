import { test, expect } from "@playwright/test"

test.describe("Loading skeletons", () => {
  async function setLoadingState(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) {
        storeApi.setState({ isLoading: true, runData: null, error: null })
      }
    })
  }

  test("shows skeleton placeholders during loading", async ({ page }) => {
    await page.goto("/")
    await setLoadingState(page)

    const loadingState = page.getByTestId("loading-state")
    await expect(loadingState).toBeVisible()

    // Header skeletons
    await expect(page.getByTestId("skeleton-header-title")).toBeVisible()
    await expect(page.getByTestId("skeleton-header-date")).toBeVisible()
    await expect(page.getByTestId("skeleton-header-button")).toBeVisible()

    // Tab bar skeleton
    await expect(page.getByTestId("skeleton-tab-bar")).toBeVisible()

    // Parsing indicator text
    await expect(page.getByText("Parsing FIT file")).toBeVisible()
  })

  test("shows six summary card skeletons", async ({ page }) => {
    await page.goto("/")
    await setLoadingState(page)

    const cardGrid = page.getByTestId("skeleton-cards")
    await expect(cardGrid).toBeVisible()

    // Should have 6 skeleton cards
    const cards = cardGrid.locator("[data-slot='skeleton']")
    await expect(cards).toHaveCount(12) // 2 skeletons per card (label + value) x 6 cards
  })

  test("shows chart area skeleton", async ({ page }) => {
    await page.goto("/")
    await setLoadingState(page)

    await expect(page.getByTestId("skeleton-chart")).toBeVisible()
  })

  test("shows map area skeleton", async ({ page }) => {
    await page.goto("/")
    await setLoadingState(page)

    await expect(page.getByTestId("skeleton-map")).toBeVisible()
  })

  test("skeletons disappear when data is loaded", async ({ page }) => {
    await page.goto("/")
    await setLoadingState(page)

    // Verify skeletons are visible
    await expect(page.getByTestId("loading-state")).toBeVisible()

    // Transition to loaded state
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) {
        storeApi.setState({
          isLoading: false,
          runData: {
            summary: {
              startTime: new Date("2026-03-01T07:30:00Z"),
              totalDistance: 10000,
              totalTime: 3000,
              movingTime: 2950,
              avgPace: 300,
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
          },
          error: null,
        })
      }
    })

    // Skeletons should be gone, dashboard should appear
    await expect(page.getByTestId("loading-state")).not.toBeVisible()
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })
})
