/**
 * Asset Preloading System
 * 
 * Manages asset preloading with priority-based loading, progress tracking,
 * and lazy loading for non-critical assets.
 */

import { assets, AssetCategory, getAssetsByCategory } from './assets';

/**
 * Asset loading priority levels
 */
export enum AssetPriority {
  Critical = 'critical',    // Room backgrounds, core icons
  High = 'high',           // UI elements, common entities
  Normal = 'normal',       // Secondary entities
  Low = 'low',            // Theme assets, decorative elements
}

/**
 * Asset loading state
 */
export interface AssetLoadState {
  path: string;
  priority: AssetPriority;
  loaded: boolean;
  error?: Error;
  loadTime?: number;
}

/**
 * Preloading progress information
 */
export interface PreloadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  currentAsset?: string;
}

/**
 * Asset preloader configuration
 */
export interface PreloaderConfig {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Default preloader configuration
 */
const DEFAULT_CONFIG: PreloaderConfig = {
  maxConcurrent: 6,
  timeout: 10000,
  retryAttempts: 2,
  retryDelay: 1000,
};

/**
 * Asset priority mapping based on category and usage
 */
const ASSET_PRIORITIES: Record<string, AssetPriority> = {
  // Critical assets - needed immediately
  'rooms.compiler': AssetPriority.Critical,
  'icons.asset': AssetPriority.Critical,
  'icons.ghost': AssetPriority.Critical,
  
  // High priority - commonly used
  'entities.terminal': AssetPriority.High,
  'entities.pumpkin': AssetPriority.High,
  
  // Normal priority - secondary elements
  'entities.candy': AssetPriority.Normal,
  
  // Low priority - theme and reference assets
  'ui.background': AssetPriority.Low,
  'ui.palette': AssetPriority.Low,
  'ui.roomsheet': AssetPriority.Low,
};

/**
 * Asset Preloader class for managing asset loading
 */
export class AssetPreloader {
  private config: PreloaderConfig;
  private loadStates: Map<string, AssetLoadState> = new Map();
  private loadQueue: AssetLoadState[] = [];
  private activeLoads: Set<string> = new Set();
  private progressCallbacks: Set<(progress: PreloadProgress) => void> = new Set();

