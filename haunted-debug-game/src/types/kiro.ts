/**
 * Kiro integration interfaces for hooks, MCP tools, and orchestration
 */

import type { GameState, GameContext } from './game';
import type { Room } from './room';
import type { Ghost } from './ghost';
import type { PatchPlan } from './patch';
import type { ApplyResult, LintResult, LintRules } from './patch';

export interface HookContext {
  gameState: GameState;
  room?: Room;
  ghost?: Ghost;
  patch?: PatchPlan;
  tools: MCPTools;
}

export interface GameHooks {
  onRoomEnter(ctx: HookContext): Promise<HookContext>;
  onPatchPlan(ctx: HookContext): Promise<HookContext>;
  onCompile(ctx: HookContext): Promise<HookContext>;
  onMeterChange(ctx: HookContext): Promise<HookContext>;
}

export interface MCPTools {
  diff: {
    apply(diff: string, target: string): Promise<ApplyResult>;
  };
  lint: {
    run(code: string, rules: LintRules): Promise<LintResult>;
  };
  shader: {
    generate(effect: EffectType): Promise<ShaderCode>;
  };
  sfx: {
    queue(sound: SoundEffectRequest): Promise<void>;
  };
  lore: {
    search(query: string): Promise<LoreEntry[]>;
  };
  safe: {
    exec(code: string, context: ExecContext): Promise<ExecResult>;
  };
}

export enum EffectType {
  Glitch = "glitch",
  CRTScanlines = "crt_scanlines",
  StaticNoise = "static_noise",
  ColorShift = "color_shift",
  Corruption = "corruption"
}

export interface ShaderCode {
  vertex: string;
  fragment: string;
  uniforms: Record<string, any>;
}

export enum SoundEffect {
  Whisper = "whisper",
  Heartbeat = "heartbeat",
  KeyboardClack = "keyboard_clack",
  CompileSuccess = "compile_success",
  CompileError = "compile_error",
  GhostAppear = "ghost_appear",
  RoomTransition = "room_transition",
  MeterChange = "meter_change"
}

export interface SoundEffectRequest {
  type: 'ambient' | 'sfx' | 'music';
  sound: string;
  loop?: boolean;
  volume?: number;
}

export interface LoreEntry {
  id: string;
  key: string;
  text: string;
  tags: string[];
  unlockedBy?: string; // Condition for unlock
}

export interface ExecContext {
  timeout: number;
  memoryLimit: number;
  allowedModules: string[];
  environment: Record<string, any>;
}

export interface ExecResult {
  success: boolean;
  output: string;
  errors: string[];
  executionTime: number;
  memoryUsed: number;
}