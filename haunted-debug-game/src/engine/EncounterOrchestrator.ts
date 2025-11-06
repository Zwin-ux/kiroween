/**
 * EncounterOrchestrator - Manages complete ghost encounter workflows
 */

import type { Ghost } from '@/types/content';
import type { GameContext } from '@/types/game';
import type { 
  EncounterSession, 
  PatchOption, 
  AppliedPatch, 
  Consequence, 
  EncounterOutcome,
  PatchAction,
  PatchApplicationResult
} from '@/types/encounter';
import type { DialogueChoice } from '@/types/dialogue';
import type { PatchPlan } from '@/types/patch';
import { DialogueEngine } from './DialogueEngine';
import { PatchGenerationSystem } from './PatchGenerationSystem';
import { DynamicMeterSystem } from './DynamicMeterSystem';
import { EffectsSystemImpl } from './EffectsSystem';
import { EventManager, GameEventType } from './EventManager';

export interface EncounterOrchestrator {
  startEncounter(ghost: Ghost, context: GameContext): Promise<EncounterSession>;
  processDialogueChoice(sessionId: string, choice: DialogueChoice): Promise<any>;
  generatePatchOptions(intent: string, ghost: Ghost): Promise<PatchOption[]>;
  applyPatchChoice(patchId: string, action: PatchAction): Promise<any>;
  completeEncounter(sessionId: string): Promise<EncounterOutcome>;
  initialize(gameState: any): Promise<void>;
  cleanup(): Promise<void>;
  getState(): any;
  restoreState(state: any): Promise<void>;
  getActiveGhost(): Ghost | null;
  getCurrentPlayerIntent(): string | undefined;
}

export class EncounterOrchestratorImpl implements EncounterOrchestrator {
  private activeSessions: Map<string, EncounterSession> = new Map();
  private activeGhost: Ghost | null = null;
  private currentPlayerIntent: string | null = null;

  constructor(
    private dialogueEngine: DialogueEngine,
    private patchSystem: PatchGenerationSystem,
    private meterSystem: DynamicMeterSystem,
    private effectsSystem: EffectsSystemImpl,
    private eventManager: EventManager
  ) {}

  /**
   * Initialize the encounter orchestrator
   */
  async initialize(gameState: any): Promise<void> {
    console.log('EncounterOrchestrator initialized');
  }

  /**
   * Start a new ghost encounter
   */
  async startEncounter(ghost: Ghost, context: GameContext): Promise<EncounterSession> {
    try {
      const sessionId = this.generateSessionId();
      
      // Create encounter session
      const session: EncounterSession = {
        id: sessionId,
        ghostId: ghost.id,
        roomId: context.gameState.currentRoom,
        startTime: new Date(),
        currentPhase: 'initializing',
        generatedPatches: [],
        appliedPatches: [],
        consequences: [],
        isComplete: false
      };

      // Start dialogue session
      const dialogueSession = await this.dialogueEngine.startDialogue(ghost, context);
      session.dialogueSession = dialogueSession;
      session.currentPhase = 'dialogue';

      // Store active session
      this.activeSessions.set(sessionId, session);
      this.activeGhost = ghost;

      // Emit encounter started event
      this.eventManager.emit({
        type: GameEventType.ENCOUNTER_STARTED,
        timestamp: new Date(),
        source: 'EncounterOrchestrator',
        data: { sessionId, ghostId: ghost.id, roomId: context.gameState.currentRoom },
        priority: 'high'
      });

      console.log(`Encounter started with ghost ${ghost.id} in session ${sessionId}`);
      return session;

    } catch (error) {
      console.error('Failed to start encounter:', error);
      throw new Error(`Encounter initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process dialogue choice during encounter
   */
  async processDialogueChoice(sessionId: string, choice: DialogueChoice): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active session found: ${sessionId}`);
    }

    try {
      // Process dialogue through dialogue engine
      const dialogueResponse = await this.dialogueEngine.processPlayerInput(
        session.dialogueSession?.id || '',
        choice.text || ''
      );

      // Check if ready for patch generation
      if (dialogueResponse.isReadyForDebugging) {
        session.currentPhase = 'patch_generation';
        this.currentPlayerIntent = choice.text || '';
        
        // Generate patch options
        const patchOptions = await this.generatePatchOptions(
          choice.text || '',
          this.activeGhost!
        );
        session.generatedPatches = patchOptions;
        session.currentPhase = 'patch_selection';
      }

      // Apply any meter effects from dialogue
      if (dialogueResponse.effects) {
        await this.applyMeterEffects(dialogueResponse.effects, session);
      }

      return {
        success: true,
        dialogueResponse,
        session,
        effects: dialogueResponse.effects || []
      };

    } catch (error) {
      console.error('Failed to process dialogue choice:', error);
      return {
        success: false,
        message: `Dialogue processing failed: ${(error as Error).message}`,
        effects: []
      };
    }
  }

