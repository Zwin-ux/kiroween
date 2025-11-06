/**
 * Asset Caching Strategy Implementation
 * 
 * Implements intelligent caching strategies based on performance metrics,
 * usage patterns, and asset characteristics.
 */

import { AssetRegistry, assets, AssetCategory, getAssetsByCategory } from './assets';
import { assetCacheManager, CacheStats } from './assetCache';
import { assetPerformanceMonitor, PerformanceStats } from './assetPerformanceMonitor';

/**
 * Caching strategy types
 */
export enum CachingStrategy {
  Aggressive = 'aggressive',     // Cache everything immediately
  Lazy = 'lazy',                // Cache on demand
  Predictive = 'predictive',    // Cache based on usage patterns
  Performance = 'performance',   // Cache based on performance metrics
  Adaptive = 'adaptive',        // Dynamically adjust strategy
}

/**
 * Cache priority levels
 */
export enum CachePriority {
  Critical = 'critical',    // Must be cached (room backgrounds, core UI)
  High = 'high',           // Should be cached (frequently used assets)
  Normal = 'normal',       // Cache when convenient
  Low = 'low',            // Cache only if space available
  Never = 'never',        // Don't cache (large, rarely used assets)
}

/**
 * Caching configuration
 */
export interface CachingConfig {
  strategy: CachingStrategy;
  maxCacheSize: number;
  priorityWeights: Record<CachePriority, number>;
  performanceThresholds: {
    slowLoadTime: number;
    highFailureRate: number;
    lowCacheHitRate: number;
  };
  adaptiveSettings: {
    evaluationInterval: number;
    performanceWindow: number;
    strategyChangeThreshold: number;
  };
}

/**
 * Asset caching metadata
 */
export interface AssetCacheMetadata {
  url: string;
  category: string;
  name: string;
  priority: CachePriority;
  lastAccessed: number;
  accessCount: number;
  averageLoadTime: number;
  failureRate: number;
  size: number;
  cacheScore: number;
}

/**
 * Caching strategy result
 */
export interface CachingStrategyResult {
  assetsToCache: string[];
  assetsToEvict: string[];
  priorityChanges: Record<string, CachePriority>;
  strategyRecommendation?: CachingStrategy;
  reasoning: string[];
}

/**
 * Default caching configuration
 */
const DEFAULT_CONFIG: CachingConfig = {
  strategy: CachingStrategy.Adaptive,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  priorityWeights: {
    [CachePriority.Critical]: 1.0,
    [CachePriority.High]: 0.8,
    [CachePriority.Normal]: 0.6,
    [CachePriority.Low]: 0.4,
    [CachePriority.Never]: 0.0,
  },
  performanceThresholds: {
    slowLoadTime: 2000, // 2 seconds
    highFailureRate: 0.1, // 10%
    lowCacheHitRate: 0.7, // 70%
  },
  adaptiveSettings: {
    evaluationInterval: 300000, // 5 minutes
    performanceWindow: 600000, // 10 minutes
    strategyChangeThreshold: 0.2, // 20% performance difference
  },
};

/**
 * Asset priority mapping based on category and usage
 */
const ASSET_PRIORITY_MAP: Record<string, CachePriority> = {
  // Critical assets - always cache
  'rooms.compiler': CachePriority.Critical,
  'rooms.stackTrace': CachePriority.Critical,
  'rooms.graveyard': CachePriority.Critical,
  'icons.asset': CachePriority.Critical,
  'icons.ghost': CachePriority.Critical,
  
  // High priority - frequently used
  'ghosts.base': CachePriority.High,
  'entities.terminal': CachePriority.High,
  
  // Normal priority - moderate usage
  'entities.pumpkin': CachePriority.Normal,
  'entities.candy': CachePriority.Normal,
  'icons.file': CachePriority.Normal,
  'icons.globe': CachePriority.Normal,
  'icons.window': CachePriority.Normal,
  
  // Low priority - reference assets
  'ui.background': CachePriority.Low,
  'ui.palette': CachePriority.Low,
  'ui.roomsheet': CachePriority.Low,
  'rooms.background': CachePriority.Low,
  'rooms.roomsheet': CachePriority.Low,
};

