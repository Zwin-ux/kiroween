/**
 * Ghost Manager - Handles ghost interactions, dialogue generation, and patch planning
 */

import type { 
  Ghost, 
  GameState,
  GameContext,
  PatchPlan,
  MeterEffects,
  MCPTools,
  LoreEntry,
  PatchPattern,
  GhostAssets,
  GhostVisualEffects
} from '@/types';
import { AssetRegistry } from '@/lib/assets';

export class GhostManager {
  private ghosts: Map<string, Ghost> = new Map();
  private roomGhostMapping: Map<string, string[]> = new Map();
  private vibePrompts: Map<string, string> = new Map();

  constructor(
    ghosts: Ghost[],
    private mcpTools: MCPTools
  ) {
    // Initialize ghosts map
    ghosts.forEach(ghost => {
      this.ghosts.set(ghost.id, ghost);
      
      // Build room-to-ghost mapping
      ghost.rooms.forEach(roomKey => {
        const roomGhosts = this.roomGhostMapping.get(roomKey) || [];
        roomGhosts.push(ghost.id);
        this.roomGhostMapping.set(roomKey, roomGhosts);
      });
    });

    // Initialize default vibe prompts
    this.initializeVibePrompts();
  }

  /**
   * Get ghosts present in a specific room
   */
  getGhostsByRoom(roomKey: string): Ghost[] {
    const ghostIds = this.roomGhostMapping.get(roomKey) || [];
    return ghostIds
      .map(id => this.ghosts.get(id))
      .filter((ghost): ghost is Ghost => ghost !== undefined);
  }

  /**
   * Get ghost by ID
   */
  getGhost(ghostId: string): Ghost | undefined {
    return this.ghosts.get(ghostId);
  }

  /**
   * Generate contextual dialogue for a ghost
   */
  async generateDialogue(ghost: Ghost, context: GameContext): Promise<string> {
    try {
      // Select appropriate prompt based on context
      const selectedPrompt = this.selectDialoguePrompt(ghost, context);
      
      // Get vibe prompt for dialogue enhancement
      const vibePrompt = this.getVibePrompt('dialogue_generation', ghost, context);
      
      // Use lore search to get relevant context
      const loreContext = await this.getLoreContext(ghost, context);
      
      // Generate enhanced dialogue using vibe prompts and context
      const enhancedDialogue = await this.enhanceDialogue(
        selectedPrompt,
        vibePrompt,
        loreContext,
        context
      );

      // Add asset-driven visual effects
      const visualEffects = this.applyGhostVisualEffects(ghost, context);
      
      return enhancedDialogue + '\n\n' + visualEffects;
    } catch (error) {
      console.error('Error generating dialogue:', error);
      // Fallback to basic dialogue prompt
      return ghost.dialoguePrompts[0] || "The ghost stares at you silently...";
    }
  }

