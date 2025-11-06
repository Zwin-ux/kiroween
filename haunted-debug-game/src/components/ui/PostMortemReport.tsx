/**
 * PostMortemReport - Learning outcomes analysis and report generation
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import type { 
  PostMortemReport as PostMortemReportType,
  LearningOutcome,
  ConceptMasteryReport,
  DecisionPattern,
  Recommendation
} from '../../engine/EvidenceTimeline';

interface PostMortemReportProps {
  report: PostMortemReportType;
  onExport: (format: 'json' | 'csv' | 'pdf') => void;
  onClose: () => void;
  className?: string;
}

export function PostMortemReport({ 
  report, 
  onExport, 
  onClose, 
  className 
}: PostMortemReportProps) {
  const [activeSection, setActiveSection] = useState<'summary' | 'learning' | 'decisions' | 'recommendations'>('summary');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const { summary } = report;
    
    return {
      efficiency: summary.patchesApplied / Math.max(1, summary.totalPlayTime / 60000), // patches per minute
      explorationRate: summary.roomsVisited.length / Math.max(1, summary.totalPlayTime / 60000), // rooms per minute
      learningVelocity: report.learningOutcomes.length / Math.max(1, summary.totalPlayTime / 3600000), // concepts per hour
      riskBalance: summary.averageRiskTolerance,
      overallGrade: calculateOverallGrade(summary, report.learningOutcomes)
    };
  }, [report]);

  const handleExport = () => {
    onExport(exportFormat);
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-red-700">
        <div>
          <h2 className="text-2xl font-bold text-red-300">Post-Mortem Report</h2>
          <p className="text-sm text-gray-400 mt-1">
            Session: {report.sessionId} • Generated: {report.generatedAt.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <Button
              onClick={handleExport}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              📊 Export
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕ Close
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-700">
        {(['summary', 'learning', 'decisions', 'recommendations'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "px-6 py-3 text-sm font-medium capitalize transition-colors",
              activeSection === section
                ? "text-red-300 border-b-2 border-red-500 bg-gray-800/50"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
            )}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'summary' && (
          <SummarySection 
            summary={report.summary} 
            derivedMetrics={derivedMetrics}
            timeline={report.timeline}
          />
        )}
        
        {activeSection === 'learning' && (
          <LearningSection 
            learningOutcomes={report.learningOutcomes}
            conceptMastery={report.conceptMastery}
            skillProgression={report.skillProgression}
          />
        )}
        
        {activeSection === 'decisions' && (
          <DecisionsSection 
            decisionPatterns={report.decisionPatterns}
            riskAnalysis={report.riskAnalysis}
            timeline={report.timeline}
          />
        )}
        
        {activeSection === 'recommendations' && (
          <RecommendationsSection recommendations={report.recommendations} />
        )}
      </div>
    </div>
  );
}

// Summary Section Component
function SummarySection({ 
  summary, 
  derivedMetrics, 
  timeline 
}: { 
  summary: PostMortemReportType['summary'];
  derivedMetrics: any;
  timeline: any[];
}) {
  return (
    <div className="space-y-8">
      {/* Overall Performance */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Overall Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Overall Grade"
            value={derivedMetrics.overallGrade}
            format="grade"
            description="Based on success rate, learning, and efficiency"
            color="text-yellow-400"
          />
          
          <MetricCard
            title="Success Rate"
            value={summary.successRate}
            format="percentage"
            description="Percentage of successful decisions"
            color="text-green-400"
          />
          
          <MetricCard
            title="Learning Velocity"
            value={derivedMetrics.learningVelocity}
            format="decimal"
            description="Concepts learned per hour"
            color="text-blue-400"
          />
          
          <MetricCard
            title="Risk Balance"
            value={summary.averageRiskTolerance}
            format="percentage"
            description="Average risk tolerance"
            color="text-orange-400"
          />
          
          <MetricCard
            title="Efficiency"
            value={derivedMetrics.efficiency}
            format="decimal"
            description="Patches applied per minute"
            color="text-purple-400"
          />
          
          <MetricCard
            title="Exploration Rate"
            value={derivedMetrics.explorationRate}
            format="decimal"
            description="Rooms explored per minute"
            color="text-cyan-400"
          />
        </div>
      </div>

      {/* Session Statistics */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Session Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Play Time" value={formatDuration(summary.totalPlayTime)} />
          <StatCard title="Total Events" value={summary.totalEntries.toString()} />
          <StatCard title="Rooms Visited" value={summary.roomsVisited.length.toString()} />
          <StatCard title="Ghosts Encountered" value={summary.ghostsEncountered.length.toString()} />
          <StatCard title="Patches Applied" value={summary.patchesApplied.toString()} />
          <StatCard title="Patches Refactored" value={summary.patchesRefactored.toString()} />
          <StatCard title="Questions Asked" value={summary.questionsAsked.toString()} />
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Activity Timeline</h3>
        <ActivityTimeline timeline={timeline} />
      </div>
    </div>
  );
}

