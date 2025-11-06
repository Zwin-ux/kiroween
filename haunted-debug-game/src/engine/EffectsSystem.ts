/**
 * EffectsSystem - Unified system for managing visual and audio effects
 */

import { VisualEffectProcessorImpl, type VisualEffectProcessor, type AccessibilitySettings } from './VisualEffectProcessor';
import { AudioEffectProcessorImpl, type AudioEffectProcessor, type AudioSettings } from './AudioEffectProcessor';
import type { 
  VisualEffectSet, 
  AudioEffectSet 
} from './DynamicMeterSystem';
import type { GameConsequence } from './CompileEventProcessor';

export interface EffectsSystem {
  processConsequences(consequences: GameConsequence[]): void;
  processVisualEffects(effects: VisualEffectSet): void;
  processAudioEffects(effects: AudioEffectSet): void;
  setEffectIntensity(intensity: number): void;
  getAccessibilitySettings(): AccessibilitySettings;
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void;
  getAudioSettings(): AudioSettings;
  updateAudioSettings(settings: Partial<AudioSettings>): void;
  cleanup(): void;
  
  // Additional methods needed by coordinators
  initialize?(): Promise<void>;
  triggerVisualEffect(effect: any): Promise<void>;
  triggerAudioEffect(effect: any): Promise<void>;
  fadeOutEffect?(effectId: string, duration: number): Promise<void>;
  stopEffect?(effectId: string): void;
}

export interface EffectIntensityControls {
  globalIntensity: number; // 0.0 to 1.0
  visualIntensity: number;
  audioIntensity: number;
  disableFlashing: boolean;
  reduceMotion: boolean;
  muteAudio: boolean;
}

export class EffectsSystemImpl implements EffectsSystem {
  private visualProcessor: VisualEffectProcessor;
  private audioProcessor: AudioEffectProcessor;
  private intensityControls: EffectIntensityControls;
  private isInitialized: boolean = false;

  constructor() {
    this.visualProcessor = new VisualEffectProcessorImpl();
    this.audioProcessor = new AudioEffectProcessorImpl();
    
    this.intensityControls = {
      globalIntensity: 1.0,
      visualIntensity: 1.0,
      audioIntensity: 1.0,
      disableFlashing: false,
      reduceMotion: false,
      muteAudio: false
    };

    this.loadIntensitySettings();
    this.isInitialized = true;
  }

  /**
   * Process game consequences and trigger appropriate effects
   */
  processConsequences(consequences: GameConsequence[]): void {
    if (!this.isInitialized) return;

    for (const consequence of consequences) {
      switch (consequence.type) {
        case 'visual_effect':
          this.processVisualConsequence(consequence);
          break;
        case 'audio_cue':
          this.processAudioConsequence(consequence);
          break;
        case 'meter_change':
          this.processMeterChangeEffects(consequence);
          break;
        case 'trigger_event':
          this.processEventTrigger(consequence);
          break;
      }
    }
  }

  /**
   * Process visual effects directly
   */
  processVisualEffects(effects: VisualEffectSet): void {
    if (!this.isInitialized || this.intensityControls.visualIntensity === 0) return;

    // Apply intensity scaling
    const scaledEffects = this.scaleVisualEffects(effects);
    this.visualProcessor.applyEffects(scaledEffects);
  }

  /**
   * Process audio effects directly
   */
  processAudioEffects(effects: AudioEffectSet): void {
    if (!this.isInitialized || this.intensityControls.muteAudio) return;

    // Apply intensity scaling
    const scaledEffects = this.scaleAudioEffects(effects);
    this.audioProcessor.processEffects(scaledEffects);
  }

  /**
   * Set global effect intensity
   */
  setEffectIntensity(intensity: number): void {
    this.intensityControls.globalIntensity = Math.max(0, Math.min(1, intensity));
    this.visualProcessor.setIntensityMultiplier(this.intensityControls.globalIntensity);
    this.saveIntensitySettings();
  }

  /**
   * Get accessibility settings
   */
  getAccessibilitySettings(): AccessibilitySettings {
    return this.visualProcessor.getAccessibilitySettings();
  }

