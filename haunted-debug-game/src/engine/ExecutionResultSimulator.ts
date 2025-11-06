/**
 * ExecutionResultSimulator - Creates realistic compilation output and performance simulation
 * without actual code execution for consistent gameplay experience
 */

import type { PatchPlan } from '@/types/patch';
import type { Ghost } from '@/types/content';
import { SoftwareSmell } from '@/types/ghost';

export interface CompilationOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsage: number;
  warnings: CompilationWarning[];
  errors: CompilationError[];
}

export interface CompilationWarning {
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'info' | 'warning';
}

export interface CompilationError {
  line: number;
  column: number;
  message: string;
  code: string;
  severity: 'error' | 'fatal';
}

export interface PerformanceImpact {
  cpuUsage: number; // 0.0 to 1.0
  memoryUsage: number; // bytes
  executionTime: number; // milliseconds
  networkCalls: number;
  diskOperations: number;
  cacheHitRate: number; // 0.0 to 1.0
  bottlenecks: PerformanceBottleneck[];
}

export interface PerformanceBottleneck {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'cache';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  impact: number; // 0.0 to 1.0
  suggestion: string;
}

export interface CodeQualityMetrics {
  overallScore: number; // 0.0 to 1.0
  maintainability: number;
  readability: number;
  testability: number;
  security: number;
  performance: number;
  complexity: CodeComplexityMetrics;
  issues: CodeQualityIssue[];
}

export interface CodeComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  functionCount: number;
  nestingDepth: number;
  duplicateLines: number;
}

export interface CodeQualityIssue {
  type: 'bug' | 'vulnerability' | 'code_smell' | 'maintainability' | 'reliability';
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  message: string;
  line: number;
  rule: string;
  effort: string; // e.g., "5min", "1h", "1d"
}

export interface ExecutionSimulationContext {
  ghost: Ghost;
  patch: PatchPlan;
  playerSkillLevel: number;
  roomComplexity: number;
  systemLoad: number; // 0.0 to 1.0
}

/**
 * Simulates realistic compilation and execution results without running actual code
 */
export class ExecutionResultSimulator {
  private readonly compilerTemplates: Record<string, CompilerTemplate>;
  private readonly performanceProfiles: Record<SoftwareSmell, PerformanceProfile>;
  private readonly qualityRules: CodeQualityRule[];

  constructor() {
    this.compilerTemplates = this.initializeCompilerTemplates();
    this.performanceProfiles = this.initializePerformanceProfiles();
    this.qualityRules = this.initializeQualityRules();
  }

  /**
   * Generate realistic compilation output without actual execution
   */
  async generateCompilationOutput(context: ExecutionSimulationContext): Promise<CompilationOutput> {
    const { patch, ghost } = context;
    
    // Analyze patch characteristics
    const patchAnalysis = this.analyzePatchCharacteristics(patch);
    
    // Determine compilation success based on patch risk and complexity
    const willCompile = this.determineCompilationSuccess(patch, patchAnalysis);
    
    // Generate appropriate compiler template
    const template = this.selectCompilerTemplate(ghost.softwareSmell, willCompile);
    
    // Generate warnings and errors
    const warnings = this.generateCompilationWarnings(patch, patchAnalysis, ghost);
    const errors = willCompile ? [] : this.generateCompilationErrors(patch, patchAnalysis, ghost);
    
    // Simulate execution metrics
    const executionTime = this.simulateExecutionTime(patch, patchAnalysis, context.systemLoad);
    const memoryUsage = this.simulateMemoryUsage(patch, patchAnalysis);
    
    // Generate realistic output text
    const stdout = this.generateStdout(template, patch, warnings, errors, executionTime);
    const stderr = this.generateStderr(template, errors, warnings);
    
    return {
      stdout,
      stderr,
      exitCode: willCompile ? 0 : 1,
      executionTime,
      memoryUsage,
      warnings,
      errors
    };
  }

