/**
 * Accessibility and Performance Validation Tests
 * Tests accessibility controls, alternative feedback mechanisms, and performance optimization
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { GameEngine } from './__mocks__/GameEngine';
import type { AccessibilitySettings, PerformanceSettings, DeviceCapabilities } from '@/types/game';

describe('Accessibility and Performance Features', () => {
  let gameEngine: GameEngine;
  let accessibilityManager: any;
  let performanceOptimizer: any;
  let effectCoordinator: any;
  let settingsPersistence: any;

  beforeEach(async () => {
    localStorage.clear();
    
    gameEngine = new GameEngine();
    await gameEngine.initialize();
    
    accessibilityManager = gameEngine.getAccessibilityManager();
    performanceOptimizer = gameEngine.getPerformanceOptimizer();
    effectCoordinator = gameEngine.getEffectCoordinator();
    settingsPersistence = gameEngine.getSettingsPersistence();
  });

  afterEach(async () => {
    await gameEngine.shutdown();
  });

  describe('Accessibility Controls', () => {
    test('should provide comprehensive accessibility settings', () => {
      const defaultSettings = accessibilityManager.getAccessibilitySettings();
      
      expect(defaultSettings).toBeDefined();
      expect(defaultSettings.reduceMotion).toBe(false);
      expect(defaultSettings.disableFlashing).toBe(false);
      expect(defaultSettings.visualEffectIntensity).toBe(1.0);
      expect(defaultSettings.audioEffectVolume).toBe(1.0);
      expect(defaultSettings.alternativeText).toBe(false);
      expect(defaultSettings.highContrast).toBe(false);
      expect(defaultSettings.screenReaderSupport).toBe(false);
    });

    test('should update accessibility settings correctly', async () => {
      const newSettings: AccessibilitySettings = {
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.5,
        audioEffectVolume: 0.8,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      };

      await accessibilityManager.updateAccessibilitySettings(newSettings);
      
      const updatedSettings = accessibilityManager.getAccessibilitySettings();
      expect(updatedSettings.reduceMotion).toBe(true);
      expect(updatedSettings.disableFlashing).toBe(true);
      expect(updatedSettings.visualEffectIntensity).toBe(0.5);
      expect(updatedSettings.audioEffectVolume).toBe(0.8);
      expect(updatedSettings.alternativeText).toBe(true);
      expect(updatedSettings.highContrast).toBe(true);
      expect(updatedSettings.screenReaderSupport).toBe(true);
    });

    test('should apply accessibility settings to effects system', async () => {
      const accessibilitySettings: AccessibilitySettings = {
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.3,
        audioEffectVolume: 0.6,
        alternativeText: true,
        highContrast: false,
        screenReaderSupport: true
      };

      await accessibilityManager.updateAccessibilitySettings(accessibilitySettings);
      
      // Check that effect coordinator received the settings
      const effectSettings = effectCoordinator.getAccessibilityConstraints();
      expect(effectSettings.reduceMotion).toBe(true);
      expect(effectSettings.disableFlashing).toBe(true);
      expect(effectSettings.maxIntensity).toBe(0.3);
      expect(effectSettings.audioVolume).toBe(0.6);
    });

    test('should provide alternative feedback mechanisms', async () => {
      await accessibilityManager.updateAccessibilitySettings({
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.0,
        audioEffectVolume: 0.0,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      });

      // Test alternative feedback for meter changes
      const meterFeedback = accessibilityManager.generateAlternativeFeedback('meter_change', {
        meter: 'stability',
        oldValue: 60,
        newValue: 45,
        change: -15
      });

      expect(meterFeedback).toBeDefined();
      expect(meterFeedback.textDescription).toContain('Stability decreased');
      expect(meterFeedback.ariaLabel).toBeDefined();
      expect(meterFeedback.screenReaderText).toBeDefined();
      expect(meterFeedback.visualIndicator).toBeDefined();

      // Test alternative feedback for patch application
      const patchFeedback = accessibilityManager.generateAlternativeFeedback('patch_applied', {
        patchType: 'apply',
        success: true,
        consequences: ['Stability decreased by 10', 'Insight increased by 5']
      });

      expect(patchFeedback.textDescription).toContain('Patch applied successfully');
      expect(patchFeedback.consequences).toHaveLength(2);
    });

    test('should support keyboard navigation', () => {
      const keyboardSupport = accessibilityManager.getKeyboardNavigationSupport();
      
      expect(keyboardSupport.enabled).toBe(true);
      expect(keyboardSupport.shortcuts).toBeDefined();
      expect(keyboardSupport.shortcuts.navigateRooms).toBe('Tab');
      expect(keyboardSupport.shortcuts.selectGhost).toBe('Enter');
      expect(keyboardSupport.shortcuts.openSettings).toBe('Ctrl+,');
      expect(keyboardSupport.shortcuts.toggleAccessibility).toBe('Ctrl+Alt+A');
    });

    test('should handle screen reader announcements', async () => {
      await accessibilityManager.updateAccessibilitySettings({
        screenReaderSupport: true,
        alternativeText: true,
        reduceMotion: false,
        disableFlashing: false,
        visualEffectIntensity: 1.0,
        audioEffectVolume: 1.0,
        highContrast: false
      });

      const announcements: string[] = [];
      accessibilityManager.onScreenReaderAnnouncement((text: string) => {
        announcements.push(text);
      });

      // Trigger events that should generate announcements
      await accessibilityManager.announceGameEvent('encounter_started', {
        ghostName: 'Circular Dependency Ghost',
        roomName: 'Dependency Crypt'
      });

      await accessibilityManager.announceGameEvent('meter_changed', {
        meter: 'insight',
        newValue: 75,
        change: 10
      });

      expect(announcements).toHaveLength(2);
      expect(announcements[0]).toContain('Encounter started with Circular Dependency Ghost');
      expect(announcements[1]).toContain('Insight increased to 75');
    });
  });

  describe('Performance Optimization', () => {
    test('should detect device capabilities correctly', () => {
      const capabilities = performanceOptimizer.detectDeviceCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities.cpuCores).toBeGreaterThan(0);
      expect(capabilities.memoryGB).toBeGreaterThan(0);
      expect(capabilities.gpuTier).toMatch(/^(low|medium|high)$/);
      expect(capabilities.isMobile).toBeDefined();
      expect(capabilities.supportsWebGL).toBeDefined();
      expect(capabilities.maxTextureSize).toBeGreaterThan(0);
    });

    test('should optimize settings based on device capabilities', () => {
      const lowEndDevice: DeviceCapabilities = {
        cpuCores: 2,
        memoryGB: 2,
        gpuTier: 'low',
        isMobile: true,
        supportsWebGL: false,
        maxTextureSize: 1024,
        batteryLevel: 0.3,
        isLowPowerMode: true
      };

      const optimizedSettings = performanceOptimizer.optimizeForDevice(lowEndDevice);
      
      expect(optimizedSettings.effectQuality).toBe('low');
      expect(optimizedSettings.maxParticles).toBeLessThanOrEqual(50);
      expect(optimizedSettings.animationFrameRate).toBeLessThanOrEqual(30);
      expect(optimizedSettings.textureQuality).toBe('low');
      expect(optimizedSettings.enableShadows).toBe(false);
      expect(optimizedSettings.enableBloom).toBe(false);
    });

    test('should monitor performance metrics', async () => {
      const metrics = performanceOptimizer.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.frameRate).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
      expect(metrics.renderTime).toBeGreaterThan(0);
      expect(metrics.scriptTime).toBeGreaterThan(0);
      expect(metrics.totalTime).toBeGreaterThan(0);

      // Simulate performance monitoring over time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedMetrics = performanceOptimizer.getPerformanceMetrics();
      expect(updatedMetrics.sampleCount).toBeGreaterThan(metrics.sampleCount);
    });

    test('should automatically adjust quality based on performance', async () => {
      // Mock poor performance
      const mockMetrics = {
        frameRate: 15, // Below 30 FPS threshold
        memoryUsage: 0.9, // 90% memory usage
        renderTime: 50, // High render time
        scriptTime: 30,
        totalTime: 80,
        sampleCount: 100
      };

      performanceOptimizer.updateMetrics(mockMetrics);
      
      const adjustments = await performanceOptimizer.autoAdjustQuality();
      
      expect(adjustments.qualityReduced).toBe(true);
      expect(adjustments.newSettings.effectQuality).toBe('low');
      expect(adjustments.newSettings.maxParticles).toBeLessThan(100);
      expect(adjustments.reason).toContain('performance');
    });

    test('should handle memory management', () => {
      const memoryInfo = performanceOptimizer.getMemoryInfo();
      
      expect(memoryInfo).toBeDefined();
      expect(memoryInfo.used).toBeGreaterThan(0);
      expect(memoryInfo.total).toBeGreaterThan(memoryInfo.used);
      expect(memoryInfo.percentage).toBeGreaterThan(0);
      expect(memoryInfo.percentage).toBeLessThanOrEqual(100);

      // Test memory cleanup
      const cleanupResult = performanceOptimizer.cleanupMemory();
      expect(cleanupResult.freedBytes).toBeGreaterThanOrEqual(0);
      expect(cleanupResult.itemsCleaned).toBeGreaterThanOrEqual(0);
    });

    test('should optimize for mobile devices', () => {
      const mobileSettings = performanceOptimizer.getMobileOptimizations();
      
      expect(mobileSettings).toBeDefined();
      expect(mobileSettings.reducedAnimations).toBe(true);
      expect(mobileSettings.lowerTextureQuality).toBe(true);
      expect(mobileSettings.disableComplexEffects).toBe(true);
      expect(mobileSettings.batteryOptimization).toBe(true);
      expect(mobileSettings.thermalThrottling).toBe(true);
    });
  });

  describe('Effect Customization', () => {
    test('should customize effect intensity', async () => {
      await accessibilityManager.updateAccessibilitySettings({
        visualEffectIntensity: 0.5,
        audioEffectVolume: 0.7,
        reduceMotion: false,
        disableFlashing: false,
        alternativeText: false,
        highContrast: false,
        screenReaderSupport: false
      });

      const effectSettings = effectCoordinator.getEffectSettings();
      
      expect(effectSettings.visualIntensity).toBe(0.5);
      expect(effectSettings.audioVolume).toBe(0.7);
      expect(effectSettings.motionReduced).toBe(false);
      expect(effectSettings.flashingDisabled).toBe(false);
    });

    test('should provide effect intensity controls', () => {
      const intensityControls = effectCoordinator.getIntensityControls();
      
      expect(intensityControls).toBeDefined();
      expect(intensityControls.visual).toBeDefined();
      expect(intensityControls.visual.min).toBe(0.0);
      expect(intensityControls.visual.max).toBe(1.0);
      expect(intensityControls.visual.step).toBe(0.1);
      
      expect(intensityControls.audio).toBeDefined();
      expect(intensityControls.audio.min).toBe(0.0);
      expect(intensityControls.audio.max).toBe(1.0);
      expect(intensityControls.audio.step).toBe(0.1);
    });

    test('should handle effect conflicts and priorities', async () => {
      // Enable conflicting settings
      await accessibilityManager.updateAccessibilitySettings({
        reduceMotion: true,
        visualEffectIntensity: 1.0, // High intensity but motion reduced
        disableFlashing: true,
        audioEffectVolume: 0.0, // Muted audio
        alternativeText: true,
        highContrast: false,
        screenReaderSupport: true
      });

      const resolvedSettings = effectCoordinator.resolveEffectConflicts();
      
      // Motion reduction should override high intensity
      expect(resolvedSettings.effectiveVisualIntensity).toBeLessThan(1.0);
      expect(resolvedSettings.motionEnabled).toBe(false);
      expect(resolvedSettings.flashingEnabled).toBe(false);
      expect(resolvedSettings.audioEnabled).toBe(false);
      expect(resolvedSettings.alternativeFeedbackEnabled).toBe(true);
    });
  });

  describe('Settings Persistence', () => {
    test('should persist accessibility settings', async () => {
      const settings: AccessibilitySettings = {
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.6,
        audioEffectVolume: 0.8,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      };

      await settingsPersistence.saveAccessibilitySettings(settings);
      
      // Create new instance and load settings
      const newSettingsPersistence = new SettingsPersistence();
      const loadedSettings = await newSettingsPersistence.loadAccessibilitySettings();
      
      expect(loadedSettings).toEqual(settings);
    });

    test('should persist performance settings', async () => {
      const settings: PerformanceSettings = {
        effectQuality: 'medium',
        maxParticles: 75,
        animationFrameRate: 45,
        textureQuality: 'medium',
        enableShadows: true,
        enableBloom: false,
        autoOptimize: true,
        batteryOptimization: true
      };

      await settingsPersistence.savePerformanceSettings(settings);
      
      const newSettingsPersistence = new SettingsPersistence();
      const loadedSettings = await newSettingsPersistence.loadPerformanceSettings();
      
      expect(loadedSettings).toEqual(settings);
    });

    test('should apply settings immediately on load', async () => {
      const accessibilitySettings: AccessibilitySettings = {
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.4,
        audioEffectVolume: 0.6,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      };

      await settingsPersistence.saveAccessibilitySettings(accessibilitySettings);
      
      // Create new game engine (simulates app restart)
      const newGameEngine = new GameEngine();
      await newGameEngine.initialize();
      
      const newAccessibilityManager = newGameEngine.getAccessibilityManager();
      const appliedSettings = newAccessibilityManager.getAccessibilitySettings();
      
      expect(appliedSettings).toEqual(accessibilitySettings);
      
      await newGameEngine.shutdown();
    });

    test('should handle corrupted settings gracefully', async () => {
      // Save valid settings
      await settingsPersistence.saveAccessibilitySettings({
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.5,
        audioEffectVolume: 0.5,
        alternativeText: true,
        highContrast: false,
        screenReaderSupport: true
      });

      // Corrupt the stored data
      localStorage.setItem('haunted-debug-accessibility-settings', 'invalid-json');
      
      // Should load default settings without error
      const newSettingsPersistence = new SettingsPersistence();
      const loadedSettings = await newSettingsPersistence.loadAccessibilitySettings();
      
      expect(loadedSettings).toBeDefined();
      expect(loadedSettings.reduceMotion).toBe(false); // Default value
      expect(loadedSettings.visualEffectIntensity).toBe(1.0); // Default value
    });
  });

  describe('Integration Testing', () => {
    test('should integrate accessibility and performance systems', async () => {
      // Set accessibility requirements
      await accessibilityManager.updateAccessibilitySettings({
        reduceMotion: true,
        visualEffectIntensity: 0.3,
        audioEffectVolume: 0.0,
        disableFlashing: true,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      });

      // Set performance constraints
      const lowEndDevice: DeviceCapabilities = {
        cpuCores: 2,
        memoryGB: 1,
        gpuTier: 'low',
        isMobile: true,
        supportsWebGL: false,
        maxTextureSize: 512,
        batteryLevel: 0.2,
        isLowPowerMode: true
      };

      performanceOptimizer.optimizeForDevice(lowEndDevice);
      
      // Check that both systems work together
      const finalEffectSettings = effectCoordinator.getEffectSettings();
      
      expect(finalEffectSettings.visualIntensity).toBeLessThanOrEqual(0.3);
      expect(finalEffectSettings.audioVolume).toBe(0.0);
      expect(finalEffectSettings.motionReduced).toBe(true);
      expect(finalEffectSettings.flashingDisabled).toBe(true);
      expect(finalEffectSettings.qualityLevel).toBe('low');
    });

    test('should validate complete accessibility workflow', async () => {
      // Enable comprehensive accessibility
      await accessibilityManager.updateAccessibilitySettings({
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.0,
        audioEffectVolume: 0.0,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      });

      // Test game events with accessibility enabled
      const events = [
        { type: 'encounter_started', data: { ghostName: 'Test Ghost' } },
        { type: 'meter_changed', data: { meter: 'stability', change: -10 } },
        { type: 'patch_applied', data: { success: true, consequences: ['Test consequence'] } }
      ];

      const feedbackResults = [];
      for (const event of events) {
        const feedback = accessibilityManager.generateAlternativeFeedback(event.type, event.data);
        feedbackResults.push(feedback);
      }

      expect(feedbackResults).toHaveLength(3);
      feedbackResults.forEach(feedback => {
        expect(feedback.textDescription).toBeDefined();
        expect(feedback.ariaLabel).toBeDefined();
        expect(feedback.screenReaderText).toBeDefined();
      });
    });
  });
});