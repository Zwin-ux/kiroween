/**
 * DecisionAnalytics - Advanced analytics system for tracking player decision patterns
 */

import type { 
  DecisionPattern, 
  PlayerStatistics, 
  AdaptiveDifficulty,
  PlayerChoice,
  ChoiceResult
} from '../types/playerChoice';
import type { GeneratedPatch } from './PatchGenerationSystem';
import type { Ghost } from '../types/ghost';

export interface LearningStyleAnalysis {
  primaryStyle: 'visual' | 'hands_on' | 'theoretical' | 'collaborative';
  confidence: number;
  indicators: {
    questionFrequency: number;
    riskTolerance: number;
    explorationTendency: number;
    consistencyScore: number;
  };
  recommendations: string[];
}

export interface PerformanceMetrics {
  successRate: number;
  improvementRate: number;
  consistencyScore: number;
  adaptabilityScore: number;
  learningVelocity: number;
  riskCalibration: number;
}

export interface ContentAdaptation {
  recommendedComplexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  suggestedGhostTypes: string[];
  optimalPatchRiskRange: [number, number];
  educationalFocus: string[];
  hintingStrategy: 'rare' | 'occasional' | 'frequent';
}

export class DecisionAnalytics {
  private patterns: DecisionPattern[] = [];
  private sessionStartTime: Date = new Date();
  private performanceHistory: PerformanceMetrics[] = [];

  /**
   * Record a new decision pattern
   */
  recordDecision(
    choice: PlayerChoice,
    patch: GeneratedPatch,
    ghost: Ghost,
    currentMeters: { stability: number; insight: number },
    roomId: string,
    playerId: string = 'current_player'
  ): void {
    const pattern: DecisionPattern = {
      playerId,
      choiceType: choice.type,
      riskTolerance: this.calculateRiskTolerance(choice, patch),
      frequency: 1,
      timestamp: new Date(),
      context: {
        ghostType: ghost.softwareSmell,
        roomId,
        patchRisk: patch.riskScore,
        meterLevels: currentMeters
      }
    };

    this.patterns.push(pattern);
    this.pruneOldPatterns();
  }

  /**
   * Update decision pattern with outcome information
   */
  updateDecisionOutcome(
    choiceId: string,
    result: ChoiceResult,
    finalMeters: { stability: number; insight: number }
  ): void {
    // Find the most recent pattern that matches this choice
    const recentPattern = this.patterns
      .slice()
      .reverse()
      .find(p => p.timestamp.getTime() > Date.now() - 60000); // Within last minute

    if (recentPattern) {
      // Store outcome data for analysis
      (recentPattern as any).outcome = {
        success: result.success,
        meterChanges: {
          stability: finalMeters.stability - recentPattern.context.meterLevels.stability,
          insight: finalMeters.insight - recentPattern.context.meterLevels.insight
        },
        consequenceCount: result.consequences.length
      };
    }
  }

  /**
   * Analyze player's learning style based on decision patterns
   */
  analyzeLearningStyle(): LearningStyleAnalysis {
    if (this.patterns.length < 5) {
      return this.getDefaultLearningStyle();
    }

    const recentPatterns = this.patterns.slice(-20);
    const indicators = this.calculateLearningIndicators(recentPatterns);
    
    const styleScores = {
      theoretical: this.calculateTheoreticalScore(indicators),
      hands_on: this.calculateHandsOnScore(indicators),
      visual: this.calculateVisualScore(indicators),
      collaborative: this.calculateCollaborativeScore(indicators)
    };

    const primaryStyle = Object.entries(styleScores).reduce((a, b) => 
      styleScores[a[0] as keyof typeof styleScores] > styleScores[b[0] as keyof typeof styleScores] ? a : b
    )[0] as 'visual' | 'hands_on' | 'theoretical' | 'collaborative';

    const confidence = styleScores[primaryStyle];
    const recommendations = this.generateLearningRecommendations(primaryStyle, indicators);

    return {
      primaryStyle,
      confidence,
      indicators,
      recommendations
    };
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(): PerformanceMetrics {
    if (this.patterns.length === 0) {
      return this.getDefaultPerformanceMetrics();
    }

    const recentPatterns = this.patterns.slice(-15);
    const patternsWithOutcomes = recentPatterns.filter(p => (p as any).outcome);

    const successRate = this.calculateSuccessRate(patternsWithOutcomes);
    const improvementRate = this.calculateImprovementRate();
    const consistencyScore = this.calculateConsistencyScore(recentPatterns);
    const adaptabilityScore = this.calculateAdaptabilityScore(recentPatterns);
    const learningVelocity = this.calculateLearningVelocity();
    const riskCalibration = this.calculateRiskCalibration(patternsWithOutcomes);

    const metrics: PerformanceMetrics = {
      successRate,
      improvementRate,
      consistencyScore,
      adaptabilityScore,
      learningVelocity,
      riskCalibration
    };

    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > 10) {
      this.performanceHistory = this.performanceHistory.slice(-10);
    }

    return metrics;
  }

