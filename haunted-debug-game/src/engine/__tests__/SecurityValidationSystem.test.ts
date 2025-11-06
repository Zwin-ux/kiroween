/**
 * SecurityValidationSystem tests
 */

import { SecurityValidationSystem, SecurityViolationType, SecuritySeverity } from '../SecurityValidationSystem';
import type { PatchPlan } from '@/types/patch';
import type { ValidationContext } from '../SecurityValidationSystem';
import type { Ghost } from '@/types/content';

describe('SecurityValidationSystem', () => {
  let securitySystem: SecurityValidationSystem;
  let mockGhost: Ghost;
  let mockContext: ValidationContext;

  beforeEach(() => {
    securitySystem = new SecurityValidationSystem();
    
    mockGhost = {
      id: 'test-ghost',
      name: 'Test Ghost',
      severity: 5,
      softwareSmell: 'prompt_injection' as any,
      description: 'Test ghost for security validation',
      manifestation: {
        visual: 'Test visual',
        audio: 'Test audio',
        behavior: 'Test behavior'
      },
      dialoguePrompts: [],
      fixPatterns: [],
      hints: [],
      rooms: ['test-room']
    };

    mockContext = {
      ghost: mockGhost,
      gameState: {
        run: {
          id: 'test-run',
          startedAt: new Date(),
          finalStability: 50,
          finalInsight: 30,
          outcome: 'victory' as any
        },
        currentRoom: 'test-room',
        meters: { stability: 50, insight: 30 },
        unlockedRooms: ['test-room'],
        evidenceBoard: [],
        playerChoices: [],
        systemStates: {
          eventManager: { subscriptionCount: 0, recentEvents: [], errorCount: 0 },
          navigation: { currentRoomId: 'test-room', unlockedRooms: ['test-room'], roomTransitionHistory: [], pendingUnlocks: [] },
          effects: { 
            activeEffects: [], 
            accessibilitySettings: { 
              reduceMotion: false, 
              disableFlashing: false, 
              visualEffectIntensity: 1, 
              audioEffectVolume: 1, 
              alternativeText: false, 
              highContrast: false, 
              screenReaderSupport: false 
            }, 
            effectQueue: [], 
            performanceMode: 'high' as const
          },
          encounters: { activeEncounters: {}, completedEncounters: [], encounterHistory: [] },
          session: { 
            sessionId: 'test-session', 
            startTime: new Date(), 
            lastSaveTime: new Date(), 
            playTime: 0, 
            autoSaveEnabled: true, 
            saveInterval: 30000, 
            achievements: [], 
            learningProgress: [] 
          }
        }
      },
      playerIntent: 'Test security validation',
      riskTolerance: 0.5,
      educationalMode: true
    };
  });

  describe('Safe patch validation', () => {
    it('should approve safe patches', async () => {
      const safePatch: PatchPlan = {
        diff: `--- a/utils.js
+++ b/utils.js
@@ -1,3 +1,6 @@
 function processData(input) {
-  return input;
+  const sanitized = input.replace(/[<>]/g, '');
+  return sanitized.trim();
 }`,
        description: 'Add input sanitization',
        risk: 0.2,
        effects: { stability: 5, insight: 3, description: 'Improved security' },
        ghostResponse: 'Good approach!'
      };

      const result = await securitySystem.validatePatchSecurity(safePatch, mockContext);

      expect(result.isValid).toBe(true);
      expect(result.riskScore).toBeLessThan(0.5);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Dangerous patch detection', () => {
    it('should reject patches with eval()', async () => {
      const dangerousPatch: PatchPlan = {
        diff: `--- a/processor.js
+++ b/processor.js
@@ -1,3 +1,6 @@
 function executeCode(userInput) {
-  return null;
+  return eval(userInput);
 }`,
        description: 'Execute user input directly',
        risk: 0.9,
        effects: { stability: -15, insight: 2, description: 'Dangerous execution' },
        ghostResponse: 'This is very risky!'
      };

      const result = await securitySystem.validatePatchSecurity(dangerousPatch, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0.8);
      expect(result.violations.length).toBeGreaterThan(0);
      
      const evalViolation = result.violations.find(v => v.type === SecurityViolationType.UnsafeEval);
      expect(evalViolation).toBeDefined();
      expect(evalViolation?.severity).toBe(SecuritySeverity.Critical);
    });

    it('should detect XSS vulnerabilities', async () => {
      const xssPatch: PatchPlan = {
        diff: `--- a/template.js
+++ b/template.js
@@ -1,3 +1,6 @@
 function renderTemplate(data) {
-  return '<div>Static content</div>';
+  element.innerHTML = data.userContent;
 }`,
        description: 'Add dynamic content',
        risk: 0.6,
        effects: { stability: -5, insight: 1, description: 'XSS risk' },
        ghostResponse: 'Be careful with HTML!'
      };

      const result = await securitySystem.validatePatchSecurity(xssPatch, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      
      const xssViolation = result.violations.find(v => v.type === SecurityViolationType.XSS);
      expect(xssViolation).toBeDefined();
    });
  });

  describe('Educational content generation', () => {
    it('should generate educational content for violations', async () => {
      const dangerousPatch: PatchPlan = {
        diff: `--- a/test.js
+++ b/test.js
@@ -1,1 +1,3 @@
+eval(userInput);
+element.innerHTML = data;`,
        description: 'Multiple security issues',
        risk: 0.8,
        effects: { stability: -10, insight: 1, description: 'Multiple risks' },
        ghostResponse: 'Multiple problems detected!'
      };

      const result = await securitySystem.validatePatchSecurity(dangerousPatch, mockContext);

      expect(result.educationalContent.length).toBeGreaterThan(0);
      
      const evalContent = result.educationalContent.find(c => c.title.includes('eval'));
      expect(evalContent).toBeDefined();
      expect(evalContent?.examples.length).toBeGreaterThan(0);
      expect(evalContent?.bestPractices.length).toBeGreaterThan(0);
    });
  });

  describe('Rejection message generation', () => {
    it('should generate helpful rejection messages', async () => {
      const dangerousPatch: PatchPlan = {
        diff: `--- a/processor.js
+++ b/processor.js
@@ -1,3 +1,6 @@
 function executeCode(userInput) {
-  return null;
+  return eval(userInput);
 }`,
        description: 'Dangerous eval usage',
        risk: 0.9,
        effects: { stability: -20, insight: 1, description: 'Critical risk' },
        ghostResponse: 'This is dangerous!'
      };

      const result = await securitySystem.validatePatchSecurity(dangerousPatch, mockContext);
      const rejectionMessage = securitySystem.generateRejectionMessage(result);

      expect(rejectionMessage).toContain('Patch Rejected');
      expect(rejectionMessage).toContain('Security');
      expect(rejectionMessage).toContain('eval');
      expect(rejectionMessage).toContain('What You Can Do');
    });
  });

  describe('Operation whitelisting', () => {
    it('should allow safe operations', async () => {
      const safePatch: PatchPlan = {
        diff: `--- a/utils.js
+++ b/utils.js
@@ -1,3 +1,6 @@
 function processData(input) {
-  return input;
+  const result = Math.max(input.length, 0);
+  console.log('Processing complete');
+  return result;
 }`,
        description: 'Safe operations',
        risk: 0.1,
        effects: { stability: 2, insight: 1, description: 'Safe changes' },
        ghostResponse: 'Safe operations detected'
      };

      const result = await securitySystem.validatePatchSecurity(safePatch, mockContext);

      expect(result.isValid).toBe(true);
      expect(result.allowedOperations.length).toBeGreaterThan(0);
      expect(result.blockedOperations.length).toBe(0);
    });

    it('should block dangerous operations', async () => {
      const dangerousPatch: PatchPlan = {
        diff: `--- a/processor.js
+++ b/processor.js
@@ -1,1 +1,3 @@
+require('fs').readFileSync('/etc/passwd');
+process.exit(1);`,
        description: 'Dangerous system operations',
        risk: 0.8,
        effects: { stability: -15, insight: 1, description: 'System access' },
        ghostResponse: 'System access detected!'
      };

      const result = await securitySystem.validatePatchSecurity(dangerousPatch, mockContext);

      expect(result.isValid).toBe(false);
      expect(result.blockedOperations.length).toBeGreaterThan(0);
      expect(result.blockedOperations).toContain('require');
    });
  });
});