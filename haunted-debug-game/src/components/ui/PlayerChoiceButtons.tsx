/**
 * PlayerChoiceButtons - Apply/Refactor/Question choice interface
 */

import React, { useState } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import type { GeneratedPatch } from '../../engine/PatchGenerationSystem';

export interface PlayerChoiceButtonsProps {
  patch: GeneratedPatch;
  onChoice: (choice: 'apply' | 'refactor' | 'question', question?: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function PlayerChoiceButtons({
  patch,
  onChoice,
  isLoading = false,
  className
}: PlayerChoiceButtonsProps) {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedQuickQuestion, setSelectedQuickQuestion] = useState<string | null>(null);

  const handleApply = () => {
    onChoice('apply');
  };

  const handleRefactor = () => {
    onChoice('refactor');
  };

  const handleQuestion = (question?: string) => {
    const finalQuestion = question || customQuestion || selectedQuickQuestion;
    if (finalQuestion) {
      onChoice('question', finalQuestion);
      setCustomQuestion('');
      setSelectedQuickQuestion(null);
      setShowQuestionInput(false);
    }
  };

  const quickQuestions = getQuickQuestions(patch);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Apply Button */}
        <Button
          onClick={handleApply}
          disabled={isLoading}
          variant="horror"
          size="lg"
          className={cn(
            "flex flex-col items-center space-y-2 h-auto py-4",
            patch.riskScore > 0.7 && "bg-red-800 hover:bg-red-700 border-red-600"
          )}
        >
          <span className="text-2xl">⚡</span>
          <div className="text-center">
            <div className="font-bold">Apply Patch</div>
            <div className="text-xs opacity-80">
              Execute the fix immediately
            </div>
          </div>
          {patch.riskScore > 0.7 && (
            <div className="text-xs bg-red-700 px-2 py-1 rounded">
              High Risk
            </div>
          )}
        </Button>

        {/* Refactor Button */}
        <Button
          onClick={handleRefactor}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="flex flex-col items-center space-y-2 h-auto py-4 border-yellow-600 text-yellow-100 hover:bg-yellow-900/20"
        >
          <span className="text-2xl">🔄</span>
          <div className="text-center">
            <div className="font-bold">Refactor</div>
            <div className="text-xs opacity-80">
              Try a different approach
            </div>
          </div>
        </Button>

        {/* Question Button */}
        <Button
          onClick={() => setShowQuestionInput(!showQuestionInput)}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="flex flex-col items-center space-y-2 h-auto py-4 border-blue-600 text-blue-100 hover:bg-blue-900/20"
        >
          <span className="text-2xl">❓</span>
          <div className="text-center">
            <div className="font-bold">Ask Question</div>
            <div className="text-xs opacity-80">
              Learn more before deciding
            </div>
          </div>
        </Button>
      </div>

      {/* Question Input Section */}
      {showQuestionInput && (
        <div className="bg-gray-800 border border-blue-600 rounded-lg p-4 space-y-4">
          <h4 className="text-blue-100 font-medium">What would you like to know?</h4>
          
          {/* Quick Questions */}
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Quick questions:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedQuickQuestion(question);
                    handleQuestion(question);
                  }}
                  className={cn(
                    "text-left p-3 rounded border text-sm transition-colors",
                    "border-gray-600 text-gray-200 hover:border-blue-500 hover:bg-blue-900/20",
                    selectedQuickQuestion === question && "border-blue-500 bg-blue-900/30"
                  )}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question Input */}
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Or ask your own question:</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customQuestion.trim()) {
                    handleQuestion();
                  }
                }}
              />
              <Button
                onClick={() => handleQuestion()}
                disabled={!customQuestion.trim() || isLoading}
                variant="outline"
                className="border-blue-600 text-blue-100 hover:bg-blue-900/20"
              >
                Ask
              </Button>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowQuestionInput(false);
                setCustomQuestion('');
                setSelectedQuickQuestion(null);
              }}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Risk Warning for Apply */}
      {patch.riskScore > 0.6 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-red-200 font-medium text-sm">
                {patch.riskScore > 0.8 ? 'Critical Risk Warning' : 'High Risk Warning'}
              </p>
              <p className="text-red-300 text-xs mt-1">
                {getRiskWarning(patch.riskScore)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
            <span className="text-sm">Processing your choice...</span>
          </div>
        </div>
      )}

      {/* Choice Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
        <div className="text-center">
          <p className="font-medium text-red-300">Apply</p>
          <p>Execute the patch immediately. Effects will be applied to your meters and the ghost will respond.</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-yellow-300">Refactor</p>
          <p>Generate an alternative approach with different trade-offs. May have different risk/reward profile.</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-blue-300">Question</p>
          <p>Ask the ghost for more information or clarification before making your decision.</p>
        </div>
      </div>
    </div>
  );
}

function getQuickQuestions(patch: GeneratedPatch): string[] {
  const questions = [];

  // Risk-based questions
  if (patch.riskScore > 0.6) {
    questions.push("What are the main risks with this approach?");
    questions.push("Is there a safer alternative?");
  }

  // Complexity-based questions
  if (patch.complexity === 'advanced' || patch.complexity === 'complex') {
    questions.push("Can you explain this in simpler terms?");
    questions.push("What makes this approach complex?");
  }

  // General questions
  questions.push("How does this fix the underlying problem?");
  questions.push("What should I watch out for after applying this?");
  
  // Impact-based questions
  if (patch.impact === 'significant' || patch.impact === 'system_wide') {
    questions.push("What other parts of the system will this affect?");
  }

  // Educational questions
  if (patch.educationalNotes.length > 0) {
    questions.push("Can you teach me more about this type of problem?");
  }

  return questions.slice(0, 4); // Limit to 4 quick questions
}

function getRiskWarning(riskScore: number): string {
  if (riskScore > 0.8) {
    return "This patch has critical risk factors. Consider asking questions or trying the refactor option first.";
  } else if (riskScore > 0.6) {
    return "This patch carries significant risk. Make sure you understand the implications before applying.";
  } else {
    return "This patch has some risk factors to consider.";
  }
}