  /**
   * Simulate performance impact of patch application
   */
  async simulatePerformanceImpact(context: ExecutionSimulationContext): Promise<PerformanceImpact> {
    const { patch, ghost, systemLoad } = context;
    
    // Get performance profile for ghost type
    const profile = this.performanceProfiles[ghost.softwareSmell];
    
    // Analyze patch for performance-affecting patterns
    const patchAnalysis = this.analyzePatchCharacteristics(patch);
    
    // Calculate base performance metrics
    const cpuUsage = this.calculateCpuUsage(patch, profile, systemLoad);
    const memoryUsage = this.calculateMemoryUsage(patch, profile, patchAnalysis);
    const executionTime = this.simulateExecutionTime(patch, patchAnalysis, systemLoad);
    
    // Simulate network and I/O operations
    const networkCalls = this.simulateNetworkCalls(patch, patchAnalysis);
    const diskOperations = this.simulateDiskOperations(patch, patchAnalysis);
    const cacheHitRate = this.simulateCacheHitRate(patch, ghost.softwareSmell);
    
    // Identify performance bottlenecks
    const bottlenecks = this.identifyBottlenecks(patch, profile, {
      cpuUsage,
      memoryUsage,
      executionTime,
      networkCalls,
      diskOperations,
      cacheHitRate
    });

    return {
      cpuUsage,
      memoryUsage,
      executionTime,
      networkCalls,
      diskOperations,
      cacheHitRate,
      bottlenecks
    };
  }

  /**
   * Calculate code quality score based on patch characteristics
   */
  async calculateCodeQuality(context: ExecutionSimulationContext): Promise<CodeQualityMetrics> {
    const { patch, ghost } = context;
    
    // Analyze patch complexity
    const complexity = this.calculateComplexityMetrics(patch);
    
    // Apply quality rules
    const issues = this.applyQualityRules(patch, complexity, ghost);
    
    // Calculate individual quality scores
    const maintainability = this.calculateMaintainabilityScore(patch, complexity, issues);
    const readability = this.calculateReadabilityScore(patch, complexity);
    const testability = this.calculateTestabilityScore(patch, complexity);
    const security = this.calculateSecurityScore(patch, issues);
    const performance = this.calculatePerformanceScore(patch, complexity);
    
    // Calculate overall score
    const overallScore = (maintainability + readability + testability + security + performance) / 5;

    return {
      overallScore,
      maintainability,
      readability,
      testability,
      security,
      performance,
      complexity,
      issues
    };
  }

  /**
   * Analyze patch characteristics for simulation
   */
  private analyzePatchCharacteristics(patch: PatchPlan): PatchCharacteristics {
    const diffLines = patch.diff.split('\n');
    const addedLines = diffLines.filter(line => line.startsWith('+')).length;
    const removedLines = diffLines.filter(line => line.startsWith('-')).length;
    const modifiedLines = addedLines + removedLines;
    
    // Detect patterns in the patch
    const patterns = this.detectPatchPatterns(patch.diff);
    
    // Calculate complexity indicators
    const cyclomaticComplexity = this.estimateCyclomaticComplexity(patch.diff);
    const nestingDepth = this.estimateNestingDepth(patch.diff);
    
    return {
      addedLines,
      removedLines,
      modifiedLines,
      patterns,
      cyclomaticComplexity,
      nestingDepth,
      riskScore: patch.risk
    };
  }

  /**
   * Determine if patch will compile successfully
   */
  private determineCompilationSuccess(patch: PatchPlan, analysis: PatchCharacteristics): boolean {
    // Base success rate inversely related to risk
    let successRate = 1.0 - (patch.risk * 0.8);
    
    // Adjust for complexity
    successRate -= (analysis.cyclomaticComplexity / 20) * 0.1;
    successRate -= (analysis.nestingDepth / 10) * 0.1;
    
    // Adjust for dangerous patterns
    if (analysis.patterns.includes('eval') || analysis.patterns.includes('unsafe_cast')) {
      successRate -= 0.3;
    }
    
    // Ensure minimum success rate
    successRate = Math.max(0.1, Math.min(0.95, successRate));
    
    // Use deterministic "random" based on patch content
    const seed = this.generateSeed(patch.diff);
    const random = this.deterministicRandom(seed);
    
    return random < successRate;
  }

