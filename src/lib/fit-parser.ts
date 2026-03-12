import { Decoder, Stream } from "@garmin/fitsdk";
import { semicirclesToDegrees, computeSummaryStats } from "./normalize.ts";
import type { NormalizedActivity, ActivityRecord, ActivityMetadata, LapRecord } from "../types/activity.ts";

/**
 * Parses a FIT file ArrayBuffer into a NormalizedActivity.
 *
 * Validates the file is a valid FIT file, checks integrity,
 * decodes with full options, verifies sport is running,
 * normalizes coordinates from semicircles to degrees,
 * and doubles cadence from half-cycles to steps per minute.
 *
 * @throws Error if not a valid FIT file
 * @throws Error if integrity check fails
 * @throws Error if decode produces errors
 * @throws Error with "SPORT_MISMATCH:{sport}" if sport is not running
 */
export function parseFitFile(buffer: ArrayBuffer): NormalizedActivity {
  const stream = Stream.fromArrayBuffer(buffer);

  // Check if input is a FIT file
  if (!Decoder.isFIT(stream)) {
    throw new Error("Not a valid FIT file");
  }

  // Create decoder and check integrity
  const decoder = new Decoder(stream);
  if (!decoder.checkIntegrity()) {
    throw new Error("FIT file failed integrity check -- the file may be corrupted");
  }

  // Need a fresh stream/decoder since checkIntegrity consumes the stream
  const stream2 = Stream.fromArrayBuffer(buffer);
  const decoder2 = new Decoder(stream2);

  const { messages, errors } = decoder2.read({
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    mergeHeartRates: true,
  });

  if (errors.length > 0) {
    throw new Error(`FIT decode errors: ${errors.map((e: Error) => e.message).join("; ")}`);
  }

  // Check sport type -- only running is supported
  const session = messages.sessionMesgs?.[0];
  if (!session) {
    throw new Error("FIT file contains no session data");
  }
  if (session.sport !== "running") {
    throw new Error(`SPORT_MISMATCH:${session.sport}`);
  }

  // Normalize records
  const records: ActivityRecord[] = (messages.recordMesgs ?? []).map((r: any) => ({
    timestamp: r.timestamp,
    heartRate: r.heartRate ?? null,
    cadence: r.cadence != null ? r.cadence * 2 : null, // FIT stores half-cycles, double for SPM
    speed: r.enhancedSpeed ?? r.speed ?? null,
    altitude: r.enhancedAltitude ?? r.altitude ?? null,
    distance: r.distance ?? null,
    positionLat: r.positionLat != null ? semicirclesToDegrees(r.positionLat) : null,
    positionLong: r.positionLong != null ? semicirclesToDegrees(r.positionLong) : null,
  }));

  // Build summary from session
  const summary = computeSummaryStats(session);

  // Extract metadata
  const fileId = messages.fileIdMesgs?.[0];
  const metadata: ActivityMetadata = {
    device: fileId?.manufacturer
      ? `${fileId.manufacturer} ${fileId.garminProduct ?? fileId.product ?? ""}`.trim()
      : "Unknown Device",
    date: session.startTime ?? session.timestamp,
    sport: session.sport,
    duration: session.totalTimerTime,
  };

  // Normalize laps
  const laps: LapRecord[] = (messages.lapMesgs ?? []).map((l: any) => ({
    startTime: l.startTime,
    totalDistance: l.totalDistance,
    totalTimerTime: l.totalTimerTime,
    avgSpeed: l.enhancedAvgSpeed ?? l.avgSpeed ?? null,
    avgHeartRate: l.avgHeartRate ?? null,
    avgCadence: l.avgCadence != null ? l.avgCadence * 2 : null,
    maxHeartRate: l.maxHeartRate ?? null,
    maxSpeed: l.enhancedMaxSpeed ?? l.maxSpeed ?? null,
  }));

  return { records, summary, metadata, laps };
}
