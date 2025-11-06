/**
 * ThemedAssetLayering - System for layering themed assets with atmospheric effects
 */

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { assets, preloadImage } from '@/lib/assets';

interface AssetLayer {
  id: string;
  assetPath: string;
  zIndex: number;
  opacity: number;
  blendMode?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  animation?: 'none' | 'pulse' | 'glow' | 'float' | 'rotate';
  condition?: (roomId: string, stabilityLevel: number) => boolean;
  performance?: 'low' | 'medium' | 'high'; // Performance impact level
}

interface ThemedAssetLayeringProps {
  roomId: string;
  stabilityLevel?: number;
  intensity?: number;
  performanceMode?: 'low' | 'medium' | 'high';
  className?: string;
  children?: React.ReactNode;
}

// Performance-aware asset layer configurations
const ASSET_LAYER_CONFIGS: Record<string, AssetLayer[]> = {
  'boot-sector': [
    {
      id: 'background-overlay',
      assetPath: assets.ui.background,
      zIndex: 1,
      opacity: 0.3,
      blendMode: 'overlay',
      animation: 'none',
      performance: 'low'
    },
    {
      id: 'pumpkin-glow',
      assetPath: assets.entities.pumpkin,
      zIndex: 15,
      opacity: 0.8,
      position: { x: 10, y: 70 },
      size: { width: 64, height: 64 },
      animation: 'glow',
      performance: 'medium',
      condition: (roomId, stability) => stability < 70
    }
  ],
  'dependency-crypt': [
    {
      id: 'atmospheric-base',
      assetPath: assets.ui.background,
      zIndex: 2,
      opacity: 0.4,
      blendMode: 'multiply',
      animation: 'pulse',
      performance: 'low'
    },
    {
      id: 'terminal-accent',
      assetPath: assets.entities.terminal,
      zIndex: 12,
      opacity: 0.6,
      position: { x: 80, y: 20 },
      size: { width: 120, height: 80 },
      animation: 'glow',
      performance: 'medium'
    },
    {
      id: 'candy-scatter',
      assetPath: assets.entities.candy,
      zIndex: 8,
      opacity: 0.7,
      position: { x: 60, y: 80 },
      size: { width: 32, height: 32 },
      animation: 'float',
      performance: 'high'
    }
  ],
  'ghost-memory-heap': [
    {
      id: 'memory-visualization',
      assetPath: assets.ui.palette,
      zIndex: 3,
      opacity: 0.2,
      blendMode: 'screen',
      animation: 'pulse',
      performance: 'medium'
    },
    {
      id: 'floating-candy',
      assetPath: assets.entities.candy,
      zIndex: 18,
      opacity: 0.9,
      position: { x: 30, y: 40 },
      size: { width: 48, height: 48 },
      animation: 'float',
      performance: 'high',
      condition: (roomId, stability) => stability > 30
    }
  ],
  'possessed-compiler': [
    {
      id: 'compiler-corruption',
      assetPath: assets.ui.background,
      zIndex: 4,
      opacity: 0.5,
      blendMode: 'difference',
      animation: 'pulse',
      performance: 'medium',
      condition: (roomId, stability) => stability < 50
    },
    {
      id: 'warning-pumpkin',
      assetPath: assets.entities.pumpkin,
      zIndex: 20,
      opacity: 1.0,
      position: { x: 70, y: 30 },
      size: { width: 80, height: 80 },
      animation: 'glow',
      performance: 'medium'
    }
  ],
  'ethics-tribunal': [
    {
      id: 'judgment-overlay',
      assetPath: assets.ui.palette,
      zIndex: 5,
      opacity: 0.3,
      blendMode: 'overlay',
      animation: 'none',
      performance: 'low'
    },
    {
      id: 'balance-candy',
      assetPath: assets.entities.candy,
      zIndex: 16,
      opacity: 0.8,
      position: { x: 25, y: 60 },
      size: { width: 40, height: 40 },
      animation: 'pulse',
      performance: 'medium'
    }
  ],
  'final-merge': [
    {
      id: 'convergence-background',
      assetPath: assets.ui.background,
      zIndex: 6,
      opacity: 0.6,
      blendMode: 'luminosity',
      animation: 'rotate',
      performance: 'high'
    },
    {
      id: 'celebration-pumpkin',
      assetPath: assets.entities.pumpkin,
      zIndex: 22,
      opacity: 1.0,
      position: { x: 20, y: 50 },
      size: { width: 96, height: 96 },
      animation: 'glow',
      performance: 'medium'
    },
    {
      id: 'victory-candy',
      assetPath: assets.entities.candy,
      zIndex: 24,
      opacity: 1.0,
      position: { x: 80, y: 50 },
      size: { width: 96, height: 96 },
      animation: 'float',
      performance: 'high'
    }
  ]
};

