/**
 * EnhancedEvidenceBoard - Advanced evidence tracking with learning insights and patterns
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import type { EvidenceEntry } from '@/types/game';

interface EvidenceBoardProps {
  entries: EvidenceEntry[];
  onClose: () => void;
  className?: string;
}

interface LearningInsight {
  type: 'pattern' | 'improvement' | 'weakness' | 'achievement';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
}

interface DecisionPattern {
  action: string;
  frequency: number;
  successRate: number;
  avgStabilityImpact: number;
  avgInsightGain: number;
}

export function EnhancedEvidenceBoard({ entries, onClose, className }: EvidenceBoardProps) {
  const [currentView, setCurrentView] = useState<'timeline' | 'analytics' | 'insights'>('timeline');
  const [filter, setFilter] = useState<'all' | 'patch_applied' | 'ghost_encountered' | 'room_entered'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'impact' | 'type'>('timestamp');

  // Calculate analytics and insights
  const analytics = useMemo(() => {
    const filteredEntries = entries.filter(entry => filter === 'all' || entry.type === filter);
    
    // Basic statistics
    const stats = {
      totalEntries: entries.length,
      patchesApplied: entries.filter(e => e.type === 'patch_applied').length,
      ghostsEncountered: entries.filter(e => e.type === 'ghost_encountered').length,
      roomsVisited: new Set(entries.map(e => e.context?.roomKey).filter(Boolean)).size,
      totalStabilityChange: entries.reduce((sum, e) => sum + (e.effects?.stability || 0), 0),
      totalInsightGained: entries.reduce((sum, e) => sum + (e.effects?.insight || 0), 0),
      avgStabilityPerAction: 0,
      avgInsightPerAction: 0
    };

    const actionEntries = entries.filter(e => e.effects && (e.effects.stability !== 0 || e.effects.insight !== 0));
    if (actionEntries.length > 0) {
      stats.avgStabilityPerAction = stats.totalStabilityChange / actionEntries.length;
      stats.avgInsightPerAction = stats.totalInsightGained / actionEntries.length;
    }

    // Decision patterns
    const decisionPatterns: DecisionPattern[] = [];
    const actionGroups = new Map<string, EvidenceEntry[]>();
    
    entries.forEach(entry => {
      if (entry.type === 'patch_applied') {
        const action = entry.description.includes('apply') ? 'apply' : 
                     entry.description.includes('refactor') ? 'refactor' : 'question';
        
        if (!actionGroups.has(action)) {
          actionGroups.set(action, []);
        }
        actionGroups.get(action)!.push(entry);
      }
    });

    actionGroups.forEach((actionEntries, action) => {
      const successCount = actionEntries.filter(e => (e.effects?.stability || 0) >= 0).length;
      const totalStability = actionEntries.reduce((sum, e) => sum + (e.effects?.stability || 0), 0);
      const totalInsight = actionEntries.reduce((sum, e) => sum + (e.effects?.insight || 0), 0);

      decisionPatterns.push({
        action,
        frequency: actionEntries.length,
        successRate: actionEntries.length > 0 ? successCount / actionEntries.length : 0,
        avgStabilityImpact: actionEntries.length > 0 ? totalStability / actionEntries.length : 0,
        avgInsightGain: actionEntries.length > 0 ? totalInsight / actionEntries.length : 0
      });
    });

    // Learning insights
    const insights: LearningInsight[] = [];

    // Pattern recognition
    if (decisionPatterns.length > 0) {
      const bestAction = decisionPatterns.reduce((best, current) => 
        current.successRate > best.successRate ? current : best
      );
      
      if (bestAction.successRate > 0.7) {
        insights.push({
          type: 'pattern',
          title: 'Preferred Strategy Identified',
          description: `You tend to succeed most with "${bestAction.action}" actions (${Math.round(bestAction.successRate * 100)}% success rate)`,
          confidence: 0.8,
          recommendations: [
            `Continue using ${bestAction.action} for similar situations`,
            'Try to understand why this approach works well for you',
            'Consider teaching this strategy to others'
          ]
        });
      }
    }

    // Improvement tracking
    const recentEntries = entries.slice(-10);
    const olderEntries = entries.slice(-20, -10);
    
    if (recentEntries.length >= 5 && olderEntries.length >= 5) {
      const recentAvgStability = recentEntries.reduce((sum, e) => sum + (e.effects?.stability || 0), 0) / recentEntries.length;
      const olderAvgStability = olderEntries.reduce((sum, e) => sum + (e.effects?.stability || 0), 0) / olderEntries.length;
      
      if (recentAvgStability > olderAvgStability + 2) {
        insights.push({
          type: 'improvement',
          title: 'Improving Decision Quality',
          description: `Your recent decisions have better stability outcomes (+${(recentAvgStability - olderAvgStability).toFixed(1)} average)`,
          confidence: 0.7,
          recommendations: [
            'Keep up the good work with careful decision making',
            'Document what you\'ve learned to maintain this improvement',
            'Try tackling more challenging problems'
          ]
        });
      }
    }

    // Weakness identification
    const negativeStabilityEntries = entries.filter(e => (e.effects?.stability || 0) < -5);
    if (negativeStabilityEntries.length > entries.length * 0.3) {
      insights.push({
        type: 'weakness',
        title: 'High-Risk Decision Pattern',
        description: `${Math.round((negativeStabilityEntries.length / entries.length) * 100)}% of your decisions resulted in significant stability loss`,
        confidence: 0.9,
        recommendations: [
          'Consider asking more questions before making changes',
          'Focus on understanding the problem before applying solutions',
          'Try refactoring instead of quick patches for complex issues'
        ]
      });
    }

    // Achievement recognition
    if (stats.totalInsightGained > 50) {
      insights.push({
        type: 'achievement',
        title: 'Knowledge Seeker',
        description: `You've gained ${stats.totalInsightGained} insight points through your debugging journey`,
        confidence: 1.0,
        recommendations: [
          'Share your knowledge with other developers',
          'Consider mentoring others in debugging techniques',
          'Document your learning process for future reference'
        ]
      });
    }

    return {
      stats,
      decisionPatterns,
      insights,
      filteredEntries: filteredEntries.sort((a, b) => {
        switch (sortBy) {
          case 'timestamp':
            return b.timestamp.getTime() - a.timestamp.getTime();
          case 'impact':
            const aImpact = Math.abs((a.effects?.stability || 0) + (a.effects?.insight || 0));
            const bImpact = Math.abs((b.effects?.stability || 0) + (b.effects?.insight || 0));
            return bImpact - aImpact;
          case 'type':
            return a.type.localeCompare(b.type);
          default:
            return 0;
        }
      })
    };
  }, [entries, filter, sortBy]);

  const getEntryIcon = (type: string) => {
    const icons: Record<string, string> = {
      'patch_applied': '🔧',
      'ghost_encountered': '👻',
      'room_entered': '🚪',
      'meter_change': '📊',
      'ethics_violation': '⚖️'
    };
    return icons[type] || '📝';
  };

  const getEntryColor = (type: string) => {
    const colors: Record<string, string> = {
      'patch_applied': 'text-green-400 border-green-700',
      'ghost_encountered': 'text-blue-400 border-blue-700',
      'room_entered': 'text-purple-400 border-purple-700',
      'meter_change': 'text-yellow-400 border-yellow-700',
      'ethics_violation': 'text-red-400 border-red-700'
    };
    return colors[type] || 'text-gray-400 border-gray-700';
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRoomDisplayName = (roomKey: string) => {
    const roomNames: Record<string, string> = {
      'boot-sector': 'Boot Sector',
      'dependency-crypt': 'Dependency Crypt',
      'ghost-memory-heap': 'Ghost Memory Heap',
      'possessed-compiler': 'Possessed Compiler',
      'ethics-tribunal': 'Ethics Tribunal',
      'final-merge': 'Final Merge'
    };
    return roomNames[roomKey] || roomKey;
  };

  const renderTimelineView = () => (
    <div className="space-y-3">
      {analytics.filteredEntries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-400">No evidence entries yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Start exploring and making decisions to build your evidence board
          </p>
        </div>
      ) : (
        analytics.filteredEntries.map((entry) => (
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
                    <span>{getRoomDisplayName(entry.context?.roomKey || 'unknown')}</span>
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
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-mono text-white">{analytics.stats.totalEntries}</div>
          <div className="text-sm text-gray-400">Total Actions</div>
        </div>
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-mono text-green-400">{analytics.stats.patchesApplied}</div>
          <div className="text-sm text-gray-400">Patches Applied</div>
        </div>
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-mono text-blue-400">{analytics.stats.ghostsEncountered}</div>
          <div className="text-sm text-gray-400">Ghosts Met</div>
        </div>
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-mono text-purple-400">{analytics.stats.roomsVisited}</div>
          <div className="text-sm text-gray-400">Rooms Explored</div>
        </div>
      </div>

      {/* Decision Patterns */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h3 className="text-white font-bold mb-4">Decision Patterns</h3>
        <div className="space-y-3">
          {analytics.decisionPatterns.map((pattern) => (
            <div key={pattern.action} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{pattern.action}</span>
                  <span className="text-sm text-gray-400">{pattern.frequency} times</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Success Rate</div>
                    <div className="text-white">{Math.round(pattern.successRate * 100)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Avg Stability</div>
                    <div className={cn(
                      "font-mono",
                      pattern.avgStabilityImpact >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {pattern.avgStabilityImpact >= 0 ? '+' : ''}{pattern.avgStabilityImpact.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Avg Insight</div>
                    <div className="text-blue-400 font-mono">+{pattern.avgInsightGain.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-3">Stability Impact</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Change</span>
              <span className={cn(
                "font-mono",
                analytics.stats.totalStabilityChange >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {analytics.stats.totalStabilityChange >= 0 ? '+' : ''}{analytics.stats.totalStabilityChange}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Average per Action</span>
              <span className={cn(
                "font-mono",
                analytics.stats.avgStabilityPerAction >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {analytics.stats.avgStabilityPerAction >= 0 ? '+' : ''}{analytics.stats.avgStabilityPerAction.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-3">Learning Progress</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Insight</span>
              <span className="text-blue-400 font-mono">+{analytics.stats.totalInsightGained}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Average per Action</span>
              <span className="text-blue-400 font-mono">+{analytics.stats.avgInsightPerAction.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsightsView = () => (
    <div className="space-y-4">
      <h3 className="text-white font-bold">Learning Insights</h3>
      
      {analytics.insights.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">Not enough data for insights yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Continue playing to generate personalized learning insights
          </p>
        </div>
      ) : (
        analytics.insights.map((insight, index) => (
          <div key={index} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-2xl flex-shrink-0 mt-1">
                {insight.type === 'pattern' && '🎯'}
                {insight.type === 'improvement' && '📈'}
                {insight.type === 'weakness' && '⚠️'}
                {insight.type === 'achievement' && '🏆'}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{insight.title}</h4>
                  <div className="flex items-center space-x-1">
                    <Progress value={insight.confidence * 100} className="w-16 h-2" />
                    <span className="text-xs text-gray-400">{Math.round(insight.confidence * 100)}%</span>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Recommendations:</h5>
                  <ul className="space-y-1">
                    {insight.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="text-sm text-gray-400 flex items-start space-x-2">
                        <span className="text-blue-400 mt-1">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full bg-gray-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-red-700">
        <div>
          <h2 className="text-xl font-bold text-red-300">Enhanced Evidence Board</h2>
          <p className="text-sm text-gray-400">
            Comprehensive analysis of your debugging journey
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕ Close
        </Button>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex">
          {[
            { id: 'timeline', label: 'Timeline', icon: '📅' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'insights', label: 'Insights', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                currentView === tab.id
                  ? "border-red-500 text-red-300 bg-red-900/20"
                  : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters (only for timeline view) */}
      {currentView === 'timeline' && (
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
                  <option value="ghost_encountered">Ghost Encounters</option>
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
                  <option value="impact">Impact</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              {analytics.filteredEntries.length} of {entries.length} events
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentView === 'timeline' && renderTimelineView()}
        {currentView === 'analytics' && renderAnalyticsView()}
        {currentView === 'insights' && renderInsightsView()}
      </div>
    </div>
  );
}