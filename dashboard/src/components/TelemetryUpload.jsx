import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, X, Info } from 'lucide-react';

const TelemetryUpload = ({ onSessionUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseResults, setParseResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          
          // AiM RaceStudio format validation
          if (lines.length < 17) {
            reject(new Error('Invalid AiM RaceStudio format: File too short'));
            return;
          }

          // Extract metadata from header (rows 1-16)
          const metadata = {
            driverName: lines[1]?.split(',')[1] || 'Unknown Driver',
            sessionType: lines[2]?.split(',')[1] || 'Unknown Session',
            vehicle: lines[3]?.split(',')[1] || 'Formula 4',
            championship: lines[4]?.split(',')[1] || 'Formula 4',
            trackName: lines[5]?.split(',')[1] || 'Unknown Track',
            sessionDate: new Date(lines[6]?.split(',')[1] || Date.now()),
            sessionTime: lines[7]?.split(',')[1] || '00:00:00',
            totalLaps: parseInt(lines[8]?.split(',')[1]) || 0,
            fastestLapTime: parseFloat(lines[9]?.split(',')[1]) || 0,
            beaconMarkers: lines[10]?.split(',').slice(1).map(Number) || [],
            segmentTimes: lines[11]?.split(',').slice(1) || [],
            parameterCount: 39,
            dataStartRow: 17
          };

          // Extract parameter names (row 14, 0-indexed = row 13)
          const parameterNames = lines[13]?.split(',') || [];
          if (parameterNames.length < 39) {
            reject(new Error(`Invalid parameter count: Expected 39, got ${parameterNames.length}`));
            return;
          }

          // Parse telemetry data (starting from row 17, 0-indexed = row 16)
          const telemetryData = [];
          let currentLap = 1;
          let lastDistance = 0;

          for (let i = 16; i < lines.length && i < 1016; i++) { // Limit to 1000 data points for demo
            const values = lines[i]?.split(',');
            if (!values || values.length < 39) continue;

            const dataPoint = {
              timestamp: parseFloat(values[0]) || 0,
              gps_speed: parseFloat(values[1]) || 0,
              gps_nsat: parseInt(values[2]) || 0,
              gps_lat_acc: parseFloat(values[3]) || 0,
              gps_lon_acc: parseFloat(values[4]) || 0,
              gps_slope: parseFloat(values[5]) || 0,
              gps_heading: parseFloat(values[6]) || 0,
              gps_gyro: parseFloat(values[7]) || 0,
              gps_altitude: parseFloat(values[8]) || 0,
              gps_pos_accuracy: parseFloat(values[9]) || 0,
              gps_spd_accuracy: parseFloat(values[10]) || 0,
              gps_radius: parseFloat(values[11]) || 0,
              gps_latitude: parseFloat(values[12]) || 0,
              gps_longitude: parseFloat(values[13]) || 0,
              logger_temp: parseFloat(values[14]) || 0,
              water_temp: parseFloat(values[15]) || 0,
              head_temp: parseFloat(values[16]) || 0,
              exhaust_temp: parseFloat(values[17]) || 0,
              oil_temp: parseFloat(values[18]) || 0,
              engine_rpm: parseInt(values[19]) || 0,
              vehicle_speed: parseFloat(values[20]) || 0,
              gear: parseInt(values[21]) || 0,
              throttle_pos: parseFloat(values[22]) || 0,
              lambda_value: parseFloat(values[23]) || 0,
              oil_press: parseFloat(values[24]) || 0,
              brake_press: parseFloat(values[25]) || 0,
              brake_pos: parseFloat(values[26]) || 0,
              clutch_pos: parseFloat(values[27]) || 0,
              steering_pos: parseFloat(values[28]) || 0,
              lateral_acc: parseFloat(values[29]) || 0,
              inline_acc: parseFloat(values[30]) || 0,
              vertical_acc: parseFloat(values[31]) || 0,
              battery: parseFloat(values[32]) || 0,
              battery_voltage: parseFloat(values[33]) || 0,
              fuel_level: parseFloat(values[34]) || 0,
              distance_on_gps_speed: parseFloat(values[35]) || lastDistance,
              distance_on_vehicle_speed: parseFloat(values[36]) || lastDistance,
              predictive_time: parseFloat(values[37]) || 0,
              predictive_time_alt: parseFloat(values[38]) || 0,
              lap_number: currentLap
            };

            // Simple lap detection based on distance reset
            if (dataPoint.distance_on_gps_speed < lastDistance && lastDistance > 1000) {
              currentLap++;
            }
            lastDistance = dataPoint.distance_on_gps_speed;

            telemetryData.push(dataPoint);
          }

          resolve({
            metadata,
            telemetryData,
            parameterNames,
            totalDataPoints: telemetryData.length
          });

        } catch (error) {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  };

  const handleFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please upload a CSV file');
      setUploadStatus('error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setErrorMessage('File size too large. Maximum 50MB allowed.');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Parse the CSV file
      setUploadStatus('processing');
      const results = await parseCSVFile(file);
      
      clearInterval(uploadInterval);
      setUploadProgress(100);
      setParseResults(results);

      // Create session object
      const newSession = {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize: file.size,
        format: 'AiM_RaceStudio',
        uploadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        processed: true,
        status: 'processed',
        metadata: results.metadata,
        telemetryData: results.telemetryData,
        parameterNames: results.parameterNames,
        totalDataPoints: results.totalDataPoints
      };

      // Add to sessions
      onSessionUpload(newSession);
      setUploadStatus('success');

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error.message);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setParseResults(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const StatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
      case 'processing':
        return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Upload className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Upload Telemetry Data</h1>
        <p className="text-slate-300 mt-1">Upload AiM RaceStudio CSV files for professional Formula 4 analysis</p>
      </div>

      {/* Upload Area */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-8">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : uploadStatus === 'error'
                ? 'border-red-500 bg-red-500/10'
                : uploadStatus === 'success'
                ? 'border-green-500 bg-green-500/10'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            />

            <div className="flex flex-col items-center space-y-4">
              <StatusIcon />
              
              {uploadStatus === 'idle' && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Drop your CSV file here</h3>
                    <p className="text-slate-400 mt-1">or click to browse</p>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
                    Choose File
                  </button>
                </>
              )}

              {uploadStatus === 'uploading' && (
                <div className="w-full max-w-md">
                  <p className="text-white font-medium mb-2">Uploading file...</p>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{uploadProgress}% complete</p>
                </div>
              )}

              {uploadStatus === 'processing' && (
                <div>
                  <p className="text-white font-medium">Processing telemetry data...</p>
                  <p className="text-slate-400 text-sm">Parsing 39-parameter format</p>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="text-center">
                  <p className="text-green-400 font-medium">Upload successful!</p>
                  <p className="text-slate-400 text-sm">Telemetry data processed and ready for analysis</p>
                  <button
                    onClick={resetUpload}
                    className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
                  >
                    Upload Another File
                  </button>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="text-center">
                  <p className="text-red-400 font-medium">Upload failed</p>
                  <p className="text-slate-400 text-sm">{errorMessage}</p>
                  <button
                    onClick={resetUpload}
                    className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Requirements */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>File Requirements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Supported Formats</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• AiM RaceStudio CSV export format</li>
                <li>• 39-parameter telemetry structure</li>
                <li>• Header metadata in rows 1-16</li>
                <li>• Data starting from row 17</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">File Specifications</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Maximum file size: 50MB</li>
                <li>• CSV format (.csv extension)</li>
                <li>• UTF-8 encoding recommended</li>
                <li>• Comma-separated values</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parse Results */}
      {parseResults && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Processing Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Session Info</h4>
                <p className="text-slate-300">Driver: {parseResults.metadata.driverName}</p>
                <p className="text-slate-300">Session: {parseResults.metadata.sessionType}</p>
                <p className="text-slate-300">Vehicle: {parseResults.metadata.vehicle}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Performance</h4>
                <p className="text-slate-300">Total Laps: {parseResults.metadata.totalLaps}</p>
                <p className="text-slate-300">Best Lap: {parseResults.metadata.fastestLapTime.toFixed(3)}s</p>
                <p className="text-slate-300">Track: {parseResults.metadata.trackName}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Data Quality</h4>
                <p className="text-slate-300">Parameters: {parseResults.parameterNames.length}</p>
                <p className="text-slate-300">Data Points: {parseResults.totalDataPoints}</p>
                <p className="text-slate-300">Status: ✅ Ready for Analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TelemetryUpload;