/**
 * GameAsset Component - Reusable component for rendering game assets
 * 
 * Provides error handling, responsive behavior, and proper styling
 * for all game assets with fallback support and transparency maintenance.
 */

import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAssets } from "@/hooks/useAssets";
import { AssetCategory, AssetRegistry } from "@/lib/assets";
import { globalFallbackManager, getFallbackAsset } from "@/lib/assetFallbacks";
import { AssetErrorBoundary, useAssetErrorHandler } from "./AssetErrorBoundary";
import { useAssetDebugging } from "@/lib/assetDebugger";
import { useAssetPerformanceMonitor } from "@/lib/assetPerformanceMonitor";

/**
 * Props interface for the GameAsset component
 */
export interface GameAssetProps {
  /** Asset category (rooms, icons, entities, ui) */
  category: keyof AssetRegistry;
  /** Asset name within the category */
  name: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to prioritize loading this asset */
  priority?: boolean;
  /** Callback when asset loads successfully */
  onLoad?: () => void;
  /** Callback when asset fails to load */
  onError?: (error: Error) => void;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom fallback image source */
  fallbackSrc?: string;
  /** Whether to use progressive fallbacks */
  useProgressiveFallbacks?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Fallback assets for each category when primary assets fail
 */
const FALLBACK_ASSETS = {
  rooms: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23111827'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='16'%3ERoom Loading...%3C/text%3E%3C/svg%3E",
  icons: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21,15 16,10 5,21'/%3E%3C/svg%3E",
  entities: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Ccircle cx='24' cy='24' r='20'/%3E%3Cpath d='M16 16l16 16M32 16l-16 16'/%3E%3C/svg%3E",
  ui: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23374151'/%3E%3Ctext x='100' y='50' text-anchor='middle' fill='%236B7280' font-family='monospace' font-size='12'%3EUI Element%3C/text%3E%3C/svg%3E",
};

/**
 * GameAsset component for rendering game assets with error handling and responsive behavior
 */
export const GameAsset = React.forwardRef<HTMLImageElement, GameAssetProps>(
  ({ 
    category, 
    name, 
    alt, 
    className, 
    priority = false, 
    onLoad, 
    onError, 
    showLoading = true,
    fallbackSrc,
    useProgressiveFallbacks = true,
    maxRetries = 3,
    ...props 
  }, ref) => {
    const { getAsset, getAssetWithMetadata } = useAssets();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSrc, setCurrentSrc] = useState<string | undefined>();
    const [fallbackIndex, setFallbackIndex] = useState(0);
    const retryCountRef = useRef(0);
    const { error, handleError, retry, hasError } = useAssetErrorHandler();
    const { recordLoadStart, recordLoadSuccess, recordLoadFailure, recordFallbackUsage } = useAssetDebugging();
    const performanceMonitor = useAssetPerformanceMonitor();

    // Get asset path and metadata
    const assetPath = getAsset(category, name);
    const assetWithMetadata = getAssetWithMetadata(category, name);
    
    // Get progressive fallbacks
    const progressiveFallbacks = React.useMemo(() => {
      if (fallbackSrc) {
        return [fallbackSrc];
      }
      
      if (useProgressiveFallbacks) {
        return globalFallbackManager.getProgressiveFallbacks(category, name);
      }
      
      return [getFallbackAsset(category, name)];
    }, [category, name, fallbackSrc, useProgressiveFallbacks]);
    
    // Determine the source to use
    React.useEffect(() => {
      if (hasError && fallbackIndex < progressiveFallbacks.length) {
        const fallbackSrc = progressiveFallbacks[fallbackIndex];
        setCurrentSrc(fallbackSrc);
        recordLoadStart(fallbackSrc);
      } else if (!hasError) {
        setCurrentSrc(assetPath);
        setFallbackIndex(0);
        retryCountRef.current = 0;
        if (assetPath) {
          recordLoadStart(assetPath);
          performanceMonitor.recordLoadStart(assetPath, category, name);
        }
      }
    }, [assetPath, hasError, fallbackIndex, progressiveFallbacks, recordLoadStart]);

    // Handle successful load
    const handleLoad = useCallback(() => {
      setIsLoading(false);
      
      // Record successful load for debugging and performance monitoring
      if (currentSrc) {
        recordLoadSuccess(currentSrc);
        performanceMonitor.recordLoadSuccess(currentSrc, category, name, 0, fallbackIndex > 0);
      }
      
      // Reset error state on successful load
      if (hasError) {
        retry();
      }
      
      onLoad?.();
    }, [onLoad, hasError, retry, currentSrc, recordLoadSuccess]);

    // Handle load error with progressive fallbacks and retry logic
    const handleLoadError = useCallback(() => {
      setIsLoading(false);
      
      const errorMessage = `Failed to load asset: ${category}.${name}`;
      const assetError = new Error(errorMessage);
      
      // Try progressive fallbacks first
      if (fallbackIndex < progressiveFallbacks.length - 1) {
        console.warn(`${errorMessage}, trying fallback ${fallbackIndex + 1}`);
        recordFallbackUsage(currentSrc || assetPath || '');
        setFallbackIndex(prev => prev + 1);
        return;
      }
      
      // If we've exhausted fallbacks, try retrying the original asset
      if (retryCountRef.current < maxRetries && !hasError) {
        retryCountRef.current += 1;
        const delay = globalFallbackManager.getRetryDelay(assetPath || '');
        
        console.warn(`${errorMessage}, retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          setCurrentSrc(undefined);
          setTimeout(() => setCurrentSrc(assetPath), 50);
        }, delay);
        
        return;
      }
      
      // Final fallback - mark as error and use last fallback
      const failedUrl = currentSrc || assetPath || '';
      recordLoadFailure(failedUrl, assetError);
      performanceMonitor.recordLoadFailure(failedUrl, category, name, assetError.message);
      handleError(assetError);
      onError?.(assetError);
      
      if (assetPath) {
        globalFallbackManager.markAsFailed(assetPath);
      }
    }, [category, name, fallbackIndex, progressiveFallbacks, maxRetries, hasError, handleError, onError, assetPath]);

    // Get category-specific styling
    const getCategoryStyles = (cat: keyof AssetRegistry) => {
      switch (cat) {
        case 'rooms':
          return 'w-full h-full object-cover';
        case 'icons':
          return 'w-6 h-6 object-contain';
        case 'entities':
          return 'object-contain max-h-[90vh]';
        case 'ui':
          return 'object-contain max-h-[90vh]';
        default:
          return 'object-contain';
      }
    };

    // Get z-index from metadata
    const zIndexStyle = assetWithMetadata?.metadata.zIndex !== undefined 
      ? { zIndex: assetWithMetadata.metadata.zIndex }
      : {};

    if (!currentSrc) {
      return (
        <div 
          className={cn(
            "flex items-center justify-center bg-gray-800 text-gray-400 text-sm font-mono",
            getCategoryStyles(category),
            className
          )}
          style={zIndexStyle}
        >
          Asset not found: {category}.{name}
        </div>
      );
    }

    return (
      <div className="relative inline-block" style={zIndexStyle}>
        {/* Loading state */}
        {isLoading && showLoading && (
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gray-900/50 text-gray-400 text-xs font-mono",
              getCategoryStyles(category)
            )}
          >
            Loading...
          </div>
        )}
        
        {/* Main image */}
        <img
          ref={ref}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleLoadError}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            // Base styles for all assets
            "transition-opacity duration-200",
            // Category-specific styles
            getCategoryStyles(category),
            // Transparency maintenance for icons and entities
            (category === 'icons' || category === 'entities') && "bg-transparent",
            // Loading state opacity
            isLoading && "opacity-50",
            // Error state styling
            hasError && "opacity-75 grayscale",
            // Fallback state styling
            fallbackIndex > 0 && "border border-yellow-600 border-opacity-50",
            // Custom classes
            className
          )}
          style={{
            // Maintain aspect ratio and prevent distortion
            imageRendering: category === 'icons' ? 'crisp-edges' : 'auto',
            ...zIndexStyle,
          }}
          {...props}
        />
        
        {/* Error and fallback indicators */}
        {hasError && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full opacity-75" 
               title="Asset failed to load" />
        )}
        {fallbackIndex > 0 && !hasError && (
          <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-500 rounded-full opacity-75" 
               title={`Using fallback ${fallbackIndex}`} />
        )}
        {retryCountRef.current > 0 && !hasError && (
          <div className="absolute bottom-1 right-1 text-xs text-yellow-400 opacity-75" 
               title={`Retry attempt ${retryCountRef.current}`}>
            R{retryCountRef.current}
          </div>
        )}
      </div>
    );
  }
);

GameAsset.displayName = "GameAsset";

/**
 * Utility component for room backgrounds with proper styling and error handling
 */
export const RoomBackground: React.FC<{
  roomName: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ roomName, className, children }) => {
  return (
    <AssetErrorBoundary
      onError={(error) => console.error(`Room background error for ${roomName}:`, error)}
      maxRetries={2}
    >
      <div className={cn("relative w-full h-full", className)}>
        <GameAsset
          category="rooms"
          name={roomName}
          alt={`${roomName} room background`}
          className="absolute inset-0 w-full h-full object-cover"
          priority={true}
          useProgressiveFallbacks={true}
          maxRetries={2}
        />
        {children && (
          <div className="relative z-10">
            {children}
          </div>
        )}
      </div>
    </AssetErrorBoundary>
  );
};

/**
 * Utility component for entity assets with consistent styling and error handling
 */
export const EntityAsset: React.FC<{
  entityName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ entityName, className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <AssetErrorBoundary maxRetries={1}>
      <GameAsset
        category="entities"
        name={entityName}
        alt={`${entityName} entity`}
        className={cn(
          sizeClasses[size],
          "drop-shadow-lg",
          className
        )}
        useProgressiveFallbacks={true}
        maxRetries={1}
      />
    </AssetErrorBoundary>
  );
};

/**
 * Utility component for UI icons with consistent styling and error handling
 */
export const IconAsset: React.FC<{
  iconName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ iconName, className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <AssetErrorBoundary maxRetries={1}>
      <GameAsset
        category="icons"
        name={iconName}
        alt={`${iconName} icon`}
        className={cn(
          sizeClasses[size],
          className
        )}
        useProgressiveFallbacks={true}
        maxRetries={1}
      />
    </AssetErrorBoundary>
  );
};