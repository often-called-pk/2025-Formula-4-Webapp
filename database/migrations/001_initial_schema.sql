-- Formula 4 Race Analytics - Initial Database Schema
-- This migration creates the complete database schema for the telemetry application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('driver', 'engineer', 'team_manager', 'admin');
CREATE TYPE session_type AS ENUM ('practice', 'qualifying', 'race', 'test');
CREATE TYPE membership_role AS ENUM ('member', 'engineer', 'manager', 'owner');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    display_name VARCHAR(255),
    avatar_url TEXT,
    role user_role DEFAULT 'driver',
    team_id UUID,
    phone VARCHAR(20),
    country VARCHAR(100),
    date_of_birth DATE,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    founded_date DATE,
    headquarters VARCHAR(255),
    website VARCHAR(255),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team memberships table (many-to-many relationship between users and teams)
CREATE TABLE public.team_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    role membership_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Tracks table
CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    country VARCHAR(100),
    length_meters DECIMAL(8,2),
    turns INTEGER,
    lap_record_time DECIMAL(8,3),
    lap_record_holder VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry sessions table
CREATE TABLE public.telemetry_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    team_id UUID REFERENCES public.teams(id),
    track_id UUID REFERENCES public.tracks(id),
    session_name VARCHAR(255) NOT NULL,
    session_type session_type DEFAULT 'practice',
    track_name VARCHAR(255),
    car_model VARCHAR(255),
    setup_notes TEXT,
    weather_conditions VARCHAR(255),
    track_temperature DECIMAL(5,2),
    air_temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    session_date DATE,
    session_time TIME,
    duration_minutes INTEGER,
    total_laps INTEGER,
    file_path TEXT,
    file_size BIGINT,
    processed BOOLEAN DEFAULT FALSE,
    shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry data table (optimized for time-series data)
CREATE TABLE public.telemetry_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    lap_number INTEGER,
    sector INTEGER,
    distance DECIMAL(8,3),
    
    -- Vehicle dynamics
    speed DECIMAL(6,2),
    rpm INTEGER,
    gear INTEGER,
    throttle DECIMAL(5,2),
    brake DECIMAL(5,2),
    steering_angle DECIMAL(6,2),
    
    -- GPS and positioning
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    altitude DECIMAL(7,2),
    gps_speed DECIMAL(6,2),
    
    -- G-Forces and suspension
    g_force_lat DECIMAL(5,3),
    g_force_lon DECIMAL(5,3),
    g_force_vert DECIMAL(5,3),
    suspension_fl DECIMAL(6,2),
    suspension_fr DECIMAL(6,2),
    suspension_rl DECIMAL(6,2),
    suspension_rr DECIMAL(6,2),
    
    -- Engine and temperatures
    engine_temp DECIMAL(5,2),
    oil_temp DECIMAL(5,2),
    oil_pressure DECIMAL(5,2),
    fuel_level DECIMAL(5,2),
    fuel_consumption DECIMAL(6,3),
    
    -- Tire data
    tire_temp_fl DECIMAL(5,2),
    tire_temp_fr DECIMAL(5,2),
    tire_temp_rl DECIMAL(5,2),
    tire_temp_rr DECIMAL(5,2),
    tire_pressure_fl DECIMAL(4,1),
    tire_pressure_fr DECIMAL(4,1),
    tire_pressure_rl DECIMAL(4,1),
    tire_pressure_rr DECIMAL(4,1),
    
    -- Aerodynamics and downforce
    downforce_front DECIMAL(6,2),
    downforce_rear DECIMAL(6,2),
    drag DECIMAL(6,2),
    
    -- Performance metrics
    lap_time DECIMAL(8,3),
    sector_time DECIMAL(8,3),
    split_time DECIMAL(8,3),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fastest laps table