  /**
   * Create a patch plan based on ghost type and player intent
   */
  async createPatchPlan(ghost: Ghost, playerIntent: string, context: GameContext): Promise<PatchPlan> {
    try {
      // Get appropriate fix pattern for the ghost
      const fixPattern = this.selectFixPattern(ghost, playerIntent, context);
      
      // Calculate risk based on ghost severity and fix complexity
      const risk = this.calculatePatchRisk(ghost, fixPattern, context);
      
      // Generate diff using the fix pattern and player intent
      const diff = await this.generateDiff(ghost, fixPattern, playerIntent, context);
      
      // Calculate meter effects
      const effects = this.calculateMeterEffects(ghost, fixPattern, risk);
      
      // Generate ghost response to the patch plan
      const ghostResponse = await this.generateGhostResponse(ghost, fixPattern, context);

      return {
        diff,
        description: this.enhancePatchDescription(fixPattern.description, playerIntent, context),
        risk,
        effects,
        ghostResponse
      };
    } catch (error) {
      console.error('Error creating patch plan:', error);
      throw new Error(`Failed to create patch plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all ghosts
   */
  getAllGhosts(): Ghost[] {
    return Array.from(this.ghosts.values());
  }

  /**
   * Check if ghost is resolved in current game state
   */
  isGhostResolved(ghostId: string, gameState: GameState): boolean {
    // This would need to be tracked in game state
    // For now, we'll check if there are any evidence entries for this ghost
    return gameState.evidenceBoard.some(entry => 
      entry.type === 'ghost_encountered' && 
      entry.context.ghostId === ghostId &&
      entry.context.resolved === true
    );
  }

  /**
   * Register a vibe prompt for dialogue generation
   */
  registerVibePrompt(key: string, prompt: string): void {
    this.vibePrompts.set(key, prompt);
  }

  /**
   * Get ghost entity asset for visual representation
   */
  getGhostEntityAsset(ghost: Ghost): { category: keyof AssetRegistry; name: string } | null {
    if (ghost.assets?.entity) {
      return { category: 'entities', name: ghost.assets.entity };
    }
    
    // Fallback to default entity based on software smell
    const defaultEntity = this.getDefaultEntityForSmell(ghost.softwareSmell);
    if (defaultEntity) {
      return { category: 'entities', name: defaultEntity };
    }
    
    return null;
  }

  /**
   * Get ghost icon asset for UI representation
   */
  getGhostIconAsset(ghost: Ghost, state: 'idle' | 'active' | 'resolved' | 'angry' = 'idle'): { category: keyof AssetRegistry; name: string } | null {
    // Check for state-specific icons first
    if (ghost.assets?.stateIcons?.[state]) {
      return { category: 'icons', name: ghost.assets.stateIcons[state]! };
    }
    
    // Fallback to general ghost icon
    if (ghost.assets?.icon) {
      return { category: 'icons', name: ghost.assets.icon };
    }
    
    // Default ghost icon
    return { category: 'icons', name: 'ghost' };
  }

  /**
   * Get visual effects for ghost encounters
   */
  getGhostVisualEffects(ghost: Ghost): GhostVisualEffects {
    const defaultEffects: GhostVisualEffects = {
      animation: 'float',
      duration: 2000,
    };

    if (ghost.manifestation.effects) {
      return { ...defaultEffects, ...ghost.manifestation.effects };
    }

    // Generate effects based on software smell
    switch (ghost.softwareSmell) {
      case 'circular_dependency':
        return {
          ...defaultEffects,
          animation: 'pulse',
          particles: 'circular',
          lighting: 'red glow',
        };
      case 'memory_leak':
        return {
          ...defaultEffects,
          animation: 'fade',
          particles: 'dripping',
          lighting: 'blue flicker',
        };
      case 'race_condition':
        return {
          ...defaultEffects,
          animation: 'glitch',
          particles: 'chaotic',
          lighting: 'strobe',
          duration: 1500,
        };
      case 'prompt_injection':
        return {
          ...defaultEffects,
          animation: 'pulse',
          particles: 'text fragments',
          lighting: 'yellow warning',
        };
      case 'data_leak':
        return {
          ...defaultEffects,
          animation: 'fade',
          particles: 'data streams',
          lighting: 'orange alert',
        };
      case 'dead_code':
        return {
          ...defaultEffects,
          animation: 'fade',
          particles: 'dust',
          lighting: 'dim gray',
          duration: 3000,
        };
      case 'stale_cache':
        return {
          ...defaultEffects,
          animation: 'pulse',
          particles: 'static',
          lighting: 'green stale',
        };
      case 'unbounded_recursion':
        return {
          ...defaultEffects,
          animation: 'pulse',
          particles: 'infinite loop',
          lighting: 'purple spiral',
          duration: 1000,
        };
      default:
        return defaultEffects;
    }
  }

  /**
   * Apply asset-driven visual effects during ghost encounters
   */
  applyGhostVisualEffects(ghost: Ghost, context: GameContext): string {
    const effects = this.getGhostVisualEffects(ghost);
    const entityAsset = this.getGhostEntityAsset(ghost);
    const iconAsset = this.getGhostIconAsset(ghost, 'active');
    
    let effectDescription = '';
    
    // Add entity-based visual description
    if (entityAsset) {
      effectDescription += `*The ${entityAsset.name} entity materializes before you`;
      
      if (effects.animation) {
        switch (effects.animation) {
          case 'float':
            effectDescription += ', floating ominously in the digital space';
            break;
          case 'pulse':
            effectDescription += ', pulsing with unstable energy';
            break;
          case 'glitch':
            effectDescription += ', glitching between states';
            break;
          case 'fade':
            effectDescription += ', fading in and out of existence';
            break;
        }
      }
      
      effectDescription += '*\n';
    }
    
    // Add lighting effects
    if (effects.lighting) {
      effectDescription += `*${effects.lighting} emanates from the ghost's presence*\n`;
    }
    
    // Add particle effects
    if (effects.particles) {
      effectDescription += `*${effects.particles} swirl around the manifestation*\n`;
    }
    
    // Add icon-based UI feedback
    if (iconAsset) {
      effectDescription += `*The ${iconAsset.name} icon glows in your interface*`;
    }
    
    return effectDescription;
  }

  /**
   * Private method to select appropriate dialogue prompt
   */
  private selectDialoguePrompt(ghost: Ghost, context: GameContext): string {
    const { gameState } = context;
    
    // Select based on insight level
    if (gameState.meters.insight < 25) {
      // Low insight - use basic prompts
      return ghost.dialoguePrompts[0] || "...";
    } else if (gameState.meters.insight < 50) {
      // Medium insight - use more detailed prompts
      const midIndex = Math.floor(ghost.dialoguePrompts.length / 2);
      return ghost.dialoguePrompts[midIndex] || ghost.dialoguePrompts[0];
    } else {
      // High insight - use advanced prompts
      return ghost.dialoguePrompts[ghost.dialoguePrompts.length - 1] || ghost.dialoguePrompts[0];
    }
  }

  /**
   * Private method to get vibe prompt for context
   */
  private getVibePrompt(type: string, ghost: Ghost, context: GameContext): string {
    const key = `${type}_${ghost.softwareSmell}_${context.gameState.meters.insight > 50 ? 'advanced' : 'basic'}`;
    return this.vibePrompts.get(key) || this.vibePrompts.get(`${type}_default`) || '';
  }

  /**
   * Private method to get relevant lore context
   */
  private async getLoreContext(ghost: Ghost, context: GameContext): Promise<LoreEntry[]> {
    try {
      const searchQuery = `${ghost.softwareSmell} ${ghost.name}`;
      return await this.mcpTools.lore.search(searchQuery);
    } catch (error) {
      console.error('Error searching lore:', error);
      return [];
    }
  }

  /**
   * Private method to enhance dialogue using vibe prompts
   */
  private async enhanceDialogue(
    basePrompt: string,
    vibePrompt: string,
    loreContext: LoreEntry[],
    context: GameContext
  ): Promise<string> {
    let enhancedDialogue = basePrompt;
    
    // Apply personality-specific enhancements based on ghost type
    enhancedDialogue = this.applyPersonalityPattern(enhancedDialogue, context);
    
    // Add system stability effects
    if (context.gameState.meters.stability < 30) {
      enhancedDialogue += " *The system trembles ominously, code fragments flickering*";
    } else if (context.gameState.meters.stability < 60) {
      enhancedDialogue += " *System warnings echo in the background*";
    }
    
    // Add insight-based enhancements
    if (context.gameState.meters.insight > 70) {
      enhancedDialogue += " *You sense the deeper technical patterns behind the ghost's words*";
    } else if (context.gameState.meters.insight > 40) {
      enhancedDialogue += " *The ghost's meaning becomes clearer to you*";
    }
    
    // Add lore context if available
    if (loreContext.length > 0) {
      const relevantLore = loreContext[0];
      enhancedDialogue += ` *Memories surface: "${relevantLore.text.substring(0, 80)}..."*`;
    }
    
    // Add room atmosphere effects
    enhancedDialogue = this.addRoomAtmosphere(enhancedDialogue, context);
    
    return enhancedDialogue;
  }

  /**
   * Private method to select appropriate fix pattern
   */
  private selectFixPattern(ghost: Ghost, playerIntent: string, context: GameContext): PatchPattern {
    // Simple pattern selection based on player intent keywords
    const intent = playerIntent.toLowerCase();
    
    for (const pattern of ghost.fixPatterns) {
      if (intent.includes(pattern.type.replace('_', ' '))) {
        return pattern;
      }
    }
    
    // Default to first pattern if no match
    return ghost.fixPatterns[0];
  }

  /**
   * Private method to calculate patch risk
   */
  private calculatePatchRisk(ghost: Ghost, fixPattern: PatchPattern, context: GameContext): number {
    let baseRisk = fixPattern.risk;
    
    // Adjust risk based on ghost severity
    const severityMultiplier = ghost.severity / 10;
    baseRisk *= severityMultiplier;
    
    // Adjust risk based on player insight (higher insight = lower risk)
    const insightModifier = Math.max(0.1, 1 - (context.gameState.meters.insight / 200));
    baseRisk *= insightModifier;
    
    // Adjust risk based on system stability (lower stability = higher risk)
    const stabilityModifier = Math.max(0.5, context.gameState.meters.stability / 100);
    baseRisk /= stabilityModifier;
    
    return Math.min(1.0, Math.max(0.0, baseRisk));
  }

  /**
   * Private method to generate diff for patch
   */
  private async generateDiff(ghost: Ghost, fixPattern: PatchPattern, playerIntent: string, context: GameContext): Promise<string> {
    // Generate contextual diff based on ghost type and player intent
    const fileExtension = this.getFileExtension(ghost.softwareSmell);
    const fileName = `haunted_${ghost.softwareSmell}.${fileExtension}`;
    
    // Get ghost-specific diff template
    const diffContent = this.generateGhostSpecificDiff(ghost, fixPattern, playerIntent, context);
    
    const diffTemplate = `--- a/${fileName}
+++ b/${fileName}
${diffContent}`;

    return diffTemplate;
  }

  /**
   * Private method to generate ghost-specific diff content
   */
  private generateGhostSpecificDiff(ghost: Ghost, fixPattern: PatchPattern, playerIntent: string, context: GameContext): string {
    const insightLevel = context.gameState.meters.insight;
    
    switch (ghost.softwareSmell) {
      case 'circular_dependency':
        return this.generateCircularDependencyDiff(fixPattern, playerIntent, insightLevel);
      case 'memory_leak':
        return this.generateMemoryLeakDiff(fixPattern, playerIntent, insightLevel);
      case 'race_condition':
        return this.generateRaceConditionDiff(fixPattern, playerIntent, insightLevel);
      case 'prompt_injection':
        return this.generatePromptInjectionDiff(fixPattern, playerIntent, insightLevel);
      case 'data_leak':
        return this.generateDataLeakDiff(fixPattern, playerIntent, insightLevel);
      case 'dead_code':
        return this.generateDeadCodeDiff(fixPattern, playerIntent, insightLevel);
      case 'stale_cache':
        return this.generateStaleCacheDiff(fixPattern, playerIntent, insightLevel);
      case 'unbounded_recursion':
        return this.generateUnboundedRecursionDiff(fixPattern, playerIntent, insightLevel);
      default:
        return this.generateGenericDiff(fixPattern, playerIntent);
    }
  }

  /**
   * Private method to enhance patch description with context
   */
  private enhancePatchDescription(baseDescription: string, playerIntent: string, context: GameContext): string {
    const insightLevel = context.gameState.meters.insight;
    let enhanced = baseDescription;
    
    // Add player intent context
    enhanced += `\n\nPlayer Intent: "${playerIntent}"`;
    
    // Add insight-based explanations
    if (insightLevel > 70) {
      enhanced += '\n\nTechnical Details: This patch addresses the root cause by implementing industry-standard patterns.';
    } else if (insightLevel > 40) {
      enhanced += '\n\nExplanation: This change should resolve the immediate issue.';
    }
    
    // Add risk context
    enhanced += '\n\nConsider the implications before applying this patch.';
    
    return enhanced;
  }

  /**
   * Private method to calculate meter effects
   */
  private calculateMeterEffects(ghost: Ghost, fixPattern: PatchPattern, risk: number): MeterEffects {
    // Base effects from fix pattern
    let stabilityEffect = fixPattern.stabilityEffect;
    let insightEffect = fixPattern.insightEffect;
    
    // Adjust effects based on risk
    if (risk > 0.7) {
      // High risk - reduce positive effects
      stabilityEffect *= 0.7;
      insightEffect *= 0.8;
    } else if (risk < 0.3) {
      // Low risk - boost positive effects
      stabilityEffect *= 1.2;
      insightEffect *= 1.1;
    }
    
    return {
      stability: Math.round(stabilityEffect),
      insight: Math.round(insightEffect),
      description: `Applied ${fixPattern.type} to resolve ${ghost.softwareSmell}`
    };
  }

  /**
   * Private method to generate ghost response
   */
  private async generateGhostResponse(ghost: Ghost, fixPattern: PatchPattern, context: GameContext): Promise<string> {
    // Select response based on fix pattern effectiveness
    const effectiveness = this.calculateFixEffectiveness(ghost, fixPattern, context);
    
    if (effectiveness > 0.8) {
      return "Ahh... the code feels lighter now... I can finally rest...";
    } else if (effectiveness > 0.5) {
      return "Better... but the corruption runs deeper than you think...";
    } else {
      return "That only made things worse! You don't understand the true nature of this problem...";
    }
  }

  /**
   * Private method to calculate fix effectiveness
   */
  private calculateFixEffectiveness(ghost: Ghost, fixPattern: PatchPattern, context: GameContext): number {
    // Base effectiveness from pattern
    let effectiveness = 0.7;
    
    // Adjust based on ghost severity (harder ghosts are harder to fix)
    effectiveness -= (ghost.severity / 20);
    
    // Adjust based on player insight
    effectiveness += (context.gameState.meters.insight / 200);
    
    // Adjust based on system stability
    effectiveness += (context.gameState.meters.stability / 200);
    
    return Math.min(1.0, Math.max(0.0, effectiveness));
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
   * Private method to apply personality patterns based on ghost type
   */
  private applyPersonalityPattern(dialogue: string, context: GameContext): string {
    const ghost = context.activeGhost;
    if (!ghost) return dialogue;

    const insightLevel = context.gameState.meters.insight;
    
    // Add personality-specific speech patterns
    switch (ghost.softwareSmell) {
      case 'circular_dependency':
        if (insightLevel > 70) {
          return dialogue + " *The ghost's words loop back on themselves, revealing the architectural pattern*";
        }
        return dialogue + " *The ghost speaks in endless circles*";
        
      case 'memory_leak':
        if (insightLevel > 70) {
          return dialogue + " *You notice the ghost clutching phantom memory allocations*";
        }
        return dialogue + " *The ghost hoards invisible resources*";
        
      case 'race_condition':
        if (insightLevel > 70) {
          return dialogue + " *Multiple ghostly voices overlap, competing for attention*";
        }
        return dialogue + " *The ghost's words arrive in chaotic order*";
        
      case 'prompt_injection':
        if (insightLevel > 70) {
          return dialogue + " *You recognize the manipulative patterns in the ghost's speech*";
        }
        return dialogue + " *The ghost's words seem deceptively reasonable*";
        
      case 'data_leak':
        if (insightLevel > 70) {
          return dialogue + " *Sensitive information glows ominously around the ghost*";
        }
        return dialogue + " *The ghost whispers secrets it shouldn't know*";
        
      case 'dead_code':
        if (insightLevel > 70) {
          return dialogue + " *The ghost flickers between existence and void*";
        }
        return dialogue + " *The ghost's presence feels forgotten and abandoned*";
        
      case 'stale_cache':
        if (insightLevel > 70) {
          return dialogue + " *Outdated data swirls around the ghost like dust*";
        }
        return dialogue + " *The ghost clings to faded, obsolete information*";
        
      case 'unbounded_recursion':
        if (insightLevel > 70) {
          return dialogue + " *The ghost's words echo infinitely, revealing the missing base case*";
        }
        return dialogue + " *The ghost calls to itself in an endless loop*";
        
      default:
        return dialogue;
    }
  }

  /**
   * Private method to add room atmosphere effects
   */
  private addRoomAtmosphere(dialogue: string, context: GameContext): string {
    const roomKey = context.gameState.currentRoom;
    
    switch (roomKey) {
      case 'dependency_crypt':
        return dialogue + " *Import chains rattle like ghostly chains*";
      case 'ghost_memory_heap':
        return dialogue + " *Allocated memory blocks float like spectral debris*";
      case 'possessed_compiler':
        return dialogue + " *Compilation errors flash like lightning*";
      case 'boot_sector':
        return dialogue + " *System initialization sequences hum ominously*";
      case 'ethics_tribunal':
        return dialogue + " *Moral weight presses down on the conversation*";
      case 'final_merge':
        return dialogue + " *The convergence of all code paths creates an electric tension*";
      default:
        return dialogue + " *The haunted codebase pulses with digital unrest*";
    }
  }

  /**
   * Generate diff for circular dependency fixes
   */
  private generateCircularDependencyDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'dependency_injection') {
      return `@@ -1,8 +1,12 @@
-import { ServiceA } from './serviceA';
-import { ServiceB } from './serviceB';
+interface IServiceA { process(): void; }
+interface IServiceB { handle(): void; }

 class HauntedModule {
-  constructor() {
-    this.serviceA = new ServiceA();
-    this.serviceB = new ServiceB();
+  constructor(
+    private serviceA: IServiceA,
+    private serviceB: IServiceB
+  ) {
+    // Dependencies injected, breaking the circular reference
   }
 }`;
    } else {
      return `@@ -1,6 +1,10 @@
-import { CircularService } from './circular';
+interface ICircularService { 
+  execute(): void; 
+}
+
 class HauntedModule {
-  service: CircularService;
+  service: ICircularService;
+  // Interface breaks the direct dependency cycle
 }`;
    }
  }

