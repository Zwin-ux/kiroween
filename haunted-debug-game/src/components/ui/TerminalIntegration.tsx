/**
 * TerminalIntegration - Contextual terminal placement for rooms
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { EnhancedTerminal, TerminalCommandLine, TerminalStatusBar } from './EnhancedTerminal';

interface TerminalIntegrationProps {
  roomId: string;
  className?: string;
  interactive?: boolean;
}

interface RoomTerminalConfig {
  position: { x: number; y: number }; // Percentage positions
  size: 'compact' | 'default' | 'fullscreen';
  terminalType: 'debug' | 'compile' | 'ghost' | 'system';
  title: string;
  defaultContent: string[];
  isActive: boolean;
}

// Room-specific terminal configurations
const ROOM_TERMINAL_CONFIGS: Record<string, RoomTerminalConfig> = {
  'boot-sector': {
    position: { x: 75, y: 25 },
    size: 'compact',
    terminalType: 'system',
    title: 'Boot Diagnostics',
    defaultContent: [
      'BOOT SECTOR ANALYSIS',
      '> Scanning system integrity...',
      '> Memory allocation: OK',
      '> Core processes: STABLE',
      '> Ghost activity detected: WARNING'
    ],
    isActive: true
  },
  'dependency-crypt': {
    position: { x: 20, y: 30 },
    size: 'default',
    terminalType: 'debug',
    title: 'Dependency Resolver',
    defaultContent: [
      'DEPENDENCY ANALYSIS TERMINAL',
      '> Resolving package dependencies...',
      '> Circular dependency detected in crypt.js',
      '> Attempting resolution...',
      '> Status: NEEDS INTERVENTION'
    ],
    isActive: true
  },
  'ghost-memory-heap': {
    position: { x: 80, y: 40 },
    size: 'default',
    terminalType: 'debug',
    title: 'Memory Debugger',
    defaultContent: [
      'HEAP MEMORY ANALYZER',
      '> Scanning memory allocations...',
      '> Memory leaks detected: 3',
      '> Garbage collection status: DELAYED',
      '> Ghost interference: HIGH'
    ],
    isActive: true
  },
  'possessed-compiler': {
    position: { x: 25, y: 20 },
    size: 'fullscreen',
    terminalType: 'compile',
    title: 'Compiler Interface',
    defaultContent: [
      'POSSESSED COMPILER v2.1.3',
      '> Compilation process initiated...',
      '> Syntax analysis: CORRUPTED',
      '> Error count: ∞',
      '> Ghost possession level: CRITICAL',
      '> Seeking human intervention...'
    ],
    isActive: true
  },
  'ethics-tribunal': {
    position: { x: 50, y: 35 },
    size: 'default',
    terminalType: 'system',
    title: 'Ethics Evaluation System',
    defaultContent: [
      'ETHICAL CODE ANALYSIS',
      '> Evaluating code practices...',
      '> Privacy compliance: REVIEWING',
      '> Data handling: QUESTIONABLE',
      '> Moral alignment: PENDING JUDGMENT'
    ],
    isActive: true
  },
  'final-merge': {
    position: { x: 50, y: 50 },
    size: 'fullscreen',
    terminalType: 'ghost',
    title: 'Merge Conflict Resolution',
    defaultContent: [
      'FINAL MERGE TERMINAL',
      '> Preparing branch convergence...',
      '> Conflict resolution in progress...',
      '> Ghost consensus: ACHIEVED',
      '> Ready for final merge...',
      '> All systems: GO'
    ],
    isActive: true
  }
};

export function TerminalIntegration({ 
  roomId, 
  className,
  interactive = true 
}: TerminalIntegrationProps) {
  const terminalConfig = ROOM_TERMINAL_CONFIGS[roomId];
  
  if (!terminalConfig) {
    return null;
  }

  return (
    <div 
      className={cn("absolute pointer-events-none", className)}
      style={{
        left: `${terminalConfig.position.x}%`,
        top: `${terminalConfig.position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        width: terminalConfig.size === 'compact' ? '300px' : 
               terminalConfig.size === 'default' ? '400px' : '500px',
        maxWidth: '90vw'
      }}
    >
      <div className={interactive ? 'pointer-events-auto' : ''}>
        <EnhancedTerminal
          title={terminalConfig.title}
          variant={terminalConfig.size}
          terminalType={terminalConfig.terminalType}
          isActive={terminalConfig.isActive}
          useAssetBackground={true}
          showScanlines={true}
        >
          <div className="space-y-2">
            {terminalConfig.defaultContent.map((line, index) => (
              <div key={index} className="font-mono text-sm">
                {line}
              </div>
            ))}
            
            {/* Interactive command line for some terminals */}
            {interactive && (terminalConfig.terminalType === 'debug' || terminalConfig.terminalType === 'compile') && (
              <div className="mt-4 pt-2 border-t border-gray-600">
                <TerminalCommandLine
                  prompt="debug>"
                  command=""
                  isExecuting={false}
                />
              </div>
            )}
          </div>
          
          {/* Status bar for active terminals */}
          {terminalConfig.isActive && (
            <TerminalStatusBar
              status="ready"
              message={`${terminalConfig.terminalType.toUpperCase()} mode active`}
            />
          )}
        </EnhancedTerminal>
      </div>
    </div>
  );
}