  /**
   * Update accessibility settings
   */
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void {
    this.visualProcessor.updateAccessibilitySettings(settings);
    
    // Update local controls based on accessibility settings
    if (settings.disableFlashing !== undefined) {
      this.intensityControls.disableFlashing = settings.disableFlashing;
    }
    if (settings.reduceMotion !== undefined) {
      this.intensityControls.reduceMotion = settings.reduceMotion;
    }
    
    this.saveIntensitySettings();
  }

  /**
   * Get audio settings
   */
  getAudioSettings(): AudioSettings {
    return this.audioProcessor.getAudioSettings();
  }

  /**
   * Update audio settings
   */
  updateAudioSettings(settings: Partial<AudioSettings>): void {
    this.audioProcessor.updateAudioSettings(settings);
    
    // Update local controls based on audio settings
    if (settings.muteAll !== undefined) {
      this.intensityControls.muteAudio = settings.muteAll;
    }
    
    this.saveIntensitySettings();
  }

  /**
   * Cleanup all effect resources
   */
  cleanup(): void {
    this.visualProcessor.clearEffects();
    this.audioProcessor.cleanup();
    this.isInitialized = false;
  }

  /**
   * Process visual consequence
   */
  private processVisualConsequence(consequence: GameConsequence): void {
    const effects = consequence.effects;
    
    const visualEffects: VisualEffectSet = {
      screenDistortion: effects.distortionIntensity || 0,
      colorShift: {
        hue: effects.hueShift || 0,
        saturation: effects.saturation || 1,
        brightness: effects.brightness || 1
      },
      glitchIntensity: effects.glitchIntensity || 0,
      overlayEffects: this.createOverlayEffectsFromConsequence(consequence)
    };

    this.processVisualEffects(visualEffects);

    // Auto-clear effects after duration
    if (consequence.duration) {
      setTimeout(() => {
        this.visualProcessor.clearEffects();
      }, consequence.duration);
    }
  }

  /**
   * Process audio consequence
   */
  private processAudioConsequence(consequence: GameConsequence): void {
    const effects = consequence.effects;
    
    const audioEffects: AudioEffectSet = {
      heartbeatIntensity: effects.heartbeatIntensity || 0,
      whisperVolume: effects.whisperVolume || 0,
      ambientTension: effects.ambientTension || 0,
      effectTriggers: [{
        type: effects.soundType || 'warning',
        volume: effects.volume || 0.5,
        delay: effects.delay || 0,
        duration: consequence.duration
      }]
    };

    this.processAudioEffects(audioEffects);
  }

  /**
   * Process meter change effects
   */
  private processMeterChangeEffects(consequence: GameConsequence): void {
    const stabilityChange = consequence.effects.stabilityChange || 0;
    const insightChange = consequence.effects.insightChange || 0;
    
    // Create visual effects based on meter changes
    if (Math.abs(stabilityChange) > 10) {
      const visualEffects: VisualEffectSet = {
        screenDistortion: Math.abs(stabilityChange) / 50,
        colorShift: {
          hue: stabilityChange < 0 ? -20 : 10,
          saturation: 1.2,
          brightness: stabilityChange < 0 ? 0.8 : 1.1
        },
        glitchIntensity: stabilityChange < 0 ? Math.abs(stabilityChange) / 30 : 0,
        overlayEffects: stabilityChange < 0 ? [
          { type: 'scanlines', intensity: 0.3 }
        ] : []
      };
      
      this.processVisualEffects(visualEffects);
    }

    // Create audio effects based on meter changes
    if (Math.abs(stabilityChange) > 5 || Math.abs(insightChange) > 10) {
      const audioEffects: AudioEffectSet = {
        heartbeatIntensity: stabilityChange < 0 ? Math.abs(stabilityChange) / 20 : 0,
        whisperVolume: insightChange > 10 ? insightChange / 30 : 0,
        ambientTension: stabilityChange < 0 ? Math.abs(stabilityChange) / 25 : 0,
        effectTriggers: [{
          type: stabilityChange < 0 ? 'warning' : 'success',
          volume: Math.min(0.8, Math.abs(stabilityChange + insightChange) / 30),
          delay: 0
        }]
      };
      
      this.processAudioEffects(audioEffects);
    }
  }

