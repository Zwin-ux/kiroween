/**
 * RiskIndicator - Visual risk assessment display with color coding and warnings
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { PatchComplexity, PatchImpact } from '../../engine/PatchGenerationSystem';

export interface RiskIndicatorProps {
  riskScore: number; // 0.0 to 1.0
  complexity: PatchComplexity;
  impact: PatchImpact;
  showDetails?: boolean;
  className?: string;
}

export function RiskIndicator({
  riskScore,
  complexity,
  impact,
  showDetails = true,
  className
}: RiskIndicatorProps) {
  const riskLevel = getRiskLevel(riskScore);
  const riskColor = getRiskColor(riskLevel);
  const riskIcon = getRiskIcon(riskLevel);

  return (
    <div className={cn(
      "bg-gray-800 border rounded-lg p-4 min-w-48",
      `border-${riskColor}-600`,
      className
    )}>
      {/* Main Risk Score */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">Risk Assessment</span>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{riskIcon}</span>
          <span className={cn(
            "text-lg font-bold",
            `text-${riskColor}-400`
          )}>
            {Math.round(riskScore * 100)}%
          </span>
        </div>
      </div>

      {/* Risk Level Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Risk Level</span>
          <span className={cn(
            "font-medium capitalize",
            `text-${riskColor}-400`
          )}>
            {riskLevel}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              `bg-${riskColor}-500`
            )}
            style={{ width: `${riskScore * 100}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <>
          {/* Complexity Indicator */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Complexity</span>
              <span className={cn(
                "font-medium capitalize",
                getComplexityColor(complexity)
              )}>
                {complexity}
              </span>
            </div>
          </div>

          {/* Impact Indicator */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Impact</span>
              <span className={cn(
                "font-medium capitalize",
                getImpactColor(impact)
              )}>
                {impact.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-1">
            <RiskFactor
              label="Security"
              level={getSecurityRisk(riskScore)}
              icon="🔒"
            />
            <RiskFactor
              label="Stability"
              level={getStabilityRisk(riskScore, complexity)}
              icon="⚖️"
            />
            <RiskFactor
              label="Maintainability"
              level={getMaintainabilityRisk(complexity, impact)}
              icon="🔧"
            />
          </div>

          {/* Warning Messages */}
          {riskScore > 0.7 && (
            <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded text-xs">
              <div className="flex items-start space-x-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-red-200">
                  High risk patch - consider alternative approaches
                </span>
              </div>
            </div>
          )}

          {complexity === 'advanced' && (
            <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-400">💡</span>
                <span className="text-yellow-200">
                  Advanced complexity - ensure thorough testing
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface RiskFactorProps {
  label: string;
  level: 'low' | 'medium' | 'high';
  icon: string;
}

function RiskFactor({ label, level, icon }: RiskFactorProps) {
  const levelColor = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400'
  }[level];

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center space-x-1">
        <span>{icon}</span>
        <span className="text-gray-400">{label}</span>
      </div>
      <span className={cn("font-medium capitalize", levelColor)}>
        {level}
      </span>
    </div>
  );
}

function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore < 0.3) return 'low';
  if (riskScore < 0.6) return 'medium';
  if (riskScore < 0.8) return 'high';
  return 'critical';
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'high':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
}

function getRiskIcon(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return '✅';
    case 'medium':
      return '⚠️';
    case 'high':
      return '🔥';
    case 'critical':
      return '💀';
    default:
      return '❓';
  }
}

function getComplexityColor(complexity: PatchComplexity): string {
  switch (complexity) {
    case 'simple':
      return 'text-green-400';
    case 'moderate':
      return 'text-yellow-400';
    case 'complex':
      return 'text-orange-400';
    case 'advanced':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function getImpactColor(impact: PatchImpact): string {
  switch (impact) {
    case 'minimal':
      return 'text-green-400';
    case 'localized':
      return 'text-blue-400';
    case 'moderate':
      return 'text-yellow-400';
    case 'significant':
      return 'text-orange-400';
    case 'system_wide':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function getSecurityRisk(riskScore: number): 'low' | 'medium' | 'high' {
  if (riskScore < 0.4) return 'low';
  if (riskScore < 0.7) return 'medium';
  return 'high';
}

function getStabilityRisk(riskScore: number, complexity: PatchComplexity): 'low' | 'medium' | 'high' {
  let risk = riskScore;
  
  // Adjust for complexity
  if (complexity === 'advanced') risk += 0.2;
  else if (complexity === 'complex') risk += 0.1;
  
  if (risk < 0.4) return 'low';
  if (risk < 0.7) return 'medium';
  return 'high';
}

function getMaintainabilityRisk(complexity: PatchComplexity, impact: PatchImpact): 'low' | 'medium' | 'high' {
  let risk = 0;
  
  // Complexity contribution
  switch (complexity) {
    case 'simple': risk += 0.1; break;
    case 'moderate': risk += 0.3; break;
    case 'complex': risk += 0.6; break;
    case 'advanced': risk += 0.8; break;
  }
  
  // Impact contribution
  switch (impact) {
    case 'minimal': risk += 0.1; break;
    case 'localized': risk += 0.2; break;
    case 'moderate': risk += 0.4; break;
    case 'significant': risk += 0.6; break;
    case 'system_wide': risk += 0.8; break;
  }
  
  if (risk < 0.4) return 'low';
  if (risk < 0.7) return 'medium';
  return 'high';
}