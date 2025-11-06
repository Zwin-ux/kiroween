/**
 * PlayerChoiceHandler - Manages Apply/Refactor/Question choice presentation and processing
 */

import type { 
  PlayerChoiceOptions,
  PlayerChoice,
  ChoiceResult,
  ChoiceValidation,
  ConsequencePrediction,
  GameConsequence,
  DecisionPattern,
  PlayerStatistics,
  AdaptiveDifficulty
} from '../types/playerChoice';
import type { GeneratedPatch } from './PatchGenerationSystem';
import type { MeterEffects } from '../types/game';
import type { Ghost } from '../types/ghost';
import { gameplayHooks, type ChoiceMadeContext } from './GameplayHooks';

export class PlayerChoiceHandler {
  private decisionPatterns: DecisionPattern[] = [];
  private playerStats: PlayerStatistics = this.initializePlayerStats();

  constructor() {
    // Initialize gameplay hooks
    gameplayHooks.initialize().catch(error => {
      console.warn('Failed to initialize gameplay hooks in PlayerChoiceHandler:', error);
    });
  }

  /**
   * Present choice options for a generated patch
   */
  presentChoices(patch: GeneratedPatch, ghost: Ghost, currentMeters: { stability: number; insight: number }): PlayerChoiceOptions {
    const riskLevel = this.determineRiskLevel(patch.riskScore);
    const prediction = this.predictConsequences(patch, currentMeters);

    return {
      apply: {
        label: "Apply Patch",
        description: `Apply this ${patch.complexity} patch directly to the codebase`,
        riskLevel,
        expectedOutcome: this.generateApplyOutcome(patch, prediction)
      },
      refactor: {
        label: "Refactor Alternative",
        description: "Generate an alternative approach with different trade-offs",
        alternativeApproach: this.generateAlternativeDescription(patch),
        tradeoffs: this.generateTradeoffsList(patch)
      },
      question: {
        label: "Ask Questions",
        description: "Learn more about the problem before making a decision",
        availableQuestions: this.generateAvailableQuestions(patch, ghost),
        educationalValue: this.generateEducationalValue(patch)
      }
    };
  }

  /**
   * Validate a player choice before processing
   */
  validateChoice(choice: PlayerChoice, patch: GeneratedPatch, currentMeters: { stability: number; insight: number }): ChoiceValidation {
    const validation: ChoiceValidation = {
      valid: true,
      warnings: [],
      confirmationRequired: false
    };

    // Check for high-risk choices
    if (choice.type === 'apply' && patch.riskScore > 0.7) {
      validation.confirmationRequired = true;
      validation.confirmationMessage = `This patch has a high risk score (${Math.round(patch.riskScore * 100)}%). Are you sure you want to apply it?`;
    }

    // Check for stability concerns
    if (choice.type === 'apply' && currentMeters.stability < 30 && patch.expectedEffects.stability < 0) {
      validation.warnings.push("Applying this patch may critically damage system stability");
      validation.confirmationRequired = true;
      validation.confirmationMessage = "Your stability is already low. This patch may cause system failure. Continue?";
    }

    // Check for missed learning opportunities
    if (choice.type === 'apply' && patch.complexity === 'advanced' && this.playerStats.successRate < 0.6) {
      validation.warnings.push("Consider asking questions first to better understand this complex patch");
    }

    // Validate question choice
    if (choice.type === 'question' && !choice.questionAsked) {
      validation.valid = false;
      validation.warnings.push("Please specify which question you'd like to ask");
    }

    return validation;
  }

