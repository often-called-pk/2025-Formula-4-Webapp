import React, { useState, useEffect } from 'react';
import F4Dashboard from './components/F4Dashboard';
import TelemetryUpload from './components/TelemetryUpload';
import DriverComparison from './components/DriverComparison';
import SessionManager from './components/SessionManager';
import { Racing, Upload, BarChart3, Settings, Users, Trophy } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [user, setUser] = useState({
    name: 'Race Engineer',
    role: 'engineer',
    team: 'Formula 4 Racing Team'
  });

  useEffect(() => {
    // Load saved sessions from localStorage
    const savedSessions = localStorage.getItem('f4_telemetry_sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  const handleSessionUpload = (newSession) => {
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('f4_telemetry_sessions', JSON.stringify(updatedSessions));
  };

  const handleSessionDelete = (sessionId) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('f4_telemetry_sessions', JSON.stringify(updatedSessions));
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'upload', label: 'Upload Telemetry', icon: Upload },
    { id: 'compare', label: 'Driver Comparison', icon: Users },
    { id: 'sessions', label: 'Session Manager', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Racing className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Formula 4 Race Analytics</h1>
                <p className="text-sm text-slate-300">Professional Telemetry Analysis Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-300">{user.team}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-t-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white border-b-2 border-red-500'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <F4Dashboard 
            sessions={sessions} 
            selectedSessions={selectedSessions}
            onSessionSelect={setSelectedSessions}
          />
        )}
        
        {activeTab === 'upload' && (
          <TelemetryUpload onSessionUpload={handleSessionUpload} />
        )}
        
        {activeTab === 'compare' && (
          <DriverComparison 
            sessions={sessions}
            selectedSessions={selectedSessions}
            onSessionSelect={setSelectedSessions}
          />
        )}
        
        {activeTab === 'sessions' && (
          <SessionManager 
            sessions={sessions}
            onSessionDelete={handleSessionDelete}
            onSessionSelect={setSelectedSessions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>© 2025 Formula 4 Race Analytics. Professional telemetry analysis platform.</p>
            <p>v2.0 | 39-Parameter Telemetry Support | AiM RaceStudio Compatible</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;