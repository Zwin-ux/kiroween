/**
 * HauntedGameInterface - Complete atmospheric game interface
 */

import React, { useEffect, useState } from 'react';
import { RoomAtmosphere } from './RoomAtmosphere';
import { EnhancedGhostRenderer } from './EnhancedGhostRenderer';
import { 
  TerminalPanel, 
  IndustrialButton, 
  ProgressRing, 
  MeterDisplay, 
  CodeRune,
  IndustrialCard,
  StatusIndicator,
  CompileEvent
} from './IndustrialUI';
import { atmosphericAudio } from '@/lib/atmosphericAudio';
import { cn } from '@/lib/utils';

interface GameState {
  currentRoom: string;
  stability: number;
  insight: number;
  activeGhost?: string;
  encounterInProgress: boolean;
  compileEvents: CompileEventData[];
}

interface CompileEventData {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface GhostData {
  id: string;
  type: string;
  name: string;
  severity: number;
  isEncountered: boolean;
  isResolved: boolean;
}

export function HauntedGameInterface() {
  const [gameState, setGameState] = useState<GameState>({
    currentRoom: 'boot-sector',
    stability: 75,
    insight: 45,
    encounterInProgress: false,
    compileEvents: []
  });

  const [ghosts, setGhosts] = useState<GhostData[]>([
    {
      id: 'ghost-1',
      type: 'circular_dependency',
      name: 'The Ouroboros',
      severity: 7,
      isEncountered: false,
      isResolved: false
    },
    {
      id: 'ghost-2',
      type: 'stale_cache',
      name: 'The Lingerer',
      severity: 5,
      isEncountered: false,
      isResolved: false
    },
    {
      id: 'ghost-3',
      type: 'unbounded_recursion',
      name: 'The Infinite Echo',
      severity: 9,
      isEncountered: true,
      isResolved: false
    }
  ]);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState(0.7);

  // Initialize audio system
  useEffect(() => {
    atmosphericAudio.initialize();
    return () => {
      atmosphericAudio.stopAll();
    };
  }, []);

  // Load room soundscape when room changes
  useEffect(() => {
    if (audioEnabled) {
      atmosphericAudio.loadRoomSoundscape(gameState.currentRoom);
    }
  }, [gameState.currentRoom, audioEnabled]);

  // Update audio based on stability
  useEffect(() => {
    atmosphericAudio.updateStabilityLevel(gameState.stability);
  }, [gameState.stability]);

  // Handle audio settings
  useEffect(() => {
    atmosphericAudio.setMasterVolume(audioEnabled ? masterVolume : 0);
  }, [audioEnabled, masterVolume]);

  const handleGhostEncounter = (ghostId: string) => {
    const ghost = ghosts.find(g => g.id === ghostId);
    if (!ghost || ghost.isResolved) return;

    setGameState(prev => ({
      ...prev,
      activeGhost: ghostId,
      encounterInProgress: true
    }));

    // Play ghost encounter sound
    atmosphericAudio.playGhostSound(ghost.type, 'encounter');

    // Add compile event
    addCompileEvent('warning', `Encountered ${ghost.name} - system instability detected`);
  };

  const handlePatchApplication = (success: boolean) => {
    const eventType = success ? 'success' : 'error';
    const stabilityChange = success ? 10 : -15;
    const insightChange = success ? 5 : 2;

    setGameState(prev => ({
      ...prev,
      stability: Math.max(0, Math.min(100, prev.stability + stabilityChange)),
      insight: Math.max(0, Math.min(100, prev.insight + insightChange)),
      encounterInProgress: false,
      activeGhost: undefined
    }));

    // Play compile event sound
    atmosphericAudio.playCompileEvent(eventType);

    // Add compile event
    const message = success 
      ? 'Patch applied successfully - system stability improved'
      : 'Patch application failed - system instability increased';
    addCompileEvent(eventType, message);

    // Mark ghost as resolved if successful
    if (success && gameState.activeGhost) {
      setGhosts(prev => prev.map(ghost => 
        ghost.id === gameState.activeGhost 
          ? { ...ghost, isResolved: true }
          : ghost
      ));
      
      const ghost = ghosts.find(g => g.id === gameState.activeGhost);
      if (ghost) {
        atmosphericAudio.playGhostSound(ghost.type, 'resolution');
      }
    }
  };

  const addCompileEvent = (type: 'success' | 'warning' | 'error', message: string) => {
    const newEvent: CompileEventData = {
      id: `event-${Date.now()}`,
      type,
      message,
      timestamp: new Date()
    };

    setGameState(prev => ({
      ...prev,
      compileEvents: [newEvent, ...prev.compileEvents.slice(0, 9)] // Keep last 10 events
    }));
  };

  const navigateToRoom = (roomId: string) => {
    setGameState(prev => ({
      ...prev,
      currentRoom: roomId,
      encounterInProgress: false,
      activeGhost: undefined
    }));
    
    addCompileEvent('success', `Navigated to ${roomId.replace('-', ' ')}`);
  };

  const roomGhosts = ghosts.filter(ghost => {
    // Simple room assignment logic - in real game this would be more sophisticated
    const roomAssignments: Record<string, string[]> = {
      'boot-sector': ['stale_cache', 'data_leak'],
      'dependency-crypt': ['circular_dependency', 'dead_code'],
      'ghost-memory-heap': ['memory_leak', 'unbounded_recursion'],
      'possessed-compiler': ['prompt_injection', 'race_condition'],
      'ethics-tribunal': ['data_leak', 'prompt_injection'],
      'final-merge': ['race_condition', 'memory_leak']
    };
    
    return roomAssignments[gameState.currentRoom]?.includes(ghost.type) || false;
  });

  return (
    <RoomAtmosphere 
      roomId={gameState.currentRoom} 
      intensity={0.6}
      stabilityLevel={gameState.stability}
      className="min-h-screen"
    >
      <div className="container mx-auto p-4 grid grid-cols-12 gap-4 min-h-screen">
        
        {/* Left Panel - System Status */}
        <div className="col-span-3 space-y-4">
          <TerminalPanel title="System Status" glowColor="var(--light-stability)">
            <div className="space-y-4">
              {/* Stability Meter */}
              <div className="flex items-center gap-4">
                <ProgressRing 
                  progress={gameState.stability} 
                  color="var(--light-stability)"
                  label={`${gameState.stability}%`}
                />
                <div className="flex-1">
                  <MeterDisplay
                    label="Stability"
                    value={gameState.stability}
                    warningThreshold={30}
                    dangerThreshold={10}
                  />
                </div>
              </div>

              {/* Insight Meter */}
              <div className="flex items-center gap-4">
                <ProgressRing 
                  progress={gameState.insight} 
                  color="var(--light-insight)"
                  label={`${gameState.insight}%`}
                />
                <div className="flex-1">
                  <MeterDisplay
                    label="Insight"
                    value={gameState.insight}
                    color="var(--light-insight)"
                    warningThreshold={20}
                    dangerThreshold={5}
                  />
                </div>
              </div>

              {/* System Status */}
              <div className="pt-2 border-t border-gray-600">
                <StatusIndicator
                  status={
                    gameState.stability > 70 ? 'stable' :
                    gameState.stability > 30 ? 'warning' :
                    gameState.stability > 10 ? 'error' : 'critical'
                  }
                  label="System Health"
                />
              </div>
            </div>
          </TerminalPanel>

          {/* Audio Controls */}
          <TerminalPanel title="Audio Control" glowColor="var(--metal-bronze)">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">Audio</span>
                <IndustrialButton
                  size="sm"
                  variant={audioEnabled ? 'success' : 'secondary'}
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ? 'ON' : 'OFF'}
                </IndustrialButton>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-mono">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={!audioEnabled}
                />
              </div>
            </div>
          </TerminalPanel>

          {/* Navigation */}
          <TerminalPanel title="Navigation" glowColor="var(--light-dataflow)">
            <div className="space-y-2">
              {[
                { id: 'boot-sector', name: 'Boot Sector' },
                { id: 'dependency-crypt', name: 'Dependency Crypt' },
                { id: 'ghost-memory-heap', name: 'Memory Heap' },
                { id: 'possessed-compiler', name: 'Compiler Core' },
                { id: 'ethics-tribunal', name: 'Ethics Tribunal' },
                { id: 'final-merge', name: 'Final Merge' }
              ].map(room => (
                <IndustrialButton
                  key={room.id}
                  size="sm"
                  variant={gameState.currentRoom === room.id ? 'primary' : 'secondary'}
                  onClick={() => navigateToRoom(room.id)}
                  className="w-full text-left justify-start"
                >
                  <CodeRune type="arrow" size="sm" className="mr-2" />
                  {room.name}
                </IndustrialButton>
              ))}
            </div>
          </TerminalPanel>
        </div>

        {/* Center Panel - Main Game Area */}
        <div className="col-span-6 space-y-4">
          <TerminalPanel 
            title={`Current Room: ${gameState.currentRoom.replace('-', ' ')}`}
            glowColor="var(--room-primary)"
            isActive={gameState.encounterInProgress}
          >
            <div className="min-h-96 flex flex-col items-center justify-center space-y-6">
              
              {/* Room Ghosts */}
              <div className="flex flex-wrap gap-6 justify-center">
                {roomGhosts.map(ghost => (
                  <EnhancedGhostRenderer
                    key={ghost.id}
                    ghostType={ghost.type}
                    severity={ghost.severity}
                    isActive={gameState.activeGhost === ghost.id}
                    isEncountered={ghost.isEncountered}
                    stabilityLevel={gameState.stability}
                    onClick={() => handleGhostEncounter(ghost.id)}
                  />
                ))}
              </div>

              {/* Encounter Interface */}
              {gameState.encounterInProgress && (
                <IndustrialCard
                  title="Ghost Encounter"
                  subtitle="Choose your debugging approach"
                  glowColor="var(--light-error)"
                  className="w-full max-w-md"
                >
                  <div className="space-y-4">
                    <p className="font-mono text-sm text-gray-300">
                      A malevolent presence corrupts the code. How will you proceed?
                    </p>
                    
                    <div className="flex gap-2">
                      <IndustrialButton
                        variant="primary"
                        onClick={() => handlePatchApplication(Math.random() > 0.3)}
                      >
                        Apply Patch
                      </IndustrialButton>
                      
                      <IndustrialButton
                        variant="secondary"
                        onClick={() => handlePatchApplication(Math.random() > 0.2)}
                      >
                        Refactor
                      </IndustrialButton>
                      
                      <IndustrialButton
                        variant="success"
                        onClick={() => {
                          setGameState(prev => ({ ...prev, insight: prev.insight + 3 }));
                          addCompileEvent('success', 'Gained insight through careful analysis');
                        }}
                      >
                        Question
                      </IndustrialButton>
                    </div>
                  </div>
                </IndustrialCard>
              )}

              {/* Room Description */}
              {!gameState.encounterInProgress && (
                <div className="text-center max-w-md">
                  <p className="font-mono text-sm text-gray-400 leading-relaxed">
                    {getRoomDescription(gameState.currentRoom)}
                  </p>
                </div>
              )}
            </div>
          </TerminalPanel>
        </div>

        {/* Right Panel - Events & Info */}
        <div className="col-span-3 space-y-4">
          
          {/* Compile Events */}
          <TerminalPanel title="Compile Events" glowColor="var(--light-compile)">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gameState.compileEvents.length === 0 ? (
                <p className="text-sm text-gray-500 font-mono">No events yet...</p>
              ) : (
                gameState.compileEvents.map(event => (
                  <CompileEvent
                    key={event.id}
                    type={event.type}
                    message={event.message}
                    timestamp={event.timestamp}
                  />
                ))
              )}
            </div>
          </TerminalPanel>

