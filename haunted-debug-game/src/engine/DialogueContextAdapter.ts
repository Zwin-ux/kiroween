/**
 * DialogueContextAdapter - Adapts dialogue content based on player progress and context
 */

import { kiroIntegration } from './KiroIntegration';
import type { DialogueSession } from './DialogueSession';
import type { DialogueContext, Ghost } from '../types/dialogue';

export interface ContextualDialogueRequest {
  ghost: Ghost;
  playerInput: string;
  session: DialogueSession;
  adaptationLevel: 'minimal' | 'moderate' | 'extensive';
}

export interface AdaptedDialogueResponse {
  content: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  educationalDepth: number; // 0-1 scale
  atmosphericIntensity: number; // 0-1 scale
  hints: string[];
  followUpSuggestions: string[];
}

export class DialogueContextAdapter {
  /**
   * Adapt dialogue content based on comprehensive player context
   */
  public async adaptDialogueForContext(
    request: ContextualDialogueRequest
  ): Promise<AdaptedDialogueResponse> {
    const { ghost, playerInput, session } = request;
    
    // Analyze player context for adaptation
    const playerAnalysis = this.analyzePlayerContext(session);
    
    // Generate base dialogue using Kiro integration
    const baseDialogue = await this.generateBaseDialogue(ghost, session.context, playerInput);
    
    // Apply contextual adaptations
    const adaptedContent = await this.applyContextualAdaptations(
      baseDialogue,
      playerAnalysis,
      session
    );
    
    // Generate contextual hints and suggestions
    const hints = this.generateContextualHints(session, playerAnalysis);
    const followUpSuggestions = this.generateFollowUpSuggestions(session, playerInput);
    
    return {
      content: adaptedContent.content,
      difficultyLevel: playerAnalysis.difficultyLevel,
      educationalDepth: adaptedContent.educationalDepth,
      atmosphericIntensity: adaptedContent.atmosphericIntensity,
      hints,
      followUpSuggestions
    };
  }

  /**
   * Scale educational content difficulty based on player progress
   */
  public scaleEducationalDifficulty(
    baseContent: string,
    targetDifficulty: 'beginner' | 'intermediate' | 'advanced',
    ghostType: string
  ): string {
    const scalingStrategies = {
      beginner: {
        approach: 'simplify',
        addMetaphors: true,
        technicalDepth: 'minimal',
        examples: 'concrete'
      },
      intermediate: {
        approach: 'balance',
        addMetaphors: false,
        technicalDepth: 'moderate',
        examples: 'mixed'
      },
      advanced: {
        approach: 'deepen',
        addMetaphors: false,
        technicalDepth: 'comprehensive',
        examples: 'abstract'
      }
    };

    const strategy = scalingStrategies[targetDifficulty];
    let scaledContent = baseContent;

    // Apply scaling based on strategy
    switch (strategy.approach) {
      case 'simplify':
        scaledContent = this.simplifyTechnicalLanguage(scaledContent);
        if (strategy.addMetaphors) {
          scaledContent = this.addMetaphors(scaledContent, ghostType);
        }
        break;
      
      case 'balance':
        scaledContent = this.balanceTechnicalContent(scaledContent);
        break;
      
      case 'deepen':
        scaledContent = this.deepenTechnicalContent(scaledContent, ghostType);
        break;
    }

    return scaledContent;
  }

  /**
   * Adapt atmospheric intensity based on game state and player preferences
   */
  public adaptAtmosphericIntensity(
    content: string,
    stabilityLevel: number,
    playerTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): { content: string; intensity: number } {
    let intensity = 0;
    let adaptedContent = content;

    // Base intensity from stability level
    if (stabilityLevel < 30) {
      intensity = 0.8;
    } else if (stabilityLevel < 60) {
      intensity = 0.5;
    } else {
      intensity = 0.2;
    }

    // Adjust for player tolerance
    const toleranceMultipliers = {
      low: 0.5,
      medium: 1.0,
      high: 1.3
    };
    intensity *= toleranceMultipliers[playerTolerance];

    // Apply atmospheric effects based on intensity
    if (intensity > 0.7) {
      adaptedContent += " *reality warps and glitches*";
    } else if (intensity > 0.4) {
      adaptedContent += " *shadows flicker ominously*";
    } else if (intensity > 0.1) {
      adaptedContent += " *system hums quietly*";
    }

    return { content: adaptedContent, intensity };
  }

