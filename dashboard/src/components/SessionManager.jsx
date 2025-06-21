import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Filter, Trash2, Download, Upload, Calendar, User, Clock, Database, ArrowUpDown, Eye, Settings } from 'lucide-react';

const SessionManager = ({ sessions, onSessionsUpdate, onSessionSelect, selectedSessions = [] }) => {
  const [filteredSessions, setFilteredSessions] = useState(sessions);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt'); // uploadedAt, driverName, sessionType, fastestLap
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [filterBy, setFilterBy] = useState({
    sessionType: 'all',
    processed: 'all',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    applyFiltersAndSort();
  }, [sessions, searchTerm, sortBy, sortOrder, filterBy]);

  const applyFiltersAndSort = () => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.metadata.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.metadata.sessionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply session type filter
    if (filterBy.sessionType !== 'all') {
      filtered = filtered.filter(session => 
        session.metadata.sessionType.toLowerCase() === filterBy.sessionType.toLowerCase()
      );
    }

    // Apply processed status filter
    if (filterBy.processed !== 'all') {
      const isProcessed = filterBy.processed === 'processed';
      filtered = filtered.filter(session => session.processed === isProcessed);
    }

    // Apply date range filter
    if (filterBy.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterBy.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(session => 
        new Date(session.uploadedAt) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'driverName':
          aValue = a.metadata.driverName.toLowerCase();
          bValue = b.metadata.driverName.toLowerCase();
          break;
        case 'sessionType':
          aValue = a.metadata.sessionType.toLowerCase();
          bValue = b.metadata.sessionType.toLowerCase();
          break;
        case 'fastestLap':
          aValue = a.metadata.fastestLapTime || 999;
          bValue = b.metadata.fastestLapTime || 999;
          break;
        case 'uploadedAt':
        default:
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSessions(filtered);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      onSessionsUpdate(updatedSessions);
    }
  };

  const handleSessionToggle = (sessionId) => {
    const isSelected = selectedSessions.includes(sessionId);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedSessions.filter(id => id !== sessionId);
    } else {
      newSelection = [...selectedSessions, sessionId];
    }
    
    onSessionSelect(newSelection);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeColor = (sessionType) => {
    const colors = {
      'practice': 'bg-green-500/20 text-green-400',
      'qualifying': 'bg-yellow-500/20 text-yellow-400',
      'race': 'bg-red-500/20 text-red-400',
      'test': 'bg-blue-500/20 text-blue-400'
    };
    return colors[sessionType.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Session Manager</h1>
          <p className="text-slate-300 mt-1">Manage and organize your Formula 4 telemetry sessions</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-sm">
            {filteredSessions.length} of {sessions.length} sessions
          </span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by driver name, session type, or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="uploadedAt">Sort by Upload Date</option>
                <option value="driverName">Sort by Driver</option>
                <option value="sessionType">Sort by Session Type</option>
                <option value="fastestLap">Sort by Fastest Lap</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Session Type</label>
                  <select
                    value={filterBy.sessionType}
                    onChange={(e) => setFilterBy(prev => ({ ...prev, sessionType: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="practice">Practice</option>
                    <option value="qualifying">Qualifying</option>
                    <option value="race">Race</option>
                    <option value="test">Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Processing Status</label>
                  <select
                    value={filterBy.processed}
                    onChange={(e) => setFilterBy(prev => ({ ...prev, processed: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Sessions</option>
                    <option value="processed">Processed</option>
                    <option value="unprocessed">Unprocessed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date Range</label>
                  <select
                    value={filterBy.dateRange}
                    onChange={(e) => setFilterBy(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Telemetry Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Sessions Found</h3>
              <p className="text-slate-400">
                {sessions.length === 0 
                  ? 'Upload your first telemetry session to get started.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-slate-400 border-b border-white/10">
                <div className="col-span-1">Select</div>
                <div className="col-span-3 cursor-pointer hover:text-white flex items-center space-x-1" onClick={() => handleSort('driverName')}>
                  <span>Driver / Session</span>
                  {sortBy === 'driverName' && <ArrowUpDown className="w-3 h-3" />}
                </div>
                <div className="col-span-2 cursor-pointer hover:text-white flex items-center space-x-1" onClick={() => handleSort('sessionType')}>
                  <span>Type</span>
                  {sortBy === 'sessionType' && <ArrowUpDown className="w-3 h-3" />}
                </div>
                <div className="col-span-2 cursor-pointer hover:text-white flex items-center space-x-1" onClick={() => handleSort('fastestLap')}>
                  <span>Best Lap</span>
                  {sortBy === 'fastestLap' && <ArrowUpDown className="w-3 h-3" />}
                </div>
                <div className="col-span-2 cursor-pointer hover:text-white flex items-center space-x-1" onClick={() => handleSort('uploadedAt')}>
                  <span>Upload Date</span>
                  {sortBy === 'uploadedAt' && <ArrowUpDown className="w-3 h-3" />}
                </div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Session Rows */}
              {filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:bg-white/5 ${
                    selectedSessions.includes(session.id)
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Selection Checkbox */}
                    <div className="lg:col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.id)}
                        onChange={() => handleSessionToggle(session.id)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Driver and Session Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${session.processed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="font-medium text-white">{session.metadata.driverName}</p>
                          <p className="text-sm text-slate-400">{session.fileName}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(session.fileSize)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Session Type */}
                    <div className="lg:col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionTypeColor(session.metadata.sessionType)}`}>
                        {session.metadata.sessionType}
                      </span>
                    </div>

                    {/* Best Lap Time */}
                    <div className="lg:col-span-2">
                      <p className="text-white font-mono">
                        {session.metadata.fastestLapTime ? 
                          `${session.metadata.fastestLapTime.toFixed(3)}s` : 
                          '--:--.---'
                        }
                      </p>
                      <p className="text-xs text-slate-400">{session.metadata.totalLaps} laps</p>
                    </div>

                    {/* Upload Date */}
                    <div className="lg:col-span-2">
                      <p className="text-sm text-slate-300">{formatDate(session.uploadedAt)}</p>
                      <p className="text-xs text-slate-500">
                        {session.processed ? 'Processed' : 'Processing...'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-2 flex items-center space-x-2">
                      <button
                        onClick={() => onSessionSelect([session.id])}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="View Session"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile View Additional Info */}
                  <div className="lg:hidden mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Best Lap:</span>
                      <span className="text-white font-mono">
                        {session.metadata.fastestLapTime ? 
                          `${session.metadata.fastestLapTime.toFixed(3)}s` : 
                          '--:--.---'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-400">Uploaded:</span>
                      <span className="text-slate-300">{formatDate(session.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSessions.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">
                  {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Implement bulk export functionality
                    console.log('Export selected sessions:', selectedSessions);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Selected</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedSessions.length} session(s)?`)) {
                      const updatedSessions = sessions.filter(session => !selectedSessions.includes(session.id));
                      onSessionsUpdate(updatedSessions);
                      onSessionSelect([]);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionManager;