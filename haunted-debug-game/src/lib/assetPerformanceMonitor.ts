/**
 * Asset Performance Monitor
 * 
 * Comprehensive performance monitoring for asset loading, caching,
 * and optimization metrics with real-time analytics.
 */

import { AssetRegistry } from './assets';

/**
 * Performance metric types
 */
export interface AssetLoadMetric {
  url: string;
  category: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  fromCache: boolean;
  success: boolean;
  error?: string;
  retryCount: number;
  timestamp: number;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLoadTime: number;
  medianLoadTime: number;
  p95LoadTime: number;
  totalBytesLoaded: number;
  cacheHitRate: number;
  cacheMissRate: number;
  totalRetries: number;
  slowestAssets: AssetLoadMetric[];
  fastestAssets: AssetLoadMetric[];
  largestAssets: AssetLoadMetric[];
  categoryStats: Record<string, CategoryStats>;
}

/**
 * Category-specific statistics
 */
export interface CategoryStats {
  requests: number;
  averageLoadTime: number;
  totalSize: number;
  cacheHitRate: number;
  failureRate: number;
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
  type: 'slow_load' | 'high_failure_rate' | 'large_asset' | 'cache_miss';
  threshold: number;
  enabled: boolean;
  callback?: (metric: AssetLoadMetric) => void;
}

/**
 * Performance monitoring configuration
 */
export interface MonitorConfig {
  enabled: boolean;
  maxMetrics: number;
  alertThresholds: Record<string, PerformanceAlert>;
  reportingInterval: number;
  enableRealTimeAlerts: boolean;
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitorConfig = {
  enabled: true,
  maxMetrics: 1000,
  alertThresholds: {
    slowLoad: {
      type: 'slow_load',
      threshold: 2000, // 2 seconds
      enabled: true,
    },
    highFailureRate: {
      type: 'high_failure_rate',
      threshold: 0.1, // 10%
      enabled: true,
    },
    largeAsset: {
      type: 'large_asset',
      threshold: 1024 * 1024, // 1MB
      enabled: true,
    },
    cacheMiss: {
      type: 'cache_miss',
      threshold: 0.3, // 30% miss rate
      enabled: true,
    },
  },
  reportingInterval: 60000, // 1 minute
  enableRealTimeAlerts: true,
};

/**
 * Asset Performance Monitor class
 */
export class AssetPerformanceMonitor {
  private static instance: AssetPerformanceMonitor;
  private config: MonitorConfig;
  private metrics: AssetLoadMetric[] = [];
  private activeRequests: Map<string, { startTime: number; retryCount: number }> = new Map();
  private reportingTimer: NodeJS.Timeout | null = null;
  private observers: Array<(stats: PerformanceStats) => void> = [];

