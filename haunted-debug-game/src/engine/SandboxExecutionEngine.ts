/**
 * SandboxExecutionEngine - Enhanced sandbox for safe patch validation and simulation
 * Provides isolated patch validation with deterministic results for consistent gameplay
 */

import type { 
  PatchPlan,
  ValidationResult,
  CompileEvent
} from '@/types/patch';
import { CompileEventType } from '@/types/patch';
import type { GameState, MeterEffects } from '@/types/game';
import type { Ghost } from '@/types/content';
import { SoftwareSmell } from '@/types/content';
import { SandboxEnvironment, type GameDSLOperation, type ExecContext, type SandboxConstraints } from './SandboxEnvironment';
import { 
  SecurityValidationSystem, 
  type SecurityValidationResult, 
  type ValidationContext 
} from './SecurityValidationSystem';

export interface SandboxExecutionResult {
  success: boolean;
  output: string;
  warnings: string[];
  errors: string[];
  executionTime: number;
  memoryUsage: number;
  deterministic: boolean;
  securityValidation?: SecurityValidationResult;
  rejectionMessage?: string;
}

export interface PatchValidationContext {
  ghost: Ghost;
  gameState: GameState;
  playerIntent: string;
  riskTolerance: number;
}

export interface DeterministicConfig {
  seed: number;
  enableRandomness: boolean;
  consistencyMode: 'strict' | 'relaxed';
  cacheResults: boolean;
}

/**
 * Game DSL Validator - Validates game-specific operations for safety and correctness
 */
class GameDSLValidator {
  private allowedOperations = ['add', 'remove', 'modify', 'validate', 'test', 'lint'];
  private safeTargets = /^[a-zA-Z0-9_\-\/\.]+$/;
  private maxOperationsPerPatch = 10;

  async validateOperations(operations: GameDSLOperation[]): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    // Check operation count
    if (operations.length > this.maxOperationsPerPatch) {
      result.errors.push(`Too many operations: ${operations.length} exceeds limit of ${this.maxOperationsPerPatch}`);
    }

    // Validate each operation
    for (const [index, operation] of operations.entries()) {
      const opResult = this.validateSingleOperation(operation, index);
      result.errors.push(...opResult.errors);
      result.warnings.push(...opResult.warnings);
      result.securityIssues.push(...opResult.securityIssues);
    }

    result.valid = result.errors.length === 0 && result.securityIssues.length === 0;
    return result;
  }

  private validateSingleOperation(operation: GameDSLOperation, index: number): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    // Validate operation type
    if (!this.allowedOperations.includes(operation.type)) {
      result.errors.push(`Operation ${index}: Invalid operation type '${operation.type}'`);
    }

    // Validate target
    if (!operation.target || !this.safeTargets.test(operation.target)) {
      result.errors.push(`Operation ${index}: Invalid or unsafe target '${operation.target}'`);
    }

    // Validate content if present
    if (operation.content) {
      const contentValidation = this.validateContent(operation.content, index);
      result.errors.push(...contentValidation.errors);
      result.warnings.push(...contentValidation.warnings);
      result.securityIssues.push(...contentValidation.securityIssues);
    }

    return result;
  }

  private validateContent(content: string, operationIndex: number): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: 'eval() usage detected' },
      { pattern: /Function\s*\(/, message: 'Function constructor usage detected' },
      { pattern: /require\s*\(/, message: 'require() usage detected' },
      { pattern: /import\s+.*from/, message: 'import statement detected' },
      { pattern: /process\./g, message: 'process object access detected' },
      { pattern: /global\./g, message: 'global object access detected' },
      { pattern: /window\./g, message: 'window object access detected' },
      { pattern: /document\./g, message: 'document object access detected' }
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(content)) {
        result.securityIssues.push(`Operation ${operationIndex}: ${message}`);
      }
    }

    // Check content length
    if (content.length > 10000) {
      result.warnings.push(`Operation ${operationIndex}: Content is very large (${content.length} characters)`);
    }

    return result;
  }
}

/**
 * Security Analyzer - Analyzes patches for security vulnerabilities and risks
 */
