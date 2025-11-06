/**
 * PatchGenerationSystem - Advanced patch generation with intent analysis and risk scoring
 */

import type { 
  PatchPlan,
  ValidationResult
} from '../types/patch';
import type { MeterEffects, GameState, GameContext } from '../types/game';
import type { Ghost } from '../types/ghost';
import type { MCPTools } from '../types/kiro';
import { kiroIntegration, type KiroPatchRequest } from './KiroIntegration';
import { mcpGameplayTools } from './MCPGameplayTools';
import { EventManager, GameEventType } from './EventManager';

export interface PatchContext {
  ghost: Ghost;
  dialogueHistory: any[]; // Will be properly typed when dialogue types are available
  playerIntent: string;
  codeContext: string;
  roomContext: string;
  playerSkillLevel: number;
}

export interface GeneratedPatch {
  id: string;
  diff: string;
  description: string;
  explanation: string;
  riskScore: number; // 0.0 to 1.0
  expectedEffects: MeterEffects;
  educationalNotes: string[];
  alternatives?: string[];
  ghostResponse: string;
  complexity: PatchComplexity;
  impact: PatchImpact;
}

export interface PatchSession {
  id: string;
  ghostEncounterId: string;
  playerIntent: string;
  generatedPatches: GeneratedPatch[];
  selectedPatch?: GeneratedPatch;
  applicationResult?: any; // Will be properly typed when patch application types are available
  createdAt: Date;
}

export enum PatchComplexity {
  Simple = 'simple',
  Moderate = 'moderate',
  Complex = 'complex',
  Advanced = 'advanced'
}

export enum PatchImpact {
  Minimal = 'minimal',
  Localized = 'localized',
  Moderate = 'moderate',
  Significant = 'significant',
  SystemWide = 'system_wide'
}

export interface IntentAnalysis {
  approach: FixApproach;
  confidence: number;
  keywords: string[];
  complexity: PatchComplexity;
  urgency: 'low' | 'medium' | 'high';
}

export enum FixApproach {
  QuickFix = 'quick_fix',
  Refactor = 'refactor',
  SecurityFix = 'security_fix',
  Optimization = 'optimization',
  Standard = 'standard'
}

export interface TradeOffAnalysis {
  riskComparison: ComparisonResult;
  complexityComparison: ComparisonResult;
  effectsComparison: EffectsComparison;
  recommendedChoice: RecommendedChoice;
  tradeOffSummary: string;
}

export interface ComparisonResult {
  winner: 'patch1' | 'patch2' | 'tie';
  difference: number;
  explanation: string;
}

export interface EffectsComparison {
  stabilityDifference: number;
  insightDifference: number;
  overallBetter: 'patch1' | 'patch2' | 'tie';
  explanation: string;
}

export interface RecommendedChoice {
  patchId: string;
  confidence: number;
  reasoning: string[];
  considerations: string[];
}

export interface ApproachExplanation {
  patchId: string;
  approachType: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
  learningObjectives: string[];
}

export class PatchGenerationSystem {
  private patchSessions = new Map<string, PatchSession>();
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private complexityFactors: Map<string, number> = new Map();
  private eventManager: EventManager | null = null;

  constructor(private mcpTools: MCPTools, eventManager?: EventManager) {
    this.initializeIntentPatterns();
    this.initializeComplexityFactors();
    this.eventManager = eventManager || null;
    
    // Initialize MCP gameplay tools
    mcpGameplayTools.initialize().catch(error => {
      console.warn('Failed to initialize MCP gameplay tools:', error);
    });
  }

  /**
   * Set the event manager for cross-system communication
   */
  setEventManager(eventManager: EventManager): void {
    this.eventManager = eventManager;
  }

