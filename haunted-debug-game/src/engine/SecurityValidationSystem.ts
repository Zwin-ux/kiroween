/**
 * SecurityValidationSystem - Comprehensive security validation for patch operations
 * Provides operation whitelisting, unsafe operation detection, and educational feedback
 */

import type { PatchPlan } from '@/types/patch';
import type { Ghost } from '@/types/content';
import type { GameState } from '@/types/game';

export interface SecurityValidationResult {
  isValid: boolean;
  riskScore: number;
  violations: SecurityViolation[];
  educationalContent: EducationalContent[];
  allowedOperations: string[];
  blockedOperations: string[];
}

export interface SecurityViolation {
  id: string;
  type: SecurityViolationType;
  severity: SecuritySeverity;
  description: string;
  location: string;
  educationalExplanation: string;
  suggestedFix: string;
  learnMoreUrl?: string;
}

export interface EducationalContent {
  title: string;
  explanation: string;
  examples: CodeExample[];
  bestPractices: string[];
  commonMistakes: string[];
  furtherReading: string[];
}

export interface CodeExample {
  title: string;
  unsafe: string;
  safe: string;
  explanation: string;
}

export enum SecurityViolationType {
  CodeInjection = 'code-injection',
  XSS = 'xss',
  PrototypePoison = 'prototype-poison',
  UnsafeEval = 'unsafe-eval',
  DangerousAPI = 'dangerous-api',
  FileSystemAccess = 'filesystem-access',
  NetworkAccess = 'network-access',
  ProcessAccess = 'process-access',
  GlobalAccess = 'global-access',
  UnsafeRegex = 'unsafe-regex',
  BufferOverflow = 'buffer-overflow',
  MemoryLeak = 'memory-leak',
  InfiniteLoop = 'infinite-loop'
}

export enum SecuritySeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export interface ValidationContext {
  ghost: Ghost;
  gameState: GameState;
  playerIntent: string;
  riskTolerance: number;
  educationalMode: boolean;
}

/**
 * Operation Whitelist Manager - Manages allowed operations and patterns
 */
class OperationWhitelistManager {
  private allowedOperations: Set<string>;
  private allowedPatterns: RegExp[];
  private safeAPIs: Set<string>;
  private contextualAllowances: Map<string, string[]>;

