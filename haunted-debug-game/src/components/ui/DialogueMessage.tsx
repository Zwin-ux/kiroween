/**
 * DialogueMessage - Individual message display component
 */

import React, { useState } from 'react';
import { Button } from './button';
import type { DialogueMessage as IDialogueMessage } from '../../types/dialogue';
import { cn } from '@/lib/utils';

interface DialogueMessageProps {
  message: IDialogueMessage;
  onEducationalToggle?: () => void;
  className?: string;
}

export function DialogueMessage({ 
  message, 
  onEducationalToggle,
  className 
}: DialogueMessageProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  
  const isGhost = message.speaker === 'ghost';
  const isPlayer = message.speaker === 'player';

  const getMessageIcon = () => {
    if (isGhost) {
      switch (message.type) {
        case 'story': return '👻';
        case 'explanation': return '🔍';
        case 'hint': return '💡';
        case 'educational': return '📚';
        default: return '👻';
      }
    }
    
    switch (message.type) {
      case 'question': return '❓';
      case 'educational': return '📖';
      default: return '💬';
    }
  };

  const getMessageTypeColor = () => {
    if (isGhost) {
      switch (message.type) {
        case 'story': return 'text-red-300';
        case 'explanation': return 'text-blue-300';
        case 'hint': return 'text-yellow-300';
        case 'educational': return 'text-green-300';
        default: return 'text-red-300';
      }
    }
    
    return 'text-gray-300';
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={cn(
      "flex flex-col space-y-2",
      isGhost ? "items-start" : "items-end",
      className
    )}>
      {/* Message bubble */}
      <div className={cn(
        "max-w-[80%] rounded-lg p-3 font-mono text-sm",
        isGhost 
          ? "bg-gray-800 border border-red-700 text-red-100" 
          : "bg-blue-900 border border-blue-600 text-blue-100"
      )}>
        {/* Message header */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">{getMessageIcon()}</span>
          <span className={cn("text-xs font-bold", getMessageTypeColor())}>
            {isGhost ? 'Ghost' : 'You'} • {message.type}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Message content */}
        <div className={cn(
          "whitespace-pre-wrap leading-relaxed",
          isGhost && "glitch-text"
        )}>
          {message.content}
        </div>

        {/* Educational content indicator */}
        {message.educationalContent && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEducationalToggle}
              className="text-amber-400 hover:text-amber-300 text-xs p-1"
            >
              📚 View Educational Content
            </Button>
          </div>
        )}

        {/* Metadata toggle */}
        {message.metadata && Object.keys(message.metadata).length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-gray-500 hover:text-gray-400 text-xs p-1"
            >
              {showMetadata ? '▼' : '▶'} Debug Info
            </Button>
            
            {showMetadata && (
              <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                <pre className="text-xs text-gray-400 overflow-x-auto">
                  {JSON.stringify(message.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message effects */}
      {isGhost && message.type === 'story' && (
        <div className="text-xs text-red-500 italic font-mono animate-pulse">
          *atmospheric whispers echo through the code*
        </div>
      )}
    </div>
  );
}