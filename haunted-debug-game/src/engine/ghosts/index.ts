/**
 * Ghost implementations index - exports all specialized ghost classes and behavior system
 */

export { CircularDependencyGhost } from './CircularDependencyGhost';
export { StaleCacheGhost } from './StaleCacheGhost';
export { UnboundedRecursionGhost } from './UnboundedRecursionGhost';
export { PromptInjectionGhost } from './PromptInjectionGhost';
export { DataLeakGhost } from './DataLeakGhost';
export { GhostBehaviorSystem } from './GhostBehaviorSystem';

export type {
  GhostPersonality,
  GhostBehaviorState,
  RoomBehaviorModifier,
  AdaptiveBehaviorRule
} from './GhostBehaviorSystem';

/**
 * Factory function to create ghost instances
 */
export async function createGhostInstance(ghostId: string): Promise<any> {
  switch (ghostId) {
    case 'circular_dependency': {
      const { CircularDependencyGhost } = await import('./CircularDependencyGhost');
      return new CircularDependencyGhost();
    }
    case 'stale_cache': {
      const { StaleCacheGhost } = await import('./StaleCacheGhost');
      return new StaleCacheGhost();
    }
    case 'unbounded_recursion': {
      const { UnboundedRecursionGhost } = await import('./UnboundedRecursionGhost');
      return new UnboundedRecursionGhost();
    }
    case 'prompt_injection': {
      const { PromptInjectionGhost } = await import('./PromptInjectionGhost');
      return new PromptInjectionGhost();
    }
    case 'data_leak': {
      const { DataLeakGhost } = await import('./DataLeakGhost');
      return new DataLeakGhost();
    }
    default:
      throw new Error(`Unknown ghost type: ${ghostId}`);
  }
}

/**
 * Get all available ghost types
 */
export function getAvailableGhostTypes(): string[] {
  return [
    'circular_dependency',
    'stale_cache', 
    'unbounded_recursion',
    'prompt_injection',
    'data_leak'
  ];
}

/**
 * Enhanced ghost interface that includes behavioral methods
 */
export interface EnhancedGhost {
  // Base Ghost interface properties
  id: string;
  name: string;
  severity: number;
  description: string;
  softwareSmell: string;
  rooms: string[];
  manifestation: any;
  assets?: any;
  dialoguePrompts: string[];
  fixPatterns: any[];
  hints: string[];

  // Enhanced behavioral methods
  generateContextualDialogue(context: any, playerInput?: string): string;
  generateEducationalContent(topic: string, playerLevel: 'beginner' | 'intermediate' | 'advanced'): any;
  calculatePatchEffects(patchType: string, risk: number, context: any): any;
  generatePatchResponse(patchType: string, success: boolean, context: any): string;
  getContextualHints(context: any): string[];
  shouldAdaptBehavior(context: any): boolean;
}