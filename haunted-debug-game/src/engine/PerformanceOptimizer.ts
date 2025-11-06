/**
 * PerformanceOptimizer - Automatic performance adjustment and monitoring
 */

import type { DeviceCapabilities, PerformanceMetrics } from './EffectCoordinator';

export interface PerformanceOptimizer {
  initialize(): Promise<void>;
  
  // Device detection and profiling
  detectDeviceCapabilities(): Promise<DeviceCapabilities>;
  profilePerformance(): Promise<PerformanceProfile>;
  
  // Automatic optimization
  enableAutoOptimization(): void;
  disableAutoOptimization(): void;
  optimizeForTarget(targetFPS: number): Promise<OptimizationResult>;
  
  // Manual optimization controls
  setQualityLevel(level: QualityLevel): void;
  setEffectBudget(budget: EffectBudget): void;
  enableFeature(feature: PerformanceFeature, enabled: boolean): void;
  
  // Monitoring and metrics
  startMonitoring(): void;
  stopMonitoring(): void;
  getMetrics(): PerformanceMetrics;
  getOptimizationHistory(): OptimizationEvent[];
  
  // Resource management
  cleanupUnusedResources(): Promise<void>;
  preloadCriticalResources(): Promise<void>;
  
  cleanup(): void;
}

export interface PerformanceProfile {
  deviceClass: 'high-end' | 'mid-range' | 'low-end';
  recommendedSettings: QualitySettings;
  capabilities: DeviceCapabilities;
  benchmarkResults: BenchmarkResult[];
  timestamp: Date;
}

export interface OptimizationResult {
  success: boolean;
  appliedChanges: OptimizationChange[];
  performanceGain: number; // FPS improvement
  qualityImpact: number; // 0-1 scale
  message: string;
}

export interface OptimizationChange {
  setting: string;
  oldValue: any;
  newValue: any;
  impact: 'low' | 'medium' | 'high';
  reason: string;
}

export interface OptimizationEvent {
  timestamp: Date;
  trigger: 'auto' | 'manual' | 'threshold';
  changes: OptimizationChange[];
  performanceBefore: number;
  performanceAfter: number;
}

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'potato';

export interface QualitySettings {
  effectQuality: number; // 0-1
  maxConcurrentEffects: number;
  enableParticles: boolean;
  enableBloom: boolean;
  enableMotionBlur: boolean;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  textureQuality: 'low' | 'medium' | 'high';
  antiAliasing: boolean;
  vsync: boolean;
}

export interface EffectBudget {
  maxEffectsPerFrame: number;
  maxParticles: number;
  maxTextureMemory: number; // MB
  maxDrawCalls: number;
}

export type PerformanceFeature = 
  | 'effect_batching'
  | 'texture_streaming'
  | 'occlusion_culling'
  | 'level_of_detail'
  | 'dynamic_resolution'
  | 'frame_pacing';

export interface BenchmarkResult {
  test: string;
  score: number;
  duration: number;
  details: Record<string, any>;
}

export class PerformanceOptimizerImpl implements PerformanceOptimizer {
  private isInitialized = false;
  private autoOptimizationEnabled = true;
  private currentQualityLevel: QualityLevel = 'high';
  private deviceCapabilities: DeviceCapabilities | null = null;
  private performanceProfile: PerformanceProfile | null = null;
  private monitoringActive = false;
  private optimizationHistory: OptimizationEvent[] = [];
  private performanceMonitor: PerformanceMonitorAdvanced;
  private resourceManager: ResourceManager;
  private qualitySettings: QualitySettings;
  private effectBudget: EffectBudget;
  private enabledFeatures: Set<PerformanceFeature> = new Set();

  // Performance thresholds
  private readonly thresholds = {
    targetFPS: 60,
    minFPS: 30,
    criticalFPS: 15,
    memoryWarning: 512, // MB
    memoryCritical: 1024 // MB
  };

  constructor() {
    this.performanceMonitor = new PerformanceMonitorAdvanced();
    this.resourceManager = new ResourceManager();
    this.qualitySettings = this.getDefaultQualitySettings();
    this.effectBudget = this.getDefaultEffectBudget();
    
    // Enable default performance features
    this.enabledFeatures.add('effect_batching');
    this.enabledFeatures.add('texture_streaming');
  }

