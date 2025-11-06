'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedGhostRenderer } from '@/components/ui/EnhancedGhostRenderer';

// Test page to verify ghost implementations work
export default function TestGhosts() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVisualTests, setShowVisualTests] = useState(false);

  // All ghost types for visual testing
  const ghostTypes = [
    'circular_dependency',
    'stale_cache', 
    'unbounded_recursion',
    'prompt_injection',
    'data_leak',
    'dead_code',
    'race_condition',
    'memory_leak'
  ];

  const runGhostTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test dynamic imports
      const results: string[] = [];
      
      // Test CircularDependencyGhost
      try {
        const { CircularDependencyGhost } = await import('@/engine/ghosts/CircularDependencyGhost');
        const ghost = new CircularDependencyGhost();
        results.push(`✅ CircularDependencyGhost: ${ghost.name} (Severity: ${ghost.severity})`);
        
        // Test dialogue generation
        const mockContext = {
          gameState: {
            meters: { stability: 60, insight: 40 },
            currentRoom: 'dependency_crypt',
            evidenceBoard: []
          }
        };
        const dialogue = ghost.generateContextualDialogue(mockContext as any);
        results.push(`   Dialogue: "${dialogue.substring(0, 100)}..."`);
        
        // Test educational content
        const education = ghost.generateEducationalContent('detection', 'intermediate');
        results.push(`   Education: ${education.title} - ${education.explanation.substring(0, 80)}...`);
        
      } catch (error) {
        results.push(`❌ CircularDependencyGhost failed: ${error}`);
      }

      // Test StaleCacheGhost
      try {
        const { StaleCacheGhost } = await import('@/engine/ghosts/StaleCacheGhost');
        const ghost = new StaleCacheGhost();
        results.push(`✅ StaleCacheGhost: ${ghost.name} (Severity: ${ghost.severity})`);
      } catch (error) {
        results.push(`❌ StaleCacheGhost failed: ${error}`);
      }

      // Test UnboundedRecursionGhost
      try {
        const { UnboundedRecursionGhost } = await import('@/engine/ghosts/UnboundedRecursionGhost');
        const ghost = new UnboundedRecursionGhost();
        results.push(`✅ UnboundedRecursionGhost: ${ghost.name} (Severity: ${ghost.severity})`);
      } catch (error) {
        results.push(`❌ UnboundedRecursionGhost failed: ${error}`);
      }

      // Test PromptInjectionGhost
      try {
        const { PromptInjectionGhost } = await import('@/engine/ghosts/PromptInjectionGhost');
        const ghost = new PromptInjectionGhost();
        results.push(`✅ PromptInjectionGhost: ${ghost.name} (Severity: ${ghost.severity})`);
      } catch (error) {
        results.push(`❌ PromptInjectionGhost failed: ${error}`);
      }

      // Test DataLeakGhost
      try {
        const { DataLeakGhost } = await import('@/engine/ghosts/DataLeakGhost');
        const ghost = new DataLeakGhost();
        results.push(`✅ DataLeakGhost: ${ghost.name} (Severity: ${ghost.severity})`);
      } catch (error) {
        results.push(`❌ DataLeakGhost failed: ${error}`);
      }

      // Test GhostBehaviorSystem
      try {
        const { GhostBehaviorSystem } = await import('@/engine/ghosts/GhostBehaviorSystem');
        const behaviorSystem = new GhostBehaviorSystem();
        results.push(`✅ GhostBehaviorSystem: Initialized successfully`);
      } catch (error) {
        results.push(`❌ GhostBehaviorSystem failed: ${error}`);
      }

      // Test factory function
      try {
        const { createGhostInstance } = await import('@/engine/ghosts/index');
        const ghost = await createGhostInstance('circular_dependency');
        results.push(`✅ Ghost Factory: Created ${ghost.name} successfully`);
      } catch (error) {
        results.push(`❌ Ghost Factory failed: ${error}`);
      }

      setTestResults(results);
      
    } catch (error) {
      setTestResults([`❌ Test suite failed: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-red-400 mb-6">Ghost Implementation Test Suite</h1>
        
        <div className="mb-6">
          <Button 
            onClick={runGhostTests}
            disabled={isLoading}
            variant="horror"
            className="mr-4"
          >
            {isLoading ? 'Testing...' : 'Run Ghost Tests'}
          </Button>
          
          <Button 
            onClick={() => setShowVisualTests(!showVisualTests)}
            variant="outline"
            className="mr-4"
          >
            {showVisualTests ? 'Hide Visual Tests' : 'Show Visual Tests'}
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            ← Back to Game
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Test Results</h2>
            <div className="space-y-2 font-mono text-sm">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`${result.startsWith('✅') ? 'text-green-400' : 
                              result.startsWith('❌') ? 'text-red-400' : 
                              'text-gray-300 ml-4'}`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {showVisualTests && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Visual Ghost Renderer Tests</h2>
            <p className="text-gray-300 mb-6">Testing ghost image rendering with color overlays and fallbacks across all personality types:</p>
            
            {/* Test different severity levels */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Normal State (Severity 5)</h3>
                <div className="grid grid-cols-4 gap-6">
                  {ghostTypes.map((ghostType) => (
                    <div key={`normal-${ghostType}`} className="text-center">
                      <EnhancedGhostRenderer
                        ghostType={ghostType}
                        severity={5}
                        stabilityLevel={70}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-gray-400">{ghostType.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Active State (Severity 8)</h3>
                <div className="grid grid-cols-4 gap-6">
                  {ghostTypes.map((ghostType) => (
                    <div key={`active-${ghostType}`} className="text-center">
                      <EnhancedGhostRenderer
                        ghostType={ghostType}
                        severity={8}
                        isActive={true}
                        stabilityLevel={40}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-gray-400">{ghostType.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4">Critical State (Severity 10)</h3>
                <div className="grid grid-cols-4 gap-6">
                  {ghostTypes.map((ghostType) => (
                    <div key={`critical-${ghostType}`} className="text-center">
                      <EnhancedGhostRenderer
                        ghostType={ghostType}
                        severity={10}
                        isActive={true}
                        stabilityLevel={10}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-gray-400">{ghostType.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Encountered State</h3>
                <div className="grid grid-cols-4 gap-6">
                  {ghostTypes.map((ghostType) => (
                    <div key={`encountered-${ghostType}`} className="text-center">
                      <EnhancedGhostRenderer
                        ghostType={ghostType}
                        severity={6}
                        isEncountered={true}
                        stabilityLevel={60}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-gray-400">{ghostType.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">Visual Test Checklist:</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>✓ All ghosts should display base ghost image with personality color overlays</li>
                <li>✓ Each ghost should have distinct color variations based on personality</li>
                <li>✓ Distortion effects should apply correctly to PNG images</li>
                <li>✓ Fallback to symbol rendering should work if images fail to load</li>
                <li>✓ Active state should show enhanced glow and scale effects</li>
                <li>✓ Encountered state should show checkmark overlay</li>
                <li>✓ Severity levels should affect visual intensity</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Implementation Summary</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>✅ <strong>5 Ghost Types Implemented:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• CircularDependencyGhost - "The Ouroboros" (Severity: 7)</li>
              <li>• StaleCacheGhost - "The Lingerer" (Severity: 5)</li>
              <li>• UnboundedRecursionGhost - "The Infinite Echo" (Severity: 9)</li>
              <li>• PromptInjectionGhost - "The Manipulator" (Severity: 8)</li>
              <li>• DataLeakGhost - "The Whisperer" (Severity: 8)</li>
            </ul>
            
            <p className="mt-4">✅ <strong>Advanced Features:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Context-aware dialogue generation</li>
              <li>• Educational content for 3 difficulty levels</li>
              <li>• Adaptive behavior based on player actions</li>
              <li>• Room-specific behavior modifiers</li>
              <li>• Patch effectiveness calculation</li>
              <li>• Contextual hints system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}