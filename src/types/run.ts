export interface RunData {
  summary: RunSummary;
  records: DataPoint[];
  laps: Lap[];
  sessions: Session[];
}

export interface RunSummary {
  startTime: Date;
  totalDistance: number; // meters
  totalTime: number; // seconds
  movingTime: number; // seconds
  avgPace: number; // sec/km
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  totalAscent: number; // meters
  totalDescent: number; // meters
  calories: number;
}

export interface DataPoint {
  timestamp: Date;
  lat: number;
  lon: number;
  altitude: number; // meters
  heartRate: number; // bpm
  pace: number; // sec/km
  speed: number; // m/s
  cadence: number; // spm
  strideLength: number; // meters
  distance: number; // cumulative meters
}

export interface Lap {
  type: "auto" | "manual";
  startIndex: number;
  endIndex: number;
  distance: number; // meters
  totalTime: number; // seconds
  avgPace: number; // sec/km
  avgHeartRate: number;
  avgCadence: number;
  elevationGain: number; // meters
}

export interface Session {
  sport: string;
  subSport: string;
  startTime: Date;
  totalDistance: number; // meters
  totalTime: number; // seconds
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  totalAscent: number; // meters
  totalDescent: number; // meters
  calories: number;
}
