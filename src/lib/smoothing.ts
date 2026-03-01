/**
 * Apply a rolling average to an array of numbers.
 * Values that are NaN, null, or undefined are treated as gaps and excluded
 * from the average (but their index is preserved in the output).
 *
 * @param data - array of numeric values
 * @param windowSize - number of data points in the rolling window (must be >= 1)
 * @returns smoothed array of the same length
 */
export function rollingAverage(data: number[], windowSize: number): number[] {
  if (windowSize < 1) windowSize = 1;
  const half = Math.floor(windowSize / 2);
  const result: number[] = new Array(data.length);

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(data.length - 1, i + half);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      const v = data[j];
      if (v != null && isFinite(v)) {
        sum += v;
        count++;
      }
    }
    result[i] = count > 0 ? sum / count : data[i];
  }

  return result;
}
