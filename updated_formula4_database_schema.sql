-- Formula 4 Race Analytics Database Schema
-- Updated to match actual AiM RaceStudio telemetry format (39 parameters)
-- Generated based on analysis of Aqil Alibhai and Jaden Pariat telemetry files

-- =====================================================
-- CORE SYSTEM TABLES
-- =====================================================

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'driver',
    team_id UUID REFERENCES teams(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams Management
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TELEMETRY FILE MANAGEMENT
-- =====================================================

-- Telemetry Files Storage
CREATE TABLE telemetry_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    format VARCHAR(50) NOT NULL DEFAULT 'AiM_RaceStudio', -- AiM, Marelli, etc.
    uploaded_by UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, processed, error
    upload_path TEXT,
    processing_logs TEXT[],
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Telemetry Metadata (extracted from AiM format headers)
CREATE TABLE telemetry_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES telemetry_files(id) ON DELETE CASCADE,
    driver_name VARCHAR(255),
    session_type VARCHAR(100), -- e.g., 'MMSC Full'
    vehicle VARCHAR(255), -- e.g., 'Mygale F4 Spec 2'
    car_number INTEGER,
    championship VARCHAR(255), -- e.g., 'Indian F4', 'Formula 4 India'
    track_name VARCHAR(255),
    session_date DATE,
    session_time TIME,
    total_laps INTEGER,
    fastest_lap_time DECIMAL(6,3),
    beacon_markers DECIMAL(8,3)[], -- Track segment markers
    segment_times VARCHAR(20)[], -- Sector times as strings
    parameter_count INTEGER DEFAULT 39,
    data_start_row INTEGER DEFAULT 17,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TELEMETRY DATA STORAGE (39 Parameters)
-- =====================================================

-- Main telemetry data table with all 39 parameters from AiM format
CREATE TABLE telemetry_data_points (
    id BIGSERIAL PRIMARY KEY,
    file_id UUID REFERENCES telemetry_files(id) ON DELETE CASCADE,
    lap_number INTEGER,
    
    -- Core Timing
    timestamp DECIMAL(10,3) NOT NULL, -- Time [s]
    
    -- GPS Core Data (14 parameters)
    gps_speed DECIMAL(6,2), -- GPS Speed [km/h]
    gps_nsat INTEGER, -- GPS Nsat (number of satellites)
    gps_lat_acc DECIMAL(8,4), -- GPS LatAcc [g]
    gps_lon_acc DECIMAL(8,4), -- GPS LonAcc [g]
    gps_slope DECIMAL(8,4), -- GPS Slope [deg]
    gps_heading DECIMAL(8,4), -- GPS Heading [deg]
    gps_gyro DECIMAL(8,4), -- GPS Gyro [deg/s]
    gps_altitude DECIMAL(8,2), -- GPS Altitude [m]
    gps_pos_accuracy DECIMAL(8,2), -- GPS PosAccuracy [mm]
    gps_spd_accuracy DECIMAL(6,2), -- GPS SpdAccuracy [km/h]
    gps_radius DECIMAL(10,2), -- GPS Radius [m]
    gps_latitude DECIMAL(12,8), -- GPS Latitude [deg]
    gps_longitude DECIMAL(12,8), -- GPS Longitude [deg]
    
    -- Temperature Sensors (5 parameters)
    logger_temp DECIMAL(6,2), -- LoggerTemp [°C]
    water_temp DECIMAL(6,2), -- Water Temp [°C]
    head_temp DECIMAL(6,2), -- Head Temp [°C]
    exhaust_temp DECIMAL(6,1), -- Exhaust Temp [°C]
    oil_temp DECIMAL(6,2), -- Oil Temp [°C]
    
    -- Engine Data (5 parameters)
    engine_rpm INTEGER, -- Engine RPM [rpm]
    vehicle_speed DECIMAL(6,2), -- Speed [km/h] (different from GPS speed)
    gear INTEGER, -- Gear [gear]
    throttle_pos DECIMAL(5,2), -- Throttle Pos [%]
    lambda_value DECIMAL(6,4), -- Lambda [lambda] (air/fuel ratio)
    
    -- Pressure Systems (2 parameters)
    oil_press DECIMAL(6,2), -- Oil Press [bar]
    brake_press DECIMAL(6,2), -- Brake Press [bar]
    
    -- Control Positions (3 parameters)
    brake_pos DECIMAL(5,2), -- Brake Pos [%]
    clutch_pos DECIMAL(5,2), -- Clutch Pos [%]
    steering_pos DECIMAL(8,2), -- Steering Pos [deg]
    
    -- Acceleration Data (3 parameters)
    lateral_acc DECIMAL(6,4), -- Lateral Acc [g]
    inline_acc DECIMAL(6,4), -- Inline Acc [g] (longitudinal)
    vertical_acc DECIMAL(6,4), -- Vertical Acc [g]
    
    -- Power and Fuel (3 parameters)
    battery DECIMAL(5,2), -- Battery [V]
    battery_voltage DECIMAL(5,2), -- Battery Voltage [V]
    fuel_level DECIMAL(5,2), -- Fuel Level [%]
    
    -- Distance Tracking (2 parameters)
    distance_on_gps_speed DECIMAL(12,2), -- Distance on GPS Speed [m]
    distance_on_vehicle_speed DECIMAL(12,2), -- Distance on Vehicle Speed [m]
    
    -- System Data (2 parameters)
    predictive_time DECIMAL(10,3), -- Predictive Time
    predictive_time_alt DECIMAL(10,3), -- #NAME? (unknown parameter)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LAP AND SESSION DATA
-- =====================================================

-- Individual Lap Data
CREATE TABLE lap_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES telemetry_files(id) ON DELETE CASCADE,
    lap_number INTEGER NOT NULL,
    lap_time DECIMAL(6,3),
    is_fastest_lap BOOLEAN DEFAULT FALSE,
    start_time DECIMAL(10,3),
    end_time DECIMAL(10,3),
    start_distance DECIMAL(12,2),
    end_distance DECIMAL(12,2),
    average_speed DECIMAL(6,2),
    max_speed DECIMAL(6,2),
    max_rpm INTEGER,
    max_g_force DECIMAL(6,4),
    fuel_consumed DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ANALYSIS RESULTS
-- =====================================================

-- Driver Comparison Results
CREATE TABLE comparison_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    driver1_file_id UUID REFERENCES telemetry_files(id),
    driver2_file_id UUID REFERENCES telemetry_files(id),
    driver1_lap INTEGER,
    driver2_lap INTEGER,
    created_by UUID REFERENCES users(id),
    total_time_difference DECIMAL(6,3),
    max_time_gain DECIMAL(6,3),
    max_time_loss DECIMAL(6,3),
    analysis_data JSONB, -- Store complex analysis results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delta Analysis Data
CREATE TABLE delta_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID REFERENCES comparison_analyses(id) ON DELETE CASCADE,
    distance_point DECIMAL(12,2),
    time_delta DECIMAL(6,3),
    cumulative_delta DECIMAL(6,3),
    speed_difference DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track Sector Analysis
CREATE TABLE sector_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID REFERENCES comparison_analyses(id) ON DELETE CASCADE,
    sector_number INTEGER,
    start_distance DECIMAL(12,2),
    end_distance DECIMAL(12,2),
    winner VARCHAR(10), -- 'driver1' or 'driver2'
    time_difference DECIMAL(6,3),
    driver1_avg_speed DECIMAL(6,2),
    driver2_avg_speed DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ADVANCED METRICS
-- =====================================================

-- Engine Efficiency Metrics
CREATE TABLE engine_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lap_id UUID REFERENCES lap_data(id) ON DELETE CASCADE,
    average_lambda DECIMAL(6,4),
    lambda_consistency DECIMAL(6,4), -- Standard deviation
    fuel_consumption_rate DECIMAL(6,4),
    thermal_efficiency DECIMAL(6,4),
    power_band_usage JSONB, -- RPM distribution analysis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Braking Performance Metrics
CREATE TABLE braking_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lap_id UUID REFERENCES lap_data(id) ON DELETE CASCADE,
    max_brake_pressure DECIMAL(6,2),
    average_brake_pressure DECIMAL(6,2),
    braking_efficiency_score DECIMAL(5,2),
    trail_braking_score DECIMAL(5,2),
    braking_zones JSONB, -- Array of braking zone data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Handling and Cornering Metrics
CREATE TABLE handling_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lap_id UUID REFERENCES lap_data(id) ON DELETE CASCADE,
    distance_point DECIMAL(12,2),
    oversteer_value DECIMAL(6,4),
    understeer_value DECIMAL(6,4),
    turn_radius DECIMAL(8,2),
    lateral_g_force DECIMAL(6,4),
    vertical_g_force DECIMAL(6,4),
    confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TRACK AND COORDINATE DATA
-- =====================================================

-- Track Mapping Data
CREATE TABLE track_coordinates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES telemetry_files(id) ON DELETE CASCADE,
    distance DECIMAL(12,2),
    latitude DECIMAL(12,8),
    longitude DECIMAL(12,8),
    altitude DECIMAL(8,2),
    heading DECIMAL(8,4),
    slope DECIMAL(8,4),
    banking_angle DECIMAL(6,2), -- Calculated banking
    sector INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Primary performance indexes
CREATE INDEX idx_telemetry_file_timestamp ON telemetry_data_points(file_id, timestamp);
CREATE INDEX idx_telemetry_lap_data ON telemetry_data_points(file_id, lap_number);
CREATE INDEX idx_telemetry_distance ON telemetry_data_points(file_id, distance_on_gps_speed);

-- GPS and position indexes
CREATE INDEX idx_telemetry_gps_coords ON telemetry_data_points(gps_latitude, gps_longitude);
CREATE INDEX idx_track_coordinates_distance ON track_coordinates(file_id, distance);

-- Analysis indexes
CREATE INDEX idx_comparison_drivers ON comparison_analyses(driver1_file_id, driver2_file_id);
CREATE INDEX idx_delta_analysis_distance ON delta_analysis(comparison_id, distance_point);
CREATE INDEX idx_lap_performance ON lap_data(file_id, lap_time);

-- User and team indexes
CREATE INDEX idx_files_user_team ON telemetry_files(uploaded_by, team_id);
CREATE INDEX idx_files_status ON telemetry_files(status, uploaded_at);

-- =====================================================
-- DATA VALIDATION CONSTRAINTS
-- =====================================================

-- Ensure valid data ranges
ALTER TABLE telemetry_data_points ADD CONSTRAINT chk_timestamp_positive CHECK (timestamp >= 0);
ALTER TABLE telemetry_data_points ADD CONSTRAINT chk_speed_reasonable CHECK (gps_speed >= 0 AND gps_speed <= 400);
ALTER TABLE telemetry_data_points ADD CONSTRAINT chk_rpm_reasonable CHECK (engine_rpm >= 0 AND engine_rpm <= 20000);
ALTER TABLE telemetry_data_points ADD CONSTRAINT chk_gear_valid CHECK (gear >= -1 AND gear <= 8);
ALTER TABLE telemetry_data_points ADD CONSTRAINT chk_percentages CHECK (
    throttle_pos >= 0 AND throttle_pos <= 100 AND
    brake_pos >= 0 AND brake_pos <= 100 AND
    clutch_pos >= 0 AND clutch_pos <= 100 AND
    fuel_level >= 0 AND fuel_level <= 100
);

-- =====================================================
-- DATA RETENTION AND CLEANUP
-- =====================================================

-- Automatic cleanup function for old processed data
CREATE OR REPLACE FUNCTION cleanup_old_telemetry_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete telemetry data points older than 1 year
    DELETE FROM telemetry_data_points 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up orphaned analysis data
    DELETE FROM comparison_analyses 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================

-- Query to get all telemetry parameters for a specific lap
/*
SELECT 
    timestamp,
    gps_speed, vehicle_speed,
    engine_rpm, gear, throttle_pos,
    brake_press, brake_pos,
    lateral_acc, inline_acc,
    gps_latitude, gps_longitude
FROM telemetry_data_points 
WHERE file_id = $1 AND lap_number = $2
ORDER BY timestamp;
*/

-- Query to compare speed between two drivers
/*
SELECT 
    t1.distance_on_gps_speed as distance,
    t1.gps_speed as driver1_speed,
    t2.gps_speed as driver2_speed,
    (t1.gps_speed - t2.gps_speed) as speed_difference
FROM telemetry_data_points t1
JOIN telemetry_data_points t2 ON ABS(t1.distance_on_gps_speed - t2.distance_on_gps_speed) < 1
WHERE t1.file_id = $1 AND t2.file_id = $2
    AND t1.lap_number = $3 AND t2.lap_number = $4
ORDER BY distance;
*/

-- Query for engine performance analysis
/*
SELECT 
    AVG(lambda_value) as avg_lambda,
    AVG(engine_rpm) as avg_rpm,
    MAX(engine_rpm) as max_rpm,
    AVG(throttle_pos) as avg_throttle,
    AVG(oil_temp) as avg_oil_temp,
    AVG(water_temp) as avg_water_temp
FROM telemetry_data_points
WHERE file_id = $1 AND lap_number = $2;
*/