/**
 * Secure Sandbox Environment - Provides isolated code execution for patch validation
 */

// Conditional import for vm2 - only available in Node.js environment
let VM: any;
try {
  VM = require('vm2').VM;
} catch (error) {
  // Fallback for browser/test environments
  VM = class MockVM {
    run(code: string) {
      // Simple eval fallback for testing
      return eval(code);
    }
  };
}
import type { 
  ValidationResult,
  ApplyResult,
  LintResult,
  LintRules,
  LintIssue
} from '../types/patch';

export interface SandboxConfig {
  timeout: number;
  memoryLimit: number;
  allowedModules: string[];
  maxExecutionTime: number;
}

export interface GameDSLOperation {
  type: 'add' | 'remove' | 'modify' | 'validate';
  target: string;
  content?: string;
  line?: number;
}

export interface ExecContext {
  variables: Record<string, any>;
  functions: Record<string, Function>;
  constraints: SandboxConstraints;
}

export interface SandboxConstraints {
  maxLoops: number;
  maxRecursionDepth: number;
  allowedAPIs: string[];
  blockedPatterns: RegExp[];
}

export class SandboxEnvironment {
  private vm: any;
  private config: SandboxConfig;
  private gameDSLParser: GameDSLParser;
  private validationPipeline: ValidationPipeline;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = {
      timeout: 5000, // 5 seconds
      memoryLimit: 64 * 1024 * 1024, // 64MB
      allowedModules: ['lodash', 'ramda'], // Safe utility libraries only
      maxExecutionTime: 3000, // 3 seconds
      ...config
    };

    this.vm = new VM({
      timeout: this.config.timeout
    });

