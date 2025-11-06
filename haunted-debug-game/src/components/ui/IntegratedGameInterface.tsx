/**
 * IntegratedGameInterface - Main game interface that orchestrates all systems
 * 
 * This component replaces the test interface with a complete game experience
 * integrating ghost encounters, dialogue, patch systems, navigation, and effects.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { GameAsset } from './GameAsset';
import { MeterGroup } from './AssetProgress';
import { GhostEncounterInterface } from './GhostEncounterInterface';
import { DialogueInterface } from './DialogueInterface';
import { PatchReviewInterface } from './PatchReviewInterface';
import { NavigationPanel } from './NavigationPanel';
import { EnhancedEvidenceBoard } from './EnhancedEvidenceBoard';
import { EnhancedMeterDisplay } from './EnhancedMeterDisplay';
import { EducationalFeedbackPanel } from './EducationalFeedbackPanel';
import { AccessibilityControls } from './AccessibilityControls';
import { useGameStore } from '@/store/gameStore';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useDialogueSession } from '@/hooks/useDialogueSession';
import { usePatchGeneration } from '@/hooks/usePatchGeneration';
import { useEffectCoordinator } from '@/hooks/useEffectCoordinator';
import { GameConditionDisplay } from './GameConditionDisplay';
import type { Ghost } from '@/types/content';
import type { DialogueSession } from '@/types/dialogue';
import type { PatchPlan } from '@/types/patch';
import type { GameConditionResult } from '@/engine/GameConditionManager';

interface GamePhase {
  type: 'room_navigation' | 'ghost_encounter' | 'dialogue' | 'patch_review' | 'educational_feedback';
  data?: any;
}

export interface IntegratedGameInterfaceProps {
  className?: string;
}

export function IntegratedGameInterface({ className }: IntegratedGameInterfaceProps) {
  // Game state
  const gameState = useGameStore();
  const { 
    meters, 
    currentRoom, 
    unlockedRooms,
    evidenceBoard,
    activeSessions,
    systemStates
  } = gameState;

  // Game engine integration
  const gameEngine = useGameEngine();
  
  // Current game phase and active components
  const [currentPhase, setCurrentPhase] = useState<GamePhase>({ type: 'room_navigation' });
  const [activeGhost, setActiveGhost] = useState<Ghost | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueSession | null>(null);
  const [activePatch, setActivePatch] = useState<PatchPlan | null>(null);
  const [showEducationalPanel, setShowEducationalPanel] = useState(false);
  const [showAccessibilityControls, setShowAccessibilityControls] = useState(false);
  const [showEvidenceBoard, setShowEvidenceBoard] = useState(false);
  const [gameConditions, setGameConditions] = useState<GameConditionResult[]>([]);

  // Hooks for specific systems
  const dialogueSession = useDialogueSession(activeDialogue?.id);
  const patchGeneration = usePatchGeneration();
  const effectCoordinator = useEffectCoordinator();

  // Initialize game engine on mount
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        await gameEngine.initialize();
        console.log('Game engine initialized successfully');
      } catch (error) {
        console.error('Failed to initialize game engine:', error);
      }
    };

    if (!gameEngine.isInitialized) {
      initializeEngine();
    }
  }, [gameEngine]);

  // Check game conditions when meters change
  useEffect(() => {
    if (gameEngine.isInitialized) {
      const conditions = gameEngine.checkGameConditions();
      if (conditions.length > 0) {
        setGameConditions(conditions);
      }
    }
  }, [meters, gameEngine]);

  // Handle ghost encounter start
  const handleEncounterStart = useCallback(async (ghostId: string) => {
    try {
      const session = await gameEngine.startEncounter(ghostId);
      const ghost = await gameEngine.getGhost(ghostId);
      
      setActiveGhost(ghost);
      setCurrentPhase({ type: 'ghost_encounter', data: { session, ghost } });
      
      // Trigger encounter start effects
      effectCoordinator.triggerEncounterStart(ghost);
      
    } catch (error) {
      console.error('Failed to start encounter:', error);
    }
  }, [gameEngine, effectCoordinator]);

  // Handle dialogue initiation
  const handleDialogueStart = useCallback(async (ghost: Ghost) => {
    try {
      const session = await dialogueSession.startDialogue(ghost);
      setActiveDialogue(session);
      setCurrentPhase({ type: 'dialogue', data: { session, ghost } });
      
      // Update game state
      gameState.setActiveSession(session);
      
    } catch (error) {
      console.error('Failed to start dialogue:', error);
    }
  }, [dialogueSession, gameState]);

  // Handle patch generation
  const handlePatchGeneration = useCallback(async (intent: string, ghost: Ghost) => {
    try {
      setCurrentPhase({ type: 'patch_review', data: { intent, ghost } });
      
      const patches = await patchGeneration.generatePatches(intent, ghost);
      setActivePatch(patches[0]); // Show first patch for review
      
    } catch (error) {
      console.error('Failed to generate patches:', error);
    }
  }, [patchGeneration]);

  // Handle patch application
  const handlePatchApplication = useCallback(async (patchId: string, action: 'apply' | 'refactor' | 'question') => {
    try {
      const result = await gameEngine.processPlayerAction({
        type: 'patch_action',
        patchId,
        patchAction: action,
        timestamp: new Date()
      });

      if (result.success) {
        // Show educational feedback
        setCurrentPhase({ 
          type: 'educational_feedback', 
          data: { result, patch: activePatch, action } 
        });
        
        // Update meters based on result
        if (result.effects) {
          gameState.updateMeters(result.effects);
        }
        
        // Add evidence entry
        gameState.addEvidenceEntry({
          type: 'patch_applied',
          description: `Applied patch: ${activePatch?.description || 'Unknown patch'}`,
          context: { 
            roomKey: currentRoom,
            ghostId: activeGhost?.id || '',
            patchId: activePatch?.id || ''
          },
          effects: result.effects || { stability: 0, insight: 0, description: '' }
        });
      }
      
    } catch (error) {
      console.error('Failed to apply patch:', error);
    }
  }, [gameEngine, gameState, activePatch, activeGhost, currentRoom]);

  // Handle room navigation
  const handleRoomNavigation = useCallback(async (roomId: string) => {
    try {
      const result = await gameEngine.navigateToRoom(roomId);
      
      if (result.success) {
        gameState.setCurrentRoom(roomId);
        gameState.unlockRoom(roomId);
        
        // Reset active components for new room
        setActiveGhost(null);
        setActiveDialogue(null);
        setActivePatch(null);
        setCurrentPhase({ type: 'room_navigation' });
        
        // Trigger room transition effects
        effectCoordinator.triggerRoomTransition(roomId);
      }
      
    } catch (error) {
      console.error('Failed to navigate to room:', error);
    }
  }, [gameEngine, gameState, effectCoordinator]);

  // Handle educational feedback completion
  const handleEducationalComplete = useCallback(() => {
    // Return to room navigation after educational feedback
    setCurrentPhase({ type: 'room_navigation' });
    setShowEducationalPanel(false);
  }, []);

  // Handle game condition actions
  const handleNewGame = useCallback(() => {
    gameState.resetGame();
    gameEngine.resetGameConditions();
    setGameConditions([]);
    setCurrentPhase({ type: 'room_navigation' });
  }, [gameState, gameEngine]);

  const handleConditionClose = useCallback(() => {
    setGameConditions([]);
  }, []);

  // Get room background asset
  const getRoomBackground = (roomKey: string) => {
    const roomAssets: Record<string, string> = {
      'boot-sector': 'boot-sector',
      'dependency-crypt': 'dependency-crypt',
      'ghost-memory-heap': 'memory-heap',
      'possessed-compiler': 'compiler',
      'ethics-tribunal': 'ethics-tribunal',
      'final-merge': 'final-merge'
    };
    return roomAssets[roomKey] || 'compiler';
  };

  // Render current phase content
  const renderPhaseContent = () => {
    switch (currentPhase.type) {
      case 'room_navigation':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-300 mb-2">
                {getRoomDisplayName(currentRoom)}
              </h2>
              <p className="text-gray-400">
                Explore this area and encounter the haunted code modules
              </p>
            </div>
            
            <GhostEncounterInterface
              roomKey={currentRoom}
              onEncounterStart={handleEncounterStart}
              showSummary={true}
            />
          </div>
        );

      case 'ghost_encounter':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-red-300">
                Encountering: {activeGhost?.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPhase({ type: 'room_navigation' })}
                className="text-gray-400 hover:text-white"
              >
                ← Back to Room
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 border border-red-700 rounded-lg">
                  <h3 className="text-white font-bold mb-2">Ghost Information</h3>
                  <p className="text-gray-300 text-sm mb-3">{activeGhost?.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Software Smell:</span>
                      <div className="text-white font-mono">
                        {activeGhost?.softwareSmell.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Severity:</span>
                      <div className="text-white">{activeGhost?.severity}/10</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="horror"
                    onClick={() => activeGhost && handleDialogueStart(activeGhost)}
                    className="flex-1"
                  >
                    Start Conversation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEducationalPanel(true)}
                    className="px-4"
                  >
                    📚 Learn
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-center p-8 bg-gray-900/30 border border-gray-700 rounded-lg">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-4">👻</div>
                  <p>Ghost visualization will appear here</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dialogue':
        return activeDialogue && (
          <DialogueInterface
            session={activeDialogue}
            onSendMessage={dialogueSession.sendMessage}
            onEndDialogue={() => setCurrentPhase({ type: 'ghost_encounter' })}
            onStartDebugging={() => activeGhost && handlePatchGeneration('debug', activeGhost)}
            availableQuestions={dialogueSession.getAvailableQuestions()}
            educationalContent={dialogueSession.getEducationalContent()}
            isLoading={dialogueSession.isLoading}
          />
        );

      case 'patch_review':
        return activePatch && (
          <PatchReviewInterface
            patch={activePatch}
            onApplyPatch={(action: 'apply' | 'refactor' | 'question') => handlePatchApplication('patch_id', action)}
            onBackToDialogue={() => setCurrentPhase({ type: 'dialogue' })}
            showEducationalContent={true}
          />
        );

      case 'educational_feedback':
        return (
          <EducationalFeedbackPanel
            result={currentPhase.data?.result}
            patch={currentPhase.data?.patch}
            action={currentPhase.data?.action}
            onComplete={handleEducationalComplete}
            onContinueExploring={() => setCurrentPhase({ type: 'room_navigation' })}
          />
        );

      default:
        return null;
    }
  };

  // Get room display name
  const getRoomDisplayName = (roomKey: string) => {
    const roomNames: Record<string, string> = {
      'boot-sector': 'Boot Sector',
      'dependency-crypt': 'Dependency Crypt',
      'ghost-memory-heap': 'Ghost Memory Heap',
      'possessed-compiler': 'Possessed Compiler',
      'ethics-tribunal': 'Ethics Tribunal',
      'final-merge': 'Final Merge'
    };
    return roomNames[roomKey] || roomKey;
  };

  return (
    <div className={cn("min-h-screen relative font-mono", className)}>
      {/* Dynamic room background */}
      <div className="fixed inset-0 game-background">
        <GameAsset
          category="rooms"
          name={getRoomBackground(currentRoom)}
          alt={`${getRoomDisplayName(currentRoom)} - Haunted debugging environment`}
          className="w-full h-full object-cover room-background"
          priority={true}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Main game interface */}
      <div className="relative game-content">
        {/* Header with game status */}
        <header className="p-4 border-b border-red-800 bg-gray-900/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-red-400 glitch-text">
                HAUNTED DEBUG
              </h1>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🛡️</span>
                  <span className="text-sm text-gray-300">Stability:</span>
                  <span className="text-lg font-mono text-white">{meters.stability}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🧠</span>
                  <span className="text-sm text-gray-300">Insight:</span>
                  <span className="text-lg font-mono text-white">{meters.insight}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEvidenceBoard(!showEvidenceBoard)}
                className="text-gray-400 hover:text-white"
              >
                📋 Evidence ({evidenceBoard.length})
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAccessibilityControls(!showAccessibilityControls)}
                className="text-gray-400 hover:text-white"
              >
                ⚙️ Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex">
          {/* Navigation sidebar */}
          <div className="w-64 border-r border-red-800 bg-gray-900/90 backdrop-blur-sm min-h-screen">
            <NavigationPanel
              currentRoom={currentRoom}
              unlockedRooms={unlockedRooms}
              onRoomSelect={handleRoomNavigation}
              className="p-4"
            />
          </div>

          {/* Main game area */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderPhaseContent()}
            </div>
          </div>

          {/* Meter sidebar */}
          <div className="w-80 border-l border-red-800 bg-gray-900/90 backdrop-blur-sm min-h-screen">
            <div className="p-4">
              <h2 className="text-lg font-bold text-red-300 mb-4">System Status</h2>
              <EnhancedMeterDisplay
                meters={meters}
                recentChanges={evidenceBoard
                  .filter(entry => entry.effects && (entry.effects.stability !== 0 || entry.effects.insight !== 0))
                  .slice(-10)
                  .map(entry => ({
                    id: entry.id,
                    type: entry.effects!.stability !== 0 ? 'stability' : 'insight',
                    change: entry.effects!.stability !== 0 ? entry.effects!.stability : entry.effects!.insight,
                    timestamp: entry.timestamp,
                    description: entry.description
                  }))
                }
                showTrends={true}
                showThresholds={true}
                onThresholdReached={(type, threshold) => {
                  // Handle threshold events - could trigger effects or notifications
                  effectCoordinator.triggerCriticalEvent(`${type}_threshold_${threshold}`, 0.8);
                }}
              />
            </div>
          </div>
        </div>

        {/* Overlay panels */}
        {showEvidenceBoard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-full max-w-6xl max-h-[90vh] bg-gray-900 border border-red-700 rounded-lg overflow-hidden">
              <EnhancedEvidenceBoard
                entries={evidenceBoard}
                onClose={() => setShowEvidenceBoard(false)}
                className="h-full"
              />
            </div>
          </div>
        )}

        {showEducationalPanel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-full max-w-3xl max-h-[80vh] bg-gray-900 border border-red-700 rounded-lg overflow-hidden">
              <EducationalFeedbackPanel
                ghost={activeGhost}
                onClose={() => setShowEducationalPanel(false)}
                className="h-full"
              />
            </div>
          </div>
        )}

        {showAccessibilityControls && (
          <div className="fixed top-4 right-4 z-50">
            <AccessibilityControls
              settings={systemStates.effects.accessibilitySettings}
              onSettingsChange={(settings) => {
                gameState.updateEffectCoordinatorState({
                  accessibilitySettings: { ...systemStates.effects.accessibilitySettings, ...settings }
                });
                setShowAccessibilityControls(false);
              }}
            />
          </div>
        )}

        {/* Game Condition Display */}
        {gameConditions.length > 0 && (
          <GameConditionDisplay
            conditions={gameConditions}
            onNewGame={handleNewGame}
            onContinue={handleConditionClose}
            onClose={handleConditionClose}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-red-800 bg-gray-900/95 backdrop-blur-sm p-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center space-x-4">
            <span>Room: {getRoomDisplayName(currentRoom)}</span>
            <span>Phase: {currentPhase.type.replace('_', ' ').toUpperCase()}</span>
            <span>Sessions: {Object.keys(activeSessions).length}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Encounters: {systemStates.encounters.completedEncounters.length}</span>
            <span>Evidence: {evidenceBoard.length}</span>
            <span className="cursor-blink">System Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}