  /**
   * Generate compilation warnings based on patch analysis
   */
  private generateCompilationWarnings(
    patch: PatchPlan, 
    analysis: PatchCharacteristics, 
    ghost: Ghost
  ): CompilationWarning[] {
    const warnings: CompilationWarning[] = [];
    
    // Risk-based warnings
    if (patch.risk > 0.6) {
      warnings.push({
        line: Math.floor(analysis.modifiedLines / 2) + 1,
        column: 1,
        message: 'Potential null pointer dereference',
        code: 'W001',
        severity: 'warning'
      });
    }
    
    if (patch.risk > 0.4) {
      warnings.push({
        line: analysis.addedLines + 1,
        column: 5,
        message: 'Unused variable detected',
        code: 'W002',
        severity: 'warning'
      });
    }
    
    // Pattern-based warnings
    if (analysis.patterns.includes('loop')) {
      warnings.push({
        line: 3,
        column: 8,
        message: 'Loop complexity exceeds recommended threshold',
        code: 'W003',
        severity: 'warning'
      });
    }
    
    if (analysis.patterns.includes('recursion')) {
      warnings.push({
        line: 5,
        column: 1,
        message: 'Recursive function without explicit base case',
        code: 'W004',
        severity: 'warning'
      });
    }
    
    // Ghost-specific warnings
    switch (ghost.softwareSmell) {
      case SoftwareSmell.CircularDependency:
        warnings.push({
          line: 2,
          column: 10,
          message: 'Potential circular dependency detected',
          code: 'W101',
          severity: 'warning'
        });
        break;
        
      case SoftwareSmell.MemoryLeak:
        warnings.push({
          line: 4,
          column: 15,
          message: 'Resource not properly released',
          code: 'W102',
          severity: 'warning'
        });
        break;
        
      case SoftwareSmell.UnboundedRecursion:
        warnings.push({
          line: 1,
          column: 1,
          message: 'Stack overflow risk in recursive function',
          code: 'W103',
          severity: 'warning'
        });
        break;
    }
    
    return warnings;
  }

  /**
   * Generate compilation errors for failed patches
   */
  private generateCompilationErrors(
    patch: PatchPlan, 
    analysis: PatchCharacteristics, 
    ghost: Ghost
  ): CompilationError[] {
    const errors: CompilationError[] = [];
    
    // High-risk patches get syntax errors
    if (patch.risk > 0.8) {
      errors.push({
        line: 2,
        column: 15,
        message: 'Syntax error: unexpected token',
        code: 'E001',
        severity: 'error'
      });
      
      errors.push({
        line: 4,
        column: 8,
        message: 'Type mismatch: cannot convert string to number',
        code: 'E002',
        severity: 'error'
      });
    }
    
    // Pattern-based errors
    if (analysis.patterns.includes('undefined_variable')) {
      errors.push({
        line: 3,
        column: 12,
        message: 'ReferenceError: undefined variable access',
        code: 'E003',
        severity: 'error'
      });
    }
    
    if (analysis.patterns.includes('type_error')) {
      errors.push({
        line: 5,
        column: 20,
        message: 'TypeError: cannot read property of undefined',
        code: 'E004',
        severity: 'error'
      });
    }
    
    return errors;
  }

  /**
   * Simulate execution time based on patch characteristics
   */
  private simulateExecutionTime(
    patch: PatchPlan, 
    analysis: PatchCharacteristics, 
    systemLoad: number
  ): number {
    // Base time proportional to modified lines
    let baseTime = analysis.modifiedLines * 50; // 50ms per line
    
    // Adjust for complexity
    baseTime += analysis.cyclomaticComplexity * 100;
    baseTime += analysis.nestingDepth * 200;
    
    // Adjust for risk (higher risk = more processing time)
    baseTime *= (1 + patch.risk * 0.5);
    
    // Adjust for system load
    baseTime *= (1 + systemLoad * 0.3);
    
    // Add some realistic variation
    const variation = baseTime * 0.1;
    const seed = this.generateSeed(patch.diff + 'time');
    const random = this.deterministicRandom(seed);
    baseTime += (random - 0.5) * variation;
    
    return Math.max(100, Math.round(baseTime));
  }

