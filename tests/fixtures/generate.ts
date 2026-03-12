/**
 * Generates test FIT fixture files using @garmin/fitsdk Encoder.
 *
 * Run: bun tests/fixtures/generate.ts
 *
 * Produces:
 *   - tests/fixtures/running.fit   (valid running activity)
 *   - tests/fixtures/cycling.fit   (valid cycling activity)
 *   - tests/fixtures/garbage.bin   (100 random bytes)
 */

import { Encoder, Profile } from "@garmin/fitsdk";

// Mesg numbers from the FIT Profile
const MESG_NUM_FILE_ID = 0;
const MESG_NUM_RECORD = 20;
const MESG_NUM_LAP = 19;
const MESG_NUM_SESSION = 18;

// Reference timestamp: 2026-03-10 08:00:00 UTC
const BASE_TIMESTAMP = new Date("2026-03-10T08:00:00Z");

function generateFitFile(sport: string): Uint8Array {
  const encoder = new Encoder();

  // File ID message (must be first)
  encoder.writeMesg({
    mesgNum: MESG_NUM_FILE_ID,
    type: "activity",
    manufacturer: "garmin",
    garminProduct: 4375, // FR965
    serialNumber: 3413000000,
    timeCreated: BASE_TIMESTAMP,
  });

  // Record messages (5 records, 1 second apart)
  const records = [
    { hr: 140, cadence: 85, speed: 3.5, alt: 100.0, dist: 0, lat: 519828467, lon: -844425437 },
    { hr: 145, cadence: 86, speed: 3.6, alt: 100.5, dist: 3.5, lat: 519828567, lon: -844425337 },
    { hr: 150, cadence: 87, speed: 3.7, alt: 101.0, dist: 7.2, lat: 519828667, lon: -844425237 },
    { hr: 148, cadence: 86, speed: 3.6, alt: 100.8, dist: 10.8, lat: 519828767, lon: -844425137 },
    { hr: 152, cadence: 88, speed: 3.8, alt: 101.5, dist: 14.6, lat: 519828867, lon: -844425037 },
  ];

  for (let i = 0; i < records.length; i++) {
    const r = records[i]!;
    encoder.writeMesg({
      mesgNum: MESG_NUM_RECORD,
      timestamp: new Date(BASE_TIMESTAMP.getTime() + i * 1000),
      heartRate: r.hr,
      cadence: r.cadence,
      enhancedSpeed: r.speed,
      enhancedAltitude: r.alt,
      distance: r.dist,
      positionLat: r.lat,
      positionLong: r.lon,
    });
  }

  // Lap message
  encoder.writeMesg({
    mesgNum: MESG_NUM_LAP,
    timestamp: new Date(BASE_TIMESTAMP.getTime() + 4000),
    startTime: BASE_TIMESTAMP,
    totalDistance: 14.6,
    totalTimerTime: 4.0,
    avgSpeed: 3.64,
    avgHeartRate: 147,
    avgCadence: 86,
    maxHeartRate: 152,
    maxSpeed: 3.8,
  });

  // Session message
  encoder.writeMesg({
    mesgNum: MESG_NUM_SESSION,
    timestamp: new Date(BASE_TIMESTAMP.getTime() + 4000),
    startTime: BASE_TIMESTAMP,
    sport: sport,
    totalDistance: 14.6,
    totalElapsedTime: 5.0,
    totalTimerTime: 4.0,
    avgSpeed: 3.64,
    enhancedAvgSpeed: 3.64,
    maxSpeed: 3.8,
    enhancedMaxSpeed: 3.8,
    avgHeartRate: 147,
    maxHeartRate: 152,
    avgCadence: 86, // half-cycles; avgRunningCadence expanded by decoder when sport=running
    totalAscent: 1,
    totalDescent: 0,
  });

  return encoder.close();
}

// Generate running FIT file
const runningData = generateFitFile("running");
await Bun.write("tests/fixtures/running.fit", runningData);
console.log(`Written tests/fixtures/running.fit (${runningData.length} bytes)`);

// Generate cycling FIT file
const cyclingData = generateFitFile("cycling");
await Bun.write("tests/fixtures/cycling.fit", cyclingData);
console.log(`Written tests/fixtures/cycling.fit (${cyclingData.length} bytes)`);

// Generate garbage binary
const garbage = new Uint8Array(100);
crypto.getRandomValues(garbage);
await Bun.write("tests/fixtures/garbage.bin", garbage);
console.log(`Written tests/fixtures/garbage.bin (${garbage.length} bytes)`);

console.log("Done!");
