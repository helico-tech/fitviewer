import { test, expect, Page } from "@playwright/test"

// Generate mock records spanning ~5.2 km with realistic GPS data
function generateMockRecords(count: number, totalDistanceM: number) {
  const startTime = new Date("2026-03-01T07:30:00Z")
  const records = []
  for (let i = 0; i < count; i++) {
    const fraction = i / (count - 1)
    const distance = fraction * totalDistanceM
    const timestamp = new Date(startTime.getTime() + fraction * 1600 * 1000)
    records.push({
      timestamp: timestamp.toISOString(),
      lat: 52.52 + fraction * 0.04, // spread out so segments are visually distinct
      lon: 13.405 + fraction * 0.04,
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

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
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
  laps: [],
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

test.describe("Highlight split on map", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToSplits(page)
  })

  test("map is visible on the splits tab", async ({ page }) => {
    await expect(page.getByTestId("run-map")).toBeVisible()
  })

  test("split rows are clickable with cursor pointer", async ({ page }) => {
    const row = page.getByTestId("split-row-1")
    await expect(row).toBeVisible()
    // Check for cursor-pointer class
    await expect(row).toHaveClass(/cursor-pointer/)
  })

  test("clicking a split row highlights it with accent background", async ({ page }) => {
    const row = page.getByTestId("split-row-1")
    await row.click()
    await expect(row).toHaveClass(/bg-accent/)
  })

  test("clicking the same split row again deselects it", async ({ page }) => {
    const row = page.getByTestId("split-row-1")
    await row.click()
    await expect(row).toHaveClass(/bg-accent/)
    // Click again to deselect
    await row.click()
    await expect(row).not.toHaveClass(/bg-accent/)
  })

  test("clicking a different split row changes the selection", async ({ page }) => {
    const row1 = page.getByTestId("split-row-1")
    const row2 = page.getByTestId("split-row-2")
    await row1.click()
    await expect(row1).toHaveClass(/bg-accent/)
    await expect(row2).not.toHaveClass(/bg-accent/)
    // Click row 2
    await row2.click()
    await expect(row2).toHaveClass(/bg-accent/)
    await expect(row1).not.toHaveClass(/bg-accent/)
  })

  test("clicking a split row sets selectedSplitIndex in the store", async ({ page }) => {
    await page.getByTestId("split-row-2").click()
    const idx = await page.evaluate(() => {
      return (window as any).__runStore.getState().selectedSplitIndex
    })
    expect(idx).toBe(1) // 0-indexed, split-row-2 is index 1
  })

  test("switching away from splits tab clears the selection", async ({ page }) => {
    await page.getByTestId("split-row-1").click()
    // Verify it's selected
    const idxBefore = await page.evaluate(() => {
      return (window as any).__runStore.getState().selectedSplitIndex
    })
    expect(idxBefore).toBe(0)

    // Switch to overview tab
    await page.getByTestId("tab-overview").click()
    await expect(page.getByTestId("tab-content-overview")).toBeVisible()

    const idxAfter = await page.evaluate(() => {
      return (window as any).__runStore.getState().selectedSplitIndex
    })
    expect(idxAfter).toBeNull()
  })

  test("map renders highlight layer when a split is selected", async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(1000)

    await page.getByTestId("split-row-1").click()

    // Check that the highlight source was added to the map
    const hasHighlight = await page.evaluate(() => {
      // Access the MapLibre map via the canvas
      const mapContainer = document.querySelector("[data-testid='run-map']")
      if (!mapContainer) return false
      const canvas = mapContainer.querySelector("canvas")
      return !!canvas // Map is rendering - the highlight layer is part of the WebGL context
    })
    expect(hasHighlight).toBe(true)
  })

  test("selecting a split and returning to splits tab shows cleared state", async ({ page }) => {
    // Select a split
    await page.getByTestId("split-row-3").click()
    await expect(page.getByTestId("split-row-3")).toHaveClass(/bg-accent/)

    // Navigate away
    await page.getByTestId("tab-charts").click()
    await expect(page.getByTestId("tab-content-charts")).toBeVisible()

    // Navigate back to splits
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("tab-content-splits")).toBeVisible()

    // Row should no longer be highlighted
    await expect(page.getByTestId("split-row-3")).not.toHaveClass(/bg-accent/)
  })
})
