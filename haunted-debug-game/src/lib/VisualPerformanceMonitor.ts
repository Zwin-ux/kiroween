/**
 * Visual Performance Monitor
 * 
 * Provides real-time monitoring of visual system performance including
 * FPS tracking, memory usage, and animation performance metrics.
 */

export interface PerformanceMetrics {
  fps: number;
  averageFPS: number;
  memoryUsage: number;
  animationMetrics: Record<string, AnimationMetrics>;
  frameDrops: number;
  lastUpdate: number;
}

export interface AnimationMetrics {
  average: number;
  min: number;
  max: number;
  count: number;
  lastDuration: number;
}

export interface PerformanceThresholds {
  targetFPS: number;
  minFPS: number;
  maxMemoryMB: number;
  maxFrameTime: number;
}

export class VisualPerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  private animationMetrics: Map<string, number[]> = new Map();
  private frameDrops = 0;
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];

  private readonly thresholds: PerformanceThresholds = {
    targetFPS: 60,
    minFPS: 30,
    maxMemoryMB: 100,
    maxFrameTime: 33.33, // 30 FPS minimum
  };

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    if (customThresholds) {
      this.thresholds = { ...this.thresholds, ...customThresholds };
    }
  }

  /**
   * Start monitoring visual performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.measureFrame();
  }

  /**
   * Stop monitoring visual performance
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Subscribe to performance metric updates
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Measure animation performance
   */
  measureAnimation(name: string, startTime: number, endTime?: number): void {
    const duration = (endTime || performance.now()) - startTime;
    
    if (!this.animationMetrics.has(name)) {
      this.animationMetrics.set(name, []);
    }

    const metrics = this.animationMetrics.get(name)!;
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Check for performance issues
    if (duration > this.thresholds.maxFrameTime) {
      console.warn(`Animation "${name}" exceeded frame time threshold: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const currentFPS = this.getCurrentFPS();
    const averageFPS = this.getAverageFPS();
    const memoryUsage = this.getCurrentMemoryUsage();

    const animationMetrics: Record<string, AnimationMetrics> = {};
    this.animationMetrics.forEach((durations, name) => {
      if (durations.length > 0) {
        const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        
        animationMetrics[name] = {
          average,
          min,
          max,
          count: durations.length,
          lastDuration: durations[durations.length - 1],
        };
      }
    });

    return {
      fps: currentFPS,
      averageFPS,
      memoryUsage,
      animationMetrics,
      frameDrops: this.frameDrops,
      lastUpdate: performance.now(),
    };
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  isPerformanceAcceptable(): boolean {
    const metrics = this.getMetrics();
    
    return (
      metrics.averageFPS >= this.thresholds.minFPS &&
      metrics.memoryUsage <= this.thresholds.maxMemoryMB
    );
  }

  /**
   * Get performance recommendations based on current metrics
   */
  getPerformanceRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.averageFPS < this.thresholds.minFPS) {
      recommendations.push('Consider reducing animation complexity or particle count');
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      recommendations.push('Memory usage is high - check for animation cleanup');
    }

    if (metrics.frameDrops > 10) {
      recommendations.push('Frequent frame drops detected - consider performance mode adjustment');
    }

    // Check individual animation performance
    Object.entries(metrics.animationMetrics).forEach(([name, animMetrics]) => {
      if (animMetrics.average > this.thresholds.maxFrameTime) {
        recommendations.push(`Animation "${name}" is slow - consider optimization`);
      }
    });

    return recommendations;
  }

  /**
   * Reset all performance metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fpsHistory = [];
    this.memoryHistory = [];
    this.animationMetrics.clear();
    this.frameDrops = 0;
  }

  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameDuration = currentTime - this.lastFrameTime;
      const fps = 1000 / frameDuration;
      
      this.fpsHistory.push(fps);
      
      // Track frame drops
      if (fps < this.thresholds.minFPS) {
        this.frameDrops++;
      }

      // Keep only last 60 frames for rolling average
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }

      // Measure memory periodically (every 30 frames)
      if (this.frameCount % 30 === 0) {
        this.measureMemoryUsage();
      }

      // Notify observers every 10 frames
      if (this.frameCount % 10 === 0) {
        this.notifyObservers();
      }
    }

    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };

  private getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory[this.fpsHistory.length - 1];
  }

  private getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  private getCurrentMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    
    // Fallback estimation based on animation complexity
    const animationCount = this.animationMetrics.size;
    const estimatedMemory = 10 + (animationCount * 2); // Base 10MB + 2MB per animation type
    return estimatedMemory;
  }

  private measureMemoryUsage(): void {
    const memoryUsage = this.getCurrentMemoryUsage();
    this.memoryHistory.push(memoryUsage);

    // Keep only last 100 measurements
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
  }

  private notifyObservers(): void {
    const metrics = this.getMetrics();
    this.observers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in performance monitor observer:', error);
      }
    });
  }
}

// Global performance monitor instance
let globalMonitor: VisualPerformanceMonitor | null = null;

/**
 * Get or create the global performance monitor instance
 */
export function getPerformanceMonitor(): VisualPerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new VisualPerformanceMonitor();
  }
  return globalMonitor;
}

/**
 * Utility function to measure animation performance
 */
export function measureAnimationPerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const monitor = getPerformanceMonitor();
  const startTime = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      monitor.measureAnimation(name, startTime);
    });
  } else {
    monitor.measureAnimation(name, startTime);
    return result;
  }
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();
  
  return {
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
    getMetrics: () => monitor.getMetrics(),
    measureAnimation: (name: string, startTime: number, endTime?: number) => 
      monitor.measureAnimation(name, startTime, endTime),
    subscribe: (callback: (metrics: PerformanceMetrics) => void) => 
      monitor.subscribe(callback),
    isPerformanceAcceptable: () => monitor.isPerformanceAcceptable(),
    getRecommendations: () => monitor.getPerformanceRecommendations(),
  };
}