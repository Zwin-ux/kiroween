/**
 * GameConditionManager - Manages game over and victory conditions based on meters and progress
 */

import type { GameState, MeterEffects } from '@/types/game';
import type { EvidenceEntry } from '@/types/game';

export interface GameCondition {
  id: string;
  type: 'victory' | 'game_over' | 'warning';
  title: string;
  description: string;
  checkCondition: (gameState: GameState) => boolean;
  priority: number; // Higher priority conditions are checked first
  onTrigger?: (gameState: GameState) => void;
}

export interface GameConditionResult {
  condition: GameCondition;
  triggered: boolean;
  message: string;
  recommendations?: string[];
}

export class GameConditionManager {
  private conditions: GameCondition[] = [];
  private triggeredConditions: Set<string> = new Set();

  constructor() {
    this.initializeConditions();
  }

  /**
   * Initialize all game conditions
   */
  private initializeConditions(): void {
    // Victory Conditions
    this.conditions.push({
      id: 'perfect_victory',
      type: 'victory',
      title: 'Perfect Debugging Master',
      description: 'Achieved maximum stability and insight while completing all rooms',
      priority: 100,
      checkCondition: (gameState) => {
        return gameState.meters.stability >= 95 &&
               gameState.meters.insight >= 90 &&
               gameState.unlockedRooms.includes('final-merge') &&
               this.hasCompletedAllRooms(gameState);
      }
    });

    this.conditions.push({
      id: 'standard_victory',
      type: 'victory',
      title: 'Debugging Expert',
      description: 'Successfully completed the debugging journey with good stability and insight',
      priority: 90,
      checkCondition: (gameState) => {
        return gameState.meters.stability >= 80 &&
               gameState.meters.insight >= 70 &&
               gameState.unlockedRooms.includes('final-merge') &&
               this.hasCompletedFinalMerge(gameState);
      }
    });

    this.conditions.push({
      id: 'learning_victory',
      type: 'victory',
      title: 'Knowledge Seeker',
      description: 'Gained exceptional insight through careful learning and questioning',
      priority: 85,
      checkCondition: (gameState) => {
        return gameState.meters.insight >= 95 &&
               gameState.meters.stability >= 60 &&
               this.hasHighQuestioningRate(gameState);
      }
    });

    // Game Over Conditions
    this.conditions.push({
      id: 'critical_instability',
      type: 'game_over',
      title: 'System Collapse',
      description: 'The system has become critically unstable due to poor debugging decisions',
      priority: 100,
      checkCondition: (gameState) => {
        return gameState.meters.stability <= 0;
      }
    });

    this.conditions.push({
      id: 'repeated_failures',
      type: 'game_over',
      title: 'Debugging Burnout',
      description: 'Too many failed attempts have led to system breakdown',
      priority: 90,
      checkCondition: (gameState) => {
        return gameState.meters.stability <= 10 &&
               this.hasHighFailureRate(gameState);
      }
    });

    this.conditions.push({
      id: 'no_progress',
      type: 'game_over',
      title: 'Stagnation',
      description: 'No meaningful progress has been made in learning or system improvement',
      priority: 80,
      checkCondition: (gameState) => {
        return gameState.meters.insight <= 5 &&
               gameState.evidenceBoard.length >= 20 &&
               this.hasLowLearningRate(gameState);
      }
    });

    // Warning Conditions
    this.conditions.push({
      id: 'low_stability_warning',
      type: 'warning',
      title: 'Stability Warning',
      description: 'System stability is getting dangerously low',
      priority: 70,
      checkCondition: (gameState) => {
        return gameState.meters.stability <= 25 && gameState.meters.stability > 10;
      }
    });

    this.conditions.push({
      id: 'slow_learning_warning',
      type: 'warning',
      title: 'Learning Plateau',
      description: 'Insight growth has slowed significantly',
      priority: 60,
      checkCondition: (gameState) => {
        return gameState.meters.insight <= 30 &&
               gameState.evidenceBoard.length >= 10 &&
               this.hasSlowInsightGrowth(gameState);
      }
    });

    this.conditions.push({
      id: 'risky_behavior_warning',
      type: 'warning',
      title: 'High-Risk Pattern',
      description: 'Recent decisions show a pattern of high-risk behavior',
      priority: 65,
      checkCondition: (gameState) => {
        return this.hasHighRiskPattern(gameState);
      }
    });
  }

