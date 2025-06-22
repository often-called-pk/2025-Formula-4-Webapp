// src/services/auth/EnhancedAuthService.js
import { supabase } from '../../config/supabase.js';
import { cookieStorage } from '../security/CookieStorage.js';
import { csrfTokenManager } from '../security/CSRFTokenManager.js';
import { rateLimiter } from '../security/RateLimiter.js';
import { sessionManager } from '../security/SessionManager.js';
import { securityMonitor } from '../security/SecurityMonitor.js';
import { auditLogger } from '../security/AuditLogger.js';

/**
 * Enhanced Authentication Service
 * Integrates all security components for comprehensive authentication
 */
class EnhancedAuthService {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.authStateListeners = [];
    this.isInitialized = false;
    this.deviceFingerprint = null;
    
    // Initialize on construction
    this.initialize();
  }

  /**
   * Initialize the authentication service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Generate device fingerprint
      await this.generateDeviceFingerprint();
      
      // Set up Supabase auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });

      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        await this.handleExistingSession(session);
      }

      this.isInitialized = true;
      
      auditLogger.logAuthEvent({
        type: 'AUTH_SERVICE_INITIALIZED',
        timestamp: new Date(),
        deviceFingerprint: this.deviceFingerprint
      });
    } catch (error) {
      console.error('Failed to initialize Enhanced Auth Service:', error);
      auditLogger.logSecurityEvent({
        type: 'AUTH_INITIALIZATION_FAILED',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Generate device fingerprint for security
   */
  async generateDeviceFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('F4 Analytics Security', 2, 2);
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvas.toDataURL(),
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        timestamp: Date.now()
      };
      
      this.deviceFingerprint = btoa(JSON.stringify(fingerprint));
    } catch (error) {
      console.warn('Could not generate device fingerprint:', error);
      this.deviceFingerprint = 'fallback_' + Date.now();
    }
  }

  /**
   * Handle auth state changes from Supabase
   */
  async handleAuthStateChange(event, session) {
    try {
      if (event === 'SIGNED_IN' && session) {
        await this.handleSignIn(session);
      } else if (event === 'SIGNED_OUT') {
        await this.handleSignOut();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.handleTokenRefresh(session);
      }

      // Notify listeners
      this.authStateListeners.forEach(listener => {
        listener(this.currentUser, event, this.currentSession);
      });
    } catch (error) {
      console.error('Auth state change handling failed:', error);
      auditLogger.logSecurityEvent({
        type: 'AUTH_STATE_CHANGE_ERROR',
        event,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle existing session on initialization
   */
  async handleExistingSession(session) {
    try {
      // Validate session security
      const isValid = await this.validateSessionSecurity(session);
      if (!isValid) {
        await this.signOut();
        return;
      }

      this.currentUser = session.user;
      this.currentSession = await sessionManager.createSession(session.user);
      
      auditLogger.logAuthEvent({
        type: 'EXISTING_SESSION_VALIDATED',
        userId: session.user.id,
        sessionId: this.currentSession?.id,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to handle existing session:', error);
      await this.signOut();
    }
  }

  /**
   * Enhanced sign up with security features
   */
  async signUp(email, password, userData = {}) {
    try {
      const clientIP = this.getClientIdentifier();
      
      // Check rate limit
      if (!rateLimiter.checkLimit(clientIP, 'REGISTER')) {
        const blockedTime = rateLimiter.getBlockedTime(clientIP, 'REGISTER');
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(blockedTime / 1000)} seconds.`);
      }

      // Record attempt
      rateLimiter.recordAttempt(clientIP, 'REGISTER');

      // Enhanced user data with security context
      const enhancedUserData = {
        ...userData,
        deviceFingerprint: this.deviceFingerprint,
        registrationIP: clientIP,
        userAgent: navigator.userAgent,
        registrationTimestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: enhancedUserData
        }
      });

      if (error) {
        auditLogger.logAuthEvent({
          type: 'SIGNUP_FAILED',
          email,
          error: error.message,
          clientIP,
          timestamp: new Date()
        });
        throw error;
      }

      // Create user profile if signup successful
      if (data.user && !data.user.email_confirmed_at) {
        await this.createUserProfile(data.user.id, {
          email: data.user.email,
          name: userData.name || '',
          role: userData.role || 'engineer',
          team: userData.team || '',
          created_at: new Date().toISOString(),
          deviceFingerprint: this.deviceFingerprint
        });
      }

      auditLogger.logAuthEvent({
        type: 'SIGNUP_SUCCESS',
        userId: data.user?.id,
        email,
        requiresConfirmation: !data.user?.email_confirmed_at,
        timestamp: new Date()
      });

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Enhanced sign up error:', error);
      
      auditLogger.logSecurityEvent({
        type: 'SIGNUP_ERROR',
        error: error.message,
        email,
        timestamp: new Date()
      });

      return { user: null, error: error.message };
    }
  }

  /**
   * Enhanced sign in with security features
   */
  async signIn(email, password, options = {}) {
    try {
      const clientIP = this.getClientIdentifier();
      const { rememberMe = false } = options;
      
      // Check rate limit
      if (!rateLimiter.checkLimit(clientIP, 'LOGIN')) {
        const blockedTime = rateLimiter.getBlockedTime(clientIP, 'LOGIN');
        
        auditLogger.logSecurityEvent({
          type: 'LOGIN_RATE_LIMITED',
          email,
          clientIP,
          blockedTime,
          timestamp: new Date()
        });
        
        throw new Error(`Too many login attempts. Try again in ${Math.ceil(blockedTime / 1000)} seconds.`);
      }

      // Record login attempt
      rateLimiter.recordAttempt(clientIP, 'LOGIN');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Track failed attempt
        securityMonitor.trackFailedAttempts([{
          userId: null,
          email,
          ipAddress: clientIP,
          userAgent: navigator.userAgent,
          reason: error.message,
          timestamp: new Date()
        }]);

        auditLogger.logAuthEvent({
          type: 'LOGIN_FAILED',
          email,
          error: error.message,
          clientIP,
          deviceFingerprint: this.deviceFingerprint,
          timestamp: new Date()
        });

        throw error;
      }

      // Reset rate limit on successful login
      rateLimiter.resetAttempts(clientIP, 'LOGIN');

      // Handle successful sign in
      await this.handleSignIn(data.session);

      auditLogger.logAuthEvent({
        type: 'LOGIN_SUCCESS',
        userId: data.user.id,
        email,
        rememberMe,
        deviceFingerprint: this.deviceFingerprint,
        timestamp: new Date()
      });

      return { user: data.user, session: this.currentSession, error: null };
    } catch (error) {
      console.error('Enhanced sign in error:', error);
      
      auditLogger.logSecurityEvent({
        type: 'LOGIN_ERROR',
        error: error.message,
        email,
        timestamp: new Date()
      });

      return { user: null, session: null, error: error.message };
    }
  }

  /**
   * Handle successful sign in
   */
  async handleSignIn(session) {
    try {
      this.currentUser = session.user;
      
      // Create secure session
      this.currentSession = await sessionManager.createSession(session.user);
      
      // Generate CSRF token
      const csrfToken = csrfTokenManager.generateToken(this.currentSession.id);
      
      auditLogger.logAuthEvent({
        type: 'SESSION_CREATED',
        userId: session.user.id,
        sessionId: this.currentSession.id,
        csrfTokenId: csrfToken.token.substring(0, 8) + '...',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to handle sign in:', error);
      throw error;
    }
  }

  /**
   * Enhanced sign out with cleanup
   */
  async signOut() {
    try {
      const userId = this.currentUser?.id;
      const sessionId = this.currentSession?.id;

      // Clean up session
      if (sessionId) {
        await sessionManager.destroySession(sessionId);
        csrfTokenManager.removeToken(sessionId);
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase sign out error:', error);
      }

      await this.handleSignOut();

      auditLogger.logAuthEvent({
        type: 'LOGOUT_SUCCESS',
        userId,
        sessionId,
        timestamp: new Date()
      });

      return { error: null };
    } catch (error) {
      console.error('Enhanced sign out error:', error);
      
      auditLogger.logSecurityEvent({
        type: 'LOGOUT_ERROR',
        error: error.message,
        userId: this.currentUser?.id,
        timestamp: new Date()
      });

      return { error: error.message };
    }
  }

  /**
   * Handle sign out cleanup
   */
  async handleSignOut() {
    const userId = this.currentUser?.id;
    
    this.currentUser = null;
    this.currentSession = null;
    
    // Clear all cookies
    cookieStorage.clearAllCookies();
    
    // Clear CSRF tokens
    csrfTokenManager.clearAllTokens();
  }

  /**
   * Refresh session token
   */
  async refreshSession() {
    try {
      if (!this.currentSession) {
        throw new Error('No active session to refresh');
      }

      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        auditLogger.logAuthEvent({
          type: 'SESSION_REFRESH_FAILED',
          userId: this.currentUser?.id,
          sessionId: this.currentSession?.id,
          error: error.message,
          timestamp: new Date()
        });
        throw error;
      }

      await this.handleTokenRefresh(data.session);

      return { session: data.session, error: null };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { session: null, error: error.message };
    }
  }

  /**
   * Handle token refresh
   */
  async handleTokenRefresh(session) {
    try {
      if (this.currentSession) {
        // Update session manager
        await sessionManager.refreshToken(session.refresh_token);
        
        // Rotate CSRF token
        csrfTokenManager.rotateToken(this.currentSession.id);

        auditLogger.logAuthEvent({
          type: 'SESSION_REFRESHED',
          userId: session.user.id,
          sessionId: this.currentSession.id,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Token refresh handling failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with security features
   */
  async resetPassword(email) {
    try {
      const clientIP = this.getClientIdentifier();
      
      // Check rate limit
      if (!rateLimiter.checkLimit(clientIP, 'PASSWORD_RESET')) {
        const blockedTime = rateLimiter.getBlockedTime(clientIP, 'PASSWORD_RESET');
        throw new Error(`Password reset rate limit exceeded. Try again in ${Math.ceil(blockedTime / 60000)} minutes.`);
      }

      rateLimiter.recordAttempt(clientIP, 'PASSWORD_RESET');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        auditLogger.logAuthEvent({
          type: 'PASSWORD_RESET_FAILED',
          email,
          error: error.message,
          clientIP,
          timestamp: new Date()
        });
        throw error;
      }

      auditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_REQUESTED',
        email,
        clientIP,
        timestamp: new Date()
      });

      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error.message };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        auditLogger.logAuthEvent({
          type: 'PASSWORD_UPDATE_FAILED',
          userId: this.currentUser.id,
          error: error.message,
          timestamp: new Date()
        });
        throw error;
      }

      auditLogger.logAuthEvent({
        type: 'PASSWORD_UPDATED',
        userId: this.currentUser.id,
        timestamp: new Date()
      });

      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      return { error: error.message };
    }
  }

  /**
   * Validate API request (CSRF protection)
   */
  async validateApiRequest(request) {
    try {
      if (!this.currentSession) {
        throw new Error('No active session');
      }

      const csrfToken = request.headers['X-CSRF-Token'] || request.headers['x-csrf-token'];
      if (!csrfToken) {
        throw new Error('Missing CSRF token');
      }

      const isValid = csrfTokenManager.validateToken(csrfToken, this.currentSession.id);
      if (!isValid) {
        auditLogger.logSecurityEvent({
          type: 'CSRF_ATTACK_BLOCKED',
          userId: this.currentUser?.id,
          sessionId: this.currentSession?.id,
          requestUrl: request.url,
          timestamp: new Date()
        });
        throw new Error('Invalid CSRF token');
      }

      return true;
    } catch (error) {
      console.error('API request validation failed:', error);
      throw error;
    }
  }

  /**
   * Get current CSRF token
   */
  getCurrentCSRFToken() {
    if (!this.currentSession) {
      return null;
    }
    return csrfTokenManager.getCurrentToken();
  }

  /**
   * Validate session security
   */
  async validateSessionSecurity(session) {
    try {
      // Validate session is not expired
      if (new Date() > new Date(session.expires_at * 1000)) {
        return false;
      }

      // Additional security validations can be added here
      return true;
    } catch (error) {
      console.error('Session security validation failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Get current session
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.currentSession;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { profile: null, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    try {
      const userId = this.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      auditLogger.logUserAction({
        type: 'PROFILE_UPDATED',
        userId,
        changes: Object.keys(profileData),
        timestamp: new Date()
      });

      return { profile: data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { profile: null, error: error.message };
    }
  }

  /**
   * Create user profile
   */
  async createUserProfile(userId, profileData) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          ...profileData
        });
      
      if (error) throw error;

      auditLogger.logUserAction({
        type: 'PROFILE_CREATED',
        userId,
        timestamp: new Date()
      });

      return { error: null };
    } catch (error) {
      console.error('Create user profile error:', error);
      return { error: error.message };
    }
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientIdentifier() {
    // In a real implementation, this would get the actual client IP
    // For client-side, we'll use a combination of fingerprint and user agent
    return btoa(this.deviceFingerprint + navigator.userAgent).substring(0, 16);
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      sessionValid: !!this.currentSession,
      csrfTokenValid: !!this.getCurrentCSRFToken(),
      deviceFingerprint: this.deviceFingerprint?.substring(0, 16) + '...',
      lastActivity: this.currentSession?.lastActivity,
      securityLevel: this.calculateSecurityLevel()
    };
  }

  /**
   * Calculate security level based on various factors
   */
  calculateSecurityLevel() {
    let score = 0;
    
    if (this.isAuthenticated()) score += 25;
    if (this.getCurrentCSRFToken()) score += 25;
    if (this.currentSession?.deviceFingerprint === this.deviceFingerprint) score += 25;
    if (this.currentSession && new Date() < this.currentSession.expiresAt) score += 25;
    
    if (score >= 75) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate security report
   */
  async generateSecurityReport() {
    try {
      const report = securityMonitor.generateSecurityReport();
      const authStats = auditLogger.getAuthStats();
      
      return {
        ...report,
        authenticationStats: authStats,
        currentSecurityStatus: this.getSecurityStatus(),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to generate security report:', error);
      return { error: 'Report generation failed' };
    }
  }
}

export const enhancedAuthService = new EnhancedAuthService();
export default EnhancedAuthService;