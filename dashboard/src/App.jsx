import React, { useState, useEffect } from 'react';
import F4Dashboard from './components/F4Dashboard';
import TelemetryUpload from './components/TelemetryUpload';
import DriverComparison from './components/DriverComparison';
import SessionManager from './components/SessionManager';
import { useAuthContext } from './contexts/AuthContext.jsx';
import { useSupabase } from './hooks/useSupabase.js';
import { Racing, Upload, BarChart3, Settings, Users, Trophy, LogOut, User } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { user, profile, isAuthenticated, signOut, onlineUsers, getOnlineUserCount } = useAuthContext();
  const { getSessions, deleteSession, error: supabaseError } = useSupabase();

  // Load sessions from Supabase when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { success, sessions: loadedSessions, error } = await getSessions();
      if (success) {
        setSessions(loadedSessions || []);
      } else {
        console.error('Failed to load sessions:', error);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSessionUpload = async (newSession) => {
    // Refresh sessions after upload
    await loadSessions();
  };

  const handleSessionDelete = async (sessionId) => {
    try {
      const { success, error } = await deleteSession(sessionId);
      if (success) {
        // Remove from local state immediately for better UX
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      } else {
        console.error('Failed to delete session:', error);
        // Optionally show error message to user
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) {
      setSessions([]);
      setSelectedSessions([]);
      setActiveTab('dashboard');
    }
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
              {/* Online Users Counter */}
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{getOnlineUserCount()} online</span>
              </div>
              
              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile?.name || user?.email || 'Race Engineer'}</p>
                <p className="text-xs text-slate-300">{profile?.team || 'Formula 4 Racing Team'}</p>
              </div>
              
              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
        {/* Error Message */}
        {supabaseError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">
              <strong>Error:</strong> {supabaseError}
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {sessionsLoading && activeTab === 'dashboard' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading sessions...</p>
            </div>
          </div>
        )}
        
        {/* Dashboard */}
        {activeTab === 'dashboard' && !sessionsLoading && (
          <F4Dashboard 
            sessions={sessions} 
            selectedSessions={selectedSessions}
            onSessionSelect={setSelectedSessions}
            loading={sessionsLoading}
            onRefresh={loadSessions}
          />
        )}
        
        {/* Upload */}
        {activeTab === 'upload' && (
          <TelemetryUpload 
            onSessionUpload={handleSessionUpload}
            onRefresh={loadSessions}
          />
        )}
        
        {/* Compare */}
        {activeTab === 'compare' && (
          <DriverComparison 
            sessions={sessions}
            selectedSessions={selectedSessions}
            onSessionSelect={setSelectedSessions}
            loading={sessionsLoading}
          />
        )}
        
        {/* Sessions Manager */}
        {activeTab === 'sessions' && (
          <SessionManager 
            sessions={sessions}
            onSessionDelete={handleSessionDelete}
            onSessionSelect={setSelectedSessions}
            onRefresh={loadSessions}
            loading={sessionsLoading}
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