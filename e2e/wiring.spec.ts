import { test, expect } from "@playwright/test"
import path from "path"
import fs from "fs"
import os from "os"

test.describe("File-to-dashboard wiring", () => {
  test("shows loading state when .fit file is selected", async ({ page }) => {
    await page.goto("/")

    // Create a fake .fit file (will fail parsing, but loading state should appear first)
    const tmpFile = path.join(os.tmpdir(), "test-run.fit")
    fs.writeFileSync(tmpFile, "not-valid-fit-data")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Loading state should appear (spinner + text)
    await expect(page.getByText("Parsing FIT file")).toBeVisible()

    // Cleanup
    fs.unlinkSync(tmpFile)
  })

  test("shows error toast when FIT parsing fails", async ({ page }) => {
    await page.goto("/")

    // Create a fake .fit file that will fail parsing
    const tmpFile = path.join(os.tmpdir(), "corrupt.fit")
    fs.writeFileSync(tmpFile, Buffer.from([0x00, 0x01, 0x02, 0x03]))

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Wait for error toast to appear
    await expect(page.getByText("Failed to load file")).toBeVisible({ timeout: 10000 })

    fs.unlinkSync(tmpFile)
  })

  test("drop zone disappears during loading", async ({ page }) => {
    await page.goto("/")

    // Verify drop zone is visible initially
    await expect(page.getByText("FitViewer")).toBeVisible()
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()

    // Trigger loading with a fake .fit file
    const tmpFile = path.join(os.tmpdir(), "loading-test.fit")
    fs.writeFileSync(tmpFile, "fake-fit-data")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    // Drop zone should be replaced by loading state
    await expect(page.getByRole("button", { name: "Browse files" })).not.toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test("dashboard renders when run data is loaded", async ({ page }) => {
    await page.goto("/")

    // Inject mock run data into the Zustand store via page.evaluate
    await page.evaluate(() => {
      // Access the store from the window — we need to set state directly
      // The store is created by Zustand, which uses internal state.
      // We'll dispatch via a global helper we set up for testing.
      const storeApi = (window as any).__runStore
      if (storeApi) {
        storeApi.setState({
          runData: {
            summary: {
              startTime: new Date("2026-03-01T07:30:00Z"),
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
          },
          isLoading: false,
          error: null,
        })
      }
    })

    // Dashboard should be visible
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await expect(page.getByText("Run Dashboard")).toBeVisible()
    await expect(page.getByTestId("distance")).toContainText("10.23 km")
    await expect(page.getByRole("button", { name: "Load new file" })).toBeVisible()
  })

  test("Load new file button returns to drop zone", async ({ page }) => {
    await page.goto("/")

    // Inject mock data to get to dashboard
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) {
        storeApi.setState({
          runData: {
            summary: {
              startTime: new Date("2026-03-01T07:30:00Z"),
              totalDistance: 5000,
              totalTime: 1500,
              movingTime: 1480,
              avgPace: 300,
              avgHeartRate: 150,
              maxHeartRate: 170,
              avgCadence: 170,
              totalAscent: 50,
              totalDescent: 48,
              calories: 300,
            },
            records: [],
            laps: [],
            sessions: [],
          },
          isLoading: false,
          error: null,
        })
      }
    })

    await expect(page.getByTestId("dashboard")).toBeVisible()

    // Click "Load new file"
    await page.getByRole("button", { name: "Load new file" }).click()

    // Should return to drop zone
    await expect(page.getByText("FitViewer")).toBeVisible()
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()
    await expect(page.getByTestId("dashboard")).not.toBeVisible()
  })
})
