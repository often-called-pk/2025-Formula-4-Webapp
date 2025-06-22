// src/services/security/SessionManager.js
import { cookieStorage } from './CookieStorage.js';
import { csrfTokenManager } from './CSRFTokenManager.js';
import { rateLimiter } from './RateLimiter.js';
import { supabase } from '../../config/supabase.js';

/**
 * Session Manager
 * Handles secure session management with cross-tab synchronization
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.activeSessionId = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
    this.crossTabChannel = new BroadcastChannel('f4_auth_sync');
    this.deviceFingerprint = null;
    
    this.initializeCrossTabSync();
    this.initializeDeviceFingerprint();
  }

  /**
   * Initialize cross-tab synchronization
   */
  initializeCrossTabSync() {
    this.crossTabChannel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'SESSION_CREATED':
          this.handleExternalSessionCreated(data);
          break;
        case 'SESSION_DESTROYED':
          this.handleExternalSessionDestroyed(data);
          break;
        case 'SESSION_REFRESHED':
          this.handleExternalSessionRefreshed(data);
          break;
        case 'LOGOUT':
          this.handleExternalLogout();
          break;
      }
    };
  }

  /**
   * Initialize device fingerprint
   */
  async initializeDeviceFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('F4 Analytics Fingerprint', 2, 2);
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvas.toDataURL(),
        timestamp: Date.now()
      };
      
      this.deviceFingerprint = btoa(JSON.stringify(fingerprint));
    } catch (error) {
      console.warn('Could not generate device fingerprint:', error);
      this.deviceFingerprint = 'unknown';
    }
  }

  /**
   * Create new session
   * @param {Object} user - User object
   * @returns {Promise<Object>} Session object
   */
  async createSession(user) {
    try {
      const sessionId = this.generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.sessionTimeout);
      
      // Get current Supabase session
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      const session = {
        id: sessionId,
        userId: user.id,
        accessToken: supabaseSession?.access_token,
        refreshToken: supabaseSession?.refresh_token,
        expiresAt,
        deviceFingerprint: this.deviceFingerprint,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        isActive: true,
        createdAt: now,
        lastActivity: now
      };
      
      // Store session
      this.sessions.set(sessionId, session);
      this.activeSessionId = sessionId;
      
      // Generate CSRF token
      const csrfToken = csrfTokenManager.generateToken(sessionId);
      
      // Set secure cookies
      cookieStorage.setSecureCookie('f4_session_id', sessionId);
      cookieStorage.setSecureCookie('f4_access_token', session.accessToken);
      
      // Start session refresh timer
      this.startSessionRefreshTimer(sessionId);
      
      // Notify other tabs
      this.crossTabChannel.postMessage({
        type: 'SESSION_CREATED',
        data: { sessionId, userId: user.id }
      });
      
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate session
   * @param {string} sessionToken - Session token to validate
   * @returns {Promise<boolean>} True if session is valid
   */
  async validateSession(sessionToken) {
    try {
      const sessionId = cookieStorage.getCookie('f4_session_id');
      if (!sessionId || sessionId !== sessionToken) {
        return false;
      }
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }
      
      // Check expiration
      if (new Date() > session.expiresAt) {
        await this.destroySession(sessionId);
        return false;
      }
      
      // Validate device fingerprint
      if (session.deviceFingerprint !== this.deviceFingerprint) {
        console.warn('Device fingerprint mismatch');
        await this.destroySession(sessionId);
        return false;
      }
      
      // Update last activity
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
      
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Refresh session token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token pair
   */
  async refreshToken(refreshToken) {
    try {
      const sessionId = this.activeSessionId;
      if (!sessionId) {
        throw new Error('No active session');
      }
      
      // Check rate limit
      const clientIP = await this.getClientIP();
      if (!rateLimiter.checkLimit(clientIP, 'TOKEN_REFRESH')) {
        throw new Error('Rate limit exceeded for token refresh');
      }
      
      // Refresh with Supabase
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });
      
      if (error) {
        rateLimiter.recordAttempt(clientIP, 'TOKEN_REFRESH');
        throw error;
      }
      
      // Update session
      const session = this.sessions.get(sessionId);
      if (session) {
        session.accessToken = data.session.access_token;
        session.refreshToken = data.session.refresh_token;
        session.expiresAt = new Date(Date.now() + this.sessionTimeout);
        session.lastActivity = new Date();
        
        this.sessions.set(sessionId, session);
        
        // Update cookies
        cookieStorage.setSecureCookie('f4_access_token', session.accessToken);
        
        // Rotate CSRF token
        csrfTokenManager.rotateToken(sessionId);
        
        // Notify other tabs
        this.crossTabChannel.postMessage({
          type: 'SESSION_REFRESHED',
          data: { sessionId }
        });
      }
      
      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Destroy session
   * @param {string} sessionId - Session ID to destroy
   */
  async destroySession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isActive = false;
        this.sessions.delete(sessionId);
      }
      
      // Remove CSRF token
      csrfTokenManager.removeToken(sessionId);
      
      // Clear cookies if it's the active session
      if (sessionId === this.activeSessionId) {
        cookieStorage.deleteCookie('f4_session_id');
        cookieStorage.deleteCookie('f4_access_token');
        this.activeSessionId = null;
      }
      
      // Notify other tabs
      this.crossTabChannel.postMessage({
        type: 'SESSION_DESTROYED',
        data: { sessionId }
      });
    } catch (error) {
      console.error('Failed to destroy session:', error);
    }
  }

  /**
   * Sync cross-tab sessions
   */
  syncCrossTabs() {
    try {
      const sessionId = this.activeSessionId;
      if (sessionId) {
        this.crossTabChannel.postMessage({
          type: 'SESSION_SYNC',
          data: { sessionId, timestamp: Date.now() }
        });
      }
    } catch (error) {
      console.error('Cross-tab sync failed:', error);
    }
  }

  /**
   * Track session activity
   * @param {string} sessionId - Session ID
   * @param {string} activity - Activity type
   */
  trackSessionActivity(sessionId, activity) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivity = new Date();
        if (!session.activities) {
          session.activities = [];
        }
        session.activities.push({
          type: activity,
          timestamp: new Date()
        });
        
        // Keep only last 10 activities
        if (session.activities.length > 10) {
          session.activities = session.activities.slice(-10);
        }
        
        this.sessions.set(sessionId, session);
      }
    } catch (error) {
      console.error('Failed to track session activity:', error);
    }
  }

  /**
   * Generate secure session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get client IP address (best effort)
   * @returns {Promise<string>} IP address
   */
  async getClientIP() {
    try {
      // This is a fallback since we can't get real IP from client-side
      return 'client_side_unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Start session refresh timer
   * @param {string} sessionId - Session ID
   */
  startSessionRefreshTimer(sessionId) {
    const timer = setInterval(async () => {
      try {
        const session = this.sessions.get(sessionId);
        if (!session || !session.isActive) {
          clearInterval(timer);
          return;
        }
        
        // Auto-refresh if session is about to expire
        const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
        if (timeUntilExpiry < this.refreshInterval) {
          await this.refreshToken(session.refreshToken);
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        clearInterval(timer);
      }
    }, this.refreshInterval);
  }

  /**
   * Handle external session events
   */
  handleExternalSessionCreated(data) {
    // Sync session state across tabs
    if (data.sessionId && data.userId) {
      this.syncCrossTabs();
    }
  }

  handleExternalSessionDestroyed(data) {
    if (data.sessionId === this.activeSessionId) {
      this.activeSessionId = null;
    }
  }

  handleExternalSessionRefreshed(data) {
    // Refresh local session data
    this.syncCrossTabs();
  }

  handleExternalLogout() {
    // Handle logout from another tab
    this.sessions.clear();
    this.activeSessionId = null;
    cookieStorage.clearAllCookies();
  }

  /**
   * Get current session
   * @returns {Object|null} Current session or null
   */
  getCurrentSession() {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) : null;
  }

  /**
   * Get all active sessions for user
   * @param {string} userId - User ID
   * @returns {Array} Active sessions
   */
  getActiveSessions(userId) {
    const userSessions = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }
}

export const sessionManager = new SessionManager();
export default SessionManager;