/**
 * Encounter system type definitions
 */

import type { DialogueChoice } from './dialogue';
import type { PatchPlan } from './patch';
import type { MeterEffects } from './game';

export interface EncounterSession {
  id: string;
  ghostId: string;
  roomId: string;
  startTime: Date;
  currentPhase: EncounterPhase;
  dialogueSession?: any; // Will be properly typed when DialogueSession is available
  generatedPatches: PatchOption[];
  appliedPatches: AppliedPatch[];
  consequences: Consequence[];
  isComplete: boolean;
  error?: string;
}

export type EncounterPhase = 
  | 'initializing'
  | 'dialogue'
  | 'patch_generation'
  | 'patch_selection'
  | 'patch_application'
  | 'consequences'
  | 'completed'
  | 'error';

export interface PatchOption {
  id: string;
  patch: PatchPlan;
  confidence: number;
  riskAssessment: RiskAssessment;
  educationalNotes: string[];
}

export interface AppliedPatch {
  id: string;
  patchId: string;
  action: PatchAction;
  timestamp: Date;
  result: PatchApplicationResult;
}

export interface Consequence {
  id: string;
  type: ConsequenceType;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  effects: MeterEffects;
  visualEffects?: any[];
  audioEffects?: any[];
}

export type ConsequenceType = 
  | 'meter_change'
  | 'visual_effect'
  | 'audio_cue'
  | 'unlock_content'
  | 'trigger_event'
  | 'learning_insight';

export interface RiskAssessment {
  stabilityRisk: number; // 0.0 to 1.0
  complexityRisk: number;
  securityRisk: number;
  overallRisk: number;
  riskFactors: string[];
  mitigationSuggestions: string[];
}

export interface PatchApplicationResult {
  success: boolean;
  compileEvents: any[]; // Will be properly typed when CompileEvent is available
  effects: MeterEffects;
  feedback: string;
  learningPoints: string[];
}

export interface PlayerAction {
  type: PlayerActionType;
  timestamp: Date;
  sessionId?: string;
  choice?: DialogueChoice;
  patchId?: string;
  patchAction?: PatchAction;
  targetRoom?: string;
  intent?: string;
}

export type PlayerActionType = 
  | 'dialogue_choice'
  | 'patch_action'
  | 'navigate'
  | 'question'
  | 'hint_request';

export type PatchAction = 
  | 'apply'
  | 'refactor'
  | 'question'
  | 'reject';

export interface ActionResult {
  success: boolean;
  message: string;
  effects: any[];
  newState?: any;
  error?: string;
}

export interface EncounterOutcome {
  sessionId: string;
  success: boolean;
  finalPhase: EncounterPhase;
  totalConsequences: number;
  learningAchievements: LearningAchievement[];
  nextRecommendations: string[];
}

export interface LearningAchievement {
  id: string;
  type: 'concept_mastery' | 'skill_improvement' | 'pattern_recognition' | 'problem_solving';
  title: string;
  description: string;
  evidence: string[];
  timestamp: Date;
}