class SecurityAnalyzer {
  private riskFactors = {
    eval: 1.0,
    functionConstructor: 0.9,
    domManipulation: 0.7,
    networkAccess: 0.8,
    fileSystem: 0.9,
    processAccess: 1.0,
    globalAccess: 0.8
  };

  async analyzePatchSecurity(patch: PatchPlan, context: PatchValidationContext): Promise<SecurityAnalysisResult> {
    const result: SecurityAnalysisResult = {
      riskScore: 0,
      vulnerabilities: [],
      recommendations: [],
      allowExecution: true
    };

    // Analyze diff content
    const diffAnalysis = this.analyzeDiffSecurity(patch.diff);
    result.riskScore += diffAnalysis.riskScore;
    result.vulnerabilities.push(...diffAnalysis.vulnerabilities);

    // Analyze based on ghost type
    const ghostAnalysis = this.analyzeGhostSpecificRisks(context.ghost, patch);
    result.riskScore += ghostAnalysis.riskScore;
    result.vulnerabilities.push(...ghostAnalysis.vulnerabilities);

    // Normalize risk score
    result.riskScore = Math.min(1.0, result.riskScore);

    // Generate recommendations
    result.recommendations = this.generateSecurityRecommendations(result.vulnerabilities);

    // Determine if execution should be allowed
    result.allowExecution = result.riskScore < 0.8 && !result.vulnerabilities.some(v => v.severity === 'critical');

    return result;
  }

  private analyzeDiffSecurity(diff: string): { riskScore: number; vulnerabilities: SecurityVulnerability[] } {
    const vulnerabilities: SecurityVulnerability[] = [];
    let riskScore = 0;

    // Check for dangerous patterns in diff
    const patterns = [
      { regex: /eval\s*\(/, factor: this.riskFactors.eval, type: 'code-injection', severity: 'critical' as const },
      { regex: /Function\s*\(/, factor: this.riskFactors.functionConstructor, type: 'code-injection', severity: 'high' as const },
      { regex: /innerHTML\s*=/, factor: this.riskFactors.domManipulation, type: 'xss', severity: 'medium' as const },
      { regex: /fetch\s*\(|XMLHttpRequest/, factor: this.riskFactors.networkAccess, type: 'network-access', severity: 'medium' as const },
      { regex: /localStorage|sessionStorage/, factor: this.riskFactors.fileSystem, type: 'data-storage', severity: 'low' as const }
    ];

    for (const { regex, factor, type, severity } of patterns) {
      const matches = diff.match(regex);
      if (matches) {
        riskScore += factor * matches.length * 0.1;
        vulnerabilities.push({
          type,
          severity,
          description: `Detected ${matches.length} instance(s) of ${type}`,
          location: 'diff-content',
          mitigation: this.getMitigationForType(type)
        });
      }
    }

    return { riskScore, vulnerabilities };
  }

  private analyzeGhostSpecificRisks(ghost: Ghost, patch: PatchPlan): { riskScore: number; vulnerabilities: SecurityVulnerability[] } {
    const vulnerabilities: SecurityVulnerability[] = [];
    let riskScore = 0;

    // Different ghost types have different risk profiles
    switch (ghost.softwareSmell) {
      case SoftwareSmell.PromptInjection:
        riskScore += 0.3; // Higher base risk for prompt injection ghosts
        if (patch.diff.includes('input') || patch.diff.includes('prompt')) {
          vulnerabilities.push({
            type: 'prompt-injection',
            severity: 'high',
            description: 'Patch modifies input/prompt handling in prompt injection context',
            location: 'ghost-context',
            mitigation: 'Ensure proper input sanitization and validation'
          });
        }
        break;

      case SoftwareSmell.DataLeak:
        riskScore += 0.2;
        if (patch.diff.includes('console.log') || patch.diff.includes('alert')) {
          vulnerabilities.push({
            type: 'data-exposure',
            severity: 'medium',
            description: 'Patch may expose sensitive data through logging',
            location: 'ghost-context',
            mitigation: 'Remove or sanitize logging statements'
          });
        }
        break;

      case SoftwareSmell.UnboundedRecursion:
        if (patch.diff.includes('recursive') || patch.diff.includes('function')) {
          vulnerabilities.push({
            type: 'resource-exhaustion',
            severity: 'medium',
            description: 'Patch modifies recursive function in unbounded recursion context',
            location: 'ghost-context',
            mitigation: 'Ensure proper recursion limits and base cases'
          });
        }
        break;
    }

    return { riskScore, vulnerabilities };
  }

  private getMitigationForType(type: string): string {
    const mitigations: Record<string, string> = {
      'code-injection': 'Use safe alternatives to eval() and Function constructor',
      'xss': 'Use textContent instead of innerHTML, sanitize user input',
      'network-access': 'Validate URLs and implement proper CORS policies',
      'data-storage': 'Encrypt sensitive data before storage',
      'prompt-injection': 'Implement input validation and sanitization',
      'data-exposure': 'Remove or sanitize logging of sensitive information',
      'resource-exhaustion': 'Implement proper limits and monitoring'
    };
    return mitigations[type] || 'Review code for security implications';
  }

  private generateSecurityRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations: string[] = [];
    const severityCounts = vulnerabilities.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (severityCounts.critical > 0) {
      recommendations.push('Critical security issues detected - patch should not be executed');
    }
    if (severityCounts.high > 0) {
      recommendations.push('High-risk security issues found - review and modify patch before execution');
    }
    if (severityCounts.medium > 0) {
      recommendations.push('Medium-risk issues detected - consider additional safeguards');
    }

    // Add specific recommendations based on vulnerability types
    const types = [...new Set(vulnerabilities.map(v => v.type))];
    for (const type of types) {
      const typeVulns = vulnerabilities.filter(v => v.type === type);
      if (typeVulns.length > 0) {
        recommendations.push(typeVulns[0].mitigation);
      }
    }

    return recommendations;
  }
}

interface SecurityAnalysisResult {
  riskScore: number;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
  allowExecution: boolean;
}

interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  mitigation: string;
}

export class SandboxExecutionEngine {
  private sandboxEnvironment: SandboxEnvironment;
  private deterministicConfig: DeterministicConfig;
  private resultCache: Map<string, SandboxExecutionResult>;
  private gameDSLValidator: GameDSLValidator;
  private securityAnalyzer: SecurityAnalyzer;
  private securityValidationSystem: SecurityValidationSystem;
  private deterministicRandom: () => number;

