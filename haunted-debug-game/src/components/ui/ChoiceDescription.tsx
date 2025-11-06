/**
 * ChoiceDescription - Displays detailed information about a choice option
 */

'use client';

interface ChoiceDescriptionProps {
  title: string;
  description: string;
  outcome: string;
  tradeoffs?: string[];
  isSelected?: boolean;
}

export function ChoiceDescription({
  title,
  description,
  outcome,
  tradeoffs,
  isSelected = false
}: ChoiceDescriptionProps) {
  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 bg-blue-900/10' 
        : 'border-gray-700 bg-gray-800/50'
    }`}>
      <div className="space-y-2">
        <h4 className="font-medium text-white text-sm">
          {title}
        </h4>
        
        <p className="text-gray-300 text-xs leading-relaxed">
          {description}
        </p>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Expected outcome:</div>
          <div className="text-xs text-gray-200 bg-gray-900/50 p-2 rounded">
            {outcome}
          </div>
        </div>

        {tradeoffs && tradeoffs.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-400">Trade-offs:</div>
            <ul className="text-xs text-gray-300 space-y-1">
              {tradeoffs.map((tradeoff, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>{tradeoff}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}