/**
 * EvidenceTimeline - Comprehensive action logging and timeline management
 */

import type { 
  EvidenceEntry, 
  PlayerChoice, 
  MeterEffects,
  GameState 
} from '../types/game';
import type { 
  EncounterSession, 
  PatchApplicationResult,
  PlayerAction,
  LearningAchievement 
} from '../types/encounter';
import type { DialogueSession } from '../types/dialogue';
import type { PatchPlan } from '../types/patch';

export interface EvidenceTimelineEntry extends EvidenceEntry {
  // Enhanced metadata
  sessionId: string;
  roomId: string;
  ghostId?: string;
  patchId?: string;
  dialogueSessionId?: string;
  
  // Categorization
  category: EvidenceCategory;
  tags: string[];
  
  // Relationships
  relatedEntries: string[];
  parentEntryId?: string;
  childEntryIds: string[];
  
  // Learning context
  learningPoints: string[];
  conceptsInvolved: string[];
  skillsApplied: string[];
  
  // Outcome tracking
  outcome: 'success' | 'failure' | 'partial' | 'pending' | 'cancelled';
  confidence: number; // 0.0 to 1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Search metadata
  searchableText: string;
  keywords: string[];
}

export type EvidenceCategory = 
  | 'encounter'
  | 'dialogue'
  | 'patch_generation'
  | 'patch_application'
  | 'decision'
  | 'consequence'
  | 'progression'
  | 'learning'
  | 'system_event'
  | 'error';

export interface TimelineSearchQuery {
  text?: string;
  category?: EvidenceCategory;
  outcome?: string;
  roomId?: string;
  ghostId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  concepts?: string[];
  riskLevel?: string;
}

export interface TimelineSearchResult {
  entries: EvidenceTimelineEntry[];
  totalCount: number;
  searchTime: number;
  suggestions: string[];
  relatedConcepts: string[];
}

export interface PostMortemReport {
  gameRunId: string;
  sessionId: string;
  generatedAt: Date;
  
  // Summary statistics
  summary: {
    totalPlayTime: number;
    totalEntries: number;
    roomsVisited: string[];
    ghostsEncountered: string[];
    patchesApplied: number;
    patchesRefactored: number;
    questionsAsked: number;
    successRate: number;
    averageRiskTolerance: number;
  };
  
  // Timeline data
  timeline: EvidenceTimelineEntry[];
  
  // Learning analysis
  learningOutcomes: LearningOutcome[];
  conceptMastery: ConceptMasteryReport[];
  skillProgression: SkillProgressionReport[];
  
  // Decision analysis
  decisionPatterns: DecisionPattern[];
  riskAnalysis: RiskAnalysisReport;
  
  // Recommendations
  recommendations: RecommendationSet;
  
  // Export metadata
  exportFormat: 'json' | 'csv' | 'pdf';
  exportSize: number;
}

export interface LearningOutcome {
  concept: string;
  initialLevel: number;
  finalLevel: number;
  improvement: number;
  practiceCount: number;
  masteryAchieved: boolean;
  keyMoments: string[];
  nextSteps: string[];
}

export interface ConceptMasteryReport {
  concept: string;
  masteryLevel: number; // 0.0 to 1.0
  practiceOpportunities: number;
  successfulApplications: number;
  commonMistakes: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface SkillProgressionReport {
  skill: string;
  progressionPath: SkillProgressionPoint[];
  currentLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  timeToNextLevel: number; // estimated hours
  recommendedPractice: string[];
}

export interface SkillProgressionPoint {
  timestamp: Date;
  level: number;
  evidence: string[];
  milestone?: string;
}

export interface DecisionPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  averageRisk: number;
  contexts: string[];
  outcomes: string[];
  recommendation: string;
}

export interface RiskAnalysisReport {
  averageRiskTolerance: number;
  riskDistribution: Record<string, number>;
  highRiskDecisions: HighRiskDecision[];
  riskVsSuccessCorrelation: number;
  recommendedRiskStrategy: string;
}

