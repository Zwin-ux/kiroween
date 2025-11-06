/**
 * SecurityValidationExample - Demonstrates security validation system functionality
 */

'use client';

import React, { useState } from 'react';
import { SecurityEducationPanel } from '@/components/ui/SecurityEducationPanel';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';
import type { PatchPlan } from '@/types/patch';
import type { ValidationContext } from '@/engine/SecurityValidationSystem';
import type { Ghost, SoftwareSmell } from '@/types/content';

const EXAMPLE_PATCHES: Record<string, PatchPlan> = {
  safe: {
    diff: `--- a/utils.js
+++ b/utils.js
@@ -1,3 +1,6 @@
 function processData(input) {
-  return input;
+  const sanitized = input.replace(/[<>]/g, '');
+  return sanitized.trim();
 }`,
    description: 'Add input sanitization to prevent XSS',
    risk: 0.2,
    effects: { stability: 5, insight: 3, description: 'Improved security' },
    ghostResponse: 'Good approach to input validation!'
  },
  
  dangerous: {
    diff: `--- a/processor.js
+++ b/processor.js
@@ -1,3 +1,6 @@
 function executeCode(userInput) {
-  return null;
+  return eval(userInput);
 }`,
    description: 'Execute user input directly',
    risk: 0.9,
    effects: { stability: -15, insight: 2, description: 'Dangerous code execution' },
    ghostResponse: 'This is very risky!'
  },
  
  injection: {
    diff: `--- a/template.js
+++ b/template.js
@@ -1,3 +1,6 @@
 function renderTemplate(data) {
-  return '<div>Static content</div>';
+  return '<div>' + data.userContent + '</div>';
 }`,
    description: 'Add dynamic content to template',
    risk: 0.6,
    effects: { stability: -5, insight: 1, description: 'Potential XSS vulnerability' },
    ghostResponse: 'Be careful with user content in HTML!'
  },
  
  prototype: {
    diff: `--- a/config.js
+++ b/config.js
@@ -1,3 +1,6 @@
 function mergeConfig(userConfig) {
-  return Object.assign({}, defaultConfig);
+  return Object.assign({}, defaultConfig, userConfig);
 }`,
    description: 'Merge user configuration',
    risk: 0.7,
    effects: { stability: -8, insight: 2, description: 'Prototype pollution risk' },
    ghostResponse: 'Watch out for prototype pollution!'
  }
};

const EXAMPLE_GHOSTS: Record<string, Ghost> = {
  promptInjection: {
    id: 'prompt-injection-ghost',
    name: 'The Injection Phantom',
    severity: 8,
    softwareSmell: 'prompt_injection' as SoftwareSmell,
    description: 'A ghost that represents prompt injection vulnerabilities',
    manifestation: {
      visual: 'Flickering code fragments',
      audio: 'Whispered commands',
      behavior: 'Attempts to manipulate input'
    },
    dialoguePrompts: ['How can I protect against injection?'],
    fixPatterns: [],
    hints: ['Validate all user input'],
    rooms: ['security-lab']
  },
  
  dataLeak: {
    id: 'data-leak-ghost',
    name: 'The Leaky Specter',
    severity: 7,
    softwareSmell: 'data_leak' as SoftwareSmell,
    description: 'A ghost that represents data leak vulnerabilities',
    manifestation: {
      visual: 'Glowing data streams',
      audio: 'Dripping sounds',
      behavior: 'Exposes sensitive information'
    },
    dialoguePrompts: ['How do I prevent data leaks?'],
    fixPatterns: [],
    hints: ['Sanitize logging output'],
    rooms: ['security-lab']
  }
};