          {/* Ghost Registry */}
          <TerminalPanel title="Ghost Registry" glowColor="var(--metal-brass)">
            <div className="space-y-3">
              {ghosts.map(ghost => (
                <div 
                  key={ghost.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded border",
                    ghost.isResolved ? "border-green-500/30 bg-green-500/10" :
                    ghost.isEncountered ? "border-yellow-500/30 bg-yellow-500/10" :
                    "border-gray-600/30 bg-gray-600/10"
                  )}
                >
                  <div className="w-8 h-8">
                    <EnhancedGhostRenderer
                      ghostType={ghost.type}
                      severity={ghost.severity}
                      isEncountered={ghost.isEncountered}
                      stabilityLevel={gameState.stability}
                      className="scale-50"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold truncate">
                      {ghost.name}
                    </p>
                    <p className="font-mono text-xs text-gray-400">
                      Severity: {ghost.severity}
                    </p>
                  </div>
                  
                  <StatusIndicator
                    status={
                      ghost.isResolved ? 'stable' :
                      ghost.isEncountered ? 'warning' : 'error'
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </TerminalPanel>

          {/* Code Runes Display */}
          <TerminalPanel title="System Runes" glowColor="var(--code-success)">
            <div className="flex justify-center gap-4 py-4">
              <CodeRune type="bracket" animated />
              <CodeRune type="arrow" animated />
              <CodeRune type="slash" animated />
              <CodeRune type="semicolon" animated />
            </div>
          </TerminalPanel>
        </div>
      </div>
    </RoomAtmosphere>
  );
}

function getRoomDescription(roomId: string): string {
  const descriptions: Record<string, string> = {
    'boot-sector': 'The system awakens with ghostly phosphorescence. Ancient configuration files whisper secrets of their corruption.',
    'dependency-crypt': 'Import statements form twisted pathways. In the shadows, circular references create impossible geometries.',
    'ghost-memory-heap': 'Allocated memory refuses to die. Ghostly objects float in space, their references glowing with unnatural light.',
    'possessed-compiler': 'The compilation pipeline writhes with corrupted optimizations. Syntax trees grow like twisted metal sculptures.',
    'ethics-tribunal': 'Moral code pillars glow with ethical decisions. A spectral judge presides over cases of data privacy and AI behavior.',
    'final-merge': 'All branches converge here. The master branch awaits your final commits, but remaining spirits make their last stand.'
  };
  
  return descriptions[roomId] || 'A mysterious chamber filled with haunted code.';
}