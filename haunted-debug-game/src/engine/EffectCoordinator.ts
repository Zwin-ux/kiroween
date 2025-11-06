/**
 * EffectCoordinator - Synchronizes visual and audio effects with gameplay events
 * Implements comprehensive effect coordination with accessibility and performance optimization
 */

import { EffectsSystemImpl, type EffectsSystem } from './EffectsSystem';
import { EventManager, GameEventType, type GameEvent } from './EventManager';
import type { 
  AccessibilitySettings, 
  EffectCoordinatorState, 
  ActiveEffect, 
  QueuedEffect 
} from '@/types/game';

export interface EffectTrigger {
  eventType: GameEventType;
  effects: EffectSet;
  priority: EffectPriority;
  conditions?: EffectCondition[];
}

export interface EffectSet {
  visual?: VisualEffect[];
  audio?: AudioEffect[];
  duration?: number;
  intensity?: number;
  accessibility?: AccessibilityOverride;
}

export interface VisualEffect {
  type: 'screen_shake' | 'glitch' | 'color_shift' | 'distortion' | 'overlay' | 'flash' | 'fade';
  intensity: number;
  duration?: number;
  parameters?: Record<string, any>;
}

export interface AudioEffect {
  type: 'heartbeat' | 'whisper' | 'tension' | 'warning' | 'success' | 'glitch' | 'ambient';
  volume: number;
  duration?: number;
  parameters?: Record<string, any>;
}

export interface AccessibilityOverride {
  reduceMotion?: boolean;
  disableFlashing?: boolean;
  maxIntensity?: number;
  alternativeEffect?: EffectSet;
}

export interface EffectCondition {
  type: 'meter_threshold' | 'room_id' | 'ghost_type' | 'time_of_day' | 'performance_mode';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export type EffectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface PerformanceSettings {
  mode: 'high' | 'medium' | 'low';
  maxConcurrentEffects: number;
  effectQualityScale: number;
  enableBatching: boolean;
  frameRateTarget: number;
}

export interface EffectCoordinator {
  initialize(): Promise<void>;
  
  // Core effect processing
  processMeterChange(effects: any): Promise<void>;
  processEncounterStart(eventData: any): Promise<void>;
  processRoomChange(eventData: any): Promise<void>;
  
  // Enhanced effect coordination
  registerEffectTrigger(trigger: EffectTrigger): string;
  unregisterEffectTrigger(triggerId: string): boolean;
  triggerEffect(effectSet: EffectSet, source: string): Promise<string>;
  stopEffect(effectId: string): Promise<void>;
  
  // Effect priority and conflict resolution
  resolveEffectConflicts(newEffect: EffectSet, activeEffects: ActiveEffect[]): EffectResolution;
  prioritizeEffects(effects: ActiveEffect[]): ActiveEffect[];
  
  // Accessibility integration
  applyAccessibilityConstraints(effectSet: EffectSet): EffectSet;
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void;
  getAccessibilitySettings(): AccessibilitySettings;
  
  // Performance optimization
  updatePerformanceSettings(settings: Partial<PerformanceSettings>): void;
  getPerformanceMetrics(): PerformanceMetrics;
  optimizeForDevice(deviceCapabilities: DeviceCapabilities): void;
  
  // State management
  cleanup(): void;
  getState(): EffectCoordinatorState;
  restoreState(state: EffectCoordinatorState): Promise<void>;
  
  // Enhanced encounter integration methods
  processEncounterComplete(eventData: any): Promise<void>;
  processPatchApplication(eventData: any): Promise<void>;
  processPatchGeneration(eventData: any): Promise<void>;
  processDialogueChoice(eventData: any): Promise<void>;
  processVisualEffectTrigger(eventData: any): Promise<void>;
}

export interface EffectResolution {
  action: 'allow' | 'queue' | 'replace' | 'merge' | 'reject';
  conflictingEffects: string[];
  modifiedEffect?: EffectSet;
}

export interface PerformanceMetrics {
  frameRate: number;
  effectCount: number;
  memoryUsage: number;
  processingTime: number;
  droppedFrames: number;
}

export interface DeviceCapabilities {
  gpu: 'high' | 'medium' | 'low';
  memory: number; // MB
  cores: number;
  isMobile: boolean;
  supportsWebGL: boolean;
}

export class EffectCoordinatorImpl implements EffectCoordinator {
  private isInitialized: boolean = false;
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private effectQueue: QueuedEffect[] = [];
  private effectTriggers: Map<string, EffectTrigger> = new Map();
  private accessibilitySettings: AccessibilitySettings;
  private performanceSettings: PerformanceSettings;
  private performanceMonitor: PerformanceMonitor;
  private deviceCapabilities: DeviceCapabilities | null = null;

  constructor(
    private effectsSystem: EffectsSystem,
    private eventManager: EventManager
  ) {
    // Initialize default settings
    this.accessibilitySettings = {
      reduceMotion: false,
      disableFlashing: false,
      visualEffectIntensity: 1.0,
      audioEffectVolume: 1.0,
      alternativeText: false,
      highContrast: false,
      screenReaderSupport: false
    };

    this.performanceSettings = {
      mode: 'high',
      maxConcurrentEffects: 10,
      effectQualityScale: 1.0,
      enableBatching: true,
      frameRateTarget: 60
    };

    this.performanceMonitor = new PerformanceMonitor();
    this.setupEventListeners();
  }

  /**
   * Initialize the effect coordinator with enhanced capabilities
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load settings from storage
      this.loadAccessibilitySettings();
      this.loadPerformanceSettings();
      
      // Detect device capabilities
      this.deviceCapabilities = await this.detectDeviceCapabilities();
      
      // Auto-optimize for device if needed
      if (this.deviceCapabilities.isMobile || this.deviceCapabilities.gpu === 'low') {
        this.optimizeForDevice(this.deviceCapabilities);
      }
      
      // Initialize effects system
      await this.effectsSystem.initialize?.();
      
      // Start performance monitoring
      this.performanceMonitor.start();
      
      // Register default effect triggers
      this.registerDefaultEffectTriggers();
      
      this.isInitialized = true;
      console.log('EffectCoordinator initialized with enhanced capabilities');

    } catch (error) {
      console.error('Failed to initialize EffectCoordinator:', error);
      throw error;
    }
  }

  /**
   * Register an effect trigger for automatic coordination
   */
  registerEffectTrigger(trigger: EffectTrigger): string {
    const triggerId = this.generateTriggerId();
    this.effectTriggers.set(triggerId, trigger);
    return triggerId;
  }

