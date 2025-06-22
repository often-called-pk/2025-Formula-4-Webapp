// src/services/security/CookieStorage.js
/**
 * Secure Cookie Storage Service
 * Handles httpOnly cookies with enhanced security options
 */
class CookieStorage {
  constructor() {
    this.defaultOptions = {
      httpOnly: false, // Note: Can't set httpOnly from client-side, handled by server
      secure: window.location.protocol === 'https:',
      sameSite: 'Strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  /**
   * Set a secure cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   */
  setCookie(name, value, options = {}) {
    try {
      const cookieOptions = { ...this.defaultOptions, ...options };
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

      if (cookieOptions.maxAge) {
        cookieString += `; Max-Age=${cookieOptions.maxAge}`;
      }

      if (cookieOptions.expires) {
        cookieString += `; Expires=${cookieOptions.expires.toUTCString()}`;
      }

      if (cookieOptions.path) {
        cookieString += `; Path=${cookieOptions.path}`;
      }

      if (cookieOptions.domain) {
        cookieString += `; Domain=${cookieOptions.domain}`;
      }

      if (cookieOptions.secure) {
        cookieString += '; Secure';
      }

      if (cookieOptions.sameSite) {
        cookieString += `; SameSite=${cookieOptions.sameSite}`;
      }

      document.cookie = cookieString;
      return true;
    } catch (error) {
      console.error('Failed to set cookie:', error);
      return false;
    }
  }

  /**
   * Get cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null
   */
  getCookie(name) {
    try {
      const encodedName = encodeURIComponent(name);
      const cookies = document.cookie.split(';');
      
      for (let cookie of cookies) {
        let [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === encodedName) {
          return decodeURIComponent(cookieValue || '');
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get cookie:', error);
      return null;
    }
  }

  /**
   * Delete cookie by name
   * @param {string} name - Cookie name
   */
  deleteCookie(name) {
    try {
      this.setCookie(name, '', {
        maxAge: 0,
        expires: new Date(0)
      });
      return true;
    } catch (error) {
      console.error('Failed to delete cookie:', error);
      return false;
    }
  }

  /**
   * Set secure cookie with default security options
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   */
  setSecureCookie(name, value) {
    return this.setCookie(name, value, {
      secure: true,
      sameSite: 'Strict',
      httpOnly: false // Client-side limitation
    });
  }

  /**
   * Check if cookies are enabled
   * @returns {boolean} True if cookies are enabled
   */
  areCookiesEnabled() {
    try {
      const testKey = '_cookie_test_';
      this.setCookie(testKey, 'test');
      const isEnabled = this.getCookie(testKey) === 'test';
      this.deleteCookie(testKey);
      return isEnabled;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all cookies as object
   * @returns {Object} All cookies
   */
  getAllCookies() {
    try {
      const cookies = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[decodeURIComponent(name)] = decodeURIComponent(value);
        }
      });
      return cookies;
    } catch (error) {
      console.error('Failed to get all cookies:', error);
      return {};
    }
  }

  /**
   * Clear all cookies
   */
  clearAllCookies() {
    try {
      const cookies = this.getAllCookies();
      Object.keys(cookies).forEach(name => {
        this.deleteCookie(name);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear all cookies:', error);
      return false;
    }
  }
}

export const cookieStorage = new CookieStorage();
export default CookieStorage;