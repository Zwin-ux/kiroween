/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  GameOutcome,
  type GameState, 
  type GameRun, 
  type EvidenceEntry, 
  type PlayerChoice,
  type MeterEffects,
  type SystemStates,
  type EventManagerState,
  type NavigationState,
  type EffectCoordinatorState,
  type EncounterOrchestratorState,
  type SessionState,
  type SessionSummary,
  type LearningProgressEntry
} from '../types/game';
import type { DialogueSession } from '../types/dialogue';
import type { 
  DecisionPattern, 
  PlayerStatistics, 
  AdaptiveDifficulty 
} from '../types/playerChoice';
import { DecisionAnalytics } from '../engine/DecisionAnalytics';

interface GameStore extends GameState {
  // Dialogue state
  activeSessions: Record<string, DialogueSession>;
  
  // Decision analytics
  decisionAnalytics: DecisionAnalytics;
  playerStatistics: PlayerStatistics;
  adaptiveDifficulty: AdaptiveDifficulty;
  
  // Actions
  initializeGame: (userId?: string) => void;
  updateMeters: (effects: MeterEffects) => void;
  checkGameConditions: () => void;
  addEvidenceEntry: (entry: Omit<EvidenceEntry, 'id' | 'timestamp'>) => void;
  addPlayerChoice: (choice: Omit<PlayerChoice, 'id' | 'timestamp'>) => void;
  setCurrentRoom: (roomKey: string) => void;
  unlockRoom: (roomKey: string) => void;
  endGame: (outcome: GameOutcome) => void;
  resetGame: () => void;
  
  // Evidence timeline integration
  recordTimelineEntry: (entry: {
    category: string;
    description: string;
    context: Record<string, any>;
    effects?: MeterEffects;
    outcome?: 'success' | 'failure' | 'partial' | 'pending';
    learningPoints?: string[];
    conceptsInvolved?: string[];
    skillsApplied?: string[];
  }) => void;
  
  // Dialogue actions
  setActiveSession: (session: DialogueSession) => void;
  removeActiveSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<DialogueSession>) => void;
  
  // Decision tracking actions
  recordDecision: (choice: PlayerChoice, patch: any, ghost: any) => void;
  updateDecisionOutcome: (choiceId: string, result: any, finalMeters: { stability: number; insight: number }) => void;
  refreshAnalytics: () => void;
  getDecisionPatterns: (limit?: number) => DecisionPattern[];
  getPerformanceTrend: () => { timestamp: Date; metrics: any }[];
  
  // System state management actions
  updateEventManagerState: (state: Partial<EventManagerState>) => void;
  updateNavigationState: (state: Partial<NavigationState>) => void;
  updateEffectCoordinatorState: (state: Partial<EffectCoordinatorState>) => void;
  updateEncounterOrchestratorState: (state: Partial<EncounterOrchestratorState>) => void;
  updateSessionState: (state: Partial<SessionState>) => void;
  
  // System synchronization actions
  syncSystemStates: (systemStates: Partial<SystemStates>) => void;
  getSystemState: <T extends keyof SystemStates>(system: T) => SystemStates[T];
  resetSystemStates: () => void;
  
  // Session management actions
  createNewSession: (userId?: string) => string;
  saveCurrentSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<boolean>;
  getSessionSummary: () => SessionSummary;
  
  // Achievement and learning progress actions
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  updateLearningProgress: (concept: string, improvement: number) => void;
  getLearningInsights: () => LearningProgressEntry[];
}

