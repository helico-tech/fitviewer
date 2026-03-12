export type ActivityRecord = {
  timestamp: Date;
  heartRate: number | null;
  cadence: number | null;
  speed: number | null;
  altitude: number | null;
  distance: number | null;
  positionLat: number | null;
  positionLong: number | null;
};

export type SummaryStats = {
  totalDistance: number;
  totalDuration: number;
  totalTimerTime: number;
  avgSpeed: number | null;
  maxSpeed: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgCadence: number | null;
  totalAscent: number | null;
  totalDescent: number | null;
};

export type ActivityMetadata = {
  device: string;
  date: Date;
  sport: string;
  duration: number;
};

export type LapRecord = {
  startTime: Date;
  totalDistance: number;
  totalTimerTime: number;
  avgSpeed: number | null;
  avgHeartRate: number | null;
  avgCadence: number | null;
  maxHeartRate: number | null;
  maxSpeed: number | null;
};

export type NormalizedActivity = {
  records: ActivityRecord[];
  summary: SummaryStats;
  metadata: ActivityMetadata;
  laps: LapRecord[];
};
