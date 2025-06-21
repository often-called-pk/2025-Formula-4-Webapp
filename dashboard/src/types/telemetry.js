// src/types/telemetry.js

/**
 * Type definitions and constants for Formula 4 telemetry data
 */

// Telemetry parameter definitions
export const TELEMETRY_PARAMETERS = {
  // GPS and positioning data
  TIMESTAMP: 'timestamp',
  GPS_SPEED: 'gps_speed',
  GPS_NSAT: 'gps_nsat',
  GPS_LAT_ACC: 'gps_lat_acc',
  GPS_LON_ACC: 'gps_lon_acc',
  GPS_SLOPE: 'gps_slope',
  GPS_HEADING: 'gps_heading',
  GPS_GYRO: 'gps_gyro',
  GPS_ALTITUDE: 'gps_altitude',
  GPS_POS_ACCURACY: 'gps_pos_accuracy',
  GPS_SPD_ACCURACY: 'gps_spd_accuracy',
  GPS_RADIUS: 'gps_radius',
  GPS_LATITUDE: 'gps_latitude',
  GPS_LONGITUDE: 'gps_longitude',
  
  // Temperature sensors
  LOGGER_TEMP: 'logger_temp',
  WATER_TEMP: 'water_temp',
  HEAD_TEMP: 'head_temp',
  EXHAUST_TEMP: 'exhaust_temp',
  OIL_TEMP: 'oil_temp',
  
  // Engine and drivetrain
  ENGINE_RPM: 'engine_rpm',
  VEHICLE_SPEED: 'vehicle_speed',
  GEAR: 'gear',
  THROTTLE_POS: 'throttle_pos',
  LAMBDA_VALUE: 'lambda_value',
  OIL_PRESS: 'oil_press',
  
  // Braking and steering
  BRAKE_PRESS: 'brake_press',
  BRAKE_POS: 'brake_pos',
  CLUTCH_POS: 'clutch_pos',
  STEERING_POS: 'steering_pos',
  
  // G-forces and acceleration
  LATERAL_ACC: 'lateral_acc',
  INLINE_ACC: 'inline_acc',
  VERTICAL_ACC: 'vertical_acc',
  
  // Electrical and fuel
  BATTERY: 'battery',
  BATTERY_VOLTAGE: 'battery_voltage',
  FUEL_LEVEL: 'fuel_level',
  
  // Distance and timing
  DISTANCE_ON_GPS_SPEED: 'distance_on_gps_speed',
  DISTANCE_ON_VEHICLE_SPEED: 'distance_on_vehicle_speed',
  PREDICTIVE_TIME: 'predictive_time',
  PREDICTIVE_TIME_ALT: 'predictive_time_alt',
  
  // Calculated fields
  LAP_NUMBER: 'lap_number'
};