/**
 * Multiple terminals for complex rooms
 */
interface MultiTerminalIntegrationProps {
  roomId: string;
  className?: string;
  interactive?: boolean;
  maxTerminals?: number;
}

export function MultiTerminalIntegration({ 
  roomId, 
  className,
  interactive = true,
  maxTerminals = 2
}: MultiTerminalIntegrationProps) {
  // For rooms that might have multiple terminal instances
  const additionalTerminals: Record<string, RoomTerminalConfig[]> = {
    'possessed-compiler': [
      {
        position: { x: 75, y: 75 },
        size: 'compact',
        terminalType: 'system',
        title: 'System Monitor',
        defaultContent: [
          'SYSTEM STATUS',
          '> CPU: 99% (POSSESSED)',
          '> Memory: CORRUPTED',
          '> Processes: HAUNTED'
        ],
        isActive: false
      }
    ],
    'final-merge': [
      {
        position: { x: 20, y: 20 },
        size: 'compact',
        terminalType: 'debug',
        title: 'Branch Status',
        defaultContent: [
          'BRANCH MONITOR',
          '> feature/ghost-fix: READY',
          '> main: STABLE',
          '> Merge conflicts: RESOLVED'
        ],
        isActive: true
      },
      {
        position: { x: 80, y: 80 },
        size: 'compact',
        terminalType: 'system',
        title: 'Deploy Status',
        defaultContent: [
          'DEPLOYMENT READY',
          '> Tests: PASSED',
          '> Build: SUCCESS',
          '> Deploy: AWAITING APPROVAL'
        ],
        isActive: true
      }
    ]
  };

  const terminals = additionalTerminals[roomId]?.slice(0, maxTerminals) || [];

  if (terminals.length === 0) {
    return <TerminalIntegration roomId={roomId} className={className} interactive={interactive} />;
  }

  return (
    <div className={cn("absolute inset-0", className)}>
      {/* Main terminal */}
      <TerminalIntegration roomId={roomId} interactive={interactive} />
      
      {/* Additional terminals */}
      {terminals.map((terminalConfig, index) => (
        <div 
          key={index}
          className="absolute pointer-events-none"
          style={{
            left: `${terminalConfig.position.x}%`,
            top: `${terminalConfig.position.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 8 - index, // Layer behind main terminal
            width: terminalConfig.size === 'compact' ? '250px' : '350px',
            maxWidth: '80vw'
          }}
        >
          <div className={interactive ? 'pointer-events-auto' : ''}>
            <EnhancedTerminal
              title={terminalConfig.title}
              variant={terminalConfig.size}
              terminalType={terminalConfig.terminalType}
              isActive={terminalConfig.isActive}
              useAssetBackground={true}
              showScanlines={true}
            >
              <div className="space-y-1">
                {terminalConfig.defaultContent.map((line, lineIndex) => (
                  <div key={lineIndex} className="font-mono text-xs">
                    {line}
                  </div>
                ))}
              </div>
            </EnhancedTerminal>
          </div>
        </div>
      ))}
    </div>
  );
}