  /**
   * Process a player choice and return the result with hook integration
   */
  async processChoice(
    choice: PlayerChoice, 
    patch: GeneratedPatch, 
    ghost: Ghost,
    currentMeters: { stability: number; insight: number }
  ): Promise<ChoiceResult> {
    // Record the decision pattern
    this.recordDecisionPattern(choice, patch, ghost, currentMeters);

    // Process the choice
    let result: ChoiceResult;
    switch (choice.type) {
      case 'apply':
        result = await this.processApplyChoice(choice, patch, ghost, currentMeters);
        break;
      
      case 'refactor':
        result = await this.processRefactorChoice(choice, patch, ghost, currentMeters);
        break;
      
      case 'question':
        result = await this.processQuestionChoice(choice, patch, ghost, currentMeters);
        break;
      
      default:
        throw new Error(`Unknown choice type: ${(choice as any).type}`);
    }

    // Execute choice made hooks for analytics and adaptation
    try {
      const hookContext: ChoiceMadeContext = {
        choice: choice.type,
        patch,
        reasoning: choice.reasoning,
        playerStats: this.convertToHookPlayerStats(),
        consequences: result.effects
      };

      const hookResult = await gameplayHooks.executeChoiceMadeHooks(hookContext);
      
      if (hookResult.success && hookResult.data) {
        // Enhance result with hook insights
        if (hookResult.data.adaptiveFeedback) {
          result.newDialogue = `${result.newDialogue}\n\n*${hookResult.data.adaptiveFeedback}*`;
        }
        
        if (hookResult.data.reinforcementContent) {
          result.unlockedContent = result.unlockedContent || [];
          result.unlockedContent.push(`reinforcement_${Date.now()}`);
        }

        // Apply learning model updates
        if (hookResult.data.learningModelUpdate) {
          this.applyLearningModelUpdate(hookResult.data.learningModelUpdate);
        }
      }
    } catch (error) {
      console.warn('Choice made hooks failed:', error);
      // Continue without hook enhancements
    }

    // Update player statistics
    this.updatePlayerStatistics(choice, result);

    return result;
  }

  /**
   * Predict consequences of applying a patch
   */
  predictConsequences(patch: GeneratedPatch, currentMeters: { stability: number; insight: number }): ConsequencePrediction {
    const meterChanges = { ...patch.expectedEffects };
    const riskFactors: string[] = [];
    const benefits: string[] = [];
    const immediateEffects: string[] = [];
    const longTermEffects: string[] = [];

    // Analyze risk factors
    if (patch.riskScore > 0.7) {
      riskFactors.push("High probability of unintended side effects");
      immediateEffects.push("Potential system instability");
    }

    if (patch.complexity === 'advanced') {
      riskFactors.push("Complex implementation may introduce new bugs");
      longTermEffects.push("Requires ongoing maintenance and expertise");
    }

    if (currentMeters.stability < 30) {
      riskFactors.push("Low system stability increases failure risk");
    }

    // Analyze benefits
    if (patch.expectedEffects.stability > 10) {
      benefits.push("Significant stability improvement");
      immediateEffects.push("System becomes more reliable");
    }

    if (patch.expectedEffects.insight > 8) {
      benefits.push("High educational value");
      longTermEffects.push("Improved debugging skills");
    }

    if (patch.educationalNotes.length > 2) {
      benefits.push("Rich learning content available");
    }

    // Adjust meter changes based on current state
    if (currentMeters.stability < 20 && meterChanges.stability < 0) {
      meterChanges.stability = Math.floor(meterChanges.stability * 1.5); // Amplify negative effects when stability is low
    }

    return {
      meterChanges,
      riskFactors,
      benefits,
      immediateEffects,
      longTermEffects
    };
  }

  /**
   * Get current player statistics
   */
  getPlayerStatistics(): PlayerStatistics {
    return { ...this.playerStats };
  }

