/**
 * Visual Design Showcase
 * Demonstrates the enhanced visual system addressing all feedback points
 */

'use client';

import React, { useState } from 'react';
import { SpectralGameInterfaceExample } from '@/components/ui/SpectralGameInterface';
import { cn } from '@/lib/utils';

export function VisualDesignShowcase() {
  const [activeDemo, setActiveDemo] = useState<'hierarchy' | 'lighting' | 'typography' | 'animation' | 'full'>('full');

  return (
    <div className="min-h-screen vignette-lighting">
      <div className="container mx-auto p-6">
        
        {/* Header */}
        <header className="mb-8">
          <div className="focus-primary p-6">
            <h1 className="text-primary mb-4">Enhanced Visual Design System</h1>
            <p className="text-body mb-4">
              Addressing: Visual hierarchy, atmospheric lighting, typography, spectral aesthetics, and ambient animation
            </p>
            
            {/* Demo Navigation */}
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'full', label: 'Full Interface' },
                { key: 'hierarchy', label: 'Visual Hierarchy' },
                { key: 'lighting', label: 'Atmospheric Lighting' },
                { key: 'typography', label: 'Typography System' },
                { key: 'animation', label: 'Ambient Animation' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveDemo(key as any)}
                  className={cn(
                    "interactive-spectral px-4 py-2",
                    activeDemo === key && "focus-primary"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Demo Content */}
        {activeDemo === 'full' && <FullInterfaceDemo />}
        {activeDemo === 'hierarchy' && <HierarchyDemo />}
        {activeDemo === 'lighting' && <LightingDemo />}
        {activeDemo === 'typography' && <TypographyDemo />}
        {activeDemo === 'animation' && <AnimationDemo />}
      </div>
    </div>
  );
}

function FullInterfaceDemo() {
  return (
    <div className="space-y-6">
      <div className="focus-secondary p-4">
        <h2 className="text-secondary mb-2">Complete Spectral Interface</h2>
        <p className="text-body">
          This demonstrates the full enhanced interface with proper visual hierarchy, 
          atmospheric lighting, and spectral aesthetics replacing the flat brown panels.
        </p>
      </div>
      
      <SpectralGameInterfaceExample />
    </div>
  );
}

function HierarchyDemo() {
  return (
    <div className="space-y-6">
      <div className="focus-secondary p-4">
        <h2 className="text-secondary mb-2">Visual Hierarchy System</h2>
        <p className="text-body">
          Clear focal points and importance levels guide the user's attention effectively.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Primary Focus */}
        <div className="focus-primary p-6">
          <h3 className="text-primary mb-3">Primary Focus</h3>
          <p className="text-body mb-4">
            Critical system alerts and main actions draw immediate attention with 
            spectral cyan glows and enhanced typography.
          </p>
          <button className="interactive-spectral w-full">
            CRITICAL ACTION
          </button>
        </div>

        {/* Secondary Focus */}
        <div className="focus-secondary p-6">
          <h3 className="text-secondary mb-3">Secondary Focus</h3>
          <p className="text-body mb-4">
            Important information and controls with moderate emphasis and 
            subtle atmospheric effects.
          </p>
          <div className="space-y-2">
            <div className="focus-tertiary p-3">
              <div className="status-warning">Warning Status</div>
            </div>
            <div className="focus-tertiary p-3">
              <div className="status-stable">Stable Status</div>
            </div>
          </div>
        </div>

        {/* Tertiary Elements */}
        <div className="focus-tertiary p-6">
          <h3 className="text-caption mb-3 uppercase tracking-wide">Tertiary Elements</h3>
          <p className="text-caption mb-4">
            Supporting information and background elements with minimal visual weight.
          </p>
          <div className="space-y-2 text-caption">
            <div>Session ID: #42A7F9</div>
            <div>Uptime: 01:23:45</div>
            <div>Memory: 2.1GB</div>
          </div>
        </div>
      </div>

      {/* Danger State Example */}
      <div className="state-danger p-6">
        <h3 className="text-primary mb-3">SYSTEM CRITICAL</h3>
        <p className="text-body">
          Danger states pulse with red energy and demand immediate attention through 
          animation and enhanced contrast.
        </p>
      </div>
    </div>
  );
}

