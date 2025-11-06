/**
 * Simple verification script for Kiro integration
 */

import { kiroIntegration } from './KiroIntegration';
import { dialogueContextAdapter } from './DialogueContextAdapter';
import { DialogueEngine } from './DialogueEngine';

async function verifyKiroIntegration() {
  console.log('🔍 Verifying Kiro Integration...');

  try {
    // Test 1: Initialize Kiro integration
    console.log('1. Initializing Kiro integration...');
    await kiroIntegration.initialize();
    console.log('✅ Kiro integration initialized successfully');

    // Test 2: Test dialogue generation with fallback
    console.log('2. Testing dialogue generation...');
    const mockGhost = {
      id: 'test-ghost',
      softwareSmell: 'circular_dependency' as const,
      name: 'Test Ghost',
      description: 'A test ghost',
      dialogue: ['Test dialogue'],
      lore: 'Test lore',
      assetKey: 'test-asset'
    };

    const mockContext = {
      ghostType: 'circular_dependency' as const,
      roomContext: 'dependency-crypt',
      playerKnowledge: [],
      previousEncounters: [],
      currentMeterLevels: { stability: 60, insight: 30 },
      sessionProgress: 0.3,
      playerInsightLevel: 'medium' as const
    };

    const dialogueResponse = await kiroIntegration.generateDialogue(
      mockGhost,
      mockContext,
      'What is the problem here?'
    );

    console.log('✅ Dialogue generated:', dialogueResponse.content.substring(0, 50) + '...');

    // Test 3: Test educational content generation
    console.log('3. Testing educational content generation...');
    const educationalContent = await kiroIntegration.generateEducationalContent({
      ghostType: 'circular_dependency',
      topic: 'problem',
      playerLevel: 'intermediate',
      context: 'Test context'
    });

    console.log('✅ Educational content generated:', educationalContent.title);

    // Test 4: Test context adaptation
    console.log('4. Testing context adaptation...');
    const adaptedContent = await kiroIntegration.adaptToneForContext(
      'This is a test message',
      mockContext
    );

    console.log('✅ Content adapted:', adaptedContent.substring(0, 50) + '...');

    // Test 5: Test dialogue context adapter
    console.log('5. Testing dialogue context adapter...');
    const scaledContent = dialogueContextAdapter.scaleEducationalDifficulty(
      'Cache invalidation is important',
      'beginner',
      'stale_cache'
    );

    console.log('✅ Content scaled for beginner level:', scaledContent.substring(0, 50) + '...');

    // Test 6: Test atmospheric adaptation
    console.log('6. Testing atmospheric adaptation...');
    const atmosphericResult = dialogueContextAdapter.adaptAtmosphericIntensity(
      'The cache whispers secrets',
      20, // Low stability
      'medium'
    );

    console.log('✅ Atmospheric adaptation:', {
      intensity: atmosphericResult.intensity,
      hasEffects: atmosphericResult.content.includes('*')
    });

    // Test 7: Test DialogueEngine integration
    console.log('7. Testing DialogueEngine integration...');
    const dialogueEngine = new DialogueEngine();
    
    // Import GameOutcome enum
    const { GameOutcome } = await import('../types/game');
    
    const mockGameContext = {
      currentRoom: { key: 'dependency-crypt', name: 'Dependency Crypt' },
      gameState: {
        run: { id: 'test-run', startedAt: new Date(), finalStability: 60, finalInsight: 30, outcome: GameOutcome.Victory },
        currentRoom: 'dependency-crypt',
        meters: { stability: 60, insight: 30 },
        unlockedRooms: ['dependency-crypt'],
        evidenceBoard: [],
        playerChoices: []
      }
    };

    const session = await dialogueEngine.startDialogue(mockGhost, mockGameContext);
    console.log('✅ Dialogue session created:', session.id);

    const response = await dialogueEngine.processPlayerInput(session.id, 'What is this problem?');
    console.log('✅ Player input processed, response:', response.message.content.substring(0, 50) + '...');

    console.log('\n🎉 All Kiro integration tests passed successfully!');
    console.log('\n📋 Integration Summary:');
    console.log('- ✅ Kiro vibe prompts integrated with fallback support');
    console.log('- ✅ Context-aware dialogue adaptation implemented');
    console.log('- ✅ Educational content delivery with difficulty scaling');
    console.log('- ✅ Atmospheric effects based on game state');
    console.log('- ✅ DialogueEngine enhanced with Kiro integration');

  } catch (error) {
    console.error('❌ Kiro integration verification failed:', error);
    process.exit(1);
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyKiroIntegration();
}

export { verifyKiroIntegration };