const initialGameState: GameState = {
  run: {
    id: '',
    startedAt: new Date(),
    finalStability: 60,
    finalInsight: 10,
    outcome: GameOutcome.Victory
  },
  currentRoom: 'boot-sector',
  meters: {
    stability: 60,
    insight: 10
  },
  unlockedRooms: ['boot-sector'],
  evidenceBoard: [],
  playerChoices: [],
  systemStates: {
    eventManager: {
      subscriptionCount: 0,
      recentEvents: [],
      errorCount: 0
    },
    navigation: {
      currentRoomId: 'boot-sector',
      unlockedRooms: ['boot-sector'],
      roomTransitionHistory: [],
      pendingUnlocks: []
    },
    effects: {
      activeEffects: [],
      accessibilitySettings: {
        reduceMotion: false,
        disableFlashing: false,
        visualEffectIntensity: 1.0,
        audioEffectVolume: 1.0,
        alternativeText: false,
        highContrast: false,
        screenReaderSupport: false
      },
      effectQueue: [],
      performanceMode: 'high'
    },
    encounters: {
      activeEncounters: {},
      completedEncounters: [],
      encounterHistory: []
    },
    session: {
      sessionId: '',
      startTime: new Date(),
      lastSaveTime: new Date(),
      playTime: 0,
      autoSaveEnabled: true,
      saveInterval: 30000, // 30 seconds
      achievements: [],
      learningProgress: []
    }
  }
};