  /**
   * Simulate memory usage
   */
  private simulateMemoryUsage(patch: PatchPlan, analysis: PatchCharacteristics): number {
    // Base memory usage
    let memoryUsage = 1024 * 1024; // 1MB base
    
    // Add memory for each line of code
    memoryUsage += analysis.modifiedLines * 1024; // 1KB per line
    
    // Adjust for complexity
    memoryUsage += analysis.cyclomaticComplexity * 10240; // 10KB per complexity point
    
    // Adjust for risk
    memoryUsage *= (1 + patch.risk * 0.5);
    
    return Math.round(memoryUsage);
  }

  /**
   * Calculate CPU usage simulation
   */
  private calculateCpuUsage(
    patch: PatchPlan, 
    profile: PerformanceProfile, 
    systemLoad: number
  ): number {
    let cpuUsage = profile.baseCpuUsage;
    
    // Adjust for patch risk
    cpuUsage += patch.risk * 0.3;
    
    // Adjust for system load
    cpuUsage += systemLoad * 0.2;
    
    return Math.min(1.0, cpuUsage);
  }

  /**
   * Calculate memory usage for performance simulation
   */
  private calculateMemoryUsage(
    patch: PatchPlan, 
    profile: PerformanceProfile, 
    analysis: PatchCharacteristics
  ): number {
    let memoryUsage = profile.baseMemoryUsage;
    
    // Adjust for patch complexity
    memoryUsage += analysis.modifiedLines * 1024;
    memoryUsage += analysis.cyclomaticComplexity * 10240;
    
    // Adjust for risk
    memoryUsage *= (1 + patch.risk * 0.5);
    
    return Math.round(memoryUsage);
  }

  /**
   * Simulate network calls
   */
  private simulateNetworkCalls(patch: PatchPlan, analysis: PatchCharacteristics): number {
    let networkCalls = 0;
    
    // Check for network-related patterns
    if (analysis.patterns.includes('fetch') || analysis.patterns.includes('http')) {
      networkCalls += 2 + Math.floor(patch.risk * 5);
    }
    
    if (analysis.patterns.includes('api_call')) {
      networkCalls += 1 + Math.floor(analysis.modifiedLines / 10);
    }
    
    return networkCalls;
  }

  /**
   * Simulate disk operations
   */
  private simulateDiskOperations(patch: PatchPlan, analysis: PatchCharacteristics): number {
    let diskOps = 0;
    
    // Check for file-related patterns
    if (analysis.patterns.includes('file_io') || analysis.patterns.includes('database')) {
      diskOps += 1 + Math.floor(patch.risk * 3);
    }
    
    if (analysis.patterns.includes('logging')) {
      diskOps += Math.floor(analysis.modifiedLines / 5);
    }
    
    return diskOps;
  }