  /**
   * Generate adaptive difficulty recommendations
   */
  generateAdaptiveDifficulty(): AdaptiveDifficulty {
    const performance = this.calculatePerformanceMetrics();
    const learningStyle = this.analyzeLearningStyle();
    
    // Calculate current difficulty level (1-10)
    let currentLevel = 5;
    
    // Adjust based on success rate
    if (performance.successRate > 0.8) currentLevel += 2;
    else if (performance.successRate > 0.6) currentLevel += 1;
    else if (performance.successRate < 0.4) currentLevel -= 2;
    else if (performance.successRate < 0.6) currentLevel -= 1;

    // Adjust based on learning velocity
    if (performance.learningVelocity > 0.7) currentLevel += 1;
    else if (performance.learningVelocity < 0.3) currentLevel -= 1;

    // Adjust based on consistency
    if (performance.consistencyScore < 0.4) currentLevel -= 1;

    currentLevel = Math.max(1, Math.min(10, currentLevel));

    const recommendations = this.generateDifficultyRecommendations(
      currentLevel, 
      performance, 
      learningStyle
    );

    return {
      currentLevel,
      adjustmentFactors: {
        successRate: performance.successRate,
        riskTolerance: this.calculateAverageRiskTolerance(),
        learningProgress: performance.learningVelocity,
        engagementLevel: this.calculateEngagementLevel()
      },
      recommendations
    };
  }

  /**
   * Generate content adaptation recommendations
   */
  generateContentAdaptation(): ContentAdaptation {
    const performance = this.calculatePerformanceMetrics();
    const learningStyle = this.analyzeLearningStyle();
    const difficulty = this.generateAdaptiveDifficulty();

    return {
      recommendedComplexity: this.recommendComplexity(difficulty.currentLevel, performance),
      suggestedGhostTypes: this.recommendGhostTypes(performance, learningStyle),
      optimalPatchRiskRange: this.recommendRiskRange(performance),
      educationalFocus: this.recommendEducationalFocus(learningStyle, performance),
      hintingStrategy: this.recommendHintingStrategy(performance, learningStyle)
    };
  }

  /**
   * Get decision patterns for analysis
   */
  getDecisionPatterns(limit?: number): DecisionPattern[] {
    return limit ? this.patterns.slice(-limit) : [...this.patterns];
  }

  /**
   * Get performance trend over time
   */
  getPerformanceTrend(): { timestamp: Date; metrics: PerformanceMetrics }[] {
    return this.performanceHistory.map((metrics, index) => ({
      timestamp: new Date(this.sessionStartTime.getTime() + index * 300000), // 5-minute intervals
      metrics
    }));
  }

  /**
   * Reset analytics data
   */
  reset(): void {
    this.patterns = [];
    this.performanceHistory = [];
    this.sessionStartTime = new Date();
  }

  // Private helper methods

  private calculateRiskTolerance(choice: PlayerChoice, patch: GeneratedPatch): number {
    switch (choice.type) {
      case 'apply':
        return patch.riskScore;
      case 'refactor':
        return 0.5; // Moderate risk tolerance - exploring alternatives
      case 'question':
        return 0.2; // Low risk tolerance - seeking more information
      default:
        return 0.5;
    }
  }

  private pruneOldPatterns(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;
    this.patterns = this.patterns.filter(p => p.timestamp.getTime() > cutoff);

    // Also limit total patterns to prevent memory bloat
    if (this.patterns.length > 200) {
      this.patterns = this.patterns.slice(-200);
    }
  }

