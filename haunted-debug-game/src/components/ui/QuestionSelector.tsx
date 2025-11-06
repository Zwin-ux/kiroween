/**
 * QuestionSelector - Modal for selecting which question to ask
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';

interface QuestionSelectorProps {
  isOpen: boolean;
  questions: string[];
  onQuestionSelected: (question: string) => void;
  onCancel: () => void;
}

export function QuestionSelector({
  isOpen,
  questions,
  onQuestionSelected,
  onCancel
}: QuestionSelectorProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
  };

  const handleConfirm = () => {
    const questionToAsk = showCustomInput ? customQuestion : selectedQuestion;
    if (questionToAsk && questionToAsk.trim()) {
      onQuestionSelected(questionToAsk.trim());
      // Reset state
      setSelectedQuestion(null);
      setCustomQuestion('');
      setShowCustomInput(false);
    }
  };

  const handleCancel = () => {
    setSelectedQuestion(null);
    setCustomQuestion('');
    setShowCustomInput(false);
    onCancel();
  };

  const canConfirm = showCustomInput 
    ? customQuestion.trim().length > 0 
    : selectedQuestion !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <span className="text-2xl">❓</span>
            <span>Ask a Question</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Select a question to learn more about this patch, or write your own.
          </p>

          {/* Predefined Questions */}
          {!showCustomInput && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Suggested Questions:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {questions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedQuestion === question
                        ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">Q:</span>
                      <span className="text-sm">{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Question Input */}
          {showCustomInput && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Your Question:</h4>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:border-blue-500 focus:outline-none"
                rows={3}
                autoFocus
              />
              <p className="text-gray-400 text-xs">
                Ask anything about the patch, the problem, or debugging approaches.
              </p>
            </div>
          )}

          {/* Toggle Custom Question */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCustomInput(!showCustomInput);
                setSelectedQuestion(null);
                setCustomQuestion('');
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              {showCustomInput ? '← Back to suggested questions' : 'Ask a custom question →'}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ask Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}