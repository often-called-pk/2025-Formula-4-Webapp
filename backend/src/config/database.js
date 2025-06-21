const { Pool } = require('pg')

class DatabaseConfig {
  constructor () {
    this.pool = null
    this.isConnected = false
  }

  async connect () {
    try {
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'formula4_analytics',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // maximum number of clients in the pool
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
        connectionTimeoutMillis: 2000 // how long to try connecting before timing out
      }

      this.pool = new Pool(config)

      // Test the connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()

      this.isConnected = true
      console.log('✅ Database connected successfully')

      return this.pool
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      this.isConnected = false
      throw error
    }
  }

  async disconnect () {
    try {
      if (this.pool) {
        await this.pool.end()
        this.isConnected = false
        console.log('📤 Database disconnected')
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error)
      throw error
    }
  }

  getPool () {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.pool
  }

  async query (text, params) {
    const client = await this.getPool().connect()
    try {
      const result = await client.query(text, params)
      return result
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    } finally {
      client.release()
    }
  }

  async transaction (callback) {
    const client = await this.getPool().connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Transaction error:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // Health check method
  async healthCheck () {
    try {
      const result = await this.query('SELECT 1 as status, NOW() as timestamp')
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp,
        connected: this.isConnected
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      }
    }
  }

  // Get connection stats
  async getStats () {
    if (!this.pool) {
      return { error: 'Pool not initialized' }
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    }
  }

  // Initialize database tables (for development)
  async initializeTables () {
    const createTablesSQL = `
      -- Create extension for UUID generation
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Drivers table
      CREATE TABLE IF NOT EXISTS drivers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        team VARCHAR(255),
        number INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tracks table
      CREATE TABLE IF NOT EXISTS tracks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        length_meters DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        driver_id UUID REFERENCES drivers(id),
        track_id UUID REFERENCES tracks(id),
        session_type VARCHAR(50),
        date DATE,
        weather VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Telemetry data table (using TimescaleDB hypertable for time-series data)
      CREATE TABLE IF NOT EXISTS telemetry_data (
        time TIMESTAMP WITH TIME ZONE NOT NULL,
        session_id UUID REFERENCES sessions(id),
        speed DECIMAL(6,2),
        rpm INTEGER,
        throttle DECIMAL(5,2),
        brake DECIMAL(5,2),
        steering DECIMAL(6,2),
        gear INTEGER,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        g_force_x DECIMAL(5,3),
        g_force_y DECIMAL(5,3),
        g_force_z DECIMAL(5,3),
        lap_time DECIMAL(8,3),
        sector_time DECIMAL(8,3),
        distance DECIMAL(8,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_telemetry_session_time ON telemetry_data (session_id, time);
      CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry_data (time DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_driver ON sessions (driver_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions (track_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (date);
    `

    try {
      await this.query(createTablesSQL)
      console.log('✅ Database tables initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize database tables:', error)
      throw error
    }
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig()

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await databaseConfig.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await databaseConfig.disconnect()
  process.exit(0)
})

module.exports = databaseConfig
