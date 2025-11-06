/**
 * DynamicMeterSystem - Enhanced meter system with animations and effects
 */

import { MeterSystem } from './MeterSystem';
import { EventManager, GameEventType, type GameEvent } from './EventManager';
import type { 
  GameState, 
  MeterEffects 
} from '@/types/game';
import type { MCPTools } from '@/types/kiro';

export interface VisualEffectSet {
  screenDistortion: number; // 0.0 to 1.0
  colorShift: ColorShiftEffect;
  glitchIntensity: number;
  overlayEffects: OverlayEffect[];
}

export interface ColorShiftEffect {
  hue: number; // -180 to 180
  saturation: number; // 0.0 to 2.0
  brightness: number; // 0.0 to 2.0
}

export interface OverlayEffect {
  type: 'scanlines' | 'noise' | 'vignette' | 'chromatic_aberration';
  intensity: number; // 0.0 to 1.0
  duration?: number; // milliseconds
}

export interface AudioEffectSet {
  heartbeatIntensity: number; // 0.0 to 1.0
  whisperVolume: number;
  ambientTension: number;
  effectTriggers: AudioTrigger[];
}

export interface AudioTrigger {
  type: 'heartbeat' | 'whisper' | 'glitch' | 'warning' | 'success';
  volume: number;
  delay?: number;
  duration?: number;
}

export interface CriticalEvent {
  type: 'stability_warning' | 'insight_breakthrough' | 'system_failure' | 'moral_conflict';
  threshold: number;
  message: string;
  effects: VisualEffectSet & AudioEffectSet;
}

export interface MeterAnimation {
  id: string;
  startValue: number;
  endValue: number;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  onProgress?: (progress: number, currentValue: number) => void;
  onComplete?: () => void;
}

export class DynamicMeterSystem extends MeterSystem {
  private activeAnimations: Map<string, MeterAnimation> = new Map();
  private effectCallbacks: Map<string, (effects: VisualEffectSet | AudioEffectSet) => void> = new Map();
  private eventManager: EventManager | null = null;
  private criticalThresholds = {
    stability: {
      critical: 20,
      warning: 40,
      safe: 60
    },
    insight: {
      breakthrough: 75,
      advanced: 50,
      basic: 25
    }
  };

  constructor(mcpTools: MCPTools, eventManager?: EventManager) {
    super(mcpTools);
    this.eventManager = eventManager || null;
  }

  /**
   * Set the event manager for cross-system communication
   */
  setEventManager(eventManager: EventManager): void {
    this.eventManager = eventManager;
  }



  /**
   * Apply meter effects with smooth animations
   */
  async animateChange(effects: MeterEffects, gameState: GameState): Promise<GameState> {
    const previousStability = gameState.meters.stability;
    const previousInsight = gameState.meters.insight;

    // Calculate target values
    const targetStability = this.clampValue(
      previousStability + effects.stability,
      0,
      100
    );
    const targetInsight = this.clampValue(
      previousInsight + effects.insight,
      0,
      100
    );

    // Create animations for both meters
    const stabilityAnimation = this.createMeterAnimation(
      'stability',
      previousStability,
      targetStability,
      this.calculateAnimationDuration(Math.abs(effects.stability))
    );

    const insightAnimation = this.createMeterAnimation(
      'insight',
      previousInsight,
      targetInsight,
      this.calculateAnimationDuration(Math.abs(effects.insight))
    );

    // Start animations
    const animationPromises = [
      this.runAnimation(stabilityAnimation),
      this.runAnimation(insightAnimation)
    ];

    // Calculate and trigger effects during animation
    const visualEffects = this.calculateVisualEffects({
      stability: targetStability,
      insight: targetInsight
    });

    const audioEffects = this.calculateAudioEffects({
      stability: targetStability,
      insight: targetInsight
    });

    // Trigger effects
    this.triggerVisualEffects(visualEffects);
    this.triggerAudioEffects(audioEffects);

    // Check for critical events
    const criticalEvents = this.checkCriticalThresholds({
      stability: targetStability,
      insight: targetInsight
    }, {
      stability: previousStability,
      insight: previousInsight
    });

    // Process critical events
    for (const event of criticalEvents) {
      await this.processCriticalEvent(event);
    }

    // Wait for animations to complete
    await Promise.all(animationPromises);

    // Apply the final state change using parent method
    const result = await super.applyEffects(effects, gameState);

    // Emit meter changed event for cross-system communication
    if (this.eventManager) {
      this.eventManager.emit({
        type: GameEventType.METER_CHANGED,
        timestamp: new Date(),
        source: 'DynamicMeterSystem',
        data: {
          previousValues: { stability: previousStability, insight: previousInsight },
          newValues: { stability: targetStability, insight: targetInsight },
          effects: { visual: visualEffects, audio: audioEffects },
          criticalEvents: criticalEvents
        },
        priority: 'medium'
      });
    }

    return result;
  }

