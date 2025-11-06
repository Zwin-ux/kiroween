/**
 * GhostEncounterInterface Component - Main interface for ghost encounters
 * 
 * Orchestrates the ghost encounter flow with smooth transitions and
 * integrates with the GhostSelectionSystem and game state.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GhostEncounterCard, GhostEncounterGrid, GhostEncounterSummary } from "@/components/ui/GhostEncounterCard";
import { GhostRenderer } from "@/components/ui/GhostRenderer";
import { useGhostEncounters } from "@/hooks/useGhostEncounters";
import { useGameStore } from "@/store/gameStore";
import { EncounterState } from "@/engine/GhostSelectionSystem";

export interface GhostEncounterInterfaceProps {
  /** Room key to display ghosts for */
  roomKey?: string;
  /** Whether to show room summary */
  showSummary?: boolean;
  /** Callback when encounter starts */
  onEncounterStart?: (ghostId: string) => void;
  /** Callback when encounter state changes */
  onEncounterStateChange?: (ghostId: string, state: EncounterState) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main ghost encounter interface component
 */
export const GhostEncounterInterface: React.FC<GhostEncounterInterfaceProps> = ({
  roomKey,
  showSummary = true,
  onEncounterStart,
  onEncounterStateChange,
  className,
}) => {
  const gameState = useGameStore();
  const currentRoom = roomKey || gameState.currentRoom;
  
  const {
    availableGhosts,
    encounterStates,
    activeEncounter,
    roomStats,
    isLoading,
    error,
    startEncounter,
    updateEncounterState,
    refresh,
  } = useGhostEncounters({ roomKey: currentRoom });

  const [selectedGhostId, setSelectedGhostId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle encounter start with smooth transitions
  const handleStartEncounter = async (ghostId: string) => {
    try {
      setIsTransitioning(true);
      setSelectedGhostId(ghostId);
      
      await startEncounter(ghostId);
      
      // Notify parent component
      onEncounterStart?.(ghostId);
      
      // Add a brief delay for visual feedback
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      
    } catch (err) {
      console.error('Failed to start encounter:', err);
      setIsTransitioning(false);
    }
  };

  // Handle encounter state changes
  const handleEncounterStateChange = (ghostId: string, state: EncounterState) => {
    updateEncounterState(ghostId, state);
    onEncounterStateChange?.(ghostId, state);
  };

  // Handle ghost selection
  const handleGhostSelect = (ghostId: string) => {
    setSelectedGhostId(selectedGhostId === ghostId ? null : ghostId);
  };

  // Auto-select active encounter
  useEffect(() => {
    if (activeEncounter && !selectedGhostId) {
      setSelectedGhostId(activeEncounter.ghost.id);
    }
  }, [activeEncounter, selectedGhostId]);

  // Get room name for display
  const getRoomName = (roomKey: string) => {
    const roomNames: Record<string, string> = {
      'boot-sector': 'Boot Sector',
      'dependency-crypt': 'Dependency Crypt',
      'ghost-memory-heap': 'Ghost Memory Heap',
      'possessed-compiler': 'Possessed Compiler',
      'ethics-tribunal': 'Ethics Tribunal',
      'final-merge': 'Final Merge',
    };
    return roomNames[roomKey] || roomKey;
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        "bg-gray-900/50 border border-gray-700 rounded-lg",
        className
      )}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-gray-400">Loading ghosts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "p-6 bg-red-900/20 border border-red-700 rounded-lg",
        className
      )}>
        <div className="text-red-400 font-mono">
          <div className="font-bold mb-2">Error Loading Ghosts</div>
          <div className="text-sm">{error}</div>
          <Button
            variant="destructive"
            size="sm"
            className="mt-4"
            onClick={refresh}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Room summary */}
      {showSummary && (
        <GhostEncounterSummary
          stats={roomStats}
          roomName={getRoomName(currentRoom)}
        />
      )}

      {/* Active encounter display */}
      {activeEncounter && (
        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <GhostRenderer
              ghost={activeEncounter.ghost}
              state="active"
              size="md"
              showEffects={true}
              isSpeaking={activeEncounter.state === EncounterState.InDialogue}
            />
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">
                Active Encounter: {activeEncounter.ghost.name}
              </h3>
              <p className="text-blue-300 text-sm">
                State: {activeEncounter.state.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                {activeEncounter.ghost.description}
              </p>
            </div>
          </div>
          
          {/* Encounter controls */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEncounterStateChange(
                activeEncounter.ghost.id, 
                EncounterState.InDialogue
              )}
              disabled={activeEncounter.state === EncounterState.InDialogue}
            >
              Continue Dialogue
            </Button>
            <Button
              variant="horror"
              size="sm"
              onClick={() => handleEncounterStateChange(
                activeEncounter.ghost.id, 
                EncounterState.GeneratingPatch
              )}
              disabled={activeEncounter.state === EncounterState.GeneratingPatch}
            >
              Generate Patch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEncounterStateChange(
                activeEncounter.ghost.id, 
                EncounterState.Completed
              )}
            >
              End Encounter
            </Button>
          </div>
        </div>
      )}

      {/* Ghost encounter grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-xl font-mono">
            Available Encounters
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="text-gray-400 hover:text-white"
          >
            Refresh
          </Button>
        </div>
        
        <GhostEncounterGrid
          ghosts={availableGhosts}
          encounterStates={encounterStates}
          activeGhostId={selectedGhostId || undefined}
          onStartEncounter={handleStartEncounter}
          onGhostSelect={handleGhostSelect}
        />
      </div>

      {/* Selected ghost details */}
      {selectedGhostId && (
        <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          {(() => {
            const selectedGhost = availableGhosts.find(g => g.id === selectedGhostId);
            if (!selectedGhost) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <GhostRenderer
                    ghost={selectedGhost}
                    state="active"
                    size="lg"
                    showEffects={true}
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-2">
                      {selectedGhost.name}
                    </h3>
                    <p className="text-gray-300 mb-3">
                      {selectedGhost.description}
                    </p>
                    
                    {/* Ghost details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Software Smell:</div>
                        <div className="text-white font-mono">
                          {selectedGhost.softwareSmell.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Severity:</div>
                        <div className="text-white">{selectedGhost.severity}/10</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Difficulty:</div>
                        <div className="text-white">{selectedGhost.difficultyLevel}/10</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Est. Time:</div>
                        <div className="text-white">{selectedGhost.estimatedTime} min</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hints */}
                {selectedGhost.hints && selectedGhost.hints.length > 0 && (
                  <div>
                    <h4 className="text-white font-bold mb-2">Debugging Hints:</h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {selectedGhost.hints.map((hint, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Fix patterns */}
                {selectedGhost.fixPatterns && selectedGhost.fixPatterns.length > 0 && (
                  <div>
                    <h4 className="text-white font-bold mb-2">Available Fix Patterns:</h4>
                    <div className="space-y-2">
                      {selectedGhost.fixPatterns.map((pattern, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded border border-gray-600">
                          <div className="font-mono text-sm text-blue-300 mb-1">
                            {pattern.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            {pattern.description}
                          </div>
                          <div className="flex gap-4 text-xs text-gray-400">
                            <span>Risk: {(pattern.risk * 100).toFixed(0)}%</span>
                            <span>Stability: {pattern.stabilityEffect > 0 ? '+' : ''}{pattern.stabilityEffect}</span>
                            <span>Insight: {pattern.insightEffect > 0 ? '+' : ''}{pattern.insightEffect}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <div className="text-white font-mono">Starting encounter...</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for smaller spaces
 */
export const CompactGhostEncounterInterface: React.FC<{
  roomKey?: string;
  maxGhosts?: number;
  onEncounterStart?: (ghostId: string) => void;
  className?: string;
}> = ({ roomKey, maxGhosts = 4, onEncounterStart, className }) => {
  const { availableGhosts, encounterStates, startEncounter } = useGhostEncounters({ roomKey });
  
  const displayGhosts = availableGhosts.slice(0, maxGhosts);
  
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-white font-bold text-sm font-mono">Quick Encounters</h3>
      <div className="grid grid-cols-2 gap-2">
        {displayGhosts.map((ghost) => (
          <GhostEncounterCard
            key={ghost.id}
            ghost={ghost}
            encounterState={encounterStates[ghost.id] || EncounterState.NotStarted}
            onStartEncounter={onEncounterStart || startEncounter}
            className="text-xs"
          />
        ))}
      </div>
    </div>
  );
};