export interface HighRiskDecision {
  entryId: string;
  riskLevel: number;
  outcome: string;
  consequences: string[];
  lessonsLearned: string[];
}

export interface RecommendationSet {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
  conceptFocus: string[];
  skillDevelopment: string[];
  practiceAreas: string[];
}

export interface Recommendation {
  type: 'concept_review' | 'skill_practice' | 'risk_management' | 'strategy_adjustment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  estimatedTime: number; // minutes
  resources: string[];
}

export class EvidenceTimeline {
  private entries: Map<string, EvidenceTimelineEntry> = new Map();
  private sessionId: string;
  private gameRunId: string;
  private searchIndex: Map<string, Set<string>> = new Map();
  
  constructor(sessionId: string, gameRunId: string) {
    this.sessionId = sessionId;
    this.gameRunId = gameRunId;
    this.initializeSearchIndex();
  }

  /**
   * Record a ghost encounter event
   */
  recordEncounter(encounter: EncounterSession): string {
    const entry: EvidenceTimelineEntry = {
      id: this.generateEntryId('encounter'),
      timestamp: encounter.startTime,
      type: 'ghost_encountered',
      description: `Started encounter with ${encounter.ghostId} in ${encounter.roomId}`,
      context: {
        encounterId: encounter.id,
        ghostId: encounter.ghostId,
        roomId: encounter.roomId,
        phase: encounter.currentPhase
      },
      
      // Enhanced metadata
      sessionId: this.sessionId,
      roomId: encounter.roomId,
      ghostId: encounter.ghostId,
      category: 'encounter',
      tags: ['encounter', 'ghost', encounter.ghostId, encounter.roomId],
      relatedEntries: [],
      parentEntryId: undefined,
      childEntryIds: [],
      
      // Learning context
      learningPoints: [`Encountered ${encounter.ghostId} representing specific software smell`],
      conceptsInvolved: [encounter.ghostId, 'software_smells', 'debugging'],
      skillsApplied: ['problem_identification', 'context_analysis'],
      
      // Outcome tracking
      outcome: encounter.isComplete ? 'success' : 'pending',
      confidence: 0.8,
      riskLevel: 'medium',
      
      // Search metadata
      searchableText: `encounter ${encounter.ghostId} ${encounter.roomId} ghost debugging`,
      keywords: ['encounter', 'ghost', encounter.ghostId, encounter.roomId, 'debugging']
    };

    this.addEntry(entry);
    return entry.id;
  }

  /**
   * Record a patch application event
   */
  recordPatchApplication(
    session: any, // PatchSession type
    result: PatchApplicationResult,
    choice: PlayerChoice
  ): string {
    const entry: EvidenceTimelineEntry = {
      id: this.generateEntryId('patch'),
      timestamp: new Date(),
      type: 'patch_applied',
      description: `Applied patch: ${choice.intent}`,
      context: {
        patchId: session.id,
        ghostId: session.ghostEncounterId,
        action: choice.action,
        intent: choice.intent,
        outcome: choice.outcome,
        compileEvents: result.compileEvents,
        feedback: result.feedback
      },
      effects: result.effects,
      
      // Enhanced metadata
      sessionId: this.sessionId,
      roomId: choice.roomId,
      ghostId: session.ghostEncounterId,
      patchId: session.id,
      category: 'patch_application',
      tags: ['patch', 'application', choice.action, session.ghostEncounterId],
      relatedEntries: [],
      parentEntryId: undefined,
      childEntryIds: [],
      
      // Learning context
      learningPoints: result.learningPoints || [],
      conceptsInvolved: this.extractConceptsFromPatch(session, choice),
      skillsApplied: this.extractSkillsFromAction(choice.action),
      
      // Outcome tracking
      outcome: result.success ? 'success' : 'failure',
      confidence: result.success ? 0.9 : 0.3,
      riskLevel: this.calculateRiskLevel(result.effects),
      
      // Search metadata
      searchableText: `patch ${choice.action} ${choice.intent} ${session.ghostEncounterId} ${result.feedback}`,
      keywords: ['patch', choice.action, session.ghostEncounterId, 'debugging', 'application']
    };

    this.addEntry(entry);
    return entry.id;
  }

