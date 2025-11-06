/**
 * GameConditionDisplay - Shows victory, game over, and warning conditions
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import type { GameConditionResult } from '@/engine/GameConditionManager';

interface GameConditionDisplayProps {
  conditions: GameConditionResult[];
  onNewGame?: () => void;
  onContinue?: () => void;
  onClose?: () => void;
  className?: string;
}

export function GameConditionDisplay({
  conditions,
  onNewGame,
  onContinue,
  onClose,
  className
}: GameConditionDisplayProps) {
  if (conditions.length === 0) return null;

  // Get the highest priority condition
  const primaryCondition = conditions[0];
  const isGameEnding = primaryCondition.condition.type === 'victory' || primaryCondition.condition.type === 'game_over';

  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'victory':
        return '🎉';
      case 'game_over':
        return '💀';
      case 'warning':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getConditionColor = (type: string) => {
    switch (type) {
      case 'victory':
        return 'border-green-700 bg-green-900/20';
      case 'game_over':
        return 'border-red-700 bg-red-900/20';
      case 'warning':
        return 'border-yellow-700 bg-yellow-900/20';
      default:
        return 'border-gray-700 bg-gray-900/20';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'victory':
        return 'text-green-300';
      case 'game_over':
        return 'text-red-300';
      case 'warning':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 bg-black/70 flex items-center justify-center z-50",
      className
    )}>
      <div className={cn(
        "w-full max-w-2xl mx-4 border rounded-lg p-6",
        getConditionColor(primaryCondition.condition.type)
      )}>
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="text-4xl">
            {getConditionIcon(primaryCondition.condition.type)}
          </div>
          <div className="flex-1">
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              getTextColor(primaryCondition.condition.type)
            )}>
              {primaryCondition.condition.title}
            </h2>
            <p className="text-gray-300">
              {primaryCondition.message}
            </p>
          </div>
          
          {!isGameEnding && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          )}
        </div>

        {/* Additional conditions */}
        {conditions.length > 1 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Additional Notifications:</h3>
            <div className="space-y-2">
              {conditions.slice(1).map((conditionResult, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded">
                  <span className="text-xl">
                    {getConditionIcon(conditionResult.condition.type)}
                  </span>
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      getTextColor(conditionResult.condition.type)
                    )}>
                      {conditionResult.condition.title}
                    </div>
                    <div className="text-sm text-gray-400">
                      {conditionResult.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {primaryCondition.recommendations && primaryCondition.recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              {primaryCondition.condition.type === 'victory' ? 'What\'s Next:' : 'Recommendations:'}
            </h3>
            <ul className="space-y-2">
              {primaryCondition.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-400">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          {primaryCondition.condition.type === 'victory' && (
            <>
              <Button
                variant="outline"
                onClick={onNewGame}
                className="border-green-700 text-green-300 hover:bg-green-900/20"
              >
                🎮 Play Again
              </Button>
              <Button
                variant="horror"
                onClick={onClose}
                className="bg-green-800 hover:bg-green-700"
              >
                🎉 Celebrate
              </Button>
            </>
          )}

          {primaryCondition.condition.type === 'game_over' && (
            <>
              <Button
                variant="outline"
                onClick={onNewGame}
                className="border-red-700 text-red-300 hover:bg-red-900/20"
              >
                🔄 Try Again
              </Button>
              <Button
                variant="horror"
                onClick={onClose}
                className="bg-red-800 hover:bg-red-700"
              >
                📊 View Results
              </Button>
            </>
          )}

          {primaryCondition.condition.type === 'warning' && (
            <>
              {onContinue && (
                <Button
                  variant="outline"
                  onClick={onContinue}
                  className="border-yellow-700 text-yellow-300 hover:bg-yellow-900/20"
                >
                  ⚡ Continue Carefully
                </Button>
              )}
              <Button
                variant="horror"
                onClick={onClose}
                className="bg-yellow-800 hover:bg-yellow-700"
              >
                ✓ Understood
              </Button>
            </>
          )}
        </div>

        {/* Game ending statistics */}
        {isGameEnding && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Session Summary:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Session Duration:</span>
                  <span className="text-white">--:--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Decisions Made:</span>
                  <span className="text-white">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rooms Explored:</span>
                  <span className="text-white">--</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Stability:</span>
                  <span className="text-white">--%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Insight:</span>
                  <span className="text-white">--%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Learning Score:</span>
                  <span className="text-white">--/100</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}