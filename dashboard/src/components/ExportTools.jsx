import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download, FileText, Image, Table, PieChart, Calendar, Settings, Mail, Share2, Printer } from 'lucide-react';

const ExportTools = ({ sessions, selectedSessions = [], analysisData = null }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeTelemetryData: true,
    includeCharts: true,
    includeAnalysis: true,
    includeSessionInfo: true,
    includeDriverComparison: true,
    dateRange: 'all',
    customTitle: '',
    logoUrl: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  const exportFormats = [
    { id: 'pdf', label: 'PDF Report', icon: FileText, description: 'Comprehensive analysis report' },
    { id: 'csv', label: 'CSV Data', icon: Table, description: 'Raw telemetry data export' },
    { id: 'json', label: 'JSON Export', icon: FileText, description: 'Structured data format' },
    { id: 'images', label: 'Chart Images', icon: Image, description: 'Individual chart exports' }
  ];

  useEffect(() => {
    // Load export history from localStorage
    const history = localStorage.getItem('f4_export_history');
    if (history) {
      setExportHistory(JSON.parse(history));
    }
  }, []);

  const saveExportHistory = (newExport) => {
    const updatedHistory = [newExport, ...exportHistory.slice(0, 9)]; // Keep last 10 exports
    setExportHistory(updatedHistory);
    localStorage.setItem('f4_export_history', JSON.stringify(updatedHistory));
  };

  const generatePDFReport = async () => {
    const reportData = {
      title: exportOptions.customTitle || 'Formula 4 Race Analysis Report',
      generatedAt: new Date().toISOString(),
      sessions: selectedSessions.length > 0 ? 
        sessions.filter(s => selectedSessions.includes(s.id)) : 
        sessions,
      options: exportOptions
    };

    // Create comprehensive PDF content
    const pdfContent = {
      metadata: {
        title: reportData.title,
        author: 'F4 Analytics System',
        subject: 'Telemetry Analysis Report',
        keywords: 'Formula 4, Telemetry, Racing, Analysis'
      },
      sections: []
    };

    // Executive Summary
    if (reportData.sessions.length > 0) {
      const summary = generateExecutiveSummary(reportData.sessions);
      pdfContent.sections.push({
        title: 'Executive Summary',
        content: summary
      });
    }

    // Session Information
    if (exportOptions.includeSessionInfo) {
      pdfContent.sections.push({
        title: 'Session Information',
        content: generateSessionInfo(reportData.sessions)
      });
    }

    // Performance Analysis
    if (exportOptions.includeAnalysis && analysisData) {
      pdfContent.sections.push({
        title: 'Performance Analysis',
        content: generatePerformanceAnalysis(analysisData)
      });
    }

    // Driver Comparison
    if (exportOptions.includeDriverComparison && reportData.sessions.length > 1) {
      pdfContent.sections.push({
        title: 'Driver Comparison',
        content: generateDriverComparison(reportData.sessions)
      });
    }

    // Telemetry Data Tables
    if (exportOptions.includeTelemetryData) {
      pdfContent.sections.push({
        title: 'Telemetry Data Summary',
        content: generateTelemetryTables(reportData.sessions)
      });
    }

    return pdfContent;
  };

  const generateCSVExport = () => {
    const selectedSessionData = selectedSessions.length > 0 ? 
      sessions.filter(s => selectedSessions.includes(s.id)) : 
      sessions;

    if (selectedSessionData.length === 0) return '';

    // Combine all telemetry data
    const allData = [];
    selectedSessionData.forEach(session => {
      if (session.telemetryData && session.telemetryData.length > 0) {
        session.telemetryData.forEach(point => {
          allData.push({
            session_id: session.id,
            driver_name: session.metadata.driverName,
            session_type: session.metadata.sessionType,
            timestamp: point.timestamp || 0,
            gps_speed: point.gps_speed || 0,
            engine_rpm: point.engine_rpm || 0,
            throttle_pos: point.throttle_pos || 0,
            brake_press: point.brake_press || 0,
            steering_pos: point.steering_pos || 0,
            lateral_acc: point.lateral_acc || 0,
            inline_acc: point.inline_acc || 0,
            gear: point.gear || 0,
            lap_number: point.lap_number || 1,
            distance: point.distance_on_gps_speed || 0
          });
        });
      }
    });

    // Convert to CSV
    if (allData.length === 0) return '';

    const headers = Object.keys(allData[0]);
    const csvContent = [
      headers.join(','),
      ...allData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    return csvContent;
  };

  const generateJSONExport = () => {
    const selectedSessionData = selectedSessions.length > 0 ? 
      sessions.filter(s => selectedSessions.includes(s.id)) : 
      sessions;

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      exportOptions,
      sessions: selectedSessionData.map(session => ({
        id: session.id,
        metadata: session.metadata,
        fileName: session.fileName,
        fileSize: session.fileSize,
        uploadedAt: session.uploadedAt,
        processed: session.processed,
        telemetryData: exportOptions.includeTelemetryData ? session.telemetryData : null,
        analysis: exportOptions.includeAnalysis ? analysisData?.[session.metadata.driverName] : null
      }))
    }, null, 2);
  };

  const generateExecutiveSummary = (sessionData) => {
    const driverCount = new Set(sessionData.map(s => s.metadata.driverName)).size;
    const totalLaps = sessionData.reduce((sum, s) => sum + (s.metadata.totalLaps || 0), 0);
    const avgLapTime = sessionData
      .filter(s => s.metadata.fastestLapTime)
      .reduce((sum, s, _, arr) => sum + s.metadata.fastestLapTime / arr.length, 0);

    return `
Analysis Summary:
• ${sessionData.length} telemetry sessions analyzed
• ${driverCount} drivers compared
• ${totalLaps} total laps recorded
• Average fastest lap: ${avgLapTime.toFixed(3)}s
• Data processed: ${new Date().toLocaleDateString()}

Key Performance Indicators:
• Maximum speed achieved across all sessions
• Best lap times per driver
• Consistency ratings and improvement areas
• Technical performance metrics
    `.trim();
  };

  const generateSessionInfo = (sessionData) => {
    return sessionData.map(session => `
Driver: ${session.metadata.driverName}
Session Type: ${session.metadata.sessionType}
Track: ${session.metadata.trackName || 'Unknown'}
Date: ${new Date(session.uploadedAt).toLocaleDateString()}
Total Laps: ${session.metadata.totalLaps || 0}
Fastest Lap: ${session.metadata.fastestLapTime?.toFixed(3) || 'N/A'}s
Data Points: ${session.telemetryData?.length || 0}
File Size: ${formatFileSize(session.fileSize)}
    `).join('\n---\n');
  };

  const generatePerformanceAnalysis = (analysis) => {
    let content = 'Performance Analysis Results:\n\n';
    
    Object.entries(analysis).forEach(([driver, data]) => {
      content += `Driver: ${driver}\n`;
      if (data.lambda) {
        content += `• Lambda Analysis: Avg ${data.lambda.averageLambda?.toFixed(3)} (Efficiency: ${data.lambda.fuelEfficiencyScore?.toFixed(0)}/100)\n`;
      }
      if (data.gforce) {
        content += `• G-Force Performance: ${data.gforce.maxLateralG?.toFixed(2)}g lateral, ${data.gforce.drivingStyle} style\n`;
      }
      if (data.braking) {
        content += `• Braking Performance: ${data.braking.maxBrakePressure?.toFixed(1)} bar max, ${data.braking.trailBrakingScore?.toFixed(0)}% trail braking\n`;
      }
      content += '\n';
    });

    return content;
  };

  const generateDriverComparison = (sessionData) => {
    if (sessionData.length < 2) return 'Insufficient data for driver comparison.';

    const drivers = sessionData.map(s => ({
      name: s.metadata.driverName,
      fastestLap: s.metadata.fastestLapTime || 999,
      totalLaps: s.metadata.totalLaps || 0
    }));

    drivers.sort((a, b) => a.fastestLap - b.fastestLap);

    let content = 'Driver Performance Comparison:\n\n';
    drivers.forEach((driver, index) => {
      const position = index + 1;
      const lapDiff = driver.fastestLap - drivers[0].fastestLap;
      content += `${position}. ${driver.name}\n`;
      content += `   Fastest Lap: ${driver.fastestLap.toFixed(3)}s`;
      if (lapDiff > 0) content += ` (+${lapDiff.toFixed(3)}s)`;
      content += `\n   Total Laps: ${driver.totalLaps}\n\n`;
    });

    return content;
  };

  const generateTelemetryTables = (sessionData) => {
    let content = 'Telemetry Data Summary:\n\n';
    
    sessionData.forEach(session => {
      if (session.telemetryData && session.telemetryData.length > 0) {
        const data = session.telemetryData;
        const maxSpeed = Math.max(...data.map(p => p.gps_speed || 0));
        const maxRPM = Math.max(...data.map(p => p.engine_rpm || 0));
        const avgThrottle = data.reduce((sum, p) => sum + (p.throttle_pos || 0), 0) / data.length;

        content += `${session.metadata.driverName} - ${session.metadata.sessionType}:\n`;
        content += `• Max Speed: ${maxSpeed.toFixed(1)} km/h\n`;
        content += `• Max RPM: ${maxRPM.toFixed(0)} rpm\n`;
        content += `• Avg Throttle: ${avgThrottle.toFixed(1)}%\n`;
        content += `• Data Points: ${data.length}\n\n`;
      }
    });

    return content;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExport = async () => {
    if (selectedSessions.length === 0 && sessions.length === 0) {
      alert('No sessions available to export.');
      return;
    }

    setIsExporting(true);

    try {
      let exportContent;
      let fileName;
      let mimeType;

      switch (exportFormat) {
        case 'pdf':
          exportContent = await generatePDFReport();
          fileName = `F4_Analysis_Report_${new Date().toISOString().slice(0, 10)}.json`; // Simplified for demo
          mimeType = 'application/json';
          break;
        case 'csv':
          exportContent = generateCSVExport();
          fileName = `F4_Telemetry_Data_${new Date().toISOString().slice(0, 10)}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          exportContent = generateJSONExport();
          fileName = `F4_Session_Export_${new Date().toISOString().slice(0, 10)}.json`;
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Create and trigger download
      const blob = new Blob([typeof exportContent === 'string' ? exportContent : JSON.stringify(exportContent, null, 2)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save to export history
      saveExportHistory({
        id: Date.now(),
        fileName,
        format: exportFormat,
        sessionCount: selectedSessions.length || sessions.length,
        exportedAt: new Date().toISOString(),
        fileSize: blob.size
      });

      alert(`Export completed successfully! File: ${fileName}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Export Tools</h1>
        <p className="text-slate-300 mt-1">Generate comprehensive reports and export telemetry data</p>
      </div>

      {/* Export Format Selection */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Export Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exportFormats.map(format => {
              const IconComponent = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() => setExportFormat(format.id)}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                    exportFormat === format.id
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <IconComponent className="w-8 h-8 mb-3" />
                  <h3 className="font-semibold mb-1">{format.label}</h3>
                  <p className="text-sm opacity-75">{format.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Export Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Options */}
            <div>
              <h4 className="font-semibold text-white mb-3">Include in Export</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSessionInfo}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeSessionInfo: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300">Session Information</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeTelemetryData}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeTelemetryData: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300">Telemetry Data</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeCharts: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300">Charts & Visualizations</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeAnalysis}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeAnalysis: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300">Advanced Analysis</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeDriverComparison}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeDriverComparison: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300">Driver Comparison</span>
                </label>
              </div>
            </div>

            {/* Customization Options */}
            <div>
              <h4 className="font-semibold text-white mb-3">Customization</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Custom Report Title
                  </label>
                  <input
                    type="text"
                    value={exportOptions.customTitle}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      customTitle: e.target.value
                    }))}
                    placeholder="Formula 4 Race Analysis Report"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Date Range
                  </label>
                  <select
                    value={exportOptions.dateRange}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Sessions</option>
                    <option value="today">Today Only</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Selection Summary */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                Export Summary: {selectedSessions.length > 0 ? selectedSessions.length : sessions.length} session(s) selected
              </p>
              <p className="text-slate-400 text-sm">
                Format: {exportFormats.find(f => f.id === exportFormat)?.label}
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || sessions.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <span>{isExporting ? 'Exporting...' : 'Export Now'}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Recent Exports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportHistory.slice(0, 5).map(export_ => (
                <div
                  key={export_.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-white font-medium">{export_.fileName}</p>
                      <p className="text-slate-400 text-sm">
                        {export_.sessionCount} sessions • {formatFileSize(export_.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">
                      {new Date(export_.exportedAt).toLocaleDateString()}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {export_.format.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-white">Quick Actions</h4>
              <p className="text-slate-300 text-sm">Additional export and sharing options</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <Mail className="w-4 h-4" />
                <span>Email Report</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportTools;