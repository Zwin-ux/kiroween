/**
 * EducationalFeedbackPanel - Contextual explanations and learning progress
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { EducationalFeedbackSystem, type EducationalFeedback } from '@/engine/EducationalFeedbackSystem';
import { useGameStore } from '@/store/gameStore';
import type { Ghost } from '@/types/content';
import type { PatchPlan } from '@/types/patch';
import type { ActionResult } from '@/types/encounter';

interface EducationalFeedbackPanelProps {
  result?: ActionResult;
  patch?: PatchPlan;
  action?: 'apply' | 'refactor' | 'question';
  ghost?: Ghost | null;
  onComplete?: () => void;
  onContinueExploring?: () => void;
  onClose?: () => void;
  className?: string;
}

export function EducationalFeedbackPanel({
  result,
  patch,
  action,
  ghost,
  onComplete,
  onContinueExploring,
  onClose,
  className
}: EducationalFeedbackPanelProps) {
  const gameStore = useGameStore();
  const [currentTab, setCurrentTab] = useState<'feedback' | 'concepts' | 'progress'>('feedback');
  const [educationalFeedback, setEducationalFeedback] = useState<EducationalFeedback | null>(null);
  const [feedbackSystem] = useState(() => new EducationalFeedbackSystem());

  // Generate educational feedback when props change
  useEffect(() => {
    if (result && action && ghost) {
      generateEducationalFeedback();
    }
  }, [result, patch, action, ghost]);

  const generateEducationalFeedback = () => {
    if (!result || !action || !ghost) return;

    // Create a mock player choice for the feedback system
    const playerChoice = {
      id: `choice_${Date.now()}`,
      timestamp: new Date(),
      roomId: gameStore.currentRoom,
      ghostId: ghost.id,
      action,
      intent: `${action} action for ${ghost.softwareSmell}`,
      outcome: result.success ? 'success' : 'failure'
    };

    // Generate comprehensive educational feedback
    const feedback = feedbackSystem.generateFeedback(playerChoice, patch, ghost, result);
    setEducationalFeedback(feedback);

    // Update learning progress in game store
    feedback.skillAssessments.forEach(assessment => {
      gameStore.updateLearningProgress(assessment.concept, assessment.improvement);
    });
  };



  const renderFeedbackTab = () => {
    if (!educationalFeedback) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-400">Generating educational feedback...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Decision Analysis */}
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-bold mb-3">Decision Analysis</h3>
          <p className="text-sm text-gray-300 mb-4">{educationalFeedback.explanations.decision}</p>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">Consequences:</h4>
              <p className="text-sm text-gray-400">{educationalFeedback.explanations.consequences}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">Alternative Approaches:</h4>
              <p className="text-sm text-gray-400 whitespace-pre-line">{educationalFeedback.explanations.alternatives}</p>
            </div>
          </div>
        </div>

        {/* Learning Points */}
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-bold mb-3">Key Learning Points</h3>
          <ul className="space-y-2">
            {educationalFeedback.explanations.learningPoints.map((point, index) => (
              <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                <span className="text-blue-400 mt-1">💡</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Immediate Recommendations */}
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-bold mb-3">Immediate Recommendations</h3>
          <ul className="space-y-2">
            {educationalFeedback.recommendations.immediate.map((rec, index) => (
              <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                <span className="text-green-400 mt-1">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Patch Information */}
        {patch && (
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-white font-bold mb-3">About This Patch</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">What it does:</h4>
                <p className="text-sm text-gray-400">{patch.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-gray-300 mb-1">Risk Level:</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={patch.risk * 100} className="h-2 flex-1" />
                    <span className="text-white font-mono">{Math.round(patch.risk * 100)}%</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-gray-300 mb-1">Risk Level:</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={patch.risk * 100} className="h-2 flex-1" />
                    <span className="text-white font-mono">{Math.round(patch.risk * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConceptsTab = () => {
    if (!educationalFeedback) return null;

    const learningAnalytics = feedbackSystem.getLearningAnalytics();
    const concepts = learningAnalytics.getAllConcepts();
    const conceptExplanation = ghost ? feedbackSystem.getConceptExplanation(ghost.softwareSmell) : null;

    return (
      <div className="space-y-4">
        {/* Current Concept */}
        {conceptExplanation && (
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <h3 className="text-blue-300 font-bold mb-3">Current Concept: {conceptExplanation.concept.replace('_', ' ').toUpperCase()}</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Definition:</h4>
                <p className="text-sm text-gray-400">{conceptExplanation.definition}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Why it matters:</h4>
                <p className="text-sm text-gray-400">{conceptExplanation.importance}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Best Practices:</h4>
                <ul className="space-y-1">
                  {conceptExplanation.bestPractices.slice(0, 3).map((practice, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Common Mistakes:</h4>
                <ul className="space-y-1">
                  {conceptExplanation.commonMistakes.slice(0, 2).map((mistake, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                      <span className="text-red-400 mt-1">✗</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* All Learning Concepts */}
        <h3 className="text-white font-bold">Your Learning Progress</h3>
        
        {concepts.map((concept) => (
          <div key={concept.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">{concept.name}</h4>
              <div className="text-sm text-gray-400">
                Practiced {concept.practiceCount} times
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-3">{concept.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Mastery Level</span>
                <span className="text-white font-mono">
                  {Math.round(concept.masteryLevel * 100)}%
                </span>
              </div>
              <Progress value={concept.masteryLevel * 100} className="h-2" />
            </div>
            
            {concept.relatedConcepts.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-1">Related Concepts:</div>
                <div className="flex flex-wrap gap-1">
                  {concept.relatedConcepts.map((relatedConcept) => (
                    <span
                      key={relatedConcept}
                      className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
                    >
                      {relatedConcept.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProgressTab = () => {
    if (!educationalFeedback) return null;

    const learningAnalytics = feedbackSystem.getLearningAnalytics();
    const adaptiveDifficulty = educationalFeedback.adaptiveDifficulty;

    return (
      <div className="space-y-4">
        {/* Skill Assessments */}
        <h3 className="text-white font-bold">Skill Improvements This Session</h3>
        
        {educationalFeedback.skillAssessments.map((assessment, index) => (
          <div key={index} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">{assessment.concept.replace('_', ' ')}</h4>
              <div className={cn(
                "text-sm font-mono",
                assessment.improvement > 0.1 ? "text-green-400" :
                assessment.improvement > 0.05 ? "text-yellow-400" : "text-red-400"
              )}>
                +{Math.round(assessment.improvement * 100)}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Current Level</div>
                <div className="flex items-center space-x-2">
                  <Progress value={assessment.currentLevel * 100} className="h-2 flex-1" />
                  <span className="text-white text-xs font-mono">
                    {Math.round(assessment.currentLevel * 100)}%
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-400 mb-1">Target Level</div>
                <div className="flex items-center space-x-2">
                  <Progress value={assessment.targetLevel * 100} className="h-2 flex-1" />
                  <span className="text-white text-xs font-mono">
                    {Math.round(assessment.targetLevel * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-2">Recommendations:</h5>
              <ul className="space-y-1">
                {assessment.recommendations.map((rec, recIndex) => (
                  <li key={recIndex} className="text-sm text-gray-400 flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Long-term Recommendations */}
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-bold mb-3">Long-term Learning Path</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Focus Areas:</h4>
              <ul className="space-y-1">
                {educationalFeedback.recommendations.longTerm.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                    <span className="text-amber-400 mt-1">📚</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recommended Resources:</h4>
              <ul className="space-y-1">
                {educationalFeedback.recommendations.resources.slice(0, 3).map((resource, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                    <span className="text-green-400 mt-1">🔗</span>
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Adaptive Difficulty */}
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="text-white font-bold mb-3">Personalized Difficulty Settings</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Ghost Complexity:</div>
              <div className="text-white capitalize">{adaptiveDifficulty.ghostComplexity}</div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-1">Educational Support:</div>
              <div className="text-white capitalize">{adaptiveDifficulty.educationalSupport}</div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-1">Hint Frequency:</div>
              <div className="text-white capitalize">{adaptiveDifficulty.hintFrequency}</div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-1">Explanation Depth:</div>
              <div className="text-white capitalize">{adaptiveDifficulty.explanationDepth}</div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="text-gray-400 mb-1 text-sm">Risk Range:</div>
            <div className="text-white text-sm">
              {Math.round(adaptiveDifficulty.patchRiskRange[0] * 100)}% - {Math.round(adaptiveDifficulty.patchRiskRange[1] * 100)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-red-700">
        <div>
          <h2 className="text-xl font-bold text-red-300">Educational Feedback</h2>
          <p className="text-sm text-gray-400">
            Learn from your debugging decisions
          </p>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕ Close
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex">
          {[
            { id: 'feedback', label: 'Feedback', icon: '💬' },
            { id: 'concepts', label: 'Concepts', icon: '📚' },
            { id: 'progress', label: 'Progress', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                currentTab === tab.id
                  ? "border-red-500 text-red-300 bg-red-900/20"
                  : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentTab === 'feedback' && renderFeedbackTab()}
        {currentTab === 'concepts' && renderConceptsTab()}
        {currentTab === 'progress' && renderProgressTab()}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4 bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Continue learning by exploring more rooms and encountering different ghosts
          </div>
          
          <div className="flex space-x-2">
            {onComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onComplete}
              >
                Continue Session
              </Button>
            )}
            
            {onContinueExploring && (
              <Button
                variant="horror"
                size="sm"
                onClick={onContinueExploring}
              >
                Explore More Rooms
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}