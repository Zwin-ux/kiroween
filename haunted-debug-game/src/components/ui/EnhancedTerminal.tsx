/**
 * EnhancedTerminal - Terminal component with PNG asset integration
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { assets, preloadImage } from '@/lib/assets';
import { TerminalPanel } from './IndustrialUI';

interface EnhancedTerminalProps {
  title?: string;
  children?: React.ReactNode;
  glowColor?: string;
  className?: string;
  isActive?: boolean;
  useAssetBackground?: boolean;
  variant?: 'default' | 'compact' | 'fullscreen';
  showScanlines?: boolean;
  terminalType?: 'debug' | 'compile' | 'ghost' | 'system';
}

interface TerminalTypeConfig {
  glowColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  scanlineOpacity: number;
}

const TERMINAL_TYPE_CONFIGS: Record<string, TerminalTypeConfig> = {
  debug: {
    glowColor: 'var(--light-stability)',
    backgroundColor: 'rgba(0, 20, 0, 0.9)',
    textColor: 'var(--code-success)',
    borderColor: 'var(--metal-copper)',
    scanlineOpacity: 0.3
  },
  compile: {
    glowColor: 'var(--light-compile)',
    backgroundColor: 'rgba(20, 10, 0, 0.9)',
    textColor: 'var(--light-compile)',
    borderColor: 'var(--metal-bronze)',
    scanlineOpacity: 0.4
  },
  ghost: {
    glowColor: 'var(--light-insight)',
    backgroundColor: 'rgba(10, 0, 20, 0.9)',
    textColor: 'var(--light-insight)',
    borderColor: 'var(--metal-brass)',
    scanlineOpacity: 0.5
  },
  system: {
    glowColor: 'var(--light-error)',
    backgroundColor: 'rgba(20, 0, 0, 0.9)',
    textColor: 'var(--light-error)',
    borderColor: 'var(--metal-steel)',
    scanlineOpacity: 0.2
  }
};

export function EnhancedTerminal({
  title,
  children,
  glowColor,
  className,
  isActive = false,
  useAssetBackground = true,
  variant = 'default',
  showScanlines = true,
  terminalType = 'debug'
}: EnhancedTerminalProps) {
  const [terminalAssetLoaded, setTerminalAssetLoaded] = useState(false);
  const [terminalAssetError, setTerminalAssetError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const typeConfig = TERMINAL_TYPE_CONFIGS[terminalType];
  const effectiveGlowColor = glowColor || typeConfig.glowColor;

  useEffect(() => {
    if (useAssetBackground && !terminalAssetLoaded && !terminalAssetError && !isLoading) {
      setIsLoading(true);
      
      preloadImage(assets.entities.terminal)
        .then(() => {
          setTerminalAssetLoaded(true);
          setIsLoading(false);
        })
        .catch((error) => {
          console.warn('Failed to load terminal asset:', error);
          setTerminalAssetError(true);
          setIsLoading(false);
        });
    }
  }, [useAssetBackground, terminalAssetLoaded, terminalAssetError, isLoading]);

  const variantClasses = {
    default: 'min-h-[200px] max-h-[400px]',
    compact: 'min-h-[120px] max-h-[200px]',
    fullscreen: 'min-h-[400px] max-h-[600px]'
  };

  if (useAssetBackground && terminalAssetLoaded && !terminalAssetError) {
    // Enhanced version with PNG background
    return (
      <div 
        className={cn(
          "enhanced-terminal relative overflow-hidden rounded-lg border-2",
          variantClasses[variant],
          isActive && "glow-medium",
          className
        )}
        style={{
          '--terminal-glow': effectiveGlowColor,
          borderColor: typeConfig.borderColor,
          boxShadow: isActive ? `0 0 30px ${effectiveGlowColor}40` : undefined
        } as React.CSSProperties}
      >
        {/* Terminal PNG Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${assets.entities.terminal})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.8
          }}
        />

        {/* Color overlay for terminal type */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: typeConfig.backgroundColor,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Scanlines effect */}
        {showScanlines && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, ${typeConfig.scanlineOpacity * 0.1}) 2px,
                rgba(255, 255, 255, ${typeConfig.scanlineOpacity * 0.1}) 4px
              )`,
              opacity: typeConfig.scanlineOpacity
            }}
          />
        )}

        {/* Terminal header */}
        {title && (
          <div 
            className="relative z-10 px-4 py-2 border-b font-mono text-sm font-bold"
            style={{
              color: typeConfig.textColor,
              borderColor: `${typeConfig.borderColor}40`,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span>{title}</span>
            </div>
          </div>
        )}

        {/* Terminal content */}
        <div 
          className="relative z-10 p-4 h-full overflow-auto font-mono text-sm"
          style={{
            color: typeConfig.textColor,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          {children}
        </div>

        {/* Glow effect for active state */}
        {isActive && (
          <div 
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              boxShadow: `inset 0 0 20px ${effectiveGlowColor}20, 0 0 40px ${effectiveGlowColor}30`,
              border: `1px solid ${effectiveGlowColor}60`
            }}
          />
        )}
      </div>
    );
  }

  // Fallback to original TerminalPanel if asset fails or is disabled
  return (
    <TerminalPanel
      title={title}
      glowColor={effectiveGlowColor}
      isActive={isActive}
      className={cn(variantClasses[variant], className)}
    >
      <div 
        className="font-mono text-sm"
        style={{ color: typeConfig.textColor }}
      >
        {isLoading && useAssetBackground && (
          <div className="text-gray-500 mb-2">Loading terminal interface...</div>
        )}
        {terminalAssetError && useAssetBackground && (
          <div className="text-yellow-500 mb-2">⚠ Using fallback terminal display</div>
        )}
        {children}
      </div>
    </TerminalPanel>
  );
}

/**
 * Terminal Command Line Component
 */
interface TerminalCommandLineProps {
  prompt?: string;
  command?: string;
  output?: string[];
  isExecuting?: boolean;
  className?: string;
}

export function TerminalCommandLine({
  prompt = '$',
  command = '',
  output = [],
  isExecuting = false,
  className
}: TerminalCommandLineProps) {
  return (
    <div className={cn("terminal-command-line space-y-1", className)}>
      {/* Command input line */}
      <div className="flex items-center gap-2">
        <span className="text-green-400">{prompt}</span>
        <span className="text-white">{command}</span>
        {isExecuting && (
          <span className="animate-pulse text-green-400">|</span>
        )}
      </div>
      
      {/* Command output */}
      {output.length > 0 && (
        <div className="ml-4 space-y-1">
          {output.map((line, index) => (
            <div key={index} className="text-gray-300 whitespace-pre-wrap">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Terminal Status Bar Component
 */
interface TerminalStatusBarProps {
  status: 'ready' | 'executing' | 'error' | 'success';
  message?: string;
  progress?: number; // 0-100
  className?: string;
}

export function TerminalStatusBar({
  status,
  message,
  progress,
  className
}: TerminalStatusBarProps) {
  const statusConfig = {
    ready: { color: 'text-green-400', symbol: '●' },
    executing: { color: 'text-yellow-400', symbol: '◐' },
    error: { color: 'text-red-400', symbol: '✗' },
    success: { color: 'text-green-400', symbol: '✓' }
  };

  const config = statusConfig[status];

  return (
    <div className={cn("terminal-status-bar flex items-center gap-2 p-2 border-t border-gray-600", className)}>
      <span className={cn("font-mono text-sm", config.color, status === 'executing' && "animate-spin")}>
        {config.symbol}
      </span>
      
      {message && (
        <span className="font-mono text-sm text-gray-300 flex-1">
          {message}
        </span>
      )}
      
      {progress !== undefined && (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono text-xs text-gray-400">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing terminal state
 */
export function useTerminalState() {
  const [isActive, setIsActive] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCommand = async (command: string) => {
    setIsExecuting(true);
    setCommandHistory(prev => [...prev, command]);
    setCurrentCommand('');
    
    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setOutput(prev => [...prev, `> ${command}`, 'Command executed successfully']);
    setIsExecuting(false);
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const clearHistory = () => {
    setCommandHistory([]);
    setOutput([]);
  };

  return {
    isActive,
    setIsActive,
    commandHistory,
    currentCommand,
    setCurrentCommand,
    output,
    isExecuting,
    executeCommand,
    clearOutput,
    clearHistory
  };
}