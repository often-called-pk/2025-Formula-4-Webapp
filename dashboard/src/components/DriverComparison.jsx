import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, TrendingUp, Clock, Gauge, Target, AlertTriangle, Info, Download } from 'lucide-react';

const DriverComparison = ({ sessions, selectedSessions, onSessionSelect }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [analysisType, setAnalysisType] = useState('speed'); // speed, delta, sector, advanced
  const [selectedLaps, setSelectedLaps] = useState({ driver1: 1, driver2: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSessions.length === 2) {
      performComparison();
    }
  }, [selectedSessions, selectedLaps, analysisType]);

  const performComparison = async () => {
    if (selectedSessions.length !== 2) return;
    
    setLoading(true);
    try {
      const session1 = sessions.find(s => s.id === selectedSessions[0]);
      const session2 = sessions.find(s => s.id === selectedSessions[1]);

      if (!session1?.processed || !session2?.processed) {
        setLoading(false);
        return;
      }

      // Filter data for selected laps
      const driver1Data = session1.telemetryData.filter(point => point.lap_number === selectedLaps.driver1);
      const driver2Data = session2.telemetryData.filter(point => point.lap_number === selectedLaps.driver2);

      // Align data points by distance for comparison
      const alignedData = alignDataByDistance(driver1Data, driver2Data);
      
      // Calculate comparison metrics
      const speedComparison = calculateSpeedComparison(alignedData);
      const deltaAnalysis = calculateDeltaAnalysis(alignedData);
      const sectorAnalysis = calculateSectorAnalysis(alignedData);
      const performanceMetrics = calculatePerformanceMetrics(session1, session2, driver1Data, driver2Data);

      setComparisonData({
        driver1: {
          name: session1.metadata.driverName,
          session: session1.metadata.sessionType,
          lap: selectedLaps.driver1,
          data: driver1Data
        },
        driver2: {
          name: session2.metadata.driverName,
          session: session2.metadata.sessionType,
          lap: selectedLaps.driver2,
          data: driver2Data
        },
        aligned: alignedData,
        speedComparison,
        deltaAnalysis,
        sectorAnalysis,
        performanceMetrics
      });
    } catch (error) {
      console.error('Comparison analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const alignDataByDistance = (data1, data2) => {
    const aligned = [];
    let j = 0;

    for (let i = 0; i < data1.length && i < 500; i++) {
      const point1 = data1[i];
      const targetDistance = point1.distance_on_gps_speed || i * 10;

      // Find closest point in data2 by distance
      while (j < data2.length - 1 && 
             Math.abs((data2[j + 1].distance_on_gps_speed || (j + 1) * 10) - targetDistance) <
             Math.abs((data2[j].distance_on_gps_speed || j * 10) - targetDistance)) {
        j++;
      }

      if (j < data2.length) {
        aligned.push({
          distance: targetDistance,
          driver1: point1,
          driver2: data2[j]
        });
      }
    }

    return aligned;
  };

  const calculateSpeedComparison = (alignedData) => {
    return alignedData.map(point => ({
      distance: point.distance,
      driver1Speed: point.driver1.gps_speed || 0,
      driver2Speed: point.driver2.gps_speed || 0,
      speedDiff: (point.driver1.gps_speed || 0) - (point.driver2.gps_speed || 0),
      driver1RPM: point.driver1.engine_rpm || 0,
      driver2RPM: point.driver2.engine_rpm || 0
    }));
  };

  const calculateDeltaAnalysis = (alignedData) => {
    let cumulativeDelta = 0;
    return alignedData.map((point, index) => {
      const timeDiff = (point.driver1.timestamp || index * 0.1) - (point.driver2.timestamp || index * 0.1);
      cumulativeDelta += timeDiff;
      
      return {
        distance: point.distance,
        instantDelta: timeDiff,
        cumulativeDelta,
        driver1Time: point.driver1.timestamp || index * 0.1,
        driver2Time: point.driver2.timestamp || index * 0.1
      };
    });
  };

  const calculateSectorAnalysis = (alignedData) => {
    const sectorSize = Math.floor(alignedData.length / 3);
    const sectors = [];

    for (let i = 0; i < 3; i++) {
      const startIdx = i * sectorSize;
      const endIdx = i === 2 ? alignedData.length : (i + 1) * sectorSize;
      const sectorData = alignedData.slice(startIdx, endIdx);

      const driver1AvgSpeed = sectorData.reduce((sum, p) => sum + (p.driver1.gps_speed || 0), 0) / sectorData.length;
      const driver2AvgSpeed = sectorData.reduce((sum, p) => sum + (p.driver2.gps_speed || 0), 0) / sectorData.length;
      const timeDiff = (sectorData[sectorData.length - 1]?.driver1.timestamp || 0) - 
                      (sectorData[sectorData.length - 1]?.driver2.timestamp || 0) -
                      (sectorData[0]?.driver1.timestamp || 0) + 
                      (sectorData[0]?.driver2.timestamp || 0);

      sectors.push({
        sector: i + 1,
        driver1AvgSpeed,
        driver2AvgSpeed,
        speedDiff: driver1AvgSpeed - driver2AvgSpeed,
        timeDiff,
        winner: timeDiff < 0 ? 'driver1' : 'driver2'
      });
    }

    return sectors;
  };

  const calculatePerformanceMetrics = (session1, session2, data1, data2) => {
    const driver1MaxSpeed = Math.max(...data1.map(p => p.gps_speed || 0));
    const driver2MaxSpeed = Math.max(...data2.map(p => p.gps_speed || 0));
    const driver1MaxRPM = Math.max(...data1.map(p => p.engine_rpm || 0));
    const driver2MaxRPM = Math.max(...data2.map(p => p.engine_rpm || 0));
    const driver1MaxGForce = Math.max(...data1.map(p => Math.abs(p.lateral_acc || 0)));
    const driver2MaxGForce = Math.max(...data2.map(p => Math.abs(p.lateral_acc || 0)));

    return {
      lapTimeDiff: (session1.metadata.fastestLapTime || 0) - (session2.metadata.fastestLapTime || 0),
      maxSpeedDiff: driver1MaxSpeed - driver2MaxSpeed,
      maxRPMDiff: driver1MaxRPM - driver2MaxRPM,
      maxGForceDiff: driver1MaxGForce - driver2MaxGForce,
      driver1Stats: {
        maxSpeed: driver1MaxSpeed,
        maxRPM: driver1MaxRPM,
        maxGForce: driver1MaxGForce,
        avgThrottle: data1.reduce((sum, p) => sum + (p.throttle_pos || 0), 0) / data1.length
      },
      driver2Stats: {
        maxSpeed: driver2MaxSpeed,
        maxRPM: driver2MaxRPM,
        maxGForce: driver2MaxGForce,
        avgThrottle: data2.reduce((sum, p) => sum + (p.throttle_pos || 0), 0) / data2.length
      }
    };
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--.---';
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const secs = (Math.abs(seconds) % 60).toFixed(3);
    const sign = seconds < 0 ? '-' : '+';
    return `${sign}${minutes}:${secs.padStart(6, '0')}`;
  };

  const MetricCard = ({ title, driver1Value, driver2Value, unit, better = 'higher', icon: Icon }) => {
    const diff = driver1Value - driver2Value;
    const driver1Better = better === 'higher' ? diff > 0 : diff < 0;

    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">{title}</span>
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {comparisonData?.driver1.name}
              </span>
              <span className={`font-bold ${driver1Better ? 'text-green-400' : 'text-white'}`}>
                {driver1Value.toFixed(1)}{unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {comparisonData?.driver2.name}
              </span>
              <span className={`font-bold ${!driver1Better ? 'text-green-400' : 'text-white'}`}>
                {driver2Value.toFixed(1)}{unit}
              </span>
            </div>
            <div className="text-center pt-2 border-t border-white/10">
              <span className={`text-sm font-medium ${Math.abs(diff) < 0.1 ? 'text-slate-400' : driver1Better ? 'text-green-400' : 'text-red-400'}`}>
                Δ {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (selectedSessions.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Comparison</h1>
          <p className="text-slate-300 mt-1">Compare telemetry data between two drivers for performance analysis</p>
        </div>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Select Two Sessions</h3>
            <p className="text-slate-300 mb-6">
              Choose two telemetry sessions from the dashboard to begin driver comparison analysis.
            </p>
            <p className="text-slate-400 text-sm">
              Currently selected: {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {sessions.length > 0 && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Available Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedSessions.includes(session.id)
                        ? 'bg-red-500/20 border-red-500/50 border'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                    onClick={() => {
                      const newSelection = selectedSessions.includes(session.id)
                        ? selectedSessions.filter(id => id !== session.id)
                        : [...selectedSessions.slice(-1), session.id];
                      onSessionSelect(newSelection);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{session.metadata.driverName}</p>
                        <p className="text-sm text-slate-300">{session.metadata.sessionType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">
                          {session.metadata.fastestLapTime ? 
                            `${session.metadata.fastestLapTime.toFixed(3)}s` : 
                            'No time'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Comparison Analysis</h1>
          <p className="text-slate-300 mt-1">
            Comparing {comparisonData?.driver1.name} vs {comparisonData?.driver2.name}
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Lap Selection */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Lap Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {comparisonData?.driver1.name} - Lap Number
              </label>
              <select
                value={selectedLaps.driver1}
                onChange={(e) => setSelectedLaps(prev => ({ ...prev, driver1: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Lap {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {comparisonData?.driver2.name} - Lap Number
              </label>
              <select
                value={selectedLaps.driver2}
                onChange={(e) => setSelectedLaps(prev => ({ ...prev, driver2: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Lap {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Overview */}
      {comparisonData?.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Max Speed"
            driver1Value={comparisonData.performanceMetrics.driver1Stats.maxSpeed}
            driver2Value={comparisonData.performanceMetrics.driver2Stats.maxSpeed}
            unit=" km/h"
            better="higher"
            icon={Gauge}
          />
          <MetricCard
            title="Max RPM"
            driver1Value={comparisonData.performanceMetrics.driver1Stats.maxRPM}
            driver2Value={comparisonData.performanceMetrics.driver2Stats.maxRPM}
            unit=" rpm"
            better="higher"
            icon={TrendingUp}
          />
          <MetricCard
            title="Max G-Force"
            driver1Value={comparisonData.performanceMetrics.driver1Stats.maxGForce}
            driver2Value={comparisonData.performanceMetrics.driver2Stats.maxGForce}
            unit="g"
            better="higher"
            icon={Target}
          />
          <MetricCard
            title="Avg Throttle"
            driver1Value={comparisonData.performanceMetrics.driver1Stats.avgThrottle}
            driver2Value={comparisonData.performanceMetrics.driver2Stats.avgThrottle}
            unit="%"
            better="higher"
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* Analysis Type Selector */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'speed', label: 'Speed Analysis' },
              { id: 'delta', label: 'Time Delta' },
              { id: 'sector', label: 'Sector Analysis' },
              { id: 'advanced', label: 'Advanced Metrics' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setAnalysisType(type.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  analysisType === type.id
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Visualization */}
      {comparisonData && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              {analysisType === 'speed' && 'Speed Comparison'}
              {analysisType === 'delta' && 'Time Delta Analysis'}
              {analysisType === 'sector' && 'Sector Performance'}
              {analysisType === 'advanced' && 'Advanced Metrics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-slate-300 mt-2">Analyzing telemetry data...</p>
              </div>
            ) : (
              <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
                <p className="text-slate-400">
                  {analysisType === 'speed' && `Speed comparison chart for ${comparisonData.speedComparison.length} data points`}
                  {analysisType === 'delta' && `Delta analysis with cumulative time difference`}
                  {analysisType === 'sector' && `3-sector performance breakdown`}
                  {analysisType === 'advanced' && `Advanced telemetry metrics and correlations`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sector Analysis Table */}
      {analysisType === 'sector' && comparisonData?.sectorAnalysis && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Sector Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-2 text-slate-300">Sector</th>
                    <th className="pb-2 text-slate-300">{comparisonData.driver1.name}</th>
                    <th className="pb-2 text-slate-300">{comparisonData.driver2.name}</th>
                    <th className="pb-2 text-slate-300">Speed Diff</th>
                    <th className="pb-2 text-slate-300">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.sectorAnalysis.map((sector, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="py-2 text-white font-medium">Sector {sector.sector}</td>
                      <td className="py-2 text-slate-300">{sector.driver1AvgSpeed.toFixed(1)} km/h</td>
                      <td className="py-2 text-slate-300">{sector.driver2AvgSpeed.toFixed(1)} km/h</td>
                      <td className={`py-2 font-medium ${sector.speedDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sector.speedDiff > 0 ? '+' : ''}{sector.speedDiff.toFixed(1)} km/h
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sector.winner === 'driver1' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {sector.winner === 'driver1' ? comparisonData.driver1.name : comparisonData.driver2.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverComparison;