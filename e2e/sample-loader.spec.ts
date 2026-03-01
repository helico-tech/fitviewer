import { test, expect } from "@playwright/test"

test.describe("Sample file loader", () => {
  test("shows 'Try with sample data' button on drop zone", async ({ page }) => {
    await page.goto("/")
    const sampleBtn = page.getByTestId("sample-button")
    await expect(sampleBtn).toBeVisible()
    await expect(sampleBtn).toHaveText("Try with sample data")
  })

  test("loads sample file and transitions to dashboard", async ({ page }) => {
    await page.goto("/")

    // Click the sample data button
    await page.getByTestId("sample-button").click()

    // Dashboard should appear with valid data
    await expect(page.getByTestId("dashboard")).toBeVisible({ timeout: 15000 })

    // Verify summary values from the sample file (5km run, 25min, ~157 avg HR)
    await expect(page.getByTestId("distance")).toContainText("5.00 km")
    await expect(page.getByTestId("duration")).toContainText("25:00")
    await expect(page.getByTestId("avg-hr")).toContainText("157")
  })

  test("sample file loads through the same parsing pipeline as user files", async ({ page }) => {
    await page.goto("/")

    await page.getByTestId("sample-button").click()

    // Wait for dashboard
    await expect(page.getByTestId("dashboard")).toBeVisible({ timeout: 15000 })

    // Verify the run date header from the sample file (Feb 28, 2026)
    await expect(page.getByTestId("run-header")).toContainText("2026")

    // Verify tabs are available (Overview tab should be active by default)
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible()
  })

  test("can load new file after loading sample", async ({ page }) => {
    await page.goto("/")

    // Load sample
    await page.getByTestId("sample-button").click()
    await expect(page.getByTestId("dashboard")).toBeVisible({ timeout: 15000 })

    // Click "Load new file" to return to drop zone
    await page.getByRole("button", { name: "Load new file" }).click()

    // Drop zone should be back with sample button still available
    await expect(page.getByTestId("sample-button")).toBeVisible()
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()
  })
})
