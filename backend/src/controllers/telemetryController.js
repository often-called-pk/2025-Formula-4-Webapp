const axios = require('axios')

class TelemetryController {
  constructor () {
    this.dataServiceUrl = process.env.DATA_SERVICE_URL || 'http://localhost:8001'
  }

  async getSessions (req, res) {
    try {
      const { driver, track, date, limit = 20, offset = 0 } = req.query

      const params = {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }

      if (driver) params.driver = driver
      if (track) params.track = track
      if (date) params.date = date

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/sessions`, { params })

      res.json({
        success: true,
        data: response.data,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: response.data.total || 0
        }
      })
    } catch (error) {
      console.error('Error fetching sessions:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch telemetry sessions',
        message: error.message
      })
    }
  }

  async getSessionData (req, res) {
    try {
      const { sessionId } = req.params
      const { parameters, startTime, endTime } = req.query

      const params = {}
      if (parameters) params.parameters = parameters
      if (startTime) params.start_time = startTime
      if (endTime) params.end_time = endTime

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/sessions/${sessionId}`, { params })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching session data:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session data',
        message: error.message
      })
    }
  }

  async getSessionAnalysis (req, res) {
    try {
      const { sessionId } = req.params

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/sessions/${sessionId}/analysis`)

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching session analysis:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session analysis',
        message: error.message
      })
    }
  }

  async compareSessions (req, res) {
    try {
      const { sessionIds, parameters } = req.body

      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 session IDs are required for comparison'
        })
      }

      const response = await axios.post(`${this.dataServiceUrl}/telemetry/compare`, {
        session_ids: sessionIds,
        parameters: parameters || []
      })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error comparing sessions:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to compare sessions',
        message: error.message
      })
    }
  }

  async getDriverPerformance (req, res) {
    try {
      const { driverId } = req.params
      const { startDate, endDate, trackId } = req.query

      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (trackId) params.track_id = trackId

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/drivers/${driverId}/performance`, { params })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching driver performance:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch driver performance',
        message: error.message
      })
    }
  }

  async getTrackAnalysis (req, res) {
    try {
      const { trackId } = req.params
      const { sessionType, weather } = req.query

      const params = {}
      if (sessionType) params.session_type = sessionType
      if (weather) params.weather = weather

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/tracks/${trackId}/analysis`, { params })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching track analysis:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch track analysis',
        message: error.message
      })
    }
  }

  async getLapAnalysis (req, res) {
    try {
      const { sessionId, lapNumber } = req.params

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/sessions/${sessionId}/laps/${lapNumber}`)

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching lap analysis:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lap analysis',
        message: error.message
      })
    }
  }

  async getSectorAnalysis (req, res) {
    try {
      const { sessionId } = req.params

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/sessions/${sessionId}/sectors`)

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching sector analysis:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sector analysis',
        message: error.message
      })
    }
  }

  async getSpeedAnalysis (req, res) {
    try {
      const { sessionId } = req.params
      const { sector } = req.query

      const params = {}
      if (sector) params.sector = sector

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/sessions/${sessionId}/speed`, { params })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching speed analysis:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch speed analysis',
        message: error.message
      })
    }
  }

  async getInsights (req, res) {
    try {
      const { type, driverId, trackId } = req.query

      const params = {}
      if (type) params.type = type
      if (driverId) params.driver_id = driverId
      if (trackId) params.track_id = trackId

      const response = await axios.get(`${this.dataServiceUrl}/telemetry/insights`, { params })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Error fetching insights:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch insights',
        message: error.message
      })
    }
  }
}

module.exports = new TelemetryController()