  /**
   * Record a player decision event
   */
  recordDecision(
    choice: PlayerChoice, 
    outcome: any, // ChoiceResult type
    context: { ghostId?: string; patchId?: string; roomId: string }
  ): string {
    const entry: EvidenceTimelineEntry = {
      id: this.generateEntryId('decision'),
      timestamp: choice.timestamp,
      type: 'patch_applied', // Using existing type for compatibility
      description: `Made decision: ${choice.action} - ${choice.intent}`,
      context: {
        choiceId: choice.id,
        action: choice.action,
        intent: choice.intent,
        outcome: choice.outcome,
        ...context
      },
      effects: outcome.effects,
      
      // Enhanced metadata
      sessionId: this.sessionId,
      roomId: context.roomId,
      ghostId: context.ghostId,
      patchId: context.patchId,
      category: 'decision',
      tags: ['decision', choice.action, context.ghostId || 'unknown'],
      relatedEntries: [],
      parentEntryId: undefined,
      childEntryIds: [],
      
      // Learning context
      learningPoints: outcome.newDialogue ? [outcome.newDialogue] : [],
      conceptsInvolved: ['decision_making', 'risk_assessment', choice.action],
      skillsApplied: this.extractSkillsFromAction(choice.action),
      
      // Outcome tracking
      outcome: outcome.success ? 'success' : 'failure',
      confidence: 0.7,
      riskLevel: this.calculateRiskLevelFromChoice(choice.action),
      
      // Search metadata
      searchableText: `decision ${choice.action} ${choice.intent} ${context.ghostId}`,
      keywords: ['decision', choice.action, 'choice', context.ghostId || 'unknown']
    };

    this.addEntry(entry);
    return entry.id;
  }

