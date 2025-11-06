/**
 * Compile Event System - Handles deterministic and stochastic effects from patch compilation
 */

import type { 
  CompileEvent,
  PatchPlan,
  PatchResult
} from '../types/patch';
import { CompileEventType } from '../types/patch';
import type { GameState, MeterEffects } from '../types/game';
import type { Ghost } from '../types/ghost';

export interface CompileEventConfig {
  enableStochasticEvents: boolean;
  stochasticProbability: number;
  cascadeThreshold: number;
  maxCascadeDepth: number;
}

export interface EventChain {
  id: string;
  events: CompileEvent[];
  totalEffects: MeterEffects;
  cascadeDepth: number;
}

export interface EffectCalculator {
  calculateDeterministicEffects(patch: PatchPlan, gameState: GameState): MeterEffects;
  calculateStochasticEffects(patch: PatchPlan, gameState: GameState): MeterEffects;
  calculateCascadeEffects(triggerEvent: CompileEvent, gameState: GameState): MeterEffects;
}

export class CompileEventSystem {
  private config: CompileEventConfig;
  private effectCalculator: EffectCalculator;
  private eventHistory: CompileEvent[] = [];
  private activeChains: Map<string, EventChain> = new Map();

  constructor(config: Partial<CompileEventConfig> = {}) {
    this.config = {
      enableStochasticEvents: true,
      stochasticProbability: 0.3,
      cascadeThreshold: 0.7, // Risk threshold for cascade events
      maxCascadeDepth: 3,
      ...config
    };

    this.effectCalculator = new DefaultEffectCalculator();
  }

