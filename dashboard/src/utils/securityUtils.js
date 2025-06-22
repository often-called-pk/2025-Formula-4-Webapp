// src/utils/securityUtils.js

/**
 * Security Utilities
 * Provides cryptographic functions, validation helpers, and security utility functions
 */

// Security constants
export const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_LENGTH: 32,
  SALT_LENGTH: 16,
  IV_LENGTH: 16,
  KEY_LENGTH: 32,
  HASH_ITERATIONS: 100000,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CSRF_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutes
};

/**
 * Generate cryptographically secure random bytes
 * @param {number} length - Number of bytes to generate
 * @returns {Uint8Array} Random bytes
 */
export const generateSecureRandomBytes = (length) => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  } else {
    // Fallback for environments without crypto API
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};

/**
 * Generate secure random string
 * @param {number} length - Length of the string
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
export const generateSecureRandomString = (
  length = SECURITY_CONSTANTS.TOKEN_LENGTH,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) => {
  const randomBytes = generateSecureRandomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % charset.length];
  }
  return result;
};

/**
 * Generate secure token (hex format)
 * @param {number} length - Token length in bytes
 * @returns {string} Hex token
 */
export const generateSecureToken = (length = SECURITY_CONSTANTS.TOKEN_LENGTH) => {
  const bytes = generateSecureRandomBytes(length);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
export const generateUUID = () => {
  const bytes = generateSecureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant bits
  
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
};

/**
 * Hash password using PBKDF2
 * @param {string} password - Password to hash
 * @param {string} salt - Salt (optional, will generate if not provided)
 * @returns {Promise<Object>} Hash result with salt and hash
 */
export const hashPassword = async (password, salt = null) => {
  if (!salt) {
    const saltBytes = generateSecureRandomBytes(SECURITY_CONSTANTS.SALT_LENGTH);
    salt = Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const saltBytes = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));
      
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: SECURITY_CONSTANTS.HASH_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const hashArray = new Uint8Array(hashBuffer);
      const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
      
      return { hash, salt };
    } catch (error) {
      console.warn('WebCrypto PBKDF2 failed, using fallback:', error);
    }
  }

  // Fallback to simple hash (not recommended for production)
  const combined = password + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return { 
    hash: Math.abs(hash).toString(16).padStart(8, '0'), 
    salt 
  };
};

/**
 * Verify password against hash
 * @param {string} password - Password to verify
 * @param {string} hash - Stored hash
 * @param {string} salt - Salt used for hashing
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyPassword = async (password, hash, salt) => {
  try {
    const result = await hashPassword(password, salt);
    return result.hash === hash;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    feedback: [],
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false,
      notCommon: true
    }
  };

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  // Check minimum length
  if (password.length >= SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH) {
    result.requirements.minLength = true;
    result.score += 20;
  } else {
    result.feedback.push(`Password must be at least ${SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
  }

  // Check maximum length
  if (password.length > SECURITY_CONSTANTS.PASSWORD_MAX_LENGTH) {
    result.feedback.push(`Password must not exceed ${SECURITY_CONSTANTS.PASSWORD_MAX_LENGTH} characters`);
    return result;
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    result.requirements.hasUppercase = true;
    result.score += 15;
  } else {
    result.feedback.push('Password should contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    result.requirements.hasLowercase = true;
    result.score += 15;
  } else {
    result.feedback.push('Password should contain at least one lowercase letter');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.requirements.hasNumbers = true;
    result.score += 15;
  } else {
    result.feedback.push('Password should contain at least one number');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.requirements.hasSpecialChars = true;
    result.score += 20;
  } else {
    result.feedback.push('Password should contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    result.requirements.notCommon = false;
    result.score -= 30;
    result.feedback.push('Password is too common');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    result.score -= 10;
    result.feedback.push('Avoid repeating characters');
  }

  // Additional length bonus
  if (password.length >= 12) {
    result.score += 10;
  }
  if (password.length >= 16) {
    result.score += 5;
  }

  // Set validity
  result.isValid = result.score >= 70 && Object.values(result.requirements).every(req => req);
  result.score = Math.max(0, Math.min(100, result.score));

  return result;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  const result = {
    isValid: false,
    feedback: []
  };

  if (!email) {
    result.feedback.push('Email is required');
    return result;
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    result.feedback.push('Please enter a valid email address');
    return result;
  }

  // Check for common email issues
  if (email.length > 254) {
    result.feedback.push('Email address is too long');
    return result;
  }

  const [localPart, domain] = email.split('@');
  
  if (localPart.length > 64) {
    result.feedback.push('Email local part is too long');
    return result;
  }

  if (domain.length > 253) {
    result.feedback.push('Email domain is too long');
    return result;
  }

  // Check for dangerous characters
  const dangerousChars = /[<>'"\\]/;
  if (dangerousChars.test(email)) {
    result.feedback.push('Email contains invalid characters');
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') {
    return '';
  }

  const {
    allowHtml = false,
    maxLength = 1000,
    trimWhitespace = true,
    removeNullBytes = true,
    escapeHtml = true
  } = options;

  let sanitized = input;

  // Remove null bytes
  if (removeNullBytes) {
    sanitized = sanitized.replace(/\0/g, '');
  }

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Escape HTML if not allowing HTML
  if (!allowHtml && escapeHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  return sanitized;
};

/**
 * Generate device fingerprint
 * @returns {Promise<string>} Device fingerprint
 */