  /**
   * Calculate visual effects based on meter levels
   */
  calculateVisualEffects(currentLevels: { stability: number; insight: number }): VisualEffectSet {
    const stability = currentLevels.stability;
    const insight = currentLevels.insight;

    // Screen distortion increases as stability decreases
    const screenDistortion = Math.max(0, (100 - stability) / 100 * 0.8);

    // Color shift based on stability and insight
    const colorShift: ColorShiftEffect = {
      hue: stability < 30 ? -20 + (30 - stability) * 2 : 0, // Red shift for low stability
      saturation: 1.0 + (insight / 100) * 0.5, // Higher saturation with more insight
      brightness: 0.8 + (stability / 100) * 0.4 // Dimmer when unstable
    };

    // Glitch intensity based on stability
    const glitchIntensity = stability < 40 ? (40 - stability) / 40 * 0.7 : 0;

    // Overlay effects
    const overlayEffects: OverlayEffect[] = [];

    if (stability < 60) {
      overlayEffects.push({
        type: 'scanlines',
        intensity: (60 - stability) / 60 * 0.3
      });
    }

    if (stability < 30) {
      overlayEffects.push({
        type: 'noise',
        intensity: (30 - stability) / 30 * 0.4,
        duration: 2000
      });
    }

    if (insight > 70) {
      overlayEffects.push({
        type: 'chromatic_aberration',
        intensity: (insight - 70) / 30 * 0.2
      });
    }

    overlayEffects.push({
      type: 'vignette',
      intensity: Math.max(0.1, (100 - stability) / 100 * 0.5)
    });

    return {
      screenDistortion,
      colorShift,
      glitchIntensity,
      overlayEffects
    };
  }

  /**
   * Calculate audio effects based on meter levels
   */
  calculateAudioEffects(currentLevels: { stability: number; insight: number }): AudioEffectSet {
    const stability = currentLevels.stability;
    const insight = currentLevels.insight;

    // Heartbeat intensity increases as stability decreases
    const heartbeatIntensity = Math.max(0, (100 - stability) / 100 * 0.8);

    // Whisper volume based on insight level
    const whisperVolume = insight > 50 ? (insight - 50) / 50 * 0.4 : 0;

    // Ambient tension based on overall state
    const ambientTension = Math.max(
      (100 - stability) / 100 * 0.6,
      insight > 80 ? (insight - 80) / 20 * 0.3 : 0
    );

    // Effect triggers
    const effectTriggers: AudioTrigger[] = [];

    if (stability < 25) {
      effectTriggers.push({
        type: 'warning',
        volume: 0.6,
        delay: 500
      });
    }

    if (insight > 75) {
      effectTriggers.push({
        type: 'whisper',
        volume: 0.4,
        delay: 1000,
        duration: 3000
      });
    }

    return {
      heartbeatIntensity,
      whisperVolume,
      ambientTension,
      effectTriggers
    };
  }

  /**
   * Check for critical threshold crossings
   */
  checkCriticalThresholds(
    currentLevels: { stability: number; insight: number },
    previousLevels: { stability: number; insight: number }
  ): CriticalEvent[] {
    const events: CriticalEvent[] = [];

    // Stability critical threshold
    if (previousLevels.stability > this.criticalThresholds.stability.critical && 
        currentLevels.stability <= this.criticalThresholds.stability.critical) {
      events.push({
        type: 'stability_warning',
        threshold: this.criticalThresholds.stability.critical,
        message: 'CRITICAL: System stability compromised! Kernel panic imminent!',
        effects: {
          screenDistortion: 0.8,
          colorShift: { hue: -30, saturation: 1.5, brightness: 0.6 },
          glitchIntensity: 0.9,
          overlayEffects: [
            { type: 'noise', intensity: 0.6, duration: 3000 },
            { type: 'scanlines', intensity: 0.8 }
          ],
          heartbeatIntensity: 0.9,
          whisperVolume: 0,
          ambientTension: 0.8,
          effectTriggers: [
            { type: 'warning', volume: 0.8, delay: 0 },
            { type: 'glitch', volume: 0.6, delay: 1000 }
          ]
        }
      });
    }

    // Insight breakthrough threshold
    if (previousLevels.insight < this.criticalThresholds.insight.breakthrough && 
        currentLevels.insight >= this.criticalThresholds.insight.breakthrough) {
      events.push({
        type: 'insight_breakthrough',
        threshold: this.criticalThresholds.insight.breakthrough,
        message: 'BREAKTHROUGH: Deep understanding achieved! New paths revealed!',
        effects: {
          screenDistortion: 0,
          colorShift: { hue: 10, saturation: 1.3, brightness: 1.2 },
          glitchIntensity: 0,
          overlayEffects: [
            { type: 'chromatic_aberration', intensity: 0.3, duration: 2000 }
          ],
          heartbeatIntensity: 0.2,
          whisperVolume: 0.5,
          ambientTension: 0.1,
          effectTriggers: [
            { type: 'success', volume: 0.7, delay: 0 },
            { type: 'whisper', volume: 0.4, delay: 1500, duration: 4000 }
          ]
        }
      });
    }

    // System failure (stability = 0)
    if (currentLevels.stability === 0) {
      events.push({
        type: 'system_failure',
        threshold: 0,
        message: 'SYSTEM FAILURE: Kernel panic! All systems compromised!',
        effects: {
          screenDistortion: 1.0,
          colorShift: { hue: -45, saturation: 0.5, brightness: 0.3 },
          glitchIntensity: 1.0,
          overlayEffects: [
            { type: 'noise', intensity: 1.0, duration: 5000 },
            { type: 'scanlines', intensity: 1.0 },
            { type: 'vignette', intensity: 0.8 }
          ],
          heartbeatIntensity: 0,
          whisperVolume: 0,
          ambientTension: 1.0,
          effectTriggers: [
            { type: 'glitch', volume: 1.0, delay: 0, duration: 3000 }
          ]
        }
      });
    }

    return events;
  }

