// dashboard/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.js';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize auth service
    authService.initialize();

    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChange(async (user, event) => {
      setUser(user);
      setError(null);

      if (user) {
        // Fetch user profile
        try {
          const { profile: userProfile, error: profileError } = await authService.getUserProfile();
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
    authService.getCurrentSession().then(({ session, error: sessionError }) => {
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError(sessionError);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, userData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { user: newUser, error: signUpError } = await authService.signUp(email, password, userData);
      
      if (signUpError) {
        setError(signUpError);
        return { success: false, error: signUpError };
      }

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err.message || 'Sign up failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedInUser, error: signInError } = await authService.signIn(email, password);
      
      if (signInError) {
        setError(signInError);
        return { success: false, error: signInError };
      }

      return { success: true, user: signedInUser };
    } catch (err) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await authService.signOut();
      
      if (signOutError) {
        setError(signOutError);
        return { success: false, error: signOutError };
      }

      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await authService.resetPassword(email);
      
      if (resetError) {
        setError(resetError);
        return { success: false, error: resetError };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await authService.updatePassword(newPassword);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Password update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const { profile: updatedProfile, error: updateError } = await authService.updateUserProfile(profileData);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
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
      const { profile: refreshedProfile, error: refreshError } = await authService.getUserProfile();
      
      if (refreshError) {
        setError(refreshError);
        return { success: false, error: refreshError };
      }

      setProfile(refreshedProfile);
      return { success: true, profile: refreshedProfile };
    } catch (err) {
      const errorMessage = err.message || 'Profile refresh failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    
    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    
    // Utility
    clearError: () => setError(null)
  };
};

export default useAuth;