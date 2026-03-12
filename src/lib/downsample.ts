import { LTTB } from "downsample";

/**
 * A data point with numeric x (time) and y (value) coordinates.
 */
export type TimeSeriesPoint = {
  x: number;
  y: number;
};

/**
 * Downsamples time-series data using the Largest Triangle Three Buckets (LTTB) algorithm.
 *
 * LTTB preserves visual characteristics of the data while reducing point count.
 * It always preserves the first and last data points.
 *
 * @param data - Array of {x, y} data points
 * @param targetPoints - Desired number of output points
 * @returns Downsampled array, or original array if already at or below target
 */
export function downsampleTimeSeries(
  data: TimeSeriesPoint[],
  targetPoints: number,
): TimeSeriesPoint[] {
  if (data.length <= targetPoints) {
    return data;
  }

  return LTTB(data, targetPoints) as TimeSeriesPoint[];
}
