/**
 * IndustrialUI - Cartoon-industrial UI components with warm metals and glowing terminals
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Re-export enhanced terminal components
export { 
  EnhancedTerminal, 
  TerminalCommandLine, 
  TerminalStatusBar, 
  useTerminalState 
} from './EnhancedTerminal';

// Terminal Panel Component
interface TerminalPanelProps {
  children: ReactNode;
  title?: string;
  glowColor?: string;
  className?: string;
  isActive?: boolean;
}

export function TerminalPanel({ 
  children, 
  title, 
  glowColor = 'var(--metal-copper)', 
  className,
  isActive = false 
}: TerminalPanelProps) {
  return (
    <div 
      className={cn(
        "terminal relative",
        isActive && "glow-medium",
        className
      )}
      style={{
        '--panel-glow': glowColor,
        boxShadow: isActive ? `0 0 30px ${glowColor}40` : undefined
      } as React.CSSProperties}
    >
      {title && (
        <div className="absolute -top-3 left-4 px-2 bg-black border border-current rounded text-sm font-mono">
          {title}
        </div>
      )}
      <div className="terminal-content">
        {children}
      </div>
    </div>
  );
}

// Industrial Button Component
interface IndustrialButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  glowOnHover?: boolean;
}

export function IndustrialButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  glowOnHover = true
}: IndustrialButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-br from-copper to-bronze text-white',
    secondary: 'bg-gradient-to-br from-steel to-iron text-gray-200',
    danger: 'bg-gradient-to-br from-red-600 to-red-800 text-white',
    success: 'bg-gradient-to-br from-green-600 to-green-800 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        "interactive font-mono font-semibold rounded-lg transition-all duration-300",
        "border border-current/20 shadow-lg",
        "hover:shadow-xl hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-md",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
        variants[variant],
        sizes[size],
        glowOnHover && "hover:glow-medium",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Progress Ring Component
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 4,
  color = 'var(--light-stability)',
  backgroundColor = 'rgba(168, 92, 49, 0.2)',
  label,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("progress-ring relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`
          }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-mono font-bold" style={{ color }}>
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

// Meter Display Component
interface MeterDisplayProps {
  label: string;
  value: number;
  maxValue?: number;
  unit?: string;
  color?: string;
  warningThreshold?: number;
  dangerThreshold?: number;
  className?: string;
}

export function MeterDisplay({
  label,
  value,
  maxValue = 100,
  unit = '',
  color,
  warningThreshold = 30,
  dangerThreshold = 10,
  className
}: MeterDisplayProps) {
  const percentage = (value / maxValue) * 100;
  
  // Determine color based on thresholds
  const meterColor = color || (
    value <= dangerThreshold ? 'var(--light-error)' :
    value <= warningThreshold ? 'var(--light-compile)' :
    'var(--light-stability)'
  );

  const statusClass = 
    value <= dangerThreshold ? 'stability-error' :
    value <= warningThreshold ? 'stability-warning' :
    'stability-stable';

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-mono text-gray-300">{label}</span>
        <span className={cn("text-sm font-mono font-bold", statusClass)}>
          {value}{unit}
        </span>
      </div>
      
      <div className="relative h-3 bg-black/50 rounded-full overflow-hidden border border-gray-600">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${meterColor}, ${meterColor}80)`,
            boxShadow: `0 0 10px ${meterColor}40`
          }}
        />
        
        {/* Threshold indicators */}
        {warningThreshold && (
          <div
            className="absolute top-0 w-0.5 h-full bg-yellow-400/60"
            style={{ left: `${(warningThreshold / maxValue) * 100}%` }}
          />
        )}
        {dangerThreshold && (
          <div
            className="absolute top-0 w-0.5 h-full bg-red-400/60"
            style={{ left: `${(dangerThreshold / maxValue) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

// Code Rune Component
interface CodeRuneProps {
  type: 'bracket' | 'arrow' | 'slash' | 'semicolon' | 'equals';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  animated?: boolean;
  className?: string;
}

export function CodeRune({ 
  type, 
  size = 'md', 
  color = 'var(--code-success)', 
  animated = false,
  className 
}: CodeRuneProps) {
  const symbols = {
    bracket: '{}',
    arrow: '=>',
    slash: '/',
    semicolon: ';',
    equals: '='
  };

  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <span
      className={cn(
        "rune font-mono font-bold inline-block",
        sizes[size],
        animated && "animate-pulse",
        className
      )}
      style={{ 
        color,
        textShadow: `0 0 8px ${color}40`
      }}
    >
      {symbols[type]}
    </span>
  );
}

// Industrial Card Component
interface IndustrialCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  glowColor?: string;
  metalFinish?: 'copper' | 'bronze' | 'brass' | 'steel' | 'iron';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function IndustrialCard({
  children,
  title,
  subtitle,
  glowColor = 'var(--metal-copper)',
  metalFinish = 'copper',
  className,
  interactive = false,
  onClick
}: IndustrialCardProps) {
  const finishes = {
    copper: 'border-copper bg-gradient-to-br from-copper/10 to-bronze/5',
    bronze: 'border-bronze bg-gradient-to-br from-bronze/10 to-copper/5',
    brass: 'border-brass bg-gradient-to-br from-brass/10 to-bronze/5',
    steel: 'border-steel bg-gradient-to-br from-steel/10 to-iron/5',
    iron: 'border-iron bg-gradient-to-br from-iron/10 to-steel/5'
  };

  return (
    <div
      className={cn(
        "ui-panel border-2 rounded-xl p-4 transition-all duration-300",
        finishes[metalFinish],
        interactive && "cursor-pointer hover:glow-medium hover:-translate-y-1",
        className
      )}
      style={{
        '--card-glow': glowColor
      } as React.CSSProperties}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="mb-3 border-b border-current/20 pb-2">
          {title && (
            <h3 className="font-mono font-bold text-lg text-glow">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="font-mono text-sm text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Status Indicator Component
interface StatusIndicatorProps {
  status: 'stable' | 'warning' | 'error' | 'critical';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  size = 'md',
  animated = true,
  className
}: StatusIndicatorProps) {
  const statusConfig = {
    stable: {
      color: 'var(--light-stability)',
      class: 'stability-stable',
      symbol: '●'
    },
    warning: {
      color: 'var(--light-compile)',
      class: 'stability-warning',
      symbol: '▲'
    },
    error: {
      color: 'var(--light-error)',
      class: 'stability-error',
      symbol: '■'
    },
    critical: {
      color: '#ffffff',
      class: 'stability-critical',
      symbol: '⚠'
    }
  };

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-mono",
          sizes[size],
          config.class,
          animated && "animate-pulse"
        )}
        style={{ color: config.color }}
      >
        {config.symbol}
      </span>
      {label && (
        <span className={cn("font-mono", sizes[size], config.class)}>
          {label}
        </span>
      )}
    </div>
  );
}

// Industrial Input Component
interface IndustrialInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  disabled?: boolean;
  className?: string;
}

export function IndustrialInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className
}: IndustrialInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full px-4 py-2 font-mono",
        "bg-black/50 border-2 border-copper rounded-lg",
        "text-success placeholder-gray-500",
        "focus:outline-none focus:border-success focus:glow-soft",
        "transition-all duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}

// Compile Event Indicator
interface CompileEventProps {
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp?: Date;
  className?: string;
}

export function CompileEvent({
  type,
  message,
  timestamp,
  className
}: CompileEventProps) {
  const typeConfig = {
    success: {
      color: 'var(--light-stability)',
      icon: '✓',
      class: 'stability-stable'
    },
    warning: {
      color: 'var(--light-compile)',
      icon: '⚠',
      class: 'stability-warning'
    },
    error: {
      color: 'var(--light-error)',
      icon: '✗',
      class: 'stability-error'
    }
  };

  const config = typeConfig[type];

  return (
    <div className={cn("compile-event flex items-start gap-3 p-3 rounded-lg bg-black/30", className)}>
      <span className={cn("text-lg font-mono", config.class)}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-gray-200 break-words">
          {message}
        </p>
        {timestamp && (
          <p className="font-mono text-xs text-gray-500 mt-1">
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}