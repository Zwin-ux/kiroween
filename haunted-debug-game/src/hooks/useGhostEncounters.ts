/**
 * useGhostEncounters Hook - Manages ghost encounter state and interactions
 * 
 * Provides a React interface to the GhostSelectionSystem with state management
 * and integration with the game store.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GhostSelectionSystem, type EncounterableGhost, type GhostEncounter, EncounterState } from '@/engine/GhostSelectionSystem';
import type { Ghost } from '@/types/ghost';
import { SoftwareSmell } from '@/types/ghost';

export interface UseGhostEncountersOptions {
  /** Room key to filter ghosts by */
  roomKey?: string;
  /** Whether to auto-load ghosts on mount */
  autoLoad?: boolean;
}

export interface UseGhostEncountersReturn {
  /** Available ghosts in the current room */
  availableGhosts: EncounterableGhost[];
  /** Map of ghost IDs to their encounter states */
  encounterStates: Record<string, EncounterState>;
  /** Currently active encounter */
  activeEncounter: GhostEncounter | null;
  /** Room encounter statistics */
  roomStats: {
    total: number;
    available: number;
    completed: number;
    inProgress: number;
  };
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Start a new ghost encounter */
  startEncounter: (ghostId: string) => Promise<void>;
  /** Update encounter state */
  updateEncounterState: (ghostId: string, state: EncounterState) => void;
  /** Get encounter by ghost ID */
  getEncounter: (ghostId: string) => GhostEncounter | undefined;
  /** Check if ghost is available */
  isGhostAvailable: (ghostId: string) => boolean;
  /** Refresh ghost data */
  refresh: () => void;
}

/**
 * Hook for managing ghost encounters
 */