  /**
   * Calculate adaptive difficulty recommendations
   */
  calculateAdaptiveDifficulty(): AdaptiveDifficulty {
    const recentPatterns = this.decisionPatterns.slice(-20); // Last 20 decisions
    const avgRiskTolerance = recentPatterns.length > 0 
      ? recentPatterns.reduce((sum, p) => sum + p.riskTolerance, 0) / recentPatterns.length
      : 0.5;

    const successRate = this.playerStats.successRate;
    const learningProgress = this.calculateLearningProgress();
    const engagementLevel = this.calculateEngagementLevel();

    // Calculate current difficulty level (1-10)
    let currentLevel = 5; // Start at medium
    
    if (successRate > 0.8 && avgRiskTolerance > 0.6) {
      currentLevel = Math.min(10, currentLevel + 2);
    } else if (successRate < 0.4 || avgRiskTolerance < 0.3) {
      currentLevel = Math.max(1, currentLevel - 2);
    }

    // Generate recommendations
    const recommendations = {
      ghostComplexity: this.recommendGhostComplexity(currentLevel, successRate),
      patchRiskRange: this.recommendPatchRiskRange(avgRiskTolerance, successRate) as [number, number],
      educationalSupport: this.recommendEducationalSupport(learningProgress, successRate),
      hintFrequency: this.recommendHintFrequency(successRate, engagementLevel)
    };

    return {
      currentLevel,
      adjustmentFactors: {
        successRate,
        riskTolerance: avgRiskTolerance,
        learningProgress,
        engagementLevel
      },
      recommendations
    };
  }

  /**
   * Update player statistics based on choice outcome
   */
  updatePlayerStatistics(choice: PlayerChoice, result: ChoiceResult): void {
    this.playerStats.totalChoices++;
    this.playerStats.choiceBreakdown[choice.type]++;

    // Update success rate
    const wasSuccessful = result.success && result.effects.stability >= 0;
    const totalSuccesses = this.playerStats.successRate * (this.playerStats.totalChoices - 1);
    this.playerStats.successRate = (totalSuccesses + (wasSuccessful ? 1 : 0)) / this.playerStats.totalChoices;

    // Update preferred approach
    this.updatePreferredApproach();

    // Update learning style based on choice patterns
    this.updateLearningStyle();

    // Calculate improvement trend
    this.updateImprovementTrend();
  }

