// dashboard/src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database table names
export const TABLES = {
  SESSIONS: 'sessions',
  TELEMETRY_DATA: 'telemetry_data',
  DRIVERS: 'drivers',
  TEAMS: 'teams',
  TRACKS: 'tracks',
  LAPS: 'laps',
  USER_PROFILES: 'user_profiles'
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  TELEMETRY_FILES: 'telemetry-files',
  TRACK_MAPS: 'track-maps',
  DRIVER_PHOTOS: 'driver-photos'
};

export default supabase;