// Performance thresholds for different modes
const PERFORMANCE_LIMITS = {
  low: { maxLayers: 2, allowAnimations: false, allowBlendModes: false },
  medium: { maxLayers: 4, allowAnimations: true, allowBlendModes: true },
  high: { maxLayers: 8, allowAnimations: true, allowBlendModes: true }
};

export function ThemedAssetLayering({
  roomId,
  stabilityLevel = 50,
  intensity = 1.0,
  performanceMode = 'medium',
  className,
  children
}: ThemedAssetLayeringProps) {
  const [loadedAssets, setLoadedAssets] = useState<Set<string>>(new Set());
  const [failedAssets, setFailedAssets] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Get filtered layers based on performance mode and conditions
  const activeLayers = useMemo(() => {
    const roomLayers = ASSET_LAYER_CONFIGS[roomId] || [];
    const limits = PERFORMANCE_LIMITS[performanceMode];
    
    return roomLayers
      .filter(layer => {
        // Check performance level
        const performancePriority = { low: 0, medium: 1, high: 2 };
        const modePriority = performancePriority[performanceMode];
        const layerPriority = performancePriority[layer.performance || 'medium'];
        
        if (layerPriority > modePriority) return false;
        
        // Check conditions
        if (layer.condition && !layer.condition(roomId, stabilityLevel)) return false;
        
        return true;
      })
      .slice(0, limits.maxLayers)
      .map(layer => ({
        ...layer,
        // Disable animations/blend modes based on performance
        animation: limits.allowAnimations ? layer.animation : 'none',
        blendMode: limits.allowBlendModes ? layer.blendMode : undefined,
        // Adjust opacity based on intensity
        opacity: layer.opacity * intensity
      }));
  }, [roomId, stabilityLevel, intensity, performanceMode]);

  // Preload assets
  useEffect(() => {
    const preloadAssets = async () => {
      setIsLoading(true);
      const loaded = new Set<string>();
      const failed = new Set<string>();
      
      const preloadPromises = activeLayers.map(async (layer) => {
        try {
          await preloadImage(layer.assetPath);
          loaded.add(layer.id);
        } catch (error) {
          console.warn(`Failed to load asset for layer ${layer.id}:`, error);
          failed.add(layer.id);
        }
      });
      
      await Promise.all(preloadPromises);
      
      setLoadedAssets(loaded);
      setFailedAssets(failed);
      setIsLoading(false);
    };
    
    if (activeLayers.length > 0) {
      preloadAssets();
    } else {
      setIsLoading(false);
    }
  }, [activeLayers]);

  const animationClasses = {
    none: '',
    pulse: 'animate-pulse',
    glow: 'animate-pulse',
    float: 'animate-bounce',
    rotate: 'animate-spin'
  };

  const animationDurations = {
    none: '',
    pulse: 'animation-duration-[3s]',
    glow: 'animation-duration-[2s]',
    float: 'animation-duration-[4s]',
    rotate: 'animation-duration-[20s]'
  };

  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Render asset layers */}
      {activeLayers.map((layer) => {
        if (failedAssets.has(layer.id)) return null;
        
        const isPositioned = layer.position && layer.size;
        
        return (
          <div
            key={layer.id}
            className={cn(
              "absolute pointer-events-none",
              isPositioned ? '' : 'inset-0',
              layer.animation ? animationClasses[layer.animation] : '',
              layer.animation ? animationDurations[layer.animation] : ''
            )}
            style={{
              zIndex: layer.zIndex,
              opacity: layer.opacity,
              mixBlendMode: layer.blendMode as any,
              ...(isPositioned ? {
                left: `${layer.position!.x}%`,
                top: `${layer.position!.y}%`,
                width: `${layer.size!.width}px`,
                height: `${layer.size!.height}px`,
                transform: 'translate(-50%, -50%)'
              } : {})
            }}
          >
            <img
              src={layer.assetPath}
              alt={`Asset layer ${layer.id}`}
              className={cn(
                "w-full h-full object-contain",
                !isPositioned && "object-cover"
              )}
              style={{
                imageRendering: 'pixelated',
                filter: layer.animation === 'glow' 
                  ? `drop-shadow(0 0 10px currentColor) brightness(${1 + (layer.opacity * 0.3)})` 
                  : 'none'
              }}
            />
          </div>
        );
      })}
      
      {/* Content layer */}
      <div className="relative" style={{ zIndex: 50 }}>
        {children}
      </div>
      
      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs font-mono text-white/50 bg-black/50 px-2 py-1 rounded">
          Layers: {activeLayers.length} | Mode: {performanceMode}
        </div>
      )}
    </div>
  );
}

