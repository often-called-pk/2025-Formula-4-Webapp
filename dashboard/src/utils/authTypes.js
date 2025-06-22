// src/utils/authTypes.js

/**
 * Authentication and Authorization Type Definitions
 * Provides TypeScript-like interfaces and enums for the Formula 4 authentication system
 */

// User Roles in Formula 4 system
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ENGINEER: 'engineer',
  DRIVER: 'driver'
};

// Permission types
export const Permission = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  UPLOAD_TELEMETRY: 'upload_telemetry',
  ANALYZE_DATA: 'analyze_data',
  VIEW_SECURITY: 'view_security',
  MANAGE_TEAMS: 'manage_teams',
  VIEW_OWN_DATA: 'view_own_data',
  VIEW_OWN_SESSIONS: 'view_own_sessions',
  VIEW_OWN_TEAM: 'view_own_team'
};

// Authentication event types
export const AuthEventType = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_FAILED: 'SIGNUP_FAILED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',
  PASSWORD_UPDATED: 'PASSWORD_UPDATED',
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_REFRESHED: 'SESSION_REFRESHED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_DESTROYED: 'SESSION_DESTROYED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_CREATED: 'PROFILE_CREATED'
};

// Security event types
export const SecurityEventType = {
  CSRF_ATTACK_BLOCKED: 'CSRF_ATTACK_BLOCKED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SECURITY_INCIDENT: 'SECURITY_INCIDENT',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  MULTIPLE_FAILED_LOGINS: 'MULTIPLE_FAILED_LOGINS',
  DEVICE_FINGERPRINT_MISMATCH: 'DEVICE_FINGERPRINT_MISMATCH',
  SESSION_HIJACK_ATTEMPT: 'SESSION_HIJACK_ATTEMPT'
};

// Security levels
export const SecurityLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Rate limiting action types
export const ActionType = {
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  PASSWORD_RESET: 'PASSWORD_RESET',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  API_CALL: 'API_CALL'
};

// Authentication failure reasons
export const AuthFailureReason = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  DEVICE_NOT_RECOGNIZED: 'DEVICE_NOT_RECOGNIZED',
  SECURITY_CHECK_FAILED: 'SECURITY_CHECK_FAILED'
};

// Role permission mapping
export const RolePermissions = {
  [UserRole.ADMIN]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
    Permission.UPLOAD_TELEMETRY,
    Permission.ANALYZE_DATA,
    Permission.VIEW_SECURITY,
    Permission.MANAGE_TEAMS
  ],
  [UserRole.MANAGER]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.MANAGE_USERS,
    Permission.UPLOAD_TELEMETRY,
    Permission.ANALYZE_DATA,
    Permission.VIEW_SECURITY,
    Permission.VIEW_OWN_TEAM
  ],
  [UserRole.ENGINEER]: [
    Permission.READ,
    Permission.WRITE,
    Permission.UPLOAD_TELEMETRY,
    Permission.ANALYZE_DATA,
    Permission.VIEW_OWN_TEAM
  ],
  [UserRole.DRIVER]: [
    Permission.READ,
    Permission.VIEW_OWN_DATA,
    Permission.VIEW_OWN_SESSIONS
  ]
};

// Data access levels by role
export const DataAccessLevels = {
  telemetry: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER, UserRole.DRIVER],
  analytics: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER],
  liveData: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER],
  historicalData: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER],
  teamData: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER],
  driverData: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER, UserRole.DRIVER],
  settings: [UserRole.ADMIN, UserRole.MANAGER],
  userManagement: [UserRole.ADMIN],
  securityLogs: [UserRole.ADMIN],
  systemSettings: [UserRole.ADMIN]
};

// Session validation criteria
export const SessionValidation = {
  MAX_IDLE_TIME: 30 * 60 * 1000, // 30 minutes
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
  REQUIRE_DEVICE_FINGERPRINT: true,
  REQUIRE_IP_VALIDATION: false, // Disabled for client-side
  AUTO_REFRESH_THRESHOLD: 5 * 60 * 1000 // 5 minutes before expiry
};

// Rate limiting configuration
export const RateLimitConfig = {
  [ActionType.LOGIN]: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 15 * 60 * 1000
  },
  [ActionType.REGISTER]: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000
  },
  [ActionType.PASSWORD_RESET]: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDuration: 60 * 60 * 1000
  },
  [ActionType.TOKEN_REFRESH]: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDuration: 5 * 60 * 1000
  },
  [ActionType.API_CALL]: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 60 * 1000
  }
};

