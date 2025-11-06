/**
 * LearningAnalytics - Advanced learning progress tracking and adaptive difficulty
 */

import type { PlayerChoice, EvidenceEntry } from '@/types/game';
import type { Ghost } from '@/types/content';
import type { PatchPlan } from '@/types/patch';

export interface LearningConcept {
  id: string;
  name: string;
  description: string;
  category: 'debugging' | 'software_quality' | 'risk_assessment' | 'problem_solving';
  prerequisites: string[];
  masteryLevel: number; // 0-1
  practiceCount: number;
  lastPracticed: Date;
  improvementTrend: number; // -1 to 1
  relatedConcepts: string[];
}

export interface SkillAssessment {
  concept: string;
  currentLevel: number;
  targetLevel: number;
  improvement: number;
  confidence: number;
  recommendations: string[];
  nextSteps: string[];
}

export interface AdaptiveDifficultySettings {
  ghostComplexity: 'beginner' | 'intermediate' | 'advanced';
  patchRiskRange: [number, number];
  educationalSupport: 'minimal' | 'moderate' | 'extensive';
  hintFrequency: 'rare' | 'occasional' | 'frequent';
  explanationDepth: 'basic' | 'detailed' | 'comprehensive';
}

export interface LearningSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  conceptsPracticed: string[];
  skillImprovements: SkillAssessment[];
  mistakePatterns: string[];
  successPatterns: string[];
  overallProgress: number;
}

export class LearningAnalytics {
  private concepts: Map<string, LearningConcept> = new Map();
  private sessions: LearningSession[] = [];
  private currentSession: LearningSession | null = null;

  constructor() {
    this.initializeCoreConcepts();
  }

  /**
   * Initialize core learning concepts
   */
  private initializeCoreConcepts(): void {
    const coreConcepts: LearningConcept[] = [
      {
        id: 'debugging_methodology',
        name: 'Debugging Methodology',
        description: 'Systematic approach to identifying and fixing software issues',
        category: 'debugging',
        prerequisites: [],
        masteryLevel: 0.0,
        practiceCount: 0,
        lastPracticed: new Date(),
        improvementTrend: 0,
        relatedConcepts: ['problem_analysis', 'hypothesis_testing', 'solution_validation']
      },
      {
        id: 'software_smells_recognition',
        name: 'Software Smells Recognition',
        description: 'Ability to identify code quality issues and anti-patterns',
        category: 'software_quality',
        prerequisites: ['debugging_methodology'],
        masteryLevel: 0.0,
        practiceCount: 0,
        lastPracticed: new Date(),
        improvementTrend: 0,
        relatedConcepts: ['code_quality', 'refactoring', 'design_patterns']
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        description: 'Evaluating the risks and benefits of code changes',
        category: 'risk_assessment',
        prerequisites: ['software_smells_recognition'],
        masteryLevel: 0.0,
        practiceCount: 0,
        lastPracticed: new Date(),
        improvementTrend: 0,
        relatedConcepts: ['impact_analysis', 'testing_strategies', 'rollback_planning']
      },
      {
        id: 'refactoring_techniques',
        name: 'Refactoring Techniques',
        description: 'Knowledge of various code improvement techniques',
        category: 'software_quality',
        prerequisites: ['software_smells_recognition'],
        masteryLevel: 0.0,
        practiceCount: 0,
        lastPracticed: new Date(),
        improvementTrend: 0,
        relatedConcepts: ['design_patterns', 'clean_code', 'maintainability']
      },
      {
        id: 'critical_thinking',
        name: 'Critical Thinking',
        description: 'Asking the right questions and analyzing problems deeply',
        category: 'problem_solving',
        prerequisites: [],
        masteryLevel: 0.0,
        practiceCount: 0,
        lastPracticed: new Date(),
        improvementTrend: 0,
        relatedConcepts: ['problem_analysis', 'decision_making', 'analytical_skills']
      },
      {
        id: 'testing_mindset',
        name: 'Testing Mindset',
        description: 'Understanding the importance of testing and validation',
        category: 'software_quality',
        prerequisites: ['debugging_methodology'],
        masteryLevel: 0.0,
        practiceCount: 0,
        lastPracticed: new Date(),
        improvementTrend: 0,
        relatedConcepts: ['quality_assurance', 'test_driven_development', 'validation']
      }
    ];

    coreConcepts.forEach(concept => {
      this.concepts.set(concept.id, concept);
    });
  }