  /**
   * Generate patch options based on player intent
   */
  async generatePatchOptions(intent: string, ghost: Ghost): Promise<PatchOption[]> {
    try {
      // Use patch generation system to create patches
      const patchContext = {
        ghost,
        dialogueHistory: [],
        playerIntent: intent,
        codeContext: `Room: ${ghost.rooms[0] || 'unknown'}`,
        roomContext: ghost.rooms[0] || 'unknown',
        playerSkillLevel: 0.5
      };
      
      const generatedPatch = await this.patchSystem.generatePatch(intent, patchContext);
      
      // Convert GeneratedPatch to PatchPlan format
      const patchPlan: PatchPlan = {
        diff: generatedPatch.diff,
        description: generatedPatch.description,
        risk: generatedPatch.riskScore,
        effects: generatedPatch.expectedEffects,
        ghostResponse: generatedPatch.ghostResponse
      };

      // Create patch option
      const patchOption: PatchOption = {
        id: `patch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        patch: patchPlan,
        confidence: this.calculatePatchConfidence(generatedPatch, ghost),
        riskAssessment: this.assessPatchRisk(generatedPatch, ghost),
        educationalNotes: generatedPatch.educationalNotes || this.generateEducationalNotes(generatedPatch, ghost)
      };

      // Generate alternative patch for comparison
      let alternativePatch: PatchOption | null = null;
      try {
        const alternative = await this.patchSystem.generateAlternative(generatedPatch);
        const alternativePlan: PatchPlan = {
          diff: alternative.diff,
          description: alternative.description,
          risk: alternative.riskScore,
          effects: alternative.expectedEffects,
          ghostResponse: alternative.ghostResponse
        };

        alternativePatch = {
          id: `patch_alt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          patch: alternativePlan,
          confidence: this.calculatePatchConfidence(alternative, ghost),
          riskAssessment: this.assessPatchRisk(alternative, ghost),
          educationalNotes: alternative.educationalNotes || this.generateEducationalNotes(alternative, ghost)
        };
      } catch (altError) {
        console.warn('Failed to generate alternative patch:', altError);
      }

      const patchOptions = alternativePatch ? [patchOption, alternativePatch] : [patchOption];

      // Emit patch generation event
      this.eventManager.emit({
        type: GameEventType.PATCH_GENERATED,
        timestamp: new Date(),
        source: 'EncounterOrchestrator',
        data: { ghostId: ghost.id, patchCount: patchOptions.length, intent },
        priority: 'medium'
      });

      return patchOptions;

    } catch (error) {
      console.error('Failed to generate patch options:', error);
      throw new Error(`Patch generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Apply patch choice and process consequences
   */
  async applyPatchChoice(patchId: string, action: PatchAction): Promise<any> {
    try {
      // Find the patch option
      let patchOption: PatchOption | null = null;
      let session: EncounterSession | null = null;

      for (const activeSession of this.activeSessions.values()) {
        const found = activeSession.generatedPatches.find(p => p.id === patchId);
        if (found) {
          patchOption = found;
          session = activeSession;
          break;
        }
      }

      if (!patchOption || !session) {
        throw new Error(`Patch not found: ${patchId}`);
      }

      // Apply the patch through patch system
      const applicationResult = await this.patchSystem.applyPatch(
        patchOption.patch,
        action
      );

      // Create applied patch record
      const appliedPatch: AppliedPatch = {
        id: `applied_${Date.now()}`,
        patchId,
        action,
        timestamp: new Date(),
        result: applicationResult
      };

      session.appliedPatches.push(appliedPatch);
      session.currentPhase = 'consequences';

      // Generate and apply consequences
      const consequences = await this.generateConsequences(
        patchOption,
        action,
        applicationResult,
        session
      );

      session.consequences.push(...consequences);

      // Apply meter effects from consequences
      for (const consequence of consequences) {
        if (consequence.effects) {
          await this.applyMeterEffects(consequence.effects, session);
        }
      }

      // Trigger visual and audio effects
      await this.triggerEffects(consequences, session);

      // Update session phase based on action
      if (action === 'question') {
        // Questioning leads back to dialogue for more information
        session.currentPhase = 'dialogue';
      } else {
        // Apply or refactor actions complete the encounter
        session.currentPhase = 'completed';
        session.isComplete = true;
      }

      // Emit patch applied event
      this.eventManager.emit({
        type: GameEventType.PATCH_APPLIED,
        timestamp: new Date(),
        source: 'EncounterOrchestrator',
        data: { 
          sessionId: session.id, 
          patchId, 
          action, 
          consequences: consequences.length,
          success: applicationResult.success
        },
        priority: 'high'
      });

      return {
        success: true,
        applicationResult,
        consequences,
        session,
        effects: consequences.flatMap(c => c.effects ? [c.effects] : []),
        nextPhase: session.currentPhase
      };

    } catch (error) {
      console.error('Failed to apply patch choice:', error);
      
      // Emit error event
      this.eventManager.emit({
        type: GameEventType.SYSTEM_ERROR,
        timestamp: new Date(),
        source: 'EncounterOrchestrator',
        data: { 
          error: (error as Error).message,
          patchId,
          action
        },
        priority: 'high'
      });

      return {
        success: false,
        message: `Patch application failed: ${(error as Error).message}`,
        effects: [],
        error: error
      };
    }
  }

  /**
   * Complete an encounter and generate outcome
   */
  async completeEncounter(sessionId: string): Promise<EncounterOutcome> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No session found: ${sessionId}`);
    }

