/**
 * Asset Optimizer
 * 
 * Production-focused asset optimization including dynamic imports,
 * image format selection, and bundle size optimization.
 */

import { assets, AssetRegistry } from './assets';

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  /** Enable dynamic imports for non-critical assets */
  enableDynamicImports: boolean;
  /** Enable WebP format with PNG fallback */
  enableWebP: boolean;
  /** Enable lazy loading for non-critical assets */
  enableLazyLoading: boolean;
  /** Bundle size threshold for code splitting (bytes) */
  bundleSizeThreshold: number;
  /** Critical assets that should be preloaded */
  criticalAssets: string[];
  /** Enable asset compression */
  enableCompression: boolean;
}

/**
 * Asset loading priority levels
 */
export enum LoadPriority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
  Low = 'low',
}

/**
 * Optimized asset information
 */
export interface OptimizedAsset {
  originalUrl: string;
  optimizedUrl: string;
  format: 'png' | 'webp' | 'avif' | 'svg';
  size: number;
  priority: LoadPriority;
  shouldLazyLoad: boolean;
  preloadHint?: 'preload' | 'prefetch' | 'preconnect';
}

/**
 * Default optimization configuration
 */
const DEFAULT_CONFIG: OptimizationConfig = {
  enableDynamicImports: true,
  enableWebP: true,
  enableLazyLoading: true,
  bundleSizeThreshold: 244 * 1024, // 244KB (Next.js default)
  criticalAssets: [
    '/Compiler Room.png',
    '/asset icon.png',
    '/icon_ghost_surprised.png',
  ],
  enableCompression: true,
};

/**
 * Asset Optimizer class
 */