// Learning Section Component
function LearningSection({ 
  learningOutcomes, 
  conceptMastery, 
  skillProgression 
}: {
  learningOutcomes: LearningOutcome[];
  conceptMastery: ConceptMasteryReport[];
  skillProgression: any[];
}) {
  return (
    <div className="space-y-8">
      {/* Learning Outcomes */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Learning Outcomes</h3>
        {learningOutcomes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No specific learning outcomes recorded for this session.</p>
            <p className="text-sm mt-2">Continue playing to build learning analytics.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {learningOutcomes.map((outcome, i) => (
              <LearningOutcomeCard key={i} outcome={outcome} />
            ))}
          </div>
        )}
      </div>

      {/* Concept Mastery */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Concept Mastery</h3>
        {conceptMastery.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Concept mastery analysis will appear after more gameplay.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conceptMastery.map((concept, i) => (
              <ConceptMasteryCard key={i} concept={concept} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Decisions Section Component
function DecisionsSection({ 
  decisionPatterns, 
  riskAnalysis, 
  timeline 
}: {
  decisionPatterns: DecisionPattern[];
  riskAnalysis: any;
  timeline: any[];
}) {
  return (
    <div className="space-y-8">
      {/* Decision Patterns */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Decision Patterns</h3>
        {decisionPatterns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Decision pattern analysis will appear after more decisions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisionPatterns.map((pattern, i) => (
              <DecisionPatternCard key={i} pattern={pattern} />
            ))}
          </div>
        )}
      </div>

      {/* Risk Analysis */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Risk Analysis</h3>
        <RiskAnalysisCard riskAnalysis={riskAnalysis} />
      </div>
    </div>
  );
}

// Recommendations Section Component
function RecommendationsSection({ 
  recommendations 
}: { 
  recommendations: PostMortemReportType['recommendations'] 
}) {
  return (
    <div className="space-y-8">
      {(['immediate', 'shortTerm', 'longTerm'] as const).map((timeframe) => (
        <div key={timeframe}>
          <h3 className="text-xl font-bold text-white mb-4 capitalize">
            {timeframe === 'shortTerm' ? 'Short Term' : 
             timeframe === 'longTerm' ? 'Long Term' : 
             timeframe} Recommendations
          </h3>
          
          {recommendations[timeframe].length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No {timeframe} recommendations available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations[timeframe].map((rec, i) => (
                <RecommendationCard key={i} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper Components

function MetricCard({ 
  title, 
  value, 
  format, 
  description, 
  color 
}: {
  title: string;
  value: number;
  format: 'percentage' | 'decimal' | 'grade';
  description: string;
  color: string;
}) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'decimal':
        return val.toFixed(2);
      case 'grade':
        return val >= 0.9 ? 'A' : val >= 0.8 ? 'B' : val >= 0.7 ? 'C' : val >= 0.6 ? 'D' : 'F';
      default:
        return val.toString();
    }
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className={cn("text-2xl font-bold mb-1", color)}>
        {formatValue(value, format)}
      </div>
      <div className="text-white font-medium text-sm mb-1">{title}</div>
      <div className="text-gray-400 text-xs">{description}</div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-800/30 p-3 rounded border border-gray-700 text-center">
      <div className="text-white font-mono text-lg">{value}</div>
      <div className="text-gray-400 text-xs">{title}</div>
    </div>
  );
}

function LearningOutcomeCard({ outcome }: { outcome: LearningOutcome }) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium">{outcome.concept}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {outcome.initialLevel.toFixed(1)} → {outcome.finalLevel.toFixed(1)}
          </span>
          <span className={cn(
            "text-sm font-medium",
            outcome.improvement > 0 ? "text-green-400" : "text-gray-400"
          )}>
            {outcome.improvement > 0 ? '+' : ''}{outcome.improvement.toFixed(1)}
          </span>
        </div>
      </div>
      
      <Progress 
        value={outcome.finalLevel * 100} 
        className="mb-2"
      />
      
      <div className="text-sm text-gray-400">
        Practiced {outcome.practiceCount} times
        {outcome.masteryAchieved && (
          <span className="ml-2 text-green-400">✓ Mastered</span>
        )}
      </div>
    </div>
  );
}

function ConceptMasteryCard({ concept }: { concept: ConceptMasteryReport }) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <h4 className="text-white font-medium mb-2">{concept.concept}</h4>
      <Progress value={concept.masteryLevel * 100} className="mb-2" />
      <div className="text-sm text-gray-400">
        {concept.successfulApplications}/{concept.practiceOpportunities} successful applications
      </div>
    </div>
  );
}

function DecisionPatternCard({ pattern }: { pattern: DecisionPattern }) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium">{pattern.pattern}</h4>
        <div className="text-sm text-gray-400">
          {pattern.frequency} times • {(pattern.successRate * 100).toFixed(0)}% success
        </div>
      </div>
      <p className="text-sm text-gray-300 mb-2">{pattern.recommendation}</p>
      <div className="text-xs text-gray-400">
        Avg Risk: {(pattern.averageRisk * 100).toFixed(0)}%
      </div>
    </div>
  );
}

function RiskAnalysisCard({ riskAnalysis }: { riskAnalysis: any }) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Object.entries(riskAnalysis.riskDistribution || {}).map(([level, count]) => (
          <div key={level} className="text-center">
            <div className="text-white font-mono text-lg">{count as number}</div>
            <div className="text-gray-400 text-sm capitalize">{level} Risk</div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-300">
        <strong>Average Risk Tolerance:</strong> {((riskAnalysis.averageRiskTolerance || 0) * 100).toFixed(0)}%
      </div>
      <div className="text-sm text-gray-300 mt-1">
        <strong>Recommended Strategy:</strong> {riskAnalysis.recommendedRiskStrategy || 'Balanced approach'}
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColors = {
    low: 'border-gray-500 text-gray-300',
    medium: 'border-yellow-500 text-yellow-300',
    high: 'border-orange-500 text-orange-300',
    critical: 'border-red-500 text-red-300'
  };

  return (
    <div className={cn(
      "bg-gray-800/50 p-4 rounded-lg border-l-4",
      priorityColors[recommendation.priority]
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium">{recommendation.title}</h4>
        <span className="text-xs px-2 py-1 bg-gray-700 rounded capitalize">
          {recommendation.priority}
        </span>
      </div>
      
      <p className="text-sm text-gray-300 mb-3">{recommendation.description}</p>
      
      {recommendation.actionItems.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-gray-300 mb-1">Action Items:</h5>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            {recommendation.actionItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="text-xs text-gray-400">
        Estimated time: {recommendation.estimatedTime} minutes
      </div>
    </div>
  );
}

function ActivityTimeline({ timeline }: { timeline: any[] }) {
  // Simplified timeline visualization
  return (
    <div className="bg-gray-800/30 p-4 rounded-lg">
      <div className="text-center text-gray-400">
        <p>Activity timeline visualization</p>
        <p className="text-sm mt-1">
          {timeline.length} events recorded during this session
        </p>
      </div>
    </div>
  );
}

// Helper functions
function calculateOverallGrade(summary: any, learningOutcomes: LearningOutcome[]): number {
  const successWeight = 0.4;
  const learningWeight = 0.3;
  const efficiencyWeight = 0.3;
  
  const successScore = summary.successRate;
  const learningScore = learningOutcomes.length > 0 ? 
    learningOutcomes.reduce((sum, outcome) => sum + outcome.improvement, 0) / learningOutcomes.length : 0.5;
  const efficiencyScore = Math.min(1, summary.patchesApplied / Math.max(1, summary.totalPlayTime / 60000) / 2);
  
  return successWeight * successScore + learningWeight * learningScore + efficiencyWeight * efficiencyScore;
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}