  // Private helper methods

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore < 0.4) return 'low';
    if (riskScore < 0.7) return 'medium';
    return 'high';
  }

  private generateApplyOutcome(patch: GeneratedPatch, prediction: ConsequencePrediction): string {
    const stabilityChange = prediction.meterChanges.stability;
    const insightChange = prediction.meterChanges.insight;

    let outcome = `Stability ${stabilityChange >= 0 ? '+' : ''}${stabilityChange}, Insight ${insightChange >= 0 ? '+' : ''}${insightChange}`;

    if (prediction.riskFactors.length > 0) {
      outcome += `. Risk: ${prediction.riskFactors[0]}`;
    } else if (prediction.benefits.length > 0) {
      outcome += `. Benefit: ${prediction.benefits[0]}`;
    }

    return outcome;
  }

  private generateAlternativeDescription(patch: GeneratedPatch): string {
    const alternatives = {
      'simple': 'A more comprehensive approach that addresses root causes',
      'moderate': 'A simpler, lower-risk approach with faster implementation',
      'complex': 'A streamlined approach focusing on immediate fixes',
      'advanced': 'A more accessible approach suitable for broader team adoption'
    };

    return alternatives[patch.complexity] || 'A different approach with alternative trade-offs';
  }

  private generateTradeoffsList(patch: GeneratedPatch): string[] {
    const tradeoffs: string[] = [];

    if (patch.riskScore > 0.6) {
      tradeoffs.push("Lower risk vs. potentially reduced effectiveness");
    } else {
      tradeoffs.push("Higher effectiveness vs. increased complexity");
    }

    if (patch.complexity === 'advanced') {
      tradeoffs.push("Simpler implementation vs. less comprehensive solution");
    } else {
      tradeoffs.push("More thorough solution vs. increased development time");
    }

    tradeoffs.push("Different learning objectives and skill requirements");

    return tradeoffs;
  }

  private generateAvailableQuestions(patch: GeneratedPatch, ghost: Ghost): string[] {
    const questions: string[] = [
      "What exactly does this patch do?",
      "What are the potential risks and how can I mitigate them?",
      "Are there alternative approaches to solving this problem?"
    ];

    // Add patch-specific questions
    if (patch.riskScore > 0.6) {
      questions.push("Why is this patch considered high-risk?");
    }

    if (patch.complexity === 'advanced') {
      questions.push("Can you explain the advanced concepts involved?");
    }

    // Add ghost-specific questions
    questions.push(`How does this relate to ${ghost.softwareSmell} problems in general?`);
    questions.push("What should I watch out for when implementing this fix?");

    return questions;
  }

  private generateEducationalValue(patch: GeneratedPatch): string {
    const values: string[] = [];

    if (patch.educationalNotes.length > 2) {
      values.push("Rich educational content available");
    }

    if (patch.complexity === 'advanced') {
      values.push("Advanced debugging concepts");
    }

    values.push("Understanding of software quality principles");
    values.push("Practical problem-solving experience");

    return values.join(", ");
  }

  private async processApplyChoice(
    choice: PlayerChoice,
    patch: GeneratedPatch,
    ghost: Ghost,
    currentMeters: { stability: number; insight: number }
  ): Promise<ChoiceResult> {
    const prediction = this.predictConsequences(patch, currentMeters);
    const consequences: GameConsequence[] = [];

    // Generate consequences based on patch risk and current state
    if (patch.riskScore > 0.7) {
      consequences.push({
        type: 'visual_effect',
        severity: 'major',
        description: 'Screen glitch effects from high-risk patch application',
        effects: { glitchIntensity: 0.8, duration: 3000 }
      });
    }

    if (prediction.meterChanges.stability < -10) {
      consequences.push({
        type: 'audio_cue',
        severity: 'moderate',
        description: 'System warning sounds',
        effects: { soundType: 'warning', volume: 0.7 }
      });
    }

    // Determine success based on risk and player skill
    const successProbability = Math.max(0.3, 1.0 - (patch.riskScore * 0.7));
    const success = Math.random() < successProbability;

    let effects = prediction.meterChanges;
    if (!success) {
      // Reduce positive effects and amplify negative effects on failure
      effects = {
        stability: Math.floor(effects.stability * 0.3),
        insight: Math.floor(effects.insight * 0.5),
        description: `Failed application: ${effects.description}`
      };
    }

    return {
      success,
      effects,
      consequences,
      newDialogue: success 
        ? patch.ghostResponse 
        : "The patch failed to apply correctly. The ghost grows more agitated...",
      unlockedContent: success ? [`patch_success_${ghost.softwareSmell}`] : undefined
    };
  }

  private async processRefactorChoice(
    choice: PlayerChoice,
    patch: GeneratedPatch,
    ghost: Ghost,
    currentMeters: { stability: number; insight: number }
  ): Promise<ChoiceResult> {
    // Refactor choice generates an alternative patch
    const consequences: GameConsequence[] = [{
      type: 'trigger_event',
      severity: 'minor',
      description: 'Alternative patch generation initiated',
      effects: { eventType: 'generate_alternative', patchId: patch.id }
    }];

    // Small insight gain for choosing to explore alternatives
    const effects: MeterEffects = {
      stability: 0,
      insight: 3,
      description: "Gained insight from exploring alternative approaches"
    };

    return {
      success: true,
      effects,
      consequences,
      newDialogue: "Let me show you a different approach to this problem...",
      unlockedContent: [`alternative_approach_${ghost.softwareSmell}`]
    };
  }

  private async processQuestionChoice(
    choice: PlayerChoice,
    patch: GeneratedPatch,
    ghost: Ghost,
    currentMeters: { stability: number; insight: number }
  ): Promise<ChoiceResult> {
    if (!choice.questionAsked) {
      throw new Error("Question choice requires a specific question");
    }

    const consequences: GameConsequence[] = [{
      type: 'unlock_content',
      severity: 'minor',
      description: 'Educational content unlocked',
      effects: { contentType: 'explanation', topic: choice.questionAsked }
    }];

    // Insight gain for asking questions
    const insightGain = this.calculateQuestionInsightGain(choice.questionAsked, patch);
    const effects: MeterEffects = {
      stability: 0,
      insight: insightGain,
      description: `Learned about: ${choice.questionAsked}`
    };

    const educationalResponse = this.generateEducationalResponse(choice.questionAsked, patch, ghost);

    return {
      success: true,
      effects,
      consequences,
      newDialogue: educationalResponse,
      unlockedContent: [`education_${ghost.softwareSmell}_${Date.now()}`]
    };
  }

  private recordDecisionPattern(
    choice: PlayerChoice,
    patch: GeneratedPatch,
    ghost: Ghost,
    currentMeters: { stability: number; insight: number }
  ): void {
    const pattern: DecisionPattern = {
      playerId: 'current_player', // TODO: Get from game state
      choiceType: choice.type,
      riskTolerance: choice.type === 'apply' ? patch.riskScore : 
                    choice.type === 'refactor' ? 0.5 : 0.2,
      frequency: 1,
      timestamp: new Date(),
      context: {
        ghostType: ghost.softwareSmell,
        roomId: 'current_room', // TODO: Get from game state
        patchRisk: patch.riskScore,
        meterLevels: currentMeters
      }
    };

    this.decisionPatterns.push(pattern);

    // Keep only last 100 patterns to prevent memory bloat
    if (this.decisionPatterns.length > 100) {
      this.decisionPatterns = this.decisionPatterns.slice(-100);
    }
  }

  private calculateQuestionInsightGain(question: string, patch: GeneratedPatch): number {
    let baseGain = 5;

    // Higher gain for complex patches
    if (patch.complexity === 'advanced') baseGain += 3;
    if (patch.complexity === 'complex') baseGain += 2;

    // Higher gain for risk-related questions
    if (question.toLowerCase().includes('risk')) baseGain += 2;
    if (question.toLowerCase().includes('alternative')) baseGain += 2;

    return baseGain;
  }

  private generateEducationalResponse(question: string, patch: GeneratedPatch, ghost: Ghost): string {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('what') && lowerQuestion.includes('patch')) {
      return `This patch ${patch.explanation}. ${patch.educationalNotes[0] || 'It addresses the core issue in the code.'}`;
    }

    if (lowerQuestion.includes('risk')) {
      return `The risk level is ${Math.round(patch.riskScore * 100)}% because ${this.explainRiskFactors(patch)}. ${patch.educationalNotes.find(note => note.includes('risk')) || 'Consider testing thoroughly before deployment.'}`;
    }

    if (lowerQuestion.includes('alternative')) {
      return `Alternative approaches include ${patch.alternatives?.join(', ') || 'refactoring the underlying architecture'}. Each approach has different trade-offs in terms of complexity and maintainability.`;
    }

    if (lowerQuestion.includes(ghost.softwareSmell)) {
      return `${ghost.softwareSmell} issues typically occur when ${this.explainSoftwareSmell(ghost.softwareSmell)}. ${patch.educationalNotes.find(note => note.includes(ghost.softwareSmell)) || 'This is a common problem in software development.'}`;
    }

    // Default educational response
    return `${patch.explanation} This approach is considered ${patch.complexity} because it ${this.explainComplexity(patch.complexity)}. ${patch.educationalNotes[0] || 'Understanding this concept will improve your debugging skills.'}`;
  }

  private explainRiskFactors(patch: GeneratedPatch): string {
    if (patch.riskScore > 0.7) {
      return "it involves significant changes to core functionality";
    } else if (patch.riskScore > 0.4) {
      return "it modifies important system components";
    } else {
      return "it makes localized changes with minimal impact";
    }
  }

  private explainSoftwareSmell(softwareSmell: string): string {
    const explanations = {
      'circular_dependency': 'modules depend on each other in a cycle, preventing proper initialization',
      'stale_cache': 'cached data becomes outdated and inconsistent with the source',
      'unbounded_recursion': 'recursive functions lack proper termination conditions',
      'prompt_injection': 'user input is not properly validated or sanitized',
      'data_leak': 'sensitive information is exposed through logs or error messages',
      'dead_code': 'unused code accumulates and clutters the codebase',
      'race_condition': 'multiple threads access shared resources without proper synchronization',
      'memory_leak': 'allocated memory is not properly released, causing gradual resource exhaustion'
    };

    return explanations[softwareSmell as keyof typeof explanations] || 'the code violates good software engineering principles';
  }

  private explainComplexity(complexity: string): string {
    const explanations = {
      'simple': 'requires minimal changes and has low risk of side effects',
      'moderate': 'involves standard programming practices with manageable complexity',
      'complex': 'requires understanding of advanced concepts and careful implementation',
      'advanced': 'involves sophisticated techniques and deep architectural knowledge'
    };

    return explanations[complexity as keyof typeof explanations] || 'has specific implementation requirements';
  }

  private initializePlayerStats(): PlayerStatistics {
    return {
      totalChoices: 0,
      choiceBreakdown: {
        apply: 0,
        refactor: 0,
        question: 0
      },
      averageRiskTolerance: 0.5,
      preferredApproach: 'analytical',
      learningStyle: 'hands_on',
      successRate: 0.5,
      improvementTrend: 0
    };
  }

  private updatePreferredApproach(): void {
    const { apply, refactor, question } = this.playerStats.choiceBreakdown;
    const total = apply + refactor + question;

    if (total === 0) return;

    const applyRatio = apply / total;
    const refactorRatio = refactor / total;
    const questionRatio = question / total;

    if (questionRatio > 0.4) {
      this.playerStats.preferredApproach = 'analytical';
    } else if (applyRatio > 0.6 && this.playerStats.averageRiskTolerance > 0.6) {
      this.playerStats.preferredApproach = 'aggressive';
    } else if (refactorRatio > 0.4) {
      this.playerStats.preferredApproach = 'experimental';
    } else {
      this.playerStats.preferredApproach = 'cautious';
    }
  }

  private updateLearningStyle(): void {
    const recentPatterns = this.decisionPatterns.slice(-10);
    const questionRatio = recentPatterns.filter(p => p.choiceType === 'question').length / Math.max(1, recentPatterns.length);

    if (questionRatio > 0.5) {
      this.playerStats.learningStyle = 'theoretical';
    } else if (this.playerStats.choiceBreakdown.apply > this.playerStats.choiceBreakdown.refactor) {
      this.playerStats.learningStyle = 'hands_on';
    } else {
      this.playerStats.learningStyle = 'visual';
    }
  }

  private updateImprovementTrend(): void {
    if (this.decisionPatterns.length < 10) {
      this.playerStats.improvementTrend = 0;
      return;
    }

    const recent = this.decisionPatterns.slice(-5);
    const earlier = this.decisionPatterns.slice(-10, -5);

    const recentSuccess = recent.filter(p => p.riskTolerance > 0.3).length / recent.length;
    const earlierSuccess = earlier.filter(p => p.riskTolerance > 0.3).length / earlier.length;

    this.playerStats.improvementTrend = Math.max(-1, Math.min(1, (recentSuccess - earlierSuccess) * 2));
  }

  private calculateLearningProgress(): number {
    const recentPatterns = this.decisionPatterns.slice(-20);
    if (recentPatterns.length === 0) return 0.5;

    const complexityScore = recentPatterns.reduce((sum, p) => {
      // Higher score for handling more complex situations
      return sum + p.riskTolerance;
    }, 0) / recentPatterns.length;

    return Math.min(1.0, complexityScore);
  }

  private calculateEngagementLevel(): number {
    const recentPatterns = this.decisionPatterns.slice(-10);
    if (recentPatterns.length === 0) return 0.5;

    const questionRatio = recentPatterns.filter(p => p.choiceType === 'question').length / recentPatterns.length;
    const refactorRatio = recentPatterns.filter(p => p.choiceType === 'refactor').length / recentPatterns.length;

    // Higher engagement for asking questions and exploring alternatives
    return Math.min(1.0, (questionRatio + refactorRatio) * 1.5);
  }

  private recommendGhostComplexity(level: number, successRate: number): 'simple' | 'moderate' | 'complex' | 'advanced' {
    if (level <= 3 || successRate < 0.4) return 'simple';
    if (level <= 6 || successRate < 0.7) return 'moderate';
    if (level <= 8 || successRate < 0.85) return 'complex';
    return 'advanced';
  }

  private recommendPatchRiskRange(riskTolerance: number, successRate: number): [number, number] {
    const baseMin = Math.max(0.1, riskTolerance - 0.3);
    const baseMax = Math.min(0.9, riskTolerance + 0.2);

    // Adjust based on success rate
    if (successRate < 0.5) {
      return [baseMin, Math.min(0.6, baseMax)]; // Cap risk for struggling players
    } else if (successRate > 0.8) {
      return [Math.max(0.2, baseMin), baseMax]; // Allow higher risk for successful players
    }

    return [baseMin, baseMax];
  }

  private recommendEducationalSupport(learningProgress: number, successRate: number): 'minimal' | 'moderate' | 'extensive' {
    if (learningProgress < 0.3 || successRate < 0.4) return 'extensive';
    if (learningProgress < 0.7 || successRate < 0.7) return 'moderate';
    return 'minimal';
  }

  private recommendHintFrequency(successRate: number, engagementLevel: number): 'rare' | 'occasional' | 'frequent' {
    if (successRate < 0.4 || engagementLevel < 0.3) return 'frequent';
    if (successRate < 0.7 || engagementLevel < 0.6) return 'occasional';
    return 'rare';
  }

  /**
   * Convert internal player stats to hook-compatible format
   */
  private convertToHookPlayerStats(): any {
    return {
      encountersCompleted: this.playerStats.totalChoices,
      patchesApplied: this.playerStats.choiceBreakdown.apply,
      questionsAsked: this.playerStats.choiceBreakdown.question,
      averageRiskTolerance: this.playerStats.averageRiskTolerance,
      successRate: this.playerStats.successRate,
      learningStyle: this.mapLearningStyle(this.playerStats.learningStyle),
      conceptsMastered: this.extractConceptsMastered(),
      preferredApproaches: [this.playerStats.preferredApproach]
    };
  }

  /**
   * Map internal learning style to hook format
   */
  private mapLearningStyle(style: string): 'analytical' | 'practical' | 'experimental' | 'cautious' {
    const mapping: Record<string, 'analytical' | 'practical' | 'experimental' | 'cautious'> = {
      'theoretical': 'analytical',
      'hands_on': 'practical',
      'visual': 'experimental'
    };
    return mapping[style] || 'cautious';
  }

  /**
   * Extract concepts mastered from decision patterns
   */
  private extractConceptsMastered(): string[] {
    const concepts = new Set<string>();
    
    // Extract unique ghost types from successful encounters
    this.decisionPatterns
      .filter(pattern => pattern.riskTolerance > 0.3) // Consider successful if reasonable risk taken
      .forEach(pattern => {
        if (pattern.context.ghostType) {
          concepts.add(pattern.context.ghostType);
        }
      });
    
    return Array.from(concepts);
  }

  /**
   * Apply learning model updates from hooks
   */
  private applyLearningModelUpdate(update: any): void {
    if (update.updatedRiskProfile !== undefined) {
      // Gradually adjust risk tolerance based on hook feedback
      this.playerStats.averageRiskTolerance = 
        (this.playerStats.averageRiskTolerance * 0.8) + (update.updatedRiskProfile * 0.2);
    }

    if (update.updatedLearningStyle) {
      // Update learning style if hook suggests a change
      const styleMapping: Record<string, 'visual' | 'hands_on' | 'theoretical' | 'collaborative'> = {
        'analytical': 'theoretical',
        'practical': 'hands_on',
        'experimental': 'visual',
        'cautious': 'theoretical'
      };
      
      const newStyle = styleMapping[update.updatedLearningStyle];
      if (newStyle) {
        this.playerStats.learningStyle = newStyle;
      }
    }

    if (update.adaptationNeeds && update.adaptationNeeds.length > 0) {
      // Log adaptation needs for future reference
      console.log('Player adaptation needs:', update.adaptationNeeds);
    }
  }
}