// dashboard/src/services/database.js
import { supabase, TABLES } from '../config/supabase.js';

class DatabaseService {
  // Sessions CRUD operations
  async createSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .insert({
          ...sessionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { session: data, error: null };
    } catch (error) {
      console.error('Create session error:', error);
      return { session: null, error: error.message };
    }
  }

  async getSessions(filters = {}) {
    try {
      let query = supabase
        .from(TABLES.SESSIONS)
        .select(`
          *,
          drivers(*),
          tracks(*),
          laps(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.driverId) {
        query = query.eq('driver_id', filters.driverId);
      }
      if (filters.trackId) {
        query = query.eq('track_id', filters.trackId);
      }
      if (filters.sessionType) {
        query = query.eq('session_type', filters.sessionType);
      }
      if (filters.dateFrom) {
        query = query.gte('session_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('session_date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { sessions: data, error: null };
    } catch (error) {
      console.error('Get sessions error:', error);
      return { sessions: [], error: error.message };
    }
  }

  async getSessionById(sessionId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .select(`
          *,
          drivers(*),
          tracks(*),
          laps(*),
          telemetry_data(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return { session: data, error: null };
    } catch (error) {
      console.error('Get session by ID error:', error);
      return { session: null, error: error.message };
    }
  }

  async updateSession(sessionId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return { session: data, error: null };
    } catch (error) {
      console.error('Update session error:', error);
      return { session: null, error: error.message };
    }
  }

  async deleteSession(sessionId) {
    try {
      // First delete related telemetry data and laps
      await supabase.from(TABLES.TELEMETRY_DATA).delete().eq('session_id', sessionId);
      await supabase.from(TABLES.LAPS).delete().eq('session_id', sessionId);

      // Then delete the session
      const { error } = await supabase
        .from(TABLES.SESSIONS)
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete session error:', error);
      return { error: error.message };
    }
  }

  // Telemetry data operations
  async saveTelemetryData(sessionId, telemetryData) {
    try {
      const formattedData = telemetryData.map(point => ({
        session_id: sessionId,
        timestamp: point.timestamp || new Date().toISOString(),
        lap_number: point.lap_number || 1,
        // Core telemetry parameters
        speed: point.speed || 0,
        rpm: point.rpm || 0,
        throttle: point.throttle || 0,
        brake: point.brake || 0,
        steering_angle: point.steering_angle || 0,
        gear: point.gear || 1,
        // Position data
        gps_latitude: point.gps_latitude || null,
        gps_longitude: point.gps_longitude || null,
        gps_speed: point.gps_speed || 0,
        // Engine data
        coolant_temp: point.coolant_temp || 0,
        oil_temp: point.oil_temp || 0,
        oil_pressure: point.oil_pressure || 0,
        fuel_level: point.fuel_level || 0,
        // Suspension data
        damper_fl: point.damper_fl || 0,
        damper_fr: point.damper_fr || 0,
        damper_rl: point.damper_rl || 0,
        damper_rr: point.damper_rr || 0,
        // Tire data
        tire_temp_fl: point.tire_temp_fl || 0,
        tire_temp_fr: point.tire_temp_fr || 0,
        tire_temp_rl: point.tire_temp_rl || 0,
        tire_temp_rr: point.tire_temp_rr || 0,
        tire_pressure_fl: point.tire_pressure_fl || 0,
        tire_pressure_fr: point.tire_pressure_fr || 0,
        tire_pressure_rl: point.tire_pressure_rl || 0,
        tire_pressure_rr: point.tire_pressure_rr || 0,
        // Additional parameters
        battery_voltage: point.battery_voltage || 0,
        ambient_temp: point.ambient_temp || 0,
        track_temp: point.track_temp || 0,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from(TABLES.TELEMETRY_DATA)
        .insert(formattedData)
        .select();

      if (error) throw error;
      return { telemetryData: data, error: null };
    } catch (error) {
      console.error('Save telemetry data error:', error);
      return { telemetryData: null, error: error.message };
    }
  }

  async getTelemetryData(sessionId, filters = {}) {
    try {
      let query = supabase
        .from(TABLES.TELEMETRY_DATA)
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp');

      if (filters.lapNumber) {
        query = query.eq('lap_number', filters.lapNumber);
      }
      if (filters.startTime) {
        query = query.gte('timestamp', filters.startTime);
      }
      if (filters.endTime) {
        query = query.lte('timestamp', filters.endTime);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { telemetryData: data, error: null };
    } catch (error) {
      console.error('Get telemetry data error:', error);
      return { telemetryData: [], error: error.message };
    }
  }

  // Drivers CRUD operations
  async createDriver(driverData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.DRIVERS)
        .insert({
          ...driverData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { driver: data, error: null };
    } catch (error) {
      console.error('Create driver error:', error);
      return { driver: null, error: error.message };
    }
  }

  async getDrivers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.DRIVERS)
        .select('*')
        .order('name');

      if (error) throw error;
      return { drivers: data, error: null };
    } catch (error) {
      console.error('Get drivers error:', error);
      return { drivers: [], error: error.message };
    }
  }

  // Tracks CRUD operations
  async createTrack(trackData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRACKS)
        .insert({
          ...trackData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { track: data, error: null };
    } catch (error) {
      console.error('Create track error:', error);
      return { track: null, error: error.message };
    }
  }

  async getTracks() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRACKS)
        .select('*')
        .order('name');

      if (error) throw error;
      return { tracks: data, error: null };
    } catch (error) {
      console.error('Get tracks error:', error);
      return { tracks: [], error: error.message };
    }
  }

  // Laps operations
  async saveLapData(sessionId, lapData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.LAPS)
        .insert({
          session_id: sessionId,
          ...lapData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { lap: data, error: null };
    } catch (error) {
      console.error('Save lap data error:', error);
      return { lap: null, error: error.message };
    }
  }

  async getLaps(sessionId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.LAPS)
        .select('*')
        .eq('session_id', sessionId)
        .order('lap_number');

      if (error) throw error;
      return { laps: data, error: null };
    } catch (error) {
      console.error('Get laps error:', error);
      return { laps: [], error: error.message };
    }
  }

  // Search and filtering
  async searchSessions(searchTerm) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .select(`
          *,
          drivers(*),
          tracks(*)
        `)
        .or(`session_name.ilike.%${searchTerm}%,drivers.name.ilike.%${searchTerm}%,tracks.name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { sessions: data, error: null };
    } catch (error) {
      console.error('Search sessions error:', error);
      return { sessions: [], error: error.message };
    }
  }

  // Analytics queries
  async getSessionAnalytics(sessionId) {
    try {
      const { data, error } = await supabase
        .rpc('get_session_analytics', { session_id: sessionId });

      if (error) throw error;
      return { analytics: data, error: null };
    } catch (error) {
      console.error('Get session analytics error:', error);
      return { analytics: null, error: error.message };
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;