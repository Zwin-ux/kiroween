/**
 * GameEngine - Central orchestrator for all gameplay systems
 */

import { EventManagerImpl, type GameEvent, GameEventType } from './EventManager';
import { EncounterOrchestratorImpl } from './EncounterOrchestrator';
import { EffectCoordinatorImpl } from './EffectCoordinator';
import { NavigationManagerImpl } from './NavigationManager';
import { SessionManagerImpl } from './SessionManager';
import { DynamicMeterSystem } from './DynamicMeterSystem';
import { DialogueEngine } from './DialogueEngine';
import { GhostManager } from './GhostManager';
import { PatchGenerationSystem } from './PatchGenerationSystem';
import { EffectsSystemImpl } from './EffectsSystem';
import { GameConditionManager, type GameConditionResult } from './GameConditionManager';
import type { SystemStates } from '@/types/game';

import type { GameState, GameContext } from '@/types/game';
import type { Ghost } from '@/types/content';
import type { MCPTools } from '@/types/kiro';
import type { EncounterSession, PlayerAction, ActionResult } from '@/types/encounter';
import type { NavigationResult } from '@/types/navigation';

export interface GameEngine {
  initialize(): Promise<void>;
  startEncounter(ghostId: string): Promise<EncounterSession>;
  processPlayerAction(action: PlayerAction): Promise<ActionResult>;
  navigateToRoom(roomId: string): Promise<NavigationResult>;
  saveGameState(): Promise<void>;
  loadGameState(): Promise<GameState>;
  shutdown(): Promise<void>;
  getGameContext(): GameContext;
}

export interface GameEngineConfig {
  mcpTools: MCPTools;
  enableEffects: boolean;
  enableAudio: boolean;
  debugMode: boolean;
}

export class GameEngineImpl implements GameEngine {
  private eventManager: EventManagerImpl;
  private encounterOrchestrator: EncounterOrchestratorImpl;
  private effectCoordinator: EffectCoordinatorImpl;
  private navigationManager: NavigationManagerImpl;
  private sessionManager: SessionManagerImpl;
  private meterSystem: DynamicMeterSystem;
  private dialogueEngine: DialogueEngine;
  private ghostManager: GhostManager;
  private patchSystem: PatchGenerationSystem;
  private effectsSystem: EffectsSystemImpl;
  private conditionManager: GameConditionManager;

  private isInitialized: boolean = false;
  private currentGameState: GameState | null = null;
  private config: GameEngineConfig;

  constructor(config: GameEngineConfig) {
    this.config = config;
    
    // Initialize core systems
    this.eventManager = new EventManagerImpl();
    this.meterSystem = new DynamicMeterSystem(config.mcpTools, this.eventManager);
    this.effectsSystem = new EffectsSystemImpl();
    this.sessionManager = new SessionManagerImpl(this.eventManager);
    this.ghostManager = new GhostManager([], config.mcpTools);
    this.dialogueEngine = new DialogueEngine();
    this.patchSystem = new PatchGenerationSystem(config.mcpTools, this.eventManager);
    this.conditionManager = new GameConditionManager();
    
    // Initialize orchestration systems
    this.encounterOrchestrator = new EncounterOrchestratorImpl(
      this.dialogueEngine,
      this.patchSystem,
      this.meterSystem,
      this.effectsSystem,
      this.eventManager
    );
    
    this.effectCoordinator = new EffectCoordinatorImpl(
      this.effectsSystem,
      this.eventManager
    );
    
    this.navigationManager = new NavigationManagerImpl(
      this.ghostManager,
      this.eventManager
    );
  }