  /**
   * Unregister an effect trigger
   */
  unregisterEffectTrigger(triggerId: string): boolean {
    return this.effectTriggers.delete(triggerId);
  }

  /**
   * Trigger an effect set with coordination and conflict resolution
   */
  async triggerEffect(effectSet: EffectSet, source: string): Promise<string> {
    if (!this.isInitialized) {
      console.warn('EffectCoordinator not initialized, queuing effect');
      const queuedEffect: QueuedEffect = {
        type: 'manual_trigger',
        data: { effectSet, source },
        priority: 'medium',
        queuedAt: new Date()
      };
      this.effectQueue.push(queuedEffect);
      return 'queued';
    }

    try {
      // Apply accessibility constraints
      const constrainedEffectSet = this.applyAccessibilityConstraints(effectSet);
      
      // Check performance limits
      if (!this.canProcessEffect(constrainedEffectSet)) {
        console.warn('Effect rejected due to performance constraints');
        return 'rejected';
      }

      // Resolve conflicts with active effects
      const resolution = this.resolveEffectConflicts(constrainedEffectSet, Array.from(this.activeEffects.values()));
      
      if (resolution.action === 'reject') {
        console.warn('Effect rejected due to conflicts:', resolution.conflictingEffects);
        return 'rejected';
      }

      // Generate effect ID
      const effectId = this.generateEffectId(source);
      
      // Create active effect record
      const activeEffect: ActiveEffect = {
        id: effectId,
        type: source,
        intensity: constrainedEffectSet.intensity || 1.0,
        startTime: new Date(),
        duration: constrainedEffectSet.duration
      };

      // Handle conflict resolution
      switch (resolution.action) {
        case 'replace':
          // Stop conflicting effects
          for (const conflictId of resolution.conflictingEffects) {
            await this.stopEffect(conflictId);
          }
          break;
        case 'queue':
          // Queue for later processing
          this.effectQueue.push({
            type: 'deferred_trigger',
            data: { effectSet: constrainedEffectSet, source },
            priority: 'medium',
            queuedAt: new Date()
          });
          return 'queued';
        case 'merge':
          // Use modified effect from resolution
          if (resolution.modifiedEffect) {
            return this.triggerEffect(resolution.modifiedEffect, source);
          }
          break;
      }

      // Process visual effects
      if (constrainedEffectSet.visual) {
        for (const visualEffect of constrainedEffectSet.visual) {
          await this.processVisualEffect(visualEffect, effectId);
        }
      }

      // Process audio effects
      if (constrainedEffectSet.audio) {
        for (const audioEffect of constrainedEffectSet.audio) {
          await this.processAudioEffect(audioEffect, effectId);
        }
      }

      // Register active effect
      this.activeEffects.set(effectId, activeEffect);

      // Schedule cleanup if duration is specified
      if (constrainedEffectSet.duration) {
        setTimeout(() => {
          this.stopEffect(effectId);
        }, constrainedEffectSet.duration);
      }

      // Update performance metrics
      this.performanceMonitor.recordEffect(effectId, constrainedEffectSet);

      return effectId;

    } catch (error) {
      console.error('Failed to trigger effect:', error);
      return 'error';
    }
  }

  /**
   * Stop a specific effect
   */
  async stopEffect(effectId: string): Promise<void> {
    try {
      const effect = this.activeEffects.get(effectId);
      if (!effect) {
        return;
      }

      // Stop effect in effects system
      this.effectsSystem.stopEffect?.(effectId);

      // Remove from active effects
      this.activeEffects.delete(effectId);

      // Update performance metrics
      this.performanceMonitor.recordEffectStop(effectId);

      console.log(`Stopped effect: ${effectId}`);

    } catch (error) {
      console.error(`Failed to stop effect ${effectId}:`, error);
    }
  }

  /**
   * Resolve effect conflicts using priority and compatibility rules
   */
  resolveEffectConflicts(newEffect: EffectSet, activeEffects: ActiveEffect[]): EffectResolution {
    const conflictingEffects: string[] = [];
    
    // Check for incompatible effects
    for (const activeEffect of activeEffects) {
      if (this.areEffectsIncompatible(newEffect, activeEffect)) {
        conflictingEffects.push(activeEffect.id);
      }
    }

    // No conflicts - allow effect
    if (conflictingEffects.length === 0) {
      return { action: 'allow', conflictingEffects: [] };
    }

    // Check if we're at max concurrent effects
    if (activeEffects.length >= this.performanceSettings.maxConcurrentEffects) {
      // Find lowest priority effect to replace
      const lowestPriorityEffect = this.findLowestPriorityEffect(activeEffects);
      if (lowestPriorityEffect && this.getEffectPriority(newEffect) > this.getEffectPriority(lowestPriorityEffect)) {
        return { 
          action: 'replace', 
          conflictingEffects: [lowestPriorityEffect.id] 
        };
      } else {
        return { action: 'queue', conflictingEffects };
      }
    }

    // Try to merge compatible effects
    const mergedEffect = this.tryMergeEffects(newEffect, activeEffects);
    if (mergedEffect) {
      return { 
        action: 'merge', 
        conflictingEffects, 
        modifiedEffect: mergedEffect 
      };
    }

    // Default to replacing conflicting effects if new effect has higher priority
    const hasHigherPriority = conflictingEffects.every(id => {
      const conflictingEffect = activeEffects.find(e => e.id === id);
      return conflictingEffect && this.getEffectPriority(newEffect) > this.getEffectPriority(conflictingEffect);
    });

    if (hasHigherPriority) {
      return { action: 'replace', conflictingEffects };
    }

    return { action: 'queue', conflictingEffects };
  }

  /**
   * Prioritize effects based on importance and urgency
   */
  prioritizeEffects(effects: ActiveEffect[]): ActiveEffect[] {
    return effects.sort((a, b) => {
      const priorityA = this.getEffectPriority(a);
      const priorityB = this.getEffectPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // If same priority, sort by start time (newer first)
      return b.startTime.getTime() - a.startTime.getTime();
    });
  }

