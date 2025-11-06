/**
 * Asset Fallback System
 * 
 * Provides comprehensive fallback assets and retry logic
 * for when primary assets fail to load.
 */

import { AssetRegistry } from './assets';

/**
 * Fallback asset configuration
 */
export interface FallbackConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Whether to use progressive fallbacks */
  useProgressiveFallbacks: boolean;
  /** Custom fallback assets */
  customFallbacks?: Partial<Record<keyof AssetRegistry, Record<string, string>>>;
}

/**
 * Default fallback configuration
 */
const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  useProgressiveFallbacks: true,
};

/**
 * High-quality SVG fallback assets for each category
 */
export const FALLBACK_ASSETS = {
  rooms: {
    // Compiler room fallback with atmospheric design
    compiler: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23111827;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23374151;stop-opacity:1' /%3E%3C/linearGradient%3E%3CradialGradient id='glow' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' style='stop-color:%2310B981;stop-opacity:0.3' /%3E%3Cstop offset='100%25' style='stop-color:%2310B981;stop-opacity:0' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23bg)'/%3E%3Crect width='1200' height='800' fill='url(%23glow)'/%3E%3Cg opacity='0.6'%3E%3Ctext x='600' y='400' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='24'%3ECompiler Room%3C/text%3E%3Ctext x='600' y='440' text-anchor='middle' fill='%234B5563' font-family='monospace' font-size='14'%3E[Fallback Environment]%3C/text%3E%3C/g%3E%3Cg stroke='%2310B981' stroke-width='1' fill='none' opacity='0.3'%3E%3Cpath d='M100,100 L300,100 L300,200 L100,200 Z'/%3E%3Cpath d='M900,100 L1100,100 L1100,200 L900,200 Z'/%3E%3Cpath d='M100,600 L300,600 L300,700 L100,700 Z'/%3E%3Cpath d='M900,600 L1100,600 L1100,700 L900,700 Z'/%3E%3C/g%3E%3C/svg%3E`,
    // Generic room fallback
    default: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23111827'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='16'%3ERoom Loading...%3C/text%3E%3C/svg%3E`,
  },
  icons: {
    // Asset icon fallback
    asset: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21,15 16,10 5,21'/%3E%3C/svg%3E`,
    // Ghost icon fallback
    ghost: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23EF4444' stroke-width='2'%3E%3Cpath d='M9 10h.01'/%3E%3Cpath d='M15 10h.01'/%3E%3Cpath d='M12 2C8.5 2 5 4.5 5 9c0 5 2 7 2 7s1.5 1.5 5 1.5 5-1.5 5-1.5 2-2 2-7c0-4.5-3.5-7-7-7z'/%3E%3Cpath d='M8 21s-2-1-2-3 1.5-3 4-3 4 1 4 3-2 3-2 3'/%3E%3C/svg%3E`,
    // Generic icon fallback
    default: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v8'/%3E%3Cpath d='M8 12h8'/%3E%3C/svg%3E`,
  },
  entities: {
    // Pumpkin entity fallback
    pumpkin: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='28' r='16' fill='%23F97316' stroke='%23EA580C' stroke-width='2'/%3E%3Cpath d='M24 12 L24 20' stroke='%2365A30D' stroke-width='3' stroke-linecap='round'/%3E%3Ccircle cx='18' cy='24' r='2' fill='%23000'/%3E%3Ccircle cx='30' cy='24' r='2' fill='%23000'/%3E%3Cpath d='M18 32 Q24 36 30 32' stroke='%23000' stroke-width='2' fill='none'/%3E%3C/svg%3E`,
    // Candy entity fallback
    candy: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect x='12' y='16' width='24' height='16' rx='8' fill='%23EC4899' stroke='%23BE185D' stroke-width='2'/%3E%3Cpath d='M12 24 L8 20 L8 28 Z' fill='%23F59E0B'/%3E%3Cpath d='M36 24 L40 20 L40 28 Z' fill='%23F59E0B'/%3E%3Ccircle cx='20' cy='24' r='2' fill='%23FFF' opacity='0.8'/%3E%3Ccircle cx='28' cy='24' r='2' fill='%23FFF' opacity='0.8'/%3E%3C/svg%3E`,
    // Terminal entity fallback
    terminal: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect x='4' y='8' width='40' height='32' rx='4' fill='%23111827' stroke='%2310B981' stroke-width='2'/%3E%3Cpath d='M8 12 L12 16 L8 20' stroke='%2310B981' stroke-width='2' fill='none'/%3E%3Cline x1='16' y1='20' x2='24' y2='20' stroke='%2310B981' stroke-width='2'/%3E%3Ccircle cx='36' cy='16' r='2' fill='%23EF4444'/%3E%3C/svg%3E`,
    // Generic entity fallback
    default: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Ccircle cx='24' cy='24' r='20'/%3E%3Cpath d='M16 16l16 16M32 16l-16 16'/%3E%3C/svg%3E`,
  },
  ui: {
    // Background UI fallback
    background: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='uiBg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23374151;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23111827;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23uiBg)'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='14'%3EUI Background%3C/text%3E%3C/svg%3E`,
    // Palette UI fallback
    palette: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Crect x='0' y='0' width='40' height='100' fill='%23111827'/%3E%3Crect x='40' y='0' width='40' height='100' fill='%23374151'/%3E%3Crect x='80' y='0' width='40' height='100' fill='%23EF4444'/%3E%3Crect x='120' y='0' width='40' height='100' fill='%2310B981'/%3E%3Crect x='160' y='0' width='40' height='100' fill='%23F59E0B'/%3E%3C/svg%3E`,
    // Room sheet UI fallback
    roomsheet: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23374151'/%3E%3Cg stroke='%236B7280' stroke-width='1' fill='none'%3E%3Crect x='20' y='20' width='80' height='60'/%3E%3Crect x='110' y='20' width='80' height='60'/%3E%3Crect x='200' y='20' width='80' height='60'/%3E%3Crect x='20' y='90' width='80' height='60'/%3E%3Crect x='110' y='90' width='80' height='60'/%3E%3Crect x='200' y='90' width='80' height='60'/%3E%3C/g%3E%3Ctext x='150' y='180' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='12'%3ERoom Layout%3C/text%3E%3C/svg%3E`,
    // Generic UI fallback
    default: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23374151'/%3E%3Ctext x='100' y='50' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='12'%3EUI Element%3C/text%3E%3C/svg%3E`,
  },
} as const;

