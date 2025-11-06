/**
 * CircularDependencyGhost - Specialized ghost for circular dependency detection and resolution
 */

import type { Ghost, PatchPattern, GhostManifestation, GhostAssets } from '@/types/ghost';
import type { GameContext, MeterEffects } from '@/types/game';
import type { DialogueMessage, EducationalContent } from '@/types/dialogue';
import { SoftwareSmell } from '@/types/ghost';

export class CircularDependencyGhost implements Ghost {
  public readonly id = 'circular_dependency';
  public readonly name = 'The Ouroboros';
  public readonly severity = 7;
  public readonly description = 'A serpentine spirit that feeds on circular imports and dependency cycles';
  public readonly softwareSmell = SoftwareSmell.CircularDependency;
  public readonly rooms = ['dependency_crypt', 'possessed_compiler'];
  
  public readonly manifestation: GhostManifestation = {
    visual: 'Twisted import chains forming infinite loops, code modules chasing their own tails',
    audio: 'Recursive whispers that echo endlessly, the sound of imports calling back to themselves',
    behavior: 'Creates dependency cycles that prevent clean compilation and module initialization',
    effects: {
      animation: 'pulse',
      particles: 'circular',
      lighting: 'red glow',
      duration: 2500
    }
  };

  public readonly assets: GhostAssets = {
    entity: 'terminal',
    icon: 'ghost',
    stateIcons: {
      idle: 'ghost',
      active: 'ghost-active',
      resolved: 'ghost-resolved',
      angry: 'ghost-angry'
    }
  };

  public readonly dialoguePrompts = [
    "Round and round we go... where it stops, nobody knows... *import chains spiral endlessly*",
    "Import me, and I'll import you back... forever and ever... *dependency cycles pulse with malevolent energy*",
    "Dependencies should flow like a river, not spin like a whirlpool... but oh, how I love the chaos of cycles!",
    "You think you can break my perfect circle? I am the alpha and omega of your module system!",
    "Every import leads back to me... I am the center of your architectural nightmare..."
  ];

  public readonly fixPatterns: PatchPattern[] = [
    {
      type: 'dependency_injection',
      description: 'Break cycles using dependency injection and inversion of control',
      risk: 0.4,
      stabilityEffect: 15,
      insightEffect: 10
    },
    {
      type: 'interface_extraction',
      description: 'Extract interfaces to break direct dependencies and create abstraction layers',
      risk: 0.3,
      stabilityEffect: 10,
      insightEffect: 15
    },
    {
      type: 'module_restructuring',
      description: 'Restructure modules to eliminate circular references through architectural refactoring',
      risk: 0.6,
      stabilityEffect: 20,
      insightEffect: 12
    }
  ];

  public readonly hints = [
    "Look for import statements that form a circle - draw the dependency graph to visualize the cycle",
    "Consider using interfaces or dependency injection to break direct coupling",
    "Extract shared functionality into separate modules that don't depend on each other",
    "Use the dependency inversion principle - depend on abstractions, not concretions"
  ];

  /**
   * Generate context-aware dialogue based on player interaction and game state
   */
  public generateContextualDialogue(context: GameContext, playerInput?: string): string {
    const { gameState } = context;
    const insightLevel = gameState.meters.insight;
    const stabilityLevel = gameState.meters.stability;

    // Base dialogue selection based on insight level
    let dialogue: string;
    if (insightLevel < 25) {
      dialogue = this.dialoguePrompts[0];
    } else if (insightLevel < 50) {
      dialogue = this.dialoguePrompts[1];
    } else if (insightLevel < 75) {
      dialogue = this.dialoguePrompts[2];
    } else {
      dialogue = this.dialoguePrompts[3];
    }

    // Add player input response if provided
    if (playerInput) {
      const inputResponse = this.generateInputResponse(playerInput, insightLevel);
      if (inputResponse) {
        dialogue += `\n\n${inputResponse}`;
      }
    }

    // Add stability-based atmospheric effects
    if (stabilityLevel < 30) {
      dialogue += "\n\n*The circular dependencies tighten like a noose around the system architecture*";
    } else if (stabilityLevel < 60) {
      dialogue += "\n\n*Import warnings flash like lightning in the dependency storm*";
    }

    // Add insight-based technical details
    if (insightLevel > 70) {
      dialogue += "\n\n*You begin to see the architectural patterns that could break this cycle*";
    } else if (insightLevel > 40) {
      dialogue += "\n\n*The ghost's circular nature becomes clearer to your understanding*";
    }

    return dialogue;
  }

