/**
 * StateSynchronizer - Coordinates state synchronization across all game systems
 */

import type { SystemStates, GameState } from '@/types/game';
import type { EventManager } from './EventManager';
import { GameEventType } from './EventManager';
import type { SessionManager } from './SessionManager';
import type { NavigationManager } from './NavigationManager';
import type { EffectCoordinator } from './EffectCoordinator';
import type { EncounterOrchestrator } from './EncounterOrchestrator';

export interface StateSynchronizer {
  initialize(systems: GameSystems): Promise<void>;
  syncAllSystems(): Promise<void>;
  syncSystemState<T extends keyof SystemStates>(system: T, state: Partial<SystemStates[T]>): Promise<void>;
  getSystemState<T extends keyof SystemStates>(system: T): SystemStates[T] | null;
  validateSystemStates(): boolean;
  recoverFromDesync(): Promise<boolean>;
  cleanup(): void;
}

export interface GameSystems {
  eventManager: EventManager;
  sessionManager: SessionManager;
  navigationManager: NavigationManager;
  effectCoordinator: EffectCoordinator;
  encounterOrchestrator: EncounterOrchestrator;
  gameStore: any; // Will be typed properly when integrated
}

export interface SyncResult {
  success: boolean;
  syncedSystems: string[];
  errors: SyncError[];
  timestamp: Date;
}

export interface SyncError {
  system: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
}

export class StateSynchronizerImpl implements StateSynchronizer {
  private systems: GameSystems | null = null;
  private isInitialized: boolean = false;
  private syncInProgress: boolean = false;
  private lastSyncTime: Date | null = null;
  private syncErrors: SyncError[] = [];
  private syncInterval: number | null = null;

  /**
   * Initialize the state synchronizer with all game systems
   */
  async initialize(systems: GameSystems): Promise<void> {
    if (this.isInitialized) {
      console.warn('StateSynchronizer already initialized');
      return;
    }

    try {
      this.systems = systems;
      
      // Set up event listeners for automatic synchronization
      this.setupEventListeners();
      
      // Perform initial synchronization
      await this.syncAllSystems();
      
      // Start periodic synchronization
      this.startPeriodicSync();
      
      this.isInitialized = true;
      console.log('StateSynchronizer initialized successfully');

    } catch (error) {
      console.error('Failed to initialize StateSynchronizer:', error);
      throw error;
    }
  }

