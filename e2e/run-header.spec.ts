import { test, expect, Page } from "@playwright/test"

function makeMockRunData(startTimeIso: string) {
  return {
    summary: {
      startTime: startTimeIso,
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
}

async function loadMockData(page: Page, startTimeIso: string) {
  const data = makeMockRunData(startTimeIso)
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

test.describe("Run header", () => {
  test("displays formatted date with em dash separator", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, "2026-03-01T07:32:00")
    await expect(page.getByTestId("dashboard")).toBeVisible()

    const dateText = await page.getByTestId("run-date").textContent()
    // Should contain the day of week, date, em dash, and time
    expect(dateText).toContain("Sunday")
    expect(dateText).toContain("March")
    expect(dateText).toContain("2026")
    expect(dateText).toContain("—")
    expect(dateText).toMatch(/7:32\s*AM/)
  })

  test("displays Run Dashboard heading", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, "2026-03-01T07:32:00")
    await expect(page.getByTestId("dashboard")).toBeVisible()

    await expect(
      page.getByRole("heading", { name: "Run Dashboard" })
    ).toBeVisible()
  })

  test("Load new file button returns to drop zone", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, "2026-03-01T07:32:00")
    await expect(page.getByTestId("dashboard")).toBeVisible()

    await page.getByRole("button", { name: "Load new file" }).click()

    // Dashboard should be gone, drop zone should appear
    await expect(page.getByTestId("dashboard")).not.toBeVisible()
    await expect(page.getByText("FitViewer")).toBeVisible()
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()
  })

  test("header is positioned above tab navigation", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page, "2026-03-01T07:32:00")
    await expect(page.getByTestId("dashboard")).toBeVisible()

    const headerBox = await page.getByTestId("run-header").boundingBox()
    const tabListBox = await page.getByTestId("tab-list").boundingBox()

    expect(headerBox).not.toBeNull()
    expect(tabListBox).not.toBeNull()
    // Header bottom should be above tab list top
    expect(headerBox!.y + headerBox!.height).toBeLessThan(tabListBox!.y)
  })

  test("formats different dates correctly", async ({ page }) => {
    await page.goto("/")
    // Use a different date — a Tuesday evening
    await loadMockData(page, "2025-12-23T18:45:00")
    await expect(page.getByTestId("dashboard")).toBeVisible()

    const dateText = await page.getByTestId("run-date").textContent()
    expect(dateText).toContain("Tuesday")
    expect(dateText).toContain("December")
    expect(dateText).toContain("23")
    expect(dateText).toContain("2025")
    expect(dateText).toContain("—")
    expect(dateText).toMatch(/6:45\s*PM/)
  })
})
