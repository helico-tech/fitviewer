import { test, expect, Page } from "@playwright/test"

const mockRecords = Array.from({ length: 100 }, (_, i) => ({
  timestamp: new Date(Date.now() + i * 30000).toISOString(),
  lat: 52.52 + (i / 99) * 0.01,
  lon: 13.405 + (i / 99) * 0.01,
  altitude: 35 + Math.sin((i / 99) * Math.PI * 2) * 10,
  heartRate: 140 + Math.floor(i * 0.3),
  pace: 270 + Math.sin((i / 99) * Math.PI) * 30,
  speed: 3.5 + Math.random() * 0.5,
  cadence: 170 + Math.floor(i * 0.1),
  strideLength: 1.1 + Math.random() * 0.1,
  distance: i * 100,
}))

const mockRunData = {
  summary: {
    startTime: new Date("2026-03-01T07:30:00Z").toISOString(),
    totalDistance: 9900,
    totalTime: 3000,
    movingTime: 2950,
    avgPace: 300,
    avgHeartRate: 155,
    maxHeartRate: 175,
    avgCadence: 175,
    totalAscent: 20,
    totalDescent: 20,
    calories: 300,
  },
  records: mockRecords,
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
          records: d.records.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })),
        },
        isLoading: false,
        error: null,
      })
    }
  }, mockRunData)
}

async function navigateToCharts(page: Page) {
  await page.goto("/")
  await loadMockData(page)
  await expect(page.getByTestId("dashboard")).toBeVisible()
  await page.getByTestId("tab-charts").click()
}

test.describe("Crosshair value labels on charts", () => {
  test("crosshair label appears on all charts when hoveredIndex is set", async ({ page }) => {
    await navigateToCharts(page)

    // Set hoveredIndex programmatically
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    // Each chart should have a crosshair label
    const chartIds = ["pace-chart", "heart-rate-chart", "elevation-chart", "cadence-chart"]
    for (const id of chartIds) {
      const chart = page.getByTestId(id)
      const label = chart.locator(".crosshair-label")
      await expect(label).toHaveCount(1)
    }
  })

  test("pace chart crosshair label shows pace value", async ({ page }) => {
    await navigateToCharts(page)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    const label = page.getByTestId("pace-chart").locator(".crosshair-label")
    const text = await label.textContent()
    // Pace format should be M:SS
    expect(text).toMatch(/^\d+:\d{2}$/)
  })

  test("heart rate chart crosshair label shows bpm value", async ({ page }) => {
    await navigateToCharts(page)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    const label = page.getByTestId("heart-rate-chart").locator(".crosshair-label")
    const text = await label.textContent()
    expect(text).toMatch(/^\d+ bpm$/)
  })

  test("elevation chart crosshair label shows altitude with unit", async ({ page }) => {
    await navigateToCharts(page)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    const label = page.getByTestId("elevation-chart").locator(".crosshair-label")
    const text = await label.textContent()
    // Default is metric, so should show meters
    expect(text).toMatch(/^\d+ m$/)
  })

  test("cadence chart crosshair label shows spm value", async ({ page }) => {
    await navigateToCharts(page)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    const label = page.getByTestId("cadence-chart").locator(".crosshair-label")
    const text = await label.textContent()
    expect(text).toMatch(/^\d+ spm$/)
  })

  test("crosshair labels disappear when hoveredIndex is cleared", async ({ page }) => {
    await navigateToCharts(page)

    // Set hoveredIndex
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    // Verify labels appear
    const paceLabel = page.getByTestId("pace-chart").locator(".crosshair-label")
    await expect(paceLabel).toHaveCount(1)

    // Clear hoveredIndex
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(null)
    })
    await page.waitForTimeout(200)

    // Labels should be gone
    await expect(paceLabel).toHaveCount(0)
  })

  test("crosshair labels update when hoveredIndex changes", async ({ page }) => {
    await navigateToCharts(page)

    // Hover at index 20
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(20)
    })
    await page.waitForTimeout(200)

    const hrLabel = page.getByTestId("heart-rate-chart").locator(".crosshair-label")
    const text1 = await hrLabel.textContent()

    // Hover at index 80 (different HR)
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(80)
    })
    await page.waitForTimeout(200)

    const text2 = await hrLabel.textContent()

    // Values should be different since HR increases with index in mock data
    expect(text1).not.toEqual(text2)
    expect(text1).toMatch(/bpm$/)
    expect(text2).toMatch(/bpm$/)
  })

  test("elevation crosshair label shows ft in imperial mode", async ({ page }) => {
    await navigateToCharts(page)

    // Switch to imperial
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setUnitSystem("imperial")
    })
    await page.waitForTimeout(100)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    const label = page.getByTestId("elevation-chart").locator(".crosshair-label")
    const text = await label.textContent()
    expect(text).toMatch(/^\d+ ft$/)
  })
})
