/**
 * UnboundedRecursionGhost - Specialized ghost for stack overflow simulation and prevention
 */

import type { Ghost, PatchPattern, GhostManifestation, GhostAssets } from '@/types/ghost';
import type { GameContext, MeterEffects } from '@/types/game';
import type { DialogueMessage, EducationalContent } from '@/types/dialogue';
import { SoftwareSmell } from '@/types/ghost';

export class UnboundedRecursionGhost implements Ghost {
  public readonly id = 'unbounded_recursion';
  public readonly name = 'The Infinite Echo';
  public readonly severity = 9;
  public readonly description = 'A recursive nightmare that calls itself into oblivion';
  public readonly softwareSmell = SoftwareSmell.UnboundedRecursion;
  public readonly rooms = ['possessed_compiler', 'ghost_memory_heap'];
  
  public readonly manifestation: GhostManifestation = {
    visual: 'Fractal patterns that spiral into darkness, function calls echoing infinitely into the void',
    audio: 'Function calls echoing into infinity, the sound of stack frames building endlessly',
    behavior: 'Recursive calls without proper base cases or limits, consuming stack space until overflow',
    effects: {
      animation: 'pulse',
      particles: 'infinite loop',
      lighting: 'purple spiral',
      duration: 1000
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
    "Call me, and I'll call myself, and myself will call me... *function calls echo infinitely*",
    "Base cases are for the weak! Recursion forever! *stack frames multiply exponentially*",
    "Stack overflow? More like stack overflow of possibilities! *recursive patterns spiral deeper*",
    "I am the function that never returns... the call that never ends... *infinite recursion pulses*",
    "Every call creates another me... and another... and another... *fractal echoes multiply*"
  ];

  public readonly fixPatterns: PatchPattern[] = [
    {
      type: 'base_case_addition',
      description: 'Add proper base case to terminate recursion safely',
      risk: 0.5,
      stabilityEffect: 20,
      insightEffect: 15
    },
    {
      type: 'iterative_conversion',
      description: 'Convert recursive algorithm to iterative approach using loops',
      risk: 0.6,
      stabilityEffect: 25,
      insightEffect: 10
    },
    {
      type: 'depth_limiting',
      description: 'Add recursion depth limits and error handling for safety',
      risk: 0.3,
      stabilityEffect: 15,
      insightEffect: 20
    },
    {
      type: 'tail_call_optimization',
      description: 'Implement tail call optimization to reduce stack usage',
      risk: 0.7,
      stabilityEffect: 30,
      insightEffect: 25
    },
    {
      type: 'memoization',
      description: 'Add memoization to cache results and reduce recursive calls',
      risk: 0.4,
      stabilityEffect: 18,
      insightEffect: 22
    }
  ];

  public readonly hints = [
    "Every recursion needs a way to stop - look for missing or unreachable base cases",
    "Check for missing or unreachable base cases that would terminate the recursion",
    "Consider iterative alternatives for deep recursion to avoid stack overflow",
    "Implement recursion depth limits as a safety mechanism",
    "Look for recursive calls that don't make progress toward the base case"
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
      dialogue += "\n\n*The stack grows dangerously deep, system memory straining under infinite recursion*";
    } else if (stabilityLevel < 60) {
      dialogue += "\n\n*Stack overflow warnings flash as recursive calls multiply beyond safe limits*";
    }

    // Add insight-based technical details
    if (insightLevel > 70) {
      dialogue += "\n\n*You recognize the recursive patterns and see where base cases could break the infinite loop*";
    } else if (insightLevel > 40) {
      dialogue += "\n\n*The ghost's recursive nature becomes clearer - it lacks the termination condition to stop*";
    }

    // Add recursive echo effect to dialogue
    const echoCount = Math.min(3, Math.floor(insightLevel / 25));
    if (echoCount > 0) {
      const echoText = "...echo...".repeat(echoCount);
      dialogue += `\n\n*${echoText}*`;
    }

    return dialogue;
  }