  /**
   * Search timeline entries
   */
  searchEntries(query: TimelineSearchQuery): TimelineSearchResult {
    const startTime = Date.now();
    let results = Array.from(this.entries.values());

    // Apply filters
    if (query.text) {
      const searchTerms = query.text.toLowerCase().split(' ');
      results = results.filter(entry => 
        searchTerms.every(term => 
          entry.searchableText.toLowerCase().includes(term) ||
          entry.keywords.some(keyword => keyword.toLowerCase().includes(term))
        )
      );
    }

    if (query.category) {
      results = results.filter(entry => entry.category === query.category);
    }

    if (query.outcome) {
      results = results.filter(entry => entry.outcome === query.outcome);
    }

    if (query.roomId) {
      results = results.filter(entry => entry.roomId === query.roomId);
    }

    if (query.ghostId) {
      results = results.filter(entry => entry.ghostId === query.ghostId);
    }

    if (query.dateRange) {
      results = results.filter(entry => 
        entry.timestamp >= query.dateRange!.start &&
        entry.timestamp <= query.dateRange!.end
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(entry =>
        query.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    if (query.concepts && query.concepts.length > 0) {
      results = results.filter(entry =>
        query.concepts!.some(concept => entry.conceptsInvolved.includes(concept))
      );
    }

    if (query.riskLevel) {
      results = results.filter(entry => entry.riskLevel === query.riskLevel);
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const searchTime = Date.now() - startTime;

    return {
      entries: results,
      totalCount: results.length,
      searchTime,
      suggestions: this.generateSearchSuggestions(query, results),
      relatedConcepts: this.extractRelatedConcepts(results)
    };
  }

  /**
   * Get complete timeline
   */
  getTimeline(): EvidenceTimelineEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Export post-mortem report
   */
  exportReport(format: 'json' | 'csv' | 'pdf' = 'json'): PostMortemReport {
    const timeline = this.getTimeline();
    const summary = this.calculateSummaryStatistics(timeline);
    const learningOutcomes = this.analyzeLearningOutcomes(timeline);
    const conceptMastery = this.analyzeConceptMastery(timeline);
    const skillProgression = this.analyzeSkillProgression(timeline);
    const decisionPatterns = this.analyzeDecisionPatterns(timeline);
    const riskAnalysis = this.analyzeRiskPatterns(timeline);
    const recommendations = this.generateRecommendations(
      learningOutcomes,
      conceptMastery,
      decisionPatterns,
      riskAnalysis
    );

    const report: PostMortemReport = {
      gameRunId: this.gameRunId,
      sessionId: this.sessionId,
      generatedAt: new Date(),
      summary,
      timeline,
      learningOutcomes,
      conceptMastery,
      skillProgression,
      decisionPatterns,
      riskAnalysis,
      recommendations,
      exportFormat: format,
      exportSize: JSON.stringify(timeline).length
    };

    return report;
  }

  /**
   * Persist timeline state
   */
  saveToStorage(): void {
    try {
      const timelineData = {
        sessionId: this.sessionId,
        gameRunId: this.gameRunId,
        entries: Array.from(this.entries.entries()),
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(
        `evidence-timeline-${this.sessionId}`,
        JSON.stringify(timelineData)
      );
    } catch (error) {
      console.error('Failed to save evidence timeline:', error);
    }
  }

  /**
   * Restore timeline state
   */
  loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(`evidence-timeline-${this.sessionId}`);
      if (!stored) return false;

      const timelineData = JSON.parse(stored);
      
      // Restore entries
      this.entries.clear();
      for (const [id, entry] of timelineData.entries) {
        // Convert timestamp back to Date object
        entry.timestamp = new Date(entry.timestamp);
        this.entries.set(id, entry);
      }

      // Rebuild search index
      this.rebuildSearchIndex();
      
      return true;
    } catch (error) {
      console.error('Failed to load evidence timeline:', error);
      return false;
    }
  }

  // Private helper methods

  private addEntry(entry: EvidenceTimelineEntry): void {
    this.entries.set(entry.id, entry);
    this.updateSearchIndex(entry);
  }

  private generateEntryId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private initializeSearchIndex(): void {
    this.searchIndex.clear();
  }

  private updateSearchIndex(entry: EvidenceTimelineEntry): void {
    // Index keywords
    for (const keyword of entry.keywords) {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, new Set());
      }
      this.searchIndex.get(keyword)!.add(entry.id);
    }

    // Index concepts
    for (const concept of entry.conceptsInvolved) {
      if (!this.searchIndex.has(concept)) {
        this.searchIndex.set(concept, new Set());
      }
      this.searchIndex.get(concept)!.add(entry.id);
    }
  }

  private rebuildSearchIndex(): void {
    this.initializeSearchIndex();
    for (const entry of this.entries.values()) {
      this.updateSearchIndex(entry);
    }
  }

  private extractConceptsFromPatch(session: any, choice: PlayerChoice): string[] {
    const concepts = ['patch_application', 'debugging'];
    
    if (choice.action === 'apply') concepts.push('direct_application');
    if (choice.action === 'refactor') concepts.push('refactoring', 'alternative_solutions');
    if (choice.action === 'question') concepts.push('inquiry', 'learning');
    
    return concepts;
  }

  private extractSkillsFromAction(action: string): string[] {
    const skillMap: Record<string, string[]> = {
      'apply': ['implementation', 'risk_assessment', 'execution'],
      'refactor': ['code_improvement', 'alternative_thinking', 'optimization'],
      'question': ['inquiry', 'learning', 'critical_thinking']
    };
    
    return skillMap[action] || ['general_debugging'];
  }

  private calculateRiskLevel(effects: MeterEffects): 'low' | 'medium' | 'high' | 'critical' {
    const stabilityImpact = Math.abs(effects.stability);
    
    if (stabilityImpact >= 20) return 'critical';
    if (stabilityImpact >= 10) return 'high';
    if (stabilityImpact >= 5) return 'medium';
    return 'low';
  }

  private calculateRiskLevelFromChoice(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const riskMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'question': 'low',
      'refactor': 'medium',
      'apply': 'high'
    };
    
    return riskMap[action] || 'medium';
  }