  /**
   * Process event trigger consequence
   */
  private processEventTrigger(consequence: GameConsequence): void {
    const eventType = consequence.effects.eventType;
    
    switch (eventType) {
      case 'ethics_warning':
        this.triggerEthicsWarning();
        break;
      case 'system_failure':
        this.triggerSystemFailure();
        break;
      case 'breakthrough':
        this.triggerBreakthrough();
        break;
    }
  }

  /**
   * Trigger ethics warning effects
   */
  private triggerEthicsWarning(): void {
    const visualEffects: VisualEffectSet = {
      screenDistortion: 0.6,
      colorShift: { hue: -30, saturation: 1.5, brightness: 0.7 },
      glitchIntensity: 0.8,
      overlayEffects: [
        { type: 'noise', intensity: 0.5, duration: 3000 },
        { type: 'vignette', intensity: 0.7 }
      ]
    };

    const audioEffects: AudioEffectSet = {
      heartbeatIntensity: 0.8,
      whisperVolume: 0,
      ambientTension: 0.9,
      effectTriggers: [
        { type: 'warning', volume: 0.9, delay: 0 },
        { type: 'glitch', volume: 0.7, delay: 500, duration: 2000 }
      ]
    };

    this.processVisualEffects(visualEffects);
    this.processAudioEffects(audioEffects);

    // Clear after 5 seconds
    setTimeout(() => {
      this.visualProcessor.clearEffects();
    }, 5000);
  }

  /**
   * Trigger system failure effects
   */
  private triggerSystemFailure(): void {
    const visualEffects: VisualEffectSet = {
      screenDistortion: 1.0,
      colorShift: { hue: -45, saturation: 0.5, brightness: 0.3 },
      glitchIntensity: 1.0,
      overlayEffects: [
        { type: 'noise', intensity: 1.0, duration: 10000 },
        { type: 'scanlines', intensity: 1.0 },
        { type: 'vignette', intensity: 0.9 }
      ]
    };

    const audioEffects: AudioEffectSet = {
      heartbeatIntensity: 0,
      whisperVolume: 0,
      ambientTension: 1.0,
      effectTriggers: [
        { type: 'glitch', volume: 1.0, delay: 0, duration: 5000 }
      ]
    };

    this.processVisualEffects(visualEffects);
    this.processAudioEffects(audioEffects);
  }

  /**
   * Trigger breakthrough effects
   */
  private triggerBreakthrough(): void {
    const visualEffects: VisualEffectSet = {
      screenDistortion: 0,
      colorShift: { hue: 15, saturation: 1.3, brightness: 1.2 },
      glitchIntensity: 0,
      overlayEffects: [
        { type: 'chromatic_aberration', intensity: 0.3, duration: 3000 }
      ]
    };

    const audioEffects: AudioEffectSet = {
      heartbeatIntensity: 0.2,
      whisperVolume: 0.6,
      ambientTension: 0.1,
      effectTriggers: [
        { type: 'success', volume: 0.8, delay: 0 },
        { type: 'whisper', volume: 0.5, delay: 1000, duration: 4000 }
      ]
    };

    this.processVisualEffects(visualEffects);
    this.processAudioEffects(audioEffects);

    // Clear after 4 seconds
    setTimeout(() => {
      this.visualProcessor.clearEffects();
    }, 4000);
  }

  /**
   * Create overlay effects from consequence
   */
  private createOverlayEffectsFromConsequence(consequence: GameConsequence): any[] {
    const effects = [];
    
    if (consequence.severity === 'critical') {
      effects.push({ type: 'noise', intensity: 0.6, duration: consequence.duration });
      effects.push({ type: 'scanlines', intensity: 0.8 });
    } else if (consequence.severity === 'major') {
      effects.push({ type: 'scanlines', intensity: 0.5 });
    }
    
    if (consequence.effects.glitchDuration) {
      effects.push({ 
        type: 'noise', 
        intensity: 0.4, 
        duration: consequence.effects.glitchDuration 
      });
    }
    
    return effects;
  }