  // Private helper methods

  private analyzePlayerContext(session: DialogueSession) {
    const context = session.context;
    const difficultyLevel = session.adaptDifficultyForPlayer();
    const engagementLevel = this.calculateEngagementLevel(session);
    const learningStyle = this.detectLearningStyle(session);
    
    return {
      difficultyLevel,
      engagementLevel,
      learningStyle,
      insightLevel: context.playerInsightLevel,
      stabilityLevel: context.currentMeterLevels.stability,
      sessionProgress: context.sessionProgress,
      educationalTopics: session.educationalTopics.length,
      isReadyForAdvanced: session.isReadyForAdvancedConcepts()
    };
  }

  private async generateBaseDialogue(
    ghost: Ghost,
    context: DialogueContext,
    playerInput: string
  ): Promise<string> {
    try {
      const kiroResponse = await kiroIntegration.generateDialogue(ghost, context, playerInput);
      return kiroResponse.content;
    } catch (error) {
      console.warn('Kiro dialogue generation failed in adapter:', error);
      return this.generateFallbackDialogue(ghost, context, playerInput);
    }
  }

  private async applyContextualAdaptations(
    baseContent: string,
    playerAnalysis: any,
    session: DialogueSession
  ): Promise<{ content: string; educationalDepth: number; atmosphericIntensity: number }> {
    let adaptedContent = baseContent;
    
    // Scale difficulty
    adaptedContent = this.scaleEducationalDifficulty(
      adaptedContent,
      playerAnalysis.difficultyLevel,
      session.context.ghostType
    );
    
    // Adapt atmospheric intensity
    const atmosphericResult = this.adaptAtmosphericIntensity(
      adaptedContent,
      playerAnalysis.stabilityLevel
    );
    
    // Calculate educational depth
    const educationalDepth = this.calculateEducationalDepth(
      playerAnalysis.difficultyLevel,
      playerAnalysis.engagementLevel
    );
    
    return {
      content: atmosphericResult.content,
      educationalDepth,
      atmosphericIntensity: atmosphericResult.intensity
    };
  }

  private generateContextualHints(session: DialogueSession, playerAnalysis: any): string[] {
    const baseHints = session.getContextualHints();
    
    // Add engagement-based hints
    if (playerAnalysis.engagementLevel < 0.5) {
      baseHints.push("Try asking more specific questions to learn more");
    }
    
    // Add progress-based hints
    if (session.context.sessionProgress < 0.3) {
      baseHints.push("Explore different aspects of this problem");
    }
    
    return baseHints.slice(0, 3); // Limit to 3 hints to avoid overwhelming
  }

  private generateFollowUpSuggestions(session: DialogueSession, playerInput: string): string[] {
    const suggestions: string[] = [];
    const lowerInput = playerInput.toLowerCase();
    
    // Generate suggestions based on input type
    if (lowerInput.includes('what')) {
      suggestions.push("Ask 'how' to learn about solutions");
      suggestions.push("Ask 'why' to understand the root cause");
    } else if (lowerInput.includes('how')) {
      suggestions.push("Ask about examples or best practices");
      suggestions.push("Ask about common mistakes to avoid");
    } else if (lowerInput.includes('why')) {
      suggestions.push("Ask about prevention strategies");
      suggestions.push("Ask about detection methods");
    }
    
    // Add ghost-specific suggestions
    const ghostType = session.context.ghostType;
    const ghostSuggestions = this.getGhostSpecificSuggestions(ghostType);
    suggestions.push(...ghostSuggestions);
    
    return suggestions.slice(0, 2); // Limit to 2 suggestions
  }

  private calculateEngagementLevel(session: DialogueSession): number {
    const messageCount = session.messages.filter(m => m.speaker === 'player').length;
    const topicCount = session.educationalTopics.length;
    const sessionDuration = session.getDuration();
    
    // Normalize engagement factors
    const messageScore = Math.min(messageCount / 10, 1); // Max at 10 messages
    const topicScore = Math.min(topicCount / 5, 1); // Max at 5 topics
    const durationScore = Math.min(sessionDuration / 15, 1); // Max at 15 minutes
    
    return (messageScore + topicScore + durationScore) / 3;
  }