  private calculateLearningIndicators(patterns: DecisionPattern[]) {
    const questionFrequency = patterns.filter(p => p.choiceType === 'question').length / patterns.length;
    const avgRiskTolerance = patterns.reduce((sum, p) => sum + p.riskTolerance, 0) / patterns.length;
    
    const explorationTendency = patterns.filter(p => p.choiceType === 'refactor').length / patterns.length;
    
    // Consistency: how similar are recent decisions to earlier ones
    const consistencyScore = this.calculatePatternConsistency(patterns);

    return {
      questionFrequency,
      riskTolerance: avgRiskTolerance,
      explorationTendency,
      consistencyScore
    };
  }

  private calculateTheoreticalScore(indicators: any): number {
    let score = 0;
    
    // High question frequency indicates theoretical learning
    score += indicators.questionFrequency * 0.4;
    
    // Lower risk tolerance suggests preference for understanding first
    score += (1 - indicators.riskTolerance) * 0.3;
    
    // Consistency suggests systematic approach
    score += indicators.consistencyScore * 0.3;

    return Math.min(1, score);
  }

  private calculateHandsOnScore(indicators: any): number {
    let score = 0;
    
    // High risk tolerance suggests hands-on learning
    score += indicators.riskTolerance * 0.4;
    
    // Low question frequency suggests learning by doing
    score += (1 - indicators.questionFrequency) * 0.3;
    
    // High exploration suggests experimentation
    score += indicators.explorationTendency * 0.3;

    return Math.min(1, score);
  }

  private calculateVisualScore(indicators: any): number {
    // Visual learners tend to be moderate in all aspects
    const balance = 1 - Math.abs(indicators.riskTolerance - 0.5) * 2;
    const moderateExploration = 1 - Math.abs(indicators.explorationTendency - 0.3) * 2;
    
    return Math.min(1, (balance + moderateExploration) * 0.5);
  }

  private calculateCollaborativeScore(indicators: any): number {
    // Collaborative learners ask questions but also take action
    const balancedApproach = indicators.questionFrequency * (1 - indicators.questionFrequency) * 4;
    const moderateRisk = 1 - Math.abs(indicators.riskTolerance - 0.4) * 2;
    
    return Math.min(1, (balancedApproach + moderateRisk) * 0.5);
  }

  private calculatePatternConsistency(patterns: DecisionPattern[]): number {
    if (patterns.length < 3) return 0.5;

    const choiceTypes = patterns.map(p => p.choiceType);
    const riskLevels = patterns.map(p => p.riskTolerance);

    // Calculate variance in choice types
    const choiceVariance = this.calculateChoiceVariance(choiceTypes);
    
    // Calculate variance in risk tolerance
    const riskVariance = this.calculateVariance(riskLevels);

    // Lower variance = higher consistency
    return Math.max(0, 1 - (choiceVariance + riskVariance) / 2);
  }