export const useGhostEncounters = (options: UseGhostEncountersOptions = {}): UseGhostEncountersReturn => {
  const { roomKey, autoLoad = true } = options;
  
  // Game store state
  const gameState = useGameStore();
  const currentRoom = roomKey || gameState.currentRoom;
  
  // Local state
  const [ghostSelectionSystem, setGhostSelectionSystem] = useState<GhostSelectionSystem | null>(null);
  const [availableGhosts, setAvailableGhosts] = useState<EncounterableGhost[]>([]);
  const [encounterStates, setEncounterStates] = useState<Record<string, EncounterState>>({});
  const [activeEncounter, setActiveEncounter] = useState<GhostEncounter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize ghost selection system
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Load ghosts from game configuration
        // For now, we'll use a mock ghost list
        const mockGhosts: Ghost[] = [
          {
            id: 'circular_dependency_ghost',
            name: 'Circular Dependency Specter',
            severity: 6,
            description: 'A ghost trapped in endless import loops, unable to resolve its dependencies.',
            softwareSmell: SoftwareSmell.CircularDependency,
            manifestation: {
              visual: 'Swirling code fragments forming endless loops',
              audio: 'Echoing import statements',
              behavior: 'Speaks in circular references'
            },
            dialoguePrompts: [
              'I am trapped... my imports lead nowhere...',
              'Can you break the cycle that binds me?',
              'The dependencies... they go round and round...'
            ],
            fixPatterns: [
              {
                type: 'dependency_injection',
                description: 'Break circular dependencies using dependency injection',
                risk: 0.4,
                stabilityEffect: 15,
                insightEffect: 10
              }
            ],
            hints: [
              'Look for circular import chains',
              'Consider using interfaces to break dependencies',
              'Dependency injection can help decouple modules'
            ],
            rooms: ['dependency-crypt', 'possessed-compiler']
          },
          {
            id: 'memory_leak_ghost',
            name: 'Memory Leak Phantom',
            severity: 7,
            description: 'A ghost that hoards memory, never releasing what it has claimed.',
            softwareSmell: SoftwareSmell.MemoryLeak,
            manifestation: {
              visual: 'Translucent figure clutching floating memory blocks',
              audio: 'Whispers of forgotten allocations',
              behavior: 'Refuses to let go of resources'
            },
            dialoguePrompts: [
              'Mine... all mine... I will never let go...',
              'These memories... they sustain me...',
              'Why should I release what I have claimed?'
            ],
            fixPatterns: [
              {
                type: 'resource_cleanup',
                description: 'Implement proper resource cleanup and lifecycle management',
                risk: 0.3,
                stabilityEffect: 20,
                insightEffect: 8
              }
            ],
            hints: [
              'Check for event listeners that are never removed',
              'Look for objects that prevent garbage collection',
              'Implement proper cleanup in component lifecycle'
            ],
            rooms: ['ghost-memory-heap', 'possessed-compiler']
          }
        ];
        
        const system = new GhostSelectionSystem(mockGhosts);
        setGhostSelectionSystem(system);
        
        if (autoLoad) {
          loadGhostsForRoom(system, currentRoom);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize ghost system');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSystem();
  }, [autoLoad, currentRoom]);

  // Load ghosts for current room
  const loadGhostsForRoom = useCallback((system: GhostSelectionSystem, room: string) => {
    try {
      const ghosts = system.getAvailableGhosts(room);
      setAvailableGhosts(ghosts);
      
      // Update encounter states
      const states: Record<string, EncounterState> = {};
      ghosts.forEach(ghost => {
        states[ghost.id] = system.getEncounterState(ghost.id);
      });
      setEncounterStates(states);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ghosts');
    }
  }, []);

  // Refresh ghost data when room changes
  useEffect(() => {
    if (ghostSelectionSystem && currentRoom) {
      loadGhostsForRoom(ghostSelectionSystem, currentRoom);
    }
  }, [ghostSelectionSystem, currentRoom, loadGhostsForRoom]);

  // Start encounter function
  const startEncounter = useCallback(async (ghostId: string) => {
    if (!ghostSelectionSystem) {
      throw new Error('Ghost selection system not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const encounter = await ghostSelectionSystem.startEncounter(ghostId);
      setActiveEncounter(encounter);
      
      // Update encounter state
      setEncounterStates(prev => ({
        ...prev,
        [ghostId]: encounter.state
      }));
      
      // Add evidence entry
      gameState.addEvidenceEntry({
        type: 'ghost_encountered',
        description: `Started encounter with ${encounter.ghost.name}`,
        context: {
          ghostId: encounter.ghost.id,
          ghostName: encounter.ghost.name,
          roomKey: currentRoom,
          severity: encounter.ghost.severity
        }
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start encounter');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [ghostSelectionSystem, gameState, currentRoom]);

  // Update encounter state function
  const updateEncounterState = useCallback((ghostId: string, state: EncounterState) => {
    if (!ghostSelectionSystem) return;
    
    ghostSelectionSystem.updateEncounterState(ghostId, state);
    setEncounterStates(prev => ({
      ...prev,
      [ghostId]: state
    }));
    
    // Update active encounter if it matches
    if (activeEncounter?.ghost.id === ghostId) {
      setActiveEncounter(prev => prev ? { ...prev, state } : null);
    }
  }, [ghostSelectionSystem, activeEncounter]);

  // Get encounter function
  const getEncounter = useCallback((ghostId: string) => {
    return ghostSelectionSystem?.getEncounter(ghostId);
  }, [ghostSelectionSystem]);

  // Check if ghost is available
  const isGhostAvailable = useCallback((ghostId: string) => {
    if (!ghostSelectionSystem) return false;
    
    const ghost = availableGhosts.find(g => g.id === ghostId);
    return ghost ? ghostSelectionSystem.isGhostAvailable(ghost, currentRoom, gameState) : false;
  }, [ghostSelectionSystem, availableGhosts, currentRoom, gameState]);

  // Refresh function
  const refresh = useCallback(() => {
    if (ghostSelectionSystem) {
      loadGhostsForRoom(ghostSelectionSystem, currentRoom);
    }
  }, [ghostSelectionSystem, currentRoom, loadGhostsForRoom]);

  // Calculate room statistics
  const roomStats = useMemo(() => {
    if (!ghostSelectionSystem) {
      return { total: 0, available: 0, completed: 0, inProgress: 0 };
    }
    
    return ghostSelectionSystem.getRoomEncounterStats(currentRoom);
  }, [ghostSelectionSystem, currentRoom, encounterStates]);

  return {
    availableGhosts,
    encounterStates,
    activeEncounter,
    roomStats,
    isLoading,
    error,
    startEncounter,
    updateEncounterState,
    getEncounter,
    isGhostAvailable,
    refresh,
  };
};

/**
 * Hook for managing a single ghost encounter
 */
export const useGhostEncounter = (ghostId: string) => {
  const { 
    getEncounter, 
    updateEncounterState, 
    encounterStates, 
    startEncounter 
  } = useGhostEncounters();
  
  const encounter = getEncounter(ghostId);
  const state = encounterStates[ghostId] || EncounterState.NotStarted;
  
  const start = useCallback(() => startEncounter(ghostId), [startEncounter, ghostId]);
  const updateState = useCallback((newState: EncounterState) => 
    updateEncounterState(ghostId, newState), [updateEncounterState, ghostId]);
  
  return {
    encounter,
    state,
    start,
    updateState,
  };
};