export function SecurityValidationExample() {
  const [selectedPatch, setSelectedPatch] = useState<string>('safe');
  const [selectedGhost, setSelectedGhost] = useState<string>('promptInjection');
  const [showResults, setShowResults] = useState(false);
  const { validatePatch, isValidating, lastValidationResult, error } = useSecurityValidation();

  const handleValidate = async () => {
    const patch = EXAMPLE_PATCHES[selectedPatch];
    const ghost = EXAMPLE_GHOSTS[selectedGhost];
    
    const context: ValidationContext = {
      ghost,
      gameState: {
        run: {
          id: 'test-run',
          startedAt: new Date(),
          finalStability: 50,
          finalInsight: 30,
          outcome: 'victory' as any
        },
        currentRoom: 'security-lab',
        meters: { stability: 50, insight: 30 },
        unlockedRooms: ['security-lab'],
        evidenceBoard: [],
        playerChoices: [],
        systemStates: {
          eventManager: { subscriptionCount: 0, recentEvents: [], errorCount: 0 },
          navigation: { currentRoomId: 'security-lab', unlockedRooms: ['security-lab'], roomTransitionHistory: [], pendingUnlocks: [] },
          effects: { activeEffects: [], accessibilitySettings: { reduceMotion: false, disableFlashing: false, visualEffectIntensity: 1, audioEffectVolume: 1, alternativeText: false, highContrast: false, screenReaderSupport: false }, effectQueue: [], performanceMode: 'high' },
          encounters: { activeEncounters: {}, completedEncounters: [], encounterHistory: [] },
          session: { sessionId: 'test-session', startTime: new Date(), lastSaveTime: new Date(), playTime: 0, autoSaveEnabled: true, saveInterval: 30000, achievements: [], learningProgress: [] }
        }
      },
      playerIntent: 'Testing security validation system',
      riskTolerance: 0.5,
      educationalMode: true
    };

    await validatePatch(patch, context);
    setShowResults(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-4xl">🛡️</span>
          <h1 className="text-3xl font-bold text-gray-900">Security Validation System</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Test the security validation system with different patch examples to see how it detects 
          vulnerabilities and provides educational feedback.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <span className="text-xl">📋</span>
          <span>Test Configuration</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patch Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Patch Example:
            </label>
            <div className="space-y-2">
              {Object.entries(EXAMPLE_PATCHES).map(([key, patch]) => (
                <label key={key} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="patch"
                    value={key}
                    checked={selectedPatch === key}
                    onChange={(e) => setSelectedPatch(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">{key}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        patch.risk < 0.3 ? 'bg-green-100 text-green-700' :
                        patch.risk < 0.7 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        Risk: {(patch.risk * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{patch.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Ghost Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Ghost Context:
            </label>
            <div className="space-y-2">
              {Object.entries(EXAMPLE_GHOSTS).map(([key, ghost]) => (
                <label key={key} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ghost"
                    value={key}
                    checked={selectedGhost === key}
                    onChange={(e) => setSelectedGhost(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{ghost.name}</div>
                    <p className="text-sm text-gray-600">{ghost.description}</p>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {ghost.softwareSmell}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Validate Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Run Security Validation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Patch Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patch Preview</h3>
        <div className="bg-gray-50 border rounded p-4">
          <pre className="text-sm overflow-x-auto">
            <code>{EXAMPLE_PATCHES[selectedPatch].diff}</code>
          </pre>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚠️</span>
            <span className="font-medium text-red-800">Validation Error</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Results */}
      {showResults && lastValidationResult && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Validation Results</h2>
          <SecurityEducationPanel 
            validationResult={lastValidationResult}
            rejectionMessage={
              !lastValidationResult.isValid 
                ? `This patch has been rejected due to security concerns. Risk score: ${(lastValidationResult.riskScore * 100).toFixed(1)}%`
                : undefined
            }
          />
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
        <div className="space-y-2 text-blue-800">
          <p>1. <strong>Select a patch example</strong> - Choose from safe, dangerous, injection, or prototype pollution examples</p>
          <p>2. <strong>Choose a ghost context</strong> - Different ghost types have different security considerations</p>
          <p>3. <strong>Run validation</strong> - Click the button to see how the security system analyzes the patch</p>
          <p>4. <strong>Review results</strong> - Explore the violations, educational content, and recommendations</p>
        </div>
      </div>
    </div>
  );
}