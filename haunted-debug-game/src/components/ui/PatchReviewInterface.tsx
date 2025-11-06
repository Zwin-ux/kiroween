/**
 * PatchReviewInterface - Main component for reviewing and choosing patch options
 */

import React, { useState } from 'react';
import { Button } from './button';
import { DiffVisualization } from './DiffVisualization';
import { RiskIndicator } from './RiskIndicator';
import { PatchDescription } from './PatchDescription';
import { PlayerChoiceButtons } from './PlayerChoiceButtons';
import type { GeneratedPatch } from '../../engine/PatchGenerationSystem';
import { cn } from '@/lib/utils';

export interface PatchReviewProps {
  patch: GeneratedPatch;
  onApply: (patch: GeneratedPatch) => void;
  onRefactor: (patch: GeneratedPatch) => void;
  onQuestion: (patch: GeneratedPatch, question: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function PatchReviewInterface({
  patch,
  onApply,
  onRefactor,
  onQuestion,
  isLoading = false,
  className
}: PatchReviewProps) {
  const [selectedTab, setSelectedTab] = useState<'diff' | 'explanation' | 'education'>('diff');
  const [showFullDiff, setShowFullDiff] = useState(false);

  const handleChoice = (choice: 'apply' | 'refactor' | 'question', question?: string) => {
    switch (choice) {
      case 'apply':
        onApply(patch);
        break;
      case 'refactor':
        onRefactor(patch);
        break;
      case 'question':
        if (question) {
          onQuestion(patch, question);
        }
        break;
    }
  };

  return (
    <div className={cn(
      "bg-gray-900 border border-red-800 rounded-lg p-6 font-mono",
      "shadow-2xl shadow-red-900/20",
      className
    )}>
      {/* Header with patch info and risk indicator */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-100 mb-2">
            Patch Review
          </h3>
          <p className="text-red-300 text-sm">
            {patch.description}
          </p>
        </div>
        <RiskIndicator 
          riskScore={patch.riskScore}
          complexity={patch.complexity}
          impact={patch.impact}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'diff', label: 'Code Changes', icon: '📝' },
          { key: 'explanation', label: 'Explanation', icon: '💡' },
          { key: 'education', label: 'Learn More', icon: '📚' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              "flex items-center justify-center space-x-2",
              selectedTab === tab.key
                ? "bg-red-900 text-red-100 shadow-sm"
                : "text-red-300 hover:text-red-100 hover:bg-gray-700"
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {selectedTab === 'diff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-red-100">Code Changes</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDiff(!showFullDiff)}
                className="text-red-300 hover:text-red-100"
              >
                {showFullDiff ? 'Show Summary' : 'Show Full Diff'}
              </Button>
            </div>
            <DiffVisualization 
              diff={patch.diff}
              showFullDiff={showFullDiff}
              riskScore={patch.riskScore}
            />
          </div>
        )}

        {selectedTab === 'explanation' && (
          <PatchDescription 
            patch={patch}
            showTechnicalDetails={true}
          />
        )}

        {selectedTab === 'education' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-red-100">Educational Notes</h4>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              {patch.educationalNotes.map((note, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-yellow-400 mt-1">💡</span>
                  <p className="text-red-200 text-sm leading-relaxed">{note}</p>
                </div>
              ))}
              
              {patch.alternatives && patch.alternatives.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h5 className="text-md font-medium text-red-100 mb-2">Alternative Approaches</h5>
                  <ul className="space-y-2">
                    {patch.alternatives.map((alt, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-1">→</span>
                        <span className="text-red-200 text-sm">{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ghost Response */}
      <div className="mb-6 p-4 bg-gray-800 border border-red-700 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">👻</span>
          <div>
            <p className="text-red-100 font-medium mb-1">Ghost Response:</p>
            <p className="text-red-200 italic text-sm leading-relaxed">
              "{patch.ghostResponse}"
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <PlayerChoiceButtons
        patch={patch}
        onChoice={handleChoice}
        isLoading={isLoading}
      />
    </div>
  );
}