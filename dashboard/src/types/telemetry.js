// dashboard/src/types/telemetry.js

// Session types
export const SessionTypes = {
  PRACTICE: 'practice',
  QUALIFYING: 'qualifying',
  RACE: 'race',
  TEST: 'test'
};

export const SessionStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Driver and team types
export const DriverCategory = {
  ROOKIE: 'rookie',
  AMATEUR: 'amateur',
  PRO: 'pro',
  PROFESSIONAL: 'professional'
};

// Telemetry parameter definitions
export const TelemetryParameters = {
  // Core parameters
  SPEED: 'speed',
  RPM: 'rpm',
  THROTTLE: 'throttle',
  BRAKE: 'brake',
  STEERING_ANGLE: 'steering_angle',
  GEAR: 'gear',
  
  // Position and GPS
  GPS_LATITUDE: 'gps_latitude',
  GPS_LONGITUDE: 'gps_longitude',
  GPS_SPEED: 'gps_speed',
  GPS_HEADING: 'gps_heading',
  GPS_ALTITUDE: 'gps_altitude',
  
  // Engine parameters
  COOLANT_TEMP: 'coolant_temp',
  OIL_TEMP: 'oil_temp',
  OIL_PRESSURE: 'oil_pressure',
  FUEL_LEVEL: 'fuel_level',
  FUEL_PRESSURE: 'fuel_pressure',
  
  // Suspension and dampers
  DAMPER_FL: 'damper_fl',
  DAMPER_FR: 'damper_fr',
  DAMPER_RL: 'damper_rl',
  DAMPER_RR: 'damper_rr',
  
  // Tire data
  TIRE_TEMP_FL: 'tire_temp_fl',
  TIRE_TEMP_FR: 'tire_temp_fr',
  TIRE_TEMP_RL: 'tire_temp_rl',
  TIRE_TEMP_RR: 'tire_temp_rr',
  TIRE_PRESSURE_FL: 'tire_pressure_fl',
  TIRE_PRESSURE_FR: 'tire_pressure_fr',
  TIRE_PRESSURE_RL: 'tire_pressure_rl',
  TIRE_PRESSURE_RR: 'tire_pressure_rr',
  
  // Environmental
  AMBIENT_TEMP: 'ambient_temp',
  TRACK_TEMP: 'track_temp',
  HUMIDITY: 'humidity',
  WIND_SPEED: 'wind_speed',
  WIND_DIRECTION: 'wind_direction',
  
  // Electrical
  BATTERY_VOLTAGE: 'battery_voltage',
  ALTERNATOR_VOLTAGE: 'alternator_voltage',
  
  // G-Forces
  G_FORCE_LAT: 'g_force_lat',
  G_FORCE_LONG: 'g_force_long',
  G_FORCE_VERT: 'g_force_vert'
};

// Parameter units and ranges
export const ParameterConfig = {
  [TelemetryParameters.SPEED]: {
    unit: 'km/h',
    min: 0,
    max: 300,
    decimals: 1
  },
  [TelemetryParameters.RPM]: {
    unit: 'rpm',
    min: 0,
    max: 10000,
    decimals: 0
  },
  [TelemetryParameters.THROTTLE]: {
    unit: '%',
    min: 0,
    max: 100,
    decimals: 1
  },
  [TelemetryParameters.BRAKE]: {
    unit: '%',
    min: 0,
    max: 100,
    decimals: 1
  },
  [TelemetryParameters.STEERING_ANGLE]: {
    unit: '°',
    min: -540,
    max: 540,
    decimals: 1
  },
  [TelemetryParameters.GEAR]: {
    unit: '',
    min: -1,
    max: 6,
    decimals: 0
  },
  [TelemetryParameters.COOLANT_TEMP]: {
    unit: '°C',
    min: 0,
    max: 150,
    decimals: 1
  },
  [TelemetryParameters.OIL_TEMP]: {
    unit: '°C',
    min: 0,
    max: 200,
    decimals: 1
  },
  [TelemetryParameters.OIL_PRESSURE]: {
    unit: 'bar',
    min: 0,
    max: 10,
    decimals: 2
  },
  [TelemetryParameters.FUEL_LEVEL]: {
    unit: '%',
    min: 0,
    max: 100,
    decimals: 1
  },
  [TelemetryParameters.TIRE_TEMP_FL]: {
    unit: '°C',
    min: 0,
    max: 150,
    decimals: 1
  },
  [TelemetryParameters.TIRE_PRESSURE_FL]: {
    unit: 'psi',
    min: 0,
    max: 50,
    decimals: 1
  },
  [TelemetryParameters.AMBIENT_TEMP]: {
    unit: '°C',
    min: -20,
    max: 60,
    decimals: 1
  },
  [TelemetryParameters.TRACK_TEMP]: {
    unit: '°C',
    min: -10,
    max: 80,
    decimals: 1
  },
  [TelemetryParameters.BATTERY_VOLTAGE]: {
    unit: 'V',
    min: 0,
    max: 16,
    decimals: 2
  },
  [TelemetryParameters.G_FORCE_LAT]: {
    unit: 'g',
    min: -3,
    max: 3,
    decimals: 2
  },
  [TelemetryParameters.G_FORCE_LONG]: {
    unit: 'g',
    min: -3,
    max: 3,
    decimals: 2
  }
};

