// src/utils/telemetryParser.js

/**
 * Telemetry Parser for AiM RaceStudio CSV Files
 * Handles the 39-parameter Formula 4 telemetry format
 */

export class TelemetryParser {
  constructor() {
    this.parameterMapping = {
      0: 'timestamp',
      1: 'gps_speed',
      2: 'gps_nsat',
      3: 'gps_lat_acc',
      4: 'gps_lon_acc',
      5: 'gps_slope',
      6: 'gps_heading',
      7: 'gps_gyro',
      8: 'gps_altitude',
      9: 'gps_pos_accuracy',
      10: 'gps_spd_accuracy',
      11: 'gps_radius',
      12: 'gps_latitude',
      13: 'gps_longitude',
      14: 'logger_temp',
      15: 'water_temp',
      16: 'head_temp',
      17: 'exhaust_temp',
      18: 'oil_temp',
      19: 'engine_rpm',
      20: 'vehicle_speed',
      21: 'gear',
      22: 'throttle_pos',
      23: 'lambda_value',
      24: 'oil_press',
      25: 'brake_press',
      26: 'brake_pos',
      27: 'clutch_pos',
      28: 'steering_pos',
      29: 'lateral_acc',
      30: 'inline_acc',
      31: 'vertical_acc',
      32: 'battery',
      33: 'battery_voltage',
      34: 'fuel_level',
      35: 'distance_on_gps_speed',
      36: 'distance_on_vehicle_speed',
      37: 'predictive_time',
      38: 'predictive_time_alt'
    };
  }

