/**
 * ExecutionResultExample - Demonstrates the execution result simulation system
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExecutionResultSimulator } from '@/engine/ExecutionResultSimulator';
import { CompileEventProcessorImpl, type ExecutionResults } from '@/engine/CompileEventProcessor';
import type { PatchPlan } from '@/types/patch';
import type { Ghost } from '@/types/content';
import { SoftwareSmell } from '@/types/ghost';
import type { GameContext } from '@/types/game';

const samplePatch: PatchPlan = {
  diff: `--- a/src/cache.js
+++ b/src/cache.js
@@ -10,7 +10,12 @@ class CacheManager {
   }
   
   get(key) {
-    return this.cache[key];
+    // Add null check and expiration validation
+    const entry = this.cache[key];
+    if (!entry || entry.expires < Date.now()) {
+      delete this.cache[key];
+      return null;
+    }
+    return entry.value;
   }
 }`,
  description: 'Add cache expiration and null safety checks',
  risk: 0.3,
  effects: {
    stability: 5,
    insight: 3,
    description: 'Improved cache reliability'
  },
  ghostResponse: 'Your approach addresses the stale cache issue effectively.'
};

const sampleGhost: Ghost = {
  id: 'stale-cache-ghost',
  name: 'The Stale Cache Specter',
  severity: 0.6,
  description: 'A ghost haunting the caching layer with outdated data',
  softwareSmell: SoftwareSmell.StaleCache,
  manifestation: {
    visual: 'Flickering data fragments',
    audio: 'Static whispers of old information',
    behavior: 'Appears when cache hits return stale data'
  },
  dialoguePrompts: [
    'The data... it never refreshes...',
    'Users see the old version, always the old version...'
  ],
  fixPatterns: [
    {
      type: 'cache_expiration',
      description: 'Add time-based cache invalidation',
      risk: 0.2,
      stabilityEffect: 8,
      insightEffect: 4
    }
  ],
  hints: [
    'Check cache entry timestamps',
    'Implement proper expiration logic'
  ],
  rooms: ['data-layer']
};

const sampleContext: GameContext = {
  gameState: {
    run: {
      id: 'test-run',
      startedAt: new Date(),
      finalStability: 75,
      finalInsight: 60,
      outcome: 'victory' as any
    },
    currentRoom: 'data-layer',
    meters: {
      stability: 75,
      insight: 60
    },
    unlockedRooms: ['data-layer'],
    evidenceBoard: [],
    playerChoices: [],
    systemStates: {} as any
  },
  currentRoom: 'data-layer',
  activeGhost: sampleGhost
};

export function ExecutionResultExample() {
  const [executionResults, setExecutionResults] = useState<ExecutionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(0.3);

  const simulator = new ExecutionResultSimulator();
  const processor = new CompileEventProcessorImpl();

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      // Create patch with selected risk level
      const testPatch: PatchPlan = {
        ...samplePatch,
        risk: selectedRisk
      };

      // Generate execution results
      const results = await processor.generateExecutionResults(testPatch, sampleContext);
      setExecutionResults(results);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Execution Result Simulation</h2>
        <p className="text-gray-600">
          Demonstrates realistic compilation output, performance impact, and code quality analysis
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Simulation Controls</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <span>Risk Level:</span>
            <select 
              value={selectedRisk} 
              onChange={(e) => setSelectedRisk(parseFloat(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={0.1}>Low (0.1)</option>
              <option value={0.3}>Medium-Low (0.3)</option>
              <option value={0.5}>Medium (0.5)</option>
              <option value={0.7}>Medium-High (0.7)</option>
              <option value={0.9}>High (0.9)</option>
            </select>
          </label>
        </div>
        <Button onClick={runSimulation} disabled={isLoading}>
          {isLoading ? 'Running Simulation...' : 'Run Execution Simulation'}
        </Button>
      </div>

      {/* Sample Patch Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Sample Patch</h3>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
          <pre>{samplePatch.diff}</pre>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          <strong>Description:</strong> {samplePatch.description}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Ghost:</strong> {sampleGhost.name} ({sampleGhost.softwareSmell})
        </p>
      </div>

      {/* Results Display */}
      {executionResults && (
        <div className="space-y-6">
          {/* Compilation Output */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                executionResults.compilationOutput.exitCode === 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              Compilation Output
            </h3>
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
              <div className="text-green-400">STDOUT:</div>
              <pre className="whitespace-pre-wrap">{executionResults.compilationOutput.stdout}</pre>
              {executionResults.compilationOutput.stderr && (
                <>
                  <div className="text-red-400 mt-2">STDERR:</div>
                  <pre className="whitespace-pre-wrap text-red-300">{executionResults.compilationOutput.stderr}</pre>
                </>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Exit Code:</strong> {executionResults.compilationOutput.exitCode}
              </div>
              <div>
                <strong>Execution Time:</strong> {executionResults.compilationOutput.executionTime}ms
              </div>
              <div>
                <strong>Memory Usage:</strong> {formatBytes(executionResults.compilationOutput.memoryUsage)}
              </div>
              <div>
                <strong>Warnings:</strong> {executionResults.compilationOutput.warnings.length}
              </div>
            </div>
          </div>

          {/* Performance Impact */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Performance Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">CPU Usage</div>
                <div className="text-lg">{formatPercentage(executionResults.performanceImpact.cpuUsage)}</div>
              </div>
              <div>
                <div className="font-medium">Memory Usage</div>
                <div className="text-lg">{formatBytes(executionResults.performanceImpact.memoryUsage)}</div>
              </div>
              <div>
                <div className="font-medium">Execution Time</div>
                <div className="text-lg">{executionResults.performanceImpact.executionTime}ms</div>
              </div>
              <div>
                <div className="font-medium">Network Calls</div>
                <div className="text-lg">{executionResults.performanceImpact.networkCalls}</div>
              </div>
              <div>
                <div className="font-medium">Disk Operations</div>
                <div className="text-lg">{executionResults.performanceImpact.diskOperations}</div>
              </div>
              <div>
                <div className="font-medium">Cache Hit Rate</div>
                <div className="text-lg">{formatPercentage(executionResults.performanceImpact.cacheHitRate)}</div>
              </div>
            </div>

            {/* Performance Bottlenecks */}
            {executionResults.performanceImpact.bottlenecks.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Performance Bottlenecks</h4>
                <div className="space-y-2">
                  {executionResults.performanceImpact.bottlenecks.map((bottleneck: any, index: number) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-yellow-800">{bottleneck.description}</div>
                          <div className="text-sm text-yellow-700 mt-1">{bottleneck.suggestion}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          bottleneck.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          bottleneck.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          bottleneck.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {bottleneck.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Quality */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Code Quality Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <div className="font-medium">Overall Score</div>
                <div className="text-lg">{formatPercentage(executionResults.codeQuality.overallScore)}</div>
              </div>
              <div>
                <div className="font-medium">Maintainability</div>
                <div className="text-lg">{formatPercentage(executionResults.codeQuality.maintainability)}</div>
              </div>
              <div>
                <div className="font-medium">Readability</div>
                <div className="text-lg">{formatPercentage(executionResults.codeQuality.readability)}</div>
              </div>
              <div>
                <div className="font-medium">Testability</div>
                <div className="text-lg">{formatPercentage(executionResults.codeQuality.testability)}</div>
              </div>
              <div>
                <div className="font-medium">Security</div>
                <div className="text-lg">{formatPercentage(executionResults.codeQuality.security)}</div>
              </div>
              <div>
                <div className="font-medium">Performance</div>
                <div className="text-lg">{formatPercentage(executionResults.codeQuality.performance)}</div>
              </div>
            </div>

            {/* Complexity Metrics */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Complexity Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Cyclomatic</div>
                  <div>{executionResults.codeQuality.complexity.cyclomaticComplexity}</div>
                </div>
                <div>
                  <div className="text-gray-600">Cognitive</div>
                  <div>{executionResults.codeQuality.complexity.cognitiveComplexity}</div>
                </div>
                <div>
                  <div className="text-gray-600">Lines of Code</div>
                  <div>{executionResults.codeQuality.complexity.linesOfCode}</div>
                </div>
                <div>
                  <div className="text-gray-600">Nesting Depth</div>
                  <div>{executionResults.codeQuality.complexity.nestingDepth}</div>
                </div>
              </div>
            </div>

            {/* Quality Issues */}
            {executionResults.codeQuality.issues.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Quality Issues</h4>
                <div className="space-y-2">
                  {executionResults.codeQuality.issues.map((issue: any, index: number) => (
                    <div key={index} className="bg-gray-50 border-l-4 border-gray-400 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{issue.message}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Line {issue.line} • Rule: {issue.rule} • Effort: {issue.effort}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.severity === 'blocker' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                executionResults.riskAssessment.safetyLevel === 'safe' ? 'bg-green-500' :
                executionResults.riskAssessment.safetyLevel === 'caution' ? 'bg-yellow-500' :
                executionResults.riskAssessment.safetyLevel === 'warning' ? 'bg-orange-500' :
                'bg-red-500'
              }`}></span>
              Risk Assessment
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="font-medium">Overall Risk</div>
                <div className="text-lg">{formatPercentage(executionResults.riskAssessment.overallRisk)}</div>
              </div>
              <div>
                <div className="font-medium">Safety Level</div>
                <div className="text-lg capitalize">{executionResults.riskAssessment.safetyLevel}</div>
              </div>
            </div>

            {/* Recommendations */}
            {executionResults.riskAssessment.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {executionResults.riskAssessment.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Overall Success */}
          <div className={`border rounded-lg p-4 ${
            executionResults.overallSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${
                executionResults.overallSuccess ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              Execution Result: {executionResults.overallSuccess ? 'SUCCESS' : 'FAILURE'}
            </h3>
            <p className={`text-sm ${
              executionResults.overallSuccess ? 'text-green-700' : 'text-red-700'
            }`}>
              {executionResults.overallSuccess 
                ? 'Patch executed successfully with acceptable risk and quality metrics.'
                : 'Patch execution failed or exceeded acceptable risk thresholds.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}