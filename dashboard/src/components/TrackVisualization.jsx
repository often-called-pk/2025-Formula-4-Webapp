import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, RotateCcw, Play, Pause } from 'lucide-react';

const TrackVisualization = ({ sessions }) => {
  const [trackData, setTrackData] = useState([]);
  const [activeView, setActiveView] = useState('2d'); // 2d, 3d, elevation
  const [selectedLap, setSelectedLap] = useState(1);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewSettings, setViewSettings] = useState({
    zoom: 1,
    rotation: 0,
    showSpeedColors: true,
    showElevation: true,
    showBrakingZones: true
  });
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (sessions.length > 0) {
      processTrackData();
    }
  }, [sessions, selectedLap]);

  useEffect(() => {
    if (trackData.length > 0 && canvasRef.current) {
      drawTrack();
    }
  }, [trackData, viewSettings, animationProgress]);

  const processTrackData = () => {
    if (!sessions.length) return;

    const processedTracks = sessions.map(session => {
      const telemetryData = session.telemetryData || [];
      const lapData = telemetryData.filter(point => point.lap_number === selectedLap);
      
      // Process GPS coordinates and create track path
      const trackPoints = lapData.map((point, index) => ({
        lat: point.gps_latitude || 0,
        lng: point.gps_longitude || 0,
        altitude: point.gps_altitude || 0,
        speed: point.gps_speed || 0,
        distance: point.distance_on_gps_speed || index * 10,
        braking: (point.brake_press || 0) > 20,
        throttle: point.throttle_pos || 0,
        timestamp: point.timestamp || index * 0.1,
        driverName: session.metadata.driverName
      })).filter(point => point.lat !== 0 && point.lng !== 0);

      // Normalize coordinates for visualization
      if (trackPoints.length > 0) {
        const minLat = Math.min(...trackPoints.map(p => p.lat));
        const maxLat = Math.max(...trackPoints.map(p => p.lat));
        const minLng = Math.min(...trackPoints.map(p => p.lng));
        const maxLng = Math.max(...trackPoints.map(p => p.lng));
        
        trackPoints.forEach(point => {
          point.x = ((point.lng - minLng) / (maxLng - minLng)) * 800 + 50;
          point.y = ((maxLat - point.lat) / (maxLat - minLat)) * 600 + 50;
        });
      }

      return {
        driverName: session.metadata.driverName,
        points: trackPoints,
        color: session === sessions[0] ? '#3b82f6' : '#f59e0b',
        fastestLap: session.metadata.fastestLapTime
      };
    });

    setTrackData(processedTracks);
  };

  const drawTrack = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply zoom and rotation
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(viewSettings.zoom, viewSettings.zoom);
    ctx.rotate((viewSettings.rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    trackData.forEach((track, trackIndex) => {
      const points = track.points;
      if (points.length < 2) return;

      // Draw track line
      ctx.beginPath();
      ctx.strokeStyle = track.color;
      ctx.lineWidth = 3;
      
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw speed colors if enabled
      if (viewSettings.showSpeedColors) {
        points.forEach((point, index) => {
          if (index % 5 === 0) { // Sample every 5th point for performance
            const speedRatio = point.speed / 250; // Normalize to max speed
            const hue = (1 - speedRatio) * 240; // Blue (240) to Red (0)
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }

      // Draw braking zones if enabled
      if (viewSettings.showBrakingZones) {
        points.forEach((point, index) => {
          if (point.braking) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }

      // Draw animated position
      if (isPlaying && animationProgress > 0) {
        const currentIndex = Math.floor((animationProgress / 100) * (points.length - 1));
        const currentPoint = points[currentIndex];
        if (currentPoint) {
          ctx.fillStyle = track.color;
          ctx.beginPath();
          ctx.arc(currentPoint.x, currentPoint.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw driver name
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(track.driverName, currentPoint.x + 10, currentPoint.y - 10);
        }
      }
    });

    ctx.restore();
  };

  const startAnimation = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    const startTime = Date.now();
    const duration = 10000; // 10 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      setAnimationProgress(progress);
      
      if (progress < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        setAnimationProgress(0);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    setAnimationProgress(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleZoomIn = () => {
    setViewSettings(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3) }));
  };

  const handleZoomOut = () => {
    setViewSettings(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.5) }));
  };

  const resetView = () => {
    setViewSettings(prev => ({ ...prev, zoom: 1, rotation: 0 }));
  };

  if (!sessions.length || !trackData.length) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-8 text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No GPS Data Available</h3>
          <p className="text-slate-400">Upload sessions with GPS coordinates to visualize track layout.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Navigation className="w-5 h-5" />
            <span>Track Visualization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-300">View:</label>
              <select
                value={activeView}
                onChange={(e) => setActiveView(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                <option value="2d">2D Track Map</option>
                <option value="3d">3D Visualization</option>
                <option value="elevation">Elevation Profile</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-300">Lap:</label>
              <select
                value={selectedLap}
                onChange={(e) => setSelectedLap(parseInt(e.target.value))}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                {[...Array(5)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Lap {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={isPlaying ? stopAnimation : startAnimation}
                className={`flex items-center space-x-2 px-4 py-2 rounded font-medium transition-colors ${
                  isPlaying 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Stop' : 'Animate'}</span>
              </button>
            </div>
          </div>

          {/* Track Display */}
          <div className="relative bg-black/20 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={900}
              height={700}
              className="w-full h-auto border border-white/10 rounded-lg"
            />
            
            {/* Animation Progress */}
            {isPlaying && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Animation Progress</span>
                    <span className="text-white text-sm">{animationProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${animationProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center space-x-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={viewSettings.showSpeedColors}
                onChange={(e) => setViewSettings(prev => ({
                  ...prev,
                  showSpeedColors: e.target.checked
                }))}
                className="rounded"
              />
              <span>Speed Colors</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={viewSettings.showBrakingZones}
                onChange={(e) => setViewSettings(prev => ({
                  ...prev,
                  showBrakingZones: e.target.checked
                }))}
                className="rounded"
              />
              <span>Braking Zones</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={viewSettings.showElevation}
                onChange={(e) => setViewSettings(prev => ({
                  ...prev,
                  showElevation: e.target.checked
                }))}
                className="rounded"
              />
              <span>Elevation Data</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Track Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trackData.map((track, index) => (
          <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{track.driverName}</h4>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Track Points:</span>
                  <span className="text-white">{track.points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Fastest Lap:</span>
                  <span className="text-green-400">{track.fastestLap?.toFixed(3)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Max Speed:</span>
                  <span className="text-blue-400">
                    {Math.max(...track.points.map(p => p.speed)).toFixed(1)} km/h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrackVisualization;