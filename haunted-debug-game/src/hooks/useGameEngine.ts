/**
 * useGameEngine - Hook for interacting with the game engine
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngineImpl, type GameEngineConfig } from '@/engine/GameEngine';
import { useGameStore } from '@/store/gameStore';
import type { MCPTools } from '@/types/kiro';
import type { EncounterSession, PlayerAction, ActionResult } from '@/types/encounter';
import type { NavigationResult } from '@/types/navigation';
import type { GameState, GameContext } from '@/types/game';
import type { Ghost } from '@/types/content';

interface UseGameEngineReturn {
  gameEngine: GameEngineImpl;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  startEncounter: (ghostId: string) => Promise<EncounterSession>;
  processPlayerAction: (action: PlayerAction) => Promise<ActionResult>;
  navigateToRoom: (roomId: string) => Promise<NavigationResult>;
  saveGameState: () => Promise<void>;
  loadGameState: () => Promise<GameState>;
  getGameContext: () => GameContext | null;
  getGhost: (ghostId: string) => Promise<Ghost | null>;
  shutdown: () => Promise<void>;
}

export function useGameEngine(): UseGameEngineReturn {
  const gameStore = useGameStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to maintain stable game engine instance
  const gameEngineRef = useRef<GameEngineImpl | null>(null);

  // Initialize game engine if not already created
  useEffect(() => {
    if (!gameEngineRef.current) {
      // Create MCP tools mock for now
      const mcpTools: MCPTools = {
        generateDialogue: async (context: any) => {
          // Mock implementation
          return {
            message: "Hello, I am a haunted code module. What brings you to my domain?",
            options: ["Tell me about this code smell", "How can I fix this?", "What's the risk?"],
            educationalContent: {
              concept: "Software Smells",
              explanation: "Software smells are indicators of deeper problems in code structure.",
              examples: ["Long methods", "Duplicate code", "Large classes"],
              bestPractices: ["Keep methods small", "Extract common functionality", "Follow single responsibility"]
            }
          };
        },
        
        generatePatch: async (intent: string, context: any) => {
          // Mock implementation
          return {
            id: `patch_${Date.now()}`,
            title: "Fix Software Smell",
            description: `Patch to address: ${intent}`,
            changes: [
              {
                file: "example.ts",
                oldCode: "// Original problematic code",
                newCode: "// Fixed code",
                explanation: "This change improves code quality"
              }
            ],
            risk: 0.3,
            complexity: 0.5,
            stabilityEffect: 10,
            insightEffect: 5,
            educationalNotes: "This patch demonstrates good refactoring practices."
          };
        },
        
        validatePatch: async (patch: any) => {
          // Mock implementation
          return {
            isValid: true,
            issues: [],
            suggestions: ["Consider adding unit tests", "Update documentation"]
          };
        }
      };

      const config: GameEngineConfig = {
        mcpTools,
        enableEffects: true,
        enableAudio: true,
        debugMode: process.env.NODE_ENV === 'development'
      };

      gameEngineRef.current = new GameEngineImpl(config);
    }
  }, []);

  const initialize = useCallback(async () => {
    if (!gameEngineRef.current || isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      await gameEngineRef.current.initialize();
      setIsInitialized(true);
      
      // Load game state into store
      const gameState = await gameEngineRef.current.loadGameState();
      gameStore.syncSystemStates(gameState.systemStates);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game engine';
      setError(errorMessage);
      console.error('Game engine initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, gameStore]);

  const startEncounter = useCallback(async (ghostId: string): Promise<EncounterSession> => {
    if (!gameEngineRef.current || !isInitialized) {
      throw new Error('Game engine not initialized');
    }

    try {
      const session = await gameEngineRef.current.startEncounter(ghostId);
      
      // Update game store with encounter state
      gameStore.updateEncounterOrchestratorState({
        activeEncounters: {
          [ghostId]: session
        }
      });

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start encounter';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized, gameStore]);

  const processPlayerAction = useCallback(async (action: PlayerAction): Promise<ActionResult> => {
    if (!gameEngineRef.current || !isInitialized) {
      throw new Error('Game engine not initialized');
    }

    try {
      const result = await gameEngineRef.current.processPlayerAction(action);
      
      // Update game store based on result
      if (result.effects) {
        gameStore.updateMeters(result.effects);
      }

      // Add evidence entry for the action
      gameStore.addEvidenceEntry({
        type: action.type === 'patch_action' ? 'patch_applied' : 'ghost_encountered',
        description: result.message || `Processed ${action.type}`,
        context: { 
          roomKey: gameStore.currentRoom,
          ghostId: action.sessionId || '',
          actionType: action.type
        },
        effects: result.effects
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process action';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized, gameStore]);

  const navigateToRoom = useCallback(async (roomId: string): Promise<NavigationResult> => {
    if (!gameEngineRef.current || !isInitialized) {
      throw new Error('Game engine not initialized');
    }

    try {
      const result = await gameEngineRef.current.navigateToRoom(roomId);
      
      if (result.success) {
        // Update navigation state in store
        gameStore.updateNavigationState({
          currentRoomId: roomId,
          roomTransitionHistory: [
            ...gameStore.systemStates.navigation.roomTransitionHistory,
            {
              fromRoom: gameStore.currentRoom,
              toRoom: roomId,
              timestamp: new Date()
            }
          ]
        });

        // Add evidence entry for room change
        gameStore.addEvidenceEntry({
          type: 'room_entered',
          description: `Entered ${roomId}`,
          context: { 
            roomKey: roomId,
            previousRoom: gameStore.currentRoom
          },
          effects: { stability: 0, insight: 0, description: 'Room navigation' }
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to navigate to room';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized, gameStore]);

  const saveGameState = useCallback(async (): Promise<void> => {
    if (!gameEngineRef.current || !isInitialized) {
      throw new Error('Game engine not initialized');
    }

    try {
      await gameEngineRef.current.saveGameState();
      await gameStore.saveCurrentSession();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save game state';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized, gameStore]);

  const loadGameState = useCallback(async (): Promise<GameState> => {
    if (!gameEngineRef.current || !isInitialized) {
      throw new Error('Game engine not initialized');
    }

    try {
      return await gameEngineRef.current.loadGameState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game state';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized]);

  const getGameContext = useCallback((): GameContext | null => {
    if (!gameEngineRef.current || !isInitialized) {
      return null;
    }

    try {
      return gameEngineRef.current.getGameContext();
    } catch (err) {
      console.error('Failed to get game context:', err);
      return null;
    }
  }, [isInitialized]);

  const getGhost = useCallback(async (ghostId: string): Promise<Ghost | null> => {
    // Mock implementation - in real app this would come from GhostManager
    const mockGhosts: Record<string, Ghost> = {
      'circular-dependency-ghost': {
        id: 'circular-dependency-ghost',
        name: 'Circular Dependency Specter',
        description: 'A ghost trapped in an endless loop of module imports',
        softwareSmell: 'circular_dependency',
        severity: 7,
        difficultyLevel: 6,
        estimatedTime: 15,
        hints: [
          'Look for modules that import each other',
          'Consider using dependency injection',
          'Break the cycle with interfaces or events'
        ],
        fixPatterns: [
          {
            type: 'extract_interface',
            description: 'Extract common interface to break dependency cycle',
            risk: 0.3,
            stabilityEffect: 15,
            insightEffect: 10
          }
        ]
      }
    };

    return mockGhosts[ghostId] || null;
  }, []);

  const shutdown = useCallback(async (): Promise<void> => {
    if (!gameEngineRef.current) return;

    try {
      await gameEngineRef.current.shutdown();
      setIsInitialized(false);
    } catch (err) {
      console.error('Failed to shutdown game engine:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameEngineRef.current && isInitialized) {
        shutdown();
      }
    };
  }, [isInitialized, shutdown]);

  return {
    gameEngine: gameEngineRef.current!,
    isInitialized,
    isLoading,
    error,
    initialize,
    startEncounter,
    processPlayerAction,
    navigateToRoom,
    saveGameState,
    loadGameState,
    getGameContext,
    getGhost,
    shutdown
  };
}