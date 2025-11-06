/**
 * useDialogue - Hook for managing dialogue interactions
 */

import { useState, useCallback, useEffect } from 'react';
import { DialogueEngine } from '../engine/DialogueEngine';
import { useGameStore } from '../store/gameStore';
import type { 
  DialogueSession, 
  DialogueResponse, 
  EducationalContent,
  Ghost 
} from '../types/dialogue';
import type { GameContext } from '../types/game';

interface UseDialogueReturn {
  activeSession: DialogueSession | null;
  isLoading: boolean;
  error: string | null;
  availableQuestions: string[];
  educationalContent: EducationalContent | undefined;
  
  // Actions
  startDialogue: (ghost: Ghost) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  endDialogue: () => void;
  clearError: () => void;
}

// Singleton dialogue engine instance
let dialogueEngine: DialogueEngine | null = null;

function getDialogueEngine(): DialogueEngine {
  if (!dialogueEngine) {
    dialogueEngine = new DialogueEngine();
  }
  return dialogueEngine;
}

export function useDialogue(): UseDialogueReturn {
  const gameStore = useGameStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<string[]>([]);
  const [educationalContent, setEducationalContent] = useState<EducationalContent | undefined>();

  // Get active session from store
  const activeSessions = Object.values(gameStore.activeSessions);
  const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;

  const engine = getDialogueEngine();

  // Update available questions when session changes
  useEffect(() => {
    if (activeSession) {
      const questions = engine.getAvailableQuestions(activeSession.id);
      setAvailableQuestions(questions);
    } else {
      setAvailableQuestions([]);
    }
  }, [activeSession, engine]);

  const startDialogue = useCallback(async (ghost: Ghost) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create game context
      const gameContext: GameContext = {
        gameState: {
          run: gameStore.run,
          currentRoom: gameStore.currentRoom,
          meters: gameStore.meters,
          unlockedRooms: gameStore.unlockedRooms,
          evidenceBoard: gameStore.evidenceBoard,
          playerChoices: gameStore.playerChoices,
          systemStates: gameStore.systemStates
        },
        currentRoom: { key: gameStore.currentRoom }, // Simplified room object
        activeGhost: ghost
      };

      // Start dialogue session
      const session = await engine.startDialogue(ghost, gameContext);
      
      // Store session in game store
      gameStore.setActiveSession(session);

      // Add evidence entry
      gameStore.addEvidenceEntry({
        type: 'ghost_encountered',
        description: `Started dialogue with ${ghost.name}`,
        context: {
          ghostId: ghost.id,
          ghostType: ghost.softwareSmell,
          roomId: gameStore.currentRoom
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start dialogue');
    } finally {
      setIsLoading(false);
    }
  }, [gameStore, engine]);

  const sendMessage = useCallback(async (message: string) => {
    if (!activeSession) {
      setError('No active dialogue session');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Process message through dialogue engine
      const response: DialogueResponse = await engine.processPlayerInput(
        activeSession.id, 
        message
      );

      // Update session in store
      const updatedSession = engine.getSession(activeSession.id);
      if (updatedSession) {
        gameStore.setActiveSession(updatedSession);
      }

      // Update available questions
      setAvailableQuestions(response.availableQuestions);

      // Update educational content
      if (response.educationalContent) {
        setEducationalContent(response.educationalContent);
      }

      // Apply any meter effects
      if (response.effects) {
        gameStore.updateMeters(response.effects);
        
        // Add evidence entry for meter changes
        gameStore.addEvidenceEntry({
          type: 'meter_change',
          description: response.effects.description,
          context: {
            dialogueSessionId: activeSession.id,
            playerMessage: message
          },
          effects: response.effects
        });
      }

      // Add player choice entry
      gameStore.addPlayerChoice({
        roomId: gameStore.currentRoom,
        ghostId: activeSession.ghostId,
        action: 'question',
        intent: message,
        outcome: response.message.content
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, gameStore, engine]);

  const endDialogue = useCallback(() => {
    if (!activeSession) return;

    try {
      // End dialogue in engine
      engine.endDialogue(activeSession.id);

      // Remove from store
      gameStore.removeActiveSession(activeSession.id);

      // Add evidence entry
      gameStore.addEvidenceEntry({
        type: 'ghost_encountered',
        description: `Ended dialogue with ghost`,
        context: {
          dialogueSessionId: activeSession.id,
          duration: Date.now() - activeSession.startedAt.getTime(),
          messageCount: activeSession.messages.length,
          educationalTopics: activeSession.educationalTopics
        }
      });

      // Clear state
      setAvailableQuestions([]);
      setEducationalContent(undefined);
      setError(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end dialogue');
    }
  }, [activeSession, gameStore, engine]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    activeSession,
    isLoading,
    error,
    availableQuestions,
    educationalContent,
    startDialogue,
    sendMessage,
    endDialogue,
    clearError
  };
}