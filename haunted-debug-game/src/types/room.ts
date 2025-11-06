/**
 * Room-related type definitions for the haunted debug game
 */

export interface Room {
  key: string;
  title: string;
  description: string;
  entryText: string;
  solved: boolean;
  ghosts: string[]; // Ghost IDs
  onEnter?: string; // Hook reference
  goals: string[];
  atmosphere: RoomAtmosphere;
  hauntedModules: HauntedModule[];
  completionCriteria: CompletionCriteria;
  unlockConditions: UnlockConditions;
  transitionsTo: string[];
  hooks: RoomHooks;
  
  // Additional properties for navigation system
  name?: string; // Display name (defaults to title)
  connections?: string[]; // Alternative to transitionsTo for backward compatibility
  requiredInsight?: number; // Minimum insight required to enter
  unlocked?: boolean; // Whether room is initially unlocked
  ghostCapacity?: number; // Maximum number of ghosts in room
}

export interface RoomAtmosphere {
  lighting: string;
  ambientSound: string;
  visualEffects: string[];
}

export interface HauntedModule {
  name: string;
  description: string;
  ghostType: string;
}

export interface CompletionCriteria {
  ghostsResolved: number;
  stabilityThreshold?: number;
  insightThreshold?: number;
  ethicsViolations?: number;
  allPreviousRoomsComplete?: boolean;
}

export interface UnlockConditions {
  initial?: boolean;
  fromRoom?: string;
  stabilityMin?: number;
  insightMin?: number;
}

export interface RoomHooks {
  onEnter?: string;
  onGhostEncounter?: string;
  onCompletion?: string;
  onCircularDetection?: string;
  onLeakDetection?: string;
  onInjectionAttempt?: string;
  onRaceDetected?: string;
  onEthicsViolation?: string;
  onVictory?: string;
}

export interface RoomTransition {
  from: string;
  to: string;
  condition: string;
  description: string;
}

export interface TransitionResult {
  success: boolean;
  newRoom?: Room;
  error?: string;
  effects?: any;
}