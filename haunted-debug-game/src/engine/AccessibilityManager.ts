/**
 * AccessibilityManager - Comprehensive accessibility controls and customization
 */

import type { AccessibilitySettings } from '@/types/game';

export interface AccessibilityProfile {
  id: string;
  name: string;
  description: string;
  settings: AccessibilitySettings;
  isDefault?: boolean;
}

export interface AlternativeFeedback {
  type: 'visual' | 'audio' | 'haptic' | 'text';
  content: string | number;
  duration?: number;
  intensity?: number;
}

export interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  category: 'visual' | 'audio' | 'motor' | 'cognitive';
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface AccessibilityManager {
  initialize(): Promise<void>;
  
  // Profile management
  getProfiles(): AccessibilityProfile[];
  createProfile(name: string, settings: AccessibilitySettings): string;
  updateProfile(profileId: string, settings: Partial<AccessibilitySettings>): void;
  deleteProfile(profileId: string): boolean;
  activateProfile(profileId: string): void;
  getCurrentProfile(): AccessibilityProfile | null;
  
  // Settings management
  getSettings(): AccessibilitySettings;
  updateSettings(settings: Partial<AccessibilitySettings>): void;
  resetToDefaults(): void;
  
  // Alternative feedback
  provideAlternativeFeedback(originalEffect: any): AlternativeFeedback[];
  registerFeedbackProvider(type: string, provider: (effect: any) => AlternativeFeedback[]): void;
  
  // Feature management
  getAvailableFeatures(): AccessibilityFeature[];
  enableFeature(featureId: string, settings?: Record<string, any>): void;
  disableFeature(featureId: string): void;
  isFeatureEnabled(featureId: string): boolean;
  
  // Validation and testing
  validateSettings(settings: AccessibilitySettings): ValidationResult;
  testAccessibilityFeature(featureId: string): Promise<TestResult>;
  
  // Persistence
  saveSettings(): void;
  loadSettings(): void;
  exportSettings(): string;
  importSettings(data: string): boolean;
  
  cleanup(): void;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface TestResult {
  success: boolean;
  message: string;
  duration: number;
  feedback?: AlternativeFeedback[];
}

export class AccessibilityManagerImpl implements AccessibilityManager {
  private currentSettings: AccessibilitySettings;
  private profiles: Map<string, AccessibilityProfile> = new Map();
  private currentProfileId: string | null = null;
  private features: Map<string, AccessibilityFeature> = new Map();
  private feedbackProviders: Map<string, (effect: any) => AlternativeFeedback[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.currentSettings = this.getDefaultSettings();
    this.initializeDefaultProfiles();
    this.initializeAccessibilityFeatures();
    this.registerDefaultFeedbackProviders();
  }

  /**
   * Initialize the accessibility manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load saved settings and profiles
      this.loadSettings();
      this.loadProfiles();
      
      // Detect system accessibility preferences
      await this.detectSystemPreferences();
      
      // Apply initial settings
      this.applyCurrentSettings();
      
      this.isInitialized = true;
      console.log('AccessibilityManager initialized');

    } catch (error) {
      console.error('Failed to initialize AccessibilityManager:', error);
      throw error;
    }
  }

  /**
   * Get all available accessibility profiles
   */
  getProfiles(): AccessibilityProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Create a new accessibility profile
   */
  createProfile(name: string, settings: AccessibilitySettings): string {
    const profileId = this.generateProfileId();
    
    const profile: AccessibilityProfile = {
      id: profileId,
      name,
      description: `Custom profile: ${name}`,
      settings: { ...settings }
    };

    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return profileId;
  }

  /**
   * Update an existing profile
   */
  updateProfile(profileId: string, settings: Partial<AccessibilitySettings>): void {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    profile.settings = {
      ...profile.settings,
      ...settings
    };

    this.profiles.set(profileId, profile);
    this.saveProfiles();

    // If this is the current profile, update current settings
    if (this.currentProfileId === profileId) {
      this.updateSettings(settings);
    }
  }

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile || profile.isDefault) {
      return false; // Cannot delete default profiles
    }

    const deleted = this.profiles.delete(profileId);
    if (deleted) {
      this.saveProfiles();
      
      // If this was the current profile, switch to default
      if (this.currentProfileId === profileId) {
        this.activateProfile('default');
      }
    }

    return deleted;
  }

  /**
   * Activate a specific profile
   */
  activateProfile(profileId: string): void {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    this.currentProfileId = profileId;
    this.currentSettings = { ...profile.settings };
    
    this.applyCurrentSettings();
    this.saveSettings();
    
    console.log(`Activated accessibility profile: ${profile.name}`);
  }

  /**
   * Get the currently active profile
   */
  getCurrentProfile(): AccessibilityProfile | null {
    if (!this.currentProfileId) {
      return null;
    }
    
    return this.profiles.get(this.currentProfileId) || null;
  }

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.currentSettings };
  }

  /**
   * Update accessibility settings
   */
  updateSettings(settings: Partial<AccessibilitySettings>): void {
    const validation = this.validateSettings({ ...this.currentSettings, ...settings });
    
    if (!validation.isValid) {
      console.warn('Invalid accessibility settings:', validation.errors);
      return;
    }

    this.currentSettings = {
      ...this.currentSettings,
      ...settings
    };

    this.applyCurrentSettings();
    this.saveSettings();

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Accessibility settings warnings:', validation.warnings);
    }
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults(): void {
    this.currentSettings = this.getDefaultSettings();
    this.currentProfileId = 'default';
    this.applyCurrentSettings();
    this.saveSettings();
  }

  /**
   * Provide alternative feedback for effects that may not be accessible
   */
  provideAlternativeFeedback(originalEffect: any): AlternativeFeedback[] {
    const alternatives: AlternativeFeedback[] = [];

    // Check each registered feedback provider
    for (const [type, provider] of this.feedbackProviders.entries()) {
      try {
        const feedback = provider(originalEffect);
        alternatives.push(...feedback);
      } catch (error) {
        console.error(`Error in feedback provider ${type}:`, error);
      }
    }

    // Apply accessibility constraints to alternatives
    return this.filterAlternativesBySettings(alternatives);
  }

  /**
   * Register a custom feedback provider
   */
  registerFeedbackProvider(type: string, provider: (effect: any) => AlternativeFeedback[]): void {
    this.feedbackProviders.set(type, provider);
  }

  /**
   * Get all available accessibility features
   */
  getAvailableFeatures(): AccessibilityFeature[] {
    return Array.from(this.features.values());
  }

  /**
   * Enable a specific accessibility feature
   */
  enableFeature(featureId: string, settings?: Record<string, any>): void {
    const feature = this.features.get(featureId);
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    feature.enabled = true;
    if (settings) {
      feature.settings = { ...feature.settings, ...settings };
    }

    this.features.set(featureId, feature);
    this.applyFeatureSettings(feature);
    this.saveFeatures();
  }

  /**
   * Disable a specific accessibility feature
   */
  disableFeature(featureId: string): void {
    const feature = this.features.get(featureId);
    if (!feature) {
      return;
    }

    feature.enabled = false;
    this.features.set(featureId, feature);
    this.removeFeatureSettings(feature);
    this.saveFeatures();
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature ? feature.enabled : false;
  }

  /**
   * Validate accessibility settings
   */
  validateSettings(settings: AccessibilitySettings): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    // Validate intensity values
    if (settings.visualEffectIntensity < 0 || settings.visualEffectIntensity > 1) {
      result.errors.push('Visual effect intensity must be between 0 and 1');
      result.isValid = false;
    }

    if (settings.audioEffectVolume < 0 || settings.audioEffectVolume > 1) {
      result.errors.push('Audio effect volume must be between 0 and 1');
      result.isValid = false;
    }

    // Check for conflicting settings
    if (settings.disableFlashing && settings.visualEffectIntensity > 0.8) {
      result.warnings.push('High visual intensity with flashing disabled may reduce effect visibility');
    }

    if (settings.reduceMotion && settings.visualEffectIntensity > 0.6) {
      result.warnings.push('Motion reduction with high intensity may create conflicting effects');
    }

    // Provide suggestions
    if (settings.visualEffectIntensity === 0 && settings.audioEffectVolume === 0) {
      result.suggestions.push('Consider enabling alternative text feedback when all effects are disabled');
    }

    if (settings.highContrast && !settings.alternativeText) {
      result.suggestions.push('Alternative text can enhance high contrast mode effectiveness');
    }

    return result;
  }

  /**
   * Test an accessibility feature
   */
  async testAccessibilityFeature(featureId: string): Promise<TestResult> {
    const feature = this.features.get(featureId);
    if (!feature) {
      return {
        success: false,
        message: `Feature not found: ${featureId}`,
        duration: 0
      };
    }

    const startTime = performance.now();

    try {
      // Simulate the feature based on its type
      const feedback = await this.simulateFeature(feature);
      const duration = performance.now() - startTime;

      return {
        success: true,
        message: `Feature ${feature.name} tested successfully`,
        duration,
        feedback
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        message: `Feature test failed: ${(error as Error).message}`,
        duration
      };
    }
  }

  /**
   * Save current settings to storage
   */
  saveSettings(): void {
    try {
      const data = {
        settings: this.currentSettings,
        currentProfileId: this.currentProfileId,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('haunted-debug-accessibility', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Load settings from storage
   */
  loadSettings(): void {
    try {
      const stored = localStorage.getItem('haunted-debug-accessibility');
      if (stored) {
        const data = JSON.parse(stored);
        this.currentSettings = { ...this.getDefaultSettings(), ...data.settings };
        this.currentProfileId = data.currentProfileId || 'default';
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
      this.currentSettings = this.getDefaultSettings();
    }
  }

  /**
   * Export settings as JSON string
   */
  exportSettings(): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: this.currentSettings,
      profiles: Array.from(this.profiles.values()),
      features: Array.from(this.features.values()).filter(f => f.enabled)
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import settings from JSON string
   */
  importSettings(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      // Validate import data structure
      if (!importData.settings || !importData.version) {
        throw new Error('Invalid import data format');
      }

      // Import settings
      const validation = this.validateSettings(importData.settings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }

      this.currentSettings = importData.settings;

      // Import profiles if present
      if (importData.profiles) {
        for (const profile of importData.profiles) {
          if (profile.id && profile.name && profile.settings) {
            this.profiles.set(profile.id, profile);
          }
        }
      }

      // Import enabled features if present
      if (importData.features) {
        for (const feature of importData.features) {
          if (feature.id && this.features.has(feature.id)) {
            const existingFeature = this.features.get(feature.id)!;
            existingFeature.enabled = true;
            existingFeature.settings = { ...existingFeature.settings, ...feature.settings };
            this.features.set(feature.id, existingFeature);
          }
        }
      }

      // Apply imported settings
      this.applyCurrentSettings();
      this.saveSettings();
      this.saveProfiles();
      this.saveFeatures();

      return true;

    } catch (error) {
      console.error('Failed to import accessibility settings:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.profiles.clear();
    this.features.clear();
    this.feedbackProviders.clear();
    this.isInitialized = false;
  }

  /**
   * Get default accessibility settings
   */
  private getDefaultSettings(): AccessibilitySettings {
    return {
      reduceMotion: false,
      disableFlashing: false,
      visualEffectIntensity: 1.0,
      audioEffectVolume: 1.0,
      alternativeText: false,
      highContrast: false,
      screenReaderSupport: false
    };
  }

  /**
   * Initialize default accessibility profiles
   */
  private initializeDefaultProfiles(): void {
    // Default profile
    this.profiles.set('default', {
      id: 'default',
      name: 'Default',
      description: 'Standard accessibility settings',
      settings: this.getDefaultSettings(),
      isDefault: true
    });

    // Motion sensitivity profile
    this.profiles.set('motion_sensitive', {
      id: 'motion_sensitive',
      name: 'Motion Sensitive',
      description: 'Reduced motion and flashing for motion sensitivity',
      settings: {
        ...this.getDefaultSettings(),
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.3
      },
      isDefault: true
    });

    // High contrast profile
    this.profiles.set('high_contrast', {
      id: 'high_contrast',
      name: 'High Contrast',
      description: 'Enhanced contrast and alternative text',
      settings: {
        ...this.getDefaultSettings(),
        highContrast: true,
        alternativeText: true,
        visualEffectIntensity: 0.8
      },
      isDefault: true
    });

    // Audio focused profile
    this.profiles.set('audio_focused', {
      id: 'audio_focused',
      name: 'Audio Focused',
      description: 'Minimal visual effects, enhanced audio feedback',
      settings: {
        ...this.getDefaultSettings(),
        visualEffectIntensity: 0.2,
        audioEffectVolume: 1.0,
        alternativeText: true,
        screenReaderSupport: true
      },
      isDefault: true
    });

    // Minimal effects profile
    this.profiles.set('minimal', {
      id: 'minimal',
      name: 'Minimal Effects',
      description: 'Minimal visual and audio effects',
      settings: {
        ...this.getDefaultSettings(),
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.1,
        audioEffectVolume: 0.3,
        alternativeText: true
      },
      isDefault: true
    });
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibilityFeatures(): void {
    // Visual features
    this.features.set('screen_reader', {
      id: 'screen_reader',
      name: 'Screen Reader Support',
      description: 'Enhanced support for screen readers',
      category: 'visual',
      enabled: false,
      settings: { announceEffects: true, describeVisuals: true }
    });

    this.features.set('high_contrast_mode', {
      id: 'high_contrast_mode',
      name: 'High Contrast Mode',
      description: 'Increased contrast for better visibility',
      category: 'visual',
      enabled: false,
      settings: { contrastRatio: 4.5 }
    });

    this.features.set('large_text', {
      id: 'large_text',
      name: 'Large Text',
      description: 'Increased text size for better readability',
      category: 'visual',
      enabled: false,
      settings: { scaleFactor: 1.25 }
    });

    // Audio features
    this.features.set('audio_descriptions', {
      id: 'audio_descriptions',
      name: 'Audio Descriptions',
      description: 'Spoken descriptions of visual elements',
      category: 'audio',
      enabled: false,
      settings: { voice: 'default', speed: 1.0 }
    });

    this.features.set('sound_substitution', {
      id: 'sound_substitution',
      name: 'Sound Substitution',
      description: 'Replace complex sounds with simple tones',
      category: 'audio',
      enabled: false,
      settings: { useSimpleTones: true }
    });

    // Motor features
    this.features.set('keyboard_navigation', {
      id: 'keyboard_navigation',
      name: 'Enhanced Keyboard Navigation',
      description: 'Improved keyboard-only navigation',
      category: 'motor',
      enabled: false,
      settings: { showFocusIndicators: true, skipLinks: true }
    });

    this.features.set('click_assistance', {
      id: 'click_assistance',
      name: 'Click Assistance',
      description: 'Larger click targets and hover delays',
      category: 'motor',
      enabled: false,
      settings: { targetSize: 44, hoverDelay: 500 }
    });

    // Cognitive features
    this.features.set('simplified_interface', {
      id: 'simplified_interface',
      name: 'Simplified Interface',
      description: 'Reduced complexity and distractions',
      category: 'cognitive',
      enabled: false,
      settings: { hideNonEssential: true, reduceAnimations: true }
    });

    this.features.set('reading_assistance', {
      id: 'reading_assistance',
      name: 'Reading Assistance',
      description: 'Highlighting and reading guides',
      category: 'cognitive',
      enabled: false,
      settings: { highlightText: true, readingGuide: true }
    });
  }

  /**
   * Register default feedback providers
   */
  private registerDefaultFeedbackProviders(): void {
    // Visual to text feedback
    this.registerFeedbackProvider('visual_to_text', (effect) => {
      const alternatives: AlternativeFeedback[] = [];

      switch (effect.type) {
        case 'screen_shake':
          alternatives.push({
            type: 'text',
            content: 'System instability detected',
            duration: 2000
          });
          break;
        case 'glitch':
          alternatives.push({
            type: 'text',
            content: 'Data corruption occurring',
            duration: 1500
          });
          break;
        case 'color_shift':
          alternatives.push({
            type: 'text',
            content: 'System state changing',
            duration: 1000
          });
          break;
        case 'flash':
          alternatives.push({
            type: 'text',
            content: 'Alert: Important event',
            duration: 500
          });
          break;
      }

      return alternatives;
    });

    // Audio to visual feedback
    this.registerFeedbackProvider('audio_to_visual', (effect) => {
      const alternatives: AlternativeFeedback[] = [];

      switch (effect.type) {
        case 'warning':
          alternatives.push({
            type: 'visual',
            content: 'border-flash-red',
            duration: 1000,
            intensity: 0.8
          });
          break;
        case 'success':
          alternatives.push({
            type: 'visual',
            content: 'border-flash-green',
            duration: 1500,
            intensity: 0.6
          });
          break;
        case 'heartbeat':
          alternatives.push({
            type: 'visual',
            content: 'pulse-indicator',
            duration: 2000,
            intensity: effect.volume || 0.5
          });
          break;
      }

      return alternatives;
    });

    // Haptic feedback (for supported devices)
    this.registerFeedbackProvider('haptic', (effect) => {
      const alternatives: AlternativeFeedback[] = [];

      if ('vibrate' in navigator) {
        switch (effect.type) {
          case 'warning':
            alternatives.push({
              type: 'haptic',
              content: '200,100,200',
              duration: 500
            });
            break;
          case 'success':
            alternatives.push({
              type: 'haptic',
              content: '100',
              duration: 100
            });
            break;
          case 'heartbeat':
            alternatives.push({
              type: 'haptic',
              content: '50,50,50',
              duration: 150
            });
            break;
        }
      }

      return alternatives;
    });
  }

  /**
   * Detect system accessibility preferences
   */
  private async detectSystemPreferences(): Promise<void> {
    try {
      // Check for reduced motion preference
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.currentSettings.reduceMotion = true;
      }

      // Check for high contrast preference
      if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        this.currentSettings.highContrast = true;
      }

      // Check for color scheme preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Could adjust visual effects for dark mode
      }

      console.log('Detected system accessibility preferences');

    } catch (error) {
      console.warn('Could not detect system accessibility preferences:', error);
    }
  }

  /**
   * Apply current settings to the system
   */
  private applyCurrentSettings(): void {
    // Apply CSS custom properties for accessibility
    const root = document.documentElement;
    
    root.style.setProperty('--accessibility-motion-scale', 
      this.currentSettings.reduceMotion ? '0.1' : '1.0');
    
    root.style.setProperty('--accessibility-contrast-scale', 
      this.currentSettings.highContrast ? '1.5' : '1.0');
    
    root.style.setProperty('--accessibility-effect-intensity', 
      this.currentSettings.visualEffectIntensity.toString());

    // Apply accessibility classes to body
    document.body.classList.toggle('reduce-motion', this.currentSettings.reduceMotion);
    document.body.classList.toggle('disable-flashing', this.currentSettings.disableFlashing);
    document.body.classList.toggle('high-contrast', this.currentSettings.highContrast);
    document.body.classList.toggle('screen-reader-support', this.currentSettings.screenReaderSupport);

    console.log('Applied accessibility settings');
  }

  /**
   * Filter alternative feedback based on current settings
   */
  private filterAlternativesBySettings(alternatives: AlternativeFeedback[]): AlternativeFeedback[] {
    return alternatives.filter(alt => {
      // Filter based on accessibility settings
      if (alt.type === 'visual' && this.currentSettings.visualEffectIntensity === 0) {
        return false;
      }
      
      if (alt.type === 'audio' && this.currentSettings.audioEffectVolume === 0) {
        return false;
      }

      // Scale intensity based on settings
      if (alt.intensity && alt.type === 'visual') {
        alt.intensity *= this.currentSettings.visualEffectIntensity;
      }

      return true;
    });
  }

  /**
   * Apply settings for a specific feature
   */
  private applyFeatureSettings(feature: AccessibilityFeature): void {
    switch (feature.id) {
      case 'high_contrast_mode':
        this.currentSettings.highContrast = true;
        break;
      case 'screen_reader':
        this.currentSettings.screenReaderSupport = true;
        this.currentSettings.alternativeText = true;
        break;
      case 'large_text':
        document.documentElement.style.setProperty('--text-scale-factor', 
          feature.settings?.scaleFactor?.toString() || '1.25');
        break;
    }
    
    this.applyCurrentSettings();
  }

  /**
   * Remove settings for a specific feature
   */
  private removeFeatureSettings(feature: AccessibilityFeature): void {
    switch (feature.id) {
      case 'high_contrast_mode':
        this.currentSettings.highContrast = false;
        break;
      case 'screen_reader':
        this.currentSettings.screenReaderSupport = false;
        break;
      case 'large_text':
        document.documentElement.style.removeProperty('--text-scale-factor');
        break;
    }
    
    this.applyCurrentSettings();
  }

  /**
   * Simulate a feature for testing
   */
  private async simulateFeature(feature: AccessibilityFeature): Promise<AlternativeFeedback[]> {
    const feedback: AlternativeFeedback[] = [];

    switch (feature.category) {
      case 'visual':
        feedback.push({
          type: 'text',
          content: `Testing visual feature: ${feature.name}`,
          duration: 2000
        });
        break;
      case 'audio':
        feedback.push({
          type: 'audio',
          content: 'test-tone',
          duration: 1000,
          intensity: 0.5
        });
        break;
      case 'motor':
        feedback.push({
          type: 'visual',
          content: 'focus-indicator-test',
          duration: 1500
        });
        break;
      case 'cognitive':
        feedback.push({
          type: 'text',
          content: `Cognitive assistance active: ${feature.description}`,
          duration: 3000
        });
        break;
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    return feedback;
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Save profiles to storage
   */
  private saveProfiles(): void {
    try {
      const profiles = Array.from(this.profiles.values()).filter(p => !p.isDefault);
      localStorage.setItem('haunted-debug-accessibility-profiles', JSON.stringify(profiles));
    } catch (error) {
      console.error('Failed to save accessibility profiles:', error);
    }
  }

  /**
   * Load profiles from storage
   */
  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem('haunted-debug-accessibility-profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        for (const profile of profiles) {
          this.profiles.set(profile.id, profile);
        }
      }
    } catch (error) {
      console.error('Failed to load accessibility profiles:', error);
    }
  }

  /**
   * Save features to storage
   */
  private saveFeatures(): void {
    try {
      const features = Array.from(this.features.values());
      localStorage.setItem('haunted-debug-accessibility-features', JSON.stringify(features));
    } catch (error) {
      console.error('Failed to save accessibility features:', error);
    }
  }

  /**
   * Load features from storage
   */
  private loadFeatures(): void {
    try {
      const stored = localStorage.getItem('haunted-debug-accessibility-features');
      if (stored) {
        const features = JSON.parse(stored);
        for (const feature of features) {
          if (this.features.has(feature.id)) {
            this.features.set(feature.id, feature);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load accessibility features:', error);
    }
  }
}