/**
 * TradeOffAnalysis - Component for displaying patch comparison and trade-offs
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import type { TradeOffAnalysis, GeneratedPatch, ApproachExplanation } from '../../engine/PatchGenerationSystem';

export interface TradeOffAnalysisProps {
  originalPatch: GeneratedPatch;
  alternativePatch: GeneratedPatch;
  analysis: TradeOffAnalysis;
  explanations: ApproachExplanation[];
  onSelectPatch: (patch: GeneratedPatch) => void;
  className?: string;
}

export function TradeOffAnalysis({
  originalPatch,
  alternativePatch,
  analysis,
  explanations,
  onSelectPatch,
  className
}: TradeOffAnalysisProps) {
  const originalExplanation = explanations.find(e => e.patchId === originalPatch.id);
  const alternativeExplanation = explanations.find(e => e.patchId === alternativePatch.id);

  return (
    <div className={cn("bg-gray-900 border border-yellow-600 rounded-lg p-6", className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-yellow-100 mb-2">
          🔄 Alternative Approach Available
        </h3>
        <p className="text-yellow-200 text-sm">
          Compare different solutions and their trade-offs to make an informed decision.
        </p>
      </div>

      {/* Trade-off Summary */}
      <div className="mb-6 p-4 bg-gray-800 border border-yellow-700 rounded-lg">
        <h4 className="text-lg font-semibold text-yellow-100 mb-2">Trade-off Summary</h4>
        <p className="text-yellow-200 text-sm leading-relaxed">
          {analysis.tradeOffSummary}
        </p>
      </div>

      {/* Patch Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Original Patch */}
        <PatchComparisonCard
          patch={originalPatch}
          explanation={originalExplanation}
          isRecommended={analysis.recommendedChoice.patchId === originalPatch.id}
          onSelect={() => onSelectPatch(originalPatch)}
          title="Original Approach"
        />

        {/* Alternative Patch */}
        <PatchComparisonCard
          patch={alternativePatch}
          explanation={alternativeExplanation}
          isRecommended={analysis.recommendedChoice.patchId === alternativePatch.id}
          onSelect={() => onSelectPatch(alternativePatch)}
          title="Alternative Approach"
        />
      </div>

      {/* Detailed Comparison */}
      <div className="space-y-4 mb-6">
        <h4 className="text-lg font-semibold text-yellow-100">Detailed Comparison</h4>
        
        {/* Risk Comparison */}
        <ComparisonRow
          label="Risk Level"
          icon="⚠️"
          comparison={analysis.riskComparison}
          value1={`${Math.round(originalPatch.riskScore * 100)}%`}
          value2={`${Math.round(alternativePatch.riskScore * 100)}%`}
        />

        {/* Complexity Comparison */}
        <ComparisonRow
          label="Complexity"
          icon="🧩"
          comparison={analysis.complexityComparison}
          value1={originalPatch.complexity}
          value2={alternativePatch.complexity}
        />

        {/* Effects Comparison */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📊</span>
            <span className="font-medium text-yellow-100">Expected Effects</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-300 mb-2">Original</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Stability:</span>
                  <span className="text-green-400">+{originalPatch.expectedEffects.stability}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Insight:</span>
                  <span className="text-blue-400">+{originalPatch.expectedEffects.insight}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-2">Alternative</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Stability:</span>
                  <span className="text-green-400">+{alternativePatch.expectedEffects.stability}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Insight:</span>
                  <span className="text-blue-400">+{alternativePatch.expectedEffects.insight}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{analysis.effectsComparison.explanation}</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-100 mb-2">
              Recommendation ({Math.round(analysis.recommendedChoice.confidence * 100)}% confidence)
            </h4>
            <div className="space-y-2">
              {analysis.recommendedChoice.reasoning.map((reason, index) => (
                <p key={index} className="text-blue-200 text-sm">• {reason}</p>
              ))}
            </div>
            {analysis.recommendedChoice.considerations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-700">
                <p className="text-blue-100 font-medium text-sm mb-1">Considerations:</p>
                {analysis.recommendedChoice.considerations.map((consideration, index) => (
                  <p key={index} className="text-blue-300 text-xs">• {consideration}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Value */}
      <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-purple-100 mb-3">
          📚 Learning Opportunity
        </h4>
        <p className="text-purple-200 text-sm mb-3">
          Having multiple approaches helps you understand different problem-solving strategies:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {originalExplanation && (
            <div>
              <p className="font-medium text-purple-100 text-sm mb-1">
                {originalExplanation.approachType}
              </p>
              <p className="text-purple-300 text-xs mb-2">
                {originalExplanation.whenToUse}
              </p>
              <div className="space-y-1">
                {originalExplanation.learningObjectives.slice(0, 2).map((objective, index) => (
                  <p key={index} className="text-purple-200 text-xs">• {objective}</p>
                ))}
              </div>
            </div>
          )}
          {alternativeExplanation && (
            <div>
              <p className="font-medium text-purple-100 text-sm mb-1">
                {alternativeExplanation.approachType}
              </p>
              <p className="text-purple-300 text-xs mb-2">
                {alternativeExplanation.whenToUse}
              </p>
              <div className="space-y-1">
                {alternativeExplanation.learningObjectives.slice(0, 2).map((objective, index) => (
                  <p key={index} className="text-purple-200 text-xs">• {objective}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PatchComparisonCardProps {
  patch: GeneratedPatch;
  explanation?: ApproachExplanation;
  isRecommended: boolean;
  onSelect: () => void;
  title: string;
}

function PatchComparisonCard({
  patch,
  explanation,
  isRecommended,
  onSelect,
  title
}: PatchComparisonCardProps) {
  return (
    <div className={cn(
      "bg-gray-800 border rounded-lg p-4 relative",
      isRecommended ? "border-green-500 bg-green-900/20" : "border-gray-600"
    )}>
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Recommended
        </div>
      )}
      
      <h5 className="font-semibold text-yellow-100 mb-2">{title}</h5>
      <p className="text-gray-300 text-sm mb-3">{patch.description}</p>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-gray-700 rounded p-2">
          <span className="text-gray-400">Risk:</span>
          <span className={cn(
            "ml-1 font-medium",
            patch.riskScore > 0.6 ? "text-red-400" : 
            patch.riskScore > 0.3 ? "text-yellow-400" : "text-green-400"
          )}>
            {Math.round(patch.riskScore * 100)}%
          </span>
        </div>
        <div className="bg-gray-700 rounded p-2">
          <span className="text-gray-400">Complexity:</span>
          <span className="ml-1 font-medium text-blue-400 capitalize">
            {patch.complexity}
          </span>
        </div>
      </div>

      {/* Pros and Cons */}
      {explanation && (
        <div className="space-y-2 mb-4">
          <div>
            <p className="text-green-400 text-xs font-medium mb-1">Pros:</p>
            <ul className="space-y-1">
              {explanation.pros.slice(0, 2).map((pro, index) => (
                <li key={index} className="text-green-300 text-xs">• {pro}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-red-400 text-xs font-medium mb-1">Cons:</p>
            <ul className="space-y-1">
              {explanation.cons.slice(0, 2).map((con, index) => (
                <li key={index} className="text-red-300 text-xs">• {con}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Button
        onClick={onSelect}
        variant={isRecommended ? "default" : "outline"}
        size="sm"
        className="w-full"
      >
        Choose This Approach
      </Button>
    </div>
  );
}

interface ComparisonRowProps {
  label: string;
  icon: string;
  comparison: { winner: 'patch1' | 'patch2' | 'tie'; explanation: string };
  value1: string;
  value2: string;
}

function ComparisonRow({ label, icon, comparison, value1, value2 }: ComparisonRowProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-yellow-100">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className={cn(
          "text-center p-2 rounded",
          comparison.winner === 'patch1' ? "bg-green-900/30 border border-green-600" : "bg-gray-700"
        )}>
          <p className="text-sm text-gray-300">Original</p>
          <p className="font-medium text-white">{value1}</p>
        </div>
        <div className={cn(
          "text-center p-2 rounded",
          comparison.winner === 'patch2' ? "bg-green-900/30 border border-green-600" : "bg-gray-700"
        )}>
          <p className="text-sm text-gray-300">Alternative</p>
          <p className="font-medium text-white">{value2}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400">{comparison.explanation}</p>
    </div>
  );
}