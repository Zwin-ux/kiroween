/**
 * GhostRenderer Component - Renders ghosts with their associated assets and visual effects
 * 
 * Integrates with the asset system to display ghost entities and icons
 * with appropriate visual effects based on ghost state and software smell.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GameAsset, EntityAsset, IconAsset } from "@/components/ui/GameAsset";
import type { Ghost, GhostVisualEffects } from "@/types/ghost";

/**
 * Props interface for the GhostRenderer component
 */
export interface GhostRendererProps {
  /** Ghost data to render */
  ghost: Ghost;
  /** Current ghost state */
  state?: 'idle' | 'active' | 'resolved' | 'angry';
  /** Size variant for the ghost rendering */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show visual effects */
  showEffects?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when ghost is clicked */
  onClick?: (ghost: Ghost) => void;
  /** Whether the ghost is currently speaking */
  isSpeaking?: boolean;
}

/**
 * Animation classes for different ghost states
 */
const ANIMATION_CLASSES = {
  float: 'animate-bounce',
  pulse: 'animate-pulse',
  glitch: 'animate-ping',
  fade: 'animate-pulse opacity-75',
} as const;

/**
 * Size classes for ghost rendering
 */
const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
} as const;

/**
 * GhostRenderer component for displaying ghosts with assets and effects
 */