  /**
   * Simulate cache hit rate
   */
  private simulateCacheHitRate(patch: PatchPlan, ghostType: SoftwareSmell): number {
    let hitRate = 0.8; // Base 80% hit rate
    
    // Adjust based on ghost type
    switch (ghostType) {
      case SoftwareSmell.StaleCache:
        hitRate = 0.3; // Poor cache performance for stale cache issues
        break;
      case SoftwareSmell.MemoryLeak:
        hitRate = 0.6; // Reduced cache efficiency
        break;
      case SoftwareSmell.CircularDependency:
        hitRate = 0.7; // Slightly reduced due to dependency issues
        break;
    }
    
    // Adjust for patch risk
    hitRate -= patch.risk * 0.2;
    
    return Math.max(0.1, Math.min(0.95, hitRate));
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(
    patch: PatchPlan, 
    profile: PerformanceProfile, 
    metrics: any
  ): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    // CPU bottlenecks
    if (metrics.cpuUsage > 0.8) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'major',
        description: 'High CPU usage detected in patch execution',
        impact: metrics.cpuUsage,
        suggestion: 'Consider optimizing algorithmic complexity'
      });
    }
    
    // Memory bottlenecks
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      bottlenecks.push({
        type: 'memory',
        severity: 'moderate',
        description: 'High memory consumption detected',
        impact: Math.min(1.0, metrics.memoryUsage / (200 * 1024 * 1024)),
        suggestion: 'Review memory allocation patterns'
      });
    }
    
    // Cache bottlenecks
    if (metrics.cacheHitRate < 0.5) {
      bottlenecks.push({
        type: 'cache',
        severity: 'moderate',
        description: 'Poor cache hit rate affecting performance',
        impact: 1.0 - metrics.cacheHitRate,
        suggestion: 'Optimize caching strategy and data access patterns'
      });
    }
    
    // Network bottlenecks
    if (metrics.networkCalls > 10) {
      bottlenecks.push({
        type: 'network',
        severity: 'minor',
        description: 'High number of network calls detected',
        impact: Math.min(1.0, metrics.networkCalls / 20),
        suggestion: 'Consider batching network requests'
      });
    }
    
    return bottlenecks;
  }

  /**
   * Calculate complexity metrics from patch
   */
  private calculateComplexityMetrics(patch: PatchPlan): CodeComplexityMetrics {
    const diffLines = patch.diff.split('\n');
    const codeLines = diffLines.filter(line => 
      line.startsWith('+') && 
      line.trim().length > 1 && 
      !line.trim().startsWith('+//')
    );
    
    return {
      cyclomaticComplexity: this.estimateCyclomaticComplexity(patch.diff),
      cognitiveComplexity: this.estimateCognitiveComplexity(patch.diff),
      linesOfCode: codeLines.length,
      functionCount: this.countFunctions(patch.diff),
      nestingDepth: this.estimateNestingDepth(patch.diff),
      duplicateLines: this.countDuplicateLines(codeLines)
    };
  }

  /**
   * Apply quality rules to identify issues
   */
  private applyQualityRules(
    patch: PatchPlan, 
    complexity: CodeComplexityMetrics, 
    ghost: Ghost
  ): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    
    // Apply each quality rule
    for (const rule of this.qualityRules) {
      const ruleIssues = rule.apply(patch, complexity, ghost);
      issues.push(...ruleIssues);
    }
    
    return issues;
  }

  /**
   * Calculate maintainability score
   */
  private calculateMaintainabilityScore(
    patch: PatchPlan, 
    complexity: CodeComplexityMetrics, 
    issues: CodeQualityIssue[]
  ): number {
    let score = 1.0;
    
    // Penalize high complexity
    score -= (complexity.cyclomaticComplexity / 20) * 0.3;
    score -= (complexity.nestingDepth / 10) * 0.2;
    
    // Penalize maintainability issues
    const maintainabilityIssues = issues.filter(i => i.type === 'maintainability');
    score -= maintainabilityIssues.length * 0.1;
    
    // Penalize high risk
    score -= patch.risk * 0.2;
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(patch: PatchPlan, complexity: CodeComplexityMetrics): number {
    let score = 1.0;
    
    // Penalize high nesting
    score -= (complexity.nestingDepth / 8) * 0.4;
    
    // Penalize long functions (estimated)
    if (complexity.linesOfCode > 50) {
      score -= 0.2;
    }
    
    // Check for comments (bonus)
    if (patch.diff.includes('//') || patch.diff.includes('/*')) {
      score += 0.1;
    }
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Calculate testability score
   */
  private calculateTestabilityScore(patch: PatchPlan, complexity: CodeComplexityMetrics): number {
    let score = 1.0;
    
    // Penalize high complexity
    score -= (complexity.cyclomaticComplexity / 15) * 0.4;
    
    // Bonus for test-related code
    if (patch.diff.includes('test') || patch.diff.includes('spec')) {
      score += 0.2;
    }
    
    // Penalize high coupling (estimated by function count)
    if (complexity.functionCount > 5) {
      score -= 0.1;
    }
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(patch: PatchPlan, issues: CodeQualityIssue[]): number {
    let score = 1.0;
    
    // Penalize security issues
    const securityIssues = issues.filter(i => i.type === 'vulnerability');
    for (const issue of securityIssues) {
      switch (issue.severity) {
        case 'blocker':
          score -= 0.5;
          break;
        case 'critical':
          score -= 0.3;
          break;
        case 'major':
          score -= 0.2;
          break;
        case 'minor':
          score -= 0.1;
          break;
      }
    }
    
    // Penalize high risk patches
    score -= patch.risk * 0.3;
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(patch: PatchPlan, complexity: CodeComplexityMetrics): number {
    let score = 1.0;
    
    // Penalize high complexity
    score -= (complexity.cyclomaticComplexity / 25) * 0.3;
    
    // Check for performance-affecting patterns
    if (patch.diff.includes('loop') || patch.diff.includes('while')) {
      score -= 0.1;
    }
    
    if (patch.diff.includes('recursive')) {
      score -= 0.15;
    }
    
    // Penalize duplicate code
    score -= (complexity.duplicateLines / complexity.linesOfCode) * 0.2;
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  // Helper methods for pattern detection and analysis
  private detectPatchPatterns(diff: string): string[] {
    const patterns: string[] = [];
    
    if (diff.includes('for') || diff.includes('while') || diff.includes('forEach')) {
      patterns.push('loop');
    }
    
    if (diff.includes('function') && diff.includes('return')) {
      patterns.push('recursion');
    }
    
    if (diff.includes('fetch') || diff.includes('XMLHttpRequest')) {
      patterns.push('fetch', 'http');
    }
    
    if (diff.includes('eval(') || diff.includes('innerHTML')) {
      patterns.push('eval', 'unsafe_cast');
    }
    
    if (diff.includes('undefined') || diff.includes('null')) {
      patterns.push('undefined_variable');
    }
    
    if (diff.includes('TypeError') || diff.includes('ReferenceError')) {
      patterns.push('type_error');
    }
    
    if (diff.includes('fs.') || diff.includes('readFile') || diff.includes('writeFile')) {
      patterns.push('file_io');
    }
    
    if (diff.includes('console.log') || diff.includes('logger')) {
      patterns.push('logging');
    }
    
    if (diff.includes('SELECT') || diff.includes('INSERT') || diff.includes('UPDATE')) {
      patterns.push('database');
    }
    
    if (diff.includes('api') || diff.includes('endpoint')) {
      patterns.push('api_call');
    }
    
    return patterns;
  }

  private estimateCyclomaticComplexity(diff: string): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\?\s*:/g, // Ternary operator
      /&&/g,
      /\|\|/g
    ];
    
    for (const pattern of decisionPatterns) {
      const matches = diff.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return Math.min(20, complexity); // Cap at 20
  }

  private estimateCognitiveComplexity(diff: string): number {
    let complexity = 0;
    let nestingLevel = 0;
    
    const lines = diff.split('\n');
    
    for (const line of lines) {
      // Track nesting level
      if (line.includes('{')) nestingLevel++;
      if (line.includes('}')) nestingLevel = Math.max(0, nestingLevel - 1);
      
      // Add complexity for control structures
      if (line.includes('if') || line.includes('while') || line.includes('for')) {
        complexity += 1 + nestingLevel;
      }
      
      if (line.includes('switch') || line.includes('case')) {
        complexity += 1;
      }
      
      if (line.includes('catch')) {
        complexity += 1 + nestingLevel;
      }
    }
    
    return Math.min(25, complexity); // Cap at 25
  }

  private estimateNestingDepth(diff: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of diff) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return Math.min(10, maxDepth); // Cap at 10
  }

  private countFunctions(diff: string): number {
    const functionPatterns = [
      /function\s+\w+/g,
      /\w+\s*=\s*function/g,
      /\w+\s*=>\s*/g,
      /async\s+function/g
    ];
    
    let count = 0;
    for (const pattern of functionPatterns) {
      const matches = diff.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    
    return count;
  }

  private countDuplicateLines(codeLines: string[]): number {
    const lineMap = new Map<string, number>();
    
    for (const line of codeLines) {
      const trimmed = line.trim();
      if (trimmed.length > 5) { // Only count substantial lines
        lineMap.set(trimmed, (lineMap.get(trimmed) || 0) + 1);
      }
    }
    
    let duplicates = 0;
    for (const count of lineMap.values()) {
      if (count > 1) {
        duplicates += count - 1;
      }
    }
    
    return duplicates;
  }

  private generateSeed(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private deterministicRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Initialize compiler templates, performance profiles, and quality rules
  private initializeCompilerTemplates(): Record<string, CompilerTemplate> {
    return {
      typescript: {
        successTemplate: 'TypeScript compilation completed successfully\nGenerated 1 file(s)\nNo errors found',
        warningTemplate: 'TypeScript compilation completed with warnings\n{warnings}\nGenerated 1 file(s)',
        errorTemplate: 'TypeScript compilation failed\n{errors}\nCompilation terminated'
      },
      javascript: {
        successTemplate: 'JavaScript validation completed\nNo syntax errors detected',
        warningTemplate: 'JavaScript validation completed with warnings\n{warnings}',
        errorTemplate: 'JavaScript validation failed\n{errors}\nSyntax errors detected'
      }
    };
  }

  private initializePerformanceProfiles(): Record<SoftwareSmell, PerformanceProfile> {
    return {
      [SoftwareSmell.CircularDependency]: {
        baseCpuUsage: 0.3,
        baseMemoryUsage: 2 * 1024 * 1024, // 2MB
        networkMultiplier: 1.2,
        ioMultiplier: 1.0
      },
      [SoftwareSmell.StaleCache]: {
        baseCpuUsage: 0.2,
        baseMemoryUsage: 4 * 1024 * 1024, // 4MB
        networkMultiplier: 2.0,
        ioMultiplier: 1.5
      },
      [SoftwareSmell.UnboundedRecursion]: {
        baseCpuUsage: 0.8,
        baseMemoryUsage: 8 * 1024 * 1024, // 8MB
        networkMultiplier: 1.0,
        ioMultiplier: 1.0
      },
      [SoftwareSmell.PromptInjection]: {
        baseCpuUsage: 0.4,
        baseMemoryUsage: 3 * 1024 * 1024, // 3MB
        networkMultiplier: 1.5,
        ioMultiplier: 1.2
      },
      [SoftwareSmell.DataLeak]: {
        baseCpuUsage: 0.3,
        baseMemoryUsage: 2 * 1024 * 1024, // 2MB
        networkMultiplier: 1.8,
        ioMultiplier: 2.0
      },
      [SoftwareSmell.MemoryLeak]: {
        baseCpuUsage: 0.5,
        baseMemoryUsage: 10 * 1024 * 1024, // 10MB
        networkMultiplier: 1.0,
        ioMultiplier: 1.3
      },
      [SoftwareSmell.DeadCode]: {
        baseCpuUsage: 0.1,
        baseMemoryUsage: 1 * 1024 * 1024, // 1MB
        networkMultiplier: 1.0,
        ioMultiplier: 0.8
      },
      [SoftwareSmell.RaceCondition]: {
        baseCpuUsage: 0.6,
        baseMemoryUsage: 3 * 1024 * 1024, // 3MB
        networkMultiplier: 1.3,
        ioMultiplier: 1.4
      }
    };
  }

  private initializeQualityRules(): CodeQualityRule[] {
    return [
      new ComplexityRule(),
      new SecurityRule(),
      new MaintainabilityRule(),
      new PerformanceRule(),
      new ReliabilityRule()
    ];
  }

  private selectCompilerTemplate(ghostType: SoftwareSmell, willCompile: boolean): CompilerTemplate {
    // For now, use TypeScript template as default
    return this.compilerTemplates.typescript;
  }

  private generateStdout(
    template: CompilerTemplate, 
    patch: PatchPlan, 
    warnings: CompilationWarning[], 
    errors: CompilationError[], 
    executionTime: number
  ): string {
    let output = '';
    
    if (errors.length > 0) {
      output = template.errorTemplate.replace('{errors}', 
        errors.map(e => `Error ${e.code}: ${e.message} (line ${e.line})`).join('\n')
      );
    } else if (warnings.length > 0) {
      output = template.warningTemplate.replace('{warnings}', 
        warnings.map(w => `Warning ${w.code}: ${w.message} (line ${w.line})`).join('\n')
      );
    } else {
      output = template.successTemplate;
    }
    
    output += `\n\nExecution completed in ${executionTime}ms`;
    return output;
  }

  private generateStderr(
    template: CompilerTemplate, 
    errors: CompilationError[], 
    warnings: CompilationWarning[]
  ): string {
    if (errors.length === 0 && warnings.length === 0) {
      return '';
    }
    
    let stderr = '';
    
    for (const error of errors) {
      stderr += `${error.severity.toUpperCase()}: ${error.message} at line ${error.line}:${error.column}\n`;
    }
    
    for (const warning of warnings) {
      stderr += `${warning.severity.toUpperCase()}: ${warning.message} at line ${warning.line}:${warning.column}\n`;
    }
    
    return stderr.trim();
  }
}

// Supporting interfaces and classes
interface PatchCharacteristics {
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  patterns: string[];
  cyclomaticComplexity: number;
  nestingDepth: number;
  riskScore: number;
}

interface CompilerTemplate {
  successTemplate: string;
  warningTemplate: string;
  errorTemplate: string;
}

interface PerformanceProfile {
  baseCpuUsage: number;
  baseMemoryUsage: number;
  networkMultiplier: number;
  ioMultiplier: number;
}

abstract class CodeQualityRule {
  abstract apply(
    patch: PatchPlan, 
    complexity: CodeComplexityMetrics, 
    ghost: Ghost
  ): CodeQualityIssue[];
}

class ComplexityRule extends CodeQualityRule {
  apply(patch: PatchPlan, complexity: CodeComplexityMetrics, ghost: Ghost): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    
    if (complexity.cyclomaticComplexity > 10) {
      issues.push({
        type: 'maintainability',
        severity: 'major',
        message: `Cyclomatic complexity is ${complexity.cyclomaticComplexity}, should be <= 10`,
        line: 1,
        rule: 'complexity',
        effort: '30min'
      });
    }
    
    if (complexity.nestingDepth > 4) {
      issues.push({
        type: 'maintainability',
        severity: 'minor',
        message: `Nesting depth is ${complexity.nestingDepth}, should be <= 4`,
        line: 1,
        rule: 'nesting-depth',
        effort: '15min'
      });
    }
    
    return issues;
  }
}

class SecurityRule extends CodeQualityRule {
  apply(patch: PatchPlan, complexity: CodeComplexityMetrics, ghost: Ghost): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    
    if (patch.diff.includes('eval(')) {
      issues.push({
        type: 'vulnerability',
        severity: 'blocker',
        message: 'Use of eval() creates security vulnerability',
        line: 1,
        rule: 'no-eval',
        effort: '1h'
      });
    }
    
    if (patch.diff.includes('innerHTML')) {
      issues.push({
        type: 'vulnerability',
        severity: 'major',
        message: 'Use of innerHTML may lead to XSS vulnerability',
        line: 1,
        rule: 'no-inner-html',
        effort: '30min'
      });
    }
    
    return issues;
  }
}

class MaintainabilityRule extends CodeQualityRule {
  apply(patch: PatchPlan, complexity: CodeComplexityMetrics, ghost: Ghost): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    
    if (complexity.duplicateLines > 3) {
      issues.push({
        type: 'maintainability',
        severity: 'minor',
        message: `${complexity.duplicateLines} duplicate lines detected`,
        line: 1,
        rule: 'no-duplicate-code',
        effort: '20min'
      });
    }
    
    if (complexity.linesOfCode > 50) {
      issues.push({
        type: 'maintainability',
        severity: 'minor',
        message: 'Function is too long, consider breaking it down',
        line: 1,
        rule: 'max-function-length',
        effort: '45min'
      });
    }
    
    return issues;
  }
}

class PerformanceRule extends CodeQualityRule {
  apply(patch: PatchPlan, complexity: CodeComplexityMetrics, ghost: Ghost): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    
    if (patch.diff.includes('for') && patch.diff.includes('for')) {
      issues.push({
        type: 'code_smell',
        severity: 'minor',
        message: 'Nested loops detected, consider optimization',
        line: 1,
        rule: 'no-nested-loops',
        effort: '1h'
      });
    }
    
    return issues;
  }
}

class ReliabilityRule extends CodeQualityRule {
  apply(patch: PatchPlan, complexity: CodeComplexityMetrics, ghost: Ghost): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];
    
    if (patch.diff.includes('null') && !patch.diff.includes('null check')) {
      issues.push({
        type: 'bug',
        severity: 'major',
        message: 'Potential null pointer dereference',
        line: 1,
        rule: 'null-check',
        effort: '15min'
      });
    }
    
    return issues;
  }
}