  /**
   * Start a new learning session
   */
  startSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      conceptsPracticed: [],
      skillImprovements: [],
      mistakePatterns: [],
      successPatterns: [],
      overallProgress: 0
    };

    return sessionId;
  }

  /**
   * End the current learning session
   */
  endSession(): LearningSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.overallProgress = this.calculateSessionProgress();
    
    this.sessions.push(this.currentSession);
    const completedSession = this.currentSession;
    this.currentSession = null;

    return completedSession;
  }

  /**
   * Record a player decision and analyze learning
   */
  recordDecision(
    choice: PlayerChoice,
    patch: PatchPlan,
    ghost: Ghost,
    outcome: 'success' | 'failure' | 'partial'
  ): SkillAssessment[] {
    const assessments: SkillAssessment[] = [];

    // Analyze the decision based on action type
    switch (choice.action) {
      case 'apply':
        assessments.push(this.assessPatchApplication(choice, patch, ghost, outcome));
        break;
      case 'refactor':
        assessments.push(this.assessRefactoringDecision(choice, patch, ghost, outcome));
        break;
      case 'question':
        assessments.push(this.assessCriticalThinking(choice, patch, ghost, outcome));
        break;
    }

    // Assess software smell recognition
    assessments.push(this.assessSoftwareSmellRecognition(ghost, outcome));

    // Assess risk evaluation
    assessments.push(this.assessRiskEvaluation(patch, choice, outcome));

    // Update concept mastery levels
    assessments.forEach(assessment => {
      this.updateConceptMastery(assessment);
    });

    // Add to current session
    if (this.currentSession) {
      this.currentSession.skillImprovements.push(...assessments);
      this.currentSession.conceptsPracticed.push(...assessments.map(a => a.concept));
    }

    return assessments;
  }

  /**
   * Assess patch application decision
   */
  private assessPatchApplication(
    choice: PlayerChoice,
    patch: PatchPlan,
    ghost: Ghost,
    outcome: 'success' | 'failure' | 'partial'
  ): SkillAssessment {
    const concept = this.concepts.get('debugging_methodology')!;
    
    let improvement = 0;
    let confidence = 0.5;
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    if (outcome === 'success') {
      improvement = 0.1 + (patch.risk * 0.1); // Higher risk = more learning
      confidence = 0.8;
      recommendations.push('Good job applying the patch successfully!');
      nextSteps.push('Try tackling more complex software smells');
    } else {
      improvement = 0.05; // Still learn from failures
      confidence = 0.3;
      recommendations.push('Consider analyzing the problem more thoroughly before applying patches');
      nextSteps.push('Practice identifying potential risks before making changes');
    }

    // Adjust based on ghost difficulty
    improvement *= (ghost.difficultyLevel / 10);

    return {
      concept: concept.id,
      currentLevel: concept.masteryLevel,
      targetLevel: Math.min(1.0, concept.masteryLevel + improvement),
      improvement,
      confidence,
      recommendations,
      nextSteps
    };
  }

  /**
   * Assess refactoring decision
   */
  private assessRefactoringDecision(
    choice: PlayerChoice,
    patch: PatchPlan,
    ghost: Ghost,
    outcome: 'success' | 'failure' | 'partial'
  ): SkillAssessment {
    const concept = this.concepts.get('refactoring_techniques')!;
    
    let improvement = 0.15; // Refactoring shows good engineering judgment
    let confidence = 0.9;
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    recommendations.push('Excellent choice! Refactoring improves long-term code quality.');
    nextSteps.push('Learn about specific refactoring patterns for different code smells');
    nextSteps.push('Practice identifying when refactoring is better than quick fixes');

    return {
      concept: concept.id,
      currentLevel: concept.masteryLevel,
      targetLevel: Math.min(1.0, concept.masteryLevel + improvement),
      improvement,
      confidence,
      recommendations,
      nextSteps
    };
  }

  /**
   * Assess critical thinking (questioning)
   */
  private assessCriticalThinking(
    choice: PlayerChoice,
    patch: PatchPlan,
    ghost: Ghost,
    outcome: 'success' | 'failure' | 'partial'
  ): SkillAssessment {
    const concept = this.concepts.get('critical_thinking')!;
    
    let improvement = 0.12; // Asking questions shows good critical thinking
    let confidence = 0.85;
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    recommendations.push('Great critical thinking! Asking questions before acting is a sign of maturity.');
    nextSteps.push('Develop a systematic approach to code analysis');
    nextSteps.push('Learn to ask the right questions about code quality');

    return {
      concept: concept.id,
      currentLevel: concept.masteryLevel,
      targetLevel: Math.min(1.0, concept.masteryLevel + improvement),
      improvement,
      confidence,
      recommendations,
      nextSteps
    };
  }

  /**
   * Assess software smell recognition
   */
  private assessSoftwareSmellRecognition(
    ghost: Ghost,
    outcome: 'success' | 'failure' | 'partial'
  ): SkillAssessment {
    const concept = this.concepts.get('software_smells_recognition')!;
    
    let improvement = 0.08;
    let confidence = 0.7;
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    if (outcome === 'success') {
      improvement += 0.05;
      confidence = 0.8;
      recommendations.push(`Good understanding of ${ghost.softwareSmell.replace('_', ' ')} issues`);
    }

    nextSteps.push('Study different types of software smells');
    nextSteps.push('Practice identifying smells in real codebases');

    return {
      concept: concept.id,
      currentLevel: concept.masteryLevel,
      targetLevel: Math.min(1.0, concept.masteryLevel + improvement),
      improvement,
      confidence,
      recommendations,
      nextSteps
    };
  }

  /**
   * Assess risk evaluation skills
   */
  private assessRiskEvaluation(
    patch: PatchPlan,
    choice: PlayerChoice,
    outcome: 'success' | 'failure' | 'partial'
  ): SkillAssessment {
    const concept = this.concepts.get('risk_assessment')!;
    
    let improvement = 0.06;
    let confidence = 0.6;
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // Assess if the player made a good risk decision
    const isHighRisk = patch.risk > 0.7;
    const choseConservativeAction = choice.action === 'question' || choice.action === 'refactor';

    if (isHighRisk && choseConservativeAction) {
      improvement += 0.08;
      confidence = 0.9;
      recommendations.push('Excellent risk assessment! You chose a safe approach for a high-risk change.');
    } else if (!isHighRisk && choice.action === 'apply') {
      improvement += 0.05;
      confidence = 0.8;
      recommendations.push('Good risk assessment for a low-risk change.');
    }

    nextSteps.push('Learn to identify risk factors in code changes');
    nextSteps.push('Practice evaluating the impact of different approaches');

    return {
      concept: concept.id,
      currentLevel: concept.masteryLevel,
      targetLevel: Math.min(1.0, concept.masteryLevel + improvement),
      improvement,
      confidence,
      recommendations,
      nextSteps
    };
  }

  /**
   * Update concept mastery level
   */
  private updateConceptMastery(assessment: SkillAssessment): void {
    const concept = this.concepts.get(assessment.concept);
    if (!concept) return;

    concept.masteryLevel = assessment.targetLevel;
    concept.practiceCount++;
    concept.lastPracticed = new Date();
    concept.improvementTrend = assessment.improvement;
  }

  /**
   * Generate adaptive difficulty settings based on current skill levels
   */
  generateAdaptiveDifficulty(): AdaptiveDifficultySettings {
    const avgMastery = this.getAverageMasteryLevel();
    const debuggingSkill = this.concepts.get('debugging_methodology')?.masteryLevel || 0;
    const riskSkill = this.concepts.get('risk_assessment')?.masteryLevel || 0;

    let ghostComplexity: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    let patchRiskRange: [number, number] = [0.1, 0.4];
    let educationalSupport: 'minimal' | 'moderate' | 'extensive' = 'extensive';
    let hintFrequency: 'rare' | 'occasional' | 'frequent' = 'frequent';
    let explanationDepth: 'basic' | 'detailed' | 'comprehensive' = 'comprehensive';

    if (avgMastery > 0.7) {
      ghostComplexity = 'advanced';
      patchRiskRange = [0.3, 0.9];
      educationalSupport = 'minimal';
      hintFrequency = 'rare';
      explanationDepth = 'basic';
    } else if (avgMastery > 0.4) {
      ghostComplexity = 'intermediate';
      patchRiskRange = [0.2, 0.7];
      educationalSupport = 'moderate';
      hintFrequency = 'occasional';
      explanationDepth = 'detailed';
    }

    return {
      ghostComplexity,
      patchRiskRange,
      educationalSupport,
      hintFrequency,
      explanationDepth
    };
  }

  /**
   * Get personalized learning recommendations
   */
  getPersonalizedRecommendations(): string[] {
    const recommendations: string[] = [];
    const weakConcepts = Array.from(this.concepts.values())
      .filter(c => c.masteryLevel < 0.5)
      .sort((a, b) => a.masteryLevel - b.masteryLevel);

    if (weakConcepts.length > 0) {
      const weakest = weakConcepts[0];
      recommendations.push(`Focus on improving ${weakest.name}: ${weakest.description}`);
      
      if (weakest.prerequisites.length > 0) {
        recommendations.push(`Consider reviewing prerequisites: ${weakest.prerequisites.join(', ')}`);
      }
    }

    const strongConcepts = Array.from(this.concepts.values())
      .filter(c => c.masteryLevel > 0.8);

    if (strongConcepts.length > 0) {
      recommendations.push('You\'re doing well with: ' + strongConcepts.map(c => c.name).join(', '));
      recommendations.push('Try tackling more advanced challenges to further develop these skills');
    }

    return recommendations;
  }

  /**
   * Get all learning concepts
   */
  getAllConcepts(): LearningConcept[] {
    return Array.from(this.concepts.values());
  }

  /**
   * Get concept by ID
   */
  getConcept(id: string): LearningConcept | undefined {
    return this.concepts.get(id);
  }

  /**
   * Calculate average mastery level
   */
  private getAverageMasteryLevel(): number {
    const concepts = Array.from(this.concepts.values());
    if (concepts.length === 0) return 0;
    
    const total = concepts.reduce((sum, concept) => sum + concept.masteryLevel, 0);
    return total / concepts.length;
  }

  /**
   * Calculate session progress
   */
  private calculateSessionProgress(): number {
    if (!this.currentSession) return 0;
    
    const improvements = this.currentSession.skillImprovements;
    if (improvements.length === 0) return 0;
    
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp.improvement, 0) / improvements.length;
    return Math.min(1.0, avgImprovement * 10); // Scale to 0-1
  }

  /**
   * Get learning session history
   */
  getSessionHistory(): LearningSession[] {
    return [...this.sessions];
  }

  /**
   * Get current session
   */
  getCurrentSession(): LearningSession | null {
    return this.currentSession;
  }
}