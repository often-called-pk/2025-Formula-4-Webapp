// dashboard/src/hooks/useSupabase.js
import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database.js';
import { storageService } from '../services/storage.js';
import { realtimeService } from '../services/realtime.js';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sessions operations
  const createSession = useCallback(async (sessionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { session, error: createError } = await databaseService.createSession(sessionData);
      if (createError) throw new Error(createError);
      return { success: true, session };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSessions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { sessions, error: getError } = await databaseService.getSessions(filters);
      if (getError) throw new Error(getError);
      return { success: true, sessions };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, sessions: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSessionById = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { session, error: getError } = await databaseService.getSessionById(sessionId);
      if (getError) throw new Error(getError);
      return { success: true, session };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, session: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const { session, error: updateError } = await databaseService.updateSession(sessionId, updates);
      if (updateError) throw new Error(updateError);
      return { success: true, session };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await databaseService.deleteSession(sessionId);
      if (deleteError) throw new Error(deleteError);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Telemetry data operations
  const saveTelemetryData = useCallback(async (sessionId, telemetryData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { telemetryData: savedData, error: saveError } = await databaseService.saveTelemetryData(sessionId, telemetryData);
      if (saveError) throw new Error(saveError);
      return { success: true, telemetryData: savedData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTelemetryData = useCallback(async (sessionId, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { telemetryData, error: getError } = await databaseService.getTelemetryData(sessionId, filters);
      if (getError) throw new Error(getError);
      return { success: true, telemetryData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, telemetryData: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Drivers operations
  const createDriver = useCallback(async (driverData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { driver, error: createError } = await databaseService.createDriver(driverData);
      if (createError) throw new Error(createError);
      return { success: true, driver };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { drivers, error: getError } = await databaseService.getDrivers();
      if (getError) throw new Error(getError);
      return { success: true, drivers };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, drivers: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Tracks operations
  const createTrack = useCallback(async (trackData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { track, error: createError } = await databaseService.createTrack(trackData);
      if (createError) throw new Error(createError);
      return { success: true, track };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { tracks, error: getError } = await databaseService.getTracks();
      if (getError) throw new Error(getError);
      return { success: true, tracks };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, tracks: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Laps operations
  const saveLapData = useCallback(async (sessionId, lapData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { lap, error: saveError } = await databaseService.saveLapData(sessionId, lapData);
      if (saveError) throw new Error(saveError);
      return { success: true, lap };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getLaps = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { laps, error: getError } = await databaseService.getLaps(sessionId);
      if (getError) throw new Error(getError);
      return { success: true, laps };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, laps: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Storage operations
  const uploadTelemetryFile = useCallback(async (file, sessionId, fileName = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const { filePath, publicUrl, error: uploadError } = await storageService.uploadTelemetryFile(file, sessionId, fileName);
      if (uploadError) throw new Error(uploadError);
      return { success: true, filePath, publicUrl };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadTrackMap = useCallback(async (file, trackId, fileName = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const { filePath, publicUrl, error: uploadError } = await storageService.uploadTrackMap(file, trackId, fileName);
      if (uploadError) throw new Error(uploadError);
      return { success: true, filePath, publicUrl };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDriverPhoto = useCallback(async (file, driverId, fileName = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const { filePath, publicUrl, error: uploadError } = await storageService.uploadDriverPhoto(file, driverId, fileName);
      if (uploadError) throw new Error(uploadError);
      return { success: true, filePath, publicUrl };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Search operations
  const searchSessions = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      const { sessions, error: searchError } = await databaseService.searchSessions(searchTerm);
      if (searchError) throw new Error(searchError);
      return { success: true, sessions };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, sessions: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Analytics operations
  const getSessionAnalytics = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { analytics, error: analyticsError } = await databaseService.getSessionAnalytics(sessionId);
      if (analyticsError) throw new Error(analyticsError);
      return { success: true, analytics };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, analytics: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Sessions
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    deleteSession,
    
    // Telemetry
    saveTelemetryData,
    getTelemetryData,
    
    // Drivers
    createDriver,
    getDrivers,
    
    // Tracks
    createTrack,
    getTracks,
    
    // Laps
    saveLapData,
    getLaps,
    
    // Storage
    uploadTelemetryFile,
    uploadTrackMap,
    uploadDriverPhoto,
    
    // Search
    searchSessions,
    
    // Analytics
    getSessionAnalytics,
    
    // Utilities
    clearError,
    
    // Real-time service access
    realtimeService
  };
};

export default useSupabase;