  constructor(config: Partial<PreloaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add progress callback for tracking loading progress
   */
  onProgress(callback: (progress: PreloadProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Get current loading progress
   */
  getProgress(): PreloadProgress {
    const states = Array.from(this.loadStates.values());
    const total = states.length;
    const loaded = states.filter(s => s.loaded).length;
    const failed = states.filter(s => s.error).length;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    const currentAsset = Array.from(this.activeLoads)[0];

    return {
      total,
      loaded,
      failed,
      percentage,
      currentAsset,
    };
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(): void {
    const progress = this.getProgress();
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  /**
   * Load a single asset with retry logic
   */
  private async loadAsset(assetState: AssetLoadState): Promise<void> {
    const { path } = assetState;
    let attempts = 0;

    while (attempts <= this.config.retryAttempts) {
      try {
        await this.loadSingleAsset(path);
        assetState.loaded = true;
        assetState.loadTime = Date.now();
        return;
      } catch (error) {
        attempts++;
        if (attempts > this.config.retryAttempts) {
          assetState.error = error as Error;
          console.warn(`Failed to load asset after ${attempts} attempts: ${path}`, error);
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  /**
   * Load a single asset (Promise-based)
   */
  private loadSingleAsset(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Asset load timeout: ${path}`));
      }, this.config.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Asset load error: ${path}`));
      };

      img.src = path;
    });
  }

  /**
   * Process the loading queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    while (this.loadQueue.length > 0 && this.activeLoads.size < this.config.maxConcurrent) {
      const assetState = this.loadQueue.shift();
      if (!assetState || this.activeLoads.has(assetState.path)) {
        continue;
      }

      this.activeLoads.add(assetState.path);
      this.notifyProgress();

      this.loadAsset(assetState).finally(() => {
        this.activeLoads.delete(assetState.path);
        this.notifyProgress();
        
        // Continue processing queue
        if (this.loadQueue.length > 0) {
          this.processQueue();
        }
      });
    }
  }

  /**
   * Add assets to the preload queue
   */
  private queueAssets(assetPaths: string[], priority: AssetPriority): void {
    const newAssets = assetPaths
      .filter(path => !this.loadStates.has(path))
      .map(path => ({
        path,
        priority,
        loaded: false,
      }));

    newAssets.forEach(asset => {
      this.loadStates.set(asset.path, asset);
    });

    // Sort by priority and add to queue
    const sortedAssets = newAssets.sort((a, b) => {
      const priorityOrder = [AssetPriority.Critical, AssetPriority.High, AssetPriority.Normal, AssetPriority.Low];
      return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    });

    this.loadQueue.push(...sortedAssets);
  }

  /**
   * Preload critical assets (room backgrounds, core icons)
   */
  async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      assets.rooms.compiler,
      assets.icons.asset,
      assets.icons.ghost,
    ];

    this.queueAssets(criticalAssets, AssetPriority.Critical);
    await this.processQueue();

    // Wait for all critical assets to complete
    while (this.activeLoads.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Preload assets by category with appropriate priority
   */
  async preloadByCategory(category: AssetCategory, priority: AssetPriority = AssetPriority.Normal): Promise<void> {
    const categoryAssets = getAssetsByCategory(category);
    const assetPaths = categoryAssets.map(asset => asset.path);

    this.queueAssets(assetPaths, priority);
    this.processQueue();
  }

  /**
   * Preload specific assets with custom priority
   */
  async preloadAssets(assetPaths: string[], priority: AssetPriority = AssetPriority.Normal): Promise<void> {
    this.queueAssets(assetPaths, priority);
    this.processQueue();
  }

  /**
   * Preload all assets with intelligent prioritization
   */
  async preloadAllAssets(): Promise<void> {
    // Get all asset paths with their priorities
    const allAssetPaths: { path: string; priority: AssetPriority }[] = [];

    Object.entries(assets).forEach(([category, categoryAssets]) => {
      Object.entries(categoryAssets).forEach(([name, asset]) => {
        const key = `${category}.${name}`;
        const priority = ASSET_PRIORITIES[key] || AssetPriority.Normal;
        const path = asset as string;
        allAssetPaths.push({ path, priority });
      });
    });

    // Group by priority and queue
    const priorityGroups = allAssetPaths.reduce((groups, asset) => {
      if (!groups[asset.priority]) {
        groups[asset.priority] = [];
      }
      groups[asset.priority].push(asset.path);
      return groups;
    }, {} as Record<AssetPriority, string[]>);

    // Queue in priority order
    const priorityOrder = [AssetPriority.Critical, AssetPriority.High, AssetPriority.Normal, AssetPriority.Low];
    
    for (const priority of priorityOrder) {
      if (priorityGroups[priority]) {
        this.queueAssets(priorityGroups[priority], priority);
      }
    }

    this.processQueue();
  }

  /**
   * Check if an asset is loaded
   */
  isAssetLoaded(assetPath: string): boolean {
    const state = this.loadStates.get(assetPath);
    return state?.loaded || false;
  }

  /**
   * Get loading statistics
   */
  getStats(): {
    totalAssets: number;
    loadedAssets: number;
    failedAssets: number;
    averageLoadTime: number;
  } {
    const states = Array.from(this.loadStates.values());
    const loadedStates = states.filter(s => s.loaded && s.loadTime);
    const averageLoadTime = loadedStates.length > 0
      ? loadedStates.reduce((sum, s) => sum + (s.loadTime || 0), 0) / loadedStates.length
      : 0;

    return {
      totalAssets: states.length,
      loadedAssets: states.filter(s => s.loaded).length,
      failedAssets: states.filter(s => s.error).length,
      averageLoadTime,
    };
  }

  /**
   * Clear all loading state
   */
  clear(): void {
    this.loadStates.clear();
    this.loadQueue.length = 0;
    this.activeLoads.clear();
  }
}

/**
 * Global asset preloader instance
 */
export const globalPreloader = new AssetPreloader();

/**
 * Convenience functions for common preloading scenarios
 */
export const preloadCriticalAssets = () => globalPreloader.preloadCriticalAssets();
export const preloadAllAssets = () => globalPreloader.preloadAllAssets();
export const preloadByCategory = (category: AssetCategory, priority?: AssetPriority) => 
  globalPreloader.preloadByCategory(category, priority);

/**
 * React hook for asset preloading with progress tracking
 */
export function useAssetPreloader() {
  return {
    preloader: globalPreloader,
    preloadCritical: preloadCriticalAssets,
    preloadAll: preloadAllAssets,
    preloadByCategory,
  };
}