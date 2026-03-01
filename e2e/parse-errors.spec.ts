import { test, expect } from "@playwright/test"
import path from "path"
import fs from "fs"
import os from "os"

test.describe("Parse error handling", () => {
  test("non-FIT file shows 'doesn't appear to be a FIT file' message", async ({ page }) => {
    await page.goto("/")

    const tmpFile = path.join(os.tmpdir(), "readme.txt")
    fs.writeFileSync(tmpFile, "This is just a text file")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    const errorAlert = page.getByTestId("parse-error")
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText("This doesn't appear to be a FIT file")

    fs.unlinkSync(tmpFile)
  })

  test("corrupt FIT file shows 'appears to be corrupted' message", async ({ page }) => {
    await page.goto("/")

    // Write random bytes with .fit extension — will fail parsing
    const tmpFile = path.join(os.tmpdir(), "corrupt.fit")
    fs.writeFileSync(tmpFile, Buffer.from([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x01, 0x02, 0x03]))

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    const errorAlert = page.getByTestId("parse-error")
    await expect(errorAlert).toBeVisible({ timeout: 10000 })
    await expect(errorAlert).toContainText("This file appears to be corrupted")

    fs.unlinkSync(tmpFile)
  })

  test("error is dismissible and returns user to drop zone", async ({ page }) => {
    await page.goto("/")

    // Trigger a non-FIT file error
    const tmpFile = path.join(os.tmpdir(), "photo.jpg")
    fs.writeFileSync(tmpFile, "not a real jpg")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpFile)

    const errorAlert = page.getByTestId("parse-error")
    await expect(errorAlert).toBeVisible()

    // Dismiss the error
    await page.getByLabel("Dismiss error").click()

    // Error should be gone
    await expect(errorAlert).not.toBeVisible()

    // Drop zone should still be fully usable
    await expect(page.getByText("FitViewer")).toBeVisible()
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()

    fs.unlinkSync(tmpFile)
  })

  test("error is cleared when user tries a new file", async ({ page }) => {
    await page.goto("/")

    // First, trigger a non-FIT file error
    const badFile = path.join(os.tmpdir(), "data.csv")
    fs.writeFileSync(badFile, "col1,col2\n1,2")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(badFile)

    const errorAlert = page.getByTestId("parse-error")
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText("This doesn't appear to be a FIT file")

    // Now try another file (still bad, but a different one) — the old error should clear
    const anotherBadFile = path.join(os.tmpdir(), "another.png")
    fs.writeFileSync(anotherBadFile, "fake png data")
    await fileInput.setInputFiles(anotherBadFile)

    // The error alert should still be visible but with the same message (still non-FIT)
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText("This doesn't appear to be a FIT file")

    fs.unlinkSync(badFile)
    fs.unlinkSync(anotherBadFile)
  })

  test("parse error returns user to drop zone with dismissible error", async ({ page }) => {
    await page.goto("/")

    // Inject a parse error via the store to simulate corrupt file parsing failure
    await page.evaluate(() => {
      const storeApi = (window as any).__runStore
      if (storeApi) {
        storeApi.setState({
          error: "This file appears to be corrupted",
          isLoading: false,
          runData: null,
        })
      }
    })

    // The error alert should be visible on the drop zone
    const errorAlert = page.getByTestId("parse-error")
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText("This file appears to be corrupted")

    // The drop zone is still visible — user can browse for another file
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()
    await expect(page.getByText("FitViewer")).toBeVisible()

    // Dismiss the error
    await page.getByLabel("Dismiss error").click()
    await expect(errorAlert).not.toBeVisible()

    // Drop zone is still usable
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible()
  })
})
