/**
 * Demonstration script for enhanced session and state management
 */

import { SessionManagerImpl } from './SessionManager';
import { EventManagerImpl } from './EventManager';
import type { SystemStates } from '@/types/game';

export async function demonstrateSessionStateIntegration(): Promise<void> {
  console.log('🎮 Demonstrating Enhanced Session and State Management');
  console.log('=' .repeat(60));

  // Initialize core systems
  const eventManager = new EventManagerImpl();
  const sessionManager = new SessionManagerImpl(eventManager);

  try {
    // 1. Create a new session with integrated system states
    console.log('\n1️⃣ Creating new session with integrated system states...');
    const session = sessionManager.createSession('demo-user');
    console.log(`✅ Session created: ${session.id}`);
    console.log(`   - Event Manager State: ${JSON.stringify(session.gameState.systemStates.eventManager, null, 2)}`);
    console.log(`   - Navigation State: ${JSON.stringify(session.gameState.systemStates.navigation, null, 2)}`);
    console.log(`   - Effects State: Performance Mode = ${session.gameState.systemStates.effects.performanceMode}`);

    // 2. Update specific system states
    console.log('\n2️⃣ Updating system states...');
    
    // Update navigation state
    await sessionManager.updateSystemState('navigation', {
      currentRoomId: 'dependency-crypt',
      unlockedRooms: ['boot-sector', 'dependency-crypt'],
      roomTransitionHistory: ['boot-sector']
    });
    console.log('✅ Navigation state updated');

    // Update effects state for accessibility
    await sessionManager.updateSystemState('effects', {
      performanceMode: 'medium',
      accessibilitySettings: {
        reduceMotion: true,
        disableFlashing: true,
        visualEffectIntensity: 0.7,
        audioEffectVolume: 0.8,
        alternativeText: true,
        highContrast: false,
        screenReaderSupport: true
      }
    });
    console.log('✅ Effects state updated for accessibility');

    // Update encounter state
    await sessionManager.updateSystemState('encounters', {
      completedEncounters: [{
        id: 'encounter-demo-1',
        ghostId: 'circular-dependency-ghost',
        roomId: 'dependency-crypt',
        completedAt: new Date(),
        duration: 180000, // 3 minutes
        outcome: 'success',
        meterChanges: {
          stability: -8,
          insight: 20,
          description: 'Successfully resolved circular dependency'
        },
        patchesApplied: 2,
        learningPoints: [
          'Circular dependencies can be resolved using dependency injection',
          'Interface segregation helps break circular references',
          'Consider using event-driven architecture for loose coupling'
        ]
      }]
    });
    console.log('✅ Encounter state updated with completed encounter');

    // 3. Demonstrate system state synchronization
    console.log('\n3️⃣ Synchronizing all system states...');
    const currentStates = sessionManager.getSystemStates();
    if (currentStates) {
      // Modify multiple states at once
      const updatedStates: SystemStates = {
        ...currentStates,
        navigation: {
          ...currentStates.navigation,
          pendingUnlocks: [{
            roomId: 'ghost-memory-heap',
            conditionsMet: 1,
            totalConditions: 2,
            nextCheckTime: new Date(Date.now() + 300000) // 5 minutes from now
          }]
        },
        session: {
          ...currentStates.session,
          achievements: [{
            id: 'first-encounter',
            progress: 100,
            maxProgress: 100,
            unlocked: true,
            unlockedAt: new Date()
          }],
          learningProgress: [{
            concept: 'circular-dependencies',
            masteryLevel: 0.6,
            practiceCount: 1,
            lastPracticed: new Date(),
            improvementTrend: 0.6
          }]
        }
      };

      await sessionManager.syncSystemStates(updatedStates);
      console.log('✅ System states synchronized');
    }

    // 4. Demonstrate session persistence
    console.log('\n4️⃣ Testing session persistence...');
    await sessionManager.saveSession(session);
    console.log('✅ Session saved to persistent storage');

    // Load the session back
    const loadedSession = await sessionManager.loadSession(session.id);
    if (loadedSession) {
      console.log('✅ Session loaded successfully');
      console.log(`   - Current Room: ${loadedSession.gameState.systemStates.navigation.currentRoomId}`);
      console.log(`   - Unlocked Rooms: ${loadedSession.gameState.systemStates.navigation.unlockedRooms.join(', ')}`);
      console.log(`   - Completed Encounters: ${loadedSession.gameState.systemStates.encounters.completedEncounters.length}`);
      console.log(`   - Achievements: ${loadedSession.gameState.systemStates.session.achievements.length}`);
      console.log(`   - Learning Progress: ${loadedSession.gameState.systemStates.session.learningProgress.length} concepts`);
    }

    // 5. Demonstrate auto-save functionality
    console.log('\n5️⃣ Testing auto-save functionality...');
    console.log(`   - Auto-save enabled: ${sessionManager.isAutoSaveEnabled()}`);
    
    sessionManager.disableAutoSave();
    console.log(`   - Auto-save disabled: ${!sessionManager.isAutoSaveEnabled()}`);
    
    sessionManager.enableAutoSave(5000); // 5 second interval for demo
    console.log(`   - Auto-save re-enabled with 5s interval: ${sessionManager.isAutoSaveEnabled()}`);

    // 6. Demonstrate session validation
    console.log('\n6️⃣ Testing session validation...');
    const isValid = sessionManager.validateSession(session);
    console.log(`✅ Session validation: ${isValid ? 'PASSED' : 'FAILED'}`);

    // Create an invalid session for testing
    const invalidSession = {
      ...session,
      gameState: {
        ...session.gameState,
        meters: {
          stability: -50, // Invalid: below 0
          insight: 200   // Invalid: above 100
        }
      }
    };
    const isInvalid = sessionManager.validateSession(invalidSession);
    console.log(`✅ Invalid session validation: ${!isInvalid ? 'CORRECTLY REJECTED' : 'INCORRECTLY ACCEPTED'}`);

    // 7. Display final state summary
    console.log('\n7️⃣ Final State Summary:');
    const finalStates = sessionManager.getSystemStates();
    if (finalStates) {
      console.log('📊 System States Overview:');
      console.log(`   🧭 Navigation: Room "${finalStates.navigation.currentRoomId}" (${finalStates.navigation.unlockedRooms.length} unlocked)`);
      console.log(`   ⚡ Effects: ${finalStates.effects.performanceMode} performance, accessibility ${finalStates.effects.accessibilitySettings.reduceMotion ? 'enabled' : 'disabled'}`);
      console.log(`   👻 Encounters: ${finalStates.encounters.completedEncounters.length} completed`);
      console.log(`   🎯 Session: ${finalStates.session.achievements.length} achievements, ${finalStates.session.learningProgress.length} learning concepts`);
      console.log(`   📡 Events: ${finalStates.eventManager.subscriptionCount} subscriptions, ${finalStates.eventManager.recentEvents.length} recent events`);
    }

    console.log('\n🎉 Session and State Management Integration Demonstration Complete!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  } finally {
    // Cleanup
    sessionManager.cleanup();
    eventManager.cleanup();
  }
}

// Export for use in other scripts
export default demonstrateSessionStateIntegration;

// Run demonstration if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  demonstrateSessionStateIntegration().catch(console.error);
}