/**
 * Robust Asset Loading System
 * 
 * Provides enhanced asset loading with retry logic, error handling,
 * and validation during game initialization.
 */

import { assets, AssetRegistry, validateAssets, preloadImage as basicPreloadImage } from './assets';
import { assetCacheManager } from './assetCache';
import { assetPerformanceMonitor } from './assetPerformanceMonitor';

/**
 * Asset loading configuration
 */
export interface AssetLoadConfig {
  /** Maximum retry attempts for failed loads */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Timeout for individual asset loads in milliseconds */
  timeout: number;
  /** Whether to use exponential backoff for retries */
  exponentialBackoff: boolean;
  /** Whether to validate assets during initialization */
  validateOnInit: boolean;
  /** Whether to preload critical assets */
  preloadCritical: boolean;
}

/**
 * Asset loading result
 */
export interface AssetLoadResult {
  success: boolean;
  url: string;
  error?: Error;
  attempts: number;
  loadTime: number;
  fromCache: boolean;
}

/**
 * Asset loading progress
 */
export interface AssetLoadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  currentAsset?: string;
  errors: AssetLoadError[];
}

/**
 * Asset loading error
 */
export interface AssetLoadError {
  url: string;
  error: Error;
  attempts: number;
  timestamp: number;
}

/**
 * Asset initialization result
 */
export interface AssetInitResult {
  success: boolean;
  totalAssets: number;
  loadedAssets: number;
  failedAssets: number;
  validationResult?: any;
  errors: AssetLoadError[];
  loadTime: number;
}

/**
 * Default asset loading configuration
 */
const DEFAULT_CONFIG: AssetLoadConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
  exponentialBackoff: true,
  validateOnInit: true,
  preloadCritical: true,
};

/**
 * Enhanced Asset Loader class
 */
export class AssetLoader {
  private config: AssetLoadConfig;
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Map<string, AssetLoadError> = new Map();
  private loadingPromises: Map<string, Promise<AssetLoadResult>> = new Map();
  private progressCallbacks: Set<(progress: AssetLoadProgress) => void> = new Set();

