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

test.describe("Hover sync between map and charts", () => {
  test("hovering pace chart sets hoveredIndex in store", async ({ page }) => {
    await navigateToCharts(page)
    const chart = page.getByTestId("pace-chart")
    await expect(chart).toBeVisible()

    // Hover the chart area
    const box = await chart.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(100)

      const hoveredIndex = await page.evaluate(() => {
        return (window as any).__runStore.getState().hoveredIndex
      })
      expect(hoveredIndex).not.toBeNull()
      expect(typeof hoveredIndex).toBe("number")
      expect(hoveredIndex).toBeGreaterThanOrEqual(0)
      expect(hoveredIndex).toBeLessThan(100)
    }
  })

  test("leaving chart clears hoveredIndex", async ({ page }) => {
    await navigateToCharts(page)
    const chart = page.getByTestId("pace-chart")
    await expect(chart).toBeVisible()

    const box = await chart.boundingBox()
    if (box) {
      // Hover the chart
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(100)

      // Move off the chart
      await page.mouse.move(0, 0)
      await page.waitForTimeout(100)

      const hoveredIndex = await page.evaluate(() => {
        return (window as any).__runStore.getState().hoveredIndex
      })
      expect(hoveredIndex).toBeNull()
    }
  })

  test("setting hoveredIndex shows ReferenceLine on charts", async ({ page }) => {
    await navigateToCharts(page)

    // Set hoveredIndex programmatically (simulating map hover)
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    // Check that hover-crosshair ReferenceLine appears on all charts
    const paceChart = page.getByTestId("pace-chart")
    const hrChart = page.getByTestId("heart-rate-chart")
    const elevChart = page.getByTestId("elevation-chart")
    const cadChart = page.getByTestId("cadence-chart")

    for (const chart of [paceChart, hrChart, elevChart, cadChart]) {
      const crosshair = chart.locator(".hover-crosshair line")
      await expect(crosshair).toHaveCount(1)
    }
  })

  test("clearing hoveredIndex removes ReferenceLine from charts", async ({ page }) => {
    await navigateToCharts(page)

    // Set and then clear hoveredIndex
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(50)
    })
    await page.waitForTimeout(200)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(null)
    })
    await page.waitForTimeout(200)

    // hover-crosshair should be gone from pace chart
    const paceChart = page.getByTestId("pace-chart")
    const crosshair = paceChart.locator(".hover-crosshair")
    await expect(crosshair).toHaveCount(0)
  })

  test("hovering one chart shows crosshair on other charts", async ({ page }) => {
    await navigateToCharts(page)
    const paceChart = page.getByTestId("pace-chart")
    const hrChart = page.getByTestId("heart-rate-chart")
    await expect(paceChart).toBeVisible()

    // Hover pace chart
    const box = await paceChart.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(200)

      // HR chart should show a hover crosshair
      const hrCrosshair = hrChart.locator(".hover-crosshair line")
      await expect(hrCrosshair).toHaveCount(1)
    }
  })

  test("hoveredIndex is reflected on map as hover marker", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await page.getByTestId("tab-map").click()

    // Wait for map canvas to render
    const mapEl = page.getByTestId("run-map")
    await expect(mapEl).toBeVisible()
    await expect(mapEl.locator("canvas")).toBeVisible({ timeout: 10000 })
    // Wait for map load event to fire
    await page.waitForTimeout(2000)

    // Set hoveredIndex programmatically
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(25)
    })
    await page.waitForTimeout(300)

    // Hover marker should appear
    const hoverMarker = page.getByTestId("hover-marker")
    await expect(hoverMarker).toBeVisible({ timeout: 5000 })
  })

  test("clearing hoveredIndex removes hover marker from map", async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await page.getByTestId("tab-map").click()

    await expect(page.getByTestId("run-map").locator("canvas")).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    // Set then clear hoveredIndex
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(25)
    })
    await page.waitForTimeout(300)

    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(null)
    })
    await page.waitForTimeout(300)

    const hoverMarker = page.getByTestId("hover-marker")
    await expect(hoverMarker).toHaveCount(0)
  })

  test("all four charts respond to hoveredIndex", async ({ page }) => {
    await navigateToCharts(page)

    const chartIds = ["pace-chart", "heart-rate-chart", "elevation-chart", "cadence-chart"]

    // Set hoveredIndex
    await page.evaluate(() => {
      ;(window as any).__runStore.getState().setHoveredIndex(30)
    })
    await page.waitForTimeout(200)

    // Each chart should have a hover crosshair
    for (const id of chartIds) {
      const chart = page.getByTestId(id)
      const crosshair = chart.locator(".hover-crosshair line")
      await expect(crosshair).toHaveCount(1)
    }
  })

  test("hoveredIndex updates smoothly when moving across chart", async ({ page }) => {
    await navigateToCharts(page)
    const chart = page.getByTestId("pace-chart")
    await expect(chart).toBeVisible()

    const box = await chart.boundingBox()
    if (box) {
      // Move across the chart from left to right
      const y = box.y + box.height / 2
      const indices: number[] = []

      for (let x = box.x + 60; x < box.x + box.width - 20; x += 50) {
        await page.mouse.move(x, y)
        await page.waitForTimeout(50)

        const idx = await page.evaluate(() => {
          return (window as any).__runStore.getState().hoveredIndex
        })
        if (idx != null) indices.push(idx)
      }

      // Should have collected multiple distinct indices that are generally increasing
      expect(indices.length).toBeGreaterThan(2)
      // At least some should be different
      const uniqueIndices = new Set(indices)
      expect(uniqueIndices.size).toBeGreaterThan(1)
    }
  })
})