  private constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.initializeMonitoring();
    }
  }

  static getInstance(config?: Partial<MonitorConfig>): AssetPerformanceMonitor {
    if (!AssetPerformanceMonitor.instance) {
      AssetPerformanceMonitor.instance = new AssetPerformanceMonitor(config);
    }
    return AssetPerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Set up periodic reporting
    if (this.config.reportingInterval > 0) {
      this.reportingTimer = setInterval(() => {
        this.generateReport();
      }, this.config.reportingInterval);
    }

    // Set up performance observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource' && this.isAssetRequest(entry.name)) {
              this.recordResourceTiming(entry as PerformanceResourceTiming);
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    console.log('📊 Asset Performance Monitor initialized');
  }

  /**
   * Record start of asset loading
   */
  recordLoadStart(url: string, category: string, name: string): void {
    if (!this.config.enabled) return;

    const requestKey = `${category}.${name}`;
    const existing = this.activeRequests.get(requestKey);
    
    this.activeRequests.set(requestKey, {
      startTime: performance.now(),
      retryCount: existing ? existing.retryCount + 1 : 0,
    });
  }

  /**
   * Record successful asset load
   */
  recordLoadSuccess(url: string, category: string, name: string, size: number = 0, fromCache: boolean = false): void {
    if (!this.config.enabled) return;

    const requestKey = `${category}.${name}`;
    const request = this.activeRequests.get(requestKey);
    
    if (request) {
      const endTime = performance.now();
      const duration = endTime - request.startTime;
      
      const metric: AssetLoadMetric = {
        url,
        category,
        name,
        startTime: request.startTime,
        endTime,
        duration,
        size,
        fromCache,
        success: true,
        retryCount: request.retryCount,
        timestamp: Date.now(),
      };

      this.addMetric(metric);
      this.activeRequests.delete(requestKey);
      
      // Check for performance alerts
      this.checkAlerts(metric);
    }
  }

  /**
   * Record failed asset load
   */
  recordLoadFailure(url: string, category: string, name: string, error: string): void {
    if (!this.config.enabled) return;

    const requestKey = `${category}.${name}`;
    const request = this.activeRequests.get(requestKey);
    
    if (request) {
      const endTime = performance.now();
      const duration = endTime - request.startTime;
      
      const metric: AssetLoadMetric = {
        url,
        category,
        name,
        startTime: request.startTime,
        endTime,
        duration,
        size: 0,
        fromCache: false,
        success: false,
        error,
        retryCount: request.retryCount,
        timestamp: Date.now(),
      };

      this.addMetric(metric);
      this.activeRequests.delete(requestKey);
      
      // Check for performance alerts
      this.checkAlerts(metric);
    }
  }

  /**
   * Record resource timing from Performance API
   */
  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    const { category, name } = this.parseAssetUrl(entry.name);
    if (!category || !name) return;

    const metric: AssetLoadMetric = {
      url: entry.name,
      category,
      name,
      startTime: entry.startTime,
      endTime: entry.responseEnd,
      duration: entry.responseEnd - entry.startTime,
      size: entry.transferSize || 0,
      fromCache: entry.transferSize === 0 && entry.decodedBodySize > 0,
      success: true,
      retryCount: 0,
      timestamp: Date.now(),
    };

    this.addMetric(metric);
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: AssetLoadMetric): void {
    this.metrics.push(metric);
    
    // Limit metrics collection size
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }
  }

  /**
   * Check performance alerts
   */
  private checkAlerts(metric: AssetLoadMetric): void {
    if (!this.config.enableRealTimeAlerts) return;

    const alerts = this.config.alertThresholds;

    // Slow load alert
    if (alerts.slowLoad.enabled && metric.duration > alerts.slowLoad.threshold) {
      this.triggerAlert('slow_load', metric, `Asset loaded slowly: ${metric.duration.toFixed(2)}ms`);
    }

    // Large asset alert
    if (alerts.largeAsset.enabled && metric.size > alerts.largeAsset.threshold) {
      this.triggerAlert('large_asset', metric, `Large asset detected: ${this.formatBytes(metric.size)}`);
    }

    // Check category-specific failure rates
    const categoryStats = this.getCategoryStats(metric.category);
    if (alerts.highFailureRate.enabled && categoryStats.failureRate > alerts.highFailureRate.threshold) {
      this.triggerAlert('high_failure_rate', metric, `High failure rate in ${metric.category}: ${(categoryStats.failureRate * 100).toFixed(1)}%`);
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerAlert(type: string, metric: AssetLoadMetric, message: string): void {
    console.warn(`🚨 Performance Alert [${type}]:`, message, metric);
    
    const alert = this.config.alertThresholds[type];
    if (alert?.callback) {
      alert.callback(metric);
    }
  }

  /**
   * Generate comprehensive performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return this.getEmptyStats();
    }

    const successfulMetrics = this.metrics.filter(m => m.success);
    const failedMetrics = this.metrics.filter(m => !m.success);
    const durations = successfulMetrics.map(m => m.duration).sort((a, b) => a - b);
    
    const totalRequests = this.metrics.length;
    const successfulRequests = successfulMetrics.length;
    const failedRequests = failedMetrics.length;
    
    const averageLoadTime = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    const medianLoadTime = durations.length > 0 
      ? durations[Math.floor(durations.length / 2)] 
      : 0;
    
    const p95LoadTime = durations.length > 0 
      ? durations[Math.floor(durations.length * 0.95)] 
      : 0;

    const totalBytesLoaded = successfulMetrics.reduce((sum, m) => sum + m.size, 0);
    const cachedRequests = successfulMetrics.filter(m => m.fromCache).length;
    const cacheHitRate = successfulRequests > 0 ? cachedRequests / successfulRequests : 0;
    const totalRetries = this.metrics.reduce((sum, m) => sum + m.retryCount, 0);

    // Get top/bottom performers
    const sortedByDuration = [...successfulMetrics].sort((a, b) => b.duration - a.duration);
    const sortedBySize = [...successfulMetrics].sort((a, b) => b.size - a.size);
    
    const slowestAssets = sortedByDuration.slice(0, 10);
    const fastestAssets = sortedByDuration.slice(-10).reverse();
    const largestAssets = sortedBySize.slice(0, 10);

    // Category statistics
    const categoryStats: Record<string, CategoryStats> = {};
    const categories = [...new Set(this.metrics.map(m => m.category))];
    
    for (const category of categories) {
      categoryStats[category] = this.getCategoryStats(category);
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLoadTime,
      medianLoadTime,
      p95LoadTime,
      totalBytesLoaded,
      cacheHitRate,
      cacheMissRate: 1 - cacheHitRate,
      totalRetries,
      slowestAssets,
      fastestAssets,
      largestAssets,
      categoryStats,
    };
  }

  /**
   * Get category-specific statistics
   */
  private getCategoryStats(category: string): CategoryStats {
    const categoryMetrics = this.metrics.filter(m => m.category === category);
    const successfulMetrics = categoryMetrics.filter(m => m.success);
    const failedMetrics = categoryMetrics.filter(m => !m.success);
    const cachedMetrics = successfulMetrics.filter(m => m.fromCache);

    const requests = categoryMetrics.length;
    const averageLoadTime = successfulMetrics.length > 0
      ? successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length
      : 0;
    const totalSize = successfulMetrics.reduce((sum, m) => sum + m.size, 0);
    const cacheHitRate = successfulMetrics.length > 0 ? cachedMetrics.length / successfulMetrics.length : 0;
    const failureRate = requests > 0 ? failedMetrics.length / requests : 0;

    return {
      requests,
      averageLoadTime,
      totalSize,
      cacheHitRate,
      failureRate,
    };
  }

  /**
   * Get empty statistics structure
   */
  private getEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLoadTime: 0,
      medianLoadTime: 0,
      p95LoadTime: 0,
      totalBytesLoaded: 0,
      cacheHitRate: 0,
      cacheMissRate: 0,
      totalRetries: 0,
      slowestAssets: [],
      fastestAssets: [],
      largestAssets: [],
      categoryStats: {},
    };
  }

  /**
   * Generate and log performance report
   */
  generateReport(): void {
    const stats = this.getStats();
    
    console.group('📊 Asset Performance Report');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Success Rate: ${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%`);
    console.log(`Average Load Time: ${stats.averageLoadTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Total Data Loaded: ${this.formatBytes(stats.totalBytesLoaded)}`);
    
    if (stats.slowestAssets.length > 0) {
      console.log('Slowest Assets:', stats.slowestAssets.slice(0, 3).map(a => 
        `${a.category}.${a.name} (${a.duration.toFixed(2)}ms)`
      ));
    }
    
    console.groupEnd();

    // Notify observers
    this.observers.forEach(observer => observer(stats));
  }

  /**
   * Subscribe to performance reports
   */
  subscribe(callback: (stats: PerformanceStats) => void): () => void {
    this.observers.push(callback);
    
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Check if URL is an asset request
   */
  private isAssetRequest(url: string): boolean {
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    return assetExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  /**
   * Parse asset URL to extract category and name
   */
  private parseAssetUrl(url: string): { category: string | null; name: string | null } {
    // Simple heuristic based on file name patterns
    const fileName = url.split('/').pop()?.split('?')[0] || '';
    
    let category: string | null = null;
    let name: string | null = null;

    if (fileName.toLowerCase().includes('room')) {
      category = 'rooms';
      name = 'compiler'; // Default room
    } else if (fileName.toLowerCase().includes('icon')) {
      category = 'icons';
      name = fileName.includes('ghost') ? 'ghost' : 'asset';
    } else if (['pumpkin', 'candy', 'terminal'].some(entity => fileName.toLowerCase().includes(entity))) {
      category = 'entities';
      name = fileName.toLowerCase().includes('candy') ? 'candy' : 
            fileName.toLowerCase().includes('terminal') ? 'terminal' : 'pumpkin';
    } else {
      category = 'ui';
      name = 'background';
    }

    return { category, name };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.activeRequests.clear();
    console.log('📊 Performance metrics cleared');
  }

  /**
   * Destroy monitor and cleanup
   */
  destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }
    
    this.clearMetrics();
    this.observers = [];
    console.log('📊 Asset Performance Monitor destroyed');
  }
}

/**
 * Global performance monitor instance
 */
export const assetPerformanceMonitor = AssetPerformanceMonitor.getInstance();

/**
 * Hook for using performance monitoring in React components
 */
export function useAssetPerformanceMonitor() {
  return {
    recordLoadStart: (url: string, category: string, name: string) => 
      assetPerformanceMonitor.recordLoadStart(url, category, name),
    recordLoadSuccess: (url: string, category: string, name: string, size?: number, fromCache?: boolean) => 
      assetPerformanceMonitor.recordLoadSuccess(url, category, name, size, fromCache),
    recordLoadFailure: (url: string, category: string, name: string, error: string) => 
      assetPerformanceMonitor.recordLoadFailure(url, category, name, error),
    getStats: () => assetPerformanceMonitor.getStats(),
    subscribe: (callback: (stats: PerformanceStats) => void) => assetPerformanceMonitor.subscribe(callback),
    clearMetrics: () => assetPerformanceMonitor.clearMetrics(),
  };
}