export const GhostRenderer: React.FC<GhostRendererProps> = ({
  ghost,
  state = 'idle',
  size = 'md',
  showEffects = true,
  className,
  onClick,
  isSpeaking = false,
}) => {
  const [currentEffects, setCurrentEffects] = useState<GhostVisualEffects | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Get ghost assets based on software smell and state
  const getGhostEntityAsset = () => {
    if (ghost.assets?.entity) {
      return ghost.assets.entity;
    }
    
    // Fallback mapping based on software smell
    const entityMapping: Record<string, string> = {
      'circular_dependency': 'terminal',
      'memory_leak': 'pumpkin',
      'race_condition': 'terminal',
      'prompt_injection': 'candy',
      'data_leak': 'terminal',
      'dead_code': 'pumpkin',
      'stale_cache': 'candy',
      'unbounded_recursion': 'terminal',
    };
    
    return entityMapping[ghost.softwareSmell] || 'pumpkin';
  };

  const getGhostIconAsset = () => {
    // Check for state-specific icons
    if (ghost.assets?.stateIcons?.[state]) {
      return ghost.assets.stateIcons[state]!;
    }
    
    // Fallback to general ghost icon
    if (ghost.assets?.icon) {
      return ghost.assets.icon;
    }
    
    return 'ghost';
  };

  // Generate visual effects based on ghost manifestation
  useEffect(() => {
    if (!showEffects) return;

    const effects: GhostVisualEffects = {
      animation: 'float',
      duration: 2000,
      ...ghost.manifestation.effects,
    };

    // Override effects based on software smell if not specified
    if (!ghost.manifestation.effects) {
      switch (ghost.softwareSmell) {
        case 'circular_dependency':
          effects.animation = 'pulse';
          effects.lighting = 'red glow';
          break;
        case 'memory_leak':
          effects.animation = 'fade';
          effects.lighting = 'blue flicker';
          break;
        case 'race_condition':
          effects.animation = 'glitch';
          effects.lighting = 'strobe';
          effects.duration = 1500;
          break;
        case 'prompt_injection':
          effects.animation = 'pulse';
          effects.lighting = 'yellow warning';
          break;
        case 'data_leak':
          effects.animation = 'fade';
          effects.lighting = 'orange alert';
          break;
        case 'dead_code':
          effects.animation = 'fade';
          effects.lighting = 'dim gray';
          effects.duration = 3000;
          break;
        case 'stale_cache':
          effects.animation = 'pulse';
          effects.lighting = 'green stale';
          break;
        case 'unbounded_recursion':
          effects.animation = 'pulse';
          effects.lighting = 'purple spiral';
          effects.duration = 1000;
          break;
      }
    }

    setCurrentEffects(effects);
  }, [ghost, showEffects]);

  // Get animation class based on current effects and state
  const getAnimationClass = () => {
    if (!currentEffects?.animation) return '';
    
    let animationClass = ANIMATION_CLASSES[currentEffects.animation] || '';
    
    // Modify animation based on state
    if (state === 'active' || isSpeaking) {
      animationClass += ' animate-pulse';
    }
    
    if (isHovered) {
      animationClass += ' scale-110';
    }
    
    return animationClass;
  };

  // Get lighting effect styles
  const getLightingStyles = (): React.CSSProperties => {
    if (!currentEffects?.lighting || !showEffects) return {};
    
    const lightingMap: Record<string, React.CSSProperties> = {
      'red glow': { 
        filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
      },
      'blue flicker': { 
        filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.7))',
        animation: 'flicker 2s infinite',
      },
      'strobe': { 
        filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.9))',
        animation: 'strobe 0.5s infinite',
      },
      'yellow warning': { 
        filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))',
        boxShadow: '0 0 15px rgba(251, 191, 36, 0.5)',
      },
      'orange alert': { 
        filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.8))',
        boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)',
      },
      'dim gray': { 
        filter: 'drop-shadow(0 0 5px rgba(107, 114, 128, 0.5)) grayscale(0.5)',
        opacity: 0.7,
      },
      'green stale': { 
        filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6)) sepia(0.3)',
      },
      'purple spiral': { 
        filter: 'drop-shadow(0 0 12px rgba(147, 51, 234, 0.8))',
        animation: 'spin 3s linear infinite',
      },
    };
    
    return lightingMap[currentEffects.lighting] || {};
  };

  const entityAsset = getGhostEntityAsset();
  const iconAsset = getGhostIconAsset();

  return (
    <div 
      className={cn(
        "relative inline-block cursor-pointer transition-all duration-300 game-entity",
        SIZE_CLASSES[size],
        getAnimationClass(),
        className
      )}
      onClick={() => onClick?.(ghost)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={getLightingStyles()}
      title={`${ghost.name} - ${ghost.description}`}
    >
      {/* Main entity asset */}
      <EntityAsset
        entityName={entityAsset}
        size={size}
        className="w-full h-full"
      />
      
      {/* State icon overlay */}
      <div className="absolute -top-1 -right-1 game-ui">
        <IconAsset
          iconName={iconAsset}
          size="sm"
          className={cn(
            "bg-gray-900/80 rounded-full p-1 border border-gray-600",
            state === 'active' && "border-red-500 bg-red-900/80",
            state === 'resolved' && "border-green-500 bg-green-900/80",
            state === 'angry' && "border-orange-500 bg-orange-900/80"
          )}
        />
      </div>
      
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      
      {/* Severity indicator */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 rounded-b">
        <div 
          className={cn(
            "h-full rounded-b transition-all duration-500",
            ghost.severity <= 3 && "bg-green-500",
            ghost.severity > 3 && ghost.severity <= 6 && "bg-yellow-500",
            ghost.severity > 6 && ghost.severity <= 8 && "bg-orange-500",
            ghost.severity > 8 && "bg-red-500"
          )}
          style={{ width: `${(ghost.severity / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Utility component for rendering multiple ghosts in a room
 */
export const GhostGroup: React.FC<{
  ghosts: Ghost[];
  activeGhostId?: string;
  onGhostClick?: (ghost: Ghost) => void;
  className?: string;
}> = ({ ghosts, activeGhostId, onGhostClick, className }) => {
  return (
    <div className={cn("flex flex-wrap gap-4 justify-center", className)}>
      {ghosts.map((ghost) => (
        <GhostRenderer
          key={ghost.id}
          ghost={ghost}
          state={activeGhostId === ghost.id ? 'active' : 'idle'}
          onClick={onGhostClick}
          isSpeaking={activeGhostId === ghost.id}
        />
      ))}
    </div>
  );
};