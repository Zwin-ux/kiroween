/**
 * EducationalFeedbackSystem - Contextual explanations and adaptive learning support
 */

import { LearningAnalytics, type SkillAssessment, type AdaptiveDifficultySettings } from './LearningAnalytics';
import type { PlayerChoice, EvidenceEntry } from '@/types/game';
import type { Ghost } from '@/types/content';
import type { PatchPlan } from '@/types/patch';
import type { ActionResult } from '@/types/encounter';

export interface EducationalFeedback {
  id: string;
  timestamp: Date;
  context: {
    ghost: Ghost;
    patch?: PatchPlan;
    action: 'apply' | 'refactor' | 'question';
    outcome: 'success' | 'failure' | 'partial';
  };
  explanations: {
    decision: string;
    consequences: string;
    alternatives: string;
    learningPoints: string[];
  };
  skillAssessments: SkillAssessment[];
  recommendations: {
    immediate: string[];
    longTerm: string[];
    resources: string[];
  };
  adaptiveDifficulty: AdaptiveDifficultySettings;
}

export interface ConceptExplanation {
  concept: string;
  definition: string;
  importance: string;
  examples: string[];
  commonMistakes: string[];
  bestPractices: string[];
  relatedConcepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class EducationalFeedbackSystem {
  private learningAnalytics: LearningAnalytics;
  private feedbackHistory: EducationalFeedback[] = [];
  private conceptExplanations: Map<string, ConceptExplanation> = new Map();

  constructor() {
    this.learningAnalytics = new LearningAnalytics();
    this.initializeConceptExplanations();
  }

  /**
   * Initialize concept explanations database
   */
  private initializeConceptExplanations(): void {
    const explanations: ConceptExplanation[] = [
      {
        concept: 'circular_dependency',
        definition: 'A circular dependency occurs when two or more modules depend on each other directly or indirectly, creating a cycle.',
        importance: 'Circular dependencies make code harder to understand, test, and maintain. They can also cause issues with module loading and compilation.',
        examples: [
          'Module A imports Module B, which imports Module A',
          'Component depends on service, service depends on component',
          'Three modules forming a dependency triangle'
        ],
        commonMistakes: [
          'Not recognizing indirect circular dependencies',
          'Creating tight coupling between modules',
          'Ignoring dependency direction in architecture'
        ],
        bestPractices: [
          'Use dependency injection to invert dependencies',
          'Extract common interfaces to break cycles',
          'Follow layered architecture principles',
          'Use events or observers for loose coupling'
        ],
        relatedConcepts: ['dependency_injection', 'inversion_of_control', 'layered_architecture'],
        difficulty: 'intermediate'
      },
      {
        concept: 'memory_leak',
        definition: 'A memory leak occurs when allocated memory is not properly released, causing the application to consume increasing amounts of memory over time.',
        importance: 'Memory leaks can lead to performance degradation, application crashes, and poor user experience, especially in long-running applications.',
        examples: [
          'Event listeners not removed when components unmount',
          'Timers or intervals not cleared',
          'DOM references held after elements are removed',
          'Closures holding references to large objects'
        ],
        commonMistakes: [
          'Forgetting to clean up event listeners',
          'Not clearing timers and intervals',
          'Holding references in global variables',
          'Creating accidental closures'
        ],
        bestPractices: [
          'Always clean up resources in cleanup functions',
          'Use weak references for caches and observers',
          'Clear timers and intervals when no longer needed',
          'Be mindful of closure scope and references'
        ],
        relatedConcepts: ['garbage_collection', 'resource_management', 'component_lifecycle'],
        difficulty: 'intermediate'
      },
      {
        concept: 'code_duplication',
        definition: 'Code duplication occurs when the same or very similar code appears in multiple places in the codebase.',
        importance: 'Duplicated code violates the DRY principle and makes maintenance harder because changes need to be made in multiple places.',
        examples: [
          'Same validation logic copied across multiple forms',
          'Identical error handling in multiple functions',
          'Repeated data transformation code',
          'Similar UI components with slight variations'
        ],
        commonMistakes: [
          'Copy-pasting code without extracting common functionality',
          'Not recognizing subtle duplication patterns',
          'Creating similar but not identical code',
          'Duplicating logic instead of data'
        ],
        bestPractices: [
          'Extract common functionality into reusable functions',
          'Use composition over inheritance',
          'Create utility modules for shared logic',
          'Parameterize differences instead of duplicating'
        ],
        relatedConcepts: ['dry_principle', 'refactoring', 'code_reuse', 'abstraction'],
        difficulty: 'beginner'
      },
      {
        concept: 'large_class',
        definition: 'A large class is a class that has grown too big, often violating the Single Responsibility Principle by trying to do too many things.',
        importance: 'Large classes are hard to understand, test, and maintain. They often indicate poor separation of concerns and tight coupling.',
        examples: [
          'A class with hundreds of lines and dozens of methods',
          'A component handling multiple unrelated responsibilities',
          'A service managing different types of data operations',
          'A utility class with many unrelated helper methods'
        ],
        commonMistakes: [
          'Adding new functionality to existing classes without considering responsibility',
          'Not breaking down complex classes into smaller ones',
          'Mixing different levels of abstraction',
          'Creating god objects that know too much'
        ],
        bestPractices: [
          'Follow the Single Responsibility Principle',
          'Break large classes into smaller, focused ones',
          'Use composition to combine behaviors',
          'Extract related methods into separate classes'
        ],
        relatedConcepts: ['single_responsibility_principle', 'composition', 'modular_design'],
        difficulty: 'intermediate'
      },
      {
        concept: 'refactoring',
        definition: 'Refactoring is the process of improving code structure and design without changing its external behavior.',
        importance: 'Refactoring improves code quality, maintainability, and readability while reducing technical debt.',
        examples: [
          'Extracting methods from long functions',
          'Renaming variables and functions for clarity',
          'Moving code to more appropriate classes',
          'Simplifying complex conditional logic'
        ],
        commonMistakes: [
          'Refactoring without adequate test coverage',
          'Changing behavior while refactoring',
          'Refactoring too much at once',
          'Not communicating refactoring plans with the team'
        ],
        bestPractices: [
          'Ensure comprehensive test coverage before refactoring',
          'Make small, incremental changes',
          'Use automated refactoring tools when available',
          'Review and test thoroughly after each change'
        ],
        relatedConcepts: ['clean_code', 'technical_debt', 'code_quality'],
        difficulty: 'intermediate'
      }
    ];

    explanations.forEach(explanation => {
      this.conceptExplanations.set(explanation.concept, explanation);
    });
  }

  /**
   * Generate comprehensive educational feedback for a player decision
   */
  generateFeedback(
    choice: PlayerChoice,
    patch: PatchPlan | undefined,
    ghost: Ghost,
    result: ActionResult
  ): EducationalFeedback {
    const outcome = result.success ? 'success' : 'failure';
    
    // Record decision in learning analytics
    const skillAssessments = patch 
      ? this.learningAnalytics.recordDecision(choice, patch, ghost, outcome)
      : [];

    // Generate explanations
    const explanations = this.generateExplanations(choice, patch, ghost, result);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(choice, ghost, skillAssessments);
    
    // Get adaptive difficulty settings
    const adaptiveDifficulty = this.learningAnalytics.generateAdaptiveDifficulty();

    const feedback: EducationalFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      context: {
        ghost,
        patch,
        action: choice.action,
        outcome
      },
      explanations,
      skillAssessments,
      recommendations,
      adaptiveDifficulty
    };

    this.feedbackHistory.push(feedback);
    return feedback;
  }

