import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, Gauge, Zap, Activity, Settings, Eye, EyeOff } from 'lucide-react';

const TelemetryCharts = ({ sessions, selectedParameters = ['gps_speed', 'engine_rpm', 'throttle_pos', 'brake_press'] }) => {
  const [chartData, setChartData] = useState([]);
  const [activeParameters, setActiveParameters] = useState(selectedParameters);
  const [syncCursor, setSyncCursor] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [chartType, setChartType] = useState('line'); // line, area, bar
  const [zoomDomain, setZoomDomain] = useState({ left: 0, right: 100 });

  const chartRefs = useRef([]);

  const parameterConfig = {
    gps_speed: { label: 'GPS Speed', unit: 'km/h', color: '#3b82f6', scale: [0, 300] },
    vehicle_speed: { label: 'Vehicle Speed', unit: 'km/h', color: '#06b6d4', scale: [0, 300] },
    engine_rpm: { label: 'Engine RPM', unit: 'rpm', color: '#dc2626', scale: [0, 15000] },
    throttle_pos: { label: 'Throttle Position', unit: '%', color: '#16a34a', scale: [0, 100] },
    brake_press: { label: 'Brake Pressure', unit: 'bar', color: '#ea580c', scale: [0, 100] },
    brake_pos: { label: 'Brake Position', unit: '%', color: '#f59e0b', scale: [0, 100] },
    steering_pos: { label: 'Steering Position', unit: '°', color: '#8b5cf6', scale: [-360, 360] },
    lateral_acc: { label: 'Lateral G-Force', unit: 'g', color: '#ec4899', scale: [-3, 3] },
    inline_acc: { label: 'Longitudinal G-Force', unit: 'g', color: '#06b6d4', scale: [-3, 3] },
    vertical_acc: { label: 'Vertical G-Force', unit: 'g', color: '#84cc16', scale: [-2, 2] },
    lambda_value: { label: 'Lambda (AFR)', unit: 'λ', color: '#f97316', scale: [0.8, 1.2] },
    oil_temp: { label: 'Oil Temperature', unit: '°C', color: '#dc2626', scale: [60, 120] },
    water_temp: { label: 'Water Temperature', unit: '°C', color: '#2563eb', scale: [70, 110] },
    exhaust_temp: { label: 'Exhaust Temperature', unit: '°C', color: '#dc2626', scale: [400, 800] },
    gear: { label: 'Gear', unit: '', color: '#6b7280', scale: [-1, 6] },
    fuel_level: { label: 'Fuel Level', unit: '%', color: '#059669', scale: [0, 100] }
  };

  useEffect(() => {
    if (sessions.length > 0) {
      processChartData();
    }
  }, [sessions, activeParameters]);

  const processChartData = () => {
    if (!sessions.length) return;

    // Combine data from all sessions
    const combinedData = [];
    const maxLength = Math.max(...sessions.map(s => s.telemetryData?.length || 0));

    for (let i = 0; i < Math.min(maxLength, 500); i += 2) { // Sample every 2nd point for performance
      const dataPoint = {
        index: i,
        distance: sessions[0]?.telemetryData?.[i]?.distance_on_gps_speed || i * 10,
        timestamp: sessions[0]?.telemetryData?.[i]?.timestamp || i * 0.1
      };

      // Add data for each session and parameter
      sessions.forEach((session, sessionIndex) => {
        const driverName = session.metadata.driverName.replace(' ', '_');
        activeParameters.forEach(param => {
          const value = session.telemetryData?.[i]?.[param] || 0;
          dataPoint[`${param}_${driverName}`] = value;
        });
      });

      combinedData.push(dataPoint);
    }

    setChartData(combinedData);
  };

  const handleCursorMove = (data) => {
    if (syncCursor && data?.activeLabel !== undefined) {
      setCursorPosition(data.activeLabel);
    }
  };

  const toggleParameter = (parameter) => {
    setActiveParameters(prev => 
      prev.includes(parameter) 
        ? prev.filter(p => p !== parameter)
        : [...prev, parameter]
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white">
          <p className="font-medium mb-2">Distance: {parseFloat(label).toFixed(1)}m</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)} {parameterConfig[entry.dataKey?.split('_')[0]]?.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = (parameter) => {
    const config = parameterConfig[parameter];
    if (!config) return null;

    const chartLines = sessions.map((session, index) => {
      const driverName = session.metadata.driverName.replace(' ', '_');
      const dataKey = `${parameter}_${driverName}`;
      
      if (chartType === 'line') {
        return (
          <Line
            key={dataKey}
            type="monotone"
            dataKey={dataKey}
            stroke={index === 0 ? config.color : '#f59e0b'}
            strokeWidth={2}
            dot={false}
            name={`${config.label} - ${session.metadata.driverName}`}
          />
        );
      } else if (chartType === 'area') {
        return (
          <Area
            key={dataKey}
            type="monotone"
            dataKey={dataKey}
            stackId={parameter}
            stroke={index === 0 ? config.color : '#f59e0b'}
            fill={index === 0 ? config.color : '#f59e0b'}
            fillOpacity={0.3}
            name={`${config.label} - ${session.metadata.driverName}`}
          />
        );
      }
    });

    const ChartComponent = chartType === 'area' ? AreaChart : chartType === 'bar' ? BarChart : LineChart;

    return (
      <Card key={parameter} className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <span>{config.label}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">{config.unit}</span>
              <button
                onClick={() => toggleParameter(parameter)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <EyeOff className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ChartComponent
              data={chartData}
              onMouseMove={handleCursorMove}
              syncId={syncCursor ? "telemetrySync" : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="distance" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => `${(value/1000).toFixed(1)}km`}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                domain={config.scale}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {chartLines}
            </ChartComponent>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderCombinedSpeedChart = () => {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Gauge className="w-5 h-5" />
            <span>Speed Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              onMouseMove={handleCursorMove}
              syncId={syncCursor ? "telemetrySync" : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="distance" 
                stroke="#9ca3af"
                tickFormatter={(value) => `${(value/1000).toFixed(1)}km`}
              />
              <YAxis 
                stroke="#9ca3af"
                domain={[0, 300]}
                label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {sessions.map((session, index) => {
                const driverName = session.metadata.driverName.replace(' ', '_');
                return (
                  <Line
                    key={`gps_speed_${driverName}`}
                    type="monotone"
                    dataKey={`gps_speed_${driverName}`}
                    stroke={index === 0 ? '#3b82f6' : '#f59e0b'}
                    strokeWidth={3}
                    dot={false}
                    name={`${session.metadata.driverName} Speed`}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderRPMChart = () => {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Engine RPM</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={chartData}
              onMouseMove={handleCursorMove}
              syncId={syncCursor ? "telemetrySync" : undefined}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="distance" 
                stroke="#9ca3af"
                tickFormatter={(value) => `${(value/1000).toFixed(1)}km`}
              />
              <YAxis 
                stroke="#9ca3af"
                domain={[0, 15000]}
                label={{ value: 'RPM', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {sessions.map((session, index) => {
                const driverName = session.metadata.driverName.replace(' ', '_');
                return (
                  <Area
                    key={`engine_rpm_${driverName}`}
                    type="monotone"
                    dataKey={`engine_rpm_${driverName}`}
                    stackId="1"
                    stroke={index === 0 ? '#dc2626' : '#f97316'}
                    fill={index === 0 ? '#dc2626' : '#f97316'}
                    fillOpacity={0.4}
                    name={`${session.metadata.driverName} RPM`}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  if (!sessions.length || !chartData.length) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-slate-400">Select sessions with processed telemetry data to view charts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Chart Type:</span>
              </div>
              <div className="flex space-x-2">
                {['line', 'area', 'bar'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                      chartType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSyncCursor(!syncCursor)}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                  syncCursor
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Sync Cursors</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameter Selection */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Active Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(parameterConfig).map(([param, config]) => (
              <button
                key={param}
                onClick={() => toggleParameter(param)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeParameters.includes(param)
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderCombinedSpeedChart()}
        {renderRPMChart()}
      </div>

      {/* Individual Parameter Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeParameters.filter(param => !['gps_speed', 'engine_rpm'].includes(param)).map(renderChart)}
      </div>

      {/* Performance Insights */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Quick Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, index) => {
              const maxSpeed = Math.max(...(session.telemetryData?.map(p => p.gps_speed || 0) || [0]));
              const maxRPM = Math.max(...(session.telemetryData?.map(p => p.engine_rpm || 0) || [0]));
              const avgThrottle = session.telemetryData?.reduce((sum, p) => sum + (p.throttle_pos || 0), 0) / (session.telemetryData?.length || 1);
              
              return (
                <div key={session.id} className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">{session.metadata.driverName}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-300">Max Speed: <span className="text-blue-400 font-medium">{maxSpeed.toFixed(1)} km/h</span></p>
                    <p className="text-slate-300">Max RPM: <span className="text-red-400 font-medium">{maxRPM.toFixed(0)} rpm</span></p>
                    <p className="text-slate-300">Avg Throttle: <span className="text-green-400 font-medium">{avgThrottle.toFixed(1)}%</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelemetryCharts;