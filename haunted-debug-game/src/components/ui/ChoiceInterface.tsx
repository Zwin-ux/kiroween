/**
 * ChoiceInterface - Main component for presenting Apply/Refactor/Question choices
 */

'use client';

import { useState } from 'react';
import { Button } from './button';
import { ConfirmationDialog } from './ConfirmationDialog';
import { QuestionSelector } from './QuestionSelector';
import { ChoiceDescription } from './ChoiceDescription';
import { OutcomePrediction } from './OutcomePrediction';
import type { 
  PlayerChoiceOptions, 
  PlayerChoice, 
  ChoiceValidation,
  ConsequencePrediction 
} from '../../types/playerChoice';
import type { GeneratedPatch } from '../../engine/PatchGenerationSystem';

interface ChoiceInterfaceProps {
  patch: GeneratedPatch;
  choiceOptions: PlayerChoiceOptions;
  prediction: ConsequencePrediction;
  onChoiceSelected: (choice: PlayerChoice) => void;
  onValidationRequired: (choice: PlayerChoice) => Promise<ChoiceValidation>;
  disabled?: boolean;
}

export function ChoiceInterface({
  patch,
  choiceOptions,
  prediction,
  onChoiceSelected,
  onValidationRequired,
  disabled = false
}: ChoiceInterfaceProps) {
  const [selectedChoice, setSelectedChoice] = useState<'apply' | 'refactor' | 'question' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [pendingChoice, setPendingChoice] = useState<PlayerChoice | null>(null);

  const handleChoiceClick = async (choiceType: 'apply' | 'refactor' | 'question') => {
    if (disabled) return;

    setSelectedChoice(choiceType);

    const choice: PlayerChoice = {
      type: choiceType,
      patchId: patch.id,
      timestamp: new Date()
    };

    // For question choice, show question selector
    if (choiceType === 'question') {
      setShowQuestionSelector(true);
      return;
    }

    // Validate the choice
    const validation = await onValidationRequired(choice);

    if (!validation.valid) {
      // Handle validation errors
      console.warn('Choice validation failed:', validation.warnings);
      return;
    }

    if (validation.confirmationRequired) {
      setConfirmationMessage(validation.confirmationMessage || 'Are you sure you want to proceed?');
      setPendingChoice(choice);
      setShowConfirmation(true);
    } else {
      onChoiceSelected(choice);
    }
  };

  const handleConfirmation = (confirmed: boolean) => {
    setShowConfirmation(false);
    
    if (confirmed && pendingChoice) {
      onChoiceSelected(pendingChoice);
    }
    
    setPendingChoice(null);
    setSelectedChoice(null);
  };

  const handleQuestionSelected = async (question: string) => {
    setShowQuestionSelector(false);
    
    const choice: PlayerChoice = {
      type: 'question',
      patchId: patch.id,
      timestamp: new Date(),
      questionAsked: question
    };

    const validation = await onValidationRequired(choice);
    
    if (validation.valid) {
      onChoiceSelected(choice);
    }
    
    setSelectedChoice(null);
  };

  const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getChoiceButtonVariant = (choiceType: 'apply' | 'refactor' | 'question') => {
    if (selectedChoice === choiceType) return 'default';
    return 'outline';
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Choose Your Approach
        </h3>
        <p className="text-gray-400 text-sm">
          How would you like to proceed with this patch?
        </p>
      </div>

      {/* Outcome Prediction */}
      <OutcomePrediction prediction={prediction} />

      {/* Choice Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Apply Choice */}
        <div className="space-y-3">
          <Button
            variant={getChoiceButtonVariant('apply')}
            size="lg"
            className="w-full h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => handleChoiceClick('apply')}
            disabled={disabled}
          >
            <div className="text-lg font-semibold">
              {choiceOptions.apply.label}
            </div>
            <div className={`text-sm ${getRiskLevelColor(choiceOptions.apply.riskLevel)}`}>
              {choiceOptions.apply.riskLevel.toUpperCase()} RISK
            </div>
          </Button>
          
          <ChoiceDescription
            title="Apply Patch"
            description={choiceOptions.apply.description}
            outcome={choiceOptions.apply.expectedOutcome}
            isSelected={selectedChoice === 'apply'}
          />
        </div>

        {/* Refactor Choice */}
        <div className="space-y-3">
          <Button
            variant={getChoiceButtonVariant('refactor')}
            size="lg"
            className="w-full h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => handleChoiceClick('refactor')}
            disabled={disabled}
          >
            <div className="text-lg font-semibold">
              {choiceOptions.refactor.label}
            </div>
            <div className="text-sm text-blue-400">
              ALTERNATIVE
            </div>
          </Button>
          
          <ChoiceDescription
            title="Refactor Alternative"
            description={choiceOptions.refactor.description}
            outcome={choiceOptions.refactor.alternativeApproach}
            tradeoffs={choiceOptions.refactor.tradeoffs}
            isSelected={selectedChoice === 'refactor'}
          />
        </div>

        {/* Question Choice */}
        <div className="space-y-3">
          <Button
            variant={getChoiceButtonVariant('question')}
            size="lg"
            className="w-full h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => handleChoiceClick('question')}
            disabled={disabled}
          >
            <div className="text-lg font-semibold">
              {choiceOptions.question.label}
            </div>
            <div className="text-sm text-purple-400">
              LEARN MORE
            </div>
          </Button>
          
          <ChoiceDescription
            title="Ask Questions"
            description={choiceOptions.question.description}
            outcome={choiceOptions.question.educationalValue}
            isSelected={selectedChoice === 'question'}
          />
        </div>
      </div>

      {/* Risk Warning for High-Risk Patches */}
      {choiceOptions.apply.riskLevel === 'high' && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-semibold">High Risk Warning</span>
          </div>
          <p className="text-red-300 text-sm mt-2">
            This patch has a high risk of causing system instability. Consider asking questions 
            or exploring alternatives before applying.
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirm Action"
        message={confirmationMessage}
        onConfirm={() => handleConfirmation(true)}
        onCancel={() => handleConfirmation(false)}
        confirmText="Proceed"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Question Selector */}
      <QuestionSelector
        isOpen={showQuestionSelector}
        questions={choiceOptions.question.availableQuestions}
        onQuestionSelected={handleQuestionSelected}
        onCancel={() => {
          setShowQuestionSelector(false);
          setSelectedChoice(null);
        }}
      />
    </div>
  );
}