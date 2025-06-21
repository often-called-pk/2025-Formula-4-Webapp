import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import TelemetryCharts from './TelemetryCharts';
import AdvancedAnalytics from './AdvancedAnalytics';
import TrackVisualization from './TrackVisualization';
import ExportTools from './ExportTools';
import { Clock, Gauge, Users, TrendingUp, Zap, Target, Activity, MapPin } from 'lucide-react';

const F4Dashboard = ({ sessions, selectedSessions, onSessionSelect }) => {
  const [dashboardStats, setDashboardStats] = useState({
    totalSessions: 0,
    bestLapTime: null,
    averageSpeed: 0,
    totalDistance: 0,
    activeDrivers: 0,
    lastSession: null
  });

  const [quickAnalysis, setQuickAnalysis] = useState({
    speedComparison: [],
    lapTimeProgression: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    calculateDashboardStats();
    if (selectedSessions.length >= 2) {
      performQuickAnalysis();
    }
  }, [sessions, selectedSessions]);

  const calculateDashboardStats = () => {
    if (!sessions.length) return;

    const totalSessions = sessions.length;
    const drivers = new Set(sessions.map(s => s.metadata.driverName));
    const activeDrivers = drivers.size;

    let bestLapTime = null;
    let totalDistance = 0;
    let totalSpeed = 0;
    let speedCount = 0;
    let lastSession = null;

    sessions.forEach(session => {
      if (session.metadata.fastestLapTime) {
        if (!bestLapTime || session.metadata.fastestLapTime < bestLapTime) {
          bestLapTime = session.metadata.fastestLapTime;
        }
      }

      if (session.processed && session.telemetryData) {
        session.telemetryData.forEach(point => {
          if (point.gps_speed > 0) {
            totalSpeed += point.gps_speed;
            speedCount++;
          }
          totalDistance += point.distance_on_gps_speed || 0;
        });
      }

      if (!lastSession || new Date(session.uploadedAt) > new Date(lastSession.uploadedAt)) {
        lastSession = session;
      }
    });

    setDashboardStats({
      totalSessions,
      bestLapTime,
      averageSpeed: speedCount > 0 ? totalSpeed / speedCount : 0,
      totalDistance: totalDistance / 1000, // Convert to km
      activeDrivers,
      lastSession
    });
  };

  const performQuickAnalysis = () => {
    if (selectedSessions.length < 2) return;

    const session1 = sessions.find(s => s.id === selectedSessions[0]);
    const session2 = sessions.find(s => s.id === selectedSessions[1]);

    if (!session1?.processed || !session2?.processed) return;

    // Quick speed comparison
    const speedComparison = session1.telemetryData.map((point, index) => ({
      distance: point.distance_on_gps_speed || index * 10,
      driver1Speed: point.gps_speed || 0,
      driver2Speed: session2.telemetryData[index]?.gps_speed || 0,
      speedDiff: (point.gps_speed || 0) - (session2.telemetryData[index]?.gps_speed || 0)
    })).filter(point => point.distance > 0).slice(0, 100);

    setQuickAnalysis({
      speedComparison,
      lapTimeProgression: [],
      performanceMetrics: {
        driver1: session1.metadata.driverName,
        driver2: session2.metadata.driverName,
        lapTimeDiff: session1.metadata.fastestLapTime - session2.metadata.fastestLapTime,
        avgSpeedDiff: speedComparison.reduce((sum, p) => sum + p.speedDiff, 0) / speedComparison.length
      }
    });
  };

  const formatLapTime = (seconds) => {
    if (!seconds) return '--:--:---';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  const StatCard = ({ title, value, unit, icon: Icon, trend, color = 'blue' }) => (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-bold text-white">{value}</span>
              {unit && <span className="text-slate-400 text-sm">{unit}</span>}
            </div>
            {trend && (
              <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}% vs last session
              </p>
            )}
          </div>
          <div className={`w-12 h-12 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Formula 4 Racing Dashboard</h1>
          <p className="text-slate-300 mt-1">Professional telemetry analysis and performance optimization</p>
        </div>
        <ExportTools sessions={sessions} selectedSessions={selectedSessions} />
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Sessions"
          value={dashboardStats.totalSessions}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Best Lap Time"
          value={formatLapTime(dashboardStats.bestLapTime)}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Average Speed"
          value={dashboardStats.averageSpeed.toFixed(1)}
          unit="km/h"
          icon={Gauge}
          color="orange"
        />
        <StatCard
          title="Total Distance"
          value={dashboardStats.totalDistance.toFixed(1)}
          unit="km"
          icon={MapPin}
          color="purple"
        />
        <StatCard
          title="Active Drivers"
          value={dashboardStats.activeDrivers}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Analysis Score"
          value="92.5"
          unit="/100"
          icon={Activity}
          trend={2.3}
          color="red"
        />
      </div>

      {/* Session Selection and Quick Analysis */}
      {sessions.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Session Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Selection */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Select Sessions for Comparison</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedSessions.includes(session.id)
                          ? 'bg-red-500/20 border-red-500/50 border'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                      onClick={() => {
                        const newSelection = selectedSessions.includes(session.id)
                          ? selectedSessions.filter(id => id !== session.id)
                          : [...selectedSessions.slice(-1), session.id]; // Keep max 2 sessions
                        onSessionSelect(newSelection);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{session.metadata.driverName}</p>
                          <p className="text-sm text-slate-300">
                            {session.metadata.sessionType} • {formatLapTime(session.metadata.fastestLapTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">
                            {new Date(session.uploadedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {session.processed ? 'Processed' : 'Processing...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Performance Comparison */}
              {selectedSessions.length >= 2 && quickAnalysis.performanceMetrics.driver1 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Performance Comparison</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Driver 1:</span>
                      <span className="text-white font-medium">{quickAnalysis.performanceMetrics.driver1}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Driver 2:</span>
                      <span className="text-white font-medium">{quickAnalysis.performanceMetrics.driver2}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Lap Time Difference:</span>
                      <span className={`font-medium ${
                        quickAnalysis.performanceMetrics.lapTimeDiff > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {quickAnalysis.performanceMetrics.lapTimeDiff > 0 ? '+' : ''}
                        {quickAnalysis.performanceMetrics.lapTimeDiff.toFixed(3)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Average Speed Difference:</span>
                      <span className={`font-medium ${
                        quickAnalysis.performanceMetrics.avgSpeedDiff > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {quickAnalysis.performanceMetrics.avgSpeedDiff > 0 ? '+' : ''}
                        {quickAnalysis.performanceMetrics.avgSpeedDiff.toFixed(1)} km/h
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Components */}
      {selectedSessions.length >= 2 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TelemetryCharts 
            sessions={sessions.filter(s => selectedSessions.includes(s.id))}
            selectedParameters={['gps_speed', 'engine_rpm', 'throttle_pos', 'brake_press']}
          />
          <TrackVisualization 
            sessions={sessions.filter(s => selectedSessions.includes(s.id))}
          />
        </div>
      )}

      {selectedSessions.length >= 1 && (
        <AdvancedAnalytics 
          sessions={sessions.filter(s => selectedSessions.includes(s.id))}
        />
      )}

      {/* Getting Started */}
      {sessions.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Welcome to Formula 4 Race Analytics</h3>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Upload your AiM RaceStudio telemetry files to begin professional analysis and driver comparison.
              Support for 39-parameter telemetry data with advanced racing metrics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onSessionSelect('upload')}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Upload First Session
              </button>
              <button className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-200">
                View Documentation
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default F4Dashboard;