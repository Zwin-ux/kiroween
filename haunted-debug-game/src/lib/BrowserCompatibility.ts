/**
 * Browser Compatibility Utilities
 * 
 * Provides utilities for detecting browser capabilities and ensuring
 * graceful degradation across different browsers and devices.
 */

export interface BrowserCapabilities {
  css: {
    customProperties: boolean;
    animations: boolean;
    transforms: boolean;
    filters: boolean;
    backdropFilter: boolean;
    gradients: boolean;
    boxShadow: boolean;
    textShadow: boolean;
    grid: boolean;
    flexbox: boolean;
  };
  js: {
    intersectionObserver: boolean;
    resizeObserver: boolean;
    performanceObserver: boolean;
    webAnimations: boolean;
    requestAnimationFrame: boolean;
    performanceAPI: boolean;
    memoryAPI: boolean;
  };
  performance: {
    level: 'high' | 'medium' | 'low';
    canHandleParticles: boolean;
    canHandleComplexAnimations: boolean;
    recommendedParticleCount: number;
  };
}

export interface BrowserInfo {
  name: string;
  version: number;
  engine: string;
  isMobile: boolean;
  isLegacy: boolean;
}

export class BrowserCompatibilityManager {
  private capabilities: BrowserCapabilities | null = null;
  private browserInfo: BrowserInfo | null = null;

  /**
   * Get comprehensive browser capabilities
   */
  getCapabilities(): BrowserCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    this.capabilities = {
      css: this.detectCSSCapabilities(),
      js: this.detectJSCapabilities(),
      performance: this.detectPerformanceCapabilities(),
    };

