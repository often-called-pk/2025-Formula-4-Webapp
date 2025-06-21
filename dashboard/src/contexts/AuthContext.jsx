// dashboard/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { realtimeService } from '../services/realtime.js';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  signUp: async () => ({ success: false }),
  signIn: async () => ({ success: false }),
  signOut: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  refreshProfile: async () => ({ success: false }),
  clearError: () => {}
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presenceSubscription, setPresenceSubscription] = useState(null);

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

  // Enhanced sign out with cleanup
  const enhancedSignOut = async () => {
    // Clean up all real-time subscriptions
    realtimeService.unsubscribeAll();
    setOnlineUsers([]);
    setPresenceSubscription(null);
    
    // Perform actual sign out
    return await auth.signOut();
  };

  // Context value with additional features
  const contextValue = {
    ...auth,
    signOut: enhancedSignOut,
    onlineUsers,
    isOnline: (userId) => onlineUsers.some(user => user.user_id === userId),
    getOnlineUserCount: () => onlineUsers.length
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-slate-300">You need to sign in to access this page.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for checking specific permissions
export const usePermissions = () => {
  const { profile } = useAuthContext();

  const hasPermission = (permission) => {
    if (!profile) return false;

    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
      engineer: ['read', 'write', 'upload_telemetry', 'analyze_data'],
      viewer: ['read'],
      driver: ['read', 'view_own_data']
    };

    const userPermissions = rolePermissions[profile.role] || ['read'];
    return userPermissions.includes(permission);
  };

  const canManageUsers = () => hasPermission('manage_users');
  const canUploadTelemetry = () => hasPermission('upload_telemetry');
  const canDeleteSessions = () => hasPermission('delete');
  const canManageSettings = () => hasPermission('manage_settings');

  return {
    hasPermission,
    canManageUsers,
    canUploadTelemetry,
    canDeleteSessions,
    canManageSettings,
    userRole: profile?.role || 'viewer'
  };
};

export default AuthContext;