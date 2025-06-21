// dashboard/src/services/auth.js
import { supabase } from '../config/supabase.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  // Initialize auth state listener
  initialize() {
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      this.authStateListeners.forEach(listener => listener(this.currentUser, event));
    });
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || '',
            role: userData.role || 'engineer',
            team: userData.team || ''
          }
        }
      });

      if (error) throw error;

      // Create user profile if signup successful
      if (data.user) {
        await this.createUserProfile(data.user.id, {
          email: data.user.email,
          name: userData.name || '',
          role: userData.role || 'engineer',
          team: userData.team || '',
          created_at: new Date().toISOString()
        });
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: error.message };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error.message };
    }
  }

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error.message };
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error.message };
    }
  }

  // Create user profile
  async createUserProfile(userId, profileData) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          ...profileData
        });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Create user profile error:', error);
      return { error: error.message };
    }
  }

  // Get user profile
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) throw new Error('No user ID provided');

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

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const userId = this.currentUser?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { profile: null, error: error.message };
    }
  }
}

export const authService = new AuthService();
export default authService;