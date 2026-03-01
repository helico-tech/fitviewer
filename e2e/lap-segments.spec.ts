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
      lat: 52.52 + fraction * 0.04,
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

const mockLaps = [
  {
    type: "auto",
    startIndex: 0,
    endIndex: 66,
    distance: 1713,
    totalTime: 527,
    avgPace: 308,
    avgHeartRate: 148,
    avgCadence: 173,
    elevationGain: 8,
  },
  {
    type: "auto",
    startIndex: 66,
    endIndex: 133,
    distance: 1747,
    totalTime: 535,
    avgPace: 306,
    avgHeartRate: 155,
    avgCadence: 176,
    elevationGain: 10,
  },
  {
    type: "manual",
    startIndex: 133,
    endIndex: 199,
    distance: 1740,
    totalTime: 538,
    avgPace: 309,
    avgHeartRate: 162,
    avgCadence: 178,
    elevationGain: 7,
  },
]

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
  laps: mockLaps,
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

async function navigateToMap(page: Page) {
  await page.getByTestId("tab-map").click()
  await expect(page.getByTestId("tab-content-map")).toBeVisible()
}

test.describe("Lap segments on map", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await loadMockData(page)
    await expect(page.getByTestId("dashboard")).toBeVisible()
    await navigateToMap(page)
  })

  test("overlay selector is visible in map controls", async ({ page }) => {
    await expect(page.getByTestId("overlay-selector")).toBeVisible()
    await expect(page.getByTestId("overlay-selector")).toContainText("Segments: None")
  })

  test("overlay selector shows three options", async ({ page }) => {
    await page.getByTestId("overlay-selector").click()
    await expect(page.getByTestId("overlay-option-none")).toBeVisible()
    await expect(page.getByTestId("overlay-option-splits")).toBeVisible()
    await expect(page.getByTestId("overlay-option-laps")).toBeVisible()
  })

  test("selecting splits mode updates the button label", async ({ page }) => {
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-splits").click()
    await expect(page.getByTestId("overlay-selector")).toContainText("Segments: Auto Splits")
  })

  test("selecting laps mode updates the button label", async ({ page }) => {
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-laps").click()
    await expect(page.getByTestId("overlay-selector")).toContainText("Segments: Laps")
  })

  test("selecting splits mode sets mapOverlayMode in store", async ({ page }) => {
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-splits").click()
    const mode = await page.evaluate(() => {
      return (window as any).__runStore.getState().mapOverlayMode
    })
    expect(mode).toBe("splits")
  })

  test("selecting laps mode sets mapOverlayMode in store", async ({ page }) => {
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-laps").click()
    const mode = await page.evaluate(() => {
      return (window as any).__runStore.getState().mapOverlayMode
    })
    expect(mode).toBe("laps")
  })

  test("selecting laps mode shows boundary markers on map", async ({ page }) => {
    // Wait for map to fully load
    await page.waitForTimeout(1500)

    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-laps").click()

    // Wait for markers to render
    await page.waitForTimeout(500)

    // With 3 laps, there should be 2 boundary markers (skipping the first lap boundary)
    await expect(page.getByTestId("boundary-marker-1")).toBeVisible()
    await expect(page.getByTestId("boundary-marker-2")).toBeVisible()
  })

  test("switching to none mode removes boundary markers", async ({ page }) => {
    await page.waitForTimeout(1500)

    // Enable laps overlay
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-laps").click()
    await page.waitForTimeout(500)
    await expect(page.getByTestId("boundary-marker-1")).toBeVisible()

    // Switch to none
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-none").click()
    await page.waitForTimeout(500)

    await expect(page.locator("[data-testid^='boundary-marker-']")).toHaveCount(0)
  })

  test("toggling between splits and laps updates markers", async ({ page }) => {
    await page.waitForTimeout(1500)

    // Enable splits overlay
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-splits").click()
    await page.waitForTimeout(500)

    // Check store state is splits
    let mode = await page.evaluate(() => {
      return (window as any).__runStore.getState().mapOverlayMode
    })
    expect(mode).toBe("splits")

    // Switch to laps
    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-laps").click()
    await page.waitForTimeout(500)

    mode = await page.evaluate(() => {
      return (window as any).__runStore.getState().mapOverlayMode
    })
    expect(mode).toBe("laps")

    // Lap boundary markers should appear
    await expect(page.getByTestId("boundary-marker-1")).toBeVisible()
  })

  test("map canvas continues to render with overlay segments", async ({ page }) => {
    await page.waitForTimeout(1500)

    await page.getByTestId("overlay-selector").click()
    await page.getByTestId("overlay-option-splits").click()
    await page.waitForTimeout(500)

    // Map canvas should still be present and rendering
    const canvas = page.locator("[data-testid='run-map'] canvas")
    await expect(canvas).toBeVisible()
  })
})
