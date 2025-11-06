/**
 * Verification script for session and state management integration
 */

import { SessionManagerImpl } from './SessionManager';
import { EventManagerImpl } from './EventManager';
import { StateSynchronizerImpl } from './StateSynchronizer';
import type { SystemStates } from '@/types/game';

export async function verifySessionStateIntegration(): Promise<boolean> {
  console.log('🔍 Verifying Session and State Management Integration...');
  
  let allTestsPassed = true;
  const results: { test: string; passed: boolean; error?: string }[] = [];

  // Helper function to run a test
  const runTest = async (testName: string, testFn: () => Promise<void> | void) => {
    try {
      await testFn();
      results.push({ test: testName, passed: true });
      console.log(`✅ ${testName}`);
    } catch (error) {
      results.push({ test: testName, passed: false, error: (error as Error).message });
      console.error(`❌ ${testName}: ${(error as Error).message}`);
      allTestsPassed = false;
    }
  };

  // Clear localStorage for clean test
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  const eventManager = new EventManagerImpl();
  const sessionManager = new SessionManagerImpl(eventManager);

  try {
    // Test 1: Session Creation with System States
    await runTest('Session Creation with System States', () => {
      const session = sessionManager.createSession('test-user');
      
      if (!session.id) throw new Error('Session ID not generated');
      if (!session.gameState.systemStates) throw new Error('System states not initialized');
      if (!session.gameState.systemStates.eventManager) throw new Error('Event manager state missing');
      if (!session.gameState.systemStates.navigation) throw new Error('Navigation state missing');
      if (!session.gameState.systemStates.effects) throw new Error('Effects state missing');
      if (!session.gameState.systemStates.encounters) throw new Error('Encounters state missing');
      if (!session.gameState.systemStates.session) throw new Error('Session state missing');
    });

    // Test 2: System State Synchronization
    await runTest('System State Synchronization', async () => {
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
      if (currentStates?.navigation.currentRoomId !== 'dependency-crypt') {
        throw new Error('Navigation state not synchronized correctly');
      }
      if (!currentStates?.navigation.unlockedRooms.includes('dependency-crypt')) {
        throw new Error('Unlocked rooms not synchronized correctly');
      }
    });

    // Test 3: Specific System State Updates
    await runTest('Specific System State Updates', async () => {
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
      if (states?.effects.performanceMode !== 'low') {
        throw new Error('Performance mode not updated correctly');
      }
      if (!states?.effects.accessibilitySettings.reduceMotion) {
        throw new Error('Accessibility settings not updated correctly');
      }
    });

    // Test 4: Auto-save Functionality
    await runTest('Auto-save Functionality', () => {
      sessionManager.createSession('test-user');
      
      if (!sessionManager.isAutoSaveEnabled()) {
        throw new Error('Auto-save should be enabled by default');
      }
      
      sessionManager.disableAutoSave();
      if (sessionManager.isAutoSaveEnabled()) {
        throw new Error('Auto-save should be disabled');
      }
      
      sessionManager.enableAutoSave(10000);
      if (!sessionManager.isAutoSaveEnabled()) {
        throw new Error('Auto-save should be enabled after enableAutoSave call');
      }
    });

    // Test 5: Session Validation
    await runTest('Session Validation', () => {
      const validSession = sessionManager.createSession('test-user');
      if (!sessionManager.validateSession(validSession)) {
        throw new Error('Valid session should pass validation');
      }

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
      if (sessionManager.validateSession(invalidSession)) {
        throw new Error('Invalid session should fail validation');
      }
    });

    // Test 6: Session Persistence (if localStorage is available)
    if (typeof localStorage !== 'undefined') {
      await runTest('Session Persistence', async () => {
        const session = sessionManager.createSession('test-user');
        
        // Update system states
        await sessionManager.updateSystemState('navigation', {
          currentRoomId: 'dependency-crypt',
          unlockedRooms: ['boot-sector', 'dependency-crypt']
        });

        // Save session
        await sessionManager.saveSession(session);

        // Create new session manager and load the session
        const newSessionManager = new SessionManagerImpl(eventManager);
        const loadedSession = await newSessionManager.loadSession(session.id);

        if (!loadedSession) {
          throw new Error('Session should be loadable after saving');
        }
        if (loadedSession.gameState.systemStates.navigation.currentRoomId !== 'dependency-crypt') {
          throw new Error('Loaded session should preserve system states');
        }

        newSessionManager.cleanup();
      });
    }

    // Test 7: State Synchronizer Initialization
    await runTest('State Synchronizer Initialization', async () => {
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

      const stateSynchronizer = new StateSynchronizerImpl();
      
      await stateSynchronizer.initialize(mockSystems as any);
      
      const status = stateSynchronizer.getSyncStatus();
      if (!status.isInitialized) {
        throw new Error('State synchronizer should be initialized');
      }

      stateSynchronizer.cleanup();
    });

  } finally {
    // Cleanup
    sessionManager.cleanup();
    eventManager.cleanup();
  }

  // Print summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);

  if (!allTestsPassed) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(result => {
      console.log(`  - ${result.test}: ${result.error}`);
    });
  }

  return allTestsPassed;
}

// Export for use in other verification scripts
export { verifySessionStateIntegration as default };

// Run verification if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  verifySessionStateIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}