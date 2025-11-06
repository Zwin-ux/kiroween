/**
 * Patch System - Handles patch generation, validation, and application with security checks
 */

import type { 
  PatchPlan,
  PatchResult,
  ValidationResult,
  CompileEvent,
  LintRules
} from '../types/patch';
import { CompileEventType } from '../types/patch';
import type { Ghost } from '../types/ghost';
import type { GameState, MeterEffects } from '../types/game';
import type { MCPTools } from '../types/kiro';
import { SandboxEnvironment, type GameDSLOperation, type ExecContext, type SandboxConstraints } from './SandboxEnvironment';
import { CompileEventSystem, EventEffectProcessor } from './CompileEventSystem';

export class PatchSystem {
  private securityRules: SecurityRule[] = [];
  private compileEventHandlers: Map<CompileEventType, CompileEventHandler[]> = new Map();
  private sandboxEnvironment: SandboxEnvironment;
  private compileEventSystem: CompileEventSystem;
  private effectProcessor: EventEffectProcessor;

  constructor(private mcpTools: MCPTools) {
    this.initializeSecurityRules();
    this.initializeCompileEventHandlers();
    
    // Initialize sandbox environment
    this.sandboxEnvironment = new SandboxEnvironment({
      timeout: 5000,
      memoryLimit: 64 * 1024 * 1024,
      allowedModules: ['lodash'],
      maxExecutionTime: 3000
    });
    
    // Initialize compile event system
    this.compileEventSystem = new CompileEventSystem({
      enableStochasticEvents: true,
      stochasticProbability: 0.3,
      cascadeThreshold: 0.7,
      maxCascadeDepth: 3
    });
    
    // Initialize effect processor
    this.effectProcessor = new EventEffectProcessor(this.compileEventSystem);
  }