  /**
   * Apply accessibility constraints to effect set
   */
  applyAccessibilityConstraints(effectSet: EffectSet): EffectSet {
    const constrainedEffect: EffectSet = { ...effectSet };

    // Apply global intensity scaling
    if (constrainedEffect.intensity) {
      constrainedEffect.intensity *= this.accessibilitySettings.visualEffectIntensity;
    }

    // Process visual effects
    if (constrainedEffect.visual) {
      constrainedEffect.visual = constrainedEffect.visual.map(effect => {
        let constrainedVisualEffect = { ...effect };

        // Reduce motion if requested
        if (this.accessibilitySettings.reduceMotion) {
          if (effect.type === 'screen_shake' || effect.type === 'distortion') {
            constrainedVisualEffect.intensity *= 0.3;
          }
        }

        // Disable flashing effects if requested
        if (this.accessibilitySettings.disableFlashing) {
          if (effect.type === 'flash' || effect.type === 'glitch') {
            // Replace with alternative effect
            constrainedVisualEffect = {
              type: 'fade',
              intensity: effect.intensity * 0.5,
              duration: effect.duration
            };
          }
        }

        // Apply high contrast adjustments
        if (this.accessibilitySettings.highContrast) {
          if (effect.type === 'color_shift') {
            constrainedVisualEffect.intensity *= 1.5;
          }
        }

        return constrainedVisualEffect;
      });
    }

    // Process audio effects
    if (constrainedEffect.audio) {
      constrainedEffect.audio = constrainedEffect.audio.map(effect => ({
        ...effect,
        volume: effect.volume * this.accessibilitySettings.audioEffectVolume
      }));
    }

    // Use alternative effect if provided and accessibility constraints are strict
    if (effectSet.accessibility?.alternativeEffect && 
        (this.accessibilitySettings.reduceMotion || this.accessibilitySettings.disableFlashing)) {
      return this.applyAccessibilityConstraints(effectSet.accessibility.alternativeEffect);
    }

    return constrainedEffect;
  }

  /**
   * Update accessibility settings
   */
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void {
    this.accessibilitySettings = {
      ...this.accessibilitySettings,
      ...settings
    };
    
    this.saveAccessibilitySettings();
    
    // Re-evaluate active effects with new settings
    this.reapplyAccessibilityConstraints();
  }

