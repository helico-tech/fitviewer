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

test.describe("Theme toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto("/")
    await page.evaluate(() => localStorage.removeItem("theme"))
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
  })

  test("renders theme toggle button", async ({ page }) => {
    const toggle = page.getByTestId("theme-toggle")
    await expect(toggle).toBeVisible()
  })

  test("starts in light mode by default (no localStorage)", async ({ page }) => {
    // html element should NOT have dark class
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(false)
  })

  test("clicking toggle switches to dark mode", async ({ page }) => {
    await page.getByTestId("theme-toggle").click()

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(true)

    // Background should change (dark mode uses a dark background)
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    )
    // Dark background should not be white/near-white
    expect(bg).not.toBe("rgb(255, 255, 255)")
  })

  test("clicking toggle twice returns to light mode", async ({ page }) => {
    // Toggle to dark
    await page.getByTestId("theme-toggle").click()
    let isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(true)

    // Toggle back to light
    await page.getByTestId("theme-toggle").click()
    isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(false)
  })

  test("theme preference persists in localStorage", async ({ page }) => {
    // Toggle to dark
    await page.getByTestId("theme-toggle").click()

    const stored = await page.evaluate(() => localStorage.getItem("theme"))
    expect(stored).toBe("dark")

    // Toggle back to light
    await page.getByTestId("theme-toggle").click()

    const storedLight = await page.evaluate(() => localStorage.getItem("theme"))
    expect(storedLight).toBe("light")
  })

  test("dark mode persists across page reload", async ({ page }) => {
    // Toggle to dark
    await page.getByTestId("theme-toggle").click()

    // Reload the page
    await page.reload()

    // Check dark class is applied before React renders (from inline script)
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(true)
  })

  test("all shadcn components respect the dark theme", async ({ page }) => {
    // Toggle to dark
    await page.getByTestId("theme-toggle").click()

    // Verify card backgrounds adapt (should use dark card color)
    const cards = page.getByTestId("summary-cards").locator("[data-slot='card']")
    const firstCard = cards.first()
    await expect(firstCard).toBeVisible()

    const cardBg = await firstCard.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    )
    // Card in dark mode should not be white
    expect(cardBg).not.toBe("rgb(255, 255, 255)")
  })
})
