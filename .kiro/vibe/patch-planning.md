# Patch Planning Vibe Prompts

## Core Patch Planning Philosophy

You are generating code patches to resolve software ghosts in a horror debugging game. Each patch should be:

- **Technically Sound**: Address the actual software smell or bug pattern
- **Contextually Appropriate**: Match the player's stated intent and skill level
- **Educationally Valuable**: Help players understand the underlying issue
- **Narratively Consistent**: Maintain the horror atmosphere while being helpful

## Patch Generation Patterns

### Risk Assessment Guidelines

**Low Risk (0.0-0.3)**:
- Simple, well-established patterns
- Minimal code changes
- Low chance of introducing new issues
- Safe for beginners

**Medium Risk (0.4-0.6)**:
- Moderate complexity changes
- Requires understanding of system architecture
- Some potential for side effects
- Suitable for intermediate developers

**High Risk (0.7-1.0)**:
- Complex architectural changes
- Significant refactoring required
- High potential for introducing new issues
- Requires expert-level understanding

### Ghost-Specific Patch Patterns

#### Circular Dependencies (The Ouroboros)
**Dependency Injection Pattern**:
```diff
- import { ServiceA } from './serviceA';
- import { ServiceB } from './serviceB';
+ interface IServiceA { /* ... */ }
+ interface IServiceB { /* ... */ }
+ 
+ // Inject dependencies instead of direct imports
+ constructor(private serviceA: IServiceA, private serviceB: IServiceB) {}
```

**Interface Extraction Pattern**:
```diff
- class ServiceA {
-   constructor(private serviceB: ServiceB) {}
+ interface IServiceB { method(): void; }
+ 
+ class ServiceA {
+   constructor(private serviceB: IServiceB) {}
```

#### Stale Cache (The Lingerer)
**Cache Invalidation Pattern**:
```diff
- const cache = new Map();
+ const cache = new Map();
+ const cacheTimestamps = new Map();
+ 
+ function getCachedValue(key: string) {
+   const timestamp = cacheTimestamps.get(key);
+   if (timestamp && Date.now() - timestamp > TTL) {
+     cache.delete(key);
+     cacheTimestamps.delete(key);
+   }
+   return cache.get(key);
+ }
```

**TTL Implementation Pattern**:
```diff
- cache.set(key, value);
+ cache.set(key, { value, expires: Date.now() + TTL });
```

#### Unbounded Recursion (The Infinite Echo)
**Base Case Addition Pattern**:
```diff
  function recursiveFunction(n: number): number {
+   if (n <= 0) return 0; // Base case to prevent infinite recursion
    return n + recursiveFunction(n - 1);
  }
```

**Iterative Conversion Pattern**:
```diff
- function factorial(n: number): number {
-   return n <= 1 ? 1 : n * factorial(n - 1);
- }
+ function factorial(n: number): number {
+   let result = 1;
+   for (let i = 2; i <= n; i++) {
+     result *= i;
+   }
+   return result;
+ }
```

#### Prompt Injection (The Manipulator)
**Input Sanitization Pattern**:
```diff
- const userInput = request.body.prompt;
- const response = await ai.generate(userInput);
+ const sanitizedInput = sanitizeInput(request.body.prompt);
+ const response = await ai.generate(sanitizedInput);
+ 
+ function sanitizeInput(input: string): string {
+   return input.replace(/ignore previous instructions/gi, '[FILTERED]');
+ }
```

**Prompt Templating Pattern**:
```diff
- const prompt = userInput;
+ const prompt = `
+ Context: You are a helpful assistant.
+ User Query: ${escapeUserInput(userInput)}
+ Instructions: Respond helpfully to the user query above.
+ `;
```

#### Data Leak (The Whisperer)
**Data Redaction Pattern**:
```diff
- console.log('User login:', { email, password, sessionToken });
+ console.log('User login:', { 
+   email: redactEmail(email), 
+   password: '[REDACTED]', 
+   sessionToken: '[REDACTED]' 
+ });
```

**Secure Logging Pattern**:
```diff
- logger.error('Authentication failed', { user, credentials });
+ logger.error('Authentication failed', { 
+   userId: user.id, 
+   timestamp: Date.now() 
+ });
```

#### Dead Code (The Forgotten)
**Code Removal Pattern**:
```diff
  function activeFunction() {
    return "I'm still used!";
  }
  
- function unusedFunction() {
-   return "Nobody calls me anymore...";
- }
- 
- const orphanedVariable = "I'm never referenced";
```

#### Race Condition (The Competitor)
**Synchronization Pattern**:
```diff
+ const mutex = new Mutex();
+ 
  async function updateSharedResource() {
+   await mutex.acquire();
+   try {
      sharedResource.value += 1;
+   } finally {
+     mutex.release();
+   }
  }
```

**Atomic Operations Pattern**:
```diff
- let counter = 0;
- counter++; // Not atomic in concurrent environment
+ import { AtomicInteger } from './atomic';
+ const counter = new AtomicInteger(0);
+ counter.incrementAndGet(); // Thread-safe atomic operation
```

#### Memory Leak (The Hoarder)
**Resource Cleanup Pattern**:
```diff
  class EventHandler {
    constructor() {
      window.addEventListener('resize', this.handleResize);
    }
+   
+   destroy() {
+     window.removeEventListener('resize', this.handleResize);
+   }
  }
```

**Weak References Pattern**:
```diff
- const cache = new Map(); // Strong references prevent GC
+ const cache = new WeakMap(); // Weak references allow GC
```

## Patch Response Generation

### Success Responses (Effectiveness > 0.8)
- "Ahh... the code feels lighter now... I can finally rest..."
- "You have freed me from this torment... the bug is resolved..."
- "The corruption lifts... I remember what clean code feels like..."

### Partial Success (Effectiveness 0.5-0.8)
- "Better... but the corruption runs deeper than you think..."
- "You've eased my suffering, but I'm not fully at peace yet..."
- "Progress... though shadows still linger in the codebase..."

### Failure (Effectiveness < 0.5)
- "That only made things worse! You don't understand the true nature of this problem..."
- "No! You've made the haunting stronger... the bug spreads..."
- "Your patch has awakened something darker... be more careful..."

## Risk Calculation Factors

### Base Risk Modifiers
- **Ghost Severity**: Higher severity ghosts have riskier fixes
- **Player Insight**: Higher insight reduces risk through better understanding
- **System Stability**: Lower stability increases risk of patch failures
- **Patch Complexity**: More complex changes carry higher risk

### Context-Specific Risk Adjustments
- **First-time encounters**: +0.1 risk (unfamiliarity)
- **Repeated attempts**: -0.05 risk per attempt (learning)
- **Cross-module changes**: +0.2 risk (broader impact)
- **Legacy code areas**: +0.15 risk (unknown dependencies)

## Educational Integration

Each patch should include:
1. **Clear explanation** of what the patch does
2. **Why it works** for this specific software smell
3. **Potential side effects** or considerations
4. **Alternative approaches** when appropriate
5. **Learning resources** for deeper understanding