  constructor() {
    this.allowedOperations = new Set([
      // Basic operations
      'variable-declaration',
      'function-declaration',
      'conditional-statement',
      'loop-statement',
      'return-statement',
      'assignment',
      
      // Safe method calls
      'array-operation',
      'string-method',
      'math-operation',
      'object-operation',
      'console-operation',
      'console-log',
      
      // Testing operations
      'test-assertion',
      'mock-creation',
      'spy-creation',
      
      // Code quality operations
      'linting',
      'formatting',
      'type-checking',
      'documentation'
    ]);

    this.allowedPatterns = [
      /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*/, // Variable assignment
      /^function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/, // Function declaration
      /^const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/, // Const declaration
      /^let\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/, // Let declaration
      /^if\s*\(/, // If statement
      /^for\s*\(/, // For loop
      /^while\s*\(/, // While loop
      /^return\s+/, // Return statement
      /^console\.log\s*\(/, // Console logging
      /^Math\.[a-zA-Z]+\s*\(/, // Math operations
      /^Array\.(from|isArray|of)\s*\(/, // Safe Array methods
      /^Object\.(keys|values|entries|assign)\s*\(/, // Safe Object methods
      /^JSON\.(parse|stringify)\s*\(/, // JSON operations
      /^String\.(fromCharCode|raw)\s*\(/, // Safe String methods
      /^Number\.(isNaN|isFinite|parseInt|parseFloat)\s*\(/ // Safe Number methods
    ];

    this.safeAPIs = new Set([
      'console.log',
      'console.warn',
      'console.error',
      'Math.abs',
      'Math.max',
      'Math.min',
      'Math.floor',
      'Math.ceil',
      'Math.round',
      'Array.isArray',
      'Array.from',
      'Array.of',
      'Object.keys',
      'Object.values',
      'Object.entries',
      'Object.assign',
      'Object.create',
      'JSON.parse',
      'JSON.stringify',
      'String.fromCharCode',
      'Number.isNaN',
      'Number.isFinite',
      'Number.parseInt',
      'Number.parseFloat'
    ]);

    // Context-specific allowances for different ghost types
    this.contextualAllowances = new Map([
      ['circular-dependency', ['import', 'export', 'require']],
      ['memory-leak', ['addEventListener', 'removeEventListener', 'clearInterval', 'clearTimeout']],
      ['stale-cache', ['localStorage', 'sessionStorage', 'cache']],
      ['unbounded-recursion', ['recursion', 'stack']],
      ['prompt-injection', ['input', 'sanitize', 'validate']],
      ['data-leak', ['encrypt', 'decrypt', 'hash']]
    ]);
  }

  isOperationAllowed(operation: string, context?: ValidationContext): boolean {
    // Check basic allowed operations
    if (this.allowedOperations.has(operation)) {
      return true;
    }

    // Check contextual allowances
    if (context?.ghost.softwareSmell) {
      const contextualOps = this.contextualAllowances.get(context.ghost.softwareSmell);
      if (contextualOps?.includes(operation)) {
        return true;
      }
    }

    return false;
  }

  isPatternAllowed(code: string): boolean {
    return this.allowedPatterns.some(pattern => pattern.test(code.trim()));
  }

  isAPIAllowed(api: string): boolean {
    return this.safeAPIs.has(api);
  }

  getContextualAllowances(ghostType: string): string[] {
    return this.contextualAllowances.get(ghostType) || [];
  }
}

/**
 * Unsafe Operation Detector - Detects dangerous patterns and operations
 */
class UnsafeOperationDetector {
  private dangerousPatterns: Map<RegExp, SecurityViolationType>;
  private criticalPatterns: Map<RegExp, SecurityViolationType>;
  private contextualRisks: Map<string, RegExp[]>;

  constructor() {
    this.dangerousPatterns = new Map([
      // Code injection patterns
      [/eval\s*\(/gi, SecurityViolationType.UnsafeEval],
      [/Function\s*\(/gi, SecurityViolationType.CodeInjection],
      [/new\s+Function\s*\(/gi, SecurityViolationType.CodeInjection],
      [/setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi, SecurityViolationType.CodeInjection],
      [/setInterval\s*\(\s*["'`][^"'`]*["'`]/gi, SecurityViolationType.CodeInjection],
      
      // XSS patterns
      [/innerHTML\s*=/gi, SecurityViolationType.XSS],
      [/outerHTML\s*=/gi, SecurityViolationType.XSS],
      [/document\.write\s*\(/gi, SecurityViolationType.XSS],
      [/document\.writeln\s*\(/gi, SecurityViolationType.XSS],
      
      // Prototype pollution
      [/__proto__\s*=/gi, SecurityViolationType.PrototypePoison],
      [/constructor\.prototype/gi, SecurityViolationType.PrototypePoison],
      [/Object\.prototype/gi, SecurityViolationType.PrototypePoison],
      
      // Dangerous APIs
      [/require\s*\(/gi, SecurityViolationType.DangerousAPI],
      [/import\s*\(/gi, SecurityViolationType.DangerousAPI],
      [/process\./gi, SecurityViolationType.ProcessAccess],
      [/global\./gi, SecurityViolationType.GlobalAccess],
      [/window\./gi, SecurityViolationType.GlobalAccess],
      [/document\./gi, SecurityViolationType.GlobalAccess],
      
      // File system access
      [/fs\./gi, SecurityViolationType.FileSystemAccess],
      [/readFile/gi, SecurityViolationType.FileSystemAccess],
      [/writeFile/gi, SecurityViolationType.FileSystemAccess],
      
      // Network access
      [/fetch\s*\(/gi, SecurityViolationType.NetworkAccess],
      [/XMLHttpRequest/gi, SecurityViolationType.NetworkAccess],
      [/WebSocket/gi, SecurityViolationType.NetworkAccess],
      
      // Unsafe regex patterns
      [/\(\?\=.*\)\+/gi, SecurityViolationType.UnsafeRegex],
      [/\(\?\!.*\)\*/gi, SecurityViolationType.UnsafeRegex],
      
      // Infinite loop patterns
      [/while\s*\(\s*true\s*\)/gi, SecurityViolationType.InfiniteLoop],
      [/for\s*\(\s*;\s*;\s*\)/gi, SecurityViolationType.InfiniteLoop]
    ]);

    this.criticalPatterns = new Map([
      [/eval\s*\(/gi, SecurityViolationType.UnsafeEval],
      [/new\s+Function\s*\(/gi, SecurityViolationType.CodeInjection],
      [/Function\s*\(/gi, SecurityViolationType.CodeInjection],
      [/process\./gi, SecurityViolationType.ProcessAccess],
      [/__proto__\s*=/gi, SecurityViolationType.PrototypePoison]
    ]);

    this.contextualRisks = new Map([
      ['prompt-injection', [
        /input\s*\+/gi,
        /prompt\s*\+/gi,
        /user.*input/gi,
        /\$\{.*\}/gi // Template literal injection
      ]],
      ['data-leak', [
        /console\.log\s*\(.*password/gi,
        /console\.log\s*\(.*token/gi,
        /console\.log\s*\(.*secret/gi,
        /alert\s*\(.*sensitive/gi
      ]],
      ['memory-leak', [
        /addEventListener.*without.*removeEventListener/gi,
        /setInterval.*without.*clearInterval/gi,
        /setTimeout.*without.*clearTimeout/gi,
        /new.*Array\s*\(\s*\d{6,}\s*\)/gi // Large array allocation
      ]]
    ]);
  }

  detectViolations(code: string, context: ValidationContext): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // Check dangerous patterns
    this.dangerousPatterns.forEach((violationType, pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        // Check if this exact pattern is in critical patterns
        let isCritical = false;
        this.criticalPatterns.forEach((criticalType, criticalPattern) => {
          if (criticalPattern.source === pattern.source && criticalType === violationType) {
            isCritical = true;
          }
        });
        
        violations.push(this.createViolation(
          violationType,
          isCritical ? SecuritySeverity.Critical : SecuritySeverity.High,
          pattern,
          matches,
          code,
          context
        ));
      }
    });

    // Check contextual risks
    const ghostType = context.ghost.softwareSmell;
    const contextualPatterns = this.contextualRisks.get(ghostType);
    if (contextualPatterns) {
      for (const pattern of contextualPatterns) {
        const matches = code.match(pattern);
        if (matches) {
          violations.push(this.createContextualViolation(
            ghostType,
            pattern,
            matches,
            code,
            context
          ));
        }
      }
    }

    return violations;
  }

  private createViolation(
    type: SecurityViolationType,
    severity: SecuritySeverity,
    pattern: RegExp,
    matches: RegExpMatchArray,
    code: string,
    context: ValidationContext
  ): SecurityViolation {
    const violationId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: violationId,
      type,
      severity,
      description: this.getViolationDescription(type, matches.length),
      location: this.findViolationLocation(code, matches[0]),
      educationalExplanation: this.getEducationalExplanation(type),
      suggestedFix: this.getSuggestedFix(type),
      learnMoreUrl: this.getLearnMoreUrl(type)
    };
  }

  private createContextualViolation(
    ghostType: string,
    pattern: RegExp,
    matches: RegExpMatchArray,
    code: string,
    context: ValidationContext
  ): SecurityViolation {
    const violationId = `contextual-${ghostType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: violationId,
      type: this.getContextualViolationType(ghostType),
      severity: SecuritySeverity.Medium,
      description: `Contextual security risk for ${ghostType}: ${matches[0]}`,
      location: this.findViolationLocation(code, matches[0]),
      educationalExplanation: this.getContextualEducationalExplanation(ghostType, matches[0]),
      suggestedFix: this.getContextualSuggestedFix(ghostType, matches[0])
    };
  }

  private getViolationDescription(type: SecurityViolationType, count: number): string {
    const descriptions: Record<SecurityViolationType, string> = {
      [SecurityViolationType.CodeInjection]: `Code injection vulnerability detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.UnsafeEval]: `Unsafe eval() usage detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.XSS]: `Cross-site scripting vulnerability detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.PrototypePoison]: `Prototype pollution vulnerability detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.DangerousAPI]: `Dangerous API usage detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.FileSystemAccess]: `File system access detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.NetworkAccess]: `Network access detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.ProcessAccess]: `Process access detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.GlobalAccess]: `Global object access detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.UnsafeRegex]: `Unsafe regular expression detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.BufferOverflow]: `Buffer overflow risk detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.MemoryLeak]: `Memory leak risk detected (${count} instance${count > 1 ? 's' : ''})`,
      [SecurityViolationType.InfiniteLoop]: `Infinite loop risk detected (${count} instance${count > 1 ? 's' : ''})`
    };
    
    return descriptions[type] || `Security violation detected: ${type}`;
  }

  private findViolationLocation(code: string, match: string): string {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return `Line ${i + 1}`;
      }
    }
    return 'Unknown location';
  }

  private getEducationalExplanation(type: SecurityViolationType): string {
    const explanations: Record<SecurityViolationType, string> = {
      [SecurityViolationType.CodeInjection]: 'Code injection occurs when untrusted input is executed as code, allowing attackers to run arbitrary commands.',
      [SecurityViolationType.UnsafeEval]: 'The eval() function executes strings as JavaScript code, which can be exploited if the input contains malicious code.',
      [SecurityViolationType.XSS]: 'Cross-site scripting allows attackers to inject malicious scripts into web pages viewed by other users.',
      [SecurityViolationType.PrototypePoison]: 'Prototype pollution modifies Object.prototype, affecting all objects and potentially leading to security vulnerabilities.',
      [SecurityViolationType.DangerousAPI]: 'Certain APIs can be dangerous when used improperly, potentially exposing sensitive information or system access.',
      [SecurityViolationType.FileSystemAccess]: 'File system access can be dangerous in web environments and should be carefully controlled.',
      [SecurityViolationType.NetworkAccess]: 'Network requests can expose sensitive data or be used for malicious purposes if not properly validated.',
      [SecurityViolationType.ProcessAccess]: 'Process access can allow attackers to execute system commands or access sensitive system information.',
      [SecurityViolationType.GlobalAccess]: 'Accessing global objects can lead to security vulnerabilities and should be avoided in sandboxed environments.',
      [SecurityViolationType.UnsafeRegex]: 'Certain regex patterns can cause catastrophic backtracking, leading to denial of service attacks.',
      [SecurityViolationType.BufferOverflow]: 'Buffer overflows can lead to memory corruption and potential code execution vulnerabilities.',
      [SecurityViolationType.MemoryLeak]: 'Memory leaks can cause performance degradation and potential denial of service.',
      [SecurityViolationType.InfiniteLoop]: 'Infinite loops can cause the application to hang and consume excessive resources.'
    };
    
    return explanations[type] || 'This pattern has been identified as a potential security risk.';
  }

  private getSuggestedFix(type: SecurityViolationType): string {
    const fixes: Record<SecurityViolationType, string> = {
      [SecurityViolationType.CodeInjection]: 'Use safe alternatives like JSON.parse() or parameterized queries instead of dynamic code execution.',
      [SecurityViolationType.UnsafeEval]: 'Replace eval() with JSON.parse() for data parsing or use Function constructors with proper validation.',
      [SecurityViolationType.XSS]: 'Use textContent instead of innerHTML, or sanitize HTML input with a trusted library.',
      [SecurityViolationType.PrototypePoison]: 'Use Object.create(null) for objects or validate property names before assignment.',
      [SecurityViolationType.DangerousAPI]: 'Use safer alternatives or implement proper input validation and access controls.',
      [SecurityViolationType.FileSystemAccess]: 'Remove file system operations or use secure, sandboxed alternatives.',
      [SecurityViolationType.NetworkAccess]: 'Validate URLs, implement CORS policies, and use secure communication protocols.',
      [SecurityViolationType.ProcessAccess]: 'Remove process access or use secure, limited alternatives.',
      [SecurityViolationType.GlobalAccess]: 'Use local variables or pass required values as parameters instead of accessing globals.',
      [SecurityViolationType.UnsafeRegex]: 'Simplify the regex pattern or use string methods for simple matching.',
      [SecurityViolationType.BufferOverflow]: 'Implement proper bounds checking and use safe buffer operations.',
      [SecurityViolationType.MemoryLeak]: 'Ensure proper cleanup of event listeners, timers, and references.',
      [SecurityViolationType.InfiniteLoop]: 'Add proper exit conditions and consider using iterative approaches with limits.'
    };
    
    return fixes[type] || 'Review the code for potential security implications and use safer alternatives.';
  }

  private getLearnMoreUrl(type: SecurityViolationType): string {
    const urls: Record<SecurityViolationType, string> = {
      [SecurityViolationType.CodeInjection]: 'https://owasp.org/www-community/attacks/Code_Injection',
      [SecurityViolationType.UnsafeEval]: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!',
      [SecurityViolationType.XSS]: 'https://owasp.org/www-community/attacks/xss/',
      [SecurityViolationType.PrototypePoison]: 'https://portswigger.net/web-security/prototype-pollution',
      [SecurityViolationType.DangerousAPI]: 'https://owasp.org/www-project-api-security/',
      [SecurityViolationType.FileSystemAccess]: 'https://developer.mozilla.org/en-US/docs/Web/Security',
      [SecurityViolationType.NetworkAccess]: 'https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy',
      [SecurityViolationType.ProcessAccess]: 'https://nodejs.org/en/docs/guides/security/',
      [SecurityViolationType.GlobalAccess]: 'https://developer.mozilla.org/en-US/docs/Web/Security',
      [SecurityViolationType.UnsafeRegex]: 'https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS',
      [SecurityViolationType.BufferOverflow]: 'https://owasp.org/www-community/vulnerabilities/Buffer_Overflow',
      [SecurityViolationType.MemoryLeak]: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management',
      [SecurityViolationType.InfiniteLoop]: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration'
    };
    
    return urls[type];
  }

  private getContextualViolationType(ghostType: string): SecurityViolationType {
    const typeMap: Record<string, SecurityViolationType> = {
      'prompt-injection': SecurityViolationType.CodeInjection,
      'data-leak': SecurityViolationType.XSS,
      'memory-leak': SecurityViolationType.MemoryLeak
    };
    
    return typeMap[ghostType] || SecurityViolationType.DangerousAPI;
  }

  private getContextualEducationalExplanation(ghostType: string, match: string): string {
    const explanations: Record<string, string> = {
      'prompt-injection': `In the context of prompt injection vulnerabilities, the pattern "${match}" could allow attackers to manipulate input processing and inject malicious content.`,
      'data-leak': `In the context of data leak vulnerabilities, the pattern "${match}" could expose sensitive information through logging or output mechanisms.`,
      'memory-leak': `In the context of memory leak vulnerabilities, the pattern "${match}" could create references that are not properly cleaned up, leading to memory accumulation.`
    };
    
    return explanations[ghostType] || `The pattern "${match}" poses a contextual security risk for ${ghostType} scenarios.`;
  }

  private getContextualSuggestedFix(ghostType: string, match: string): string {
    const fixes: Record<string, string> = {
      'prompt-injection': 'Implement proper input sanitization and validation before processing user input.',
      'data-leak': 'Remove or sanitize sensitive data from logging statements and ensure proper data handling.',
      'memory-leak': 'Ensure proper cleanup of event listeners, timers, and object references.'
    };
    
    return fixes[ghostType] || 'Review the code in the context of the specific vulnerability type and implement appropriate safeguards.';
  }
}

/**
 * Educational Content Generator - Generates educational content for security violations
 */
class EducationalContentGenerator {
  generateEducationalContent(violations: SecurityViolation[]): EducationalContent[] {
    const contentMap = new Map<SecurityViolationType, EducationalContent>();
    
    for (const violation of violations) {
      if (!contentMap.has(violation.type)) {
        contentMap.set(violation.type, this.createEducationalContent(violation.type));
      }
    }
    
    return Array.from(contentMap.values());
  }

  private createEducationalContent(type: SecurityViolationType): EducationalContent {
    const contentTemplates: Partial<Record<SecurityViolationType, EducationalContent>> = {
      [SecurityViolationType.UnsafeEval]: {
        title: 'Understanding eval() Security Risks',
        explanation: 'The eval() function executes strings as JavaScript code, which creates serious security vulnerabilities when the input is not trusted. Attackers can inject malicious code that will be executed with the same privileges as your application.',
        examples: [
          {
            title: 'Unsafe eval() usage',
            unsafe: 'const userInput = getUserInput();\neval(userInput); // Dangerous!',
            safe: 'const userInput = getUserInput();\nconst data = JSON.parse(userInput); // Safe parsing',
            explanation: 'Use JSON.parse() for data parsing instead of eval() to prevent code injection.'
          },
          {
            title: 'Dynamic property access',
            unsafe: 'eval(`obj.${propertyName}`);',
            safe: 'obj[propertyName];',
            explanation: 'Use bracket notation for dynamic property access instead of eval().'
          }
        ],
        bestPractices: [
          'Never use eval() with untrusted input',
          'Use JSON.parse() for parsing JSON data',
          'Use bracket notation for dynamic property access',
          'Validate and sanitize all user input',
          'Consider using a safe expression evaluator library if needed'
        ],
        commonMistakes: [
          'Using eval() to parse JSON data',
          'Using eval() for dynamic property access',
          'Trusting user input without validation',
          'Using eval() in template systems'
        ],
        furtherReading: [
          'MDN: eval() - Never use eval()!',
          'OWASP: Code Injection Prevention',
          'JavaScript Security Best Practices'
        ]
      },
      
      [SecurityViolationType.XSS]: {
        title: 'Preventing Cross-Site Scripting (XSS)',
        explanation: 'Cross-site scripting occurs when untrusted data is inserted into web pages without proper validation or escaping. This allows attackers to inject malicious scripts that execute in users\' browsers.',
        examples: [
          {
            title: 'Unsafe HTML insertion',
            unsafe: 'element.innerHTML = userInput; // Vulnerable to XSS',
            safe: 'element.textContent = userInput; // Safe text insertion',
            explanation: 'Use textContent to insert text safely, or sanitize HTML with a trusted library.'
          },
          {
            title: 'Safe HTML templating',
            unsafe: 'html = `<div>${userInput}</div>`; // Dangerous',
            safe: 'html = `<div>${escapeHtml(userInput)}</div>`; // Safe with escaping',
            explanation: 'Always escape user input when inserting into HTML templates.'
          }
        ],
        bestPractices: [
          'Use textContent instead of innerHTML for text',
          'Sanitize HTML input with trusted libraries',
          'Implement Content Security Policy (CSP)',
          'Validate and escape all user input',
          'Use template engines with auto-escaping'
        ],
        commonMistakes: [
          'Using innerHTML with user input',
          'Not escaping data in templates',
          'Trusting client-side validation only',
          'Not implementing CSP headers'
        ],
        furtherReading: [
          'OWASP: Cross-site Scripting Prevention',
          'MDN: Content Security Policy',
          'Web Security Guidelines'
        ]
      },
      
      [SecurityViolationType.CodeInjection]: {
        title: 'Understanding Code Injection Vulnerabilities',
        explanation: 'Code injection occurs when an application executes untrusted input as code. This can happen through various mechanisms like eval(), Function constructor, or template engines, allowing attackers to execute arbitrary code.',
        examples: [
          {
            title: 'Function constructor injection',
            unsafe: 'const fn = new Function(userInput); // Dangerous',
            safe: 'const fn = predefinedFunctions[userInput]; // Safe lookup',
            explanation: 'Use predefined function lookups instead of dynamic function creation.'
          }
        ],
        bestPractices: [
          'Never execute user input as code',
          'Use whitelisting for dynamic operations',
          'Implement proper input validation',
          'Use safe templating engines',
          'Apply principle of least privilege'
        ],
        commonMistakes: [
          'Using Function constructor with user input',
          'Dynamic code generation without validation',
          'Trusting serialized data',
          'Not sanitizing template inputs'
        ],
        furtherReading: [
          'OWASP: Code Injection',
          'Secure Coding Practices',
          'Input Validation Guidelines'
        ]
      },
      
      [SecurityViolationType.PrototypePoison]: {
        title: 'Preventing Prototype Pollution',
        explanation: 'Prototype pollution occurs when an attacker can modify Object.prototype or other built-in prototypes, affecting all objects in the application and potentially leading to security vulnerabilities.',
        examples: [
          {
            title: 'Unsafe prototype modification',
            unsafe: 'obj.__proto__.isAdmin = true; // Dangerous',
            safe: 'obj.isAdmin = true; // Safe property assignment',
            explanation: 'Avoid modifying prototypes directly, especially with user-controlled data.'
          }
        ],
        bestPractices: [
          'Use Object.create(null) for data objects',
          'Validate property names before assignment',
          'Use Map for key-value storage',
          'Freeze important prototypes',
          'Implement proper input validation'
        ],
        commonMistakes: [
          'Allowing __proto__ in user input',
          'Not validating object keys',
          'Using merge functions without protection',
          'Trusting JSON input without validation'
        ],
        furtherReading: [
          'Prototype Pollution Explained',
          'JavaScript Security Patterns',
          'Safe Object Handling'
        ]
      }
    };

    // Return default content for types not explicitly defined
    return contentTemplates[type] || {
      title: `Security Risk: ${type}`,
      explanation: `This security violation type (${type}) has been detected in your code and requires attention.`,
      examples: [],
      bestPractices: ['Review the code for security implications', 'Use safer alternatives', 'Implement proper validation'],
      commonMistakes: ['Not considering security implications', 'Using dangerous patterns'],
      furtherReading: ['Security Best Practices', 'OWASP Guidelines']
    };
  }
}

/**
 * Main Security Validation System
 */
export class SecurityValidationSystem {
  private whitelistManager: OperationWhitelistManager;
  private unsafeDetector: UnsafeOperationDetector;
  private educationalGenerator: EducationalContentGenerator;

  constructor() {
    this.whitelistManager = new OperationWhitelistManager();
    this.unsafeDetector = new UnsafeOperationDetector();
    this.educationalGenerator = new EducationalContentGenerator();
  }

  /**
   * Validate patch for security issues and generate educational content
   */
  async validatePatchSecurity(patch: PatchPlan, context: ValidationContext): Promise<SecurityValidationResult> {
    const violations: SecurityViolation[] = [];
    const allowedOperations: string[] = [];
    const blockedOperations: string[] = [];

    // Extract code from patch diff
    const codeLines = this.extractCodeFromDiff(patch.diff);
    const fullCode = codeLines.join('\n');

    // Detect unsafe operations
    const detectedViolations = this.unsafeDetector.detectViolations(fullCode, context);
    violations.push(...detectedViolations);

    // Check operations against whitelist
    const operations = this.extractOperationsFromCode(fullCode);
    for (const operation of operations) {
      if (this.whitelistManager.isOperationAllowed(operation, context)) {
        allowedOperations.push(operation);
      } else {
        blockedOperations.push(operation);
        violations.push({
          id: `blocked-op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: SecurityViolationType.DangerousAPI,
          severity: SecuritySeverity.Medium,
          description: `Operation '${operation}' is not in the allowed operations list`,
          location: 'Code analysis',
          educationalExplanation: `The operation '${operation}' has been blocked because it's not in the list of safe operations for this context.`,
          suggestedFix: `Use an alternative approach or request approval for this operation if it's necessary for the fix.`
        });
      }
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(violations, patch.risk);

    // Generate educational content
    const educationalContent = this.educationalGenerator.generateEducationalContent(violations);

    // Determine if patch is valid (no critical violations)
    const isValid = !violations.some(v => v.severity === SecuritySeverity.Critical) && riskScore < 0.8;

    return {
      isValid,
      riskScore,
      violations,
      educationalContent,
      allowedOperations,
      blockedOperations
    };
  }

  /**
   * Get educational rejection message for unsafe patches
   */
  generateRejectionMessage(result: SecurityValidationResult): string {
    if (result.isValid) {
      return '';
    }

    const criticalViolations = result.violations.filter(v => v.severity === SecuritySeverity.Critical);
    const highViolations = result.violations.filter(v => v.severity === SecuritySeverity.High);
    const mediumViolations = result.violations.filter(v => v.severity === SecuritySeverity.Medium);

    let message = '🚫 **Patch Rejected for Security Reasons**\n\n';

    if (criticalViolations.length > 0) {
      message += '**Critical Security Issues:**\n';
      for (const violation of criticalViolations) {
        message += `• ${violation.description}\n`;
        message += `  💡 ${violation.educationalExplanation}\n`;
        message += `  🔧 **Fix:** ${violation.suggestedFix}\n\n`;
      }
    }

    if (highViolations.length > 0) {
      message += '**High-Risk Security Issues:**\n';
      for (const violation of highViolations) {
        message += `• ${violation.description}\n`;
        message += `  💡 ${violation.educationalExplanation}\n`;
        message += `  🔧 **Fix:** ${violation.suggestedFix}\n\n`;
      }
    }

    if (mediumViolations.length > 0) {
      message += '**Medium-Risk Security Issues:**\n';
      for (const violation of mediumViolations) {
        message += `• ${violation.description}\n`;
        message += `  💡 ${violation.educationalExplanation}\n`;
        message += `  🔧 **Fix:** ${violation.suggestedFix}\n\n`;
      }
    }

    if (result.blockedOperations.length > 0) {
      message += '**Blocked Operations:**\n';
      message += `The following operations are not allowed: ${result.blockedOperations.join(', ')}\n\n`;
      if (result.allowedOperations.length > 0) {
        message += '**Allowed Operations:**\n';
        message += `You can use: ${result.allowedOperations.slice(0, 10).join(', ')}${result.allowedOperations.length > 10 ? '...' : ''}\n\n`;
      }
    }

    message += '**What You Can Do:**\n';
    message += '1. Review the security issues above\n';
    message += '2. Modify your patch to use safer alternatives\n';
    message += '3. Ask the ghost for guidance on secure coding practices\n';
    message += '4. Try a different approach to solve the problem\n\n';

    message += '**Remember:** Security is crucial in debugging. These restrictions help you learn safe coding practices! 🛡️';

    return message;
  }

  private extractCodeFromDiff(diff: string): string[] {
    const lines = diff.split('\n');
    const codeLines: string[] = [];

    for (const line of lines) {
      // Extract added lines (starting with +) and context lines (starting with space)
      if (line.startsWith('+') && !line.startsWith('+++')) {
        codeLines.push(line.substring(1)); // Remove + prefix
      } else if (line.startsWith(' ')) {
        codeLines.push(line.substring(1)); // Remove space prefix
      }
    }

    return codeLines;
  }

  private extractOperationsFromCode(code: string): string[] {
    const operations: string[] = [];
    
    // Simple operation extraction based on common patterns
    const operationPatterns = [
      { pattern: /\b(eval|Function|setTimeout|setInterval)\s*\(/g, type: 'dangerous-function' },
      { pattern: /\b(require|import)\s*\(/g, type: 'module-loading' },
      { pattern: /\.(innerHTML|outerHTML)\s*=/g, type: 'dom-manipulation' },
      { pattern: /\b(fetch|XMLHttpRequest|WebSocket)\b/g, type: 'network-access' },
      { pattern: /\b(localStorage|sessionStorage)\b/g, type: 'storage-access' },
      { pattern: /\b(console\.\w+)\s*\(/g, type: 'console-operation' },
      { pattern: /\b(Math\.\w+)\s*\(/g, type: 'math-operation' },
      { pattern: /\b(Array\.\w+)\s*\(/g, type: 'array-operation' },
      { pattern: /\b(Object\.\w+)\s*\(/g, type: 'object-operation' },
      { pattern: /\bconst\s+\w+\s*=/g, type: 'variable-declaration' },
      { pattern: /\blet\s+\w+\s*=/g, type: 'variable-declaration' },
      { pattern: /\bfunction\s+\w+\s*\(/g, type: 'function-declaration' },
      { pattern: /\w+\s*=\s*[^=]/g, type: 'assignment' }
    ];

    for (const { pattern, type } of operationPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        // For safe operations, add the type
        if (['console-operation', 'math-operation', 'array-operation', 'object-operation', 'variable-declaration', 'function-declaration', 'assignment'].includes(type)) {
          operations.push(type);
        } else {
          // For dangerous operations, add the actual match
          operations.push(...matches.map(match => match.replace(/[^\w.]/g, '')));
        }
      }
    }

    return Array.from(new Set(operations)); // Remove duplicates
  }

  private calculateRiskScore(violations: SecurityViolation[], baseRisk: number): number {
    let riskScore = baseRisk;

    for (const violation of violations) {
      switch (violation.severity) {
        case SecuritySeverity.Critical:
          riskScore += 0.4;
          break;
        case SecuritySeverity.High:
          riskScore += 0.3;
          break;
        case SecuritySeverity.Medium:
          riskScore += 0.2;
          break;
        case SecuritySeverity.Low:
          riskScore += 0.1;
          break;
      }
    }

    return Math.min(1.0, riskScore);
  }
}