// Data validation schemas
export const ValidationSchemas = {
  session: {
    required: ['session_name', 'driver_id', 'track_id', 'session_type'],
    optional: ['session_date', 'weather_conditions', 'notes']
  },
  telemetryPoint: {
    required: ['timestamp', 'session_id'],
    optional: Object.values(TelemetryParameters)
  },
  driver: {
    required: ['name', 'racing_number'],
    optional: ['team_id', 'category', 'nationality', 'birth_date', 'photo_url']
  },
  track: {
    required: ['name', 'length'],
    optional: ['location', 'country', 'layout_type', 'map_url']
  },
  lap: {
    required: ['session_id', 'lap_number', 'lap_time'],
    optional: ['sector_1_time', 'sector_2_time', 'sector_3_time', 'is_valid']
  }
};

// File format support
export const SupportedFileFormats = {
  TELEMETRY: ['.csv', '.json', '.ldx', '.ld', '.xls', '.xlsx'],
  TRACK_MAPS: ['.png', '.jpg', '.jpeg', '.svg', '.pdf'],
  DRIVER_PHOTOS: ['.png', '.jpg', '.jpeg', '.webp']
};

// Color schemes for data visualization
export const ChartColors = {
  PRIMARY: '#dc2626',      // Red
  SECONDARY: '#2563eb',    // Blue
  SUCCESS: '#16a34a',      // Green
  WARNING: '#d97706',      // Orange
  INFO: '#0891b2',         // Cyan
  PURPLE: '#9333ea',       // Purple
  PINK: '#e11d48',         // Pink
  INDIGO: '#4f46e5'        // Indigo
};

// Default chart configurations
export const DefaultChartConfig = {
  telemetryChart: {
    height: 400,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    colors: [ChartColors.PRIMARY, ChartColors.SECONDARY, ChartColors.SUCCESS, ChartColors.WARNING]
  },
  lapTimeChart: {
    height: 300,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
    colors: [ChartColors.PRIMARY]
  },
  comparisonChart: {
    height: 350,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
    colors: [ChartColors.PRIMARY, ChartColors.SECONDARY, ChartColors.SUCCESS]
  }
};

// Export utility functions
export const formatParameterValue = (parameter, value) => {
  const config = ParameterConfig[parameter];
  if (!config) return value;
  
  if (typeof value !== 'number') return value;
  
  const formatted = value.toFixed(config.decimals);
  return config.unit ? `${formatted} ${config.unit}` : formatted;
};

export const validateTelemetryData = (data, schema = 'telemetryPoint') => {
  const schemaConfig = ValidationSchemas[schema];
  if (!schemaConfig) return { valid: false, errors: ['Invalid schema'] };
  
  const errors = [];
  
  // Check required fields
  for (const field of schemaConfig.required) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate parameter ranges
  if (schema === 'telemetryPoint') {
    for (const [key, value] of Object.entries(data)) {
      if (key in ParameterConfig && typeof value === 'number') {
        const config = ParameterConfig[key];
        if (value < config.min || value > config.max) {
          errors.push(`${key} value ${value} is outside valid range (${config.min}-${config.max})`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const getParameterDisplayName = (parameter) => {
  return parameter
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};