function LightingDemo() {
  return (
    <div className="space-y-6">
      <div className="spectral-panel focus-secondary p-4">
        <h2 className="text-secondary mb-2">Atmospheric Lighting System</h2>
        <p className="text-body">
          Volumetric lighting, phosphor glows, and ambient particles create depth and atmosphere.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Spectral Glow Effects */}
        <div className="spectral-panel p-6 breathing-shadow">
          <h3 className="text-secondary mb-4">Spectral Glows</h3>
          <div className="space-y-4">
            <div className="p-4 rounded" style={{ boxShadow: 'var(--glow-spectral)' }}>
              <div className="status-info">Cyan Spectral Glow</div>
            </div>
            <div className="p-4 rounded" style={{ boxShadow: 'var(--glow-danger)' }}>
              <div className="status-critical">Danger Red Glow</div>
            </div>
            <div className="p-4 rounded" style={{ boxShadow: 'var(--glow-success)' }}>
              <div className="status-stable">Success Green Glow</div>
            </div>
          </div>
        </div>

        {/* CRT Effects */}
        <div className="spectral-panel crt-effect p-6">
          <h3 className="text-secondary mb-4">CRT Phosphor Effects</h3>
          <div className="space-y-2 font-mono">
            <div className="terminal-flicker status-info">
              &gt; System.initialize()
            </div>
            <div className="terminal-flicker status-warning">
              &gt; Warning: Memory threshold exceeded
            </div>
            <div className="terminal-flicker status-critical">
              &gt; Error: Heap corruption detected
            </div>
            <div className="terminal-flicker status-stable">
              &gt; Debug session started...
            </div>
          </div>
        </div>
      </div>

      {/* Vignette Effect Demo */}
      <div className="relative h-64 spectral-panel vignette-lighting p-6">
        <h3 className="text-secondary mb-4">Vignette Lighting</h3>
        <p className="text-body">
          Subtle vignette effects create depth and focus attention toward the center, 
          mimicking the natural falloff of CRT monitors.
        </p>
        <div className="absolute bottom-6 right-6">
          <div className="w-16 h-16 rounded-full bg-spectral-cyan opacity-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function TypographyDemo() {
  return (
    <div className="space-y-6">
      <div className="spectral-panel focus-secondary p-4">
        <h2 className="text-secondary mb-2">Typography Hierarchy</h2>
        <p className="text-body">
          Clear typographic hierarchy with appropriate fonts for different content types.
        </p>
      </div>

      <div className="spectral-panel p-6">
        <div className="space-y-6">
          
          {/* Display Typography */}
          <div>
            <h1 className="text-primary">Primary Display Text</h1>
            <p className="text-caption">
              Font: Orbitron (Display) • Weight: 700 • Color: Spectral Cyan • Glow: 15px
            </p>
          </div>

          {/* Secondary Headers */}
          <div>
            <h2 className="text-secondary">Secondary Header Text</h2>
            <p className="text-caption">
              Font: Cascadia Code (Monospace) • Weight: 600 • Color: Cyan Dim • Glow: 8px
            </p>
          </div>

          {/* Body Text */}
          <div>
            <p className="text-body">
              This is body text used for general content and descriptions. 
              It uses a clean sans-serif font for optimal readability while 
              maintaining the spectral aesthetic through color choices.
            </p>
            <p className="text-caption">
              Font: Inter (Sans-serif) • Weight: 400 • Color: Ghost White • Line Height: 1.6
            </p>
          </div>

          {/* Status Text Examples */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="status-critical text-lg font-bold">CRITICAL</div>
              <p className="text-caption">Critical Status</p>
            </div>
            <div className="text-center">
              <div className="status-warning text-lg font-bold">WARNING</div>
              <p className="text-caption">Warning Status</p>
            </div>
            <div className="text-center">
              <div className="status-stable text-lg font-bold">STABLE</div>
              <p className="text-caption">Stable Status</p>
            </div>
            <div className="text-center">
              <div className="status-info text-lg font-bold">INFO</div>
              <p className="text-caption">Info Status</p>
            </div>
          </div>

          {/* Code/Terminal Text */}
          <div className="bg-shadow-deep p-4 rounded border border-spectral-cyan/30">
            <div className="font-mono space-y-1">
              <div className="status-info">function debugGhost(ghost) &#123;</div>
              <div className="status-warning ml-4">if (ghost.isActive()) &#123;</div>
              <div className="status-critical ml-8">throw new Error(&apos;Ghost detected!&apos;);</div>
              <div className="status-warning ml-4">&#125;</div>
              <div className="status-info">&#125;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimationDemo() {
  return (
    <div className="space-y-6">
      <div className="spectral-panel focus-secondary p-4">
        <h2 className="text-secondary mb-2">Ambient Animation System</h2>
        <p className="text-body">
          Subtle animations and effects that bring the interface to life without being distracting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Possessed Text Effect */}
        <div className="spectral-panel p-6">
          <h3 className="text-secondary mb-4">Possessed Text Effect</h3>
          <div className="space-y-4">
            <div className="possessed-text text-primary" data-text="SYSTEM COMPROMISED">
              SYSTEM COMPROMISED
            </div>
            <div className="possessed-text text-body" data-text="Ghost detected in memory">
              Ghost detected in memory
            </div>
            <p className="text-caption">
              Text occasionally glitches with red shadows to simulate supernatural interference.
            </p>
          </div>
        </div>

        {/* Breathing Elements */}
        <div className="spectral-panel breathing-shadow p-6">
          <h3 className="text-secondary mb-4">Breathing Shadows</h3>
          <div className="space-y-4">
            <div className="interactive-spectral p-4">
              Hover for interaction feedback
            </div>
            <p className="text-caption">
              Panels subtly breathe with changing shadow depth, creating organic movement.
            </p>
          </div>
        </div>

        {/* Terminal Flicker */}
        <div className="spectral-panel p-6">
          <h3 className="text-secondary mb-4">Terminal Flicker</h3>
          <div className="bg-shadow-deep p-4 rounded font-mono">
            <div className="terminal-flicker status-info">
              &gt; Scanning for anomalies...
            </div>
            <div className="terminal-flicker status-warning">
              &gt; 3 ghosts detected
            </div>
            <div className="terminal-flicker status-critical">
              &gt; Memory corruption found
            </div>
          </div>
          <p className="text-caption mt-2">
            Terminal text flickers like old CRT monitors for authentic retro-tech feel.
          </p>
        </div>

        {/* Status Animations */}
        <div className="spectral-panel p-6">
          <h3 className="text-secondary mb-4">Status Animations</h3>
          <div className="space-y-3">
            <div className="state-danger p-3 rounded">
              <div className="status-critical">CRITICAL SYSTEM ERROR</div>
            </div>
            <div className="state-warning p-3 rounded">
              <div className="status-warning">Warning: High Memory Usage</div>
            </div>
            <div className="state-success p-3 rounded">
              <div className="status-stable">System Stable</div>
            </div>
          </div>
          <p className="text-caption mt-2">
            Critical states pulse and breathe to demand attention without being jarring.
          </p>
        </div>
      </div>

      {/* Ambient Particles Demo */}
      <div className="relative spectral-panel p-6 h-32 overflow-hidden">
        <h3 className="text-secondary mb-2">Ambient Particles</h3>
        <p className="text-body">
          Floating particles create subtle movement and depth in the background.
        </p>
        <div className="ambient-particles">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${10 + i * 10}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}