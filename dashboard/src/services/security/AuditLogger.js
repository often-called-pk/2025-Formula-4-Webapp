// src/services/security/AuditLogger.js
/**
 * Audit Logger Service
 * Provides comprehensive audit logging for authentication and security events
 */
class AuditLogger {
  constructor() {
    this.logStorage = new Map();
    this.maxLogEntries = 10000;
    this.logRetentionMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.batchSize = 100;
    this.logQueue = [];
    this.flushInterval = 5000; // 5 seconds
    
    this.startLogFlusher();
    this.startLogCleanup();
  }

  /**
   * Log authentication event
   * @param {Object} event - Authentication event details
   */
  logAuthEvent(event) {
    try {
      const logEntry = this.createLogEntry('AUTH_EVENT', event);
      this.addToQueue(logEntry);
      
      // Also log to console for development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('Auth Event:', logEntry);
      }
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  /**
   * Log security event
   * @param {Object} event - Security event details
   */
  logSecurityEvent(event) {
    try {
      const logEntry = this.createLogEntry('SECURITY_EVENT', event);
      this.addToQueue(logEntry);
      
      // Security events are always logged to console
      console.warn('Security Event:', logEntry);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log user action
   * @param {Object} action - User action details
   */
  logUserAction(action) {
    try {
      const logEntry = this.createLogEntry('USER_ACTION', action);
      this.addToQueue(logEntry);
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  /**
   * Create standardized log entry
   * @param {string} category - Log category
   * @param {Object} data - Event data
   * @returns {Object} Log entry
   */
  createLogEntry(category, data) {
    const logId = this.generateLogId();
    const timestamp = new Date();
    
    return {
      id: logId,
      category,
      timestamp,
      data: {
        ...data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getCurrentSessionId(),
        fingerprint: this.getBrowserFingerprint()
      },
      severity: this.determineSeverity(category, data),
      indexed: false
    };
  }

  /**
   * Add log entry to processing queue
   * @param {Object} logEntry - Log entry to queue
   */
  addToQueue(logEntry) {
    this.logQueue.push(logEntry);
    
    // Flush immediately for high-severity events
    if (logEntry.severity === 'HIGH' || logEntry.severity === 'CRITICAL') {
      this.flushLogs();
    }
  }

  /**
   * Flush queued logs to storage
   */
  flushLogs() {
    try {
      if (this.logQueue.length === 0) return;
      
      const logsToFlush = this.logQueue.splice(0, this.batchSize);
      
      logsToFlush.forEach(logEntry => {
        this.logStorage.set(logEntry.id, logEntry);
      });
      
      // Attempt to send to server if available
      this.sendLogsToServer(logsToFlush);
      
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Send logs to server for persistent storage
   * @param {Array} logs - Logs to send
   */
  async sendLogsToServer(logs) {
    try {
      // This would typically send to your backend audit service
      // For now, we'll store locally and optionally send to Supabase
      if (window.supabase) {
        const { error } = await window.supabase
          .from('audit_logs')
          .insert(logs.map(log => ({
            id: log.id,
            category: log.category,
            timestamp: log.timestamp.toISOString(),
            data: log.data,
            severity: log.severity
          })));
          
        if (error) {
          console.warn('Failed to send logs to server:', error);
        }
      }
    } catch (error) {
      console.warn('Server logging unavailable:', error);
    }
  }

  /**
   * Query logs based on criteria
   * @param {Object} criteria - Query criteria
   * @returns {Promise<Array>} Matching log entries
   */
  async queryLogs(criteria) {
    try {
      const {
        category,
        severity,
        userId,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = criteria;

      let filteredLogs = Array.from(this.logStorage.values());

      // Apply filters
      if (category) {
        filteredLogs = filteredLogs.filter(log => log.category === category);
      }

      if (severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === severity);
      }

      if (userId) {
        filteredLogs = filteredLogs.filter(log => 
          log.data.userId === userId || log.data.user?.id === userId
        );
      }

      if (startDate) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp <= new Date(endDate)
        );
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      return paginatedLogs;
    } catch (error) {
      console.error('Failed to query logs:', error);
      return [];
    }
  }

  /**
   * Get recent security events
   * @param {number} hours - Hours to look back
   * @returns {Array} Recent security events
   */
  getRecentSecurityEvents(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return Array.from(this.logStorage.values())
      .filter(log => 
        log.category === 'SECURITY_EVENT' && 
        log.timestamp >= cutoffTime
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get authentication statistics
   * @param {number} hours - Hours to analyze
   * @returns {Object} Authentication statistics
   */
  getAuthStats(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const authEvents = Array.from(this.logStorage.values())
      .filter(log => 
        log.category === 'AUTH_EVENT' && 
        log.timestamp >= cutoffTime
      );

    const stats = {
      total: authEvents.length,
      successful: 0,
      failed: 0,
      byType: {},
      byHour: {},
      uniqueUsers: new Set(),
      uniqueIPs: new Set()
    };

    authEvents.forEach(event => {
      const eventType = event.data.type;
      const hour = event.timestamp.getHours();
      
      // Count by type
      if (!stats.byType[eventType]) {
        stats.byType[eventType] = 0;
      }
      stats.byType[eventType]++;
      
      // Count by hour
      if (!stats.byHour[hour]) {
        stats.byHour[hour] = 0;
      }
      stats.byHour[hour]++;
      
      // Track success/failure
      if (eventType.includes('SUCCESS')) {
        stats.successful++;
      } else if (eventType.includes('FAILED')) {
        stats.failed++;
      }
      
      // Track unique users and IPs
      if (event.data.userId) {
        stats.uniqueUsers.add(event.data.userId);
      }
      if (event.data.ipAddress) {
        stats.uniqueIPs.add(event.data.ipAddress);
      }
    });

    // Convert sets to counts
    stats.uniqueUsers = stats.uniqueUsers.size;
    stats.uniqueIPs = stats.uniqueIPs.size;

    return stats;
  }

  /**
   * Determine log entry severity
   * @param {string} category - Log category
   * @param {Object} data - Event data
   * @returns {string} Severity level
   */
  determineSeverity(category, data) {
    if (category === 'SECURITY_EVENT') {
      if (data.type === 'SECURITY_INCIDENT' || data.type === 'CSRF_ATTACK_BLOCKED') {
        return 'CRITICAL';
      }
      if (data.type === 'SUSPICIOUS_ACTIVITY' || data.type === 'MULTIPLE_FAILED_LOGINS') {
        return 'HIGH';
      }
      return 'MEDIUM';
    }
    
    if (category === 'AUTH_EVENT') {
      if (data.type === 'LOGIN_FAILED' || data.type === 'SESSION_EXPIRED') {
        return 'MEDIUM';
      }
      if (data.type === 'PASSWORD_RESET' || data.type === 'ACCOUNT_LOCKED') {
        return 'HIGH';
      }
      return 'LOW';
    }
    
    return 'LOW';
  }

  /**
   * Generate unique log ID
   * @returns {string} Log ID
   */
  generateLogId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `LOG_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get current session ID
   * @returns {string|null} Session ID
   */
  getCurrentSessionId() {
    try {
      // Try to get from cookie storage
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'f4_session_id') {
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get browser fingerprint
   * @returns {string} Fingerprint hash
   */
  getBrowserFingerprint() {
    try {
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      return btoa(JSON.stringify(fingerprint)).substr(0, 16);
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Start periodic log flushing
   */
  startLogFlusher() {
    setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flushLogs();
      }
    }, this.flushInterval);
  }

  /**
   * Start periodic log cleanup
   */
  startLogCleanup() {
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Clean up old log entries
   */
  cleanupOldLogs() {
    try {
      const cutoffTime = new Date(Date.now() - this.logRetentionMs);
      const keysToDelete = [];
      
      for (const [id, logEntry] of this.logStorage.entries()) {
        if (logEntry.timestamp < cutoffTime) {
          keysToDelete.push(id);
        }
      }
      
      keysToDelete.forEach(key => this.logStorage.delete(key));
      
      // Also limit total number of entries
      if (this.logStorage.size > this.maxLogEntries) {
        const entries = Array.from(this.logStorage.entries())
          .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
        
        const entriesToRemove = entries.slice(0, this.logStorage.size - this.maxLogEntries);
        entriesToRemove.forEach(([id]) => this.logStorage.delete(id));
      }
    } catch (error) {
      console.error('Log cleanup failed:', error);
    }
  }

  /**
   * Export logs for analysis
   * @param {Object} criteria - Export criteria
   * @returns {Promise<string>} JSON string of logs
   */
  async exportLogs(criteria = {}) {
    try {
      const logs = await this.queryLogs(criteria);
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '[]';
    }
  }

  /**
   * Get current log statistics
   * @returns {Object} Log statistics
   */
  getLogStats() {
    return {
      totalLogs: this.logStorage.size,
      queuedLogs: this.logQueue.length,
      oldestLog: this.getOldestLogTimestamp(),
      newestLog: this.getNewestLogTimestamp(),
      categoryCounts: this.getCategoryCounts(),
      severityCounts: this.getSeverityCounts()
    };
  }

  /**
   * Get oldest log timestamp
   * @returns {Date|null} Oldest log timestamp
   */
  getOldestLogTimestamp() {
    const timestamps = Array.from(this.logStorage.values())
      .map(log => log.timestamp)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return timestamps.length > 0 ? timestamps[0] : null;
  }

  /**
   * Get newest log timestamp
   * @returns {Date|null} Newest log timestamp
   */
  getNewestLogTimestamp() {
    const timestamps = Array.from(this.logStorage.values())
      .map(log => log.timestamp)
      .sort((a, b) => b.getTime() - a.getTime());
    
    return timestamps.length > 0 ? timestamps[0] : null;
  }

  /**
   * Get category counts
   * @returns {Object} Category counts
   */
  getCategoryCounts() {
    const counts = {};
    for (const log of this.logStorage.values()) {
      counts[log.category] = (counts[log.category] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get severity counts
   * @returns {Object} Severity counts
   */
  getSeverityCounts() {
    const counts = {};
    for (const log of this.logStorage.values()) {
      counts[log.severity] = (counts[log.severity] || 0) + 1;
    }
    return counts;
  }
}

export const auditLogger = new AuditLogger();
export default AuditLogger;