  /**
   * Generate diff for memory leak fixes
   */
  private generateMemoryLeakDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'resource_cleanup') {
      return `@@ -1,10 +1,16 @@
 class HauntedEventHandler {
   constructor() {
     window.addEventListener('resize', this.handleResize);
+    window.addEventListener('scroll', this.handleScroll);
   }
   
+  destroy() {
+    // Proper cleanup prevents memory leaks
+    window.removeEventListener('resize', this.handleResize);
+    window.removeEventListener('scroll', this.handleScroll);
+  }
+  
   handleResize = () => {
-    // Event handler that never gets cleaned up
+    // Event handler with proper lifecycle management
   }
 }`;
    } else {
      return `@@ -1,5 +1,8 @@
-const strongCache = new Map();
+const weakCache = new WeakMap();
+// WeakMap allows garbage collection of unused entries
 
 function cacheValue(obj, value) {
-  strongCache.set(obj, value);
+  weakCache.set(obj, value);
 }`;
    }
  }

  /**
   * Generate diff for race condition fixes
   */
  private generateRaceConditionDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'synchronization') {
      return `@@ -1,8 +1,14 @@
+const mutex = new Mutex();
 let sharedCounter = 0;

 async function incrementCounter() {
+  await mutex.acquire();
+  try {
     sharedCounter++;
-    // Race condition: multiple threads can modify simultaneously
+    // Protected by mutex - no race condition
+  } finally {
+    mutex.release();
+  }
 }`;
    } else {
      return `@@ -1,6 +1,8 @@
-let counter = 0;
-counter++; // Not thread-safe
+import { AtomicInteger } from './atomic';
+
+const counter = new AtomicInteger(0);
+counter.incrementAndGet(); // Atomic operation - thread-safe
 
 function getCount() {
-  return counter;
+  return counter.get();
 }`;
    }
  }

  /**
   * Generate diff for prompt injection fixes
   */
  private generatePromptInjectionDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'input_sanitization') {
      return `@@ -1,6 +1,12 @@
+function sanitizeInput(input: string): string {
+  return input
+    .replace(/ignore previous instructions/gi, '[FILTERED]')
+    .replace(/system:/gi, '[FILTERED]')
+    .trim();
+}
+
 async function processUserInput(userInput: string) {
-  const response = await ai.generate(userInput);
+  const sanitized = sanitizeInput(userInput);
+  const response = await ai.generate(sanitized);
   return response;
 }`;
    } else {
      return `@@ -1,4 +1,8 @@
-const prompt = userInput;
+const prompt = \`
+Context: You are a helpful assistant.
+User Query: \${escapeUserInput(userInput)}
+Instructions: Respond to the user query above.
+\`;
 
 const response = await ai.generate(prompt);`;
    }
  }

  /**
   * Generate diff for data leak fixes
   */
  private generateDataLeakDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'data_redaction') {
      return `@@ -1,6 +1,12 @@
+function redactSensitiveData(data: any) {
+  return {
+    ...data,
+    password: '[REDACTED]',
+    sessionToken: '[REDACTED]',
+    email: data.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
+  };
+}
+
-console.log('User data:', userData);
+console.log('User data:', redactSensitiveData(userData));
 logger.info('Authentication attempt', userData);`;
    } else {
      return `@@ -1,4 +1,7 @@
-logger.error('Auth failed', { user, password, token });
+logger.error('Auth failed', { 
+  userId: user.id, 
+  timestamp: Date.now(),
+  // Sensitive data removed from logs
+});`;
    }
  }

  /**
   * Generate diff for dead code fixes
   */
  private generateDeadCodeDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    return `@@ -1,15 +1,8 @@
 function activeFunction() {
   return "I'm still being used!";
 }

-function forgottenFunction() {
-  // This function is never called
-  return "I'm dead code...";
-}
-
-const unusedVariable = "Nobody references me";
-
 function anotherActiveFunction() {
-  // This function is called but references dead code
-  const result = forgottenFunction();
+  // Cleaned up - no more dead code references
   return "I'm alive and clean!";
 }`;
  }

  /**
   * Generate diff for stale cache fixes
   */
  private generateStaleCacheDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'cache_invalidation') {
      return `@@ -1,8 +1,18 @@
 const cache = new Map();
+const cacheTimestamps = new Map();
+const TTL = 5 * 60 * 1000; // 5 minutes

 function getCachedValue(key: string) {
+  const timestamp = cacheTimestamps.get(key);
+  if (timestamp && Date.now() - timestamp > TTL) {
+    // Cache entry is stale, remove it
+    cache.delete(key);
+    cacheTimestamps.delete(key);
+    return null;
+  }
   return cache.get(key);
 }

 function setCachedValue(key: string, value: any) {
   cache.set(key, value);
+  cacheTimestamps.set(key, Date.now());
 }`;
    } else {
      return `@@ -1,6 +1,10 @@
-cache.set(key, value);
+cache.set(key, {
+  value,
+  expires: Date.now() + TTL,
+  // TTL-based expiration
+});

 function getValue(key: string) {
-  return cache.get(key);
+  const entry = cache.get(key);
+  return entry && entry.expires > Date.now() ? entry.value : null;
 }`;
    }
  }

  /**
   * Generate diff for unbounded recursion fixes
   */
  private generateUnboundedRecursionDiff(fixPattern: PatchPattern, playerIntent: string, insightLevel: number): string {
    if (fixPattern.type === 'base_case_addition') {
      return `@@ -1,6 +1,9 @@
 function recursiveFunction(n: number): number {
+  // Base case prevents infinite recursion
+  if (n <= 0) return 0;
+  if (n === 1) return 1;
+  
-  // Missing base case - infinite recursion!
   return n + recursiveFunction(n - 1);
 }`;
    } else if (fixPattern.type === 'iterative_conversion') {
      return `@@ -1,6 +1,10 @@
-function factorial(n: number): number {
-  return n <= 1 ? 1 : n * factorial(n - 1);
-}
+function factorial(n: number): number {
+  let result = 1;
+  for (let i = 2; i <= n; i++) {
+    result *= i;
+  }
+  return result; // Iterative approach avoids stack overflow
+}`;
    } else {
      return `@@ -1,8 +1,15 @@
+const MAX_DEPTH = 1000;
+
-function deepRecursion(n: number): number {
+function deepRecursion(n: number, depth = 0): number {
+  if (depth > MAX_DEPTH) {
+    throw new Error('Maximum recursion depth exceeded');
+  }
+  
   if (n <= 0) return 0;
-  return n + deepRecursion(n - 1);
+  return n + deepRecursion(n - 1, depth + 1);
 }`;
    }
  }

  /**
   * Generate generic diff template
   */
  private generateGenericDiff(fixPattern: PatchPattern, playerIntent: string): string {
    return `@@ -1,5 +1,8 @@
 // Haunted module
-// TODO: Fix the software smell
+// FIXED: Applied ${fixPattern.type} pattern
+// Player intent: ${playerIntent}
 
+// ${fixPattern.description}
 function hauntedFunction() {
-  // Problematic code here
+  // Fixed implementation
   return "Ghost has been laid to rest";
 }`;
  }

  /**
   * Private method to get default entity asset for software smell
   */
  private getDefaultEntityForSmell(softwareSmell: string): string | null {
    const entityMapping: Record<string, string> = {
      'circular_dependency': 'terminal',
      'memory_leak': 'pumpkin',
      'race_condition': 'terminal',
      'prompt_injection': 'candy',
      'data_leak': 'terminal',
      'dead_code': 'pumpkin',
      'stale_cache': 'candy',
      'unbounded_recursion': 'terminal',
    };
    
    return entityMapping[softwareSmell] || null;
  }

  /**
   * Private method to initialize default vibe prompts
   */
  private initializeVibePrompts(): void {
    this.vibePrompts.set('dialogue_generation_default', 
      'Generate haunting dialogue that reflects the ghost\'s software smell and the current game context.');
    
    this.vibePrompts.set('dialogue_generation_circular_dependency_basic',
      'The ghost speaks in circular references and endless loops.');
    
    this.vibePrompts.set('dialogue_generation_circular_dependency_advanced',
      'The ghost reveals the deeper architectural issues behind dependency cycles.');
    
    this.vibePrompts.set('dialogue_generation_memory_leak_basic',
      'The ghost hoards resources and refuses to let go.');
    
    this.vibePrompts.set('dialogue_generation_memory_leak_advanced',
      'The ghost explains the lifecycle management issues causing resource leaks.');
      
    this.vibePrompts.set('patch_planning_default',
      'Generate technically sound patches that address the software smell while maintaining horror atmosphere.');
  }
}