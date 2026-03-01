#!/usr/bin/env node
/**
 * Generate a sample FIT file for the FitViewer app.
 * Creates a simulated 5km run in Central Park, NYC with GPS, HR, cadence data.
 *
 * Usage: node scripts/generate-sample-fit.cjs [output-path]
 * Default output: public/sample.fit
 */

const fs = require("fs");
const path = require("path");

// FIT protocol constants
const FIT_EPOCH_OFFSET = 631065600; // Unix epoch to FIT epoch (Dec 31, 1989)

// CRC-16 for FIT files (CRC-16/ARC)
const CRC_TABLE = [
  0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001,
  0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
];

function fitCrc16(data) {
  let crc = 0;
  for (const byte of data) {
    let tmp = CRC_TABLE[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[byte & 0xf];
    tmp = CRC_TABLE[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xf];
  }
  return crc;
}

function degreesToSemicircles(deg) {
  return Math.round(deg * (Math.pow(2, 31) / 180));
}

class FitWriter {
  constructor() {
    this.dataBuffers = [];
    this.localMsgDefs = {};
  }

  writeDefinition(localMsgType, globalMsgNum, fields) {
    const buf = Buffer.alloc(6 + fields.length * 3);
    let offset = 0;
    buf[offset++] = 0x40 | (localMsgType & 0x0f); // definition header
    buf[offset++] = 0; // reserved
    buf[offset++] = 0; // architecture: little-endian
    buf.writeUInt16LE(globalMsgNum, offset);
    offset += 2;
    buf[offset++] = fields.length;
    for (const field of fields) {
      buf[offset++] = field.num;
      buf[offset++] = field.size;
      buf[offset++] = field.type;
    }
    this.dataBuffers.push(buf.subarray(0, offset));
    this.localMsgDefs[localMsgType] = fields;
  }

  writeData(localMsgType, values) {
    const fields = this.localMsgDefs[localMsgType];
    const totalSize =
      1 + fields.reduce((sum, f) => sum + f.size, 0);
    const buf = Buffer.alloc(totalSize);
    let offset = 0;
    buf[offset++] = localMsgType & 0x0f; // data header
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const value = values[i];
      switch (field.type) {
        case 0x00: // enum
        case 0x02: // uint8
        case 0x0a: // uint8z
          buf.writeUInt8(value, offset);
          break;
        case 0x01: // sint8
          buf.writeInt8(value, offset);
          break;
        case 0x83: // sint16
          buf.writeInt16LE(value, offset);
          break;
        case 0x84: // uint16
        case 0x8b: // uint16z
          buf.writeUInt16LE(value, offset);
          break;
        case 0x85: // sint32
          buf.writeInt32LE(value, offset);
          break;
        case 0x86: // uint32
        case 0x8c: // uint32z
          buf.writeUInt32LE(value, offset);
          break;
        default:
          buf.writeUInt8(value, offset);
      }
      offset += field.size;
    }
    this.dataBuffers.push(buf);
  }

  buildFile() {
    const dataContent = Buffer.concat(this.dataBuffers);
    const dataSize = dataContent.length;

    // File header (14 bytes)
    const header = Buffer.alloc(14);
    header[0] = 14; // header size
    header[1] = 0x20; // protocol version 2.0
    header.writeUInt16LE(2084, 2); // profile version
    header.writeUInt32LE(dataSize, 4); // data size
    header.write(".FIT", 8, 4, "ascii"); // data type
    const headerCrc = fitCrc16(header.subarray(0, 12));
    header.writeUInt16LE(headerCrc, 12);

    // File CRC (over header + data)
    const headerAndData = Buffer.concat([header, dataContent]);
    const fileCrc = fitCrc16(headerAndData);
    const fileCrcBuf = Buffer.alloc(2);
    fileCrcBuf.writeUInt16LE(fileCrc);

    return Buffer.concat([headerAndData, fileCrcBuf]);
  }
}

