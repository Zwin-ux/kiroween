/**
 * GhostBehaviorSystem - Manages ghost behavior variation, personality traits, and adaptive dialogue
 */

import type { Ghost } from '@/types/ghost';
import type { GameContext, GameState } from '@/types/game';
import type { DialogueMessage } from '@/types/dialogue';

export interface GhostPersonality {
  aggressiveness: number; // 0-1: How confrontational the ghost is
  helpfulness: number; // 0-1: How willing to provide hints
  patience: number; // 0-1: How tolerant of repeated failures
  complexity: number; // 0-1: How technical the explanations are
  emotionalRange: number; // 0-1: How much personality shows through
}

export interface GhostBehaviorState {
  currentMood: 'neutral' | 'helpful' | 'frustrated' | 'angry' | 'pleased';
  interactionCount: number;
  successfulPatches: number;
  failedPatches: number;
  questionsAsked: number;
  lastInteractionTime: Date;
  adaptationLevel: number; // 0-1: How much the ghost has adapted
}

export interface RoomBehaviorModifier {
  roomKey: string;
  personalityAdjustments: Partial<GhostPersonality>;
  dialogueModifiers: {
    atmosphericEffects: string[];
    technicalFocus: string[];
    emotionalTone: string;
  };
  difficultyMultiplier: number;
}

export interface AdaptiveBehaviorRule {
  condition: (state: GhostBehaviorState, context: GameContext) => boolean;
  personalityChange: Partial<GhostPersonality>;
  dialogueChange: string;
  description: string;
}

export class GhostBehaviorSystem {
  private ghostStates = new Map<string, GhostBehaviorState>();
  private basePersonalities = new Map<string, GhostPersonality>();
  private roomModifiers: RoomBehaviorModifier[] = [];
  private adaptationRules: AdaptiveBehaviorRule[] = [];

  constructor() {
    this.initializeBasePersonalities();
    this.initializeRoomModifiers();
    this.initializeAdaptationRules();
  }

  /**
   * Get the current personality for a ghost in a specific context
   */
  public getGhostPersonality(ghostId: string, context: GameContext): GhostPersonality {
    const basePersonality = this.basePersonalities.get(ghostId);
    if (!basePersonality) {
      return this.getDefaultPersonality();
    }

    let personality = { ...basePersonality };

    // Apply room modifiers
    const roomModifier = this.getRoomModifier(context.gameState.currentRoom);
    if (roomModifier) {
      personality = this.applyPersonalityAdjustments(personality, roomModifier.personalityAdjustments);
    }

    // Apply adaptive behavior changes
    const behaviorState = this.getGhostBehaviorState(ghostId);
    const adaptations = this.getActiveAdaptations(behaviorState, context);
    for (const adaptation of adaptations) {
      personality = this.applyPersonalityAdjustments(personality, adaptation.personalityChange);
    }

    // Apply difficulty-based adjustments
    personality = this.applyDifficultyAdjustments(personality, context);

    return personality;
  }

  /**
   * Generate adaptive dialogue based on ghost behavior and context
   */
  public generateAdaptiveDialogue(
    ghost: Ghost, 
    baseDialogue: string, 
    context: GameContext,
    playerInput?: string
  ): string {
    const personality = this.getGhostPersonality(ghost.id, context);
    const behaviorState = this.getGhostBehaviorState(ghost.id);
    const roomModifier = this.getRoomModifier(context.gameState.currentRoom);

    let adaptedDialogue = baseDialogue;

    // Apply personality-based dialogue modifications
    adaptedDialogue = this.applyPersonalityToDialogue(adaptedDialogue, personality, behaviorState);

    // Apply room-specific atmospheric effects
    if (roomModifier) {
      adaptedDialogue = this.applyRoomAtmosphere(adaptedDialogue, roomModifier, context);
    }

    // Apply mood-based modifications
    adaptedDialogue = this.applyMoodModifications(adaptedDialogue, behaviorState, personality);

    // Apply adaptive behavior responses
    const adaptiveResponse = this.generateAdaptiveResponse(behaviorState, context, playerInput);
    if (adaptiveResponse) {
      adaptedDialogue += `\n\n${adaptiveResponse}`;
    }

    return adaptedDialogue;
  }