    return this.capabilities;
  }

  /**
   * Get browser information
   */
  getBrowserInfo(): BrowserInfo {
    if (this.browserInfo) {
      return this.browserInfo;
    }

    const ua = navigator.userAgent.toLowerCase();
    let name = 'unknown';
    let version = 0;
    let engine = 'unknown';

    // Detect browser
    if (ua.includes('chrome') && !ua.includes('edg')) {
      name = 'chrome';
      engine = 'blink';
      const match = ua.match(/chrome\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
    } else if (ua.includes('firefox')) {
      name = 'firefox';
      engine = 'gecko';
      const match = ua.match(/firefox\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      name = 'safari';
      engine = 'webkit';
      const match = ua.match(/version\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
    } else if (ua.includes('edg')) {
      name = 'edge';
      engine = 'blink';
      const match = ua.match(/edg\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
    }

    const isMobile = /mobile|android|iphone|ipad|tablet/.test(ua);
    const isLegacy = this.isLegacyBrowser(name, version);

    this.browserInfo = { name, version, engine, isMobile, isLegacy };
    return this.browserInfo;
  }

  /**
   * Get recommended performance mode based on browser capabilities
   */
  getRecommendedPerformanceMode(): 'low' | 'medium' | 'high' {
    const capabilities = this.getCapabilities();
    return capabilities.performance.level;
  }

  /**
   * Check if a specific feature is supported
   */
  supportsFeature(feature: keyof BrowserCapabilities['css'] | keyof BrowserCapabilities['js']): boolean {
    const capabilities = this.getCapabilities();
    
    if (feature in capabilities.css) {
      return capabilities.css[feature as keyof BrowserCapabilities['css']];
    }
    
    if (feature in capabilities.js) {
      return capabilities.js[feature as keyof BrowserCapabilities['js']];
    }
    
    return false;
  }

  /**
   * Get CSS fallbacks for unsupported features
   */
  getCSSFallbacks(): Record<string, string> {
    const capabilities = this.getCapabilities();
    const fallbacks: Record<string, string> = {};

    if (!capabilities.css.customProperties) {
      fallbacks['--spectral-cyan'] = '#00ffff';
      fallbacks['--spectral-amber'] = '#ffb300';
      fallbacks['--spectral-blue'] = '#2196f3';
    }

    if (!capabilities.css.filters) {
      fallbacks['filter'] = 'none';
    }

    if (!capabilities.css.backdropFilter) {
      fallbacks['backdrop-filter'] = 'none';
    }

    if (!capabilities.css.animations) {
      fallbacks['animation'] = 'none';
    }

    return fallbacks;
  }

  /**
   * Apply browser-specific optimizations
   */
  applyOptimizations(): void {
    const browserInfo = this.getBrowserInfo();
    const capabilities = this.getCapabilities();

    // Apply CSS class for browser-specific styling
    document.documentElement.classList.add(`browser-${browserInfo.name}`);
    document.documentElement.classList.add(`engine-${browserInfo.engine}`);

    if (browserInfo.isMobile) {
      document.documentElement.classList.add('is-mobile');
    }

    if (browserInfo.isLegacy) {
      document.documentElement.classList.add('is-legacy');
    }

    // Apply performance level class
    document.documentElement.classList.add(`performance-${capabilities.performance.level}`);

    // Apply feature support classes
    Object.entries(capabilities.css).forEach(([feature, supported]) => {
      if (!supported) {
        document.documentElement.classList.add(`no-${feature}`);
      }
    });

    Object.entries(capabilities.js).forEach(([feature, supported]) => {
      if (!supported) {
        document.documentElement.classList.add(`no-${feature}`);
      }
    });
  }

  private detectCSSCapabilities(): BrowserCapabilities['css'] {
    return {
      customProperties: this.supportsCSSFeature('--test', 'value'),
      animations: this.supportsCSSFeature('animation-name', 'test'),
      transforms: this.supportsCSSFeature('transform', 'translateX(0)'),
      filters: this.supportsCSSFeature('filter', 'blur(1px)'),
      backdropFilter: this.supportsCSSFeature('backdrop-filter', 'blur(1px)'),
      gradients: this.supportsCSSFeature('background', 'linear-gradient(red, blue)'),
      boxShadow: this.supportsCSSFeature('box-shadow', '0 0 10px red'),
      textShadow: this.supportsCSSFeature('text-shadow', '0 0 5px blue'),
      grid: this.supportsCSSFeature('display', 'grid'),
      flexbox: this.supportsCSSFeature('display', 'flex'),
    };
  }

  private detectJSCapabilities(): BrowserCapabilities['js'] {
    return {
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
      webAnimations: 'animate' in Element.prototype,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      performanceAPI: 'performance' in window && 'now' in performance,
      memoryAPI: 'performance' in window && 'memory' in (performance as any),
    };
  }

  private detectPerformanceCapabilities(): BrowserCapabilities['performance'] {
    const browserInfo = this.getBrowserInfo();
    const jsCapabilities = this.detectJSCapabilities();
    
    let level: 'high' | 'medium' | 'low' = 'medium';
    let canHandleParticles = true;
    let canHandleComplexAnimations = true;
    let recommendedParticleCount = 20;

    // Adjust based on browser and capabilities
    if (browserInfo.isMobile) {
      level = 'low';
      canHandleParticles = false;
      canHandleComplexAnimations = false;
      recommendedParticleCount = 5;
    } else if (browserInfo.isLegacy) {
      level = 'low';
      canHandleParticles = false;
      recommendedParticleCount = 0;
    } else if (browserInfo.name === 'chrome' && browserInfo.version >= 90) {
      level = 'high';
      recommendedParticleCount = 50;
    } else if (browserInfo.name === 'firefox' && browserInfo.version >= 85) {
      level = 'high';
      recommendedParticleCount = 40;
    } else if (browserInfo.name === 'safari' && browserInfo.version >= 14) {
      level = 'medium';
      recommendedParticleCount = 30;
    }

    // Adjust based on available APIs
    if (!jsCapabilities.requestAnimationFrame) {
      level = 'low';
      canHandleComplexAnimations = false;
    }

    if (!jsCapabilities.performanceAPI) {
      if (level === 'high') level = 'medium';
    }

    return {
      level,
      canHandleParticles,
      canHandleComplexAnimations,
      recommendedParticleCount,
    };
  }

  private supportsCSSFeature(property: string, value: string): boolean {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      try {
        return CSS.supports(property, value);
      } catch {
        return false;
      }
    }

    // Fallback for older browsers
    const element = document.createElement('div');
    const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    try {
      (element.style as any)[camelCase] = value;
      return (element.style as any)[camelCase] === value;
    } catch {
      return false;
    }
  }

  private isLegacyBrowser(name: string, version: number): boolean {
    const legacyThresholds: Record<string, number> = {
      chrome: 70,
      firefox: 65,
      safari: 12,
      edge: 79,
    };

    const threshold = legacyThresholds[name];
    return threshold ? version < threshold : true;
  }
}

// Global compatibility manager instance
let globalCompatibilityManager: BrowserCompatibilityManager | null = null;

/**
 * Get or create the global compatibility manager
 */
export function getCompatibilityManager(): BrowserCompatibilityManager {
  if (!globalCompatibilityManager) {
    globalCompatibilityManager = new BrowserCompatibilityManager();
  }
  return globalCompatibilityManager;
}

/**
 * Initialize browser compatibility optimizations
 */
export function initializeBrowserCompatibility(): BrowserCapabilities {
  const manager = getCompatibilityManager();
  manager.applyOptimizations();
  return manager.getCapabilities();
}

/**
 * Check if the current browser supports the spectral visual system
 */
export function supportsSpectralSystem(): boolean {
  const manager = getCompatibilityManager();
  const capabilities = manager.getCapabilities();
  
  // Minimum requirements for spectral system
  return (
    capabilities.css.customProperties &&
    capabilities.css.transforms &&
    capabilities.css.gradients &&
    capabilities.js.requestAnimationFrame
  );
}

/**
 * Get performance-optimized configuration for current browser
 */
export function getOptimizedConfig(): {
  particleCount: number;
  animationDuration: number;
  enableComplexEffects: boolean;
  enableParticles: boolean;
} {
  const manager = getCompatibilityManager();
  const capabilities = manager.getCapabilities();
  const browserInfo = manager.getBrowserInfo();

  return {
    particleCount: capabilities.performance.recommendedParticleCount,
    animationDuration: browserInfo.isMobile ? 0.5 : 1.0,
    enableComplexEffects: capabilities.performance.canHandleComplexAnimations,
    enableParticles: capabilities.performance.canHandleParticles,
  };
}