const initialStoreState = {
  ...initialGameState,
  activeSessions: {} as Record<string, DialogueSession>,
  decisionAnalytics: new DecisionAnalytics(),
  playerStatistics: {
    totalChoices: 0,
    choiceBreakdown: { apply: 0, refactor: 0, question: 0 },
    averageRiskTolerance: 0.5,
    preferredApproach: 'analytical' as const,
    learningStyle: 'hands_on' as const,
    successRate: 0.5,
    improvementTrend: 0
  },
  adaptiveDifficulty: {
    currentLevel: 5,
    adjustmentFactors: {
      successRate: 0.5,
      riskTolerance: 0.5,
      learningProgress: 0.5,
      engagementLevel: 0.5
    },
    recommendations: {
      ghostComplexity: 'moderate' as const,
      patchRiskRange: [0.2, 0.8] as [number, number],
      educationalSupport: 'moderate' as const,
      hintFrequency: 'occasional' as const
    }
  }
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialStoreState,

        initializeGame: (userId?: string) => {
          const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          set({
            ...initialStoreState,
            run: {
              id: runId,
              userId,
              startedAt: new Date(),
              finalStability: 60,
              finalInsight: 10,
              outcome: GameOutcome.Victory
            }
          });
        },

        updateMeters: (effects: MeterEffects) => {
          set((state) => {
            const newStability = Math.max(0, Math.min(100, state.meters.stability + effects.stability));
            const newInsight = Math.max(0, Math.min(100, state.meters.insight + effects.insight));
            
            return {
              meters: {
                stability: newStability,
                insight: newInsight
              },
              run: {
                ...state.run,
                finalStability: newStability,
                finalInsight: newInsight
              }
            };
          });
        },

        checkGameConditions: () => {
          // This will be called by components that have access to the game engine
          // The actual condition checking is done in the GameEngine
        },

        addEvidenceEntry: (entry) => {
          set((state) => ({
            evidenceBoard: [
              ...state.evidenceBoard,
              {
                ...entry,
                id: `evidence_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                timestamp: new Date()
              }
            ]
          }));
        },

        addPlayerChoice: (choice) => {
          set((state) => ({
            playerChoices: [
              ...state.playerChoices,
              {
                ...choice,
                id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                timestamp: new Date()
              }
            ]
          }));
        },

        setCurrentRoom: (roomKey: string) => {
          set({ currentRoom: roomKey });
        },

        unlockRoom: (roomKey: string) => {
          set((state) => ({
            unlockedRooms: state.unlockedRooms.includes(roomKey) 
              ? state.unlockedRooms 
              : [...state.unlockedRooms, roomKey]
          }));
        },

        endGame: (outcome: GameOutcome) => {
          set((state) => ({
            run: {
              ...state.run,
              endedAt: new Date(),
              outcome
            }
          }));
        },

        resetGame: () => {
          set(initialStoreState);
        },

        // Evidence timeline integration
        recordTimelineEntry: (entry) => {
          // Add to legacy evidence board for compatibility
          get().addEvidenceEntry({
            type: entry.category as any,
            description: entry.description,
            context: entry.context,
            effects: entry.effects
          });
          
          // The actual timeline recording will be handled by the useEvidenceTimeline hook
          // This method provides a bridge for components that don't have direct access to the hook
        },

        // Dialogue actions
        setActiveSession: (session: DialogueSession) => {
          set((state) => ({
            activeSessions: {
              ...state.activeSessions,
              [session.id]: session
            }
          }));
        },

        removeActiveSession: (sessionId: string) => {
          set((state) => {
            const { [sessionId]: removed, ...remaining } = state.activeSessions;
            return { activeSessions: remaining };
          });
        },

        updateSession: (sessionId: string, updates: Partial<DialogueSession>) => {
          set((state) => ({
            activeSessions: {
              ...state.activeSessions,
              [sessionId]: {
                ...state.activeSessions[sessionId],
                ...updates
              }
            }
          }));
        },

        // Decision tracking actions
        recordDecision: (choice: PlayerChoice, patch: any, ghost: any) => {
          const state = get();
          
          // Convert game PlayerChoice to analytics PlayerChoice
          const analyticsChoice = {
            type: choice.action,
            patchId: patch.id,
            timestamp: choice.timestamp,
            questionAsked: choice.intent.includes('question') ? choice.intent : undefined
          };
          
          state.decisionAnalytics.recordDecision(
            analyticsChoice,
            patch,
            ghost,
            state.meters,
            state.currentRoom,
            state.run.userId || 'anonymous'
          );
          
          // Update player statistics
          const newStats = { ...state.playerStatistics };
          newStats.totalChoices++;
          newStats.choiceBreakdown[choice.action as keyof typeof newStats.choiceBreakdown]++;
          
          set({ playerStatistics: newStats });
        },

        updateDecisionOutcome: (choiceId: string, result: any, finalMeters: { stability: number; insight: number }) => {
          const state = get();
          state.decisionAnalytics.updateDecisionOutcome(choiceId, result, finalMeters);
          
          // Refresh analytics after outcome update
          get().refreshAnalytics();
        },

        refreshAnalytics: () => {
          const state = get();
          const performance = state.decisionAnalytics.calculatePerformanceMetrics();
          const difficulty = state.decisionAnalytics.generateAdaptiveDifficulty();
          
          set({
            playerStatistics: {
              ...state.playerStatistics,
              successRate: performance.successRate,
              improvementTrend: performance.improvementRate,
              averageRiskTolerance: difficulty.adjustmentFactors.riskTolerance
            },
            adaptiveDifficulty: difficulty
          });
        },

        getDecisionPatterns: (limit?: number) => {
          return get().decisionAnalytics.getDecisionPatterns(limit);
        },

        getPerformanceTrend: () => {
          return get().decisionAnalytics.getPerformanceTrend();
        },

        // System state management actions
        updateEventManagerState: (state: Partial<EventManagerState>) => {
          set((current) => ({
            systemStates: {
              ...current.systemStates,
              eventManager: {
                ...current.systemStates.eventManager,
                ...state
              }
            }
          }));
        },

        updateNavigationState: (state: Partial<NavigationState>) => {
          set((current) => ({
            systemStates: {
              ...current.systemStates,
              navigation: {
                ...current.systemStates.navigation,
                ...state
              }
            }
          }));
        },

        updateEffectCoordinatorState: (state: Partial<EffectCoordinatorState>) => {
          set((current) => ({
            systemStates: {
              ...current.systemStates,
              effects: {
                ...current.systemStates.effects,
                ...state
              }
            }
          }));
        },

        updateEncounterOrchestratorState: (state: Partial<EncounterOrchestratorState>) => {
          set((current) => ({
            systemStates: {
              ...current.systemStates,
              encounters: {
                ...current.systemStates.encounters,
                ...state
              }
            }
          }));
        },

        updateSessionState: (state: Partial<SessionState>) => {
          set((current) => ({
            systemStates: {
              ...current.systemStates,
              session: {
                ...current.systemStates.session,
                ...state,
                lastSaveTime: new Date()
              }
            }
          }));
        },

        // System synchronization actions
        syncSystemStates: (systemStates: Partial<SystemStates>) => {
          set((current) => ({
            systemStates: {
              ...current.systemStates,
              ...systemStates
            }
          }));
        },

        getSystemState: <T extends keyof SystemStates>(system: T): SystemStates[T] => {
          return get().systemStates[system];
        },

        resetSystemStates: () => {
          set((current) => ({
            systemStates: {
              ...initialGameState.systemStates,
              session: {
                ...initialGameState.systemStates.session,
                sessionId: current.systemStates.session.sessionId,
                startTime: current.systemStates.session.startTime
              }
            }
          }));
        },

        // Session management actions
        createNewSession: (userId?: string): string => {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const startTime = new Date();
          
          set((current) => ({
            ...initialGameState,
            run: {
              ...initialGameState.run,
              id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              userId,
              startedAt: startTime
            },
            systemStates: {
              ...initialGameState.systemStates,
              session: {
                ...initialGameState.systemStates.session,
                sessionId,
                startTime,
                lastSaveTime: startTime
              }
            }
          }));
          
          return sessionId;
        },

        saveCurrentSession: async (): Promise<void> => {
          const state = get();
          const sessionData = {
            sessionId: state.systemStates.session.sessionId,
            gameState: {
              run: state.run,
              currentRoom: state.currentRoom,
              meters: state.meters,
              unlockedRooms: state.unlockedRooms,
              evidenceBoard: state.evidenceBoard,
              playerChoices: state.playerChoices,
              systemStates: state.systemStates
            },
            timestamp: new Date(),
            systemStates: state.systemStates,
            metadata: {
              userId: state.run.userId,
              version: '1.0.0',
              playTime: state.systemStates.session.playTime,
              achievements: state.systemStates.session.achievements.filter(a => a.unlocked).map(a => a.id),
              statistics: {
                encountersCompleted: state.systemStates.encounters.completedEncounters.length,
                roomsVisited: state.systemStates.navigation.roomTransitionHistory.length + 1,
                patchesApplied: state.playerChoices.filter(c => c.action === 'apply').length,
                totalChoices: state.playerChoices.length,
                averageSessionLength: state.systemStates.session.playTime,
                learningProgress: state.systemStates.session.learningProgress.reduce((avg, lp) => avg + lp.masteryLevel, 0) / Math.max(1, state.systemStates.session.learningProgress.length)
              }
            }
          };

          try {
            // Save to localStorage (SessionManager will handle this)
            const sessions = JSON.parse(localStorage.getItem('haunted-debug-sessions') || '[]');
            const existingIndex = sessions.findIndex((s: any) => s.id === sessionData.sessionId);
            
            if (existingIndex >= 0) {
              sessions[existingIndex] = sessionData;
            } else {
              sessions.push(sessionData);
            }
            
            localStorage.setItem('haunted-debug-sessions', JSON.stringify(sessions));
            
            // Update last save time
            get().updateSessionState({ lastSaveTime: new Date() });
            
            console.log(`Session ${sessionData.sessionId} saved successfully`);
          } catch (error) {
            console.error('Failed to save session:', error);
            throw error;
          }
        },

        loadSession: async (sessionId: string): Promise<boolean> => {
          try {
            const sessions = JSON.parse(localStorage.getItem('haunted-debug-sessions') || '[]');
            const sessionData = sessions.find((s: any) => s.id === sessionId);
            
            if (!sessionData) {
              console.warn(`Session ${sessionId} not found`);
              return false;
            }

            // Restore game state
            set({
              ...sessionData.gameState,
              // Restore non-persisted state
              activeSessions: {},
              decisionAnalytics: new DecisionAnalytics(),
              playerStatistics: get().playerStatistics,
              adaptiveDifficulty: get().adaptiveDifficulty
            });

            console.log(`Session ${sessionId} loaded successfully`);
            return true;
          } catch (error) {
            console.error('Failed to load session:', error);
            return false;
          }
        },

        getSessionSummary: (): SessionSummary => {
          const state = get();
          return {
            sessionId: state.systemStates.session.sessionId,
            playTime: state.systemStates.session.playTime,
            roomsVisited: state.systemStates.navigation.roomTransitionHistory.length + 1,
            encountersCompleted: state.systemStates.encounters.completedEncounters.length,
            achievementsUnlocked: state.systemStates.session.achievements.filter(a => a.unlocked).length,
            currentMeters: { ...state.meters },
            learningProgress: state.systemStates.session.learningProgress.reduce((avg, lp) => avg + lp.masteryLevel, 0) / Math.max(1, state.systemStates.session.learningProgress.length),
            lastSaved: state.systemStates.session.lastSaveTime
          };
        },

        // Achievement and learning progress actions
        updateAchievementProgress: (achievementId: string, progress: number) => {
          set((current) => {
            const achievements = [...current.systemStates.session.achievements];
            const existingIndex = achievements.findIndex(a => a.id === achievementId);
            
            if (existingIndex >= 0) {
              achievements[existingIndex] = {
                ...achievements[existingIndex],
                progress: Math.min(progress, achievements[existingIndex].maxProgress)
              };
            } else {
              achievements.push({
                id: achievementId,
                progress,
                maxProgress: 100, // Default max progress
                unlocked: false
              });
            }
            
            return {
              systemStates: {
                ...current.systemStates,
                session: {
                  ...current.systemStates.session,
                  achievements
                }
              }
            };
          });
        },

        unlockAchievement: (achievementId: string) => {
          set((current) => {
            const achievements = [...current.systemStates.session.achievements];
            const existingIndex = achievements.findIndex(a => a.id === achievementId);
            
            if (existingIndex >= 0) {
              achievements[existingIndex] = {
                ...achievements[existingIndex],
                unlocked: true,
                unlockedAt: new Date(),
                progress: achievements[existingIndex].maxProgress
              };
            } else {
              achievements.push({
                id: achievementId,
                progress: 100,
                maxProgress: 100,
                unlocked: true,
                unlockedAt: new Date()
              });
            }
            
            return {
              systemStates: {
                ...current.systemStates,
                session: {
                  ...current.systemStates.session,
                  achievements
                }
              }
            };
          });
        },

        updateLearningProgress: (concept: string, improvement: number) => {
          set((current) => {
            const learningProgress = [...current.systemStates.session.learningProgress];
            const existingIndex = learningProgress.findIndex(lp => lp.concept === concept);
            
            if (existingIndex >= 0) {
              const existing = learningProgress[existingIndex];
              learningProgress[existingIndex] = {
                ...existing,
                practiceCount: existing.practiceCount + 1,
                lastPracticed: new Date(),
                improvementTrend: improvement,
                masteryLevel: Math.min(1.0, existing.masteryLevel + improvement * 0.1)
              };
            } else {
              learningProgress.push({
                concept,
                masteryLevel: improvement * 0.1,
                practiceCount: 1,
                lastPracticed: new Date(),
                improvementTrend: improvement
              });
            }
            
            return {
              systemStates: {
                ...current.systemStates,
                session: {
                  ...current.systemStates.session,
                  learningProgress
                }
              }
            };
          });
        },

        getLearningInsights: (): LearningProgressEntry[] => {
          return get().systemStates.session.learningProgress;
        }
      }),
      {
        name: 'haunted-debug-game-storage',
        partialize: (state) => ({
          run: state.run,
          currentRoom: state.currentRoom,
          meters: state.meters,
          unlockedRooms: state.unlockedRooms,
          evidenceBoard: state.evidenceBoard,
          playerChoices: state.playerChoices,
          systemStates: state.systemStates,
          activeSessions: state.activeSessions,
          playerStatistics: state.playerStatistics,
          adaptiveDifficulty: state.adaptiveDifficulty
          // Note: decisionAnalytics is not persisted as it contains methods
        })
      }
    ),
    { name: 'GameStore' }
  )
);