  /**
   * Get current accessibility settings
   */
  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.accessibilitySettings };
  }

  /**
   * Process meter change events and trigger appropriate effects
   */
  async processMeterChange(effects: any): Promise<void> {
    if (!this.isInitialized) {
      console.warn('EffectCoordinator not initialized, queuing meter change effects');
      this.effectQueue.push({ 
        type: 'meter_change', 
        data: effects, 
        priority: 'medium', 
        queuedAt: new Date() 
      });
      return;
    }

    try {
      // Create effect set based on meter changes
      const effectSet = this.createMeterEffectSet(effects);
      
      // Trigger coordinated effects
      await this.triggerEffect(effectSet, 'meter_system');

      console.log('Processed meter change effects:', effects);

    } catch (error) {
      console.error('Failed to process meter change effects:', error);
    }
  }

  /**
   * Process encounter start events and trigger atmospheric effects
   */
  async processEncounterStart(eventData: any): Promise<void> {
    if (!this.isInitialized) {
      console.warn('EffectCoordinator not initialized, queuing encounter start effects');
      this.effectQueue.push({ type: 'encounter_start', eventData });
      return;
    }

    try {
      const { ghostId, roomId } = eventData;

      // Trigger encounter atmosphere effects
      await this.triggerEncounterAtmosphere(ghostId, roomId);

      // Start ambient effects for the encounter
      await this.startAmbientEffects(ghostId);

      console.log(`Processed encounter start effects for ghost ${ghostId} in room ${roomId}`);

    } catch (error) {
      console.error('Failed to process encounter start effects:', error);
    }
  }

  /**
   * Process room change events and update environmental effects
   */
  async processRoomChange(eventData: any): Promise<void> {
    if (!this.isInitialized) {
      console.warn('EffectCoordinator not initialized, queuing room change effects');
      this.effectQueue.push({ type: 'room_change', eventData });
      return;
    }

    try {
      const { roomId, previousRoom } = eventData;

      // Fade out previous room effects
      if (previousRoom) {
        await this.fadeOutRoomEffects(previousRoom);
      }

      // Trigger new room atmosphere
      await this.triggerRoomAtmosphere(roomId);

      console.log(`Processed room change effects: ${previousRoom} -> ${roomId}`);

    } catch (error) {
      console.error('Failed to process room change effects:', error);
    }
  }

  /**
   * Update performance settings
   */
  updatePerformanceSettings(settings: Partial<PerformanceSettings>): void {
    this.performanceSettings = {
      ...this.performanceSettings,
      ...settings
    };
    
    this.savePerformanceSettings();
    
    // Apply performance optimizations immediately
    this.applyPerformanceOptimizations();
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Optimize for specific device capabilities
   */
  optimizeForDevice(deviceCapabilities: DeviceCapabilities): void {
    this.deviceCapabilities = deviceCapabilities;
    
    // Adjust performance settings based on device
    if (deviceCapabilities.isMobile) {
      this.updatePerformanceSettings({
        mode: 'medium',
        maxConcurrentEffects: 5,
        effectQualityScale: 0.7,
        frameRateTarget: 30
      });
    }
    
    if (deviceCapabilities.gpu === 'low') {
      this.updatePerformanceSettings({
        mode: 'low',
        maxConcurrentEffects: 3,
        effectQualityScale: 0.5,
        enableBatching: true
      });
    }
    
    if (deviceCapabilities.memory < 2048) { // Less than 2GB RAM
      this.updatePerformanceSettings({
        maxConcurrentEffects: Math.min(this.performanceSettings.maxConcurrentEffects, 4),
        enableBatching: true
      });
    }

    console.log('Optimized for device capabilities:', deviceCapabilities);
  }

  /**
   * Get coordinator state for persistence
   */
  getState(): EffectCoordinatorState {
    return {
      activeEffects: Array.from(this.activeEffects.values()),
      accessibilitySettings: this.accessibilitySettings,
      effectQueue: this.effectQueue,
      performanceMode: this.performanceSettings.mode
    };
  }

  /**
   * Restore coordinator state from persistence
   */
  async restoreState(state: EffectCoordinatorState): Promise<void> {
    // Restore active effects
    if (state.activeEffects) {
      this.activeEffects.clear();
      for (const effect of state.activeEffects) {
        this.activeEffects.set(effect.id, effect);
      }
    }
    
    // Restore settings
    if (state.accessibilitySettings) {
      this.accessibilitySettings = state.accessibilitySettings;
    }
    
    if (state.effectQueue) {
      this.effectQueue = state.effectQueue;
    }
    
    if (state.performanceMode) {
      this.updatePerformanceSettings({ mode: state.performanceMode });
    }

    // Process any queued effects
    await this.processQueuedEffects();
  }

  /**
   * Cleanup resources and stop all effects
   */
  cleanup(): void {
    // Stop all active effects
    for (const [effectId, effect] of this.activeEffects.entries()) {
      try {
        this.stopEffect(effectId);
      } catch (error) {
        console.error(`Error stopping effect ${effectId}:`, error);
      }
    }

    this.activeEffects.clear();
    this.effectQueue = [];
    this.isInitialized = false;

    console.log('EffectCoordinator cleanup completed');
  }

  /**
   * Set up event listeners for automatic effect coordination
   */
  private setupEventListeners(): void {
    // Listen for meter changes
    this.eventManager.on(GameEventType.METER_CHANGED, async (event: GameEvent) => {
      await this.processMeterChange(event.data.effects);
    });

    // Listen for encounter events
    this.eventManager.on(GameEventType.ENCOUNTER_STARTED, async (event: GameEvent) => {
      await this.processEncounterStart(event.data);
    });

    this.eventManager.on(GameEventType.ENCOUNTER_COMPLETED, async (event: GameEvent) => {
      await this.processEncounterComplete(event.data);
    });

    // Listen for patch events
    this.eventManager.on(GameEventType.PATCH_APPLIED, async (event: GameEvent) => {
      await this.processPatchApplication(event.data);
    });

    this.eventManager.on(GameEventType.PATCH_GENERATED, async (event: GameEvent) => {
      await this.processPatchGeneration(event.data);
    });

    // Listen for dialogue events
    this.eventManager.on(GameEventType.DIALOGUE_CHOICE_MADE, async (event: GameEvent) => {
      await this.processDialogueChoice(event.data);
    });

    // Listen for room changes
    this.eventManager.on(GameEventType.ROOM_ENTERED, async (event: GameEvent) => {
      await this.processRoomChange(event.data);
    });

    // Listen for critical events
    this.eventManager.on(GameEventType.CRITICAL_EVENT, async (event: GameEvent) => {
      await this.processCriticalEvent(event.data);
    });

    // Listen for visual effect triggers
    this.eventManager.on(GameEventType.VISUAL_EFFECT_TRIGGERED, async (event: GameEvent) => {
      await this.processVisualEffectTrigger(event.data);
    });
  }

  /**
   * Load accessibility settings from storage
   */
  private loadAccessibilitySettings(): void {
    try {
      const stored = localStorage.getItem('haunted-debug-accessibility');
      if (stored) {
        this.accessibilitySettings = JSON.parse(stored);
      } else {
        // Default accessibility settings
        this.accessibilitySettings = {
          reduceMotion: false,
          disableFlashing: false,
          visualEffectIntensity: 1.0,
          audioEffectVolume: 1.0,
          alternativeText: false,
          highContrast: false,
          screenReaderSupport: false
        };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
      this.accessibilitySettings = {
        reduceMotion: false,
        disableFlashing: false,
        visualEffectIntensity: 1.0,
        audioEffectVolume: 1.0,
        alternativeText: false,
        highContrast: false,
        screenReaderSupport: false
      };
    }
  }

  /**
   * Save accessibility settings to storage
   */
  private saveAccessibilitySettings(): void {
    try {
      localStorage.setItem('haunted-debug-accessibility', 
        JSON.stringify(this.accessibilitySettings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Calculate effect intensity based on meter changes
   */
  private calculateEffectIntensity(effects: any): number {
    const maxChange = Math.max(Math.abs(effects.stability || 0), Math.abs(effects.insight || 0));
    
    // Normalize to 0-1 range (assuming max change is around 50)
    let intensity = Math.min(1.0, maxChange / 50);
    
    // Apply accessibility settings
    intensity *= this.accessibilitySettings.visualEffectIntensity || 1.0;
    
    return intensity;
  }

  /**
   * Trigger stability-related effects
   */
  private async triggerStabilityEffects(stabilityChange: number, intensity: number): Promise<void> {
    try {
      if (stabilityChange < 0) {
        // Negative stability - system instability effects
        await this.effectsSystem.triggerVisualEffect({
          type: 'screen_shake',
          intensity: intensity * Math.abs(stabilityChange) / 20,
          duration: 1000
        });

        await this.effectsSystem.triggerAudioEffect({
          type: 'system_warning',
          volume: this.accessibilitySettings.audioEffectVolume || 1.0,
          pitch: 1.0 + (intensity * 0.5)
        });

        // Add visual distortion for severe stability loss
        if (Math.abs(stabilityChange) > 20) {
          await this.effectsSystem.triggerVisualEffect({
            type: 'glitch',
            intensity: intensity,
            duration: 2000
          });
        }

      } else {
        // Positive stability - system recovery effects
        await this.effectsSystem.triggerVisualEffect({
          type: 'stabilization',
          intensity: intensity,
          duration: 1500
        });

        await this.effectsSystem.triggerAudioEffect({
          type: 'system_recovery',
          volume: this.accessibilitySettings.audioEffectVolume || 1.0
        });
      }

    } catch (error) {
      console.error('Failed to trigger stability effects:', error);
    }
  }

  /**
   * Trigger insight-related effects
   */
  private async triggerInsightEffects(insightChange: number, intensity: number): Promise<void> {
    try {
      if (insightChange > 0) {
        // Positive insight - enlightenment effects
        await this.effectsSystem.triggerVisualEffect({
          type: 'insight_glow',
          intensity: intensity,
          duration: 2000,
          color: 'blue'
        });

        await this.effectsSystem.triggerAudioEffect({
          type: 'insight_chime',
          volume: this.accessibilitySettings.audioEffectVolume || 1.0,
          pitch: 1.0 + (intensity * 0.3)
        });

        // Special effect for major insights
        if (insightChange > 15) {
          await this.effectsSystem.triggerVisualEffect({
            type: 'revelation',
            intensity: intensity,
            duration: 3000
          });
        }

      } else {
        // Negative insight - confusion effects
        await this.effectsSystem.triggerVisualEffect({
          type: 'confusion',
          intensity: intensity * 0.7,
          duration: 1500
        });

        await this.effectsSystem.triggerAudioEffect({
          type: 'confusion_static',
          volume: (this.accessibilitySettings.audioEffectVolume || 1.0) * 0.8
        });
      }

    } catch (error) {
      console.error('Failed to trigger insight effects:', error);
    }
  }

  /**
   * Trigger encounter atmosphere effects
   */
  private async triggerEncounterAtmosphere(ghostId: string, roomId: string): Promise<void> {
    try {
      // Room-specific atmosphere
      const roomEffects = this.getRoomAtmosphereEffects(roomId);
      for (const effect of roomEffects) {
        await this.effectsSystem.triggerVisualEffect(effect);
      }

      // Ghost-specific effects
      const ghostEffects = this.getGhostAtmosphereEffects(ghostId);
      for (const effect of ghostEffects) {
        await this.effectsSystem.triggerVisualEffect(effect);
      }

      // Start encounter audio atmosphere
      await this.effectsSystem.triggerAudioEffect({
        type: 'encounter_atmosphere',
        loop: true,
        volume: (this.accessibilitySettings.audioEffectVolume || 1.0) * 0.6,
        roomId,
        ghostId
      });

    } catch (error) {
      console.error('Failed to trigger encounter atmosphere:', error);
    }
  }

  /**
   * Start ambient effects for encounter
   */
  private async startAmbientEffects(ghostId: string): Promise<void> {
    const effectId = `ambient_${ghostId}_${Date.now()}`;
    
    try {
      const ambientEffect = {
        type: 'ambient_ghost',
        ghostId,
        loop: true,
        intensity: 0.5 * (this.accessibilitySettings.visualEffectIntensity || 1.0)
      };

      await this.effectsSystem.triggerVisualEffect(ambientEffect);
      this.activeEffects.set(effectId, ambientEffect);

    } catch (error) {
      console.error('Failed to start ambient effects:', error);
    }
  }

  /**
   * Fade out room effects when leaving
   */
  private async fadeOutRoomEffects(roomId: string): Promise<void> {
    try {
      // Find and stop room-specific effects
      for (const [effectId, effect] of this.activeEffects.entries()) {
        if (effect.roomId === roomId) {
          await this.effectsSystem.fadeOutEffect(effectId, 1000);
          this.activeEffects.delete(effectId);
        }
      }

    } catch (error) {
      console.error('Failed to fade out room effects:', error);
    }
  }

  /**
   * Trigger room atmosphere effects
   */
  private async triggerRoomAtmosphere(roomId: string): Promise<void> {
    try {
      const atmosphereEffects = this.getRoomAtmosphereEffects(roomId);
      
      for (const effect of atmosphereEffects) {
        const effectId = `room_${roomId}_${Date.now()}`;
        await this.effectsSystem.triggerVisualEffect({ ...effect, roomId });
        this.activeEffects.set(effectId, { ...effect, roomId });
      }

      // Room-specific audio atmosphere
      await this.effectsSystem.triggerAudioEffect({
        type: 'room_atmosphere',
        roomId,
        loop: true,
        volume: (this.accessibilitySettings.audioEffectVolume || 1.0) * 0.4
      });

    } catch (error) {
      console.error('Failed to trigger room atmosphere:', error);
    }
  }

  /**
   * Process critical events with dramatic effects
   */
  private async processCriticalEvent(eventData: any): Promise<void> {
    try {
      // Trigger dramatic visual effects
      await this.effectsSystem.triggerVisualEffect({
        type: 'critical_alert',
        intensity: 1.0,
        duration: 3000,
        priority: 'high'
      });

      // Trigger urgent audio cues
      await this.effectsSystem.triggerAudioEffect({
        type: 'critical_warning',
        volume: this.accessibilitySettings.audioEffectVolume || 1.0,
        priority: 'high'
      });

      console.log('Processed critical event effects:', eventData);

    } catch (error) {
      console.error('Failed to process critical event effects:', error);
    }
  }

  /**
   * Get room-specific atmosphere effects
   */
  private getRoomAtmosphereEffects(roomId: string): any[] {
    const roomEffectMap: Record<string, any[]> = {
      'boot-sector': [
        { type: 'system_boot', intensity: 0.6, duration: 2000 }
      ],
      'dependency-crypt': [
        { type: 'chain_rattle', intensity: 0.7, duration: 3000 },
        { type: 'import_shadows', intensity: 0.5, loop: true }
      ],
      'ghost-memory-heap': [
        { type: 'memory_leak', intensity: 0.8, loop: true },
        { type: 'allocation_sparks', intensity: 0.6, duration: 1500 }
      ],
      'possessed-compiler': [
        { type: 'compilation_errors', intensity: 0.9, duration: 2500 },
        { type: 'syntax_lightning', intensity: 0.7, loop: true }
      ],
      'ethics-tribunal': [
        { type: 'moral_weight', intensity: 0.8, duration: 4000 },
        { type: 'judgment_glow', intensity: 0.5, loop: true }
      ],
      'final-merge': [
        { type: 'convergence', intensity: 1.0, duration: 5000 },
        { type: 'merge_tension', intensity: 0.9, loop: true }
      ]
    };

    return roomEffectMap[roomId] || [
      { type: 'generic_haunted', intensity: 0.5, duration: 2000 }
    ];
  }

  /**
   * Get ghost-specific atmosphere effects
   */
  private getGhostAtmosphereEffects(ghostId: string): any[] {
    // This would be enhanced with actual ghost data
    return [
      { type: 'ghost_manifestation', ghostId, intensity: 0.7, duration: 2000 },
      { type: 'spectral_presence', ghostId, intensity: 0.5, loop: true }
    ];
  }

  /**
   * Stop a specific effect
   */
  private stopEffect(effectId: string): void {
    const effect = this.activeEffects.get(effectId);
    if (effect) {
      this.effectsSystem.stopEffect?.(effectId);
      this.activeEffects.delete(effectId);
    }
  }

  /**
   * Process encounter completion events
   */
  async processEncounterComplete(eventData: any): Promise<void> {
    try {
      const { sessionId, outcome } = eventData;

      // Fade out encounter-specific effects
      await this.fadeOutEncounterEffects(sessionId);

      // Trigger completion effects based on outcome
      if (outcome.success) {
        await this.triggerSuccessEffects(outcome);
      } else {
        await this.triggerFailureEffects(outcome);
      }

      console.log(`Processed encounter completion effects for session ${sessionId}`);

    } catch (error) {
      console.error('Failed to process encounter completion effects:', error);
    }
  }

  /**
   * Process patch application events with dynamic effects
   */
  async processPatchApplication(eventData: any): Promise<void> {
    try {
      const { action, success, consequences, patchId } = eventData;

      // Trigger action-specific effects
      await this.triggerPatchActionEffects(action, success);

      // Process consequence effects if present
      if (consequences > 0) {
        await this.triggerConsequenceEffects(consequences, success);
      }

      // Add patch-specific visual feedback
      await this.triggerPatchFeedbackEffects(patchId, action, success);

      console.log(`Processed patch application effects: ${action} (${success ? 'success' : 'failure'})`);

    } catch (error) {
      console.error('Failed to process patch application effects:', error);
    }
  }

  /**
   * Process patch generation events
   */
  async processPatchGeneration(eventData: any): Promise<void> {
    try {
      const { ghostId, patchCount, intent } = eventData;

      // Trigger patch generation visual cues
      await this.effectsSystem.triggerVisualEffect({
        type: 'patch_generation',
        intensity: 0.6,
        duration: 1500,
        ghostId
      });

      // Audio cue for patch generation
      await this.effectsSystem.triggerAudioEffect({
        type: 'code_analysis',
        volume: (this.accessibilitySettings.audioEffectVolume || 1.0) * 0.5,
        pitch: 1.0 + (patchCount * 0.1)
      });

      console.log(`Processed patch generation effects: ${patchCount} patches for ghost ${ghostId}`);

    } catch (error) {
      console.error('Failed to process patch generation effects:', error);
    }
  }

  /**
   * Process dialogue choice events
   */
  async processDialogueChoice(eventData: any): Promise<void> {
    try {
      const { choice, ghostId, isReadyForDebugging } = eventData;

      // Trigger dialogue interaction effects
      await this.effectsSystem.triggerVisualEffect({
        type: 'dialogue_pulse',
        intensity: 0.4,
        duration: 800
      });

      // Special effects when ready for debugging
      if (isReadyForDebugging) {
        await this.triggerDebuggingReadyEffects(ghostId);
      }

      console.log(`Processed dialogue choice effects for ghost ${ghostId}`);

    } catch (error) {
      console.error('Failed to process dialogue choice effects:', error);
    }
  }

  /**
   * Process visual effect trigger events for coordination
   */
  async processVisualEffectTrigger(eventData: any): Promise<void> {
    try {
      const { sessionId, consequenceId, effectType, severity } = eventData;

      // Coordinate with other systems based on effect type
      if (effectType === 'meter_change' && severity === 'critical') {
        await this.triggerCriticalSystemEffects();
      }

      // Track effect for session management
      this.activeEffects.set(`session_${sessionId}_${consequenceId}`, {
        sessionId,
        consequenceId,
        effectType,
        severity,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to process visual effect trigger:', error);
    }
  }

  /**
   * Trigger success effects for encounter completion
   */
  private async triggerSuccessEffects(outcome: any): Promise<void> {
    try {
      // Visual success effects
      await this.effectsSystem.triggerVisualEffect({
        type: 'success_burst',
        intensity: 0.8,
        duration: 2500,
        color: 'green'
      });

      // Audio success cue
      await this.effectsSystem.triggerAudioEffect({
        type: 'success_fanfare',
        volume: this.accessibilitySettings.audioEffectVolume || 1.0
      });

      // Special effects for high achievement
      if (outcome.learningAchievements && outcome.learningAchievements.length > 2) {
        await this.effectsSystem.triggerVisualEffect({
          type: 'achievement_celebration',
          intensity: 1.0,
          duration: 4000
        });
      }

    } catch (error) {
      console.error('Failed to trigger success effects:', error);
    }
  }

  /**
   * Trigger failure effects for encounter completion
   */
  private async triggerFailureEffects(outcome: any): Promise<void> {
    try {
      // Visual failure effects
      await this.effectsSystem.triggerVisualEffect({
        type: 'system_failure',
        intensity: 0.9,
        duration: 3000,
        color: 'red'
      });

      // Audio failure cue
      await this.effectsSystem.triggerAudioEffect({
        type: 'system_crash',
        volume: this.accessibilitySettings.audioEffectVolume || 1.0
      });

      // Recovery encouragement effects
      setTimeout(async () => {
        await this.effectsSystem.triggerVisualEffect({
          type: 'recovery_hint',
          intensity: 0.5,
          duration: 2000
        });
      }, 2000);

    } catch (error) {
      console.error('Failed to trigger failure effects:', error);
    }
  }

  /**
   * Trigger patch action-specific effects
   */
  private async triggerPatchActionEffects(action: string, success: boolean): Promise<void> {
    try {
      switch (action) {
        case 'apply':
          await this.effectsSystem.triggerVisualEffect({
            type: success ? 'patch_apply_success' : 'patch_apply_failure',
            intensity: success ? 0.6 : 0.8,
            duration: success ? 1500 : 2500,
            color: success ? 'blue' : 'red'
          });
          break;

        case 'refactor':
          await this.effectsSystem.triggerVisualEffect({
            type: 'code_refactor',
            intensity: 0.7,
            duration: 2000,
            color: 'purple'
          });
          break;

        case 'question':
          await this.effectsSystem.triggerVisualEffect({
            type: 'thinking_pulse',
            intensity: 0.5,
            duration: 1200,
            color: 'yellow'
          });
          break;

        case 'reject':
          await this.effectsSystem.triggerVisualEffect({
            type: 'caution_glow',
            intensity: 0.4,
            duration: 1000,
            color: 'orange'
          });
          break;
      }

      // Action-specific audio
      await this.effectsSystem.triggerAudioEffect({
        type: `action_${action}`,
        volume: (this.accessibilitySettings.audioEffectVolume || 1.0) * 0.7,
        success
      });

    } catch (error) {
      console.error('Failed to trigger patch action effects:', error);
    }
  }

  /**
   * Trigger consequence-based effects
   */
  private async triggerConsequenceEffects(consequenceCount: number, success: boolean): Promise<void> {
    try {
      const intensity = Math.min(1.0, consequenceCount / 5); // Scale with consequence count

      if (success) {
        await this.effectsSystem.triggerVisualEffect({
          type: 'positive_consequence',
          intensity: intensity * 0.6,
          duration: 1500 + (consequenceCount * 200)
        });
      } else {
        await this.effectsSystem.triggerVisualEffect({
          type: 'negative_consequence',
          intensity: intensity * 0.8,
          duration: 2000 + (consequenceCount * 300)
        });
      }

    } catch (error) {
      console.error('Failed to trigger consequence effects:', error);
    }
  }

  /**
   * Trigger patch feedback effects
   */
  private async triggerPatchFeedbackEffects(patchId: string, action: string, success: boolean): Promise<void> {
    try {
      const effectId = `patch_feedback_${patchId}`;
      
      const feedbackEffect = {
        type: 'patch_feedback',
        patchId,
        action,
        success,
        intensity: success ? 0.5 : 0.7,
        duration: 1800
      };

      await this.effectsSystem.triggerVisualEffect(feedbackEffect);
      this.activeEffects.set(effectId, feedbackEffect);

      // Auto-cleanup after duration
      setTimeout(() => {
        this.activeEffects.delete(effectId);
      }, feedbackEffect.duration);

    } catch (error) {
      console.error('Failed to trigger patch feedback effects:', error);
    }
  }

  /**
   * Trigger effects when dialogue is ready for debugging
   */
  private async triggerDebuggingReadyEffects(ghostId: string): Promise<void> {
    try {
      // Visual cue that debugging phase is ready
      await this.effectsSystem.triggerVisualEffect({
        type: 'debugging_ready',
        intensity: 0.8,
        duration: 2500,
        ghostId,
        color: 'cyan'
      });

      // Audio transition cue
      await this.effectsSystem.triggerAudioEffect({
        type: 'phase_transition',
        volume: this.accessibilitySettings.audioEffectVolume || 1.0,
        pitch: 1.2
      });

      console.log(`Triggered debugging ready effects for ghost ${ghostId}`);

    } catch (error) {
      console.error('Failed to trigger debugging ready effects:', error);
    }
  }

  /**
   * Trigger critical system effects
   */
  private async triggerCriticalSystemEffects(): Promise<void> {
    try {
      // Dramatic visual effects for critical system events
      await this.effectsSystem.triggerVisualEffect({
        type: 'critical_system_alert',
        intensity: 1.0,
        duration: 4000,
        priority: 'critical'
      });

      // Urgent audio warning
      await this.effectsSystem.triggerAudioEffect({
        type: 'critical_system_warning',
        volume: this.accessibilitySettings.audioEffectVolume || 1.0,
        priority: 'critical'
      });

    } catch (error) {
      console.error('Failed to trigger critical system effects:', error);
    }
  }

  /**
   * Fade out encounter-specific effects
   */
  private async fadeOutEncounterEffects(sessionId: string): Promise<void> {
    try {
      // Find and fade out session-specific effects
      for (const [effectId, effect] of this.activeEffects.entries()) {
        if (effectId.includes(`session_${sessionId}`) || effect.sessionId === sessionId) {
          await this.effectsSystem.fadeOutEffect?.(effectId, 1500);
          this.activeEffects.delete(effectId);
        }
      }

    } catch (error) {
      console.error('Failed to fade out encounter effects:', error);
    }
  }

  /**
   * Process any queued effects after initialization
   */
  private async processQueuedEffects(): Promise<void> {
    if (!this.isInitialized || this.effectQueue.length === 0) {
      return;
    }

    const queuedEffects = [...this.effectQueue];
    this.effectQueue = [];

    for (const queuedEffect of queuedEffects) {
      try {
        switch (queuedEffect.type) {
          case 'meter_change':
            await this.processMeterChange(queuedEffect.data);
            break;
          case 'encounter_start':
            await this.processEncounterStart(queuedEffect.data);
            break;
          case 'room_change':
            await this.processRoomChange(queuedEffect.data);
            break;
          case 'patch_application':
            await this.processPatchApplication(queuedEffect.data);
            break;
          case 'dialogue_choice':
            await this.processDialogueChoice(queuedEffect.data);
            break;
          case 'manual_trigger':
            await this.triggerEffect(queuedEffect.data.effectSet, queuedEffect.data.source);
            break;
          case 'deferred_trigger':
            await this.triggerEffect(queuedEffect.data.effectSet, queuedEffect.data.source);
            break;
        }
      } catch (error) {
        console.error('Error processing queued effect:', error);
      }
    }
  }

  /**
   * Check if an effect can be processed given current performance constraints
   */
  private canProcessEffect(effectSet: EffectSet): boolean {
    // Check concurrent effect limit
    if (this.activeEffects.size >= this.performanceSettings.maxConcurrentEffects) {
      return false;
    }

    // Check performance metrics
    const metrics = this.performanceMonitor.getMetrics();
    if (metrics.frameRate < this.performanceSettings.frameRateTarget * 0.8) {
      return false; // Frame rate too low
    }

    return true;
  }

  /**
   * Check if two effects are incompatible
   */
  private areEffectsIncompatible(newEffect: EffectSet, activeEffect: ActiveEffect): boolean {
    // Effects of the same type from the same source are incompatible
    if (newEffect.visual && activeEffect.type.includes('visual')) {
      return true;
    }

    // High intensity effects are incompatible with each other
    if ((newEffect.intensity || 0) > 0.7 && activeEffect.intensity > 0.7) {
      return true;
    }

    return false;
  }

  /**
   * Find the lowest priority active effect
   */
  private findLowestPriorityEffect(activeEffects: ActiveEffect[]): ActiveEffect | null {
    if (activeEffects.length === 0) return null;

    return activeEffects.reduce((lowest, current) => {
      const lowestPriority = this.getEffectPriority(lowest);
      const currentPriority = this.getEffectPriority(current);
      return currentPriority < lowestPriority ? current : lowest;
    });
  }

  /**
   * Get numeric priority for an effect
   */
  private getEffectPriority(effect: EffectSet | ActiveEffect): number {
    // Default priority mapping
    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    
    if ('type' in effect) {
      // ActiveEffect - determine priority from type
      if (effect.type.includes('critical')) return 4;
      if (effect.type.includes('meter')) return 3;
      if (effect.type.includes('encounter')) return 2;
      return 1;
    } else {
      // EffectSet - use intensity as priority indicator
      const intensity = effect.intensity || 0.5;
      if (intensity > 0.8) return 4;
      if (intensity > 0.6) return 3;
      if (intensity > 0.3) return 2;
      return 1;
    }
  }

  /**
   * Try to merge compatible effects
   */
  private tryMergeEffects(newEffect: EffectSet, activeEffects: ActiveEffect[]): EffectSet | null {
    // Simple merging strategy - combine intensities for compatible effects
    const mergedEffect: EffectSet = { ...newEffect };
    
    for (const activeEffect of activeEffects) {
      if (!this.areEffectsIncompatible(newEffect, activeEffect)) {
        // Merge intensities (average them to prevent overwhelming effects)
        if (mergedEffect.intensity && activeEffect.intensity) {
          mergedEffect.intensity = (mergedEffect.intensity + activeEffect.intensity) / 2;
        }
      }
    }

    return mergedEffect;
  }

  /**
   * Create effect set from meter changes
   */
  private createMeterEffectSet(effects: any): EffectSet {
    const stabilityChange = effects.stability || 0;
    const insightChange = effects.insight || 0;
    
    const effectSet: EffectSet = {
      visual: [],
      audio: [],
      intensity: Math.max(Math.abs(stabilityChange), Math.abs(insightChange)) / 50,
      duration: 2000
    };

    // Add visual effects based on changes
    if (Math.abs(stabilityChange) > 10) {
      effectSet.visual!.push({
        type: stabilityChange < 0 ? 'glitch' : 'fade',
        intensity: Math.abs(stabilityChange) / 50,
        duration: 1500
      });
    }

    if (Math.abs(insightChange) > 15) {
      effectSet.visual!.push({
        type: 'color_shift',
        intensity: Math.abs(insightChange) / 50,
        duration: 2000,
        parameters: { hue: insightChange > 0 ? 10 : -10 }
      });
    }

    // Add audio effects
    if (stabilityChange < -15) {
      effectSet.audio!.push({
        type: 'warning',
        volume: Math.abs(stabilityChange) / 50,
        duration: 1000
      });
    }

    if (insightChange > 20) {
      effectSet.audio!.push({
        type: 'success',
        volume: insightChange / 50,
        duration: 1500
      });
    }

    return effectSet;
  }

  /**
   * Process individual visual effect
   */
  private async processVisualEffect(effect: VisualEffect, effectId: string): Promise<void> {
    try {
      // Scale effect based on performance settings
      const scaledIntensity = effect.intensity * this.performanceSettings.effectQualityScale;
      
      await this.effectsSystem.triggerVisualEffect({
        type: effect.type,
        intensity: scaledIntensity,
        duration: effect.duration,
        parameters: effect.parameters,
        effectId
      });

    } catch (error) {
      console.error('Failed to process visual effect:', error);
    }
  }

  /**
   * Process individual audio effect
   */
  private async processAudioEffect(effect: AudioEffect, effectId: string): Promise<void> {
    try {
      // Scale volume based on accessibility settings
      const scaledVolume = effect.volume * this.accessibilitySettings.audioEffectVolume;
      
      await this.effectsSystem.triggerAudioEffect({
        type: effect.type,
        volume: scaledVolume,
        duration: effect.duration,
        parameters: effect.parameters,
        effectId
      });

    } catch (error) {
      console.error('Failed to process audio effect:', error);
    }
  }

  /**
   * Register default effect triggers for common game events
   */
  private registerDefaultEffectTriggers(): void {
    // Meter change triggers
    this.registerEffectTrigger({
      eventType: GameEventType.METER_CHANGED,
      effects: {
        visual: [{ type: 'color_shift', intensity: 0.5 }],
        audio: [{ type: 'heartbeat', volume: 0.3 }],
        duration: 2000
      },
      priority: 'medium'
    });

    // Critical event triggers
    this.registerEffectTrigger({
      eventType: GameEventType.CRITICAL_EVENT,
      effects: {
        visual: [
          { type: 'screen_shake', intensity: 0.8 },
          { type: 'flash', intensity: 0.6 }
        ],
        audio: [{ type: 'warning', volume: 0.8 }],
        duration: 3000
      },
      priority: 'critical'
    });

    // Encounter completion triggers
    this.registerEffectTrigger({
      eventType: GameEventType.ENCOUNTER_COMPLETED,
      effects: {
        visual: [{ type: 'fade', intensity: 0.4 }],
        audio: [{ type: 'success', volume: 0.6 }],
        duration: 2500
      },
      priority: 'high'
    });
  }

  /**
   * Re-apply accessibility constraints to active effects
   */
  private reapplyAccessibilityConstraints(): void {
    // This would re-evaluate all active effects with new accessibility settings
    // For now, we'll just log that settings were updated
    console.log('Accessibility settings updated, effects will use new constraints');
  }

  /**
   * Apply performance optimizations based on current settings
   */
  private applyPerformanceOptimizations(): void {
    // Adjust effect quality based on performance mode
    switch (this.performanceSettings.mode) {
      case 'low':
        this.performanceSettings.effectQualityScale = 0.5;
        this.performanceSettings.maxConcurrentEffects = 3;
        break;
      case 'medium':
        this.performanceSettings.effectQualityScale = 0.75;
        this.performanceSettings.maxConcurrentEffects = 6;
        break;
      case 'high':
        this.performanceSettings.effectQualityScale = 1.0;
        this.performanceSettings.maxConcurrentEffects = 10;
        break;
    }

    console.log('Applied performance optimizations for mode:', this.performanceSettings.mode);
  }

  /**
   * Detect device capabilities
   */
  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    return {
      gpu: this.detectGPUCapability(gl),
      memory: (navigator as any).deviceMemory || 4, // GB, fallback to 4GB
      cores: navigator.hardwareConcurrency || 4,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      supportsWebGL: !!gl
    };
  }

  /**
   * Detect GPU capability level
   */
  private detectGPUCapability(gl: WebGLRenderingContext | null): 'high' | 'medium' | 'low' {
    if (!gl) return 'low';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Simple heuristic based on common GPU names
      if (renderer.includes('GeForce GTX') || renderer.includes('Radeon RX')) {
        return 'high';
      } else if (renderer.includes('Intel') || renderer.includes('Mali')) {
        return 'low';
      }
    }

    return 'medium'; // Default fallback
  }

  /**
   * Generate unique trigger ID
   */
  private generateTriggerId(): string {
    return `trigger_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique effect ID
   */
  private generateEffectId(source: string): string {
    return `effect_${source}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Load performance settings from storage
   */
  private loadPerformanceSettings(): void {
    try {
      const stored = localStorage.getItem('haunted-debug-performance');
      if (stored) {
        this.performanceSettings = {
          ...this.performanceSettings,
          ...JSON.parse(stored)
        };
      }
    } catch (error) {
      console.error('Failed to load performance settings:', error);
    }
  }

  /**
   * Save performance settings to storage
   */
  private savePerformanceSettings(): void {
    try {
      localStorage.setItem('haunted-debug-performance', 
        JSON.stringify(this.performanceSettings));
    } catch (error) {
      console.error('Failed to save performance settings:', error);
    }
  }
}

/**
 * Performance monitoring utility class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameRateHistory: number[] = [];
  private lastFrameTime: number = 0;
  private isMonitoring: boolean = false;

  constructor() {
    this.metrics = {
      frameRate: 60,
      effectCount: 0,
      memoryUsage: 0,
      processingTime: 0,
      droppedFrames: 0
    };
  }

  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.monitorFrameRate();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  recordEffect(effectId: string, effectSet: EffectSet): void {
    this.metrics.effectCount++;
  }

  recordEffectStop(effectId: string): void {
    this.metrics.effectCount = Math.max(0, this.metrics.effectCount - 1);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  private monitorFrameRate(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const currentFPS = 1000 / deltaTime;
      this.frameRateHistory.push(currentFPS);
      
      // Keep only last 60 frames for averaging
      if (this.frameRateHistory.length > 60) {
        this.frameRateHistory.shift();
      }
      
      // Calculate average frame rate
      this.metrics.frameRate = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
      
      // Count dropped frames (below 30 FPS)
      if (currentFPS < 30) {
        this.metrics.droppedFrames++;
      }
    }
    
    this.lastFrameTime = currentTime;
    
    // Update memory usage if available
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    requestAnimationFrame(() => this.monitorFrameRate());
  }
}