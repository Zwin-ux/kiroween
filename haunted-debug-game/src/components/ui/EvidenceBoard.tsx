/**
 * EvidenceBoard - Enhanced timeline of player decisions and their consequences
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { TimelineInterface } from './TimelineInterface';
import { PostMortemReport } from './PostMortemReport';
import { useEvidenceTimeline } from '@/hooks/useEvidenceTimeline';
import type { EvidenceEntry } from '@/types/game';
import type { TimelineSearchQuery, TimelineSearchResult } from '../../engine/EvidenceTimeline';

interface EvidenceBoardProps {
  entries: EvidenceEntry[];
  onClose: () => void;
  className?: string;
}

export function EvidenceBoard({ entries, onClose, className }: EvidenceBoardProps) {
  const [viewMode, setViewMode] = useState<'legacy' | 'timeline' | 'report'>('timeline');
  const [filter, setFilter] = useState<'all' | 'patch_applied' | 'dialogue_completed' | 'room_entered'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'room' | 'type'>('timestamp');
  
  // Enhanced timeline functionality
  const {
    entries: timelineEntries,
    searchEntries: hookSearchEntries,
    exportReport,
    statistics,
    isLoading,
    error
  } = useEvidenceTimeline();
  
  const [reportData, setReportData] = useState<any>(null);
  
  // Wrapper function to ensure correct return type
  const searchEntries = (query: TimelineSearchQuery): TimelineSearchResult => {
    hookSearchEntries(query);
    return {
      entries: timelineEntries,
      totalCount: timelineEntries.length,
      searchTime: 0,
      suggestions: [],
      relatedConcepts: []
    };
  };

  // Filter and sort entries (legacy view only)
  const filteredEntries = entries
    .filter(entry => filter === 'all' || entry.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'room':
          return (a.context?.roomId || '').localeCompare(b.context?.roomId || '');
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  // Get entry icon
  const getEntryIcon = (type: string) => {
    const icons: Record<string, string> = {
      'patch_applied': '🔧',
      'ghost_encountered': '👻',
      'room_entered': '🚪',
      'meter_change': '📊',
      'ethics_violation': '⚠️',
      'achievement_unlocked': '🏆'
    };
    return icons[type] || '📝';
  };

  // Get entry color
  const getEntryColor = (type: string) => {
    const colors: Record<string, string> = {
      'patch_applied': 'text-green-400 border-green-700',
      'ghost_encountered': 'text-red-400 border-red-700',
      'room_entered': 'text-purple-400 border-purple-700',
      'meter_change': 'text-yellow-400 border-yellow-700',
      'ethics_violation': 'text-red-400 border-red-700',
      'achievement_unlocked': 'text-amber-400 border-amber-700'
    };
    return colors[type] || 'text-gray-400 border-gray-700';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get room display name
  const getRoomDisplayName = (roomId: string) => {
    const roomNames: Record<string, string> = {
      'boot-sector': 'Boot Sector',
      'dependency-crypt': 'Dependency Crypt',
      'ghost-memory-heap': 'Ghost Memory Heap',
      'possessed-compiler': 'Possessed Compiler',
      'ethics-tribunal': 'Ethics Tribunal',
      'final-merge': 'Final Merge'
    };
    return roomNames[roomId] || roomId;
  };

  // Calculate statistics
  const stats = {
    totalEntries: entries.length,
    patchesApplied: entries.filter(e => e.type === 'patch_applied').length,
    dialoguesCompleted: entries.filter(e => e.type === 'ghost_encountered').length,
    roomsVisited: new Set(entries.map(e => e.context?.roomId).filter(Boolean)).size,
    totalStabilityChange: entries.reduce((sum, e) => sum + (e.effects?.stability || 0), 0),
    totalInsightGained: entries.reduce((sum, e) => sum + (e.effects?.insight || 0), 0)
  };

  const handleExportReport = () => {
    const report = exportReport('json');
    if (report) {
      setReportData(report);
      setViewMode('report');
    }
  };

  const handleCloseReport = () => {
    setReportData(null);
    setViewMode('timeline');
  };

  // Show report view
  if (viewMode === 'report' && reportData) {
    return (
      <PostMortemReport
        report={reportData}
        onExport={(format) => exportReport(format)}
        onClose={handleCloseReport}
        className={className}
      />
    );
  }

  // Show enhanced timeline view
  if (viewMode === 'timeline') {
    return (
      <TimelineInterface
        entries={timelineEntries}
        onSearch={searchEntries}
        onExportReport={handleExportReport}
        onClose={onClose}
        className={className}
      />
    );
  }

  // Legacy view (original implementation)
  return (
    <div className={cn("flex flex-col h-full bg-gray-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-red-700">
        <div>
          <h2 className="text-xl font-bold text-red-300">Evidence Board (Legacy)</h2>
          <p className="text-sm text-gray-400">
            Timeline of your debugging journey
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('timeline')}
            className="text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            Enhanced View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕ Close
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-mono text-lg">{stats.totalEntries}</div>
            <div className="text-gray-400">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-mono text-lg">{stats.patchesApplied}</div>
            <div className="text-gray-400">Patches Applied</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-mono text-lg">{stats.dialoguesCompleted}</div>
            <div className="text-gray-400">Conversations</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-mono text-lg">{stats.roomsVisited}</div>
            <div className="text-gray-400">Rooms Explored</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Stability Impact</span>
              <span className={cn(
                "font-mono",
                stats.totalStabilityChange >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {stats.totalStabilityChange >= 0 ? '+' : ''}{stats.totalStabilityChange}
              </span>
            </div>
            <Progress 
              value={Math.min(100, Math.abs(stats.totalStabilityChange))}
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Insight Gained</span>
              <span className="text-blue-400 font-mono">
                +{stats.totalInsightGained}
              </span>
            </div>
            <Progress 
              value={Math.min(100, stats.totalInsightGained)}
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Filters and sorting */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="all">All Events</option>
                <option value="patch_applied">Patches Applied</option>
                <option value="ghost_encountered">Conversations</option>
                <option value="room_entered">Room Changes</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="timestamp">Time</option>
                <option value="room">Room</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            {filteredEntries.length} of {entries.length} events
          </div>
        </div>
      </div>

      {/* Evidence entries */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-400">No evidence entries yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Start exploring and making decisions to build your evidence board
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "p-4 border rounded-lg bg-gray-800/50",
                  getEntryColor(entry.type)
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-xl flex-shrink-0 mt-1">
                    {getEntryIcon(entry.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white text-sm">
                        {entry.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{getRoomDisplayName(entry.context?.roomId || 'unknown')}</span>
                        <span>•</span>
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">
                      {entry.description}
                    </p>
                    
                    {entry.effects && (entry.effects.stability !== 0 || entry.effects.insight !== 0) && (
                      <div className="flex items-center space-x-4 text-xs">
                        {entry.effects.stability !== 0 && (
                          <div className={cn(
                            "flex items-center space-x-1",
                            entry.effects.stability > 0 ? "text-green-400" : "text-red-400"
                          )}>
                            <span>Stability:</span>
                            <span className="font-mono">
                              {entry.effects.stability > 0 ? '+' : ''}{entry.effects.stability}
                            </span>
                          </div>
                        )}
                        
                        {entry.effects.insight !== 0 && (
                          <div className="flex items-center space-x-1 text-blue-400">
                            <span>Insight:</span>
                            <span className="font-mono">
                              +{entry.effects.insight}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {entry.context?.ghostId && (
                      <div className="mt-2 text-xs text-gray-500">
                        Ghost: {entry.context.ghostId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4 bg-gray-800/30">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Evidence board tracks all your debugging decisions</span>
          <span>Use this data to improve your debugging skills</span>
        </div>
      </div>
    </div>
  );
}