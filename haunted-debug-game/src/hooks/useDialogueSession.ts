/**
 * useDialogueSession - Hook for managing dialogue sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { DialogueEngine } from '@/engine/DialogueEngine';
import { useGameStore } from '@/store/gameStore';
import type { DialogueSession, DialogueMessage, EducationalContent } from '@/types/dialogue';
import type { Ghost } from '@/types/content';

interface UseDialogueSessionReturn {
  session: DialogueSession | null;
  isLoading: boolean;
  error: string | null;
  startDialogue: (ghost: Ghost) => Promise<DialogueSession>;
  sendMessage: (message: string) => Promise<void>;
  endDialogue: () => void;
  getAvailableQuestions: () => string[];
  getEducationalContent: () => EducationalContent | null;
}

export function useDialogueSession(sessionId?: string): UseDialogueSessionReturn {
  const gameStore = useGameStore();
  const [dialogueEngine] = useState(() => new DialogueEngine());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<string[]>([]);
  const [educationalContent, setEducationalContent] = useState<EducationalContent | null>(null);

  // Get current session from store
  const session = sessionId ? gameStore.activeSessions[sessionId] : null;

  // Update available questions based on session state
  useEffect(() => {
    if (session) {
      updateAvailableQuestions(session);
      updateEducationalContent(session);
    }
  }, [session]);

  const updateAvailableQuestions = (currentSession: DialogueSession) => {
    // Generate contextual questions based on dialogue progress
    const questions: string[] = [];
    
    if (currentSession.messages.length === 0) {
      questions.push(
        "What kind of problem are you causing?",
        "How did you end up in this code?",
        "What would happen if I ignore you?"
      );
    } else {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      
      if (lastMessage.sender === 'ghost') {
        questions.push(
          "Can you show me the problematic code?",
          "What's the best way to fix this?",
          "Are there any risks I should know about?",
          "How urgent is this problem?"
        );
      }
    }

    // Add ghost-specific questions
    if (currentSession.context.ghost) {
      const ghost = currentSession.context.ghost;
      
      if (ghost.softwareSmell === 'circular_dependency') {
        questions.push(
          "Which modules are creating the circular dependency?",
          "How can I break this dependency cycle?"
        );
      } else if (ghost.softwareSmell === 'memory_leak') {
        questions.push(
          "Where is the memory being leaked?",
          "What's not being cleaned up properly?"
        );
      } else if (ghost.softwareSmell === 'code_duplication') {
        questions.push(
          "Where is the code duplicated?",
          "How can I extract the common functionality?"
        );
      }
    }

    setAvailableQuestions(questions);
  };

  const updateEducationalContent = (currentSession: DialogueSession) => {
    if (!currentSession.context.ghost) return;

    const ghost = currentSession.context.ghost;
    
    const content: EducationalContent = {
      concept: getSoftwareSmellConcept(ghost.softwareSmell),
      explanation: getSoftwareSmellExplanation(ghost.softwareSmell),
      examples: getSoftwareSmellExamples(ghost.softwareSmell),
      bestPractices: getSoftwareSmellBestPractices(ghost.softwareSmell),
      relatedConcepts: getRelatedConcepts(ghost.softwareSmell),
      difficulty: ghost.difficultyLevel,
      estimatedTime: ghost.estimatedTime
    };

    setEducationalContent(content);
  };

  const getSoftwareSmellConcept = (smell: string): string => {
    const concepts: Record<string, string> = {
      'circular_dependency': 'Circular Dependencies',
      'memory_leak': 'Memory Leaks',
      'code_duplication': 'Code Duplication',
      'large_class': 'Large Class',
      'long_method': 'Long Method',
      'dead_code': 'Dead Code'
    };
    return concepts[smell] || 'Software Quality Issue';
  };

  const getSoftwareSmellExplanation = (smell: string): string => {
    const explanations: Record<string, string> = {
      'circular_dependency': 'Circular dependencies occur when two or more modules depend on each other directly or indirectly, creating a cycle that makes the code harder to understand, test, and maintain.',
      'memory_leak': 'Memory leaks happen when allocated memory is not properly released, causing the application to consume more and more memory over time, potentially leading to performance issues or crashes.',
      'code_duplication': 'Code duplication violates the DRY (Don\'t Repeat Yourself) principle, making the codebase harder to maintain because changes need to be made in multiple places.',
      'large_class': 'Large classes often violate the Single Responsibility Principle by trying to do too many things, making them hard to understand, test, and maintain.',
      'long_method': 'Long methods are difficult to understand and maintain because they try to do too many things at once, violating the principle of keeping functions focused and concise.',
      'dead_code': 'Dead code refers to parts of the codebase that are never executed or used, adding unnecessary complexity and maintenance burden.'
    };
    return explanations[smell] || 'This is a common software quality issue that affects code maintainability.';
  };

  const getSoftwareSmellExamples = (smell: string): string[] => {
    const examples: Record<string, string[]> = {
      'circular_dependency': [
        'Module A imports Module B, which imports Module A',
        'Component depends on service, service depends on component',
        'Utility functions that reference each other in a loop'
      ],
      'memory_leak': [
        'Event listeners not removed when component unmounts',
        'Timers or intervals not cleared',
        'DOM references held after elements are removed'
      ],
      'code_duplication': [
        'Same validation logic copied across multiple forms',
        'Identical error handling in multiple functions',
        'Repeated data transformation code'
      ],
      'large_class': [
        'A class with hundreds of lines and dozens of methods',
        'A component handling multiple unrelated responsibilities',
        'A service managing different types of data operations'
      ]
    };
    return examples[smell] || ['Common patterns that reduce code quality'];
  };

  const getSoftwareSmellBestPractices = (smell: string): string[] => {
    const practices: Record<string, string[]> = {
      'circular_dependency': [
        'Use dependency injection to invert dependencies',
        'Extract common interfaces to break cycles',
        'Reorganize code into layers with clear dependency direction'
      ],
      'memory_leak': [
        'Always clean up event listeners in cleanup functions',
        'Clear timers and intervals when no longer needed',
        'Use weak references for caches and observers'
      ],
      'code_duplication': [
        'Extract common functionality into reusable functions',
        'Use composition over inheritance',
        'Create utility modules for shared logic'
      ],
      'large_class': [
        'Follow the Single Responsibility Principle',
        'Break large classes into smaller, focused ones',
        'Use composition to combine behaviors'
      ]
    };
    return practices[smell] || ['Follow established software engineering principles'];
  };

  const getRelatedConcepts = (smell: string): string[] => {
    const concepts: Record<string, string[]> = {
      'circular_dependency': ['Dependency Injection', 'Inversion of Control', 'Layered Architecture'],
      'memory_leak': ['Garbage Collection', 'Resource Management', 'Component Lifecycle'],
      'code_duplication': ['DRY Principle', 'Refactoring', 'Code Reuse'],
      'large_class': ['Single Responsibility Principle', 'Composition', 'Modular Design']
    };
    return concepts[smell] || ['Software Engineering Principles'];
  };

  const startDialogue = useCallback(async (ghost: Ghost): Promise<DialogueSession> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await dialogueEngine.startDialogue(ghost, {
        gameState: {
          run: gameStore.run,
          currentRoom: gameStore.currentRoom,
          meters: gameStore.meters,
          unlockedRooms: gameStore.unlockedRooms,
          evidenceBoard: gameStore.evidenceBoard,
          playerChoices: gameStore.playerChoices,
          systemStates: gameStore.systemStates
        },
        currentRoom: gameStore.currentRoom,
        playerIntent: '',
        activeGhost: ghost
      });

      // Store session in game store
      gameStore.setActiveSession(session);

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start dialogue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dialogueEngine, gameStore]);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!session) {
      throw new Error('No active dialogue session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await dialogueEngine.processMessage(session.id, message);
      
      // Update session in store
      gameStore.updateSession(session.id, {
        messages: [...session.messages, response.userMessage, response.ghostResponse],
        isReadyForDebugging: response.isReadyForDebugging,
        educationalTopics: [...session.educationalTopics, ...response.educationalTopics]
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, dialogueEngine, gameStore]);

  const endDialogue = useCallback(() => {
    if (session) {
      // Add evidence entry for completed dialogue
      gameStore.addEvidenceEntry({
        type: 'ghost_encountered',
        description: `Completed conversation with ${session.context.ghost?.name}`,
        context: { 
          roomKey: gameStore.currentRoom,
          ghostId: session.ghostId,
          ghostName: session.context.ghost?.name
        },
        effects: { stability: 0, insight: 2, description: 'Dialogue completed' }
      });

      // Remove session from store
      gameStore.removeActiveSession(session.id);
    }
  }, [session, gameStore]);

  const getAvailableQuestions = useCallback((): string[] => {
    return availableQuestions;
  }, [availableQuestions]);

  const getEducationalContent = useCallback((): EducationalContent | null => {
    return educationalContent;
  }, [educationalContent]);

  return {
    session,
    isLoading,
    error,
    startDialogue,
    sendMessage,
    endDialogue,
    getAvailableQuestions,
    getEducationalContent
  };
}