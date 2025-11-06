/**
 * SeasonalDecorations - Contextual pumpkin and candy decorations for rooms
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { assets, preloadImage } from '@/lib/assets';

interface SeasonalDecorationsProps {
  roomId: string;
  intensity?: number; // 0-1, affects decoration density
  interactive?: boolean; // Whether decorations can be clicked
  className?: string;
}

interface DecorationConfig {
  type: 'pumpkin' | 'candy';
  position: { x: number; y: number }; // Percentage positions
  size: 'small' | 'medium' | 'large';
  animation?: 'glow' | 'bounce' | 'pulse' | 'none';
  zIndex?: number;
  interactive?: boolean;
}

interface RoomDecorationConfig {
  decorations: DecorationConfig[];
  theme: 'spooky' | 'sweet' | 'mixed';
  maxDecorations: number;
}

// Room-specific decoration configurations
const ROOM_DECORATION_CONFIGS: Record<string, RoomDecorationConfig> = {
  'boot-sector': {
    theme: 'spooky',
    maxDecorations: 4,
    decorations: [
      {
        type: 'pumpkin',
        position: { x: 15, y: 75 },
        size: 'medium',
        animation: 'glow',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'pumpkin',
        position: { x: 85, y: 80 },
        size: 'small',
        animation: 'pulse',
        zIndex: 3
      },
      {
        type: 'candy',
        position: { x: 60, y: 85 },
        size: 'small',
        animation: 'bounce',
        zIndex: 4
      }
    ]
  },
  'dependency-crypt': {
    theme: 'spooky',
    maxDecorations: 6,
    decorations: [
      {
        type: 'pumpkin',
        position: { x: 25, y: 70 },
        size: 'large',
        animation: 'glow',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'pumpkin',
        position: { x: 75, y: 75 },
        size: 'medium',
        animation: 'pulse',
        zIndex: 4
      },
      {
        type: 'pumpkin',
        position: { x: 10, y: 85 },
        size: 'small',
        animation: 'glow',
        zIndex: 3
      },
      {
        type: 'candy',
        position: { x: 90, y: 80 },
        size: 'small',
        animation: 'bounce',
        zIndex: 3
      }
    ]
  },
  'ghost-memory-heap': {
    theme: 'mixed',
    maxDecorations: 5,
    decorations: [
      {
        type: 'candy',
        position: { x: 20, y: 60 },
        size: 'medium',
        animation: 'bounce',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'pumpkin',
        position: { x: 70, y: 65 },
        size: 'medium',
        animation: 'pulse',
        zIndex: 4
      },
      {
        type: 'candy',
        position: { x: 45, y: 80 },
        size: 'small',
        animation: 'glow',
        zIndex: 3
      },
      {
        type: 'candy',
        position: { x: 85, y: 70 },
        size: 'small',
        animation: 'bounce',
        zIndex: 3
      }
    ]
  },
  'possessed-compiler': {
    theme: 'spooky',
    maxDecorations: 3,
    decorations: [
      {
        type: 'pumpkin',
        position: { x: 30, y: 85 },
        size: 'large',
        animation: 'glow',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'pumpkin',
        position: { x: 80, y: 75 },
        size: 'medium',
        animation: 'pulse',
        zIndex: 4
      }
    ]
  },
  'ethics-tribunal': {
    theme: 'mixed',
    maxDecorations: 4,
    decorations: [
      {
        type: 'candy',
        position: { x: 25, y: 70 },
        size: 'medium',
        animation: 'glow',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'pumpkin',
        position: { x: 75, y: 75 },
        size: 'medium',
        animation: 'pulse',
        zIndex: 4
      },
      {
        type: 'candy',
        position: { x: 50, y: 85 },
        size: 'small',
        animation: 'bounce',
        zIndex: 3
      }
    ]
  },
  'final-merge': {
    theme: 'sweet',
    maxDecorations: 8,
    decorations: [
      {
        type: 'candy',
        position: { x: 20, y: 60 },
        size: 'large',
        animation: 'glow',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'candy',
        position: { x: 80, y: 65 },
        size: 'large',
        animation: 'bounce',
        zIndex: 5,
        interactive: true
      },
      {
        type: 'pumpkin',
        position: { x: 50, y: 80 },
        size: 'medium',
        animation: 'pulse',
        zIndex: 4
      },
      {
        type: 'candy',
        position: { x: 15, y: 85 },
        size: 'small',
        animation: 'glow',
        zIndex: 3
      },
      {
        type: 'candy',
        position: { x: 85, y: 85 },
        size: 'small',
        animation: 'bounce',
        zIndex: 3
      }
    ]
  }
};

export function SeasonalDecorations({ 
  roomId, 
  intensity = 1.0, 
  interactive = true,
  className 
}: SeasonalDecorationsProps) {
  const [decorationConfig, setDecorationConfig] = useState<RoomDecorationConfig | null>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [assetErrors, setAssetErrors] = useState<Set<string>>(new Set());
  const [clickedDecorations, setClickedDecorations] = useState<Set<number>>(new Set());

  useEffect(() => {
    const config = ROOM_DECORATION_CONFIGS[roomId];
    if (config) {
      setDecorationConfig(config);
      
      // Preload decoration assets
      const preloadAssets = async () => {
        const errors = new Set<string>();
        
        try {
          await preloadImage(assets.entities.pumpkin);
        } catch (error) {
          console.warn('Failed to load pumpkin asset:', error);
          errors.add('pumpkin');
        }
        
        try {
          await preloadImage(assets.entities.candy);
        } catch (error) {
          console.warn('Failed to load candy asset:', error);
          errors.add('candy');
        }
        
        setAssetErrors(errors);
        setAssetsLoaded(true);
      };
      
      preloadAssets();
    }
  }, [roomId]);

  const handleDecorationClick = (index: number, decoration: DecorationConfig) => {
    if (!interactive || !decoration.interactive) return;
    
    setClickedDecorations(prev => new Set([...prev, index]));
    
    // Optional: Add click feedback or interaction logic here
    console.log(`Clicked ${decoration.type} decoration in ${roomId}`);
    
    // Remove clicked state after animation
    setTimeout(() => {
      setClickedDecorations(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 1000);
  };

  if (!decorationConfig || !assetsLoaded) {
    return null;
  }

  // Calculate visible decorations based on intensity
  const visibleDecorations = decorationConfig.decorations.slice(
    0, 
    Math.ceil(decorationConfig.decorations.length * intensity)
  );

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {visibleDecorations.map((decoration, index) => (
        <DecorationElement
          key={index}
          decoration={decoration}
          assetPath={decoration.type === 'pumpkin' ? assets.entities.pumpkin : assets.entities.candy}
          hasError={assetErrors.has(decoration.type)}
          isClicked={clickedDecorations.has(index)}
          onClick={() => handleDecorationClick(index, decoration)}
          interactive={interactive && decoration.interactive}
        />
      ))}
    </div>
  );
}

interface DecorationElementProps {
  decoration: DecorationConfig;
  assetPath: string;
  hasError: boolean;
  isClicked: boolean;
  onClick: () => void;
  interactive?: boolean;
}

function DecorationElement({ 
  decoration, 
  assetPath, 
  hasError, 
  isClicked, 
  onClick, 
  interactive 
}: DecorationElementProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const animationClasses = {
    glow: 'animate-pulse',
    bounce: 'animate-bounce',
    pulse: 'animate-ping',
    none: ''
  };

  if (hasError) {
    // Fallback to emoji if asset fails to load
    const fallbackEmoji = decoration.type === 'pumpkin' ? '🎃' : '🍬';
    
    return (
      <div
        className={cn(
          "absolute flex items-center justify-center text-2xl",
          sizeClasses[decoration.size],
          decoration.animation ? animationClasses[decoration.animation] : '',
          interactive ? 'pointer-events-auto cursor-pointer hover:scale-110 transition-transform' : '',
          isClicked ? 'scale-125 brightness-150' : ''
        )}
        style={{
          left: `${decoration.position.x}%`,
          top: `${decoration.position.y}%`,
          zIndex: decoration.zIndex || 5,
          transform: 'translate(-50%, -50%)',
          filter: isClicked ? 'drop-shadow(0 0 10px currentColor)' : 'none'
        }}
        onClick={interactive ? onClick : undefined}
      >
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute",
        sizeClasses[decoration.size],
        decoration.animation ? animationClasses[decoration.animation] : '',
        interactive ? 'pointer-events-auto cursor-pointer hover:scale-110 transition-transform' : '',
        isClicked ? 'scale-125' : ''
      )}
      style={{
        left: `${decoration.position.x}%`,
        top: `${decoration.position.y}%`,
        zIndex: decoration.zIndex || 5,
        transform: 'translate(-50%, -50%)',
        filter: isClicked ? 'drop-shadow(0 0 15px orange) brightness(1.3)' : 'none'
      }}
      onClick={interactive ? onClick : undefined}
    >
      <img
        src={assetPath}
        alt={`${decoration.type} decoration`}
        className="w-full h-full object-contain"
        style={{
          imageRendering: 'pixelated' // Maintain pixel art aesthetic
        }}
      />
      
      {/* Glow effect for interactive decorations */}
      {interactive && decoration.interactive && (
        <div 
          className="absolute inset-0 rounded-full opacity-0 hover:opacity-30 transition-opacity"
          style={{
            background: decoration.type === 'pumpkin' 
              ? 'radial-gradient(circle, orange 0%, transparent 70%)'
              : 'radial-gradient(circle, pink 0%, transparent 70%)',
            filter: 'blur(4px)'
          }}
        />
      )}
    </div>
  );
}

/**
 * Hook for managing seasonal decoration interactions
 */
export function useSeasonalDecorations(roomId: string) {
  const [decorationStats, setDecorationStats] = useState({
    pumpkinsFound: 0,
    candiesFound: 0,
    totalInteractions: 0
  });

  const recordInteraction = (type: 'pumpkin' | 'candy') => {
    setDecorationStats(prev => ({
      ...prev,
      [type === 'pumpkin' ? 'pumpkinsFound' : 'candiesFound']: prev[type === 'pumpkin' ? 'pumpkinsFound' : 'candiesFound'] + 1,
      totalInteractions: prev.totalInteractions + 1
    }));
  };

  const resetStats = () => {
    setDecorationStats({
      pumpkinsFound: 0,
      candiesFound: 0,
      totalInteractions: 0
    });
  };

  return {
    decorationStats,
    recordInteraction,
    resetStats
  };
}