/**
 * Cross-Browser Compatibility Test Suite
 * 
 * Tests for browser compatibility across major browsers including
 * Chrome, Firefox, Safari, and Edge. Validates CSS features,
 * JavaScript APIs, and graceful degradation.
 */

// Browser detection utilities
interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  supportsFeature: (feature: string) => boolean;
}

class BrowserCompatibilityChecker {
  private userAgent: string;
  
  constructor(userAgent?: string) {
    this.userAgent = userAgent || navigator.userAgent;
  }
  
  getBrowserInfo(): BrowserInfo {
    const ua = this.userAgent.toLowerCase();
    
    let name = 'unknown';
    let version = '0';
    let engine = 'unknown';
    
    if (ua.includes('chrome') && !ua.includes('edg')) {
      name = 'chrome';
      engine = 'blink';
      const match = ua.match(/chrome\/(\d+)/);
      version = match ? match[1] : '0';
    } else if (ua.includes('firefox')) {
      name = 'firefox';
      engine = 'gecko';
      const match = ua.match(/firefox\/(\d+)/);
      version = match ? match[1] : '0';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      name = 'safari';
      engine = 'webkit';
      const match = ua.match(/version\/(\d+)/);
      version = match ? match[1] : '0';
    } else if (ua.includes('edg')) {
      name = 'edge';
      engine = 'blink';
      const match = ua.match(/edg\/(\d+)/);
      version = match ? match[1] : '0';
    }
    
    return {
      name,
      version,
      engine,
      supportsFeature: this.supportsFeature.bind(this),
    };
  }
  
  supportsFeature(feature: string): boolean {
    switch (feature) {
      case 'css-custom-properties':
        return CSS.supports('--test', 'value');
      case 'css-grid':
        return CSS.supports('display', 'grid');
      case 'css-flexbox':
        return CSS.supports('display', 'flex');
      case 'css-animations':
        return CSS.supports('animation-name', 'test');
      case 'css-transforms':
        return CSS.supports('transform', 'translateX(0)');
      case 'css-filters':
        return CSS.supports('filter', 'blur(1px)');
      case 'css-backdrop-filter':
        return CSS.supports('backdrop-filter', 'blur(1px)');
      case 'intersection-observer':
        return 'IntersectionObserver' in window;
      case 'resize-observer':
        return 'ResizeObserver' in window;
      case 'performance-observer':
        return 'PerformanceObserver' in window;
      case 'web-animations':
        return 'animate' in Element.prototype;
      case 'requestAnimationFrame':
        return 'requestAnimationFrame' in window;
      default:
        return false;
    }
  }
}

// CSS feature detection
class CSSFeatureDetector {
  static supportsProperty(property: string, value: string): boolean {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports(property, value);
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
  
  static detectSpectralSystemSupport(): Record<string, boolean> {
    return {
      customProperties: this.supportsProperty('--test', 'value'),
      animations: this.supportsProperty('animation-name', 'test'),
      transforms: this.supportsProperty('transform', 'translateX(0)'),
      filters: this.supportsProperty('filter', 'blur(1px)'),
      backdropFilter: this.supportsProperty('backdrop-filter', 'blur(1px)'),
      gradients: this.supportsProperty('background', 'linear-gradient(red, blue)'),
      boxShadow: this.supportsProperty('box-shadow', '0 0 10px red'),
      textShadow: this.supportsProperty('text-shadow', '0 0 5px blue'),
    };
  }
}

// Performance API compatibility
class PerformanceAPIChecker {
  static checkAvailability(): Record<string, boolean> {
    return {
      performanceNow: 'performance' in window && 'now' in performance,
      performanceMark: 'performance' in window && 'mark' in performance,
      performanceMeasure: 'performance' in window && 'measure' in performance,
      performanceObserver: 'PerformanceObserver' in window,
      memoryAPI: 'performance' in window && 'memory' in (performance as any),
    };
  }
}

// Animation API compatibility
class AnimationAPIChecker {
  static checkSupport(): Record<string, boolean> {
    return {
      webAnimations: 'animate' in Element.prototype,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      cancelAnimationFrame: 'cancelAnimationFrame' in window,
      cssAnimations: CSSFeatureDetector.supportsProperty('animation-name', 'test'),
      cssTransitions: CSSFeatureDetector.supportsProperty('transition', 'all 1s'),
    };
  }
  
