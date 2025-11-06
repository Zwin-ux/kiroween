/**
 * GhostEncounterCard Component - Interactive card for ghost encounters
 * 
 * Displays ghost information with availability indicators and click handlers
 * for starting encounters. Integrates with the GhostSelectionSystem.
 */

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GhostRenderer } from "@/components/ui/GhostRenderer";
import { type EncounterableGhost, EncounterState } from "@/engine/GhostSelectionSystem";

export interface GhostEncounterCardProps {
  /** Ghost data with encounter information */
  ghost: EncounterableGhost;
  /** Current encounter state */
  encounterState: EncounterState;
  /** Whether the card is currently selected/active */
  isActive?: boolean;
  /** Callback when encounter is started */
  onStartEncounter?: (ghostId: string) => void;
  /** Callback when card is clicked (for selection) */
  onCardClick?: (ghostId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get state-specific styling and labels
 */
const getStateInfo = (state: EncounterState, isAvailable: boolean, isCompleted: boolean) => {
  if (isCompleted) {
    return {
      label: "Resolved",
      color: "text-green-400",
      bgColor: "bg-green-900/20 border-green-700",
      buttonVariant: "secondary" as const,
      buttonText: "Review",
      disabled: false
    };
  }

  if (!isAvailable) {
    return {
      label: "Locked",
      color: "text-gray-500",
      bgColor: "bg-gray-900/50 border-gray-700",
      buttonVariant: "ghost" as const,
      buttonText: "Locked",
      disabled: true
    };
  }

  switch (state) {
    case EncounterState.NotStarted:
      return {
        label: "Available",
        color: "text-blue-400",
        bgColor: "bg-blue-900/20 border-blue-700 hover:bg-blue-900/30",
        buttonVariant: "horror" as const,
        buttonText: "Encounter",
        disabled: false
      };
    case EncounterState.InDialogue:
      return {
        label: "In Progress",
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/20 border-yellow-700",
        buttonVariant: "secondary" as const,
        buttonText: "Continue",
        disabled: false
      };
    case EncounterState.GeneratingPatch:
    case EncounterState.ReviewingPatch:
    case EncounterState.ApplyingPatch:
      return {
        label: "Debugging",
        color: "text-orange-400",
        bgColor: "bg-orange-900/20 border-orange-700",
        buttonVariant: "secondary" as const,
        buttonText: "Continue",
        disabled: false
      };
    case EncounterState.Failed:
      return {
        label: "Failed",
        color: "text-red-400",
        bgColor: "bg-red-900/20 border-red-700",
        buttonVariant: "destructive" as const,
        buttonText: "Retry",
        disabled: false
      };
    default:
      return {
        label: "Unknown",
        color: "text-gray-400",
        bgColor: "bg-gray-900/20 border-gray-700",
        buttonVariant: "ghost" as const,
        buttonText: "Unknown",
        disabled: true
      };
  }
};

/**
 * Get difficulty color and label
 */
const getDifficultyInfo = (level: number) => {
  if (level <= 3) {
    return { color: "text-green-400", label: "Beginner" };
  } else if (level <= 6) {
    return { color: "text-yellow-400", label: "Intermediate" };
  } else if (level <= 8) {
    return { color: "text-orange-400", label: "Advanced" };
  } else {
    return { color: "text-red-400", label: "Expert" };
  }
};

/**
 * GhostEncounterCard component
 */
export const GhostEncounterCard: React.FC<GhostEncounterCardProps> = ({
  ghost,
  encounterState,
  isActive = false,
  onStartEncounter,
  onCardClick,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const stateInfo = getStateInfo(encounterState, ghost.isAvailable, ghost.isCompleted);
  const difficultyInfo = getDifficultyInfo(ghost.difficultyLevel);

  const handleCardClick = () => {
    onCardClick?.(ghost.id);
  };

  const handleEncounterStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stateInfo.disabled) {
      onStartEncounter?.(ghost.id);
    }
  };

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer",
        "font-mono text-sm backdrop-blur-sm",
        stateInfo.bgColor,
        isActive && "ring-2 ring-blue-500 ring-opacity-50",
        isHovered && !stateInfo.disabled && "transform scale-105 shadow-lg",
        stateInfo.disabled && "cursor-not-allowed opacity-60",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with ghost renderer and basic info */}
      <div className="flex items-start gap-3 mb-3">
        <GhostRenderer
          ghost={ghost}
          state={isActive ? 'active' : ghost.isCompleted ? 'resolved' : 'idle'}
          size="sm"
          showEffects={isActive || isHovered}
          isSpeaking={isActive && encounterState === EncounterState.InDialogue}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white truncate">{ghost.name}</h3>
            <span className={cn("text-xs font-medium", stateInfo.color)}>
              {stateInfo.label}
            </span>
          </div>
          
