/**
 * SessionManager - Handles game sessions, persistence, and progress tracking
 */

import type { GameState, GameRun, SystemStates } from '@/types/game';
import { GameOutcome } from '@/types/game';
import { EventManager, GameEventType } from './EventManager';

export interface GameSession {
  id: string;
  gameState: GameState;
  timestamp: Date;
  systemStates: SystemStates;
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  userId?: string;
  deviceInfo?: string;
  version: string;
  playTime: number;
  achievements: string[];
  statistics: SessionStatistics;
}

export interface SessionStatistics {
  encountersCompleted: number;
  roomsVisited: number;
  patchesApplied: number;
  totalChoices: number;
  averageSessionLength: number;
  learningProgress: number;
}

export interface ProgressExport {
  sessions: GameSession[];
  totalStats: SessionStatistics;
  achievements: Achievement[];
  learningInsights: LearningInsight[];
  exportDate: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
  category: 'debugging' | 'exploration' | 'learning' | 'mastery';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface LearningInsight {
  concept: string;
  masteryLevel: number; // 0.0 to 1.0
  practiceCount: number;
  lastPracticed: Date;
  improvementTrend: number;
}

export interface SessionManager {
  createSession(userId?: string): GameSession;
  saveSession(session: GameSession): Promise<void>;
  loadSession(sessionId: string): Promise<GameSession | null>;
  loadLatestSession(): Promise<GameSession | null>;
  getSessionHistory(): Promise<GameSession[]>;
  deleteSession(sessionId: string): Promise<boolean>;
  createNewGameState(userId?: string): Promise<GameState>;
  exportProgress(): Promise<ProgressExport>;
  importProgress(data: ProgressExport): Promise<boolean>;
  cleanup(): Promise<void>;
  
  // System state synchronization
  syncSystemStates(systemStates: SystemStates): Promise<void>;
  getSystemStates(): SystemStates | null;
  updateSystemState<T extends keyof SystemStates>(system: T, state: Partial<SystemStates[T]>): Promise<void>;
  
  // Auto-save functionality
  enableAutoSave(interval?: number): void;
  disableAutoSave(): void;
  isAutoSaveEnabled(): boolean;
  
  // Session validation and recovery
  validateSession(session: GameSession): boolean;
  recoverCorruptedSession(sessionId: string): Promise<GameSession | null>;
}

export class SessionManagerImpl implements SessionManager {
  private readonly STORAGE_KEY = 'haunted-debug-sessions';
  private readonly CURRENT_SESSION_KEY = 'haunted-debug-current';
  private readonly ACHIEVEMENTS_KEY = 'haunted-debug-achievements';
  private readonly LEARNING_KEY = 'haunted-debug-learning';
  private readonly VERSION = '1.0.0';

  private currentSession: GameSession | null = null;
  private achievements: Achievement[] = [];
  private learningInsights: Map<string, LearningInsight> = new Map();
  private eventManager: EventManager | null = null;
  private autoSaveInterval: number | null = null;
  private autoSaveEnabled: boolean = true;
  private systemStatesCache: SystemStates | null = null;

  constructor(eventManager?: EventManager) {
    this.eventManager = eventManager || null;
    this.loadAchievements();
    this.loadLearningInsights();
  }

  /**
   * Set the event manager for cross-system communication
   */
  setEventManager(eventManager: EventManager): void {
    this.eventManager = eventManager;
  }

  /**
   * Create a new game session
   */
  createSession(userId?: string): GameSession {
    const sessionId = this.generateSessionId();
    const gameState = this.createInitialGameState(userId);

    const session: GameSession = {
      id: sessionId,
      gameState,
      timestamp: new Date(),
      systemStates: gameState.systemStates,
      metadata: {
        userId,
        version: this.VERSION,
        playTime: 0,
        achievements: [],
        statistics: this.createInitialStatistics()
      }
    };

    this.currentSession = session;
    this.systemStatesCache = gameState.systemStates;
    
    // Enable auto-save by default
    if (this.autoSaveEnabled) {
      this.enableAutoSave();
    }
    
    return session;
  }