  /**
   * Initialize all game systems and set up event handlers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('GameEngine already initialized');
      return;
    }

    try {
      console.log('Initializing GameEngine...');

      // Initialize core systems
      await this.initializeCoreSystems();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Load or create initial game state
      await this.initializeGameState();
      
      // Initialize subsystems with game state
      await this.initializeSubsystems();

      this.isInitialized = true;
      
      // Emit initialization complete event
      this.eventManager.emit({
        type: GameEventType.SYSTEM_INITIALIZED,
        timestamp: new Date(),
        source: 'GameEngine',
        data: { systems: this.getSystemStatus() },
        priority: 'high'
      });

      console.log('GameEngine initialization complete');

    } catch (error) {
      console.error('Failed to initialize GameEngine:', error);
      await this.handleCriticalError(error as Error);
      throw error;
    }
  }

  /**
   * Start a ghost encounter
   */
  async startEncounter(ghostId: string): Promise<EncounterSession> {
    this.ensureInitialized();
    
    try {
      const ghost = await this.ghostManager.getGhost(ghostId);
      if (!ghost) {
        throw new Error(`Ghost not found: ${ghostId}`);
      }

      const context = this.getGameContext();
      const session = await this.encounterOrchestrator.startEncounter(ghost, context);

      // Emit encounter started event
      this.eventManager.emit({
        type: GameEventType.ENCOUNTER_STARTED,
        timestamp: new Date(),
        source: 'GameEngine',
        data: { ghostId, sessionId: session.id },
        priority: 'high'
      });

      return session;

    } catch (error) {
      console.error('Failed to start encounter:', error);
      return this.handleEncounterError(ghostId, error as Error);
    }
  }

