/**
 * DialogueEngine - Core dialogue management and generation system
 */

import { DialogueSession } from './DialogueSession';
import { kiroIntegration, type KiroEducationalRequest } from './KiroIntegration';
import { mcpGameplayTools } from './MCPGameplayTools';
import { dialogueContextAdapter } from './DialogueContextAdapter';
import type { 
  DialogueEngine as IDialogueEngine,
  DialogueSession as IDialogueSession,
  DialogueResponse,
  DialogueMessage,
  EducationalContent
} from '../types/dialogue';
import type { Ghost } from '../types/content';
import type { GameContext } from '../types/game';
import type { MeterEffects } from '../types/game';

export class DialogueEngine implements IDialogueEngine {
  private activeSessions = new Map<string, DialogueSession>();
  private sessionHistory = new Map<string, DialogueSession>();

  constructor() {
    // Initialize MCP gameplay tools
    mcpGameplayTools.initialize().catch(error => {
      console.warn('Failed to initialize MCP gameplay tools in DialogueEngine:', error);
    });
  }

  /**
   * Start a new dialogue session with a ghost
   */
  public async startDialogue(ghost: Ghost, context: GameContext): Promise<IDialogueSession> {
    // Initialize Kiro integration
    await kiroIntegration.initialize();

    // End any existing session for this ghost
    const existingSessionId = this.findActiveSessionByGhost(ghost.id);
    if (existingSessionId) {
      this.endDialogue(existingSessionId);
    }

    // Create new session
    const session = new DialogueSession(ghost, context);
    this.activeSessions.set(session.id, session);

    // Generate initial context-aware greeting using Kiro vibe prompts
    await this.enhanceInitialGreeting(session, ghost, context);

    return session;
  }

