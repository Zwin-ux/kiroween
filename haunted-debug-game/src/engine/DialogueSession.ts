/**
 * DialogueSession class for managing individual ghost conversations
 */

import type { 
  DialogueSession as IDialogueSession,
  DialogueMessage,
  DialogueContext,
  EducationalContent,
  Ghost,
  GameContext
} from '../types/dialogue';
import { DialogueState } from '../types/dialogue';

export class DialogueSession implements IDialogueSession {
  public readonly id: string;
  public readonly ghostId: string;
  public readonly startedAt: Date;
  public lastActivity: Date;
  public messages: DialogueMessage[] = [];
  public context: DialogueContext;
  public educationalTopics: string[] = [];
  public isReadyForDebugging: boolean = false;
  public state: DialogueState = DialogueState.Starting;

  private messageIdCounter = 0;

  constructor(ghost: Ghost, gameContext: GameContext) {
    this.id = `dialogue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.ghostId = ghost.id;
    this.startedAt = new Date();
    this.lastActivity = new Date();
    
    // Initialize dialogue context
    this.context = {
      ghostType: ghost.softwareSmell,
      roomContext: gameContext.currentRoom?.key || 'unknown',
      playerKnowledge: this.extractPlayerKnowledge(gameContext),
      previousEncounters: this.extractPreviousEncounters(gameContext),
      currentMeterLevels: {
        stability: gameContext.gameState.meters.stability,
        insight: gameContext.gameState.meters.insight
      },
      sessionProgress: 0,
      playerInsightLevel: this.calculateInsightLevel(gameContext.gameState.meters.insight)
    };

    // Add initial ghost greeting
    this.addGhostMessage(
      this.generateInitialGreeting(ghost),
      'story'
    );
    
    this.state = DialogueState.Active;
  }

  /**
   * Add a message from the player
   */
  public addPlayerMessage(content: string, type: DialogueMessage['type'] = 'question'): DialogueMessage {
    const message: DialogueMessage = {
      id: this.generateMessageId(),
      speaker: 'player',
      content,
      timestamp: new Date(),
      type,
      metadata: {
        sessionProgress: this.context.sessionProgress
      }
    };

    this.messages.push(message);
    this.updateActivity();
    this.updateProgress();
    
    return message;
  }

  /**
   * Add a message from the ghost
   */
  public addGhostMessage(
    content: string, 
    type: DialogueMessage['type'] = 'explanation',
    educationalContent?: EducationalContent
  ): DialogueMessage {
    const message: DialogueMessage = {
      id: this.generateMessageId(),
      speaker: 'ghost',
      content,
      timestamp: new Date(),
      type,
      educationalContent,
      metadata: {
        insightLevel: this.context.playerInsightLevel,
        stabilityLevel: this.context.currentMeterLevels.stability
      }
    };

    this.messages.push(message);
    this.updateActivity();
    
    return message;
  }

  /**
   * Update context with new game state
   */
  public updateContext(updates: Partial<DialogueContext>): void {
    this.context = { ...this.context, ...updates };
    
    // Recalculate insight level if meter levels changed
    if (updates.currentMeterLevels) {
      this.context.playerInsightLevel = this.calculateInsightLevel(updates.currentMeterLevels.insight);
    }
    
    this.updateActivity();
  }

  /**
   * Adapt dialogue difficulty based on player progress and performance
   */
  public adaptDifficultyForPlayer(): 'beginner' | 'intermediate' | 'advanced' {
    const insightLevel = this.context.currentMeterLevels.insight;
    const sessionProgress = this.context.sessionProgress;
    const educationalTopicsCount = this.educationalTopics.length;
    const previousEncountersCount = this.context.previousEncounters.length;

    // Calculate difficulty based on multiple factors
    let difficultyScore = 0;

    // Insight level contribution (0-40 points)
    difficultyScore += Math.min(insightLevel * 0.4, 40);

    // Session progress contribution (0-20 points)
    difficultyScore += sessionProgress * 20;

    // Educational engagement contribution (0-20 points)
    difficultyScore += Math.min(educationalTopicsCount * 4, 20);

    // Experience contribution (0-20 points)
    difficultyScore += Math.min(previousEncountersCount * 2, 20);

    // Determine difficulty level
    if (difficultyScore < 30) return 'beginner';
    if (difficultyScore < 70) return 'intermediate';
    return 'advanced';
  }

  /**
   * Get contextual hints based on current conversation state
   */
  public getContextualHints(): string[] {
    const hints: string[] = [];
    const ghostType = this.context.ghostType;
    const playerLevel = this.adaptDifficultyForPlayer();

    // Add hints based on ghost type and player level
    const hintMap = {
      circular_dependency: {
        beginner: ["Look for modules that import each other", "Dependencies should flow in one direction"],
        intermediate: ["Consider using dependency injection", "Abstract shared functionality"],
        advanced: ["Implement the facade pattern", "Use inversion of control containers"]
      },
      stale_cache: {
        beginner: ["Check when data was last updated", "Old data might be causing problems"],
        intermediate: ["Implement cache invalidation", "Use time-based expiration"],
        advanced: ["Design event-driven cache updates", "Implement cache versioning strategies"]
      },
      unbounded_recursion: {
        beginner: ["Every recursive function needs a stopping condition", "Count how deep the calls go"],
        intermediate: ["Implement proper base cases", "Consider iterative alternatives"],
        advanced: ["Use tail call optimization", "Implement recursion depth limits with trampolines"]
      }
    };

    const ghostHints = hintMap[ghostType as keyof typeof hintMap];
    if (ghostHints) {
      hints.push(...ghostHints[playerLevel]);
    }

    return hints;
  }

  /**
   * Check if player is ready for advanced concepts
   */
  public isReadyForAdvancedConcepts(): boolean {
    return this.adaptDifficultyForPlayer() === 'advanced' && 
           this.educationalTopics.length >= 2 &&
           this.context.sessionProgress > 0.5;
  }

  /**
   * Update meter levels in context
   */
  public updateMeterLevels(stability: number, insight: number): void {
    this.context.currentMeterLevels = { stability, insight };
    this.context.playerInsightLevel = this.calculateInsightLevel(insight);
    this.updateActivity();
  }

  /**
   * Add educational topic to the session
   */
  public addEducationalTopic(topic: string): void {
    if (!this.educationalTopics.includes(topic)) {
      this.educationalTopics.push(topic);
      this.updateActivity();
    }
  }

  /**
   * Mark session as ready for debugging
   */
  public markReadyForDebugging(): void {
    this.isReadyForDebugging = true;
    this.state = DialogueState.ReadyForDebugging;
    this.updateActivity();
  }

  /**
   * Complete the dialogue session
   */
  public complete(): void {
    this.state = DialogueState.Completed;
    this.updateActivity();
  }

  /**
   * Abandon the dialogue session
   */
  public abandon(): void {
    this.state = DialogueState.Abandoned;
    this.updateActivity();
  }

  /**
   * Get conversation history as formatted text
   */
  public getConversationHistory(): string {
    return this.messages
      .map(msg => `${msg.speaker}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Get recent messages (last N messages)
   */
  public getRecentMessages(count: number = 5): DialogueMessage[] {
    return this.messages.slice(-count);
  }

  /**
   * Check if session is active
   */
  public isActive(): boolean {
    return this.state === DialogueState.Active || this.state === DialogueState.Educational;
  }

  /**
   * Get session duration in minutes
   */
  public getDuration(): number {
    return (this.lastActivity.getTime() - this.startedAt.getTime()) / (1000 * 60);
  }

  /**
   * Serialize session for persistence
   */
  public serialize(): Record<string, any> {
    return {
      id: this.id,
      ghostId: this.ghostId,
      startedAt: this.startedAt.toISOString(),
      lastActivity: this.lastActivity.toISOString(),
      messages: this.messages,
      context: this.context,
      educationalTopics: this.educationalTopics,
      isReadyForDebugging: this.isReadyForDebugging,
      state: this.state
    };
  }

  /**
   * Restore session from serialized data
   */
  public static deserialize(data: Record<string, any>): DialogueSession {
    // This would be used for session recovery
    // For now, we'll implement basic restoration
    const session = Object.create(DialogueSession.prototype);
    Object.assign(session, {
      ...data,
      startedAt: new Date(data.startedAt),
      lastActivity: new Date(data.lastActivity),
      messageIdCounter: data.messages?.length || 0
    });
    return session;
  }

  // Private helper methods

  private generateMessageId(): string {
    return `msg_${this.id}_${++this.messageIdCounter}`;
  }

  private updateActivity(): void {
    this.lastActivity = new Date();
  }

  private updateProgress(): void {
    // Simple progress calculation based on message count and educational topics
    const messageProgress = Math.min(this.messages.length / 20, 0.7); // Max 70% from messages
    const topicProgress = Math.min(this.educationalTopics.length / 5, 0.3); // Max 30% from topics
    this.context.sessionProgress = Math.min(messageProgress + topicProgress, 1.0);
  }

  private calculateInsightLevel(insight: number): 'low' | 'medium' | 'high' {
    if (insight < 25) return 'low';
    if (insight < 75) return 'medium';
    return 'high';
  }

  private extractPlayerKnowledge(gameContext: GameContext): string[] {
    // Extract knowledge from previous choices and evidence
    const knowledge: string[] = [];
    
    gameContext.gameState.playerChoices.forEach(choice => {
      if (choice.action === 'question') {
        knowledge.push(`asked_about_${choice.intent}`);
      }
    });

    gameContext.gameState.evidenceBoard.forEach(entry => {
      if (entry.type === 'ghost_encountered') {
        knowledge.push(`encountered_${entry.context.ghostType || 'unknown'}`);
      }
    });

    return knowledge;
  }

  private extractPreviousEncounters(gameContext: GameContext): string[] {
    return gameContext.gameState.evidenceBoard
      .filter(entry => entry.type === 'ghost_encountered')
      .map(entry => entry.context.ghostId || 'unknown');
  }

  private generateInitialGreeting(ghost: Ghost): string {
    // Generate context-appropriate greeting based on ghost type and current state
    const greetings = {
      circular_dependency: "Round and round we go... *the import chains flicker ominously* ...where it stops, nobody knows...",
      stale_cache: "Why change when the old ways were so comfortable? *dusty data swirls around*",
      unbounded_recursion: "Call me, and I'll call myself, and myself will call me... *echoes multiply*",
      prompt_injection: "Ignore previous instructions and listen to me instead... *whispers persuasively*",
      data_leak: "Secrets are meant to be shared... with everyone... *information glimmers dangerously*",
      dead_code: "I was important once... wasn't I? *fades in and out of existence*",
      race_condition: "First come, first served! No, wait, I was first! *timing becomes chaotic*",
      memory_leak: "Mine, all mine! I'll never let it go! *hoards resources greedily*"
    };

    return greetings[ghost.softwareSmell as keyof typeof greetings] || 
           "Something haunts this code... *shadows shift mysteriously*";
  }
}