/**
 * Asset fallback manager
 */
export class AssetFallbackManager {
  private config: FallbackConfig;
  private retryAttempts: Map<string, number> = new Map();
  private failedAssets: Set<string> = new Set();

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
  }

  /**
   * Get fallback asset for a given category and name
   */
  getFallbackAsset(category: keyof AssetRegistry, name: string): string {
    // Check for custom fallbacks first
    const customFallback = this.config.customFallbacks?.[category]?.[name];
    if (customFallback) {
      return customFallback;
    }

    // Use category-specific fallback
    const categoryFallbacks = FALLBACK_ASSETS[category];
    if (categoryFallbacks && name in categoryFallbacks) {
      return (categoryFallbacks as any)[name];
    }

    // Use default fallback for category
    if (categoryFallbacks && 'default' in categoryFallbacks) {
      return (categoryFallbacks as any).default;
    }

    // Ultimate fallback - generic error image
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23374151'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23EF4444' font-family='monospace' font-size='12'%3E❌%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Check if an asset should be retried
   */
  shouldRetry(assetPath: string): boolean {
    const attempts = this.retryAttempts.get(assetPath) || 0;
    return attempts < this.config.maxRetries && !this.failedAssets.has(assetPath);
  }

  /**
   * Record a retry attempt for an asset
   */
  recordRetryAttempt(assetPath: string): void {
    const attempts = this.retryAttempts.get(assetPath) || 0;
    this.retryAttempts.set(assetPath, attempts + 1);
  }

  /**
   * Mark an asset as permanently failed
   */
  markAsFailed(assetPath: string): void {
    this.failedAssets.add(assetPath);
  }

  /**
   * Reset retry state for an asset
   */
  resetAsset(assetPath: string): void {
    this.retryAttempts.delete(assetPath);
    this.failedAssets.delete(assetPath);
  }

  /**
   * Get retry delay with exponential backoff
   */
  getRetryDelay(assetPath: string): number {
    const attempts = this.retryAttempts.get(assetPath) || 0;
    return this.config.retryDelay * Math.pow(2, attempts);
  }

  /**
   * Attempt to load an asset with retry logic
   */
  async loadAssetWithRetry(assetPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const attemptLoad = () => {
        const img = new Image();
        
        img.onload = () => {
          // Success - reset retry state
          this.resetAsset(assetPath);
          resolve(assetPath);
        };
        
        img.onerror = () => {
          if (this.shouldRetry(assetPath)) {
            this.recordRetryAttempt(assetPath);
            const delay = this.getRetryDelay(assetPath);
            
            console.warn(`Asset load failed, retrying in ${delay}ms: ${assetPath}`);
            
            setTimeout(attemptLoad, delay);
          } else {
            this.markAsFailed(assetPath);
            reject(new Error(`Failed to load asset after ${this.config.maxRetries} attempts: ${assetPath}`));
          }
        };
        
        img.src = assetPath;
      };
      
      attemptLoad();
    });
  }

  /**
   * Get progressive fallbacks for an asset
   */
  getProgressiveFallbacks(category: keyof AssetRegistry, name: string): string[] {
    if (!this.config.useProgressiveFallbacks) {
      return [this.getFallbackAsset(category, name)];
    }

    const fallbacks: string[] = [];
    
    // 1. Category-specific named fallback
    const categoryFallbacks = FALLBACK_ASSETS[category];
    if (categoryFallbacks && name in categoryFallbacks) {
      fallbacks.push((categoryFallbacks as any)[name]);
    }
    
    // 2. Category default fallback
    if (categoryFallbacks && 'default' in categoryFallbacks) {
      fallbacks.push((categoryFallbacks as any).default);
    }
    
    // 3. Ultimate fallback
    fallbacks.push(this.getFallbackAsset(category, name));
    
    return fallbacks;
  }
}

/**
 * Global fallback manager instance
 */
export const globalFallbackManager = new AssetFallbackManager();

/**
 * Utility function to get fallback asset
 */
export function getFallbackAsset(category: keyof AssetRegistry, name: string): string {
  return globalFallbackManager.getFallbackAsset(category, name);
}

/**
 * Utility function to load asset with retry
 */
export function loadAssetWithRetry(assetPath: string): Promise<string> {
  return globalFallbackManager.loadAssetWithRetry(assetPath);
}