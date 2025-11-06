/**
 * Navigation and Progression System Tests
 * Tests room navigation, unlock conditions, and progression tracking
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3
 */

import { GameEngine } from './__mocks__/GameEngine';
import { EventManagerImpl } from '../EventManager';
import { SessionManagerImpl } from '../SessionManager';
import type { Room, Ghost } from '@/types/content';
import type { GameState, UnlockCondition } from '@/types/game';

describe('Navigation and Progression Systems', () => {
  let gameEngine: GameEngine;
  let navigationManager: any;
  let progressionSystem: any;
  let sessionManager: SessionManagerImpl;
  let eventManager: EventManagerImpl;

  const mockRooms: Room[] = [
    {
      key: 'boot-sector',
      name: 'Boot Sector',
      description: 'The starting point of your debugging journey',
      ghosts: ['initialization-ghost'],
      unlockConditions: [],
      isUnlocked: true,
      backgroundAsset: 'boot-bg.jpg',
      ambientSound: 'boot-ambient.mp3'
    },
    {
      key: 'dependency-crypt',
      name: 'Dependency Crypt',
      description: 'Where circular dependencies lurk in the shadows',
      ghosts: ['circular-dependency-ghost'],
      unlockConditions: [
        {
          type: 'encounters_completed',
          roomId: 'boot-sector',
          count: 1,
          description: 'Complete at least one encounter in Boot Sector'
        }
      ],
      isUnlocked: false,
      backgroundAsset: 'crypt-bg.jpg',
      ambientSound: 'crypt-ambient.mp3'
    },
    {
      key: 'memory-maze',
      name: 'Memory Maze',
      description: 'A labyrinth of memory leaks and performance issues',
      ghosts: ['memory-leak-ghost'],
      unlockConditions: [
        {
          type: 'encounters_completed',
          roomId: 'dependency-crypt',
          count: 1,
          description: 'Complete at least one encounter in Dependency Crypt'
        }
      ],
      isUnlocked: false,
      backgroundAsset: 'maze-bg.jpg',
      ambientSound: 'maze-ambient.mp3'
    },
    {
      key: 'final-merge',
      name: 'Final Merge',
      description: 'The ultimate test of your debugging skills',
      ghosts: ['merge-conflict-ghost'],
      unlockConditions: [
        {
          type: 'all_rooms_completed',
          description: 'Complete encounters in all previous rooms'
        },
        {
          type: 'meter_threshold',
          meter: 'insight',
          threshold: 80,
          description: 'Achieve at least 80 insight points'
        }
      ],
      isUnlocked: false,
      backgroundAsset: 'merge-bg.jpg',
      ambientSound: 'merge-ambient.mp3'
    }
  ];

  beforeEach(async () => {
    localStorage.clear();
    
    eventManager = new EventManagerImpl();
    sessionManager = new SessionManagerImpl(eventManager);
    
    gameEngine = new GameEngine();
    await gameEngine.initialize();
    
    navigationManager = gameEngine.getNavigationManager();
    progressionSystem = gameEngine.getProgressionSystem();
    
    // Load mock rooms
    await navigationManager.loadRooms(mockRooms);
  });

  afterEach(async () => {
    await gameEngine.shutdown();
    eventManager.cleanup();
    sessionManager.cleanup();
  });

  describe('Room Navigation Logic', () => {
    test('should start in boot sector room', () => {
      const currentRoom = navigationManager.getCurrentRoom();
      
      expect(currentRoom).toBeDefined();
      expect(currentRoom?.key).toBe('boot-sector');
      expect(currentRoom?.isUnlocked).toBe(true);
    });

    test('should get available rooms correctly', () => {
      const availableRooms = navigationManager.getAvailableRooms();
      
      expect(availableRooms).toHaveLength(1); // Only boot-sector initially
      expect(availableRooms[0].key).toBe('boot-sector');
    });

    test('should check navigation permissions correctly', () => {
      // Can navigate to unlocked room
      expect(navigationManager.canNavigateToRoom('boot-sector')).toBe(true);
      
      // Cannot navigate to locked room
      expect(navigationManager.canNavigateToRoom('dependency-crypt')).toBe(false);
      expect(navigationManager.canNavigateToRoom('memory-maze')).toBe(false);
      expect(navigationManager.canNavigateToRoom('final-merge')).toBe(false);
    });

    test('should navigate to unlocked room successfully', async () => {
      const result = await navigationManager.navigateToRoom('boot-sector');
      
      expect(result.success).toBe(true);
      expect(result.newRoom.key).toBe('boot-sector');
      expect(result.transitionEffects).toBeDefined();
      
      const currentRoom = navigationManager.getCurrentRoom();
      expect(currentRoom?.key).toBe('boot-sector');
    });

    test('should prevent navigation to locked room', async () => {
      const result = await navigationManager.navigateToRoom('dependency-crypt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('room_locked');
      expect(result.error?.missingConditions).toBeDefined();
    });

    test('should load room-specific content on navigation', async () => {
      const result = await navigationManager.navigateToRoom('boot-sector');
      
      expect(result.success).toBe(true);
      expect(result.loadedContent).toBeDefined();
      expect(result.loadedContent?.ghosts).toHaveLength(1);
      expect(result.loadedContent?.ghosts[0]).toBe('initialization-ghost');
      expect(result.loadedContent?.backgroundAsset).toBe('boot-bg.jpg');
      expect(result.loadedContent?.ambientSound).toBe('boot-ambient.mp3');
    });
  });

  describe('Room Unlock Conditions', () => {
    test('should unlock room after completing encounter', async () => {
      // Initially locked
      expect(navigationManager.canNavigateToRoom('dependency-crypt')).toBe(false);
      
      // Complete encounter in boot sector
      const unlockCondition: UnlockCondition = {
        type: 'encounters_completed',
        roomId: 'boot-sector',
        count: 1,
        description: 'Complete encounter in Boot Sector'
      };
      
      navigationManager.unlockRoom('dependency-crypt', unlockCondition);
      
      // Should now be unlocked
      expect(navigationManager.canNavigateToRoom('dependency-crypt')).toBe(true);
      
      const availableRooms = navigationManager.getAvailableRooms();
      expect(availableRooms).toHaveLength(2);
      expect(availableRooms.some(r => r.key === 'dependency-crypt')).toBe(true);
    });

    test('should handle complex unlock conditions for final room', async () => {
      // Final room requires multiple conditions
      expect(navigationManager.canNavigateToRoom('final-merge')).toBe(false);
      
      // Unlock previous rooms first
      navigationManager.unlockRoom('dependency-crypt', {
        type: 'encounters_completed',
        roomId: 'boot-sector',
        count: 1,
        description: 'Complete Boot Sector'
      });
      
      navigationManager.unlockRoom('memory-maze', {
        type: 'encounters_completed',
        roomId: 'dependency-crypt',
        count: 1,
        description: 'Complete Dependency Crypt'
      });
      
      // Still locked due to meter requirement
      expect(navigationManager.canNavigateToRoom('final-merge')).toBe(false);
      
      // Meet meter threshold
      const gameState = gameEngine.getGameState();
      gameState.meters.insight = 85;
      await gameEngine.updateGameState(gameState);
      
      // Check all rooms completed condition
      progressionSystem.markRoomCompleted('boot-sector');
      progressionSystem.markRoomCompleted('dependency-crypt');
      progressionSystem.markRoomCompleted('memory-maze');
      
      // Now should be unlocked
      navigationManager.unlockRoom('final-merge', {
        type: 'all_rooms_completed',
        description: 'All rooms completed'
      });
      
      expect(navigationManager.canNavigateToRoom('final-merge')).toBe(true);
    });

    test('should provide clear unlock condition feedback', () => {
      const result = navigationManager.getUnlockConditions('dependency-crypt');
      
      expect(result).toBeDefined();
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0].type).toBe('encounters_completed');
      expect(result.conditions[0].roomId).toBe('boot-sector');
      expect(result.conditions[0].count).toBe(1);
      expect(result.conditions[0].description).toBeDefined();
    });
  });

  describe('Progression Tracking', () => {
    test('should track room completion progress', () => {
      expect(progressionSystem.isRoomCompleted('boot-sector')).toBe(false);
      
      progressionSystem.markRoomCompleted('boot-sector');
      
      expect(progressionSystem.isRoomCompleted('boot-sector')).toBe(true);
      
      const progress = progressionSystem.getOverallProgress();
      expect(progress.completedRooms).toBe(1);
      expect(progress.totalRooms).toBe(4);
      expect(progress.percentage).toBe(25);
    });

    test('should track encounter completion within rooms', () => {
      const roomProgress = progressionSystem.getRoomProgress('boot-sector');
      
      expect(roomProgress.completedEncounters).toBe(0);
      expect(roomProgress.totalEncounters).toBe(1);
      expect(roomProgress.isCompleted).toBe(false);
      
      progressionSystem.markEncounterCompleted('boot-sector', 'initialization-ghost');
      
      const updatedProgress = progressionSystem.getRoomProgress('boot-sector');
      expect(updatedProgress.completedEncounters).toBe(1);
      expect(updatedProgress.isCompleted).toBe(true);
    });

    test('should check victory conditions correctly', () => {
      expect(progressionSystem.checkVictoryConditions()).toBe(false);
      
      // Complete all rooms
      mockRooms.forEach(room => {
        progressionSystem.markRoomCompleted(room.key);
      });
      
      // Meet meter requirements
      const gameState = gameEngine.getGameState();
      gameState.meters.insight = 85;
      gameState.meters.stability = 70;
      
      expect(progressionSystem.checkVictoryConditions()).toBe(true);
    });

    test('should generate progression insights', () => {
      progressionSystem.markRoomCompleted('boot-sector');
      progressionSystem.markEncounterCompleted('boot-sector', 'initialization-ghost');
      
      const insights = progressionSystem.getProgressionInsights();
      
      expect(insights).toBeDefined();
      expect(insights.completedRooms).toContain('boot-sector');
      expect(insights.nextRecommendedRoom).toBe('dependency-crypt');
      expect(insights.skillsLearned).toHaveLength(1);
      expect(insights.overallPerformance).toBeDefined();
    });
  });

  describe('Session Persistence', () => {
    test('should persist navigation state across sessions', async () => {
      // Navigate and unlock rooms
      await navigationManager.navigateToRoom('boot-sector');
      navigationManager.unlockRoom('dependency-crypt', {
        type: 'encounters_completed',
        roomId: 'boot-sector',
        count: 1,
        description: 'Complete Boot Sector'
      });
      
      await navigationManager.navigateToRoom('dependency-crypt');
      
      // Save session
      const session = sessionManager.createSession('test-user');
      await sessionManager.saveSession(session);
      
      // Create new game engine and load session
      const newGameEngine = new GameEngine();
      await newGameEngine.initialize();
      await newGameEngine.loadGameState();
      
      const newNavigationManager = newGameEngine.getNavigationManager();
      await newNavigationManager.loadRooms(mockRooms);
      
      // Navigation state should be restored
      const currentRoom = newNavigationManager.getCurrentRoom();
      expect(currentRoom?.key).toBe('dependency-crypt');
      
      expect(newNavigationManager.canNavigateToRoom('dependency-crypt')).toBe(true);
      
      await newGameEngine.shutdown();
    });

    test('should persist progression state across sessions', async () => {
      // Make progress
      progressionSystem.markRoomCompleted('boot-sector');
      progressionSystem.markEncounterCompleted('boot-sector', 'initialization-ghost');
      
      // Save session
      const session = sessionManager.createSession('test-user');
      await sessionManager.saveSession(session);
      
      // Create new game engine and load session
      const newGameEngine = new GameEngine();
      await newGameEngine.initialize();
      await newGameEngine.loadGameState();
      
      const newProgressionSystem = newGameEngine.getProgressionSystem();
      
      // Progression should be restored
      expect(newProgressionSystem.isRoomCompleted('boot-sector')).toBe(true);
      
      const roomProgress = newProgressionSystem.getRoomProgress('boot-sector');
      expect(roomProgress.completedEncounters).toBe(1);
      expect(roomProgress.isCompleted).toBe(true);
      
      await newGameEngine.shutdown();
    });

    test('should handle session corruption gracefully', async () => {
      // Create and save session
      const session = sessionManager.createSession('test-user');
      await sessionManager.saveSession(session);
      
      // Corrupt navigation data
      const sessions = JSON.parse(localStorage.getItem('haunted-debug-sessions') || '[]');
      if (sessions.length > 0) {
        sessions[0].gameState.systemStates.navigation = null;
        localStorage.setItem('haunted-debug-sessions', JSON.stringify(sessions));
      }
      
      // Load should recover gracefully
      const newGameEngine = new GameEngine();
      await newGameEngine.initialize();
      await newGameEngine.loadGameState();
      
      const newNavigationManager = newGameEngine.getNavigationManager();
      await newNavigationManager.loadRooms(mockRooms);
      
      // Should default to boot sector
      const currentRoom = newNavigationManager.getCurrentRoom();
      expect(currentRoom?.key).toBe('boot-sector');
      
      await newGameEngine.shutdown();
    });
  });

  describe('Room Transition Effects', () => {
    test('should generate appropriate transition effects', async () => {
      const result = await navigationManager.navigateToRoom('boot-sector');
      
      expect(result.transitionEffects).toBeDefined();
      expect(result.transitionEffects?.fadeOut).toBeDefined();
      expect(result.transitionEffects?.fadeIn).toBeDefined();
      expect(result.transitionEffects?.duration).toBeGreaterThan(0);
    });

    test('should handle room-specific loading states', async () => {
      const loadingPromise = navigationManager.navigateToRoom('boot-sector');
      
      // Check loading state
      const navigationState = navigationManager.getNavigationState();
      expect(navigationState.isTransitioning).toBe(true);
      expect(navigationState.loadingRoom).toBe('boot-sector');
      
      const result = await loadingPromise;
      
      // Loading should be complete
      const finalState = navigationManager.getNavigationState();
      expect(finalState.isTransitioning).toBe(false);
      expect(finalState.loadingRoom).toBeNull();
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid room navigation', async () => {
      const result = await navigationManager.navigateToRoom('invalid-room');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('room_not_found');
      expect(result.error?.message).toContain('invalid-room');
    });

    test('should handle room loading failures', async () => {
      // Mock room loading to fail
      const originalLoadRoomContent = navigationManager.loadRoomContent;
      navigationManager.loadRoomContent = jest.fn().mockRejectedValue(new Error('Asset loading failed'));
      
      const result = await navigationManager.navigateToRoom('boot-sector');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('loading_failed');
      expect(result.fallbackContent).toBeDefined();
      
      // Restore original method
      navigationManager.loadRoomContent = originalLoadRoomContent;
    });

    test('should recover from progression system errors', () => {
      // Mock progression system to throw error
      const originalMarkCompleted = progressionSystem.markRoomCompleted;
      progressionSystem.markRoomCompleted = jest.fn().mockImplementation(() => {
        throw new Error('Progression system error');
      });
      
      // Should handle error gracefully
      expect(() => {
        progressionSystem.markRoomCompleted('boot-sector');
      }).not.toThrow();
      
      // Should still function with fallback
      const progress = progressionSystem.getOverallProgress();
      expect(progress).toBeDefined();
      
      // Restore original method
      progressionSystem.markRoomCompleted = originalMarkCompleted;
    });
  });
});