  /**
   * Check all conditions and return any that are triggered
   */
  checkConditions(gameState: GameState): GameConditionResult[] {
    const results: GameConditionResult[] = [];

    // Sort conditions by priority (highest first)
    const sortedConditions = [...this.conditions].sort((a, b) => b.priority - a.priority);

    for (const condition of sortedConditions) {
      // Skip if already triggered (for one-time conditions)
      if (this.triggeredConditions.has(condition.id) && condition.type !== 'warning') {
        continue;
      }

      if (condition.checkCondition(gameState)) {
        const result: GameConditionResult = {
          condition,
          triggered: true,
          message: this.generateConditionMessage(condition, gameState),
          recommendations: this.generateRecommendations(condition, gameState)
        };

        results.push(result);

        // Mark as triggered
        this.triggeredConditions.add(condition.id);

        // Execute trigger callback
        condition.onTrigger?.(gameState);

        // For victory and game over conditions, stop checking further
        if (condition.type === 'victory' || condition.type === 'game_over') {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Generate contextual message for a triggered condition
   */
  private generateConditionMessage(condition: GameCondition, gameState: GameState): string {
    const baseMessage = condition.description;
    
    switch (condition.id) {
      case 'perfect_victory':
        return `${baseMessage} You've achieved perfect scores: ${gameState.meters.stability}% stability and ${gameState.meters.insight}% insight!`;
      
      case 'standard_victory':
        return `${baseMessage} Final scores: ${gameState.meters.stability}% stability and ${gameState.meters.insight}% insight.`;
      
      case 'critical_instability':
        return `${baseMessage} System stability has reached ${gameState.meters.stability}%. The debugging session must end.`;
      
      case 'low_stability_warning':
        return `${baseMessage} Current stability: ${gameState.meters.stability}%. Consider more careful approaches.`;
      
      default:
        return baseMessage;
    }
  }

  /**
   * Generate recommendations based on the triggered condition
   */
  private generateRecommendations(condition: GameCondition, gameState: GameState): string[] {
    const recommendations: string[] = [];

    switch (condition.type) {
      case 'victory':
        recommendations.push('Congratulations on completing the debugging journey!');
        recommendations.push('Consider sharing your knowledge with other developers');
        recommendations.push('Try the game again with different approaches to learn more');
        break;

      case 'game_over':
        recommendations.push('Don\'t worry - debugging is a skill that improves with practice');
        recommendations.push('Try asking more questions before making changes');
        recommendations.push('Consider the risks and benefits of each decision');
        recommendations.push('Start a new session to try different approaches');
        break;

      case 'warning':
        if (condition.id === 'low_stability_warning') {
          recommendations.push('Focus on safer, lower-risk changes');
          recommendations.push('Ask questions to better understand problems before acting');
          recommendations.push('Consider refactoring instead of quick patches');
        } else if (condition.id === 'slow_learning_warning') {
          recommendations.push('Try asking more questions during encounters');
          recommendations.push('Read the educational content more carefully');
          recommendations.push('Experiment with different approaches');
        } else if (condition.id === 'risky_behavior_warning') {
          recommendations.push('Take time to assess risks before making changes');
          recommendations.push('Consider the long-term impact of your decisions');
          recommendations.push('Use the questioning option more frequently');
        }
        break;
    }

    return recommendations;
  }

  /**
   * Helper methods for condition checking
   */
  private hasCompletedAllRooms(gameState: GameState): boolean {
    const allRooms = ['boot-sector', 'dependency-crypt', 'ghost-memory-heap', 'possessed-compiler', 'ethics-tribunal', 'final-merge'];
    return allRooms.every(room => gameState.unlockedRooms.includes(room));
  }

  private hasCompletedFinalMerge(gameState: GameState): boolean {
    return gameState.evidenceBoard.some(entry => 
      entry.context?.roomKey === 'final-merge' && entry.type === 'patch_applied'
    );
  }

  private hasHighQuestioningRate(gameState: GameState): boolean {
    const questionEntries = gameState.evidenceBoard.filter(entry => 
      entry.description.toLowerCase().includes('question')
    );
    return questionEntries.length >= gameState.evidenceBoard.length * 0.4; // 40% questioning rate
  }

  private hasHighFailureRate(gameState: GameState): boolean {
    const recentEntries = gameState.evidenceBoard.slice(-10);
    const failureEntries = recentEntries.filter(entry => 
      entry.effects && entry.effects.stability < 0
    );
    return failureEntries.length >= recentEntries.length * 0.7; // 70% failure rate
  }

  private hasLowLearningRate(gameState: GameState): boolean {
    const recentEntries = gameState.evidenceBoard.slice(-10);
    const totalInsightGain = recentEntries.reduce((sum, entry) => 
      sum + (entry.effects?.insight || 0), 0
    );
    return totalInsightGain <= 5; // Very low insight gain
  }

  private hasSlowInsightGrowth(gameState: GameState): boolean {
    const recentEntries = gameState.evidenceBoard.slice(-5);
    const insightGain = recentEntries.reduce((sum, entry) => 
      sum + (entry.effects?.insight || 0), 0
    );
    return insightGain <= 2; // Less than 2 insight in last 5 actions
  }

  private hasHighRiskPattern(gameState: GameState): boolean {
    const recentEntries = gameState.evidenceBoard.slice(-5);
    const highRiskEntries = recentEntries.filter(entry => 
      entry.effects && entry.effects.stability < -5 // Lost more than 5 stability
    );
    return highRiskEntries.length >= 3; // 3 or more high-risk decisions in last 5
  }

  /**
   * Reset triggered conditions (for new game)
   */
  resetConditions(): void {
    this.triggeredConditions.clear();
  }

  /**
   * Get all available conditions
   */
  getAllConditions(): GameCondition[] {
    return [...this.conditions];
  }

  /**
   * Check if a specific condition has been triggered
   */
  isConditionTriggered(conditionId: string): boolean {
    return this.triggeredConditions.has(conditionId);
  }
}