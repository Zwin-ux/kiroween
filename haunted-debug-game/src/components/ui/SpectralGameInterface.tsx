/**
 * Spectral Game Interface - Enhanced visual design with proper hierarchy and atmosphere
 * Addresses: Visual composition, color/lighting, typography, aesthetic direction, animation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SpectralGameInterfaceProps {
  stabilityLevel: number;
  insightLevel: number;
  systemStatus: 'stable' | 'warning' | 'critical' | 'unknown';
  activeGhosts: number;
  currentRoom: string;
  onNavigate?: (room: string) => void;
  onSystemAction?: (action: string) => void;
  children?: React.ReactNode;
}

export function SpectralGameInterface({
  stabilityLevel,
  insightLevel,
  systemStatus,
  activeGhosts,
  currentRoom,
  onNavigate,
  onSystemAction,
  children
}: SpectralGameInterfaceProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [systemMessage, setSystemMessage] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);

  // Generate ambient particles
  useEffect(() => {
    const particleCount = Math.min(20, Math.max(5, activeGhosts * 3));
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 8
    }));
    setParticles(newParticles);
  }, [activeGhosts]);

  // System status messages
  useEffect(() => {
    const messages = {
      stable: 'System operating within normal parameters',
      warning: 'Anomalous activity detected - proceed with caution',
      critical: 'CRITICAL: System instability detected - immediate action required',
      unknown: 'Unable to determine system status'
    };
    setSystemMessage(messages[systemStatus]);
    
    // Trigger glitch effect on critical status
    if (systemStatus === 'critical') {
      setIsGlitching(true);
      const timer = setTimeout(() => setIsGlitching(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [systemStatus]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'critical': return 'status-critical';
      case 'warning': return 'status-warning';
      case 'stable': return 'status-stable';
      default: return 'status-info';
    }
  };

  return (
    <div className="min-h-screen vignette-lighting crt-effect">
      {/* Ambient Particles */}
      <div className="ambient-particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main Interface Container */}
      <div className="relative z-20 p-6 max-w-7xl mx-auto">
        
        {/* Header - Primary Focus */}
        <header className="mb-8">
          <div className="focus-primary p-6 breathing-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={cn(
                  "text-primary",
                  isGlitching && "possessed-text"
                )} data-text="HAUNTED DEBUG SYSTEM">
                  HAUNTED DEBUG SYSTEM
                </h1>
                <p className="text-secondary">
                  Room: <span className="terminal-flicker">{currentRoom.toUpperCase()}</span>
                </p>
              </div>
              
              {/* System Status - Critical attention when needed */}
              <div className={cn(
                "p-4",
                systemStatus === 'critical' ? 'state-danger' : 
                systemStatus === 'warning' ? 'state-warning' : 
                systemStatus === 'stable' ? 'state-success' : 'state-info'
              )}>
                <div className="text-center">
                  <div className={cn("text-lg font-bold", getStatusClass(systemStatus))}>
                    {systemStatus.toUpperCase()}
                  </div>
                  <div className="text-caption mt-1">
                    System Status
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Message */}
            <div className="mt-4 p-3 bg-black/30 rounded border border-spectral-cyan/30">
              <p className={cn("text-body", getStatusClass(systemStatus))}>
                {systemMessage}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Panel - Meters (Secondary Focus) */}
          <div className="lg:col-span-1">
            <div className="focus-secondary p-6">
              <h2 className="text-secondary mb-4">System Metrics</h2>
              
              {/* Stability Meter */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body">Stability</span>
                  <span className={cn(
                    "font-bold",
                    stabilityLevel < 30 ? 'status-critical' :
                    stabilityLevel < 70 ? 'status-warning' : 'status-stable'
                  )}>
                    {stabilityLevel}%
                  </span>
                </div>
                <div className="relative h-3 bg-shadow-deep rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all duration-1000 rounded-full",
                      stabilityLevel < 30 ? 'bg-danger-red' :
                      stabilityLevel < 70 ? 'bg-warning-orange' : 'bg-success-green'
                    )}
                    style={{ 
                      width: `${stabilityLevel}%`,
                      boxShadow: stabilityLevel < 30 ? 'var(--glow-danger)' :
                                 stabilityLevel < 70 ? 'var(--glow-warning)' : 'var(--glow-success)'
                    }}
                  />
                </div>
              </div>

              {/* Insight Meter */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body">Insight</span>
                  <span className="font-bold status-info">{insightLevel}%</span>
                </div>
                <div className="relative h-3 bg-shadow-deep rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-spectral-cyan transition-all duration-1000 rounded-full"
                    style={{ 
                      width: `${insightLevel}%`,
                      boxShadow: 'var(--glow-spectral)'
                    }}
                  />
                </div>
              </div>

              {/* Active Ghosts Counter */}
              <div className="focus-tertiary p-4">
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold mb-1",
                    activeGhosts > 0 ? 'status-warning' : 'status-stable'
                  )}>
                    {activeGhosts}
                  </div>
                  <div className="text-caption">Active Ghosts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Main Content (Primary Focus) */}
          <div className="lg:col-span-2">
            <div className="focus-primary p-6 min-h-96">
              <h2 className="text-secondary mb-4">Debug Interface</h2>
              
              {/* Main content area */}
              <div className="relative">
                {children || (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">👻</div>
                    <p className="text-body">
                      Awaiting ghost encounter...
                    </p>
                    <p className="text-caption mt-2">
                      Navigate to a room to begin debugging
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar - Interactive Elements */}
        <div className="focus-secondary p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            
            {/* Navigation Buttons */}
            {[
              'Compiler Room',
              'Memory Heap', 
              'Stack Trace Tower',
              'Dependency Crypt'
            ].map((room) => (
              <button
                key={room}
                onClick={() => onNavigate?.(room)}
                className={cn(
                  "interactive-spectral px-6 py-3",
                  currentRoom === room && "focus-primary"
                )}
              >
                {room}
              </button>
            ))}
            
            {/* System Actions */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => onSystemAction?.('scan')}
                className="interactive-spectral px-4 py-3"
              >
                🔍 Scan
              </button>
              <button
                onClick={() => onSystemAction?.('compile')}
                className="interactive-spectral px-4 py-3"
              >
                ⚡ Compile
              </button>
              <button
                onClick={() => onSystemAction?.('debug')}
                className={cn(
                  "interactive-spectral px-4 py-3",
                  systemStatus === 'critical' && "state-danger"
                )}
              >
                🐛 Debug
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Tertiary Information */}
        <footer className="mt-6">
          <div className="focus-tertiary p-4">
            <div className="flex justify-between items-center text-caption">
              <div>
                KiroWeen Debug System v2.1.0
              </div>
              <div className="flex gap-4">
                <span>Session: {Date.now().toString().slice(-6)}</span>
                <span>Uptime: 00:42:13</span>
                <span className={getStatusClass(systemStatus)}>
                  ● {systemStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Example usage component
export function SpectralGameInterfaceExample() {
  const [stabilityLevel, setStabilityLevel] = useState(75);
  const [insightLevel, setInsightLevel] = useState(45);
  const [systemStatus, setSystemStatus] = useState<'stable' | 'warning' | 'critical' | 'unknown'>('stable');
  const [activeGhosts, setActiveGhosts] = useState(2);
  const [currentRoom, setCurrentRoom] = useState('Compiler Room');

  // Simulate system changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly fluctuate stability
      setStabilityLevel(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, prev + change));
      });
      
      // Update system status based on stability
      setSystemStatus(prev => {
        if (stabilityLevel < 30) return 'critical';
        if (stabilityLevel < 60) return 'warning';
        return 'stable';
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stabilityLevel]);

  return (
    <SpectralGameInterface
      stabilityLevel={stabilityLevel}
      insightLevel={insightLevel}
      systemStatus={systemStatus}
      activeGhosts={activeGhosts}
      currentRoom={currentRoom}
      onNavigate={(room) => setCurrentRoom(room)}
      onSystemAction={(action) => {
        console.log(`System action: ${action}`);
        if (action === 'debug' && systemStatus === 'critical') {
          setStabilityLevel(prev => Math.min(100, prev + 20));
        }
      }}
    >
      <div className="space-y-4">
        <div className="spectral-panel p-4">
          <h3 className="text-secondary mb-2">Current Debugging Session</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-body">Ghost Type:</span>
              <span className="status-warning">Memory Leak</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body">Severity:</span>
              <span className="status-critical">High</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body">Location:</span>
              <span className="status-info">line 42, heap.js</span>
            </div>
          </div>
        </div>
        
        <div className="spectral-panel p-4">
          <h3 className="text-secondary mb-2">System Log</h3>
          <div className="space-y-1 font-mono text-sm">
            <div className="status-info">[INFO] System initialized</div>
            <div className="status-warning">[WARN] Memory usage above threshold</div>
            <div className="status-critical">[ERROR] Heap corruption detected</div>
            <div className="status-info terminal-flicker">[INFO] Debugging session started...</div>
          </div>
        </div>
      </div>
    </SpectralGameInterface>
  );
}