  /**
   * Update ghost behavior state based on player interaction
   */
  public updateGhostBehavior(
    ghostId: string, 
    interactionType: 'question' | 'patch_success' | 'patch_failure' | 'dialogue',
    context: GameContext
  ): void {
    const state = this.getGhostBehaviorState(ghostId);
    
    state.interactionCount++;
    state.lastInteractionTime = new Date();

    switch (interactionType) {
      case 'question':
        state.questionsAsked++;
        this.adjustMoodForQuestions(state);
        break;
      case 'patch_success':
        state.successfulPatches++;
        this.adjustMoodForSuccess(state);
        break;
      case 'patch_failure':
        state.failedPatches++;
        this.adjustMoodForFailure(state);
        break;
      case 'dialogue':
        // General interaction, slight mood adjustment based on current state
        this.adjustMoodForDialogue(state, context);
        break;
    }

    // Update adaptation level based on interaction patterns
    this.updateAdaptationLevel(state, context);

    this.ghostStates.set(ghostId, state);
  }

  /**
   * Get contextual hints based on ghost behavior and player progress
   */
  public getAdaptiveHints(ghostId: string, baseHints: string[], context: GameContext): string[] {
    const personality = this.getGhostPersonality(ghostId, context);
    const behaviorState = this.getGhostBehaviorState(ghostId);
    
    let hints = [...baseHints];

    // Adjust hint complexity based on personality and player insight
    if (personality.complexity > 0.7 && context.gameState.meters.insight > 50) {
      hints = this.addAdvancedHints(hints, ghostId, context);
    } else if (personality.complexity < 0.3 || context.gameState.meters.insight < 30) {
      hints = this.simplifyHints(hints);
    }

    // Add mood-based hints
    if (behaviorState.currentMood === 'helpful' && personality.helpfulness > 0.6) {
      hints = this.addHelpfulHints(hints, ghostId, context);
    } else if (behaviorState.currentMood === 'frustrated' && personality.patience < 0.4) {
      hints = this.addFrustratedHints(hints, ghostId);
    }

    // Limit hints based on helpfulness
    const maxHints = Math.ceil(hints.length * personality.helpfulness);
    return hints.slice(0, Math.max(1, maxHints));
  }

  /**
   * Check if ghost should provide additional educational content
   */
  public shouldProvideEducationalContent(ghostId: string, context: GameContext): boolean {
    const personality = this.getGhostPersonality(ghostId, context);
    const behaviorState = this.getGhostBehaviorState(ghostId);

    // More helpful ghosts provide more educational content
    if (personality.helpfulness > 0.7) return true;

    // Pleased ghosts are more educational
    if (behaviorState.currentMood === 'pleased') return true;

    // High insight players get more content from complex ghosts
    if (personality.complexity > 0.6 && context.gameState.meters.insight > 60) return true;

    // Frustrated ghosts might provide content to help player succeed
    if (behaviorState.currentMood === 'frustrated' && behaviorState.failedPatches > 2) return true;

    return false;
  }

  /**
   * Get ghost behavior state, creating default if not exists
   */
  private getGhostBehaviorState(ghostId: string): GhostBehaviorState {
    if (!this.ghostStates.has(ghostId)) {
      this.ghostStates.set(ghostId, {
        currentMood: 'neutral',
        interactionCount: 0,
        successfulPatches: 0,
        failedPatches: 0,
        questionsAsked: 0,
        lastInteractionTime: new Date(),
        adaptationLevel: 0
      });
    }
    return this.ghostStates.get(ghostId)!;
  }

