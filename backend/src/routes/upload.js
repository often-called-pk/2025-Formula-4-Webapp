const express = require('express')
const multer = require('multer')
const router = express.Router()
const uploadController = require('../controllers/uploadController')
const { validateFileUpload } = require('../middleware/validation')

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'), false)
    }
  }
})

// Upload single telemetry file
router.post('/telemetry', upload.single('file'), validateFileUpload, uploadController.uploadTelemetryFile)

// Upload multiple telemetry files
router.post('/telemetry/batch', upload.array('files', 5), validateFileUpload, uploadController.uploadTelemetryFiles)

// Get upload status
router.get('/status/:uploadId', uploadController.getUploadStatus)

// Get upload history
router.get('/history', uploadController.getUploadHistory)

// Delete uploaded file
router.delete('/:uploadId', uploadController.deleteUpload)

// Validate CSV file structure
router.post('/validate', upload.single('file'), uploadController.validateCsvFile)

// Get supported file formats
router.get('/formats', uploadController.getSupportedFormats)

module.exports = router
