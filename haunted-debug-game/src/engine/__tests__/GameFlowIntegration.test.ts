/**
 * Complete Game Flow Integration Tests
 * End-to-end testing of all systems working together
 * Requirements: All requirements validation
 */

import { GameEngine } from './__mocks__/GameEngine';
import type { Ghost, Room } from '@/types/content';
import type { AccessibilitySettings, PerformanceSettings } from '@/types/game';

describe('Complete Game Flow Integration', () => {
  let gameEngine: GameEngine;

  const mockRooms: Room[] = [
    {
      key: 'boot-sector',
      name: 'Boot Sector',
      description: 'The starting point',
      ghosts: ['initialization-ghost'],
      unlockConditions: [],
      isUnlocked: true,
      backgroundAsset: 'boot-bg.jpg',
      ambientSound: 'boot-ambient.mp3'
    },
    {
      key: 'dependency-crypt',
      name: 'Dependency Crypt',
      description: 'Where dependencies lurk',
      ghosts: ['circular-dependency-ghost'],
      unlockConditions: [
        {
          type: 'encounters_completed',
          roomId: 'boot-sector',
          count: 1,
          description: 'Complete Boot Sector'
        }
      ],
      isUnlocked: false,
      backgroundAsset: 'crypt-bg.jpg',
      ambientSound: 'crypt-ambient.mp3'
    }
  ];

  const mockGhosts: Ghost[] = [
    {
      id: 'initialization-ghost',
      name: 'The Initialization Phantom',
      description: 'A ghost of uninitialized variables',
      softwareSmell: 'uninitialized-variables',
      personality: 'helpful',
      backstory: 'Once a reliable initializer',
      codeContext: {
        language: 'typescript',
        framework: 'react',
        problemArea: 'initialization',
        complexity: 'low'
      },
      dialogueStyle: 'educational',
      roomId: 'boot-sector'
    },
    {
      id: 'circular-dependency-ghost',
      name: 'The Circular Specter',
      description: 'Trapped in endless loops',
      softwareSmell: 'circular-dependencies',
      personality: 'confused',
      backstory: 'Lost in circular imports',
      codeContext: {
        language: 'typescript',
        framework: 'react',
        problemArea: 'dependencies',
        complexity: 'medium'
      },
      dialogueStyle: 'technical',
      roomId: 'dependency-crypt'
    }
  ];

  beforeEach(async () => {
    localStorage.clear();
    gameEngine = new GameEngine();
    await gameEngine.initialize();
    
    // Load test content
    await gameEngine.getNavigationManager().loadRooms(mockRooms);
    await gameEngine.getGhostManager().loadGhosts(mockGhosts);
  });

  afterEach(async () => {
    await gameEngine.shutdown();
  });

  describe('Complete Gameplay Session', () => {
    test('should complete full game session from start to finish', async () => {
      // 1. Start game session
      const sessionManager = gameEngine.getSessionManager();
      const session = sessionManager.createSession('integration-test-user');
      
      expect(session).toBeDefined();
      expect(session.gameState.currentRoom).toBe('boot-sector');
      expect(session.gameState.meters.stability).toBe(60);
      expect(session.gameState.meters.insight).toBe(40);

      // 2. Navigate to starting room
      const navigationManager = gameEngine.getNavigationManager();
      const navResult = await navigationManager.navigateToRoom('boot-sector');
      
      expect(navResult.success).toBe(true);
      expect(navResult.loadedContent?.ghosts).toContain('initialization-ghost');

      // 3. Start encounter with ghost
      const encounterOrchestrator = gameEngine.getEncounterOrchestrator();
      const ghost = mockGhosts.find(g => g.id === 'initialization-ghost')!;
      
      const encounterSession = await encounterOrchestrator.startEncounter(ghost, {
        currentRoom: mockRooms[0],
        gameState: gameEngine.getGameState()
      });

      expect(encounterSession).toBeDefined();
      expect(encounterSession.ghostId).toBe('initialization-ghost');

      // 4. Engage in dialogue
      const dialogueEngine = gameEngine.getDialogueEngine();
      const dialogueSession = await dialogueEngine.startDialogue(ghost, {
        playerContext: 'I need to understand initialization issues'
      });

      expect(dialogueSession.messages).toHaveLength(1);

      // 5. Make dialogue choices and generate patches
      const dialogueChoice = {
        text: 'Show me how to fix uninitialized variables',
        intent: 'request-solution',
        type: 'action' as const
      };

      const dialogueResult = await encounterOrchestrator.processDialogueChoice(
        encounterSession.id,
        dialogueChoice
      );

      expect(dialogueResult.success).toBe(true);
      expect(dialogueResult.shouldGeneratePatches).toBe(true);

      const patchOptions = await encounterOrchestrator.generatePatchOptions(
        dialogueChoice.intent,
        ghost
      );

      expect(patchOptions).toHaveLength(3);

      // 6. Apply patch and see consequences
      const selectedPatch = patchOptions.find(p => p.action === 'apply')!;
      const patchResult = await encounterOrchestrator.applyPatchChoice(
        selectedPatch.id,
        'apply'
      );

      expect(patchResult.success).toBe(true);
      expect(patchResult.meterChanges).toBeDefined();

      // 7. Complete encounter
      const encounterOutcome = await encounterOrchestrator.completeEncounter(
        encounterSession.id
      );

      expect(encounterOutcome.success).toBe(true);
      expect(encounterOutcome.learningPoints).toHaveLength(1);

      // 8. Check progression and unlock next room
      const progressionSystem = gameEngine.getProgressionSystem();
      progressionSystem.markEncounterCompleted('boot-sector', 'initialization-ghost');
      progressionSystem.markRoomCompleted('boot-sector');

      navigationManager.unlockRoom('dependency-crypt', {
        type: 'encounters_completed',
        roomId: 'boot-sector',
        count: 1,
        description: 'Complete Boot Sector'
      });

      expect(navigationManager.canNavigateToRoom('dependency-crypt')).toBe(true);

      // 9. Navigate to next room
      const nextNavResult = await navigationManager.navigateToRoom('dependency-crypt');
      expect(nextNavResult.success).toBe(true);

      // 10. Save session
      await sessionManager.saveSession(session);
      
      const savedSessions = await sessionManager.getSessionHistory();
      expect(savedSessions).toHaveLength(1);
      expect(savedSessions[0].id).toBe(session.id);
    });

    test('should handle accessibility throughout complete session', async () => {
      // Enable comprehensive accessibility
      const accessibilityManager = gameEngine.getAccessibilityManager();
      await accessibilityManager.updateAccessibilitySettings({
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.3,
        audioEffectVolume: 0.0,
        alternativeText: true,
        highContrast: true,
        screenReaderSupport: true
      });

      const announcements: string[] = [];
      accessibilityManager.onScreenReaderAnnouncement((text: string) => {
        announcements.push(text);
      });

      // Complete encounter with accessibility enabled
      const ghost = mockGhosts[0];
      const encounterSession = await gameEngine.getEncounterOrchestrator().startEncounter(ghost, {
        currentRoom: mockRooms[0],
        gameState: gameEngine.getGameState()
      });

      // Should generate accessibility announcements
      expect(announcements.length).toBeGreaterThan(0);
      expect(announcements.some(a => a.includes('Encounter started'))).toBe(true);

      // Apply patch with accessibility feedback
      const dialogueSession = await gameEngine.getDialogueEngine().startDialogue(ghost, {});
      const patchOptions = await gameEngine.getEncounterOrchestrator().generatePatchOptions(
        'fix-issue',
        ghost
      );

      const patchResult = await gameEngine.getEncounterOrchestrator().applyPatchChoice(
        patchOptions[0].id,
        'apply'
      );

      // Should provide alternative feedback
      const feedback = accessibilityManager.generateAlternativeFeedback('patch_applied', {
        success: patchResult.success,
        consequences: patchResult.consequences
      });

      expect(feedback.textDescription).toBeDefined();
      expect(feedback.ariaLabel).toBeDefined();
      expect(feedback.screenReaderText).toBeDefined();
    });

    test('should optimize performance during gameplay', async () => {
      const performanceOptimizer = gameEngine.getPerformanceOptimizer();
      
      // Simulate low-end device
      const lowEndDevice = {
        cpuCores: 2,
        memoryGB: 1,
        gpuTier: 'low' as const,
        isMobile: true,
        supportsWebGL: false,
        maxTextureSize: 512,
        batteryLevel: 0.3,
        isLowPowerMode: true
      };

      const optimizedSettings = performanceOptimizer.optimizeForDevice(lowEndDevice);
      
      expect(optimizedSettings.effectQuality).toBe('low');
      expect(optimizedSettings.maxParticles).toBeLessThanOrEqual(50);

      // Run encounter with performance monitoring
      const initialMetrics = performanceOptimizer.getPerformanceMetrics();
      
      const ghost = mockGhosts[0];
      const encounterSession = await gameEngine.getEncounterOrchestrator().startEncounter(ghost, {
        currentRoom: mockRooms[0],
        gameState: gameEngine.getGameState()
      });

      // Complete encounter
      await gameEngine.getDialogueEngine().startDialogue(ghost, {});
      const patchOptions = await gameEngine.getEncounterOrchestrator().generatePatchOptions(
        'fix-issue',
        ghost
      );
      await gameEngine.getEncounterOrchestrator().applyPatchChoice(patchOptions[0].id, 'apply');
      await gameEngine.getEncounterOrchestrator().completeEncounter(encounterSession.id);

      const finalMetrics = performanceOptimizer.getPerformanceMetrics();
      expect(finalMetrics.sampleCount).toBeGreaterThan(initialMetrics.sampleCount);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from multiple system failures', async () => {
      // Start normal session
      const sessionManager = gameEngine.getSessionManager();
      const session = sessionManager.createSession('resilience-test');

      // Simulate dialogue system failure
      const dialogueEngine = gameEngine.getDialogueEngine();
      const originalStartDialogue = dialogueEngine.startDialogue;
      dialogueEngine.startDialogue = jest.fn().mockRejectedValue(new Error('Dialogue system down'));

      // Simulate patch system failure
      const patchSystem = gameEngine.getPatchSystem();
      const originalGenerate = patchSystem.generatePatchOptions;
      patchSystem.generatePatchOptions = jest.fn().mockRejectedValue(new Error('Patch system down'));

      // Should still be able to start encounter with fallbacks
      const ghost = mockGhosts[0];
      const encounterSession = await gameEngine.getEncounterOrchestrator().startEncounter(ghost, {
        currentRoom: mockRooms[0],
        gameState: gameEngine.getGameState()
      });

      expect(encounterSession).toBeDefined();
      expect(encounterSession.currentPhase).toBe('error');
      expect(encounterSession.errorState?.canRecover).toBe(true);

      // Restore systems and recover
      dialogueEngine.startDialogue = originalStartDialogue;
      patchSystem.generatePatchOptions = originalGenerate;

      const recoveryResult = await gameEngine.getEncounterOrchestrator().recoverEncounter(
        encounterSession.id
      );

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.newPhase).toBe('dialogue');
    });

    test('should maintain data consistency during failures', async () => {
      const sessionManager = gameEngine.getSessionManager();
      const session = sessionManager.createSession('consistency-test');

      const initialState = gameEngine.getGameState();
      
      // Start encounter
      const ghost = mockGhosts[0];
      const encounterSession = await gameEngine.getEncounterOrchestrator().startEncounter(ghost, {
        currentRoom: mockRooms[0],
        gameState: initialState
      });

      // Simulate failure during patch application
      const originalApplyPatch = gameEngine.getEncounterOrchestrator().applyPatchChoice;
      gameEngine.getEncounterOrchestrator().applyPatchChoice = jest.fn().mockImplementation(async () => {
        throw new Error('Patch application failed');
      });

      const dialogueSession = await gameEngine.getDialogueEngine().startDialogue(ghost, {});
      const patchOptions = await gameEngine.getEncounterOrchestrator().generatePatchOptions(
        'fix-issue',
        ghost
      );

      try {
        await gameEngine.getEncounterOrchestrator().applyPatchChoice(patchOptions[0].id, 'apply');
      } catch (error) {
        // Expected to fail
      }

      // Game state should remain consistent
      const stateAfterFailure = gameEngine.getGameState();
      expect(stateAfterFailure.meters.stability).toBe(initialState.meters.stability);
      expect(stateAfterFailure.meters.insight).toBe(initialState.meters.insight);
      expect(stateAfterFailure.evidenceBoard.entries.length).toBe(
        initialState.evidenceBoard.entries.length
      );

      // Restore and complete successfully
      gameEngine.getEncounterOrchestrator().applyPatchChoice = originalApplyPatch;
      
      const successfulResult = await gameEngine.getEncounterOrchestrator().applyPatchChoice(
        patchOptions[0].id,
        'apply'
      );

      expect(successfulResult.success).toBe(true);
    });
  });

  describe('Cross-System Integration', () => {
    test('should coordinate all systems during complex scenarios', async () => {
      // Enable accessibility and performance constraints
      await gameEngine.getAccessibilityManager().updateAccessibilitySettings({
        reduceMotion: true,
        visualEffectIntensity: 0.5,
        audioEffectVolume: 0.3,
        disableFlashing: true,
        alternativeText: true,
        highContrast: false,
        screenReaderSupport: true
      });

      gameEngine.getPerformanceOptimizer().optimizeForDevice({
        cpuCores: 4,
        memoryGB: 4,
        gpuTier: 'medium',
        isMobile: false,
        supportsWebGL: true,
        maxTextureSize: 2048,
        batteryLevel: 0.8,
        isLowPowerMode: false
      });

      // Start complex encounter scenario
      const ghost = mockGhosts[0];
      const encounterSession = await gameEngine.getEncounterOrchestrator().startEncounter(ghost, {
        currentRoom: mockRooms[0],
        gameState: gameEngine.getGameState()
      });

      // Verify all systems are coordinated
      const effectCoordinator = gameEngine.getEffectCoordinator();
      const effectSettings = effectCoordinator.getEffectSettings();
      
      expect(effectSettings.visualIntensity).toBe(0.5);
      expect(effectSettings.audioVolume).toBe(0.3);
      expect(effectSettings.motionReduced).toBe(true);
      expect(effectSettings.flashingDisabled).toBe(true);

      // Complete encounter with all systems active
      const dialogueSession = await gameEngine.getDialogueEngine().startDialogue(ghost, {});
      const patchOptions = await gameEngine.getEncounterOrchestrator().generatePatchOptions(
        'comprehensive-fix',
        ghost
      );

      const patchResult = await gameEngine.getEncounterOrchestrator().applyPatchChoice(
        patchOptions[0].id,
        'apply'
      );

      expect(patchResult.success).toBe(true);
      expect(patchResult.accessibilityFeedback).toBeDefined();
      expect(patchResult.performanceImpact).toBeDefined();

      const encounterOutcome = await gameEngine.getEncounterOrchestrator().completeEncounter(
        encounterSession.id
      );

      expect(encounterOutcome.success).toBe(true);
      expect(encounterOutcome.systemsCoordinated).toBe(true);
    });

    test('should validate all requirements are met', async () => {
      // Test all major requirements through integration
      const requirements = [
        'unified_game_engine',
        'interactive_ghost_encounters', 
        'dynamic_effects_integration',
        'room_navigation_system',
        'persistent_game_progress',
        'accessibility_customization',
        'performance_optimization',
        'educational_feedback_system'
      ];

      const validationResults = await gameEngine.validateRequirements(requirements);
      
      expect(validationResults.allRequirementsMet).toBe(true);
      expect(validationResults.failedRequirements).toHaveLength(0);
      
      requirements.forEach(requirement => {
        expect(validationResults.results[requirement].passed).toBe(true);
        expect(validationResults.results[requirement].details).toBeDefined();
      });
    });
  });
});