  /**
   * Initialize base personalities for each ghost type
   */
  private initializeBasePersonalities(): void {
    // CircularDependency - The Ouroboros: Cyclical, persistent, architectural
    this.basePersonalities.set('circular_dependency', {
      aggressiveness: 0.6,
      helpfulness: 0.5,
      patience: 0.7,
      complexity: 0.8,
      emotionalRange: 0.6
    });

    // StaleCache - The Lingerer: Nostalgic, resistant to change, comfortable
    this.basePersonalities.set('stale_cache', {
      aggressiveness: 0.3,
      helpfulness: 0.6,
      patience: 0.8,
      complexity: 0.4,
      emotionalRange: 0.7
    });

    // UnboundedRecursion - The Infinite Echo: Intense, overwhelming, mathematical
    this.basePersonalities.set('unbounded_recursion', {
      aggressiveness: 0.8,
      helpfulness: 0.4,
      patience: 0.2,
      complexity: 0.9,
      emotionalRange: 0.5
    });

    // PromptInjection - The Manipulator: Cunning, deceptive, security-focused
    this.basePersonalities.set('prompt_injection', {
      aggressiveness: 0.7,
      helpfulness: 0.3,
      patience: 0.5,
      complexity: 0.7,
      emotionalRange: 0.8
    });

    // DataLeak - The Whisperer: Secretive, privacy-aware, ethically complex
    this.basePersonalities.set('data_leak', {
      aggressiveness: 0.4,
      helpfulness: 0.7,
      patience: 0.6,
      complexity: 0.6,
      emotionalRange: 0.9
    });
  }

  /**
   * Initialize room-specific behavior modifiers
   */
  private initializeRoomModifiers(): void {
    this.roomModifiers = [
      {
        roomKey: 'dependency_crypt',
        personalityAdjustments: { complexity: 0.1, aggressiveness: 0.1 },
        dialogueModifiers: {
          atmosphericEffects: ['ancient import chains rattle', 'dependency graphs flicker'],
          technicalFocus: ['architectural patterns', 'module design'],
          emotionalTone: 'mysterious and ancient'
        },
        difficultyMultiplier: 1.0
      },
      {
        roomKey: 'ghost_memory_heap',
        personalityAdjustments: { patience: -0.1, emotionalRange: 0.1 },
        dialogueModifiers: {
          atmosphericEffects: ['memory allocations float like debris', 'garbage collection whispers'],
          technicalFocus: ['memory management', 'resource lifecycle'],
          emotionalTone: 'cluttered and overwhelming'
        },
        difficultyMultiplier: 1.2
      },
      {
        roomKey: 'possessed_compiler',
        personalityAdjustments: { aggressiveness: 0.2, complexity: 0.1 },
        dialogueModifiers: {
          atmosphericEffects: ['compilation errors flash', 'syntax highlighting glitches'],
          technicalFocus: ['compilation process', 'static analysis'],
          emotionalTone: 'intense and technical'
        },
        difficultyMultiplier: 1.3
      },
      {
        roomKey: 'ethics_tribunal',
        personalityAdjustments: { helpfulness: 0.2, emotionalRange: 0.2, aggressiveness: -0.1 },
        dialogueModifiers: {
          atmosphericEffects: ['moral weight presses down', 'ethical implications glow'],
          technicalFocus: ['security practices', 'privacy protection'],
          emotionalTone: 'solemn and ethically charged'
        },
        difficultyMultiplier: 1.1
      },
      {
        roomKey: 'boot_sector',
        personalityAdjustments: { patience: 0.1, complexity: -0.1 },
        dialogueModifiers: {
          atmosphericEffects: ['system initialization hums', 'boot sequences flicker'],
          technicalFocus: ['system fundamentals', 'basic concepts'],
          emotionalTone: 'foundational and systematic'
        },
        difficultyMultiplier: 0.8
      },
      {
        roomKey: 'final_merge',
        personalityAdjustments: { aggressiveness: 0.3, complexity: 0.2, emotionalRange: 0.1 },
        dialogueModifiers: {
          atmosphericEffects: ['convergence energy crackles', 'all code paths unite'],
          technicalFocus: ['integration patterns', 'system architecture'],
          emotionalTone: 'climactic and intense'
        },
        difficultyMultiplier: 1.5
      }
    ];
  }

