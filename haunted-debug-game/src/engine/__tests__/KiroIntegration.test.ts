/**
 * Test suite for Kiro integration functionality
 */

import { kiroIntegration } from '../KiroIntegration';
import { dialogueContextAdapter } from '../DialogueContextAdapter';

describe('KiroIntegration', () => {
  const mockGhost = {
    id: 'test-ghost',
    softwareSmell: 'circular_dependency',
    name: 'Test Ghost',
    description: 'A test ghost for circular dependencies',
    dialogue: ['Test dialogue'],
    lore: 'Test lore',
    assetKey: 'test-asset'
  };

  const mockContext = {
    ghostType: 'circular_dependency',
    roomContext: 'dependency-crypt',
    playerKnowledge: [],
    previousEncounters: [],
    currentMeterLevels: {
      stability: 60,
      insight: 30
    },
    sessionProgress: 0.3,
    playerInsightLevel: 'medium'
  };

  beforeEach(async () => {
    // Initialize the integration before each test
    await kiroIntegration.initialize();
  });

  test('should initialize successfully', async () => {
    await expect(kiroIntegration.initialize()).resolves.not.toThrow();
  });

  test('should generate dialogue with fallback when Kiro is not available', async () => {
    const result = await kiroIntegration.generateDialogue(
      mockGhost,
      mockContext,
      'What is the problem here?'
    );

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.atmosphericEffects).toBeInstanceOf(Array);
    expect(result.educationalHints).toBeInstanceOf(Array);
    expect(result.personalityTraits).toBeInstanceOf(Array);
  });

  test('should generate educational content with fallback', async () => {
    const result = await kiroIntegration.generateEducationalContent({
      ghostType: 'circular_dependency',
      topic: 'problem',
      playerLevel: 'intermediate',
      context: 'Test context'
    });

    expect(result).toBeDefined();
    expect(result.title).toBeTruthy();
    expect(result.explanation).toBeTruthy();
    expect(result.examples).toBeInstanceOf(Array);
    expect(result.bestPractices).toBeInstanceOf(Array);
    expect(result.difficulty).toBe('intermediate');
  });

  test('should adapt tone for different stability levels', async () => {
    const baseContent = 'This is a test message';
    
    // Test low stability
    const lowStabilityResult = await kiroIntegration.adaptToneForContext(
      baseContent,
      { ...mockContext, currentMeterLevels: { stability: 20, insight: 30 } }
    );
    expect(lowStabilityResult).toContain('trembles');

    // Test high stability
    const highStabilityResult = await kiroIntegration.adaptToneForContext(
      baseContent,
      { ...mockContext, currentMeterLevels: { stability: 80, insight: 30 } }
    );
    expect(highStabilityResult).not.toContain('trembles');
  });
});

describe('DialogueContextAdapter', () => {
  const mockGhost = {
    id: 'test-ghost',
    softwareSmell: 'stale_cache',
    name: 'Test Cache Ghost',
    description: 'A test ghost for stale cache issues',
    dialogue: ['Test dialogue'],
    lore: 'Test lore',
    assetKey: 'test-asset'
  };

  test('should scale educational difficulty appropriately', () => {
    const baseContent = 'Cache invalidation is important for data consistency.';
    
    // Test beginner scaling
    const beginnerContent = dialogueContextAdapter.scaleEducationalDifficulty(
      baseContent,
      'beginner',
      'stale_cache'
    );
    expect(beginnerContent).toBeTruthy();
    expect(beginnerContent.length).toBeGreaterThan(baseContent.length);

    // Test advanced scaling
    const advancedContent = dialogueContextAdapter.scaleEducationalDifficulty(
      baseContent,
      'advanced',
      'stale_cache'
    );
    expect(advancedContent).toBeTruthy();
    expect(advancedContent).toContain('design patterns');
  });

  test('should adapt atmospheric intensity based on stability', () => {
    const baseContent = 'The cache whispers old secrets';
    
    // Test low stability (high intensity)
    const lowStabilityResult = dialogueContextAdapter.adaptAtmosphericIntensity(
      baseContent,
      20,
      'medium'
    );
    expect(lowStabilityResult.intensity).toBeGreaterThan(0.5);
    expect(lowStabilityResult.content).toContain('*');

    // Test high stability (low intensity)
    const highStabilityResult = dialogueContextAdapter.adaptAtmosphericIntensity(
      baseContent,
      90,
      'medium'
    );
    expect(highStabilityResult.intensity).toBeLessThan(0.5);
  });
});