/**
 * QuestionSuggestions - Component for displaying suggested questions during dialogue
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface QuestionSuggestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  className?: string;
}

export function QuestionSuggestions({ 
  questions, 
  onQuestionClick, 
  className 
}: QuestionSuggestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Suggested Questions
      </h4>
      
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onQuestionClick(question)}
            className={cn(
              "text-xs text-left h-auto p-2 border border-gray-600",
              "hover:border-red-500 hover:bg-red-900/20 hover:text-red-300",
              "transition-colors duration-200"
            )}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}