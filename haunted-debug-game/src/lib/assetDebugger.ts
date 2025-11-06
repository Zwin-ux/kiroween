/**
 * Asset Debugging Tools
 * 
 * Development-only tools for inspecting, debugging, and optimizing
 * asset usage in the haunted debug game.
 */

import { assets, assetMetadata, AssetRegistry, AssetCategory } from './assets';
import { globalFallbackManager } from './assetFallbacks';

/**
 * Asset usage statistics
 */
export interface AssetUsageStats {
  totalAssets: number;
  categoryCounts: Record<string, number>;
  loadedAssets: Set<string>;
  failedAssets: Set<string>;
  fallbackUsage: Map<string, number>;
  loadTimes: Map<string, number>;
  totalLoadTime: number;
  averageLoadTime: number;
}

/**
 * Asset debug information
 */
export interface AssetDebugInfo {
  path: string;
  category: string;
  name: string;
  metadata?: any;
  isLoaded: boolean;
  hasFailed: boolean;
  fallbackCount: number;
  loadTime?: number;
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

/**
 * Asset performance metrics
 */
export interface AssetPerformanceMetrics {
  slowestAssets: Array<{ path: string; loadTime: number }>;
  largestAssets: Array<{ path: string; size: number }>;
  mostFailedAssets: Array<{ path: string; failures: number }>;
  fallbackUsageStats: Array<{ path: string; fallbackCount: number }>;
}

/**
 * Asset Debugger class for development tools
 */
export class AssetDebugger {
  private static instance: AssetDebugger;
  private usageStats: AssetUsageStats;
  private loadTimes: Map<string, number> = new Map();
  private loadStartTimes: Map<string, number> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.usageStats = this.initializeStats();
    
    if (this.isEnabled) {
      this.setupGlobalDebugging();
    }
  }

  static getInstance(): AssetDebugger {
    if (!AssetDebugger.instance) {
      AssetDebugger.instance = new AssetDebugger();
    }
    return AssetDebugger.instance;
  }

  /**
   * Initialize usage statistics
   */
  private initializeStats(): AssetUsageStats {
    const categoryCounts: Record<string, number> = {};
    let totalAssets = 0;

    Object.entries(assets).forEach(([category, categoryAssets]) => {
      const count = Object.keys(categoryAssets).length;
      categoryCounts[category] = count;
      totalAssets += count;
    });

    return {
      totalAssets,
      categoryCounts,
      loadedAssets: new Set(),
      failedAssets: new Set(),
      fallbackUsage: new Map(),
      loadTimes: new Map(),
      totalLoadTime: 0,
      averageLoadTime: 0,
    };
  }

  /**
   * Set up global debugging hooks
   */
  private setupGlobalDebugging(): void {
    // Add global asset debugging to window for console access
    if (typeof window !== 'undefined') {
      (window as any).__ASSET_DEBUGGER__ = {
        getStats: () => this.getUsageStats(),
        getDebugInfo: (category: string, name: string) => this.getAssetDebugInfo(category as keyof AssetRegistry, name),
        getAllAssets: () => this.getAllAssetDebugInfo(),
        getPerformanceMetrics: () => this.getPerformanceMetrics(),
        validateAll: () => this.validateAllAssets(),
        logReport: () => this.logDebugReport(),
        clearStats: () => this.clearStats(),
      };

      console.log('🎮 Asset Debugger initialized. Use __ASSET_DEBUGGER__ in console for debugging tools.');
    }
  }

  /**
   * Record asset load start
   */
  recordLoadStart(assetPath: string): void {
    if (!this.isEnabled) return;
    this.loadStartTimes.set(assetPath, performance.now());
  }

  /**
   * Record successful asset load
   */
  recordLoadSuccess(assetPath: string): void {
    if (!this.isEnabled) return;
    
    const startTime = this.loadStartTimes.get(assetPath);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.loadTimes.set(assetPath, loadTime);
      this.usageStats.loadTimes.set(assetPath, loadTime);
      this.usageStats.totalLoadTime += loadTime;
      this.usageStats.averageLoadTime = this.usageStats.totalLoadTime / this.usageStats.loadTimes.size;
      this.loadStartTimes.delete(assetPath);
    }
    
    this.usageStats.loadedAssets.add(assetPath);
    
