/**
 * SettingsPersistence - Handles saving and loading of all game settings
 */

import type { AccessibilitySettings } from '@/types/game';

export interface SettingsData {
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
  audio: AudioSettings;
  visual: VisualSettings;
  gameplay: GameplaySettings;
}

export interface PerformanceSettings {
  mode: 'high' | 'medium' | 'low';
  maxConcurrentEffects: number;
  effectQualityScale: number;
  enableBatching: boolean;
  frameRateTarget: number;
  autoOptimize: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  heartbeatVolume: number;
  whisperVolume: number;
  muteAll: boolean;
  enableSpatialAudio: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export interface VisualSettings {
  effectIntensity: number;
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  contrastLevel: number;
  brightnessLevel: number;
  enableParticles: boolean;
  enableBloom: boolean;
  enableMotionBlur: boolean;
}

export interface GameplaySettings {
  autoSave: boolean;
  saveInterval: number; // minutes
  showHints: boolean;
  pauseOnFocusLoss: boolean;
  confirmDestructiveActions: boolean;
  skipAnimations: boolean;
}

export interface SettingsPersistence {
  initialize(): Promise<void>;
  
  // Settings management
  saveSettings(settings: Partial<SettingsData>): Promise<void>;
  loadSettings(): Promise<SettingsData>;
  resetSettings(category?: keyof SettingsData): Promise<void>;
  
  // Import/Export
  exportSettings(): Promise<string>;
  importSettings(data: string): Promise<boolean>;
  
  // Validation
  validateSettings(settings: Partial<SettingsData>): ValidationResult;
  
  // Migration
  migrateSettings(oldVersion: string, newVersion: string): Promise<void>;
  
  // Backup and restore
  createBackup(): Promise<string>;
  restoreFromBackup(backupData: string): Promise<boolean>;
  
  // Event handling
  onSettingsChanged(callback: (settings: SettingsData) => void): void;
  offSettingsChanged(callback: (settings: SettingsData) => void): void;
  
  cleanup(): void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedSettings?: Partial<SettingsData>;
}

export class SettingsPersistenceImpl implements SettingsPersistence {
  private currentSettings: SettingsData;
  private changeCallbacks: Set<(settings: SettingsData) => void> = new Set();
  private storageKey = 'haunted-debug-settings';
  private backupKey = 'haunted-debug-settings-backup';
  private versionKey = 'haunted-debug-settings-version';
  private currentVersion = '1.0.0';
  private isInitialized = false;

  constructor() {
    this.currentSettings = this.getDefaultSettings();
  }