  /**
   * Parse AiM RaceStudio CSV file
   * @param {string} csvContent - Raw CSV file content
   * @returns {Object} Parsed telemetry data with metadata
   */
  parseCSV(csvContent) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 17) {
        throw new Error('Invalid AiM RaceStudio format: File too short');
      }

      // Extract metadata from header (rows 1-16)
      const metadata = this.parseMetadata(lines);
      
      // Validate parameter structure
      this.validateParameterStructure(lines);
      
      // Parse telemetry data (starting from row 17)
      const telemetryData = this.parseTelemetryData(lines.slice(16));
      
      // Process lap detection
      const processedData = this.processLapDetection(telemetryData);
      
      // Calculate session statistics
      const statistics = this.calculateSessionStatistics(processedData);

      return {
        metadata: {
          ...metadata,
          ...statistics
        },
        telemetryData: processedData,
        rawDataPoints: processedData.length,
        parameterCount: 39,
        validationStatus: 'success'
      };
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract metadata from CSV header
   * @param {Array} lines - CSV lines array
   * @returns {Object} Metadata object
   */
  parseMetadata(lines) {
    const metadata = {
      driverName: this.extractValue(lines[1]) || 'Unknown Driver',
      sessionType: this.extractValue(lines[2]) || 'Unknown Session',
      vehicle: this.extractValue(lines[3]) || 'Formula 4',
      championship: this.extractValue(lines[4]) || 'Formula 4',
      trackName: this.extractValue(lines[5]) || 'Unknown Track',
      sessionDate: this.parseDate(this.extractValue(lines[6])),
      sessionTime: this.extractValue(lines[7]) || '00:00:00',
      totalLaps: parseInt(this.extractValue(lines[8])) || 0,
      fastestLapTime: parseFloat(this.extractValue(lines[9])) || 0,
      beaconMarkers: this.parseBeaconMarkers(lines[10]),
      segmentTimes: this.parseSegmentTimes(lines[11]),
      weatherConditions: this.extractValue(lines[12]) || 'Unknown',
      trackCondition: this.extractValue(lines[13]) || 'Dry',
      parameterCount: 39,
      dataStartRow: 17
    };

    return metadata;
  }

  /**
   * Extract value from CSV line
   * @param {string} line - CSV line
   * @returns {string} Extracted value
   */
  extractValue(line) {
    if (!line) return '';
    const parts = line.split(',');
    return parts.length > 1 ? parts[1].trim() : '';
  }

  /**
   * Parse date string
   * @param {string} dateStr - Date string
   * @returns {Date} Parsed date
   */
  parseDate(dateStr) {
    if (!dateStr) return new Date();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  /**
   * Parse beacon markers
   * @param {string} line - Beacon markers line
   * @returns {Array} Array of beacon positions
   */
  parseBeaconMarkers(line) {
    if (!line) return [];
    const parts = line.split(',').slice(1);
    return parts.map(marker => parseFloat(marker)).filter(marker => !isNaN(marker));
  }

  /**
   * Parse segment times
   * @param {string} line - Segment times line
   * @returns {Array} Array of segment times
   */
  parseSegmentTimes(line) {
    if (!line) return [];
    const parts = line.split(',').slice(1);
    return parts.map(time => parseFloat(time)).filter(time => !isNaN(time));
  }

  /**
   * Validate parameter structure
   * @param {Array} lines - CSV lines array
   */
  validateParameterStructure(lines) {
    if (lines.length < 14) {
      throw new Error('Missing parameter definition row');
    }

    const parameterLine = lines[13]; // Row 14 (0-indexed = 13)
    const parameters = parameterLine.split(',');
    
    if (parameters.length < 39) {
      throw new Error(`Invalid parameter count: Expected 39, got ${parameters.length}`);
    }
  }

  /**
   * Parse telemetry data rows
   * @param {Array} dataLines - Data lines starting from row 17
   * @returns {Array} Array of telemetry data points
   */
  parseTelemetryData(dataLines) {
    const telemetryData = [];
    
    dataLines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const values = line.split(',');
      if (values.length < 39) return;

      const dataPoint = {};
      
      // Map each value to its parameter name
      for (let i = 0; i < 39; i++) {
        const paramName = this.parameterMapping[i];
        const value = values[i];
        
        if (paramName && value !== undefined && value !== '') {
          // Convert to appropriate data type
          dataPoint[paramName] = this.convertValue(paramName, value);
        }
      }

      // Add row index for reference
      dataPoint.rowIndex = index;
      
      telemetryData.push(dataPoint);
    });

    return telemetryData;
  }

  /**
   * Convert string value to appropriate data type
   * @param {string} paramName - Parameter name
   * @param {string} value - String value
   * @returns {*} Converted value
   */
  convertValue(paramName, value) {
    const stringValue = value.toString().trim();
    
    // Integer parameters
    const integerParams = ['gps_nsat', 'engine_rpm', 'gear', 'battery'];
    if (integerParams.includes(paramName)) {
      const parsed = parseInt(stringValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Float parameters (all others)
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Process lap detection based on distance and beacon markers
   * @param {Array} telemetryData - Raw telemetry data
   * @returns {Array} Processed telemetry data with lap numbers
   */
  processLapDetection(telemetryData) {
    if (telemetryData.length === 0) return [];

    let currentLap = 1;
    let lastDistance = 0;
    let lapStartTime = telemetryData[0].timestamp || 0;
    const lapTimes = [];

    const processedData = telemetryData.map((point, index) => {
      const distance = point.distance_on_gps_speed || 0;
      
      // Detect lap completion (distance reset or significant decrease)
      if (distance < lastDistance && lastDistance > 1000 && index > 50) {
        // Record lap time
        const lapTime = (point.timestamp || 0) - lapStartTime;
        if (lapTime > 30) { // Minimum reasonable lap time (30 seconds)
          lapTimes.push({
            lapNumber: currentLap,
            lapTime: lapTime,
            endTime: point.timestamp || 0
          });
          
          currentLap++;
          lapStartTime = point.timestamp || 0;
        }
      }
      
      lastDistance = distance;
      
      return {
        ...point,
        lap_number: currentLap
      };
    });

    // Store lap times in the first data point for reference
    if (processedData.length > 0) {
      processedData[0].lapTimes = lapTimes;
    }

    return processedData;
  }

  /**
   * Calculate session statistics
   * @param {Array} telemetryData - Processed telemetry data
   * @returns {Object} Session statistics
   */
  calculateSessionStatistics(telemetryData) {
    if (telemetryData.length === 0) {
      return {
        maxSpeed: 0,
        maxRPM: 0,
        totalDistance: 0,
        sessionDuration: 0,
        averageSpeed: 0,
        dataQuality: 'poor'
      };
    }

    const speeds = telemetryData.map(p => p.gps_speed || 0);
    const rpms = telemetryData.map(p => p.engine_rpm || 0);
    const distances = telemetryData.map(p => p.distance_on_gps_speed || 0);
    const timestamps = telemetryData.map(p => p.timestamp || 0);

    const maxSpeed = Math.max(...speeds);
    const maxRPM = Math.max(...rpms);
    const totalDistance = Math.max(...distances);
    const sessionDuration = Math.max(...timestamps) - Math.min(...timestamps);
    const averageSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    // Calculate data quality based on GPS signal and data consistency
    const gpsQuality = this.assessGPSQuality(telemetryData);
    const dataConsistency = this.assessDataConsistency(telemetryData);
    const dataQuality = this.calculateOverallDataQuality(gpsQuality, dataConsistency);

    // Extract lap information
    const lapTimes = telemetryData[0]?.lapTimes || [];
    const fastestLapTime = lapTimes.length > 0 ? 
      Math.min(...lapTimes.map(lap => lap.lapTime)) : 0;

    return {
      maxSpeed,
      maxRPM,
      totalDistance,
      sessionDuration,
      averageSpeed,
      fastestLapTime,
      totalLaps: Math.max(...telemetryData.map(p => p.lap_number || 1)),
      dataQuality,
      gpsQuality,
      dataConsistency,
      lapTimes
    };
  }

  /**
   * Assess GPS data quality
   * @param {Array} telemetryData - Telemetry data
   * @returns {string} GPS quality rating
   */
  assessGPSQuality(telemetryData) {
    const gpsPoints = telemetryData.filter(p => 
      p.gps_latitude !== 0 && p.gps_longitude !== 0 && p.gps_nsat >= 4
    );
    
    const gpsRatio = gpsPoints.length / telemetryData.length;
    
    if (gpsRatio > 0.9) return 'excellent';
    if (gpsRatio > 0.7) return 'good';
    if (gpsRatio > 0.5) return 'fair';
    return 'poor';
  }

  /**
   * Assess data consistency
   * @param {Array} telemetryData - Telemetry data
   * @returns {string} Data consistency rating
   */
  assessDataConsistency(telemetryData) {
    // Check for missing data points and outliers
    const parameterCompleteness = [];
    const criticalParams = ['gps_speed', 'engine_rpm', 'throttle_pos', 'brake_press'];
    
    criticalParams.forEach(param => {
      const validPoints = telemetryData.filter(p => p[param] !== undefined && p[param] !== 0);
      parameterCompleteness.push(validPoints.length / telemetryData.length);
    });
    
    const avgCompleteness = parameterCompleteness.reduce((sum, val) => sum + val, 0) / 
                           parameterCompleteness.length;
    
    if (avgCompleteness > 0.95) return 'excellent';
    if (avgCompleteness > 0.85) return 'good';
    if (avgCompleteness > 0.70) return 'fair';
    return 'poor';
  }

  /**
   * Calculate overall data quality
   * @param {string} gpsQuality - GPS quality rating
   * @param {string} dataConsistency - Data consistency rating
   * @returns {string} Overall data quality
   */
  calculateOverallDataQuality(gpsQuality, dataConsistency) {
    const qualityScores = {
      'excellent': 4,
      'good': 3,
      'fair': 2,
      'poor': 1
    };
    
    const avgScore = (qualityScores[gpsQuality] + qualityScores[dataConsistency]) / 2;
    
    if (avgScore >= 3.5) return 'excellent';
    if (avgScore >= 2.5) return 'good';
    if (avgScore >= 1.5) return 'fair';
    return 'poor';
  }

  /**
   * Validate parsed data
   * @param {Object} parsedData - Parsed telemetry data
   * @returns {Object} Validation result
   */
  validateParsedData(parsedData) {
    const issues = [];
    const warnings = [];

    // Check metadata completeness
    if (!parsedData.metadata.driverName || parsedData.metadata.driverName === 'Unknown Driver') {
      warnings.push('Driver name not specified');
    }

    // Check data volume
    if (parsedData.telemetryData.length < 100) {
      issues.push('Insufficient data points for analysis');
    }

    // Check parameter coverage
    const samplePoint = parsedData.telemetryData[0] || {};
    const missingCriticalParams = ['gps_speed', 'engine_rpm', 'throttle_pos']
      .filter(param => !(param in samplePoint));
    
    if (missingCriticalParams.length > 0) {
      issues.push(`Missing critical parameters: ${missingCriticalParams.join(', ')}`);
    }

    // Check GPS data availability
    const gpsDataPoints = parsedData.telemetryData.filter(p => 
      p.gps_latitude !== 0 && p.gps_longitude !== 0
    );
    
    if (gpsDataPoints.length / parsedData.telemetryData.length < 0.5) {
      warnings.push('Limited GPS data available - track visualization may be incomplete');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      dataQuality: parsedData.metadata.dataQuality
    };
  }
}

// Export default instance
export const telemetryParser = new TelemetryParser();

// Export utility functions
export const parseAiMCSV = (csvContent) => {
  return telemetryParser.parseCSV(csvContent);
};

export const validateTelemetryData = (parsedData) => {
  return telemetryParser.validateParsedData(parsedData);
};