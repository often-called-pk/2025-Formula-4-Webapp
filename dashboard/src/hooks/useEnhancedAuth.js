// src/hooks/useEnhancedAuth.js
import { useState, useEffect } from 'react';
import { enhancedAuthService } from '../services/auth/EnhancedAuthService.js';
import { auditLogger } from '../services/security/AuditLogger.js';

export const useEnhancedAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize enhanced auth service
    const initializeAuth = async () => {
      try {
        await enhancedAuthService.initialize();
        
        // Set up auth state listener
        const unsubscribe = enhancedAuthService.onAuthStateChange(async (user, event, session) => {
          setUser(user);
          setSession(session);
          setError(null);

          if (user) {
            // Fetch user profile
            try {
              const { profile: userProfile, error: profileError } = await enhancedAuthService.getUserProfile();
              if (profileError) {
                console.warn('Could not fetch user profile:', profileError);
                setProfile(null);
              } else {
                setProfile(userProfile);
              }
            } catch (err) {
              console.error('Error fetching user profile:', err);
              setProfile(null);
            }
          } else {
            setProfile(null);
          }

          setLoading(false);
        });

        // Check for existing session
        const currentSession = enhancedAuthService.getCurrentSession();
        const currentUser = enhancedAuthService.getCurrentUser();
        
        if (currentSession && currentUser) {
          setUser(currentUser);
          setSession(currentSession);
          
          // Fetch profile for existing session
          try {
            const { profile: userProfile } = await enhancedAuthService.getUserProfile();
            setProfile(userProfile);
          } catch (err) {
            console.warn('Could not fetch profile for existing session:', err);
          }
        }
        
        setLoading(false);
        
        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUp = async (email, password, userData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { user: newUser, error: signUpError } = await enhancedAuthService.signUp(email, password, userData);
      
      if (signUpError) {
        setError(signUpError);
        return { success: false, error: signUpError };
      }

      auditLogger.logAuthEvent({
        type: 'SIGNUP_HOOK_SUCCESS',
        userId: newUser?.id,
        email,
        timestamp: new Date()
      });

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err.message || 'Sign up failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'SIGNUP_HOOK_ERROR',
        email,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedInUser, session: userSession, error: signInError } = await enhancedAuthService.signIn(email, password, options);
      
      if (signInError) {
        setError(signInError);
        return { success: false, error: signInError };
      }

      // The auth state change listener will handle setting user/session/profile
      auditLogger.logAuthEvent({
        type: 'SIGNIN_HOOK_SUCCESS',
        userId: signedInUser?.id,
        email,
        timestamp: new Date()
      });

      return { success: true, user: signedInUser, session: userSession };
    } catch (err) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'SIGNIN_HOOK_ERROR',
        email,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await enhancedAuthService.signOut();
      
      if (signOutError) {
        setError(signOutError);
        return { success: false, error: signOutError };
      }

      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      auditLogger.logAuthEvent({
        type: 'SIGNOUT_HOOK_SUCCESS',
        timestamp: new Date()
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'SIGNOUT_HOOK_ERROR',
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await enhancedAuthService.resetPassword(email);
      
      if (resetError) {
        setError(resetError);
        return { success: false, error: resetError };
      }

      auditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_HOOK_SUCCESS',
        email,
        timestamp: new Date()
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'PASSWORD_RESET_HOOK_ERROR',
        email,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await enhancedAuthService.updatePassword(newPassword);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      auditLogger.logAuthEvent({
        type: 'PASSWORD_UPDATE_HOOK_SUCCESS',
        userId: user?.id,
        timestamp: new Date()
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Password update failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'PASSWORD_UPDATE_HOOK_ERROR',
        userId: user?.id,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const { profile: updatedProfile, error: updateError } = await enhancedAuthService.updateUserProfile(profileData);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      setProfile(updatedProfile);
      
      auditLogger.logAuthEvent({
        type: 'PROFILE_UPDATE_HOOK_SUCCESS',
        userId: user?.id,
        changes: Object.keys(profileData),
        timestamp: new Date()
      });

      return { success: true, profile: updatedProfile };
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'PROFILE_UPDATE_HOOK_ERROR',
        userId: user?.id,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return { success: false, error: 'No user logged in' };

    setLoading(true);
    setError(null);

    try {
      const { profile: refreshedProfile, error: refreshError } = await enhancedAuthService.getUserProfile();
      
      if (refreshError) {
        setError(refreshError);
        return { success: false, error: refreshError };
      }

      setProfile(refreshedProfile);
      
      auditLogger.logAuthEvent({
        type: 'PROFILE_REFRESH_HOOK_SUCCESS',
        userId: user.id,
        timestamp: new Date()
      });

      return { success: true, profile: refreshedProfile };
    } catch (err) {
      const errorMessage = err.message || 'Profile refresh failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'PROFILE_REFRESH_HOOK_ERROR',
        userId: user?.id,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!session) return { success: false, error: 'No active session' };

    setLoading(true);
    setError(null);

    try {
      const { session: refreshedSession, error: refreshError } = await enhancedAuthService.refreshSession();
      
      if (refreshError) {
        setError(refreshError);
        return { success: false, error: refreshError };
      }

      // Session state will be updated by the auth state change listener
      auditLogger.logAuthEvent({
        type: 'SESSION_REFRESH_HOOK_SUCCESS',
        userId: user?.id,
        sessionId: session?.id,
        timestamp: new Date()
      });

      return { success: true, session: refreshedSession };
    } catch (err) {
      const errorMessage = err.message || 'Session refresh failed';
      setError(errorMessage);
      
      auditLogger.logAuthEvent({
        type: 'SESSION_REFRESH_HOOK_ERROR',
        userId: user?.id,
        sessionId: session?.id,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced utility functions
  const getSecurityStatus = () => {
    return enhancedAuthService.getSecurityStatus();
  };

  const validateApiRequest = async (request) => {
    try {
      return await enhancedAuthService.validateApiRequest(request);
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  const getCurrentCSRFToken = () => {
    return enhancedAuthService.getCurrentCSRFToken();
  };

  const generateSecurityReport = async () => {
    try {
      return await enhancedAuthService.generateSecurityReport();
    } catch (error) {
      setError(error.message);
      return { error: 'Report generation failed' };
    }
  };

  return {
    // State
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated: enhancedAuthService.isAuthenticated(),
    
    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    refreshSession,
    
    // Enhanced features
    getSecurityStatus,
    validateApiRequest,
    getCurrentCSRFToken,
    generateSecurityReport,
    
    // Utility
    clearError: () => setError(null),
    
    // Enhanced state checks
    hasActiveSession: () => !!session && session.isActive,
    isSessionExpired: () => session ? new Date() > new Date(session.expiresAt) : true,
    getSessionTimeRemaining: () => {
      if (!session) return 0;
      return Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
    },
    
    // Security helpers
    getDeviceFingerprint: () => session?.deviceFingerprint?.substring(0, 16) + '...' || 'Unknown',
    getLastActivity: () => session?.lastActivity || null,
    isSecureConnection: () => window.location.protocol === 'https:',
    
    // Formula 4 specific helpers
    getTeamId: () => profile?.team || null,
    getUserRole: () => profile?.role || 'viewer',
    canAccessData: (dataType) => {
      const role = profile?.role;
      const dataAccessMap = {
        'telemetry': ['admin', 'manager', 'engineer', 'driver'],
        'analytics': ['admin', 'manager', 'engineer'],
        'settings': ['admin', 'manager'],
        'users': ['admin'],
        'security': ['admin']
      };
      
      return dataAccessMap[dataType]?.includes(role) || false;
    }
  };
};

export default useEnhancedAuth;