  /**
   * Initialize the settings persistence system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check for version migration needs
      await this.checkAndMigrateVersion();
      
      // Load existing settings
      this.currentSettings = await this.loadSettings();
      
      // Validate loaded settings
      const validation = this.validateSettings(this.currentSettings);
      if (!validation.isValid) {
        console.warn('Invalid settings detected, applying fixes:', validation.errors);
        if (validation.fixedSettings) {
          this.currentSettings = { ...this.currentSettings, ...validation.fixedSettings };
          await this.saveSettings(this.currentSettings);
        }
      }

      // Create initial backup
      await this.createBackup();
      
      this.isInitialized = true;
      console.log('SettingsPersistence initialized');

    } catch (error) {
      console.error('Failed to initialize SettingsPersistence:', error);
      // Fall back to defaults
      this.currentSettings = this.getDefaultSettings();
      this.isInitialized = true;
    }
  }

  /**
   * Save settings to persistent storage
   */
  async saveSettings(settings: Partial<SettingsData>): Promise<void> {
    try {
      // Merge with current settings
      const newSettings = { ...this.currentSettings, ...settings };
      
      // Validate before saving
      const validation = this.validateSettings(newSettings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }

      // Save to localStorage
      const dataToSave = {
        settings: newSettings,
        timestamp: new Date().toISOString(),
        version: this.currentVersion
      };

      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
      
      // Update current settings
      this.currentSettings = newSettings;
      
      // Notify listeners
      this.notifySettingsChanged();
      
      console.log('Settings saved successfully');

    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Load settings from persistent storage
   */
  async loadSettings(): Promise<SettingsData> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.getDefaultSettings();
      }

      const data = JSON.parse(stored);
      
      // Check version compatibility
      if (data.version && data.version !== this.currentVersion) {
        console.log(`Settings version mismatch: ${data.version} -> ${this.currentVersion}`);
        await this.migrateSettings(data.version, this.currentVersion);
      }

      // Merge with defaults to ensure all properties exist
      const loadedSettings = this.mergeWithDefaults(data.settings || {});
      
      console.log('Settings loaded successfully');
      return loadedSettings;

    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(category?: keyof SettingsData): Promise<void> {
    try {
      if (category) {
        // Reset specific category
        const defaults = this.getDefaultSettings();
        this.currentSettings[category] = defaults[category];
      } else {
        // Reset all settings
        this.currentSettings = this.getDefaultSettings();
      }

      await this.saveSettings(this.currentSettings);
      console.log(`Settings reset: ${category || 'all'}`);

    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Export settings as JSON string
   */
  async exportSettings(): Promise<string> {
    try {
      const exportData = {
        version: this.currentVersion,
        timestamp: new Date().toISOString(),
        settings: this.currentSettings,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON string
   */
  async importSettings(data: string): Promise<boolean> {
    try {
      const importData = JSON.parse(data);
      
      // Validate import structure
      if (!importData.settings || !importData.version) {
        throw new Error('Invalid import data format');
      }

      // Validate settings content
      const validation = this.validateSettings(importData.settings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings in import: ${validation.errors.join(', ')}`);
      }

      // Create backup before import
      await this.createBackup();

      // Apply imported settings
      await this.saveSettings(importData.settings);
      
      console.log('Settings imported successfully');
      return true;

    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Validate settings data
   */
  validateSettings(settings: Partial<SettingsData>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fixedSettings: {}
    };

    // Validate accessibility settings
    if (settings.accessibility) {
      const acc = settings.accessibility;
      
      if (typeof acc.visualEffectIntensity === 'number' && (acc.visualEffectIntensity < 0 || acc.visualEffectIntensity > 1)) {
        result.errors.push('Visual effect intensity must be between 0 and 1');
        if (!result.fixedSettings!.accessibility) result.fixedSettings!.accessibility = {} as AccessibilitySettings;
        (result.fixedSettings!.accessibility as any).visualEffectIntensity = Math.max(0, Math.min(1, acc.visualEffectIntensity));
      }

      if (typeof acc.audioEffectVolume === 'number' && (acc.audioEffectVolume < 0 || acc.audioEffectVolume > 1)) {
        result.errors.push('Audio effect volume must be between 0 and 1');
        if (!result.fixedSettings!.accessibility) result.fixedSettings!.accessibility = {} as AccessibilitySettings;
        (result.fixedSettings!.accessibility as any).audioEffectVolume = Math.max(0, Math.min(1, acc.audioEffectVolume));
      }
    }

    // Validate performance settings
    if (settings.performance) {
      const perf = settings.performance;
      
      if (typeof perf.maxConcurrentEffects === 'number' && (perf.maxConcurrentEffects < 1 || perf.maxConcurrentEffects > 20)) {
        result.errors.push('Max concurrent effects must be between 1 and 20');
        if (!result.fixedSettings!.performance) result.fixedSettings!.performance = {} as PerformanceSettings;
        (result.fixedSettings!.performance as any).maxConcurrentEffects = Math.max(1, Math.min(20, perf.maxConcurrentEffects));
      }

      if (perf.frameRateTarget < 15 || perf.frameRateTarget > 120) {
        result.warnings.push('Frame rate target outside recommended range (15-120)');
      }
    }

    // Validate audio settings
    if (settings.audio) {
      const audio = settings.audio;
      const volumeProperties = ['masterVolume', 'sfxVolume', 'ambientVolume', 'heartbeatVolume', 'whisperVolume'];
      
      for (const prop of volumeProperties) {
        const value = (audio as any)[prop];
        if (typeof value === 'number' && (value < 0 || value > 1)) {
          result.errors.push(`${prop} must be between 0 and 1`);
          if (!result.fixedSettings!.audio) result.fixedSettings!.audio = {} as AudioSettings;
          (result.fixedSettings!.audio as any)[prop] = Math.max(0, Math.min(1, value));
        }
      }
    }

    // Validate visual settings
    if (settings.visual) {
      const visual = settings.visual;
      
      if (typeof visual.effectIntensity === 'number' && (visual.effectIntensity < 0 || visual.effectIntensity > 1)) {
        result.errors.push('Effect intensity must be between 0 and 1');
        if (!result.fixedSettings!.visual) result.fixedSettings!.visual = {} as VisualSettings;
        (result.fixedSettings!.visual as any).effectIntensity = Math.max(0, Math.min(1, visual.effectIntensity));
      }

      if (visual.contrastLevel < 0.5 || visual.contrastLevel > 2.0) {
        result.warnings.push('Contrast level outside recommended range (0.5-2.0)');
      }
    }

    // Validate gameplay settings
    if (settings.gameplay) {
      const gameplay = settings.gameplay;
      
      if (gameplay.saveInterval < 1 || gameplay.saveInterval > 60) {
        result.warnings.push('Save interval outside recommended range (1-60 minutes)');
      }
    }

    // Set validation result
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Migrate settings between versions
   */
  async migrateSettings(oldVersion: string, newVersion: string): Promise<void> {
    try {
      console.log(`Migrating settings from ${oldVersion} to ${newVersion}`);

      // Version-specific migration logic
      if (oldVersion === '0.9.0' && newVersion === '1.0.0') {
        // Example migration: rename old property names
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          
          // Migrate old accessibility structure
          if (data.settings.accessibility && data.settings.accessibility.motionReduction) {
            data.settings.accessibility.reduceMotion = data.settings.accessibility.motionReduction;
            delete data.settings.accessibility.motionReduction;
          }

          // Save migrated data
          localStorage.setItem(this.storageKey, JSON.stringify(data));
        }
      }

      // Update version
      localStorage.setItem(this.versionKey, newVersion);
      
      console.log('Settings migration completed');

    } catch (error) {
      console.error('Failed to migrate settings:', error);
      throw error;
    }
  }

  /**
   * Create a backup of current settings
   */
  async createBackup(): Promise<string> {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: this.currentVersion,
        settings: this.currentSettings
      };

      const backupString = JSON.stringify(backupData);
      localStorage.setItem(this.backupKey, backupString);
      
      console.log('Settings backup created');
      return backupString;

    } catch (error) {
      console.error('Failed to create settings backup:', error);
      throw error;
    }
  }

  /**
   * Restore settings from backup
   */
  async restoreFromBackup(backupData: string): Promise<boolean> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.settings || !backup.version) {
        throw new Error('Invalid backup data format');
      }

      // Validate backup settings
      const validation = this.validateSettings(backup.settings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings in backup: ${validation.errors.join(', ')}`);
      }

      // Apply backup settings
      await this.saveSettings(backup.settings);
      
      console.log('Settings restored from backup');
      return true;

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Register callback for settings changes
   */
  onSettingsChanged(callback: (settings: SettingsData) => void): void {
    this.changeCallbacks.add(callback);
  }

  /**
   * Unregister callback for settings changes
   */
  offSettingsChanged(callback: (settings: SettingsData) => void): void {
    this.changeCallbacks.delete(callback);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.changeCallbacks.clear();
    this.isInitialized = false;
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SettingsData {
    return {
      accessibility: {
        reduceMotion: false,
        disableFlashing: false,
        visualEffectIntensity: 1.0,
        audioEffectVolume: 1.0,
        alternativeText: false,
        highContrast: false,
        screenReaderSupport: false
      },
      performance: {
        mode: 'high',
        maxConcurrentEffects: 10,
        effectQualityScale: 1.0,
        enableBatching: true,
        frameRateTarget: 60,
        autoOptimize: true
      },
      audio: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        ambientVolume: 0.6,
        heartbeatVolume: 0.7,
        whisperVolume: 0.5,
        muteAll: false,
        enableSpatialAudio: true,
        audioQuality: 'medium'
      },
      visual: {
        effectIntensity: 1.0,
        colorBlindnessMode: 'none',
        contrastLevel: 1.0,
        brightnessLevel: 1.0,
        enableParticles: true,
        enableBloom: true,
        enableMotionBlur: false
      },
      gameplay: {
        autoSave: true,
        saveInterval: 5,
        showHints: true,
        pauseOnFocusLoss: true,
        confirmDestructiveActions: true,
        skipAnimations: false
      }
    };
  }

  /**
   * Merge loaded settings with defaults
   */
  private mergeWithDefaults(loadedSettings: Partial<SettingsData>): SettingsData {
    const defaults = this.getDefaultSettings();
    
    return {
      accessibility: { ...defaults.accessibility, ...loadedSettings.accessibility },
      performance: { ...defaults.performance, ...loadedSettings.performance },
      audio: { ...defaults.audio, ...loadedSettings.audio },
      visual: { ...defaults.visual, ...loadedSettings.visual },
      gameplay: { ...defaults.gameplay, ...loadedSettings.gameplay }
    };
  }

  /**
   * Check and migrate version if needed
   */
  private async checkAndMigrateVersion(): Promise<void> {
    try {
      const storedVersion = localStorage.getItem(this.versionKey);
      
      if (!storedVersion) {
        // First time setup
        localStorage.setItem(this.versionKey, this.currentVersion);
        return;
      }

      if (storedVersion !== this.currentVersion) {
        await this.migrateSettings(storedVersion, this.currentVersion);
      }

    } catch (error) {
      console.error('Failed to check/migrate version:', error);
    }
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifySettingsChanged(): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback(this.currentSettings);
      } catch (error) {
        console.error('Error in settings change callback:', error);
      }
    }
  }
}