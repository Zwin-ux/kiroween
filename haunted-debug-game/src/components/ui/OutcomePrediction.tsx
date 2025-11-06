/**
 * OutcomePrediction - Displays predicted consequences of patch choices
 */

'use client';

import type { ConsequencePrediction } from '../../types/playerChoice';

interface OutcomePredictionProps {
  prediction: ConsequencePrediction;
}

export function OutcomePrediction({ prediction }: OutcomePredictionProps) {
  const { meterChanges, riskFactors, benefits, immediateEffects, longTermEffects } = prediction;

  const getMeterChangeColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getMeterChangeIcon = (value: number) => {
    if (value > 0) return '↗';
    if (value < 0) return '↘';
    return '→';
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
      <h4 className="text-white font-medium flex items-center space-x-2">
        <span>🔮</span>
        <span>Predicted Outcome</span>
      </h4>

      {/* Meter Changes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Stability Change</div>
          <div className={`text-sm font-medium flex items-center space-x-1 ${getMeterChangeColor(meterChanges.stability)}`}>
            <span>{getMeterChangeIcon(meterChanges.stability)}</span>
            <span>{meterChanges.stability >= 0 ? '+' : ''}{meterChanges.stability}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Insight Change</div>
          <div className={`text-sm font-medium flex items-center space-x-1 ${getMeterChangeColor(meterChanges.insight)}`}>
            <span>{getMeterChangeIcon(meterChanges.insight)}</span>
            <span>{meterChanges.insight >= 0 ? '+' : ''}{meterChanges.insight}</span>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-red-400 font-medium">⚠️ Risk Factors</div>
          <ul className="space-y-1">
            {riskFactors.map((risk, index) => (
              <li key={index} className="text-xs text-red-300 flex items-start space-x-1">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-green-400 font-medium">✅ Benefits</div>
          <ul className="space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="text-xs text-green-300 flex items-start space-x-1">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Effects Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Immediate Effects */}
        {immediateEffects.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-blue-400 font-medium">⚡ Immediate</div>
            <ul className="space-y-1">
              {immediateEffects.map((effect, index) => (
                <li key={index} className="text-xs text-blue-300 flex items-start space-x-1">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Long-term Effects */}
        {longTermEffects.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-purple-400 font-medium">🔮 Long-term</div>
            <ul className="space-y-1">
              {longTermEffects.map((effect, index) => (
                <li key={index} className="text-xs text-purple-300 flex items-start space-x-1">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}