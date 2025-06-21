// src/utils/analysisEngine.js

/**
 * Analysis Engine for Formula 4 Telemetry Data
 * Provides comprehensive performance analysis and metrics calculation
 */

export class AnalysisEngine {
  constructor() {
    this.analysisCache = new Map();
    this.performanceThresholds = {
      speed: { excellent: 250, good: 200, fair: 150 },
      rpm: { excellent: 12000, good: 10000, fair: 8000 },
      gforce: { excellent: 2.5, good: 2.0, fair: 1.5 },
      lambda: { optimal: [0.95, 1.05], acceptable: [0.85, 1.15] }
    };
  }

  /**
   * Perform comprehensive session analysis
   * @param {Object} session - Telemetry session data
   * @returns {Object} Complete analysis results
   */
  analyzeSession(session) {
    const cacheKey = `${session.id}_${session.processedAt}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const analysis = {
      sessionId: session.id,
      driverName: session.metadata.driverName,
      analyzedAt: new Date().toISOString(),
      
      // Core performance metrics
      performance: this.calculatePerformanceMetrics(session.telemetryData),
      
      // Lap analysis
      lapAnalysis: this.analyzeLaps(session.telemetryData),
      
      // Speed analysis
      speedAnalysis: this.analyzeSpeed(session.telemetryData),
      
      // Engine performance
      engineAnalysis: this.analyzeEngine(session.telemetryData),
      
      // G-force analysis
      gforceAnalysis: this.analyzeGForces(session.telemetryData),
      
      // Braking analysis
      brakingAnalysis: this.analyzeBraking(session.telemetryData),
      
      // Lambda (fuel) analysis
      lambdaAnalysis: this.analyzeLambda(session.telemetryData),
      
      // Driving style analysis
      drivingStyle: this.analyzeDrivingStyle(session.telemetryData),
      
      // Track sectors analysis
      sectorAnalysis: this.analyzeSectors(session.telemetryData),
      
      // Consistency metrics
      consistencyAnalysis: this.analyzeConsistency(session.telemetryData),
      
      // Overall performance score
      performanceScore: 0
    };

    // Calculate overall performance score
    analysis.performanceScore = this.calculateOverallScore(analysis);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Calculate core performance metrics
   * @param {Array} telemetryData - Array of telemetry data points
   * @returns {Object} Performance metrics
   */
  calculatePerformanceMetrics(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const speeds = telemetryData.map(p => p.gps_speed || 0);
    const rpms = telemetryData.map(p => p.engine_rpm || 0);
    const throttlePositions = telemetryData.map(p => p.throttle_pos || 0);
    const brakePressures = telemetryData.map(p => p.brake_press || 0);

    return {
      maxSpeed: Math.max(...speeds),
      avgSpeed: this.calculateAverage(speeds),
      speedStdDev: this.calculateStandardDeviation(speeds),
      
      maxRPM: Math.max(...rpms),
      avgRPM: this.calculateAverage(rpms),
      rpmEfficiency: this.calculateRPMEfficiency(rpms, speeds),
      
      maxThrottle: Math.max(...throttlePositions),
      avgThrottle: this.calculateAverage(throttlePositions),
      throttleConsistency: this.calculateConsistencyScore(throttlePositions),
      
      maxBrakePressure: Math.max(...brakePressures),
      avgBrakePressure: this.calculateAverage(brakePressures.filter(p => p > 0)),
      brakingEvents: brakePressures.filter(p => p > 10).length,
      
      dataQuality: this.assessDataQuality(telemetryData),
      performanceRating: this.calculatePerformanceRating(speeds, rpms)
    };
  }

  /**
   * Analyze lap performance
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} Lap analysis results
   */
  analyzeLaps(telemetryData) {
    const lapData = this.groupDataByLap(telemetryData);
    const lapTimes = [];
    const lapPerformance = [];

    Object.entries(lapData).forEach(([lapNumber, data]) => {
      const lap = parseInt(lapNumber);
      const lapStartTime = Math.min(...data.map(p => p.timestamp || 0));
      const lapEndTime = Math.max(...data.map(p => p.timestamp || 0));
      const lapTime = lapEndTime - lapStartTime;

      if (lapTime > 30 && lapTime < 300) { // Reasonable lap time range
        lapTimes.push({
          lapNumber: lap,
          lapTime: lapTime,
          avgSpeed: this.calculateAverage(data.map(p => p.gps_speed || 0)),
          maxSpeed: Math.max(...data.map(p => p.gps_speed || 0)),
          avgRPM: this.calculateAverage(data.map(p => p.engine_rpm || 0))
        });
      }
    });

    // Sort lap times to find fastest
    lapTimes.sort((a, b) => a.lapTime - b.lapTime);

    return {
      totalLaps: Object.keys(lapData).length,
      fastestLap: lapTimes[0] || null,
      averageLapTime: lapTimes.length > 0 ? 
        this.calculateAverage(lapTimes.map(l => l.lapTime)) : 0,
      lapTimeConsistency: this.calculateConsistencyScore(lapTimes.map(l => l.lapTime)),
      lapTimes: lapTimes.slice(0, 10), // Keep top 10 laps
      improvement: this.calculateLapImprovement(lapTimes)
    };
  }

  /**
   * Analyze speed performance
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} Speed analysis results
   */
  analyzeSpeed(telemetryData) {
    const speeds = telemetryData.map(p => p.gps_speed || 0);
    const distances = telemetryData.map(p => p.distance_on_gps_speed || 0);
    
    // Speed zones analysis
    const speedZones = this.calculateSpeedZones(speeds, distances);
    
    // Acceleration analysis
    const accelerationData = this.calculateAcceleration(telemetryData);
    
    return {
      maxSpeed: Math.max(...speeds),
      avgSpeed: this.calculateAverage(speeds),
      speedDistribution: this.calculateSpeedDistribution(speeds),
      speedZones: speedZones,
      topSpeedLocations: this.findTopSpeedLocations(speeds, distances),
      acceleration: accelerationData,
      speedConsistency: this.calculateConsistencyScore(speeds),
      speedEfficiency: this.calculateSpeedEfficiency(speeds, telemetryData)
    };
  }

  /**
   * Analyze engine performance
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} Engine analysis results
   */
  analyzeEngine(telemetryData) {
    const rpms = telemetryData.map(p => p.engine_rpm || 0);
    const gears = telemetryData.map(p => p.gear || 1);
    const throttle = telemetryData.map(p => p.throttle_pos || 0);

    return {
      maxRPM: Math.max(...rpms),
      avgRPM: this.calculateAverage(rpms),
      rpmDistribution: this.calculateRPMDistribution(rpms),
      gearUsage: this.analyzeGearUsage(gears),
      shiftPoints: this.analyzeShiftPoints(telemetryData),
      engineEfficiency: this.calculateEngineEfficiency(rpms, throttle),
      optimalRPMUsage: this.calculateOptimalRPMUsage(rpms),
      powerband: this.analyzePowerband(rpms, telemetryData)
    };
  }

  /**
   * Analyze G-force data
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} G-force analysis results
   */
  analyzeGForces(telemetryData) {
    const lateralG = telemetryData.map(p => p.lateral_acc || 0);
    const longitudinalG = telemetryData.map(p => p.inline_acc || 0);
    const verticalG = telemetryData.map(p => p.vertical_acc || 0);

    return {
      maxLateralG: Math.max(...lateralG.map(Math.abs)),
      maxLongitudinalG: Math.max(...longitudinalG.map(Math.abs)),
      maxVerticalG: Math.max(...verticalG.map(Math.abs)),
      gforceEnvelope: this.calculateGForceEnvelope(lateralG, longitudinalG),
      corneringPerformance: this.analyzeCorneringPerformance(lateralG, telemetryData),
      brakingGForce: this.analyzeBrakingGForce(longitudinalG, telemetryData),
      accelerationGForce: this.analyzeAccelerationGForce(longitudinalG, telemetryData),
      gforceConsistency: this.calculateGForceConsistency(lateralG, longitudinalG)
    };
  }

  /**
   * Analyze braking performance
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} Braking analysis results
   */
  analyzeBraking(telemetryData) {
    const brakePressure = telemetryData.map(p => p.brake_press || 0);
    const brakePosition = telemetryData.map(p => p.brake_pos || 0);
    const steering = telemetryData.map(p => p.steering_pos || 0);

    const brakingEvents = this.identifyBrakingEvents(telemetryData);
    
    return {
      maxBrakePressure: Math.max(...brakePressure),
      avgBrakePressure: this.calculateAverage(brakePressure.filter(p => p > 0)),
      brakingEvents: brakingEvents.length,
      trailBraking: this.analyzeTrailBraking(brakePressure, steering),
      brakingZones: this.identifyBrakingZones(telemetryData),
      brakingEfficiency: this.calculateBrakingEfficiency(brakingEvents),
      brakeBalance: this.analyzeBrakeBalance(telemetryData),
      brakingConsistency: this.calculateBrakingConsistency(brakingEvents)
    };
  }

  /**
   * Analyze lambda (air-fuel ratio) data
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} Lambda analysis results
   */
  analyzeLambda(telemetryData) {
    const lambdaValues = telemetryData
      .map(p => p.lambda_value || 1.0)
      .filter(v => v > 0.5 && v < 1.5); // Filter reasonable values

    if (lambdaValues.length === 0) {
      return this.getEmptyLambdaAnalysis();
    }

    return {
      avgLambda: this.calculateAverage(lambdaValues),
      lambdaRange: [Math.min(...lambdaValues), Math.max(...lambdaValues)],
      lambdaConsistency: this.calculateConsistencyScore(lambdaValues),
      fuelEfficiency: this.calculateFuelEfficiency(lambdaValues),
      optimalZones: this.identifyOptimalLambdaZones(lambdaValues, telemetryData),
      richLeanRatio: this.calculateRichLeanRatio(lambdaValues),
      lambdaByRPM: this.analyzeLambdaByRPM(telemetryData)
    };
  }

  /**
   * Analyze driving style
   * @param {Array} telemetryData - Telemetry data
   * @returns {Object} Driving style analysis
   */
  analyzeDrivingStyle(telemetryData) {
    const aggressiveness = this.calculateAggressiveness(telemetryData);
    const smoothness = this.calculateSmoothness(telemetryData);
    const consistency = this.calculateOverallConsistency(telemetryData);

    return {
      aggressiveness: aggressiveness,
      smoothness: smoothness,
      consistency: consistency,
      style: this.classifyDrivingStyle(aggressiveness, smoothness),
      strengths: this.identifyDrivingStrengths(telemetryData),
      weaknesses: this.identifyDrivingWeaknesses(telemetryData),
      adaptability: this.calculateAdaptability(telemetryData)
    };
  }

  // Utility methods for calculations

  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const avg = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.calculateAverage(squaredDiffs));
  }

  calculateConsistencyScore(values) {
    if (values.length === 0) return 0;
    const stdDev = this.calculateStandardDeviation(values);
    const avg = this.calculateAverage(values);
    return avg > 0 ? Math.max(0, 100 - (stdDev / avg) * 100) : 0;
  }

  groupDataByLap(telemetryData) {
    const lapData = {};
    telemetryData.forEach(point => {
      const lap = point.lap_number || 1;
      if (!lapData[lap]) lapData[lap] = [];
      lapData[lap].push(point);
    });
    return lapData;
  }

  calculateSpeedZones(speeds, distances) {
    const zones = {
      low: { min: 0, max: 100, count: 0, distance: 0 },
      medium: { min: 100, max: 200, count: 0, distance: 0 },
      high: { min: 200, max: 300, count: 0, distance: 0 }
    };

    speeds.forEach((speed, index) => {
      const distance = distances[index] || 0;
      if (speed <= 100) {
        zones.low.count++;
        zones.low.distance += distance;
      } else if (speed <= 200) {
        zones.medium.count++;
        zones.medium.distance += distance;
      } else {
        zones.high.count++;
        zones.high.distance += distance;
      }
    });

    return zones;
  }

  calculateOverallScore(analysis) {
    let score = 0;
    let factors = 0;

    // Speed score (25%)
    if (analysis.performance.maxSpeed > 0) {
      score += (analysis.performance.maxSpeed / 300) * 25;
      factors++;
    }

    // Consistency score (25%)
    if (analysis.consistencyAnalysis) {
      score += (analysis.consistencyAnalysis.overallConsistency / 100) * 25;
      factors++;
    }

    // Lap time score (25%)
    if (analysis.lapAnalysis.fastestLap) {
      // Assume target lap time of 90 seconds for scoring
      const lapScore = Math.max(0, 100 - (analysis.lapAnalysis.fastestLap.lapTime - 90));
      score += (lapScore / 100) * 25;
      factors++;
    }

    // Technical performance score (25%)
    const techScore = (
      analysis.engineAnalysis.engineEfficiency +
      analysis.brakingAnalysis.brakingEfficiency +
      analysis.lambdaAnalysis.fuelEfficiency
    ) / 3;
    score += (techScore / 100) * 25;
    factors++;

    return factors > 0 ? Math.min(100, score) : 0;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Speed recommendations
    if (analysis.performance.maxSpeed < 200) {
      recommendations.push({
        category: 'Speed',
        priority: 'high',
        message: 'Focus on achieving higher top speeds on straights'
      });
    }

    // Consistency recommendations
    if (analysis.consistencyAnalysis?.overallConsistency < 70) {
      recommendations.push({
        category: 'Consistency',
        priority: 'high',
        message: 'Work on maintaining consistent lap times and inputs'
      });
    }

    // Braking recommendations
    if (analysis.brakingAnalysis.trailBraking < 30) {
      recommendations.push({
        category: 'Braking',
        priority: 'medium',
        message: 'Practice trail braking technique for better corner entry'
      });
    }

    // Engine recommendations
    if (analysis.engineAnalysis.engineEfficiency < 70) {
      recommendations.push({
        category: 'Engine',
        priority: 'medium',
        message: 'Optimize gear shifts and RPM usage for better efficiency'
      });
    }

    return recommendations;
  }

  // Additional helper methods with default implementations
  getEmptyPerformanceMetrics() {
    return {
      maxSpeed: 0, avgSpeed: 0, speedStdDev: 0,
      maxRPM: 0, avgRPM: 0, rpmEfficiency: 0,
      maxThrottle: 0, avgThrottle: 0, throttleConsistency: 0,
      maxBrakePressure: 0, avgBrakePressure: 0, brakingEvents: 0,
      dataQuality: 'poor', performanceRating: 0
    };
  }

  getEmptyLambdaAnalysis() {
    return {
      avgLambda: 1.0, lambdaRange: [1.0, 1.0], lambdaConsistency: 0,
      fuelEfficiency: 0, optimalZones: [], richLeanRatio: 50,
      lambdaByRPM: []
    };
  }

  // Placeholder implementations for complex calculations
  calculateRPMEfficiency(rpms, speeds) { return 75; }
  calculatePerformanceRating(speeds, rpms) { return 80; }
  assessDataQuality(data) { return 'good'; }
  calculateSpeedDistribution(speeds) { return {}; }
  findTopSpeedLocations(speeds, distances) { return []; }
  calculateAcceleration(data) { return {}; }
  calculateSpeedEfficiency(speeds, data) { return 85; }
  calculateRPMDistribution(rpms) { return {}; }
  analyzeGearUsage(gears) { return {}; }
  analyzeShiftPoints(data) { return {}; }
  calculateEngineEfficiency(rpms, throttle) { return 80; }
  calculateOptimalRPMUsage(rpms) { return 70; }
  analyzePowerband(rpms, data) { return {}; }
  calculateGForceEnvelope(lateral, longitudinal) { return {}; }
  analyzeCorneringPerformance(lateral, data) { return {}; }
  analyzeBrakingGForce(longitudinal, data) { return {}; }
  analyzeAccelerationGForce(longitudinal, data) { return {}; }
  calculateGForceConsistency(lateral, longitudinal) { return 75; }
  identifyBrakingEvents(data) { return []; }
  analyzeTrailBraking(brake, steering) { return 45; }
  identifyBrakingZones(data) { return []; }
  calculateBrakingEfficiency(events) { return 70; }
  analyzeBrakeBalance(data) { return {}; }
  calculateBrakingConsistency(events) { return 80; }
  calculateFuelEfficiency(lambda) { return 75; }
  identifyOptimalLambdaZones(lambda, data) { return []; }
  calculateRichLeanRatio(lambda) { return 60; }
  analyzeLambdaByRPM(data) { return []; }
  calculateAggressiveness(data) { return 65; }
  calculateSmoothness(data) { return 70; }
  calculateOverallConsistency(data) { return 75; }
  classifyDrivingStyle(aggr, smooth) { return 'Balanced'; }
  identifyDrivingStrengths(data) { return ['Consistency']; }
  identifyDrivingWeaknesses(data) { return ['Top Speed']; }
  calculateAdaptability(data) { return 80; }
  analyzeSectors(data) { return {}; }
  analyzeConsistency(data) { return { overallConsistency: 75 }; }
  calculateLapImprovement(lapTimes) { return 0; }
}

// Export default instance
export const analysisEngine = new AnalysisEngine();

// Export utility functions
export const analyzeSession = (session) => {
  return analysisEngine.analyzeSession(session);
};

export const compareDrivers = (sessions) => {
  if (sessions.length < 2) return null;
  
  const analyses = sessions.map(session => analysisEngine.analyzeSession(session));
  
  return {
    drivers: analyses.map(a => ({
      name: a.driverName,
      performanceScore: a.performanceScore,
      strengths: a.drivingStyle.strengths,
      weaknesses: a.drivingStyle.weaknesses
    })),
    comparison: {
      speedWinner: analyses.reduce((prev, curr) => 
        prev.performance.maxSpeed > curr.performance.maxSpeed ? prev : curr
      ).driverName,
      consistencyWinner: analyses.reduce((prev, curr) => 
        prev.consistencyAnalysis.overallConsistency > curr.consistencyAnalysis.overallConsistency ? prev : curr
      ).driverName,
      overallWinner: analyses.reduce((prev, curr) => 
        prev.performanceScore > curr.performanceScore ? prev : curr
      ).driverName
    }
  };
};