// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { useEnhancedAuthContext } from '../../contexts/EnhancedAuthContext.jsx';
import { auditLogger } from '../../services/security/AuditLogger.js';

const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRole = null,
  teamAccess = null,
  fallbackComponent = null,
  redirectPath = '/login',
  preserveRedirectUrl = true 
}) => {
  const { 
    isAuthenticated, 
    loading, 
    user, 
    profile, 
    checkPermissions, 
    canAccessTeamData,
    securityStatus 
  } = useEnhancedAuthContext();

  // Handle redirect URL preservation
  React.useEffect(() => {
    if (!isAuthenticated && !loading && preserveRedirectUrl) {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== redirectPath) {
        sessionStorage.setItem('f4_redirect_after_auth', currentPath);
      }
    }
  }, [isAuthenticated, loading, redirectPath, preserveRedirectUrl]);

  // Log access attempts
  React.useEffect(() => {
    if (!loading) {
      auditLogger.logAuthEvent({
        type: 'PROTECTED_ROUTE_ACCESS',
        isAuthenticated,
        userId: user?.id,
        requiredPermissions,
        requiredRole,
        teamAccess,
        url: window.location.pathname,
        timestamp: new Date()
      });
    }
  }, [isAuthenticated, loading, user?.id, requiredPermissions, requiredRole, teamAccess]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating access...</p>
          <div className="mt-2 text-sm text-slate-300">
            Checking permissions and security status
          </div>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    auditLogger.logSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      url: window.location.pathname,
      timestamp: new Date()
    });

    if (fallbackComponent) {
      return fallbackComponent;
    }

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
            <p className="text-slate-300">You need to sign in to access this Formula 4 Analytics resource.</p>
          </div>
          <button
            onClick={() => {
              window.location.href = redirectPath;
            }}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
    auditLogger.logSecurityEvent({
      type: 'INSUFFICIENT_ROLE_ACCESS',
      userId: user.id,
      userRole: profile?.role,
      requiredRole,
      url: window.location.pathname,
      timestamp: new Date()
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Insufficient Role</h2>
            <p className="text-slate-300">Your role ({profile?.role || 'unknown'}) doesn't have access to this resource.</p>
            <div className="mt-4 text-sm text-slate-400">
              Required role: {requiredRole}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !checkPermissions(requiredPermissions)) {
    auditLogger.logSecurityEvent({
      type: 'INSUFFICIENT_PERMISSIONS_ACCESS',
      userId: user.id,
      userRole: profile?.role,
      requiredPermissions,
      url: window.location.pathname,
      timestamp: new Date()
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
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

  // Check team access requirements
  if (teamAccess && !canAccessTeamData(teamAccess)) {
    auditLogger.logSecurityEvent({
      type: 'TEAM_ACCESS_DENIED',
      userId: user.id,
      userTeam: profile?.team,
      requiredTeam: teamAccess,
      url: window.location.pathname,
      timestamp: new Date()
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Team Access Required</h2>
            <p className="text-slate-300">You don't have access to this team's data.</p>
            <div className="mt-4 text-sm text-slate-400">
              Your team: {profile?.team || 'None'} | Required: {teamAccess}
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
            Security Level: LOW - Some features may be restricted
          </div>
        </div>
        {children}
      </div>
    );
  }

  // All checks passed - render children
  auditLogger.logAuthEvent({
    type: 'PROTECTED_ROUTE_ACCESS_GRANTED',
    userId: user.id,
    url: window.location.pathname,
    timestamp: new Date()
  });

  return children;
};

export default ProtectedRoute;