  /**
   * Initialize the performance optimizer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Detect device capabilities
      this.deviceCapabilities = await this.detectDeviceCapabilities();
      
      // Profile performance
      this.performanceProfile = await this.profilePerformance();
      
      // Apply initial optimizations based on device
      await this.applyDeviceOptimizations();
      
      // Start monitoring
      this.startMonitoring();
      
      // Enable auto-optimization
      if (this.autoOptimizationEnabled) {
        this.setupAutoOptimization();
      }
      
      this.isInitialized = true;
      console.log('PerformanceOptimizer initialized', {
        deviceClass: this.performanceProfile.deviceClass,
        qualityLevel: this.currentQualityLevel
      });

    } catch (error) {
      console.error('Failed to initialize PerformanceOptimizer:', error);
      // Fall back to safe defaults
      this.setQualityLevel('medium');
      this.isInitialized = true;
    }
  }

  /**
   * Detect device capabilities through various tests
   */
  async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const capabilities: DeviceCapabilities = {
      gpu: 'medium',
      memory: 4,
      cores: navigator.hardwareConcurrency || 4,
      isMobile: this.isMobileDevice(),
      supportsWebGL: this.checkWebGLSupport()
    };

    try {
      // Memory detection
      if ((navigator as any).deviceMemory) {
        capabilities.memory = (navigator as any).deviceMemory;
      }

      // GPU capability detection
      capabilities.gpu = await this.detectGPUCapability();

      // Additional mobile detection
      if (capabilities.isMobile) {
        // Mobile devices typically have lower performance
        if (capabilities.gpu === 'high') capabilities.gpu = 'medium';
        if (capabilities.memory > 6) capabilities.memory = Math.min(capabilities.memory, 6);
      }

    } catch (error) {
      console.warn('Error detecting device capabilities:', error);
    }

