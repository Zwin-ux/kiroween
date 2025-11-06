/**
 * RoomProgressionSystem - Manages room unlock conditions, victory conditions, and adaptive difficulty
 */

import type { GameContext, NavigationState } from '@/types/game';
import type { Room } from '@/types/content';
import { EventManager, GameEventType } from './EventManager';
import { NavigationManagerImpl, UnlockCondition } from './NavigationManager';
import { gameplayHooks, type RoomProgressionContext } from './GameplayHooks';

export interface ProgressionRule {
  id: string;
  type: 'unlock' | 'victory' | 'completion';
  targetRoomId?: string;
  conditions: ProgressionCondition[];
  description: string;
  priority: number;
}

export interface ProgressionCondition {
  type: 'encounters_completed' | 'meter_threshold' | 'evidence_collected' | 'room_completed' | 'time_elapsed' | 'all_ghosts_resolved' | 'no_ethics_violations';
  value: any;
  roomId?: string;
  description: string;
}

export interface ProgressionStatus {
  ruleId: string;
  isMet: boolean;
  progress: number;
  maxProgress: number;
  nextRequirement?: string;
  estimatedTimeToComplete?: number;
}

export interface VictoryCondition {
  id: string;
  description: string;
  condition: ProgressionCondition;
  isMet: boolean;
  progress: number;
}

export interface PlayerStatistics {
  encountersStarted: number;
  encountersCompleted: number;
  patchesApplied: number;
  patchesRefactored: number;
  questionsAsked: number;
  averageRiskTolerance: number;
  learningTopicsMastered: string[];
  preferredDebuggingStyle: DebuggingStyle;
  totalPlayTime: number;
  roomsVisited: number;
  successRate: number;
  averageCompletionTime: number;
  ethicsViolations: number;
  hintsUsed: number;
}

export enum DebuggingStyle {
  Cautious = 'cautious',      // Prefers low-risk patches and lots of questions
  Aggressive = 'aggressive',   // Applies high-risk patches quickly
  Analytical = 'analytical',   // Focuses on understanding before acting
  Experimental = 'experimental' // Tries multiple approaches
}

export interface DifficultySettings {
  ghostComplexity: number;     // 0.0 to 1.0
  patchRiskMultiplier: number; // 0.5 to 2.0
  hintAvailability: number;    // 0.0 to 1.0
  timeConstraints: boolean;
  adaptiveAssistance: boolean;
  educationalDepth: number;    // 0.0 to 1.0
}

export interface RoomCompletionTracking {
  roomId: string;
  startTime: Date;
  endTime?: Date;
  ghostsEncountered: number;
  ghostsResolved: number;
  patchesApplied: number;
  questionsAsked: number;
  hintsUsed: number;
  meterChanges: { stability: number; insight: number };
  completionStatus: 'in_progress' | 'completed' | 'abandoned';
  difficultyLevel: number;
}

export class RoomProgressionSystem {
  private progressionRules: Map<string, ProgressionRule> = new Map();
  private victoryConditions: VictoryCondition[] = [];
  private playerStatistics: PlayerStatistics = {} as PlayerStatistics;
  private difficultySettings: DifficultySettings = {} as DifficultySettings;
  private roomCompletionTracking: Map<string, RoomCompletionTracking> = new Map();

  constructor(
    private navigationManager: NavigationManagerImpl,
    private eventManager: EventManager
  ) {
    this.initializeProgressionRules();
    this.initializeVictoryConditions();
    this.initializePlayerStatistics();
    this.initializeDifficultySettings();
    
    // Initialize gameplay hooks
    gameplayHooks.initialize().catch(error => {
      console.warn('Failed to initialize gameplay hooks in RoomProgressionSystem:', error);
    });
  }

  /**
   * Initialize progression rules for room unlocking
   */
  private initializeProgressionRules(): void {
    const rules: ProgressionRule[] = [
      // Boot Sector -> Dependency Crypt
      {
        id: 'unlock_dependency_crypt',
        type: 'unlock',
        targetRoomId: 'dependency-crypt',
        conditions: [
          {
            type: 'encounters_completed',
            value: 1,
            roomId: 'boot-sector',
            description: 'Complete at least one ghost encounter in Boot Sector'
          },
          {
            type: 'meter_threshold',
            value: { stability: 40 },
            description: 'Maintain system stability above 40'
          }
        ],
        description: 'Unlock Dependency Crypt after stabilizing boot sequence',
        priority: 1
      },

      // Dependency Crypt -> Ghost Memory Heap
      {
        id: 'unlock_ghost_memory_heap',
        type: 'unlock',
        targetRoomId: 'ghost-memory-heap',
        conditions: [
          {
            type: 'room_completed',
            value: 'dependency-crypt',
            description: 'Complete all objectives in Dependency Crypt'
          },
          {
            type: 'meter_threshold',
            value: { insight: 30 },
            description: 'Gain sufficient insight into system architecture'
          }
        ],
        description: 'Unlock Ghost Memory Heap after understanding dependencies',
        priority: 2
      },

      // Ghost Memory Heap -> Possessed Compiler
      {
        id: 'unlock_possessed_compiler',
        type: 'unlock',
        targetRoomId: 'possessed-compiler',
        conditions: [
          {
            type: 'room_completed',
            value: 'ghost-memory-heap',
            description: 'Complete all objectives in Ghost Memory Heap'
          },
          {
            type: 'encounters_completed',
            value: 3,
            description: 'Complete at least 3 ghost encounters total'
          },
          {
            type: 'meter_threshold',
            value: { stability: 30 },
            description: 'Maintain minimum system stability'
          }
        ],
        description: 'Unlock Possessed Compiler after cleaning memory issues',
        priority: 3
      },

      // Possessed Compiler -> Ethics Tribunal
      {
        id: 'unlock_ethics_tribunal',
        type: 'unlock',
        targetRoomId: 'ethics-tribunal',
        conditions: [
          {
            type: 'room_completed',
            value: 'possessed-compiler',
            description: 'Complete all objectives in Possessed Compiler'
          },
          {
            type: 'meter_threshold',
            value: { insight: 60, stability: 40 },
            description: 'Demonstrate both wisdom and system stability'
          },
          {
            type: 'no_ethics_violations',
            value: 0,
            description: 'Maintain ethical standards throughout journey'
          }
        ],
        description: 'Unlock Ethics Tribunal after proving technical and moral competence',
        priority: 4
      },

      // Ethics Tribunal -> Final Merge
      {
        id: 'unlock_final_merge',
        type: 'unlock',
        targetRoomId: 'final-merge',
        conditions: [
          {
            type: 'room_completed',
            value: 'ethics-tribunal',
            description: 'Complete all objectives in Ethics Tribunal'
          },
          {
            type: 'meter_threshold',
            value: { insight: 80, stability: 50 },
            description: 'Achieve high insight and stability for final challenge'
          },
          {
            type: 'encounters_completed',
            value: 8,
            description: 'Complete encounters across all previous areas'
          }
        ],
        description: 'Unlock Final Merge after proving readiness for ultimate challenge',
        priority: 5
      }
    ];

    // Populate rules map
    for (const rule of rules) {
      this.progressionRules.set(rule.id, rule);
    }
  }

  /**
   * Initialize victory conditions
   */
  private initializeVictoryConditions(): void {
    this.victoryConditions = [
      {
        id: 'final_merge_completed',
        description: 'Complete the Final Merge successfully',
        condition: {
          type: 'room_completed',
          value: 'final-merge',
          description: 'Successfully resolve all conflicts in Final Merge'
        },
        isMet: false,
        progress: 0
      },
      {
        id: 'minimum_stability',
        description: 'Maintain minimum system stability',
        condition: {
          type: 'meter_threshold',
          value: { stability: 50 },
          description: 'Keep system stability at or above 50'
        },
        isMet: false,
        progress: 0
      },
      {
        id: 'sufficient_insight',
        description: 'Achieve sufficient understanding',
        condition: {
          type: 'meter_threshold',
          value: { insight: 60 },
          description: 'Reach insight level of 60 or higher'
        },
        isMet: false,
        progress: 0
      },
      {
        id: 'ethical_conduct',
        description: 'Maintain ethical standards',
        condition: {
          type: 'no_ethics_violations',
          value: 0,
          description: 'Complete the game without ethical violations'
        },
        isMet: false,
        progress: 0
      }
    ];
  }

  /**
   * Check all progression rules and return status
   */
  checkProgressionStatus(context: GameContext): ProgressionStatus[] {
    const statuses: ProgressionStatus[] = [];

    for (const rule of this.progressionRules.values()) {
      const status = this.evaluateProgressionRule(rule, context);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Process unlock conditions and unlock rooms if criteria are met
   */
  processUnlockConditions(context: GameContext): string[] {
    const newlyUnlockedRooms: string[] = [];

    for (const rule of this.progressionRules.values()) {
      if (rule.type !== 'unlock' || !rule.targetRoomId) {
        continue;
      }

      // Skip if room is already unlocked
      const navigationState = context.gameState.systemStates.navigation;
      if (navigationState.unlockedRooms.includes(rule.targetRoomId)) {
        continue;
      }

      // Check if all conditions are met
      const allConditionsMet = rule.conditions.every(condition =>
        this.evaluateProgressionCondition(condition, context)
      );

      if (allConditionsMet) {
        // Unlock the room
        const unlockCondition: UnlockCondition = {
          type: 'encounters_completed', // Default type
          value: rule.conditions[0].value,
          description: rule.description
        };

        this.navigationManager.unlockRoom(rule.targetRoomId, unlockCondition);
        newlyUnlockedRooms.push(rule.targetRoomId);

        // Emit progression event
        this.eventManager.emit({
          type: GameEventType.CONTENT_UNLOCKED,
          timestamp: new Date(),
          source: 'RoomProgressionSystem',
          data: {
            ruleId: rule.id,
            roomId: rule.targetRoomId,
            conditions: rule.conditions
          },
          priority: 'high'
        });
      }
    }

    return newlyUnlockedRooms;
  }

  /**
   * Check victory conditions
   */
  checkVictoryConditions(context: GameContext): { isVictory: boolean; conditions: VictoryCondition[] } {
    let allConditionsMet = true;

    for (const condition of this.victoryConditions) {
      const isMet = this.evaluateProgressionCondition(condition.condition, context);
      const progress = this.calculateConditionProgress(condition.condition, context);

      condition.isMet = isMet;
      condition.progress = progress;

      if (!isMet) {
        allConditionsMet = false;
      }
    }

    return {
      isVictory: allConditionsMet,
      conditions: [...this.victoryConditions]
    };
  }

  /**
   * Get next unlock requirements for a specific room
   */
  getNextUnlockRequirements(roomId: string, context: GameContext): string[] {
    const requirements: string[] = [];

    for (const rule of this.progressionRules.values()) {
      if (rule.type === 'unlock' && rule.targetRoomId === roomId) {
        for (const condition of rule.conditions) {
          if (!this.evaluateProgressionCondition(condition, context)) {
            requirements.push(condition.description);
          }
        }
        break;
      }
    }

    return requirements;
  }

  /**
   * Get overall progression percentage
   */
  getOverallProgress(context: GameContext): number {
    const navigationState = context.gameState.systemStates.navigation;
    const totalRooms = 6; // Boot Sector, Dependency Crypt, Ghost Memory Heap, Possessed Compiler, Ethics Tribunal, Final Merge
    const unlockedRooms = navigationState.unlockedRooms.length;

    return Math.min(100, (unlockedRooms / totalRooms) * 100);
  }

  /**
   * Evaluate a single progression rule
   */
  private evaluateProgressionRule(rule: ProgressionRule, context: GameContext): ProgressionStatus {
    let metConditions = 0;
    let nextRequirement: string | undefined;

    for (const condition of rule.conditions) {
      if (this.evaluateProgressionCondition(condition, context)) {
        metConditions++;
      } else if (!nextRequirement) {
        nextRequirement = condition.description;
      }
    }

    const progress = (metConditions / rule.conditions.length) * 100;
    const isMet = metConditions === rule.conditions.length;

    return {
      ruleId: rule.id,
      isMet,
      progress,
      maxProgress: 100,
      nextRequirement,
      estimatedTimeToComplete: this.estimateTimeToComplete(rule, context)
    };
  }

  /**
   * Evaluate a single progression condition
   */
  private evaluateProgressionCondition(condition: ProgressionCondition, context: GameContext): boolean {
    switch (condition.type) {
      case 'encounters_completed':
        const completedEncounters = context.gameState.evidenceBoard.filter(entry =>
          entry.type === 'ghost_encountered' && 
          entry.context.resolved === true &&
          (!condition.roomId || entry.context.roomId === condition.roomId)
        ).length;
        return completedEncounters >= condition.value;

      case 'meter_threshold':
        const { stability, insight } = condition.value;
        const meetsStability = !stability || context.gameState.meters.stability >= stability;
        const meetsInsight = !insight || context.gameState.meters.insight >= insight;
        return meetsStability && meetsInsight;

      case 'evidence_collected':
        return context.gameState.evidenceBoard.length >= condition.value;

      case 'room_completed':
        return this.navigationManager.checkRoomCompletion(condition.value, context);

      case 'time_elapsed':
        const elapsed = Date.now() - new Date(context.gameState.run.startedAt).getTime();
        return elapsed >= condition.value;

      case 'all_ghosts_resolved':
        const roomId = condition.roomId || context.gameState.currentRoom;
        // This would need integration with GhostManager to check if all ghosts in a room are resolved
        return true; // Placeholder

      case 'no_ethics_violations':
        const ethicsViolations = context.gameState.evidenceBoard.filter(entry =>
          entry.type === 'ethics_violation'
        ).length;
        return ethicsViolations <= condition.value;

      default:
        console.warn(`Unknown progression condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Calculate progress percentage for a condition
   */
  private calculateConditionProgress(condition: ProgressionCondition, context: GameContext): number {
    switch (condition.type) {
      case 'encounters_completed':
        const completedEncounters = context.gameState.evidenceBoard.filter(entry =>
          entry.type === 'ghost_encountered' && entry.context.resolved === true
        ).length;
        return Math.min(100, (completedEncounters / condition.value) * 100);

      case 'meter_threshold':
        const { stability, insight } = condition.value;
        let progress = 0;
        let totalMetrics = 0;

        if (stability) {
          progress += Math.min(100, (context.gameState.meters.stability / stability) * 100);
          totalMetrics++;
        }

        if (insight) {
          progress += Math.min(100, (context.gameState.meters.insight / insight) * 100);
          totalMetrics++;
        }

        return totalMetrics > 0 ? progress / totalMetrics : 100;

      case 'evidence_collected':
        return Math.min(100, (context.gameState.evidenceBoard.length / condition.value) * 100);

      case 'room_completed':
        return this.navigationManager.checkRoomCompletion(condition.value, context) ? 100 : 0;

      case 'no_ethics_violations':
        const ethicsViolations = context.gameState.evidenceBoard.filter(entry =>
          entry.type === 'ethics_violation'
        ).length;
        return ethicsViolations <= condition.value ? 100 : 0;

      default:
        return 0;
    }
  }

  /**
   * Initialize player statistics
   */
  private initializePlayerStatistics(): void {
    this.playerStatistics = {
      encountersStarted: 0,
      encountersCompleted: 0,
      patchesApplied: 0,
      patchesRefactored: 0,
      questionsAsked: 0,
      averageRiskTolerance: 0.5,
      learningTopicsMastered: [],
      preferredDebuggingStyle: DebuggingStyle.Analytical,
      totalPlayTime: 0,
      roomsVisited: 0,
      successRate: 0,
      averageCompletionTime: 0,
      ethicsViolations: 0,
      hintsUsed: 0
    };
  }

  /**
   * Initialize difficulty settings
   */
  private initializeDifficultySettings(): void {
    this.difficultySettings = {
      ghostComplexity: 0.5,
      patchRiskMultiplier: 1.0,
      hintAvailability: 0.8,
      timeConstraints: false,
      adaptiveAssistance: true,
      educationalDepth: 0.7
    };
  }

  /**
   * Update player statistics based on game events
   */
  updatePlayerStatistics(context: GameContext): void {
    const evidenceBoard = context.gameState.evidenceBoard;
    const currentTime = new Date();
    const gameStartTime = new Date(context.gameState.run.startedAt);
    
    // Update basic counters
    this.playerStatistics.encountersStarted = evidenceBoard.filter(e => 
      e.type === 'ghost_encountered'
    ).length;
    
    this.playerStatistics.encountersCompleted = evidenceBoard.filter(e => 
      e.type === 'ghost_encountered' && e.context.resolved === true
    ).length;
    
    this.playerStatistics.patchesApplied = evidenceBoard.filter(e => 
      e.type === 'patch_applied'
    ).length;
    
    this.playerStatistics.ethicsViolations = evidenceBoard.filter(e => 
      e.type === 'ethics_violation'
    ).length;
    
    // Calculate success rate
    if (this.playerStatistics.encountersStarted > 0) {
      this.playerStatistics.successRate = 
        this.playerStatistics.encountersCompleted / this.playerStatistics.encountersStarted;
    }
    
    // Update total play time
    this.playerStatistics.totalPlayTime = 
      (currentTime.getTime() - gameStartTime.getTime()) / (1000 * 60); // minutes
    
    // Update rooms visited
    this.playerStatistics.roomsVisited = new Set(
      evidenceBoard.filter(e => e.type === 'room_entered').map(e => e.context.roomId)
    ).size;
    
    // Determine debugging style based on behavior patterns
    this.updateDebuggingStyle(context);
    
    // Calculate average risk tolerance
    this.calculateAverageRiskTolerance(context);
  }

  /**
   * Calculate and adjust difficulty based on player performance
   */
  calculateAdaptiveDifficulty(context: GameContext): DifficultySettings {
    this.updatePlayerStatistics(context);
    
    const stats = this.playerStatistics;
    const newSettings = { ...this.difficultySettings };
    
    // Adjust ghost complexity based on success rate
    if (stats.successRate > 0.8 && stats.encountersCompleted >= 3) {
      // Player is doing well, increase difficulty
      newSettings.ghostComplexity = Math.min(1.0, newSettings.ghostComplexity + 0.1);
      newSettings.patchRiskMultiplier = Math.min(2.0, newSettings.patchRiskMultiplier + 0.1);
      newSettings.hintAvailability = Math.max(0.3, newSettings.hintAvailability - 0.1);
    } else if (stats.successRate < 0.4 && stats.encountersCompleted >= 2) {
      // Player is struggling, decrease difficulty
      newSettings.ghostComplexity = Math.max(0.2, newSettings.ghostComplexity - 0.1);
      newSettings.patchRiskMultiplier = Math.max(0.5, newSettings.patchRiskMultiplier - 0.1);
      newSettings.hintAvailability = Math.min(1.0, newSettings.hintAvailability + 0.1);
    }
    
    // Adjust educational depth based on learning progress
    if (stats.learningTopicsMastered.length > 5) {
      newSettings.educationalDepth = Math.max(0.3, newSettings.educationalDepth - 0.1);
    } else if (stats.questionsAsked > stats.patchesApplied * 2) {
      newSettings.educationalDepth = Math.min(1.0, newSettings.educationalDepth + 0.1);
    }
    
    // Enable adaptive assistance for struggling players
    newSettings.adaptiveAssistance = stats.successRate < 0.6 || stats.hintsUsed > 5;
    
    this.difficultySettings = newSettings;
    
    // Emit difficulty adjustment event
    this.eventManager.emit({
      type: GameEventType.CONTENT_UNLOCKED,
      timestamp: new Date(),
      source: 'RoomProgressionSystem',
      data: {
        type: 'difficulty_adjustment',
        oldSettings: this.difficultySettings,
        newSettings,
        playerStats: stats
      },
      priority: 'medium'
    });
    
    return newSettings;
  }

  /**
   * Start tracking room completion
   */
  startRoomCompletion(roomId: string, context: GameContext): void {
    const tracking: RoomCompletionTracking = {
      roomId,
      startTime: new Date(),
      ghostsEncountered: 0,
      ghostsResolved: 0,
      patchesApplied: 0,
      questionsAsked: 0,
      hintsUsed: 0,
      meterChanges: { stability: 0, insight: 0 },
      completionStatus: 'in_progress',
      difficultyLevel: this.difficultySettings.ghostComplexity
    };
    
    this.roomCompletionTracking.set(roomId, tracking);
  }

  /**
   * Update room completion tracking
   */
  updateRoomCompletion(roomId: string, context: GameContext): void {
    const tracking = this.roomCompletionTracking.get(roomId);
    if (!tracking) return;
    
    // Count room-specific events from evidence board
    const roomEvents = context.gameState.evidenceBoard.filter(e => 
      e.context.roomId === roomId
    );
    
    tracking.ghostsEncountered = roomEvents.filter(e => 
      e.type === 'ghost_encountered'
    ).length;
    
    tracking.ghostsResolved = roomEvents.filter(e => 
      e.type === 'ghost_encountered' && e.context.resolved === true
    ).length;
    
    tracking.patchesApplied = roomEvents.filter(e => 
      e.type === 'patch_applied'
    ).length;
    
    // Calculate meter changes since room start
    const initialMeters = { stability: 50, insight: 0 }; // Default starting values
    tracking.meterChanges = {
      stability: context.gameState.meters.stability - initialMeters.stability,
      insight: context.gameState.meters.insight - initialMeters.insight
    };
  }

  /**
   * Complete room tracking
   */
  completeRoomTracking(roomId: string, status: 'completed' | 'abandoned'): void {
    const tracking = this.roomCompletionTracking.get(roomId);
    if (!tracking) return;
    
    tracking.endTime = new Date();
    tracking.completionStatus = status;
    
    // Calculate average completion time
    if (status === 'completed' && tracking.endTime) {
      const completionTime = (tracking.endTime.getTime() - tracking.startTime.getTime()) / (1000 * 60);
      this.playerStatistics.averageCompletionTime = 
        (this.playerStatistics.averageCompletionTime + completionTime) / 2;
    }
  }

  /**
   * Get current player statistics
   */
  getPlayerStatistics(): PlayerStatistics {
    return { ...this.playerStatistics };
  }

  /**
   * Get current difficulty settings
   */
  getDifficultySettings(): DifficultySettings {
    return { ...this.difficultySettings };
  }

  /**
   * Get room completion tracking
   */
  getRoomCompletionTracking(roomId: string): RoomCompletionTracking | undefined {
    return this.roomCompletionTracking.get(roomId);
  }

  /**
   * Check if player needs hints based on performance
   */
  shouldProvideHints(context: GameContext): boolean {
    this.updatePlayerStatistics(context);
    
    const stats = this.playerStatistics;
    
    // Provide hints if:
    // - Success rate is low
    // - Player has been stuck for a while
    // - Adaptive assistance is enabled
    return (
      stats.successRate < 0.5 ||
      stats.hintsUsed < 3 ||
      this.difficultySettings.adaptiveAssistance
    ) && this.difficultySettings.hintAvailability > 0.5;
  }

  /**
   * Update debugging style based on player behavior
   */
  private updateDebuggingStyle(context: GameContext): void {
    const stats = this.playerStatistics;
    
    if (stats.patchesApplied === 0) {
      return; // Not enough data
    }
    
    const questionToPatchRatio = stats.questionsAsked / stats.patchesApplied;
    const riskTolerance = stats.averageRiskTolerance;
    
    if (questionToPatchRatio > 2 && riskTolerance < 0.4) {
      this.playerStatistics.preferredDebuggingStyle = DebuggingStyle.Cautious;
    } else if (questionToPatchRatio < 0.5 && riskTolerance > 0.7) {
      this.playerStatistics.preferredDebuggingStyle = DebuggingStyle.Aggressive;
    } else if (questionToPatchRatio > 1.5) {
      this.playerStatistics.preferredDebuggingStyle = DebuggingStyle.Analytical;
    } else {
      this.playerStatistics.preferredDebuggingStyle = DebuggingStyle.Experimental;
    }
  }

  /**
   * Calculate average risk tolerance from patch applications
   */
  private calculateAverageRiskTolerance(context: GameContext): void {
    const patchEvents = context.gameState.evidenceBoard.filter(e => 
      e.type === 'patch_applied'
    );
    
    if (patchEvents.length === 0) return;
    
    const totalRisk = patchEvents.reduce((sum, event) => {
      return sum + (event.context.riskScore || 0.5);
    }, 0);
    
    this.playerStatistics.averageRiskTolerance = totalRisk / patchEvents.length;
  }

  /**
   * Estimate time to complete a progression rule (in minutes)
   */
  private estimateTimeToComplete(rule: ProgressionRule, context: GameContext): number {
    // Enhanced estimation based on player statistics and difficulty
    const status = this.evaluateProgressionRule(rule, context);
    
    if (status.isMet) {
      return 0;
    }

    // Base time estimates per condition type, adjusted for player skill
    const baseTimePerCondition = 5; // 5 minutes per condition
    const skillMultiplier = Math.max(0.5, 2 - this.playerStatistics.successRate);
    const difficultyMultiplier = 0.5 + this.difficultySettings.ghostComplexity;
    
    const remainingConditions = rule.conditions.length - (status.progress / 100 * rule.conditions.length);
    const adjustedTime = remainingConditions * baseTimePerCondition * skillMultiplier * difficultyMultiplier;
    
    return Math.ceil(adjustedTime);
  }

  /**
   * Helper methods for hook integration
   */
  private getCompletedGhosts(context: GameContext): string[] {
    // Extract completed ghosts from game state
    // This is a simplified implementation - in reality would track actual ghost completions
    return ['circular_dependency', 'stale_cache']; // Placeholder
  }

  private convertPlayerStatsForHooks(): any {
    return {
      encountersCompleted: this.playerStatistics.encountersCompleted,
      patchesApplied: this.playerStatistics.patchesApplied,
      questionsAsked: this.playerStatistics.questionsAsked,
      averageRiskTolerance: this.playerStatistics.averageRiskTolerance,
      successRate: this.playerStatistics.successRate,
      learningStyle: this.mapDebuggingStyleToLearningStyle(this.playerStatistics.preferredDebuggingStyle),
      conceptsMastered: this.playerStatistics.learningTopicsMastered,
      preferredApproaches: [this.playerStatistics.preferredDebuggingStyle]
    };
  }

  private getUnlockedContent(context: GameContext): string[] {
    // Extract unlocked content from game state
    return context.gameState.systemStates.navigation.unlockedRooms;
  }

  private applyRoomAdaptations(roomId: string, adaptations: any): void {
    // Apply room-specific adaptations based on hook recommendations
    if (adaptations.adaptedDifficulty !== undefined) {
      this.difficultySettings.ghostComplexity = adaptations.adaptedDifficulty;
    }
    
    if (adaptations.recommendations) {
      console.log(`Room ${roomId} adaptations:`, adaptations.recommendations);
    }
  }

  private updatePlayerSkillAssessment(skillAssessment: any): void {
    // Update player statistics based on skill assessment
    if (skillAssessment.debugging !== undefined) {
      this.playerStatistics.successRate = skillAssessment.debugging;
    }
    
    if (skillAssessment.overallCompetency !== undefined) {
      // Adjust difficulty settings based on competency
      this.difficultySettings.ghostComplexity = skillAssessment.overallCompetency;
    }
  }

  private mapDebuggingStyleToLearningStyle(style: DebuggingStyle): 'analytical' | 'practical' | 'experimental' | 'cautious' {
    const mapping = {
      [DebuggingStyle.Analytical]: 'analytical' as const,
      [DebuggingStyle.Aggressive]: 'practical' as const,
      [DebuggingStyle.Experimental]: 'experimental' as const,
      [DebuggingStyle.Cautious]: 'cautious' as const
    };
    
    return mapping[style] || 'analytical';
  }
}