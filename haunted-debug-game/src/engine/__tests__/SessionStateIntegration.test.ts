/**
 * Integration tests for session and state management
 */

import { SessionManagerImpl } from '../SessionManager';
import { EventManagerImpl } from '../EventManager';
import { StateSynchronizerImpl } from '../StateSynchronizer';
import type { GameState, SystemStates } from '@/types/game';

describe('Session and State Management Integration', () => {
  let sessionManager: SessionManagerImpl;
  let eventManager: EventManagerImpl;
  let stateSynchronizer: StateSynchronizerImpl;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    eventManager = new EventManagerImpl();
    sessionManager = new SessionManagerImpl(eventManager);
  });

  afterEach(() => {
    sessionManager.cleanup();
    eventManager.cleanup();
    if (stateSynchronizer) {
      stateSynchronizer.cleanup();
    }
  });

  describe('SessionManager Enhanced Functionality', () => {
    test('should create session with integrated system states', () => {
      const session = sessionManager.createSession('test-user');
      
      expect(session.id).toBeDefined();
      expect(session.gameState.systemStates).toBeDefined();
      expect(session.gameState.systemStates.eventManager).toBeDefined();
      expect(session.gameState.systemStates.navigation).toBeDefined();
      expect(session.gameState.systemStates.effects).toBeDefined();
      expect(session.gameState.systemStates.encounters).toBeDefined();
      expect(session.gameState.systemStates.session).toBeDefined();
    });

    test('should sync system states correctly', async () => {
      const session = sessionManager.createSession('test-user');
      
      const updatedStates: Partial<SystemStates> = {
        navigation: {
          currentRoomId: 'dependency-crypt',
          unlockedRooms: ['boot-sector', 'dependency-crypt'],
          roomTransitionHistory: ['boot-sector'],
          pendingUnlocks: []
        }
      };

      await sessionManager.syncSystemStates({
        ...session.systemStates,
        ...updatedStates
      });

      const currentStates = sessionManager.getSystemStates();
      expect(currentStates?.navigation.currentRoomId).toBe('dependency-crypt');
      expect(currentStates?.navigation.unlockedRooms).toContain('dependency-crypt');
    });

    test('should update specific system state', async () => {
      sessionManager.createSession('test-user');
      
      await sessionManager.updateSystemState('effects', {
        performanceMode: 'low',
        accessibilitySettings: {
          reduceMotion: true,
          disableFlashing: true,
          visualEffectIntensity: 0.5,
          audioEffectVolume: 0.8,
          alternativeText: true,
          highContrast: false,
          screenReaderSupport: true
        }
      });

      const states = sessionManager.getSystemStates();
      expect(states?.effects.performanceMode).toBe('low');
      expect(states?.effects.accessibilitySettings.reduceMotion).toBe(true);
      expect(states?.effects.accessibilitySettings.visualEffectIntensity).toBe(0.5);
    });

    test('should enable and disable auto-save', () => {
      sessionManager.createSession('test-user');
      
      expect(sessionManager.isAutoSaveEnabled()).toBe(true);
      
      sessionManager.disableAutoSave();
      expect(sessionManager.isAutoSaveEnabled()).toBe(false);
      
      sessionManager.enableAutoSave(10000);
      expect(sessionManager.isAutoSaveEnabled()).toBe(true);
    });

    test('should validate session data', () => {
      const validSession = sessionManager.createSession('test-user');
      expect(sessionManager.validateSession(validSession)).toBe(true);

      const invalidSession = {
        ...validSession,
        gameState: {
          ...validSession.gameState,
          meters: {
            stability: -10, // Invalid: below 0
            insight: 150   // Invalid: above 100
          }
        }
      };
      expect(sessionManager.validateSession(invalidSession)).toBe(false);
    });

    test('should recover corrupted session', async () => {
      // Create and save a session
      const originalSession = sessionManager.createSession('test-user');
      await sessionManager.saveSession(originalSession);

      // Simulate corruption by manually modifying stored data
      const sessions = JSON.parse(localStorage.getItem('haunted-debug-sessions') || '[]');
      if (sessions.length > 0) {
        sessions[0].gameState.meters = null; // Corrupt the data
        localStorage.setItem('haunted-debug-sessions', JSON.stringify(sessions));
      }

      // Attempt recovery
      const recoveredSession = await sessionManager.recoverCorruptedSession(originalSession.id);
      
      expect(recoveredSession).toBeTruthy();
      expect(recoveredSession?.gameState.meters).toBeDefined();
      expect(recoveredSession?.gameState.meters.stability).toBe(60); // Default value
    });
  });

  describe('State Synchronization', () => {
    test('should initialize state synchronizer', async () => {
      const mockSystems = {
        eventManager,
        sessionManager,
        navigationManager: {
          getCurrentRoom: () => null,
          getState: () => ({}),
          restoreState: async () => {}
        },
        effectCoordinator: {
          getState: () => ({}),
          restoreState: async () => {}
        },
        encounterOrchestrator: {
          getState: () => ({}),
          restoreState: async () => {}
        },
        gameStore: {
          syncSystemStates: () => {},
          updateSystemState: () => {}
        }
      };

      stateSynchronizer = new StateSynchronizerImpl();
      
      await expect(stateSynchronizer.initialize(mockSystems as any)).resolves.not.toThrow();
      
      const status = stateSynchronizer.getSyncStatus();
      expect(status.isInitialized).toBe(true);
    });

    test('should validate system states', async () => {
      sessionManager.createSession('test-user');
      
      const mockSystems = {
        eventManager,
        sessionManager,
        navigationManager: {
          getCurrentRoom: () => ({ key: 'boot-sector' }),
          getState: () => ({}),
          restoreState: async () => {}
        },
        effectCoordinator: {
          getState: () => ({ activeEffects: [] }),
          restoreState: async () => {}
        },
        encounterOrchestrator: {
          getState: () => ({}),
          restoreState: async () => {}
        },
        gameStore: {
          syncSystemStates: () => {},
          updateSystemState: () => {}
        }
      };

      stateSynchronizer = new StateSynchronizerImpl();
      await stateSynchronizer.initialize(mockSystems as any);
      
      const isValid = stateSynchronizer.validateSystemStates();
      expect(isValid).toBe(true);
    });
  });

  describe('Persistence Integration', () => {
    test('should persist and restore system states', async () => {
      // Create session with custom system states
      const session = sessionManager.createSession('test-user');
      
      // Update system states
      await sessionManager.updateSystemState('navigation', {
        currentRoomId: 'dependency-crypt',
        unlockedRooms: ['boot-sector', 'dependency-crypt']
      });

      await sessionManager.updateSystemState('encounters', {
        completedEncounters: [{
          id: 'encounter-1',
          ghostId: 'circular-dependency-ghost',
          roomId: 'dependency-crypt',
          completedAt: new Date(),
          duration: 120000,
          outcome: 'success',
          meterChanges: { stability: -5, insight: 15, description: 'Resolved circular dependency' },
          patchesApplied: 1,
          learningPoints: ['Circular dependencies can be resolved by introducing interfaces']
        }]
      });

      // Save session
      await sessionManager.saveSession(session);

      // Create new session manager and load the session
      const newSessionManager = new SessionManagerImpl(eventManager);
      const loadedSession = await newSessionManager.loadSession(session.id);

      expect(loadedSession).toBeTruthy();
      expect(loadedSession?.gameState.systemStates.navigation.currentRoomId).toBe('dependency-crypt');
      expect(loadedSession?.gameState.systemStates.encounters.completedEncounters).toHaveLength(1);
      expect(loadedSession?.gameState.systemStates.encounters.completedEncounters[0].outcome).toBe('success');

      newSessionManager.cleanup();
    });

    test('should handle session history correctly', async () => {
      // Create multiple sessions
      const session1 = sessionManager.createSession('user-1');
      const session2 = sessionManager.createSession('user-2');
      
      await sessionManager.saveSession(session1);
      await sessionManager.saveSession(session2);

      // Get session history
      const history = await sessionManager.getSessionHistory();
      
      expect(history).toHaveLength(2);
      expect(history.map(s => s.id)).toContain(session1.id);
      expect(history.map(s => s.id)).toContain(session2.id);
    });
  });
});