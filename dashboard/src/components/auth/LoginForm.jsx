// src/components/auth/LoginForm.jsx
import React, { useState, useEffect } from 'react';
import { useEnhancedAuthContext } from '../../contexts/EnhancedAuthContext.jsx';
import { rateLimiter } from '../../services/security/RateLimiter.js';

const LoginForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    name: '',
    role: 'engineer',
    team: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, resetPassword, loading, error, clearError, securityStatus } = useEnhancedAuthContext();

  // Check rate limit status
  useEffect(() => {
    const checkRateLimit = () => {
      const clientIP = 'client_identifier';
      const action = isSignUp ? 'REGISTER' : 'LOGIN';
      
      const attemptCount = rateLimiter.getAttemptCount(clientIP, action);
      const isBlocked = rateLimiter.isBlocked(clientIP, action);
      const blockedTime = rateLimiter.getBlockedTime(clientIP, action);
      
      setRateLimitInfo({
        attemptCount,
        isBlocked,
        blockedTime: Math.ceil(blockedTime / 1000)
      });
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, [isSignUp]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    clearError();
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignUpDataChange = (e) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      return 'Email and password are required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (isSignUp) {
      if (!signUpData.name.trim()) {
        return 'Name is required for registration';
      }
      if (signUpData.name.length < 2) {
        return 'Name must be at least 2 characters long';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rateLimitInfo?.isBlocked) {
      onError?.(`Rate limit exceeded. Please wait ${rateLimitInfo.blockedTime} seconds.`);
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      onError?.(validationError);
      return;
    }
    
    setIsSubmitting(true);
    clearError();
    
    try {
      let result;
      
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, signUpData);
      } else {
        result = await signIn(formData.email, formData.password, {
          rememberMe: formData.rememberMe
        });
      }
      
      if (result.success) {
        onSuccess?.(result);
        
        // Reset form on successful signup
        if (isSignUp) {
          setFormData({ email: '', password: '', rememberMe: false });
          setSignUpData({ name: '', role: 'engineer', team: '' });
          setIsSignUp(false);
        }
      } else {
        onError?.(result.error);
      }
    } catch (err) {
      onError?.(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      onError?.('Please enter your email address first');
      return;
    }
    
    try {
      const result = await resetPassword(formData.email);
      if (result.success) {
        onSuccess?.('Password reset email sent. Please check your inbox.');
      } else {
        onError?.(result.error);
      }
    } catch (err) {
      onError?.(err.message || 'Password reset failed');
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setFormData({ email: '', password: '', rememberMe: false });
    setSignUpData({ name: '', role: 'engineer', team: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Formula 4 Analytics
          </h2>
          <p className="text-slate-300">
            {isSignUp ? 'Create your secure account' : 'Sign in to your account'}
          </p>
          
          {/* Security Status */}
          {securityStatus && (
            <div className="mt-4 text-xs text-slate-400 flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                securityStatus.securityLevel === 'HIGH' ? 'bg-green-500' :
                securityStatus.securityLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              Security Level: {securityStatus.securityLevel}
            </div>
          )}
        </div>

        {/* Rate Limit Warning */}
        {rateLimitInfo?.isBlocked && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center text-red-300 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Rate limit exceeded. Try again in {rateLimitInfo.blockedTime}s
            </div>
          </div>
        )}

        {/* Rate Limit Info */}
        {rateLimitInfo && !rateLimitInfo.isBlocked && rateLimitInfo.attemptCount > 0 && (
          <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-yellow-300 text-xs text-center">
              Attempts: {rateLimitInfo.attemptCount} / 5
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center text-red-300 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign Up Fields */}
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={signUpData.name}
                  onChange={handleSignUpDataChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={signUpData.role}
                    onChange={handleSignUpDataChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="driver">Driver</option>
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Team
                  </label>
                  <input
                    type="text"
                    name="team"
                    value={signUpData.team}
                    onChange={handleSignUpDataChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Team name"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656L15.536 15.536m-1.414-1.414L15.536 15.536" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me (Sign In Only) */}
          {!isSignUp && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-red-600 bg-transparent border-white/10 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300">Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSubmitting || rateLimitInfo?.isBlocked}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {(loading || isSubmitting) ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Toggle Auth Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>

        {/* Security Features Info */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-xs text-slate-400 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secured with enterprise-grade authentication
            </div>
            <div className="text-xs">
              CSRF Protection • Rate Limiting • Session Security • Audit Logging
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;