          <p className="text-gray-300 text-xs mb-2 line-clamp-2">
            {ghost.description}
          </p>
          
          {/* Software smell badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded border border-gray-600">
              {ghost.softwareSmell.replace('_', ' ').toUpperCase()}
            </span>
            <span className={cn("text-xs font-medium", difficultyInfo.color)}>
              {difficultyInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="space-y-2 mb-3">
        {/* Severity indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Severity</span>
          <span className="text-gray-300">{ghost.severity}/10</span>
        </div>
        <Progress 
          value={(ghost.severity / 10) * 100} 
          className="h-2"
          variant={ghost.severity > 7 ? 'stability' : 'default'}
        />
        
        {/* Estimated time */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Est. Time</span>
          <span>{ghost.estimatedTime} min</span>
        </div>
      </div>

      {/* Prerequisites (if any) */}
      {ghost.prerequisites && ghost.prerequisites.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Prerequisites:</div>
          <div className="flex flex-wrap gap-1">
            {ghost.prerequisites.map((prereq) => (
              <span
                key={prereq}
                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded border border-gray-600"
              >
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      <Button
        variant={stateInfo.buttonVariant}
        size="sm"
        className="w-full"
        disabled={stateInfo.disabled}
        onClick={handleEncounterStart}
      >
        {stateInfo.buttonText}
      </Button>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      )}

      {/* Completion indicator */}
      {ghost.isCompleted && (
        <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * GhostEncounterGrid component for displaying multiple encounter cards
 */
export interface GhostEncounterGridProps {
  /** List of encounterable ghosts */
  ghosts: EncounterableGhost[];
  /** Map of ghost IDs to their encounter states */
  encounterStates: Record<string, EncounterState>;
  /** Currently active ghost ID */
  activeGhostId?: string;
  /** Callback when encounter is started */
  onStartEncounter?: (ghostId: string) => void;
  /** Callback when ghost card is selected */
  onGhostSelect?: (ghostId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export const GhostEncounterGrid: React.FC<GhostEncounterGridProps> = ({
  ghosts,
  encounterStates,
  activeGhostId,
  onStartEncounter,
  onGhostSelect,
  className,
}) => {
  if (ghosts.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 text-center",
        "bg-gray-900/50 border border-gray-700 rounded-lg",
        className
      )}>
        <div className="text-gray-400">
          <div className="text-lg mb-2">👻</div>
          <div className="text-sm">No ghosts found in this room</div>
          <div className="text-xs text-gray-500 mt-1">
            Try exploring other areas or check your progress
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {ghosts.map((ghost) => (
        <GhostEncounterCard
          key={ghost.id}
          ghost={ghost}
          encounterState={encounterStates[ghost.id] || EncounterState.NotStarted}
          isActive={activeGhostId === ghost.id}
          onStartEncounter={onStartEncounter}
          onCardClick={onGhostSelect}
        />
      ))}
    </div>
  );
};

/**
 * GhostEncounterSummary component for room-level statistics
 */
export interface GhostEncounterSummaryProps {
  /** Room encounter statistics */
  stats: {
    total: number;
    available: number;
    completed: number;
    inProgress: number;
  };
  /** Room name */
  roomName?: string;
  /** Additional CSS classes */
  className?: string;
}

export const GhostEncounterSummary: React.FC<GhostEncounterSummaryProps> = ({
  stats,
  roomName,
  className,
}) => {
  const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className={cn(
      "p-4 bg-gray-900/50 border border-gray-700 rounded-lg font-mono",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">
          {roomName ? `${roomName} Progress` : 'Room Progress'}
        </h3>
        <span className="text-sm text-gray-400">
          {stats.completed}/{stats.total} resolved
        </span>
      </div>
      
      <Progress 
        value={completionPercentage} 
        className="mb-3"
        variant="insight"
      />
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Available:</span>
            <span className="text-blue-400">{stats.available}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">In Progress:</span>
            <span className="text-yellow-400">{stats.inProgress}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Completed:</span>
            <span className="text-green-400">{stats.completed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total:</span>
            <span className="text-white">{stats.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};