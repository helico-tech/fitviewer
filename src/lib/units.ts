export type UnitSystem = "metric" | "imperial";

const KM_PER_MILE = 1.60934;

/**
 * Convert pace from sec/km to the target unit system.
 * Returns sec/km for metric, sec/mi for imperial.
 */
export function convertPace(
  secPerKm: number,
  unit: UnitSystem
): number {
  if (unit === "imperial") return secPerKm * KM_PER_MILE;
  return secPerKm;
}

/**
 * Format a pace value (in sec/km) as "M:SS" with the appropriate unit label.
 * Returns "--:-- /km" or "--:-- /mi" for invalid values.
 */
export function formatPace(secPerKm: number, unit: UnitSystem): string {
  const label = unit === "metric" ? "/km" : "/mi";
  const converted = convertPace(secPerKm, unit);
  if (!converted || !isFinite(converted)) return `--:-- ${label}`;
  const m = Math.floor(converted / 60);
  const s = Math.floor(converted % 60);
  return `${m}:${String(s).padStart(2, "0")} ${label}`;
}

/**
 * Format a distance in meters as a string with the appropriate unit.
 * Returns "X.XX km" or "X.XX mi".
 */
export function formatDistance(meters: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    return `${(meters / 1000 / KM_PER_MILE).toFixed(2)} mi`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format elevation in meters. Always displayed in meters for metric,
 * feet for imperial.
 */
export function formatElevation(meters: number, unit: UnitSystem): string {
  if (!meters) return "—";
  if (unit === "imperial") {
    return `${Math.round(meters * 3.28084)} ft`;
  }
  return `${Math.round(meters)} m`;
}