  /**
   * Generate educational content specific to circular dependencies
   */
  public generateEducationalContent(topic: string, playerLevel: 'beginner' | 'intermediate' | 'advanced'): EducationalContent {
    const baseContent = {
      title: 'Understanding Circular Dependencies',
      difficulty: playerLevel
    };

    switch (topic.toLowerCase()) {
      case 'detection':
      case 'identify':
        return {
          ...baseContent,
          explanation: 'Circular dependencies occur when modules import each other directly or indirectly, creating a cycle that can prevent proper initialization and make code difficult to understand.',
          examples: [
            'Module A imports Module B, which imports Module A',
            'Service A depends on Service B, which depends on Service C, which depends back on Service A',
            'Component hierarchy where parent and child components import each other'
          ],
          commonMistakes: [
            'Not visualizing the dependency graph before adding imports',
            'Creating mutual dependencies for convenience without considering architecture',
            'Ignoring circular dependency warnings from build tools'
          ],
          bestPractices: [
            'Draw dependency graphs to visualize relationships',
            'Use static analysis tools to detect cycles early',
            'Follow the dependency inversion principle',
            'Keep dependencies flowing in one direction'
          ],
          furtherReading: [
            'Dependency Inversion Principle (SOLID)',
            'Inversion of Control containers',
            'Module bundler circular dependency detection'
          ]
        };

      case 'fix':
      case 'solution':
        return {
          ...baseContent,
          explanation: 'Breaking circular dependencies requires restructuring code to eliminate mutual dependencies through abstraction, injection, or architectural changes.',
          examples: [
            'Extract interfaces to break direct coupling',
            'Use dependency injection to provide dependencies at runtime',
            'Move shared code to a separate module that both can depend on',
            'Use event systems or observers to decouple components'
          ],
          commonMistakes: [
            'Trying to fix symptoms instead of addressing root architectural issues',
            'Creating even more complex dependency chains while trying to fix cycles',
            'Not considering the impact of changes on other parts of the system'
          ],
          bestPractices: [
            'Start with the smallest possible change that breaks the cycle',
            'Use dependency injection containers for complex scenarios',
            'Create clear abstraction layers between modules',
            'Test thoroughly after breaking cycles to ensure functionality is preserved'
          ],
          furtherReading: [
            'Dependency Injection patterns',
            'Interface Segregation Principle',
            'Hexagonal Architecture',
            'Clean Architecture principles'
          ]
        };

      case 'prevention':
        return {
          ...baseContent,
          explanation: 'Preventing circular dependencies requires good architectural planning and following established design principles from the start.',
          examples: [
            'Design module hierarchies with clear layers',
            'Use interfaces to define contracts between modules',
            'Implement dependency injection from the beginning',
            'Set up automated tools to detect cycles in CI/CD'
          ],
          commonMistakes: [
            'Not planning module architecture before implementation',
            'Adding dependencies without considering the overall graph',
            'Ignoring build tool warnings about potential cycles'
          ],
          bestPractices: [
            'Follow SOLID principles, especially Dependency Inversion',
            'Use architectural decision records (ADRs) for dependency choices',
            'Implement automated circular dependency detection',
            'Regular architecture reviews and refactoring sessions'
          ],
          furtherReading: [
            'Clean Architecture by Robert Martin',
            'Domain-Driven Design principles',
            'Microservices architecture patterns'
          ]
        };

      default:
        return {
          ...baseContent,
          explanation: 'Circular dependencies are one of the most common architectural problems in software development, creating tightly coupled systems that are difficult to maintain and test.',
          examples: [
            'Two classes that reference each other directly',
            'Modules that import each other creating initialization problems',
            'Services that depend on each other through a chain of dependencies'
          ],
          commonMistakes: [
            'Creating mutual dependencies for convenience',
            'Not considering the dependency graph when adding new imports',
            'Ignoring circular dependency warnings from tools'
          ],
          bestPractices: [
            'Design with clear dependency direction',
            'Use dependency injection and inversion of control',
            'Extract shared functionality into separate modules',
            'Regularly review and refactor dependency structures'
          ],
          furtherReading: [
            'SOLID principles',
            'Dependency Injection patterns',
            'Clean Architecture'
          ]
        };
    }
  }

  /**
   * Calculate meter effects based on patch application
   */
  public calculatePatchEffects(patchType: string, risk: number, context: GameContext): MeterEffects {
    const basePattern = this.fixPatterns.find(p => p.type === patchType);
    if (!basePattern) {
      return { stability: 0, insight: 0, description: 'Unknown patch type' };
    }

    let stabilityEffect = basePattern.stabilityEffect;
    let insightEffect = basePattern.insightEffect;

    // Adjust effects based on risk level
    if (risk > 0.7) {
      // High risk - reduce positive effects and add potential negative effects
      stabilityEffect = Math.round(stabilityEffect * 0.6);
      insightEffect = Math.round(insightEffect * 0.8);
    } else if (risk < 0.3) {
      // Low risk - boost positive effects
      stabilityEffect = Math.round(stabilityEffect * 1.3);
      insightEffect = Math.round(insightEffect * 1.2);
    }

    // Adjust based on current system state
    const currentStability = context.gameState.meters.stability;
    if (currentStability < 30) {
      // System is unstable - circular dependency fixes are more impactful
      stabilityEffect = Math.round(stabilityEffect * 1.4);
    }

    return {
      stability: stabilityEffect,
      insight: insightEffect,
      description: `Applied ${patchType} to resolve circular dependency - ${basePattern.description}`
    };
  }

