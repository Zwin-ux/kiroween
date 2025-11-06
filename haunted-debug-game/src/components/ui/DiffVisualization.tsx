/**
 * DiffVisualization - Syntax-highlighted diff display with risk indicators
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface DiffVisualizationProps {
  diff: string;
  showFullDiff?: boolean;
  riskScore: number;
  className?: string;
}

interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header' | 'hunk';
  content: string;
  lineNumber?: number;
  isRisky?: boolean;
}

export function DiffVisualization({
  diff,
  showFullDiff = false,
  riskScore,
  className
}: DiffVisualizationProps) {
  const parsedDiff = useMemo(() => {
    return parseDiffContent(diff, riskScore);
  }, [diff, riskScore]);

  const displayLines = showFullDiff ? parsedDiff : parsedDiff.slice(0, 20);
  const hasMoreLines = parsedDiff.length > 20;

  return (
    <div className={cn(
      "bg-black rounded-lg border border-gray-700 overflow-hidden",
      "font-mono text-sm",
      className
    )}>
      {/* Diff Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-red-300 font-medium">Code Diff</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {parsedDiff.filter(l => l.type === 'addition').length} additions,{' '}
              {parsedDiff.filter(l => l.type === 'deletion').length} deletions
            </span>
            {riskScore > 0.7 && (
              <span className="text-xs bg-red-900 text-red-100 px-2 py-1 rounded">
                High Risk Changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="max-h-96 overflow-y-auto">
        {displayLines.map((line, index) => (
          <DiffLine key={index} line={line} />
        ))}
        
        {!showFullDiff && hasMoreLines && (
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
            <span className="text-gray-400 text-xs">
              ... {parsedDiff.length - 20} more lines
            </span>
          </div>
        )}
      </div>

      {/* Risk Warnings */}
      {riskScore > 0.6 && (
        <div className="bg-red-900/20 border-t border-red-800 px-4 py-3">
          <div className="flex items-start space-x-2">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <div>
              <p className="text-red-200 font-medium text-sm">Risk Warning</p>
              <p className="text-red-300 text-xs mt-1">
                {getRiskWarningMessage(riskScore)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DiffLineProps {
  line: DiffLine;
}

function DiffLine({ line }: DiffLineProps) {
  const getLineStyles = () => {
    const baseStyles = "px-4 py-1 leading-relaxed";
    
    switch (line.type) {
      case 'header':
        return cn(baseStyles, "bg-gray-800 text-gray-300 font-bold");
      case 'hunk':
        return cn(baseStyles, "bg-blue-900/30 text-blue-200");
      case 'addition':
        return cn(
          baseStyles,
          "bg-green-900/30 text-green-100",
          line.isRisky && "bg-red-900/30 text-red-100 border-l-2 border-red-500"
        );
      case 'deletion':
        return cn(baseStyles, "bg-red-900/30 text-red-200");
      case 'context':
      default:
        return cn(baseStyles, "text-gray-300");
    }
  };

  const getLinePrefix = () => {
    switch (line.type) {
      case 'addition':
        return <span className="text-green-400 mr-2">+</span>;
      case 'deletion':
        return <span className="text-red-400 mr-2">-</span>;
      case 'context':
        return <span className="text-gray-500 mr-2"> </span>;
      default:
        return null;
    }
  };

  return (
    <div className={getLineStyles()}>
      <div className="flex items-start">
        {line.lineNumber && (
          <span className="text-gray-500 text-xs mr-4 w-8 text-right select-none">
            {line.lineNumber}
          </span>
        )}
        {getLinePrefix()}
        <span className="flex-1">
          <SyntaxHighlight content={line.content} type={line.type} />
        </span>
        {line.isRisky && (
          <span className="text-red-400 ml-2 text-xs">⚠️</span>
        )}
      </div>
    </div>
  );
}

interface SyntaxHighlightProps {
  content: string;
  type: DiffLine['type'];
}

function SyntaxHighlight({ content, type }: SyntaxHighlightProps) {
  // Simple syntax highlighting for common patterns
  const highlightedContent = useMemo(() => {
    if (type === 'header' || type === 'hunk') {
      return content;
    }

    return content
      // Comments
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-400">$1</span>')
      // Strings
      .replace(/(".*?")/g, '<span class="text-yellow-300">$1</span>')
      .replace(/('.*?')/g, '<span class="text-yellow-300">$1</span>')
      // Keywords
      .replace(/\b(function|const|let|var|if|else|return|import|export|class|interface|type)\b/g, 
        '<span class="text-purple-300">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="text-blue-300">$1</span>')
      // Dangerous patterns (highlighted in red)
      .replace(/\b(eval|Function|innerHTML|document\.write)\b/g, 
        '<span class="text-red-400 font-bold">$1</span>');
  }, [content, type]);

  return (
    <span 
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
      className="whitespace-pre-wrap"
    />
  );
}

function parseDiffContent(diff: string, riskScore: number): DiffLine[] {
  const lines = diff.split('\n');
  const parsedLines: DiffLine[] = [];
  let currentLineNumber = 1;

  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) {
      parsedLines.push({
        type: 'header',
        content: line
      });
    } else if (line.startsWith('@@')) {
      parsedLines.push({
        type: 'hunk',
        content: line
      });
      // Extract line number from hunk header
      const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
      if (match) {
        currentLineNumber = parseInt(match[1], 10);
      }
    } else if (line.startsWith('+')) {
      const content = line.substring(1);
      const isRisky = riskScore > 0.6 && containsRiskyPatterns(content);
      
      parsedLines.push({
        type: 'addition',
        content,
        lineNumber: currentLineNumber,
        isRisky
      });
      currentLineNumber++;
    } else if (line.startsWith('-')) {
      parsedLines.push({
        type: 'deletion',
        content: line.substring(1),
        lineNumber: currentLineNumber
      });
    } else if (line.startsWith(' ')) {
      parsedLines.push({
        type: 'context',
        content: line.substring(1),
        lineNumber: currentLineNumber
      });
      currentLineNumber++;
    } else if (line.trim()) {
      parsedLines.push({
        type: 'context',
        content: line,
        lineNumber: currentLineNumber
      });
      currentLineNumber++;
    }
  }

  return parsedLines;
}

function containsRiskyPatterns(content: string): boolean {
  const riskyPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /innerHTML/,
    /document\.write/,
    /while\s*\(\s*true\s*\)/,
    /for\s*\(\s*;\s*;\s*\)/,
    /process\./,
    /require\s*\(/,
    /import\s*\(/
  ];

  return riskyPatterns.some(pattern => pattern.test(content));
}

function getRiskWarningMessage(riskScore: number): string {
  if (riskScore > 0.8) {
    return "This patch contains high-risk changes that could cause system instability or security issues.";
  } else if (riskScore > 0.6) {
    return "This patch has moderate risk and should be reviewed carefully before application.";
  } else {
    return "This patch has some risk factors that should be considered.";
  }
}