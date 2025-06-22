// src/services/security/CSRFTokenManager.js
import { cookieStorage } from './CookieStorage.js';

/**
 * CSRF Token Manager
 * Implements double-submit cookie pattern for CSRF protection
 */
class CSRFTokenManager {
  constructor() {
    this.tokenStore = new Map();
    this.tokenLength = 32;
    this.tokenExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    this.cookieName = 'f4_csrf_token';
  }

  /**
   * Generate a cryptographically secure random token
   * @returns {string} Random token
   */
  generateSecureToken() {
    const array = new Uint8Array(this.tokenLength);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate CSRF token for session
   * @param {string} sessionId - Session identifier
   * @returns {Object} CSRF token object
   */
  generateToken(sessionId) {
    try {
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + this.tokenExpiry);
      const createdAt = new Date();

      const csrfToken = {
        token,
        sessionId,
        expiresAt,
        createdAt
      };

      // Store in memory
      this.tokenStore.set(sessionId, csrfToken);

      // Set secure cookie
      cookieStorage.setSecureCookie(this.cookieName, token);

      return csrfToken;
    } catch (error) {
      console.error('Failed to generate CSRF token:', error);
      throw new Error('CSRF token generation failed');
    }
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if token is valid
   */
  validateToken(token, sessionId) {
    try {
      if (!token || !sessionId) {
        return false;
      }

      // Get stored token
      const storedToken = this.tokenStore.get(sessionId);
      if (!storedToken) {
        return false;
      }

      // Check expiration
      if (new Date() > storedToken.expiresAt) {
        this.tokenStore.delete(sessionId);
        return false;
      }

      // Validate token match
      const isValid = storedToken.token === token && storedToken.sessionId === sessionId;

      // Also validate cookie token for double-submit pattern
      const cookieToken = cookieStorage.getCookie(this.cookieName);
      const cookieValid = cookieToken === token;

      return isValid && cookieValid;
    } catch (error) {
      console.error('Failed to validate CSRF token:', error);
      return false;
    }
  }

  /**
   * Rotate CSRF token for session
   * @param {string} sessionId - Session identifier
   * @returns {Object} New CSRF token
   */
  rotateToken(sessionId) {
    try {
      // Remove old token
      this.tokenStore.delete(sessionId);
      
      // Generate new token
      return this.generateToken(sessionId);
    } catch (error) {
      console.error('Failed to rotate CSRF token:', error);
      throw new Error('CSRF token rotation failed');
    }
  }

  /**
   * Clean expired tokens
   */
  cleanExpiredTokens() {
    try {
      const now = new Date();
      for (const [sessionId, tokenData] of this.tokenStore.entries()) {
        if (now > tokenData.expiresAt) {
          this.tokenStore.delete(sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to clean expired tokens:', error);
    }
  }

  /**
   * Get token for session
   * @param {string} sessionId - Session identifier
   * @returns {string|null} Token or null
   */
  getToken(sessionId) {
    try {
      const tokenData = this.tokenStore.get(sessionId);
      if (!tokenData) {
        return null;
      }

      // Check if expired
      if (new Date() > tokenData.expiresAt) {
        this.tokenStore.delete(sessionId);
        return null;
      }

      return tokenData.token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }

  /**
   * Remove token for session
   * @param {string} sessionId - Session identifier
   */
  removeToken(sessionId) {
    try {
      this.tokenStore.delete(sessionId);
      cookieStorage.deleteCookie(this.cookieName);
    } catch (error) {
      console.error('Failed to remove CSRF token:', error);
    }
  }

  /**
   * Get current token from cookie
   * @returns {string|null} Current token or null
   */
  getCurrentToken() {
    return cookieStorage.getCookie(this.cookieName);
  }

  /**
   * Clear all tokens
   */
  clearAllTokens() {
    try {
      this.tokenStore.clear();
      cookieStorage.deleteCookie(this.cookieName);
    } catch (error) {
      console.error('Failed to clear all CSRF tokens:', error);
    }
  }
}

export const csrfTokenManager = new CSRFTokenManager();
export default CSRFTokenManager;