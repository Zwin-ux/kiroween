/**
 * SecurityEducationPanel - Displays security validation results and educational content
 */

'use client';

import React, { useState } from 'react';
import type { 
  SecurityValidationResult, 
  SecurityViolation, 
  EducationalContent,
  SecuritySeverity 
} from '@/engine/SecurityValidationSystem';

interface SecurityEducationPanelProps {
  validationResult: SecurityValidationResult;
  rejectionMessage?: string;
  onClose?: () => void;
}

export function SecurityEducationPanel({ 
  validationResult, 
  rejectionMessage, 
  onClose 
}: SecurityEducationPanelProps) {
  const [expandedViolations, setExpandedViolations] = useState<Set<string>>(new Set());
  const [expandedEducation, setExpandedEducation] = useState<Set<string>>(new Set());

  const toggleViolation = (violationId: string) => {
    const newExpanded = new Set(expandedViolations);
    if (newExpanded.has(violationId)) {
      newExpanded.delete(violationId);
    } else {
      newExpanded.add(violationId);
    }
    setExpandedViolations(newExpanded);
  };

  const toggleEducation = (title: string) => {
    const newExpanded = new Set(expandedEducation);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedEducation(newExpanded);
  };

  const getSeverityColor = (severity: SecuritySeverity): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'low':
        return '🔵';
      default:
        return '🛡️';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🛡️</span>
          <h2 className="text-lg font-semibold text-gray-900">
            Security Validation Results
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${
          validationResult.isValid 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl">
              {validationResult.isValid ? '✅' : '❌'}
            </span>
            <span className="font-medium">
              {validationResult.isValid ? 'Patch Approved' : 'Patch Rejected'}
            </span>
            <span className="text-sm">
              (Risk Score: {(validationResult.riskScore * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Rejection Message */}
        {rejectionMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: rejectionMessage.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }} />
            </div>
          </div>
        )}

        {/* Security Violations */}
        {validationResult.violations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span>Security Issues ({validationResult.violations.length})</span>
            </h3>
            
            <div className="space-y-2">
              {validationResult.violations.map((violation) => (
                <ViolationCard
                  key={violation.id}
                  violation={violation}
                  isExpanded={expandedViolations.has(violation.id)}
                  onToggle={() => toggleViolation(violation.id)}
                  getSeverityColor={getSeverityColor}
                  getSeverityIcon={getSeverityIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Operations Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allowed Operations */}
          {validationResult.allowedOperations.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Allowed Operations</h4>
              <div className="flex flex-wrap gap-1">
                {validationResult.allowedOperations.slice(0, 10).map((op, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                  >
                    {op}
                  </span>
                ))}
                {validationResult.allowedOperations.length > 10 && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    +{validationResult.allowedOperations.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Blocked Operations */}
          {validationResult.blockedOperations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Blocked Operations</h4>
              <div className="flex flex-wrap gap-1">
                {validationResult.blockedOperations.map((op, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Educational Content */}
        {validationResult.educationalContent.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <span className="text-xl">📚</span>
              <span>Learn More About Security</span>
            </h3>
            
            <div className="space-y-3">
              {validationResult.educationalContent.map((content) => (
                <EducationalContentCard
                  key={content.title}
                  content={content}
                  isExpanded={expandedEducation.has(content.title)}
                  onToggle={() => toggleEducation(content.title)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ViolationCardProps {
  violation: SecurityViolation;
  isExpanded: boolean;
  onToggle: () => void;
  getSeverityColor: (severity: SecuritySeverity) => string;
  getSeverityIcon: (severity: SecuritySeverity) => React.ReactNode;
}

function ViolationCard({ 
  violation, 
  isExpanded, 
  onToggle, 
  getSeverityColor, 
  getSeverityIcon 
}: ViolationCardProps) {
  return (
    <div className={`border rounded-lg ${getSeverityColor(violation.severity)}`}>
      <button
        onClick={onToggle}
        className="w-full p-3 text-left flex items-center justify-between hover:bg-opacity-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getSeverityIcon(violation.severity)}</span>
          <span className="font-medium">{violation.description}</span>
          <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
            {violation.severity.toUpperCase()}
          </span>
        </div>
        <span className="text-lg">
          {isExpanded ? '🔽' : '▶️'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-current border-opacity-20">
          <div>
            <h5 className="font-medium mb-1">Why this is a problem:</h5>
            <p className="text-sm">{violation.educationalExplanation}</p>
          </div>
          
          <div>
            <h5 className="font-medium mb-1">How to fix it:</h5>
            <p className="text-sm">{violation.suggestedFix}</p>
          </div>
          
          <div className="text-xs">
            <span className="font-medium">Location:</span> {violation.location}
          </div>
          
          {violation.learnMoreUrl && (
            <a
              href={violation.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm hover:underline"
            >
              <span>🔗</span>
              <span>Learn more</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface EducationalContentCardProps {
  content: EducationalContent;
  isExpanded: boolean;
  onToggle: () => void;
}

function EducationalContentCard({ content, isExpanded, onToggle }: EducationalContentCardProps) {
  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50">
      <button
        onClick={onToggle}
        className="w-full p-3 text-left flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">📖</span>
          <span className="font-medium text-blue-800">{content.title}</span>
        </div>
        <span className="text-lg text-blue-600">
          {isExpanded ? '🔽' : '▶️'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4 border-t border-blue-200">
          <p className="text-sm text-blue-800">{content.explanation}</p>
          
          {/* Code Examples */}
          {content.examples.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-medium text-blue-800">Examples:</h5>
              {content.examples.map((example, index) => (
                <div key={index} className="space-y-2">
                  <h6 className="text-sm font-medium text-blue-700">{example.title}</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs font-medium text-red-600 mb-1">❌ Unsafe:</div>
                      <pre className="text-xs bg-red-100 p-2 rounded border overflow-x-auto">
                        <code>{example.unsafe}</code>
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-green-600 mb-1">✅ Safe:</div>
                      <pre className="text-xs bg-green-100 p-2 rounded border overflow-x-auto">
                        <code>{example.safe}</code>
                      </pre>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700">{example.explanation}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Best Practices */}
          {content.bestPractices.length > 0 && (
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Best Practices:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {content.bestPractices.map((practice, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Common Mistakes */}
          {content.commonMistakes.length > 0 && (
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Common Mistakes:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {content.commonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Further Reading */}
          {content.furtherReading.length > 0 && (
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Further Reading:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {content.furtherReading.map((reading, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span>🔗</span>
                    <span>{reading}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}