/**
 * AdaptiveDifficultyPanel - UI for monitoring and controlling adaptive difficulty
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface DifficultySettings {
  ghostComplexity: number;
  patchRiskMultiplier: number;
  hintAvailability: number;
  timeConstraints: boolean;
  adaptiveAssistance: boolean;
  educationalDepth: number;
  errorTolerance: number;
  feedbackFrequency: number;
}

interface DifficultyProfile {
  id: string;
  name: string;
  description: string;
  settings: DifficultySettings;
  targetSuccessRate: number;
  adaptationSpeed: number;
}

interface PlayerPerformanceMetrics {
  successRate: number;
  averageCompletionTime: number;
  hintsUsed: number;
  questionsAsked: number;
  patchesApplied: number;
  ethicsViolations: number;
  strugglingIndicators: StruggleIndicator[];
  learningVelocity: number;
  engagementLevel: number;
}

interface StruggleIndicator {
  type: 'repeated_failures' | 'excessive_hints' | 'long_completion_times' | 'low_engagement' | 'confusion_patterns';
  severity: number;
  description: string;
  detectedAt: Date;
  suggestions: string[];
}

interface DifficultyAdjustment {
  timestamp: Date;
  reason: string;
  oldSettings: DifficultySettings;
  newSettings: DifficultySettings;
  expectedImpact: string;
}

interface AdaptiveDifficultyPanelProps {
  currentSettings: DifficultySettings;
  playerMetrics: PlayerPerformanceMetrics;
  availableProfiles: DifficultyProfile[];
  recentAdjustments: DifficultyAdjustment[];
  onProfileChange: (profileId: string) => void;
  onSettingsChange: (settings: Partial<DifficultySettings>) => void;
  onRequestHint: (context: string) => void;
  className?: string;
}

export function AdaptiveDifficultyPanel({
  currentSettings,
  playerMetrics,
  availableProfiles,
  recentAdjustments,
  onProfileChange,
  onSettingsChange,
  onRequestHint,
  className
}: AdaptiveDifficultyPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAdjustmentHistory, setShowAdjustmentHistory] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const getCurrentProfileName = () => {
    // Find the profile that best matches current settings
    for (const profile of availableProfiles) {
      const similarity = calculateSettingsSimilarity(currentSettings, profile.settings);
      if (similarity > 0.8) {
        return profile.name;
      }
    }
    return 'Custom';
  };

  const calculateSettingsSimilarity = (settings1: DifficultySettings, settings2: DifficultySettings): number => {
    const keys = Object.keys(settings1) as (keyof DifficultySettings)[];
    let totalSimilarity = 0;
    let numericKeys = 0;

    for (const key of keys) {
      const val1 = settings1[key];
      const val2 = settings2[key];
      
      if (typeof val1 === 'number' && typeof val2 === 'number') {
        const similarity = 1 - Math.abs(val1 - val2);
        totalSimilarity += similarity;
        numericKeys++;
      } else if (typeof val1 === 'boolean' && typeof val2 === 'boolean') {
        totalSimilarity += val1 === val2 ? 1 : 0;
        numericKeys++;
      }
    }

    return numericKeys > 0 ? totalSimilarity / numericKeys : 0;
  };

  const getPerformanceColor = (value: number, isHighGood: boolean = true) => {
    const threshold1 = isHighGood ? 0.7 : 0.3;
    const threshold2 = isHighGood ? 0.4 : 0.6;
    
    if (isHighGood) {
      if (value >= threshold1) return 'text-green-400';
      if (value >= threshold2) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (value <= threshold1) return 'text-green-400';
      if (value <= threshold2) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  const getStruggleIndicatorIcon = (type: string) => {
    const icons = {
      repeated_failures: '❌',
      excessive_hints: '💡',
      long_completion_times: '⏰',
      low_engagement: '😴',
      confusion_patterns: '❓'
    };
    return icons[type as keyof typeof icons] || '⚠️';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Difficulty Overview */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Adaptive Difficulty</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Profile:</span>
            <span className="text-white font-medium">{getCurrentProfileName()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="text-gray-400 hover:text-white"
            >
              ⚙️
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className={cn("text-2xl font-mono", getPerformanceColor(playerMetrics.successRate))}>
              {Math.round(playerMetrics.successRate * 100)}%
            </div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>
          
          <div className="text-center">
            <div className={cn("text-2xl font-mono", getPerformanceColor(playerMetrics.engagementLevel))}>
              {Math.round(playerMetrics.engagementLevel * 100)}%
            </div>
            <div className="text-xs text-gray-400">Engagement</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono text-white">
              {formatTime(playerMetrics.averageCompletionTime)}
            </div>
            <div className="text-xs text-gray-400">Avg Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono text-white">
              {playerMetrics.hintsUsed}
            </div>
            <div className="text-xs text-gray-400">Hints Used</div>
          </div>
        </div>

        {/* Difficulty Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Ghost Complexity</span>
              <span className="text-white">{Math.round(currentSettings.ghostComplexity * 100)}%</span>
            </div>
            <Progress value={currentSettings.ghostComplexity * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Hint Availability</span>
              <span className="text-white">{Math.round(currentSettings.hintAvailability * 100)}%</span>
            </div>
            <Progress value={currentSettings.hintAvailability * 100} className="h-2" />
          </div>
        </div>

        {/* Adaptive Assistance Status */}
        {currentSettings.adaptiveAssistance && (
          <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded text-sm">
            <span className="text-blue-300">🤖 Adaptive assistance is active</span>
          </div>
        )}
      </div>

      {/* Struggle Indicators */}
      {playerMetrics.strugglingIndicators.length > 0 && (
        <div className="border border-orange-600 rounded-lg p-4 bg-orange-900/20">
          <h3 className="text-orange-300 font-bold mb-3">⚠️ Areas for Improvement</h3>
          <div className="space-y-2">
            {playerMetrics.strugglingIndicators.map((indicator, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-lg mt-0.5">
                  {getStruggleIndicatorIcon(indicator.type)}
                </span>
                <div className="flex-1">
                  <p className="text-orange-200 text-sm font-medium">
                    {indicator.description}
                  </p>
                  <div className="mt-1">
                    <Progress 
                      value={indicator.severity * 100} 
                      className="h-1"
                    />
                  </div>
                  {indicator.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-orange-300 mb-1">Suggestions:</p>
                      <ul className="text-xs text-orange-200 space-y-1">
                        {indicator.suggestions.slice(0, 2).map((suggestion, idx) => (
                          <li key={idx} className="flex items-start space-x-1">
                            <span className="text-orange-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestHint('struggle_assistance')}
              className="text-orange-300 border-orange-600 hover:bg-orange-900/30"
            >
              💡 Get Help
            </Button>
          </div>
        </div>
      )}

      {/* Recent Adjustments */}
      {recentAdjustments.length > 0 && (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Recent Adjustments</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdjustmentHistory(true)}
              className="text-gray-400 hover:text-white"
            >
              📊 History
            </Button>
          </div>
          
          <div className="space-y-2">
            {recentAdjustments.slice(0, 3).map((adjustment, index) => (
              <div key={index} className="p-2 bg-gray-800 rounded text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-300">{adjustment.reason}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(adjustment.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{adjustment.expectedImpact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Progress */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <h3 className="text-white font-bold mb-3">Learning Progress</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Learning Velocity</span>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "text-sm",
                playerMetrics.learningVelocity > 0 ? "text-green-400" : 
                playerMetrics.learningVelocity < 0 ? "text-red-400" : "text-gray-400"
              )}>
                {playerMetrics.learningVelocity > 0 ? '📈' : 
                 playerMetrics.learningVelocity < 0 ? '📉' : '➡️'}
              </span>
              <span className="text-white">
                {playerMetrics.learningVelocity > 0 ? 'Improving' : 
                 playerMetrics.learningVelocity < 0 ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Questions Asked</span>
            <span className="text-white">{playerMetrics.questionsAsked}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Patches Applied</span>
            <span className="text-white">{playerMetrics.patchesApplied}</span>
          </div>
        </div>
      </div>

      {/* Difficulty Settings Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Difficulty Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Profile Selection */}
            <div>
              <h4 className="text-white font-bold mb-3">Difficulty Profiles</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableProfiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant={selectedProfile === profile.id ? "horror" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedProfile(profile.id);
                      onProfileChange(profile.id);
                    }}
                    className="text-left h-auto p-3"
                  >
                    <div>
                      <div className="font-bold">{profile.name}</div>
                      <div className="text-xs text-gray-400">{profile.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Settings Display */}
            <div>
              <h4 className="text-white font-bold mb-3">Current Settings</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Ghost Complexity</span>
                    <span className="text-white">{Math.round(currentSettings.ghostComplexity * 100)}%</span>
                  </div>
                  <Progress value={currentSettings.ghostComplexity * 100} className="h-1" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Patch Risk Multiplier</span>
                    <span className="text-white">{currentSettings.patchRiskMultiplier.toFixed(1)}x</span>
                  </div>
                  <Progress value={(currentSettings.patchRiskMultiplier - 0.5) / 1.5 * 100} className="h-1" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Hint Availability</span>
                    <span className="text-white">{Math.round(currentSettings.hintAvailability * 100)}%</span>
                  </div>
                  <Progress value={currentSettings.hintAvailability * 100} className="h-1" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Educational Depth</span>
                    <span className="text-white">{Math.round(currentSettings.educationalDepth * 100)}%</span>
                  </div>
                  <Progress value={currentSettings.educationalDepth * 100} className="h-1" />
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Time Constraints</span>
                  <span className={currentSettings.timeConstraints ? "text-green-400" : "text-gray-500"}>
                    {currentSettings.timeConstraints ? "Enabled" : "Disabled"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Adaptive Assistance</span>
                  <span className={currentSettings.adaptiveAssistance ? "text-green-400" : "text-gray-500"}>
                    {currentSettings.adaptiveAssistance ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjustment History Dialog */}
      <Dialog open={showAdjustmentHistory} onOpenChange={setShowAdjustmentHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Difficulty Adjustment History</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentAdjustments.map((adjustment, index) => (
              <div key={index} className="border border-gray-700 rounded p-3 bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{adjustment.reason}</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(adjustment.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{adjustment.expectedImpact}</p>
                
                {/* Show key changes */}
                <div className="text-xs text-gray-400">
                  <span>Key changes: </span>
                  {Object.keys(adjustment.newSettings).filter(key => {
                    const oldVal = adjustment.oldSettings[key as keyof DifficultySettings];
                    const newVal = adjustment.newSettings[key as keyof DifficultySettings];
                    return typeof oldVal === 'number' && typeof newVal === 'number' && 
                           Math.abs(oldVal - newVal) > 0.01;
                  }).map(key => {
                    const oldVal = adjustment.oldSettings[key as keyof DifficultySettings] as number;
                    const newVal = adjustment.newSettings[key as keyof DifficultySettings] as number;
                    const change = newVal > oldVal ? '↑' : '↓';
                    return `${key} ${change}`;
                  }).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}