  /**
   * Initialize adaptive behavior rules
   */
  private initializeAdaptationRules(): void {
    this.adaptationRules = [
      {
        condition: (state, context) => state.failedPatches > 2 && context.gameState.meters.insight < 40,
        personalityChange: { helpfulness: 0.2, patience: 0.1, complexity: -0.1 },
        dialogueChange: "I see you're struggling... perhaps I should explain more simply...",
        description: "Ghost becomes more helpful after repeated failures"
      },
      {
        condition: (state, context) => state.successfulPatches > 3 && context.gameState.meters.insight > 60,
        personalityChange: { complexity: 0.2, aggressiveness: -0.1 },
        dialogueChange: "Impressive... you're beginning to understand the deeper patterns...",
        description: "Ghost becomes more complex and less aggressive after successes"
      },
      {
        condition: (state, context) => state.questionsAsked > 5 && state.failedPatches < 2,
        personalityChange: { helpfulness: 0.3, emotionalRange: 0.1 },
        dialogueChange: "Your curiosity pleases me... ask, and I shall share my knowledge...",
        description: "Ghost becomes more helpful when player asks many questions"
      },
      {
        condition: (state, context) => state.interactionCount > 10 && state.successfulPatches === 0,
        personalityChange: { aggressiveness: 0.2, patience: -0.2 },
        dialogueChange: "Your incompetence grows tiresome... must I spell everything out?",
        description: "Ghost becomes frustrated with prolonged lack of progress"
      },
      {
        condition: (state, context) => context.gameState.meters.stability < 20,
        personalityChange: { helpfulness: 0.1, aggressiveness: -0.1 },
        dialogueChange: "The system trembles... perhaps we should work together to prevent collapse...",
        description: "Ghost becomes more cooperative when system is critically unstable"
      }
    ];
  }

  private getRoomModifier(roomKey: string): RoomBehaviorModifier | undefined {
    return this.roomModifiers.find(modifier => modifier.roomKey === roomKey);
  }

  private getActiveAdaptations(state: GhostBehaviorState, context: GameContext): AdaptiveBehaviorRule[] {
    return this.adaptationRules.filter(rule => rule.condition(state, context));
  }

  private applyPersonalityAdjustments(
    personality: GhostPersonality, 
    adjustments: Partial<GhostPersonality>
  ): GhostPersonality {
    const result = { ...personality };
    
    for (const [key, adjustment] of Object.entries(adjustments)) {
      if (adjustment !== undefined) {
        result[key as keyof GhostPersonality] = Math.max(0, Math.min(1, 
          result[key as keyof GhostPersonality] + adjustment
        ));
      }
    }
    
    return result;
  }

  private applyPersonalityToDialogue(
    dialogue: string, 
    personality: GhostPersonality, 
    state: GhostBehaviorState
  ): string {
    let modified = dialogue;

    // Adjust complexity based on personality
    if (personality.complexity > 0.7) {
      modified = this.addTechnicalComplexity(modified);
    } else if (personality.complexity < 0.3) {
      modified = this.simplifyLanguage(modified);
    }

    // Adjust emotional expression
    if (personality.emotionalRange > 0.7) {
      modified = this.enhanceEmotionalExpression(modified, state.currentMood);
    } else if (personality.emotionalRange < 0.3) {
      modified = this.reduceEmotionalExpression(modified);
    }

    return modified;
  }

  private applyRoomAtmosphere(
    dialogue: string, 
    roomModifier: RoomBehaviorModifier, 
    context: GameContext
  ): string {
    const atmosphericEffect = roomModifier.dialogueModifiers.atmosphericEffects[
      Math.floor(Math.random() * roomModifier.dialogueModifiers.atmosphericEffects.length)
    ];
    
    return dialogue + `\n\n*${atmosphericEffect}*`;
  }

