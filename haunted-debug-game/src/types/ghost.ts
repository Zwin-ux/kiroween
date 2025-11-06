/**
 * Ghost-related type definitions for the haunted debug game
 */

export interface Ghost {
  id: string;
  name: string;
  severity: number;
  description: string;
  softwareSmell: SoftwareSmell;
  manifestation: GhostManifestation;
  dialoguePrompts: string[];
  fixPatterns: PatchPattern[];
  hints: string[];
  rooms: string[];
  assets?: GhostAssets;
}

export interface GhostAssets {
  /** Entity asset name for ghost representation */
  entity?: string;
  /** Icon asset name for ghost states */
  icon?: string;
  /** Alternative icons for different states */
  stateIcons?: {
    idle?: string;
    active?: string;
    resolved?: string;
    angry?: string;
  };
}

export interface GhostManifestation {
  visual: string;
  audio: string;
  behavior: string;
  /** Visual effects triggered during encounters */
  effects?: GhostVisualEffects;
}

export interface GhostVisualEffects {
  /** Particle effects around the ghost */
  particles?: string;
  /** Lighting effects */
  lighting?: string;
  /** Animation type */
  animation?: 'float' | 'pulse' | 'glitch' | 'fade';
  /** Duration of effects in milliseconds */
  duration?: number;
}

export interface PatchPattern {
  type: string;
  description: string;
  risk: number;
  stabilityEffect: number;
  insightEffect: number;
}

export enum SoftwareSmell {
  CircularDependency = "circular_dependency",
  StaleCache = "stale_cache",
  UnboundedRecursion = "unbounded_recursion",
  PromptInjection = "prompt_injection",
  DataLeak = "data_leak",
  DeadCode = "dead_code",
  RaceCondition = "race_condition",
  MemoryLeak = "memory_leak"
}