/**
 * Asset Layer Performance Monitor
 */
interface AssetLayerPerformanceProps {
  roomId: string;
  onPerformanceChange?: (mode: 'low' | 'medium' | 'high') => void;
}

export function AssetLayerPerformance({ 
  roomId, 
  onPerformanceChange 
}: AssetLayerPerformanceProps) {
  const [performanceStats, setPerformanceStats] = useState({
    frameRate: 60,
    memoryUsage: 0,
    layerCount: 0
  });
  
  const [recommendedMode, setRecommendedMode] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    // Simulate performance monitoring
    const monitor = setInterval(() => {
      // In a real implementation, this would measure actual performance
      const mockFrameRate = 60 - Math.random() * 20;
      const mockMemoryUsage = Math.random() * 100;
      
      setPerformanceStats(prev => ({
        ...prev,
        frameRate: mockFrameRate,
        memoryUsage: mockMemoryUsage
      }));
      
      // Recommend performance mode based on stats
      let newMode: 'low' | 'medium' | 'high' = 'medium';
      if (mockFrameRate < 30 || mockMemoryUsage > 80) {
        newMode = 'low';
      } else if (mockFrameRate > 50 && mockMemoryUsage < 40) {
        newMode = 'high';
      }
      
      if (newMode !== recommendedMode) {
        setRecommendedMode(newMode);
        onPerformanceChange?.(newMode);
      }
    }, 2000);
    
    return () => clearInterval(monitor);
  }, [recommendedMode, onPerformanceChange]);

  return (
    <div className="asset-performance-monitor">
      <div className="text-xs font-mono text-gray-400">
        FPS: {performanceStats.frameRate.toFixed(0)} | 
        Memory: {performanceStats.memoryUsage.toFixed(0)}% | 
        Recommended: {recommendedMode}
      </div>
    </div>
  );
}

/**
 * Hook for managing themed asset layers
 */
export function useThemedAssetLayers(roomId: string) {
  const [performanceMode, setPerformanceMode] = useState<'low' | 'medium' | 'high'>('medium');
  const [intensity, setIntensity] = useState(1.0);
  const [layersEnabled, setLayersEnabled] = useState(true);

  const toggleLayers = () => setLayersEnabled(prev => !prev);
  
  const adjustIntensity = (delta: number) => {
    setIntensity(prev => Math.max(0, Math.min(1, prev + delta)));
  };

  const optimizePerformance = () => {
    setPerformanceMode('low');
    setIntensity(0.5);
  };

  const maximizeQuality = () => {
    setPerformanceMode('high');
    setIntensity(1.0);
  };

  return {
    performanceMode,
    setPerformanceMode,
    intensity,
    setIntensity,
    layersEnabled,
    setLayersEnabled,
    toggleLayers,
    adjustIntensity,
    optimizePerformance,
    maximizeQuality
  };
}