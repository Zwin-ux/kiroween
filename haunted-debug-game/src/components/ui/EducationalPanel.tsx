/**
 * EducationalPanel - Panel for displaying educational content during dialogue
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import type { EducationalContent } from '@/types/dialogue';

interface EducationalPanelProps {
  content: EducationalContent;
  onClose: () => void;
  className?: string;
}

export function EducationalPanel({ content, onClose, className }: EducationalPanelProps) {
  return (
    <div className={cn("flex flex-col h-full bg-gray-800", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-red-700">
        <h3 className="text-lg font-bold text-amber-300">
          📚 {content.concept}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Explanation */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Explanation</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            {content.explanation}
          </p>
        </div>

        {/* Examples */}
        {content.examples && content.examples.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Examples</h4>
            <ul className="space-y-2">
              {content.examples.map((example, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Best Practices */}
        {content.bestPractices && content.bestPractices.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Best Practices</h4>
            <ul className="space-y-2">
              {content.bestPractices.map((practice, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start space-x-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Concepts */}
        {content.relatedConcepts && content.relatedConcepts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Related Concepts</h4>
            <div className="flex flex-wrap gap-2">
              {content.relatedConcepts.map((concept, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty and Time */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Difficulty</h4>
            <div className="text-sm text-gray-400">
              {content.difficulty ? `${content.difficulty}/10` : 'Not specified'}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-1">Est. Time</h4>
            <div className="text-sm text-gray-400">
              {content.estimatedTime ? `${content.estimatedTime} min` : 'Varies'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}