  constructor(config: Partial<AssetLoadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the asset system with validation and preloading
   */
  async initialize(): Promise<AssetInitResult> {
    const startTime = Date.now();
    const errors: AssetLoadError[] = [];
    let validationResult;

    console.log('🎮 Initializing asset system...');

    try {
      // Step 1: Validate assets if enabled
      if (this.config.validateOnInit) {
        console.log('🔍 Validating assets...');
        validationResult = await validateAssets();
        
        if (!validationResult.valid) {
          console.warn('⚠️ Asset validation found issues:', validationResult);
          // Continue initialization but log warnings
          validationResult.missing.forEach(assetPath => {
            const error = new Error(`Asset missing: ${assetPath}`);
            errors.push({
              url: assetPath,
              error,
              attempts: 0,
              timestamp: Date.now(),
            });
          });
        }
      }

      // Step 2: Preload critical assets if enabled
      if (this.config.preloadCritical) {
        console.log('🚀 Preloading critical assets...');
        await this.preloadCriticalAssets();
      }

      const loadTime = Date.now() - startTime;
      const totalAssets = this.getTotalAssetCount();
      const loadedAssets = this.loadedAssets.size;
      const failedAssets = this.failedAssets.size;

      console.log(`✅ Asset system initialized in ${loadTime}ms`);
      console.log(`📊 Assets: ${loadedAssets}/${totalAssets} loaded, ${failedAssets} failed`);

      return {
        success: errors.length === 0,
        totalAssets,
        loadedAssets,
        failedAssets,
        validationResult,
        errors: [...errors, ...Array.from(this.failedAssets.values())],
        loadTime,
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error('❌ Asset system initialization failed:', error);
      
      return {
        success: false,
        totalAssets: this.getTotalAssetCount(),
        loadedAssets: this.loadedAssets.size,
        failedAssets: this.failedAssets.size,
        validationResult,
        errors: [{
          url: 'system',
          error: error as Error,
          attempts: 1,
          timestamp: Date.now(),
        }],
        loadTime,
      };
    }
  }

  /**
   * Enhanced preload image utility with retry logic and error handling
   */
  async preloadImage(url: string): Promise<AssetLoadResult> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    // Check if already loaded
    if (this.loadedAssets.has(url)) {
      return {
        success: true,
        url,
        attempts: 0,
        loadTime: 0,
        fromCache: true,
      };
    }

    // Check if previously failed
    const previousError = this.failedAssets.get(url);
    if (previousError && previousError.attempts >= this.config.maxRetries) {
      return {
        success: false,
        url,
        error: previousError.error,
        attempts: previousError.attempts,
        loadTime: 0,
        fromCache: false,
      };
    }

    // Create loading promise
    const loadPromise = this.loadImageWithRetry(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const result = await loadPromise;
      
      if (result.success) {
        this.loadedAssets.add(url);
        this.failedAssets.delete(url);
        
        // Cache the asset
        await assetCacheManager.cacheAsset(url, 'normal');
      } else if (result.error) {
        this.failedAssets.set(url, {
          url,
          error: result.error,
          attempts: result.attempts,
          timestamp: Date.now(),
        });
      }

      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Load image with retry logic and exponential backoff
   */
  private async loadImageWithRetry(url: string): Promise<AssetLoadResult> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;
    
    // Parse asset info for performance monitoring
    const { category, name } = this.parseAssetInfo(url);
    
    // Record load start for performance monitoring
    assetPerformanceMonitor.recordLoadStart(url, category, name);

    while (attempts <= this.config.maxRetries) {
      attempts++;

      try {
        // Try to load from cache first
        const cachedUrl = assetCacheManager.getCachedAssetUrl(url);
        const fromCache = cachedUrl !== url;
        
        const img = await this.loadSingleImage(cachedUrl);
        
        const loadTime = Date.now() - startTime;
        
        // Record successful load for performance monitoring
        const size = this.estimateImageSize(img);
        assetPerformanceMonitor.recordLoadSuccess(url, category, name, size, fromCache);
        
        return {
          success: true,
          url,
          attempts,
          loadTime,
          fromCache,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempts > this.config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.config.exponentialBackoff
          ? this.config.retryDelay * Math.pow(2, attempts - 1)
          : this.config.retryDelay;

        console.warn(`⚠️ Asset load attempt ${attempts} failed for ${url}, retrying in ${delay}ms:`, error);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const loadTime = Date.now() - startTime;
    
    // Record failed load for performance monitoring
    assetPerformanceMonitor.recordLoadFailure(url, category, name, lastError?.message || 'Unknown error');
    
    return {
      success: false,
      url,
      error: lastError || new Error('Unknown error'),
      attempts,
      loadTime,
      fromCache: false,
    };
  }

  /**
   * Load a single image with timeout
   */
  private loadSingleImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Asset load timeout after ${this.config.timeout}ms: ${url}`));
      }, this.config.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Asset load error: ${url}`));
      };

      // Start loading
      img.src = url;
    });
  }

  /**
   * Preload critical assets with progress tracking
   */
  async preloadCriticalAssets(): Promise<AssetLoadProgress> {
    const criticalAssets = [
      assets.rooms.compiler,
      assets.rooms.stackTrace,
      assets.rooms.graveyard,
      assets.ghosts.base,
      assets.icons.asset,
      assets.icons.ghost,
    ];

    return this.preloadAssets(criticalAssets);
  }

  /**
   * Preload multiple assets with progress tracking
   */
  async preloadAssets(assetUrls: string[]): Promise<AssetLoadProgress> {
    const progress: AssetLoadProgress = {
      total: assetUrls.length,
      loaded: 0,
      failed: 0,
      percentage: 0,
      errors: [],
    };

    const loadPromises = assetUrls.map(async (url, index) => {
      progress.currentAsset = url;
      this.notifyProgress(progress);

      try {
        const result = await this.preloadImage(url);
        
        if (result.success) {
          progress.loaded++;
        } else {
          progress.failed++;
          if (result.error) {
            progress.errors.push({
              url,
              error: result.error,
              attempts: result.attempts,
              timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        progress.failed++;
        progress.errors.push({
          url,
          error: error as Error,
          attempts: 1,
          timestamp: Date.now(),
        });
      }

      progress.percentage = Math.round(((progress.loaded + progress.failed) / progress.total) * 100);
      this.notifyProgress(progress);
    });

    await Promise.all(loadPromises);
    
    progress.currentAsset = undefined;
    this.notifyProgress(progress);

    return progress;
  }

  /**
   * Preload assets by category
   */
  async preloadAssetsByCategory(category: keyof AssetRegistry): Promise<AssetLoadProgress> {
    const categoryAssets = assets[category];
    const assetUrls = Object.values(categoryAssets);
    
    console.log(`📦 Preloading ${category} assets (${assetUrls.length} assets)...`);
    return this.preloadAssets(assetUrls);
  }

  /**
   * Add progress callback
   */
  onProgress(callback: (progress: AssetLoadProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(progress: AssetLoadProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    });
  }

  /**
   * Check if an asset is loaded
   */
  isAssetLoaded(url: string): boolean {
    return this.loadedAssets.has(url);
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): {
    totalLoaded: number;
    totalFailed: number;
    loadingInProgress: number;
    averageLoadTime: number;
  } {
    const failedAssets = Array.from(this.failedAssets.values());
    const averageLoadTime = 0; // Would need to track load times for this

    return {
      totalLoaded: this.loadedAssets.size,
      totalFailed: this.failedAssets.size,
      loadingInProgress: this.loadingPromises.size,
      averageLoadTime,
    };
  }

  /**
   * Get failed assets with error details
   */
  getFailedAssets(): AssetLoadError[] {
    return Array.from(this.failedAssets.values());
  }

  /**
   * Retry failed assets
   */
  async retryFailedAssets(): Promise<AssetLoadProgress> {
    const failedUrls = Array.from(this.failedAssets.keys());
    
    if (failedUrls.length === 0) {
      return {
        total: 0,
        loaded: 0,
        failed: 0,
        percentage: 100,
        errors: [],
      };
    }

    console.log(`🔄 Retrying ${failedUrls.length} failed assets...`);
    
    // Clear failed assets to allow retry
    this.failedAssets.clear();
    
    return this.preloadAssets(failedUrls);
  }

  /**
   * Clear all loading state
   */
  clear(): void {
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.loadingPromises.clear();
    this.progressCallbacks.clear();
  }

  /**
   * Get total asset count from registry
   */
  private getTotalAssetCount(): number {
    return Object.values(assets).reduce(
      (total, categoryAssets) => total + Object.keys(categoryAssets).length,
      0
    );
  }

  /**
   * Parse asset information from URL
   */
  private parseAssetInfo(url: string): { category: string; name: string } {
    // Find matching asset in registry
    for (const [category, categoryAssets] of Object.entries(assets)) {
      for (const [name, assetPath] of Object.entries(categoryAssets)) {
        if (assetPath === url) {
          return { category, name };
        }
      }
    }
    
    // Fallback to heuristic parsing
    const fileName = url.split('/').pop()?.split('?')[0] || '';
    
    let category = 'ui';
    let name = 'unknown';

    if (fileName.toLowerCase().includes('room')) {
      category = 'rooms';
      name = 'compiler';
    } else if (fileName.toLowerCase().includes('icon')) {
      category = 'icons';
      name = fileName.includes('ghost') ? 'ghost' : 'asset';
    } else if (['pumpkin', 'candy', 'terminal'].some(entity => fileName.toLowerCase().includes(entity))) {
      category = 'entities';
      name = fileName.toLowerCase().includes('candy') ? 'candy' : 
            fileName.toLowerCase().includes('terminal') ? 'terminal' : 'pumpkin';
    }

    return { category, name };
  }

  /**
   * Estimate image size from loaded image element
   */
  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimation based on dimensions and assumed compression
    const pixels = img.naturalWidth * img.naturalHeight;
    const bytesPerPixel = 4; // RGBA
    const compressionRatio = 0.3; // Assume 30% of uncompressed size for PNG
    
    return Math.round(pixels * bytesPerPixel * compressionRatio);
  }

  /**
   * Validate asset during runtime
   */
  async validateAsset(url: string): Promise<boolean> {
    try {
      const result = await this.preloadImage(url);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get asset loading status for debugging
   */
  getAssetStatus(): Record<string, 'loaded' | 'failed' | 'loading' | 'unknown'> {
    const status: Record<string, 'loaded' | 'failed' | 'loading' | 'unknown'> = {};

    // Get all asset URLs
    const allUrls = new Set<string>();
    Object.values(assets).forEach(categoryAssets => {
      Object.values(categoryAssets).forEach(url => {
        allUrls.add(url);
      });
    });

    // Determine status for each asset
    for (const url of allUrls) {
      if (this.loadedAssets.has(url)) {
        status[url] = 'loaded';
      } else if (this.failedAssets.has(url)) {
        status[url] = 'failed';
      } else if (this.loadingPromises.has(url)) {
        status[url] = 'loading';
      } else {
        status[url] = 'unknown';
      }
    }

    return status;
  }
}

/**
 * Global asset loader instance
 */
export const globalAssetLoader = new AssetLoader();

/**
 * Initialize asset system - call this during app startup
 */
export const initializeAssets = () => globalAssetLoader.initialize();

/**
 * Enhanced preload image function with retry logic
 */
export const preloadImageWithRetry = (url: string) => globalAssetLoader.preloadImage(url);

/**
 * Preload critical assets
 */
export const preloadCriticalAssets = () => globalAssetLoader.preloadCriticalAssets();

/**
 * Validate asset exists and can be loaded
 */
export const validateAssetLoad = (url: string) => globalAssetLoader.validateAsset(url);

/**
 * React hook for asset loading
 */
export function useAssetLoader() {
  return {
    loader: globalAssetLoader,
    preloadImage: preloadImageWithRetry,
    preloadCritical: preloadCriticalAssets,
    validateAsset: validateAssetLoad,
    initialize: initializeAssets,
  };
}