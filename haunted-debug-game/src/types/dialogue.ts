/**
 * Dialogue system type definitions
 */

import type { SoftwareSmell } from './content';
import type { MeterEffects } from './game';

export interface DialogueEngine {
  startDialogue(ghost: Ghost, context: GameContext): Promise<DialogueSession>;
  processPlayerInput(sessionId: string, input: string): Promise<DialogueResponse>;
  generateEducationalContent(ghost: Ghost, topic: string): Promise<string>;
  getAvailableQuestions(sessionId: string): string[];
  endDialogue(sessionId: string): void;
}

export interface DialogueSession {
  id: string;
  ghostId: string;
  messages: DialogueMessage[];
  context: DialogueContext;
  educationalTopics: string[];
  isReadyForDebugging: boolean;
  startedAt: Date;
  lastActivity: Date;
  state: DialogueState;
}

export interface DialogueMessage {
  id: string;
  speaker: 'player' | 'ghost';
  content: string;
  timestamp: Date;
  type: 'question' | 'explanation' | 'hint' | 'story' | 'educational';
  metadata?: Record<string, any>;
  educationalContent?: EducationalContent;
}

export interface DialogueContext {
  ghostType: SoftwareSmell;
  roomContext: string;
  playerKnowledge: string[];
  previousEncounters: string[];
  currentMeterLevels: {
    stability: number;
    insight: number;
  };
  sessionProgress: number; // 0-1, how far through the conversation
  playerInsightLevel: 'low' | 'medium' | 'high';
}

export interface DialogueResponse {
  message: DialogueMessage;
  availableQuestions: string[];
  educationalContent?: EducationalContent;
  contextUpdates?: Partial<DialogueContext>;
  isReadyForDebugging?: boolean;
  effects?: MeterEffects;
}

export interface EducationalContent {
  title: string;
  explanation: string;
  examples: string[];
  commonMistakes: string[];
  bestPractices: string[];
  furtherReading: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export enum DialogueState {
  Starting = 'starting',
  Active = 'active',
  Educational = 'educational',
  ReadyForDebugging = 'ready_for_debugging',
  Completed = 'completed',
  Abandoned = 'abandoned'
}

export interface DialoguePrompt {
  trigger: string;
  response: string;
  educationalValue: number;
  followUpQuestions: string[];
  unlockConditions?: string[];
  insightRequirement?: number;
}

export interface DialogueChoice {
  id: string;
  text: string;
  type: 'question' | 'statement' | 'intent';
  educationalValue?: number;
  followUp?: string[];
}

// Import types that dialogue system needs
import type { Ghost } from './content';
import type { GameContext } from './game';