  /**
   * Register effect callback for UI updates
   */
  registerEffectCallback(type: string, callback: (effects: VisualEffectSet | AudioEffectSet) => void): void {
    this.effectCallbacks.set(type, callback);
  }

  /**
   * Unregister effect callback
   */
  unregisterEffectCallback(type: string): void {
    this.effectCallbacks.delete(type);
  }

  /**
   * Get current active animations
   */
  getActiveAnimations(): MeterAnimation[] {
    return Array.from(this.activeAnimations.values());
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    this.activeAnimations.clear();
  }

  /**
   * Create meter animation configuration
   */
  private createMeterAnimation(
    meterId: string,
    startValue: number,
    endValue: number,
    duration: number
  ): MeterAnimation {
    return {
      id: `${meterId}_${Date.now()}`,
      startValue,
      endValue,
      duration,
      easing: Math.abs(endValue - startValue) > 20 ? 'ease-out' : 'ease-in-out'
    };
  }

  /**
   * Run animation with easing
   */
  private async runAnimation(animation: MeterAnimation): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      this.activeAnimations.set(animation.id, animation);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        
        // Apply easing function
        const easedProgress = this.applyEasing(progress, animation.easing);
        
        // Calculate current value
        const currentValue = animation.startValue + 
          (animation.endValue - animation.startValue) * easedProgress;

        // Call progress callback
        if (animation.onProgress) {
          animation.onProgress(progress, currentValue);
        }

        // Continue animation or complete
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.activeAnimations.delete(animation.id);
          if (animation.onComplete) {
            animation.onComplete();
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Apply easing function to progress
   */
  private applyEasing(progress: number, easing: MeterAnimation['easing']): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        if (progress < 1 / 2.75) {
          return 7.5625 * progress * progress;
        } else if (progress < 2 / 2.75) {
          return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
        } else if (progress < 2.5 / 2.75) {
          return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
        } else {
          return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
        }
      default:
        return progress;
    }
  }

  /**
   * Calculate animation duration based on change magnitude
   */
  private calculateAnimationDuration(changeMagnitude: number): number {
    // Base duration of 800ms, with additional time for larger changes
    const baseDuration = 800;
    const additionalDuration = Math.min(changeMagnitude * 20, 1200);
    return baseDuration + additionalDuration;
  }

  /**
   * Trigger visual effects through callbacks
   */
  private triggerVisualEffects(effects: VisualEffectSet): void {
    const callback = this.effectCallbacks.get('visual');
    if (callback) {
      callback(effects);
    }
  }

  /**
   * Trigger audio effects through callbacks
   */
  private triggerAudioEffects(effects: AudioEffectSet): void {
    const callback = this.effectCallbacks.get('audio');
    if (callback) {
      callback(effects);
    }
  }

  /**
   * Process critical event
   */
  private async processCriticalEvent(event: CriticalEvent): Promise<void> {
    // Trigger visual effects
    this.triggerVisualEffects({
      screenDistortion: event.effects.screenDistortion,
      colorShift: event.effects.colorShift,
      glitchIntensity: event.effects.glitchIntensity,
      overlayEffects: event.effects.overlayEffects
    });

    // Trigger audio effects
    this.triggerAudioEffects({
      heartbeatIntensity: event.effects.heartbeatIntensity,
      whisperVolume: event.effects.whisperVolume,
      ambientTension: event.effects.ambientTension,
      effectTriggers: event.effects.effectTriggers
    });

    // Log critical event
    console.log(`Critical Event: ${event.type} - ${event.message}`);
  }

  /**
   * Initialize effect system
   */
  private initializeEffectSystem(): void {
    // Set up default effect callbacks that log to console
    this.registerEffectCallback('visual', (effects) => {
      console.log('Visual effects triggered:', effects);
    });

    this.registerEffectCallback('audio', (effects) => {
      console.log('Audio effects triggered:', effects);
    });
  }

  /**
   * Clamp value within bounds (inherited from parent but made accessible)
   */
  protected clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}