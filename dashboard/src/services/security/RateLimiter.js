// src/services/security/RateLimiter.js
/**
 * Rate Limiter Service
 * Implements rate limiting for authentication attempts and API calls
 */
class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.attempts = new Map();
    this.cleanupInterval = 60000; // Clean up every minute
    
    // Default rate limits
    this.defaultLimits = {
      LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
      PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
      TOKEN_REFRESH: { maxAttempts: 10, windowMs: 5 * 60 * 1000 }, // 10 attempts per 5 minutes
      API_CALL: { maxAttempts: 100, windowMs: 60 * 1000 } // 100 requests per minute
    };

    this.startCleanupTimer();
  }

  /**
   * Get identifier for rate limiting (IP + action or user + action)
   * @param {string} identifier - User identifier (IP, user ID, etc.)
   * @param {string} action - Action type
   * @returns {string} Combined identifier
   */
  getKey(identifier, action) {
    return `${identifier}:${action}`;
  }

  /**
   * Check if action is within rate limit
   * @param {string} identifier - User identifier
   * @param {string} action - Action type
   * @returns {boolean} True if within limit
   */
  checkLimit(identifier, action) {
    try {
      const key = this.getKey(identifier, action);
      const limit = this.limits.get(action) || this.defaultLimits[action] || this.defaultLimits.API_CALL;
      
      const attemptData = this.attempts.get(key);
      const now = Date.now();

      if (!attemptData) {
        return true; // No previous attempts
      }

      // Clean expired attempts
      const validAttempts = attemptData.attempts.filter(
        timestamp => now - timestamp < limit.windowMs
      );

      // Update attempts with valid ones
      this.attempts.set(key, {
        attempts: validAttempts,
        blockedUntil: attemptData.blockedUntil
      });

      // Check if currently blocked
      if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
        return false;
      }

      // Check if within limit
      return validAttempts.length < limit.maxAttempts;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail open for availability
    }
  }

  /**
   * Record an attempt
   * @param {string} identifier - User identifier
   * @param {string} action - Action type
   */
  recordAttempt(identifier, action) {
    try {
      const key = this.getKey(identifier, action);
      const limit = this.limits.get(action) || this.defaultLimits[action] || this.defaultLimits.API_CALL;
      const now = Date.now();

      let attemptData = this.attempts.get(key) || { attempts: [], blockedUntil: null };

      // Add current attempt
      attemptData.attempts.push(now);

      // Clean old attempts
      attemptData.attempts = attemptData.attempts.filter(
        timestamp => now - timestamp < limit.windowMs
      );

      // Check if limit exceeded
      if (attemptData.attempts.length >= limit.maxAttempts) {
        // Block for the window duration
        attemptData.blockedUntil = now + limit.windowMs;
      }

      this.attempts.set(key, attemptData);
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  }

  /**
   * Reset attempts for identifier and action
   * @param {string} identifier - User identifier
   * @param {string} action - Action type (optional, resets all if not provided)
   */
  resetAttempts(identifier, action = null) {
    try {
      if (action) {
        const key = this.getKey(identifier, action);
        this.attempts.delete(key);
      } else {
        // Reset all attempts for identifier
        const keysToDelete = [];
        for (const key of this.attempts.keys()) {
          if (key.startsWith(`${identifier}:`)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.attempts.delete(key));
      }
    } catch (error) {
      console.error('Failed to reset attempts:', error);
    }
  }

  /**
   * Check if identifier is currently blocked
   * @param {string} identifier - User identifier
   * @param {string} action - Action type
   * @returns {boolean} True if blocked
   */
  isBlocked(identifier, action) {
    try {
      const key = this.getKey(identifier, action);
      const attemptData = this.attempts.get(key);
      
      if (!attemptData || !attemptData.blockedUntil) {
        return false;
      }

      const now = Date.now();
      if (now >= attemptData.blockedUntil) {
        // Block expired, clean up
        attemptData.blockedUntil = null;
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check if blocked:', error);
      return false;
    }
  }

  /**
   * Get remaining time until unblocked
   * @param {string} identifier - User identifier
   * @param {string} action - Action type
   * @returns {number} Milliseconds until unblocked, 0 if not blocked
   */
  getBlockedTime(identifier, action) {
    try {
      const key = this.getKey(identifier, action);
      const attemptData = this.attempts.get(key);
      
      if (!attemptData || !attemptData.blockedUntil) {
        return 0;
      }

      const remaining = attemptData.blockedUntil - Date.now();
      return Math.max(0, remaining);
    } catch (error) {
      console.error('Failed to get blocked time:', error);
      return 0;
    }
  }

  /**
   * Set custom rate limit for action
   * @param {string} action - Action type
   * @param {number} maxAttempts - Maximum attempts
   * @param {number} windowMs - Time window in milliseconds
   */
  setLimit(action, maxAttempts, windowMs) {
    this.limits.set(action, { maxAttempts, windowMs });
  }

  /**
   * Get current attempt count
   * @param {string} identifier - User identifier
   * @param {string} action - Action type
   * @returns {number} Current attempt count
   */
  getAttemptCount(identifier, action) {
    try {
      const key = this.getKey(identifier, action);
      const attemptData = this.attempts.get(key);
      
      if (!attemptData) {
        return 0;
      }

      const limit = this.limits.get(action) || this.defaultLimits[action] || this.defaultLimits.API_CALL;
      const now = Date.now();

      // Count valid attempts within window
      const validAttempts = attemptData.attempts.filter(
        timestamp => now - timestamp < limit.windowMs
      );

      return validAttempts.length;
    } catch (error) {
      console.error('Failed to get attempt count:', error);
      return 0;
    }
  }

  /**
   * Clean up expired data
   */
  cleanup() {
    try {
      const now = Date.now();
      const keysToDelete = [];

      for (const [key, attemptData] of this.attempts.entries()) {
        const [, action] = key.split(':');
        const limit = this.limits.get(action) || this.defaultLimits[action] || this.defaultLimits.API_CALL;

        // Remove expired attempts
        attemptData.attempts = attemptData.attempts.filter(
          timestamp => now - timestamp < limit.windowMs
        );

        // Clear expired blocks
        if (attemptData.blockedUntil && now >= attemptData.blockedUntil) {
          attemptData.blockedUntil = null;
        }

        // Remove empty entries
        if (attemptData.attempts.length === 0 && !attemptData.blockedUntil) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.attempts.delete(key));
    } catch (error) {
      console.error('Rate limiter cleanup failed:', error);
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Get current statistics
   * @returns {Object} Current rate limiter statistics
   */
  getStats() {
    return {
      totalKeys: this.attempts.size,
      limits: Object.fromEntries(this.limits),
      defaultLimits: this.defaultLimits
    };
  }
}

export const rateLimiter = new RateLimiter();
export default RateLimiter;