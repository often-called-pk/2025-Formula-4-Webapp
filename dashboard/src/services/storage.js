// dashboard/src/services/storage.js
import { supabase, STORAGE_BUCKETS } from '../config/supabase.js';

class StorageService {
  // Upload telemetry file
  async uploadTelemetryFile(file, sessionId, fileName = null) {
    try {
      const fileExtension = file.name.split('.').pop();
      const uploadFileName = fileName || `${sessionId}_${Date.now()}.${fileExtension}`;
      const filePath = `sessions/${sessionId}/${uploadFileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.TELEMETRY_FILES)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.TELEMETRY_FILES)
        .getPublicUrl(filePath);

      return {
        filePath: data.path,
        publicUrl: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Upload telemetry file error:', error);
      return {
        filePath: null,
        publicUrl: null,
        error: error.message
      };
    }
  }

  // Download telemetry file
  async downloadTelemetryFile(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.TELEMETRY_FILES)
        .download(filePath);

      if (error) throw error;
      return { file: data, error: null };
    } catch (error) {
      console.error('Download telemetry file error:', error);
      return { file: null, error: error.message };
    }
  }

  // Delete telemetry file
  async deleteTelemetryFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.TELEMETRY_FILES)
        .remove([filePath]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete telemetry file error:', error);
      return { error: error.message };
    }
  }

  // List telemetry files for a session
  async listTelemetryFiles(sessionId) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.TELEMETRY_FILES)
        .list(`sessions/${sessionId}`, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;
      return { files: data, error: null };
    } catch (error) {
      console.error('List telemetry files error:', error);
      return { files: [], error: error.message };
    }
  }

  // Upload track map
  async uploadTrackMap(file, trackId, fileName = null) {
    try {
      const fileExtension = file.name.split('.').pop();
      const uploadFileName = fileName || `${trackId}_map.${fileExtension}`;
      const filePath = `tracks/${trackId}/${uploadFileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.TRACK_MAPS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.TRACK_MAPS)
        .getPublicUrl(filePath);

      return {
        filePath: data.path,
        publicUrl: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Upload track map error:', error);
      return {
        filePath: null,
        publicUrl: null,
        error: error.message
      };
    }
  }

  // Upload driver photo
  async uploadDriverPhoto(file, driverId, fileName = null) {
    try {
      const fileExtension = file.name.split('.').pop();
      const uploadFileName = fileName || `${driverId}_photo.${fileExtension}`;
      const filePath = `drivers/${driverId}/${uploadFileName}`;

      // Resize image if needed (optional - requires image processing)
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.DRIVER_PHOTOS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.DRIVER_PHOTOS)
        .getPublicUrl(filePath);

      return {
        filePath: data.path,
        publicUrl: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Upload driver photo error:', error);
      return {
        filePath: null,
        publicUrl: null,
        error: error.message
      };
    }
  }

  // Get file URL
  async getFileUrl(bucket, filePath) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('Get file URL error:', error);
      return { url: null, error: error.message };
    }
  }

  // Create signed URL for private files
  async createSignedUrl(bucket, filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return { signedUrl: data.signedUrl, error: null };
    } catch (error) {
      console.error('Create signed URL error:', error);
      return { signedUrl: null, error: error.message };
    }
  }

  // Check if file exists
  async fileExists(bucket, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(filePath.split('/').slice(0, -1).join('/'));

      if (error) throw error;

      const fileName = filePath.split('/').pop();
      const fileExists = data.some(file => file.name === fileName);

      return { exists: fileExists, error: null };
    } catch (error) {
      console.error('Check file exists error:', error);
      return { exists: false, error: error.message };
    }
  }

  // Get storage usage stats
  async getStorageStats() {
    try {
      const buckets = [
        STORAGE_BUCKETS.TELEMETRY_FILES,
        STORAGE_BUCKETS.TRACK_MAPS,
        STORAGE_BUCKETS.DRIVER_PHOTOS
      ];

      const stats = {};
      
      for (const bucket of buckets) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list('', {
            limit: 1000
          });

        if (!error && data) {
          stats[bucket] = {
            fileCount: data.length,
            totalSize: data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
          };
        }
      }

      return { stats, error: null };
    } catch (error) {
      console.error('Get storage stats error:', error);
      return { stats: null, error: error.message };
    }
  }
}

export const storageService = new StorageService();
export default storageService;