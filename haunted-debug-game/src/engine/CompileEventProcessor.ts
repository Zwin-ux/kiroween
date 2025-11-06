/**
 * CompileEventProcessor - Handles patch application simulation and consequence calculation
 */

import type { 
  PatchPlan, 
  PatchResult, 
  CompileEvent,
  ValidationResult 
} from '@/types/patch';
import { CompileEventType } from '@/types/patch';
import type { 
  GameState, 
  MeterEffects, 
  GameContext 
} from '@/types/game';
import type { Ghost } from '@/types/content';
import { 
  ExecutionResultSimulator,
  type CompilationOutput,
  type PerformanceImpact,
  type CodeQualityMetrics,
  type ExecutionSimulationContext
} from './ExecutionResultSimulator';

export interface CompileEventProcessor {
  executePatches(patch: PatchPlan, context: GameContext): Promise<PatchResult>;
  simulateCompilation(patch: PatchPlan): Promise<CompilationSimulation>;
  processConsequences(result: PatchResult): Promise<GameConsequence[]>;
  calculateRiskBasedEffects(patch: PatchPlan, ghost: Ghost): MeterEffects;
  generateExecutionResults(patch: PatchPlan, context: GameContext): Promise<ExecutionResults>;
}

export interface CompilationSimulation {
  wouldCompile: boolean;
  warnings: string[];
  errors: string[];
  performanceImpact: number;
  securityIssues: string[];
  codeQualityScore: number;
  executionTime: number;
}

export interface ExecutionResults {
  compilationOutput: CompilationOutput;
  performanceImpact: PerformanceImpact;
  codeQuality: CodeQualityMetrics;
  overallSuccess: boolean;
  riskAssessment: RiskAssessment;
}

export interface RiskAssessment {
  overallRisk: number; // 0.0 to 1.0
  riskFactors: RiskFactor[];
  recommendations: string[];
  safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
}

export interface GameConsequence {
  type: 'meter_change' | 'visual_effect' | 'audio_cue' | 'unlock_content' | 'trigger_event';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  effects: Record<string, any>;
  duration?: number;
}

export interface RiskFactor {
  type: 'complexity' | 'security' | 'performance' | 'maintainability' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // 0.0 to 1.0
}

export class CompileEventProcessorImpl implements CompileEventProcessor {
  private executionSimulator: ExecutionResultSimulator;
  