  /**
   * Generate contextual explanations for the decision and its consequences
   */
  private generateExplanations(
    choice: PlayerChoice,
    patch: PatchPlan | undefined,
    ghost: Ghost,
    result: ActionResult
  ): EducationalFeedback['explanations'] {
    const softwareSmell = ghost.softwareSmell;
    const conceptExplanation = this.conceptExplanations.get(softwareSmell);

    // Decision explanation
    let decision = '';
    switch (choice.action) {
      case 'apply':
        decision = `You chose to apply the patch directly. This is a pragmatic approach that addresses the immediate problem. `;
        if (patch && patch.risk > 0.7) {
          decision += `However, this was a high-risk change that could have unintended consequences.`;
        } else {
          decision += `This was a relatively safe change with manageable risk.`;
        }
        break;
      case 'refactor':
        decision = `You chose to refactor the code. This shows excellent software engineering judgment as refactoring improves long-term code quality while maintaining functionality.`;
        break;
      case 'question':
        decision = `You chose to ask questions before making changes. This demonstrates mature debugging skills and critical thinking.`;
        break;
    }

    // Consequences explanation
    let consequences = '';
    if (result.success) {
      consequences = `Your decision was successful! `;
      if (result.effects) {
        if (result.effects.stability > 0) {
          consequences += `The system stability improved by ${result.effects.stability} points. `;
        }
        if (result.effects.insight > 0) {
          consequences += `You gained ${result.effects.insight} insight points from this experience.`;
        }
      }
    } else {
      consequences = `Your decision encountered some issues. `;
      consequences += result.message || 'The change may have introduced new problems or conflicts.';
    }

    // Alternatives explanation
    let alternatives = 'Alternative approaches you could have considered:\n';
    if (choice.action !== 'question') {
      alternatives += '• Asking more questions to better understand the problem\n';
    }
    if (choice.action !== 'refactor') {
      alternatives += '• Refactoring the code to improve its structure\n';
    }
    if (choice.action !== 'apply') {
      alternatives += '• Applying a targeted patch to fix the specific issue\n';
    }
    alternatives += '• Seeking additional context or consulting with team members';

    // Learning points
    const learningPoints: string[] = [];
    if (conceptExplanation) {
      learningPoints.push(`Understanding ${conceptExplanation.concept.replace('_', ' ')}: ${conceptExplanation.definition}`);
      learningPoints.push(...conceptExplanation.bestPractices.slice(0, 2));
    }
    
    learningPoints.push(`Risk assessment: ${patch ? `This change had a ${Math.round(patch.risk * 100)}% risk level` : 'Always evaluate the risk of code changes'}`);
    
    if (ghost.hints && ghost.hints.length > 0) {
      learningPoints.push(`Key insight: ${ghost.hints[0]}`);
    }

    return {
      decision,
      consequences,
      alternatives,
      learningPoints
    };
  }

