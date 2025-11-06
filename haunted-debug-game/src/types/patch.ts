/**
 * Patch system type definitions for the haunted debug game
 */

import type { MeterEffects } from './game';

export interface PatchPlan {
  diff: string;
  description: string;
  risk: number; // 0.0 to 1.0
  effects: MeterEffects;
  ghostResponse: string;
}

export interface PatchResult {
  success: boolean;
  effects: MeterEffects;
  compileEvents: CompileEvent[];
  newDialogue?: string;
}

export interface CompileEvent {
  id: string;
  type: CompileEventType;
  timestamp: Date;
  description: string;
  effects: MeterEffects;
  deterministic: boolean;
}

export enum CompileEventType {
  Success = "success",
  Warning = "warning",
  Error = "error",
  SecurityViolation = "security_violation",
  PerformanceImpact = "performance_impact"
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

export interface ApplyResult {
  success: boolean;
  output: string;
  errors: string[];
}

export interface LintResult {
  passed: boolean;
  issues: LintIssue[];
}

export interface LintIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

export interface LintRules {
  [key: string]: any;
}