    return capabilities;
  }

  /**
   * Profile device performance through benchmarks
   */
  async profilePerformance(): Promise<PerformanceProfile> {
    const benchmarks: BenchmarkResult[] = [];

    try {
      // CPU benchmark
      benchmarks.push(await this.runCPUBenchmark());
      
      // GPU benchmark
      if (this.deviceCapabilities?.supportsWebGL) {
        benchmarks.push(await this.runGPUBenchmark());
      }
      
      // Memory benchmark
      benchmarks.push(await this.runMemoryBenchmark());
      
      // Effect rendering benchmark
      benchmarks.push(await this.runEffectBenchmark());

    } catch (error) {
      console.warn('Error running performance benchmarks:', error);
    }

    // Determine device class based on benchmark results
    const deviceClass = this.classifyDevice(benchmarks);
    
    return {
      deviceClass,
      recommendedSettings: this.getRecommendedSettings(deviceClass),
      capabilities: this.deviceCapabilities!,
      benchmarkResults: benchmarks,
      timestamp: new Date()
    };
  }

  /**
   * Enable automatic performance optimization
   */
  enableAutoOptimization(): void {
    this.autoOptimizationEnabled = true;
    if (this.isInitialized) {
      this.setupAutoOptimization();
    }
  }

  /**
   * Disable automatic performance optimization
   */
  disableAutoOptimization(): void {
    this.autoOptimizationEnabled = false;
  }

  /**
   * Optimize for a specific target FPS
   */
  async optimizeForTarget(targetFPS: number): Promise<OptimizationResult> {
    const startTime = performance.now();
    const initialFPS = this.performanceMonitor.getAverageFPS();
    const changes: OptimizationChange[] = [];

    try {
      // Start with current settings
      let currentFPS = initialFPS;
      
      // If we're already meeting the target, no changes needed
      if (currentFPS >= targetFPS) {
        return {
          success: true,
          appliedChanges: [],
          performanceGain: 0,
          qualityImpact: 0,
          message: `Already meeting target FPS (${currentFPS.toFixed(1)} >= ${targetFPS})`
        };
      }

      // Progressive optimization steps
      const optimizationSteps = this.getOptimizationSteps(targetFPS);
      
      for (const step of optimizationSteps) {
        // Apply optimization step
        const stepChanges = await this.applyOptimizationStep(step);
        changes.push(...stepChanges);
        
        // Wait for performance to stabilize
        await this.waitForStabilization();
        
        // Check if we've reached the target
        currentFPS = this.performanceMonitor.getAverageFPS();
        if (currentFPS >= targetFPS) {
          break;
        }
      }

      const performanceGain = currentFPS - initialFPS;
      const qualityImpact = this.calculateQualityImpact(changes);

      // Record optimization event
      this.recordOptimizationEvent('manual', changes, initialFPS, currentFPS);

      return {
        success: currentFPS >= targetFPS,
        appliedChanges: changes,
        performanceGain,
        qualityImpact,
        message: `Optimization completed. FPS: ${initialFPS.toFixed(1)} → ${currentFPS.toFixed(1)}`
      };

    } catch (error) {
      console.error('Error during optimization:', error);
      return {
        success: false,
        appliedChanges: changes,
        performanceGain: 0,
        qualityImpact: 0,
        message: `Optimization failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Set quality level manually
   */
  setQualityLevel(level: QualityLevel): void {
    this.currentQualityLevel = level;
    this.qualitySettings = this.getQualitySettingsForLevel(level);
    this.applyQualitySettings();
    
    console.log(`Quality level set to: ${level}`);
  }

  /**
   * Set effect budget limits
   */
  setEffectBudget(budget: EffectBudget): void {
    this.effectBudget = { ...budget };
    this.applyEffectBudget();
    
    console.log('Effect budget updated:', budget);
  }

  /**
   * Enable or disable performance features
   */
  enableFeature(feature: PerformanceFeature, enabled: boolean): void {
    if (enabled) {
      this.enabledFeatures.add(feature);
    } else {
      this.enabledFeatures.delete(feature);
    }
    
    this.applyFeatureSettings(feature, enabled);
    console.log(`Performance feature ${feature}: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    this.performanceMonitor.start();
    
    // Set up monitoring intervals
    this.setupMonitoringCallbacks();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.monitoringActive = false;
    this.performanceMonitor.stop();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): OptimizationEvent[] {
    return [...this.optimizationHistory];
  }

  /**
   * Clean up unused resources
   */
  async cleanupUnusedResources(): Promise<void> {
    try {
      await this.resourceManager.cleanup();
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      console.log('Resource cleanup completed');
    } catch (error) {
      console.error('Error during resource cleanup:', error);
    }
  }

  /**
   * Preload critical resources
   */
  async preloadCriticalResources(): Promise<void> {
    try {
      await this.resourceManager.preloadCritical();
      console.log('Critical resources preloaded');
    } catch (error) {
      console.error('Error preloading resources:', error);
    }
  }

  /**
   * Cleanup optimizer resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.resourceManager.cleanup();
    this.optimizationHistory = [];
    this.isInitialized = false;
  }

  /**
   * Detect GPU capability through WebGL tests
   */
  private async detectGPUCapability(): Promise<'high' | 'medium' | 'low'> {
    if (!this.deviceCapabilities?.supportsWebGL) {
      return 'low';
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl || !(gl instanceof WebGLRenderingContext)) return 'low';

      // Test various GPU capabilities
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      
      // Check for extensions
      const extensions = gl.getSupportedExtensions() || [];
      const hasFloatTextures = extensions.includes('OES_texture_float');
      const hasDepthTexture = extensions.includes('WEBGL_depth_texture');
      
      // Simple scoring system
      let score = 0;
      
      if (maxTextureSize >= 4096) score += 2;
      else if (maxTextureSize >= 2048) score += 1;
      
      if (maxRenderbufferSize >= 4096) score += 2;
      else if (maxRenderbufferSize >= 2048) score += 1;
      
      if (maxVertexAttribs >= 16) score += 1;
      if (hasFloatTextures) score += 1;
      if (hasDepthTexture) score += 1;
      
      // Run a simple rendering benchmark
      const renderScore = await this.runSimpleRenderBenchmark(gl);
      score += renderScore;

      if (score >= 7) return 'high';
      if (score >= 4) return 'medium';
      return 'low';

    } catch (error) {
      console.warn('Error detecting GPU capability:', error);
      return 'medium';
    }
  }

  /**
   * Run a simple WebGL rendering benchmark
   */
  private async runSimpleRenderBenchmark(gl: WebGLRenderingContext): Promise<number> {
    try {
      const startTime = performance.now();
      const iterations = 100;
      
      // Simple triangle rendering test
      for (let i = 0; i < iterations; i++) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      
      const duration = performance.now() - startTime;
      const fps = (iterations / duration) * 1000;
      
      // Score based on FPS
      if (fps > 1000) return 3;
      if (fps > 500) return 2;
      if (fps > 200) return 1;
      return 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check WebGL support
   */
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Run CPU benchmark
   */
  private async runCPUBenchmark(): Promise<BenchmarkResult> {
    const startTime = performance.now();
    
    // CPU-intensive calculation
    let result = 0;
    const iterations = 100000;
    
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    
    const duration = performance.now() - startTime;
    const score = iterations / duration; // Operations per millisecond
    
    return {
      test: 'CPU',
      score,
      duration,
      details: { iterations, result }
    };
  }

  /**
   * Run GPU benchmark
   */
  private async runGPUBenchmark(): Promise<BenchmarkResult> {
    const startTime = performance.now();
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const gl = canvas.getContext('webgl');
      
      if (!gl) {
        throw new Error('WebGL not available');
      }

      // Simple shader rendering test
      const iterations = 60;
      for (let i = 0; i < iterations; i++) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        // Simulate some rendering work
        gl.drawArrays(gl.TRIANGLES, 0, 100);
      }
      
      const duration = performance.now() - startTime;
      const score = iterations / duration;
      
      return {
        test: 'GPU',
        score,
        duration,
        details: { iterations, resolution: '512x512' }
      };

    } catch (error) {
      return {
        test: 'GPU',
        score: 0,
        duration: performance.now() - startTime,
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Run memory benchmark
   */
  private async runMemoryBenchmark(): Promise<BenchmarkResult> {
    const startTime = performance.now();
    
    try {
      // Memory allocation test
      const arrays: number[][] = [];
      const arraySize = 10000;
      const numArrays = 100;
      
      for (let i = 0; i < numArrays; i++) {
        const arr = new Array(arraySize);
        for (let j = 0; j < arraySize; j++) {
          arr[j] = Math.random();
        }
        arrays.push(arr);
      }
      
      // Memory access test
      let sum = 0;
      for (const arr of arrays) {
        for (const val of arr) {
          sum += val;
        }
      }
      
      const duration = performance.now() - startTime;
      const score = (numArrays * arraySize) / duration;
      
      return {
        test: 'Memory',
        score,
        duration,
        details: { arraySize, numArrays, sum }
      };

    } catch (error) {
      return {
        test: 'Memory',
        score: 0,
        duration: performance.now() - startTime,
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Run effect rendering benchmark
   */
  private async runEffectBenchmark(): Promise<BenchmarkResult> {
    const startTime = performance.now();
    
    try {
      // Simulate effect rendering
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('2D context not available');
      }

      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        // Simulate particle effects
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let j = 0; j < 100; j++) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 10,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
          ctx.fill();
        }
      }
      
      const duration = performance.now() - startTime;
      const score = iterations / duration;
      
      return {
        test: 'Effects',
        score,
        duration,
        details: { iterations, particles: 100 }
      };

    } catch (error) {
      return {
        test: 'Effects',
        score: 0,
        duration: performance.now() - startTime,
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Classify device based on benchmark results
   */
  private classifyDevice(benchmarks: BenchmarkResult[]): 'high-end' | 'mid-range' | 'low-end' {
    const scores = benchmarks.map(b => b.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Consider device memory and mobile status
    const memoryFactor = (this.deviceCapabilities?.memory || 4) / 8;
    const mobilePenalty = this.deviceCapabilities?.isMobile ? 0.7 : 1.0;
    
    const adjustedScore = avgScore * memoryFactor * mobilePenalty;
    
    if (adjustedScore > 50) return 'high-end';
    if (adjustedScore > 20) return 'mid-range';
    return 'low-end';
  }

  /**
   * Get recommended settings for device class
   */
  private getRecommendedSettings(deviceClass: 'high-end' | 'mid-range' | 'low-end'): QualitySettings {
    switch (deviceClass) {
      case 'high-end':
        return this.getQualitySettingsForLevel('high');
      case 'mid-range':
        return this.getQualitySettingsForLevel('medium');
      case 'low-end':
        return this.getQualitySettingsForLevel('low');
    }
  }

  /**
   * Apply device-specific optimizations
   */
  private async applyDeviceOptimizations(): Promise<void> {
    if (!this.performanceProfile) return;

    const { deviceClass } = this.performanceProfile;
    
    // Set quality level based on device class
    switch (deviceClass) {
      case 'high-end':
        this.setQualityLevel('high');
        break;
      case 'mid-range':
        this.setQualityLevel('medium');
        break;
      case 'low-end':
        this.setQualityLevel('low');
        break;
    }

    // Enable appropriate performance features
    if (deviceClass === 'low-end') {
      this.enableFeature('effect_batching', true);
      this.enableFeature('texture_streaming', true);
      this.enableFeature('level_of_detail', true);
    }

    // Adjust effect budget based on device
    const budget = this.getEffectBudgetForDevice(deviceClass);
    this.setEffectBudget(budget);
  }

  /**
   * Get effect budget for device class
   */
  private getEffectBudgetForDevice(deviceClass: 'high-end' | 'mid-range' | 'low-end'): EffectBudget {
    switch (deviceClass) {
      case 'high-end':
        return {
          maxEffectsPerFrame: 20,
          maxParticles: 1000,
          maxTextureMemory: 256,
          maxDrawCalls: 100
        };
      case 'mid-range':
        return {
          maxEffectsPerFrame: 10,
          maxParticles: 500,
          maxTextureMemory: 128,
          maxDrawCalls: 50
        };
      case 'low-end':
        return {
          maxEffectsPerFrame: 5,
          maxParticles: 200,
          maxTextureMemory: 64,
          maxDrawCalls: 25
        };
    }
  }

  /**
   * Setup automatic optimization monitoring
   */
  private setupAutoOptimization(): void {
    // Monitor performance and trigger optimizations when needed
    setInterval(() => {
      if (!this.autoOptimizationEnabled || !this.monitoringActive) return;

      const metrics = this.getMetrics();
      
      // Check if performance is below threshold
      if (metrics.frameRate < this.thresholds.minFPS) {
        this.triggerAutoOptimization('low_fps', metrics);
      }
      
      // Check memory usage
      if (metrics.memoryUsage > this.thresholds.memoryWarning) {
        this.triggerAutoOptimization('high_memory', metrics);
      }

    }, 5000); // Check every 5 seconds
  }

  /**
   * Trigger automatic optimization
   */
  private async triggerAutoOptimization(reason: string, metrics: PerformanceMetrics): Promise<void> {
    console.log(`Auto-optimization triggered: ${reason}`, metrics);
    
    try {
      const result = await this.optimizeForTarget(this.thresholds.targetFPS);
      
      if (result.success) {
        console.log('Auto-optimization successful:', result.message);
      } else {
        console.warn('Auto-optimization failed:', result.message);
      }

    } catch (error) {
      console.error('Error during auto-optimization:', error);
    }
  }

  /**
   * Get optimization steps for target FPS
   */
  private getOptimizationSteps(targetFPS: number): OptimizationStep[] {
    const steps: OptimizationStep[] = [];
    
    // Progressive optimization steps from least to most impactful
    steps.push({ type: 'reduce_effects', severity: 'low' });
    steps.push({ type: 'disable_particles', severity: 'medium' });
    steps.push({ type: 'reduce_quality', severity: 'medium' });
    steps.push({ type: 'disable_bloom', severity: 'high' });
    steps.push({ type: 'reduce_resolution', severity: 'high' });
    
    return steps;
  }

  /**
   * Apply optimization step
   */
  private async applyOptimizationStep(step: OptimizationStep): Promise<OptimizationChange[]> {
    const changes: OptimizationChange[] = [];
    
    switch (step.type) {
      case 'reduce_effects':
        changes.push({
          setting: 'maxConcurrentEffects',
          oldValue: this.qualitySettings.maxConcurrentEffects,
          newValue: Math.max(1, Math.floor(this.qualitySettings.maxConcurrentEffects * 0.7)),
          impact: 'low',
          reason: 'Reduce concurrent effects to improve performance'
        });
        break;
        
      case 'disable_particles':
        changes.push({
          setting: 'enableParticles',
          oldValue: this.qualitySettings.enableParticles,
          newValue: false,
          impact: 'medium',
          reason: 'Disable particle effects to reduce GPU load'
        });
        break;
        
      case 'reduce_quality':
        changes.push({
          setting: 'effectQuality',
          oldValue: this.qualitySettings.effectQuality,
          newValue: Math.max(0.1, this.qualitySettings.effectQuality * 0.8),
          impact: 'medium',
          reason: 'Reduce effect quality to improve performance'
        });
        break;
        
      case 'disable_bloom':
        changes.push({
          setting: 'enableBloom',
          oldValue: this.qualitySettings.enableBloom,
          newValue: false,
          impact: 'high',
          reason: 'Disable bloom effect to reduce GPU load'
        });
        break;
        
      case 'reduce_resolution':
        // This would need to be implemented in the rendering system
        changes.push({
          setting: 'renderScale',
          oldValue: 1.0,
          newValue: 0.8,
          impact: 'high',
          reason: 'Reduce render resolution to improve performance'
        });
        break;
    }
    
    // Apply the changes
    for (const change of changes) {
      this.applySettingChange(change);
    }
    
    return changes;
  }

  /**
   * Apply a setting change
   */
  private applySettingChange(change: OptimizationChange): void {
    switch (change.setting) {
      case 'maxConcurrentEffects':
        this.qualitySettings.maxConcurrentEffects = change.newValue;
        break;
      case 'enableParticles':
        this.qualitySettings.enableParticles = change.newValue;
        break;
      case 'effectQuality':
        this.qualitySettings.effectQuality = change.newValue;
        break;
      case 'enableBloom':
        this.qualitySettings.enableBloom = change.newValue;
        break;
      // Add more settings as needed
    }
    
    this.applyQualitySettings();
  }

  /**
   * Wait for performance to stabilize after changes
   */
  private async waitForStabilization(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 1000); // Wait 1 second for stabilization
    });
  }

  /**
   * Calculate quality impact of changes
   */
  private calculateQualityImpact(changes: OptimizationChange[]): number {
    let totalImpact = 0;
    
    for (const change of changes) {
      switch (change.impact) {
        case 'low': totalImpact += 0.1; break;
        case 'medium': totalImpact += 0.3; break;
        case 'high': totalImpact += 0.5; break;
      }
    }
    
    return Math.min(1.0, totalImpact);
  }

  /**
   * Record optimization event
   */
  private recordOptimizationEvent(
    trigger: 'auto' | 'manual' | 'threshold',
    changes: OptimizationChange[],
    performanceBefore: number,
    performanceAfter: number
  ): void {
    const event: OptimizationEvent = {
      timestamp: new Date(),
      trigger,
      changes,
      performanceBefore,
      performanceAfter
    };
    
    this.optimizationHistory.push(event);
    
    // Keep only last 50 events
    if (this.optimizationHistory.length > 50) {
      this.optimizationHistory.shift();
    }
  }

  /**
   * Setup monitoring callbacks
   */
  private setupMonitoringCallbacks(): void {
    // This would integrate with the actual performance monitoring system
    // For now, we'll just log periodic updates
    setInterval(() => {
      if (this.monitoringActive) {
        const metrics = this.getMetrics();
        console.log('Performance metrics:', {
          fps: metrics.frameRate.toFixed(1),
          memory: `${metrics.memoryUsage.toFixed(1)}MB`,
          effects: metrics.effectCount
        });
      }
    }, 10000); // Log every 10 seconds
  }

  /**
   * Apply quality settings to the system
   */
  private applyQualitySettings(): void {
    // This would integrate with the actual rendering system
    console.log('Applied quality settings:', this.qualitySettings);
  }

  /**
   * Apply effect budget to the system
   */
  private applyEffectBudget(): void {
    // This would integrate with the effect system
    console.log('Applied effect budget:', this.effectBudget);
  }

  /**
   * Apply feature settings
   */
  private applyFeatureSettings(feature: PerformanceFeature, enabled: boolean): void {
    // This would integrate with the specific feature systems
    console.log(`Applied feature setting: ${feature} = ${enabled}`);
  }

  /**
   * Get default quality settings
   */
  private getDefaultQualitySettings(): QualitySettings {
    return {
      effectQuality: 1.0,
      maxConcurrentEffects: 10,
      enableParticles: true,
      enableBloom: true,
      enableMotionBlur: false,
      shadowQuality: 'medium',
      textureQuality: 'medium',
      antiAliasing: true,
      vsync: true
    };
  }

  /**
   * Get default effect budget
   */
  private getDefaultEffectBudget(): EffectBudget {
    return {
      maxEffectsPerFrame: 10,
      maxParticles: 500,
      maxTextureMemory: 128,
      maxDrawCalls: 50
    };
  }

  /**
   * Get quality settings for specific level
   */
  private getQualitySettingsForLevel(level: QualityLevel): QualitySettings {
    const base = this.getDefaultQualitySettings();
    
    switch (level) {
      case 'ultra':
        return {
          ...base,
          effectQuality: 1.0,
          maxConcurrentEffects: 20,
          enableParticles: true,
          enableBloom: true,
          enableMotionBlur: true,
          shadowQuality: 'high',
          textureQuality: 'high',
          antiAliasing: true,
          vsync: true
        };
        
      case 'high':
        return base;
        
      case 'medium':
        return {
          ...base,
          effectQuality: 0.7,
          maxConcurrentEffects: 8,
          enableParticles: true,
          enableBloom: true,
          enableMotionBlur: false,
          shadowQuality: 'medium',
          textureQuality: 'medium',
          antiAliasing: true,
          vsync: false
        };
        
      case 'low':
        return {
          ...base,
          effectQuality: 0.5,
          maxConcurrentEffects: 5,
          enableParticles: false,
          enableBloom: false,
          enableMotionBlur: false,
          shadowQuality: 'low',
          textureQuality: 'low',
          antiAliasing: false,
          vsync: false
        };
        
      case 'potato':
        return {
          ...base,
          effectQuality: 0.2,
          maxConcurrentEffects: 2,
          enableParticles: false,
          enableBloom: false,
          enableMotionBlur: false,
          shadowQuality: 'off',
          textureQuality: 'low',
          antiAliasing: false,
          vsync: false
        };
    }
  }
}

// Supporting interfaces and classes
interface OptimizationStep {
  type: 'reduce_effects' | 'disable_particles' | 'reduce_quality' | 'disable_bloom' | 'reduce_resolution';
  severity: 'low' | 'medium' | 'high';
}

class PerformanceMonitorAdvanced {
  private frameRateHistory: number[] = [];
  private isMonitoring = false;
  private lastFrameTime = 0;

  start(): void {
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.monitorFrameRate();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  getMetrics(): PerformanceMetrics {
    const avgFPS = this.getAverageFPS();
    
    return {
      frameRate: avgFPS,
      effectCount: 0, // Would be provided by effect system
      memoryUsage: this.getMemoryUsage(),
      processingTime: 0, // Would be measured
      droppedFrames: this.getDroppedFrames()
    };
  }

  getAverageFPS(): number {
    if (this.frameRateHistory.length === 0) return 60;
    
    const sum = this.frameRateHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameRateHistory.length;
  }

  private monitorFrameRate(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.frameRateHistory.push(fps);
      
      // Keep only last 60 frames
      if (this.frameRateHistory.length > 60) {
        this.frameRateHistory.shift();
      }
    }
    
    this.lastFrameTime = currentTime;
    requestAnimationFrame(() => this.monitorFrameRate());
  }

  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  private getDroppedFrames(): number {
    return this.frameRateHistory.filter(fps => fps < 30).length;
  }
}

class ResourceManager {
  private resources: Map<string, any> = new Map();

  async cleanup(): Promise<void> {
    // Cleanup unused resources
    this.resources.clear();
  }

  async preloadCritical(): Promise<void> {
    // Preload critical resources
    console.log('Preloading critical resources...');
  }
}