  /**
   * Save game session to persistent storage
   */
  async saveSession(session: GameSession): Promise<void> {
    try {
      // Update session timestamp and play time
      const updatedSession = {
        ...session,
        timestamp: new Date()
      };

      if (updatedSession.metadata) {
        updatedSession.metadata.playTime = this.calculatePlayTime(session);
      }

      // Save to localStorage
      await this.saveToStorage(updatedSession);
      
      // Update current session
      this.currentSession = updatedSession;

      // Save as current session
      localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify({
        sessionId: session.id,
        timestamp: new Date().toISOString()
      }));

      // Emit session saved event
      if (this.eventManager) {
        this.eventManager.emit({
          type: GameEventType.SESSION_SAVED,
          timestamp: new Date(),
          source: 'SessionManager',
          data: {
            sessionId: session.id,
            playTime: updatedSession.metadata?.playTime || 0,
            statistics: updatedSession.metadata?.statistics
          },
          priority: 'low'
        });
      }

      console.log(`Session ${session.id} saved successfully`);

    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error(`Session save failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load specific game session
   */
  async loadSession(sessionId: string): Promise<GameSession | null> {
    try {
      const sessions = await this.loadAllSessions();
      const session = sessions.find(s => s.id === sessionId);

      if (session) {
        this.currentSession = session;
        
        // Emit session loaded event
        if (this.eventManager) {
          this.eventManager.emit({
            type: GameEventType.SESSION_LOADED,
            timestamp: new Date(),
            source: 'SessionManager',
            data: {
              sessionId: session.id,
              gameState: session.gameState,
              playTime: session.metadata?.playTime || 0
            },
            priority: 'medium'
          });
        }
        
        console.log(`Session ${sessionId} loaded successfully`);
      }

      return session || null;

    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Load the most recent game session
   */
  async loadLatestSession(): Promise<GameSession | null> {
    try {
      // Try to load current session first
      const currentSessionInfo = localStorage.getItem(this.CURRENT_SESSION_KEY);
      if (currentSessionInfo) {
        const { sessionId } = JSON.parse(currentSessionInfo);
        const session = await this.loadSession(sessionId);
        if (session) {
          return session;
        }
      }

      // Fall back to most recent session
      const sessions = await this.loadAllSessions();
      if (sessions.length === 0) {
        return null;
      }

      // Sort by timestamp and get most recent
      sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const latestSession = sessions[0];

      this.currentSession = latestSession;
      return latestSession;

    } catch (error) {
      console.error('Failed to load latest session:', error);
      return null;
    }
  }

  /**
   * Get all session history
   */
  async getSessionHistory(): Promise<GameSession[]> {
    try {
      return await this.loadAllSessions();
    } catch (error) {
      console.error('Failed to load session history:', error);
      return [];
    }
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessions = await this.loadAllSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);

      await this.saveAllSessions(filteredSessions);

      // Clear current session if it was deleted
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
        localStorage.removeItem(this.CURRENT_SESSION_KEY);
      }

      console.log(`Session ${sessionId} deleted successfully`);
      return true;

    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Create new game state
   */
  async createNewGameState(userId?: string): Promise<GameState> {
    return this.createInitialGameState(userId);
  }

  /**
   * Export all progress data
   */
  async exportProgress(): Promise<ProgressExport> {
    try {
      const sessions = await this.loadAllSessions();
      const totalStats = this.calculateTotalStatistics(sessions);

      return {
        sessions,
        totalStats,
        achievements: this.achievements,
        learningInsights: Array.from(this.learningInsights.values()),
        exportDate: new Date()
      };

    } catch (error) {
      console.error('Failed to export progress:', error);
      throw new Error(`Progress export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Import progress data
   */
  async importProgress(data: ProgressExport): Promise<boolean> {
    try {
      // Validate import data
      if (!this.validateImportData(data)) {
        throw new Error('Invalid import data format');
      }

      // Save sessions
      await this.saveAllSessions(data.sessions);

      // Save achievements
      this.achievements = data.achievements;
      await this.saveAchievements();

      // Save learning insights
      this.learningInsights.clear();
      for (const insight of data.learningInsights) {
        this.learningInsights.set(insight.concept, insight);
      }
      await this.saveLearningInsights();

      console.log('Progress imported successfully');
      return true;

    } catch (error) {
      console.error('Failed to import progress:', error);
      return false;
    }
  }

  /**
   * Cleanup resources and temporary data
   */
  async cleanup(): Promise<void> {
    try {
      // Disable auto-save
      this.disableAutoSave();
      
      // Save current session if exists
      if (this.currentSession) {
        await this.saveSession(this.currentSession);
      }

      // Clean up old sessions (keep last 50)
      const sessions = await this.loadAllSessions();
      if (sessions.length > 50) {
        sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const recentSessions = sessions.slice(0, 50);
        await this.saveAllSessions(recentSessions);
      }

      // Clear caches
      this.systemStatesCache = null;
      this.currentSession = null;

      console.log('SessionManager cleanup completed');

    } catch (error) {
      console.error('Error during SessionManager cleanup:', error);
    }
  }

  /**
   * Add achievement
   */
  async addAchievement(achievement: Achievement): Promise<void> {
    // Check if achievement already exists
    const exists = this.achievements.some(a => a.id === achievement.id);
    if (!exists) {
      this.achievements.push(achievement);
      await this.saveAchievements();
      
      // Update current session metadata
      if (this.currentSession?.metadata) {
        this.currentSession.metadata.achievements.push(achievement.id);
      }
    }
  }

  /**
   * Update learning insight
   */
  async updateLearningInsight(concept: string, improvement: number): Promise<void> {
    const existing = this.learningInsights.get(concept);
    
    if (existing) {
      existing.practiceCount++;
      existing.lastPracticed = new Date();
      existing.improvementTrend = improvement;
      existing.masteryLevel = Math.min(1.0, existing.masteryLevel + improvement * 0.1);
    } else {
      this.learningInsights.set(concept, {
        concept,
        masteryLevel: improvement * 0.1,
        practiceCount: 1,
        lastPracticed: new Date(),
        improvementTrend: improvement
      });
    }

    await this.saveLearningInsights();
  }

  /**
   * Create initial game state
   */
  private createInitialGameState(userId?: string): GameState {
    const runId = this.generateRunId();

    return {
      run: {
        id: runId,
        userId,
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
      systemStates: this.createInitialSystemStates()
    };
  }

  /**
   * Create initial session statistics
   */
  private createInitialStatistics(): SessionStatistics {
    return {
      encountersCompleted: 0,
      roomsVisited: 1,
      patchesApplied: 0,
      totalChoices: 0,
      averageSessionLength: 0,
      learningProgress: 0
    };
  }

  /**
   * Calculate play time for session
   */
  private calculatePlayTime(session: GameSession): number {
    const startTime = new Date(session.gameState.run.startedAt).getTime();
    const currentTime = Date.now();
    return Math.floor((currentTime - startTime) / 1000); // seconds
  }

  /**
   * Save session to storage
   */
  private async saveToStorage(session: GameSession): Promise<void> {
    const sessions = await this.loadAllSessions();
    
    // Update existing session or add new one
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    await this.saveAllSessions(sessions);
  }

  /**
   * Load all sessions from storage
   */
  private async loadAllSessions(): Promise<GameSession[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const sessions = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp),
        gameState: {
          ...session.gameState,
          run: {
            ...session.gameState.run,
            startedAt: new Date(session.gameState.run.startedAt),
            endedAt: session.gameState.run.endedAt ? new Date(session.gameState.run.endedAt) : undefined
          },
          evidenceBoard: session.gameState.evidenceBoard.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          })),
          playerChoices: session.gameState.playerChoices.map((choice: any) => ({
            ...choice,
            timestamp: new Date(choice.timestamp)
          }))
        }
      }));

    } catch (error) {
      console.error('Error loading sessions from storage:', error);
      return [];
    }
  }

  /**
   * Save all sessions to storage
   */
  private async saveAllSessions(sessions: GameSession[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions to storage:', error);
      throw error;
    }
  }

  /**
   * Load achievements from storage
   */
  private loadAchievements(): void {
    try {
      const data = localStorage.getItem(this.ACHIEVEMENTS_KEY);
      if (data) {
        this.achievements = JSON.parse(data).map((achievement: any) => ({
          ...achievement,
          unlockedAt: new Date(achievement.unlockedAt)
        }));
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      this.achievements = [];
    }
  }

  /**
   * Save achievements to storage
   */
  private async saveAchievements(): Promise<void> {
    try {
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  /**
   * Load learning insights from storage
   */
  private loadLearningInsights(): void {
    try {
      const data = localStorage.getItem(this.LEARNING_KEY);
      if (data) {
        const insights = JSON.parse(data);
        this.learningInsights.clear();
        for (const insight of insights) {
          this.learningInsights.set(insight.concept, {
            ...insight,
            lastPracticed: new Date(insight.lastPracticed)
          });
        }
      }
    } catch (error) {
      console.error('Error loading learning insights:', error);
      this.learningInsights.clear();
    }
  }

  /**
   * Save learning insights to storage
   */
  private async saveLearningInsights(): Promise<void> {
    try {
      const insights = Array.from(this.learningInsights.values());
      localStorage.setItem(this.LEARNING_KEY, JSON.stringify(insights));
    } catch (error) {
      console.error('Error saving learning insights:', error);
    }
  }

  /**
   * Calculate total statistics across all sessions
   */
  private calculateTotalStatistics(sessions: GameSession[]): SessionStatistics {
    return sessions.reduce((total, session) => {
      const stats = session.metadata?.statistics || this.createInitialStatistics();
      return {
        encountersCompleted: total.encountersCompleted + stats.encountersCompleted,
        roomsVisited: Math.max(total.roomsVisited, stats.roomsVisited),
        patchesApplied: total.patchesApplied + stats.patchesApplied,
        totalChoices: total.totalChoices + stats.totalChoices,
        averageSessionLength: (total.averageSessionLength + stats.averageSessionLength) / 2,
        learningProgress: Math.max(total.learningProgress, stats.learningProgress)
      };
    }, this.createInitialStatistics());
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: ProgressExport): boolean {
    return !!(
      data &&
      Array.isArray(data.sessions) &&
      Array.isArray(data.achievements) &&
      Array.isArray(data.learningInsights) &&
      data.exportDate
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Synchronize system states with current session
   */
  async syncSystemStates(systemStates: SystemStates): Promise<void> {
    this.systemStatesCache = systemStates;
    
    if (this.currentSession) {
      this.currentSession.systemStates = systemStates;
      this.currentSession.gameState.systemStates = systemStates;
      
      // Auto-save if enabled
      if (this.autoSaveEnabled) {
        await this.saveSession(this.currentSession);
      }
    }
  }

  /**
   * Get current system states
   */
  getSystemStates(): SystemStates | null {
    return this.systemStatesCache;
  }

  /**
   * Update specific system state
   */
  async updateSystemState<T extends keyof SystemStates>(
    system: T, 
    state: Partial<SystemStates[T]>
  ): Promise<void> {
    if (!this.systemStatesCache) {
      console.warn('No system states cache available');
      return;
    }

    this.systemStatesCache[system] = {
      ...this.systemStatesCache[system],
      ...state
    } as SystemStates[T];

    if (this.currentSession) {
      this.currentSession.systemStates = this.systemStatesCache;
      this.currentSession.gameState.systemStates = this.systemStatesCache;
      
      // Emit system state update event
      if (this.eventManager) {
        this.eventManager.emit({
          type: GameEventType.SYSTEM_INITIALIZED, // Reusing existing event type
          timestamp: new Date(),
          source: 'SessionManager',
          data: { system, updatedState: state },
          priority: 'low'
        });
      }
    }
  }

  /**
   * Enable auto-save functionality
   */
  enableAutoSave(interval: number = 30000): void {
    this.disableAutoSave(); // Clear any existing interval
    
    this.autoSaveEnabled = true;
    this.autoSaveInterval = window.setInterval(async () => {
      if (this.currentSession) {
        try {
          await this.saveSession(this.currentSession);
          console.log('Auto-save completed');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, interval);
    
    console.log(`Auto-save enabled with ${interval}ms interval`);
  }

  /**
   * Disable auto-save functionality
   */
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.autoSaveEnabled = false;
    console.log('Auto-save disabled');
  }

  /**
   * Check if auto-save is enabled
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  /**
   * Validate session data integrity
   */
  validateSession(session: GameSession): boolean {
    try {
      // Check required fields
      if (!session.id || !session.gameState || !session.timestamp) {
        return false;
      }

      // Check game state structure
      const gameState = session.gameState;
      if (!gameState.run || !gameState.meters || !gameState.systemStates) {
        return false;
      }

      // Check system states structure
      const systemStates = gameState.systemStates;
      if (!systemStates.eventManager || !systemStates.navigation || 
          !systemStates.effects || !systemStates.encounters || 
          !systemStates.session) {
        return false;
      }

      // Check meters are within valid range
      if (gameState.meters.stability < 0 || gameState.meters.stability > 100 ||
          gameState.meters.insight < 0 || gameState.meters.insight > 100) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Attempt to recover a corrupted session
   */
  async recoverCorruptedSession(sessionId: string): Promise<GameSession | null> {
    try {
      console.log(`Attempting to recover corrupted session: ${sessionId}`);
      
      // Try to load the session data
      const sessions = await this.loadAllSessions();
      const corruptedSession = sessions.find(s => s.id === sessionId);
      
      if (!corruptedSession) {
        console.warn(`Session ${sessionId} not found for recovery`);
        return null;
      }

      // Create a new session with recovered data
      const recoveredSession: GameSession = {
        id: this.generateSessionId(), // New ID for recovered session
        gameState: this.createInitialGameState(corruptedSession.gameState?.run?.userId),
        timestamp: new Date(),
        systemStates: this.createInitialSystemStates(),
        metadata: {
          userId: corruptedSession.gameState?.run?.userId,
          version: this.VERSION,
          playTime: corruptedSession.metadata?.playTime || 0,
          achievements: corruptedSession.metadata?.achievements || [],
          statistics: corruptedSession.metadata?.statistics || this.createInitialStatistics()
        }
      };

      // Try to recover what we can from the corrupted session
      if (corruptedSession.gameState) {
        // Recover meters if valid
        if (corruptedSession.gameState.meters && 
            typeof corruptedSession.gameState.meters.stability === 'number' &&
            typeof corruptedSession.gameState.meters.insight === 'number') {
          recoveredSession.gameState.meters = corruptedSession.gameState.meters;
        }

        // Recover room progress if valid
        if (corruptedSession.gameState.currentRoom && 
            typeof corruptedSession.gameState.currentRoom === 'string') {
          recoveredSession.gameState.currentRoom = corruptedSession.gameState.currentRoom;
        }

        // Recover unlocked rooms if valid
        if (Array.isArray(corruptedSession.gameState.unlockedRooms)) {
          recoveredSession.gameState.unlockedRooms = corruptedSession.gameState.unlockedRooms;
        }

        // Recover evidence board if valid
        if (Array.isArray(corruptedSession.gameState.evidenceBoard)) {
          recoveredSession.gameState.evidenceBoard = corruptedSession.gameState.evidenceBoard;
        }

        // Recover player choices if valid
        if (Array.isArray(corruptedSession.gameState.playerChoices)) {
          recoveredSession.gameState.playerChoices = corruptedSession.gameState.playerChoices;
        }
      }

      // Save the recovered session
      await this.saveSession(recoveredSession);
      
      console.log(`Session recovered successfully as ${recoveredSession.id}`);
      return recoveredSession;

    } catch (error) {
      console.error('Session recovery failed:', error);
      return null;
    }
  }

  /**
   * Create initial system states
   */
  private createInitialSystemStates(): SystemStates {
    return {
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
        sessionId: this.generateSessionId(),
        startTime: new Date(),
        lastSaveTime: new Date(),
        playTime: 0,
        autoSaveEnabled: true,
        saveInterval: 30000,
        achievements: [],
        learningProgress: []
      }
    };
  }
}