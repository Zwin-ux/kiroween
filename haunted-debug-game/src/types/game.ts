/**
 * Core game state and run tracking interfaces
 */

export interface GameState {
  run: GameRun;
  currentRoom: string;
  meters: {
    stability: number;
    insight: number;
  };
  unlockedRooms: string[];
  evidenceBoard: EvidenceEntry[];
  playerChoices: PlayerChoice[];
  
  // Integrated system states
  systemStates: SystemStates;
}

export interface SystemStates {
  // Event system state
  eventManager: EventManagerState;
  
  // Navigation system state
  navigation: NavigationState;
  
  // Effect coordination state
  effects: EffectCoordinatorState;
  
  // Encounter orchestration state
  encounters: EncounterOrchestratorState;
  
  // Session management state
  session: SessionState;
}

export interface EventManagerState {
  subscriptionCount: number;
  recentEvents: GameEventSummary[];
  errorCount: number;
  lastProcessedEventId?: string;
}

export interface GameEventSummary {
  type: string;
  timestamp: Date;
  source: string;
  priority: string;
}

export interface NavigationState {
  currentRoomId: string;
  unlockedRooms: string[];
  roomTransitionHistory: string[];
  pendingUnlocks: PendingUnlock[];
}

export interface PendingUnlock {
  roomId: string;
  conditionsMet: number;
  totalConditions: number;
  nextCheckTime?: Date;
}

export interface EffectCoordinatorState {
  activeEffects: ActiveEffect[];
  accessibilitySettings: AccessibilitySettings;
  effectQueue: QueuedEffect[];
  performanceMode: 'high' | 'medium' | 'low';
}

export interface ActiveEffect {
  id: string;
  type: string;
  intensity: number;
  startTime: Date;
  duration?: number;
  roomId?: string;
  ghostId?: string;
}

export interface QueuedEffect {
  type: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  queuedAt: Date;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  disableFlashing: boolean;
  visualEffectIntensity: number;
  audioEffectVolume: number;
  alternativeText: boolean;
  highContrast: boolean;
  screenReaderSupport: boolean;
}

export interface AccessibilityProfile {
  id: string;
  name: string;
  description: string;
  settings: AccessibilitySettings;
  isDefault: boolean;
  isCustom: boolean;
}

export interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  category: 'visual' | 'audio' | 'motor' | 'cognitive';
  enabled: boolean;
  settingsKey: keyof AccessibilitySettings;
  impact: 'low' | 'medium' | 'high';
}

export interface EncounterOrchestratorState {
  activeEncounters: Record<string, EncounterSessionSummary>;
  completedEncounters: CompletedEncounterSummary[];
  encounterHistory: EncounterHistoryEntry[];
}

export interface EncounterSessionSummary {
  id: string;
  ghostId: string;
  roomId: string;
  phase: 'dialogue' | 'patch_generation' | 'patch_application' | 'completion';
  startTime: Date;
  dialogueSessionId?: string;
  generatedPatchCount: number;
  appliedPatchCount: number;
}

export interface CompletedEncounterSummary {
  id: string;
  ghostId: string;
  roomId: string;
  completedAt: Date;
  duration: number;
  outcome: 'success' | 'failure' | 'abandoned';
  meterChanges: MeterEffects;
  patchesApplied: number;
  learningPoints: string[];
}

export interface EncounterHistoryEntry {
  encounterId: string;
  timestamp: Date;
  action: string;
  result: string;
  meterEffects?: MeterEffects;
}

export interface SessionState {
  sessionId: string;
  startTime: Date;
  lastSaveTime: Date;
  playTime: number;
  autoSaveEnabled: boolean;
  saveInterval: number;
  achievements: AchievementProgress[];
  learningProgress: LearningProgressEntry[];
}

export interface AchievementProgress {
  id: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface LearningProgressEntry {
  concept: string;
  masteryLevel: number;
  practiceCount: number;
  lastPracticed: Date;
  improvementTrend: number;
}

export interface SessionSummary {
  sessionId: string;
  playTime: number;
  roomsVisited: number;
  encountersCompleted: number;
  achievementsUnlocked: number;
  currentMeters: { stability: number; insight: number };
  learningProgress: number;
  lastSaved: Date;
}

export interface GameRun {
  id: string;
  userId?: string;
  startedAt: Date;
  endedAt?: Date;
  finalStability: number;
  finalInsight: number;
  outcome: GameOutcome;
}

export interface EvidenceEntry {
  id: string;
  timestamp: Date;
  type: 'patch_applied' | 'room_entered' | 'ghost_encountered' | 'meter_change' | 'ethics_violation';
  description: string;
  context: Record<string, any>;
  effects?: MeterEffects;
}

export interface PlayerChoice {
  id: string;
  timestamp: Date;
  roomId: string;
  ghostId?: string;
  action: 'apply' | 'refactor' | 'question';
  intent: string;
  outcome: string;
}

export enum GameOutcome {
  KernelPanic = "kernel_panic", // stability = 0
  MoralInversion = "moral_inversion", // ethics failure
  Victory = "victory" // correct branch merge
}

export interface MeterEffects {
  stability: number; // Can be negative
  insight: number; // Can be negative
  description: string;
}

export enum GameOverCondition {
  KernelPanic = "kernel_panic", // stability = 0
  MoralInversion = "moral_inversion", // ethics failure
  Victory = "victory" // correct branch merge
}

export interface GameContext {
  gameState: GameState;
  currentRoom: any; // Will be properly typed when Room is imported
  activeGhost?: any; // Will be properly typed when Ghost is imported
  playerIntent?: string;
}