  /**
   * Generate personalized recommendations based on skill assessments
   */
  private generateRecommendations(
    choice: PlayerChoice,
    ghost: Ghost,
    skillAssessments: SkillAssessment[]
  ): EducationalFeedback['recommendations'] {
    const immediate: string[] = [];
    const longTerm: string[] = [];
    const resources: string[] = [];

    // Immediate recommendations based on the current decision
    if (choice.action === 'apply') {
      immediate.push('Consider the long-term maintainability of quick fixes');
      immediate.push('Always test changes thoroughly before deployment');
    } else if (choice.action === 'refactor') {
      immediate.push('Document the refactoring rationale for future reference');
      immediate.push('Ensure all tests pass after refactoring');
    } else if (choice.action === 'question') {
      immediate.push('Use the insights from your questions to make informed decisions');
      immediate.push('Consider creating documentation based on what you learned');
    }

    // Long-term recommendations based on skill assessments
    const weakSkills = skillAssessments.filter(assessment => assessment.currentLevel < 0.5);
    const strongSkills = skillAssessments.filter(assessment => assessment.currentLevel > 0.7);

    if (weakSkills.length > 0) {
      longTerm.push(`Focus on developing: ${weakSkills.map(s => s.concept.replace('_', ' ')).join(', ')}`);
    }

    if (strongSkills.length > 0) {
      longTerm.push(`Leverage your strengths in: ${strongSkills.map(s => s.concept.replace('_', ' ')).join(', ')}`);
    }

    // Add general long-term recommendations
    longTerm.push('Practice identifying software smells in real codebases');
    longTerm.push('Study refactoring patterns and when to apply them');
    longTerm.push('Develop a systematic approach to risk assessment');

    // Resource recommendations
    resources.push('Martin Fowler\'s "Refactoring" book for refactoring techniques');
    resources.push('Robert C. Martin\'s "Clean Code" for code quality principles');
    resources.push('Online code review tools to practice identifying issues');
    resources.push('Static analysis tools to automatically detect code smells');

    // Add specific resources based on the software smell
    const conceptExplanation = this.conceptExplanations.get(ghost.softwareSmell);
    if (conceptExplanation) {
      resources.push(`Study ${conceptExplanation.concept.replace('_', ' ')} patterns and solutions`);
    }

    return {
      immediate,
      longTerm,
      resources
    };
  }

  /**
   * Get concept explanation by ID
   */
  getConceptExplanation(conceptId: string): ConceptExplanation | undefined {
    return this.conceptExplanations.get(conceptId);
  }

  /**
   * Get all available concept explanations
   */
  getAllConceptExplanations(): ConceptExplanation[] {
    return Array.from(this.conceptExplanations.values());
  }

  /**
   * Get feedback history
   */
  getFeedbackHistory(): EducationalFeedback[] {
    return [...this.feedbackHistory];
  }

  /**
   * Get learning analytics instance
   */
  getLearningAnalytics(): LearningAnalytics {
    return this.learningAnalytics;
  }

  /**
   * Generate contextual hints based on current skill level
   */
  generateContextualHints(ghost: Ghost, currentSkillLevel: number): string[] {
    const hints: string[] = [];
    const conceptExplanation = this.conceptExplanations.get(ghost.softwareSmell);

    if (!conceptExplanation) return hints;

    // Adjust hint complexity based on skill level
    if (currentSkillLevel < 0.3) {
      // Beginner hints
      hints.push(`This is a ${conceptExplanation.concept.replace('_', ' ')} issue`);
      hints.push(conceptExplanation.definition);
      if (conceptExplanation.examples.length > 0) {
        hints.push(`Example: ${conceptExplanation.examples[0]}`);
      }
    } else if (currentSkillLevel < 0.7) {
      // Intermediate hints
      hints.push(`Consider the ${conceptExplanation.importance}`);
      if (conceptExplanation.bestPractices.length > 0) {
        hints.push(`Best practice: ${conceptExplanation.bestPractices[0]}`);
      }
    } else {
      // Advanced hints
      hints.push(`Think about the relationship to: ${conceptExplanation.relatedConcepts.join(', ')}`);
      if (conceptExplanation.commonMistakes.length > 0) {
        hints.push(`Avoid: ${conceptExplanation.commonMistakes[0]}`);
      }
    }

    return hints;
  }

  /**
   * Start a new learning session
   */
  startLearningSession(): string {
    return this.learningAnalytics.startSession();
  }

  /**
   * End the current learning session
   */
  endLearningSession() {
    return this.learningAnalytics.endSession();
  }
}