    // Remove from failed assets if it was previously failed
    this.usageStats.failedAssets.delete(assetPath);
  }

  /**
   * Record asset load failure
   */
  recordLoadFailure(assetPath: string, error?: Error): void {
    if (!this.isEnabled) return;
    
    this.usageStats.failedAssets.add(assetPath);
    
    const currentCount = this.failureCounts.get(assetPath) || 0;
    this.failureCounts.set(assetPath, currentCount + 1);
    
    console.warn(`🚨 Asset load failed: ${assetPath}`, error);
  }

  /**
   * Record fallback usage
   */
  recordFallbackUsage(assetPath: string): void {
    if (!this.isEnabled) return;
    
    const currentCount = this.usageStats.fallbackUsage.get(assetPath) || 0;
    this.usageStats.fallbackUsage.set(assetPath, currentCount + 1);
    
    console.warn(`🔄 Using fallback for asset: ${assetPath}`);
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): AssetUsageStats {
    return { ...this.usageStats };
  }

  /**
   * Get debug information for a specific asset
   */
  getAssetDebugInfo(category: keyof AssetRegistry, name: string): AssetDebugInfo | null {
    const categoryAssets = assets[category];
    if (!categoryAssets || !(name in categoryAssets)) {
      return null;
    }

    const assetPath = (categoryAssets as any)[name] as string;
    const metadataKey = `${category}.${name}`;
    const metadata = assetMetadata[metadataKey];

    return {
      path: assetPath,
      category,
      name,
      metadata,
      isLoaded: this.usageStats.loadedAssets.has(assetPath),
      hasFailed: this.usageStats.failedAssets.has(assetPath),
      fallbackCount: this.usageStats.fallbackUsage.get(assetPath) || 0,
      loadTime: this.usageStats.loadTimes.get(assetPath),
    };
  }

  /**
   * Get debug information for all assets
   */
  getAllAssetDebugInfo(): AssetDebugInfo[] {
    const debugInfo: AssetDebugInfo[] = [];

    Object.entries(assets).forEach(([category, categoryAssets]) => {
      Object.keys(categoryAssets).forEach((name) => {
        const info = this.getAssetDebugInfo(category as keyof AssetRegistry, name);
        if (info) {
          debugInfo.push(info);
        }
      });
    });

    return debugInfo;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): AssetPerformanceMetrics {
    const allAssets = this.getAllAssetDebugInfo();

    // Slowest assets
    const slowestAssets = allAssets
      .filter(asset => asset.loadTime !== undefined)
      .sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0))
      .slice(0, 10)
      .map(asset => ({ path: asset.path, loadTime: asset.loadTime! }));

    // Most failed assets
    const mostFailedAssets = Array.from(this.failureCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, failures]) => ({ path, failures }));

    // Fallback usage stats
    const fallbackUsageStats = Array.from(this.usageStats.fallbackUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, fallbackCount]) => ({ path, fallbackCount }));

    return {
      slowestAssets,
      largestAssets: [], // Would need file size info
      mostFailedAssets,
      fallbackUsageStats,
    };
  }

  /**
   * Validate all assets and return issues
   */
  async validateAllAssets(): Promise<{ valid: AssetDebugInfo[]; invalid: AssetDebugInfo[] }> {
    const allAssets = this.getAllAssetDebugInfo();
    const valid: AssetDebugInfo[] = [];
    const invalid: AssetDebugInfo[] = [];

    allAssets.forEach(asset => {
      if (asset.hasFailed || !asset.metadata) {
        invalid.push(asset);
      } else {
        valid.push(asset);
      }
    });

    return { valid, invalid };
  }

  /**
   * Log comprehensive debug report
   */
  logDebugReport(): void {
    if (!this.isEnabled) return;

    console.group('🎮 Asset Debug Report');
    
    // Usage statistics
    console.group('📊 Usage Statistics');
    console.table(this.usageStats.categoryCounts);
    console.log(`Total Assets: ${this.usageStats.totalAssets}`);
    console.log(`Loaded Assets: ${this.usageStats.loadedAssets.size}`);
    console.log(`Failed Assets: ${this.usageStats.failedAssets.size}`);
    console.log(`Average Load Time: ${this.usageStats.averageLoadTime.toFixed(2)}ms`);
    console.groupEnd();

    // Performance metrics
    const metrics = this.getPerformanceMetrics();
    
    if (metrics.slowestAssets.length > 0) {
      console.group('🐌 Slowest Assets');
      console.table(metrics.slowestAssets);
      console.groupEnd();
    }

    if (metrics.mostFailedAssets.length > 0) {
      console.group('❌ Most Failed Assets');
      console.table(metrics.mostFailedAssets);
      console.groupEnd();
    }

    if (metrics.fallbackUsageStats.length > 0) {
      console.group('🔄 Fallback Usage');
      console.table(metrics.fallbackUsageStats);
      console.groupEnd();
    }

    // Recommendations
    console.group('💡 Recommendations');
    
    if (this.usageStats.failedAssets.size > 0) {
      console.warn(`${this.usageStats.failedAssets.size} assets are failing to load. Consider checking file paths and formats.`);
    }
    
    if (this.usageStats.averageLoadTime > 100) {
      console.warn(`Average load time is ${this.usageStats.averageLoadTime.toFixed(2)}ms. Consider optimizing asset sizes.`);
    }
    
    const fallbackUsageCount = this.usageStats.fallbackUsage.size;
    if (fallbackUsageCount > 0) {
      console.warn(`${fallbackUsageCount} assets are using fallbacks. Check original asset availability.`);
    }
    
    console.groupEnd();
    console.groupEnd();
  }

  /**
   * Clear all statistics
   */
  clearStats(): void {
    this.usageStats = this.initializeStats();
    this.loadTimes.clear();
    this.loadStartTimes.clear();
    this.failureCounts.clear();
    console.log('🧹 Asset debug statistics cleared');
  }

  /**
   * Generate optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getPerformanceMetrics();

    // Slow loading assets
    if (metrics.slowestAssets.length > 0) {
      suggestions.push(`Consider optimizing these slow-loading assets: ${metrics.slowestAssets.slice(0, 3).map(a => a.path).join(', ')}`);
    }

    // Failed assets
    if (this.usageStats.failedAssets.size > 0) {
      suggestions.push(`${this.usageStats.failedAssets.size} assets are failing to load. Check file paths and formats.`);
    }

    // Fallback usage
    if (this.usageStats.fallbackUsage.size > 0) {
      suggestions.push(`${this.usageStats.fallbackUsage.size} assets are using fallbacks. Ensure original assets are available.`);
    }

    // Missing metadata
    const assetsWithoutMetadata = this.getAllAssetDebugInfo().filter(asset => !asset.metadata);
    if (assetsWithoutMetadata.length > 0) {
      suggestions.push(`${assetsWithoutMetadata.length} assets are missing metadata. Add descriptions and usage information.`);
    }

    return suggestions;
  }
}

/**
 * Global asset debugger instance
 */