// Parameter metadata with units, ranges, and display information
export const PARAMETER_METADATA = {
  [TELEMETRY_PARAMETERS.TIMESTAMP]: {
    label: 'Timestamp',
    unit: 's',
    type: 'float',
    range: [0, Infinity],
    color: '#6b7280',
    description: 'Time elapsed since session start'
  },
  [TELEMETRY_PARAMETERS.GPS_SPEED]: {
    label: 'GPS Speed',
    unit: 'km/h',
    type: 'float',
    range: [0, 350],
    color: '#3b82f6',
    description: 'GPS-calculated speed'
  },
  [TELEMETRY_PARAMETERS.VEHICLE_SPEED]: {
    label: 'Vehicle Speed',
    unit: 'km/h',
    type: 'float',
    range: [0, 350],
    color: '#06b6d4',
    description: 'Wheel speed sensor calculated speed'
  },
  [TELEMETRY_PARAMETERS.ENGINE_RPM]: {
    label: 'Engine RPM',
    unit: 'rpm',
    type: 'integer',
    range: [0, 15000],
    color: '#dc2626',
    description: 'Engine revolutions per minute'
  },
  [TELEMETRY_PARAMETERS.THROTTLE_POS]: {
    label: 'Throttle Position',
    unit: '%',
    type: 'float',
    range: [0, 100],
    color: '#16a34a',
    description: 'Throttle pedal position percentage'
  },
  [TELEMETRY_PARAMETERS.BRAKE_PRESS]: {
    label: 'Brake Pressure',
    unit: 'bar',
    type: 'float',
    range: [0, 150],
    color: '#ea580c',
    description: 'Hydraulic brake pressure'
  },
  [TELEMETRY_PARAMETERS.BRAKE_POS]: {
    label: 'Brake Position',
    unit: '%',
    type: 'float',
    range: [0, 100],
    color: '#f59e0b',
    description: 'Brake pedal position percentage'
  },
  [TELEMETRY_PARAMETERS.STEERING_POS]: {
    label: 'Steering Position',
    unit: '°',
    type: 'float',
    range: [-540, 540],
    color: '#8b5cf6',
    description: 'Steering wheel angle'
  },
  [TELEMETRY_PARAMETERS.LATERAL_ACC]: {
    label: 'Lateral G-Force',
    unit: 'g',
    type: 'float',
    range: [-4, 4],
    color: '#ec4899',
    description: 'Lateral acceleration (cornering)'
  },
  [TELEMETRY_PARAMETERS.INLINE_ACC]: {
    label: 'Longitudinal G-Force',
    unit: 'g',
    type: 'float',
    range: [-4, 4],
    color: '#06b6d4',
    description: 'Longitudinal acceleration (braking/acceleration)'
  },
  [TELEMETRY_PARAMETERS.VERTICAL_ACC]: {
    label: 'Vertical G-Force',
    unit: 'g',
    type: 'float',
    range: [-3, 3],
    color: '#84cc16',
    description: 'Vertical acceleration'
  },
  [TELEMETRY_PARAMETERS.LAMBDA_VALUE]: {
    label: 'Lambda (AFR)',
    unit: 'λ',
    type: 'float',
    range: [0.7, 1.3],
    color: '#f97316',
    description: 'Air-fuel ratio lambda value'
  },
  [TELEMETRY_PARAMETERS.OIL_TEMP]: {
    label: 'Oil Temperature',
    unit: '°C',
    type: 'float',
    range: [60, 150],
    color: '#dc2626',
    description: 'Engine oil temperature'
  },
  [TELEMETRY_PARAMETERS.WATER_TEMP]: {
    label: 'Water Temperature',
    unit: '°C',
    type: 'float',
    range: [70, 120],
    color: '#2563eb',
    description: 'Coolant temperature'
  },
  [TELEMETRY_PARAMETERS.EXHAUST_TEMP]: {
    label: 'Exhaust Temperature',
    unit: '°C',
    type: 'float',
    range: [300, 900],
    color: '#dc2626',
    description: 'Exhaust gas temperature'
  },
  [TELEMETRY_PARAMETERS.GEAR]: {
    label: 'Gear',
    unit: '',
    type: 'integer',
    range: [-1, 6],
    color: '#6b7280',
    description: 'Current gear (-1 = reverse, 0 = neutral)'
  },
  [TELEMETRY_PARAMETERS.FUEL_LEVEL]: {
    label: 'Fuel Level',
    unit: '%',
    type: 'float',
    range: [0, 100],
    color: '#059669',
    description: 'Remaining fuel percentage'
  },
  [TELEMETRY_PARAMETERS.GPS_LATITUDE]: {
    label: 'GPS Latitude',
    unit: '°',
    type: 'float',
    range: [-90, 90],
    color: '#7c3aed',
    description: 'GPS latitude coordinate'
  },
  [TELEMETRY_PARAMETERS.GPS_LONGITUDE]: {
    label: 'GPS Longitude',
    unit: '°',
    type: 'float',
    range: [-180, 180],
    color: '#7c3aed',
    description: 'GPS longitude coordinate'
  }
};

// Session types
export const SESSION_TYPES = {
  PRACTICE: 'Practice',
  QUALIFYING: 'Qualifying',
  RACE: 'Race',
  TEST: 'Test',
  FREE_PRACTICE: 'Free Practice'
};

// Data quality levels
export const DATA_QUALITY_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
};

// Analysis categories
export const ANALYSIS_CATEGORIES = {
  PERFORMANCE: 'performance',
  CONSISTENCY: 'consistency',
  EFFICIENCY: 'efficiency',
  TECHNIQUE: 'technique',
  COMPARISON: 'comparison'
};

// Recommendation priorities
export const RECOMMENDATION_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Export validation functions
export const validateTelemetryPoint = (point) => {
  const requiredFields = [
    TELEMETRY_PARAMETERS.TIMESTAMP,
    TELEMETRY_PARAMETERS.GPS_SPEED,
    TELEMETRY_PARAMETERS.ENGINE_RPM
  ];
  
  return requiredFields.every(field => 
    point.hasOwnProperty(field) && 
    typeof point[field] === 'number' && 
    !isNaN(point[field])
  );
};