CREATE TABLE public.fastest_laps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    track_id UUID REFERENCES public.tracks(id),
    lap_number INTEGER NOT NULL,
    lap_time DECIMAL(8,3) NOT NULL,
    sector_1_time DECIMAL(8,3),
    sector_2_time DECIMAL(8,3),
    sector_3_time DECIMAL(8,3),
    average_speed DECIMAL(6,2),
    max_speed DECIMAL(6,2),
    conditions VARCHAR(255),
    is_personal_best BOOLEAN DEFAULT FALSE,
    is_track_record BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, lap_number)
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_team_id ON public.users(team_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX idx_telemetry_sessions_user_id ON public.telemetry_sessions(user_id);
CREATE INDEX idx_telemetry_sessions_team_id ON public.telemetry_sessions(team_id);
CREATE INDEX idx_telemetry_sessions_track_id ON public.telemetry_sessions(track_id);
CREATE INDEX idx_telemetry_sessions_date ON public.telemetry_sessions(session_date DESC);
CREATE INDEX idx_telemetry_data_session_id ON public.telemetry_data(session_id);
CREATE INDEX idx_telemetry_data_timestamp ON public.telemetry_data(timestamp DESC);
CREATE INDEX idx_telemetry_data_session_timestamp ON public.telemetry_data(session_id, timestamp);
CREATE INDEX idx_telemetry_data_lap_number ON public.telemetry_data(session_id, lap_number);
CREATE INDEX idx_fastest_laps_user_id ON public.fastest_laps(user_id);
CREATE INDEX idx_fastest_laps_track_id ON public.fastest_laps(track_id);
CREATE INDEX idx_fastest_laps_lap_time ON public.fastest_laps(lap_time);
CREATE INDEX idx_fastest_laps_session_id ON public.fastest_laps(session_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fastest_laps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view team members" ON public.users
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for teams table
CREATE POLICY "Team members can view team" ON public.teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can update team" ON public.teams
    FOR UPDATE USING (
        id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = auth.uid() AND role IN ('manager', 'owner')
        )
    );

CREATE POLICY "Authenticated users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for team_memberships table
CREATE POLICY "Team members can view memberships" ON public.team_memberships
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can manage memberships" ON public.team_memberships
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = auth.uid() AND role IN ('manager', 'owner')
        )
    );

-- RLS Policies for tracks table (public read access)
CREATE POLICY "Anyone can view tracks" ON public.tracks
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tracks" ON public.tracks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for telemetry_sessions table
CREATE POLICY "Users can view own sessions" ON public.telemetry_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team members can view shared sessions" ON public.telemetry_sessions
    FOR SELECT USING (
        shared = true AND team_id IN (
            SELECT team_id FROM public.team_memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own sessions" ON public.telemetry_sessions
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for telemetry_data table
CREATE POLICY "Users can view own telemetry data" ON public.telemetry_data
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.telemetry_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team members can view shared telemetry data" ON public.telemetry_data
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.telemetry_sessions 
            WHERE shared = true AND team_id IN (
                SELECT team_id FROM public.team_memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage own telemetry data" ON public.telemetry_data
    FOR ALL USING (
        session_id IN (
            SELECT id FROM public.telemetry_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for fastest_laps table
CREATE POLICY "Users can view own fastest laps" ON public.fastest_laps
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team members can view team fastest laps" ON public.fastest_laps
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.telemetry_sessions 
            WHERE shared = true AND team_id IN (
                SELECT team_id FROM public.team_memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage own fastest laps" ON public.fastest_laps
    FOR ALL USING (user_id = auth.uid());

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telemetry_sessions_updated_at BEFORE UPDATE ON public.telemetry_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add foreign key constraint for users.team_id after teams table is created
ALTER TABLE public.users ADD CONSTRAINT fk_users_team_id 
    FOREIGN KEY (team_id) REFERENCES public.teams(id);

-- Insert sample tracks
INSERT INTO public.tracks (id, name, location, country, length_meters, turns, description) VALUES
(uuid_generate_v4(), 'Buddh International Circuit', 'Greater Noida', 'India', 5125, 16, 'Formula 1 circuit in India'),
(uuid_generate_v4(), 'Kari Motor Speedway', 'Coimbatore', 'India', 2100, 12, 'Popular racing circuit in Tamil Nadu'),
(uuid_generate_v4(), 'Madras Motor Race Track', 'Chennai', 'India', 3717, 12, 'Historic racing venue in Chennai'),
(uuid_generate_v4(), 'Silverstone Circuit', 'Silverstone', 'United Kingdom', 5891, 18, 'Home of British Grand Prix');

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.teams IS 'Racing teams and organizations';
COMMENT ON TABLE public.team_memberships IS 'Many-to-many relationship between users and teams';
COMMENT ON TABLE public.tracks IS 'Racing tracks and circuits';
COMMENT ON TABLE public.telemetry_sessions IS 'Telemetry data collection sessions';
COMMENT ON TABLE public.telemetry_data IS 'Time-series telemetry data points';
COMMENT ON TABLE public.fastest_laps IS 'Fastest lap records and personal bests';