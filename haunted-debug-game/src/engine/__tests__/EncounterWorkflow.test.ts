/**
 * Complete Encounter Workflow Tests
 * Tests full encounter flow from ghost selection to completion
 * Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { GameEngine } from './__mocks__/GameEngine';
import { EventManagerImpl } from '../EventManager';
import { SessionManagerImpl } from '../SessionManager';
import type { Ghost, Room } from '@/types/content';
import type { GameState } from '@/types/game';

describe('Complete Encounter Workflow', () => {
  let gameEngine: GameEngine;
  let encounterOrchestrator: any;
  let dialogueEngine: any;
  let patchSystem: any;
  let effectCoordinator: any;
  let eventManager: EventManagerImpl;
  let sessionManager: SessionManagerImpl;

  const mockGhost: Ghost = {
    id: 'circular-dependency-ghost',
    name: 'The Circular Specter',
    description: 'A ghost trapped in endless loops of dependency',
    softwareSmell: 'circular-dependencies',
    personality: 'confused',
    backstory: 'Once a well-structured module, now lost in circular imports',
    codeContext: {
      language: 'typescript',
      framework: 'react',
      problemArea: 'component-dependencies',
      complexity: 'medium'
    },
    dialogueStyle: 'technical',
    roomId: 'dependency-crypt'
  };

  const mockRoom: Room = {
    key: 'dependency-crypt',
    name: 'Dependency Crypt',
    description: 'A dark chamber where circular dependencies lurk',
    ghosts: ['circular-dependency-ghost'],
    unlockConditions: [],
    isUnlocked: true,
    backgroundAsset: 'crypt-bg.jpg',
    ambientSound: 'crypt-ambient.mp3'
  };

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Initialize core systems
    eventManager = new EventManagerImpl();
    sessionManager = new SessionManagerImpl(eventManager);
    
    // Create game engine with all systems
    gameEngine = new GameEngine();
    await gameEngine.initialize();
    
    // Get initialized systems
    encounterOrchestrator = gameEngine.getEncounterOrchestrator();
    dialogueEngine = gameEngine.getDialogueEngine();
    patchSystem = gameEngine.getPatchSystem();
    effectCoordinator = gameEngine.getEffectCoordinator();
  });

  afterEach(async () => {
    await gameEngine.shutdown();
    eventManager.cleanup();
    sessionManager.cleanup();
  });

  describe('Full Encounter Flow', () => {
    test('should complete full encounter from start to finish', async () => {
      // 1. Start encounter
      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      expect(encounterSession).toBeDefined();
      expect(encounterSession.ghostId).toBe(mockGhost.id);
      expect(encounterSession.roomId).toBe(mockRoom.key);
      expect(encounterSession.currentPhase).toBe('dialogue');

      // 2. Initiate dialogue
      const dialogueSession = await dialogueEngine.startDialogue(mockGhost, {
        playerContext: 'I need to understand this circular dependency issue',
        roomContext: mockRoom.description
      });

      expect(dialogueSession).toBeDefined();
      expect(dialogueSession.ghostId).toBe(mockGhost.id);
      expect(dialogueSession.messages).toHaveLength(1); // Initial ghost message

      // 3. Player makes dialogue choice
      const dialogueChoice = {
        text: 'Can you show me where the circular dependency occurs?',
        intent: 'investigate-problem',
        type: 'question' as const
      };

      const dialogueResult = await encounterOrchestrator.processDialogueChoice(
        encounterSession.id,
        dialogueChoice
      );

      expect(dialogueResult.success).toBe(true);
      expect(dialogueResult.ghostResponse).toBeDefined();
      expect(dialogueResult.shouldGeneratePatches).toBe(true);

      // 4. Generate patch options
      const patchOptions = await encounterOrchestrator.generatePatchOptions(
        dialogueChoice.intent,
        mockGhost
      );

      expect(patchOptions).toHaveLength(3); // Apply, Refactor, Question
      expect(patchOptions.some(p => p.action === 'apply')).toBe(true);
      expect(patchOptions.some(p => p.action === 'refactor')).toBe(true);
      expect(patchOptions.some(p => p.action === 'question')).toBe(true);

      // 5. Apply patch choice
      const selectedPatch = patchOptions.find(p => p.action === 'apply')!;
      const patchResult = await encounterOrchestrator.applyPatchChoice(
        selectedPatch.id,
        'apply'
      );

      expect(patchResult.success).toBe(true);
      expect(patchResult.consequences).toBeDefined();
      expect(patchResult.meterChanges).toBeDefined();

      // 6. Complete encounter
      const encounterOutcome = await encounterOrchestrator.completeEncounter(
        encounterSession.id
      );

      expect(encounterOutcome.success).toBe(true);
      expect(encounterOutcome.completedAt).toBeDefined();
      expect(encounterOutcome.totalDuration).toBeGreaterThan(0);
      expect(encounterOutcome.learningPoints).toHaveLength(1);
    });

    test('should handle dialogue progression correctly', async () => {
      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      // Start dialogue
      const dialogueSession = await dialogueEngine.startDialogue(mockGhost, {
        playerContext: 'I want to learn about circular dependencies'
      });

      // Make multiple dialogue choices
      const choices = [
        { text: 'What causes circular dependencies?', intent: 'understand-cause', type: 'question' as const },
        { text: 'How can I detect them?', intent: 'learn-detection', type: 'question' as const },
        { text: 'Show me how to fix this', intent: 'request-solution', type: 'action' as const }
      ];

      for (const choice of choices) {
        const result = await encounterOrchestrator.processDialogueChoice(
          encounterSession.id,
          choice
        );

        expect(result.success).toBe(true);
        expect(result.ghostResponse).toBeDefined();
        
        // Check dialogue session progression
        const updatedSession = await dialogueEngine.getSession(dialogueSession.id);
        expect(updatedSession.messages.length).toBeGreaterThan(1);
      }
    });

    test('should integrate effects with encounter events', async () => {
      const effectsSpy = jest.spyOn(effectCoordinator, 'processGameEvent');
      
      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      // Verify encounter start triggered effects
      expect(effectsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'encounter_started',
          data: expect.objectContaining({
            ghostId: mockGhost.id,
            roomId: mockRoom.key
          })
        })
      );

      // Make a risky patch choice
      const dialogueSession = await dialogueEngine.startDialogue(mockGhost, {});
      const patchOptions = await encounterOrchestrator.generatePatchOptions(
        'apply-quick-fix',
        mockGhost
      );

      const riskyPatch = patchOptions.find(p => p.action === 'apply')!;
      await encounterOrchestrator.applyPatchChoice(riskyPatch.id, 'apply');

      // Verify patch application triggered effects
      expect(effectsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'patch_applied',
          data: expect.objectContaining({
            patchId: riskyPatch.id,
            action: 'apply'
          })
        })
      );

      effectsSpy.mockRestore();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle dialogue engine errors gracefully', async () => {
      // Mock dialogue engine to throw error
      const originalStartDialogue = dialogueEngine.startDialogue;
      dialogueEngine.startDialogue = jest.fn().mockRejectedValue(new Error('Dialogue service unavailable'));

      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      // Should handle error and provide fallback
      expect(encounterSession.currentPhase).toBe('error');
      expect(encounterSession.errorState).toBeDefined();
      expect(encounterSession.errorState?.canRecover).toBe(true);

      // Restore original method
      dialogueEngine.startDialogue = originalStartDialogue;
    });

    test('should recover from patch generation failures', async () => {
      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      // Mock patch system to fail
      const originalGenerate = patchSystem.generatePatchOptions;
      patchSystem.generatePatchOptions = jest.fn().mockRejectedValue(new Error('Patch generation failed'));

      const dialogueChoice = {
        text: 'Fix this issue',
        intent: 'apply-fix',
        type: 'action' as const
      };

      const result = await encounterOrchestrator.processDialogueChoice(
        encounterSession.id,
        dialogueChoice
      );

      // Should provide fallback patch options
      expect(result.success).toBe(true);
      expect(result.fallbackPatches).toBeDefined();
      expect(result.fallbackPatches).toHaveLength(3);

      // Restore original method
      patchSystem.generatePatchOptions = originalGenerate;
    });

    test('should handle system communication failures', async () => {
      // Mock event manager to fail
      const originalEmit = eventManager.emit;
      eventManager.emit = jest.fn().mockImplementation(() => {
        throw new Error('Event system failure');
      });

      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      // Should still create encounter despite event system failure
      expect(encounterSession).toBeDefined();
      expect(encounterSession.ghostId).toBe(mockGhost.id);

      // Restore original method
      eventManager.emit = originalEmit;
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent state across encounter phases', async () => {
      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      const initialState = gameEngine.getGameState();
      
      // Progress through encounter phases
      const dialogueSession = await dialogueEngine.startDialogue(mockGhost, {});
      const afterDialogueState = gameEngine.getGameState();
      
      // State should be updated but consistent
      expect(afterDialogueState.activeEncounters[encounterSession.id]).toBeDefined();
      expect(afterDialogueState.meters.stability).toBe(initialState.meters.stability);
      expect(afterDialogueState.meters.insight).toBe(initialState.meters.insight);

      // Apply patch and check state consistency
      const patchOptions = await encounterOrchestrator.generatePatchOptions('fix-issue', mockGhost);
      const patchResult = await encounterOrchestrator.applyPatchChoice(
        patchOptions[0].id,
        'apply'
      );

      const afterPatchState = gameEngine.getGameState();
      
      // Meters should be updated
      expect(afterPatchState.meters.stability).not.toBe(initialState.meters.stability);
      expect(afterPatchState.meters.insight).not.toBe(initialState.meters.insight);
      
      // Evidence board should be updated
      expect(afterPatchState.evidenceBoard.entries.length).toBeGreaterThan(
        initialState.evidenceBoard.entries.length
      );
    });

    test('should persist encounter progress correctly', async () => {
      const encounterSession = await encounterOrchestrator.startEncounter(mockGhost, {
        currentRoom: mockRoom,
        gameState: gameEngine.getGameState()
      });

      // Make progress in encounter
      await dialogueEngine.startDialogue(mockGhost, {});
      const patchOptions = await encounterOrchestrator.generatePatchOptions('investigate', mockGhost);
      await encounterOrchestrator.applyPatchChoice(patchOptions[0].id, 'apply');

      // Save game state
      await gameEngine.saveGameState();

      // Create new game engine and load state
      const newGameEngine = new GameEngine();
      await newGameEngine.initialize();
      await newGameEngine.loadGameState();

      const loadedState = newGameEngine.getGameState();
      
      // Encounter should be restored
      expect(loadedState.activeEncounters[encounterSession.id]).toBeDefined();
      expect(loadedState.activeEncounters[encounterSession.id].ghostId).toBe(mockGhost.id);
      
      await newGameEngine.shutdown();
    });
  });
});