// Security monitoring thresholds
export const SecurityThresholds = {
  FAILED_LOGIN_ATTEMPTS: 10,
  MULTIPLE_DEVICE_ACCESS: 5,
  RAPID_REQUESTS: 50,
  SUSPICIOUS_TIME_WINDOW: 30 * 60 * 1000, // 30 minutes
  UNUSUAL_HOURS_START: 2, // 2 AM
  UNUSUAL_HOURS_END: 6,   // 6 AM
  MAX_CONCURRENT_SESSIONS: 3
};

// Cookie configuration
export const CookieConfig = {
  AUTH_TOKEN_NAME: 'f4_auth_token',
  SESSION_ID_NAME: 'f4_session_id',
  CSRF_TOKEN_NAME: 'f4_csrf_token',
  REMEMBER_ME_NAME: 'f4_remember_me',
  DEFAULT_MAX_AGE: 7 * 24 * 60 * 60, // 7 days
  SECURE_OPTIONS: {
    httpOnly: false, // Client-side limitation
    secure: true,
    sameSite: 'Strict',
    path: '/'
  }
};

// Audit log categories
export const AuditLogCategory = {
  AUTH_EVENT: 'AUTH_EVENT',
  SECURITY_EVENT: 'SECURITY_EVENT',
  USER_ACTION: 'USER_ACTION',
  SYSTEM_EVENT: 'SYSTEM_EVENT'
};

// Formula 4 specific data types
export const F4DataType = {
  TELEMETRY: 'telemetry',
  LAP_TIMES: 'lap_times',
  SECTOR_TIMES: 'sector_times',
  TIRE_DATA: 'tire_data',
  ENGINE_DATA: 'engine_data',
  AERODYNAMICS: 'aerodynamics',
  SUSPENSION: 'suspension',
  WEATHER: 'weather',
  TRACK_CONDITIONS: 'track_conditions',
  RACE_STRATEGY: 'race_strategy'
};

// Team roles within Formula 4 context
export const TeamRole = {
  TEAM_PRINCIPAL: 'team_principal',
  RACE_ENGINEER: 'race_engineer',
  DATA_ENGINEER: 'data_engineer',
  MECHANIC: 'mechanic',
  DRIVER: 'driver',
  ANALYST: 'analyst'
};

// Validation functions
export const validateUserRole = (role) => {
  return Object.values(UserRole).includes(role);
};

export const validatePermission = (permission) => {
  return Object.values(Permission).includes(permission);
};

export const hasPermission = (userRole, requiredPermission) => {
  const permissions = RolePermissions[userRole] || [];
  return permissions.includes(requiredPermission);
};

export const hasRoleAccess = (userRole, requiredRoles) => {
  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }
  return requiredRoles.includes(userRole) || userRole === UserRole.ADMIN;
};

export const canAccessDataType = (userRole, dataType) => {
  const allowedRoles = DataAccessLevels[dataType] || [];
  return allowedRoles.includes(userRole);
};

// Helper functions for Formula 4 specific checks
export const isTeamMember = (userTeam, targetTeam) => {
  return userTeam === targetTeam;
};

export const canAccessTeamData = (userRole, userTeam, targetTeam) => {
  // Admins and managers can access all team data
  if ([UserRole.ADMIN, UserRole.MANAGER].includes(userRole)) {
    return true;
  }
  // Others can only access their own team data
  return isTeamMember(userTeam, targetTeam);
};

export const canAccessDriverData = (userRole, userId, targetDriverId) => {
  // Admins, managers, and engineers can access all driver data
  if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER].includes(userRole)) {
    return true;
  }
  // Drivers can only access their own data
  return userId === targetDriverId;
};

export default {
  UserRole,
  Permission,
  AuthEventType,
  SecurityEventType,
  SecurityLevel,
  ActionType,
  AuthFailureReason,
  RolePermissions,
  DataAccessLevels,
  SessionValidation,
  RateLimitConfig,
  SecurityThresholds,
  CookieConfig,
  AuditLogCategory,
  F4DataType,
  TeamRole,
  validateUserRole,
  validatePermission,
  hasPermission,
  hasRoleAccess,
  canAccessDataType,
  isTeamMember,
  canAccessTeamData,
  canAccessDriverData
};