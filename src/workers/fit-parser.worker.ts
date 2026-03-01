import FitParser from "fit-file-parser";
import type { RunData, RunSummary, DataPoint, Lap, Session } from "@/types/run";

/**
 * Message types for communication between main thread and worker.
 */
export interface WorkerRequest {
  type: "parse";
  buffer: ArrayBuffer;
}

export interface WorkerSuccessResponse {
  type: "success";
  data: SerializedRunData;
}

export interface WorkerErrorResponse {
  type: "error";
  message: string;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

/**
 * Serialized versions of types where Date fields are ISO strings,
 * since Date objects can't cross the postMessage boundary.
 */
export type SerializedRunData = Omit<RunData, "summary" | "records" | "sessions"> & {
  summary: Omit<RunSummary, "startTime"> & { startTime: string };
  records: (Omit<DataPoint, "timestamp"> & { timestamp: string })[];
  sessions: (Omit<Session, "startTime"> & { startTime: string })[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecords(rawRecords: any[]): (Omit<DataPoint, "timestamp"> & { timestamp: string })[] {
  return rawRecords
    .filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) =>
        r.position_lat != null &&
        r.position_long != null
    )
    .map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => {
        const speed = r.speed ?? 0; // m/s
        const pace = speed > 0 ? 1000 / speed : 0; // sec/km

        return {
          timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
          lat: r.position_lat,
          lon: r.position_long,
          altitude: r.altitude ?? r.enhanced_altitude ?? 0,
          heartRate: r.heart_rate ?? 0,
          pace,
          speed,
          cadence: r.cadence != null ? r.cadence * 2 : 0, // FIT stores half-cycles, multiply by 2 for spm
          strideLength:
            speed > 0 && r.cadence > 0
              ? (speed / (r.cadence * 2 / 60)) // stride = speed / (steps_per_second)
              : 0,
          distance: r.distance ?? 0,
        };
      }
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLaps(rawLaps: any[], records: (Omit<DataPoint, "timestamp"> & { timestamp: string })[]): Lap[] {
  return rawLaps.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (lap: any, index: number) => {
      const lapStart = lap.start_time instanceof Date ? lap.start_time : new Date(lap.start_time);
      const lapTimestamp = lap.timestamp instanceof Date ? lap.timestamp : new Date(lap.timestamp);

      // Find record indices that fall within this lap's time range
      const startIndex = records.findIndex(
        (r) => new Date(r.timestamp) >= lapStart
      );
      let endIndex = records.findIndex(
        (r) => new Date(r.timestamp) > lapTimestamp
      );
      if (endIndex === -1) endIndex = records.length - 1;
      else endIndex = Math.max(0, endIndex - 1);

      const avgSpeed = lap.avg_speed ?? lap.enhanced_avg_speed ?? 0;
      const avgPace = avgSpeed > 0 ? 1000 / avgSpeed : 0;

      // Determine lap type from lap_trigger
      const isManual = lap.lap_trigger === "manual";

      return {
        type: isManual ? "manual" as const : "auto" as const,
        startIndex: startIndex >= 0 ? startIndex : index === 0 ? 0 : 0,
        endIndex,
        distance: lap.total_distance ?? 0,
        totalTime: lap.total_elapsed_time ?? lap.total_timer_time ?? 0,
        avgPace,
        avgHeartRate: lap.avg_heart_rate ?? 0,
        avgCadence: lap.avg_cadence != null ? lap.avg_cadence * 2 : 0,
        elevationGain: lap.total_ascent ?? 0,
      };
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSessions(rawSessions: any[]): (Omit<Session, "startTime"> & { startTime: string })[] {
  return rawSessions.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => ({
      sport: s.sport ?? "unknown",
      subSport: s.sub_sport ?? "generic",
      startTime: s.start_time instanceof Date ? s.start_time.toISOString() : String(s.start_time),
      totalDistance: s.total_distance ?? 0,
      totalTime: s.total_elapsed_time ?? s.total_timer_time ?? 0,
      avgHeartRate: s.avg_heart_rate ?? 0,
      maxHeartRate: s.max_heart_rate ?? 0,
      avgCadence: s.avg_cadence != null ? s.avg_cadence * 2 : 0,
      totalAscent: s.total_ascent ?? 0,
      totalDescent: s.total_descent ?? 0,
      calories: s.total_calories ?? 0,
    })
  );
}

function buildSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions: any[],
  records: (Omit<DataPoint, "timestamp"> & { timestamp: string })[]
): Omit<RunSummary, "startTime"> & { startTime: string } {
  const session = sessions[0];

  const startTime = session?.start_time instanceof Date
    ? session.start_time.toISOString()
    : session?.start_time
      ? String(session.start_time)
      : records[0]?.timestamp ?? new Date().toISOString();

  const totalDistance = session?.total_distance ?? records[records.length - 1]?.distance ?? 0;
  const totalTime = session?.total_elapsed_time ?? session?.total_timer_time ?? 0;
  const movingTime = session?.total_timer_time ?? totalTime;

  const avgSpeed = session?.avg_speed ?? session?.enhanced_avg_speed ?? 0;
  const avgPace = avgSpeed > 0 ? 1000 / avgSpeed : 0;

  return {
    startTime,
    totalDistance,
    totalTime,
    movingTime,
    avgPace,
    avgHeartRate: session?.avg_heart_rate ?? 0,
    maxHeartRate: session?.max_heart_rate ?? 0,
    avgCadence: session?.avg_cadence != null ? session.avg_cadence * 2 : 0,
    totalAscent: session?.total_ascent ?? 0,
    totalDescent: session?.total_descent ?? 0,
    calories: session?.total_calories ?? 0,
  };
}

function classifyParseError(_rawMessage: string): string {
  // Any exception from the FIT parser means the file is corrupt or not a valid FIT binary.
  // Specific "no data" cases are handled above before this catch block.
  return "This file appears to be corrupted";
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, buffer } = event.data;

  if (type !== "parse") return;

  try {
    const parser = new FitParser({
      force: true,
      speedUnit: "m/s",
      lengthUnit: "m",
      temperatureUnit: "celsius",
      elapsedRecordField: true,
      mode: "list",
    });

    const parsed = await parser.parseAsync(buffer);

    const rawRecords = parsed.records ?? [];
    const rawLaps = parsed.laps ?? [];
    const rawSessions = parsed.sessions ?? [];

    if (rawRecords.length === 0) {
      self.postMessage({
        type: "error",
        message: "No run data found in this file",
      } satisfies WorkerErrorResponse);
      return;
    }

    const records = mapRecords(rawRecords);

    if (records.length === 0) {
      self.postMessage({
        type: "error",
        message: "No GPS data found in this file",
      } satisfies WorkerErrorResponse);
      return;
    }

    const laps = mapLaps(rawLaps, records);
    const sessions = mapSessions(rawSessions);
    const summary = buildSummary(rawSessions, records);

    const result: SerializedRunData = {
      summary,
      records,
      laps,
      sessions,
    };

    self.postMessage({ type: "success", data: result } satisfies WorkerSuccessResponse);
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    // Classify the error for user-friendly messaging
    const message = classifyParseError(rawMessage);
    self.postMessage({ type: "error", message } satisfies WorkerErrorResponse);
  }
};
