/**
 * Asset Versioning System
 * 
 * Handles asset versioning for cache invalidation and deployment management.
 */

import { assets, AssetRegistry } from './assets';

/**
 * Asset version information
 */
export interface AssetVersion {
  version: string;
  hash: string;
  timestamp: number;
  size?: number;
  url: string;
}

/**
 * Version manifest interface
 */
export interface VersionManifest {
  buildId: string;
  timestamp: number;
  assets: Record<string, AssetVersion>;
  critical: string[];
  categories: Record<string, string[]>;
}

/**
 * Asset Versioning Manager
 */
export class AssetVersioningManager {
  private manifest: VersionManifest | null = null;
  private buildId: string;

  constructor() {
    this.buildId = this.generateBuildId();
    this.initializeVersioning();
  }

  /**
   * Initialize versioning system
   */
  private async initializeVersioning(): Promise<void> {
    // Load existing manifest or create new one
    await this.loadManifest();
    
    if (!this.manifest) {
      await this.generateManifest();
    }
  }

  /**
   * Generate unique build ID
   */
  private generateBuildId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Generate asset manifest with versions
   */
  private async generateManifest(): Promise<void> {
    const assetVersions: Record<string, AssetVersion> = {};
    const categories: Record<string, string[]> = {};
    const critical: string[] = [
      assets.rooms.compiler,
      assets.icons.asset,
      assets.icons.ghost,
    ];

    // Process all assets
    for (const [category, categoryAssets] of Object.entries(assets)) {
      categories[category] = [];
      
      for (const [name, assetPath] of Object.entries(categoryAssets)) {
        const assetKey = `${category}.${name}`;
        const version = await this.generateAssetVersion(assetPath);
        
        assetVersions[assetKey] = version;
        categories[category].push(assetKey);
      }
    }

    this.manifest = {
      buildId: this.buildId,
      timestamp: Date.now(),
      assets: assetVersions,
      critical: critical.map(path => this.getAssetKeyByPath(path)).filter(Boolean) as string[],
      categories,
    };

    await this.saveManifest();
  }

  /**
   * Generate version information for an asset
   */
  private async generateAssetVersion(assetPath: string): Promise<AssetVersion> {
    try {
      // In browser environment, we can't access file system
      // So we'll generate a hash based on URL and timestamp
      const hash = await this.generateUrlHash(assetPath);
      
      return {
        version: `v${Date.now()}`,
        hash,
        timestamp: Date.now(),
        url: assetPath,
      };
    } catch (error) {
      console.warn(`Failed to generate version for ${assetPath}:`, error);
      
      // Fallback version
      return {
        version: 'v1.0.0',
        hash: 'fallback',
        timestamp: Date.now(),
        url: assetPath,
      };
    }
  }