  /**
   * Scale visual effects based on intensity controls
   */
  private scaleVisualEffects(effects: VisualEffectSet): VisualEffectSet {
    const scale = this.intensityControls.globalIntensity * this.intensityControls.visualIntensity;
    
    return {
      screenDistortion: effects.screenDistortion * scale,
      colorShift: {
        hue: effects.colorShift.hue * scale,
        saturation: 1 + (effects.colorShift.saturation - 1) * scale,
        brightness: 1 + (effects.colorShift.brightness - 1) * scale
      },
      glitchIntensity: effects.glitchIntensity * scale,
      overlayEffects: effects.overlayEffects.map(overlay => ({
        ...overlay,
        intensity: overlay.intensity * scale
      }))
    };
  }

  /**
   * Scale audio effects based on intensity controls
   */
  private scaleAudioEffects(effects: AudioEffectSet): AudioEffectSet {
    const scale = this.intensityControls.globalIntensity * this.intensityControls.audioIntensity;
    
    return {
      heartbeatIntensity: effects.heartbeatIntensity * scale,
      whisperVolume: effects.whisperVolume * scale,
      ambientTension: effects.ambientTension * scale,
      effectTriggers: effects.effectTriggers.map(trigger => ({
        ...trigger,
        volume: trigger.volume * scale
      }))
    };
  }

  /**
   * Load intensity settings from localStorage
   */
  private loadIntensitySettings(): void {
    try {
      const saved = localStorage.getItem('haunted-debug-effects');
      if (saved) {
        this.intensityControls = {
          ...this.intensityControls,
          ...JSON.parse(saved)
        };
      }
    } catch (error) {
      console.warn('Failed to load effects settings:', error);
    }
  }

  /**
   * Save intensity settings to localStorage
   */
  private saveIntensitySettings(): void {
    try {
      localStorage.setItem('haunted-debug-effects', 
        JSON.stringify(this.intensityControls));
    } catch (error) {
      console.warn('Failed to save effects settings:', error);
    }
  }

  /**
   * Initialize the effects system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.loadIntensitySettings();
    this.isInitialized = true;
    console.log('EffectsSystem initialized');
  }

  /**
   * Trigger a visual effect
   */
  async triggerVisualEffect(effect: any): Promise<void> {
    try {
      // Convert generic effect to VisualEffectSet
      const visualEffects: VisualEffectSet = {
        screenDistortion: effect.intensity || 0,
        colorShift: {
          hue: effect.hue || 0,
          saturation: effect.saturation || 1,
          brightness: effect.brightness || 1
        },
        glitchIntensity: effect.type === 'glitch' ? (effect.intensity || 0.5) : 0,
        overlayEffects: effect.overlays || []
      };

      this.processVisualEffects(visualEffects);

      // Auto-clear after duration if specified
      if (effect.duration) {
        setTimeout(() => {
          this.visualProcessor.clearEffects();
        }, effect.duration);
      }

    } catch (error) {
      console.error('Failed to trigger visual effect:', error);
    }
  }

  /**
   * Trigger an audio effect
   */
  async triggerAudioEffect(effect: any): Promise<void> {
    try {
      // Convert generic effect to AudioEffectSet
      const audioEffects: AudioEffectSet = {
        heartbeatIntensity: effect.type === 'heartbeat' ? (effect.intensity || 0.5) : 0,
        whisperVolume: effect.type === 'whisper' ? (effect.volume || 0.5) : 0,
        ambientTension: effect.type === 'tension' ? (effect.intensity || 0.5) : 0,
        effectTriggers: [{
          type: effect.type || 'generic',
          volume: effect.volume || 0.5,
          delay: effect.delay || 0,
          duration: effect.duration
        }]
      };

      this.processAudioEffects(audioEffects);

    } catch (error) {
      console.error('Failed to trigger audio effect:', error);
    }
  }

  /**
   * Fade out an effect over time
   */
  async fadeOutEffect(effectId: string, duration: number): Promise<void> {
    try {
      // Implement fade out logic
      // For now, just clear after duration
      setTimeout(() => {
        this.visualProcessor.clearEffects();
      }, duration);

    } catch (error) {
      console.error('Failed to fade out effect:', error);
    }
  }

  /**
   * Stop a specific effect
   */
  stopEffect(effectId: string): void {
    try {
      // For now, clear all effects
      // In a more sophisticated implementation, we'd track individual effects
      this.visualProcessor.clearEffects();

    } catch (error) {
      console.error('Failed to stop effect:', error);
    }
  }
}