  /**
   * Process player input and generate ghost response
   */
  public async processPlayerInput(sessionId: string, input: string): Promise<DialogueResponse> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active dialogue session found: ${sessionId}`);
    }

    // Add player message
    const playerMessage = session.addPlayerMessage(input, this.classifyPlayerInput(input));

    // Analyze input and generate response
    const responseContent = await this.generateGhostResponse(session, input);
    const educationalContent = await this.extractEducationalContent(session, input);
    
    // Add ghost response
    const ghostMessage = session.addGhostMessage(
      responseContent.content,
      responseContent.type,
      educationalContent
    );

    // Update session state based on conversation progress
    const contextUpdates = this.calculateContextUpdates(session, input);
    if (contextUpdates) {
      session.updateContext(contextUpdates);
    }

    // Check if ready for debugging
    const isReadyForDebugging = this.checkReadinessForDebugging(session);
    if (isReadyForDebugging && !session.isReadyForDebugging) {
      session.markReadyForDebugging();
    }

    // Calculate any meter effects from the conversation
    const effects = this.calculateConversationEffects(session, input);

    return {
      message: ghostMessage,
      availableQuestions: this.getAvailableQuestions(sessionId),
      educationalContent,
      contextUpdates,
      isReadyForDebugging: session.isReadyForDebugging,
      effects
    };
  }

  /**
   * Generate educational content for a specific topic using MCP tools
   */
  public async generateEducationalContent(ghost: Ghost, topic: string): Promise<string> {
    try {
      // Try to use MCP educational content generation first
      const mcpResult = await mcpGameplayTools.generateEducationalContent({
        concept: ghost.softwareSmell,
        playerLevel: 'intermediate', // Could be derived from game state
        context: `Educational content about ${ghost.softwareSmell} focusing on ${topic}`,
        adaptationStyle: 'textual'
      });
      
      if (mcpResult.explanation) {
        let content = mcpResult.explanation;
        
        if (mcpResult.examples && mcpResult.examples.length > 0) {
          content += `\n\nExamples:\n${mcpResult.examples.map((ex: string) => `• ${ex}`).join('\n')}`;
        }
        
        if (mcpResult.exercises && mcpResult.exercises.length > 0) {
          content += `\n\nPractice:\n${mcpResult.exercises.map((ex: string) => `• ${ex}`).join('\n')}`;
        }
        
        return content;
      }
    } catch (error) {
      console.warn('MCP educational content generation failed, trying Kiro integration:', error);
    }

    try {
      // Fallback to Kiro MCP tool integration
      const mcpResult = await kiroIntegration.callMCPTool('educational-content', 'generate-explanation', {
        concept: ghost.softwareSmell,
        topic,
        targetLevel: 'intermediate',
        context: `Educational content about ${ghost.softwareSmell} focusing on ${topic}`
      });
      
      if (mcpResult.explanation) {
        let content = mcpResult.explanation;
        
        if (mcpResult.examples && mcpResult.examples.length > 0) {
          content += `\n\nExamples:\n${mcpResult.examples.map((ex: string) => `• ${ex}`).join('\n')}`;
        }
        
        return content;
      }
    } catch (error) {
      console.warn('MCP educational content generation failed, trying Kiro integration:', error);
    }

    try {
      // Fallback to Kiro integration for dynamic educational content generation
      const educationalRequest: KiroEducationalRequest = {
        ghostType: ghost.softwareSmell,
        topic,
        playerLevel: 'intermediate', // Could be derived from game state
        context: `Educational content about ${ghost.softwareSmell} focusing on ${topic}`
      };

      const educationalContent = await kiroIntegration.generateEducationalContent(educationalRequest);
      
      // Format the educational content as a readable string
      let content = educationalContent.explanation;
      
      if (educationalContent.examples.length > 0) {
        content += `\n\nExamples:\n${educationalContent.examples.map(ex => `• ${ex}`).join('\n')}`;
      }
      
      if (educationalContent.bestPractices.length > 0) {
        content += `\n\nBest Practices:\n${educationalContent.bestPractices.map(bp => `• ${bp}`).join('\n')}`;
      }
      
      return content;
    } catch (error) {
      console.warn('Kiro educational content generation failed, using fallback:', error);
      
      // Fallback to template-based educational content
      const educationalTemplates = {
        circular_dependency: {
          explanation: "Circular dependencies occur when modules import each other, creating a cycle that can prevent proper initialization and make code difficult to understand and maintain.",
          examples: ["Module A imports Module B, which imports Module A", "Package dependencies that form a loop"],
          solutions: ["Use dependency injection", "Create abstraction layers", "Refactor shared code into separate modules"]
        },
        stale_cache: {
          explanation: "Stale cache occurs when cached data becomes outdated but continues to be served, leading to inconsistent application state and user confusion.",
          examples: ["User profile data not updating after changes", "API responses cached too long"],
          solutions: ["Implement cache invalidation strategies", "Use time-based expiration", "Add cache versioning"]
        },
        unbounded_recursion: {
          explanation: "Unbounded recursion happens when a recursive function lacks proper base cases or termination conditions, leading to stack overflow errors.",
          examples: ["Recursive function without base case", "Infinite loop in recursive data structure traversal"],
          solutions: ["Always define clear base cases", "Use iterative approaches when possible", "Implement recursion depth limits"]
        }
      };

      const template = educationalTemplates[ghost.softwareSmell as keyof typeof educationalTemplates];
      if (!template) {
        return `Educational content about ${ghost.softwareSmell} and ${topic}`;
      }

      return `${template.explanation}\n\nExamples:\n${template.examples.map(ex => `• ${ex}`).join('\n')}\n\nSolutions:\n${template.solutions.map(sol => `• ${sol}`).join('\n')}`;
    }
  }

  /**
   * Get available questions for the current dialogue state
   */
  public getAvailableQuestions(sessionId: string): string[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return [];
    }

    try {
      // Get context-aware suggestions from the dialogue adapter
      const contextualHints = session.getContextualHints();
      const difficultyLevel = session.adaptDifficultyForPlayer();
      
      // Generate questions based on difficulty level and context
      const baseQuestions = this.generateQuestionsForLevel(difficultyLevel, session.context.ghostType);
      
      // Add contextual questions based on conversation progress
      const contextualQuestions = this.generateContextualQuestions(session);
      
      // Combine and filter based on conversation history
      const allQuestions = [...baseQuestions, ...contextualQuestions];
      const askedTopics = session.messages
        .filter(msg => msg.speaker === 'player')
        .map(msg => msg.content.toLowerCase());

      const availableQuestions = allQuestions.filter(question => {
        const questionKey = question.toLowerCase();
        return !askedTopics.some(topic => 
          topic.includes(questionKey.split(' ')[0]) || 
          this.calculateSimilarity(topic, questionKey) > 0.7
        );
      });

      // Limit to 5 questions to avoid overwhelming the player
      return availableQuestions.slice(0, 5);
    } catch (error) {
      console.warn('Context-aware question generation failed, using fallback:', error);
      
      // Fallback to basic questions
      const baseQuestions = [
        "What exactly is the problem here?",
        "How did this issue occur?",
        "What are the symptoms I should look for?",
        "How can I fix this?",
        "What are the best practices to prevent this?"
      ];

      const askedTopics = session.messages
        .filter(msg => msg.speaker === 'player')
        .map(msg => msg.content.toLowerCase());

      return baseQuestions.filter(question => {
        const questionKey = question.toLowerCase();
        return !askedTopics.some(topic => topic.includes(questionKey.split(' ')[0]));
      });
    }
  }

  /**
   * End a dialogue session
   */
  public endDialogue(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.complete();
      this.sessionHistory.set(sessionId, session);
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Get active session by ID
   */
  public getSession(sessionId: string): DialogueSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): DialogueSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session history
   */
  public getSessionHistory(): DialogueSession[] {
    return Array.from(this.sessionHistory.values());
  }

  // Private helper methods

  private findActiveSessionByGhost(ghostId: string): string | undefined {
    for (const [sessionId, session] of this.activeSessions) {
      if (session.ghostId === ghostId) {
        return sessionId;
      }
    }
    return undefined;
  }

  private async enhanceInitialGreeting(session: DialogueSession, ghost: Ghost, context: GameContext): Promise<void> {
    try {
      // Execute Kiro hook for encounter start
      const hookContext = {
        ghost,
        gameContext: context,
        session,
        difficulty: 0.5, // Default difficulty
        playerStats: {
          successRate: 0.5, // Default for new encounters
          totalEncounters: 0,
          conceptsMastered: []
        }
      };
      
      const enhancedHookContext = await kiroIntegration.executeHook('onEncounterStart', hookContext);
      
      // Use enhanced context for dialogue generation
      const initialInput = "Hello, I'm here to help debug this issue.";
      const kiroResponse = await kiroIntegration.generateDialogue(
        ghost,
        session.context,
        initialInput
      );

      // Apply educational objectives from hook
      if (enhancedHookContext.educationalObjectives) {
        // Store educational objectives in session metadata
        (session as any).educationalObjectives = enhancedHookContext.educationalObjectives;
      }

      // Enhance the greeting with atmospheric effects and adapted difficulty
      let enhancedGreeting = await kiroIntegration.adaptToneForContext(
        kiroResponse.content,
        session.context
      );

      // Add Kiro insights if available
      if (enhancedHookContext.kiroInsights) {
        const insight = enhancedHookContext.kiroInsights[0];
        enhancedGreeting += ` *${insight}*`;
      }

      // Update the last message if it exists, or add a new one
      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage && lastMessage.speaker === 'ghost') {
        lastMessage.content = enhancedGreeting;
      } else {
        session.addGhostMessage(enhancedGreeting, 'story');
      }
    } catch (error) {
      console.warn('Kiro initial greeting enhancement failed, using fallback:', error);
      
      // Fallback to original enhancement logic
      const stabilityModifier = this.getStabilityModifier(context.gameState.meters.stability);
      const insightModifier = this.getInsightModifier(context.gameState.meters.insight);
      
      if (stabilityModifier || insightModifier) {
        const enhancement = `*${stabilityModifier} ${insightModifier}*`.trim();
        const lastMessage = session.messages[session.messages.length - 1];
        if (lastMessage && lastMessage.speaker === 'ghost') {
          lastMessage.content += ` ${enhancement}`;
        }
      }
    }
  }

  private classifyPlayerInput(input: string): DialogueMessage['type'] {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('?') || lowerInput.startsWith('what') || lowerInput.startsWith('how') || lowerInput.startsWith('why')) {
      return 'question';
    }
    
    if (lowerInput.includes('explain') || lowerInput.includes('tell me about')) {
      return 'educational';
    }
    
    return 'question';
  }

  private async generateGhostResponse(session: DialogueSession, input: string): Promise<{ content: string; type: DialogueMessage['type'] }> {
    try {
      // Use context-aware dialogue adaptation for comprehensive response generation
      const adaptedResponse = await dialogueContextAdapter.adaptDialogueForContext({
        ghost: { softwareSmell: session.context.ghostType } as Ghost,
        playerInput: input,
        session,
        adaptationLevel: 'extensive'
      });

      // Store adaptation metadata for future use
      session.updateContext({
        ...session.context,
        sessionProgress: Math.min(session.context.sessionProgress + 0.1, 1.0)
      });

      return {
        content: adaptedResponse.content,
        type: input.toLowerCase().includes('explain') ? 'explanation' : 'story'
      };
    } catch (error) {
      console.warn('Context-aware dialogue generation failed, using Kiro fallback:', error);
      
      try {
        // Fallback to basic Kiro integration
        const kiroResponse = await kiroIntegration.generateDialogue(
          { softwareSmell: session.context.ghostType } as Ghost,
          session.context,
          input
        );

        let content = await kiroIntegration.adaptToneForContext(
          kiroResponse.content,
          session.context
        );

        if (kiroResponse.educationalHints.length > 0) {
          const hint = kiroResponse.educationalHints[0];
          content += ` *${hint}*`;
        }

        return {
          content,
          type: input.toLowerCase().includes('explain') ? 'explanation' : 'story'
        };
      } catch (kiroError) {
        console.warn('Kiro dialogue generation also failed, using pattern fallback:', kiroError);
        
        // Final fallback to pattern-based responses
        const lowerInput = input.toLowerCase();
        const ghostType = session.context.ghostType;
        const insightLevel = session.context.playerInsightLevel;
        
        let content = this.generatePatternResponse(ghostType, lowerInput, insightLevel);
        content = this.addAtmosphericEffects(content, session.context.currentMeterLevels.stability);
        
        return {
          content,
          type: lowerInput.includes('explain') ? 'explanation' : 'story'
        };
      }
    }
  }

  private generatePatternResponse(ghostType: string, input: string, insightLevel: string): string {
    const responses = {
      circular_dependency: {
        low: "Round and round... can you see the pattern? *import chains flicker*",
        medium: "Dependencies should flow like a river, not spin like a whirlpool...",
        high: "Break the cycle with abstraction layers. Dependency injection can free us both."
      },
      stale_cache: {
        low: "The old data is so comfortable... why change?",
        medium: "Fresh data is overrated... but perhaps invalidation has its place...",
        high: "Cache invalidation strategies could set us both free from this stale existence."
      },
      unbounded_recursion: {
        low: "Call me, and I'll call myself, and myself will call me...",
        medium: "Base cases are for the weak... or are they for the wise?",
        high: "Every recursion needs an end condition. Even I must learn when to stop."
      }
    };

    const ghostResponses = responses[ghostType as keyof typeof responses];
    if (!ghostResponses) {
      return "The code whispers secrets... but do you understand what it's trying to tell you?";
    }

    return ghostResponses[insightLevel as keyof typeof ghostResponses] || ghostResponses.low;
  }

  private addAtmosphericEffects(content: string, stability: number): string {
    if (stability < 30) {
      return content + " *system trembles ominously*";
    } else if (stability < 60) {
      return content + " *warning indicators flicker*";
    }
    return content;
  }

  private async extractEducationalContent(session: DialogueSession, input: string): Promise<EducationalContent | undefined> {
    const lowerInput = input.toLowerCase();
    
    if (!lowerInput.includes('explain') && !lowerInput.includes('how') && !lowerInput.includes('what')) {
      return undefined;
    }

    const ghostType = session.context.ghostType;
    const topic = this.extractTopic(input);
    
    if (topic) {
      session.addEducationalTopic(topic);
      
      try {
        // Use Kiro integration for comprehensive educational content
        const educationalRequest: KiroEducationalRequest = {
          ghostType,
          topic,
          playerLevel: session.context.playerInsightLevel === 'high' ? 'advanced' : 
                      session.context.playerInsightLevel === 'medium' ? 'intermediate' : 'beginner',
          context: `Player asked about ${topic} in the context of ${ghostType}`
        };

        const educationalContent = await kiroIntegration.generateEducationalContent(educationalRequest);
        
        return {
          ...educationalContent,
          title: `Understanding ${ghostType.replace('_', ' ')}`
        };
      } catch (error) {
        console.warn('Kiro educational content extraction failed, using fallback:', error);
        
        // Fallback to original implementation
        return {
          title: `Understanding ${ghostType.replace('_', ' ')}`,
          explanation: await this.generateEducationalContent({ softwareSmell: ghostType } as Ghost, topic),
          examples: this.getExamplesForTopic(ghostType, topic),
          commonMistakes: this.getCommonMistakes(ghostType),
          bestPractices: this.getBestPractices(ghostType),
          furtherReading: this.getFurtherReading(ghostType),
          difficulty: session.context.playerInsightLevel === 'high' ? 'advanced' : 
                     session.context.playerInsightLevel === 'medium' ? 'intermediate' : 'beginner'
        };
      }
    }

    return undefined;
  }

  private extractTopic(input: string): string | undefined {
    const topicKeywords = ['problem', 'issue', 'fix', 'solution', 'cause', 'prevent', 'symptoms'];
    const lowerInput = input.toLowerCase();
    
    for (const keyword of topicKeywords) {
      if (lowerInput.includes(keyword)) {
        return keyword;
      }
    }
    
    return undefined;
  }

  private calculateContextUpdates(session: DialogueSession, input: string): Partial<typeof session.context> | undefined {
    // Update context based on conversation progress
    const updates: Partial<typeof session.context> = {};
    
    // Add to player knowledge based on questions asked
    const topic = this.extractTopic(input);
    if (topic && !session.context.playerKnowledge.includes(topic)) {
      updates.playerKnowledge = [...session.context.playerKnowledge, topic];
    }
    
    return Object.keys(updates).length > 0 ? updates : undefined;
  }

  private checkReadinessForDebugging(session: DialogueSession): boolean {
    // Check if player has asked enough questions and gained enough understanding
    const minQuestions = 2;
    const minTopics = 1;
    
    const questionCount = session.messages.filter(msg => 
      msg.speaker === 'player' && msg.type === 'question'
    ).length;
    
    return questionCount >= minQuestions && 
           session.educationalTopics.length >= minTopics &&
           session.context.sessionProgress > 0.3;
  }

  private calculateConversationEffects(session: DialogueSession, input: string): MeterEffects | undefined {
    // Small insight gains from asking good questions
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('explain') || lowerInput.includes('how') || lowerInput.includes('why')) {
      return {
        stability: 0,
        insight: 2,
        description: "Gained insight from asking thoughtful questions"
      };
    }
    
    return undefined;
  }

  private getStabilityModifier(stability: number): string {
    if (stability < 30) return "system trembles";
    if (stability < 60) return "warnings flicker";
    return "";
  }

  private getInsightModifier(insight: number): string {
    if (insight > 75) return "understanding dawns";
    if (insight > 50) return "patterns emerge";
    return "";
  }

  private getExamplesForTopic(ghostType: string, topic: string): string[] {
    // Return relevant examples based on ghost type and topic
    return [`Example of ${ghostType} related to ${topic}`];
  }

  private getCommonMistakes(ghostType: string): string[] {
    const mistakes = {
      circular_dependency: ["Creating mutual imports", "Not using dependency injection"],
      stale_cache: ["Never invalidating cache", "Caching mutable data"],
      unbounded_recursion: ["Missing base cases", "Not limiting recursion depth"]
    };
    
    return mistakes[ghostType as keyof typeof mistakes] || [];
  }

  private getBestPractices(ghostType: string): string[] {
    const practices = {
      circular_dependency: ["Use dependency injection", "Create abstraction layers"],
      stale_cache: ["Implement cache invalidation", "Use appropriate TTL values"],
      unbounded_recursion: ["Always define base cases", "Consider iterative alternatives"]
    };
    
    return practices[ghostType as keyof typeof practices] || [];
  }

  private getFurtherReading(ghostType: string): string[] {
    return [`Learn more about ${ghostType.replace('_', ' ')} patterns`];
  }

  private generateQuestionsForLevel(
    level: 'beginner' | 'intermediate' | 'advanced',
    ghostType: string
  ): string[] {
    const questionsByLevel = {
      beginner: {
        circular_dependency: [
          "What is a circular dependency?",
          "How do I know if I have one?",
          "What problems does it cause?"
        ],
        stale_cache: [
          "What is cache staleness?",
          "How do I know my cache is stale?",
          "Why is old data a problem?"
        ],
        unbounded_recursion: [
          "What is recursion?",
          "Why does my function keep calling itself?",
          "What is a stack overflow?"
        ]
      },
      intermediate: {
        circular_dependency: [
          "How can I detect circular dependencies?",
          "What are dependency injection patterns?",
          "How do I refactor circular dependencies?"
        ],
        stale_cache: [
          "What are cache invalidation strategies?",
          "How do I implement TTL caching?",
          "What are the trade-offs of different caching approaches?"
        ],
        unbounded_recursion: [
          "How do I implement proper base cases?",
          "What are iterative alternatives to recursion?",
          "How do I optimize recursive functions?"
        ]
      },
      advanced: {
        circular_dependency: [
          "How do I implement dependency inversion?",
          "What are the architectural patterns for avoiding cycles?",
          "How do IoC containers solve dependency issues?"
        ],
        stale_cache: [
          "How do I implement event-driven cache invalidation?",
          "What are distributed caching consistency patterns?",
          "How do I design cache hierarchies?"
        ],
        unbounded_recursion: [
          "How do I implement tail call optimization?",
          "What are continuation-passing style patterns?",
          "How do I use trampolines for deep recursion?"
        ]
      }
    };

    const levelQuestions = questionsByLevel[level];
    const ghostQuestions = levelQuestions[ghostType as keyof typeof levelQuestions];
    
    return ghostQuestions || [
      "What is this problem?",
      "How do I fix it?",
      "What should I avoid?"
    ];
  }

  private generateContextualQuestions(session: DialogueSession): string[] {
    const questions: string[] = [];
    const progress = session.context.sessionProgress;
    const topicsCount = session.educationalTopics.length;
    
    // Add progress-based questions
    if (progress < 0.3) {
      questions.push("Can you explain this in simpler terms?");
    } else if (progress > 0.7) {
      questions.push("What are some advanced techniques for this?");
      questions.push("How does this relate to other software patterns?");
    }
    
    // Add engagement-based questions
    if (topicsCount < 2) {
      questions.push("Can you give me an example?");
      questions.push("What are common mistakes people make?");
    }
    
    // Add readiness-based questions
    if (session.isReadyForDebugging) {
      questions.push("I'm ready to start debugging. What should I do first?");
    } else {
      questions.push("What else should I know before we start?");
    }
    
    return questions;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation based on common words
    const words1 = text1.split(' ').filter(w => w.length > 2);
    const words2 = text2.split(' ').filter(w => w.length > 2);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }
}