  /**
   * Generate hash for URL-based versioning
   */
  private async generateUrlHash(url: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(url + Date.now());
    
    if (crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
    } else {
      // Fallback for environments without crypto.subtle
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16).substring(0, 8);
    }
  }

  /**
   * Get asset key by path
   */
  private getAssetKeyByPath(path: string): string | null {
    for (const [category, categoryAssets] of Object.entries(assets)) {
      for (const [name, assetPath] of Object.entries(categoryAssets)) {
        if (assetPath === path) {
          return `${category}.${name}`;
        }
      }
    }
    return null;
  }

  /**
   * Load manifest from storage
   */
  private async loadManifest(): Promise<void> {
    try {
      const stored = localStorage.getItem('asset-version-manifest');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if manifest is still valid (not too old)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - parsed.timestamp < maxAge) {
          this.manifest = parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load asset manifest:', error);
    }
  }

  /**
   * Save manifest to storage
   */
  private async saveManifest(): Promise<void> {
    try {
      if (this.manifest) {
        localStorage.setItem('asset-version-manifest', JSON.stringify(this.manifest));
      }
    } catch (error) {
      console.warn('Failed to save asset manifest:', error);
    }
  }

  /**
   * Get versioned URL for an asset
   */
  getVersionedUrl(category: keyof AssetRegistry, name: string): string | null {
    if (!this.manifest) {
      // Return original URL if no manifest
      const categoryAssets = assets[category];
      return categoryAssets && name in categoryAssets ? (categoryAssets as any)[name] : null;
    }

    const assetKey = `${category}.${name}`;
    const assetVersion = this.manifest.assets[assetKey];
    
    if (assetVersion) {
      // Add version parameter for cache busting
      const url = new URL(assetVersion.url, window.location.origin);
      url.searchParams.set('v', assetVersion.version);
      url.searchParams.set('h', assetVersion.hash);
      return url.toString();
    }

    return null;
  }

  /**
   * Check if asset version has changed
   */
  async hasAssetChanged(category: keyof AssetRegistry, name: string): Promise<boolean> {
    if (!this.manifest) return false;

    const assetKey = `${category}.${name}`;
    const currentVersion = this.manifest.assets[assetKey];
    
    if (!currentVersion) return true;

    // Generate new version and compare
    const categoryAssets = assets[category];
    if (categoryAssets && name in categoryAssets) {
      const assetPath = (categoryAssets as any)[name];
      const newVersion = await this.generateAssetVersion(assetPath);
      
      return currentVersion.hash !== newVersion.hash;
    }

    return false;
  }

  /**
   * Get critical assets for preloading
   */
  getCriticalAssets(): AssetVersion[] {
    if (!this.manifest) return [];

    return this.manifest.critical
      .map(assetKey => this.manifest!.assets[assetKey])
      .filter(Boolean);
  }

  /**
   * Get assets by category with versions
   */
  getAssetsByCategory(category: string): AssetVersion[] {
    if (!this.manifest || !this.manifest.categories[category]) return [];

    return this.manifest.categories[category]
      .map(assetKey => this.manifest!.assets[assetKey])
      .filter(Boolean);
  }

  /**
   * Invalidate asset cache for changed assets
   */
  async invalidateChangedAssets(): Promise<string[]> {
    if (!this.manifest) return [];

    const changedAssets: string[] = [];

    for (const [category, categoryAssets] of Object.entries(assets)) {
      for (const name of Object.keys(categoryAssets)) {
        const hasChanged = await this.hasAssetChanged(category as keyof AssetRegistry, name);
        if (hasChanged) {
          changedAssets.push(`${category}.${name}`);
        }
      }
    }

    if (changedAssets.length > 0) {
      console.log(`🔄 Found ${changedAssets.length} changed assets, invalidating cache...`);
      
      // Regenerate manifest for changed assets
      await this.generateManifest();
    }

    return changedAssets;
  }

  /**
   * Get manifest information
   */
  getManifest(): VersionManifest | null {
    return this.manifest;
  }

  /**
   * Clear version manifest
   */
  clearManifest(): void {
    this.manifest = null;
    localStorage.removeItem('asset-version-manifest');
  }

  /**
   * Get build information
   */
  getBuildInfo(): { buildId: string; timestamp: number; assetCount: number } {
    return {
      buildId: this.buildId,
      timestamp: this.manifest?.timestamp || Date.now(),
      assetCount: this.manifest ? Object.keys(this.manifest.assets).length : 0,
    };
  }
}

/**
 * Global asset versioning manager
 */
export const assetVersioningManager = new AssetVersioningManager();

/**
 * Hook for using asset versioning in React components
 */
export function useAssetVersioning() {
  return {
    getVersionedUrl: (category: keyof AssetRegistry, name: string) => 
      assetVersioningManager.getVersionedUrl(category, name),
    hasAssetChanged: (category: keyof AssetRegistry, name: string) => 
      assetVersioningManager.hasAssetChanged(category, name),
    getCriticalAssets: () => assetVersioningManager.getCriticalAssets(),
    getManifest: () => assetVersioningManager.getManifest(),
    getBuildInfo: () => assetVersioningManager.getBuildInfo(),
    invalidateChangedAssets: () => assetVersioningManager.invalidateChangedAssets(),
  };
}