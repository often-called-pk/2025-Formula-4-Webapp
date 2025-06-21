const Joi = require('joi')

// Validation schemas
const telemetryQuerySchema = Joi.object({
  parameters: Joi.string().optional(),
  startTime: Joi.string().isoDate().optional(),
  endTime: Joi.string().isoDate().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
})

const fileUploadSchema = Joi.object({
  filename: Joi.string().required(),
  mimetype: Joi.string().valid('text/csv', 'application/csv').required(),
  size: Joi.number().max(50 * 1024 * 1024).required() // 50MB max
})

const sessionCompareSchema = Joi.object({
  sessionIds: Joi.array().items(Joi.string().uuid()).min(2).max(10).required(),
  parameters: Joi.array().items(Joi.string()).optional()
})

// Middleware functions
const validateTelemetryQuery = (req, res, next) => {
  const { error, value } = telemetryQuerySchema.validate(req.query)

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }

  req.query = value
  next()
}

const validateFileUpload = (req, res, next) => {
  // Check if file exists
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    })
  }

  // Validate single file
  if (req.file) {
    const { error } = fileUploadSchema.validate({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
    }
  }

  // Validate multiple files
  if (req.files) {
    for (const file of req.files) {
      const { error } = fileUploadSchema.validate({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      })

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Invalid file: ${file.originalname}`,
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        })
      }
    }
  }

  next()
}

const validateSessionCompare = (req, res, next) => {
  const { error, value } = sessionCompareSchema.validate(req.body)

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid comparison request',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }

  req.body = value
  next()
}

const validatePagination = (req, res, next) => {
  const paginationSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(1000).default(20),
    offset: Joi.number().integer().min(0).default(0),
    sort: Joi.string().valid('created_at', 'updated_at', 'name').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })

  const { error, value } = paginationSchema.validate(req.query)

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid pagination parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }

  req.pagination = value
  next()
}

const validateDriverId = (req, res, next) => {
  const driverIdSchema = Joi.string().uuid().required()
  const { error } = driverIdSchema.validate(req.params.driverId)

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid driver ID format'
    })
  }

  next()
}

const validateSessionId = (req, res, next) => {
  const sessionIdSchema = Joi.string().uuid().required()
  const { error } = sessionIdSchema.validate(req.params.sessionId)

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid session ID format'
    })
  }

  next()
}

const validateTrackId = (req, res, next) => {
  const trackIdSchema = Joi.string().uuid().required()
  const { error } = trackIdSchema.validate(req.params.trackId)

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid track ID format'
    })
  }

  next()
}

const validateDateRange = (req, res, next) => {
  const dateRangeSchema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }).with('endDate', 'startDate')

  const { error, value } = dateRangeSchema.validate({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  })

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date range',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }

  req.dateRange = value
  next()
}

module.exports = {
  validateTelemetryQuery,
  validateFileUpload,
  validateSessionCompare,
  validatePagination,
  validateDriverId,
  validateSessionId,
  validateTrackId,
  validateDateRange
}