  private generateSearchSuggestions(query: TimelineSearchQuery, results: EvidenceTimelineEntry[]): string[] {
    const suggestions: string[] = [];
    
    // Suggest common categories if no category filter
    if (!query.category && results.length > 0) {
      const categories = [...new Set(results.map(r => r.category))];
      suggestions.push(...categories.map(c => `category:${c}`));
    }
    
    // Suggest common ghosts
    const ghosts = [...new Set(results.map(r => r.ghostId).filter(Boolean))];
    if (ghosts.length > 0) {
      suggestions.push(...ghosts.slice(0, 3).map(g => `ghost:${g}`));
    }
    
    return suggestions.slice(0, 5);
  }

  private extractRelatedConcepts(results: EvidenceTimelineEntry[]): string[] {
    const conceptCounts = new Map<string, number>();
    
    for (const entry of results) {
      for (const concept of entry.conceptsInvolved) {
        conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
      }
    }
    
    return Array.from(conceptCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([concept]) => concept);
  }

  private calculateSummaryStatistics(timeline: EvidenceTimelineEntry[]) {
    const patchEntries = timeline.filter(e => e.category === 'patch_application');
    const decisionEntries = timeline.filter(e => e.category === 'decision');
    
    return {
      totalPlayTime: this.calculateTotalPlayTime(timeline),
      totalEntries: timeline.length,
      roomsVisited: [...new Set(timeline.map(e => e.roomId))],
      ghostsEncountered: [...new Set(timeline.map(e => e.ghostId).filter((id): id is string => Boolean(id)))],
      patchesApplied: patchEntries.filter(e => e.context?.action === 'apply').length,
      patchesRefactored: patchEntries.filter(e => e.context?.action === 'refactor').length,
      questionsAsked: decisionEntries.filter(e => e.context?.action === 'question').length,
      successRate: timeline.filter(e => e.outcome === 'success').length / Math.max(1, timeline.length),
      averageRiskTolerance: this.calculateAverageRiskTolerance(timeline)
    };
  }

  private calculateTotalPlayTime(timeline: EvidenceTimelineEntry[]): number {
    if (timeline.length === 0) return 0;
    
    const sorted = timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const start = sorted[0].timestamp;
    const end = sorted[sorted.length - 1].timestamp;
    
    return end.getTime() - start.getTime();
  }

  private calculateAverageRiskTolerance(timeline: EvidenceTimelineEntry[]): number {
    const riskValues = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    const risks = timeline.map(e => riskValues[e.riskLevel]);
    
    return risks.length > 0 ? risks.reduce((sum, risk) => sum + risk, 0) / risks.length : 0.5;
  }