  /**
   * Generate a patch based on player intent and context
   */
  async generatePatch(intent: string, context: PatchContext): Promise<GeneratedPatch> {
    try {
      // Initialize Kiro integration
      await kiroIntegration.initialize();

      // Analyze player intent
      const intentAnalysis = this.analyzeIntent(intent, context.ghost);
      
      // Generate patch using Kiro integration
      const kiroPatch = await this.generateKiroPatch(intent, context, intentAnalysis);
      
      // Calculate risk score
      const riskScore = this.calculateRiskScore(kiroPatch, context, intentAnalysis);
      
      // Calculate expected effects
      const expectedEffects = this.calculateExpectedEffects(context.ghost, intentAnalysis, riskScore);
      
      // Generate educational notes
      const educationalNotes = await this.generateEducationalNotes(context.ghost, intentAnalysis);
      
      // Generate ghost response
      const ghostResponse = this.generateGhostResponse(context.ghost, intentAnalysis, riskScore);

      const generatedPatch: GeneratedPatch = {
        id: `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        diff: kiroPatch.diff,
        description: kiroPatch.description,
        explanation: kiroPatch.explanation,
        riskScore,
        expectedEffects,
        educationalNotes,
        alternatives: kiroPatch.alternatives,
        ghostResponse,
        complexity: intentAnalysis.complexity,
        impact: this.calculateImpact(context.ghost, intentAnalysis)
      };

      // Execute Kiro hook for patch generation
      try {
        const hookContext = {
          patch: generatedPatch,
          intent,
          ghost: context.ghost,
          playerSkillLevel: context.playerSkillLevel,
          roomContext: context.roomContext
        };
        
        const enhancedContext = await kiroIntegration.executeHook('onPatchGenerated', hookContext);
        
        // Apply hook enhancements to the patch
        if (enhancedContext.kiroAnalysis) {
          generatedPatch.educationalNotes.push(...(enhancedContext.kiroAnalysis.learningPoints || []));
        }
        
        if (enhancedContext.alternativeApproaches) {
          generatedPatch.alternatives = enhancedContext.alternativeApproaches as string[];
        }
      } catch (error) {
        console.warn('Kiro patch generation hook failed:', error);
      }

      // Emit patch generated event for cross-system communication
      if (this.eventManager) {
        this.eventManager.emit({
          type: GameEventType.PATCH_GENERATED,
          timestamp: new Date(),
          source: 'PatchGenerationSystem',
          data: {
            patchId: generatedPatch.id,
            ghostId: context.ghost.id,
            playerIntent: intent,
            riskScore: generatedPatch.riskScore,
            complexity: generatedPatch.complexity,
            expectedEffects: generatedPatch.expectedEffects
          },
          priority: 'medium'
        });
      }

      return generatedPatch;
    } catch (error) {
      console.warn('Kiro patch generation failed, using fallback:', error);
      return this.generateFallbackPatch(intent, context);
    }
  }

  /**
   * Analyze trade-offs between different patch approaches
   */
  analyzeTradeOffs(patch1: GeneratedPatch, patch2: GeneratedPatch): TradeOffAnalysis {
    return {
      riskComparison: this.compareRisk(patch1, patch2),
      complexityComparison: this.compareComplexity(patch1, patch2),
      effectsComparison: this.compareEffects(patch1, patch2),
      recommendedChoice: this.getRecommendedChoice(patch1, patch2),
      tradeOffSummary: this.generateTradeOffSummary(patch1, patch2)
    };
  }

  /**
   * Generate educational explanations for different approaches
   */
  generateApproachExplanations(patches: GeneratedPatch[]): ApproachExplanation[] {
    return patches.map(patch => ({
      patchId: patch.id,
      approachType: this.identifyApproachType(patch),
      whenToUse: this.getWhenToUseGuidance(patch),
      pros: this.getApproachPros(patch),
      cons: this.getApproachCons(patch),
      learningObjectives: this.getLearningObjectives(patch)
    }));
  }

  /**
   * Generate an alternative patch approach using MCP tools
   */
  async generateAlternative(originalPatch: GeneratedPatch): Promise<GeneratedPatch> {
    try {
      // Try MCP alternative generation first
      const mcpAlternatives = await mcpGameplayTools.generateAlternatives(originalPatch, {
        originalApproach: originalPatch.explanation,
        riskTolerance: originalPatch.riskScore > 0.7 ? 'low' : 'high',
        complexity: originalPatch.complexity
      });

      if (mcpAlternatives.length > 0) {
        const mcpAlternative = mcpAlternatives[0];
        
        const alternativePatch: GeneratedPatch = {
          ...originalPatch,
          id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          diff: mcpAlternative.diff || this.generateAlternativeDiff(originalPatch),
          description: `Alternative: ${mcpAlternative.description}`,
          explanation: mcpAlternative.explanation || `Alternative approach with different trade-offs`,
          riskScore: this.calculateAlternativeRisk(originalPatch.riskScore),
          expectedEffects: this.calculateAlternativeEffects(originalPatch.expectedEffects),
          educationalNotes: [
            ...originalPatch.educationalNotes,
            ...(mcpAlternative.tradeOffs || [`This alternative approach offers different trade-offs`])
          ],
          ghostResponse: this.generateAlternativeGhostResponse(originalPatch.ghostResponse)
        };

        return alternativePatch;
      }
    } catch (error) {
      console.warn('MCP alternative generation failed, trying Kiro integration:', error);
    }

    try {
      // Fallback to Kiro integration to generate alternative approach
      const alternativeRequest: KiroPatchRequest = {
        ghostType: originalPatch.description.includes('circular') ? 'circular_dependency' : 'unknown',
        playerIntent: `Generate alternative to: ${originalPatch.description}`,
        context: `Original approach: ${originalPatch.explanation}`,
        difficulty: originalPatch.complexity === PatchComplexity.Simple ? 'beginner' : 
                   originalPatch.complexity === PatchComplexity.Moderate ? 'intermediate' : 'advanced',
        riskTolerance: originalPatch.riskScore > 0.7 ? 'low' : originalPatch.riskScore > 0.4 ? 'medium' : 'high'
      };

      const kiroAlternative = await kiroIntegration.generatePatch(alternativeRequest);
      
      // Create alternative patch with different trade-offs
      const alternativePatch: GeneratedPatch = {
        ...originalPatch,
        id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        diff: kiroAlternative.diff,
        description: `Alternative: ${kiroAlternative.description}`,
        explanation: kiroAlternative.explanation,
        riskScore: this.calculateAlternativeRisk(originalPatch.riskScore),
        expectedEffects: this.calculateAlternativeEffects(originalPatch.expectedEffects),
        educationalNotes: [
          ...originalPatch.educationalNotes,
          `This alternative approach trades ${this.getTradeOffDescription(originalPatch, kiroAlternative)}`
        ],
        ghostResponse: this.generateAlternativeGhostResponse(originalPatch.ghostResponse)
      };

      return alternativePatch;
    } catch (error) {
      console.warn('Kiro alternative generation failed, using fallback:', error);
      return this.generateFallbackAlternative(originalPatch);
    }
  }

  /**
   * Validate a patch for safety and correctness using MCP tools
   */
  async validatePatch(patch: GeneratedPatch): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    try {
      // Validate patch structure
      this.validatePatchStructure(patch, result);
      
      // Validate risk score reasonableness
      this.validateRiskScore(patch, result);
      
      // Validate educational content
      this.validateEducationalContent(patch, result);

      // Try MCP validation first
      try {
        const mcpValidation = await mcpGameplayTools.validatePatch({
          diff: patch.diff,
          ghostType: patch.description.includes('circular') ? 'circular_dependency' : 'unknown',
          riskThreshold: 0.7,
          securityChecks: true
        });

        // Integrate MCP validation results
        if (mcpValidation.security && !mcpValidation.security.passed) {
          result.securityIssues.push(...mcpValidation.security.issues);
        }

        if (mcpValidation.quality && mcpValidation.quality.score < 0.6) {
          result.warnings.push(...mcpValidation.quality.suggestions);
        }

        if (mcpValidation.performance && mcpValidation.performance.warnings.length > 0) {
          result.warnings.push(...mcpValidation.performance.warnings);
        }

      } catch (mcpError) {
        console.warn('MCP validation failed, using fallback:', mcpError);
      }
      
      // Fallback to existing PatchSystem validation for security
      if (this.mcpTools.lint) {
        const codeContent = this.extractCodeFromDiff(patch.diff);
        if (codeContent) {
          const lintResult = await this.mcpTools.lint.run(codeContent, {
            'no-eval': 'error',
            'no-unsafe-inline': 'error',
            'no-dangerous-functions': 'error'
          });
          
          if (!lintResult.passed) {
            lintResult.issues.forEach(issue => {
              if (issue.severity === 'error') {
                result.errors.push(`Line ${issue.line}: ${issue.message}`);
              } else {
                result.warnings.push(`Line ${issue.line}: ${issue.message}`);
              }
            });
          }
        }
      }
      
      result.valid = result.errors.length === 0 && result.securityIssues.length === 0;
      return result;
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Calculate risk score for a patch
   */
  calculateRiskScore(patch: any, context: PatchContext, intentAnalysis: IntentAnalysis): number {
    let baseRisk = 0.5;
    
    // Adjust for ghost severity
    baseRisk += (context.ghost.severity / 20);
    
    // Adjust for patch complexity
    const complexityMultiplier = {
      [PatchComplexity.Simple]: 0.8,
      [PatchComplexity.Moderate]: 1.0,
      [PatchComplexity.Complex]: 1.3,
      [PatchComplexity.Advanced]: 1.6
    };
    baseRisk *= complexityMultiplier[intentAnalysis.complexity];
    
    // Adjust for fix approach
    const approachRisk = {
      [FixApproach.QuickFix]: 1.2,
      [FixApproach.Standard]: 1.0,
      [FixApproach.Refactor]: 1.4,
      [FixApproach.SecurityFix]: 0.8,
      [FixApproach.Optimization]: 1.1
    };
    baseRisk *= approachRisk[intentAnalysis.approach];
    
    // Adjust for player skill level
    const skillFactor = Math.max(0.7, 1.2 - (context.playerSkillLevel / 100));
    baseRisk *= skillFactor;
    
    // Adjust for intent confidence
    baseRisk *= (2 - intentAnalysis.confidence);
    
    return Math.min(1.0, Math.max(0.0, baseRisk));
  }

  /**
   * Create a new patch session
   */
  createPatchSession(ghostEncounterId: string, playerIntent: string): PatchSession {
    const session: PatchSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ghostEncounterId,
      playerIntent,
      generatedPatches: [],
      createdAt: new Date()
    };
    
    this.patchSessions.set(session.id, session);
    return session;
  }

  /**
   * Add patch to session
   */
  addPatchToSession(sessionId: string, patch: GeneratedPatch): void {
    const session = this.patchSessions.get(sessionId);
    if (session) {
      session.generatedPatches.push(patch);
    }
  }

  /**
   * Get patch session
   */
  getPatchSession(sessionId: string): PatchSession | undefined {
    return this.patchSessions.get(sessionId);
  }

  // Private helper methods

  private analyzeIntent(intent: string, ghost: Ghost): IntentAnalysis {
    const lowerIntent = intent.toLowerCase();
    let approach = FixApproach.Standard;
    let confidence = 0.5;
    const keywords: string[] = [];
    let complexity = PatchComplexity.Moderate;
    let urgency: 'low' | 'medium' | 'high' = 'medium';

    // Analyze approach keywords
    for (const [approachType, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(lowerIntent)) {
          approach = approachType as FixApproach;
          confidence += 0.2;
          keywords.push(pattern.source);
        }
      }
    }

    // Analyze complexity indicators
    if (lowerIntent.includes('simple') || lowerIntent.includes('quick') || lowerIntent.includes('basic')) {
      complexity = PatchComplexity.Simple;
    } else if (lowerIntent.includes('complex') || lowerIntent.includes('advanced') || lowerIntent.includes('comprehensive')) {
      complexity = PatchComplexity.Advanced;
    } else if (lowerIntent.includes('refactor') || lowerIntent.includes('restructure')) {
      complexity = PatchComplexity.Complex;
    }

    // Analyze urgency
    if (lowerIntent.includes('urgent') || lowerIntent.includes('critical') || lowerIntent.includes('immediately')) {
      urgency = 'high';
    } else if (lowerIntent.includes('when possible') || lowerIntent.includes('eventually')) {
      urgency = 'low';
    }

    // Adjust confidence based on intent clarity
    const intentLength = intent.split(' ').length;
    if (intentLength < 3) {
      confidence *= 0.7; // Vague intent
    } else if (intentLength > 10) {
      confidence *= 1.2; // Detailed intent
    }

    // Default approach based on ghost type if no clear intent
    if (confidence < 0.6) {
      approach = this.getDefaultApproachForGhost(ghost);
      confidence = 0.6;
    }

    return {
      approach,
      confidence: Math.min(1.0, confidence),
      keywords,
      complexity,
      urgency
    };
  }

  private async generateKiroPatch(intent: string, context: PatchContext, intentAnalysis: IntentAnalysis): Promise<any> {
    const difficulty = context.playerSkillLevel > 75 ? 'advanced' : 
                      context.playerSkillLevel > 40 ? 'intermediate' : 'beginner';

    try {
      // Try to use MCP gameplay tools for enhanced patch generation
      const mcpPatchResult = await mcpGameplayTools.generatePatch({
        intent,
        ghostType: context.ghost.softwareSmell,
        codeContext: context.codeContext,
        playerSkillLevel: context.playerSkillLevel,
        roomContext: context.roomContext,
        difficulty
      });
      
      if (mcpPatchResult && mcpPatchResult.diff) {
        return mcpPatchResult;
      }
    } catch (error) {
      console.warn('MCP patch generation failed, trying Kiro integration:', error);
    }

    // Fallback to Kiro integration
    const patchRequest: KiroPatchRequest = {
      ghostType: context.ghost.softwareSmell,
      playerIntent: intent,
      context: `Room: ${context.roomContext}, Ghost: ${context.ghost.name}`,
      difficulty,
      riskTolerance: intentAnalysis.urgency === 'high' ? 'high' : 
                    intentAnalysis.urgency === 'low' ? 'low' : 'medium'
    };

    try {
      // Try to use MCP tools for enhanced analysis
      const mcpAnalysis = await kiroIntegration.callMCPTool('patch-analyzer', 'analyze-patch', {
        intent,
        ghostType: context.ghost.softwareSmell,
        context: context.roomContext,
        playerSkillLevel: context.playerSkillLevel
      });
      
      // Combine Kiro integration with MCP tool results
      const kiroResult = await kiroIntegration.generatePatch(patchRequest);
      
      return {
        ...kiroResult,
        mcpAnalysis,
        enhancedRiskScore: (mcpAnalysis as any).riskScore || (kiroResult as any).riskScore || 0.5,
        mcpRecommendations: (mcpAnalysis as any).recommendations || []
      };
    } catch (error) {
      console.warn('MCP patch analysis failed, using standard Kiro integration:', error);
      return await kiroIntegration.generatePatch(patchRequest);
    }
  }

  private calculateExpectedEffects(ghost: Ghost, intentAnalysis: IntentAnalysis, riskScore: number): MeterEffects {
    let stabilityEffect = 10;
    let insightEffect = 5;

    // Base effects from ghost severity
    stabilityEffect += Math.floor(ghost.severity * 1.5);
    insightEffect += Math.floor(ghost.severity * 0.8);

    // Adjust for approach type
    switch (intentAnalysis.approach) {
      case FixApproach.QuickFix:
        stabilityEffect *= 0.8;
        insightEffect *= 0.6;
        break;
      case FixApproach.Refactor:
        stabilityEffect *= 1.3;
        insightEffect *= 1.5;
        break;
      case FixApproach.SecurityFix:
        stabilityEffect *= 1.1;
        insightEffect *= 1.3;
        break;
      case FixApproach.Optimization:
        stabilityEffect *= 1.2;
        insightEffect *= 1.1;
        break;
    }

    // Adjust for risk (higher risk = potential for negative effects)
    if (riskScore > 0.7) {
      stabilityEffect *= (1 - (riskScore - 0.7) * 2);
      insightEffect *= 0.9;
    } else if (riskScore < 0.3) {
      stabilityEffect *= 1.2;
      insightEffect *= 1.1;
    }

    // Adjust for complexity
    const complexityMultiplier = {
      [PatchComplexity.Simple]: { stability: 0.8, insight: 0.7 },
      [PatchComplexity.Moderate]: { stability: 1.0, insight: 1.0 },
      [PatchComplexity.Complex]: { stability: 1.2, insight: 1.4 },
      [PatchComplexity.Advanced]: { stability: 1.4, insight: 1.8 }
    };
    
    const multiplier = complexityMultiplier[intentAnalysis.complexity];
    stabilityEffect *= multiplier.stability;
    insightEffect *= multiplier.insight;

    return {
      stability: Math.round(stabilityEffect),
      insight: Math.round(insightEffect),
      description: `Applied ${intentAnalysis.approach} to ${ghost.name}`
    };
  }

  private async generateEducationalNotes(ghost: Ghost, intentAnalysis: IntentAnalysis): Promise<string[]> {
    const notes: string[] = [];

    // Add approach-specific educational notes
    switch (intentAnalysis.approach) {
      case FixApproach.QuickFix:
        notes.push("Quick fixes provide immediate relief but may not address root causes");
        notes.push("Consider following up with a more comprehensive solution");
        break;
      case FixApproach.Refactor:
        notes.push("Refactoring improves code structure and maintainability");
        notes.push("This approach may require more testing but provides long-term benefits");
        break;
      case FixApproach.SecurityFix:
        notes.push("Security fixes should be thoroughly tested and reviewed");
        notes.push("Consider the principle of least privilege when implementing");
        break;
      case FixApproach.Optimization:
        notes.push("Performance optimizations should be measured and validated");
        notes.push("Premature optimization can sometimes reduce code clarity");
        break;
    }

    // Add ghost-specific educational notes
    const ghostNotes = this.getGhostSpecificNotes(ghost.softwareSmell);
    notes.push(...ghostNotes);

    // Add complexity-specific notes
    if (intentAnalysis.complexity === PatchComplexity.Advanced) {
      notes.push("This advanced approach requires careful consideration of edge cases");
    } else if (intentAnalysis.complexity === PatchComplexity.Simple) {
      notes.push("Simple solutions are often the most maintainable");
    }

    return notes;
  }

  private generateGhostResponse(ghost: Ghost, intentAnalysis: IntentAnalysis, riskScore: number): string {
    const responses = {
      low_risk: [
        "Ahh... you understand the true nature of the problem. I can rest now...",
        "Yes... this approach will free me from this torment...",
        "The code feels lighter already... well done..."
      ],
      medium_risk: [
        "Better... but be careful. The corruption runs deeper than you think...",
        "This may work, but watch for unintended consequences...",
        "You're on the right path, but tread carefully..."
      ],
      high_risk: [
        "Dangerous! Your fix may cause more harm than good!",
        "This approach is reckless... the system may not survive...",
        "I fear what you're about to unleash..."
      ]
    };

    const riskCategory = riskScore < 0.4 ? 'low_risk' : riskScore < 0.7 ? 'medium_risk' : 'high_risk';
    const categoryResponses = responses[riskCategory];
    
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }

  private calculateImpact(ghost: Ghost, intentAnalysis: IntentAnalysis): PatchImpact {
    let impactScore = ghost.severity / 10;

    // Adjust for approach
    switch (intentAnalysis.approach) {
      case FixApproach.QuickFix:
        impactScore *= 0.6;
        break;
      case FixApproach.Refactor:
        impactScore *= 1.5;
        break;
      case FixApproach.SecurityFix:
        impactScore *= 1.2;
        break;
      case FixApproach.Optimization:
        impactScore *= 1.1;
        break;
    }

    // Adjust for complexity
    const complexityImpact = {
      [PatchComplexity.Simple]: 0.7,
      [PatchComplexity.Moderate]: 1.0,
      [PatchComplexity.Complex]: 1.4,
      [PatchComplexity.Advanced]: 1.8
    };
    impactScore *= complexityImpact[intentAnalysis.complexity];

    if (impactScore < 0.3) return PatchImpact.Minimal;
    if (impactScore < 0.6) return PatchImpact.Localized;
    if (impactScore < 1.0) return PatchImpact.Moderate;
    if (impactScore < 1.5) return PatchImpact.Significant;
    return PatchImpact.SystemWide;
  }

  private generateFallbackPatch(intent: string, context: PatchContext): GeneratedPatch {
    const intentAnalysis = this.analyzeIntent(intent, context.ghost);
    const riskScore = 0.5; // Default moderate risk
    
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      diff: this.generateFallbackDiff(context.ghost, intentAnalysis),
      description: `${intentAnalysis.approach} for ${context.ghost.name}`,
      explanation: `Applied ${intentAnalysis.approach} approach to address ${context.ghost.softwareSmell}`,
      riskScore,
      expectedEffects: this.calculateExpectedEffects(context.ghost, intentAnalysis, riskScore),
      educationalNotes: [`This is a ${intentAnalysis.complexity} approach to fixing ${context.ghost.softwareSmell}`],
      ghostResponse: this.generateGhostResponse(context.ghost, intentAnalysis, riskScore),
      complexity: intentAnalysis.complexity,
      impact: this.calculateImpact(context.ghost, intentAnalysis)
    };
  }

  private generateFallbackDiff(ghost: Ghost, intentAnalysis: IntentAnalysis): string {
    const fileName = `haunted_${ghost.softwareSmell}.js`;
    
    return `--- a/${fileName}
+++ b/${fileName}
@@ -1,8 +1,12 @@
 // Haunted module: ${ghost.name}
 // Software smell: ${ghost.softwareSmell}
-// Status: INFECTED
+// Status: PATCHED
 
-// Problematic code
+// Applied fix: ${intentAnalysis.approach}
+
 ${this.generateProblemCode(ghost.softwareSmell)}
 
+${this.generateFixCode(ghost.softwareSmell, intentAnalysis.approach)}
+
 // End of haunted module`;
  }

  private generateProblemCode(softwareSmell: string): string {
    const problemCodes = {
      circular_dependency: 'import moduleB from "./moduleB";\n// moduleB imports this module back',
      stale_cache: 'let cache = new Map();\n// Cache never expires or invalidates',
      unbounded_recursion: 'function recursiveFunction(n) {\n  return recursiveFunction(n + 1);\n}',
      prompt_injection: 'function processInput(userInput) {\n  return eval(userInput);\n}',
      data_leak: 'console.log("User password:", user.password);',
      dead_code: 'function unusedFunction() {\n  // This function is never called\n}',
      race_condition: 'let sharedCounter = 0;\n// Multiple threads access without synchronization',
      memory_leak: 'let leakedData = [];\nsetInterval(() => leakedData.push(new Array(1000)), 100);'
    };

    return problemCodes[softwareSmell as keyof typeof problemCodes] || '// Problematic code here';
  }

  private generateFixCode(softwareSmell: string, approach: FixApproach): string {
    const fixCodes = {
      circular_dependency: {
        [FixApproach.QuickFix]: '// Quick fix: Use dynamic import\nconst moduleB = await import("./moduleB");',
        [FixApproach.Refactor]: '// Refactor: Use dependency injection\nconst moduleB = inject("moduleB");',
        [FixApproach.SecurityFix]: '// Security fix: Validate dependencies\nconst moduleB = validateAndImport("./moduleB");',
        [FixApproach.Optimization]: '// Optimization: Lazy loading\nconst moduleB = lazyLoad("./moduleB");',
        [FixApproach.Standard]: '// Standard fix: Break dependency cycle\nconst moduleB = require("./moduleB");'
      },
      stale_cache: {
        [FixApproach.QuickFix]: '// Quick fix: Add simple TTL\nif (Date.now() - cacheTime > 60000) cache.clear();',
        [FixApproach.Refactor]: '// Refactor: Implement proper cache invalidation\nconst cache = new TTLCache({ ttl: 60000 });',
        [FixApproach.SecurityFix]: '// Security fix: Secure cache access\nconst cache = new SecureCache({ ttl: 60000, encrypt: true });',
        [FixApproach.Optimization]: '// Optimization: Smart cache strategy\nconst cache = new AdaptiveCache({ strategy: "lru-ttl" });',
        [FixApproach.Standard]: '// Standard fix: Add cache expiration\ncache.set(key, value, { ttl: 60000 });'
      },
      unbounded_recursion: {
        [FixApproach.QuickFix]: '// Quick fix: Add depth limit\nif (n > 1000) return n;',
        [FixApproach.Refactor]: '// Refactor: Convert to iterative\nlet result = n;\nwhile (condition) { result = transform(result); }',
        [FixApproach.SecurityFix]: '// Security fix: Validate input and limit depth\nif (!isValidInput(n) || depth > MAX_DEPTH) throw new Error("Invalid recursion");',
        [FixApproach.Optimization]: '// Optimization: Tail call optimization\nreturn tailCallOptimized(n, accumulator);',
        [FixApproach.Standard]: '// Standard fix: Add base case\nif (n <= 0) return 0;'
      }
    };

    const ghostFixes = fixCodes[softwareSmell as keyof typeof fixCodes];
    if (ghostFixes) {
      return ghostFixes[approach] || ghostFixes[FixApproach.Standard] || '// Fixed implementation';
    }

    return '// Fixed implementation';
  }

  private calculateAlternativeRisk(originalRisk: number): number {
    // Alternative should have different risk profile
    if (originalRisk > 0.7) {
      return Math.max(0.2, originalRisk - 0.4); // Lower risk alternative
    } else if (originalRisk < 0.3) {
      return Math.min(0.8, originalRisk + 0.4); // Higher risk alternative
    } else {
      return originalRisk > 0.5 ? originalRisk - 0.3 : originalRisk + 0.3;
    }
  }

  private calculateAlternativeEffects(originalEffects: MeterEffects): MeterEffects {
    return {
      stability: Math.round(originalEffects.stability * 0.8),
      insight: Math.round(originalEffects.insight * 1.2),
      description: `Alternative approach: ${originalEffects.description}`
    };
  }

  private generateAlternativeDiff(originalPatch: GeneratedPatch): string {
    // Generate a simple alternative diff based on the original
    const originalLines = originalPatch.diff.split('\n');
    const modifiedLines = originalLines.map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return line.replace('Applied fix:', 'Alternative fix:');
      }
      return line;
    });
    
