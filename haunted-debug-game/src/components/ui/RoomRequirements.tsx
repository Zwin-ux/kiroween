/**
 * RoomRequirements - Display unlock requirements and helpful hints for locked rooms
 */

import { cn } from '@/lib/utils';
import { Progress } from './progress';
import { Button } from './button';

interface RequirementCondition {
  type: 'encounters_completed' | 'meter_threshold' | 'evidence_collected' | 'room_completed' | 'time_elapsed' | 'all_ghosts_resolved' | 'no_ethics_violations';
  description: string;
  currentValue: number;
  requiredValue: number;
  isMet: boolean;
  hint?: string;
}

interface RoomRequirement {
  roomId: string;
  roomName: string;
  roomDescription: string;
  icon: string;
  conditions: RequirementCondition[];
  estimatedTimeToComplete: number;
  difficultyLevel: number;
  recommendedPreparation: string[];
}

interface RoomRequirementsProps {
  requirements: RoomRequirement[];
  onRoomFocus: (roomId: string) => void;
  onHintRequest: (roomId: string, conditionType: string) => void;
  className?: string;
}

export function RoomRequirements({
  requirements,
  onRoomFocus,
  onHintRequest,
  className
}: RoomRequirementsProps) {
  
  const getConditionIcon = (type: string) => {
    const icons = {
      encounters_completed: '👻',
      meter_threshold: '📊',
      evidence_collected: '🔍',
      room_completed: '✅',
      time_elapsed: '⏰',
      all_ghosts_resolved: '🎯',
      no_ethics_violations: '⚖️'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getConditionProgress = (condition: RequirementCondition) => {
    if (condition.requiredValue === 0) return 100;
    return Math.min(100, (condition.currentValue / condition.requiredValue) * 100);
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 0.3) return 'text-green-400';
    if (level <= 0.6) return 'text-yellow-400';
    if (level <= 0.8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 0.3) return 'Easy';
    if (level <= 0.6) return 'Medium';
    if (level <= 0.8) return 'Hard';
    return 'Expert';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (requirements.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <span className="text-4xl mb-4 block">🎉</span>
        <h3 className="text-white font-bold text-lg mb-2">All Rooms Unlocked!</h3>
        <p className="text-gray-400">You have access to all areas of the haunted codebase.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-white font-bold text-lg mb-2">Unlock Requirements</h2>
        <p className="text-gray-400 text-sm">
          Complete these objectives to unlock new areas
        </p>
      </div>

      {requirements.map((requirement) => {
        const overallProgress = requirement.conditions.reduce((sum, condition) => 
          sum + getConditionProgress(condition), 0
        ) / requirement.conditions.length;

        const metConditions = requirement.conditions.filter(c => c.isMet).length;
        const totalConditions = requirement.conditions.length;

        return (
          <div
            key={requirement.roomId}
            className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
          >
            {/* Room Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{requirement.icon}</span>
                <div>
                  <h3 className="text-white font-bold flex items-center space-x-2">
                    <span>{requirement.roomName}</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                      🔒 Locked
                    </span>
                  </h3>
                  <p className="text-sm text-gray-400">{requirement.roomDescription}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRoomFocus(requirement.roomId)}
                className="text-gray-400 hover:text-white"
              >
                Focus
              </Button>
            </div>

            {/* Overall Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Overall Progress</span>
                <span className="text-white">
                  {metConditions}/{totalConditions} conditions met
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Individual Conditions */}
            <div className="space-y-3 mb-4">
              {requirement.conditions.map((condition, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded border",
                    condition.isMet ? "border-green-600 bg-green-900/20" : "border-gray-600 bg-gray-800/30"
                  )}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-lg">
                      {condition.isMet ? '✅' : getConditionIcon(condition.type)}
                    </span>
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        condition.isMet ? "text-green-300" : "text-white"
                      )}>
                        {condition.description}
                      </p>
                      
                      {!condition.isMet && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-gray-300">
                              {condition.currentValue}/{condition.requiredValue}
                            </span>
                          </div>
                          <Progress 
                            value={getConditionProgress(condition)} 
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!condition.isMet && condition.hint && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHintRequest(requirement.roomId, condition.type)}
                      className="text-gray-400 hover:text-white ml-2"
                      title="Get hint"
                    >
                      💡
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Room Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-700 pt-3">
              <div>
                <span className="text-gray-400">Estimated Time: </span>
                <span className="text-white">{formatTime(requirement.estimatedTimeToComplete)}</span>
              </div>
              <div>
                <span className="text-gray-400">Difficulty: </span>
                <span className={getDifficultyColor(requirement.difficultyLevel)}>
                  {getDifficultyLabel(requirement.difficultyLevel)}
                </span>
              </div>
            </div>

            {/* Recommended Preparation */}
            {requirement.recommendedPreparation.length > 0 && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded">
                <h4 className="text-blue-300 font-bold text-sm mb-2">💡 Preparation Tips</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  {requirement.recommendedPreparation.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Tips */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <h3 className="text-white font-bold mb-3">💡 Quick Tips</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-start space-x-2">
            <span className="text-green-400 mt-0.5">•</span>
            <span>Complete ghost encounters to unlock new areas</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Ask questions to gain insight and understanding</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>Maintain system stability to access advanced rooms</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>Collect evidence to track your debugging journey</span>
          </div>
        </div>
      </div>
    </div>
  );
}