  private analyzeLearningOutcomes(timeline: EvidenceTimelineEntry[]): LearningOutcome[] {
    const conceptProgress = new Map<string, { 
      entries: EvidenceTimelineEntry[], 
      initialLevel: number, 
      finalLevel: number 
    }>();

    // Group entries by concept
    for (const entry of timeline) {
      for (const concept of entry.conceptsInvolved) {
        if (!conceptProgress.has(concept)) {
          conceptProgress.set(concept, {
            entries: [],
            initialLevel: 0.1, // Starting level
            finalLevel: 0.1
          });
        }
        conceptProgress.get(concept)!.entries.push(entry);
      }
    }

    // Calculate learning outcomes
    const outcomes: LearningOutcome[] = [];
    for (const [concept, data] of conceptProgress.entries()) {
      if (data.entries.length < 2) continue; // Need multiple interactions

      const successfulEntries = data.entries.filter(e => e.outcome === 'success');
      const practiceCount = data.entries.length;
      const successRate = successfulEntries.length / practiceCount;
      
      // Calculate improvement based on success rate and practice
      const improvement = Math.min(0.8, successRate * 0.3 + (practiceCount - 1) * 0.1);
      const finalLevel = Math.min(1.0, data.initialLevel + improvement);
      
      outcomes.push({
        concept,
        initialLevel: data.initialLevel,
        finalLevel,
        improvement,
        practiceCount,
        masteryAchieved: finalLevel >= 0.8,
        keyMoments: data.entries
          .filter(e => e.outcome === 'success')
          .slice(0, 3)
          .map(e => e.description),
        nextSteps: finalLevel < 0.8 ? [
          `Continue practicing ${concept}`,
          'Focus on understanding core principles',
          'Try different approaches to the same problem'
        ] : [
          `Apply ${concept} to more complex scenarios`,
          'Teach others about this concept',
          'Explore advanced variations'
        ]
      });
    }

    return outcomes.sort((a, b) => b.improvement - a.improvement);
  }

  private analyzeConceptMastery(timeline: EvidenceTimelineEntry[]): ConceptMasteryReport[] {
    const conceptStats = new Map<string, {
      practiceOpportunities: number;
      successfulApplications: number;
      mistakes: string[];
      strengths: string[];
    }>();

    // Analyze each entry
    for (const entry of timeline) {
      for (const concept of entry.conceptsInvolved) {
        if (!conceptStats.has(concept)) {
          conceptStats.set(concept, {
            practiceOpportunities: 0,
            successfulApplications: 0,
            mistakes: [],
            strengths: []
          });
        }

        const stats = conceptStats.get(concept)!;
        stats.practiceOpportunities++;

        if (entry.outcome === 'success') {
          stats.successfulApplications++;
          if (entry.confidence > 0.8) {
            stats.strengths.push(entry.description);
          }
        } else if (entry.outcome === 'failure') {
          stats.mistakes.push(entry.description);
        }
      }
    }

    // Generate mastery reports
    const reports: ConceptMasteryReport[] = [];
    for (const [concept, stats] of conceptStats.entries()) {
      const masteryLevel = stats.successfulApplications / Math.max(1, stats.practiceOpportunities);
      
      reports.push({
        concept,
        masteryLevel,
        practiceOpportunities: stats.practiceOpportunities,
        successfulApplications: stats.successfulApplications,
        commonMistakes: [...new Set(stats.mistakes)].slice(0, 3),
        strengthAreas: [...new Set(stats.strengths)].slice(0, 3),
        improvementAreas: masteryLevel < 0.7 ? [
          'Practice more scenarios',
          'Review fundamental concepts',
          'Seek feedback on approach'
        ] : []
      });
    }

    return reports.sort((a, b) => b.masteryLevel - a.masteryLevel);
  }

