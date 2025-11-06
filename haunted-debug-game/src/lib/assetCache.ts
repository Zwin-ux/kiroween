/**
 * Asset Caching System
 * 
 * Implements comprehensive caching strategies for game assets including
 * browser caching, service worker caching, and cache invalidation.
 */

import { assets, AssetRegistry } from './assets';

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  /** Cache name for service worker */
  cacheName: string;
  /** Cache version for invalidation */
  version: string;
  /** Maximum cache size in bytes */
  maxCacheSize: number;
  /** Cache TTL in milliseconds */
  ttl: number;
  /** Whether to use service worker caching */
  useServiceWorker: boolean;
  /** Whether to preload critical assets */
  preloadCritical: boolean;
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  url: string;
  timestamp: number;
  size: number;
  version: string;
  category: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  lastCleanup: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  cacheName: 'haunted-debug-game-assets-v1',
  version: '1.0.0',
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  useServiceWorker: true,
  preloadCritical: true,
};

/**
 * Asset Cache Manager
 */
export class AssetCacheManager {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictions: 0,
    lastCleanup: Date.now(),
  };
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.initializeCache();
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    // Load existing cache entries from localStorage
    this.loadCacheFromStorage();
    
    // Register service worker if supported and enabled
    if (this.config.useServiceWorker && 'serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }
    
    // Preload critical assets
    if (this.config.preloadCritical) {
      await this.preloadCriticalAssets();
    }
    
    // Schedule periodic cleanup
    this.scheduleCleanup();
  }

  /**
   * Register service worker for asset caching
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('🔧 Service Worker registered for asset caching:', registration);
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('📦 Asset cache updated:', event.data.url);
        }
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  /**
   * Preload critical assets
   */
  private async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      assets.rooms.compiler,
      assets.icons.asset,
      assets.icons.ghost,
    ];

    const preloadPromises = criticalAssets.map(assetPath => 
      this.cacheAsset(assetPath, 'critical')
    );

    try {
      await Promise.all(preloadPromises);
      console.log('🚀 Critical assets preloaded');
    } catch (error) {
      console.warn('Failed to preload some critical assets:', error);
    }
  }

  /**
   * Cache an asset with metadata
   */
  async cacheAsset(url: string, priority: CacheEntry['priority'] = 'normal'): Promise<boolean> {
    try {
      // Check if already cached and valid
      const existing = this.cache.get(url);
      if (existing && this.isCacheEntryValid(existing)) {
        this.hits++;
        return true;
      }

      // Fetch and cache the asset
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status}`);
      }

      const blob = await response.blob();
      const size = blob.size;

      // Check cache size limits
      if (this.stats.totalSize + size > this.config.maxCacheSize) {
        await this.evictLeastRecentlyUsed(size);
      }

      // Create cache entry
      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
        size,
        version: this.config.version,
        category: this.getCategoryFromUrl(url),
        priority,
      };

      // Store in memory cache
      this.cache.set(url, entry);
      this.updateStats(entry, 'add');

      // Store in browser cache via service worker
      if (this.config.useServiceWorker && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_ASSET',
          url,
          priority,
        });
      }

      // Persist cache metadata
      this.saveCacheToStorage();
      
      this.misses++;
      return true;
    } catch (error) {
      console.warn(`Failed to cache asset ${url}:`, error);
      this.misses++;
      return false;
    }
  }

  /**
   * Get cached asset URL or original URL if not cached
   */
  getCachedAssetUrl(url: string): string {
    const entry = this.cache.get(url);
    if (entry && this.isCacheEntryValid(entry)) {
      this.hits++;
      // Update access time
      entry.timestamp = Date.now();
      return url; // Return original URL as browser/SW will serve from cache
    }
    
    this.misses++;
    // Trigger background caching
    this.cacheAsset(url, 'normal');
    return url;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheEntryValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.config.ttl && entry.version === this.config.version;
  }

  /**
   * Evict least recently used assets to make space
   */
  private async evictLeastRecentlyUsed(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp); // Oldest first

    let freedSpace = 0;
    const toEvict: string[] = [];

    for (const [url, entry] of entries) {
      // Don't evict critical assets unless absolutely necessary
      if (entry.priority === 'critical' && freedSpace < requiredSpace * 0.8) {
        continue;
      }

      toEvict.push(url);
      freedSpace += entry.size;

      if (freedSpace >= requiredSpace) {
        break;
      }
    }

    // Remove evicted entries
    for (const url of toEvict) {
      const entry = this.cache.get(url);
      if (entry) {
        this.cache.delete(url);
        this.updateStats(entry, 'remove');
        this.stats.evictions++;
      }
    }

    // Notify service worker to evict from browser cache
    if (this.config.useServiceWorker && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'EVICT_ASSETS',
        urls: toEvict,
      });
    }

    console.log(`🗑️ Evicted ${toEvict.length} assets to free ${freedSpace} bytes`);
  }

  /**
   * Update cache statistics
   */
  private updateStats(entry: CacheEntry, operation: 'add' | 'remove'): void {
    if (operation === 'add') {
      this.stats.totalEntries++;
      this.stats.totalSize += entry.size;
    } else {
      this.stats.totalEntries--;
      this.stats.totalSize -= entry.size;
    }

    // Update hit/miss rates
    const total = this.hits + this.misses;
    if (total > 0) {
      this.stats.hitRate = this.hits / total;
      this.stats.missRate = this.misses / total;
    }
  }

  /**
   * Get category from asset URL
   */
  private getCategoryFromUrl(url: string): string {
    // Simple heuristic based on file name patterns
    if (url.includes('room') || url.includes('Room')) return 'rooms';
    if (url.includes('icon') || url.includes('Icon')) return 'icons';
    if (url.includes('pumpkin') || url.includes('candy') || url.includes('terminal')) return 'entities';
    return 'ui';
  }

  /**
   * Schedule periodic cache cleanup
   */
  private scheduleCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [url, entry] of this.cache.entries()) {
      if (!this.isCacheEntryValid(entry)) {
        toRemove.push(url);
      }
    }

    for (const url of toRemove) {
      const entry = this.cache.get(url);
      if (entry) {
        this.cache.delete(url);
        this.updateStats(entry, 'remove');
      }
    }

    this.stats.lastCleanup = now;
    this.saveCacheToStorage();

    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} expired cache entries`);
    }
  }

  /**
   * Load cache metadata from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(`${this.config.cacheName}-metadata`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.config.version) {
          // Restore cache entries (metadata only, actual assets are in browser cache)
          for (const [url, entry] of Object.entries(data.entries)) {
            this.cache.set(url, entry as CacheEntry);
          }
          this.stats = { ...this.stats, ...data.stats };
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache metadata to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const data = {
        version: this.config.version,
        entries: Object.fromEntries(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${this.config.cacheName}-metadata`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cached assets
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      lastCleanup: Date.now(),
    };
    this.hits = 0;
    this.misses = 0;

    // Clear localStorage
    localStorage.removeItem(`${this.config.cacheName}-metadata`);

    // Clear service worker cache
    if (this.config.useServiceWorker && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CLEAR_CACHE',
      });
    }

    console.log('🗑️ Asset cache cleared');
  }

  /**
   * Preload assets by category
   */
  async preloadCategory(category: keyof AssetRegistry, priority: CacheEntry['priority'] = 'normal'): Promise<void> {
    const categoryAssets = assets[category];
    const urls = Object.values(categoryAssets);
    
    const preloadPromises = urls.map(url => this.cacheAsset(url, priority));
    
    try {
      await Promise.all(preloadPromises);
      console.log(`📦 Preloaded ${category} assets`);
    } catch (error) {
      console.warn(`Failed to preload ${category} assets:`, error);
    }
  }

  /**
   * Get cache usage by category
   */
  getCacheUsageByCategory(): Record<string, { count: number; size: number }> {
    const usage: Record<string, { count: number; size: number }> = {};

    for (const entry of this.cache.values()) {
      if (!usage[entry.category]) {
        usage[entry.category] = { count: 0, size: 0 };
      }
      usage[entry.category].count++;
      usage[entry.category].size += entry.size;
    }

    return usage;
  }
}

/**
 * Global asset cache manager instance
 */
export const assetCacheManager = new AssetCacheManager();

/**
 * Hook for using asset caching in React components
 */
export function useAssetCache() {
  return {
    getCachedUrl: (url: string) => assetCacheManager.getCachedAssetUrl(url),
    preloadAsset: (url: string, priority?: CacheEntry['priority']) => assetCacheManager.cacheAsset(url, priority),
    preloadCategory: (category: keyof AssetRegistry, priority?: CacheEntry['priority']) => 
      assetCacheManager.preloadCategory(category, priority),
    getStats: () => assetCacheManager.getStats(),
    clearCache: () => assetCacheManager.clearCache(),
  };
}