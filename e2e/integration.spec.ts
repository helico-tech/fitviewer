import { test, expect } from "@playwright/test"

/**
 * End-to-end integration tests that load the real sample FIT file
 * via the "Try with sample data" button and verify the full pipeline:
 * parsing → store → all views render correctly.
 */
test.describe("End-to-end integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.removeItem("theme"))
    await page.goto("/")

    // Load sample file through full parsing pipeline
    await page.getByTestId("sample-button").click()
    await expect(page.getByTestId("dashboard")).toBeVisible({ timeout: 15000 })
  })

  test("summary cards render with valid values from sample file", async ({
    page,
  }) => {
    // Sample file: 5km run, 25 min, ~157 avg HR
    await expect(page.getByTestId("distance")).toContainText("5.00 km")
    await expect(page.getByTestId("duration")).toContainText("25:00")
    await expect(page.getByTestId("avg-hr")).toContainText(/\d+ bpm/)
    await expect(page.getByTestId("avg-pace")).toContainText(/\d+:\d{2} \/km/)
    await expect(page.getByTestId("calories")).toContainText(/\d+/)
    await expect(page.getByTestId("elevation")).toContainText(/\d+ m/)
  })

  test("navigate all tabs and verify content renders", async ({ page }) => {
    // Overview tab is active by default — summary cards visible
    await expect(page.getByTestId("tab-content-overview")).toBeVisible()
    await expect(page.getByTestId("summary-cards")).toBeVisible()

    // Map tab — canvas element should render
    await page.getByTestId("tab-map").click()
    await expect(page.getByTestId("tab-content-map")).toBeVisible()
    await expect(page.getByTestId("run-map")).toBeVisible()

    // Charts tab — SVG chart elements should render
    await page.getByTestId("tab-charts").click()
    await expect(page.getByTestId("tab-content-charts")).toBeVisible()
    await expect(page.getByTestId("pace-chart")).toBeVisible()

    // Splits tab — splits table should render with rows
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("tab-content-splits")).toBeVisible()
    await expect(page.getByTestId("splits-table")).toBeVisible()

    // Zones tab — zone config should render
    await page.getByTestId("tab-zones").click()
    await expect(page.getByTestId("tab-content-zones")).toBeVisible()
    await expect(page.getByTestId("zone-config")).toBeVisible()
  })

  test("toggle unit system and verify values update across views", async ({
    page,
  }) => {
    // Verify initial metric values
    await expect(page.getByTestId("distance")).toContainText("km")
    await expect(page.getByTestId("avg-pace")).toContainText("/km")

    // Switch to imperial
    await page.getByTestId("unit-mi").click()

    // Summary cards should update
    await expect(page.getByTestId("distance")).toContainText("mi")
    await expect(page.getByTestId("avg-pace")).toContainText("/mi")
    await expect(page.getByTestId("elevation")).toContainText("ft")

    // Duration and HR should NOT change
    await expect(page.getByTestId("duration")).toContainText("25:00")
    await expect(page.getByTestId("avg-hr")).toContainText(/\d+ bpm/)

    // Switch back to metric
    await page.getByTestId("unit-km").click()
    await expect(page.getByTestId("distance")).toContainText("km")
    await expect(page.getByTestId("avg-pace")).toContainText("/km")
    await expect(page.getByTestId("elevation")).toContainText("m")
  })

  test("toggle dark/light mode and verify theme changes", async ({ page }) => {
    // Start in light mode
    let isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(false)

    // Toggle to dark mode
    await page.getByTestId("theme-toggle").click()

    isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(true)

    // Verify background changed
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    )
    expect(bg).not.toBe("rgb(255, 255, 255)")

    // Summary cards should still be visible with valid data
    await expect(page.getByTestId("distance")).toContainText("5.00 km")

    // Toggle back to light mode
    await page.getByTestId("theme-toggle").click()

    isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(isDark).toBe(false)
  })

  test("charts render with SVG elements and data", async ({ page }) => {
    await page.getByTestId("tab-charts").click()
    await expect(page.getByTestId("tab-content-charts")).toBeVisible()

    // Pace chart should contain SVG with a rendered line path
    const paceChart = page.getByTestId("pace-chart")
    await expect(paceChart).toBeVisible()
    await expect(paceChart.locator("svg")).toBeVisible()
    await expect(paceChart.locator("svg .recharts-line-curve")).toBeVisible()

    // Heart rate chart should render with zone bands
    const hrChart = page.getByTestId("heart-rate-chart")
    await expect(hrChart).toBeVisible()
    await expect(hrChart.locator("svg")).toBeVisible()
    await expect(hrChart.locator("svg .recharts-line-curve")).toBeVisible()

    // Elevation chart should render with area fill
    const elevChart = page.getByTestId("elevation-chart")
    await expect(elevChart).toBeVisible()
    await expect(elevChart.locator("svg")).toBeVisible()
    await expect(elevChart.locator("svg .recharts-area-area")).toBeVisible()

    // Cadence chart should render
    const cadenceChart = page.getByTestId("cadence-chart")
    await expect(cadenceChart).toBeVisible()
    await expect(cadenceChart.locator("svg")).toBeVisible()
    await expect(cadenceChart.locator("svg .recharts-line-curve")).toBeVisible()
  })

  test("map renders with a route canvas", async ({ page }) => {
    await page.getByTestId("tab-map").click()
    await expect(page.getByTestId("tab-content-map")).toBeVisible()

    // Map should render with a canvas element (MapLibre GL)
    const map = page.getByTestId("run-map")
    await expect(map).toBeVisible()
    await expect(map.locator("canvas")).toBeVisible({ timeout: 10000 })

    // Map controls should be present
    await expect(page.getByTestId("metric-selector")).toBeVisible()
    await expect(page.getByTestId("color-legend")).toBeVisible()

    // Navigation controls (zoom) should be visible
    await expect(map.locator(".maplibregl-ctrl-zoom-in")).toBeVisible()
    await expect(map.locator(".maplibregl-ctrl-zoom-out")).toBeVisible()
  })

  test("splits table shows km splits from sample data", async ({ page }) => {
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("splits-table")).toBeVisible()

    // Sample file is 5km, so there should be 5 split rows
    const rows = page.getByTestId("splits-table").locator("tbody tr")
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(4)
    expect(count).toBeLessThanOrEqual(6)

    // First row should have km 1 data with pace format
    const firstRow = rows.first()
    await expect(firstRow).toContainText("1")
    await expect(firstRow).toContainText(/\d+:\d{2}/)
  })

  test("zone distribution renders from sample HR data", async ({ page }) => {
    await page.getByTestId("tab-zones").click()
    await expect(page.getByTestId("zone-config")).toBeVisible()

    // Max HR input should be auto-populated from sample data
    const maxHrInput = page.getByTestId("max-hr-input")
    await expect(maxHrInput).toBeVisible()
    const value = await maxHrInput.inputValue()
    expect(parseInt(value)).toBeGreaterThan(100)

    // Zone distribution bar should render
    await expect(page.getByTestId("zone-distribution-bar")).toBeVisible()

    // Zone time table should render with 5 zone rows
    await expect(page.getByTestId("zone-time-table")).toBeVisible()
    const zoneRows = page.getByTestId("zone-time-table").locator("tbody tr")
    const zoneCount = await zoneRows.count()
    expect(zoneCount).toBe(5)
  })

  test("chart controls affect all charts", async ({ page }) => {
    await page.getByTestId("tab-charts").click()
    await expect(page.getByTestId("chart-controls")).toBeVisible()

    // Toggle X-axis to Time
    await page.getByTestId("xaxis-time").click()

    // Pace chart X-axis should show time units (min)
    const paceChart = page.getByTestId("pace-chart")
    await expect(paceChart.locator("svg")).toBeVisible()

    // Verify store state changed
    const xAxis = await page.evaluate(() => {
      return (window as any).__runStore.getState().chartXAxis
    })
    expect(xAxis).toBe("time")

    // Toggle back to Distance
    await page.getByTestId("xaxis-distance").click()
    const xAxis2 = await page.evaluate(() => {
      return (window as any).__runStore.getState().chartXAxis
    })
    expect(xAxis2).toBe("distance")
  })

  test("split row click highlights segment on map", async ({ page }) => {
    await page.getByTestId("tab-splits").click()
    await expect(page.getByTestId("splits-table")).toBeVisible()

    // Wait for map to render on splits tab
    await expect(
      page.getByTestId("tab-content-splits").locator("[data-testid='run-map'] canvas")
    ).toBeVisible({ timeout: 10000 })

    // Click the first split row
    const firstRow = page
      .getByTestId("splits-table")
      .locator("tbody tr")
      .first()
    await firstRow.click()

    // Store should have selectedSplitIndex set
    const selectedIndex = await page.evaluate(() => {
      return (window as any).__runStore.getState().selectedSplitIndex
    })
    expect(selectedIndex).toBe(0)

    // Row should have selection styling
    await expect(firstRow).toHaveClass(/bg-accent/)
  })
})
