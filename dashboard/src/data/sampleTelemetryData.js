// src/data/sampleTelemetryData.js

/**
 * Sample telemetry data for Formula 4 Race Analytics
 * Used for testing and demonstration purposes
 */

export const generateSampleTelemetryData = (driverName, sessionType = 'Practice') => {
  const dataPoints = [];
  const lapCount = 5;
  const pointsPerLap = 200;
  
  for (let lap = 1; lap <= lapCount; lap++) {
    for (let point = 0; point < pointsPerLap; point++) {
      const progress = point / pointsPerLap;
      const timestamp = (lap - 1) * 90 + progress * 90; // 90 second laps
      
      // Generate realistic telemetry data
      const speed = 50 + Math.sin(progress * Math.PI * 4) * 100 + Math.random() * 20;
      const rpm = 6000 + Math.sin(progress * Math.PI * 3) * 4000 + Math.random() * 500;
      const throttle = Math.max(0, Math.min(100, 30 + Math.sin(progress * Math.PI * 2) * 50 + Math.random() * 20));
      
      dataPoints.push({
        timestamp: timestamp,
        gps_speed: Math.max(0, speed),
        gps_nsat: 8 + Math.floor(Math.random() * 4),
        gps_lat_acc: Math.random() * 0.1,
        gps_lon_acc: Math.random() * 0.1,
        gps_slope: Math.random() * 5 - 2.5,
        gps_heading: progress * 360,
        gps_gyro: Math.random() * 10 - 5,
        gps_altitude: 100 + Math.random() * 50,
        gps_pos_accuracy: Math.random() * 5,
        gps_spd_accuracy: Math.random() * 2,
        gps_radius: 50 + Math.random() * 200,
        gps_latitude: 37.7749 + Math.random() * 0.01,
        gps_longitude: -122.4194 + Math.random() * 0.01,
        logger_temp: 25 + Math.random() * 10,
        water_temp: 85 + Math.random() * 15,
        head_temp: 90 + Math.random() * 20,
        exhaust_temp: 600 + Math.random() * 100,
        oil_temp: 95 + Math.random() * 20,
        engine_rpm: Math.max(1000, rpm),
        vehicle_speed: Math.max(0, speed + Math.random() * 5),
        gear: Math.max(1, Math.min(6, Math.floor(speed / 40) + 1)),
        throttle_pos: throttle,
        lambda_value: 0.9 + Math.random() * 0.3,
        oil_press: 3 + Math.random() * 2,
        brake_press: progress > 0.8 || progress < 0.2 ? Math.random() * 80 : Math.random() * 20,
        brake_pos: progress > 0.8 || progress < 0.2 ? Math.random() * 90 : Math.random() * 10,
        clutch_pos: Math.random() * 20,
        steering_pos: Math.sin(progress * Math.PI * 6) * 180 + Math.random() * 20,
        lateral_acc: Math.sin(progress * Math.PI * 6) * 2.5 + Math.random() * 0.5,
        inline_acc: (throttle > 70 ? 1.5 : -1.5) + Math.random() * 0.5,
        vertical_acc: Math.random() * 0.5 - 0.25,
        battery: 12 + Math.random() * 2,
        battery_voltage: 12.5 + Math.random() * 1,
        fuel_level: 100 - (timestamp / 450) * 20 + Math.random() * 5,
        distance_on_gps_speed: progress * 2500 + (lap - 1) * 2500,
        distance_on_vehicle_speed: progress * 2500 + (lap - 1) * 2500,
        predictive_time: timestamp + Math.random() * 2,
        predictive_time_alt: timestamp + Math.random() * 1.5,
        lap_number: lap
      });
    }
  }
  
  return dataPoints;
};

export const createSampleSession = (driverName, sessionType = 'Practice') => {
  const telemetryData = generateSampleTelemetryData(driverName, sessionType);
  const fastestLap = 87.5 + Math.random() * 5; // Random lap time around 87-92 seconds
  
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fileName: `${driverName.replace(' ', '_')}_${sessionType}_${new Date().toISOString().slice(0, 10)}.csv`,
    fileSize: 1024 * 1024 * 2.5, // ~2.5MB
    format: 'AiM_RaceStudio',
    uploadedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    processed: true,
    status: 'processed',
    metadata: {
      driverName: driverName,
      sessionType: sessionType,
      vehicle: 'Formula 4',
      championship: 'Formula 4 Championship',
      trackName: 'Silverstone Circuit',
      sessionDate: new Date(),
      sessionTime: '14:30:00',
      totalLaps: 5,
      fastestLapTime: fastestLap,
      beaconMarkers: [0, 800, 1600, 2400],
      segmentTimes: [28.5, 31.2, 27.8],
      parameterCount: 39,
      dataStartRow: 17
    },
    telemetryData: telemetryData,
    parameterNames: [
      'timestamp', 'gps_speed', 'gps_nsat', 'gps_lat_acc', 'gps_lon_acc',
      'gps_slope', 'gps_heading', 'gps_gyro', 'gps_altitude', 'gps_pos_accuracy',
      'gps_spd_accuracy', 'gps_radius', 'gps_latitude', 'gps_longitude', 'logger_temp',
      'water_temp', 'head_temp', 'exhaust_temp', 'oil_temp', 'engine_rpm',
      'vehicle_speed', 'gear', 'throttle_pos', 'lambda_value', 'oil_press',
      'brake_press', 'brake_pos', 'clutch_pos', 'steering_pos', 'lateral_acc',
      'inline_acc', 'vertical_acc', 'battery', 'battery_voltage', 'fuel_level',
      'distance_on_gps_speed', 'distance_on_vehicle_speed', 'predictive_time', 'predictive_time_alt'
    ],
    totalDataPoints: telemetryData.length
  };
};

// Create sample sessions for demonstration
export const sampleSessions = [
  createSampleSession('Aqil Alibhai', 'Race'),
  createSampleSession('Jaden Pariat', 'Race')
];

export default {
  generateSampleTelemetryData,
  createSampleSession,
  sampleSessions
};