  private riskThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  };

  private ghostTypeMultipliers = {
    circular_dependency: { stability: -1.2, insight: 1.1 },
    stale_cache: { stability: -0.8, insight: 1.0 },
    unbounded_recursion: { stability: -1.5, insight: 1.2 },
    prompt_injection: { stability: -1.0, insight: 1.3 },
    data_leak: { stability: -1.1, insight: 1.1 }
  };

  constructor() {
    this.executionSimulator = new ExecutionResultSimulator();
  }

  /**
   * Generate comprehensive execution results using the execution simulator
   */
  async generateExecutionResults(patch: PatchPlan, context: GameContext): Promise<ExecutionResults> {
    const ghost = context.activeGhost as Ghost;
    
    // Create simulation context
    const simulationContext: ExecutionSimulationContext = {
      ghost,
      patch,
      playerSkillLevel: 0.5, // Default skill level - could be enhanced with player stats
      roomComplexity: 0.5, // Default room complexity - could be enhanced with room data
      systemLoad: Math.random() * 0.3 // Simulate varying system load
    };

    // Generate all simulation results
    const [compilationOutput, performanceImpact, codeQuality] = await Promise.all([
      this.executionSimulator.generateCompilationOutput(simulationContext),
      this.executionSimulator.simulatePerformanceImpact(simulationContext),
      this.executionSimulator.calculateCodeQuality(simulationContext)
    ]);

    // Assess overall risk
    const riskAssessment = this.assessOverallRisk(patch, compilationOutput, performanceImpact, codeQuality);

    // Determine overall success
    const overallSuccess = compilationOutput.exitCode === 0 && 
                          riskAssessment.overallRisk < 0.8 &&
                          codeQuality.overallScore > 0.3;

    return {
      compilationOutput,
      performanceImpact,
      codeQuality,
      overallSuccess,
      riskAssessment
    };
  }

  /**
   * Execute patch application with realistic simulation
   */
  async executePatches(patch: PatchPlan, context: GameContext): Promise<PatchResult> {
    try {
      // Generate comprehensive execution results
      const executionResults = await this.generateExecutionResults(patch, context);
      
      // Generate compile events based on execution results
      const compileEvents = await this.generateCompileEventsFromResults(patch, executionResults, context);
      
      // Calculate final effects based on execution results
      const finalEffects = this.calculateEffectsFromResults(
        patch, 
        executionResults,
        context.activeGhost as Ghost
      );

      // Generate contextual dialogue response
      const newDialogue = executionResults.overallSuccess
        ? this.generateSuccessDialogue(patch, context.activeGhost as Ghost)
        : this.generateFailureDialogueFromResults(patch, executionResults, context.activeGhost as Ghost);

      return {
        success: executionResults.overallSuccess,
        effects: finalEffects,
        compileEvents,
        newDialogue
      };

    } catch (error) {
      console.error('Error executing patch:', error);
      
      // Return safe fallback result
      return {
        success: false,
        effects: {
          stability: -10,
          insight: 2,
          description: 'Patch execution failed due to system error'
        },
        compileEvents: [{
          id: `error_${Date.now()}`,
          type: CompileEventType.Error,
          timestamp: new Date(),
          description: 'System error during patch execution',
          effects: { stability: -10, insight: 2, description: 'System error penalty' },
          deterministic: true
        }]
      };
    }
  }

  /**
   * Simulate compilation without actual code execution
   */
  async simulateCompilation(patch: PatchPlan): Promise<CompilationSimulation> {
    // Analyze patch content for realistic simulation
    const diffLines = patch.diff.split('\n');
    const addedLines = diffLines.filter(line => line.startsWith('+')).length;
    const removedLines = diffLines.filter(line => line.startsWith('-')).length;
    const modifiedComplexity = addedLines + removedLines;

    // Simulate compilation success based on patch characteristics
    const wouldCompile = this.simulateCompilationSuccess(patch, modifiedComplexity);
    
    // Generate realistic warnings and errors
    const warnings = this.generateCompilationWarnings(patch, modifiedComplexity);
    const errors = wouldCompile ? [] : this.generateCompilationErrors(patch);
    
    // Calculate performance impact
    const performanceImpact = this.calculatePerformanceImpact(patch, modifiedComplexity);
    
    // Check for security issues
    const securityIssues = this.detectSecurityIssues(patch);
    
    // Calculate code quality score
    const codeQualityScore = this.calculateCodeQuality(patch, modifiedComplexity);
    
    // Simulate execution time
    const executionTime = Math.max(100, modifiedComplexity * 50 + Math.random() * 200);

    return {
      wouldCompile,
      warnings,
      errors,
      performanceImpact,
      securityIssues,
      codeQualityScore,
      executionTime
    };
  }

  /**
   * Process consequences and generate game effects
   */
  async processConsequences(result: PatchResult): Promise<GameConsequence[]> {
    const consequences: GameConsequence[] = [];

    // Add meter change consequence
    consequences.push({
      type: 'meter_change',
      severity: this.calculateSeverity(result.effects),
      description: result.effects.description,
      effects: {
        stabilityChange: result.effects.stability,
        insightChange: result.effects.insight
      }
    });

    // Add visual effects based on stability impact
    if (result.effects.stability < -15) {
      consequences.push({
        type: 'visual_effect',
        severity: 'major',
        description: 'Screen distortion from system instability',
        effects: {
          distortionIntensity: Math.abs(result.effects.stability) / 20,
          glitchDuration: 2000
        },
        duration: 3000
      });
    }

    // Add audio effects for significant changes
    if (Math.abs(result.effects.stability) > 10) {
      consequences.push({
        type: 'audio_cue',
        severity: result.effects.stability < 0 ? 'moderate' : 'minor',
        description: result.effects.stability < 0 ? 'System warning sounds' : 'Positive feedback chime',
        effects: {
          soundType: result.effects.stability < 0 ? 'warning' : 'success',
          volume: Math.min(0.8, Math.abs(result.effects.stability) / 25)
        },
        duration: 1500
      });
    }

    // Add content unlock for insight gains
    if (result.effects.insight > 15) {
      consequences.push({
        type: 'unlock_content',
        severity: 'minor',
        description: 'New insights unlock additional dialogue options',
        effects: {
          unlockedContent: ['advanced_dialogue', 'ghost_hints'],
          insightThreshold: result.effects.insight
        }
      });
    }

    // Add compile events as consequences
    for (const event of result.compileEvents) {
      if (event.type === CompileEventType.SecurityViolation) {
        consequences.push({
          type: 'trigger_event',
          severity: 'critical',
          description: 'Security violation detected - ethics warning triggered',
          effects: {
            eventType: 'ethics_warning',
            securityLevel: 'high'
          }
        });
      }
    }

    return consequences;
  }

  /**
   * Calculate risk-based meter effects
   */
  calculateRiskBasedEffects(patch: PatchPlan, ghost: Ghost): MeterEffects {
    const baseStability = patch.effects.stability;
    const baseInsight = patch.effects.insight;
    
    // Apply ghost type multipliers
    const ghostType = ghost.softwareSmell as keyof typeof this.ghostTypeMultipliers;
    const multipliers = this.ghostTypeMultipliers[ghostType] || { stability: 1.0, insight: 1.0 };
    
    // Apply risk scaling
    const riskMultiplier = 1 + (patch.risk * 0.5); // Higher risk = more extreme effects
    
    // Calculate final effects
    const finalStability = Math.round(baseStability * multipliers.stability * riskMultiplier);
    const finalInsight = Math.round(baseInsight * multipliers.insight);
    
    return {
      stability: finalStability,
      insight: finalInsight,
      description: `${patch.description} (Risk: ${Math.round(patch.risk * 100)}%)`
    };
  }

  /**
   * Generate compile events based on simulation results
   */
  private async generateCompileEvents(
    patch: PatchPlan, 
    simulation: CompilationSimulation, 
    context: GameContext
  ): Promise<CompileEvent[]> {
    const events: CompileEvent[] = [];

    // Success event
    if (simulation.wouldCompile) {
      events.push({
        id: `compile_success_${Date.now()}`,
        type: CompileEventType.Success,
        timestamp: new Date(),
        description: `Patch compiled successfully in ${simulation.executionTime}ms`,
        effects: {
          stability: 2,
          insight: 1,
          description: 'Successful compilation'
        },
        deterministic: true
      });
    }

    // Warning events
    for (const warning of simulation.warnings) {
      events.push({
        id: `compile_warning_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: CompileEventType.Warning,
        timestamp: new Date(),
        description: warning,
        effects: {
          stability: -1,
          insight: 1,
          description: 'Compilation warning'
        },
        deterministic: true
      });
    }

    // Error events
    for (const error of simulation.errors) {
      events.push({
        id: `compile_error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: CompileEventType.Error,
        timestamp: new Date(),
        description: error,
        effects: {
          stability: -5,
          insight: 0,
          description: 'Compilation error'
        },
        deterministic: true
      });
    }

    // Security violation events
    for (const issue of simulation.securityIssues) {
      events.push({
        id: `security_violation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: CompileEventType.SecurityViolation,
        timestamp: new Date(),
        description: issue,
        effects: {
          stability: -15,
          insight: 5,
          description: 'Security violation detected'
        },
        deterministic: true
      });
    }

    // Performance impact events
    if (simulation.performanceImpact > 0.3) {
      events.push({
        id: `performance_impact_${Date.now()}`,
        type: CompileEventType.PerformanceImpact,
        timestamp: new Date(),
        description: `Performance impact detected: ${Math.round(simulation.performanceImpact * 100)}% degradation`,
        effects: {
          stability: -Math.round(simulation.performanceImpact * 10),
          insight: 2,
          description: 'Performance impact'
        },
        deterministic: true
      });
    }

    return events;
  }

  /**
   * Simulate compilation success based on patch characteristics
   */
  private simulateCompilationSuccess(patch: PatchPlan, complexity: number): boolean {
    // Base success rate depends on risk
    let successRate = 1.0 - (patch.risk * 0.7);
    
    // Adjust for complexity
    successRate -= (complexity / 100) * 0.2;
    
    // Ensure minimum success rate
    successRate = Math.max(0.1, successRate);
    
    return Math.random() < successRate;
  }

  /**
   * Generate realistic compilation warnings
   */
  private generateCompilationWarnings(patch: PatchPlan, complexity: number): string[] {
    const warnings: string[] = [];
    
    if (patch.risk > this.riskThresholds.medium) {
      warnings.push('Potential null pointer dereference detected');
    }
    
    if (complexity > 20) {
      warnings.push('Function complexity exceeds recommended threshold');
    }
    
    if (patch.diff.includes('TODO') || patch.diff.includes('FIXME')) {
      warnings.push('TODO/FIXME comments found in production code');
    }
    
    if (Math.random() < patch.risk * 0.5) {
      warnings.push('Unused variable detected');
    }
    
    return warnings;
  }

  /**
   * Generate compilation errors for failed patches
   */
  private generateCompilationErrors(patch: PatchPlan): string[] {
    const errors: string[] = [];
    
    if (patch.risk > this.riskThresholds.high) {
      errors.push('Syntax error: unexpected token');
      errors.push('Type mismatch: cannot convert string to number');
    }
    
    if (patch.diff.includes('undefined')) {
      errors.push('ReferenceError: undefined variable access');
    }
    
    return errors;
  }

  /**
   * Calculate performance impact based on patch characteristics
   */
  private calculatePerformanceImpact(patch: PatchPlan, complexity: number): number {
    let impact = patch.risk * 0.4;
    impact += (complexity / 50) * 0.3;
    
    // Check for performance-affecting patterns
    if (patch.diff.includes('loop') || patch.diff.includes('while') || patch.diff.includes('for')) {
      impact += 0.2;
    }
    
    if (patch.diff.includes('recursive') || patch.diff.includes('recursion')) {
      impact += 0.3;
    }
    
    return Math.min(1.0, impact);
  }

  /**
   * Detect security issues in patch
   */
  private detectSecurityIssues(patch: PatchPlan): string[] {
    const issues: string[] = [];
    
    // Check for dangerous patterns
    if (patch.diff.includes('eval(') || patch.diff.includes('innerHTML')) {
      issues.push('Potential XSS vulnerability detected');
    }
    
    if (patch.diff.includes('password') || patch.diff.includes('secret')) {
      issues.push('Potential credential exposure in code');
    }
    
    if (patch.diff.includes('admin') && patch.risk > this.riskThresholds.medium) {
      issues.push('Unauthorized privilege escalation attempt');
    }
    
    return issues;
  }

  /**
   * Calculate code quality score
   */
  private calculateCodeQuality(patch: PatchPlan, complexity: number): number {
    let score = 0.8; // Base score
    
    // Penalize high risk
    score -= patch.risk * 0.3;
    
    // Penalize high complexity
    score -= (complexity / 100) * 0.2;
    
    // Bonus for good practices
    if (patch.diff.includes('test') || patch.diff.includes('spec')) {
      score += 0.1;
    }
    
    if (patch.diff.includes('//') || patch.diff.includes('/*')) {
      score += 0.05; // Comments
    }
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Calculate consequence severity
   */
  private calculateSeverity(effects: MeterEffects): 'minor' | 'moderate' | 'major' | 'critical' {
    const totalImpact = Math.abs(effects.stability) + Math.abs(effects.insight);
    
    if (totalImpact >= 30) return 'critical';
    if (totalImpact >= 20) return 'major';
    if (totalImpact >= 10) return 'moderate';
    return 'minor';
  }

  /**
   * Generate success dialogue
   */
  private generateSuccessDialogue(patch: PatchPlan, ghost: Ghost): string {
    const responses = [
      `*The ghost's form stabilizes slightly* "Your patch... it works. The corruption lessens."`,
      `"Impressive. You've managed to untangle part of my curse. I feel... clearer."`,
      `*A whisper of relief* "Yes... that's exactly what was needed. The code flows properly now."`,
      `"You understand the problem better than most. This fix will hold... for now."`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate failure dialogue
   */
  private generateFailureDialogue(patch: PatchPlan, simulation: CompilationSimulation, ghost: Ghost): string {
    if (simulation.securityIssues.length > 0) {
      return `*The ghost recoils in horror* "No! That would make things worse! You cannot sacrifice security for a quick fix!"`;
    }
    
    if (!simulation.wouldCompile) {
      return `*The ghost shakes its head sadly* "Your approach has merit, but the syntax... it's broken. The compiler will reject this."`;
    }
    
    return `*The ghost looks disappointed* "Close, but not quite right. The risk is too high - this could destabilize everything."`;
  }

  /**
   * Assess overall risk from execution results
   */
  private assessOverallRisk(
    patch: PatchPlan, 
    compilation: CompilationOutput, 
    performance: PerformanceImpact, 
    quality: CodeQualityMetrics
  ): RiskAssessment {
    const riskFactors: RiskFactor[] = [];
    let overallRisk = patch.risk; // Start with patch base risk

    // Compilation risk factors
    if (compilation.errors.length > 0) {
      const severity = compilation.errors.some(e => e.severity === 'fatal') ? 'critical' : 'high';
      riskFactors.push({
        type: 'reliability',
        severity,
        description: `${compilation.errors.length} compilation error(s) detected`,
        impact: compilation.errors.length * 0.2
      });
      overallRisk += compilation.errors.length * 0.15;
    }

    // Performance risk factors
    if (performance.cpuUsage > 0.8) {
      riskFactors.push({
        type: 'performance',
        severity: 'high',
        description: 'High CPU usage detected',
        impact: performance.cpuUsage
      });
      overallRisk += 0.2;
    }

    if (performance.memoryUsage > 50 * 1024 * 1024) { // 50MB
      riskFactors.push({
        type: 'performance',
        severity: 'medium',
        description: 'High memory consumption detected',
        impact: Math.min(1.0, performance.memoryUsage / (100 * 1024 * 1024))
      });
      overallRisk += 0.1;
    }

    // Quality risk factors
    if (quality.security < 0.5) {
      const severity = quality.security < 0.3 ? 'critical' : 'high';
      riskFactors.push({
        type: 'security',
        severity,
        description: 'Security vulnerabilities detected',
        impact: 1.0 - quality.security
      });
      overallRisk += (1.0 - quality.security) * 0.3;
    }

    if (quality.complexity.cyclomaticComplexity > 15) {
      riskFactors.push({
        type: 'complexity',
        severity: 'medium',
        description: 'High code complexity detected',
        impact: Math.min(1.0, quality.complexity.cyclomaticComplexity / 25)
      });
      overallRisk += 0.1;
    }

    // Performance bottlenecks
    for (const bottleneck of performance.bottlenecks) {
      if (bottleneck.severity === 'major' || bottleneck.severity === 'critical') {
        riskFactors.push({
          type: 'performance',
          severity: bottleneck.severity === 'critical' ? 'critical' : 'high',
          description: bottleneck.description,
          impact: bottleneck.impact
        });
        overallRisk += bottleneck.impact * 0.15;
      }
    }

    // Normalize overall risk
    overallRisk = Math.min(1.0, overallRisk);

    // Determine safety level
    let safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
    if (overallRisk < 0.3) {
      safetyLevel = 'safe';
    } else if (overallRisk < 0.6) {
      safetyLevel = 'caution';
    } else if (overallRisk < 0.8) {
      safetyLevel = 'warning';
    } else {
      safetyLevel = 'danger';
    }

    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(riskFactors, overallRisk);

    return {
      overallRisk,
      riskFactors,
      recommendations,
      safetyLevel
    };
  }

  /**
   * Generate risk-based recommendations
   */
  private generateRiskRecommendations(riskFactors: RiskFactor[], overallRisk: number): string[] {
    const recommendations: string[] = [];

    if (overallRisk > 0.8) {
      recommendations.push('Consider rejecting this patch due to high risk');
    } else if (overallRisk > 0.6) {
      recommendations.push('Review patch carefully before applying');
    }

    // Type-specific recommendations
    const securityFactors = riskFactors.filter(f => f.type === 'security');
    if (securityFactors.length > 0) {
      recommendations.push('Address security vulnerabilities before proceeding');
    }

    const performanceFactors = riskFactors.filter(f => f.type === 'performance');
    if (performanceFactors.length > 0) {
      recommendations.push('Optimize performance-critical sections');
    }

    const complexityFactors = riskFactors.filter(f => f.type === 'complexity');
    if (complexityFactors.length > 0) {
      recommendations.push('Simplify complex code sections for better maintainability');
    }

    if (recommendations.length === 0) {
      recommendations.push('Patch appears safe to apply');
    }

    return recommendations;
  }

  /**
   * Generate compile events from execution results
   */
  private async generateCompileEventsFromResults(
    patch: PatchPlan, 
    results: ExecutionResults, 
    context: GameContext
  ): Promise<CompileEvent[]> {
    const events: CompileEvent[] = [];

    // Success/failure events
    if (results.overallSuccess) {
      events.push({
        id: `compile_success_${Date.now()}`,
        type: CompileEventType.Success,
        timestamp: new Date(),
        description: `Patch compiled successfully in ${results.compilationOutput.executionTime}ms`,
        effects: {
          stability: 3,
          insight: 2,
          description: 'Successful compilation with quality metrics'
        },
        deterministic: true
      });
    } else {
      events.push({
        id: `compile_failure_${Date.now()}`,
        type: CompileEventType.Error,
        timestamp: new Date(),
        description: 'Patch compilation failed with errors',
        effects: {
          stability: -8,
          insight: 1,
          description: 'Compilation failure'
        },
        deterministic: true
      });
    }

    // Warning events from compilation output
    for (const warning of results.compilationOutput.warnings) {
      events.push({
        id: `warning_${Date.now()}_${warning.line}`,
        type: CompileEventType.Warning,
        timestamp: new Date(),
        description: `${warning.code}: ${warning.message} (line ${warning.line})`,
        effects: {
          stability: -1,
          insight: 1,
          description: 'Compilation warning'
        },
        deterministic: true
      });
    }

    // Performance impact events
    if (results.performanceImpact.cpuUsage > 0.7) {
      events.push({
        id: `performance_cpu_${Date.now()}`,
        type: CompileEventType.PerformanceImpact,
        timestamp: new Date(),
        description: `High CPU usage detected: ${Math.round(results.performanceImpact.cpuUsage * 100)}%`,
        effects: {
          stability: -Math.round(results.performanceImpact.cpuUsage * 10),
          insight: 2,
          description: 'CPU performance impact'
        },
        deterministic: true
      });
    }

    if (results.performanceImpact.memoryUsage > 20 * 1024 * 1024) { // 20MB
      events.push({
        id: `performance_memory_${Date.now()}`,
        type: CompileEventType.PerformanceImpact,
        timestamp: new Date(),
        description: `High memory usage: ${Math.round(results.performanceImpact.memoryUsage / (1024 * 1024))}MB`,
        effects: {
          stability: -3,
          insight: 1,
          description: 'Memory performance impact'
        },
        deterministic: true
      });
    }

    // Security events from code quality
    const securityIssues = results.codeQuality.issues.filter(i => i.type === 'vulnerability');
    for (const issue of securityIssues) {
      const severity = issue.severity === 'blocker' || issue.severity === 'critical' ? 'critical' : 'moderate';
      events.push({
        id: `security_${Date.now()}_${issue.line}`,
        type: CompileEventType.SecurityViolation,
        timestamp: new Date(),
        description: `Security issue: ${issue.message}`,
        effects: {
          stability: severity === 'critical' ? -15 : -8,
          insight: 4,
          description: 'Security vulnerability detected'
        },
        deterministic: true
      });
    }

    return events;
  }

  /**
   * Calculate effects from execution results
   */
  private calculateEffectsFromResults(
    patch: PatchPlan, 
    results: ExecutionResults, 
    ghost: Ghost
  ): MeterEffects {
    let stabilityChange = patch.effects.stability;
    let insightChange = patch.effects.insight;

    // Adjust based on compilation success
    if (!results.overallSuccess) {
      stabilityChange -= 5; // Penalty for failed execution
    } else {
      stabilityChange += 2; // Bonus for successful execution
    }

    // Adjust based on code quality
    const qualityBonus = Math.round((results.codeQuality.overallScore - 0.5) * 10);
    stabilityChange += qualityBonus;
    insightChange += Math.max(1, Math.round(results.codeQuality.overallScore * 3));

    // Adjust based on performance impact
    if (results.performanceImpact.cpuUsage > 0.8) {
      stabilityChange -= 3;
    }
    if (results.performanceImpact.memoryUsage > 50 * 1024 * 1024) {
      stabilityChange -= 2;
    }

    // Adjust based on risk assessment
    const riskPenalty = Math.round(results.riskAssessment.overallRisk * 8);
    stabilityChange -= riskPenalty;

    // Apply ghost type multipliers
    const ghostType = ghost.softwareSmell as keyof typeof this.ghostTypeMultipliers;
    const multipliers = this.ghostTypeMultipliers[ghostType] || { stability: 1.0, insight: 1.0 };
    
    stabilityChange = Math.round(stabilityChange * multipliers.stability);
    insightChange = Math.round(insightChange * multipliers.insight);

    return {
      stability: stabilityChange,
      insight: insightChange,
      description: `${patch.description} (Quality: ${Math.round(results.codeQuality.overallScore * 100)}%, Risk: ${Math.round(results.riskAssessment.overallRisk * 100)}%)`
    };
  }

  /**
   * Generate failure dialogue from execution results
   */
  private generateFailureDialogueFromResults(
    patch: PatchPlan, 
    results: ExecutionResults, 
    ghost: Ghost
  ): string {
    const securityIssues = results.codeQuality.issues.filter(i => i.type === 'vulnerability');
    
    if (securityIssues.length > 0) {
      return `*The ghost recoils in horror* "No! That patch contains security vulnerabilities! You cannot compromise the system's integrity!"`;
    }
    
    if (results.compilationOutput.exitCode !== 0) {
      return `*The ghost shakes its head sadly* "Your approach has merit, but the code won't compile. The errors must be fixed first."`;
    }
    
    if (results.riskAssessment.safetyLevel === 'danger') {
      return `*The ghost looks alarmed* "That patch is far too dangerous! The risk assessment shows critical issues that could destabilize everything."`;
    }
    
    if (results.performanceImpact.cpuUsage > 0.9) {
      return `*The ghost winces* "The performance impact is too severe. This would consume too many resources and slow everything down."`;
    }
    
    return `*The ghost looks disappointed* "Close, but the quality metrics show this needs more work. The overall risk is still too high."`;
  }
}