    return modifiedLines.join('\n');
  }

  private generateFallbackAlternative(originalPatch: GeneratedPatch): GeneratedPatch {
    return {
      ...originalPatch,
      id: `alt_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `Alternative: ${originalPatch.description}`,
      explanation: `Alternative approach with different trade-offs: ${originalPatch.explanation}`,
      riskScore: this.calculateAlternativeRisk(originalPatch.riskScore),
      expectedEffects: this.calculateAlternativeEffects(originalPatch.expectedEffects),
      educationalNotes: [
        ...originalPatch.educationalNotes,
        "This alternative approach offers different trade-offs in terms of complexity and maintainability"
      ],
      ghostResponse: this.generateAlternativeGhostResponse(originalPatch.ghostResponse)
    };
  }

  private generateAlternativeGhostResponse(originalResponse: string): string {
    const alternatives = [
      "Perhaps... there is another way...",
      "This path may lead to the same destination...",
      "Different approach, but the outcome remains uncertain...",
      "Another perspective on the same problem..."
    ];
    
    return alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  private getTradeOffDescription(original: GeneratedPatch, alternative: any): string {
    if (original.riskScore > alternative.riskScore) {
      return "lower risk for potentially reduced performance";
    } else {
      return "higher performance for increased complexity";
    }
  }

  private getDefaultApproachForGhost(ghost: Ghost): FixApproach {
    const defaultApproaches = {
      circular_dependency: FixApproach.Refactor,
      stale_cache: FixApproach.Standard,
      unbounded_recursion: FixApproach.Standard,
      prompt_injection: FixApproach.SecurityFix,
      data_leak: FixApproach.SecurityFix,
      dead_code: FixApproach.Refactor,
      race_condition: FixApproach.Standard,
      memory_leak: FixApproach.Optimization
    };

    return defaultApproaches[ghost.softwareSmell as keyof typeof defaultApproaches] || FixApproach.Standard;
  }

  private getGhostSpecificNotes(softwareSmell: string): string[] {
    const notes = {
      circular_dependency: [
        "Circular dependencies can prevent proper module initialization",
        "Consider using dependency injection or interface segregation"
      ],
      stale_cache: [
        "Cache invalidation is one of the hardest problems in computer science",
        "Consider event-driven invalidation strategies"
      ],
      unbounded_recursion: [
        "Always ensure recursive functions have proper termination conditions",
        "Consider tail call optimization for deep recursion"
      ],
      prompt_injection: [
        "Never trust user input without proper validation and sanitization",
        "Use parameterized queries and input validation libraries"
      ],
      data_leak: [
        "Sensitive data should never appear in logs or error messages",
        "Implement proper data classification and access controls"
      ]
    };

    return notes[softwareSmell as keyof typeof notes] || ["Consider the long-term maintainability of this solution"];
  }

  private validatePatchStructure(patch: GeneratedPatch, result: ValidationResult): void {
    if (!patch.diff || patch.diff.trim().length === 0) {
      result.errors.push("Patch diff is empty or missing");
    }

    if (!patch.description || patch.description.trim().length === 0) {
      result.errors.push("Patch description is missing");
    }

    if (patch.riskScore < 0 || patch.riskScore > 1) {
      result.errors.push("Risk score must be between 0 and 1");
    }

    if (!patch.expectedEffects) {
      result.errors.push("Expected effects are missing");
    }
  }

  private validateRiskScore(patch: GeneratedPatch, result: ValidationResult): void {
    // Check if risk score is reasonable for the patch complexity
    const expectedRiskRanges = {
      [PatchComplexity.Simple]: [0.1, 0.4],
      [PatchComplexity.Moderate]: [0.2, 0.6],
      [PatchComplexity.Complex]: [0.4, 0.8],
      [PatchComplexity.Advanced]: [0.6, 1.0]
    };

    const [minRisk, maxRisk] = expectedRiskRanges[patch.complexity];
    if (patch.riskScore < minRisk || patch.riskScore > maxRisk) {
      result.warnings.push(`Risk score ${patch.riskScore} seems unusual for ${patch.complexity} complexity`);
    }
  }

  private validateEducationalContent(patch: GeneratedPatch, result: ValidationResult): void {
    if (!patch.educationalNotes || patch.educationalNotes.length === 0) {
      result.warnings.push("Educational notes are missing - consider adding learning content");
    }

    if (!patch.explanation || patch.explanation.length < 20) {
      result.warnings.push("Patch explanation is too brief - consider adding more detail");
    }
  }

  private extractCodeFromDiff(diff: string): string {
    const lines = diff.split('\n');
    const codeLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        codeLines.push(line.substring(1));
      }
    }
    
    return codeLines.join('\n');
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns.set(FixApproach.QuickFix, [
      /quick/i,
      /fast/i,
      /simple/i,
      /temporary/i,
      /hotfix/i
    ]);

    this.intentPatterns.set(FixApproach.Refactor, [
      /refactor/i,
      /restructure/i,
      /redesign/i,
      /clean up/i,
      /improve/i
    ]);

    this.intentPatterns.set(FixApproach.SecurityFix, [
      /secure/i,
      /safe/i,
      /protect/i,
      /validate/i,
      /sanitize/i
    ]);

    this.intentPatterns.set(FixApproach.Optimization, [
      /optimize/i,
      /performance/i,
      /faster/i,
      /efficient/i,
      /speed up/i
    ]);
  }

  private initializeComplexityFactors(): void {
    this.complexityFactors.set('lines_changed', 0.1);
    this.complexityFactors.set('files_affected', 0.2);
    this.complexityFactors.set('dependencies_modified', 0.3);
    this.complexityFactors.set('api_changes', 0.4);
    this.complexityFactors.set('architecture_changes', 0.5);
  }

  // Trade-off analysis methods

  private compareRisk(patch1: GeneratedPatch, patch2: GeneratedPatch): ComparisonResult {
    const difference = patch1.riskScore - patch2.riskScore;
    const absDifference = Math.abs(difference);
    
    let winner: 'patch1' | 'patch2' | 'tie';
    let explanation: string;

    if (absDifference < 0.1) {
      winner = 'tie';
      explanation = "Both patches have similar risk levels";
    } else if (difference < 0) {
      winner = 'patch1';
      explanation = `Patch 1 has ${Math.round(absDifference * 100)}% lower risk`;
    } else {
      winner = 'patch2';
      explanation = `Patch 2 has ${Math.round(absDifference * 100)}% lower risk`;
    }

    return { winner, difference: absDifference, explanation };
  }

  private compareComplexity(patch1: GeneratedPatch, patch2: GeneratedPatch): ComparisonResult {
    const complexityScores = {
      [PatchComplexity.Simple]: 1,
      [PatchComplexity.Moderate]: 2,
      [PatchComplexity.Complex]: 3,
      [PatchComplexity.Advanced]: 4
    };

    const score1 = complexityScores[patch1.complexity];
    const score2 = complexityScores[patch2.complexity];
    const difference = Math.abs(score1 - score2);

    let winner: 'patch1' | 'patch2' | 'tie';
    let explanation: string;

    if (difference === 0) {
      winner = 'tie';
      explanation = "Both patches have similar complexity";
    } else if (score1 < score2) {
      winner = 'patch1';
      explanation = `Patch 1 is simpler (${patch1.complexity} vs ${patch2.complexity})`;
    } else {
      winner = 'patch2';
      explanation = `Patch 2 is simpler (${patch2.complexity} vs ${patch1.complexity})`;
    }

    return { winner, difference, explanation };
  }

  private compareEffects(patch1: GeneratedPatch, patch2: GeneratedPatch): EffectsComparison {
    const stabilityDiff = patch1.expectedEffects.stability - patch2.expectedEffects.stability;
    const insightDiff = patch1.expectedEffects.insight - patch2.expectedEffects.insight;
    
    // Calculate overall score (stability weighted more heavily)
    const score1 = patch1.expectedEffects.stability * 1.5 + patch1.expectedEffects.insight;
    const score2 = patch2.expectedEffects.stability * 1.5 + patch2.expectedEffects.insight;
    
    let overallBetter: 'patch1' | 'patch2' | 'tie';
    let explanation: string;

    if (Math.abs(score1 - score2) < 2) {
      overallBetter = 'tie';
      explanation = "Both patches offer similar overall benefits";
    } else if (score1 > score2) {
      overallBetter = 'patch1';
      explanation = "Patch 1 offers better overall meter improvements";
    } else {
      overallBetter = 'patch2';
      explanation = "Patch 2 offers better overall meter improvements";
    }

    return {
      stabilityDifference: stabilityDiff,
      insightDifference: insightDiff,
      overallBetter,
      explanation
    };
  }

  private getRecommendedChoice(patch1: GeneratedPatch, patch2: GeneratedPatch): RecommendedChoice {
    const riskComp = this.compareRisk(patch1, patch2);
    const complexityComp = this.compareComplexity(patch1, patch2);
    const effectsComp = this.compareEffects(patch1, patch2);

    // Scoring system: lower risk and complexity are better, higher effects are better
    let score1 = 0;
    let score2 = 0;

    // Risk scoring (lower is better)
    if (riskComp.winner === 'patch1') score1 += 3;
    else if (riskComp.winner === 'patch2') score2 += 3;

    // Complexity scoring (lower is better)
    if (complexityComp.winner === 'patch1') score1 += 2;
    else if (complexityComp.winner === 'patch2') score2 += 2;

    // Effects scoring (higher is better)
    if (effectsComp.overallBetter === 'patch1') score1 += 2;
    else if (effectsComp.overallBetter === 'patch2') score2 += 2;

    const reasoning: string[] = [];
    const considerations: string[] = [];

    let recommendedPatch: GeneratedPatch;
    let confidence: number;

    if (score1 > score2) {
      recommendedPatch = patch1;
      confidence = Math.min(0.9, 0.5 + (score1 - score2) * 0.1);
    } else if (score2 > score1) {
      recommendedPatch = patch2;
      confidence = Math.min(0.9, 0.5 + (score2 - score1) * 0.1);
    } else {
      // Tie - choose based on risk (safer option)
      recommendedPatch = patch1.riskScore <= patch2.riskScore ? patch1 : patch2;
      confidence = 0.5;
    }

    // Generate reasoning
    if (riskComp.winner !== 'tie') {
      reasoning.push(`${riskComp.explanation}`);
    }
    if (complexityComp.winner !== 'tie') {
      reasoning.push(`${complexityComp.explanation}`);
    }
    if (effectsComp.overallBetter !== 'tie') {
      reasoning.push(`${effectsComp.explanation}`);
    }

    // Generate considerations
    if (recommendedPatch.riskScore > 0.6) {
      considerations.push("High risk - ensure thorough testing");
    }
    if (recommendedPatch.complexity === 'advanced') {
      considerations.push("Advanced complexity - consider team expertise");
    }
    if (recommendedPatch.impact === 'system_wide') {
      considerations.push("System-wide impact - plan deployment carefully");
    }

    return {
      patchId: recommendedPatch.id,
      confidence,
      reasoning: reasoning.length > 0 ? reasoning : ["Both approaches have similar trade-offs"],
      considerations
    };
  }

  private generateTradeOffSummary(patch1: GeneratedPatch, patch2: GeneratedPatch): string {
    const riskComp = this.compareRisk(patch1, patch2);
    const complexityComp = this.compareComplexity(patch1, patch2);
    const effectsComp = this.compareEffects(patch1, patch2);

    let summary = "Trade-off Analysis: ";

    if (riskComp.winner === 'patch1') {
      summary += "Patch 1 is safer but ";
    } else if (riskComp.winner === 'patch2') {
      summary += "Patch 2 is safer but ";
    }

    if (complexityComp.winner === 'patch1') {
      summary += "Patch 1 is simpler. ";
    } else if (complexityComp.winner === 'patch2') {
      summary += "Patch 2 is simpler. ";
    }

    if (effectsComp.overallBetter === 'patch1') {
      summary += "Patch 1 provides better overall benefits.";
    } else if (effectsComp.overallBetter === 'patch2') {
      summary += "Patch 2 provides better overall benefits.";
    } else {
      summary += "Both patches offer similar benefits.";
    }

    return summary;
  }

  // Approach explanation methods

  private identifyApproachType(patch: GeneratedPatch): string {
    // Analyze the patch to identify the approach type
    const diff = patch.diff.toLowerCase();
    const description = patch.description.toLowerCase();

    if (diff.includes('inject') || description.includes('injection')) {
      return 'Dependency Injection';
    } else if (diff.includes('ttl') || description.includes('expiration')) {
      return 'Cache Management';
    } else if (diff.includes('base case') || description.includes('recursion')) {
      return 'Recursion Control';
    } else if (diff.includes('sanitize') || description.includes('validation')) {
      return 'Input Validation';
    } else if (diff.includes('refactor') || description.includes('restructure')) {
      return 'Code Refactoring';
    } else {
      return 'Standard Fix';
    }
  }

  private getWhenToUseGuidance(patch: GeneratedPatch): string {
    const approachType = this.identifyApproachType(patch);
    
    const guidance = {
      'Dependency Injection': "Use when you need to break circular dependencies or improve testability",
      'Cache Management': "Use when dealing with stale data or performance optimization needs",
      'Recursion Control': "Use when preventing stack overflow or optimizing recursive algorithms",
      'Input Validation': "Use when securing against injection attacks or ensuring data integrity",
      'Code Refactoring': "Use when improving code maintainability and long-term architecture",
      'Standard Fix': "Use for straightforward bug fixes with minimal architectural impact"
    };

    return guidance[approachType as keyof typeof guidance] || "Use when the specific problem context matches this solution";
  }

  private getApproachPros(patch: GeneratedPatch): string[] {
    const pros: string[] = [];

    // Risk-based pros
    if (patch.riskScore < 0.4) {
      pros.push("Low risk of introducing new issues");
    }

    // Complexity-based pros
    if (patch.complexity === 'simple') {
      pros.push("Easy to understand and maintain");
      pros.push("Quick to implement");
    } else if (patch.complexity === 'advanced') {
      pros.push("Comprehensive solution addressing root causes");
      pros.push("Provides long-term architectural benefits");
    }

    // Effects-based pros
    if (patch.expectedEffects.stability > 15) {
      pros.push("Significant stability improvement");
    }
    if (patch.expectedEffects.insight > 10) {
      pros.push("High educational value");
    }

    // Approach-specific pros
    const approachType = this.identifyApproachType(patch);
    switch (approachType) {
      case 'Dependency Injection':
        pros.push("Improves testability and modularity");
        break;
      case 'Cache Management':
        pros.push("Balances performance with data freshness");
        break;
      case 'Recursion Control':
        pros.push("Prevents stack overflow errors");
        break;
      case 'Input Validation':
        pros.push("Enhances security posture");
        break;
    }

    return pros.length > 0 ? pros : ["Addresses the immediate problem effectively"];
  }

  private getApproachCons(patch: GeneratedPatch): string[] {
    const cons: string[] = [];

    // Risk-based cons
    if (patch.riskScore > 0.6) {
      cons.push("Higher risk of unintended side effects");
    }

    // Complexity-based cons
    if (patch.complexity === 'advanced') {
      cons.push("Requires advanced understanding to maintain");
      cons.push("May be over-engineered for simple problems");
    } else if (patch.complexity === 'simple') {
      cons.push("May not address underlying architectural issues");
    }

    // Effects-based cons
    if (patch.expectedEffects.stability < 5) {
      cons.push("Limited stability improvement");
    }

    // Impact-based cons
    if (patch.impact === 'system_wide') {
      cons.push("Affects multiple system components");
      cons.push("Requires coordination across teams");
    }

    return cons.length > 0 ? cons : ["May require additional testing and validation"];
  }

  private getLearningObjectives(patch: GeneratedPatch): string[] {
    const objectives: string[] = [];
    const approachType = this.identifyApproachType(patch);

    // Approach-specific learning objectives
    switch (approachType) {
      case 'Dependency Injection':
        objectives.push("Understand inversion of control principles");
        objectives.push("Learn about loose coupling in software design");
        break;
      case 'Cache Management':
        objectives.push("Understand cache invalidation strategies");
        objectives.push("Learn about performance vs. consistency trade-offs");
        break;
      case 'Recursion Control':
        objectives.push("Understand recursion termination conditions");
        objectives.push("Learn about stack management and optimization");
        break;
      case 'Input Validation':
        objectives.push("Understand security validation principles");
        objectives.push("Learn about input sanitization techniques");
        break;
      case 'Code Refactoring':
        objectives.push("Understand code quality principles");
        objectives.push("Learn about maintainable code patterns");
        break;
    }

    // Complexity-based objectives
    if (patch.complexity === 'advanced') {
      objectives.push("Explore advanced software engineering concepts");
    }

    // Risk-based objectives
    if (patch.riskScore > 0.6) {
      objectives.push("Understand risk assessment in software changes");
    }

    return objectives.length > 0 ? objectives : ["Apply problem-solving skills to software issues"];
  }

  /**
   * Apply a patch with the specified action
   */
  async applyPatch(patch: any, action: string): Promise<any> {
    try {
      // Create base application result
      const applicationResult = {
        success: true,
        compileEvents: [] as any[],
        effects: this.calculateActionEffects(patch, action),
        feedback: this.generateApplicationFeedback(action, patch),
        learningPoints: this.generateLearningPoints(action, patch),
        actionType: action,
        timestamp: new Date()
      };

      // Process different actions with specific logic
      switch (action) {
        case 'apply':
          await this.processDirectApplication(patch, applicationResult);
          break;
        
        case 'refactor':
          await this.processRefactorApplication(patch, applicationResult);
          break;
        
        case 'question':
          await this.processQuestioningAction(patch, applicationResult);
          break;
        
        case 'reject':
          await this.processRejectionAction(patch, applicationResult);
          break;
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Generate compile events based on the action and result
      const compileEvents = await this.generateCompileEventsForAction(
        patch, 
        action, 
        applicationResult.success
      );
      applicationResult.compileEvents = compileEvents;

      // Emit patch application event for cross-system communication
      if (this.eventManager) {
        this.eventManager.emit({
          type: GameEventType.PATCH_APPLIED,
          timestamp: new Date(),
          source: 'PatchGenerationSystem',
          data: {
            action,
            success: applicationResult.success,
            patchId: patch.id,
            riskScore: patch.riskScore,
            effects: applicationResult.effects
          },
          priority: 'high'
        });
      }

      return applicationResult;

    } catch (error) {
      console.error('Failed to apply patch:', error);
      
      const errorResult = {
        success: false,
        compileEvents: [{
          id: `error_${Date.now()}`,
          type: 'error',
          timestamp: new Date(),
          description: `Patch application error: ${(error as Error).message}`,
          effects: { stability: -5, insight: 0, description: 'Application error' },
          deterministic: true
        }],
        effects: { stability: -5, insight: 0, description: 'Patch application error' },
        feedback: `Patch application failed: ${(error as Error).message}`,
        learningPoints: ['Always test patches in a safe environment', 'Handle errors gracefully'],
        actionType: action,
        timestamp: new Date(),
        error: (error as Error).message
      };

      return errorResult;
    }
  }

  /**
   * Calculate effects based on action type and patch characteristics
   */
  private calculateActionEffects(patch: any, action: string): any {
    const baseEffects = patch.expectedEffects || { stability: 0, insight: 0, description: 'Action applied' };
    
    switch (action) {
      case 'apply':
        // Direct application - use base effects but adjust for risk
        return {
          stability: Math.floor(baseEffects.stability * (1 - patch.riskScore * 0.3)),
          insight: baseEffects.insight,
          description: `Applied patch directly: ${baseEffects.description}`
        };
      
      case 'refactor':
        // Refactoring - better stability, more insight, but takes more effort
        return {
          stability: Math.floor(baseEffects.stability * 1.3),
          insight: Math.floor(baseEffects.insight * 1.5),
          description: `Refactored solution: ${baseEffects.description}`
        };
      
      case 'question':
        // Questioning - no stability change, high insight gain
        return {
          stability: 0,
          insight: Math.floor(15 + (patch.riskScore * 10)),
          description: 'Gained understanding through questioning'
        };
      
      case 'reject':
        // Rejection - slight stability loss, small insight gain
        return {
          stability: -2,
          insight: 3,
          description: 'Chose not to apply patch - problem remains'
        };
      
      default:
        return baseEffects;
    }
  }

  /**
   * Process direct patch application
   */
  private async processDirectApplication(patch: any, result: any): Promise<void> {
    const riskScore = patch.riskScore || 0.5;
    
    // High-risk patches have chance of failure
    if (riskScore > 0.8) {
      const failureChance = (riskScore - 0.8) * 5; // 0 to 1 based on risk above 0.8
      result.success = Math.random() > failureChance;
      
      if (!result.success) {
        result.effects = {
          stability: -Math.abs(result.effects.stability || 10),
          insight: Math.floor((result.effects.insight || 5) * 0.3),
          description: 'Patch application failed and caused instability'
        };
        result.feedback = 'The high-risk patch caused unexpected issues and had to be reverted.';
        result.learningPoints.push('High-risk patches require more careful testing');
      }
    }
    
    // Medium-risk patches might have partial success
    else if (riskScore > 0.6) {
      const partialFailureChance = (riskScore - 0.6) * 2.5; // 0 to 0.5 based on risk above 0.6
      if (Math.random() < partialFailureChance) {
        result.effects.stability = Math.floor(result.effects.stability * 0.7);
        result.feedback += ' Some minor issues were encountered during application.';
        result.learningPoints.push('Monitor system behavior after applying medium-risk patches');
      }
    }
  }

  /**
   * Process refactoring approach
   */
  private async processRefactorApplication(patch: any, result: any): Promise<void> {
    // Refactoring is generally safer but takes more time/effort
    result.success = true; // Refactoring rarely fails completely
    
    // Add architectural benefits
    result.effects.insight += 5; // Bonus insight for architectural thinking
    result.learningPoints.push('Refactoring addresses root causes, not just symptoms');
    
    // Check if refactoring reveals additional issues
    if (patch.complexity === 'advanced' && Math.random() < 0.3) {
      result.effects.insight += 10;
      result.feedback += ' Refactoring revealed additional architectural improvements.';
      result.learningPoints.push('Deep refactoring often uncovers hidden technical debt');
    }
  }

  /**
   * Process questioning action
   */
  private async processQuestioningAction(patch: any, result: any): Promise<void> {
    result.success = true; // Questioning always succeeds in providing insight
    
    // Generate contextual insights based on patch characteristics
    const insights = this.generateQuestioningInsights(patch);
    result.insights = insights;
    result.feedback += ` ${insights.join(' ')}`;
    
    // Bonus insight for complex patches
    if (patch.complexity === 'advanced' || patch.riskScore > 0.7) {
      result.effects.insight += 5;
      result.learningPoints.push('Asking questions about complex solutions demonstrates wisdom');
    }
  }

  /**
   * Process patch rejection
   */
  private async processRejectionAction(patch: any, result: any): Promise<void> {
    result.success = true; // Rejection is a valid choice
    
    // Provide feedback on why rejection might be wise
    if (patch.riskScore > 0.7) {
      result.effects.insight += 5;
      result.feedback = 'Wise choice - the patch was indeed high-risk. Consider a safer alternative.';
      result.learningPoints.push('Sometimes the best action is no action');
    } else {
      result.feedback = 'Patch rejected. The problem remains unresolved, but no new issues were introduced.';
      result.learningPoints.push('Conservative approaches have their place in software development');
    }
  }

  /**
   * Generate insights from questioning
   */
  private generateQuestioningInsights(patch: any): string[] {
    const insights = [];
    
    if (patch.riskScore > 0.7) {
      insights.push('This patch has high risk - consider testing in a staging environment first.');
    }
    
    if (patch.complexity === 'advanced') {
      insights.push('This is an advanced solution - ensure your team has the expertise to maintain it.');
    }
    
    if (patch.impact === 'system_wide') {
      insights.push('This change affects multiple system components - coordinate with other teams.');
    }
    
    // Add approach-specific insights
    const approachType = this.identifyApproachType(patch);
    switch (approachType) {
      case 'Dependency Injection':
        insights.push('Dependency injection improves testability but adds complexity.');
        break;
      case 'Cache Management':
        insights.push('Cache strategies involve trade-offs between performance and data freshness.');
        break;
      case 'Input Validation':
        insights.push('Security fixes should be thoroughly tested and reviewed.');
        break;
    }
    
    return insights.length > 0 ? insights : ['Consider the long-term implications of this approach.'];
  }

  /**
   * Generate compile events based on action and result
   */
  private async generateCompileEventsForAction(patch: any, action: string, success: boolean): Promise<any[]> {
    const events = [];
    
    if (action === 'apply') {
      if (success) {
        events.push({
          id: `compile_success_${Date.now()}`,
          type: 'success',
          timestamp: new Date(),
          description: 'Patch compiled and applied successfully',
          effects: { stability: 1, insight: 1, description: 'Successful compilation' },
          deterministic: true
        });
        
        // Add risk-based warnings
        if (patch.riskScore > 0.6) {
          events.push({
            id: `compile_warning_${Date.now()}`,
            type: 'warning',
            timestamp: new Date(),
            description: 'High-risk patch applied - monitor system closely',
            effects: { stability: -1, insight: 2, description: 'Risk awareness' },
            deterministic: true
          });
        }
      } else {
        events.push({
          id: `compile_error_${Date.now()}`,
          type: 'error',
          timestamp: new Date(),
          description: 'Patch application failed during compilation',
          effects: { stability: -5, insight: 3, description: 'Learning from failure' },
          deterministic: true
        });
      }
    } else if (action === 'refactor') {
      events.push({
        id: `refactor_success_${Date.now()}`,
        type: 'success',
        timestamp: new Date(),
        description: 'Code successfully refactored with improved architecture',
        effects: { stability: 2, insight: 3, description: 'Architectural improvement' },
        deterministic: true
      });
    }
    
    return events;
  }

  /**
   * Generate feedback for patch application
   */
  private generateApplicationFeedback(action: string, patch: any): string {
    const riskScore = patch.riskScore || 0.5;
    const complexity = patch.complexity || 'moderate';
    
    switch (action) {
      case 'apply':
        if (riskScore > 0.8) {
          return 'High-risk patch applied. Monitor system closely for unexpected behavior.';
        } else if (riskScore > 0.6) {
          return 'Patch applied successfully, but watch for potential side effects.';
        } else if (riskScore > 0.3) {
          return 'Patch applied successfully with moderate confidence.';
        } else {
          return 'Patch applied successfully with minimal risk.';
        }
      
      case 'refactor':
        if (complexity === 'advanced') {
          return 'Advanced refactoring completed. The architecture is significantly improved.';
        } else if (complexity === 'complex') {
          return 'Complex refactoring successful. Code maintainability has been enhanced.';
        } else {
          return 'Code refactored successfully. The structure is now cleaner and more maintainable.';
        }
      
      case 'question':
        if (riskScore > 0.7) {
          return 'Excellent question! This high-risk patch deserves careful consideration.';
        } else if (complexity === 'advanced') {
          return 'Good question! Advanced solutions require thorough understanding.';
        } else {
          return 'Good question! Understanding implications before acting shows wisdom.';
        }
      
      case 'reject':
        if (riskScore > 0.7) {
          return 'Wise decision to reject this high-risk patch. Consider safer alternatives.';
        } else {
          return 'Patch rejected. Sometimes caution is the better part of valor.';
        }
      
      default:
        return 'Action completed successfully.';
    }
  }

  /**
   * Generate learning points for patch application
   */
  private generateLearningPoints(action: string, patch: any): string[] {
    const points = [];
    const riskScore = patch.riskScore || 0.5;
    const complexity = patch.complexity || 'moderate';
    
    switch (action) {
      case 'apply':
        points.push('Direct application can be effective for well-understood problems');
        
        if (riskScore > 0.8) {
          points.push('Extremely high-risk patches should be tested in isolation first');
          points.push('Always have a rollback plan for risky changes');
        } else if (riskScore > 0.6) {
          points.push('High-risk patches require careful monitoring and rollback plans');
          points.push('Consider gradual rollout for risky changes');
        } else if (riskScore > 0.3) {
          points.push('Medium-risk patches benefit from peer review');
        } else {
          points.push('Low-risk patches can often be applied with confidence');
        }
        
        if (complexity === 'advanced') {
          points.push('Advanced patches require team expertise to maintain');
        }
        break;
      
      case 'refactor':
        points.push('Refactoring improves long-term code maintainability');
        points.push('Consider the broader architectural impact of changes');
        
        if (complexity === 'advanced') {
          points.push('Advanced refactoring can reveal hidden architectural issues');
          points.push('Complex refactoring should be done incrementally');
        } else if (complexity === 'simple') {
          points.push('Simple refactoring can have immediate benefits');
        }
        
        points.push('Refactoring is an investment in future development velocity');
        break;
      
      case 'question':
        points.push('Asking questions demonstrates good engineering judgment');
        points.push('Understanding context is crucial for effective problem-solving');
        
        if (riskScore > 0.7) {
          points.push('High-risk situations especially benefit from careful analysis');
        }
        
        if (complexity === 'advanced') {
          points.push('Complex solutions require thorough understanding before implementation');
        }
        
        points.push('The best engineers know when to pause and think');
        break;
      
      case 'reject':
        points.push('Sometimes the best action is no action');
        points.push('Conservative approaches have their place in software development');
        
        if (riskScore > 0.7) {
          points.push('Rejecting high-risk patches shows good risk management');
        }
        
        points.push('Consider alternative approaches when rejecting a solution');
        break;
    }

    // Add general learning points based on patch characteristics
    if (patch.impact === 'system_wide') {
      points.push('System-wide changes require coordination across teams');
    }
    
    if (patch.educationalNotes && patch.educationalNotes.length > 0) {
      points.push('Review educational notes to deepen understanding');
    }

    return points;
  }
}