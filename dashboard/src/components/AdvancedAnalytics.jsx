import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Zap, Thermometer, Gauge, Target, TrendingUp, AlertTriangle, Activity, Flame } from 'lucide-react';

const AdvancedAnalytics = ({ sessions }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [activeAnalysis, setActiveAnalysis] = useState('lambda');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessions.length > 0) {
      performAdvancedAnalysis();
    }
  }, [sessions, activeAnalysis]);

  const performAdvancedAnalysis = async () => {
    setLoading(true);
    try {
      const analysis = {};
      
      sessions.forEach((session, index) => {
        const driverName = session.metadata.driverName;
        const telemetryData = session.telemetryData || [];
        
        analysis.lambda = analysis.lambda || {};
        analysis.lambda[driverName] = calculateLambdaAnalysis(telemetryData);
        
        analysis.gforce = analysis.gforce || {};
        analysis.gforce[driverName] = calculateGForceAnalysis(telemetryData);
        
        analysis.braking = analysis.braking || {};
        analysis.braking[driverName] = calculateBrakingAnalysis(telemetryData);
        
        analysis.thermal = analysis.thermal || {};
        analysis.thermal[driverName] = calculateThermalAnalysis(telemetryData);
      });
      
      setAnalysisData(analysis);
    } catch (error) {
      console.error('Advanced analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLambdaAnalysis = (data) => {
    const lambdaValues = data.map(point => point.lambda_value || 1.0).filter(v => v > 0.5 && v < 1.5);
    const averageLambda = lambdaValues.reduce((sum, val) => sum + val, 0) / lambdaValues.length;
    const lambdaConsistency = calculateConsistency(lambdaValues);
    const fuelEfficiencyScore = Math.max(0, Math.min(100, (averageLambda - 0.85) * 200));
    
    return {
      averageLambda,
      lambdaConsistency,
      fuelEfficiencyScore,
      recommendations: generateLambdaRecommendations(averageLambda, lambdaConsistency)
    };
  };

  const calculateGForceAnalysis = (data) => {
    const lateralG = data.map(point => Math.abs(point.lateral_acc || 0));
    const longitudinalG = data.map(point => Math.abs(point.inline_acc || 0));
    const verticalG = data.map(point => Math.abs(point.vertical_acc || 0));
    
    const maxLateralG = Math.max(...lateralG);
    const maxLongitudinalG = Math.max(...longitudinalG);
    const maxVerticalG = Math.max(...verticalG);
    
    const gForceEnvelope = [
      { axis: 'Max Lateral G', value: maxLateralG, fullMark: 3 },
      { axis: 'Max Longitudinal G', value: maxLongitudinalG, fullMark: 3 },
      { axis: 'Max Vertical G', value: maxVerticalG, fullMark: 2 },
      { axis: 'G-Force Consistency', value: calculateConsistency([...lateralG, ...longitudinalG]) * 10, fullMark: 10 },
      { axis: 'Cornering Performance', value: Math.min(10, maxLateralG * 3), fullMark: 10 }
    ];
    
    return {
      maxLateralG,
      maxLongitudinalG,
      maxVerticalG,
      gForceEnvelope,
      drivingStyle: classifyDrivingStyle(maxLateralG, maxLongitudinalG)
    };
  };

  const calculateBrakingAnalysis = (data) => {
    const brakingEvents = data.filter(point => (point.brake_press || 0) > 10);
    const maxBrakePressure = Math.max(...data.map(point => point.brake_press || 0));
    const avgBrakePressure = brakingEvents.length > 0 ? 
      brakingEvents.reduce((sum, p) => sum + (p.brake_press || 0), 0) / brakingEvents.length : 0;
    
    const trailBrakingEvents = data.filter(point => 
      (point.brake_press || 0) > 5 && Math.abs(point.steering_pos || 0) > 10
    );
    const trailBrakingScore = trailBrakingEvents.length / Math.max(1, brakingEvents.length) * 100;
    const brakingEfficiencyScore = Math.min(100, (maxBrakePressure / 100) * (trailBrakingScore / 20) * 50);
    
    return {
      maxBrakePressure,
      avgBrakePressure,
      brakingEfficiencyScore,
      trailBrakingScore,
      brakingEvents: brakingEvents.length,
      recommendations: generateBrakingRecommendations(trailBrakingScore, brakingEfficiencyScore)
    };
  };

  const calculateThermalAnalysis = (data) => {
    const oilTemps = data.map(point => point.oil_temp || 0).filter(t => t > 0);
    const waterTemps = data.map(point => point.water_temp || 0).filter(t => t > 0);
    const exhaustTemps = data.map(point => point.exhaust_temp || 0).filter(t => t > 0);
    
    const avgOilTemp = oilTemps.reduce((sum, t) => sum + t, 0) / oilTemps.length || 0;
    const avgWaterTemp = waterTemps.reduce((sum, t) => sum + t, 0) / waterTemps.length || 0;
    const avgExhaustTemp = exhaustTemps.reduce((sum, t) => sum + t, 0) / exhaustTemps.length || 0;
    
    const maxOilTemp = Math.max(...oilTemps);
    const maxWaterTemp = Math.max(...waterTemps);
    const maxExhaustTemp = Math.max(...exhaustTemps);
    
    const oilTempScore = Math.max(0, 100 - Math.abs(avgOilTemp - 95) * 2);
    const waterTempScore = Math.max(0, 100 - Math.abs(avgWaterTemp - 85) * 3);
    const thermalEfficiencyScore = (oilTempScore + waterTempScore) / 2;
    
    const tempDistribution = [
      { name: 'Oil Temp', avg: avgOilTemp, max: maxOilTemp, optimal: 95 },
      { name: 'Water Temp', avg: avgWaterTemp, max: maxWaterTemp, optimal: 85 },
      { name: 'Exhaust Temp', avg: avgExhaustTemp, max: maxExhaustTemp, optimal: 650 }
    ];
    
    return {
      avgOilTemp,
      avgWaterTemp,
      avgExhaustTemp,
      maxOilTemp,
      maxWaterTemp,
      maxExhaustTemp,
      thermalEfficiencyScore,
      tempDistribution,
      warnings: generateThermalWarnings(maxOilTemp, maxWaterTemp, maxExhaustTemp)
    };
  };

  const calculateConsistency = (values) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const classifyDrivingStyle = (maxLateralG, maxLongitudinalG) => {
    if (maxLateralG > 2.5 && maxLongitudinalG > 2.0) return 'Aggressive';
    if (maxLateralG > 2.0 && maxLongitudinalG > 1.5) return 'Sporty';
    if (maxLateralG > 1.5 && maxLongitudinalG > 1.0) return 'Moderate';
    return 'Smooth';
  };

  const generateLambdaRecommendations = (avgLambda, consistency) => {
    const recommendations = [];
    if (avgLambda < 0.9) recommendations.push('Consider leaning the mixture for better fuel economy');
    if (avgLambda > 1.1) recommendations.push('Mixture may be too lean, consider enriching for more power');
    if (consistency > 0.1) recommendations.push('Work on throttle consistency to improve lambda stability');
    return recommendations;
  };

  const generateBrakingRecommendations = (trailBraking, efficiency) => {
    const recommendations = [];
    if (trailBraking < 20) recommendations.push('Practice trail braking technique for better corner entry');
    if (efficiency < 60) recommendations.push('Focus on brake pressure modulation for better performance');
    if (trailBraking > 80) recommendations.push('Excellent trail braking technique - maintain consistency');
    return recommendations;
  };

  const generateThermalWarnings = (oilTemp, waterTemp, exhaustTemp) => {
    const warnings = [];
    if (oilTemp > 110) warnings.push('Oil temperature critical - check cooling system');
    if (waterTemp > 100) warnings.push('Water temperature high - monitor coolant levels');
    if (exhaustTemp > 750) warnings.push('Exhaust temperature excessive - check engine tuning');
    return warnings;
  };

  const renderAnalysisContent = () => {
    if (!analysisData) return null;

    switch (activeAnalysis) {
      case 'lambda':
        return renderLambdaAnalysis();
      case 'gforce':
        return renderGForceAnalysis();
      case 'braking':
        return renderBrakingAnalysis();
      case 'thermal':
        return renderThermalAnalysis();
      default:
        return renderLambdaAnalysis();
    }
  };

  const renderLambdaAnalysis = () => {
    const driverData = Object.entries(analysisData.lambda);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {driverData.map(([driver, data]) => (
          <Card key={driver} className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>{driver}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Average Lambda:</span>
                  <span className="text-white font-bold">{data.averageLambda.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Consistency:</span>
                  <span className={`font-bold ${
                    data.lambdaConsistency < 0.05 ? 'text-green-400' : 
                    data.lambdaConsistency < 0.1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.lambdaConsistency < 0.05 ? 'Excellent' : 
                     data.lambdaConsistency < 0.1 ? 'Good' : 'Needs Work'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Fuel Efficiency:</span>
                  <span className="text-blue-400 font-bold">{data.fuelEfficiencyScore.toFixed(0)}/100</span>
                </div>
                {data.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Recommendations:</h4>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {data.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderGForceAnalysis = () => {
    const driverData = Object.entries(analysisData.gforce);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {driverData.map(([driver, data]) => (
          <Card key={driver} className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>{driver} - G-Force Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Max Lateral G:</span>
                    <span className="text-blue-400 font-bold">{data.maxLateralG.toFixed(2)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Max Longitudinal G:</span>
                    <span className="text-green-400 font-bold">{data.maxLongitudinalG.toFixed(2)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Driving Style:</span>
                    <span className="text-white font-bold">{data.drivingStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Max Vertical G:</span>
                    <span className="text-purple-400 font-bold">{data.maxVerticalG.toFixed(2)}g</span>
                  </div>
                </div>
                <div className="h-48 bg-white/5 rounded-lg flex items-center justify-center">
                  <p className="text-slate-400 text-sm">G-Force Envelope Visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderBrakingAnalysis = () => {
    const driverData = Object.entries(analysisData.braking);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {driverData.map(([driver, data]) => (
          <Card key={driver} className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>{driver}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Max Pressure:</span>
                  <span className="text-red-400 font-bold">{data.maxBrakePressure.toFixed(1)} bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Trail Braking:</span>
                  <span className={`font-bold ${
                    data.trailBrakingScore > 60 ? 'text-green-400' : 
                    data.trailBrakingScore > 30 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.trailBrakingScore.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Efficiency:</span>
                  <span className="text-blue-400 font-bold">{data.brakingEfficiencyScore.toFixed(0)}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Braking Events:</span>
                  <span className="text-white font-bold">{data.brakingEvents}</span>
                </div>
                {data.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Tips:</h4>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {data.recommendations.slice(0, 2).map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderThermalAnalysis = () => {
    const driverData = Object.entries(analysisData.thermal);
    
    return (
      <div className="space-y-6">
        {driverData.map(([driver, data]) => (
          <Card key={driver} className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-red-500" />
                <span>{driver} - Thermal Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Oil Temperature:</span>
                    <span className="text-red-400 font-bold">{data.avgOilTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Water Temperature:</span>
                    <span className="text-blue-400 font-bold">{data.avgWaterTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Exhaust Temperature:</span>
                    <span className="text-orange-400 font-bold">{data.avgExhaustTemp.toFixed(0)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Thermal Score:</span>
                    <span className={`font-bold ${
                      data.thermalEfficiencyScore > 80 ? 'text-green-400' : 
                      data.thermalEfficiencyScore > 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.thermalEfficiencyScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
                {data.warnings.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Warnings
                    </h4>
                    <ul className="text-sm text-red-300 space-y-1">
                      {data.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const analysisTypes = [
    { id: 'lambda', label: 'Lambda Analysis', icon: Flame, description: 'Air-fuel ratio efficiency' },
    { id: 'gforce', label: 'G-Force Envelope', icon: Target, description: 'Acceleration performance' },
    { id: 'braking', label: 'Braking Performance', icon: AlertTriangle, description: 'Brake technique analysis' },
    { id: 'thermal', label: 'Thermal Management', icon: Thermometer, description: 'Temperature monitoring' }
  ];

  if (!sessions.length) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-8 text-center">
          <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Sessions Available</h3>
          <p className="text-slate-400">Upload telemetry sessions to access advanced analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Advanced Racing Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysisTypes.map(type => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveAnalysis(type.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeAnalysis === type.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs opacity-75">{type.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-slate-300">Analyzing telemetry data...</p>
          </CardContent>
        </Card>
      ) : (
        renderAnalysisContent()
      )}
    </div>
  );
};

export default AdvancedAnalytics;