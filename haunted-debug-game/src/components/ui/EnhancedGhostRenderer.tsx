/**
 * EnhancedGhostRenderer - Atmospheric ghost visualization with personality
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { assets } from '@/lib/assets';
import { 
  getGhostRendererClasses,
  type PerformanceMode,
  type AssetLoadingState
} from '@/lib/assetPerformanceUtils';

/**
 * Calculate hue rotation value for CSS filter based on target color
 * Converts hex color to HSL and returns hue rotation degrees
 */
function getHueRotation(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let hue = 0;
  if (diff !== 0) {
    if (max === r) {
      hue = ((g - b) / diff) % 6;
    } else if (max === g) {
      hue = (b - r) / diff + 2;
    } else {
      hue = (r - g) / diff + 4;
    }
  }
  
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  return hue;
}

interface GhostRendererProps {
  ghostType: string;
  severity: number; // 1-10
  isActive?: boolean;
  isEncountered?: boolean;
  stabilityLevel?: number;
  performanceMode?: PerformanceMode; // NEW: Performance optimization mode
  className?: string;
  onClick?: () => void;
}

interface GhostPersonality {
  name: string;
  baseImage?: string;              // NEW: Base ghost PNG path
  colors: {
    primary: string;
    secondary: string;
    glow: string;
  };
  symbol: string;
  traits: string[];
  manifestation: {
    visual: string;
    behavior: string;
  };
  distortionEffect: string;
}

const GHOST_PERSONALITIES: Record<string, GhostPersonality> = {
  circular_dependency: {
    name: 'The Ouroboros',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#7df7ff',
      secondary: '#72e6db',
      glow: 'rgba(125, 247, 255, 0.4)'
    },
    symbol: '⟲',
    traits: ['recursive', 'cyclical', 'architectural'],
    manifestation: {
      visual: 'Twisted import chains forming infinite loops',
      behavior: 'Creates dependency cycles that prevent clean compilation'
    },
    distortionEffect: 'spiral'
  },
  stale_cache: {
    name: 'The Lingerer',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#ff7043',
      secondary: '#b27854',
      glow: 'rgba(255, 112, 67, 0.4)'
    },
    symbol: '⧖',
    traits: ['nostalgic', 'resistant', 'comfortable'],
    manifestation: {
      visual: 'Faded, translucent data structures with cobwebs',
      behavior: 'Serves outdated cached data causing inconsistencies'
    },
    distortionEffect: 'fade'
  },
  unbounded_recursion: {
    name: 'The Infinite Echo',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#ff4757',
      secondary: '#a85c31',
      glow: 'rgba(255, 71, 87, 0.4)'
    },
    symbol: '∞',
    traits: ['repetitive', 'self-referential', 'fractal'],
    manifestation: {
      visual: 'Fractal patterns that spiral into darkness',
      behavior: 'Recursive calls without proper base cases or limits'
    },
    distortionEffect: 'fractal'
  },
  prompt_injection: {
    name: 'The Manipulator',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#574036',
      secondary: '#4a4a4a',
      glow: 'rgba(87, 64, 54, 0.4)'
    },
    symbol: '⚠',
    traits: ['deceptive', 'persuasive', 'manipulative'],
    manifestation: {
      visual: 'Shadowy text that rewrites itself when not watched',
      behavior: 'Injects malicious instructions into user inputs'
    },
    distortionEffect: 'shadow'
  },
  data_leak: {
    name: 'The Whisperer',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#5cff96',
      secondary: '#72e6db',
      glow: 'rgba(92, 255, 150, 0.4)'
    },
    symbol: '⚡',
    traits: ['secretive', 'revealing', 'privacy-concerned'],
    manifestation: {
      visual: 'Glowing data streams leaking through cracks in the code',
      behavior: 'Logs sensitive data or exposes it through error messages'
    },
    distortionEffect: 'leak'
  },
  dead_code: {
    name: 'The Forgotten',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#6b7280',
      secondary: '#4a4a4a',
      glow: 'rgba(107, 114, 128, 0.4)'
    },
    symbol: '☠',
    traits: ['melancholic', 'abandoned', 'nostalgic'],
    manifestation: {
      visual: 'Ghostly code blocks that flicker in and out of existence',
      behavior: 'Clutters codebase with unreachable or unused code'
    },
    distortionEffect: 'flicker'
  },
  race_condition: {
    name: 'The Competitor',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#ff7043',
      secondary: '#ff4757',
      glow: 'rgba(255, 112, 67, 0.4)'
    },
    symbol: '⚡',
    traits: ['chaotic', 'impatient', 'competitive'],
    manifestation: {
      visual: 'Multiple ghostly hands reaching for the same resource',
      behavior: 'Creates timing-dependent bugs in concurrent code'
    },
    distortionEffect: 'chaos'
  },
  memory_leak: {
    name: 'The Hoarder',
    baseImage: assets.ghosts.base,
    colors: {
      primary: '#72e6db',
      secondary: '#5cff96',
      glow: 'rgba(114, 230, 219, 0.4)'
    },
    symbol: '⬆',
    traits: ['possessive', 'greedy', 'accumulating'],
    manifestation: {
      visual: 'Growing piles of allocated memory blocks',
      behavior: 'Allocates memory without proper cleanup'
    },
    distortionEffect: 'accumulate'
  }
};