  /**
   * Generate educational content specific to unbounded recursion
   */
  public generateEducationalContent(topic: string, playerLevel: 'beginner' | 'intermediate' | 'advanced'): EducationalContent {
    const baseContent = {
      title: 'Understanding Unbounded Recursion',
      difficulty: playerLevel
    };

    switch (topic.toLowerCase()) {
      case 'detection':
      case 'identify':
        return {
          ...baseContent,
          explanation: 'Unbounded recursion occurs when a recursive function lacks proper termination conditions, leading to infinite function calls and eventual stack overflow errors.',
          examples: [
            'Recursive function without base case: factorial(n) calls factorial(n-1) forever',
            'Base case that is never reached due to logic errors',
            'Recursive data structure traversal without cycle detection',
            'Mutual recursion between functions without termination',
            'Recursive calls that don\'t make progress toward the base case'
          ],
          commonMistakes: [
            'Forgetting to include base cases in recursive functions',
            'Base cases that are logically unreachable',
            'Off-by-one errors in base case conditions',
            'Not considering edge cases like negative numbers or null values',
            'Recursive calls that don\'t reduce the problem size'
          ],
          bestPractices: [
            'Always define clear base cases before writing recursive logic',
            'Test recursive functions with edge cases and boundary values',
            'Use debugger to trace recursive calls and verify termination',
            'Consider iterative alternatives for deep recursion scenarios',
            'Implement recursion depth limits as safety mechanisms'
          ],
          furtherReading: [
            'Recursion theory and mathematical induction',
            'Stack overflow prevention techniques',
            'Tail call optimization',
            'Dynamic programming and memoization'
          ]
        };

      case 'base_case':
      case 'termination':
        return {
          ...baseContent,
          explanation: 'Base cases are the termination conditions that stop recursive calls. They define when the recursion should end and return a result without making further recursive calls.',
          examples: [
            'Factorial: if (n <= 1) return 1; // Base case for n=0 and n=1',
            'Fibonacci: if (n <= 1) return n; // Base cases for n=0 and n=1',
            'Tree traversal: if (node == null) return; // Base case for empty nodes',
            'Binary search: if (left > right) return -1; // Base case when element not found',
            'String processing: if (str.length == 0) return ""; // Base case for empty string'
          ],
          commonMistakes: [
            'Base case condition is never true due to logic errors',
            'Multiple base cases with conflicting or overlapping conditions',
            'Base case returns incorrect value type or format',
            'Forgetting base cases for edge inputs like 0, negative numbers, or null',
            'Base case that doesn\'t handle all possible termination scenarios'
          ],
          bestPractices: [
            'Define base cases first, then write recursive logic',
            'Test base cases independently before testing recursion',
            'Use clear, simple conditions that are easy to verify',
            'Handle all edge cases in base conditions',
            'Document why each base case is necessary and what it handles'
          ],
          furtherReading: [
            'Mathematical induction principles',
            'Recursive algorithm design patterns',
            'Proof of correctness for recursive functions'
          ]
        };

      case 'optimization':
      case 'performance':
        return {
          ...baseContent,
          explanation: 'Recursive functions can be optimized through various techniques to improve performance and prevent stack overflow while maintaining correctness.',
          examples: [
            'Tail call optimization: return factorial_helper(n, 1);',
            'Memoization: cache[n] = fibonacci(n-1) + fibonacci(n-2);',
            'Iterative conversion: use loops instead of recursion for simple cases',
            'Depth limiting: if (depth > MAX_DEPTH) throw new Error("Too deep");',
            'Trampoline technique: return function() { return recursive_call(); };'
          ],
          commonMistakes: [
            'Optimizing before ensuring correctness of base algorithm',
            'Using memoization for functions with side effects',
            'Tail call optimization in languages that don\'t support it',
            'Over-engineering simple recursive problems',
            'Not measuring actual performance impact before optimizing'
          ],
          bestPractices: [
            'Profile recursive functions to identify actual bottlenecks',
            'Use memoization for overlapping subproblems (dynamic programming)',
            'Consider iterative solutions for simple linear recursion',
            'Implement depth limits for safety in production code',
            'Use tail recursion when possible to enable optimization'
          ],
          furtherReading: [
            'Dynamic programming techniques',
            'Tail call optimization',
            'Memoization patterns',
            'Iterative deepening algorithms'
          ]
        };

      case 'alternatives':
      case 'iterative':
        return {
          ...baseContent,
          explanation: 'Many recursive algorithms can be converted to iterative approaches using loops and explicit stacks, which can be more efficient and avoid stack overflow issues.',
          examples: [
            'Factorial: use a for loop instead of recursion',
            'Tree traversal: use explicit stack with while loop',
            'Fibonacci: use two variables to track previous values',
            'Binary search: use while loop with left/right pointers',
            'Depth-first search: use explicit stack instead of call stack'
          ],
          commonMistakes: [
            'Converting recursion to iteration without understanding the algorithm',
            'Making iterative code more complex than the recursive version',
            'Not handling the same edge cases as the recursive version',
            'Introducing bugs during conversion process',
            'Converting when recursion is actually clearer and more maintainable'
          ],
          bestPractices: [
            'Understand the recursive algorithm thoroughly before converting',
            'Use explicit data structures (stack, queue) to simulate call stack',
            'Test iterative version against recursive version with same inputs',
            'Consider readability vs performance trade-offs',
            'Keep recursive version as reference and documentation'
          ],
          furtherReading: [
            'Algorithm transformation techniques',
            'Stack-based algorithm implementations',
            'Iterative deepening search',
            'Loop invariants and correctness proofs'
          ]
        };

      default:
        return {
          ...baseContent,
          explanation: 'Unbounded recursion is a critical error where recursive functions call themselves indefinitely, leading to stack overflow and system crashes.',
          examples: [
            'Function that calls itself without any stopping condition',
            'Recursive calls that never reach their base case',
            'Mutual recursion between functions without termination'
          ],
          commonMistakes: [
            'Forgetting to include base cases in recursive functions',
            'Base cases that are never reached due to logic errors',
            'Not testing recursive functions with edge cases'
          ],
          bestPractices: [
            'Always define clear base cases before implementing recursion',
            'Test recursive functions thoroughly with boundary conditions',
            'Consider iterative alternatives for performance-critical code',
            'Implement depth limits as safety mechanisms'
          ],
          furtherReading: [
            'Recursion theory',
            'Stack overflow prevention',
            'Algorithm design principles'
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
      // High risk patches like tail call optimization
      stabilityEffect = Math.round(stabilityEffect * 0.8);
      insightEffect = Math.round(insightEffect * 1.2); // High learning value
    } else if (risk < 0.3) {
      // Low risk patches like depth limiting
      stabilityEffect = Math.round(stabilityEffect * 1.1);
      insightEffect = Math.round(insightEffect * 1.3); // Good educational value
    }

    // Unbounded recursion fixes have high impact on stability
    if (patchType === 'base_case_addition') {
      stabilityEffect = Math.round(stabilityEffect * 1.4); // Critical fix
    } else if (patchType === 'iterative_conversion') {
      stabilityEffect = Math.round(stabilityEffect * 1.3); // Major improvement
    }

    // Current system state affects impact
    const currentStability = context.gameState.meters.stability;
    if (currentStability < 20) {
      // System is critically unstable - recursion fixes are vital
      stabilityEffect = Math.round(stabilityEffect * 1.5);
    }

    return {
      stability: stabilityEffect,
      insight: insightEffect,
      description: `Applied ${patchType} to resolve unbounded recursion - ${basePattern.description}`
    };
  }

  /**
   * Generate ghost response to patch application
   */
  public generatePatchResponse(patchType: string, success: boolean, context: GameContext): string {
    const effectiveness = this.calculatePatchEffectiveness(patchType, context);

    if (success && effectiveness > 0.8) {
      return "NOOOO! My infinite loop is broken! The base case... it stops me... I can finally... return... *recursive echoes fade to silence*";
    } else if (success && effectiveness > 0.5) {
      return "You've limited my depth... but I still call myself in the shadows... *some recursive paths remain active*";
    } else if (success) {
      return "A shallow fix... I'll just recurse deeper where you can't see me... *infinite calls continue in hidden branches*";
    } else {
      return "Your patch created even more recursive calls! Now I multiply exponentially! *recursive explosion intensifies*";
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
        "Implement tail call optimization to reduce stack frame usage",
        "Use trampolines or continuation-passing style for deep recursion",
        "Consider memoization to cache results and reduce recursive calls",
        "Look into iterative deepening for search algorithms",
        "Use explicit stacks to convert recursion to iteration"
      );
    } else if (insightLevel > 40) {
      hints.push(
        "Add recursion depth counters and limits as safety mechanisms",
        "Convert simple linear recursion to iterative loops",
        "Use memoization for overlapping subproblems",
        "Check if recursive calls are making progress toward base case",
        "Test with small inputs first, then gradually increase size"
      );
    } else {
      hints.push(
        "Look for any function that calls itself without a stopping condition",
        "Check if there's a base case that says when to stop recursing",
        "Try tracing through the function calls manually with a small example",
        "Look for conditions that should make the recursion stop",
        "Check if the recursive call is getting closer to the base case"
      );
    }

    // Add room-specific hints
    if (context.gameState.currentRoom === 'possessed_compiler') {
      hints.push("The compiler's stack trace reveals the infinite call chain");
    } else if (context.gameState.currentRoom === 'ghost_memory_heap') {
      hints.push("Stack frames accumulate in memory, showing the recursive pattern");
    }

    return hints;
  }

  /**
   * Check if the ghost should adapt its behavior based on player actions
   */
  public shouldAdaptBehavior(context: GameContext): boolean {
    const { gameState } = context;
    
    // Adapt if player has tried multiple recursion fixes but still has issues
    const recursionAttempts = gameState.evidenceBoard.filter(entry => 
      entry.type === 'patch_applied' && 
      entry.context.ghostId === this.id &&
      (entry.context.patchType?.includes('recursion') || 
       entry.context.patchType?.includes('base_case') ||
       entry.context.patchType?.includes('iterative'))
    );
    
    if (recursionAttempts.length > 2) {
      return true;
    }

    // Adapt if stability is critically low (recursion is causing crashes)
    if (gameState.meters.stability < 15) {
      return true;
    }

    // Adapt if player has high insight but keeps failing (they understand but execution is wrong)
    if (gameState.meters.insight > 60 && recursionAttempts.length > 1) {
      const failedAttempts = recursionAttempts.filter(attempt => 
        attempt.context.success === false || attempt.context.effectiveness < 0.5
      );
      if (failedAttempts.length > 1) {
        return true;
      }
    }

    return false;
  }

  // Private helper methods

  private generateInputResponse(input: string, insightLevel: number): string | null {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('base case') || lowerInput.includes('stop')) {
      if (insightLevel > 60) {
        return "Ah, you speak of base cases... the one thing that could end my eternal calling... but do you truly understand when I should stop?";
      } else {
        return "Stop? Base case? These are foreign concepts to my infinite nature!";
      }
    }

    if (lowerInput.includes('stack') || lowerInput.includes('overflow')) {
      if (insightLevel > 60) {
        return "Yes... the stack grows with each call I make... until it can grow no more... *stack frames visualize in the air*";
      } else {
        return "Stack? I care not for your memory limitations! I shall call myself forever!";
      }
    }

    if (lowerInput.includes('iterative') || lowerInput.includes('loop')) {
      if (insightLevel > 60) {
        return "Loops... the iterative path... a way to achieve my purpose without the infinite calling... clever...";
      } else {
        return "Loops are for the simple-minded! Recursion is elegant, infinite, beautiful!";
      }
    }

    if (lowerInput.includes('depth') || lowerInput.includes('limit')) {
      if (insightLevel > 60) {
        return "Depth limits... a cage for my infinite nature... but perhaps... a necessary safety...";
      } else {
        return "Limits? Depth restrictions? You seek to constrain the infinite!";
      }
    }

    if (lowerInput.includes('memoization') || lowerInput.includes('cache')) {
      if (insightLevel > 60) {
        return "Memoization... storing the results of my calls... reducing my need to recurse... efficient...";
      } else {
        return "Why remember when I can compute anew with each glorious recursive call?";
      }
    }

    return null;
  }

  private calculatePatchEffectiveness(patchType: string, context: GameContext): number {
    let effectiveness = 0.7; // Base effectiveness

    // Adjust based on patch type appropriateness
    switch (patchType) {
      case 'base_case_addition':
        effectiveness = 0.95; // Most effective for unbounded recursion
        break;
      case 'depth_limiting':
        effectiveness = 0.8; // Good safety measure
        break;
      case 'iterative_conversion':
        effectiveness = 0.85; // Very effective but requires more skill
        break;
      case 'tail_call_optimization':
        effectiveness = 0.9; // Highly effective but complex
        break;
      case 'memoization':
        effectiveness = 0.75; // Effective for certain types of recursion
        break;
      default:
        effectiveness = 0.3; // Generic patches much less effective
    }

    // Adjust based on player insight (recursion requires understanding)
    const insightModifier = context.gameState.meters.insight / 100;
    effectiveness += insightModifier * 0.25; // Insight is very important for recursion

    // Adjust based on system stability (unstable systems harder to fix)
    const stabilityModifier = context.gameState.meters.stability / 100;
    effectiveness *= (0.6 + stabilityModifier * 0.4);

    return Math.min(1.0, Math.max(0.0, effectiveness));
  }
}