  /**
   * Generate a patch plan based on player intent and ghost context
   */
  async generatePlan(intent: string, ghost: Ghost, gameState: GameState): Promise<PatchPlan> {
    try {
      // Analyze player intent to determine fix approach
      const fixApproach = this.analyzeIntent(intent, ghost);
      
      // Select appropriate fix pattern from ghost
      const fixPattern = this.selectFixPattern(ghost, fixApproach);
      
      // Generate the actual diff
      const diff = await this.generateDiff(ghost, fixPattern, intent);
      
      // Calculate risk factors
      const risk = this.calculateRisk(ghost, fixPattern, gameState);
      
      // Calculate meter effects
      const effects = this.calculateEffects(ghost, fixPattern, risk);
      
      // Generate ghost response
      const ghostResponse = this.generateGhostResponse(ghost, fixPattern, risk);

      return {
        diff,
        description: `${fixPattern.description} for ${ghost.name}`,
        risk,
        effects,
        ghostResponse
      };
    } catch (error) {
      throw new Error(`Failed to generate patch plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a patch for security and correctness using sandbox
   */
  async validatePatch(diff: string, context?: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    try {
      // Convert diff to game DSL operations
      const operations = this.parseDiffToOperations(diff);
      
      // Create execution context with security constraints
      const execContext: ExecContext = {
        variables: context?.variables || {},
        functions: context?.functions || {},
        constraints: {
          maxLoops: 5,
          maxRecursionDepth: 10,
          allowedAPIs: ['console.log', 'Math.floor', 'Math.max', 'Math.min'],
          blockedPatterns: [
            /eval\s*\(/,
            /Function\s*\(/,
            /require\s*\(/,
            /import\s+/,
            /process\./,
            /global\./,
            /window\./,
            /document\./
          ]
        }
      };
      
      // Validate using sandbox environment
      const sandboxResult = await this.sandboxEnvironment.executeGameDSL(operations, execContext);
      
      if (!sandboxResult.success) {
        result.valid = false;
        result.errors.push(...sandboxResult.errors);
      }
      
      // Additional linting validation
      const codeContent = this.extractCodeFromDiff(diff);
      if (codeContent) {
        const lintResult = await this.sandboxEnvironment.validateCode(codeContent, {
          'no-eval': 'error',
          'no-unsafe-inline': 'error',
          'no-dangerous-functions': 'error',
          'max-line-length': 120
        });
        
        if (!lintResult.passed) {
          lintResult.issues.forEach(issue => {
            if (issue.severity === 'error') {
              result.errors.push(`Line ${issue.line}: ${issue.message}`);
            } else {
              result.warnings.push(`Line ${issue.line}: ${issue.message}`);
            }
          });
        }
      }
      
      // Legacy security validation
      await this.performSecurityValidation(diff, result);
      
      // Set overall validity
      result.valid = result.errors.length === 0 && result.securityIssues.length === 0;
      
      return result;
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Apply a validated patch and trigger compile events
   */
  async applyPatch(plan: PatchPlan, gameState: GameState): Promise<PatchResult> {
    try {
      // First validate the patch
      const validation = await this.validatePatch(plan.diff);
      
      if (!validation.valid) {
        return {
          success: false,
          effects: { stability: -5, insight: 0, description: 'Patch validation failed' },
          compileEvents: [{
            id: `compile_${Date.now()}`,
            type: CompileEventType.Error,
            timestamp: new Date(),
            description: 'Patch validation failed: ' + validation.errors.join(', '),
            effects: { stability: -5, insight: 0, description: 'Validation failure penalty' },
            deterministic: true
          }]
        };
      }

      // Apply the diff using MCP tools
      const applyResult = await this.mcpTools.diff.apply(plan.diff, 'haunted_module');
      
      if (!applyResult.success) {
        return {
          success: false,
          effects: { stability: -3, insight: 0, description: 'Patch application failed' },
          compileEvents: [{
            id: `compile_${Date.now()}`,
            type: CompileEventType.Error,
            timestamp: new Date(),
            description: 'Failed to apply patch: ' + applyResult.errors.join(', '),
            effects: { stability: -3, insight: 0, description: 'Application failure penalty' },
            deterministic: true
          }]
        };
      }

      // Generate compile events using the compile event system
      const compileEvents = await this.compileEventSystem.processCompilation(plan, gameState);
      
      // Calculate final effects using the effect processor
      const patchResult: PatchResult = {
        success: true,
        effects: plan.effects,
        compileEvents,
        newDialogue: plan.ghostResponse
      };
      
      const finalEffects = await this.effectProcessor.processEffects(patchResult, gameState);
      
      return {
        success: true,
        effects: finalEffects,
        compileEvents,
        newDialogue: plan.ghostResponse
      };
    } catch (error) {
      return {
        success: false,
        effects: { stability: -10, insight: 0, description: 'Critical patch failure' },
        compileEvents: [{
          id: `compile_${Date.now()}`,
          type: CompileEventType.Error,
          timestamp: new Date(),
          description: `Critical failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
          effects: { stability: -10, insight: 0, description: 'Critical failure penalty' },
          deterministic: true
        }]
      };
    }
  }

  /**
   * Register a security rule for patch validation
   */
  registerSecurityRule(rule: SecurityRule): void {
    this.securityRules.push(rule);
  }

  /**
   * Register a compile event handler
   */
  registerCompileEventHandler(eventType: CompileEventType, handler: CompileEventHandler): void {
    const handlers = this.compileEventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.compileEventHandlers.set(eventType, handlers);
  }

  /**
   * Private method to analyze player intent
   */
  private analyzeIntent(intent: string, ghost: Ghost): FixApproach {
    const lowerIntent = intent.toLowerCase();
    
    // Keyword-based intent analysis
    if (lowerIntent.includes('refactor') || lowerIntent.includes('restructure')) {
      return FixApproach.Refactor;
    } else if (lowerIntent.includes('quick') || lowerIntent.includes('simple')) {
      return FixApproach.QuickFix;
    } else if (lowerIntent.includes('secure') || lowerIntent.includes('safe')) {
      return FixApproach.SecurityFix;
    } else if (lowerIntent.includes('optimize') || lowerIntent.includes('performance')) {
      return FixApproach.Optimization;
    }
    
    // Default based on ghost type
    switch (ghost.softwareSmell) {
      case 'prompt_injection':
      case 'data_leak':
        return FixApproach.SecurityFix;
      case 'memory_leak':
      case 'unbounded_recursion':
        return FixApproach.Optimization;
      case 'circular_dependency':
      case 'dead_code':
        return FixApproach.Refactor;
      default:
        return FixApproach.Standard;
    }
  }

  /**
   * Private method to select fix pattern from ghost
   */
  private selectFixPattern(ghost: Ghost, approach: FixApproach) {
    // Filter patterns by approach if possible
    const suitablePatterns = ghost.fixPatterns.filter(pattern => {
      switch (approach) {
        case FixApproach.SecurityFix:
          return pattern.type.includes('security') || pattern.type.includes('validation');
        case FixApproach.Optimization:
          return pattern.type.includes('optimization') || pattern.type.includes('performance');
        case FixApproach.Refactor:
          return pattern.type.includes('refactor') || pattern.type.includes('restructure');
        default:
          return true;
      }
    });
    
    // Return first suitable pattern or fallback to first pattern
    return suitablePatterns[0] || ghost.fixPatterns[0];
  }

  /**
   * Private method to generate diff content
   */
  private async generateDiff(ghost: Ghost, fixPattern: any, intent: string): Promise<string> {
    // Generate contextual diff based on ghost type and fix pattern
    const fileExtension = this.getFileExtension(ghost.softwareSmell);
    const fileName = `haunted_${ghost.softwareSmell}.${fileExtension}`;
    
    return `--- a/${fileName}
+++ b/${fileName}
@@ -1,10 +1,15 @@
 // Haunted module: ${ghost.name}
 // Software smell: ${ghost.softwareSmell}
-// Status: INFECTED
+// Status: PATCHED
 
-// Problematic code causing ${ghost.softwareSmell}
+// Applied fix: ${fixPattern.type}
+// Player intent: ${intent}
+
 ${this.generateProblemCode(ghost)}
 
+${this.generateFixCode(ghost, fixPattern)}
+
 // End of haunted module`;
  }

  /**
   * Private method to calculate patch risk
   */
  private calculateRisk(ghost: Ghost, fixPattern: any, gameState: GameState): number {
    let baseRisk = fixPattern.risk || 0.5;
    
    // Adjust for ghost severity
    baseRisk += (ghost.severity / 20);
    
    // Adjust for system stability (lower stability = higher risk)
    const stabilityFactor = Math.max(0.1, gameState.meters.stability / 100);
    baseRisk /= stabilityFactor;
    
    // Adjust for player insight (higher insight = lower risk)
    const insightFactor = Math.max(0.5, 1 + (gameState.meters.insight / 200));
    baseRisk /= insightFactor;
    
    return Math.min(1.0, Math.max(0.0, baseRisk));
  }

  /**
   * Private method to calculate meter effects
   */
  private calculateEffects(ghost: Ghost, fixPattern: any, risk: number): MeterEffects {
    let stabilityEffect = fixPattern.stabilityEffect || 10;
    let insightEffect = fixPattern.insightEffect || 5;
    
    // Adjust effects based on risk
    if (risk > 0.7) {
      // High risk - potential negative effects
      stabilityEffect = Math.round(stabilityEffect * (1 - risk));
      insightEffect = Math.round(insightEffect * 0.8);
    } else if (risk < 0.3) {
      // Low risk - bonus effects
      stabilityEffect = Math.round(stabilityEffect * 1.2);
      insightEffect = Math.round(insightEffect * 1.1);
    }
    
    return {
      stability: stabilityEffect,
      insight: insightEffect,
      description: `Applied ${fixPattern.type} to ${ghost.name}`
    };
  }

  /**
   * Private method to generate ghost response
   */
  private generateGhostResponse(ghost: Ghost, fixPattern: any, risk: number): string {
    if (risk < 0.3) {
      return "Ahh... you understand the true nature of the problem. I can rest now...";
    } else if (risk < 0.7) {
      return "Better... but be careful. The corruption runs deeper than you think...";
    } else {
      return "Dangerous! Your fix may cause more harm than good!";
    }
  }

  /**
   * Private method to perform security validation
   */
  private async performSecurityValidation(diff: string, result: ValidationResult): Promise<void> {
    for (const rule of this.securityRules) {
      const violation = rule.check(diff);
      if (violation) {
        result.securityIssues.push(violation);
      }
    }
  }

  /**
   * Private method to perform syntax validation
   */
  private async performSyntaxValidation(diff: string, result: ValidationResult): Promise<void> {
    try {
      // Extract code from diff for linting
      const codeLines = diff.split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++'));
      const code = codeLines.map(line => line.substring(1)).join('\n');
      
      if (code.trim()) {
        const lintRules: LintRules = {
          'no-eval': 'error',
          'no-unsafe-inline': 'error',
          'no-dangerous-functions': 'error'
        };
        
        const lintResult = await this.mcpTools.lint.run(code, lintRules);
        
        if (!lintResult.passed) {
          lintResult.issues.forEach(issue => {
            if (issue.severity === 'error') {
              result.errors.push(`Line ${issue.line}: ${issue.message}`);
            } else {
              result.warnings.push(`Line ${issue.line}: ${issue.message}`);
            }
          });
        }
      }
    } catch (error) {
      result.warnings.push(`Linting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private method to perform semantic validation
   */
  private async performSemanticValidation(diff: string, result: ValidationResult, context?: any): Promise<void> {
    // Check for common semantic issues
    if (diff.includes('while(true)') && !diff.includes('break')) {
      result.errors.push('Potential infinite loop detected');
    }
    
    if (diff.includes('eval(') || diff.includes('Function(')) {
      result.securityIssues.push('Dynamic code execution detected');
    }
    
    if (diff.includes('document.write') || diff.includes('innerHTML')) {
      result.securityIssues.push('Potential XSS vulnerability');
    }
  }

  /**
   * Private method to generate compile events
   */
  private async generateCompileEvents(plan: PatchPlan, gameState: GameState): Promise<CompileEvent[]> {
    const events: CompileEvent[] = [];
    
    // Deterministic events based on patch risk
    if (plan.risk > 0.8) {
      events.push({
        id: `compile_${Date.now()}_warning`,
        type: CompileEventType.Warning,
        timestamp: new Date(),
        description: 'High-risk patch applied - system stability may be affected',
        effects: { stability: -2, insight: 1, description: 'High-risk patch warning' },
        deterministic: true
      });
    }
    
    // Stochastic events based on system state
    if (gameState.meters.stability < 30 && Math.random() < 0.3) {
      events.push({
        id: `compile_${Date.now()}_cascade`,
        type: CompileEventType.Error,
        timestamp: new Date(),
        description: 'Cascade failure triggered by low system stability',
        effects: { stability: -5, insight: 2, description: 'Cascade failure' },
        deterministic: false
      });
    }
    
    // Success event
    events.push({
      id: `compile_${Date.now()}_success`,
      type: CompileEventType.Success,
      timestamp: new Date(),
      description: 'Patch compiled successfully',
      effects: { stability: 1, insight: 1, description: 'Successful compilation' },
      deterministic: true
    });
    
    return events;
  }

  /**
   * Private method to calculate final effects including compile events
   */
  private calculateFinalEffects(baseEffects: MeterEffects, compileEvents: CompileEvent[]): MeterEffects {
    let totalStability = baseEffects.stability;
    let totalInsight = baseEffects.insight;
    
    compileEvents.forEach(event => {
      totalStability += event.effects.stability;
      totalInsight += event.effects.insight;
    });
    
    return {
      stability: totalStability,
      insight: totalInsight,
      description: baseEffects.description
    };
  }

  /**
   * Private method to get file extension for software smell
   */
  private getFileExtension(softwareSmell: string): string {
    const extensions: Record<string, string> = {
      'circular_dependency': 'py',
      'stale_cache': 'js',
      'unbounded_recursion': 'rs',
      'prompt_injection': 'py',
      'data_leak': 'log',
      'dead_code': 'js',
      'race_condition': 'go',
      'memory_leak': 'cpp'
    };
    
    return extensions[softwareSmell] || 'txt';
  }

  /**
   * Private method to generate problem code based on ghost type
   */
  private generateProblemCode(ghost: Ghost): string {
    switch (ghost.softwareSmell) {
      case 'circular_dependency':
        return 'import moduleB from "./moduleB";\n// moduleB imports this module back';
      case 'memory_leak':
        return 'let leakedData = [];\nsetInterval(() => leakedData.push(new Array(1000)), 100);';
      case 'unbounded_recursion':
        return 'function recursiveFunction(n) {\n  return recursiveFunction(n + 1);\n}';
      case 'prompt_injection':
        return 'function processInput(userInput) {\n  return eval(userInput);\n}';
      default:
        return '// Problematic code here';
    }
  }

  /**
   * Private method to generate fix code based on ghost and pattern
   */
  private generateFixCode(ghost: Ghost, fixPattern: any): string {
    switch (ghost.softwareSmell) {
      case 'circular_dependency':
        return '// Fixed: Use dependency injection\nconst moduleB = inject("moduleB");';
      case 'memory_leak':
        return '// Fixed: Clear interval and limit array size\nif (leakedData.length > 100) leakedData.length = 0;';
      case 'unbounded_recursion':
        return '// Fixed: Add base case and depth limit\nif (n > 1000) return n;\nif (n <= 0) return 0;';
      case 'prompt_injection':
        return '// Fixed: Input validation and sanitization\nconst sanitized = sanitizeInput(userInput);';
      default:
        return '// Fixed implementation';
    }
  }

  /**
   * Private method to initialize security rules
   */
  private initializeSecurityRules(): void {
    this.securityRules = [
      {
        name: 'no-eval',
        check: (diff: string) => diff.includes('eval(') ? 'Use of eval() is prohibited' : null
      },
      {
        name: 'no-function-constructor',
        check: (diff: string) => diff.includes('new Function(') ? 'Use of Function constructor is prohibited' : null
      },
      {
        name: 'no-dangerous-html',
        check: (diff: string) => diff.includes('innerHTML') ? 'Direct innerHTML manipulation detected' : null
      },
      {
        name: 'no-unsafe-protocols',
        check: (diff: string) => /javascript:|data:|vbscript:/.test(diff) ? 'Unsafe protocol detected' : null
      }
    ];
  }

  /**
   * Private method to initialize compile event handlers
   */
  private initializeCompileEventHandlers(): void {
    // Initialize default handlers for each event type
    this.compileEventHandlers.set(CompileEventType.Success, []);
    this.compileEventHandlers.set(CompileEventType.Warning, []);
    this.compileEventHandlers.set(CompileEventType.Error, []);
    this.compileEventHandlers.set(CompileEventType.SecurityViolation, []);
    this.compileEventHandlers.set(CompileEventType.PerformanceImpact, []);
  }

  /**
   * Parse diff content into game DSL operations
   */
  private parseDiffToOperations(diff: string): GameDSLOperation[] {
    const operations: GameDSLOperation[] = [];
    const lines = diff.split('\n');
    
    let currentFile = '';
    let lineNumber = 0;
    
    for (const line of lines) {
      if (line.startsWith('+++')) {
        // Extract filename from diff header
        const match = line.match(/\+\+\+ b\/(.+)/);
        if (match) {
          currentFile = match[1];
        }
      } else if (line.startsWith('@@')) {
        // Extract line number from hunk header
        const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
        if (match) {
          lineNumber = parseInt(match[1], 10);
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Addition operation
        operations.push({
          type: 'add',
          target: currentFile,
          content: line.substring(1),
          line: lineNumber
        });
        lineNumber++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Removal operation
        operations.push({
          type: 'remove',
          target: currentFile,
          line: lineNumber
        });
      } else if (!line.startsWith(' ') && !line.startsWith('@@') && line.trim()) {
        // Modification operation
        operations.push({
          type: 'modify',
          target: currentFile,
          content: line,
          line: lineNumber
        });
        lineNumber++;
      } else if (line.startsWith(' ')) {
        // Context line, increment line number
        lineNumber++;
      }
    }
    
    return operations;
  }

  /**
   * Extract code content from diff for linting
   */
  private extractCodeFromDiff(diff: string): string {
    const lines = diff.split('\n');
    const codeLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        codeLines.push(line.substring(1));
      }
    }
    
    return codeLines.join('\n');
  }

  /**
   * Get sandbox environment for external access
   */
  getSandboxEnvironment(): SandboxEnvironment {
    return this.sandboxEnvironment;
  }

  /**
   * Get compile event system for external access
   */
  getCompileEventSystem(): CompileEventSystem {
    return this.compileEventSystem;
  }

  /**
   * Get effect processor for external access
   */
  getEffectProcessor(): EventEffectProcessor {
    return this.effectProcessor;
  }
}

// Supporting interfaces and enums
interface SecurityRule {
  name: string;
  check: (diff: string) => string | null;
}

type CompileEventHandler = (event: CompileEvent, gameState: GameState) => Promise<void>;

enum FixApproach {
  Standard = 'standard',
  QuickFix = 'quick_fix',
  Refactor = 'refactor',
  SecurityFix = 'security_fix',
  Optimization = 'optimization'
}