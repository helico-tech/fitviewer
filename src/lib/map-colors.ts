import type { DataPoint } from "@/types/run"
import type { MapMetric } from "@/store/useRunStore"

/**
 * Convert a normalized value (0-1) to a hex color on a green→yellow→red gradient.
 * 0 = green (#22c55e), 0.5 = yellow (#eab308), 1 = red (#ef4444)
 */
export function valueToColor(normalized: number): string {
  const t = Math.max(0, Math.min(1, normalized))
  // HSL hue: 120 (green) → 60 (yellow) → 0 (red)
  const hue = (1 - t) * 120
  // Convert HSL (hue, 80%, 45%) to RGB
  const s = 0.8
  const l = 0.45
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2

  let r: number, g: number, b: number
  if (hue < 60) {
    r = c; g = x; b = 0
  } else if (hue < 120) {
    r = x; g = c; b = 0
  } else {
    r = 0; g = c; b = x
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Extract the numeric value for a given metric from a DataPoint. */
export function getMetricValue(record: DataPoint, metric: MapMetric): number {
  switch (metric) {
    case "pace":
      return record.pace
    case "heartRate":
      return record.heartRate
    case "altitude":
      return record.altitude
    case "cadence":
      return record.cadence
    default:
      return 0
  }
}

/** Calculate the cumulative coordinate-space distance for progress along a line. */
function calculateProgress(coordinates: [number, number][]): number[] {
  if (coordinates.length === 0) return []
  const distances: number[] = [0]
  for (let i = 1; i < coordinates.length; i++) {
    const dx = coordinates[i][0] - coordinates[i - 1][0]
    const dy = coordinates[i][1] - coordinates[i - 1][1]
    distances.push(distances[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  const total = distances[distances.length - 1]
  if (total === 0) return distances.map(() => 0)
  return distances.map((d) => d / total)
}

export interface MetricRange {
  min: number
  max: number
}

/** Compute the min/max of a metric across valid records. */
export function getMetricRange(
  records: DataPoint[],
  metric: MapMetric,
): MetricRange {
  if (metric === "none" || records.length === 0) return { min: 0, max: 0 }

  let min = Infinity
  let max = -Infinity
  for (const r of records) {
    const v = getMetricValue(r, metric)
    if (!isFinite(v) || v <= 0) continue
    if (v < min) min = v
    if (v > max) max = v
  }

  if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 0 }
  return { min, max }
}

/**
 * Build a MapLibre line-gradient expression that colors each segment
 * of the route based on the selected metric value.
 *
 * Returns undefined if metric is "none" or data is insufficient.
 */
export function buildLineGradient(
  validRecords: DataPoint[],
  coordinates: [number, number][],
  metric: MapMetric,
): any[] | undefined {
  if (metric === "none" || validRecords.length < 2) return undefined

  const range = getMetricRange(validRecords, metric)
  if (range.min >= range.max) return undefined

  const progress = calculateProgress(coordinates)

  // Downsample to at most 500 gradient stops for performance
  const maxStops = 500
  const step = Math.max(1, Math.floor(validRecords.length / maxStops))

  const stops: (number | string)[] = []
  let lastProgress = -1

  for (let i = 0; i < validRecords.length; i += step) {
    const p = progress[i]
    if (p <= lastProgress) continue

    const value = getMetricValue(validRecords[i], metric)
    const normalized =
      isFinite(value) && value > 0
        ? (value - range.min) / (range.max - range.min)
        : 0.5
    stops.push(p, valueToColor(normalized))
    lastProgress = p
  }

  // Ensure last point is included
  const lastIdx = validRecords.length - 1
  if (progress[lastIdx] > lastProgress) {
    const value = getMetricValue(validRecords[lastIdx], metric)
    const normalized =
      isFinite(value) && value > 0
        ? (value - range.min) / (range.max - range.min)
        : 0.5
    stops.push(progress[lastIdx], valueToColor(normalized))
  }

  if (stops.length < 4) return undefined // Need at least 2 stops (progress + color pairs)

  return ["interpolate", ["linear"], ["line-progress"], ...stops]
}

/** CSS gradient string for the legend bar (green → yellow → red). */
export const LEGEND_GRADIENT =
  "linear-gradient(to right, #16a34a, #84cc16, #eab308, #f97316, #ef4444)"
