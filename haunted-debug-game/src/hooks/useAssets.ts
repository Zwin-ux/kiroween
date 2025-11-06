/**
 * useAssets Hook - React integration for asset management
 * 
 * Provides component-level access to the centralized asset registry
 * with metadata lookup, preloading capabilities, and type safety.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { 
  assets, 
  assetMetadata, 
  AssetCategory, 
  AssetRegistry, 
  AssetWithMetadata,
  getAssetWithMetadata,
  getAssetsByCategory 
} from '@/lib/assets';
import { validateAssetRuntime } from '@/lib/assetValidator';
import { useAssetCache } from '@/lib/assetCache';
import { 
  globalPreloader, 
  AssetPriority, 
  PreloadProgress,
  useAssetPreloader 
} from '@/lib/assetPreloader';

/**
 * Return type for the useAssets hook
 */
export interface UseAssetsReturn {
  getAsset: (category: keyof AssetRegistry, name: string) => string | undefined;
  getAssetWithMetadata: (category: keyof AssetRegistry, name: string) => AssetWithMetadata | undefined;
  getAssetsByCategory: (category: AssetCategory) => AssetWithMetadata[];
  preloadAssets: (assetPaths: string[], priority?: AssetPriority) => Promise<void>;
  preloadByCategory: (category: AssetCategory, priority?: AssetPriority) => Promise<void>;
  preloadCritical: () => Promise<void>;
  isAssetLoaded: (assetPath: string) => boolean;
  preloadProgress: PreloadProgress | null;
}

/**
 * Custom hook for asset management and consumption
 * 
 * Provides type-safe access to game assets with metadata lookup,
 * preloading capabilities, and performance optimization.
 */
export function useAssets(): UseAssetsReturn {
  const { preloader, preloadCritical, preloadByCategory: preloadByCat } = useAssetPreloader();
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress | null>(null);
  const { getCachedUrl, preloadAsset } = useAssetCache();

  // Set up progress tracking
  useEffect(() => {
    const unsubscribe = preloader.onProgress(setPreloadProgress);
    return unsubscribe;
  }, [preloader]);

  /**
   * Get asset path by category and name with caching optimization
   */
  const getAsset = useCallback((category: keyof AssetRegistry, name: string): string | undefined => {
    // Runtime validation in development
    if (process.env.NODE_ENV === 'development') {
      validateAssetRuntime(category, name);
    }
    
    const categoryAssets = assets[category];
    if (categoryAssets && name in categoryAssets) {
      const asset = (categoryAssets as any)[name];
      const assetUrl = asset as string;
      
      // Return cached URL for optimized loading
      return getCachedUrl(assetUrl);
    }
    return undefined;
  }, [getCachedUrl]);

  /**
   * Get asset with metadata by category and name
   */
  const getAssetWithMetadataCallback = useCallback((category: keyof AssetRegistry, name: string): AssetWithMetadata | undefined => {
    return getAssetWithMetadata(category, name);
  }, []);

  /**
   * Get all assets by category with metadata
   */
  const getAssetsByCategoryCallback = useCallback((category: AssetCategory): AssetWithMetadata[] => {
    return getAssetsByCategory(category);
  }, []);

  /**
   * Preload assets for performance optimization
   * 
   * @param assetPaths Array of asset paths to preload
   * @param priority Priority level for loading order
   * @returns Promise that resolves when preloading is queued
   */
  const preloadAssets = useCallback(async (assetPaths: string[], priority: AssetPriority = AssetPriority.Normal): Promise<void> => {
    await preloader.preloadAssets(assetPaths, priority);
  }, [preloader]);

  /**
   * Preload assets by category
   */
  const preloadByCategory = useCallback(async (category: AssetCategory, priority: AssetPriority = AssetPriority.Normal): Promise<void> => {
    await preloadByCat(category, priority);
  }, [preloadByCat]);

  /**
   * Check if an asset is loaded
   */
  const isAssetLoaded = useCallback((assetPath: string): boolean => {
    return preloader.isAssetLoaded(assetPath);
  }, [preloader]);

  return {
    getAsset,
    getAssetWithMetadata: getAssetWithMetadataCallback,
    getAssetsByCategory: getAssetsByCategoryCallback,
    preloadAssets,
    preloadByCategory,
    preloadCritical,
    isAssetLoaded,
    preloadProgress,
  };
}

/**
 * Utility function to preload critical assets
 * Can be called outside of React components for early preloading
 */
export async function preloadCriticalAssets(): Promise<void> {
  const criticalAssets = [
    assets.rooms.compiler,
    assets.icons.asset,
    assets.icons.ghost,
  ];

  const loadPromises = criticalAssets.map(assetPath => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`Failed to preload critical asset: ${assetPath}`);
        resolve();
      };
      img.src = assetPath;
    });
  });

  await Promise.all(loadPromises);
}