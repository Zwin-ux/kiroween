/**
 * AssetProgress Component - Enhanced progress bar with integrated icon assets
 * 
 * Extends the base Progress component to include icon assets for visual feedback
 * and status indicators based on meter values and thresholds.
 */

import * as React from "react";
import { Progress } from "./progress";
import { IconAsset } from "./GameAsset";
import { cn } from "@/lib/utils";

/**
 * Props interface for the AssetProgress component
 */
export interface AssetProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Progress variant for styling */
  variant?: 'stability' | 'insight' | 'default';
  /** Icon to display next to the progress bar */
  icon?: string;
  /** Label text for the progress bar */
  label?: string;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Whether to show status icons based on thresholds */
  showStatusIcon?: boolean;
  /** Custom thresholds for status indicators */
  thresholds?: {
    critical?: number;
    warning?: number;
    good?: number;
  };
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Default thresholds for different meter types
 */
const DEFAULT_THRESHOLDS = {
  stability: { critical: 30, warning: 60, good: 80 },
  insight: { critical: 20, warning: 50, good: 75 },
  default: { critical: 25, warning: 50, good: 75 },
};

/**
 * AssetProgress component with integrated icon assets and status indicators
 */
export const AssetProgress: React.FC<AssetProgressProps> = ({
  value,
  variant = 'default',
  icon,
  label,
  showValue = true,
  showStatusIcon = true,
  thresholds,
  className,
  size = 'md',
}) => {
  // Get thresholds for the variant
  const activeThresholds = thresholds || DEFAULT_THRESHOLDS[variant];
  
  // Determine status based on value and thresholds
  const getStatus = () => {
    if (activeThresholds.critical !== undefined && value <= activeThresholds.critical) return 'critical';
    if (activeThresholds.warning !== undefined && value <= activeThresholds.warning) return 'warning';
    if (activeThresholds.good !== undefined && value >= activeThresholds.good) return 'good';
    return 'normal';
  };

  const status = getStatus();

  // Get status icon based on current status
  const getStatusIcon = () => {
    switch (status) {
      case 'critical':
        return 'asset'; // Use asset icon for critical status
      case 'warning':
        return 'asset'; // Use asset icon for warning status
      case 'good':
        return 'ghost'; // Use ghost icon for good status
      default:
        return icon || 'asset';
    }
  };

  // Get status color classes
  const getStatusClasses = () => {
    switch (status) {
      case 'critical':
        return 'text-red-400 animate-pulse';
      case 'warning':
        return 'text-yellow-400';
      case 'good':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  // Size classes
  const sizeClasses = {
    sm: { progress: 'h-2', icon: 'sm' as const, text: 'text-xs' },
    md: { progress: 'h-4', icon: 'md' as const, text: 'text-sm' },
    lg: { progress: 'h-6', icon: 'lg' as const, text: 'text-base' },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with label, icon, and value */}
      {(label || showValue || icon || showStatusIcon) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Main icon */}
            {icon && (
              <IconAsset
                iconName={icon}
                size={sizeConfig.icon}
                className="opacity-75"
              />
            )}
            
            {/* Label */}
            {label && (
              <span className={cn("font-medium text-gray-300", sizeConfig.text)}>
                {label}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Numeric value */}
            {showValue && (
              <span className={cn("font-mono", sizeConfig.text, getStatusClasses())}>
                {value}/100
              </span>
            )}
            
            {/* Status icon */}
            {showStatusIcon && (
              <IconAsset
                iconName={getStatusIcon()}
                size={sizeConfig.icon}
                className={cn("transition-all duration-300", getStatusClasses())}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Progress bar */}
      <Progress
        value={value}
        variant={variant}
        className={cn(sizeConfig.progress, "relative")}
      />
      
      {/* Status indicator bar */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Critical</span>
        <span>Warning</span>
        <span>Good</span>
      </div>
    </div>
  );
};

/**
 * Specialized progress components for different meter types
 */

export const StabilityProgress: React.FC<Omit<AssetProgressProps, 'variant'>> = (props) => (
  <AssetProgress
    variant="stability"
    icon="asset"
    label="Stability"
    {...props}
  />
);

export const InsightProgress: React.FC<Omit<AssetProgressProps, 'variant'>> = (props) => (
  <AssetProgress
    variant="insight"
    icon="ghost"
    label="Insight"
    {...props}
  />
);

/**
 * Meter group component for displaying multiple progress bars
 */
export interface MeterGroupProps {
  meters: Array<{
    label: string;
    value: number;
    variant?: 'stability' | 'insight' | 'default';
    icon?: string;
  }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MeterGroup: React.FC<MeterGroupProps> = ({
  meters,
  className,
  size = 'md',
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {meters.map((meter, index) => (
        <AssetProgress
          key={`${meter.label}-${index}`}
          value={meter.value}
          variant={meter.variant}
          label={meter.label}
          icon={meter.icon}
          size={size}
        />
      ))}
    </div>
  );
};