/**
 * EnhancedMeterDisplay - Advanced meter visualization with visual feedback and progression
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from './progress';
import type { MeterEffects } from '@/types/game';

interface MeterState {
  stability: number;
  insight: number;
}

interface MeterChange {
  id: string;
  type: 'stability' | 'insight';
  change: number;
  timestamp: Date;
  description: string;
}

interface EnhancedMeterDisplayProps {
  meters: MeterState;
  recentChanges?: MeterChange[];
  showTrends?: boolean;
  showThresholds?: boolean;
  onThresholdReached?: (type: 'stability' | 'insight', threshold: number) => void;
  className?: string;
}

export function EnhancedMeterDisplay({
  meters,
  recentChanges = [],
  showTrends = true,
  showThresholds = true,
  onThresholdReached,
  className
}: EnhancedMeterDisplayProps) {
  const [animatingChanges, setAnimatingChanges] = useState<MeterChange[]>([]);
  const [previousMeters, setPreviousMeters] = useState<MeterState>(meters);

  // Track meter changes and trigger animations
  useEffect(() => {
    if (meters.stability !== previousMeters.stability || meters.insight !== previousMeters.insight) {
      const changes: MeterChange[] = [];
      
      if (meters.stability !== previousMeters.stability) {
        changes.push({
          id: `stability_${Date.now()}`,
          type: 'stability',
          change: meters.stability - previousMeters.stability,
          timestamp: new Date(),
          description: 'Stability change'
        });
      }
      
      if (meters.insight !== previousMeters.insight) {
        changes.push({
          id: `insight_${Date.now()}`,
          type: 'insight',
          change: meters.insight - previousMeters.insight,
          timestamp: new Date(),
          description: 'Insight change'
        });
      }

      setAnimatingChanges(changes);
      setPreviousMeters(meters);

      // Check thresholds
      checkThresholds(meters, previousMeters);

      // Clear animations after delay
      setTimeout(() => {
        setAnimatingChanges([]);
      }, 2000);
    }
  }, [meters, previousMeters, onThresholdReached]);

  const checkThresholds = (current: MeterState, previous: MeterState) => {
    const thresholds = [25, 50, 75, 90];
    
    thresholds.forEach(threshold => {
      // Check stability thresholds
      if (previous.stability < threshold && current.stability >= threshold) {
        onThresholdReached?.('stability', threshold);
      }
      if (previous.stability > threshold && current.stability <= threshold) {
        onThresholdReached?.('stability', threshold);
      }
      
      // Check insight thresholds
      if (previous.insight < threshold && current.insight >= threshold) {
        onThresholdReached?.('insight', threshold);
      }
      if (previous.insight > threshold && current.insight <= threshold) {
        onThresholdReached?.('insight', threshold);
      }
    });
  };

  const getMeterColor = (type: 'stability' | 'insight', value: number) => {
    if (type === 'stability') {
      if (value >= 80) return 'text-green-400';
      if (value >= 60) return 'text-yellow-400';
      if (value >= 40) return 'text-orange-400';
      return 'text-red-400';
    } else {
      if (value >= 80) return 'text-blue-400';
      if (value >= 60) return 'text-cyan-400';
      if (value >= 40) return 'text-indigo-400';
      return 'text-purple-400';
    }
  };

  const getMeterIcon = (type: 'stability' | 'insight', value: number) => {
    if (type === 'stability') {
      if (value >= 80) return '🛡️';
      if (value >= 60) return '⚖️';
      if (value >= 40) return '⚠️';
      return '💥';
    } else {
      if (value >= 80) return '🧠';
      if (value >= 60) return '💡';
      if (value >= 40) return '🔍';
      return '❓';
    }
  };

  const getProgressVariant = (type: 'stability' | 'insight') => {
    return type === 'stability' ? 'stability' : 'insight';
  };

  const calculateTrend = (type: 'stability' | 'insight') => {
    const relevantChanges = recentChanges
      .filter(change => change.type === type)
      .slice(-5); // Last 5 changes

    if (relevantChanges.length === 0) return 0;

    const totalChange = relevantChanges.reduce((sum, change) => sum + change.change, 0);
    return totalChange / relevantChanges.length;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 2) return '📈';
    if (trend > 0) return '↗️';
    if (trend < -2) return '📉';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  const renderMeter = (type: 'stability' | 'insight', value: number) => {
    const trend = showTrends ? calculateTrend(type) : 0;
    const animatingChange = animatingChanges.find(change => change.type === type);
    
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getMeterIcon(type, value)}</span>
            <h3 className="text-sm font-medium text-gray-300 capitalize">
              {type}
            </h3>
            {showTrends && (
              <span className="text-xs" title={`Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}`}>
                {getTrendIcon(trend)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={cn("text-lg font-mono", getMeterColor(type, value))}>
              {value}
            </span>
            {animatingChange && (
              <span className={cn(
                "text-sm font-mono animate-pulse",
                animatingChange.change > 0 ? "text-green-400" : "text-red-400"
              )}>
                {animatingChange.change > 0 ? '+' : ''}{animatingChange.change}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress 
            value={value} 
            variant={getProgressVariant(type)}
            className={cn(
              "h-3 transition-all duration-500",
              animatingChange && "animate-pulse"
            )}
          />
          
          {/* Threshold markers */}
          {showThresholds && (
            <div className="relative h-1">
              {[25, 50, 75].map(threshold => (
                <div
                  key={threshold}
                  className="absolute w-0.5 h-1 bg-gray-600"
                  style={{ left: `${threshold}%` }}
                  title={`${threshold}% threshold`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-xs text-gray-400">
          {type === 'stability' ? (
            value >= 80 ? 'System is very stable' :
            value >= 60 ? 'System is stable' :
            value >= 40 ? 'System has some issues' :
            value >= 20 ? 'System is unstable' : 'Critical system issues'
          ) : (
            value >= 80 ? 'Deep understanding' :
            value >= 60 ? 'Good understanding' :
            value >= 40 ? 'Basic understanding' :
            value >= 20 ? 'Limited understanding' : 'Needs more learning'
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stability Meter */}
      <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
        {renderMeter('stability', meters.stability)}
      </div>

      {/* Insight Meter */}
      <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
        {renderMeter('insight', meters.insight)}
      </div>

      {/* Recent Changes */}
      {recentChanges.length > 0 && (
        <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Changes</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentChanges.slice(-5).reverse().map((change) => (
              <div key={change.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getMeterIcon(change.type, 50)}</span>
                  <span className="text-gray-400">{change.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "font-mono",
                    change.change > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {change.change > 0 ? '+' : ''}{change.change}
                  </span>
                  <span className="text-gray-500">
                    {change.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Warnings */}
      {(meters.stability <= 20 || meters.insight <= 10) && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-400 text-lg">⚠️</span>
            <h3 className="text-red-300 font-medium">Critical Alert</h3>
          </div>
          <div className="text-sm text-red-200">
            {meters.stability <= 20 && (
              <p>System stability is critically low. Consider safer approaches.</p>
            )}
            {meters.insight <= 10 && (
              <p>Learning progress is very low. Try asking more questions.</p>
            )}
          </div>
        </div>
      )}

      {/* Victory Condition */}
      {meters.stability >= 90 && meters.insight >= 80 && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400 text-lg">🎉</span>
            <h3 className="text-green-300 font-medium">Excellent Progress!</h3>
          </div>
          <p className="text-sm text-green-200">
            You've achieved high stability and deep understanding. Ready for advanced challenges!
          </p>
        </div>
      )}
    </div>
  );
}