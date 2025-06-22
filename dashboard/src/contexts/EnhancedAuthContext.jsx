// src/contexts/EnhancedAuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useEnhancedAuth } from '../hooks/useEnhancedAuth.js';
import { realtimeService } from '../services/realtime.js';
import { enhancedAuthService } from '../services/auth/EnhancedAuthService.js';
import { auditLogger } from '../services/security/AuditLogger.js';

const EnhancedAuthContext = createContext({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  securityStatus: null,
  onlineUsers: [],
  signUp: async () => ({ success: false }),
  signIn: async () => ({ success: false }),
  signOut: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  refreshProfile: async () => ({ success: false }),
  refreshSession: async () => ({ success: false }),
  validateApiRequest: async () => false,
  getCurrentCSRFToken: () => null,
  getSecurityReport: async () => ({}),
  clearError: () => {},
  checkPermissions: () => false
});

export const useEnhancedAuthContext = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuthContext must be used within an EnhancedAuthProvider');
  }
  return context;
};

export const EnhancedAuthProvider = ({ children }) => {
  const auth = useEnhancedAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presenceSubscription, setPresenceSubscription] = useState(null);
  const [securityStatus, setSecurityStatus] = useState(null);

  // Set up presence tracking when user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && auth.profile) {
      // Subscribe to presence
      const subscriptionKey = realtimeService.subscribeToPresence(
        auth.user.id,
        {
          name: auth.profile.name || 'Unknown User',
          role: auth.profile.role || 'engineer',
          team: auth.profile.team || 'Unknown Team',
          email: auth.user.email
        },
        (presenceData) => {
          if (presenceData.event === 'sync' || Array.isArray(presenceData)) {
            // Handle sync event - update full online users list
            const users = Array.isArray(presenceData) ? presenceData : Object.values(presenceData);
            setOnlineUsers(users.flat());
          } else if (presenceData.event === 'join') {
            // Handle user join
            setOnlineUsers(prev => [...prev, ...presenceData.newPresences]);
          } else if (presenceData.event === 'leave') {
            // Handle user leave
            const leftUserIds = presenceData.leftPresences.map(p => p.user_id);
            setOnlineUsers(prev => prev.filter(user => !leftUserIds.includes(user.user_id)));
          }
        }
      );
      
      setPresenceSubscription(subscriptionKey);
    } else {
      // Clean up presence subscription when user logs out
      if (presenceSubscription) {
        realtimeService.unsubscribe(presenceSubscription);
        setPresenceSubscription(null);
        setOnlineUsers([]);
      }
    }

    return () => {
      if (presenceSubscription) {
        realtimeService.unsubscribe(presenceSubscription);
      }
    };
  }, [auth.isAuthenticated, auth.user, auth.profile, presenceSubscription]);

  // Update security status periodically
  useEffect(() => {
    const updateSecurityStatus = () => {
      if (auth.isAuthenticated) {
        const status = enhancedAuthService.getSecurityStatus();
        setSecurityStatus(status);
      } else {
        setSecurityStatus(null);
      }
    };

    updateSecurityStatus();
    const interval = setInterval(updateSecurityStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [auth.isAuthenticated]);

  // Enhanced sign out with cleanup
  const enhancedSignOut = async () => {
    try {
      // Clean up all real-time subscriptions
      realtimeService.unsubscribeAll();
      setOnlineUsers([]);
      setPresenceSubscription(null);
      setSecurityStatus(null);
      
      // Perform actual sign out
      const result = await auth.signOut();
      
      auditLogger.logAuthEvent({
        type: 'ENHANCED_LOGOUT',
        userId: auth.user?.id,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      console.error('Enhanced sign out failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced API request validation
  const validateApiRequest = async (request) => {
    try {
      return await enhancedAuthService.validateApiRequest(request);
    } catch (error) {
      console.error('API request validation failed:', error);
      return false;
    }
  };

  // Get current CSRF token
  const getCurrentCSRFToken = () => {
    return enhancedAuthService.getCurrentCSRFToken();
  };

  // Generate security report
  const getSecurityReport = async () => {
    try {
      return await enhancedAuthService.generateSecurityReport();
    } catch (error) {
      console.error('Failed to get security report:', error);
      return { error: 'Report generation failed' };
    }
  };

  // Check permissions based on user role and context
  const checkPermissions = (requiredPermissions) => {
    if (!auth.profile) return false;

    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings', 'view_security', 'manage_teams'],
      manager: ['read', 'write', 'delete', 'manage_users', 'upload_telemetry', 'analyze_data', 'view_security'],
      engineer: ['read', 'write', 'upload_telemetry', 'analyze_data', 'view_own_team'],
      driver: ['read', 'view_own_data', 'view_own_sessions']
    };

    const userPermissions = rolePermissions[auth.profile.role] || ['read'];
    
    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.every(permission => userPermissions.includes(permission));
    }
    
    return userPermissions.includes(requiredPermissions);
  };

  // Enhanced refresh session
  const enhancedRefreshSession = async () => {
    try {
      const result = await auth.refreshSession();
      
      if (result.success) {
        // Update security status after refresh
        const status = enhancedAuthService.getSecurityStatus();
        setSecurityStatus(status);
        
        auditLogger.logAuthEvent({
          type: 'SESSION_REFRESH_SUCCESS',
          userId: auth.user?.id,
          timestamp: new Date()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Enhanced session refresh failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Context value with enhanced features
  const contextValue = {
    // Original auth properties
    ...auth,
    
    // Enhanced methods
    signOut: enhancedSignOut,
    refreshSession: enhancedRefreshSession,
    validateApiRequest,
    getCurrentCSRFToken,
    getSecurityReport,
    checkPermissions,
    
    // Additional state
    securityStatus,
    onlineUsers,
    
    // Utility functions
    isOnline: (userId) => onlineUsers.some(user => user.user_id === userId),
    getOnlineUserCount: () => onlineUsers.length,
    getSecurityLevel: () => securityStatus?.securityLevel || 'LOW',
    
    // Permission helpers
    canManageUsers: () => checkPermissions('manage_users'),
    canUploadTelemetry: () => checkPermissions('upload_telemetry'),
    canDeleteSessions: () => checkPermissions('delete'),
    canManageSettings: () => checkPermissions('manage_settings'),
    canViewSecurity: () => checkPermissions('view_security'),
    canManageTeams: () => checkPermissions('manage_teams'),
    
    // Team-based permissions
    canAccessTeamData: (teamId) => {
      if (!auth.profile) return false;
      if (checkPermissions(['admin', 'manager'])) return true;
      return auth.profile.team === teamId;
    },
    
    canAccessDriverData: (driverId) => {
      if (!auth.profile) return false;
      if (checkPermissions(['admin', 'manager', 'engineer'])) return true;
      return auth.user?.id === driverId;
    }
  };

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

// Higher-order component for protected routes with enhanced security
export const withEnhancedAuth = (Component, requiredPermissions = []) => {
  return function EnhancedAuthenticatedComponent(props) {
    const { 
      isAuthenticated, 
      loading, 
      checkPermissions, 
      securityStatus 
    } = useEnhancedAuthContext();

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Initializing secure session...</p>
            <div className="mt-2 text-sm text-slate-300">
              Security Level: {securityStatus?.securityLevel || 'Validating...'}
            </div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Secure Access Required</h2>
              <p className="text-slate-300">Enhanced authentication is required to access this resource.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              Authenticate
            </button>
          </div>
        </div>
      );
    }

    // Check permissions if required
    if (requiredPermissions.length > 0 && !checkPermissions(requiredPermissions)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-300">You don't have the required permissions to access this resource.</p>
              <div className="mt-4 text-sm text-slate-400">
                Required: {requiredPermissions.join(', ')}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show security warning for low security level
    if (securityStatus?.securityLevel === 'LOW') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
            <div className="flex items-center justify-center text-yellow-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Security Level: LOW - Some security features may be disabled
            </div>
          </div>
          <Component {...props} />
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for checking specific permissions with enhanced features
export const useEnhancedPermissions = () => {
  const { profile, checkPermissions, canAccessTeamData, canAccessDriverData } = useEnhancedAuthContext();

  return {
    profile,
    checkPermissions,
    canAccessTeamData,
    canAccessDriverData,
    userRole: profile?.role || 'viewer',
    userTeam: profile?.team || null,
    
    // Formula 4 specific permissions
    canViewTelemetry: () => checkPermissions(['read', 'view_own_data']),
    canUploadTelemetry: () => checkPermissions('upload_telemetry'),
    canAnalyzeData: () => checkPermissions('analyze_data'),
    canManageDrivers: () => checkPermissions(['manage_users', 'manage_teams']),
    canViewLiveData: () => checkPermissions(['read', 'analyze_data']),
    canExportData: () => checkPermissions(['read', 'analyze_data']),
    canManageRaceEvents: () => checkPermissions(['manage_settings', 'manage_teams']),
    
    // Team-specific permissions
    isTeamManager: () => profile?.role === 'manager' || profile?.role === 'admin',
    isTeamEngineer: () => profile?.role === 'engineer',
    isDriver: () => profile?.role === 'driver',
    isAdmin: () => profile?.role === 'admin'
  };
};

export default EnhancedAuthContext;