  /**
   * Synchronize state across all game systems
   */
  async syncAllSystems(): Promise<void> {
    if (!this.systems || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.syncErrors = [];

    try {
      console.log('Starting full system synchronization...');

      // Get current system states from session manager
      const systemStates = this.systems.sessionManager.getSystemStates();
      if (!systemStates) {
        throw new Error('No system states available from session manager');
      }

      // Sync each system
      await Promise.allSettled([
        this.syncNavigationManager(systemStates.navigation),
        this.syncEffectCoordinator(systemStates.effects),
        this.syncEncounterOrchestrator(systemStates.encounters),
        this.syncEventManager(systemStates.eventManager)
      ]);

      // Update game store with synchronized states
      if (this.systems.gameStore?.syncSystemStates) {
        this.systems.gameStore.syncSystemStates(systemStates);
      }

      this.lastSyncTime = new Date();
      console.log('System synchronization completed');

    } catch (error) {
      console.error('System synchronization failed:', error);
      this.syncErrors.push({
        system: 'StateSynchronizer',
        error: (error as Error).message,
        severity: 'critical'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Synchronize specific system state
   */
  async syncSystemState<T extends keyof SystemStates>(
    system: T, 
    state: Partial<SystemStates[T]>
  ): Promise<void> {
    if (!this.systems) {
      console.warn('StateSynchronizer not initialized');
      return;
    }

    try {
      // Update session manager
      await this.systems.sessionManager.updateSystemState(system, state);

      // Sync specific system
      switch (system) {
        case 'navigation':
          if (this.systems.navigationManager.restoreState) {
            await this.systems.navigationManager.restoreState(state);
          }
          break;

        case 'effects':
          if (this.systems.effectCoordinator.restoreState) {
            await this.systems.effectCoordinator.restoreState(state);
          }
          break;

        case 'encounters':
          if (this.systems.encounterOrchestrator.restoreState) {
            await this.systems.encounterOrchestrator.restoreState(state);
          }
          break;

        case 'eventManager':
          // Event manager state is mostly runtime, limited sync needed
          break;

        case 'session':
          // Session state is managed by session manager itself
          break;
      }

      // Update game store
      if (this.systems.gameStore?.updateSystemState) {
        this.systems.gameStore.updateSystemState(system, state);
      }

      console.log(`Synchronized ${system} state`);

    } catch (error) {
      console.error(`Failed to sync ${system} state:`, error);
      this.syncErrors.push({
        system: system as string,
        error: (error as Error).message,
        severity: 'error'
      });
    }
  }

  /**
   * Get current state for a specific system
   */
  getSystemState<T extends keyof SystemStates>(system: T): SystemStates[T] | null {
    if (!this.systems) {
      return null;
    }

    const systemStates = this.systems.sessionManager.getSystemStates();
    return systemStates ? systemStates[system] : null;
  }

  /**
   * Validate that all system states are consistent
   */
  validateSystemStates(): boolean {
    if (!this.systems) {
      return false;
    }

    try {
      const systemStates = this.systems.sessionManager.getSystemStates();
      if (!systemStates) {
        return false;
      }

      // Check navigation state consistency
      const navState = systemStates.navigation;
      const currentRoom = this.systems.navigationManager.getCurrentRoom();
      if (currentRoom && navState.currentRoomId !== currentRoom.key) {
        console.warn('Navigation state inconsistency detected');
        return false;
      }

      // Check effect coordinator state consistency
      const effectState = systemStates.effects;
      const coordinatorState = this.systems.effectCoordinator.getState();
      if (coordinatorState && effectState.activeEffects.length !== coordinatorState.activeEffects?.length) {
        console.warn('Effect coordinator state inconsistency detected');
        return false;
      }

      // Additional validation can be added here

      return true;

    } catch (error) {
      console.error('State validation failed:', error);
      return false;
    }
  }

  /**
   * Attempt to recover from state desynchronization
   */
  async recoverFromDesync(): Promise<boolean> {
    if (!this.systems) {
      return false;
    }

    try {
      console.log('Attempting to recover from state desynchronization...');

      // Stop any ongoing sync operations
      this.syncInProgress = false;

      // Get fresh state from each system
      const freshStates: Partial<SystemStates> = {};

      // Collect navigation state
      if (this.systems.navigationManager.getState) {
        freshStates.navigation = this.systems.navigationManager.getState();
      }

      // Collect effect coordinator state
      if (this.systems.effectCoordinator.getState) {
        freshStates.effects = this.systems.effectCoordinator.getState();
      }

      // Collect encounter orchestrator state
      if (this.systems.encounterOrchestrator.getState) {
        freshStates.encounters = this.systems.encounterOrchestrator.getState();
      }

      // Update session manager with fresh states
      const currentStates = this.systems.sessionManager.getSystemStates();
      if (currentStates) {
        const mergedStates: SystemStates = {
          ...currentStates,
          ...freshStates
        };
        await this.systems.sessionManager.syncSystemStates(mergedStates);
      }

      // Perform full synchronization
      await this.syncAllSystems();

      // Validate recovery
      const isValid = this.validateSystemStates();
      if (isValid) {
        console.log('State desynchronization recovery successful');
        return true;
      } else {
        console.error('State desynchronization recovery failed validation');
        return false;
      }

    } catch (error) {
      console.error('State desynchronization recovery failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources and stop synchronization
   */
  cleanup(): void {
    // Stop periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Clear references
    this.systems = null;
    this.isInitialized = false;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncErrors = [];

    console.log('StateSynchronizer cleanup completed');
  }

  /**
   * Set up event listeners for automatic synchronization
   */
  private setupEventListeners(): void {
    if (!this.systems) {
      return;
    }

    // Listen for state change events and trigger sync
    this.systems.eventManager.on(GameEventType.METER_CHANGED, async () => {
      // Sync after meter changes
      setTimeout(() => this.syncAllSystems(), 100);
    });

    this.systems.eventManager.on(GameEventType.ROOM_ENTERED, async () => {
      // Sync after room changes
      setTimeout(() => this.syncAllSystems(), 100);
    });

    this.systems.eventManager.on(GameEventType.ENCOUNTER_COMPLETED, async () => {
      // Sync after encounter completion
      setTimeout(() => this.syncAllSystems(), 100);
    });
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds
    this.syncInterval = window.setInterval(() => {
      if (!this.syncInProgress) {
        this.syncAllSystems();
      }
    }, 30000);
  }

  /**
   * Synchronize navigation manager state
   */
  private async syncNavigationManager(navigationState: any): Promise<void> {
    try {
      if (this.systems?.navigationManager.restoreState) {
        await this.systems.navigationManager.restoreState(navigationState);
      }
    } catch (error) {
      this.syncErrors.push({
        system: 'NavigationManager',
        error: (error as Error).message,
        severity: 'error'
      });
    }
  }

  /**
   * Synchronize effect coordinator state
   */
  private async syncEffectCoordinator(effectState: any): Promise<void> {
    try {
      if (this.systems?.effectCoordinator.restoreState) {
        await this.systems.effectCoordinator.restoreState(effectState);
      }
    } catch (error) {
      this.syncErrors.push({
        system: 'EffectCoordinator',
        error: (error as Error).message,
        severity: 'error'
      });
    }
  }

  /**
   * Synchronize encounter orchestrator state
   */
  private async syncEncounterOrchestrator(encounterState: any): Promise<void> {
    try {
      if (this.systems?.encounterOrchestrator.restoreState) {
        await this.systems.encounterOrchestrator.restoreState(encounterState);
      }
    } catch (error) {
      this.syncErrors.push({
        system: 'EncounterOrchestrator',
        error: (error as Error).message,
        severity: 'error'
      });
    }
  }

  /**
   * Synchronize event manager state
   */
  private async syncEventManager(eventState: any): Promise<void> {
    try {
      // Event manager state is mostly runtime, limited sync needed
      // Could update subscription counts or error counts if needed
      console.log('Event manager state sync (limited operation)');
    } catch (error) {
      this.syncErrors.push({
        system: 'EventManager',
        error: (error as Error).message,
        severity: 'warning'
      });
    }
  }

  /**
   * Get synchronization status and errors
   */
  getSyncStatus(): { 
    isInitialized: boolean; 
    lastSync: Date | null; 
    errors: SyncError[]; 
    inProgress: boolean 
  } {
    return {
      isInitialized: this.isInitialized,
      lastSync: this.lastSyncTime,
      errors: [...this.syncErrors],
      inProgress: this.syncInProgress
    };
  }
}