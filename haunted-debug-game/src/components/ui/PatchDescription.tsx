/**
 * PatchDescription - Detailed patch explanation and technical information
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { GeneratedPatch } from '../../engine/PatchGenerationSystem';

export interface PatchDescriptionProps {
  patch: GeneratedPatch;
  showTechnicalDetails?: boolean;
  className?: string;
}

export function PatchDescription({
  patch,
  showTechnicalDetails = false,
  className
}: PatchDescriptionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Description */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-red-100 mb-3">
          What This Patch Does
        </h4>
        <p className="text-red-200 leading-relaxed">
          {patch.explanation}
        </p>
      </div>

      {/* Expected Effects */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-red-100 mb-3">
          Expected Effects
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EffectIndicator
            label="Stability Impact"
            value={patch.expectedEffects.stability}
            type="stability"
            description="Effect on system stability"
          />
          <EffectIndicator
            label="Insight Gained"
            value={patch.expectedEffects.insight}
            type="insight"
            description="Learning and understanding gained"
          />
        </div>
        <p className="text-red-300 text-sm mt-3 italic">
          {patch.expectedEffects.description}
        </p>
      </div>

      {showTechnicalDetails && (
        <>
          {/* Technical Details */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-100 mb-3">
              Technical Details
            </h4>
            <div className="space-y-3">
              <DetailRow
                label="Complexity"
                value={patch.complexity}
                description={getComplexityDescription(patch.complexity)}
              />
              <DetailRow
                label="Impact Scope"
                value={patch.impact.replace('_', ' ')}
                description={getImpactDescription(patch.impact)}
              />
              <DetailRow
                label="Risk Score"
                value={`${Math.round(patch.riskScore * 100)}%`}
                description={getRiskDescription(patch.riskScore)}
              />
            </div>
          </div>

          {/* Implementation Considerations */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-red-100 mb-3">
              Implementation Considerations
            </h4>
            <div className="space-y-3">
              {getImplementationConsiderations(patch).map((consideration, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-blue-400 mt-1">{consideration.icon}</span>
                  <div>
                    <p className="text-red-100 font-medium text-sm">
                      {consideration.title}
                    </p>
                    <p className="text-red-300 text-sm">
                      {consideration.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Side Effects */}
          {patch.riskScore > 0.5 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-100 mb-3">
                ⚠️ Potential Side Effects
              </h4>
              <div className="space-y-2">
                {getPotentialSideEffects(patch).map((effect, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-red-400 mt-1">•</span>
                    <p className="text-red-200 text-sm">{effect}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Alternatives Preview */}
      {patch.alternatives && patch.alternatives.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-red-100 mb-3">
            Alternative Approaches Available
          </h4>
          <p className="text-red-300 text-sm mb-3">
            Consider these alternative solutions that might offer different trade-offs:
          </p>
          <div className="space-y-2">
            {patch.alternatives.slice(0, 3).map((alt, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-yellow-400 mt-1">→</span>
                <p className="text-red-200 text-sm">{alt}</p>
              </div>
            ))}
          </div>
          {patch.alternatives.length > 3 && (
            <p className="text-gray-400 text-xs mt-2">
              +{patch.alternatives.length - 3} more alternatives available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface EffectIndicatorProps {
  label: string;
  value: number;
  type: 'stability' | 'insight';
  description: string;
}

function EffectIndicator({ label, value, type, description }: EffectIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  const colorClass = isPositive 
    ? type === 'stability' ? 'text-green-400' : 'text-blue-400'
    : isNegative 
    ? 'text-red-400' 
    : 'text-gray-400';

  const icon = isPositive ? '↗️' : isNegative ? '↘️' : '→';

  return (
    <div className="bg-gray-700 rounded p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-red-200 text-sm font-medium">{label}</span>
        <div className="flex items-center space-x-1">
          <span>{icon}</span>
          <span className={cn("font-bold", colorClass)}>
            {value > 0 ? '+' : ''}{value}
          </span>
        </div>
      </div>
      <p className="text-gray-400 text-xs">{description}</p>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  description: string;
}

function DetailRow({ label, value, description }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-red-200 text-sm font-medium">{label}</p>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
      <span className="text-red-100 text-sm font-mono capitalize ml-4">
        {value}
      </span>
    </div>
  );
}

function getComplexityDescription(complexity: string): string {
  const descriptions = {
    simple: "Straightforward changes with minimal side effects",
    moderate: "Standard complexity requiring careful consideration",
    complex: "Advanced changes affecting multiple components",
    advanced: "Sophisticated modifications requiring expert knowledge"
  };
  return descriptions[complexity as keyof typeof descriptions] || "Unknown complexity level";
}

function getImpactDescription(impact: string): string {
  const descriptions = {
    minimal: "Changes affect only the immediate code area",
    localized: "Impact limited to the current module or component",
    moderate: "Changes may affect related systems or dependencies",
    significant: "Wide-reaching effects across multiple system areas",
    system_wide: "Fundamental changes affecting the entire system"
  };
  return descriptions[impact as keyof typeof descriptions] || "Unknown impact scope";
}

function getRiskDescription(riskScore: number): string {
  if (riskScore < 0.3) return "Low risk with minimal chance of issues";
  if (riskScore < 0.6) return "Moderate risk requiring standard precautions";
  if (riskScore < 0.8) return "High risk needing careful review and testing";
  return "Critical risk requiring extensive validation";
}

function getImplementationConsiderations(patch: GeneratedPatch) {
  const considerations = [];

  // Always include testing consideration
  considerations.push({
    icon: "🧪",
    title: "Testing Requirements",
    description: `${patch.complexity === 'simple' ? 'Basic' : patch.complexity === 'advanced' ? 'Comprehensive' : 'Standard'} testing recommended before deployment`
  });

  // Risk-based considerations
  if (patch.riskScore > 0.6) {
    considerations.push({
      icon: "🔍",
      title: "Code Review",
      description: "Peer review strongly recommended due to elevated risk level"
    });
  }

  // Complexity-based considerations
  if (patch.complexity === 'advanced' || patch.complexity === 'complex') {
    considerations.push({
      icon: "📚",
      title: "Documentation",
      description: "Update documentation to reflect architectural changes"
    });
  }

  // Impact-based considerations
  if (patch.impact === 'significant' || patch.impact === 'system_wide') {
    considerations.push({
      icon: "🚀",
      title: "Deployment Strategy",
      description: "Consider gradual rollout or feature flags for large-scale changes"
    });
  }

  return considerations;
}

function getPotentialSideEffects(patch: GeneratedPatch): string[] {
  const effects = [];

  if (patch.riskScore > 0.7) {
    effects.push("May cause unexpected behavior in dependent systems");
    effects.push("Could impact system performance under high load");
  }

  if (patch.complexity === 'advanced') {
    effects.push("Increased maintenance complexity for future developers");
    effects.push("May require additional monitoring and alerting");
  }

  if (patch.impact === 'system_wide') {
    effects.push("Changes may affect other teams or services");
    effects.push("Rollback procedures should be prepared in advance");
  }

  if (patch.riskScore > 0.8) {
    effects.push("Potential for cascading failures in connected systems");
  }

  return effects.length > 0 ? effects : ["No significant side effects anticipated"];
}