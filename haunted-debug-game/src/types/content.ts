/**
 * Content and configuration type definitions
 */

import type { Room, RoomTransition } from './room';
import type { Ghost } from './ghost';
import type { LoreEntry } from './kiro';

// Re-export types for easier importing
export type { Room, RoomTransition } from './room';
export type { Ghost, SoftwareSmell, PatchPattern, GhostAssets, GhostVisualEffects } from './ghost';
export type { LoreEntry } from './kiro';

export interface GameContent {
  rooms: Record<string, Room>;
  ghosts: Record<string, Ghost>;
  lore: Record<string, LoreEntry>;
  transitions: RoomTransition[];
}

export interface GameConfig {
  meters: MeterConfig;
  gameOverConditions: GameOverConfig;
  transitions: TransitionConfig[];
  patchRiskFactors: PatchRiskConfig;
  audio: AudioConfig;
  visualEffects: VisualEffectsConfig;
  performance: PerformanceConfig;
}

export interface MeterConfig {
  stability: MeterSettings;
  insight: MeterSettings;
}

export interface MeterSettings {
  min: number;
  max: number;
  startingValue: number;
  description: string;
  criticalThreshold?: number;
  warningThreshold?: number;
  unlockThresholds?: UnlockThreshold[];
}

export interface UnlockThreshold {
  value: number;
  unlocks: string[];
}

export interface GameOverConfig {
  [key: string]: {
    condition: string;
    type: 'defeat' | 'victory';
    message: string;
  };
}

export interface TransitionConfig {
  from: string;
  to: string;
  condition: string;
  description: string;
}

export interface PatchRiskConfig {
  complexity: Record<string, number>;
  scope: Record<string, number>;
  ghostSeverity: Record<string, number>;
}

export interface AudioConfig {
  riskThresholds: Record<string, number>;
  volumeControls: Record<string, boolean>;
}

export interface VisualEffectsConfig {
  crtScanlines: EffectConfig;
  glitchEffects: EffectConfig;
  clayTokenAccents: Record<string, string>;
}

export interface EffectConfig {
  enabled: boolean;
  intensity?: number;
  triggerOn?: string;
  riskThreshold?: number;
  durationMs?: number;
}

export interface PerformanceConfig {
  targetFps: number;
  frameBudgetMs: number;
  memoryWarningMb: number;
  assetPreload: boolean;
  mobileOptimizations: boolean;
}