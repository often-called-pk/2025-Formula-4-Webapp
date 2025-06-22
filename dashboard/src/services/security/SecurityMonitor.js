// src/services/security/SecurityMonitor.js
import { auditLogger } from './AuditLogger.js';
import { rateLimiter } from './RateLimiter.js';

/**
 * Security Monitor
 * Monitors and detects suspicious authentication activities
 */
class SecurityMonitor {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.alertThresholds = {
      failedLogins: 10,
      multipleDevices: 5,
      unusualLocation: true,
      rapidRequests: 50,
      timeWindow: 30 * 60 * 1000 // 30 minutes
    };
    this.incidents = new Map();
    this.monitoringActive = true;
  }

  /**
   * Detect suspicious activity from events
   * @param {Array} events - Array of authentication events
   * @returns {Array} Detected suspicious activities
   */
  detectSuspiciousActivity(events) {
    const suspiciousActivities = [];
    
    try {
      // Group events by user and time window
      const userEvents = this.groupEventsByUser(events);
      
      for (const [userId, userEventList] of userEvents.entries()) {
        // Check for multiple failed login attempts
        const failedLogins = this.detectFailedLoginPattern(userEventList);
        if (failedLogins.length > 0) {
          suspiciousActivities.push(...failedLogins);
        }
        
        // Check for multiple device access
        const multipleDevices = this.detectMultipleDeviceAccess(userEventList);
        if (multipleDevices.length > 0) {
          suspiciousActivities.push(...multipleDevices);
        }
        
        // Check for rapid successive requests
        const rapidRequests = this.detectRapidRequests(userEventList);
        if (rapidRequests.length > 0) {
          suspiciousActivities.push(...rapidRequests);
        }
        
        // Check for unusual time patterns
        const unusualTiming = this.detectUnusualTiming(userEventList);
        if (unusualTiming.length > 0) {
          suspiciousActivities.push(...unusualTiming);
        }
      }
      
      return suspiciousActivities;
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return [];
    }
  }

  /**
   * Track failed authentication attempts
   * @param {Array} attempts - Failed attempt records
   */
  trackFailedAttempts(attempts) {
    try {
      for (const attempt of attempts) {
        const key = `${attempt.userId || attempt.ipAddress}_failed_attempts`;
        
        if (!this.suspiciousPatterns.has(key)) {
          this.suspiciousPatterns.set(key, []);
        }
        
        const patterns = this.suspiciousPatterns.get(key);
        patterns.push({
          timestamp: new Date(),
          ipAddress: attempt.ipAddress,
          userAgent: attempt.userAgent,
          reason: attempt.reason,
          userId: attempt.userId
        });
        
        // Keep only recent attempts
        const recentPatterns = patterns.filter(
          p => Date.now() - p.timestamp.getTime() < this.alertThresholds.timeWindow
        );
        this.suspiciousPatterns.set(key, recentPatterns);
        
        // Check if threshold exceeded
        if (recentPatterns.length >= this.alertThresholds.failedLogins) {
          this.handleSecurityIncident({
            type: 'MULTIPLE_FAILED_LOGINS',
            severity: 'HIGH',
            details: {
              userId: attempt.userId,
              ipAddress: attempt.ipAddress,
              attemptCount: recentPatterns.length,
              timespan: this.alertThresholds.timeWindow
            },
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Failed to track failed attempts:', error);
    }
  }

  /**
   * Generate security report
   * @returns {Object} Security report
   */
  generateSecurityReport() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get recent incidents
      const recentIncidents = Array.from(this.incidents.values())
        .filter(incident => incident.timestamp >= last24Hours);
      
      // Group by type and severity
      const incidentsByType = {};
      const incidentsBySeverity = {};
      
      recentIncidents.forEach(incident => {
        // By type
        if (!incidentsByType[incident.type]) {
          incidentsByType[incident.type] = 0;
        }
        incidentsByType[incident.type]++;
        
        // By severity
        if (!incidentsBySeverity[incident.severity]) {
          incidentsBySeverity[incident.severity] = 0;
        }
        incidentsBySeverity[incident.severity]++;
      });
      
      // Get rate limiter stats
      const rateLimiterStats = rateLimiter.getStats();
      
      return {
        period: {
          start: last24Hours,
          end: now
        },
        summary: {
          totalIncidents: recentIncidents.length,
          incidentsByType,
          incidentsBySeverity,
          rateLimiterStats
        },
        incidents: recentIncidents.map(incident => ({
          id: incident.id,
          type: incident.type,
          severity: incident.severity,
          timestamp: incident.timestamp,
          resolved: incident.resolved
        })),
        recommendations: this.generateRecommendations(recentIncidents)
      };
    } catch (error) {
      console.error('Failed to generate security report:', error);
      return {
        error: 'Report generation failed',
        timestamp: new Date()
      };
    }
  }

  /**
   * Handle security incident
   * @param {Object} incident - Security incident details
   */
  handleSecurityIncident(incident) {
    try {
      const incidentId = this.generateIncidentId();
      const fullIncident = {
        id: incidentId,
        ...incident,
        resolved: false,
        createdAt: new Date(),
        actions: []
      };
      
      this.incidents.set(incidentId, fullIncident);
      
      // Log the incident
      auditLogger.logSecurityEvent({
        type: 'SECURITY_INCIDENT',
        severity: incident.severity,
        details: incident,
        timestamp: new Date()
      });
      
      // Take automatic actions based on severity
      this.takeAutomaticActions(fullIncident);
      
      console.warn('Security incident detected:', fullIncident);
      
      return incidentId;
    } catch (error) {
      console.error('Failed to handle security incident:', error);
    }
  }

  /**
   * Resolve security incident
   * @param {string} incidentId - Incident ID
   * @param {string} resolution - Resolution notes
   */
  resolveIncident(incidentId, resolution) {
    try {
      const incident = this.incidents.get(incidentId);
      if (incident) {
        incident.resolved = true;
        incident.resolvedAt = new Date();
        incident.resolution = resolution;
        
        this.incidents.set(incidentId, incident);
        
        auditLogger.logSecurityEvent({
          type: 'INCIDENT_RESOLVED',
          incidentId,
          resolution,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  }

  /**
   * Group events by user
   * @param {Array} events - Events to group
   * @returns {Map} Events grouped by user
   */
  groupEventsByUser(events) {
    const grouped = new Map();
    
    events.forEach(event => {
      const userId = event.userId || 'anonymous';
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId).push(event);
    });
    
    return grouped;
  }

  /**
   * Detect failed login patterns
   * @param {Array} events - User events
   * @returns {Array} Suspicious patterns
   */
  detectFailedLoginPattern(events) {
    const failedLogins = events.filter(
      event => event.type === 'LOGIN_FAILED' && event.timestamp >= new Date(Date.now() - this.alertThresholds.timeWindow)
    );
    
    if (failedLogins.length >= this.alertThresholds.failedLogins) {
      return [{
        type: 'MULTIPLE_FAILED_LOGINS',
        severity: 'HIGH',
        count: failedLogins.length,
        events: failedLogins,
        detected: new Date()
      }];
    }
    
    return [];
  }

  /**
   * Detect multiple device access
   * @param {Array} events - User events
   * @returns {Array} Suspicious patterns
   */
  detectMultipleDeviceAccess(events) {
    const recentLogins = events.filter(
      event => event.type === 'LOGIN_SUCCESS' && event.timestamp >= new Date(Date.now() - this.alertThresholds.timeWindow)
    );
    
    const uniqueDevices = new Set(recentLogins.map(event => event.deviceFingerprint));
    
    if (uniqueDevices.size >= this.alertThresholds.multipleDevices) {
      return [{
        type: 'MULTIPLE_DEVICE_ACCESS',
        severity: 'MEDIUM',
        deviceCount: uniqueDevices.size,
        events: recentLogins,
        detected: new Date()
      }];
    }
    
    return [];
  }

  /**
   * Detect rapid requests
   * @param {Array} events - User events
   * @returns {Array} Suspicious patterns
   */
  detectRapidRequests(events) {
    const recentEvents = events.filter(
      event => event.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    if (recentEvents.length >= this.alertThresholds.rapidRequests) {
      return [{
        type: 'RAPID_REQUESTS',
        severity: 'MEDIUM',
        requestCount: recentEvents.length,
        timeframe: '5 minutes',
        detected: new Date()
      }];
    }
    
    return [];
  }

  /**
   * Detect unusual timing patterns
   * @param {Array} events - User events
   * @returns {Array} Suspicious patterns
   */
  detectUnusualTiming(events) {
    const suspicious = [];
    
    // Check for activity outside normal hours (example: 2 AM - 6 AM)
    const nighttimeEvents = events.filter(event => {
      const hour = event.timestamp.getHours();
      return hour >= 2 && hour <= 6;
    });
    
    if (nighttimeEvents.length > 5) {
      suspicious.push({
        type: 'UNUSUAL_TIMING',
        severity: 'LOW',
        description: 'Activity during unusual hours',
        events: nighttimeEvents,
        detected: new Date()
      });
    }
    
    return suspicious;
  }

  /**
   * Take automatic actions for incidents
   * @param {Object} incident - Incident details
   */
  takeAutomaticActions(incident) {
    try {
      switch (incident.type) {
        case 'MULTIPLE_FAILED_LOGINS':
          // Increase rate limiting for IP
          if (incident.details.ipAddress) {
            rateLimiter.recordAttempt(incident.details.ipAddress, 'LOGIN');
          }
          break;
          
        case 'RAPID_REQUESTS':
          // Temporarily block rapid requests
          if (incident.details.userId) {
            rateLimiter.recordAttempt(incident.details.userId, 'API_CALL');
          }
          break;
      }
      
      incident.actions.push({
        type: 'AUTOMATIC_ACTION',
        description: `Automatic action taken for ${incident.type}`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to take automatic actions:', error);
    }
  }

  /**
   * Generate recommendations based on incidents
   * @param {Array} incidents - Recent incidents
   * @returns {Array} Security recommendations
   */
  generateRecommendations(incidents) {
    const recommendations = [];
    
    const incidentTypes = incidents.map(i => i.type);
    
    if (incidentTypes.includes('MULTIPLE_FAILED_LOGINS')) {
      recommendations.push({
        type: 'SECURITY_POLICY',
        title: 'Strengthen Authentication',
        description: 'Consider implementing MFA for all users',
        priority: 'HIGH'
      });
    }
    
    if (incidentTypes.includes('MULTIPLE_DEVICE_ACCESS')) {
      recommendations.push({
        type: 'MONITORING',
        title: 'Device Management',
        description: 'Implement device registration and approval process',
        priority: 'MEDIUM'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate incident ID
   * @returns {string} Unique incident ID
   */
  generateIncidentId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `INC_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get incident by ID
   * @param {string} incidentId - Incident ID
   * @returns {Object|null} Incident or null
   */
  getIncident(incidentId) {
    return this.incidents.get(incidentId) || null;
  }

  /**
   * Get all incidents
   * @returns {Array} All incidents
   */
  getAllIncidents() {
    return Array.from(this.incidents.values());
  }
}

export const securityMonitor = new SecurityMonitor();
export default SecurityMonitor;