export function EnhancedGhostRenderer({
  ghostType,
  severity,
  isActive = false,
  isEncountered = false,
  stabilityLevel = 50,
  performanceMode = 'medium',
  className,
  onClick
}: GhostRendererProps) {
  const [personality, setPersonality] = useState<GhostPersonality | null>(null);
  const [ghostImage, setGhostImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Asset loading state for performance optimization
  const [assetLoadingState, setAssetLoadingState] = useState<AssetLoadingState>('idle');

  useEffect(() => {
    const ghostPersonality = GHOST_PERSONALITIES[ghostType];
    if (ghostPersonality) {
      setPersonality(ghostPersonality);
      
      // Load base ghost image
      const baseImage = ghostPersonality.baseImage || assets.ghosts.base;
      if (baseImage) {
        setGhostImage(baseImage);
        setImageLoaded(false);
        setImageError(false);
        setImageLoading(false);
      }
    }
  }, [ghostType]);

  // Preload ghost image with performance tracking
  useEffect(() => {
    if (ghostImage && !imageLoaded && !imageError && !imageLoading) {
      setImageLoading(true);
      setImageError(false);
      setAssetLoadingState('loading');
      
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        setImageLoading(false);
        setAssetLoadingState('loaded');
      };
      img.onerror = () => {
        setImageError(true);
        setImageLoading(false);
        setAssetLoadingState('error');
      };
      img.src = ghostImage;
    }
  }, [ghostImage, imageLoaded, imageError, imageLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!personality) {
    return (
      <div className={cn("w-16 h-16 bg-gray-500 rounded-full", className)}>
        <span className="text-white">?</span>
      </div>
    );
  }

  const intensityFactor = severity / 10;
  const instabilityFactor = (100 - stabilityLevel) / 100;
  const totalIntensity = Math.min(1, intensityFactor + instabilityFactor * 0.5);

  // Get optimized CSS classes for performance
  const ghostClasses = getGhostRendererClasses(
    isActive,
    performanceMode,
    assetLoadingState
  );

  return (
    <div
      className={cn(
        "relative cursor-pointer transition-all duration-300",
        ghostClasses,
        isActive && "z-20",
        className
      )}
      style={{
        '--ghost-color': personality.colors.primary,
        '--ghost-intensity': totalIntensity,
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main ghost body */}
      <div
        className={cn(
          "relative w-20 h-20 rounded-full transition-all duration-500",
          "ghost-icon breathing",
          isActive && "scale-125 glow-strong",
          isHovered && "scale-110",
          isEncountered && "opacity-60",
          performanceMode === 'high' && "asset-gpu-layer",
          performanceMode === 'low' && "asset-memory-optimized"
        )}
        style={{
          background: ghostImage && imageLoaded && !imageError 
            ? 'transparent' 
            : `radial-gradient(circle, ${personality.colors.glow} 0%, ${personality.colors.primary}40 50%, transparent 100%)`,
          boxShadow: `0 0 ${20 + severity * 4}px ${personality.colors.glow}`,
          contain: 'paint', // Optimize ghost icon rendering
        }}
      >
        {/* Ghost Image or Symbol Fallback */}
        <div className="absolute inset-0 flex items-center justify-center">
          {ghostImage && imageLoaded && !imageError ? (
            <>
              <img 
                src={ghostImage}
                alt={personality?.name || 'Ghost'}
                className={cn(
                  "asset-responsive-fill rounded-full asset-transition-normal",
                  "asset-gpu-accelerated", // Performance optimization
                  // Apply personality-specific color filter based on primary color
                  personality.colors.primary.includes('#7df7ff') && "asset-filter-ghost-cyan",
                  personality.colors.primary.includes('#ff7043') && "asset-filter-ghost-orange", 
                  personality.colors.primary.includes('#ff4757') && "asset-filter-ghost-red",
                  personality.colors.primary.includes('#574036') && "asset-filter-ghost-gray",
                  personality.colors.primary.includes('#5cff96') && "asset-filter-ghost-green",
                  personality.colors.primary.includes('#6b7280') && "asset-filter-ghost-gray",
                  personality.colors.primary.includes('#72e6db') && "asset-filter-ghost-cyan"
                )}
                style={{
                  filter: `hue-rotate(${getHueRotation(personality.colors.primary)}deg) saturate(1.2) brightness(1.1)`,
                }}
              />
              {/* Personality Color Overlay */}
              <div 
                className="absolute inset-0 rounded-full asset-blend-overlay asset-opacity-60"
                style={{ backgroundColor: personality.colors.primary }}
              />
            </>
          ) : imageError ? (
            // Error state with asset utilities
            <div className="w-full h-full rounded-full asset-error flex items-center justify-center">
              <span 
                className="text-2xl font-bold text-glow"
                style={{ color: personality.colors.primary }}
              >
                {personality.symbol}
              </span>
            </div>
          ) : imageLoading ? (
            // Loading state with asset utilities
            <div className="w-full h-full rounded-full asset-loading flex items-center justify-center">
              <span 
                className="text-xl font-bold"
                style={{ color: personality.colors.primary }}
              >
                {personality.symbol}
              </span>
            </div>
          ) : (
            // Fallback to existing symbol rendering
            <span 
              className="text-3xl font-bold text-glow-strong"
              style={{ color: personality.colors.primary }}
            >
              {personality.symbol}
            </span>
          )}
        </div>

        {/* Severity indicator */}
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{severity}</span>
          </div>
        </div>

        {/* Distortion effect overlay */}
        <DistortionEffect 
          type={personality.distortionEffect} 
          intensity={totalIntensity}
          phase={animationPhase}
          colors={personality.colors}
        />
      </div>

      {/* Ghost aura */}
      <div
        className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
        style={{
          background: `radial-gradient(circle, transparent 60%, ${personality.colors.glow} 100%)`,
          transform: `scale(${1.5 + totalIntensity * 0.5})`,
          opacity: totalIntensity * 0.3,
        }}
      />

      {/* Personality traits display on hover */}
      {isHovered && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-30">
          <div className="ui-panel px-3 py-2 min-w-max">
            <div className="text-sm font-bold text-center mb-1" style={{ color: personality.colors.primary }}>
              {personality.name}
            </div>
            <div className="text-xs text-gray-300 text-center">
              {personality.traits.join(' • ')}
            </div>
          </div>
        </div>
      )}

      {/* Active state effects */}
      {isActive && (
        <>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 animate-ping"
               style={{ borderColor: personality.colors.primary }} />
          
          {/* Floating particles */}
          <FloatingParticles 
            color={personality.colors.primary}
            count={8}
            radius={60}
          />
        </>
      )}

      {/* Encountered state overlay */}
      {isEncountered && (
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <span className="text-green-400 text-2xl">✓</span>
        </div>
      )}
    </div>
  );
}

// Distortion effect component
function DistortionEffect({ 
  type, 
  intensity, 
  phase, 
  colors 
}: { 
  type: string; 
  intensity: number; 
  phase: number;
  colors: { primary: string; secondary: string; glow: string };
}) {
  const baseOpacity = intensity * 0.6;

  switch (type) {
    case 'spiral':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div
            className="absolute inset-0 animate-spin"
            style={{
              background: `conic-gradient(from ${phase * 90}deg, transparent 0%, ${colors.glow} 25%, transparent 50%)`,
              opacity: baseOpacity,
              animationDuration: '4s'
            }}
          />
        </div>
      );

    case 'fade':
      return (
        <div className="absolute inset-0 rounded-full">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: `linear-gradient(${phase * 90}deg, ${colors.glow} 0%, transparent 50%, ${colors.glow} 100%)`,
              opacity: baseOpacity * 0.5,
            }}
          />
        </div>
      );

    case 'fractal':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="absolute inset-0 border-2 rounded-full animate-ping"
              style={{
                borderColor: colors.primary,
                opacity: baseOpacity / (i + 1),
                animationDelay: `${i * 0.5}s`,
                transform: `scale(${1 + i * 0.2})`
              }}
            />
          ))}
        </div>
      );

    case 'shadow':
      return (
        <div className="absolute inset-0 rounded-full">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${30 + phase * 10}% ${30 + phase * 10}%, ${colors.glow} 0%, transparent 60%)`,
              opacity: baseOpacity,
              transform: `rotate(${phase * 45}deg)`
            }}
          />
        </div>
      );

    case 'leak':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-8 animate-pulse"
              style={{
                background: `linear-gradient(to bottom, ${colors.primary}, transparent)`,
                left: `${25 + i * 15}%`,
                top: `${20 + (phase + i) * 10}%`,
                opacity: baseOpacity,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      );

    case 'flicker':
      return (
        <div className="absolute inset-0 rounded-full">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: colors.glow,
              opacity: phase % 2 === 0 ? baseOpacity : baseOpacity * 0.3,
            }}
          />
        </div>
      );

    case 'chaos':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                background: colors.primary,
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                opacity: baseOpacity,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 1}s`
              }}
            />
          ))}
        </div>
      );

    case 'accumulate':
      return (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {Array.from({ length: intensity * 8 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: colors.secondary,
                left: `${20 + (i % 4) * 15}%`,
                top: `${20 + Math.floor(i / 4) * 15}%`,
                opacity: baseOpacity * (1 - i * 0.1),
              }}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
}

// Floating particles component
function FloatingParticles({ 
  color, 
  count, 
  radius 
}: { 
  color: string; 
  count: number; 
  radius: number; 
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-pulse"
            style={{
              background: color,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + Math.random()}s`
            }}
          />
        );
      })}
    </div>
  );
}