/**
 * Player choice system type definitions
 */

import type { MeterEffects } from './game';
import type { GeneratedPatch } from '../engine/PatchGenerationSystem';

export interface PlayerChoiceOptions {
  apply: {
    label: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    expectedOutcome: string;
  };
  refactor: {
    label: string;
    description: string;
    alternativeApproach: string;
    tradeoffs: string[];
  };
  question: {
    label: string;
    description: string;
    availableQuestions: string[];
    educationalValue: string;
  };
}

export interface PlayerChoice {
  type: 'apply' | 'refactor' | 'question';
  patchId: string;
  timestamp: Date;
  reasoning?: string;
  questionAsked?: string;
}

export interface ChoiceResult {
  success: boolean;
  effects: MeterEffects;
  consequences: GameConsequence[];
  newDialogue?: string;
  unlockedContent?: string[];
}

export interface GameConsequence {
  type: 'meter_change' | 'visual_effect' | 'audio_cue' | 'unlock_content' | 'trigger_event';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  effects: Record<string, any>;
  duration?: number;
}

export interface ChoiceValidation {
  valid: boolean;
  warnings: string[];
  confirmationRequired: boolean;
  confirmationMessage?: string;
}

export interface ConsequencePrediction {
  meterChanges: MeterEffects;
  riskFactors: string[];
  benefits: string[];
  immediateEffects: string[];
  longTermEffects: string[];
}

export interface DecisionPattern {
  playerId: string;
  choiceType: 'apply' | 'refactor' | 'question';
  riskTolerance: number; // 0.0 to 1.0
  frequency: number;
  timestamp: Date;
  context: {
    ghostType: string;
    roomId: string;
    patchRisk: number;
    meterLevels: { stability: number; insight: number };
  };
}

export interface PlayerStatistics {
  totalChoices: number;
  choiceBreakdown: {
    apply: number;
    refactor: number;
    question: number;
  };
  averageRiskTolerance: number;
  preferredApproach: 'cautious' | 'aggressive' | 'analytical' | 'experimental';
  learningStyle: 'visual' | 'hands_on' | 'theoretical' | 'collaborative';
  successRate: number;
  improvementTrend: number; // -1 to 1, negative means declining
}

export interface AdaptiveDifficulty {
  currentLevel: number; // 1-10
  adjustmentFactors: {
    successRate: number;
    riskTolerance: number;
    learningProgress: number;
    engagementLevel: number;
  };
  recommendations: {
    ghostComplexity: 'simple' | 'moderate' | 'complex' | 'advanced';
    patchRiskRange: [number, number];
    educationalSupport: 'minimal' | 'moderate' | 'extensive';
    hintFrequency: 'rare' | 'occasional' | 'frequent';
  };
}