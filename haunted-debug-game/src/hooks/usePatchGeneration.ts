/**
 * usePatchGeneration - Hook for generating and managing patches
 */

import { useState, useCallback } from 'react';
import { PatchGenerationSystem } from '@/engine/PatchGenerationSystem';
import { useGameStore } from '@/store/gameStore';
import type { PatchPlan, PatchValidationResult } from '@/types/patch';
import type { Ghost } from '@/types/content';
import type { MCPTools } from '@/types/kiro';

interface UsePatchGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generatePatches: (intent: string, ghost: Ghost) => Promise<PatchPlan[]>;
  validatePatch: (patch: PatchPlan) => Promise<PatchValidationResult>;
  applyPatch: (patch: PatchPlan, action: 'apply' | 'refactor' | 'question') => Promise<any>;
}

export function usePatchGeneration(): UsePatchGenerationReturn {
  const gameStore = useGameStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create mock MCP tools for patch generation
  const createMockMCPTools = (): MCPTools => ({
    generateDialogue: async () => ({ message: '', options: [], educationalContent: null }),
    
    generatePatch: async (intent: string, context: any) => {
      // Mock patch generation based on intent and ghost type
      const ghost = context.ghost as Ghost;
      
      return {
        id: `patch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: `Fix ${ghost.softwareSmell.replace('_', ' ')}`,
        description: `Addresses the ${ghost.softwareSmell} issue: ${intent}`,
        changes: generateMockChanges(ghost.softwareSmell, intent),
        risk: calculateRisk(ghost.softwareSmell, intent),
        complexity: calculateComplexity(ghost.softwareSmell),
        stabilityEffect: calculateStabilityEffect(ghost.softwareSmell, intent),
        insightEffect: calculateInsightEffect(ghost.softwareSmell),
        educationalNotes: generateEducationalNotes(ghost.softwareSmell, intent),
        estimatedTime: ghost.estimatedTime,
        prerequisites: generatePrerequisites(ghost.softwareSmell),
        testingStrategy: generateTestingStrategy(ghost.softwareSmell)
      };
    },
    
    validatePatch: async (patch: any) => {
      // Mock validation
      return {
        isValid: true,
        issues: [],
        suggestions: [
          'Consider adding unit tests for the changes',
          'Update documentation to reflect the changes',
          'Review with team before applying to production'
        ]
      };
    }
  });

  const generateMockChanges = (softwareSmell: string, intent: string) => {
    const changes: Record<string, any[]> = {
      'circular_dependency': [
        {
          file: 'src/services/UserService.ts',
          oldCode: `import { NotificationService } from './NotificationService';
import { User } from '../models/User';

export class UserService {
  constructor(private notifications: NotificationService) {}
  
  async createUser(userData: any): Promise<User> {
    const user = new User(userData);
    this.notifications.sendWelcomeEmail(user);
    return user;
  }
}`,
          newCode: `import { User } from '../models/User';
import { INotificationService } from '../interfaces/INotificationService';

export class UserService {
  constructor(private notifications: INotificationService) {}
  
  async createUser(userData: any): Promise<User> {
    const user = new User(userData);
    this.notifications.sendWelcomeEmail(user);
    return user;
  }
}`,
          explanation: 'Replaced direct import with interface to break circular dependency'
        }
      ],
      'memory_leak': [
        {
          file: 'src/components/DataVisualization.tsx',
          oldCode: `useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
}, []);`,
          newCode: `useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
  
  return () => clearInterval(interval);
}, []);`,
          explanation: 'Added cleanup function to clear interval and prevent memory leak'
        }
      ],
      'code_duplication': [
        {
          file: 'src/utils/validation.ts',
          oldCode: `// Multiple validation functions with duplicated logic
export const validateEmail = (email: string) => {
  if (!email) return false;
  if (email.length < 5) return false;
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
};

export const validateUsername = (username: string) => {
  if (!username) return false;
  if (username.length < 3) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
};`,
          newCode: `// Extracted common validation logic
const validateRequired = (value: string, minLength: number) => {
  return value && value.length >= minLength;
};

export const validateEmail = (email: string) => {
  return validateRequired(email, 5) && 
         /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
};

export const validateUsername = (username: string) => {
  return validateRequired(username, 3) && 
         /^[a-zA-Z0-9_]+$/.test(username);
};`,
          explanation: 'Extracted common validation logic to reduce duplication'
        }
      ]
    };

    return changes[softwareSmell] || [
      {
        file: 'src/example.ts',
        oldCode: '// Original code with issues',
        newCode: '// Improved code',
        explanation: 'General improvement to address the software smell'
      }
    ];
  };

  const calculateRisk = (softwareSmell: string, intent: string): number => {
    const baseRisks: Record<string, number> = {
      'circular_dependency': 0.4,
      'memory_leak': 0.3,
      'code_duplication': 0.2,
      'large_class': 0.5,
      'long_method': 0.3,
      'dead_code': 0.1
    };

    let risk = baseRisks[softwareSmell] || 0.3;
    
    // Adjust risk based on intent
    if (intent.includes('refactor')) risk += 0.1;
    if (intent.includes('quick') || intent.includes('fast')) risk += 0.2;
    if (intent.includes('careful') || intent.includes('safe')) risk -= 0.1;
    
    return Math.max(0.1, Math.min(0.9, risk));
  };

  const calculateComplexity = (softwareSmell: string): number => {
    const complexities: Record<string, number> = {
      'circular_dependency': 0.7,
      'memory_leak': 0.4,
      'code_duplication': 0.3,
      'large_class': 0.8,
      'long_method': 0.5,
      'dead_code': 0.2
    };

    return complexities[softwareSmell] || 0.5;
  };

  const calculateStabilityEffect = (softwareSmell: string, intent: string): number => {
    const baseEffects: Record<string, number> = {
      'circular_dependency': 15,
      'memory_leak': 20,
      'code_duplication': 10,
      'large_class': 12,
      'long_method': 8,
      'dead_code': 5
    };

    let effect = baseEffects[softwareSmell] || 10;
    
    // Adjust based on intent
    if (intent.includes('comprehensive') || intent.includes('thorough')) effect += 5;
    if (intent.includes('minimal') || intent.includes('quick')) effect -= 3;
    
    return Math.max(1, effect);
  };

  const calculateInsightEffect = (softwareSmell: string): number => {
    const insightEffects: Record<string, number> = {
      'circular_dependency': 8,
      'memory_leak': 6,
      'code_duplication': 4,
      'large_class': 10,
      'long_method': 5,
      'dead_code': 3
    };

    return insightEffects[softwareSmell] || 5;
  };

  const generateEducationalNotes = (softwareSmell: string, intent: string): string => {
    const notes: Record<string, string> = {
      'circular_dependency': 'This patch demonstrates dependency inversion principle by introducing an interface to break the circular dependency. This makes the code more testable and maintainable.',
      'memory_leak': 'This fix shows proper resource cleanup in React components. Always remember to clean up subscriptions, timers, and event listeners to prevent memory leaks.',
      'code_duplication': 'This refactoring follows the DRY (Don\'t Repeat Yourself) principle by extracting common functionality. This makes the code easier to maintain and reduces the chance of bugs.',
      'large_class': 'This demonstrates the Single Responsibility Principle by breaking down a large class into smaller, focused components. Each class now has a single reason to change.',
      'long_method': 'This shows how to break down long methods into smaller, more focused functions. This improves readability and makes the code easier to test and debug.',
      'dead_code': 'Removing dead code reduces complexity and maintenance burden. Always clean up unused code to keep the codebase lean and understandable.'
    };

    return notes[softwareSmell] || 'This patch addresses a common software quality issue and demonstrates good programming practices.';
  };

  const generatePrerequisites = (softwareSmell: string): string[] => {
    const prerequisites: Record<string, string[]> = {
      'circular_dependency': [
        'Understand the current dependency structure',
        'Identify all modules involved in the cycle',
        'Plan the interface extraction strategy'
      ],
      'memory_leak': [
        'Identify all resources that need cleanup',
        'Understand component lifecycle',
        'Test memory usage before and after'
      ],
      'code_duplication': [
        'Identify all instances of duplicated code',
        'Understand the common functionality',
        'Plan the extraction strategy'
      ]
    };

    return prerequisites[softwareSmell] || [
      'Understand the current code structure',
      'Plan the refactoring approach',
      'Ensure adequate test coverage'
    ];
  };

  const generateTestingStrategy = (softwareSmell: string): string[] => {
    const strategies: Record<string, string[]> = {
      'circular_dependency': [
        'Unit test each module independently',
        'Integration test the new interface',
        'Verify no circular imports remain'
      ],
      'memory_leak': [
        'Test component mounting and unmounting',
        'Monitor memory usage over time',
        'Verify all cleanup functions are called'
      ],
      'code_duplication': [
        'Test the extracted common functionality',
        'Verify all calling sites still work',
        'Test edge cases for the new shared code'
      ]
    };

    return strategies[softwareSmell] || [
      'Unit test the changed functionality',
      'Integration test the affected systems',
      'Verify no regressions were introduced'
    ];
  };

  const [patchSystem] = useState(() => {
    const mockMCPTools = createMockMCPTools();
    // Create a mock event manager for the patch system
    const mockEventManager = {
      emit: () => {},
      on: () => {},
      off: () => {},
      cleanup: () => {}
    };
    return new PatchGenerationSystem(mockMCPTools, mockEventManager as any);
  });

  const generatePatches = useCallback(async (intent: string, ghost: Ghost): Promise<PatchPlan[]> => {
    setIsGenerating(true);
    setError(null);

    try {
      const context = {
        ghost,
        gameState: {
          run: gameStore.run,
          currentRoom: gameStore.currentRoom,
          meters: gameStore.meters,
          unlockedRooms: gameStore.unlockedRooms,
          evidenceBoard: gameStore.evidenceBoard,
          playerChoices: gameStore.playerChoices,
          systemStates: gameStore.systemStates
        },
        playerIntent: intent
      };

      const patches = await patchSystem.generatePatches(intent, context);
      
      // For now, return single patch wrapped in array
      return [patches];
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate patches';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [patchSystem, gameStore]);

  const validatePatch = useCallback(async (patch: PatchPlan): Promise<PatchValidationResult> => {
    try {
      return await patchSystem.validatePatch(patch);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate patch';
      setError(errorMessage);
      throw err;
    }
  }, [patchSystem]);

  const applyPatch = useCallback(async (patch: PatchPlan, action: 'apply' | 'refactor' | 'question') => {
    try {
      const result = await patchSystem.applyPatch(patch, action);
      
      // Update game state based on patch application
      const meterEffects = {
        stability: patch.stabilityEffect,
        insight: patch.insightEffect,
        description: `${action} patch: ${patch.title}`
      };

      gameStore.updateMeters(meterEffects);
      
      // Add player choice record
      gameStore.addPlayerChoice({
        action,
        intent: `Apply patch: ${patch.title}`,
        ghostId: patch.id, // Using patch ID as ghost reference
        roomKey: gameStore.currentRoom,
        meterEffects,
        outcome: result.success ? 'success' : 'failure'
      });

      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply patch';
      setError(errorMessage);
      throw err;
    }
  }, [patchSystem, gameStore]);

  return {
    isGenerating,
    error,
    generatePatches,
    validatePatch,
    applyPatch
  };
}