export class AssetOptimizer {
  private config: OptimizationConfig;
  private optimizedAssets: Map<string, OptimizedAsset> = new Map();
  private supportedFormats: Set<string> = new Set();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detectSupportedFormats();
  }

  /**
   * Detect supported image formats
   */
  private detectSupportedFormats(): void {
    // Check WebP support
    const webpCanvas = document.createElement('canvas');
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    const webpSupported = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (webpSupported) {
      this.supportedFormats.add('webp');
    }

    // Check AVIF support
    const avifCanvas = document.createElement('canvas');
    avifCanvas.width = 1;
    avifCanvas.height = 1;
    try {
      const avifSupported = avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      if (avifSupported) {
        this.supportedFormats.add('avif');
      }
    } catch (error) {
      // AVIF not supported
    }

    // Always support PNG and SVG
    this.supportedFormats.add('png');
    this.supportedFormats.add('svg');

    console.log('🎨 Supported image formats:', Array.from(this.supportedFormats));
  }

  /**
   * Get optimized asset URL with format selection
   */
  getOptimizedAssetUrl(category: keyof AssetRegistry, name: string): string {
    const categoryAssets = assets[category];
    if (!categoryAssets || !(name in categoryAssets)) {
      return '';
    }

    const originalUrl = (categoryAssets as any)[name] as string;
    const cacheKey = `${category}.${name}`;
    
    // Check if already optimized
    const cached = this.optimizedAssets.get(cacheKey);
    if (cached) {
      return cached.optimizedUrl;
    }

    // Determine optimal format and URL
    const optimizedAsset = this.optimizeAsset(originalUrl, category, name);
    this.optimizedAssets.set(cacheKey, optimizedAsset);
    
    return optimizedAsset.optimizedUrl;
  }

  /**
   * Optimize individual asset
   */
  private optimizeAsset(originalUrl: string, category: string, name: string): OptimizedAsset {
    const priority = this.determineAssetPriority(originalUrl, category);
    const shouldLazyLoad = this.shouldLazyLoadAsset(originalUrl, category, priority);
    const optimizedUrl = this.selectOptimalFormat(originalUrl);
    const preloadHint = this.getPreloadHint(priority);

    return {
      originalUrl,
      optimizedUrl,
      format: this.getFormatFromUrl(optimizedUrl),
      size: 0, // Would need actual file size
      priority,
      shouldLazyLoad,
      preloadHint,
    };
  }

  /**
   * Determine asset loading priority
   */
  private determineAssetPriority(url: string, category: string): LoadPriority {
    // Critical assets (above the fold, essential for initial render)
    if (this.config.criticalAssets.includes(url)) {
      return LoadPriority.Critical;
    }

    // Category-based priority
    switch (category) {
      case 'rooms':
        return LoadPriority.Critical; // Room backgrounds are critical
      case 'icons':
        return LoadPriority.High; // UI icons are important
      case 'entities':
        return LoadPriority.Normal; // Game entities can be lazy loaded
      case 'ui':
        return LoadPriority.Low; // Theme assets are lowest priority
      default:
        return LoadPriority.Normal;
    }
  }

  /**
   * Determine if asset should be lazy loaded
   */
  private shouldLazyLoadAsset(url: string, category: string, priority: LoadPriority): boolean {
    if (!this.config.enableLazyLoading) {
      return false;
    }

    // Never lazy load critical assets
    if (priority === LoadPriority.Critical) {
      return false;
    }

    // Lazy load entities and UI assets
    return category === 'entities' || category === 'ui';
  }

  /**
   * Select optimal image format based on browser support
   */
  private selectOptimalFormat(originalUrl: string): string {
    const extension = originalUrl.split('.').pop()?.toLowerCase();
    
    // SVG files don't need optimization
    if (extension === 'svg') {
      return originalUrl;
    }

    // For raster images, select best supported format
    if (this.config.enableWebP) {
      if (this.supportedFormats.has('avif')) {
        return this.convertUrlFormat(originalUrl, 'avif');
      } else if (this.supportedFormats.has('webp')) {
        return this.convertUrlFormat(originalUrl, 'webp');
      }
    }

    // Fallback to original format
    return originalUrl;
  }

  /**
   * Convert URL to different format (conceptual - would need actual conversion)
   */
  private convertUrlFormat(url: string, format: string): string {
    // In a real implementation, this would point to optimized versions
    // For now, we'll add a query parameter to indicate preferred format
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('format', format);
    return urlObj.toString();
  }

  /**
   * Get format from URL
   */
  private getFormatFromUrl(url: string): 'png' | 'webp' | 'avif' | 'svg' {
    const urlObj = new URL(url, window.location.origin);
    const formatParam = urlObj.searchParams.get('format');
    
    if (formatParam && ['webp', 'avif', 'svg'].includes(formatParam)) {
      return formatParam as 'webp' | 'avif' | 'svg';
    }
    
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'svg' ? 'svg' : 'png';
  }

  /**
   * Get preload hint for asset priority
   */
  private getPreloadHint(priority: LoadPriority): 'preload' | 'prefetch' | 'preconnect' | undefined {
    switch (priority) {
      case LoadPriority.Critical:
        return 'preload';
      case LoadPriority.High:
        return 'prefetch';
      default:
        return undefined;
    }
  }

  /**
   * Generate preload links for critical assets
   */
  generatePreloadLinks(): string[] {
    const preloadLinks: string[] = [];

    for (const [, optimizedAsset] of this.optimizedAssets) {
      if (optimizedAsset.preloadHint === 'preload') {
        const mimeType = this.getMimeType(optimizedAsset.format);
        preloadLinks.push(
          `<link rel="preload" href="${optimizedAsset.optimizedUrl}" as="image" type="${mimeType}">`
        );
      } else if (optimizedAsset.preloadHint === 'prefetch') {
        preloadLinks.push(
          `<link rel="prefetch" href="${optimizedAsset.optimizedUrl}">`
        );
      }
    }

    return preloadLinks;
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      svg: 'image/svg+xml',
    };
    
    return mimeTypes[format] || 'image/png';
  }

  /**
   * Create dynamic import for non-critical assets
   */
  async loadAssetDynamically(category: keyof AssetRegistry, name: string): Promise<string> {
    if (!this.config.enableDynamicImports) {
      return this.getOptimizedAssetUrl(category, name);
    }

    const priority = this.determineAssetPriority('', category);
    
    if (priority === LoadPriority.Critical || priority === LoadPriority.High) {
      // Load immediately for critical/high priority assets
      return this.getOptimizedAssetUrl(category, name);
    }

    // Dynamic import for low priority assets
    try {
      const assetModule = await import(
        /* webpackChunkName: "[request]" */
        /* webpackMode: "lazy" */
        `../assets/${category}/${name}`
      );
      
      return assetModule.default || this.getOptimizedAssetUrl(category, name);
    } catch (error) {
      console.warn(`Failed to dynamically import ${category}.${name}:`, error);
      return this.getOptimizedAssetUrl(category, name);
    }
  }

  /**
   * Get bundle optimization recommendations
   */
  getBundleOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const assetCount = this.optimizedAssets.size;
    const criticalAssetCount = Array.from(this.optimizedAssets.values())
      .filter(asset => asset.priority === LoadPriority.Critical).length;

    if (criticalAssetCount > 10) {
      recommendations.push(`Consider reducing critical assets (${criticalAssetCount} currently marked as critical)`);
    }

    if (assetCount > 50) {
      recommendations.push(`Large number of assets (${assetCount}) - consider asset bundling or lazy loading`);
    }

    if (!this.supportedFormats.has('webp')) {
      recommendations.push('WebP format not supported - consider polyfills for better compression');
    }

    const lazyLoadableAssets = Array.from(this.optimizedAssets.values())
      .filter(asset => !asset.shouldLazyLoad && asset.priority !== LoadPriority.Critical).length;
    
    if (lazyLoadableAssets > 0) {
      recommendations.push(`${lazyLoadableAssets} assets could benefit from lazy loading`);
    }

    return recommendations;
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    totalAssets: number;
    criticalAssets: number;
    lazyLoadedAssets: number;
    webpAssets: number;
    supportedFormats: string[];
  } {
    const assets = Array.from(this.optimizedAssets.values());
    
    return {
      totalAssets: assets.length,
      criticalAssets: assets.filter(a => a.priority === LoadPriority.Critical).length,
      lazyLoadedAssets: assets.filter(a => a.shouldLazyLoad).length,
      webpAssets: assets.filter(a => a.format === 'webp' || a.format === 'avif').length,
      supportedFormats: Array.from(this.supportedFormats),
    };
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizedAssets.clear();
  }
}

/**
 * Global asset optimizer instance
 */
export const assetOptimizer = new AssetOptimizer();

/**
 * Hook for using asset optimization in React components
 */
export function useAssetOptimization() {
  return {
    getOptimizedUrl: (category: keyof AssetRegistry, name: string) => 
      assetOptimizer.getOptimizedAssetUrl(category, name),
    loadDynamically: (category: keyof AssetRegistry, name: string) => 
      assetOptimizer.loadAssetDynamically(category, name),
    getStats: () => assetOptimizer.getOptimizationStats(),
    getRecommendations: () => assetOptimizer.getBundleOptimizationRecommendations(),
  };
}