  /**
   * Process player action during gameplay
   */
  async processPlayerAction(action: PlayerAction): Promise<ActionResult> {
    this.ensureInitialized();

    try {
      let result: ActionResult;

      switch (action.type) {
        case 'dialogue_choice':
          result = await this.encounterOrchestrator.processDialogueChoice(
            action.sessionId!,
            action.choice!
          );
          break;

        case 'patch_action':
          result = await this.encounterOrchestrator.applyPatchChoice(
            action.patchId!,
            action.patchAction!
          );
          break;

        case 'navigate':
          const navResult = await this.navigateToRoom(action.targetRoom!);
          result = {
            success: navResult.success,
            message: navResult.message,
            effects: navResult.effects
          };
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      // Emit action processed event
      this.eventManager.emit({
        type: GameEventType.PLAYER_ACTION,
        timestamp: new Date(),
        source: 'GameEngine',
        data: { action, result },
        priority: 'medium'
      });

      return result;

    } catch (error) {
      console.error('Failed to process player action:', error);
      return this.handleActionError(action, error as Error);
    }
  }

  /**
   * Navigate to a different room
   */
  async navigateToRoom(roomId: string): Promise<NavigationResult> {
    this.ensureInitialized();

    try {
      const context = this.getGameContext();
      const result = await this.navigationManager.navigateToRoom(roomId, context);

      if (result.success) {
        // Update current game state
        if (this.currentGameState) {
          this.currentGameState.currentRoom = roomId;
          if (!this.currentGameState.unlockedRooms.includes(roomId)) {
            this.currentGameState.unlockedRooms.push(roomId);
          }
        }

        // Emit room entered event
        this.eventManager.emit({
          type: GameEventType.ROOM_ENTERED,
          timestamp: new Date(),
          source: 'GameEngine',
          data: { roomId, previousRoom: context.gameState.currentRoom },
          priority: 'medium'
        });
      }

      return result;

    } catch (error) {
      console.error('Failed to navigate to room:', error);
      return {
        success: false,
        message: `Navigation failed: ${(error as Error).message}`,
        effects: []
      };
    }
  }

  /**
   * Save current game state
   */
  async saveGameState(): Promise<void> {
    this.ensureInitialized();

    try {
      if (!this.currentGameState) {
        throw new Error('No game state to save');
      }

      await this.sessionManager.saveSession({
        id: this.currentGameState.run.id,
        gameState: this.currentGameState,
        timestamp: new Date(),
        systemStates: this.getSystemStates()
      });

      console.log('Game state saved successfully');

    } catch (error) {
      console.error('Failed to save game state:', error);
      throw error;
    }
  }

  /**
   * Load game state from storage
   */
  async loadGameState(): Promise<GameState> {
    try {
      const session = await this.sessionManager.loadLatestSession();
      
      if (session) {
        this.currentGameState = session.gameState;
        await this.restoreSystemStates(session.systemStates);
        console.log('Game state loaded successfully');
      } else {
        // Create new game state
        this.currentGameState = await this.sessionManager.createNewGameState();
        console.log('New game state created');
      }

      return this.currentGameState!;

    } catch (error) {
      console.error('Failed to load game state:', error);
      // Return default state as fallback
      this.currentGameState = await this.sessionManager.createNewGameState();
      return this.currentGameState!;
    }
  }

  /**
   * Get current game context
   */
  getGameContext(): GameContext {
    if (!this.currentGameState) {
      throw new Error('Game not initialized - no game state available');
    }

    return {
      gameState: this.currentGameState,
      currentRoom: this.navigationManager.getCurrentRoom(),
      activeGhost: this.encounterOrchestrator.getActiveGhost(),
      playerIntent: this.encounterOrchestrator.getCurrentPlayerIntent()
    };
  }

  /**
   * Check game conditions and return any triggered conditions
   */
  checkGameConditions(): GameConditionResult[] {
    this.ensureInitialized();
    
    if (!this.currentGameState) {
      return [];
    }

    return this.conditionManager.checkConditions(this.currentGameState);
  }

  /**
   * Reset game conditions (for new game)
   */
  resetGameConditions(): void {
    this.conditionManager.resetConditions();
  }

  /**
   * Shutdown game engine and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('Shutting down GameEngine...');

      // Save current state
      if (this.currentGameState) {
        await this.saveGameState();
      }

      // Cleanup systems
      await this.encounterOrchestrator.cleanup();
      this.effectCoordinator.cleanup();
      this.effectsSystem.cleanup();
      this.eventManager.cleanup();

      this.isInitialized = false;
      console.log('GameEngine shutdown complete');

    } catch (error) {
      console.error('Error during GameEngine shutdown:', error);
    }
  }

  /**
   * Initialize core systems
   */
  private async initializeCoreSystems(): Promise<void> {
    // Initialize systems that don't depend on game state
    // GhostManager doesn't need initialization
    
    if (this.config.enableEffects) {
      // Effects system is already initialized in constructor
    }
    
    if (this.config.enableAudio) {
      // Audio is handled by effects system
    }
  }

  /**
   * Set up event handlers for cross-system communication
   */
  private setupEventHandlers(): void {
    // Meter change events trigger effects
    this.eventManager.on(GameEventType.METER_CHANGED, async (event: GameEvent) => {
      const { effects } = event.data;
      await this.effectCoordinator.processMeterChange(effects);
    });

    // Encounter events trigger appropriate effects
    this.eventManager.on(GameEventType.ENCOUNTER_STARTED, async (event: GameEvent) => {
      await this.effectCoordinator.processEncounterStart(event.data);
    });

    // Critical events trigger special handling
    this.eventManager.on(GameEventType.CRITICAL_EVENT, async (event: GameEvent) => {
      await this.handleCriticalEvent(event.data);
    });

    // Room changes trigger navigation effects
    this.eventManager.on(GameEventType.ROOM_ENTERED, async (event: GameEvent) => {
      await this.effectCoordinator.processRoomChange(event.data);
    });
  }

  /**
   * Initialize or load game state
   */
  private async initializeGameState(): Promise<void> {
    this.currentGameState = await this.loadGameState();
  }

  /**
   * Initialize subsystems with game state
   */
  private async initializeSubsystems(): Promise<void> {
    if (!this.currentGameState) {
      throw new Error('Cannot initialize subsystems without game state');
    }

    // Initialize navigation with current room
    await this.navigationManager.initialize(this.currentGameState.currentRoom);
    
    // Initialize encounter orchestrator
    await this.encounterOrchestrator.initialize(this.currentGameState);
    
    // Initialize effect coordinator
    await this.effectCoordinator.initialize();
  }

  /**
   * Handle critical errors with graceful degradation
   */
  private async handleCriticalError(error: Error): Promise<void> {
    console.error('Critical error in GameEngine:', error);
    
    // Emit critical error event
    this.eventManager.emit({
      type: GameEventType.CRITICAL_EVENT,
      timestamp: new Date(),
      source: 'GameEngine',
      data: { error: error.message, stack: error.stack },
      priority: 'critical'
    });

    // Attempt to save current state before potential crash
    try {
      if (this.currentGameState) {
        await this.saveGameState();
      }
    } catch (saveError) {
      console.error('Failed to save state during critical error:', saveError);
    }
  }

  /**
   * Handle encounter-specific errors
   */
  private async handleEncounterError(ghostId: string, error: Error): Promise<EncounterSession> {
    console.error(`Encounter error for ghost ${ghostId}:`, error);
    
    // Return a safe fallback encounter session
    return {
      id: `error_session_${Date.now()}`,
      ghostId,
      roomId: this.currentGameState?.currentRoom || 'unknown',
      startTime: new Date(),
      currentPhase: 'error',
      isComplete: false,
      error: error.message
    } as EncounterSession;
  }

  /**
   * Handle action processing errors
   */
  private handleActionError(action: PlayerAction, error: Error): ActionResult {
    console.error('Action processing error:', error);
    
    return {
      success: false,
      message: `Action failed: ${error.message}`,
      effects: [],
      error: error.message
    };
  }

  /**
   * Handle critical events
   */
  private async handleCriticalEvent(eventData: any): Promise<void> {
    console.log('Handling critical event:', eventData);
    
    // Implement critical event handling logic
    // This could include triggering special effects, saving state, etc.
  }

  /**
   * Ensure engine is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('GameEngine not initialized. Call initialize() first.');
    }
  }

  /**
   * Get status of all systems
   */
  private getSystemStatus(): Record<string, boolean> {
    return {
      eventManager: !!this.eventManager,
      encounterOrchestrator: !!this.encounterOrchestrator,
      effectCoordinator: !!this.effectCoordinator,
      navigationManager: !!this.navigationManager,
      sessionManager: !!this.sessionManager,
      meterSystem: !!this.meterSystem,
      dialogueEngine: !!this.dialogueEngine,
      ghostManager: !!this.ghostManager,
      patchSystem: !!this.patchSystem,
      effectsSystem: !!this.effectsSystem
    };
  }

  /**
   * Get current system states for persistence
   */
  private getSystemStates(): SystemStates {
    return {
      eventManager: {
        subscriptionCount: this.eventManager.getSubscriptionCount(),
        recentEvents: this.eventManager.getEventHistory(undefined, 10).map(event => ({
          type: event.type,
          timestamp: event.timestamp,
          source: event.source,
          priority: event.priority
        })),
        errorCount: 0 // Could be enhanced to track actual errors
      },
      navigation: this.navigationManager.getState() || {
        currentRoomId: 'boot-sector',
        unlockedRooms: ['boot-sector'],
        roomTransitionHistory: [],
        pendingUnlocks: []
      },
      encounters: this.encounterOrchestrator.getState() || {
        activeEncounters: {},
        completedEncounters: [],
        encounterHistory: []
      },
      effects: this.effectCoordinator.getState() || {
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
      session: {
        sessionId: this.currentGameState.run.id,
        startTime: this.currentGameState.run.startedAt,
        lastSaveTime: new Date(),
        playTime: Date.now() - this.currentGameState.run.startedAt.getTime(),
        autoSaveEnabled: true,
        saveInterval: 30000,
        achievements: [],
        learningProgress: []
      }
    };
  }

  /**
   * Restore system states from saved data
   */
  private async restoreSystemStates(systemStates: Record<string, any>): Promise<void> {
    if (systemStates.navigation) {
      await this.navigationManager.restoreState(systemStates.navigation);
    }
    
    if (systemStates.encounters) {
      await this.encounterOrchestrator.restoreState(systemStates.encounters);
    }
    
    if (systemStates.effects) {
      await this.effectCoordinator.restoreState(systemStates.effects);
    }
  }
}