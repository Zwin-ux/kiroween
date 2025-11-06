/**
 * DialogueInterface - Main conversation UI component
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { DialogueMessage } from './DialogueMessage';
import { EducationalPanel } from './EducationalPanel';
import { QuestionSuggestions } from './QuestionSuggestions';
import type { DialogueSession, DialogueMessage as IDialogueMessage, EducationalContent } from '../../types/dialogue';
import { cn } from '@/lib/utils';

interface DialogueInterfaceProps {
  session: DialogueSession;
  onSendMessage: (message: string) => Promise<void>;
  onEndDialogue: () => void;
  onStartDebugging: () => void;
  availableQuestions: string[];
  educationalContent?: EducationalContent;
  isLoading?: boolean;
  className?: string;
}

export function DialogueInterface({
  session,
  onSendMessage,
  onEndDialogue,
  onStartDebugging,
  availableQuestions,
  educationalContent,
  isLoading = false,
  className
}: DialogueInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [showEducational, setShowEducational] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add error handling UI here
    }
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-900 border border-red-700 rounded-lg overflow-hidden horror-ide",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-red-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h3 className="text-red-100 font-mono text-sm">
            Dialogue Session: {session.ghostId}
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {session.state}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {educationalContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEducational(!showEducational)}
              className="text-amber-400 hover:text-amber-300"
            >
              📚 Learn
            </Button>
          )}
          
          {session.isReadyForDebugging && (
            <Button
              variant="horror"
              size="sm"
              onClick={onStartDebugging}
              className="bg-green-800 hover:bg-green-700 text-green-100"
            >
              🔧 Start Debugging
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onEndDialogue}
            className="text-gray-400 hover:text-gray-300"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 crt-scanlines">
            {session.messages.map((message) => (
              <DialogueMessage
                key={message.id}
                message={message}
                onEducationalToggle={() => setShowEducational(true)}
              />
            ))}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">Ghost is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Question suggestions */}
          {availableQuestions.length > 0 && (
            <div className="border-t border-red-700 p-3 bg-gray-800">
              <QuestionSuggestions
                questions={availableQuestions}
                onQuestionClick={handleQuestionClick}
              />
            </div>
          )}

          {/* Input area */}
          <form onSubmit={handleSubmit} className="border-t border-red-700 p-4 bg-gray-800">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the ghost a question..."
                disabled={isLoading}
                className={cn(
                  "flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2",
                  "text-gray-100 placeholder-gray-500 font-mono text-sm",
                  "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              
              <Button
                type="submit"
                variant="horror"
                disabled={!inputValue.trim() || isLoading}
                className="px-6"
              >
                Send
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 font-mono">
              Press Enter to send • Shift+Enter for new line
            </div>
          </form>
        </div>

        {/* Educational panel */}
        {showEducational && educationalContent && (
          <div className="w-80 border-l border-red-700 bg-gray-800">
            <EducationalPanel
              content={educationalContent}
              onClose={() => setShowEducational(false)}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-red-700 px-4 py-2 bg-gray-800 text-xs text-gray-400 font-mono">
        <div className="flex justify-between items-center">
          <span>
            Messages: {session.messages.length} • 
            Topics: {session.educationalTopics.length} • 
            Progress: {Math.round(session.context.sessionProgress * 100)}%
          </span>
          
          <span>
            Insight: {session.context.currentMeterLevels.insight} • 
            Stability: {session.context.currentMeterLevels.stability}
          </span>
        </div>
      </div>
    </div>
  );
}