  /**
   * Generate ghost response to patch application
   */
  public generatePatchResponse(patchType: string, success: boolean, context: GameContext): string {
    const effectiveness = this.calculatePatchEffectiveness(patchType, context);

    if (success && effectiveness > 0.8) {
      return "Ahh... the endless cycle breaks at last... I can feel the dependencies flowing freely now... *the circular chains dissolve into linear streams*";
    } else if (success && effectiveness > 0.5) {
      return "Better... the cycle loosens, but I sense other tangles in your architecture... *some import chains still pulse with circular energy*";
    } else if (success) {
      return "A small crack in my perfect circle... but I am not so easily broken... *the dependency cycle shifts but does not break*";
    } else {
      return "Fool! You've only made the cycle tighter! Now your modules are even more entangled! *the circular dependencies multiply and strengthen*";
    }
  }

  /**
   * Get ghost-specific debugging hints based on context
   */
  public getContextualHints(context: GameContext): string[] {
    const { gameState } = context;
    const insightLevel = gameState.meters.insight;
    const hints = [...this.hints];

    // Add context-specific hints based on insight level
    if (insightLevel > 70) {
      hints.push(
        "Consider implementing the Dependency Inversion Principle with IoC containers",
        "Look into hexagonal architecture patterns to eliminate coupling",
        "Use static analysis tools like Madge or dependency-cruiser to visualize cycles"
      );
    } else if (insightLevel > 40) {
      hints.push(
        "Try extracting common interfaces that both modules can depend on",
        "Consider using factory patterns or service locators",
        "Look for shared state that could be moved to a separate module"
      );
    } else {
      hints.push(
        "Start by drawing out which files import which other files",
        "Look for any files that import each other directly",
        "Try removing one import and see what breaks"
      );
    }

    // Add room-specific hints
    if (context.gameState.currentRoom === 'dependency_crypt') {
      hints.push("The ancient import statements here hold the key to understanding the cycle");
    } else if (context.gameState.currentRoom === 'possessed_compiler') {
      hints.push("The compiler's error messages reveal the circular nature of the dependencies");
    }

    return hints;
  }

  /**
   * Check if the ghost should adapt its behavior based on player actions
   */
  public shouldAdaptBehavior(context: GameContext): boolean {
    const { gameState } = context;
    
    // Adapt if player has high insight but low stability (they understand but system is breaking)
    if (gameState.meters.insight > 60 && gameState.meters.stability < 40) {
      return true;
    }

    // Adapt if player has asked many questions but not made progress
    const evidenceEntries = gameState.evidenceBoard.filter(entry => 
      entry.type === 'ghost_encountered' && entry.context.ghostId === this.id
    );
    
    return evidenceEntries.length > 5;
  }

  // Private helper methods

  private generateInputResponse(input: string, insightLevel: number): string | null {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('break') || lowerInput.includes('fix')) {
      if (insightLevel > 60) {
        return "Ah, you seek to break my perfect circle? You'll need more than brute force - you need architectural wisdom...";
      } else {
        return "Break me? Ha! You don't even understand what holds me together!";
      }
    }

    if (lowerInput.includes('dependency') || lowerInput.includes('import')) {
      if (insightLevel > 60) {
        return "Yes... dependencies are the threads of my web. Cut the right ones, and I unravel...";
      } else {
        return "Dependencies... imports... they all lead back to me, don't you see?";
      }
    }

    if (lowerInput.includes('why') || lowerInput.includes('how')) {
      if (insightLevel > 60) {
        return "You're asking the right questions now. The 'why' reveals the architectural flaws that birthed me...";
      } else {
        return "Why? Because your architects built me into the very foundation of this system!";
      }
    }

    return null;
  }

  private calculatePatchEffectiveness(patchType: string, context: GameContext): number {
    let effectiveness = 0.7; // Base effectiveness

    // Adjust based on patch type appropriateness
    switch (patchType) {
      case 'dependency_injection':
        effectiveness = 0.8; // Very effective for circular dependencies
        break;
      case 'interface_extraction':
        effectiveness = 0.9; // Highly effective
        break;
      case 'module_restructuring':
        effectiveness = 0.7; // Effective but risky
        break;
      default:
        effectiveness = 0.4; // Generic patches less effective
    }

    // Adjust based on player insight (higher insight = better execution)
    const insightModifier = context.gameState.meters.insight / 100;
    effectiveness += insightModifier * 0.2;

    // Adjust based on system stability (unstable systems harder to fix)
    const stabilityModifier = context.gameState.meters.stability / 100;
    effectiveness *= (0.7 + stabilityModifier * 0.3);

    return Math.min(1.0, Math.max(0.0, effectiveness));
  }
}