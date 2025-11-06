/**
 * VisualEffectProcessor - Handles screen distortions, glitches, and overlays
 */

import type { 
  VisualEffectSet, 
  ColorShiftEffect, 
  OverlayEffect 
} from './DynamicMeterSystem';

export interface VisualEffectProcessor {
  applyEffects(effects: VisualEffectSet): void;
  clearEffects(): void;
  setIntensityMultiplier(multiplier: number): void;
  getAccessibilitySettings(): AccessibilitySettings;
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  disableFlashing: boolean;
  maxIntensity: number; // 0.0 to 1.0
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
}

export interface EffectState {
  isActive: boolean;
  intensity: number;
  startTime: number;
  duration?: number;
}

export class VisualEffectProcessorImpl implements VisualEffectProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private effectContainer: HTMLElement | null = null;
  private activeEffects: Map<string, EffectState> = new Map();
  private animationFrame: number | null = null;
  private intensityMultiplier: number = 1.0;
  
  private accessibilitySettings: AccessibilitySettings = {
    reduceMotion: false,
    disableFlashing: false,
    maxIntensity: 1.0,
    colorBlindnessMode: 'none',
    highContrast: false
  };

  constructor() {
    this.initializeEffectSystem();
    this.loadAccessibilitySettings();
  }

  /**
   * Apply visual effects to the screen
   */
  applyEffects(effects: VisualEffectSet): void {
    // Apply accessibility constraints
    const constrainedEffects = this.applyAccessibilityConstraints(effects);
    
    // Apply screen distortion
    if (constrainedEffects.screenDistortion > 0) {
      this.applyScreenDistortion(constrainedEffects.screenDistortion);
    }

    // Apply color shift
    this.applyColorShift(constrainedEffects.colorShift);

    // Apply glitch effects
    if (constrainedEffects.glitchIntensity > 0) {
      this.applyGlitchEffect(constrainedEffects.glitchIntensity);
    }

    // Apply overlay effects
    for (const overlay of constrainedEffects.overlayEffects) {
      this.applyOverlayEffect(overlay);
    }

    // Start animation loop if not already running
    if (!this.animationFrame) {
      this.startAnimationLoop();
    }
  }

  /**
   * Clear all visual effects
   */
  clearEffects(): void {
    // Stop animation loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Clear active effects
    this.activeEffects.clear();

    // Reset visual styles
    this.resetVisualStyles();
  }

  /**
   * Set global intensity multiplier for all effects
   */
  setIntensityMultiplier(multiplier: number): void {
    this.intensityMultiplier = Math.max(0, Math.min(1, multiplier));
  }

  /**
   * Get current accessibility settings
   */
  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.accessibilitySettings };
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
  }

  /**
   * Apply screen distortion effect
   */
  private applyScreenDistortion(intensity: number): void {
    const finalIntensity = intensity * this.intensityMultiplier;
    
    if (this.accessibilitySettings.reduceMotion && finalIntensity > 0.3) {
      // Reduce to static distortion for motion sensitivity
      this.applyStaticDistortion(finalIntensity * 0.5);
      return;
    }

    const distortionId = 'screen_distortion';
    this.activeEffects.set(distortionId, {
      isActive: true,
      intensity: finalIntensity,
      startTime: Date.now()
    });

    // Apply CSS transform for distortion
    if (this.effectContainer) {
      const skewX = Math.sin(Date.now() * 0.01) * finalIntensity * 2;
      const skewY = Math.cos(Date.now() * 0.008) * finalIntensity * 1;
      const scaleX = 1 + Math.sin(Date.now() * 0.005) * finalIntensity * 0.02;
      
      this.effectContainer.style.transform = 
        `skewX(${skewX}deg) skewY(${skewY}deg) scaleX(${scaleX})`;
    }
  }

  /**
   * Apply static distortion for accessibility
   */
  private applyStaticDistortion(intensity: number): void {
    if (this.effectContainer) {
      const staticSkew = intensity * 0.5;
      this.effectContainer.style.transform = `skewX(${staticSkew}deg)`;
      this.effectContainer.style.filter = `blur(${intensity * 0.5}px)`;
    }
  }

  /**
   * Apply color shift effect
   */
  private applyColorShift(colorShift: ColorShiftEffect): void {
    const constrainedShift = this.applyColorBlindnessCorrection(colorShift);
    
    if (this.effectContainer) {
      const hue = constrainedShift.hue;
      const saturation = constrainedShift.saturation * 100;
      const brightness = constrainedShift.brightness * 100;
      
      let filter = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
      
      if (this.accessibilitySettings.highContrast) {
        filter += ' contrast(150%)';
      }
      
      this.effectContainer.style.filter = filter;
    }
  }

  /**
   * Apply glitch effect
   */
  private applyGlitchEffect(intensity: number): void {
    const finalIntensity = intensity * this.intensityMultiplier;
    
    if (this.accessibilitySettings.disableFlashing) {
      // Use static glitch effect instead
      this.applyStaticGlitch(finalIntensity);
      return;
    }

    const glitchId = 'glitch_effect';
    this.activeEffects.set(glitchId, {
      isActive: true,
      intensity: finalIntensity,
      startTime: Date.now(),
      duration: 100 + Math.random() * 200 // Random glitch duration
    });

    // Create glitch overlay
    this.createGlitchOverlay(finalIntensity);
  }

  /**
   * Apply static glitch for accessibility
   */
  private applyStaticGlitch(intensity: number): void {
    if (this.effectContainer) {
      const opacity = intensity * 0.3;
      this.effectContainer.style.boxShadow = 
        `inset 0 0 ${intensity * 20}px rgba(255, 0, 0, ${opacity})`;
    }
  }

  /**
   * Create animated glitch overlay
   */
  private createGlitchOverlay(intensity: number): void {
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear previous glitch
    this.ctx.clearRect(0, 0, width, height);

    // Create random glitch lines
    const numLines = Math.floor(intensity * 10);
    for (let i = 0; i < numLines; i++) {
      const y = Math.random() * height;
      const lineHeight = Math.random() * 5 + 1;
      const offset = (Math.random() - 0.5) * intensity * 20;
      
      this.ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.5})`;
      this.ctx.fillRect(offset, y, width, lineHeight);
      
      this.ctx.fillStyle = `rgba(0, 255, 0, ${intensity * 0.3})`;
      this.ctx.fillRect(-offset, y + 1, width, lineHeight);
    }

    // Add noise
    if (intensity > 0.5) {
      const imageData = this.ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < intensity * 0.1) {
          const noise = Math.random() * 255;
          data[i] = noise;     // Red
          data[i + 1] = noise; // Green
          data[i + 2] = noise; // Blue
          data[i + 3] = intensity * 100; // Alpha
        }
      }
      
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  /**
   * Apply overlay effect
   */
  private applyOverlayEffect(overlay: OverlayEffect): void {
    const finalIntensity = overlay.intensity * this.intensityMultiplier;
    
    switch (overlay.type) {
      case 'scanlines':
        this.applyScanlines(finalIntensity);
        break;
      case 'noise':
        this.applyNoise(finalIntensity, overlay.duration);
        break;
      case 'vignette':
        this.applyVignette(finalIntensity);
        break;
      case 'chromatic_aberration':
        this.applyChromaticAberration(finalIntensity);
        break;
    }
  }

  /**
   * Apply scanlines overlay
   */
  private applyScanlines(intensity: number): void {
    if (!this.effectContainer) return;

    const scanlineId = 'scanlines';
    this.activeEffects.set(scanlineId, {
      isActive: true,
      intensity,
      startTime: Date.now()
    });

    // Create CSS-based scanlines
    const scanlineStyle = `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, ${intensity * 0.3}) 2px,
        rgba(0, 0, 0, ${intensity * 0.3}) 4px
      )
    `;
    
    this.effectContainer.style.backgroundImage = scanlineStyle;
  }

  /**
   * Apply noise overlay
   */
  private applyNoise(intensity: number, duration?: number): void {
    const noiseId = 'noise';
    this.activeEffects.set(noiseId, {
      isActive: true,
      intensity,
      startTime: Date.now(),
      duration
    });

    if (this.accessibilitySettings.disableFlashing) {
      // Static noise for accessibility
      if (this.effectContainer) {
        this.effectContainer.style.opacity = `${1 - intensity * 0.1}`;
      }
      return;
    }

    // Animated noise using canvas
    this.createNoiseOverlay(intensity);
  }

  /**
   * Create animated noise overlay
   */
  private createNoiseOverlay(intensity: number): void {
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;     // Red
      data[i + 1] = noise; // Green
      data[i + 2] = noise; // Blue
      data[i + 3] = intensity * 50; // Alpha
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply vignette effect
   */
  private applyVignette(intensity: number): void {
    if (!this.effectContainer) return;

    const vignetteStyle = `
      radial-gradient(
        circle at center,
        transparent 30%,
        rgba(0, 0, 0, ${intensity * 0.6}) 100%
      )
    `;
    
    this.effectContainer.style.backgroundImage = vignetteStyle;
  }

  /**
   * Apply chromatic aberration effect
   */
  private applyChromaticAberration(intensity: number): void {
    if (!this.effectContainer) return;

    const offset = intensity * 2;
    this.effectContainer.style.textShadow = `
      ${offset}px 0 red,
      -${offset}px 0 cyan
    `;
  }

  /**
   * Apply accessibility constraints to effects
   */
  private applyAccessibilityConstraints(effects: VisualEffectSet): VisualEffectSet {
    const maxIntensity = this.accessibilitySettings.maxIntensity;
    
    return {
      screenDistortion: Math.min(effects.screenDistortion, maxIntensity),
      colorShift: this.constrainColorShift(effects.colorShift, maxIntensity),
      glitchIntensity: Math.min(effects.glitchIntensity, maxIntensity),
      overlayEffects: effects.overlayEffects.map(overlay => ({
        ...overlay,
        intensity: Math.min(overlay.intensity, maxIntensity)
      }))
    };
  }

  /**
   * Constrain color shift for accessibility
   */
  private constrainColorShift(colorShift: ColorShiftEffect, maxIntensity: number): ColorShiftEffect {
    return {
      hue: colorShift.hue * maxIntensity,
      saturation: 1 + (colorShift.saturation - 1) * maxIntensity,
      brightness: 1 + (colorShift.brightness - 1) * maxIntensity
    };
  }

  /**
   * Apply color blindness correction
   */
  private applyColorBlindnessCorrection(colorShift: ColorShiftEffect): ColorShiftEffect {
    switch (this.accessibilitySettings.colorBlindnessMode) {
      case 'protanopia':
        // Reduce red component
        return {
          ...colorShift,
          hue: colorShift.hue + 30, // Shift towards green/blue
          saturation: colorShift.saturation * 0.8
        };
      case 'deuteranopia':
        // Reduce green component
        return {
          ...colorShift,
          hue: colorShift.hue - 20, // Shift towards red/blue
          saturation: colorShift.saturation * 0.9
        };
      case 'tritanopia':
        // Reduce blue component
        return {
          ...colorShift,
          hue: colorShift.hue + 60, // Shift towards red/green
          saturation: colorShift.saturation * 0.85
        };
      default:
        return colorShift;
    }
  }

  /**
   * Start animation loop for dynamic effects
   */
  private startAnimationLoop(): void {
    const animate = () => {
      const currentTime = Date.now();
      let hasActiveEffects = false;

      // Update active effects
      for (const [effectId, effect] of this.activeEffects.entries()) {
        if (effect.duration && currentTime - effect.startTime > effect.duration) {
          this.activeEffects.delete(effectId);
        } else {
          hasActiveEffects = true;
          
          // Update effect based on type
          if (effectId === 'screen_distortion') {
            this.updateScreenDistortion(effect);
          } else if (effectId === 'glitch_effect') {
            this.updateGlitchEffect(effect);
          }
        }
      }

      // Continue animation if there are active effects
      if (hasActiveEffects) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Update screen distortion animation
   */
  private updateScreenDistortion(effect: EffectState): void {
    if (!this.effectContainer || this.accessibilitySettings.reduceMotion) return;

    const time = Date.now() * 0.01;
    const intensity = effect.intensity;
    
    const skewX = Math.sin(time) * intensity * 2;
    const skewY = Math.cos(time * 0.8) * intensity * 1;
    const scaleX = 1 + Math.sin(time * 0.5) * intensity * 0.02;
    
    this.effectContainer.style.transform = 
      `skewX(${skewX}deg) skewY(${skewY}deg) scaleX(${scaleX})`;
  }

  /**
   * Update glitch effect animation
   */
  private updateGlitchEffect(effect: EffectState): void {
    if (this.accessibilitySettings.disableFlashing) return;
    
    // Recreate glitch overlay with new random pattern
    this.createGlitchOverlay(effect.intensity);
  }

  /**
   * Reset all visual styles
   */
  private resetVisualStyles(): void {
    if (this.effectContainer) {
      this.effectContainer.style.transform = '';
      this.effectContainer.style.filter = '';
      this.effectContainer.style.backgroundImage = '';
      this.effectContainer.style.textShadow = '';
      this.effectContainer.style.boxShadow = '';
      this.effectContainer.style.opacity = '';
    }

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    }
  }

  /**
   * Initialize effect system
   */
  private initializeEffectSystem(): void {
    // Create effect container
    this.effectContainer = document.getElementById('game-container') || document.body;
    
    // Create canvas for complex effects
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    
    // Add canvas to DOM
    document.body.appendChild(this.canvas);
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Resize canvas to match window size
   */
  private resizeCanvas(): void {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  /**
   * Load accessibility settings from localStorage
   */
  private loadAccessibilitySettings(): void {
    try {
      const saved = localStorage.getItem('haunted-debug-accessibility');
      if (saved) {
        this.accessibilitySettings = {
          ...this.accessibilitySettings,
          ...JSON.parse(saved)
        };
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
  }

  /**
   * Save accessibility settings to localStorage
   */
  private saveAccessibilitySettings(): void {
    try {
      localStorage.setItem('haunted-debug-accessibility', 
        JSON.stringify(this.accessibilitySettings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }
}