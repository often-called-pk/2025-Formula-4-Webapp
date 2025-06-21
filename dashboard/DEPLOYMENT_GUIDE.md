# Formula 4 Race Analytics - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Supabase account and project

### 1. Environment Setup

Create a `.env` file in the dashboard directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: App Configuration
VITE_APP_NAME="Formula 4 Race Analytics"
VITE_APP_ENV=production
```

### 2. Supabase Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  team TEXT,
  role TEXT DEFAULT 'engineer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
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

-- Telemetry Data Table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for telemetry_data
CREATE POLICY "Users can view own telemetry data" ON telemetry_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = telemetry_data.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own telemetry data" ON telemetry_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = telemetry_data.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_created_at_idx ON sessions(created_at DESC);
CREATE INDEX telemetry_session_id_idx ON telemetry_data(session_id);
CREATE INDEX telemetry_timestamp_idx ON telemetry_data(timestamp_ms);
```

### 3. Storage Buckets Setup

In Supabase Dashboard > Storage, create these buckets:

1. **telemetry-files** (Private)
2. **track-maps** (Public)
3. **driver-photos** (Public)

Then add storage policies:

```sql
-- Telemetry files policies
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

CREATE POLICY "Users can delete own telemetry files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'telemetry-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for track maps and driver photos
CREATE POLICY "Public read access for track maps" ON storage.objects
  FOR SELECT USING (bucket_id = 'track-maps');

CREATE POLICY "Public read access for driver photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'driver-photos');
```

### 4. Authentication Setup

In Supabase Dashboard > Authentication:

1. **Enable Email & Password** authentication
2. **Disable email confirmations** for development (optional)
3. **Configure redirect URLs** for your domain
4. **Set up OAuth providers** if needed (Google, GitHub, etc.)

### 5. Development Setup

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies
pnpm install

# Run lint check
pnpm run lint

# Start development server
pnpm run dev
```

### 6. Production Deployment

#### Option A: Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Build for production
pnpm run build

# Preview production build locally
pnpm run preview
```

#### Option B: Netlify Deployment

1. Connect repository to Netlify
2. Set build command: `pnpm run build`
3. Set publish directory: `dist`
4. Add environment variables

#### Option C: Self-Hosted

```bash
# Build the application
pnpm run build

# Serve with a static file server
npx serve dist -p 3000
```

### 7. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Install serve for production
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t formula4-dashboard .
docker run -p 3000:3000 formula4-dashboard
```

## 🔧 Configuration Options

### Supabase Client Configuration

Customize in `src/config/supabase.js`:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Use PKCE flow for better security
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'Formula4-Race-Analytics'
    }
  }
});
```

### Performance Optimization

```javascript
// Enable service worker for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Preload critical resources
<link rel="preload" href="/api/sessions" as="fetch" crossorigin>
```

## 🔍 Monitoring & Analytics

### Supabase Analytics
- Monitor API usage in Supabase Dashboard
- Set up alerts for high usage or errors
- Track real-time connections

### Application Monitoring

```javascript
// Add error tracking
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  // Send to monitoring service
});

// Track user interactions
const trackEvent = (eventName, properties) => {
  // Send to analytics service
  console.log('Event:', eventName, properties);
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add your domain to Supabase allowed origins
   - Check authentication redirect URLs

2. **RLS Policy Issues**
   - Verify policies allow required operations
   - Check user authentication state

3. **Real-time Not Working**
   - Ensure WebSocket connections allowed
   - Check subscription filters

4. **Upload Failures**
   - Verify storage bucket policies
   - Check file size limits
   - Ensure proper file paths

### Debug Commands

```bash
# Check build issues
pnpm run build --verbose

# Analyze bundle size
pnpm run build && npx vite-bundle-analyzer dist

# Test production build locally
pnpm run build && pnpm run preview
```

## 📊 Performance Benchmarks

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB gzipped

### Optimization Checklist
- ✅ Code splitting implemented
- ✅ Images optimized and lazy loaded
- ✅ Unused dependencies removed
- ✅ Caching strategies in place
- ✅ Performance monitoring active

## 🔐 Security Checklist

- ✅ Environment variables secured
- ✅ RLS policies properly configured
- ✅ HTTPS enforced in production
- ✅ Content Security Policy configured
- ✅ XSS protection enabled
- ✅ Authentication flows secured

---

## 🚦 Deployment Status

**Development**: ✅ Ready  
**Staging**: ✅ Ready  
**Production**: ✅ Ready  

**Last Updated**: June 2025  
**Version**: 2.0.0