  private detectLearningStyle(session: DialogueSession): 'visual' | 'analytical' | 'practical' {
    const playerMessages = session.messages.filter(m => m.speaker === 'player');
    
    let visualCount = 0;
    let analyticalCount = 0;
    let practicalCount = 0;
    
    playerMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      if (content.includes('show') || content.includes('example') || content.includes('see')) {
        visualCount++;
      }
      if (content.includes('why') || content.includes('explain') || content.includes('understand')) {
        analyticalCount++;
      }
      if (content.includes('how') || content.includes('fix') || content.includes('solve')) {
        practicalCount++;
      }
    });
    
    if (practicalCount > visualCount && practicalCount > analyticalCount) return 'practical';
    if (analyticalCount > visualCount) return 'analytical';
    return 'visual';
  }

  private calculateEducationalDepth(
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced',
    engagementLevel: number
  ): number {
    const baseDepth = {
      beginner: 0.3,
      intermediate: 0.6,
      advanced: 0.9
    };
    
    return Math.min(baseDepth[difficultyLevel] * (0.5 + engagementLevel * 0.5), 1.0);
  }

  private simplifyTechnicalLanguage(content: string): string {
    const simplifications = {
      'dependency injection': 'passing needed objects to a function',
      'circular dependency': 'modules that need each other',
      'cache invalidation': 'clearing old stored data',
      'recursion': 'a function calling itself',
      'stack overflow': 'too many function calls piled up'
    };
    
    let simplified = content;
    Object.entries(simplifications).forEach(([technical, simple]) => {
      const regex = new RegExp(technical, 'gi');
      simplified = simplified.replace(regex, `${simple} (${technical})`);
    });
    
    return simplified;
  }

  private addMetaphors(content: string, ghostType: string): string {
    const metaphors = {
      circular_dependency: "like a snake eating its own tail",
      stale_cache: "like keeping expired milk in the fridge",
      unbounded_recursion: "like standing between two mirrors",
      prompt_injection: "like a wolf in sheep's clothing",
      data_leak: "like leaving your diary open"
    };
    
    const metaphor = metaphors[ghostType as keyof typeof metaphors];
    if (metaphor) {
      return content + ` Think of it ${metaphor}.`;
    }
    
    return content;
  }

  private balanceTechnicalContent(content: string): string {
    // Add moderate technical depth without overwhelming
    return content + " This involves understanding the underlying system architecture.";
  }

  private deepenTechnicalContent(content: string, ghostType: string): string {
    const technicalDepth = {
      circular_dependency: " Consider implementing the Dependency Inversion Principle with IoC containers.",
      stale_cache: " Implement event-sourcing patterns with CQRS for cache consistency.",
      unbounded_recursion: " Use continuation-passing style or trampolines for tail call optimization.",
      prompt_injection: " Implement input sanitization with context-aware parsing and validation.",
      data_leak: " Apply principle of least privilege with data classification and access controls."
    };
    
    const depth = technicalDepth[ghostType as keyof typeof technicalDepth];
    return content + (depth || " This requires deep understanding of system design patterns.");
  }

  private generateFallbackDialogue(ghost: Ghost, context: DialogueContext, playerInput: string): string {
    return `The ${ghost.softwareSmell.replace('_', ' ')} ghost whispers about the mysteries of code...`;
  }

  private getGhostSpecificSuggestions(ghostType: string): string[] {
    const suggestions = {
      circular_dependency: ["Ask about dependency injection", "Ask about module architecture"],
      stale_cache: ["Ask about cache invalidation", "Ask about data freshness"],
      unbounded_recursion: ["Ask about base cases", "Ask about stack limits"],
      prompt_injection: ["Ask about input validation", "Ask about security measures"],
      data_leak: ["Ask about data protection", "Ask about access controls"]
    };
    
    return suggestions[ghostType as keyof typeof suggestions] || [];
  }
}

// Singleton instance
export const dialogueContextAdapter = new DialogueContextAdapter();