export const generateDeviceFingerprint = async () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Formula 4 Analytics Security Fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent || 'unknown',
      language: navigator.language || 'unknown',
      languages: navigator.languages ? navigator.languages.join(',') : 'unknown',
      platform: navigator.platform || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth || 'unknown',
      pixelDepth: screen.pixelDepth || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      timezoneOffset: new Date().getTimezoneOffset(),
      canvas: canvas.toDataURL(),
      webgl: getWebGLFingerprint(),
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 'unknown',
      connection: getConnectionInfo(),
      timestamp: Date.now()
    };
    
    const fingerprintString = JSON.stringify(fingerprint);
    
    // Create hash of fingerprint
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprintString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback hash
      let hash = 0;
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  } catch (error) {
    console.warn('Device fingerprint generation failed:', error);
    return 'fallback_' + Date.now().toString(36);
  }
};

/**
 * Get WebGL fingerprint
 * @returns {string} WebGL fingerprint
 */
const getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'no-webgl';
    
    const info = {
      renderer: gl.getParameter(gl.RENDERER) || 'unknown',
      vendor: gl.getParameter(gl.VENDOR) || 'unknown',
      version: gl.getParameter(gl.VERSION) || 'unknown',
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'unknown'
    };
    
    return JSON.stringify(info);
  } catch (error) {
    return 'webgl-error';
  }
};

/**
 * Get connection information
 * @returns {Object} Connection info
 */
const getConnectionInfo = () => {
  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return 'unknown';
    
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 'unknown',
      rtt: connection.rtt || 'unknown'
    };
  } catch (error) {
    return 'connection-error';
  }
};

/**
 * Check if running in secure context
 * @returns {boolean} True if secure context
 */
export const isSecureContext = () => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Validate CSRF token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid format
 */
export const validateCSRFTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if token is hex and proper length
  const hexRegex = /^[a-f0-9]+$/i;
  return hexRegex.test(token) && token.length === SECURITY_CONSTANTS.TOKEN_LENGTH * 2;
};

/**
 * Validate session token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid format
 */
export const validateSessionTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if token is hex and proper length
  const hexRegex = /^[a-f0-9]+$/i;
  return hexRegex.test(token) && token.length >= 32;
};

/**
 * Check for potential XSS in input
 * @param {string} input - Input to check
 * @returns {boolean} True if potentially dangerous
 */
export const containsPotentialXSS = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for SQL injection patterns
 * @param {string} input - Input to check
 * @returns {boolean} True if potentially dangerous
 */
export const containsPotentialSQLInjection = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /('|(\\')|(;)|(--)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute))/gi,
    /(\b(or|and)\b.{1,6}?(=|>|<|\bin\b|\blike\b))/gi,
    /\b(union\s+(all\s+)?select)/gi,
    /\b(select\s+.+\s+from)/gi,
    /\b(insert\s+into)/gi,
    /\b(delete\s+from)/gi,
    /\b(update\s+.+\s+set)/gi,
    /\b(drop\s+table)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Rate limiting helper
 * @param {string} key - Rate limit key
 * @param {number} maxAttempts - Maximum attempts
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit result
 */
export const checkRateLimit = (key, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const storage = window.sessionStorage || {};
  const rateLimitKey = `rate_limit_${key}`;
  
  try {
    const data = JSON.parse(storage.getItem(rateLimitKey) || '{}');
    const now = Date.now();
    
    // Clean old attempts
    const attempts = (data.attempts || []).filter(
      timestamp => now - timestamp < windowMs
    );
    
    const result = {
      allowed: attempts.length < maxAttempts,
      remainingAttempts: Math.max(0, maxAttempts - attempts.length),
      resetTime: attempts.length > 0 ? attempts[0] + windowMs : now,
      windowMs
    };
    
    // Record current attempt if limit not exceeded
    if (result.allowed) {
      attempts.push(now);
      storage.setItem(rateLimitKey, JSON.stringify({ attempts }));
    }
    
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remainingAttempts: maxAttempts, resetTime: Date.now() + windowMs, windowMs };
  }
};

/**
 * Security headers validation
 * @returns {Object} Security headers status
 */
export const checkSecurityHeaders = () => {
  const headers = {
    https: isSecureContext(),
    contentSecurityPolicy: false,
    xFrameOptions: false,
    xContentTypeOptions: false,
    referrerPolicy: false,
    strictTransportSecurity: false
  };
  
  // These would typically be checked from response headers
  // For client-side, we can only check what's available
  try {
    // Check if CSP is present (would block inline scripts if strict)
    headers.contentSecurityPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null;
    
    // Check for X-Frame-Options equivalent
    headers.xFrameOptions = window.top === window.self;
    
    return headers;
  } catch (error) {
    console.warn('Security headers check failed:', error);
    return headers;
  }
};

/**
 * Generate secure API request headers
 * @param {string} csrfToken - CSRF token
 * @param {string} sessionToken - Session token
 * @returns {Object} Request headers
 */
export const generateSecureHeaders = (csrfToken, sessionToken) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  return headers;
};

/**
 * Secure data comparison (constant time)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
export const secureCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Security utility object with all functions
 */
export const SecurityUtils = {
  // Constants
  SECURITY_CONSTANTS,
  
  // Cryptographic functions
  generateSecureRandomBytes,
  generateSecureRandomString,
  generateSecureToken,
  generateUUID,
  hashPassword,
  verifyPassword,
  
  // Validation functions
  validatePasswordStrength,
  validateEmail,
  validateCSRFTokenFormat,
  validateSessionTokenFormat,
  
  // Input sanitization
  sanitizeInput,
  containsPotentialXSS,
  containsPotentialSQLInjection,
  
  // Device and security
  generateDeviceFingerprint,
  isSecureContext,
  checkSecurityHeaders,
  
  // Utility functions
  checkRateLimit,
  generateSecureHeaders,
  secureCompare
};

export default SecurityUtils;