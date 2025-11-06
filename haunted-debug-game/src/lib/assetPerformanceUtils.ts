/**
 * Asset Performance Utilities
 * Helper functions for optimizing asset rendering performance
 */

import { cn } from '@/lib/utils';

/**
 * Performance mode configuration
 */
export type PerformanceMode = 'low' | 'medium' | 'high';

/**
 * Asset loading state
 */
export type AssetLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Get optimized CSS classes for asset containers based on performance mode
 */
export function getAssetContainerClasses(
  performanceMode: PerformanceMode = 'medium',
  hasBackground: boolean = false,
  loadingState: AssetLoadingState = 'idle'
): string {
  const baseClasses = ['asset-container'];
  
  // Add performance-specific classes
  switch (performanceMode) {
    case 'high':
      baseClasses.push('gpu-accelerated', 'contain-strict');
      break;
    case 'medium':
      baseClasses.push('gpu-accelerated', 'contain-layout');
      break;
    case 'low':
      baseClasses.push('contain-paint', 'performance-low');
      break;
  }
  
  // Add background-specific classes
  if (hasBackground) {
    baseClasses.push('has-background');
  }
  
  // Add loading state classes
  switch (loadingState) {
    case 'loading':
      baseClasses.push('asset-skeleton');
      break;
    case 'error':
      baseClasses.push('asset-error-state');
      break;
    case 'loaded':
      baseClasses.push('asset-fade-in');
      break;
  }
  
  return cn(...baseClasses);
}

/**
 * Get optimized CSS classes for room atmosphere components
 */
export function getRoomAtmosphereClasses(
  roomId: string,
  hasBackground: boolean = false,
  performanceMode: PerformanceMode = 'medium'
): string {
  const baseClasses = [
    'spectral-panel',
    'vignette-lighting',
    'crt-effect',
    `room-${getRoomCssClass(roomId)}`
  ];
  
  if (hasBackground) {
    baseClasses.push('has-background');
  }
  
  // Add performance optimizations
  switch (performanceMode) {
    case 'high':
      baseClasses.push('gpu-accelerated', 'contain-layout');
      break;
    case 'medium':
      baseClasses.push('gpu-accelerated');
      break;
    case 'low':
      baseClasses.push('performance-low', 'contain-paint');
      break;
  }
  
  return cn(...baseClasses);
}

/**
 * Get optimized CSS classes for ghost renderer components
 */
export function getGhostRendererClasses(
  isActive: boolean = false,
  performanceMode: PerformanceMode = 'medium',
  loadingState: AssetLoadingState = 'idle'
): string {
  const baseClasses = ['spectral-panel', 'breathing-shadow'];
  
  if (isActive) {
    baseClasses.push('focus-primary', 'glow-spectral');
  } else {
    baseClasses.push('focus-secondary');
  }
  
  // Add performance optimizations
  switch (performanceMode) {
    case 'high':
      baseClasses.push('gpu-accelerated', 'contain-strict');
      break;
    case 'medium':
      baseClasses.push('gpu-accelerated', 'contain-layout');
      break;
    case 'low':
      baseClasses.push('performance-low', 'contain-paint');
      break;
  }
  
  // Add loading state
  switch (loadingState) {
    case 'loading':
      baseClasses.push('asset-skeleton');
      break;
    case 'error':
      baseClasses.push('state-danger');
      break;
  }
  
  return cn(...baseClasses);
}

/**
 * Get optimized CSS classes for seasonal decorations
 */
export function getSeasonalDecorationClasses(
  performanceMode: PerformanceMode = 'medium'
): string {
  const baseClasses = ['seasonal-decoration-container'];
  
  // Reduce decoration complexity on lower performance modes
  switch (performanceMode) {
    case 'high':
      baseClasses.push('asset-gpu-layer');
      break;
    case 'low':
      baseClasses.push('asset-memory-optimized');
      // Reduce animation complexity
      baseClasses.push('reduced-animations');
      break;
  }
  
  return cn(...baseClasses);
}

/**
 * Get optimized CSS classes for terminal integration
 */
export function getTerminalIntegrationClasses(
  performanceMode: PerformanceMode = 'medium'
): string {
  const baseClasses = ['terminal-integration-container'];
  
  switch (performanceMode) {
    case 'high':
      baseClasses.push('asset-repaint-optimized');
      break;
    case 'low':
      baseClasses.push('asset-layout-stable');
      break;
  }
  
  return cn(...baseClasses);
}

/**
 * Map room IDs to CSS class names
 */
function getRoomCssClass(roomId: string): string {
  const roomMapping: Record<string, string> = {
    'boot-sector': 'compiler',
    'dependency-crypt': 'crypt',
    'ghost-memory-heap': 'heap',
    'possessed-compiler': 'tower',
    'ethics-tribunal': 'graveyard',
    'final-merge': 'carnival'
  };
  
  return roomMapping[roomId] || 'compiler';
}

/**
 * Get asset layer z-index based on layer type
 */
export function getAssetLayerZIndex(layerType: string): number {
  const layerMapping: Record<string, number> = {
    'background': 1,
    'room': 5,
    'decorations': 10,
    'entities': 15,
    'effects': 20,
    'ui': 25,
    'overlay': 30
  };
  
  return layerMapping[layerType] || 0;
}

/**
 * Create CSS custom properties for asset performance
 */
export function createAssetPerformanceProps(
  intensity: number = 1,
  stabilityLevel: number = 50,
  performanceMode: PerformanceMode = 'medium'
): React.CSSProperties {
  const props: React.CSSProperties & Record<string, any> = {
    '--asset-intensity': intensity,
    '--stability-factor': stabilityLevel / 100,
    '--performance-mode': performanceMode
  };
  
  // Adjust animation duration based on performance mode
  switch (performanceMode) {
    case 'high':
      props['--animation-multiplier'] = 1;
      break;
    case 'medium':
      props['--animation-multiplier'] = 1.2;
      break;
    case 'low':
      props['--animation-multiplier'] = 1.5;
      break;
  }
  
  return props;
}

/**
 * Check if device supports high performance rendering
 */
export function getOptimalPerformanceMode(): PerformanceMode {
  if (typeof window === 'undefined') {
    return 'medium';
  }
  
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  if (isMobile) {
    return 'low';
  }
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return 'low';
  }
  
  // Check for hardware acceleration support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return 'low';
  }
  
  // Check memory (rough estimation)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) {
    return 'medium';
  }
  
  return 'high';
}

/**
 * Debounce function for performance-sensitive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance-sensitive operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Create intersection observer for lazy loading assets
 */
export function createAssetIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Preload critical assets with priority
 */
export async function preloadCriticalAssets(
  assetUrls: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const promises = assetUrls.map((url, index) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        if (onProgress) {
          onProgress(index + 1, assetUrls.length);
        }
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload asset: ${url}`);
        if (onProgress) {
          onProgress(index + 1, assetUrls.length);
        }
        resolve(); // Don't reject, just continue
      };
      
      img.src = url;
    });
  });
  
  await Promise.all(promises);
}