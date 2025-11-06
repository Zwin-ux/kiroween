/**
 * AdaptiveDifficultySystem - Manages dynamic difficulty adjustment based on player performance
 */

import type { GameContext } from '@/types/game';
import { EventManager, GameEventType } from './EventManager';

export interface DifficultyProfile {
  id: string;
  name: string;
  description: string;
  settings: DifficultySettings;
  targetSuccessRate: number;
  adaptationSpeed: number;
}

export interface DifficultySettings {
  ghostComplexity: number;     // 0.0 to 1.0 - affects ghost behavior complexity
  patchRiskMultiplier: number; // 0.5 to 2.0 - multiplies patch risk scores
  hintAvailability: number;    // 0.0 to 1.0 - how often hints are offered
  timeConstraints: boolean;    // whether time limits are enforced
  adaptiveAssistance: boolean; // whether system provides adaptive help
  educationalDepth: number;    // 0.0 to 1.0 - depth of educational content
  errorTolerance: number;      // 0.0 to 1.0 - how forgiving the system is
  feedbackFrequency: number;   // 0.0 to 1.0 - how often feedback is provided
}

export interface PlayerPerformanceMetrics {
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

export interface StruggleIndicator {
  type: 'repeated_failures' | 'excessive_hints' | 'long_completion_times' | 'low_engagement' | 'confusion_patterns';
  severity: number; // 0.0 to 1.0
  description: string;
  detectedAt: Date;
  suggestions: string[];
}

export interface DifficultyAdjustment {
  timestamp: Date;
  reason: string;
  oldSettings: DifficultySettings;
  newSettings: DifficultySettings;
  expectedImpact: string;
  playerFeedback?: string;
}

export interface HintSystem {
  contextualHints: Map<string, string[]>;
  adaptiveHints: Map<string, string[]>;
  strugglingPlayerHints: Map<string, string[]>;
  hintUsageTracking: Map<string, number>;
}

export class AdaptiveDifficultySystem {
  private currentSettings: DifficultySettings;
  private difficultyProfiles: Map<string, DifficultyProfile> = new Map();
  private adjustmentHistory: DifficultyAdjustment[] = [];
  private performanceHistory: PlayerPerformanceMetrics[] = [];
  private hintSystem: HintSystem = {} as HintSystem;
  private lastAdjustmentTime: Date = new Date();
  private adjustmentCooldown: number = 60000; // 1 minute between adjustments

  constructor(private eventManager: EventManager) {
    this.initializeDifficultyProfiles();
    this.initializeHintSystem();
    this.currentSettings = this.difficultyProfiles.get('balanced')!.settings;
  }

  /**
   * Initialize predefined difficulty profiles
   */
  private initializeDifficultyProfiles(): void {
    const profiles: DifficultyProfile[] = [
      {
        id: 'beginner',
        name: 'Beginner',
        description: 'Gentle introduction with lots of guidance',
        settings: {
          ghostComplexity: 0.3,
          patchRiskMultiplier: 0.7,
          hintAvailability: 0.9,
          timeConstraints: false,
          adaptiveAssistance: true,
          educationalDepth: 0.8,
          errorTolerance: 0.8,
          feedbackFrequency: 0.9
        },
        targetSuccessRate: 0.8,
        adaptationSpeed: 0.3
      },
      {
        id: 'balanced',
        name: 'Balanced',
        description: 'Standard difficulty with moderate assistance',
        settings: {
          ghostComplexity: 0.5,
          patchRiskMultiplier: 1.0,
          hintAvailability: 0.6,
          timeConstraints: false,
          adaptiveAssistance: true,
          educationalDepth: 0.7,
          errorTolerance: 0.6,
          feedbackFrequency: 0.7
        },
        targetSuccessRate: 0.65,
        adaptationSpeed: 0.5
      },
      {
        id: 'challenging',
        name: 'Challenging',
        description: 'Higher difficulty with minimal assistance',
        settings: {
          ghostComplexity: 0.7,
          patchRiskMultiplier: 1.3,
          hintAvailability: 0.4,
          timeConstraints: true,
          adaptiveAssistance: false,
          educationalDepth: 0.5,
          errorTolerance: 0.4,
          feedbackFrequency: 0.5
        },
        targetSuccessRate: 0.5,
        adaptationSpeed: 0.7
      },
      {
        id: 'expert',
        name: 'Expert',
        description: 'Maximum difficulty for experienced players',
        settings: {
          ghostComplexity: 0.9,
          patchRiskMultiplier: 1.6,
          hintAvailability: 0.2,
          timeConstraints: true,
          adaptiveAssistance: false,
          educationalDepth: 0.3,
          errorTolerance: 0.2,
          feedbackFrequency: 0.3
        },
        targetSuccessRate: 0.4,
        adaptationSpeed: 0.9
      }
    ];

    for (const profile of profiles) {
      this.difficultyProfiles.set(profile.id, profile);
    }
  }

  /**
   * Initialize hint system with contextual hints
   */
  private initializeHintSystem(): void {
    this.hintSystem = {
      contextualHints: new Map([
        ['ghost_encounter', [
          'Try asking the ghost about the specific error symptoms',
          'Look for patterns in the code that might indicate the problem',
          'Consider the ghost\'s behavior - it often reflects the bug type'
        ]],
        ['patch_generation', [
          'Start with the simplest fix that addresses the core issue',
          'Consider the side effects of your proposed changes',
          'Think about how this fix might affect other parts of the system'
        ]],
        ['patch_review', [
          'Check if the patch actually solves the root cause',
          'Consider the risk level - sometimes a safer approach is better',
          'Look for alternative solutions that might be more elegant'
        ]],
        ['meter_management', [
          'Balance stability and insight - both are important',
          'High-risk patches can teach more but may destabilize the system',
          'Ask questions to gain insight without risking stability'
        ]]
      ]),
      adaptiveHints: new Map(),
      strugglingPlayerHints: new Map([
        ['repeated_failures', [
          'Take a step back and ask the ghost more questions',
          'Try a more conservative approach with lower-risk patches',
          'Focus on understanding the problem before attempting fixes'
        ]],
        ['excessive_hints', [
          'You\'re doing great! Try to rely on hints less as you gain confidence',
          'Challenge yourself to solve the next problem with fewer hints',
          'Trust your instincts - you know more than you think'
        ]],
        ['long_completion_times', [
          'Don\'t overthink it - sometimes the simple solution is the right one',
          'Set a time limit for yourself to encourage quicker decision-making',
          'Remember that you can always refactor if your first attempt isn\'t perfect'
        ]]
      ]),
      hintUsageTracking: new Map()
    };
  }

  /**
   * Analyze player performance and adjust difficulty
   */
  analyzeAndAdjustDifficulty(context: GameContext): DifficultyAdjustment | null {
    const currentTime = new Date();
    
    // Check cooldown period
    if (currentTime.getTime() - this.lastAdjustmentTime.getTime() < this.adjustmentCooldown) {
      return null;
    }

    const metrics = this.calculatePerformanceMetrics(context);
    this.performanceHistory.push(metrics);

    // Keep only recent performance history
    if (this.performanceHistory.length > 10) {
      this.performanceHistory = this.performanceHistory.slice(-10);
    }

    const adjustment = this.determineAdjustment(metrics);
    
    if (adjustment) {
      this.applyAdjustment(adjustment);
      this.lastAdjustmentTime = currentTime;
      
      // Emit adjustment event
      this.eventManager.emit({
        type: GameEventType.CONTENT_UNLOCKED,
        timestamp: currentTime,
        source: 'AdaptiveDifficultySystem',
        data: {
          type: 'difficulty_adjustment',
          adjustment,
          metrics
        },
        priority: 'medium'
      });
    }

    return adjustment;
  }

  /**
   * Calculate current player performance metrics
   */
  private calculatePerformanceMetrics(context: GameContext): PlayerPerformanceMetrics {
    const evidenceBoard = context.gameState.evidenceBoard;
    const gameStartTime = new Date(context.gameState.run.startedAt);
    const currentTime = new Date();
    const totalPlayTime = (currentTime.getTime() - gameStartTime.getTime()) / (1000 * 60); // minutes

    // Basic metrics
    const encountersStarted = evidenceBoard.filter(e => e.type === 'ghost_encountered').length;
    const encountersCompleted = evidenceBoard.filter(e => 
      e.type === 'ghost_encountered' && e.context.resolved === true
    ).length;
    const patchesApplied = evidenceBoard.filter(e => e.type === 'patch_applied').length;
    const ethicsViolations = evidenceBoard.filter(e => e.type === 'ethics_violation').length;

    // Calculate success rate
    const successRate = encountersStarted > 0 ? encountersCompleted / encountersStarted : 0;

    // Calculate average completion time (rough estimate)
    const averageCompletionTime = encountersCompleted > 0 ? totalPlayTime / encountersCompleted : 0;

    // Detect struggling indicators
    const strugglingIndicators = this.detectStruggleIndicators(context, {
      successRate,
      encountersStarted,
      encountersCompleted,
      totalPlayTime,
      patchesApplied
    });

    // Calculate learning velocity (improvement over time)
    const learningVelocity = this.calculateLearningVelocity();

    // Calculate engagement level
    const engagementLevel = this.calculateEngagementLevel(context, totalPlayTime);

    return {
      successRate,
      averageCompletionTime,
      hintsUsed: this.getTotalHintsUsed(),
      questionsAsked: evidenceBoard.filter(e => e.context.questionsAsked && e.context.questionsAsked > 0).length,
      patchesApplied,
      ethicsViolations,
      strugglingIndicators,
      learningVelocity,
      engagementLevel
    };
  }

  /**
   * Detect indicators that the player is struggling
   */
  private detectStruggleIndicators(context: GameContext, basicMetrics: any): StruggleIndicator[] {
    const indicators: StruggleIndicator[] = [];

    // Repeated failures
    if (basicMetrics.successRate < 0.3 && basicMetrics.encountersStarted >= 3) {
      indicators.push({
        type: 'repeated_failures',
        severity: 1.0 - basicMetrics.successRate,
        description: 'Player is failing most encounters',
        detectedAt: new Date(),
        suggestions: [
          'Reduce ghost complexity',
          'Increase hint availability',
          'Provide more educational content'
        ]
      });
    }

    // Excessive hints
    const hintsPerEncounter = basicMetrics.encountersStarted > 0 ? 
      this.getTotalHintsUsed() / basicMetrics.encountersStarted : 0;
    if (hintsPerEncounter > 3) {
      indicators.push({
        type: 'excessive_hints',
        severity: Math.min(1.0, hintsPerEncounter / 5),
        description: 'Player is relying heavily on hints',
        detectedAt: new Date(),
        suggestions: [
          'Gradually reduce hint availability',
          'Encourage independent problem-solving',
          'Provide confidence-building feedback'
        ]
      });
    }

    // Long completion times
    if (basicMetrics.averageCompletionTime > 15) { // 15 minutes per encounter
      indicators.push({
        type: 'long_completion_times',
        severity: Math.min(1.0, basicMetrics.averageCompletionTime / 30),
        description: 'Player is taking a long time to complete encounters',
        detectedAt: new Date(),
        suggestions: [
          'Simplify ghost complexity',
          'Provide time management hints',
          'Offer quick-win opportunities'
        ]
      });
    }

    // Low engagement (few questions, minimal exploration)
    if (basicMetrics.questionsAsked < basicMetrics.patchesApplied * 0.5) {
      indicators.push({
        type: 'low_engagement',
        severity: 0.6,
        description: 'Player is not engaging deeply with educational content',
        detectedAt: new Date(),
        suggestions: [
          'Encourage curiosity with interesting questions',
          'Provide more interactive educational content',
          'Reward exploration and questioning'
        ]
      });
    }

    return indicators;
  }

  /**
   * Determine if difficulty adjustment is needed
   */
  private determineAdjustment(metrics: PlayerPerformanceMetrics): DifficultyAdjustment | null {
    const currentProfile = this.getCurrentProfile();
    if (!currentProfile) return null;

    const targetSuccessRate = currentProfile.targetSuccessRate;
    const successRateDiff = metrics.successRate - targetSuccessRate;
    const adaptationSpeed = currentProfile.adaptationSpeed;

    // Don't adjust if performance is within acceptable range
    if (Math.abs(successRateDiff) < 0.1) {
      return null;
    }

    const oldSettings = { ...this.currentSettings };
    const newSettings = { ...this.currentSettings };

    let adjustmentReason = '';
    let expectedImpact = '';

    if (successRateDiff > 0.15) {
      // Player is doing too well, increase difficulty
      newSettings.ghostComplexity = Math.min(1.0, newSettings.ghostComplexity + (0.1 * adaptationSpeed));
      newSettings.patchRiskMultiplier = Math.min(2.0, newSettings.patchRiskMultiplier + (0.1 * adaptationSpeed));
      newSettings.hintAvailability = Math.max(0.1, newSettings.hintAvailability - (0.1 * adaptationSpeed));
      newSettings.errorTolerance = Math.max(0.1, newSettings.errorTolerance - (0.05 * adaptationSpeed));
      
      adjustmentReason = `High success rate (${Math.round(metrics.successRate * 100)}%) - increasing difficulty`;
      expectedImpact = 'More challenging encounters with less assistance';
      
    } else if (successRateDiff < -0.15) {
      // Player is struggling, decrease difficulty
      newSettings.ghostComplexity = Math.max(0.2, newSettings.ghostComplexity - (0.1 * adaptationSpeed));
      newSettings.patchRiskMultiplier = Math.max(0.5, newSettings.patchRiskMultiplier - (0.1 * adaptationSpeed));
      newSettings.hintAvailability = Math.min(1.0, newSettings.hintAvailability + (0.1 * adaptationSpeed));
      newSettings.errorTolerance = Math.min(1.0, newSettings.errorTolerance + (0.05 * adaptationSpeed));
      newSettings.adaptiveAssistance = true;
      
      adjustmentReason = `Low success rate (${Math.round(metrics.successRate * 100)}%) - reducing difficulty`;
      expectedImpact = 'Easier encounters with more assistance and hints';
    }

    // Apply struggle-specific adjustments
    for (const indicator of metrics.strugglingIndicators) {
      if (indicator.severity > 0.7) {
        switch (indicator.type) {
          case 'repeated_failures':
            newSettings.ghostComplexity = Math.max(0.2, newSettings.ghostComplexity - 0.2);
            newSettings.hintAvailability = Math.min(1.0, newSettings.hintAvailability + 0.2);
            break;
          case 'excessive_hints':
            // Gradually reduce hint availability to encourage independence
            newSettings.hintAvailability = Math.max(0.3, newSettings.hintAvailability - 0.1);
            break;
          case 'long_completion_times':
            newSettings.ghostComplexity = Math.max(0.3, newSettings.ghostComplexity - 0.15);
            newSettings.educationalDepth = Math.max(0.3, newSettings.educationalDepth - 0.1);
            break;
        }
      }
    }

    // Check if any settings actually changed
    const hasChanges = Object.keys(newSettings).some(key => {
      const newVal = newSettings[key as keyof DifficultySettings];
      const oldVal = oldSettings[key as keyof DifficultySettings];
      
      if (typeof newVal === 'number' && typeof oldVal === 'number') {
        return Math.abs(newVal - oldVal) > 0.01;
      } else {
        return newVal !== oldVal;
      }
    });

    if (!hasChanges) {
      return null;
    }

    return {
      timestamp: new Date(),
      reason: adjustmentReason,
      oldSettings,
      newSettings,
      expectedImpact
    };
  }

  /**
   * Apply difficulty adjustment
   */
  private applyAdjustment(adjustment: DifficultyAdjustment): void {
    this.currentSettings = adjustment.newSettings;
    this.adjustmentHistory.push(adjustment);

    // Keep only recent adjustment history
    if (this.adjustmentHistory.length > 20) {
      this.adjustmentHistory = this.adjustmentHistory.slice(-20);
    }
  }

  /**
   * Get appropriate hints for current situation
   */
  getContextualHints(context: string, playerMetrics: PlayerPerformanceMetrics): string[] {
    const baseHints = this.hintSystem.contextualHints.get(context) || [];
    const strugglingHints: string[] = [];

    // Add struggle-specific hints
    for (const indicator of playerMetrics.strugglingIndicators) {
      const hints = this.hintSystem.strugglingPlayerHints.get(indicator.type) || [];
      strugglingHints.push(...hints);
    }

    // Combine and limit hints based on availability setting
    const allHints = [...baseHints, ...strugglingHints];
    const maxHints = Math.ceil(allHints.length * this.currentSettings.hintAvailability);
    
    return allHints.slice(0, maxHints);
  }

  /**
   * Check if player should receive hints
   */
  shouldProvideHints(context: string, playerMetrics: PlayerPerformanceMetrics): boolean {
    // Always provide hints if adaptive assistance is enabled and player is struggling
    if (this.currentSettings.adaptiveAssistance && playerMetrics.strugglingIndicators.length > 0) {
      return true;
    }

    // Provide hints based on availability setting and usage tracking
    const hintUsage = this.hintSystem.hintUsageTracking.get(context) || 0;
    const maxHintsForContext = 5; // Maximum hints per context type
    
    return (
      this.currentSettings.hintAvailability > 0.5 &&
      hintUsage < maxHintsForContext &&
      Math.random() < this.currentSettings.hintAvailability
    );
  }

  /**
   * Record hint usage
   */
  recordHintUsage(context: string): void {
    const currentUsage = this.hintSystem.hintUsageTracking.get(context) || 0;
    this.hintSystem.hintUsageTracking.set(context, currentUsage + 1);
  }

  /**
   * Get current difficulty settings
   */
  getCurrentSettings(): DifficultySettings {
    return { ...this.currentSettings };
  }

  /**
   * Get current difficulty profile
   */
  private getCurrentProfile(): DifficultyProfile | null {
    // Find the profile that best matches current settings
    for (const profile of this.difficultyProfiles.values()) {
      const settingsDiff = this.calculateSettingsDifference(this.currentSettings, profile.settings);
      if (settingsDiff < 0.3) { // 30% similarity threshold
        return profile;
      }
    }
    return this.difficultyProfiles.get('balanced') || null;
  }

  /**
   * Calculate difference between two difficulty settings
   */
  private calculateSettingsDifference(settings1: DifficultySettings, settings2: DifficultySettings): number {
    const keys = Object.keys(settings1) as (keyof DifficultySettings)[];
    let totalDiff = 0;
    let numericKeys = 0;

    for (const key of keys) {
      const val1 = settings1[key];
      const val2 = settings2[key];
      
      if (typeof val1 === 'number' && typeof val2 === 'number') {
        totalDiff += Math.abs(val1 - val2);
        numericKeys++;
      }
    }

    return numericKeys > 0 ? totalDiff / numericKeys : 0;
  }

  /**
   * Calculate learning velocity (improvement over time)
   */
  private calculateLearningVelocity(): number {
    if (this.performanceHistory.length < 2) return 0;

    const recent = this.performanceHistory.slice(-3);
    const older = this.performanceHistory.slice(-6, -3);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, m) => sum + m.successRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.successRate, 0) / older.length;

    return recentAvg - olderAvg; // Positive means improving
  }

  /**
   * Calculate engagement level
   */
  private calculateEngagementLevel(context: GameContext, totalPlayTime: number): number {
    const evidenceBoard = context.gameState.evidenceBoard;
    const actionsPerMinute = evidenceBoard.length / Math.max(1, totalPlayTime);
    
    // Normalize to 0-1 scale (assuming 2 actions per minute is high engagement)
    return Math.min(1.0, actionsPerMinute / 2.0);
  }

  /**
   * Get total hints used across all contexts
   */
  private getTotalHintsUsed(): number {
    return Array.from(this.hintSystem.hintUsageTracking.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Get adjustment history
   */
  getAdjustmentHistory(): DifficultyAdjustment[] {
    return [...this.adjustmentHistory];
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PlayerPerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Manually set difficulty profile
   */
  setDifficultyProfile(profileId: string): boolean {
    const profile = this.difficultyProfiles.get(profileId);
    if (!profile) return false;

    const adjustment: DifficultyAdjustment = {
      timestamp: new Date(),
      reason: `Manual difficulty change to ${profile.name}`,
      oldSettings: { ...this.currentSettings },
      newSettings: { ...profile.settings },
      expectedImpact: profile.description
    };

    this.applyAdjustment(adjustment);
    return true;
  }

  /**
   * Get available difficulty profiles
   */
  getDifficultyProfiles(): DifficultyProfile[] {
    return Array.from(this.difficultyProfiles.values());
  }
}