  constructor(
    sandboxConfig?: Partial<import('./SandboxEnvironment').SandboxConfig>,
    deterministicConfig?: Partial<DeterministicConfig>
  ) {
    this.sandboxEnvironment = new SandboxEnvironment(sandboxConfig);
    
    this.deterministicConfig = {
      seed: 12345,
      enableRandomness: false,
      consistencyMode: 'strict',
      cacheResults: true,
      ...deterministicConfig
    };

    this.resultCache = new Map();
    this.gameDSLValidator = new GameDSLValidator();
    this.securityAnalyzer = new SecurityAnalyzer();
    this.securityValidationSystem = new SecurityValidationSystem();
    
    // Initialize deterministic random number generator
    this.deterministicRandom = this.createDeterministicRandom(this.deterministicConfig.seed);
  }

  /**
   * Execute patch validation with isolated environment and deterministic results
   */
  async validatePatchSafely(
    patch: PatchPlan, 
    context: PatchValidationContext
  ): Promise<SandboxExecutionResult> {
    const cacheKey = this.generateCacheKey(patch, context);
    
    // Return cached result if available and caching is enabled
    if (this.deterministicConfig.cacheResults && this.resultCache.has(cacheKey)) {
      return this.resultCache.get(cacheKey)!;
    }

    try {
      const startTime = performance.now();
      
      // Parse patch into game DSL operations
      const operations = await this.parsePatchToGameDSL(patch);
      
      // Create secure execution context
      const execContext = this.createSecureContext(context);
      
      // Validate operations for safety
      const validation = await this.validateOperationsSafety(operations, execContext);
      
      // Perform comprehensive security validation
      const validationContext: ValidationContext = {
        ghost: context.ghost,
        gameState: context.gameState,
        playerIntent: context.playerIntent,
        riskTolerance: context.riskTolerance,
        educationalMode: true
      };
      
      const securityValidation = await this.securityValidationSystem.validatePatchSecurity(patch, validationContext);
      
      if (!validation.valid || !securityValidation.isValid) {
        const rejectionMessage = securityValidation.isValid ? '' : 
          this.securityValidationSystem.generateRejectionMessage(securityValidation);
        
        const result: SandboxExecutionResult = {
          success: false,
          output: rejectionMessage || 'Patch validation failed',
          warnings: validation.warnings.concat(securityValidation.violations.map(v => v.description)),
          errors: validation.errors.concat(validation.securityIssues),
          executionTime: performance.now() - startTime,
          memoryUsage: 0,
          deterministic: true,
          securityValidation,
          rejectionMessage
        };
        
        if (this.deterministicConfig.cacheResults) {
          this.resultCache.set(cacheKey, result);
        }
        
        return result;
      }

      // Perform legacy security analysis for additional checks
      const securityAnalysis = await this.securityAnalyzer.analyzePatchSecurity(patch, context);
      
      if (!securityAnalysis.allowExecution) {
        const result: SandboxExecutionResult = {
          success: false,
          output: '',
          warnings: securityAnalysis.recommendations,
          errors: securityAnalysis.vulnerabilities.map(v => `${v.severity.toUpperCase()}: ${v.description}`),
          executionTime: performance.now() - startTime,
          memoryUsage: 0,
          deterministic: true,
          securityValidation
        };
        
        if (this.deterministicConfig.cacheResults) {
          this.resultCache.set(cacheKey, result);
        }
        
        return result;
      }

      // Execute operations in sandbox
      const executionResult = await this.sandboxEnvironment.executeGameDSL(operations, execContext);
      
      // Generate deterministic results
      const deterministicResults = this.generateDeterministicResults(
        patch, 
        context, 
        executionResult, 
        securityAnalysis
      );

      const result: SandboxExecutionResult = {
        success: executionResult.success,
        output: deterministicResults.output,
        warnings: deterministicResults.warnings,
        errors: executionResult.errors,
        executionTime: performance.now() - startTime,
        memoryUsage: deterministicResults.memoryUsage,
        deterministic: true,
        securityValidation
      };

      if (this.deterministicConfig.cacheResults) {
        this.resultCache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      const result: SandboxExecutionResult = {
        success: false,
        output: '',
        warnings: [],
        errors: [`Sandbox execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        executionTime: 0,
        memoryUsage: 0,
        deterministic: true
      };

      if (this.deterministicConfig.cacheResults) {
        this.resultCache.set(cacheKey, result);
      }

      return result;
    }
  }

  /**
   * Execute patch with full simulation including compile events
   */
  async executePatchWithSimulation(
    patch: PatchPlan,
    context: PatchValidationContext
  ): Promise<{ result: SandboxExecutionResult; compileEvents: CompileEvent[] }> {
    const validationResult = await this.validatePatchSafely(patch, context);
    const compileEvents = this.generateCompileEvents(patch, context, validationResult);

    return {
      result: validationResult,
      compileEvents
    };
  }

  /**
   * Generate cache key for deterministic caching
   */
  private generateCacheKey(patch: PatchPlan, context: PatchValidationContext): string {
    const keyData = {
      diff: patch.diff,
      ghostId: context.ghost.id,
      playerIntent: context.playerIntent,
      riskTolerance: context.riskTolerance,
      seed: this.deterministicConfig.seed
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Parse patch diff into game DSL operations
   */
  private async parsePatchToGameDSL(patch: PatchPlan): Promise<GameDSLOperation[]> {
    const operations: GameDSLOperation[] = [];
    const diffLines = patch.diff.split('\n');
    
    let currentFile = '';
    let lineNumber = 0;

    for (const line of diffLines) {
      // Parse diff header to get file name
      if (line.startsWith('+++') || line.startsWith('---')) {
        const match = line.match(/[+-]{3}\s+(.+)/);
        if (match) {
          currentFile = match[1].replace(/^[ab]\//, ''); // Remove a/ or b/ prefix
        }
        continue;
      }

      // Parse line numbers
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          lineNumber = parseInt(match[2], 10);
        }
        continue;
      }

      // Parse actual changes
      if (line.startsWith('+') && !line.startsWith('+++')) {
        operations.push({
          type: 'add',
          target: currentFile || 'unknown',
          content: line.substring(1), // Remove + prefix
          line: lineNumber
        });
        lineNumber++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        operations.push({
          type: 'remove',
          target: currentFile || 'unknown',
          content: line.substring(1), // Remove - prefix
          line: lineNumber
        });
      } else if (line.startsWith(' ')) {
        // Context line, just increment line number
        lineNumber++;
      }
    }

    // If no operations were parsed from diff, create a generic modify operation
    if (operations.length === 0) {
      operations.push({
        type: 'modify',
        target: 'code',
        content: patch.description,
        line: 1
      });
    }

    return operations;
  }

  /**
   * Create secure execution context
   */
  private createSecureContext(context: PatchValidationContext): ExecContext {
    const constraints: SandboxConstraints = {
      maxLoops: 10,
      maxRecursionDepth: 5,
      allowedAPIs: [
        'console.log',
        'Math.*',
        'Array.*',
        'Object.*',
        'String.*',
        'Number.*',
        'JSON.*'
      ],
      blockedPatterns: [
        /eval\s*\(/,
        /Function\s*\(/,
        /require\s*\(/,
        /import\s+.*from/,
        /process\./,
        /global\./,
        /window\./,
        /document\./
      ]
    };

    return {
      variables: {
        ghostType: context.ghost.softwareSmell,
        riskTolerance: context.riskTolerance,
        playerIntent: context.playerIntent,
        gameState: {
          stability: context.gameState.meters.stability,
          insight: context.gameState.meters.insight
        }
      },
      functions: {
        // Safe utility functions
        log: (message: string) => console.log(`[Sandbox] ${message}`),
        calculateRisk: (operations: any[]) => this.calculateOperationRisk(operations),
        validateInput: (input: string) => this.sanitizeInput(input)
      },
      constraints
    };
  }

  /**
   * Validate operations for safety
   */
  private async validateOperationsSafety(
    operations: GameDSLOperation[], 
    context: ExecContext
  ): Promise<ValidationResult> {
    // Use the GameDSLValidator to validate operations
    const validationResult = await this.gameDSLValidator.validateOperations(operations);
    
    // Additional context-specific validation
    for (const operation of operations) {
      // Check against context constraints
      if (operation.content) {
        for (const pattern of context.constraints.blockedPatterns) {
          if (pattern.test(operation.content)) {
            validationResult.securityIssues.push(
              `Operation contains blocked pattern: ${pattern.source}`
            );
          }
        }
      }
    }

    validationResult.valid = validationResult.errors.length === 0 && validationResult.securityIssues.length === 0;
    return validationResult;
  }

  /**
   * Generate deterministic results for consistent gameplay
   */
  private generateDeterministicResults(
    patch: PatchPlan,
    context: PatchValidationContext,
    executionResult: import('@/types/patch').ApplyResult,
    securityAnalysis: SecurityAnalysisResult
  ): { output: string; warnings: string[]; memoryUsage: number } {
    // Use deterministic random for consistent results
    const baseRisk = patch.risk;
    const securityRisk = securityAnalysis.riskScore;
    const combinedRisk = Math.min(1.0, baseRisk + securityRisk);

    // Generate deterministic output based on risk and ghost type
    let output = executionResult.output;
    const warnings: string[] = [...securityAnalysis.recommendations];

    // Add deterministic simulation results
    if (combinedRisk > 0.7) {
      output += '\n[HIGH RISK] Patch execution may cause system instability';
      warnings.push('High-risk patch detected - proceed with caution');
    } else if (combinedRisk > 0.4) {
      output += '\n[MEDIUM RISK] Patch execution completed with warnings';
      warnings.push('Medium-risk patch - monitor system behavior');
    } else {
      output += '\n[LOW RISK] Patch execution completed successfully';
    }

    // Simulate memory usage based on operations
    const memoryUsage = Math.floor(1024 * 1024 * (0.5 + combinedRisk * 0.5)); // 0.5-1MB range

    // Add ghost-specific output
    switch (context.ghost.softwareSmell) {
      case SoftwareSmell.CircularDependency:
        output += '\n[DEPENDENCY] Circular dependency analysis completed';
        break;
      case SoftwareSmell.MemoryLeak:
        output += '\n[MEMORY] Memory leak detection completed';
        break;
      case SoftwareSmell.PromptInjection:
        output += '\n[SECURITY] Input validation analysis completed';
        break;
      default:
        output += `\n[${context.ghost.softwareSmell.toUpperCase()}] Analysis completed`;
    }

    return {
      output,
      warnings,
      memoryUsage
    };
  }

  /**
   * Generate compile events for patch execution
   */
  private generateCompileEvents(
    patch: PatchPlan,
    context: PatchValidationContext,
    result: SandboxExecutionResult
  ): CompileEvent[] {
    const events: CompileEvent[] = [];
    const baseRisk = patch.risk;

    // Generate deterministic event ID
    const eventId = this.generateDeterministicId(patch, context);

    if (result.success) {
      // Success event
      events.push({
        id: `${eventId}-success`,
        type: CompileEventType.Success,
        timestamp: new Date(),
        description: 'Patch applied successfully',
        effects: patch.effects,
        deterministic: true
      });

      // Add risk-based events
      if (baseRisk > 0.6) {
        events.push({
          id: `${eventId}-warning`,
          type: CompileEventType.Warning,
          timestamp: new Date(),
          description: 'High-risk patch may cause side effects',
          effects: { stability: -5, insight: 2, description: 'High-risk patch warning' },
          deterministic: true
        });
      }

      // Add performance impact if applicable
      if (result.memoryUsage > 800 * 1024) {
        events.push({
          id: `${eventId}-performance`,
          type: CompileEventType.PerformanceImpact,
          timestamp: new Date(),
          description: 'Patch has significant memory impact',
          effects: { stability: -2, insight: 1, description: 'Performance impact detected' },
          deterministic: true
        });
      }
    } else {
      // Error event
      events.push({
        id: `${eventId}-error`,
        type: CompileEventType.Error,
        timestamp: new Date(),
        description: result.errors.join('; '),
        effects: { stability: -10, insight: 1, description: 'Patch execution failed' },
        deterministic: true
      });

      // Security violation if applicable
      if (result.errors.some(error => error.includes('security') || error.includes('CRITICAL'))) {
        events.push({
          id: `${eventId}-security`,
          type: CompileEventType.SecurityViolation,
          timestamp: new Date(),
          description: 'Security violation detected in patch',
          effects: { stability: -15, insight: 3, description: 'Security violation penalty' },
          deterministic: true
        });
      }
    }

    return events;
  }

  /**
   * Create deterministic random number generator
   */
  private createDeterministicRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Generate deterministic ID for events
   */
  private generateDeterministicId(patch: PatchPlan, context: PatchValidationContext): string {
    const data = `${patch.diff}-${context.ghost.id}-${context.playerIntent}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Calculate operation risk
   */
  private calculateOperationRisk(operations: any[]): number {
    let risk = 0;
    for (const op of operations) {
      switch (op.type) {
        case 'remove':
          risk += 0.3;
          break;
        case 'modify':
          risk += 0.2;
          break;
        case 'add':
          risk += 0.1;
          break;
        default:
          risk += 0.05;
      }
    }
    return Math.min(1.0, risk);
  }

  /**
   * Sanitize input string
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Clear result cache
   */
  clearCache(): void {
    this.resultCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.resultCache.size,
      hitRate: 0 // Would need to track hits/misses for actual hit rate
    };
  }
}