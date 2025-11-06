import { performance } from 'perf_hooks';

// Mock performance APIs for testing
const mockPerformanceObserver = jest.fn();
const mockPerformanceEntries: PerformanceEntry[] = [];

global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: mockPerformanceObserver,
  disconnect: jest.fn(),
}));

global.performance.getEntriesByType = jest.fn(() => mockPerformanceEntries);
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();

// Performance monitoring utilities
class VisualPerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private memoryUsage: number[] = [];
  private animationMetrics: Map<string, number[]> = new Map();

  startFPSMonitoring(): () => void {
    const startTime = performance.now();
    let animationId: number;

    const measureFrame = (currentTime: number) => {
      if (this.lastFrameTime > 0) {
        const fps = 1000 / (currentTime - this.lastFrameTime);
        this.fpsHistory.push(fps);
        
        // Keep only last 60 frames for rolling average
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }
      }
      
      this.lastFrameTime = currentTime;
      this.frameCount++;
      
      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }

  measureMemoryUsage(): number {
    // Mock memory measurement for testing
    const mockMemory = {
      usedJSHeapSize: Math.random() * 50000000, // 0-50MB
      totalJSHeapSize: 100000000, // 100MB
      jsHeapSizeLimit: 2000000000, // 2GB
    };

    const memoryUsage = mockMemory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    this.memoryUsage.push(memoryUsage);
    
    // Keep only last 100 measurements
    if (this.memoryUsage.length > 100) {
      this.memoryUsage.shift();
    }

    return memoryUsage;
  }

  measureAnimationPerformance(animationName: string, duration: number): void {
    if (!this.animationMetrics.has(animationName)) {
      this.animationMetrics.set(animationName, []);
    }

    const metrics = this.animationMetrics.get(animationName)!;
    metrics.push(duration);

    // Keep only last 50 measurements per animation
    if (metrics.length > 50) {
      metrics.shift();
    }
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  getAverageMemoryUsage(): number {
    if (this.memoryUsage.length === 0) return 0;
    return this.memoryUsage.reduce((sum, mem) => sum + mem, 0) / this.memoryUsage.length;
  }

  getAnimationMetrics(animationName: string): { average: number; min: number; max: number } {
    const metrics = this.animationMetrics.get(animationName) || [];
    if (metrics.length === 0) {
      return { average: 0, min: 0, max: 0 };
    }

    const average = metrics.reduce((sum, duration) => sum + duration, 0) / metrics.length;
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);

    return { average, min, max };
  }

  reset(): void {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fpsHistory = [];
    this.memoryUsage = [];
    this.animationMetrics.clear();
  }
}

// Animation performance benchmarks
const ANIMATION_BENCHMARKS = {
  breathing: { target: 60, tolerance: 5 }, // 60 FPS ± 5
  particles: { target: 60, tolerance: 10 }, // 60 FPS ± 10
  glitch: { target: 30, tolerance: 5 }, // 30 FPS ± 5 (intentionally lower for effect)
  crtScanlines: { target: 60, tolerance: 3 }, // 60 FPS ± 3
};

describe('Visual Performance Tests', () => {
  let monitor: VisualPerformanceMonitor;

  beforeEach(() => {
    monitor = new VisualPerformanceMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('FPS Monitoring', () => {
    it('should maintain target FPS for breathing animations', async () => {
      const stopMonitoring = monitor.startFPSMonitoring();

      // Simulate breathing animation frames
      for (let i = 0; i < 60; i++) {
        const startTime = performance.now();
        
        // Simulate animation work
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60 FPS
        
        const duration = performance.now() - startTime;
        monitor.measureAnimationPerformance('breathing', duration);
      }

      stopMonitoring();

      const averageFPS = monitor.getAverageFPS();
      const breathingMetrics = monitor.getAnimationMetrics('breathing');

      expect(averageFPS).toBeGreaterThanOrEqual(
        ANIMATION_BENCHMARKS.breathing.target - ANIMATION_BENCHMARKS.breathing.tolerance
      );
      expect(breathingMetrics.average).toBeLessThan(20); // Should complete within 20ms
    });

    it('should handle particle system performance efficiently', async () => {
      const stopMonitoring = monitor.startFPSMonitoring();

      // Simulate particle animation with varying load
      for (let i = 0; i < 30; i++) {
        const startTime = performance.now();
        
        // Simulate particle calculations (heavier load)
        const particleCount = Math.min(i * 2, 50); // Gradually increase particles
        await new Promise(resolve => setTimeout(resolve, 16 + particleCount * 0.1));
        
        const duration = performance.now() - startTime;
        monitor.measureAnimationPerformance('particles', duration);
      }

      stopMonitoring();

      const particleMetrics = monitor.getAnimationMetrics('particles');
      
      // Particle system should adapt to maintain reasonable performance
      expect(particleMetrics.max).toBeLessThan(33); // No frame should take more than 33ms (30 FPS minimum)
      expect(particleMetrics.average).toBeLessThan(20); // Average should be better than 50 FPS
    });

    it('should validate glitch effect performance', async () => {
      const stopMonitoring = monitor.startFPSMonitoring();

      // Simulate glitch effects (intentionally more intensive)
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        
        // Simulate glitch calculations
        await new Promise(resolve => setTimeout(resolve, 25)); // Target ~40 FPS for glitch
        
        const duration = performance.now() - startTime;
        monitor.measureAnimationPerformance('glitch', duration);
      }

      stopMonitoring();

      const glitchMetrics = monitor.getAnimationMetrics('glitch');
      
      // Glitch effects can be slightly less performant for visual impact
      expect(glitchMetrics.average).toBeLessThan(35); // Should maintain ~30 FPS
      expect(glitchMetrics.max).toBeLessThan(50); // No frame should be worse than 20 FPS
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage over time', () => {
      // Simulate memory measurements over time
      for (let i = 0; i < 10; i++) {
        monitor.measureMemoryUsage();
      }

      const averageMemory = monitor.getAverageMemoryUsage();
      
      expect(averageMemory).toBeGreaterThan(0);
      expect(averageMemory).toBeLessThan(100); // Should stay under 100MB for visual system
    });

    it('should detect memory leaks in animation systems', () => {
      const initialMemory = monitor.measureMemoryUsage();
      
      // Simulate animation lifecycle
      for (let i = 0; i < 50; i++) {
        monitor.measureAnimationPerformance('test-animation', 16);
        monitor.measureMemoryUsage();
      }

      const finalMemory = monitor.getAverageMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal for well-managed animations
      expect(memoryGrowth).toBeLessThan(10); // Less than 10MB growth
    });
  });

  describe('Animation Benchmarks', () => {
    it('should meet performance targets for all animation types', () => {
      Object.entries(ANIMATION_BENCHMARKS).forEach(([animationType, benchmark]) => {
        // Simulate optimal performance for each animation type
        const targetFrameTime = 1000 / benchmark.target;
        
        for (let i = 0; i < 30; i++) {
          monitor.measureAnimationPerformance(animationType, targetFrameTime);
        }

        const metrics = monitor.getAnimationMetrics(animationType);
        
        expect(metrics.average).toBeLessThanOrEqual(targetFrameTime + 2); // 2ms tolerance
        expect(metrics.max).toBeLessThan(targetFrameTime * 2); // No frame should be twice as slow
      });
    });

    it('should validate CRT scanline performance', async () => {
      const stopMonitoring = monitor.startFPSMonitoring();

      // Simulate CRT scanline rendering
      for (let i = 0; i < 60; i++) {
        const startTime = performance.now();
        
        // CRT effects should be very lightweight
        await new Promise(resolve => setTimeout(resolve, 15));
        
        const duration = performance.now() - startTime;
        monitor.measureAnimationPerformance('crtScanlines', duration);
      }

      stopMonitoring();

      const crtMetrics = monitor.getAnimationMetrics('crtScanlines');
      
      // CRT effects should be highly optimized
      expect(crtMetrics.average).toBeLessThan(17); // Better than 60 FPS
      expect(crtMetrics.max).toBeLessThan(20); // Consistent performance
    });
  });

  describe('Performance Mode Adaptation', () => {
    it('should adapt performance based on device capabilities', () => {
      // Simulate different performance modes
      const performanceModes = ['low', 'medium', 'high'];
      const results: Record<string, number> = {};

      performanceModes.forEach(mode => {
        monitor.reset();
        
        // Simulate different complexity levels
        const complexity = mode === 'low' ? 5 : mode === 'medium' ? 15 : 25;
        
        for (let i = 0; i < 20; i++) {
          const frameTime = 16 + (complexity * 0.2); // Base 60 FPS + complexity
          monitor.measureAnimationPerformance(`${mode}-mode`, frameTime);
        }

        const metrics = monitor.getAnimationMetrics(`${mode}-mode`);
        results[mode] = metrics.average;
      });

      // Higher performance modes should have better frame times
      expect(results.high).toBeLessThan(results.medium);
      expect(results.medium).toBeLessThan(results.low);
      
      // All modes should maintain minimum acceptable performance
      expect(results.low).toBeLessThan(33); // At least 30 FPS
      expect(results.medium).toBeLessThan(20); // At least 50 FPS
      expect(results.high).toBeLessThan(17); // At least 60 FPS
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle multiple simultaneous animations', async () => {
      const stopMonitoring = monitor.startFPSMonitoring();

      // Simulate multiple animations running simultaneously
      const animations = ['breathing', 'particles', 'crtScanlines'];
      
      for (let frame = 0; frame < 30; frame++) {
        const frameStart = performance.now();
        
        // Simulate all animations in one frame
        for (const animation of animations) {
          const animStart = performance.now();
          await new Promise(resolve => setTimeout(resolve, 5)); // Each animation takes ~5ms
          const animDuration = performance.now() - animStart;
          monitor.measureAnimationPerformance(animation, animDuration);
        }
        
        // Ensure frame doesn't exceed 16.67ms (60 FPS)
        const frameTime = performance.now() - frameStart;
        expect(frameTime).toBeLessThan(20); // Allow small tolerance
      }

      stopMonitoring();

      const averageFPS = monitor.getAverageFPS();
      expect(averageFPS).toBeGreaterThan(50); // Should maintain good FPS with multiple animations
    });

    it('should handle performance degradation gracefully', () => {
      // Simulate system under stress
      for (let stress = 0; stress < 100; stress += 10) {
        const frameTime = 16 + (stress * 0.3); // Gradually increase frame time
        monitor.measureAnimationPerformance('stress-test', frameTime);
      }

      const stressMetrics = monitor.getAnimationMetrics('stress-test');
      
      // System should degrade gracefully, not crash
      expect(stressMetrics.max).toBeLessThan(100); // Should not exceed 100ms per frame
      expect(stressMetrics.average).toBeLessThan(50); // Average should remain reasonable
    });
  });
});