export const validateSession = (session) => {
  const requiredMetadata = ['driverName', 'sessionType', 'vehicle'];
  const metadataValid = requiredMetadata.every(field => 
    session.metadata && session.metadata[field]
  );
  
  const hasValidTelemetry = session.telemetryData && 
    Array.isArray(session.telemetryData) && 
    session.telemetryData.length > 0;
  
  return metadataValid && hasValidTelemetry;
};

// Parameter groupings for UI organization
export const PARAMETER_GROUPS = {
  SPEED_AND_POSITION: {
    label: 'Speed & Position',
    parameters: [
      TELEMETRY_PARAMETERS.GPS_SPEED,
      TELEMETRY_PARAMETERS.VEHICLE_SPEED,
      TELEMETRY_PARAMETERS.GPS_LATITUDE,
      TELEMETRY_PARAMETERS.GPS_LONGITUDE,
      TELEMETRY_PARAMETERS.DISTANCE_ON_GPS_SPEED
    ],
    color: '#3b82f6'
  },
  
  ENGINE_PERFORMANCE: {
    label: 'Engine Performance',
    parameters: [
      TELEMETRY_PARAMETERS.ENGINE_RPM,
      TELEMETRY_PARAMETERS.THROTTLE_POS,
      TELEMETRY_PARAMETERS.GEAR,
      TELEMETRY_PARAMETERS.LAMBDA_VALUE,
      TELEMETRY_PARAMETERS.OIL_PRESS
    ],
    color: '#dc2626'
  },
  
  BRAKING_AND_STEERING: {
    label: 'Braking & Steering',
    parameters: [
      TELEMETRY_PARAMETERS.BRAKE_PRESS,
      TELEMETRY_PARAMETERS.BRAKE_POS,
      TELEMETRY_PARAMETERS.STEERING_POS,
      TELEMETRY_PARAMETERS.CLUTCH_POS
    ],
    color: '#ea580c'
  },
  
  G_FORCES: {
    label: 'G-Forces',
    parameters: [
      TELEMETRY_PARAMETERS.LATERAL_ACC,
      TELEMETRY_PARAMETERS.INLINE_ACC,
      TELEMETRY_PARAMETERS.VERTICAL_ACC
    ],
    color: '#ec4899'
  },
  
  TEMPERATURES: {
    label: 'Temperatures',
    parameters: [
      TELEMETRY_PARAMETERS.OIL_TEMP,
      TELEMETRY_PARAMETERS.WATER_TEMP,
      TELEMETRY_PARAMETERS.EXHAUST_TEMP,
      TELEMETRY_PARAMETERS.HEAD_TEMP
    ],
    color: '#f97316'
  },
  
  ELECTRICAL_AND_FUEL: {
    label: 'Electrical & Fuel',
    parameters: [
      TELEMETRY_PARAMETERS.BATTERY,
      TELEMETRY_PARAMETERS.BATTERY_VOLTAGE,
      TELEMETRY_PARAMETERS.FUEL_LEVEL
    ],
    color: '#059669'
  }
};

// Performance thresholds for Formula 4
export const F4_PERFORMANCE_THRESHOLDS = {
  SPEED: {
    EXCELLENT: 250,  // km/h
    GOOD: 200,
    FAIR: 150
  },
  
  RPM: {
    REDLINE: 13500,
    OPTIMAL_RANGE: [8000, 12000],
    SHIFT_POINT: 12500
  },
  
  G_FORCE: {
    LATERAL_MAX: 3.0,    // g
    LONGITUDINAL_MAX: 3.5, // g
    PROFESSIONAL: 2.5    // Consistent professional level
  },
  
  LAMBDA: {
    OPTIMAL_RANGE: [0.95, 1.05],
    POWER_RANGE: [0.85, 0.95],
    ECONOMY_RANGE: [1.05, 1.15]
  },
  
  TEMPERATURES: {
    OIL_OPTIMAL: [90, 100],     // °C
    OIL_MAX: 120,
    WATER_OPTIMAL: [80, 90],    // °C
    WATER_MAX: 105,
    EXHAUST_MAX: 850            // °C
  },
  
  LAP_TIME: {
    TARGET_IMPROVEMENT: 0.5,    // seconds per session
    CONSISTENCY_THRESHOLD: 1.0  // within 1 second for consistency
  }
};

// Export type definitions as default
export default {
  TELEMETRY_PARAMETERS,
  PARAMETER_METADATA,
  SESSION_TYPES,
  DATA_QUALITY_LEVELS,
  ANALYSIS_CATEGORIES,
  RECOMMENDATION_PRIORITIES,
  PARAMETER_GROUPS,
  F4_PERFORMANCE_THRESHOLDS,
  validateTelemetryPoint,
  validateSession
};