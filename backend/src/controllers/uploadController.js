const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

class UploadController {
  constructor () {
    this.dataServiceUrl = process.env.DATA_SERVICE_URL || 'http://localhost:8001'
    this.uploads = new Map() // In production, use a database
  }

  async uploadTelemetryFile (req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        })
      }

      const uploadId = uuidv4()
      const uploadRecord = {
        id: uploadId,
        filename: req.file.originalname,
        size: req.file.size,
        status: 'processing',
        uploadedAt: new Date().toISOString()
      }

      this.uploads.set(uploadId, uploadRecord)

      // Send file to data service for processing
      const formData = new FormData()
      formData.append('file', new Blob([req.file.buffer]), req.file.originalname)

      try {
        const response = await axios.post(`${this.dataServiceUrl}/telemetry/process`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000 // 5 minutes timeout
        })

        uploadRecord.status = 'completed'
        uploadRecord.processedData = response.data
        uploadRecord.completedAt = new Date().toISOString()

        res.json({
          success: true,
          data: {
            uploadId,
            filename: req.file.originalname,
            status: 'completed',
            processedData: response.data
          }
        })
      } catch (processingError) {
        uploadRecord.status = 'failed'
        uploadRecord.error = processingError.message
        uploadRecord.failedAt = new Date().toISOString()

        res.status(422).json({
          success: false,
          error: 'File processing failed',
          message: processingError.message,
          uploadId
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: error.message
      })
    }
  }

  async uploadTelemetryFiles (req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        })
      }

      const uploadId = uuidv4()
      const uploadRecord = {
        id: uploadId,
        files: req.files.map(file => ({
          filename: file.originalname,
          size: file.size
        })),
        status: 'processing',
        uploadedAt: new Date().toISOString()
      }

      this.uploads.set(uploadId, uploadRecord)

      const processedFiles = []
      const failedFiles = []

      for (const file of req.files) {
        try {
          const formData = new FormData()
          formData.append('file', new Blob([file.buffer]), file.originalname)

          const response = await axios.post(`${this.dataServiceUrl}/telemetry/process`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 300000
          })

          processedFiles.push({
            filename: file.originalname,
            status: 'completed',
            data: response.data
          })
        } catch (error) {
          failedFiles.push({
            filename: file.originalname,
            status: 'failed',
            error: error.message
          })
        }
      }

      uploadRecord.status = failedFiles.length === 0 ? 'completed' : 'partial'
      uploadRecord.processedFiles = processedFiles
      uploadRecord.failedFiles = failedFiles
      uploadRecord.completedAt = new Date().toISOString()

      res.json({
        success: true,
        data: {
          uploadId,
          status: uploadRecord.status,
          processedFiles,
          failedFiles,
          summary: {
            total: req.files.length,
            processed: processedFiles.length,
            failed: failedFiles.length
          }
        }
      })
    } catch (error) {
      console.error('Batch upload error:', error)
      res.status(500).json({
        success: false,
        error: 'Batch upload failed',
        message: error.message
      })
    }
  }

  async getUploadStatus (req, res) {
    try {
      const { uploadId } = req.params

      const upload = this.uploads.get(uploadId)

      if (!upload) {
        return res.status(404).json({
          success: false,
          error: 'Upload not found'
        })
      }

      res.json({
        success: true,
        data: upload
      })
    } catch (error) {
      console.error('Error fetching upload status:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upload status',
        message: error.message
      })
    }
  }

  async getUploadHistory (req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query

      const uploads = Array.from(this.uploads.values())
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))

      res.json({
        success: true,
        data: uploads,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: this.uploads.size
        }
      })
    } catch (error) {
      console.error('Error fetching upload history:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upload history',
        message: error.message
      })
    }
  }

  async deleteUpload (req, res) {
    try {
      const { uploadId } = req.params

      if (!this.uploads.has(uploadId)) {
        return res.status(404).json({
          success: false,
          error: 'Upload not found'
        })
      }

      this.uploads.delete(uploadId)

      res.json({
        success: true,
        message: 'Upload deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting upload:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete upload',
        message: error.message
      })
    }
  }

  async validateCsvFile (req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided for validation'
        })
      }

      const formData = new FormData()
      formData.append('file', new Blob([req.file.buffer]), req.file.originalname)

      const response = await axios.post(`${this.dataServiceUrl}/telemetry/validate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      res.json({
        success: true,
        data: response.data
      })
    } catch (error) {
      console.error('Validation error:', error)
      res.status(422).json({
        success: false,
        error: 'File validation failed',
        message: error.response?.data?.message || error.message
      })
    }
  }

  async getSupportedFormats (req, res) {
    try {
      res.json({
        success: true,
        data: {
          formats: [
            {
              format: 'CSV',
              extension: '.csv',
              description: 'AiM RaceStudio CSV export format',
              maxSize: '50MB',
              requirements: [
                'Must contain telemetry parameters as columns',
                'First row should contain column headers',
                'Time column is required',
                'GPS coordinates (Latitude, Longitude) recommended'
              ]
            }
          ],
          maxFileSize: '50MB',
          maxFiles: 5,
          supportedParameters: [
            'Time', 'Speed', 'RPM', 'Throttle', 'Brake',
            'Steering', 'Gear', 'Latitude', 'Longitude',
            'G-Force X', 'G-Force Y', 'G-Force Z',
            'Lap Time', 'Sector Time', 'Distance'
          ]
        }
      })
    } catch (error) {
      console.error('Error getting supported formats:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get supported formats',
        message: error.message
      })
    }
  }
}

module.exports = new UploadController()
