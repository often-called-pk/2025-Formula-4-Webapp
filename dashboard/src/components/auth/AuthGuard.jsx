// src/components/auth/AuthGuard.jsx
import React from 'react';
import { useEnhancedAuthContext } from '../../contexts/EnhancedAuthContext.jsx';
import { auditLogger } from '../../services/security/AuditLogger.js';

const AuthGuard = ({ 
  children, 
  fallback = null, 
  checkFunction = null,
  errorMessage = 'Access denied',
  logAccess = true 
}) => {
  const { 
    isAuthenticated, 
    loading, 
    user, 
    profile, 
    securityStatus 
  } = useEnhancedAuthContext();

  // Custom access check
  const hasAccess = React.useMemo(() => {
    if (!isAuthenticated) return false;
    if (typeof checkFunction === 'function') {
      return checkFunction({ user, profile, securityStatus });
    }
    return true;
  }, [isAuthenticated, user, profile, securityStatus, checkFunction]);

  // Log access attempts if enabled
  React.useEffect(() => {
    if (logAccess && !loading) {
      auditLogger.logAuthEvent({
        type: 'AUTH_GUARD_CHECK',
        userId: user?.id,
        hasAccess,
        isAuthenticated,
        securityLevel: securityStatus?.securityLevel,
        timestamp: new Date()
      });
    }
  }, [logAccess, loading, user?.id, hasAccess, isAuthenticated, securityStatus?.securityLevel]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-400">Validating...</p>
        </div>
      </div>
    );
  }

  // Check access
  if (!hasAccess) {
    if (logAccess) {
      auditLogger.logSecurityEvent({
        type: 'AUTH_GUARD_ACCESS_DENIED',
        userId: user?.id,
        errorMessage,
        timestamp: new Date()
      });
    }

    // Return fallback component if provided
    if (fallback) {
      return fallback;
    }

    // Default access denied UI
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
      </div>
    );
  }

  // Access granted - render children
  return children;
};

// Pre-built auth guards for common use cases
export const AdminGuard = ({ children, fallback = null }) => (
  <AuthGuard
    checkFunction={({ profile }) => profile?.role === 'admin'}
    errorMessage="Administrator access required"
    fallback={fallback}
  >
    {children}
  </AuthGuard>
);

export const ManagerGuard = ({ children, fallback = null }) => (
  <AuthGuard
    checkFunction={({ profile }) => ['admin', 'manager'].includes(profile?.role)}
    errorMessage="Manager access required"
    fallback={fallback}
  >
    {children}
  </AuthGuard>
);

export const EngineerGuard = ({ children, fallback = null }) => (
  <AuthGuard
    checkFunction={({ profile }) => ['admin', 'manager', 'engineer'].includes(profile?.role)}
    errorMessage="Engineer access required"
    fallback={fallback}
  >
    {children}
  </AuthGuard>
);

export const TeamGuard = ({ teamId, children, fallback = null }) => (
  <AuthGuard
    checkFunction={({ profile }) => {
      if (['admin', 'manager'].includes(profile?.role)) return true;
      return profile?.team === teamId;
    }}
    errorMessage={`Team access required for ${teamId}`}
    fallback={fallback}
  >
    {children}
  </AuthGuard>
);

export const SecurityLevelGuard = ({ minLevel = 'MEDIUM', children, fallback = null }) => {
  const levelValues = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  
  return (
    <AuthGuard
      checkFunction={({ securityStatus }) => {
        const currentLevel = securityStatus?.securityLevel || 'LOW';
        return levelValues[currentLevel] >= levelValues[minLevel];
      }}
      errorMessage={`Security level ${minLevel} or higher required`}
      fallback={fallback}
    >
      {children}
    </AuthGuard>
  );
};

export const DataAccessGuard = ({ dataType, children, fallback = null }) => (
  <AuthGuard
    checkFunction={({ profile }) => {
      const role = profile?.role;
      const dataAccessMap = {
        'telemetry': ['admin', 'manager', 'engineer', 'driver'],
        'analytics': ['admin', 'manager', 'engineer'],
        'settings': ['admin', 'manager'],
        'users': ['admin'],
        'security': ['admin']
      };
      
      return dataAccessMap[dataType]?.includes(role) || false;
    }}
    errorMessage={`Access to ${dataType} data is restricted`}
    fallback={fallback}
  >
    {children}
  </AuthGuard>
);

export default AuthGuard;