const express = require('express')
const router = express.Router()
const telemetryController = require('../controllers/telemetryController')
const { validateTelemetryQuery } = require('../middleware/validation')

// Get telemetry sessions
router.get('/sessions', telemetryController.getSessions)

// Get specific session data
router.get('/sessions/:sessionId', validateTelemetryQuery, telemetryController.getSessionData)

// Get session analysis
router.get('/sessions/:sessionId/analysis', telemetryController.getSessionAnalysis)

// Compare sessions
router.post('/compare', telemetryController.compareSessions)

// Get driver performance data
router.get('/drivers/:driverId/performance', telemetryController.getDriverPerformance)

// Get track analysis
router.get('/tracks/:trackId/analysis', telemetryController.getTrackAnalysis)

// Get lap analysis
router.get('/sessions/:sessionId/laps/:lapNumber', telemetryController.getLapAnalysis)

// Get sector analysis
router.get('/sessions/:sessionId/sectors', telemetryController.getSectorAnalysis)

// Get speed analysis
router.get('/sessions/:sessionId/speed', telemetryController.getSpeedAnalysis)

// Get telemetry insights
router.get('/insights', telemetryController.getInsights)

module.exports = router