/**
 * Asset Caching Strategy Manager
 */
export class AssetCachingStrategyManager {
  private config: CachingConfig;
  private assetMetadata: Map<string, AssetCacheMetadata> = new Map();
  private strategyHistory: Array<{ strategy: CachingStrategy; timestamp: number; performance: number }> = [];
  private evaluationTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CachingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAssetMetadata();
    this.startAdaptiveEvaluation();
  }

  /**
   * Initialize asset metadata from registry
   */
  private initializeAssetMetadata(): void {
    Object.entries(assets).forEach(([category, categoryAssets]) => {
      Object.entries(categoryAssets).forEach(([name, url]) => {
        const key = `${category}.${name}`;
        const priority = ASSET_PRIORITY_MAP[key] || CachePriority.Normal;
        
        this.assetMetadata.set(url, {
          url,
          category,
          name,
          priority,
          lastAccessed: 0,
          accessCount: 0,
          averageLoadTime: 0,
          failureRate: 0,
          size: 0,
          cacheScore: this.calculateCacheScore(priority, 0, 0, 0),
        });
      });
    });
  }

  /**
   * Start adaptive strategy evaluation
   */
  private startAdaptiveEvaluation(): void {
    if (this.config.strategy === CachingStrategy.Adaptive) {
      this.evaluationTimer = setInterval(() => {
        this.evaluateAndAdaptStrategy();
      }, this.config.adaptiveSettings.evaluationInterval);
    }
  }

  /**
   * Evaluate current performance and adapt caching strategy
   */
  private evaluateAndAdaptStrategy(): void {
    const performanceStats = assetPerformanceMonitor.getStats();
    const cacheStats = assetCacheManager.getStats();
    
    const currentPerformance = this.calculateOverallPerformance(performanceStats, cacheStats);
    
    // Record current strategy performance
    this.strategyHistory.push({
      strategy: this.config.strategy,
      timestamp: Date.now(),
      performance: currentPerformance,
    });

    // Keep only recent history
    const cutoff = Date.now() - this.config.adaptiveSettings.performanceWindow;
    this.strategyHistory = this.strategyHistory.filter(h => h.timestamp > cutoff);

    // Evaluate if strategy change is needed
    const strategyRecommendation = this.recommendStrategy(performanceStats, cacheStats);
    
    if (strategyRecommendation !== this.config.strategy) {
      const improvement = this.estimateStrategyImprovement(strategyRecommendation, currentPerformance);
      
      if (improvement > this.config.adaptiveSettings.strategyChangeThreshold) {
        console.log(`🔄 Adapting caching strategy from ${this.config.strategy} to ${strategyRecommendation} (estimated ${(improvement * 100).toFixed(1)}% improvement)`);
        this.config.strategy = strategyRecommendation;
      }
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformance(performanceStats: PerformanceStats, cacheStats: CacheStats): number {
    const loadTimeScore = Math.max(0, 1 - (performanceStats.averageLoadTime / 5000)); // Normalize to 5s max
    const cacheHitScore = performanceStats.totalRequests > 0 ? performanceStats.successfulRequests / performanceStats.totalRequests : 0;
    const failureScore = 1 - (performanceStats.failedRequests / Math.max(1, performanceStats.totalRequests));
    
    return (loadTimeScore * 0.4 + cacheHitScore * 0.4 + failureScore * 0.2);
  }

  /**
   * Recommend optimal caching strategy based on current metrics
   */
  private recommendStrategy(performanceStats: PerformanceStats, cacheStats: CacheStats): CachingStrategy {
    const { slowLoadTime, highFailureRate, lowCacheHitRate } = this.config.performanceThresholds;
    
    // High failure rate or slow loads -> Aggressive caching
    if (performanceStats.averageLoadTime > slowLoadTime || 
        (performanceStats.failedRequests / Math.max(1, performanceStats.totalRequests)) > highFailureRate) {
      return CachingStrategy.Aggressive;
    }
    
    // Low cache hit rate -> Performance-based caching
    if (cacheStats.hitRate < lowCacheHitRate) {
      return CachingStrategy.Performance;
    }
    
    // Good performance -> Lazy caching to save memory
    if (performanceStats.averageLoadTime < slowLoadTime * 0.5 && cacheStats.hitRate > 0.9) {
      return CachingStrategy.Lazy;
    }
    
    // Default to predictive for balanced approach
    return CachingStrategy.Predictive;
  }

  /**
   * Estimate performance improvement from strategy change
   */
  private estimateStrategyImprovement(newStrategy: CachingStrategy, currentPerformance: number): number {
    // Simple heuristic based on strategy characteristics
    const strategyBenefits = {
      [CachingStrategy.Aggressive]: 0.3,  // High cache hit rate but more memory usage
      [CachingStrategy.Lazy]: -0.1,       // Lower memory but potentially slower
      [CachingStrategy.Predictive]: 0.2,  // Balanced approach
      [CachingStrategy.Performance]: 0.25, // Optimized for performance metrics
      [CachingStrategy.Adaptive]: 0.15,   // Moderate improvement through adaptation
    };
    
    return strategyBenefits[newStrategy] || 0;
  }

  /**
   * Execute caching strategy and return recommendations
   */
  executeCachingStrategy(): CachingStrategyResult {
    this.updateAssetMetadata();
    
    switch (this.config.strategy) {
      case CachingStrategy.Aggressive:
        return this.executeAggressiveStrategy();
      case CachingStrategy.Lazy:
        return this.executeLazyStrategy();
      case CachingStrategy.Predictive:
        return this.executePredictiveStrategy();
      case CachingStrategy.Performance:
        return this.executePerformanceStrategy();
      case CachingStrategy.Adaptive:
        return this.executeAdaptiveStrategy();
      default:
        return this.executePredictiveStrategy();
    }
  }

  /**
   * Update asset metadata from performance metrics
   */
  private updateAssetMetadata(): void {
    const performanceStats = assetPerformanceMonitor.getStats();
    
    // Update metadata for each category
    Object.entries(performanceStats.categoryStats).forEach(([category, stats]) => {
      const categoryAssets = assets[category as keyof AssetRegistry];
      if (categoryAssets) {
        Object.entries(categoryAssets).forEach(([name, url]) => {
          const metadata = this.assetMetadata.get(url);
          if (metadata) {
            metadata.averageLoadTime = stats.averageLoadTime;
            metadata.failureRate = stats.failureRate;
            metadata.cacheScore = this.calculateCacheScore(
              metadata.priority,
              metadata.accessCount,
              stats.averageLoadTime,
              stats.failureRate
            );
          }
        });
      }
    });
  }

  /**
   * Calculate cache score for prioritization
   */
  private calculateCacheScore(
    priority: CachePriority,
    accessCount: number,
    loadTime: number,
    failureRate: number
  ): number {
    const priorityWeight = this.config.priorityWeights[priority];
    const accessWeight = Math.min(accessCount / 10, 1); // Normalize to max 10 accesses
    const loadTimeWeight = Math.min(loadTime / 5000, 1); // Normalize to 5s max
    const failureWeight = failureRate;
    
    return priorityWeight * 0.4 + accessWeight * 0.3 + loadTimeWeight * 0.2 + failureWeight * 0.1;
  }

  /**
   * Execute aggressive caching strategy
   */
  private executeAggressiveStrategy(): CachingStrategyResult {
    const allAssets = Array.from(this.assetMetadata.keys());
    const criticalAndHighAssets = allAssets.filter(url => {
      const metadata = this.assetMetadata.get(url);
      return metadata && [CachePriority.Critical, CachePriority.High].includes(metadata.priority);
    });

    return {
      assetsToCache: allAssets,
      assetsToEvict: [],
      priorityChanges: {},
      reasoning: [
        'Aggressive strategy: Cache all assets for maximum performance',
        `Caching ${allAssets.length} assets`,
        'Prioritizing critical and high-priority assets first',
      ],
    };
  }

  /**
   * Execute lazy caching strategy
   */
  private executeLazyStrategy(): CachingStrategyResult {
    const criticalAssets = Array.from(this.assetMetadata.entries())
      .filter(([, metadata]) => metadata.priority === CachePriority.Critical)
      .map(([url]) => url);

    return {
      assetsToCache: criticalAssets,
      assetsToEvict: [],
      priorityChanges: {},
      reasoning: [
        'Lazy strategy: Cache only critical assets initially',
        `Caching ${criticalAssets.length} critical assets`,
        'Other assets will be cached on demand',
      ],
    };
  }

  /**
   * Execute predictive caching strategy
   */
  private executePredictiveStrategy(): CachingStrategyResult {
    const sortedAssets = Array.from(this.assetMetadata.entries())
      .sort(([, a], [, b]) => b.cacheScore - a.cacheScore);

    const assetsToCache = sortedAssets
      .slice(0, Math.floor(sortedAssets.length * 0.7)) // Cache top 70%
      .map(([url]) => url);

    return {
      assetsToCache,
      assetsToEvict: [],
      priorityChanges: {},
      reasoning: [
        'Predictive strategy: Cache assets based on usage patterns and priority',
        `Caching top ${assetsToCache.length} assets by cache score`,
        'Balancing performance and memory usage',
      ],
    };
  }

  /**
   * Execute performance-based caching strategy
   */
  private executePerformanceStrategy(): CachingStrategyResult {
    const performanceStats = assetPerformanceMonitor.getStats();
    const slowAssets = performanceStats.slowestAssets.map(asset => 
      `${asset.category}.${asset.name}`
    );

    const assetsToCache = Array.from(this.assetMetadata.entries())
      .filter(([url, metadata]) => {
        const key = `${metadata.category}.${metadata.name}`;
        return metadata.priority === CachePriority.Critical ||
               slowAssets.includes(key) ||
               metadata.failureRate > 0.05; // Cache assets with >5% failure rate
      })
      .map(([url]) => url);

    return {
      assetsToCache,
      assetsToEvict: [],
      priorityChanges: {},
      reasoning: [
        'Performance strategy: Cache based on load times and failure rates',
        `Caching ${assetsToCache.length} performance-critical assets`,
        'Focusing on slow-loading and frequently failing assets',
      ],
    };
  }

  /**
   * Execute adaptive caching strategy
   */
  private executeAdaptiveStrategy(): CachingStrategyResult {
    // Use the currently recommended strategy
    const performanceStats = assetPerformanceMonitor.getStats();
    const cacheStats = assetCacheManager.getStats();
    const recommendedStrategy = this.recommendStrategy(performanceStats, cacheStats);
    
    // Temporarily switch to recommended strategy for execution
    const originalStrategy = this.config.strategy;
    this.config.strategy = recommendedStrategy;
    
    const result = this.executeCachingStrategy();
    
    // Restore adaptive strategy
    this.config.strategy = originalStrategy;
    
    result.strategyRecommendation = recommendedStrategy;
    result.reasoning.unshift(`Adaptive strategy: Currently using ${recommendedStrategy} approach`);
    
    return result;
  }

  /**
   * Get current caching configuration
   */
  getConfig(): CachingConfig {
    return { ...this.config };
  }

  /**
   * Update caching configuration
   */
  updateConfig(updates: Partial<CachingConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart adaptive evaluation if strategy changed
    if (updates.strategy && this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
      this.startAdaptiveEvaluation();
    }
  }

  /**
   * Get asset metadata for debugging
   */
  getAssetMetadata(): Map<string, AssetCacheMetadata> {
    return new Map(this.assetMetadata);
  }

  /**
   * Get strategy performance history
   */
  getStrategyHistory(): Array<{ strategy: CachingStrategy; timestamp: number; performance: number }> {
    return [...this.strategyHistory];
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
    
    this.assetMetadata.clear();
    this.strategyHistory = [];
  }
}

/**
 * Global caching strategy manager
 */
export const assetCachingStrategy = new AssetCachingStrategyManager();

/**
 * Hook for using caching strategy in React components
 */
export function useAssetCachingStrategy() {
  return {
    executeStrategy: () => assetCachingStrategy.executeCachingStrategy(),
    getConfig: () => assetCachingStrategy.getConfig(),
    updateConfig: (config: Partial<CachingConfig>) => assetCachingStrategy.updateConfig(config),
    getMetadata: () => assetCachingStrategy.getAssetMetadata(),
    getHistory: () => assetCachingStrategy.getStrategyHistory(),
  };
}