  private analyzeSkillProgression(timeline: EvidenceTimelineEntry[]): SkillProgressionReport[] {
    const skillProgress = new Map<string, SkillProgressionPoint[]>();

    // Track skill progression over time
    for (const entry of timeline) {
      for (const skill of entry.skillsApplied) {
        if (!skillProgress.has(skill)) {
          skillProgress.set(skill, []);
        }

        const points = skillProgress.get(skill)!;
        const currentLevel = points.length > 0 ? points[points.length - 1].level : 0.1;
        
        // Calculate level progression based on success and confidence
        let levelChange = 0;
        if (entry.outcome === 'success') {
          levelChange = entry.confidence * 0.1;
        } else if (entry.outcome === 'failure') {
          levelChange = -0.05; // Small penalty for failures
        }

        const newLevel = Math.max(0.1, Math.min(1.0, currentLevel + levelChange));
        
        points.push({
          timestamp: entry.timestamp,
          level: newLevel,
          evidence: [entry.description],
          milestone: newLevel >= 0.8 ? 'Expert Level' : 
                   newLevel >= 0.6 ? 'Advanced' :
                   newLevel >= 0.4 ? 'Intermediate' : undefined
        });
      }
    }

    // Generate progression reports
    const reports: SkillProgressionReport[] = [];
    for (const [skill, points] of skillProgress.entries()) {
      if (points.length === 0) continue;

      const currentLevel = points[points.length - 1].level;
      const levelCategory = currentLevel >= 0.8 ? 'expert' :
                           currentLevel >= 0.6 ? 'advanced' :
                           currentLevel >= 0.4 ? 'intermediate' : 'novice';

      reports.push({
        skill,
        progressionPath: points,
        currentLevel: levelCategory,
        timeToNextLevel: Math.max(1, (1 - currentLevel) * 10), // Estimated hours
        recommendedPractice: [
          `Practice ${skill} in different contexts`,
          'Seek challenging scenarios',
          'Review and reflect on past applications'
        ]
      });
    }

    return reports.sort((a, b) => 
      b.progressionPath[b.progressionPath.length - 1].level - 
      a.progressionPath[a.progressionPath.length - 1].level
    );
  }