function generateSampleRun() {
  const writer = new FitWriter();

  // Run parameters
  const startDate = new Date("2026-02-28T07:30:00Z");
  const startTs =
    Math.floor(startDate.getTime() / 1000) - FIT_EPOCH_OFFSET;
  const totalDistM = 5000; // 5km
  const totalTimeS = 1500; // 25 minutes
  const numRecords = 150;
  const interval = totalTimeS / numRecords; // 10s

  // Route: Central Park, NYC - out and back
  const startLat = 40.7812;
  const startLon = -73.9665;
  const latRange = 0.018; // ~2km north
  const lonDrift = 0.002;

  // === file_id (mesg 0, local 0) ===
  writer.writeDefinition(0, 0, [
    { num: 0, size: 1, type: 0x00 }, // type: enum
    { num: 1, size: 2, type: 0x84 }, // manufacturer: uint16
    { num: 2, size: 2, type: 0x84 }, // product: uint16
    { num: 3, size: 4, type: 0x8c }, // serial_number: uint32z
    { num: 4, size: 4, type: 0x86 }, // time_created: uint32
  ]);
  writer.writeData(0, [4, 1, 3943, 3456789012, startTs]);

  // === record definition (mesg 20, local 1) ===
  writer.writeDefinition(1, 20, [
    { num: 253, size: 4, type: 0x86 }, // timestamp
    { num: 0, size: 4, type: 0x85 }, // position_lat: sint32 (semicircles)
    { num: 1, size: 4, type: 0x85 }, // position_long: sint32
    { num: 2, size: 2, type: 0x84 }, // altitude: uint16 (scale 5, offset -500)
    { num: 3, size: 1, type: 0x02 }, // heart_rate: uint8
    { num: 4, size: 1, type: 0x02 }, // cadence: uint8 (half-cycles)
    { num: 5, size: 4, type: 0x86 }, // distance: uint32 (scale 100)
    { num: 6, size: 2, type: 0x84 }, // speed: uint16 (scale 1000)
  ]);

  // Generate 150 records (every 10s for 25 min)
  for (let i = 0; i < numRecords; i++) {
    const t = i / (numRecords - 1); // 0..1
    const timestamp = startTs + Math.round(i * interval);

    // Out-and-back path
    const routeProgress = t <= 0.5 ? t * 2 : (1 - t) * 2;

    // Add wobble for a natural-looking path
    const wobble = Math.sin(t * Math.PI * 6) * 0.0003;
    const lat = startLat + routeProgress * latRange + wobble;
    const lon =
      startLon +
      routeProgress * lonDrift +
      Math.cos(t * Math.PI * 4) * 0.0002;

    // Elevation: hill in the middle (~30m base, +25m peak)
    const baseAlt = 30;
    const hill = 25 * Math.sin(routeProgress * Math.PI);
    const altNoise = Math.sin(t * Math.PI * 12) * 3;
    const altitude = baseAlt + hill + altNoise;

    // Heart rate: warm-up → build → cool-down
    let hr;
    if (t < 0.1) hr = 130 + t * 200;
    else if (t < 0.7) hr = 150 + (t - 0.1) * 30;
    else hr = 168 - (t - 0.7) * 40;
    hr = Math.round(hr + Math.sin(t * Math.PI * 8) * 3);

    // Cadence: ~85 half-cycles (170 spm)
    const cadence = Math.round(85 + Math.sin(t * Math.PI * 5) * 2);

    // Distance: cumulative in cm (scale 100)
    const distance = Math.round(t * totalDistM * 100);

    // Speed: ~3.33 m/s in mm/s (scale 1000), with variation
    const speedVar = 1 + Math.sin(t * Math.PI * 7) * 0.08;
    const speed = Math.round(3333 * speedVar);

    // Altitude encoding: (alt + 500) * 5
    const encodedAlt = Math.round((altitude + 500) * 5);

    writer.writeData(1, [
      timestamp,
      degreesToSemicircles(lat),
      degreesToSemicircles(lon),
      encodedAlt,
      hr,
      cadence,
      distance,
      speed,
    ]);
  }

  // === lap definition (mesg 19, local 2) ===
  writer.writeDefinition(2, 19, [
    { num: 253, size: 4, type: 0x86 }, // timestamp
    { num: 2, size: 4, type: 0x86 }, // start_time
    { num: 7, size: 4, type: 0x86 }, // total_elapsed_time (scale 1000)
    { num: 8, size: 4, type: 0x86 }, // total_timer_time (scale 1000)
    { num: 9, size: 4, type: 0x86 }, // total_distance (scale 100)
    { num: 13, size: 2, type: 0x84 }, // avg_speed (scale 1000)
    { num: 15, size: 1, type: 0x02 }, // avg_heart_rate
    { num: 16, size: 1, type: 0x02 }, // max_heart_rate
    { num: 17, size: 1, type: 0x02 }, // avg_cadence (half-cycles)
    { num: 21, size: 2, type: 0x84 }, // total_ascent
    { num: 22, size: 2, type: 0x84 }, // total_descent
    { num: 24, size: 1, type: 0x00 }, // lap_trigger: enum
  ]);

  const lap1End = startTs + Math.round(totalTimeS / 2);
  const lap2End = startTs + totalTimeS;

  // Lap 1: first 2.5km
  writer.writeData(2, [
    lap1End, startTs, 750000, 750000, 250000, 3333, 155, 168, 85, 25, 0, 2,
  ]);

  // Lap 2: second 2.5km
  writer.writeData(2, [
    lap2End, lap1End, 750000, 750000, 250000, 3333, 160, 170, 85, 0, 25, 7,
  ]);

  // === session definition (mesg 18, local 3) ===
  writer.writeDefinition(3, 18, [
    { num: 253, size: 4, type: 0x86 }, // timestamp
    { num: 2, size: 4, type: 0x86 }, // start_time
    { num: 7, size: 4, type: 0x86 }, // total_elapsed_time (scale 1000)
    { num: 8, size: 4, type: 0x86 }, // total_timer_time (scale 1000)
    { num: 9, size: 4, type: 0x86 }, // total_distance (scale 100)
    { num: 11, size: 2, type: 0x84 }, // total_calories
    { num: 14, size: 2, type: 0x84 }, // avg_speed (scale 1000)
    { num: 16, size: 1, type: 0x02 }, // avg_heart_rate
    { num: 17, size: 1, type: 0x02 }, // max_heart_rate
    { num: 18, size: 1, type: 0x02 }, // avg_cadence (half-cycles)
    { num: 22, size: 2, type: 0x84 }, // total_ascent
    { num: 23, size: 2, type: 0x84 }, // total_descent
    { num: 5, size: 1, type: 0x00 }, // sport: enum
    { num: 3, size: 4, type: 0x85 }, // start_position_lat
    { num: 4, size: 4, type: 0x85 }, // start_position_long
  ]);

  writer.writeData(3, [
    lap2End,
    startTs,
    1500000, // total_elapsed_time: 1500s
    1500000, // total_timer_time
    500000, // total_distance: 5000m
    380, // total_calories
    3333, // avg_speed: 3.333 m/s
    157, // avg_heart_rate
    170, // max_heart_rate
    85, // avg_cadence (half-cycles)
    25, // total_ascent
    25, // total_descent
    1, // sport: running
    degreesToSemicircles(startLat),
    degreesToSemicircles(startLon),
  ]);

  // === activity definition (mesg 34, local 4) ===
  writer.writeDefinition(4, 34, [
    { num: 253, size: 4, type: 0x86 }, // timestamp
    { num: 0, size: 4, type: 0x86 }, // total_timer_time (scale 1000)
    { num: 1, size: 2, type: 0x84 }, // num_sessions
    { num: 2, size: 1, type: 0x00 }, // type: enum
  ]);

  writer.writeData(4, [lap2End, 1500000, 1, 0]);

  return writer.buildFile();
}

const outputPath =
  process.argv[2] ||
  path.join(__dirname, "..", "public", "sample.fit");

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const fitData = generateSampleRun();
fs.writeFileSync(outputPath, fitData);
console.log(`Generated ${outputPath} (${fitData.length} bytes)`);