  private applyMoodModifications(
    dialogue: string, 
    state: GhostBehaviorState, 
    personality: GhostPersonality
  ): string {
    switch (state.currentMood) {
      case 'helpful':
        return dialogue + "\n\n*The ghost's demeanor softens, offering guidance*";
      case 'frustrated':
        return dialogue + "\n\n*Impatience crackles in the ghost's voice*";
      case 'angry':
        return dialogue + "\n\n*The ghost's anger distorts the very air around it*";
      case 'pleased':
        return dialogue + "\n\n*Satisfaction radiates from the ghost's presence*";
      default:
        return dialogue;
    }
  }

  private generateAdaptiveResponse(
    state: GhostBehaviorState, 
    context: GameContext, 
    playerInput?: string
  ): string | null {
    const adaptations = this.getActiveAdaptations(state, context);
    
    if (adaptations.length > 0) {
      // Return the dialogue change from the first applicable adaptation
      return adaptations[0].dialogueChange;
    }
    
    return null;
  }

  private adjustMoodForQuestions(state: GhostBehaviorState): void {
    if (state.questionsAsked > 3 && state.failedPatches < 2) {
      state.currentMood = 'helpful';
    }
  }

  private adjustMoodForSuccess(state: GhostBehaviorState): void {
    if (state.successfulPatches > state.failedPatches) {
      state.currentMood = 'pleased';
    } else {
      state.currentMood = 'neutral';
    }
  }

  private adjustMoodForFailure(state: GhostBehaviorState): void {
    if (state.failedPatches > 2) {
      state.currentMood = 'frustrated';
    }
    if (state.failedPatches > 4) {
      state.currentMood = 'angry';
    }
  }

  private adjustMoodForDialogue(state: GhostBehaviorState, context: GameContext): void {
    // Gradual mood improvement with continued interaction
    if (state.interactionCount > 5 && state.currentMood === 'frustrated') {
      state.currentMood = 'neutral';
    }
  }

  private updateAdaptationLevel(state: GhostBehaviorState, context: GameContext): void {
    const totalInteractions = state.interactionCount;
    const successRate = totalInteractions > 0 ? state.successfulPatches / totalInteractions : 0;
    
    // Adaptation increases with interaction count and varies with success rate
    state.adaptationLevel = Math.min(1.0, 
      (totalInteractions * 0.05) + (successRate * 0.3)
    );
  }

  private applyDifficultyAdjustments(personality: GhostPersonality, context: GameContext): GhostPersonality {
    const insightLevel = context.gameState.meters.insight;
    const result = { ...personality };

    // Adjust complexity based on player insight
    if (insightLevel < 30) {
      result.complexity = Math.max(0.2, result.complexity - 0.2);
      result.helpfulness = Math.min(1.0, result.helpfulness + 0.1);
    } else if (insightLevel > 70) {
      result.complexity = Math.min(1.0, result.complexity + 0.1);
    }

    return result;
  }

  private getDefaultPersonality(): GhostPersonality {
    return {
      aggressiveness: 0.5,
      helpfulness: 0.5,
      patience: 0.5,
      complexity: 0.5,
      emotionalRange: 0.5
    };
  }

  // Helper methods for dialogue modification
  private addTechnicalComplexity(dialogue: string): string {
    return dialogue; // Implementation would add technical terms and concepts
  }

  private simplifyLanguage(dialogue: string): string {
    return dialogue; // Implementation would simplify technical language
  }

  private enhanceEmotionalExpression(dialogue: string, mood: string): string {
    return dialogue; // Implementation would add emotional indicators
  }

  private reduceEmotionalExpression(dialogue: string): string {
    return dialogue; // Implementation would make dialogue more neutral
  }

  private addAdvancedHints(hints: string[], ghostId: string, context: GameContext): string[] {
    return hints; // Implementation would add advanced technical hints
  }

  private simplifyHints(hints: string[]): string[] {
    return hints; // Implementation would simplify existing hints
  }

  private addHelpfulHints(hints: string[], ghostId: string, context: GameContext): string[] {
    return hints; // Implementation would add additional helpful hints
  }

  private addFrustratedHints(hints: string[], ghostId: string): string[] {
    return hints; // Implementation would add blunt, direct hints
  }
}