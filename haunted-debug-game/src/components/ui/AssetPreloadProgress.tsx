/**
 * AssetPreloadProgress Component
 * 
 * Displays asset loading progress with visual feedback
 * for development and user experience enhancement.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAssets } from "@/hooks/useAssets";
import { Progress } from "./progress";

/**
 * Props for the AssetPreloadProgress component
 */
export interface AssetPreloadProgressProps {
  /** Whether to show detailed loading information */
  showDetails?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Whether to auto-hide when loading is complete */
  autoHide?: boolean;
  /** Callback when loading is complete */
  onComplete?: () => void;
}

/**
 * Component for displaying asset preloading progress
 */
export const AssetPreloadProgress: React.FC<AssetPreloadProgressProps> = ({
  showDetails = false,
  className,
  autoHide = true,
  onComplete,
}) => {
  const { preloadProgress } = useAssets();
  const [isVisible, setIsVisible] = React.useState(true);

  // Handle completion
  React.useEffect(() => {
    if (preloadProgress && preloadProgress.percentage === 100) {
      onComplete?.();
      if (autoHide) {
        const timer = setTimeout(() => setIsVisible(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [preloadProgress, onComplete, autoHide]);

  // Don't render if no progress data or hidden
  if (!preloadProgress || !isVisible) {
    return null;
  }

  const { total, loaded, failed, percentage, currentAsset } = preloadProgress;

  return (
    <div className={cn(
      "bg-gray-900/95 border border-gray-700 rounded-lg p-4 backdrop-blur-sm",
      "shadow-lg font-mono text-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 font-medium">Loading Assets</span>
        <span className="text-green-400 font-bold">{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <Progress 
        value={percentage} 
        className="mb-2 h-2"
      />

      {/* Details */}
      {showDetails && (
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Loaded:</span>
            <span className="text-green-400">{loaded}/{total}</span>
          </div>
          
          {failed > 0 && (
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-red-400">{failed}</span>
            </div>
          )}
          
          {currentAsset && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-500">Loading:</div>
              <div className="text-gray-300 truncate" title={currentAsset}>
                {currentAsset.split('/').pop()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simple status for non-detailed view */}
      {!showDetails && currentAsset && (
        <div className="text-xs text-gray-400 truncate">
          {currentAsset.split('/').pop()}
        </div>
      )}
    </div>
  );
};

/**
 * Hook for managing asset preloading with progress
 */
export function useAssetPreloading() {
  const { preloadCritical, preloadByCategory, preloadProgress } = useAssets();
  const [isPreloading, setIsPreloading] = React.useState(false);

  const startPreloading = React.useCallback(async () => {
    setIsPreloading(true);
    try {
      await preloadCritical();
    } finally {
      setIsPreloading(false);
    }
  }, [preloadCritical]);

  return {
    startPreloading,
    isPreloading,
    progress: preloadProgress,
    preloadByCategory,
  };
}

/**
 * Higher-order component for wrapping components with asset preloading
 */
export function withAssetPreloading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    showProgress?: boolean;
    preloadCritical?: boolean;
    preloadCategories?: string[];
  } = {}
) {
  const { showProgress = true, preloadCritical = true } = options;

  const WithAssetPreloadingComponent = (props: P) => {
    const { startPreloading, isPreloading, progress } = useAssetPreloading();
    const [assetsReady, setAssetsReady] = React.useState(false);

    React.useEffect(() => {
      if (preloadCritical) {
        startPreloading();
      }
    }, [startPreloading]);

    React.useEffect(() => {
      if (progress && progress.percentage === 100) {
        setAssetsReady(true);
      }
    }, [progress]);

    if (isPreloading && showProgress) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <AssetPreloadProgress 
            showDetails={true}
            className="max-w-sm w-full mx-4"
          />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAssetPreloadingComponent.displayName = `withAssetPreloading(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithAssetPreloadingComponent;
}