export const assetDebugger = AssetDebugger.getInstance();

/**
 * Development-only asset debugging hooks
 */
export function useAssetDebugging() {
  if (process.env.NODE_ENV !== 'development') {
    return {
      recordLoadStart: () => {},
      recordLoadSuccess: () => {},
      recordLoadFailure: () => {},
      recordFallbackUsage: () => {},
    };
  }

  return {
    recordLoadStart: (assetPath: string) => assetDebugger.recordLoadStart(assetPath),
    recordLoadSuccess: (assetPath: string) => assetDebugger.recordLoadSuccess(assetPath),
    recordLoadFailure: (assetPath: string, error?: Error) => assetDebugger.recordLoadFailure(assetPath, error),
    recordFallbackUsage: (assetPath: string) => assetDebugger.recordFallbackUsage(assetPath),
  };
}

/**
 * Console commands for asset debugging (development only)
 */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Add helpful console commands
  console.log(`
🎮 Asset Debugging Commands:
  __ASSET_DEBUGGER__.getStats()           - Get usage statistics
  __ASSET_DEBUGGER__.getAllAssets()       - Get all asset debug info
  __ASSET_DEBUGGER__.getPerformanceMetrics() - Get performance metrics
  __ASSET_DEBUGGER__.logReport()          - Log comprehensive report
  __ASSET_DEBUGGER__.validateAll()        - Validate all assets
  __ASSET_DEBUGGER__.clearStats()         - Clear statistics
  `);
}