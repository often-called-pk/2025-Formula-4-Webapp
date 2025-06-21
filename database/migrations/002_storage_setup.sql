-- Formula 4 Race Analytics - Storage Setup Migration
-- This migration sets up Supabase Storage buckets and policies for file uploads

-- Note: Storage buckets must be created manually via Supabase Dashboard
-- This file provides the SQL policies and helper functions for storage management

-- Storage bucket policies for telemetry-files bucket
-- (Bucket must be created manually in Supabase Dashboard > Storage)

-- Telemetry Files Storage Policies
CREATE POLICY "Users can upload own telemetry files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'telemetry-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own telemetry files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'telemetry-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Team members can view shared telemetry files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'telemetry-files' AND
        (storage.foldername(name))[2] = 'shared' AND
        EXISTS (
            SELECT 1 FROM public.team_memberships tm
            JOIN public.telemetry_sessions ts ON ts.team_id = tm.team_id
            WHERE tm.user_id = auth.uid() AND ts.shared = true
        )
    );

CREATE POLICY "Users can update own telemetry files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'telemetry-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own telemetry files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'telemetry-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- User Avatars Storage Policies
CREATE POLICY "Users can upload own avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Helper function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE (
    bucket_name TEXT,
    file_count BIGINT,
    total_size BIGINT,
    total_size_mb DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.bucket_id as bucket_name,
        COUNT(*) as file_count,
        SUM(COALESCE(so.metadata->>'size', '0')::BIGINT) as total_size,
        ROUND(SUM(COALESCE(so.metadata->>'size', '0')::BIGINT) / 1024.0 / 1024.0, 2) as total_size_mb
    FROM storage.objects so
    WHERE user_uuid::text = (storage.foldername(so.name))[1]
    GROUP BY so.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to cleanup temporary files older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_temp_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete temporary files older than 24 hours
    WITH deleted AS (
        DELETE FROM storage.objects
        WHERE bucket_id IN ('telemetry-files', 'user-avatars')
        AND name LIKE '%/temp/%'
        AND created_at < NOW() - INTERVAL '24 hours'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure file path for uploads
CREATE OR REPLACE FUNCTION generate_file_path(
    user_uuid UUID,
    session_uuid UUID DEFAULT NULL,
    file_type TEXT DEFAULT 'telemetry',
    file_extension TEXT DEFAULT 'csv'
)
RETURNS TEXT AS $$
DECLARE
    base_path TEXT;
    timestamp_str TEXT;
BEGIN
    timestamp_str := to_char(NOW(), 'YYYY/MM/DD/HH24-MI-SS');
    
    CASE file_type
        WHEN 'telemetry' THEN
            IF session_uuid IS NOT NULL THEN
                base_path := user_uuid::text || '/sessions/' || session_uuid::text || '/' || timestamp_str;
            ELSE
                base_path := user_uuid::text || '/uploads/' || timestamp_str;
            END IF;
        WHEN 'avatar' THEN
            base_path := user_uuid::text || '/avatar';
        WHEN 'shared' THEN
            base_path := user_uuid::text || '/shared/public_sessions/' || timestamp_str;
        ELSE
            base_path := user_uuid::text || '/misc/' || timestamp_str;
    END CASE;
    
    RETURN base_path || '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file upload permissions
CREATE OR REPLACE FUNCTION can_upload_file(
    user_uuid UUID,
    bucket_name TEXT,
    file_path TEXT,
    file_size BIGINT DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
    user_storage_mb DECIMAL(10,2);
    max_storage_mb DECIMAL(10,2) := 1000; -- 1GB default limit
    max_file_size_mb DECIMAL(10,2);
BEGIN
    -- Set file size limits based on bucket
    CASE bucket_name
        WHEN 'telemetry-files' THEN
            max_file_size_mb := 50; -- 50MB for telemetry files
        WHEN 'user-avatars' THEN
            max_file_size_mb := 5; -- 5MB for avatars
        ELSE
            max_file_size_mb := 10; -- 10MB default
    END CASE;
    
    -- Check file size limit
    IF file_size > (max_file_size_mb * 1024 * 1024) THEN
        RETURN FALSE;
    END IF;
    
    -- Check user storage quota
    SELECT COALESCE(SUM(total_size_mb), 0) INTO user_storage_mb
    FROM get_user_storage_usage(user_uuid);
    
    IF user_storage_mb + (file_size / 1024.0 / 1024.0) > max_storage_mb THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user owns the path
    IF user_uuid::text != (storage.foldername(file_path))[1] THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for file management
CREATE OR REPLACE VIEW user_files AS
SELECT 
    so.id,
    so.bucket_id,
    so.name as file_path,
    (storage.foldername(so.name))[1]::UUID as owner_id,
    so.metadata->>'size' as file_size,
    so.metadata->>'mimetype' as mime_type,
    so.created_at,
    so.updated_at,
    CASE 
        WHEN so.name LIKE '%/sessions/%' THEN 'session'
        WHEN so.name LIKE '%/shared/%' THEN 'shared'
        WHEN so.name LIKE '%/avatar%' THEN 'avatar'
        ELSE 'general'
    END as file_category
FROM storage.objects so
WHERE so.bucket_id IN ('telemetry-files', 'user-avatars');

-- Grant permissions for the helper functions
GRANT EXECUTE ON FUNCTION get_user_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_file_path(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_upload_file(UUID, TEXT, TEXT, BIGINT) TO authenticated;
GRANT SELECT ON user_files TO authenticated;

-- Manual Setup Instructions (to be executed via Supabase Dashboard):
/*
1. Go to Supabase Dashboard > Storage
2. Create bucket 'telemetry-files' with settings:
   - Public: false
   - File size limit: 52428800 (50MB)
   - Allowed MIME types: text/csv,application/json,text/plain
3. Create bucket 'user-avatars' with settings:
   - Public: true
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: image/jpeg,image/png,image/webp
4. Enable RLS on both buckets
5. Apply the policies above via SQL Editor
*/

COMMENT ON FUNCTION get_user_storage_usage IS 'Get storage usage statistics for a user';
COMMENT ON FUNCTION cleanup_temp_files IS 'Clean up temporary files older than 24 hours';
COMMENT ON FUNCTION generate_file_path IS 'Generate secure file paths for uploads';
COMMENT ON FUNCTION can_upload_file IS 'Validate file upload permissions and limits';
COMMENT ON VIEW user_files IS 'User-accessible view of file storage';