    try {
      // Generate encounter outcome
      const outcome: EncounterOutcome = {
        sessionId,
        success: session.consequences.every(c => c.severity !== 'critical'),
        finalPhase: session.currentPhase,
        totalConsequences: session.consequences.length,
        learningAchievements: this.generateLearningAchievements(session),
        nextRecommendations: this.generateRecommendations(session)
      };

      // Clean up session
      this.activeSessions.delete(sessionId);
      if (this.activeGhost?.id === session.ghostId) {
        this.activeGhost = null;
        this.currentPlayerIntent = null;
      }

      // Emit encounter completed event
      this.eventManager.emit({
        type: GameEventType.ENCOUNTER_COMPLETED,
        timestamp: new Date(),
        source: 'EncounterOrchestrator',
        data: { sessionId, outcome },
        priority: 'high'
      });

      console.log(`Encounter ${sessionId} completed with outcome:`, outcome);
      return outcome;

    } catch (error) {
      console.error('Failed to complete encounter:', error);
      throw new Error(`Encounter completion failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get currently active ghost
   */
  getActiveGhost(): Ghost | null {
    return this.activeGhost;
  }

  /**
   * Get current player intent
   */
  getCurrentPlayerIntent(): string | undefined {
    return this.currentPlayerIntent || undefined;
  }

  /**
   * Get orchestrator state for persistence
   */
  getState(): any {
    return {
      activeSessions: Array.from(this.activeSessions.entries()),
      activeGhostId: this.activeGhost?.id || null,
      currentPlayerIntent: this.currentPlayerIntent
    };
  }

  /**
   * Restore orchestrator state from persistence
   */
  async restoreState(state: any): Promise<void> {
    if (state.activeSessions) {
      this.activeSessions = new Map(state.activeSessions);
    }
    this.currentPlayerIntent = state.currentPlayerIntent || null;
    // Note: activeGhost would need to be restored from ghost manager
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Complete any active sessions
    for (const sessionId of this.activeSessions.keys()) {
      try {
        await this.completeEncounter(sessionId);
      } catch (error) {
        console.error(`Error completing session ${sessionId} during cleanup:`, error);
      }
    }

    this.activeSessions.clear();
    this.activeGhost = null;
    this.currentPlayerIntent = null;
    
    console.log('EncounterOrchestrator cleanup completed');
  }

  /**
   * Calculate patch confidence based on ghost and patch characteristics
   */
  private calculatePatchConfidence(patch: any, ghost: Ghost): number {
    // Base confidence from patch system
    let confidence = 0.7;
    
    // Adjust based on ghost severity (harder ghosts = lower confidence)
    confidence -= (ghost.severity / 20);
    
    // Adjust based on patch risk
    const riskScore = patch.riskScore || patch.risk || 0.5;
    confidence -= (riskScore * 0.3);
    
    // Adjust based on patch complexity if available
    if (patch.complexity) {
      const complexityAdjustment = {
        'simple': 0.1,
        'moderate': 0,
        'complex': -0.1,
        'advanced': -0.2
      };
      confidence += complexityAdjustment[patch.complexity] || 0;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Assess risk of applying a patch
   */
  private assessPatchRisk(patch: any, ghost: Ghost): any {
    const riskScore = patch.riskScore || patch.risk || 0.5;
    
    return {
      stabilityRisk: riskScore * 0.8,
      complexityRisk: ghost.severity / 10,
      securityRisk: riskScore * 0.6,
      overallRisk: riskScore,
      riskFactors: [
        `Ghost severity: ${ghost.severity}`,
        `Patch risk score: ${riskScore}`,
        ...(patch.complexity ? [`Complexity: ${patch.complexity}`] : [])
      ],
      mitigationSuggestions: [
        'Test in isolated environment',
        'Review with team',
        ...(riskScore > 0.7 ? ['Consider rollback plan', 'Monitor system closely'] : [])
      ]
    };
  }

  /**
   * Generate educational notes for a patch
   */
  private generateEducationalNotes(patch: any, ghost: Ghost): string[] {
    const riskScore = patch.riskScore || patch.risk || 0.5;
    const notes = [
      `This patch addresses ${ghost.softwareSmell} by ${patch.description}`,
      `Risk level: ${riskScore > 0.7 ? 'High' : riskScore > 0.4 ? 'Medium' : 'Low'}`,
      'Consider the long-term maintainability of this solution'
    ];

    // Add complexity-specific notes if available
    if (patch.complexity) {
      switch (patch.complexity) {
        case 'simple':
          notes.push('Simple approach - easy to understand and maintain');
          break;
        case 'complex':
          notes.push('Complex solution - requires careful review and testing');
          break;
        case 'advanced':
          notes.push('Advanced technique - consider team expertise before applying');
          break;
      }
    }

    // Add impact-specific notes if available
    if (patch.impact) {
      switch (patch.impact) {
        case 'system_wide':
          notes.push('System-wide impact - coordinate with other teams');
          break;
        case 'significant':
          notes.push('Significant changes - plan deployment carefully');
          break;
      }
    }

    return notes;
  }

  /**
   * Apply meter effects and trigger related systems
   */
  private async applyMeterEffects(effects: any, session: EncounterSession): Promise<void> {
    try {
      // Apply effects through meter system if available
      if (this.meterSystem && effects) {
        // Use the dynamic meter system to apply effects
        await this.meterSystem.applyEffects({
          stability: effects.stability || 0,
          insight: effects.insight || 0,
          description: effects.description || 'Encounter effect'
        });
      }
      
      // Emit meter change event for other systems to react
      this.eventManager.emit({
        type: GameEventType.METER_CHANGED,
        timestamp: new Date(),
        source: 'EncounterOrchestrator',
        data: { 
          sessionId: session.id, 
          effects,
          stabilityChange: effects.stability || 0,
          insightChange: effects.insight || 0
        },
        priority: 'medium'
      });

      console.log(`Applied meter effects for session ${session.id}:`, effects);
    } catch (error) {
      console.error('Failed to apply meter effects:', error);
      // Don't throw - meter effects are important but shouldn't break the encounter
    }
  }

  /**
   * Generate consequences based on patch application
   */
  private async generateConsequences(
    patchOption: PatchOption,
    action: PatchAction,
    result: PatchApplicationResult,
    session: EncounterSession
  ): Promise<Consequence[]> {
    const consequences: Consequence[] = [];
    const riskScore = patchOption.riskAssessment.overallRisk;

    // Generate consequence based on action type
    switch (action) {
      case 'apply':
        if (result.success) {
          // Successful application
          const severity = riskScore > 0.7 ? 'moderate' : 'minor';
          consequences.push({
            id: `consequence_${Date.now()}`,
            type: 'meter_change',
            severity,
            description: riskScore > 0.7 ? 
              'Patch applied successfully, but with some instability' :
              'Patch applied successfully with minimal impact',
            effects: result.effects,
            visualEffects: riskScore > 0.7 ? [
              { type: 'glitch', intensity: 0.3, duration: 2000 }
            ] : [],
            audioEffects: riskScore > 0.7 ? [
              { type: 'warning', volume: 0.4 }
            ] : [
              { type: 'success', volume: 0.3 }
            ]
          });

          // Add learning consequence for successful application
          consequences.push({
            id: `learning_${Date.now()}`,
            type: 'learning_insight',
            severity: 'minor',
            description: 'Gained practical experience applying patches',
            effects: {
              stability: 0,
              insight: Math.floor(riskScore * 10),
              description: 'Learning from patch application'
            }
          });
        } else {
          // Failed application
          consequences.push({
            id: `consequence_${Date.now()}`,
            type: 'meter_change',
            severity: 'major',
            description: 'Patch application failed and caused system instability',
            effects: {
              stability: -Math.abs(result.effects.stability || 10),
              insight: Math.floor((result.effects.insight || 5) * 0.3),
              description: 'Patch failure penalty'
            },
            visualEffects: [
              { type: 'error', intensity: 0.8, duration: 3000 },
              { type: 'glitch', intensity: 0.6, duration: 5000 }
            ],
            audioEffects: [
              { type: 'error', volume: 0.7 },
              { type: 'tension', volume: 0.5, duration: 4000 }
            ]
          });
        }
        break;

      case 'refactor':
        // Refactoring is generally safer but takes more effort
        const refactorBonus = Math.floor(patchOption.patch.effects.stability * 1.2);
        consequences.push({
          id: `consequence_${Date.now()}`,
          type: 'meter_change',
          severity: 'minor',
          description: 'Code refactored for better maintainability and reduced technical debt',
          effects: {
            stability: refactorBonus,
            insight: Math.floor(patchOption.patch.effects.insight * 1.5),
            description: 'Refactoring improved code quality'
          },
          visualEffects: [
            { type: 'improvement', intensity: 0.4, duration: 2000 }
          ],
          audioEffects: [
            { type: 'success', volume: 0.4 }
          ]
        });

        // Add architectural insight
        consequences.push({
          id: `architecture_${Date.now()}`,
          type: 'learning_insight',
          severity: 'minor',
          description: 'Gained understanding of software architecture principles',
          effects: {
            stability: 2,
            insight: 20,
            description: 'Architectural learning'
          }
        });
        break;

      case 'question':
        // Questioning provides insight but doesn't solve the immediate problem
        const insightGain = Math.floor(15 + (riskScore * 10));
        consequences.push({
          id: `consequence_${Date.now()}`,
          type: 'learning_insight',
          severity: 'minor',
          description: 'Gained deeper understanding through thoughtful questioning',
          effects: {
            stability: 0,
            insight: insightGain,
            description: 'Learning through inquiry'
          },
          audioEffects: [
            { type: 'insight', volume: 0.3 }
          ]
        });

        // Add critical thinking bonus
        consequences.push({
          id: `thinking_${Date.now()}`,
          type: 'learning_insight',
          severity: 'minor',
          description: 'Demonstrated good engineering judgment by asking questions',
          effects: {
            stability: 1,
            insight: 5,
            description: 'Critical thinking bonus'
          }
        });
        break;

      case 'reject':
        // Rejecting a patch shows caution but doesn't progress
        consequences.push({
          id: `consequence_${Date.now()}`,
          type: 'meter_change',
          severity: 'minor',
          description: 'Chose not to apply the patch - problem remains unresolved',
          effects: {
            stability: -2,
            insight: 3,
            description: 'Cautious approach'
          }
        });
        break;
    }

    // Add risk-based consequences
    if (riskScore > 0.8 && action === 'apply') {
      consequences.push({
        id: `risk_${Date.now()}`,
        type: 'trigger_event',
        severity: 'moderate',
        description: 'High-risk patch triggered additional system checks',
        effects: {
          stability: -3,
          insight: 8,
          description: 'Risk management learning'
        },
        visualEffects: [
          { type: 'warning', intensity: 0.5, duration: 3000 }
        ],
        audioEffects: [
          { type: 'warning', volume: 0.6 }
        ]
      });
    }

    return consequences;
  }

  /**
   * Trigger visual and audio effects for consequences
   */
  private async triggerEffects(consequences: Consequence[], session: EncounterSession): Promise<void> {
    try {
      for (const consequence of consequences) {
        // Trigger visual effects if present
        if (consequence.visualEffects && consequence.visualEffects.length > 0) {
          for (const visualEffect of consequence.visualEffects) {
            await this.effectsSystem.triggerVisualEffect(visualEffect);
          }
        }
        
        // Trigger audio effects if present
        if (consequence.audioEffects && consequence.audioEffects.length > 0) {
          for (const audioEffect of consequence.audioEffects) {
            await this.effectsSystem.triggerAudioEffect(audioEffect);
          }
        }

        // Emit effect triggered events for coordination
        this.eventManager.emit({
          type: GameEventType.VISUAL_EFFECT_TRIGGERED,
          timestamp: new Date(),
          source: 'EncounterOrchestrator',
          data: {
            sessionId: session.id,
            consequenceId: consequence.id,
            effectType: consequence.type,
            severity: consequence.severity
          },
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Failed to trigger effects:', error);
      // Don't throw - effects are non-critical for gameplay
    }
  }

  /**
   * Check if encounter should be completed
   */
  private shouldCompleteEncounter(session: EncounterSession): boolean {
    // Complete if any critical consequences occurred
    if (session.consequences.some(c => c.severity === 'critical')) {
      return true;
    }

    // Complete if patches have been applied (except for questioning)
    const nonQuestionActions = session.appliedPatches.filter(p => p.action !== 'question');
    if (nonQuestionActions.length > 0) {
      return true;
    }

    // Complete if too many failed attempts
    const failedPatches = session.appliedPatches.filter(p => !p.result.success);
    if (failedPatches.length >= 3) {
      return true;
    }

    // Complete if session has been running too long (safety check)
    const sessionDuration = Date.now() - session.startTime.getTime();
    if (sessionDuration > 30 * 60 * 1000) { // 30 minutes
      return true;
    }

    return false;
  }

  /**
   * Generate learning achievements from encounter
   */
  private generateLearningAchievements(session: EncounterSession): any[] {
    const achievements = [];

    // Base achievement for completing encounter
    achievements.push({
      id: `achievement_${Date.now()}`,
      type: 'problem_solving',
      title: 'Ghost Debugger',
      description: 'Successfully debugged a haunted code module',
      evidence: [`Completed encounter ${session.id}`],
      timestamp: new Date()
    });

    // Achievement for successful patch application
    const successfulPatches = session.appliedPatches.filter(p => p.result.success);
    if (successfulPatches.length > 0) {
      achievements.push({
        id: `patch_success_${Date.now()}`,
        type: 'skill_improvement',
        title: 'Patch Master',
        description: 'Successfully applied patches to resolve software issues',
        evidence: [`Applied ${successfulPatches.length} successful patches`],
        timestamp: new Date()
      });
    }

    // Achievement for asking good questions
    const questionActions = session.appliedPatches.filter(p => p.action === 'question');
    if (questionActions.length >= 2) {
      achievements.push({
        id: `critical_thinking_${Date.now()}`,
        type: 'concept_mastery',
        title: 'Critical Thinker',
        description: 'Demonstrated good engineering judgment by asking thoughtful questions',
        evidence: [`Asked ${questionActions.length} clarifying questions`],
        timestamp: new Date()
      });
    }

    // Achievement for refactoring approach
    const refactorActions = session.appliedPatches.filter(p => p.action === 'refactor');
    if (refactorActions.length > 0) {
      achievements.push({
        id: `refactor_master_${Date.now()}`,
        type: 'pattern_recognition',
        title: 'Refactoring Expert',
        description: 'Chose refactoring approach for better long-term code quality',
        evidence: [`Used refactoring approach ${refactorActions.length} times`],
        timestamp: new Date()
      });
    }

    // Achievement for handling high-risk situations
    const highRiskPatches = session.generatedPatches.filter(p => p.riskAssessment.overallRisk > 0.7);
    if (highRiskPatches.length > 0 && successfulPatches.length > 0) {
      achievements.push({
        id: `risk_manager_${Date.now()}`,
        type: 'skill_improvement',
        title: 'Risk Manager',
        description: 'Successfully handled high-risk patch scenarios',
        evidence: [`Managed ${highRiskPatches.length} high-risk patches`],
        timestamp: new Date()
      });
    }

    // Achievement for learning from consequences
    const totalInsightGained = session.consequences
      .filter(c => c.effects && c.effects.insight > 0)
      .reduce((sum, c) => sum + (c.effects.insight || 0), 0);
    
    if (totalInsightGained >= 50) {
      achievements.push({
        id: `insight_seeker_${Date.now()}`,
        type: 'concept_mastery',
        title: 'Insight Seeker',
        description: 'Gained significant understanding from the debugging process',
        evidence: [`Gained ${totalInsightGained} insight points`],
        timestamp: new Date()
      });
    }

    return achievements;
  }

  /**
   * Generate recommendations for next steps
   */
  private generateRecommendations(session: EncounterSession): string[] {
    const recommendations = [];

    if (session.consequences.some(c => c.severity === 'major' || c.severity === 'critical')) {
      recommendations.push('Consider reviewing the patch approach for better stability');
    }

    if (session.appliedPatches.length === 0) {
      recommendations.push('Try applying a patch to see the effects');
    }

    recommendations.push('Explore other rooms to encounter different types of software issues');

    return recommendations;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `encounter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}