import type { DataPoint } from "@/types/run"

export interface DistanceMarker {
  number: number
  lat: number
  lon: number
}

/**
 * Compute positions along the route at each distance interval.
 * Interpolates between adjacent data points to find the exact position
 * where cumulative distance crosses each boundary.
 *
 * @param records - Valid GPS records with cumulative distance
 * @param intervalMeters - Distance between markers (e.g., 1000 for km, 1609.34 for mile)
 * @returns Array of markers with number (1-based) and interpolated lat/lon
 */
export function computeDistanceMarkers(
  records: DataPoint[],
  intervalMeters: number,
): DistanceMarker[] {
  if (records.length < 2 || intervalMeters <= 0) return []

  const markers: DistanceMarker[] = []
  let nextTarget = intervalMeters
  let markerNum = 1

  for (let i = 1; i < records.length; i++) {
    const prevDist = records[i - 1].distance
    const currDist = records[i].distance

    // Check if we crossed one or more distance boundaries in this segment
    while (currDist >= nextTarget && prevDist < nextTarget) {
      const segmentLength = currDist - prevDist
      if (segmentLength <= 0) break

      const fraction = (nextTarget - prevDist) / segmentLength
      const lat = records[i - 1].lat + fraction * (records[i].lat - records[i - 1].lat)
      const lon = records[i - 1].lon + fraction * (records[i].lon - records[i - 1].lon)

      markers.push({ number: markerNum, lat, lon })
      markerNum++
      nextTarget += intervalMeters
    }
  }

  return markers
}