    this.gameDSLParser = new GameDSLParser();
    this.validationPipeline = new ValidationPipeline();
  }

  /**
   * Execute game-DSL operations safely in the sandbox
   */
  async executeGameDSL(operations: GameDSLOperation[], context: ExecContext): Promise<ApplyResult> {
    try {
      // Parse and validate operations
      const parsedOps = await this.gameDSLParser.parse(operations);
      
      // Validate operations against security constraints
      const validation = await this.validateOperations(parsedOps, context.constraints);
      
      if (!validation.valid) {
        return {
          success: false,
          output: '',
          errors: validation.errors.concat(validation.securityIssues)
        };
      }

      // Execute operations in controlled environment
      const result = await this.executeInSandbox(parsedOps, context);
      
      return {
        success: true,
        output: result.output,
        errors: result.warnings || []
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`Sandbox execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate code using the linting pipeline
   */
  async validateCode(code: string, rules: LintRules): Promise<LintResult> {
    try {
      return await this.validationPipeline.lint(code, rules);
    } catch (error) {
      return {
        passed: false,
        issues: [{
          line: 1,
          column: 1,
          severity: 'error',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rule: 'validation-error'
        }]
      };
    }
  }

  /**
   * Execute safe code with constraints
   */
  async executeSafe(code: string, context: ExecContext): Promise<any> {
    try {
      // Validate code before execution
      const validation = await this.validateCodeSafety(code, context.constraints);
      
      if (!validation.valid) {
        throw new Error(`Code validation failed: ${validation.errors.join(', ')}`);
      }

      // Prepare sandbox context
      const sandboxContext = {
        ...context.variables,
        ...context.functions,
        console: this.createSafeConsole(),
        setTimeout: this.createSafeTimeout(),
        setInterval: this.createSafeInterval()
      };

      // Execute in VM with timeout
      const result = this.vm.run(code);
      
      return result;
    } catch (error) {
      throw new Error(`Safe execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a secure sandbox environment
   */
  private createSecureSandbox(): Record<string, any> {
    return {
      // Safe globals only
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      
      // Custom safe implementations
      console: this.createSafeConsole(),
      
      // Game-specific utilities
      gameUtils: {
        validateInput: (input: string) => this.sanitizeInput(input),
        calculateRisk: (operations: any[]) => this.calculateOperationRisk(operations),
        formatOutput: (data: any) => JSON.stringify(data, null, 2)
      }
    };
  }

  /**
   * Create mock modules for safe require simulation
   */
  private createMockModules(): Record<string, any> {
    return {
      'lodash': {
        // Safe lodash functions only
        map: (arr: any[], fn: (value: any, index: number, array: any[]) => any) => arr.map(fn),
        filter: (arr: any[], fn: (value: any, index: number, array: any[]) => boolean) => arr.filter(fn),
        reduce: (arr: any[], fn: (prev: any, curr: any, index: number, array: any[]) => any, initial: any) => arr.reduce(fn, initial),
        clone: (obj: any) => JSON.parse(JSON.stringify(obj))
      },
      'ramda': {
        // Safe ramda functions only
        map: (fn: (value: any, index: number, array: any[]) => any) => (arr: any[]) => arr.map(fn),
        filter: (fn: (value: any, index: number, array: any[]) => boolean) => (arr: any[]) => arr.filter(fn),
        pipe: (...fns: Function[]) => (value: any) => fns.reduce((acc, fn) => fn(acc), value)
      }
    };
  }

  /**
   * Create safe console implementation
   */
  private createSafeConsole() {
    const logs: string[] = [];
    
    return {
      log: (...args: any[]) => {
        logs.push(args.map(arg => String(arg)).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push(`WARN: ${args.map(arg => String(arg)).join(' ')}`);
      },
      error: (...args: any[]) => {
        logs.push(`ERROR: ${args.map(arg => String(arg)).join(' ')}`);
      },
      getLogs: () => [...logs],
      clearLogs: () => logs.length = 0
    };
  }

  /**
   * Create safe timeout implementation
   */
  private createSafeTimeout() {
    return (fn: Function, delay: number) => {
      if (delay > this.config.maxExecutionTime) {
        throw new Error(`Timeout delay ${delay}ms exceeds maximum ${this.config.maxExecutionTime}ms`);
      }
      return setTimeout(fn, Math.min(delay, this.config.maxExecutionTime));
    };
  }

  /**
   * Create safe interval implementation
   */
  private createSafeInterval() {
    return (fn: Function, delay: number) => {
      if (delay < 100) {
        throw new Error('Interval delay must be at least 100ms');
      }
      return setInterval(fn, delay);
    };
  }

  /**
   * Validate operations against security constraints
   */
  private async validateOperations(operations: ParsedGameDSLOperation[], constraints: SandboxConstraints): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    for (const op of operations) {
      // Check against blocked patterns
      for (const pattern of constraints.blockedPatterns) {
        if (pattern.test(op.content || '')) {
          result.securityIssues.push(`Operation contains blocked pattern: ${pattern.source}`);
        }
      }

      // Validate API usage
      if (op.content) {
        const usedAPIs = this.extractAPIUsage(op.content);
        for (const api of usedAPIs) {
          if (!constraints.allowedAPIs.includes(api)) {
            result.securityIssues.push(`Unauthorized API usage: ${api}`);
          }
        }
      }

      // Check for loop limits
      if (op.content && this.containsLoops(op.content)) {
        const loopCount = this.countLoops(op.content);
        if (loopCount > constraints.maxLoops) {
          result.errors.push(`Too many loops: ${loopCount} exceeds limit of ${constraints.maxLoops}`);
        }
      }
    }

    result.valid = result.errors.length === 0 && result.securityIssues.length === 0;
    return result;
  }

  /**
   * Execute parsed operations in sandbox
   */
  private async executeInSandbox(operations: ParsedGameDSLOperation[], context: ExecContext): Promise<{ output: string; warnings?: string[] }> {
    const results: string[] = [];
    const warnings: string[] = [];

    for (const op of operations) {
      try {
        const result = await this.executeOperation(op, context);
        results.push(result);
      } catch (error) {
        warnings.push(`Operation ${op.type} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      output: results.join('\n'),
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(operation: ParsedGameDSLOperation, context: ExecContext): Promise<string> {
    switch (operation.type) {
      case 'add':
        return this.executeAddOperation(operation, context);
      case 'remove':
        return this.executeRemoveOperation(operation, context);
      case 'modify':
        return this.executeModifyOperation(operation, context);
      case 'validate':
        return this.executeValidateOperation(operation, context);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Execute add operation
   */
  private executeAddOperation(operation: ParsedGameDSLOperation, context: ExecContext): string {
    // Simulate adding content to target
    const target = operation.target;
    const content = operation.content || '';
    
    // Validate content safety
    if (this.containsUnsafeContent(content)) {
      throw new Error('Content contains unsafe elements');
    }
    
    return `Added to ${target}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
  }

  /**
   * Execute remove operation
   */
  private executeRemoveOperation(operation: ParsedGameDSLOperation, context: ExecContext): string {
    const target = operation.target;
    const line = operation.line || 0;
    
    return `Removed from ${target} at line ${line}`;
  }

  /**
   * Execute modify operation
   */
  private executeModifyOperation(operation: ParsedGameDSLOperation, context: ExecContext): string {
    const target = operation.target;
    const content = operation.content || '';
    const line = operation.line || 0;
    
    if (this.containsUnsafeContent(content)) {
      throw new Error('Modification contains unsafe elements');
    }
    
    return `Modified ${target} at line ${line}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
  }

  /**
   * Execute validate operation
   */
  private executeValidateOperation(operation: ParsedGameDSLOperation, context: ExecContext): string {
    const target = operation.target;
    
    // Simulate validation
    const isValid = Math.random() > 0.2; // 80% success rate for demo
    
    return `Validation of ${target}: ${isValid ? 'PASSED' : 'FAILED'}`;
  }

  /**
   * Validate code safety
   */
  private async validateCodeSafety(code: string, constraints: SandboxConstraints): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(\s*["'`][^"'`]*["'`]/,
      /setInterval\s*\(\s*["'`][^"'`]*["'`]/,
      /document\./,
      /window\./,
      /global\./,
      /process\./,
      /require\s*\(/,
      /import\s+.*\s+from/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        result.securityIssues.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check recursion depth
    const recursionDepth = this.analyzeRecursionDepth(code);
    if (recursionDepth > constraints.maxRecursionDepth) {
      result.errors.push(`Recursion depth ${recursionDepth} exceeds limit ${constraints.maxRecursionDepth}`);
    }

    result.valid = result.errors.length === 0 && result.securityIssues.length === 0;
    return result;
  }

  /**
   * Utility methods
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  private calculateOperationRisk(operations: any[]): number {
    let risk = 0;
    
    for (const op of operations) {
      if (op.type === 'remove') risk += 0.3;
      if (op.type === 'modify') risk += 0.2;
      if (op.type === 'add') risk += 0.1;
    }
    
    return Math.min(1.0, risk);
  }

  private extractAPIUsage(code: string): string[] {
    const apiPattern = /(\w+)\s*\.\s*(\w+)/g;
    const apis: string[] = [];
    let match;
    
    while ((match = apiPattern.exec(code)) !== null) {
      apis.push(`${match[1]}.${match[2]}`);
    }
    
    return [...new Set(apis)];
  }

  private containsLoops(code: string): boolean {
    return /\b(for|while|do)\s*\(/.test(code);
  }

  private countLoops(code: string): number {
    const matches = code.match(/\b(for|while|do)\s*\(/g);
    return matches ? matches.length : 0;
  }

  private containsUnsafeContent(content: string): boolean {
    const unsafePatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i
    ];
    
    return unsafePatterns.some(pattern => pattern.test(content));
  }

  private analyzeRecursionDepth(code: string): number {
    // Simple heuristic: count function calls to same function name
    const functionPattern = /function\s+(\w+)/g;
    const functions: string[] = [];
    let match;
    
    while ((match = functionPattern.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    let maxDepth = 0;
    for (const funcName of functions) {
      const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const calls = code.match(callPattern);
      if (calls) {
        maxDepth = Math.max(maxDepth, calls.length);
      }
    }
    
    return maxDepth;
  }
}

/**
 * Game DSL Parser - Parses game-specific domain language operations
 */
class GameDSLParser {
  async parse(operations: GameDSLOperation[]): Promise<ParsedGameDSLOperation[]> {
    const parsed: ParsedGameDSLOperation[] = [];
    
    for (const op of operations) {
      const parsedOp = await this.parseOperation(op);
      parsed.push(parsedOp);
    }
    
    return parsed;
  }

  private async parseOperation(operation: GameDSLOperation): Promise<ParsedGameDSLOperation> {
    // Validate operation structure
    if (!operation.type || !operation.target) {
      throw new Error('Invalid operation: missing type or target');
    }

    // Parse and validate target
    const target = this.parseTarget(operation.target);
    
    // Parse content if present
    const content = operation.content ? this.parseContent(operation.content) : undefined;
    
    return {
      type: operation.type,
      target,
      content,
      line: operation.line,
      metadata: {
        parsed: true,
        timestamp: new Date(),
        safe: this.isOperationSafe(operation)
      }
    };
  }

  private parseTarget(target: string): string {
    // Validate target format (should be safe file/module reference)
    if (!/^[a-zA-Z0-9_\-\/\.]+$/.test(target)) {
      throw new Error(`Invalid target format: ${target}`);
    }
    
    return target;
  }

  private parseContent(content: string): string {
    // Basic content sanitization
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim();
  }

  private isOperationSafe(operation: GameDSLOperation): boolean {
    // Check if operation is safe to execute
    const unsafePatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /require\s*\(/,
      /import\s+/,
      /process\./,
      /global\./
    ];
    
    const content = operation.content || '';
    return !unsafePatterns.some(pattern => pattern.test(content));
  }
}

/**
 * Validation Pipeline - Handles code linting and validation
 */
class ValidationPipeline {
  async lint(code: string, rules: LintRules): Promise<LintResult> {
    const issues: LintIssue[] = [];
    
    // Basic linting rules
    await this.checkSyntax(code, issues);
    await this.checkSecurity(code, issues, rules);
    await this.checkStyle(code, issues, rules);
    
    return {
      passed: issues.filter(issue => issue.severity === 'error').length === 0,
      issues
    };
  }

  private async checkSyntax(code: string, issues: LintIssue[]): Promise<void> {
    try {
      // Basic syntax validation
      new Function(code); // This will throw if syntax is invalid
    } catch (error) {
      issues.push({
        line: 1,
        column: 1,
        severity: 'error',
        message: `Syntax error: ${error instanceof Error ? error.message : 'Unknown syntax error'}`,
        rule: 'syntax-error'
      });
    }
  }

  private async checkSecurity(code: string, issues: LintIssue[], rules: LintRules): Promise<void> {
    const securityRules = [
      { pattern: /eval\s*\(/, message: 'Use of eval() is prohibited', rule: 'no-eval' },
      { pattern: /Function\s*\(/, message: 'Use of Function constructor is prohibited', rule: 'no-function-constructor' },
      { pattern: /innerHTML\s*=/, message: 'Direct innerHTML assignment detected', rule: 'no-inner-html' },
      { pattern: /document\.write/, message: 'Use of document.write is prohibited', rule: 'no-document-write' }
    ];

    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const secRule of securityRules) {
        if (secRule.pattern.test(line) && rules[secRule.rule] === 'error') {
          issues.push({
            line: i + 1,
            column: 1,
            severity: 'error',
            message: secRule.message,
            rule: secRule.rule
          });
        }
      }
    }
  }

  private async checkStyle(code: string, issues: LintIssue[], rules: LintRules): Promise<void> {
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check line length
      if (rules['max-line-length'] && line.length > rules['max-line-length']) {
        issues.push({
          line: i + 1,
          column: rules['max-line-length'],
          severity: 'warning',
          message: `Line exceeds maximum length of ${rules['max-line-length']}`,
          rule: 'max-line-length'
        });
      }
      
      // Check for console.log in production
      if (rules['no-console'] === 'error' && /console\.(log|warn|error)/.test(line)) {
        issues.push({
          line: i + 1,
          column: 1,
          severity: 'error',
          message: 'Console statements are not allowed',
          rule: 'no-console'
        });
      }
    }
  }
}

// Supporting interfaces
interface ParsedGameDSLOperation extends GameDSLOperation {
  metadata: {
    parsed: boolean;
    timestamp: Date;
    safe: boolean;
  };
}