  private analyzeDecisionPatterns(timeline: EvidenceTimelineEntry[]): DecisionPattern[] {
    const decisionEntries = timeline.filter(e => e.category === 'decision' || e.category === 'patch_application');
    const patterns = new Map<string, {
      frequency: number;
      successes: number;
      risks: number[];
      contexts: Set<string>;
      outcomes: Set<string>;
    }>();

    // Analyze decision patterns
    for (const entry of decisionEntries) {
      const action = entry.context?.action || 'unknown';
      
      if (!patterns.has(action)) {
        patterns.set(action, {
          frequency: 0,
          successes: 0,
          risks: [],
          contexts: new Set(),
          outcomes: new Set()
        });
      }

      const pattern = patterns.get(action)!;
      pattern.frequency++;
      
      if (entry.outcome === 'success') {
        pattern.successes++;
      }
      
      pattern.risks.push(this.getRiskValue(entry.riskLevel));
      pattern.contexts.add(entry.roomId);
      pattern.outcomes.add(entry.outcome);
    }

    // Generate pattern reports
    const reports: DecisionPattern[] = [];
    for (const [patternName, data] of patterns.entries()) {
      const successRate = data.successes / Math.max(1, data.frequency);
      const averageRisk = data.risks.reduce((sum, risk) => sum + risk, 0) / Math.max(1, data.risks.length);
      
      let recommendation = '';
      if (successRate > 0.8) {
        recommendation = `Continue using ${patternName} - it's working well for you`;
      } else if (successRate < 0.4) {
        recommendation = `Consider alternatives to ${patternName} - success rate is low`;
      } else {
        recommendation = `${patternName} shows mixed results - analyze context more carefully`;
      }

      reports.push({
        pattern: patternName,
        frequency: data.frequency,
        successRate,
        averageRisk,
        contexts: Array.from(data.contexts),
        outcomes: Array.from(data.outcomes),
        recommendation
      });
    }

    return reports.sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeRiskPatterns(timeline: EvidenceTimelineEntry[]): RiskAnalysisReport {
    const riskLevels = timeline.map(e => e.riskLevel);
    const riskDistribution = riskLevels.reduce((acc, risk) => {
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageRiskTolerance: this.calculateAverageRiskTolerance(timeline),
      riskDistribution,
      highRiskDecisions: [],
      riskVsSuccessCorrelation: 0.5,
      recommendedRiskStrategy: 'balanced'
    };
  }

  private getRiskValue(riskLevel: string): number {
    const riskValues = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    return riskValues[riskLevel as keyof typeof riskValues] || 0.5;
  }

  private generateRecommendations(
    learningOutcomes: LearningOutcome[],
    conceptMastery: ConceptMasteryReport[],
    decisionPatterns: DecisionPattern[],
    riskAnalysis: RiskAnalysisReport
  ): RecommendationSet {
    const immediate: Recommendation[] = [];
    const shortTerm: Recommendation[] = [];
    const longTerm: Recommendation[] = [];
    const conceptFocus: string[] = [];
    const skillDevelopment: string[] = [];
    const practiceAreas: string[] = [];

    // Immediate recommendations based on recent performance
    const lowMasteryConcepts = conceptMastery.filter(c => c.masteryLevel < 0.4);
    if (lowMasteryConcepts.length > 0) {
      immediate.push({
        type: 'concept_review',
        priority: 'high',
        title: 'Review Fundamental Concepts',
        description: 'Several core concepts need immediate attention',
        actionItems: lowMasteryConcepts.slice(0, 3).map(c => `Review ${c.concept} basics`),
        estimatedTime: 30,
        resources: ['Documentation', 'Practice exercises', 'Peer discussion']
      });
      
      conceptFocus.push(...lowMasteryConcepts.slice(0, 3).map(c => c.concept));
    }

    // Risk management recommendations
    if (riskAnalysis.averageRiskTolerance > 0.8) {
      immediate.push({
        type: 'risk_management',
        priority: 'medium',
        title: 'Consider More Conservative Approach',
        description: 'Your risk tolerance is quite high - consider more careful analysis',
        actionItems: [
          'Take more time to analyze patches before applying',
          'Ask more questions when uncertain',
          'Consider refactoring options more often'
        ],
        estimatedTime: 15,
        resources: ['Risk assessment guidelines', 'Decision-making frameworks']
      });
    } else if (riskAnalysis.averageRiskTolerance < 0.3) {
      immediate.push({
        type: 'risk_management',
        priority: 'medium',
        title: 'Consider Taking More Calculated Risks',
        description: 'You might be too conservative - some risks can lead to better learning',
        actionItems: [
          'Try applying patches with medium risk levels',
          'Experiment with different approaches',
          'Focus on learning from failures'
        ],
        estimatedTime: 15,
        resources: ['Learning from failure guides', 'Experimentation strategies']
      });
    }

    // Short-term recommendations based on decision patterns
    const lowSuccessPatterns = decisionPatterns.filter(p => p.successRate < 0.5);
    if (lowSuccessPatterns.length > 0) {
      shortTerm.push({
        type: 'strategy_adjustment',
        priority: 'medium',
        title: 'Improve Decision Strategies',
        description: 'Some decision patterns show low success rates',
        actionItems: lowSuccessPatterns.map(p => `Analyze why ${p.pattern} decisions often fail`),
        estimatedTime: 45,
        resources: ['Decision analysis tools', 'Pattern recognition guides']
      });
    }

    // Long-term skill development
    const improvingConcepts = learningOutcomes.filter(l => l.improvement > 0.2);
    if (improvingConcepts.length > 0) {
      longTerm.push({
        type: 'skill_practice',
        priority: 'low',
        title: 'Advanced Skill Development',
        description: 'Build on your strong foundation in key areas',
        actionItems: improvingConcepts.map(c => `Explore advanced ${c.concept} techniques`),
        estimatedTime: 120,
        resources: ['Advanced tutorials', 'Complex practice scenarios', 'Mentorship opportunities']
      });
      
      skillDevelopment.push(...improvingConcepts.map(c => c.concept));
    }

    // Practice area recommendations
    const allConcepts = [...new Set([
      ...conceptMastery.map(c => c.concept),
      ...learningOutcomes.map(l => l.concept)
    ])];
    
    practiceAreas.push(...allConcepts.slice(0, 5));

    return {
      immediate,
      shortTerm,
      longTerm,
      conceptFocus,
      skillDevelopment,
      practiceAreas
    };
  }
}