  /**
   * Process a patch compilation and generate appropriate events
   */
  async processCompilation(patch: PatchPlan, gameState: GameState): Promise<CompileEvent[]> {
    const events: CompileEvent[] = [];
    
    try {
      // Generate deterministic events
      const deterministicEvents = await this.generateDeterministicEvents(patch, gameState);
      events.push(...deterministicEvents);

      // Generate stochastic events if enabled
      if (this.config.enableStochasticEvents) {
        const stochasticEvents = await this.generateStochasticEvents(patch, gameState);
        events.push(...stochasticEvents);
      }

      // Check for cascade events
      const cascadeEvents = await this.checkCascadeEvents(events, gameState);
      events.push(...cascadeEvents);

      // Create event chain
      const chain = this.createEventChain(events);
      this.activeChains.set(chain.id, chain);

      // Add to history
      this.eventHistory.push(...events);

      return events;
    } catch (error) {
      // Generate error event for compilation failure
      const errorEvent = this.createErrorEvent(
        `Compilation processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        gameState
      );
      
      events.push(errorEvent);
      this.eventHistory.push(errorEvent);
      
      return events;
    }
  }

  /**
   * Generate deterministic events based on patch properties
   */
  private async generateDeterministicEvents(patch: PatchPlan, gameState: GameState): Promise<CompileEvent[]> {
    const events: CompileEvent[] = [];

    // Success event (always generated)
    const successEvent: CompileEvent = {
      id: `compile_success_${Date.now()}`,
      type: CompileEventType.Success,
      timestamp: new Date(),
      description: `Patch compiled successfully: ${patch.description}`,
      effects: this.effectCalculator.calculateDeterministicEffects(patch, gameState),
      deterministic: true
    };
    events.push(successEvent);

    // Risk-based warning events
    if (patch.risk > 0.6) {
      const warningEvent: CompileEvent = {
        id: `compile_warning_${Date.now()}`,
        type: CompileEventType.Warning,
        timestamp: new Date(),
        description: `High-risk patch detected (risk: ${(patch.risk * 100).toFixed(1)}%)`,
        effects: {
          stability: -Math.floor(patch.risk * 5),
          insight: Math.floor(patch.risk * 2),
          description: 'High-risk patch warning'
        },
        deterministic: true
      };
      events.push(warningEvent);
    }

    // Security violation events
    if (this.containsSecurityRisk(patch)) {
      const securityEvent: CompileEvent = {
        id: `compile_security_${Date.now()}`,
        type: CompileEventType.SecurityViolation,
        timestamp: new Date(),
        description: 'Security vulnerability detected in patch',
        effects: {
          stability: -10,
          insight: 3,
          description: 'Security violation penalty'
        },
        deterministic: true
      };
      events.push(securityEvent);
    }

    // Performance impact events
    if (this.hasPerformanceImpact(patch)) {
      const performanceEvent: CompileEvent = {
        id: `compile_performance_${Date.now()}`,
        type: CompileEventType.PerformanceImpact,
        timestamp: new Date(),
        description: 'Patch may impact system performance',
        effects: {
          stability: -2,
          insight: 1,
          description: 'Performance impact warning'
        },
        deterministic: true
      };
      events.push(performanceEvent);
    }

    return events;
  }

  /**
   * Generate stochastic events based on system state and probability
   */
  private async generateStochasticEvents(patch: PatchPlan, gameState: GameState): Promise<CompileEvent[]> {
    const events: CompileEvent[] = [];

    // Calculate stochastic event probability based on system state
    const baseProbability = this.config.stochasticProbability;
    const stabilityFactor = Math.max(0.1, gameState.meters.stability / 100);
    const riskFactor = 1 + patch.risk;
    const adjustedProbability = baseProbability * riskFactor / stabilityFactor;

    if (Math.random() < adjustedProbability) {
      const stochasticEvent = await this.generateRandomEvent(patch, gameState);
      events.push(stochasticEvent);
    }

    // Low stability cascade events
    if (gameState.meters.stability < 30 && Math.random() < 0.4) {
      const cascadeEvent: CompileEvent = {
        id: `compile_cascade_${Date.now()}`,
        type: CompileEventType.Error,
        timestamp: new Date(),
        description: 'System instability triggered cascade failure',
        effects: this.effectCalculator.calculateStochasticEffects(patch, gameState),
        deterministic: false
      };
      events.push(cascadeEvent);
    }

    // High insight discovery events
    if (gameState.meters.insight > 70 && Math.random() < 0.3) {
      const discoveryEvent: CompileEvent = {
        id: `compile_discovery_${Date.now()}`,
        type: CompileEventType.Success,
        timestamp: new Date(),
        description: 'High insight revealed hidden optimization opportunity',
        effects: {
          stability: 5,
          insight: 3,
          description: 'Insight-based discovery bonus'
        },
        deterministic: false
      };
      events.push(discoveryEvent);
    }

    return events;
  }

  /**
   * Check for cascade events triggered by other events
   */
  private async checkCascadeEvents(triggerEvents: CompileEvent[], gameState: GameState): Promise<CompileEvent[]> {
    const cascadeEvents: CompileEvent[] = [];

    for (const event of triggerEvents) {
      if (this.shouldTriggerCascade(event, gameState)) {
        const cascade = await this.generateCascadeEvent(event, gameState);
        cascadeEvents.push(cascade);
      }
    }

    return cascadeEvents;
  }

  /**
   * Generate a random stochastic event
   */
  private async generateRandomEvent(patch: PatchPlan, gameState: GameState): Promise<CompileEvent> {
    const eventTypes = [
      {
        type: CompileEventType.Warning,
        description: 'Unexpected side effect detected',
        effects: { stability: -3, insight: 2, description: 'Unexpected side effect' }
      },
      {
        type: CompileEventType.Success,
        description: 'Serendipitous optimization discovered',
        effects: { stability: 3, insight: 1, description: 'Serendipitous optimization' }
      },
      {
        type: CompileEventType.Error,
        description: 'Rare edge case triggered',
        effects: { stability: -5, insight: 3, description: 'Edge case discovery' }
      },
      {
        type: CompileEventType.PerformanceImpact,
        description: 'Memory usage spike detected',
        effects: { stability: -2, insight: 1, description: 'Memory spike' }
      }
    ];

    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    return {
      id: `compile_random_${Date.now()}`,
      type: randomEvent.type,
      timestamp: new Date(),
      description: randomEvent.description,
      effects: randomEvent.effects,
      deterministic: false
    };
  }

  /**
   * Generate a cascade event from a trigger event
   */
  private async generateCascadeEvent(triggerEvent: CompileEvent, gameState: GameState): Promise<CompileEvent> {
    const cascadeEffects = this.effectCalculator.calculateCascadeEffects(triggerEvent, gameState);
    
    return {
      id: `compile_cascade_${Date.now()}`,
      type: CompileEventType.Error,
      timestamp: new Date(),
      description: `Cascade failure triggered by ${triggerEvent.description}`,
      effects: cascadeEffects,
      deterministic: false
    };
  }

  /**
   * Create an event chain from multiple events
   */
  private createEventChain(events: CompileEvent[]): EventChain {
    const totalEffects = events.reduce(
      (total, event) => ({
        stability: total.stability + event.effects.stability,
        insight: total.insight + event.effects.insight,
        description: 'Combined effects from event chain'
      }),
      { stability: 0, insight: 0, description: '' }
    );

    return {
      id: `chain_${Date.now()}`,
      events: [...events],
      totalEffects,
      cascadeDepth: this.calculateCascadeDepth(events)
    };
  }

  /**
   * Create an error event
   */
  private createErrorEvent(message: string, gameState: GameState): CompileEvent {
    return {
      id: `compile_error_${Date.now()}`,
      type: CompileEventType.Error,
      timestamp: new Date(),
      description: message,
      effects: {
        stability: -5,
        insight: 1,
        description: 'Compilation error penalty'
      },
      deterministic: true
    };
  }

  /**
   * Check if patch contains security risks
   */
  private containsSecurityRisk(patch: PatchPlan): boolean {
    const securityPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /innerHTML\s*=/,
      /document\.write/,
      /javascript:/i,
      /on\w+\s*=/
    ];

    return securityPatterns.some(pattern => pattern.test(patch.diff));
  }

  /**
   * Check if patch has performance impact
   */
  private hasPerformanceImpact(patch: PatchPlan): boolean {
    const performancePatterns = [
      /while\s*\(\s*true\s*\)/,
      /for\s*\(\s*;\s*;\s*\)/,
      /setInterval\s*\(/,
      /setTimeout\s*\(/,
      /new\s+Array\s*\(\s*\d{4,}\s*\)/ // Large array allocation
    ];

    return performancePatterns.some(pattern => pattern.test(patch.diff));
  }

  /**
   * Check if an event should trigger a cascade
   */
  private shouldTriggerCascade(event: CompileEvent, gameState: GameState): boolean {
    // Don't cascade from cascade events (prevent infinite loops)
    if (event.id.includes('cascade')) {
      return false;
    }

    // Check risk threshold
    const eventRisk = this.calculateEventRisk(event, gameState);
    
    return eventRisk > this.config.cascadeThreshold && 
           gameState.meters.stability < 50;
  }

  /**
   * Calculate risk level of an event
   */
  private calculateEventRisk(event: CompileEvent, gameState: GameState): number {
    let risk = 0;

    // Base risk by event type
    switch (event.type) {
      case CompileEventType.Error:
        risk += 0.8;
        break;
      case CompileEventType.SecurityViolation:
        risk += 0.9;
        break;
      case CompileEventType.Warning:
        risk += 0.4;
        break;
      case CompileEventType.PerformanceImpact:
        risk += 0.5;
        break;
      default:
        risk += 0.1;
    }

    // Adjust for stability
    const stabilityFactor = Math.max(0.1, gameState.meters.stability / 100);
    risk /= stabilityFactor;

    // Adjust for negative effects
    if (event.effects.stability < 0) {
      risk += Math.abs(event.effects.stability) / 20;
    }

    return Math.min(1.0, risk);
  }

  /**
   * Calculate cascade depth of event chain
   */
  private calculateCascadeDepth(events: CompileEvent[]): number {
    return events.filter(event => event.id.includes('cascade')).length;
  }

  /**
   * Get event history
   */
  getEventHistory(): CompileEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get active event chains
   */
  getActiveChains(): EventChain[] {
    return Array.from(this.activeChains.values());
  }

  /**
   * Clear event history (for testing or reset)
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.activeChains.clear();
  }

  /**
   * Set custom effect calculator
   */
  setEffectCalculator(calculator: EffectCalculator): void {
    this.effectCalculator = calculator;
  }
}

/**
 * Default Effect Calculator Implementation
 */
class DefaultEffectCalculator implements EffectCalculator {
  calculateDeterministicEffects(patch: PatchPlan, gameState: GameState): MeterEffects {
    // Base effects from patch
    let stabilityEffect = patch.effects.stability;
    let insightEffect = patch.effects.insight;

    // Adjust based on current system state
    if (gameState.meters.stability < 20) {
      // Critical stability - reduce positive effects
      stabilityEffect = Math.floor(stabilityEffect * 0.5);
    }

    if (gameState.meters.insight > 80) {
      // High insight - bonus effects
      stabilityEffect = Math.floor(stabilityEffect * 1.2);
      insightEffect = Math.floor(insightEffect * 1.1);
    }

    return {
      stability: stabilityEffect,
      insight: insightEffect,
      description: 'Deterministic compilation effects'
    };
  }

  calculateStochasticEffects(patch: PatchPlan, gameState: GameState): MeterEffects {
    // Random variation in effects
    const variance = 0.3; // 30% variance
    const stabilityVariance = Math.floor((Math.random() - 0.5) * 2 * variance * Math.abs(patch.effects.stability));
    const insightVariance = Math.floor((Math.random() - 0.5) * 2 * variance * Math.abs(patch.effects.insight));

    return {
      stability: stabilityVariance,
      insight: insightVariance,
      description: 'Stochastic compilation effects'
    };
  }

  calculateCascadeEffects(triggerEvent: CompileEvent, gameState: GameState): MeterEffects {
    // Cascade effects are proportional to trigger event severity
    const cascadeMultiplier = 0.6;
    
    return {
      stability: Math.floor(triggerEvent.effects.stability * cascadeMultiplier),
      insight: Math.floor(triggerEvent.effects.insight * cascadeMultiplier),
      description: `Cascade effects from ${triggerEvent.type}`
    };
  }
}

/**
 * Event Effect Processor - Handles complex event interactions
 */
export class EventEffectProcessor {
  private compileEventSystem: CompileEventSystem;

  constructor(compileEventSystem: CompileEventSystem) {
    this.compileEventSystem = compileEventSystem;
  }

  /**
   * Process all effects from a compilation result
   */
  async processEffects(patchResult: PatchResult, gameState: GameState): Promise<MeterEffects> {
    let totalEffects: MeterEffects = {
      stability: 0,
      insight: 0,
      description: 'Combined compilation effects'
    };

    // Process base patch effects
    totalEffects = this.combineEffects(totalEffects, patchResult.effects);

    // Process compile event effects
    for (const event of patchResult.compileEvents) {
      totalEffects = this.combineEffects(totalEffects, event.effects);
    }

    // Apply bounds checking
    totalEffects = this.applyBounds(totalEffects, gameState);

    return totalEffects;
  }

  /**
   * Combine multiple meter effects
   */
  private combineEffects(base: MeterEffects, additional: MeterEffects): MeterEffects {
    return {
      stability: base.stability + additional.stability,
      insight: base.insight + additional.insight,
      description: `${base.description}; ${additional.description}`
    };
  }

  /**
   * Apply bounds to prevent meter overflow/underflow
   */
  private applyBounds(effects: MeterEffects, gameState: GameState): MeterEffects {
    const newStability = Math.max(0, Math.min(100, gameState.meters.stability + effects.stability));
    const newInsight = Math.max(0, Math.min(100, gameState.meters.insight + effects.insight));

    return {
      stability: newStability - gameState.meters.stability,
      insight: newInsight - gameState.meters.insight,
      description: effects.description
    };
  }
}