  private calculateChoiceVariance(choices: string[]): number {
    const counts = choices.reduce((acc, choice) => {
      acc[choice] = (acc[choice] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequencies = Object.values(counts).map(count => count / choices.length);
    const expectedFreq = 1 / Object.keys(counts).length;
    
    return frequencies.reduce((sum, freq) => sum + Math.pow(freq - expectedFreq, 2), 0);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateSuccessRate(patternsWithOutcomes: any[]): number {
    if (patternsWithOutcomes.length === 0) return 0.5;
    
    const successes = patternsWithOutcomes.filter(p => p.outcome?.success).length;
    return successes / patternsWithOutcomes.length;
  }

  private calculateImprovementRate(): number {
    if (this.performanceHistory.length < 2) return 0;

    const recent = this.performanceHistory.slice(-3);
    const earlier = this.performanceHistory.slice(-6, -3);

    if (earlier.length === 0) return 0;

    const recentAvg = recent.reduce((sum, m) => sum + m.successRate, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, m) => sum + m.successRate, 0) / earlier.length;

    return Math.max(-1, Math.min(1, (recentAvg - earlierAvg) * 2));
  }

  private calculateConsistencyScore(patterns: DecisionPattern[]): number {
    return this.calculatePatternConsistency(patterns);
  }

  private calculateAdaptabilityScore(patterns: DecisionPattern[]): number {
    if (patterns.length < 5) return 0.5;

    // Group patterns by context (ghost type, room)
    const contextGroups = patterns.reduce((groups, pattern) => {
      const key = `${pattern.context.ghostType}_${pattern.context.roomId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pattern);
      return groups;
    }, {} as Record<string, DecisionPattern[]>);

    // Calculate how well the player adapts to different contexts
    let adaptationScore = 0;
    let contextCount = 0;

    for (const [context, contextPatterns] of Object.entries(contextGroups)) {
      if (contextPatterns.length >= 2) {
        // Check if player adjusts strategy based on context
        const riskLevels = contextPatterns.map(p => p.riskTolerance);
        const avgRisk = riskLevels.reduce((sum, r) => sum + r, 0) / riskLevels.length;
        
        // Good adaptation means risk tolerance matches context difficulty
        const contextRisk = contextPatterns[0].context.patchRisk;
        const alignment = 1 - Math.abs(avgRisk - contextRisk);
        
        adaptationScore += alignment;
        contextCount++;
      }
    }

    return contextCount > 0 ? adaptationScore / contextCount : 0.5;
  }

  private calculateLearningVelocity(): number {
    if (this.patterns.length < 10) return 0.5;

    const recentPatterns = this.patterns.slice(-10);
    const earlierPatterns = this.patterns.slice(-20, -10);

    if (earlierPatterns.length === 0) return 0.5;

    // Compare complexity of problems being tackled
    const recentComplexity = recentPatterns.reduce((sum, p) => sum + p.context.patchRisk, 0) / recentPatterns.length;
    const earlierComplexity = earlierPatterns.reduce((sum, p) => sum + p.context.patchRisk, 0) / earlierPatterns.length;

    // Learning velocity is the rate of increase in problem complexity
    return Math.max(0, Math.min(1, (recentComplexity - earlierComplexity + 0.5)));
  }

  private calculateRiskCalibration(patternsWithOutcomes: any[]): number {
    if (patternsWithOutcomes.length === 0) return 0.5;

    let calibrationScore = 0;
    
    for (const pattern of patternsWithOutcomes) {
      const predictedRisk = pattern.riskTolerance;
      const actualSuccess = pattern.outcome.success ? 0 : 1; // 0 = success, 1 = failure
      
      // Good calibration means high risk tolerance correlates with actual risk
      const calibration = 1 - Math.abs(predictedRisk - actualSuccess);
      calibrationScore += calibration;
    }

    return calibrationScore / patternsWithOutcomes.length;
  }

  private calculateAverageRiskTolerance(): number {
    if (this.patterns.length === 0) return 0.5;
    
    const recentPatterns = this.patterns.slice(-10);
    return recentPatterns.reduce((sum, p) => sum + p.riskTolerance, 0) / recentPatterns.length;
  }

  private calculateEngagementLevel(): number {
    if (this.patterns.length === 0) return 0.5;

    const recentPatterns = this.patterns.slice(-10);
    const questionRatio = recentPatterns.filter(p => p.choiceType === 'question').length / recentPatterns.length;
    const explorationRatio = recentPatterns.filter(p => p.choiceType === 'refactor').length / recentPatterns.length;

    // High engagement = asking questions and exploring alternatives
    return Math.min(1, (questionRatio + explorationRatio) * 1.2);
  }

  private generateLearningRecommendations(style: string, indicators: any): string[] {
    const recommendations: string[] = [];

    switch (style) {
      case 'theoretical':
        recommendations.push("Provide detailed explanations before presenting choices");
        recommendations.push("Include more educational content and concept explanations");
        if (indicators.riskTolerance < 0.3) {
          recommendations.push("Encourage gradual risk-taking with safety nets");
        }
        break;

      case 'hands_on':
        recommendations.push("Offer more opportunities for direct experimentation");
        recommendations.push("Provide immediate feedback on actions");
        if (indicators.questionFrequency < 0.2) {
          recommendations.push("Suggest asking questions to deepen understanding");
        }
        break;

      case 'visual':
        recommendations.push("Enhance visual representations of code changes");
        recommendations.push("Use more diagrams and visual feedback");
        recommendations.push("Provide clear visual indicators of progress and outcomes");
        break;

      case 'collaborative':
        recommendations.push("Emphasize community best practices and shared knowledge");
        recommendations.push("Provide examples of how others have solved similar problems");
        recommendations.push("Encourage discussion of trade-offs and alternatives");
        break;
    }

    return recommendations;
  }

  private generateDifficultyRecommendations(
    level: number, 
    performance: PerformanceMetrics, 
    learningStyle: LearningStyleAnalysis
  ) {
    return {
      ghostComplexity: this.recommendComplexity(level, performance),
      patchRiskRange: this.recommendRiskRange(performance),
      educationalSupport: this.recommendEducationalSupport(performance, learningStyle),
      hintFrequency: this.recommendHintingStrategy(performance, learningStyle)
    };
  }

  private recommendComplexity(level: number, performance: PerformanceMetrics): 'simple' | 'moderate' | 'complex' | 'advanced' {
    if (level <= 3 || performance.successRate < 0.4) return 'simple';
    if (level <= 6 || performance.successRate < 0.7) return 'moderate';
    if (level <= 8 || performance.successRate < 0.85) return 'complex';
    return 'advanced';
  }

  private recommendGhostTypes(performance: PerformanceMetrics, learningStyle: LearningStyleAnalysis): string[] {
    const ghostTypes: string[] = [];

    // Base recommendations on performance
    if (performance.successRate > 0.7) {
      ghostTypes.push('circular_dependency', 'unbounded_recursion', 'prompt_injection');
    } else {
      ghostTypes.push('stale_cache', 'dead_code', 'data_leak');
    }

    // Adjust based on learning style
    if (learningStyle.primaryStyle === 'theoretical') {
      ghostTypes.push('circular_dependency', 'race_condition'); // More conceptual
    } else if (learningStyle.primaryStyle === 'hands_on') {
      ghostTypes.push('memory_leak', 'unbounded_recursion'); // More practical
    }

    return ghostTypes.slice(0, 3); // Limit to top 3 recommendations
  }

  private recommendRiskRange(performance: PerformanceMetrics): [number, number] {
    const baseMin = 0.2;
    const baseMax = 0.8;

    if (performance.successRate < 0.4) {
      return [baseMin, 0.5]; // Lower risk for struggling players
    } else if (performance.successRate > 0.8) {
      return [0.3, baseMax]; // Allow higher risk for successful players
    }

    return [baseMin, baseMax];
  }

  private recommendEducationalFocus(learningStyle: LearningStyleAnalysis, performance: PerformanceMetrics): string[] {
    const focus: string[] = [];

    if (learningStyle.primaryStyle === 'theoretical') {
      focus.push('Software engineering principles', 'Design patterns', 'Best practices');
    } else if (learningStyle.primaryStyle === 'hands_on') {
      focus.push('Debugging techniques', 'Code refactoring', 'Testing strategies');
    } else if (learningStyle.primaryStyle === 'visual') {
      focus.push('Code visualization', 'Architecture diagrams', 'Flow charts');
    } else {
      focus.push('Team collaboration', 'Code reviews', 'Knowledge sharing');
    }

    if (performance.riskCalibration < 0.5) {
      focus.push('Risk assessment', 'Impact analysis');
    }

    return focus;
  }

  private recommendEducationalSupport(performance: PerformanceMetrics, learningStyle: LearningStyleAnalysis): 'minimal' | 'moderate' | 'extensive' {
    if (performance.successRate < 0.4 || learningStyle.primaryStyle === 'theoretical') {
      return 'extensive';
    } else if (performance.successRate < 0.7 || learningStyle.indicators.questionFrequency > 0.4) {
      return 'moderate';
    }
    return 'minimal';
  }

  private recommendHintingStrategy(performance: PerformanceMetrics, learningStyle: LearningStyleAnalysis): 'rare' | 'occasional' | 'frequent' {
    if (performance.successRate < 0.3) return 'frequent';
    if (performance.successRate < 0.6 || learningStyle.indicators.questionFrequency > 0.5) return 'occasional';
    return 'rare';
  }

  private getDefaultLearningStyle(): LearningStyleAnalysis {
    return {
      primaryStyle: 'hands_on',
      confidence: 0.5,
      indicators: {
        questionFrequency: 0.3,
        riskTolerance: 0.5,
        explorationTendency: 0.3,
        consistencyScore: 0.5
      },
      recommendations: ['Start with hands-on experimentation to establish baseline']
    };
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      successRate: 0.5,
      improvementRate: 0,
      consistencyScore: 0.5,
      adaptabilityScore: 0.5,
      learningVelocity: 0.5,
      riskCalibration: 0.5
    };
  }
}