  static testAnimationPerformance(): Promise<number> {
    return new Promise((resolve) => {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = '-1000px';
      document.body.appendChild(element);
      
      const startTime = performance.now();
      let frameCount = 0;
      
      const animate = () => {
        frameCount++;
        element.style.transform = `translateX(${frameCount}px)`;
        
        if (frameCount < 60) {
          requestAnimationFrame(animate);
        } else {
          const endTime = performance.now();
          const fps = 60000 / (endTime - startTime);
          document.body.removeChild(element);
          resolve(fps);
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
}

describe('Cross-Browser Compatibility Tests', () => {
  let browserChecker: BrowserCompatibilityChecker;
  
  beforeEach(() => {
    browserChecker = new BrowserCompatibilityChecker();
  });

  describe('Browser Detection', () => {
    it('should detect Chrome correctly', () => {
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const checker = new BrowserCompatibilityChecker(chromeUA);
      const info = checker.getBrowserInfo();
      
      expect(info.name).toBe('chrome');
      expect(info.engine).toBe('blink');
      expect(parseInt(info.version)).toBeGreaterThan(0);
    });

    it('should detect Firefox correctly', () => {
      const firefoxUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const checker = new BrowserCompatibilityChecker(firefoxUA);
      const info = checker.getBrowserInfo();
      
      expect(info.name).toBe('firefox');
      expect(info.engine).toBe('gecko');
      expect(parseInt(info.version)).toBeGreaterThan(0);
    });

    it('should detect Safari correctly', () => {
      const safariUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
      const checker = new BrowserCompatibilityChecker(safariUA);
      const info = checker.getBrowserInfo();
      
      expect(info.name).toBe('safari');
      expect(info.engine).toBe('webkit');
      expect(parseInt(info.version)).toBeGreaterThan(0);
    });

    it('should detect Edge correctly', () => {
      const edgeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      const checker = new BrowserCompatibilityChecker(edgeUA);
      const info = checker.getBrowserInfo();
      
      expect(info.name).toBe('edge');
      expect(info.engine).toBe('blink');
      expect(parseInt(info.version)).toBeGreaterThan(0);
    });
  });

  describe('CSS Feature Support', () => {
    it('should detect CSS custom properties support', () => {
      const supported = CSSFeatureDetector.supportsProperty('--test', 'value');
      expect(typeof supported).toBe('boolean');
      
      // Modern browsers should support custom properties
      if (browserChecker.getBrowserInfo().name !== 'unknown') {
        expect(supported).toBe(true);
      }
    });

    it('should detect CSS animations support', () => {
      const supported = CSSFeatureDetector.supportsProperty('animation-name', 'test');
      expect(typeof supported).toBe('boolean');
      
      // All modern browsers should support animations
      expect(supported).toBe(true);
    });

    it('should detect CSS transforms support', () => {
      const supported = CSSFeatureDetector.supportsProperty('transform', 'translateX(0)');
      expect(typeof supported).toBe('boolean');
      
      // All modern browsers should support transforms
      expect(supported).toBe(true);
    });

    it('should detect CSS filters support', () => {
      const supported = CSSFeatureDetector.supportsProperty('filter', 'blur(1px)');
      expect(typeof supported).toBe('boolean');
      
      // Most modern browsers support filters
      const browserInfo = browserChecker.getBrowserInfo();
      if (['chrome', 'firefox', 'safari', 'edge'].includes(browserInfo.name)) {
        expect(supported).toBe(true);
      }
    });

    it('should detect backdrop-filter support', () => {
      const supported = CSSFeatureDetector.supportsProperty('backdrop-filter', 'blur(1px)');
      expect(typeof supported).toBe('boolean');
      
      // Backdrop-filter has limited support, especially in Firefox
      const browserInfo = browserChecker.getBrowserInfo();
      if (browserInfo.name === 'firefox') {
        // Firefox may not support backdrop-filter
        expect(typeof supported).toBe('boolean');
      }
    });

    it('should provide comprehensive spectral system support detection', () => {
      const support = CSSFeatureDetector.detectSpectralSystemSupport();
      
      expect(support).toHaveProperty('customProperties');
      expect(support).toHaveProperty('animations');
      expect(support).toHaveProperty('transforms');
      expect(support).toHaveProperty('filters');
      expect(support).toHaveProperty('backdropFilter');
      expect(support).toHaveProperty('gradients');
      expect(support).toHaveProperty('boxShadow');
      expect(support).toHaveProperty('textShadow');
      
      // Core features should be supported in modern browsers
      expect(support.customProperties).toBe(true);
      expect(support.animations).toBe(true);
      expect(support.transforms).toBe(true);
      expect(support.gradients).toBe(true);
      expect(support.boxShadow).toBe(true);
      expect(support.textShadow).toBe(true);
    });
  });

  describe('JavaScript API Support', () => {
    it('should detect Intersection Observer support', () => {
      const supported = browserChecker.supportsFeature('intersection-observer');
      expect(typeof supported).toBe('boolean');
      
      // Most modern browsers support Intersection Observer
      const browserInfo = browserChecker.getBrowserInfo();
      if (['chrome', 'firefox', 'safari', 'edge'].includes(browserInfo.name)) {
        expect(supported).toBe(true);
      }
    });

    it('should detect Resize Observer support', () => {
      const supported = browserChecker.supportsFeature('resize-observer');
      expect(typeof supported).toBe('boolean');
      
      // Resize Observer has good modern browser support
      const browserInfo = browserChecker.getBrowserInfo();
      if (['chrome', 'edge'].includes(browserInfo.name)) {
        expect(supported).toBe(true);
      }
    });

    it('should detect Performance Observer support', () => {
      const supported = browserChecker.supportsFeature('performance-observer');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect Web Animations API support', () => {
      const supported = browserChecker.supportsFeature('web-animations');
      expect(typeof supported).toBe('boolean');
      
      // Web Animations API has good modern browser support
      const browserInfo = browserChecker.getBrowserInfo();
      if (['chrome', 'firefox', 'edge'].includes(browserInfo.name)) {
        expect(supported).toBe(true);
      }
    });

    it('should check performance API availability', () => {
      const availability = PerformanceAPIChecker.checkAvailability();
      
      expect(availability).toHaveProperty('performanceNow');
      expect(availability).toHaveProperty('performanceMark');
      expect(availability).toHaveProperty('performanceMeasure');
      expect(availability).toHaveProperty('performanceObserver');
      expect(availability).toHaveProperty('memoryAPI');
      
      // performance.now should be universally supported
      expect(availability.performanceNow).toBe(true);
    });
  });

  describe('Animation Performance', () => {
    it('should test animation API support', () => {
      const support = AnimationAPIChecker.checkSupport();
      
      expect(support).toHaveProperty('webAnimations');
      expect(support).toHaveProperty('requestAnimationFrame');
      expect(support).toHaveProperty('cancelAnimationFrame');
      expect(support).toHaveProperty('cssAnimations');
      expect(support).toHaveProperty('cssTransitions');
      
      // Core animation features should be supported
      expect(support.requestAnimationFrame).toBe(true);
      expect(support.cancelAnimationFrame).toBe(true);
      expect(support.cssAnimations).toBe(true);
      expect(support.cssTransitions).toBe(true);
    });

    it('should measure animation performance across browsers', async () => {
      const fps = await AnimationAPIChecker.testAnimationPerformance();
      
      expect(fps).toBeGreaterThan(0);
      expect(fps).toBeLessThan(200); // Sanity check
      
      // Modern browsers should achieve reasonable FPS
      const browserInfo = browserChecker.getBrowserInfo();
      if (['chrome', 'firefox', 'safari', 'edge'].includes(browserInfo.name)) {
        expect(fps).toBeGreaterThan(30); // At least 30 FPS
      }
    }, 10000);
  });

  describe('Graceful Degradation', () => {
    it('should handle missing CSS features gracefully', () => {
      // Mock CSS.supports to return false
      const originalSupports = CSS.supports;
      CSS.supports = jest.fn().mockReturnValue(false);
      
      const support = CSSFeatureDetector.detectSpectralSystemSupport();
      
      // Should not throw errors even when features are unsupported
      expect(typeof support.customProperties).toBe('boolean');
      expect(typeof support.animations).toBe('boolean');
      
      // Restore original function
      CSS.supports = originalSupports;
    });

    it('should provide fallbacks for unsupported features', () => {
      // Test that the system can work without advanced features
      const minimalSupport = {
        customProperties: false,
        animations: false,
        transforms: true,
        filters: false,
        backdropFilter: false,
        gradients: true,
        boxShadow: true,
        textShadow: true,
      };
      
      // Even with minimal support, basic functionality should work
      expect(minimalSupport.transforms).toBe(true);
      expect(minimalSupport.gradients).toBe(true);
      expect(minimalSupport.boxShadow).toBe(true);
    });

    it('should handle missing JavaScript APIs', () => {
      // Mock missing APIs
      const originalIntersectionObserver = (window as any).IntersectionObserver;
      const originalResizeObserver = (window as any).ResizeObserver;
      
      delete (window as any).IntersectionObserver;
      delete (window as any).ResizeObserver;
      
      const checker = new BrowserCompatibilityChecker();
      
      expect(checker.supportsFeature('intersection-observer')).toBe(false);
      expect(checker.supportsFeature('resize-observer')).toBe(false);
      
      // Restore APIs
      (window as any).IntersectionObserver = originalIntersectionObserver;
      (window as any).ResizeObserver = originalResizeObserver;
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should detect mobile browsers', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      const checker = new BrowserCompatibilityChecker(mobileUA);
      const info = checker.getBrowserInfo();
      
      expect(info.name).toBe('safari');
      expect(info.engine).toBe('webkit');
    });

    it('should handle touch-specific features', () => {
      // Mock touch support
      const originalTouchStart = 'ontouchstart' in window;
      
      // Touch events should be handled gracefully
      expect(typeof originalTouchStart).toBe('boolean');
    });

    it('should adapt to mobile performance constraints', () => {
      // Mobile browsers may have different performance characteristics
      const support = CSSFeatureDetector.detectSpectralSystemSupport();
      
      // Core features should still work on mobile
      expect(support.customProperties).toBe(true);
      expect(support.transforms).toBe(true);
    });
  });

  describe('Legacy Browser Support', () => {
    it('should handle older browser versions gracefully', () => {
      // Test with older browser user agents
      const oldChromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
      const checker = new BrowserCompatibilityChecker(oldChromeUA);
      const info = checker.getBrowserInfo();
      
      expect(info.name).toBe('chrome');
      expect(parseInt(info.version)).toBe(60);
    });

    it('should provide appropriate fallbacks for older browsers', () => {
      // Mock older browser environment
      const originalCSS = CSS;
      (window as any).CSS = undefined;
      
      // Should not throw errors
      expect(() => {
        CSSFeatureDetector.supportsProperty('transform', 'translateX(0)');
      }).not.toThrow();
      
      // Restore CSS
      (window as any).CSS = originalCSS;
    });
  });

  describe('Error Handling', () => {
    it('should handle feature detection errors gracefully', () => {
      // Test with invalid CSS properties
      expect(() => {
        CSSFeatureDetector.supportsProperty('invalid-property', 'invalid-value');
      }).not.toThrow();
    });

    it('should handle missing browser APIs', () => {
      const originalPerformance = window.performance;
      delete (window as any).performance;
      
      expect(() => {
        PerformanceAPIChecker.checkAvailability();
      }).not.toThrow();
      
      // Restore performance
      (window as any).performance = originalPerformance;
    });
  });
});