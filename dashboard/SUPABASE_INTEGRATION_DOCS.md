# Formula 4 Race Analytics - Supabase Integration Documentation

## Overview

The Formula 4 Race Analytics dashboard has been successfully integrated with Supabase to provide:
- **User Authentication** - Secure login/logout with session management
- **Real-time Database** - PostgreSQL with real-time subscriptions
- **File Storage** - Telemetry file uploads and management
- **Real-time Features** - Live user presence and data updates

## Architecture

### Frontend Stack
- **React 18.x** with Vite
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase JS Client** for backend integration

### Backend Services (Supabase)
- **Authentication** - Email/password and OAuth providers
- **Database** - PostgreSQL with Row Level Security (RLS)
- **Storage** - File upload and management
- **Realtime** - WebSocket connections for live updates
- **Edge Functions** - Server-side logic processing

## Database Schema

### Core Tables

```sql
-- User Profiles
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  team TEXT,
  role TEXT DEFAULT 'engineer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  session_name TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  track_name TEXT,
  session_date DATE,
  session_type TEXT,
  weather_conditions TEXT,
  file_path TEXT,
  file_size BIGINT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry Data
CREATE TABLE telemetry_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,
  lap_number INTEGER,
  distance_m DECIMAL(8,3),
  speed_kmh DECIMAL(6,2),
  engine_rpm INTEGER,
  throttle_percent DECIMAL(5,2),
  brake_pressure_bar DECIMAL(6,2),
  steering_angle_deg DECIMAL(6,2),
  gear INTEGER,
  lateral_g DECIMAL(5,3),
  longitudinal_g DECIMAL(5,3),
  -- Additional 39-parameter telemetry fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Buckets

- **telemetry-files**: CSV telemetry data uploads
- **track-maps**: Circuit layout images and data
- **driver-photos**: Driver avatar images

## Component Architecture

### 1. App Component (`src/App.jsx`)
- **Main application container**
- **Navigation and routing**
- **Authentication state management**
- **Session data loading and management**

### 2. Auth Context (`src/contexts/AuthContext.jsx`)
- **User authentication state**
- **Profile management**
- **Real-time user presence**
- **Sign in/out functionality**

### 3. Supabase Hook (`src/hooks/useSupabase.js`)
- **Database operations**
- **File upload/download**
- **Real-time subscriptions**
- **Error handling**

### 4. Core Components

#### F4Dashboard (`src/components/F4Dashboard.jsx`)
- **Overview of telemetry sessions**
- **Key performance metrics**
- **Real-time data visualization**
- **Session selection and filtering**

#### TelemetryUpload (`src/components/TelemetryUpload.jsx`)
- **Drag & drop file upload**
- **CSV file validation**
- **Progress tracking**
- **Metadata extraction**

#### DriverComparison (`src/components/DriverComparison.jsx`)
- **Multi-session comparison**
- **Performance charts**
- **Statistical analysis**
- **Export functionality**

#### SessionManager (`src/components/SessionManager.jsx`)
- **Session CRUD operations**
- **Bulk actions**
- **Data export/import**
- **Archive management**

## Supabase Configuration

### Environment Variables

```bash
# Required Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Client Configuration (`src/config/supabase.js`)

```javascript
import { createClient } from '@supabase/supabase-js';

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
```

## Security Implementation

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for sessions table
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);
```

### Storage Policies

```sql
-- Telemetry files bucket policies
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
```

## Real-time Features

### User Presence
- **Online user count** in header
- **Real-time user list** with status indicators
- **Activity tracking** for collaborative analysis

### Data Synchronization
- **Live session updates** when new data is uploaded
- **Real-time notifications** for completed analyses
- **Collaborative editing** of session metadata

## API Integration

### Database Operations

```javascript
// Get user sessions
const { data: sessions, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Upload telemetry data
const { data, error } = await supabase.storage
  .from('telemetry-files')
  .upload(`${user.id}/${fileName}`, file);

// Real-time subscription
const subscription = supabase
  .channel('sessions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sessions'
  }, handleSessionUpdate)
  .subscribe();
```

### Authentication Flow

```javascript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'engineer@formula4team.com',
  password: 'secure_password'
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## Performance Optimizations

### Database Indexes

```sql
-- Optimize common queries
CREATE INDEX sessions_user_date_idx ON sessions(user_id, session_date DESC);
CREATE INDEX telemetry_session_time_idx ON telemetry_data(session_id, timestamp_ms);
CREATE INDEX telemetry_lap_idx ON telemetry_data(session_id, lap_number);
```

### Caching Strategy
- **Session data** cached in React state
- **Telemetry charts** memoized with useMemo
- **File uploads** with progress tracking
- **Real-time updates** debounced for performance

## Testing Guide

### Manual Testing Checklist

1. **Authentication**
   - [ ] Sign in with valid credentials
   - [ ] Sign out functionality
   - [ ] Session persistence on reload
   - [ ] Error handling for invalid credentials

2. **File Upload**
   - [ ] Drag and drop CSV files
   - [ ] File validation (format, size)
   - [ ] Upload progress indication
   - [ ] Success/error notifications

3. **Data Visualization**
   - [ ] Dashboard loads session data
   - [ ] Charts render correctly
   - [ ] Interactive elements work
   - [ ] Real-time updates function

4. **Session Management**
   - [ ] Create new sessions
   - [ ] Edit session metadata
   - [ ] Delete sessions
   - [ ] Archive/restore functionality

5. **Real-time Features**
   - [ ] Online user count updates
   - [ ] Live data synchronization
   - [ ] WebSocket connection stability

## Deployment Configuration

### Environment Setup

```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_ENV=production
```

### Build Process

```bash
# Install dependencies
pnpm install

# Run lint check
pnpm run lint

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase URL and keys
   - Verify RLS policies
   - Ensure email confirmation (if enabled)

2. **Upload Failures**
   - Check storage bucket policies
   - Verify file size limits
   - Ensure proper CORS configuration

3. **Real-time Issues**
   - Check WebSocket connection
   - Verify subscription filters
   - Monitor rate limits

### Debug Tools

```javascript
// Enable debug logging
supabase.auth.debug = true;

// Monitor real-time connections
console.log('Supabase status:', supabase.realtime.getChannels());

// Check authentication state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

## Future Enhancements

### Planned Features
- **Advanced Analytics** - Machine learning insights
- **Team Collaboration** - Shared workspaces
- **Mobile App** - React Native companion
- **API Integrations** - Third-party telemetry systems
- **Export Options** - PDF reports, data export

### Performance Improvements
- **Edge Function Processing** - Server-side telemetry analysis
- **CDN Integration** - Faster file delivery
- **Caching Layer** - Redis for frequently accessed data
- **Background Jobs** - Async processing for large files

---

## Support

For technical support or questions about the Supabase integration:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the project README.md
- Submit issues via the project repository

**Version**: 2.0.0  
**Last Updated**: June 2025  
**Compatibility**: Supabase v2.x, React 18.x