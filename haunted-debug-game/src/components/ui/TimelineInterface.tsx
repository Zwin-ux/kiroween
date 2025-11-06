/**
 * TimelineInterface - Interactive evidence timeline with search and filtering
 */

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import type { 
  EvidenceTimelineEntry, 
  TimelineSearchQuery, 
  TimelineSearchResult,
  EvidenceCategory 
} from '../../engine/EvidenceTimeline';

interface TimelineInterfaceProps {
  entries: EvidenceTimelineEntry[];
  onSearch: (query: TimelineSearchQuery) => TimelineSearchResult;
  onExportReport: () => void;
  onClose: () => void;
  className?: string;
}

export function TimelineInterface({ 
  entries, 
  onSearch, 
  onExportReport, 
  onClose, 
  className 
}: TimelineInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState<TimelineSearchQuery>({});
  const [searchResults, setSearchResults] = useState<TimelineSearchResult | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<EvidenceTimelineEntry | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'search' | 'analytics'>('timeline');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Search functionality
  const handleSearch = useCallback((query: TimelineSearchQuery) => {
    setSearchQuery(query);
    const results = onSearch(query);
    setSearchResults(results);
    setViewMode('search');
  }, [onSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery({});
    setSearchResults(null);
    setViewMode('timeline');
  }, []);

  // Entry expansion
  const toggleEntryExpansion = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  // Calculate statistics
  const statistics = useMemo(() => {
    const displayEntries = searchResults?.entries || entries;
    
    return {
      totalEntries: displayEntries.length,
      successRate: displayEntries.filter(e => e.outcome === 'success').length / Math.max(1, displayEntries.length),
      averageConfidence: displayEntries.reduce((sum, e) => sum + e.confidence, 0) / Math.max(1, displayEntries.length),
      riskDistribution: displayEntries.reduce((acc, e) => {
        acc[e.riskLevel] = (acc[e.riskLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: displayEntries.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      conceptsLearned: [...new Set(displayEntries.flatMap(e => e.conceptsInvolved))].length,
      skillsApplied: [...new Set(displayEntries.flatMap(e => e.skillsApplied))].length
    };
  }, [entries, searchResults]);

  // Get entry icon and color
  const getEntryIcon = (category: EvidenceCategory) => {
    const icons: Record<EvidenceCategory, string> = {
      encounter: '👻',
      dialogue: '💬',
      patch_generation: '🔧',
      patch_application: '⚡',
      decision: '🤔',
      consequence: '📊',
      progression: '🚪',
      learning: '🎓',
      system_event: '⚙️',
      error: '❌'
    };
    return icons[category] || '📝';
  };

  const getEntryColor = (category: EvidenceCategory, outcome: string) => {
    const baseColors: Record<EvidenceCategory, string> = {
      encounter: 'border-purple-500',
      dialogue: 'border-blue-500',
      patch_generation: 'border-yellow-500',
      patch_application: 'border-green-500',
      decision: 'border-orange-500',
      consequence: 'border-red-500',
      progression: 'border-indigo-500',
      learning: 'border-cyan-500',
      system_event: 'border-gray-500',
      error: 'border-red-600'
    };

    const outcomeModifier = outcome === 'success' ? 'bg-green-900/20' : 
                           outcome === 'failure' ? 'bg-red-900/20' : 
                           outcome === 'pending' ? 'bg-yellow-900/20' : 
                           'bg-gray-900/20';

    return `${baseColors[category]} ${outcomeModifier}`;
  };

  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    };
    return colors[riskLevel] || 'text-gray-400';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const displayEntries = searchResults?.entries || entries;

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-red-700">
        <div>
          <h2 className="text-xl font-bold text-red-300">Evidence Timeline</h2>
          <p className="text-sm text-gray-400">
            Interactive debugging journey analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportReport}
            className="text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            📊 Export Report
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

      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-700">
        {(['timeline', 'search', 'analytics'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors",
              viewMode === mode
                ? "text-red-300 border-b-2 border-red-500 bg-gray-800/50"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Search Panel */}
      {viewMode === 'search' && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/30">
          <SearchPanel 
            query={searchQuery}
            onSearch={handleSearch}
            onClear={clearSearch}
            suggestions={searchResults?.suggestions || []}
          />
        </div>
      )}

      {/* Statistics Panel */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <StatisticsPanel statistics={statistics} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'analytics' ? (
          <AnalyticsPanel entries={displayEntries} />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {displayEntries.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {displayEntries.map((entry) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedEntries.has(entry.id)}
                    onToggleExpansion={() => toggleEntryExpansion(entry.id)}
                    onSelect={() => setSelectedEntry(entry)}
                    getIcon={getEntryIcon}
                    getColor={getEntryColor}
                    getRiskColor={getRiskColor}
                    formatTimestamp={formatTimestamp}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

// Search Panel Component
interface SearchPanelProps {
  query: TimelineSearchQuery;
  onSearch: (query: TimelineSearchQuery) => void;
  onClear: () => void;
  suggestions: string[];
}

function SearchPanel({ query, onSearch, onClear, suggestions }: SearchPanelProps) {
  const [localQuery, setLocalQuery] = useState<TimelineSearchQuery>(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Search Text</label>
          <input
            type="text"
            value={localQuery.text || ''}
            onChange={(e) => setLocalQuery({ ...localQuery, text: e.target.value })}
            placeholder="Search descriptions, concepts..."
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select
            value={localQuery.category || ''}
            onChange={(e) => setLocalQuery({ ...localQuery, category: e.target.value as EvidenceCategory || undefined })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All Categories</option>
            <option value="encounter">Encounters</option>
            <option value="dialogue">Dialogue</option>
            <option value="patch_application">Patch Applications</option>
            <option value="decision">Decisions</option>
            <option value="consequence">Consequences</option>
            <option value="progression">Progression</option>
            <option value="learning">Learning</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Outcome</label>
          <select
            value={localQuery.outcome || ''}
            onChange={(e) => setLocalQuery({ ...localQuery, outcome: e.target.value || undefined })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All Outcomes</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700">
            🔍 Search
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Suggestions:</span>
            {suggestions.slice(0, 3).map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setLocalQuery({ ...localQuery, text: suggestion })}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

// Statistics Panel Component
interface StatisticsPanelProps {
  statistics: {
    totalEntries: number;
    successRate: number;
    averageConfidence: number;
    riskDistribution: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    conceptsLearned: number;
    skillsApplied: number;
  };
}

function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
      <div className="text-center">
        <div className="text-white font-mono text-lg">{statistics.totalEntries}</div>
        <div className="text-gray-400">Total Events</div>
      </div>
      
      <div className="text-center">
        <div className="text-green-400 font-mono text-lg">
          {(statistics.successRate * 100).toFixed(0)}%
        </div>
        <div className="text-gray-400">Success Rate</div>
      </div>
      
      <div className="text-center">
        <div className="text-blue-400 font-mono text-lg">
          {(statistics.averageConfidence * 100).toFixed(0)}%
        </div>
        <div className="text-gray-400">Avg Confidence</div>
      </div>
      
      <div className="text-center">
        <div className="text-purple-400 font-mono text-lg">{statistics.conceptsLearned}</div>
        <div className="text-gray-400">Concepts</div>
      </div>
      
      <div className="text-center">
        <div className="text-cyan-400 font-mono text-lg">{statistics.skillsApplied}</div>
        <div className="text-gray-400">Skills</div>
      </div>
      
      <div className="text-center">
        <div className="text-orange-400 font-mono text-lg">
          {statistics.riskDistribution.high || 0}
        </div>
        <div className="text-gray-400">High Risk</div>
      </div>
      
      <div className="text-center">
        <div className="text-red-400 font-mono text-lg">
          {statistics.riskDistribution.critical || 0}
        </div>
        <div className="text-gray-400">Critical</div>
      </div>
    </div>
  );
}

// Timeline Entry Component
interface TimelineEntryProps {
  entry: EvidenceTimelineEntry;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onSelect: () => void;
  getIcon: (category: EvidenceCategory) => string;
  getColor: (category: EvidenceCategory, outcome: string) => string;
  getRiskColor: (riskLevel: string) => string;
  formatTimestamp: (timestamp: Date) => string;
}

function TimelineEntry({
  entry,
  isExpanded,
  onToggleExpansion,
  onSelect,
  getIcon,
  getColor,
  getRiskColor,
  formatTimestamp
}: TimelineEntryProps) {
  return (
    <div
      className={cn(
        "border rounded-lg bg-gray-800/50 transition-all duration-200",
        getColor(entry.category, entry.outcome),
        isExpanded ? "ring-2 ring-red-500/30" : ""
      )}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="text-xl flex-shrink-0 mt-1">
            {getIcon(entry.category)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-sm capitalize">
                {entry.category.replace('_', ' ')}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span className={getRiskColor(entry.riskLevel)}>
                  {entry.riskLevel.toUpperCase()}
                </span>
                <span>•</span>
                <span>{formatTimestamp(entry.timestamp)}</span>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-2">
              {entry.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs">
                <span className={cn(
                  "px-2 py-1 rounded",
                  entry.outcome === 'success' ? 'bg-green-900/50 text-green-300' :
                  entry.outcome === 'failure' ? 'bg-red-900/50 text-red-300' :
                  entry.outcome === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                  'bg-gray-900/50 text-gray-300'
                )}>
                  {entry.outcome}
                </span>
                
                <span className="text-gray-400">
                  Confidence: {(entry.confidence * 100).toFixed(0)}%
                </span>
                
                {entry.roomId && (
                  <span className="text-gray-400">
                    Room: {entry.roomId}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSelect}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpansion}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {isExpanded ? '▼' : '▶'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <ExpandedEntryContent entry={entry} />
          </div>
        )}
      </div>
    </div>
  );
}

// Expanded Entry Content Component
function ExpandedEntryContent({ entry }: { entry: EvidenceTimelineEntry }) {
  return (
    <div className="space-y-3 text-sm">
      {entry.learningPoints.length > 0 && (
        <div>
          <h4 className="text-gray-300 font-medium mb-1">Learning Points:</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            {entry.learningPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      
      {entry.conceptsInvolved.length > 0 && (
        <div>
          <h4 className="text-gray-300 font-medium mb-1">Concepts:</h4>
          <div className="flex flex-wrap gap-1">
            {entry.conceptsInvolved.map((concept, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {entry.skillsApplied.length > 0 && (
        <div>
          <h4 className="text-gray-300 font-medium mb-1">Skills Applied:</h4>
          <div className="flex flex-wrap gap-1">
            {entry.skillsApplied.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {entry.tags.length > 0 && (
        <div>
          <h4 className="text-gray-300 font-medium mb-1">Tags:</h4>
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Panel Component
function AnalyticsPanel({ entries }: { entries: EvidenceTimelineEntry[] }) {
  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-bold text-white">Analytics Dashboard</h3>
      
      {/* Placeholder for analytics charts and insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Decision Patterns</h4>
          <p className="text-gray-400 text-sm">
            Analysis of your decision-making patterns and outcomes
          </p>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Learning Progress</h4>
          <p className="text-gray-400 text-sm">
            Track your mastery of debugging concepts over time
          </p>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Risk Assessment</h4>
          <p className="text-gray-400 text-sm">
            Your risk tolerance and success correlation analysis
          </p>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Skill Development</h4>
          <p className="text-gray-400 text-sm">
            Progression in different debugging and problem-solving skills
          </p>
        </div>
      </div>
    </div>
  );
}

// Entry Detail Modal Component
function EntryDetailModal({ 
  entry, 
  onClose 
}: { 
  entry: EvidenceTimelineEntry; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Entry Details</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <strong className="text-gray-300">Description:</strong>
              <p className="text-gray-400 mt-1">{entry.description}</p>
            </div>
            
            <div>
              <strong className="text-gray-300">Context:</strong>
              <pre className="text-gray-400 mt-1 bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(entry.context, null, 2)}
              </pre>
            </div>
            
            <ExpandedEntryContent entry={entry} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-xl font-bold text-white mb-2">No Evidence Entries</h3>
      <p className="text-gray-400 mb-4">
        Start exploring and making decisions to build your evidence timeline
      </p>
      <p className="text-sm text-gray-500">
        Your debugging journey will be automatically tracked here
      </p>
    </div>
  );
}