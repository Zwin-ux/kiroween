/**
 * Meter System - Manages Stability and Insight values with game over conditions
 */

import type { 
  GameState,
  MeterEffects
} from '@/types/game';
import { GameOverCondition, GameOutcome } from '@/types/game';
import type {
  HookContext,
  MCPTools
} from '@/types/kiro';

export class MeterSystem {
  private hooks: Map<string, MeterChangeHook[]> = new Map();
  private gameOverHandlers: Map<GameOverCondition, GameOverHandler[]> = new Map();

  constructor(private mcpTools: MCPTools) {
    this.initializeHooks();
    this.initializeGameOverHandlers();
  }

  /**
   * Apply meter effects to the game state
   */
  async applyEffects(effects: MeterEffects, gameState: GameState): Promise<GameState> {
    const previousStability = gameState.meters.stability;
    const previousInsight = gameState.meters.insight;

    // Calculate new values with bounds checking
    const newStability = this.clampValue(
      gameState.meters.stability + effects.stability,
      0,
      100
    );
    
    const newInsight = this.clampValue(
      gameState.meters.insight + effects.insight,
      0,
      100
    );

    // Create updated game state
    const updatedGameState: GameState = {
      ...gameState,
      meters: {
        stability: newStability,
        insight: newInsight
      },
      run: {
        ...gameState.run,
        finalStability: newStability,
        finalInsight: newInsight
      }
    };

    // Trigger meter change hooks
    await this.triggerMeterChangeHooks(
      previousStability,
      previousInsight,
      newStability,
      newInsight,
      effects,
      updatedGameState
    );

    // Add evidence entry for meter change
    const evidenceEntry = {
      type: 'meter_change' as const,
      description: effects.description,
      context: {
        previousStability,
        previousInsight,
        newStability,
        newInsight,
        stabilityChange: effects.stability,
        insightChange: effects.insight
      },
      effects
    };

    updatedGameState.evidenceBoard.push({
      ...evidenceEntry,
      id: `evidence_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date()
    });

    return updatedGameState;
  }

  /**
   * Check for game over conditions
   */
  checkGameOverConditions(gameState: GameState): GameOverCondition | null {
    // Check kernel panic (stability = 0)
    if (gameState.meters.stability <= 0) {
      return GameOverCondition.KernelPanic;
    }

    // Check moral inversion (ethics violation)
    const hasEthicsViolation = gameState.evidenceBoard.some(entry => 
      entry.context.ethicsViolation === true
    );
    if (hasEthicsViolation) {
      return GameOverCondition.MoralInversion;
    }

    // Check victory condition (final merge room + all ghosts resolved)
    if (gameState.currentRoom === 'final_merge') {
      const allGhostsResolved = this.checkAllGhostsResolved(gameState);
      const meetsThresholds = gameState.meters.stability >= 50 && gameState.meters.insight >= 60;
      
      if (allGhostsResolved && meetsThresholds) {
        return GameOverCondition.Victory;
      }
    }

    return null;
  }

  /**
   * Get meter status information
   */
  getMeterStatus(gameState: GameState): MeterStatus {
    const stability = gameState.meters.stability;
    const insight = gameState.meters.insight;

    return {
      stability: {
        value: stability,
        percentage: stability,
        status: this.getStabilityStatus(stability),
        criticalWarning: stability <= 20,
        warningThreshold: stability <= 40
      },
      insight: {
        value: insight,
        percentage: insight,
        status: this.getInsightStatus(insight),
        unlockedFeatures: this.getUnlockedFeatures(insight)
      },
      gameOverRisk: this.calculateGameOverRisk(gameState)
    };
  }

  /**
   * Calculate the risk of game over based on current state
   */
  calculateGameOverRisk(gameState: GameState): number {
    let risk = 0;

    // Stability risk (exponential as it approaches 0)
    const stabilityRisk = Math.pow((100 - gameState.meters.stability) / 100, 2);
    risk += stabilityRisk * 0.7;

    // Ethics violation risk
    const recentEthicsIssues = gameState.evidenceBoard
      .filter(entry => entry.context.ethicsWarning === true)
      .filter(entry => Date.now() - entry.timestamp.getTime() < 300000); // Last 5 minutes
    
    risk += Math.min(recentEthicsIssues.length * 0.1, 0.3);

    return Math.min(1.0, risk);
  }

  /**
   * Register a meter change hook
   */
  registerMeterChangeHook(eventType: string, hook: MeterChangeHook): void {
    const hooks = this.hooks.get(eventType) || [];
    hooks.push(hook);
    this.hooks.set(eventType, hooks);
  }

  /**
   * Register a game over handler
   */
  registerGameOverHandler(condition: GameOverCondition, handler: GameOverHandler): void {
    const handlers = this.gameOverHandlers.get(condition) || [];
    handlers.push(handler);
    this.gameOverHandlers.set(condition, handlers);
  }

  /**
   * Trigger game over sequence
   */
  async triggerGameOver(condition: GameOverCondition, gameState: GameState): Promise<void> {
    // Execute registered handlers
    const handlers = this.gameOverHandlers.get(condition) || [];
    for (const handler of handlers) {
      await handler(condition, gameState);
    }

    // Trigger appropriate sound effects
    await this.triggerGameOverEffects(condition);

    // Update game state with final outcome
    const outcome = this.mapConditionToOutcome(condition);
    gameState.run.outcome = outcome;
    gameState.run.endedAt = new Date();
  }

  /**
   * Get meter change history for analysis
   */
  getMeterHistory(gameState: GameState): MeterHistoryEntry[] {
    return gameState.evidenceBoard
      .filter(entry => entry.type === 'meter_change')
      .map(entry => ({
        timestamp: entry.timestamp,
        stabilityChange: entry.effects?.stability || 0,
        insightChange: entry.effects?.insight || 0,
        description: entry.description,
        context: entry.context
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Predict meter effects of a potential action
   */
  predictEffects(baseEffects: MeterEffects, gameState: GameState): MeterPrediction {
    const currentStability = gameState.meters.stability;
    const currentInsight = gameState.meters.insight;

    const predictedStability = this.clampValue(
      currentStability + baseEffects.stability,
      0,
      100
    );
    
    const predictedInsight = this.clampValue(
      currentInsight + baseEffects.insight,
      0,
      100
    );

    // Calculate risk factors
    const stabilityRisk = predictedStability < 20 ? 'high' : 
                         predictedStability < 40 ? 'medium' : 'low';
    
    const gameOverRisk = predictedStability <= 0;

    return {
      currentStability,
      currentInsight,
      predictedStability,
      predictedInsight,
      stabilityChange: baseEffects.stability,
      insightChange: baseEffects.insight,
      stabilityRisk,
      gameOverRisk,
      newFeaturesUnlocked: this.getNewUnlockedFeatures(currentInsight, predictedInsight)
    };
  }

  /**
   * Protected method to clamp values within bounds
   */
  protected clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Private method to trigger meter change hooks
   */
  private async triggerMeterChangeHooks(
    previousStability: number,
    previousInsight: number,
    newStability: number,
    newInsight: number,
    effects: MeterEffects,
    gameState: GameState
  ): Promise<void> {
    const hookContext: HookContext = {
      gameState,
      tools: this.mcpTools
    };

    // Trigger stability change hooks
    if (previousStability !== newStability) {
      const stabilityHooks = this.hooks.get('stability_change') || [];
      for (const hook of stabilityHooks) {
        await hook(previousStability, newStability, effects, hookContext);
      }

      // Trigger critical stability hooks
      if (newStability <= 20 && previousStability > 20) {
        const criticalHooks = this.hooks.get('stability_critical') || [];
        for (const hook of criticalHooks) {
          await hook(previousStability, newStability, effects, hookContext);
        }
      }
    }

    // Trigger insight change hooks
    if (previousInsight !== newInsight) {
      const insightHooks = this.hooks.get('insight_change') || [];
      for (const hook of insightHooks) {
        await hook(previousInsight, newInsight, effects, hookContext);
      }

      // Trigger insight threshold hooks
      const thresholds = [25, 50, 75];
      for (const threshold of thresholds) {
        if (previousInsight < threshold && newInsight >= threshold) {
          const thresholdHooks = this.hooks.get(`insight_threshold_${threshold}`) || [];
          for (const hook of thresholdHooks) {
            await hook(previousInsight, newInsight, effects, hookContext);
          }
        }
      }
    }
  }

  /**
   * Private method to get stability status
   */
  private getStabilityStatus(stability: number): string {
    if (stability <= 10) return 'Critical - System Collapse Imminent';
    if (stability <= 20) return 'Dangerous - Kernel Panic Risk';
    if (stability <= 40) return 'Unstable - Proceed with Caution';
    if (stability <= 60) return 'Moderate - Some Risk Present';
    if (stability <= 80) return 'Stable - Normal Operation';
    return 'Excellent - System Running Smoothly';
  }

  /**
   * Private method to get insight status
   */
  private getInsightStatus(insight: number): string {
    if (insight < 25) return 'Novice - Basic Understanding';
    if (insight < 50) return 'Intermediate - Growing Knowledge';
    if (insight < 75) return 'Advanced - Deep Understanding';
    return 'Expert - Master of the Cursed Code';
  }

  /**
   * Private method to get unlocked features based on insight
   */
  private getUnlockedFeatures(insight: number): string[] {
    const features: string[] = [];
    
    if (insight >= 25) features.push('Basic Lore');
    if (insight >= 50) features.push('Advanced Dialogue', 'Ghost Hints');
    if (insight >= 75) features.push('Deep Lore', 'Secret Paths');
    
    return features;
  }

  /**
   * Private method to get newly unlocked features
   */
  private getNewUnlockedFeatures(currentInsight: number, newInsight: number): string[] {
    const currentFeatures = this.getUnlockedFeatures(currentInsight);
    const newFeatures = this.getUnlockedFeatures(newInsight);
    
    return newFeatures.filter(feature => !currentFeatures.includes(feature));
  }

  /**
   * Private method to check if all ghosts are resolved
   */
  private checkAllGhostsResolved(gameState: GameState): boolean {
    // This would need to track ghost resolution in game state
    // For now, we'll check if there are enough successful patch applications
    const successfulPatches = gameState.evidenceBoard.filter(entry => 
      entry.type === 'patch_applied' && entry.context.success === true
    );
    
    // Assume we need at least 8 successful patches (one per ghost type)
    return successfulPatches.length >= 8;
  }

  /**
   * Private method to trigger game over effects
   */
  private async triggerGameOverEffects(condition: GameOverCondition): Promise<void> {
    try {
      switch (condition) {
        case GameOverCondition.KernelPanic:
          await this.mcpTools.sfx.queue({
            type: 'sfx',
            sound: 'system_crash',
            volume: 0.8
          });
          break;
        case GameOverCondition.MoralInversion:
          await this.mcpTools.sfx.queue({
            type: 'sfx',
            sound: 'ethics_violation',
            volume: 0.7
          });
          break;
        case GameOverCondition.Victory:
          await this.mcpTools.sfx.queue({
            type: 'sfx',
            sound: 'victory_fanfare',
            volume: 0.9
          });
          break;
      }
    } catch (error) {
      console.error('Error triggering game over effects:', error);
    }
  }

  /**
   * Private method to map condition to outcome
   */
  private mapConditionToOutcome(condition: GameOverCondition): GameOutcome {
    switch (condition) {
      case GameOverCondition.KernelPanic:
        return GameOutcome.KernelPanic;
      case GameOverCondition.MoralInversion:
        return GameOutcome.MoralInversion;
      case GameOverCondition.Victory:
        return GameOutcome.Victory;
      default:
        return GameOutcome.KernelPanic;
    }
  }

  /**
   * Private method to initialize hooks
   */
  private initializeHooks(): void {
    this.hooks.set('stability_change', []);
    this.hooks.set('stability_critical', []);
    this.hooks.set('insight_change', []);
    this.hooks.set('insight_threshold_25', []);
    this.hooks.set('insight_threshold_50', []);
    this.hooks.set('insight_threshold_75', []);
  }

  /**
   * Private method to initialize game over handlers
   */
  private initializeGameOverHandlers(): void {
    this.gameOverHandlers.set(GameOverCondition.KernelPanic, []);
    this.gameOverHandlers.set(GameOverCondition.MoralInversion, []);
    this.gameOverHandlers.set(GameOverCondition.Victory, []);
  }
}

// Supporting interfaces
interface MeterStatus {
  stability: {
    value: number;
    percentage: number;
    status: string;
    criticalWarning: boolean;
    warningThreshold: boolean;
  };
  insight: {
    value: number;
    percentage: number;
    status: string;
    unlockedFeatures: string[];
  };
  gameOverRisk: number;
}

interface MeterHistoryEntry {
  timestamp: Date;
  stabilityChange: number;
  insightChange: number;
  description: string;
  context: any;
}

interface MeterPrediction {
  currentStability: number;
  currentInsight: number;
  predictedStability: number;
  predictedInsight: number;
  stabilityChange: number;
  insightChange: number;
  stabilityRisk: 'low' | 'medium' | 'high';
  gameOverRisk: boolean;
  newFeaturesUnlocked: string[];
}

type MeterChangeHook = (
  previousValue: number,
  newValue: number,
  effects: MeterEffects,
  context: HookContext
) => Promise<void>;

type GameOverHandler = (
  condition: GameOverCondition,
  gameState: GameState
) => Promise<void>;