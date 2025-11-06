/**
 * NavigationManager - Handles room transitions, unlocking, and contextual loading
 */

import type { Room } from '@/types/content';
import type { GameContext, NavigationState, PendingUnlock } from '@/types/game';
import { GhostManager } from './GhostManager';
import { EventManager, GameEventType } from './EventManager';
import { RoomProgressionSystem } from './RoomProgressionSystem';

export interface NavigationResult {
  success: boolean;
  message: string;
  effects: NavigationEffect[];
  newRoom?: Room;
  unlockedContent?: UnlockedContent[];
  transitionAnimation?: TransitionAnimation;
}

export interface NavigationEffect {
  type: 'room_transition' | 'atmosphere_change' | 'unlock_notification' | 'progression_update';
  data: any;
  duration?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface UnlockedContent {
  type: 'room' | 'ghost' | 'achievement' | 'lore';
  id: string;
  name: string;
  description?: string;
}

export interface TransitionAnimation {
  type: 'fade' | 'slide' | 'dissolve' | 'portal';
  duration: number;
  fromRoom?: string;
  toRoom: string;
  effects: string[];
}

export interface UnlockCondition {
  type: 'encounters_completed' | 'meter_threshold' | 'evidence_collected' | 'time_elapsed' | 'room_completed' | 'all_ghosts_resolved';
  value: any;
  description: string;
  roomId?: string;
}

export interface RoomProgression {
  roomId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  completionProgress: number;
  ghostsResolved: number;
  totalGhosts: number;
  meetsRequirements: boolean;
  nextUnlockHint?: string;
}

export interface NavigationManager {
  initialize(currentRoomId: string, gameContext: GameContext): Promise<void>;
  getCurrentRoom(): Room | null;
  getAvailableRooms(): Room[];
  getUnlockedRooms(): Room[];
  getLockedRooms(): Room[];
  canNavigateToRoom(roomId: string, context: GameContext): boolean;
  navigateToRoom(roomId: string, context: GameContext): Promise<NavigationResult>;
  unlockRoom(roomId: string, condition: UnlockCondition): void;
  checkRoomCompletion(roomId: string, context: GameContext): boolean;
  getRoomProgression(context: GameContext): RoomProgression[];
  checkVictoryConditions(context: GameContext): boolean;
  processUnlockConditions(context: GameContext): UnlockedContent[];
  getState(): NavigationState;
  restoreState(state: NavigationState): Promise<void>;
  
  // Room content management
  loadRoomContent(room: Room): Promise<void>;
  unloadRoomContent(room: Room): Promise<void>;
  preloadAdjacentRooms(currentRoom: Room): Promise<void>;
  
  // Progression system integration
  getProgressionSystem(): RoomProgressionSystem;
}

export class NavigationManagerImpl implements NavigationManager {
  private currentRoom: Room | null = null;
  private availableRooms: Map<string, Room> = new Map();
  private unlockedRooms: Set<string> = new Set();
  private completedRooms: Set<string> = new Set();
  private unlockConditions: Map<string, UnlockCondition[]> = new Map();
  private roomTransitionHistory: string[] = [];
  private pendingUnlocks: PendingUnlock[] = [];
  private roomContentCache: Map<string, any> = new Map();
  private progressionSystem: RoomProgressionSystem;

  constructor(
    private ghostManager: GhostManager,
    private eventManager: EventManager
  ) {
    this.initializeRooms();
    this.setupUnlockConditions();
    this.progressionSystem = new RoomProgressionSystem(this, this.eventManager);
  }

  /**
   * Initialize navigation manager with current room and game context
   */
  async initialize(currentRoomId: string, gameContext: GameContext): Promise<void> {
    try {
      const room = this.availableRooms.get(currentRoomId);
      if (!room) {
        throw new Error(`Room not found: ${currentRoomId}`);
      }

      this.currentRoom = room;
      this.unlockedRooms.add(currentRoomId);
      
      // Restore state from game context if available
      if (gameContext.gameState.systemStates.navigation) {
        await this.restoreState(gameContext.gameState.systemStates.navigation);
      }
      
      // Load room-specific content
      await this.loadRoomContent(room);

      // Check for any pending unlocks based on current game state
      const unlockedContent = this.processUnlockConditions(gameContext);
      if (unlockedContent.length > 0) {
        console.log(`Unlocked ${unlockedContent.length} items during initialization`);
      }

      console.log(`NavigationManager initialized with room: ${currentRoomId}`);

    } catch (error) {
      console.error('Failed to initialize NavigationManager:', error);
      throw error;
    }
  }

  /**
   * Get current room
   */
  getCurrentRoom(): Room | null {
    return this.currentRoom;
  }

  /**
   * Get all available rooms (both locked and unlocked)
   */
  getAvailableRooms(): Room[] {
    return Array.from(this.availableRooms.values());
  }

  /**
   * Get only unlocked rooms
   */
  getUnlockedRooms(): Room[] {
    return Array.from(this.availableRooms.values()).filter(room => 
      this.unlockedRooms.has(room.key)
    );
  }

  /**
   * Get only locked rooms
   */
  getLockedRooms(): Room[] {
    return Array.from(this.availableRooms.values()).filter(room => 
      !this.unlockedRooms.has(room.key)
    );
  }

  /**
   * Check if navigation to a room is allowed
   */
  canNavigateToRoom(roomId: string, context: GameContext): boolean {
    // Check if room exists
    if (!this.availableRooms.has(roomId)) {
      return false;
    }

    const targetRoom = this.availableRooms.get(roomId)!;

    // Check if room is unlocked
    if (!this.unlockedRooms.has(roomId)) {
      return false;
    }

    // Check if already in the room
    if (this.currentRoom?.key === roomId) {
      return false;
    }

    // Check room requirements (insight, stability)
    if (targetRoom.unlockConditions.insightMin && context.gameState.meters.insight < targetRoom.unlockConditions.insightMin) {
      return false;
    }

    // Check if current room has connection to target room
    if (this.currentRoom && !this.currentRoom.transitionsTo.includes(roomId)) {
      return false;
    }

    return true;
  }

  /**
   * Navigate to a different room
   */
  async navigateToRoom(roomId: string, context: GameContext): Promise<NavigationResult> {
    try {
      // Validate navigation
      if (!this.canNavigateToRoom(roomId, context)) {
        const room = this.availableRooms.get(roomId);
        if (!room) {
          return {
            success: false,
            message: `Room "${roomId}" does not exist`,
            effects: []
          };
        }

        if (!this.unlockedRooms.has(roomId)) {
          return {
            success: false,
            message: `Room "${room.title}" is locked. ${this.getUnlockHint(roomId)}`,
            effects: []
          };
        }

        if (this.currentRoom?.key === roomId) {
          return {
            success: false,
            message: `Already in room "${room.title}"`,
            effects: []
          };
        }

        if (room.requiredInsight && context.gameState.meters.insight < room.requiredInsight) {
          return {
            success: false,
            message: `Insufficient insight for ${room.title}. Required: ${room.unlockConditions.insightMin}`,
            effects: []
          };
        }
      }

      const targetRoom = this.availableRooms.get(roomId)!;
      const previousRoom = this.currentRoom;

      // Unload previous room content if needed
      if (previousRoom) {
        await this.unloadRoomContent(previousRoom);
      }

      // Perform room transition
      await this.performRoomTransition(previousRoom, targetRoom, context);

      // Update current room
      this.currentRoom = targetRoom;
      this.roomTransitionHistory.push(roomId);

      // Load new room content
      await this.loadRoomContent(targetRoom);

      // Preload adjacent rooms for better performance
      await this.preloadAdjacentRooms(targetRoom);

      // Check for newly unlocked content
      const unlockedContent = this.processUnlockConditions(context);

      // Generate transition animation
      const transitionAnimation: TransitionAnimation = {
        type: this.getTransitionType(previousRoom, targetRoom),
        duration: 1500,
        fromRoom: previousRoom?.key,
        toRoom: targetRoom.key,
        effects: targetRoom.atmosphere.visualEffects
      };

      // Emit navigation event
      this.eventManager.emit({
        type: GameEventType.ROOM_ENTERED,
        timestamp: new Date(),
        source: 'NavigationManager',
        data: { 
          roomId, 
          previousRoom: previousRoom?.key,
          unlockedContent: unlockedContent.length,
          transitionType: transitionAnimation.type
        },
        priority: 'medium'
      });

      return {
        success: true,
        message: `Entered ${targetRoom.title}`,
        effects: this.generateTransitionEffects(previousRoom, targetRoom),
        newRoom: targetRoom,
        unlockedContent,
        transitionAnimation
      };

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
   * Unlock a room based on condition
   */
  unlockRoom(roomId: string, condition: UnlockCondition): void {
    if (!this.availableRooms.has(roomId)) {
      console.warn(`Cannot unlock non-existent room: ${roomId}`);
      return;
    }

    if (this.unlockedRooms.has(roomId)) {
      console.log(`Room ${roomId} is already unlocked`);
      return;
    }

    this.unlockedRooms.add(roomId);
    
    // Remove from pending unlocks if it was there
    this.pendingUnlocks = this.pendingUnlocks.filter(unlock => unlock.roomId !== roomId);
    
    // Emit unlock event
    this.eventManager.emit({
      type: GameEventType.CONTENT_UNLOCKED,
      timestamp: new Date(),
      source: 'NavigationManager',
      data: { roomId, condition, type: 'room' },
      priority: 'high'
    });

    console.log(`Room ${roomId} unlocked due to: ${condition.description}`);
  }

  /**
   * Check if a room's completion criteria are met
   */
  checkRoomCompletion(roomId: string, context: GameContext): boolean {
    const room = this.availableRooms.get(roomId);
    if (!room) {
      return false;
    }

    const criteria = room.completionCriteria;
    
    // Check ghosts resolved
    if (criteria.ghostsResolved) {
      const roomGhosts = this.ghostManager.getGhostsByRoom(roomId);
      const resolvedGhosts = roomGhosts.filter(ghost => 
        context.gameState.evidenceBoard.some(entry => 
          entry.type === 'ghost_encountered' && 
          entry.context.ghostId === ghost.id && 
          entry.context.resolved === true
        )
      );
      
      if (resolvedGhosts.length < criteria.ghostsResolved) {
        return false;
      }
    }

    // Check stability threshold
    if (criteria.stabilityThreshold && context.gameState.meters.stability < criteria.stabilityThreshold) {
      return false;
    }

    // Check insight threshold
    if (criteria.insightThreshold && context.gameState.meters.insight < criteria.insightThreshold) {
      return false;
    }

    // Check ethics violations
    if (criteria.ethicsViolations !== undefined) {
      const ethicsViolations = context.gameState.evidenceBoard.filter(entry => 
        entry.type === 'ethics_violation'
      ).length;
      
      if (ethicsViolations > criteria.ethicsViolations) {
        return false;
      }
    }

    // Check if all previous rooms are complete
    if (criteria.allPreviousRoomsComplete) {
      const roomOrder = ['boot-sector', 'dependency-crypt', 'ghost-memory-heap', 'possessed-compiler', 'ethics-tribunal'];
      const currentIndex = roomOrder.indexOf(roomId);
      
      for (let i = 0; i < currentIndex; i++) {
        if (!this.completedRooms.has(roomOrder[i])) {
          return false;
        }
      }
    }

    // Mark room as completed if all criteria are met
    if (!this.completedRooms.has(roomId)) {
      this.completedRooms.add(roomId);
      
      // Emit completion event
      this.eventManager.emit({
        type: GameEventType.ROOM_COMPLETED,
        timestamp: new Date(),
        source: 'NavigationManager',
        data: { roomId, criteria },
        priority: 'high'
      });
    }

    return true;
  }

  /**
   * Get progression status for all rooms
   */
  getRoomProgression(context: GameContext): RoomProgression[] {
    return Array.from(this.availableRooms.values()).map(room => {
      const isUnlocked = this.unlockedRooms.has(room.key);
      const isCompleted = this.completedRooms.has(room.key);
      
      // Calculate completion progress
      let completionProgress = 0;
      let ghostsResolved = 0;
      let totalGhosts = 0;
      
      if (isUnlocked) {
        const roomGhosts = this.ghostManager.getGhostsByRoom(room.key);
        totalGhosts = roomGhosts.length;
        
        const resolvedGhosts = roomGhosts.filter(ghost => 
          context.gameState.evidenceBoard.some(entry => 
            entry.type === 'ghost_encountered' && 
            entry.context.ghostId === ghost.id && 
            entry.context.resolved === true
          )
        );
        ghostsResolved = resolvedGhosts.length;
        
        if (totalGhosts > 0) {
          completionProgress = (ghostsResolved / totalGhosts) * 100;
        }
      }

      // Check if requirements are met for unlocking
      const meetsRequirements = isUnlocked || this.evaluateAllUnlockConditions(room.key, context);
      
      // Generate unlock hint
      let nextUnlockHint: string | undefined;
      if (!isUnlocked) {
        const conditions = this.unlockConditions.get(room.key);
        if (conditions && conditions.length > 0) {
          nextUnlockHint = conditions[0].description;
        }
      }

      return {
        roomId: room.key,
        isUnlocked,
        isCompleted,
        completionProgress,
        ghostsResolved,
        totalGhosts,
        meetsRequirements,
        nextUnlockHint
      };
    });
  }

  /**
   * Check if victory conditions are met
   */
  checkVictoryConditions(context: GameContext): boolean {
    const victoryResult = this.progressionSystem.checkVictoryConditions(context);
    return victoryResult.isVictory;
  }

  /**
   * Process unlock conditions and return newly unlocked content
   */
  processUnlockConditions(context: GameContext): UnlockedContent[] {
    const unlockedContent: UnlockedContent[] = [];

    // Use progression system for advanced unlock logic
    const newlyUnlockedRooms = this.progressionSystem.processUnlockConditions(context);
    
    for (const roomId of newlyUnlockedRooms) {
      const room = this.availableRooms.get(roomId);
      if (room) {
        unlockedContent.push({
          type: 'room',
          id: roomId,
          name: room.title,
          description: room.description
        });
      }
    }

    // Also check legacy unlock conditions for backward compatibility
    for (const [roomId, conditions] of this.unlockConditions.entries()) {
      if (this.unlockedRooms.has(roomId) || newlyUnlockedRooms.includes(roomId)) {
        continue; // Already unlocked
      }

      const shouldUnlock = conditions.every(condition => 
        this.evaluateUnlockCondition(condition, context)
      );

      if (shouldUnlock) {
        this.unlockRoom(roomId, conditions[0]); // Use first condition for description
        const room = this.availableRooms.get(roomId);
        if (room) {
          unlockedContent.push({
            type: 'room',
            id: roomId,
            name: room.title,
            description: room.description
          });
        }
      } else {
        // Update pending unlock progress
        const metConditions = conditions.filter(condition => 
          this.evaluateUnlockCondition(condition, context)
        ).length;
        
        const existingPending = this.pendingUnlocks.find(p => p.roomId === roomId);
        if (existingPending) {
          existingPending.conditionsMet = metConditions;
        } else {
          this.pendingUnlocks.push({
            roomId,
            conditionsMet: metConditions,
            totalConditions: conditions.length
          });
        }
      }
    }

    return unlockedContent;
  }

  /**
   * Get navigation state for persistence
   */
  getState(): NavigationState {
    return {
      currentRoomId: this.currentRoom?.key || 'boot-sector',
      unlockedRooms: Array.from(this.unlockedRooms),
      roomTransitionHistory: [...this.roomTransitionHistory],
      pendingUnlocks: [...this.pendingUnlocks]
    };
  }

  /**
   * Restore navigation state from persistence
   */
  async restoreState(state: NavigationState): Promise<void> {
    if (state.currentRoomId) {
      this.currentRoom = this.availableRooms.get(state.currentRoomId) || null;
    }

    if (state.unlockedRooms) {
      this.unlockedRooms = new Set(state.unlockedRooms);
    }

    if (state.roomTransitionHistory) {
      this.roomTransitionHistory = [...state.roomTransitionHistory];
    }

    if (state.pendingUnlocks) {
      this.pendingUnlocks = [...state.pendingUnlocks];
    }

    console.log('NavigationManager state restored');
  }

  /**
   * Initialize available rooms
   */
  private initializeRooms(): void {
    // Define the game rooms
    const rooms: Room[] = [
      {
        key: 'boot-sector',
        title: 'Boot Sector',
        description: 'The system initialization area where everything begins',
        entryText: 'You enter the digital void where everything begins...',
        solved: false,
        ghosts: [],
        goals: ['Initialize system understanding'],
        atmosphere: {
          lighting: 'dim blue',
          ambientSound: 'system_startup',
          visualEffects: ['boot_sequence']
        },
        hauntedModules: [],
        completionCriteria: {
          ghostsResolved: 1
        },
        unlockConditions: {
          initial: true
        },
        transitionsTo: ['dependency-crypt'],
        hooks: {}
      },
      {
        key: 'dependency-crypt',
        title: 'Dependency Crypt',
        description: 'A maze of circular imports and tangled references',
        entryText: 'You descend into the crypt where dependencies tangle...',
        solved: false,
        ghosts: [],
        goals: ['Resolve circular dependencies'],
        atmosphere: {
          lighting: 'eerie green',
          ambientSound: 'chain_rattle',
          visualEffects: ['import_shadows']
        },
        hauntedModules: [],
        completionCriteria: {
          ghostsResolved: 2
        },
        unlockConditions: {
          fromRoom: 'boot-sector',
          insightMin: 20
        },
        transitionsTo: ['boot-sector', 'ghost-memory-heap'],
        hooks: {}
      },
      {
        key: 'ghost-memory-heap',
        title: 'Ghost Memory Heap',
        description: 'Where forgotten allocations haunt the system',
        entryText: 'Memory fragments float around you like digital ghosts...',
        solved: false,
        ghosts: [],
        goals: ['Clean up memory leaks'],
        atmosphere: {
          lighting: 'flickering blue',
          ambientSound: 'memory_whispers',
          visualEffects: ['floating_allocations']
        },
        hauntedModules: [],
        completionCriteria: {
          ghostsResolved: 2
        },
        unlockConditions: {
          fromRoom: 'dependency-crypt',
          insightMin: 40
        },
        transitionsTo: ['dependency-crypt', 'possessed-compiler'],
        hooks: {}
      },
      {
        key: 'possessed-compiler',
        title: 'Possessed Compiler',
        description: 'The compilation chamber where syntax errors manifest as demons',
        entryText: 'Error messages flash like lightning across corrupted terminals...',
        solved: false,
        ghosts: [],
        goals: ['Debug compilation errors'],
        atmosphere: {
          lighting: 'red strobe',
          ambientSound: 'compilation_screams',
          visualEffects: ['syntax_lightning']
        },
        hauntedModules: [],
        completionCriteria: {
          ghostsResolved: 3
        },
        unlockConditions: {
          fromRoom: 'ghost-memory-heap',
          insightMin: 60
        },
        transitionsTo: ['ghost-memory-heap', 'ethics-tribunal'],
        hooks: {}
      },
      {
        key: 'ethics-tribunal',
        title: 'Ethics Tribunal',
        description: 'Where moral decisions about AI behavior are judged',
        entryText: 'The weight of ethical responsibility presses down on every decision...',
        solved: false,
        ghosts: [],
        goals: ['Navigate ethical dilemmas'],
        atmosphere: {
          lighting: 'golden judgment',
          ambientSound: 'moral_weight',
          visualEffects: ['scales_of_justice']
        },
        hauntedModules: [],
        completionCriteria: {
          ghostsResolved: 1,
          stabilityThreshold: 50
        },
        unlockConditions: {
          fromRoom: 'possessed-compiler',
          insightMin: 80,
          stabilityMin: 40
        },
        transitionsTo: ['possessed-compiler', 'final-merge'],
        hooks: {}
      },
      {
        key: 'final-merge',
        title: 'Final Merge',
        description: 'The convergence point where all code paths unite',
        entryText: 'All branches of reality converge in this nexus of possibility...',
        solved: false,
        ghosts: [],
        goals: ['Complete the final merge'],
        atmosphere: {
          lighting: 'prismatic convergence',
          ambientSound: 'reality_merge',
          visualEffects: ['branch_convergence']
        },
        hauntedModules: [],
        completionCriteria: {
          ghostsResolved: 1,
          allPreviousRoomsComplete: true
        },
        unlockConditions: {
          fromRoom: 'ethics-tribunal',
          insightMin: 100,
          stabilityMin: 60
        },
        transitionsTo: ['ethics-tribunal'],
        hooks: {}
      }
    ];

    // Populate rooms map
    for (const room of rooms) {
      this.availableRooms.set(room.key, room);
      if (room.unlockConditions.initial) {
        this.unlockedRooms.add(room.key);
      }
    }
  }

  /**
   * Set up unlock conditions for rooms
   */
  private setupUnlockConditions(): void {
    // Dependency Crypt - unlocked after first encounter
    this.unlockConditions.set('dependency-crypt', [
      {
        type: 'encounters_completed',
        value: 1,
        description: 'Complete your first ghost encounter'
      }
    ]);

    // Ghost Memory Heap - unlocked with insight threshold
    this.unlockConditions.set('ghost-memory-heap', [
      {
        type: 'meter_threshold',
        value: { insight: 30 },
        description: 'Gain deeper insight into system behavior'
      }
    ]);

    // Possessed Compiler - unlocked with evidence collection
    this.unlockConditions.set('possessed-compiler', [
      {
        type: 'evidence_collected',
        value: 3,
        description: 'Collect evidence from multiple encounters'
      }
    ]);

    // Ethics Tribunal - unlocked with high insight and stability
    this.unlockConditions.set('ethics-tribunal', [
      {
        type: 'meter_threshold',
        value: { insight: 70, stability: 50 },
        description: 'Demonstrate both wisdom and system stability'
      }
    ]);

    // Final Merge - unlocked after ethics tribunal completion
    this.unlockConditions.set('final-merge', [
      {
        type: 'encounters_completed',
        value: 5,
        description: 'Complete encounters in all previous areas'
      }
    ]);
  }

  /**
   * Perform room transition with effects and validation
   */
  private async performRoomTransition(
    fromRoom: Room | null, 
    toRoom: Room, 
    context: GameContext
  ): Promise<void> {
    try {
      // Validate transition requirements
      if (toRoom.requiredInsight && context.gameState.meters.insight < toRoom.requiredInsight) {
        throw new Error(`Insufficient insight for ${toRoom.title}. Required: ${toRoom.unlockConditions.insightMin}`);
      }

      // Check room connections if coming from another room
      if (fromRoom && !toRoom.transitionsTo.includes(fromRoom.key)) {
        console.warn(`Direct connection not found between ${fromRoom.key} and ${toRoom.key}`);
      }

      // Perform any room-specific transition logic
      await this.executeRoomTransitionLogic(fromRoom, toRoom, context);

      console.log(`Room transition: ${fromRoom?.key || 'none'} -> ${toRoom.key}`);

    } catch (error) {
      console.error('Room transition failed:', error);
      throw error;
    }
  }

  /**
   * Load room-specific content (ghosts, assets, etc.)
   */
  async loadRoomContent(room: Room): Promise<void> {
    try {
      // Check if content is already cached
      if (this.roomContentCache.has(room.key)) {
        console.log(`Using cached content for room ${room.key}`);
        return;
      }

      // Load ghosts for this room
      const roomGhosts = this.ghostManager.getGhostsByRoom(room.key);
      
      // Prepare room atmosphere effects
      const atmosphereEffects = {
        lighting: room.atmosphere.lighting,
        ambientSound: room.atmosphere.ambientSound,
        visualEffects: room.atmosphere.visualEffects
      };

      // Cache the loaded content
      this.roomContentCache.set(room.key, {
        ghosts: roomGhosts,
        atmosphere: atmosphereEffects,
        loadedAt: new Date()
      });
      
      console.log(`Loaded content for room ${room.key}: ${roomGhosts.length} ghosts`);

    } catch (error) {
      console.error(`Failed to load content for room ${room.key}:`, error);
    }
  }

  /**
   * Unload room-specific content to free memory
   */
  async unloadRoomContent(room: Room): Promise<void> {
    try {
      // Remove from cache if it exists
      if (this.roomContentCache.has(room.key)) {
        this.roomContentCache.delete(room.key);
        console.log(`Unloaded content for room ${room.key}`);
      }

      // Additional cleanup could go here (stop ambient sounds, clear effects, etc.)

    } catch (error) {
      console.error(`Failed to unload content for room ${room.key}:`, error);
    }
  }

  /**
   * Preload content for adjacent rooms to improve performance
   */
  async preloadAdjacentRooms(currentRoom: Room): Promise<void> {
    try {
      const adjacentRoomIds = currentRoom.transitionsTo.filter(roomId => 
        this.unlockedRooms.has(roomId) && !this.roomContentCache.has(roomId)
      );

      for (const roomId of adjacentRoomIds) {
        const room = this.availableRooms.get(roomId);
        if (room) {
          await this.loadRoomContent(room);
        }
      }

      if (adjacentRoomIds.length > 0) {
        console.log(`Preloaded ${adjacentRoomIds.length} adjacent rooms`);
      }

    } catch (error) {
      console.error('Failed to preload adjacent rooms:', error);
    }
  }

  /**
   * Evaluate all unlock conditions for a room
   */
  private evaluateAllUnlockConditions(roomId: string, context: GameContext): boolean {
    const conditions = this.unlockConditions.get(roomId);
    if (!conditions) {
      return false;
    }

    return conditions.every(condition => 
      this.evaluateUnlockCondition(condition, context)
    );
  }

  /**
   * Get transition animation type based on room change
   */
  private getTransitionType(fromRoom: Room | null, toRoom: Room): TransitionAnimation['type'] {
    // Special transitions for specific room combinations
    if (!fromRoom) {
      return 'fade';
    }

    if (fromRoom.key === 'boot-sector' && toRoom.key === 'dependency-crypt') {
      return 'slide';
    }

    if (toRoom.key === 'final-merge') {
      return 'portal';
    }

    if (fromRoom.atmosphere.lighting !== toRoom.atmosphere.lighting) {
      return 'dissolve';
    }

    return 'fade';
  }

  /**
   * Evaluate if an unlock condition is met
   */
  private evaluateUnlockCondition(condition: UnlockCondition, context: GameContext): boolean {
    switch (condition.type) {
      case 'encounters_completed':
        // Count completed encounters from evidence board
        const completedEncounters = context.gameState.evidenceBoard.filter(
          entry => entry.type === 'ghost_encountered' && entry.context.resolved
        ).length;
        return completedEncounters >= condition.value;

      case 'meter_threshold':
        const { insight, stability } = condition.value;
        const meetsInsight = !insight || context.gameState.meters.insight >= insight;
        const meetsStability = !stability || context.gameState.meters.stability >= stability;
        return meetsInsight && meetsStability;

      case 'evidence_collected':
        return context.gameState.evidenceBoard.length >= condition.value;

      case 'time_elapsed':
        const elapsed = Date.now() - new Date(context.gameState.run.startedAt).getTime();
        return elapsed >= condition.value;

      default:
        console.warn(`Unknown unlock condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Generate visual/audio effects for room transitions
   */
  private generateTransitionEffects(fromRoom: Room | null, toRoom: Room): NavigationEffect[] {
    const effects: NavigationEffect[] = [];

    // Room entry effect
    effects.push({
      type: 'room_transition',
      data: {
        fromRoom: fromRoom?.key,
        toRoom: toRoom.key,
        transitionType: this.getTransitionType(fromRoom, toRoom)
      },
      duration: 1500,
      priority: 'high'
    });

    // Room-specific atmosphere effect
    effects.push({
      type: 'atmosphere_change',
      data: {
        atmosphere: toRoom.atmosphere,
        intensity: 0.7,
        lighting: toRoom.atmosphere.lighting,
        ambientSound: toRoom.atmosphere.ambientSound,
        visualEffects: toRoom.atmosphere.visualEffects
      },
      duration: 2000,
      priority: 'medium'
    });

    // Progression update effect
    effects.push({
      type: 'progression_update',
      data: {
        roomId: toRoom.key,
        roomName: toRoom.title,
        entryText: toRoom.entryText
      },
      priority: 'low'
    });

    return effects;
  }

  /**
   * Get hint for unlocking a room
   */
  private getUnlockHint(roomId: string): string {
    const conditions = this.unlockConditions.get(roomId);
    if (!conditions || conditions.length === 0) {
      return 'Unlock conditions unknown.';
    }

    return `Unlock requirement: ${conditions[0].description}`;
  }

  /**
   * Execute room-specific transition logic
   */
  private async executeRoomTransitionLogic(
    fromRoom: Room | null, 
    toRoom: Room, 
    context: GameContext
  ): Promise<void> {
    // Room-specific logic can be added here
    switch (toRoom.key) {
      case 'ethics-tribunal':
        // Special validation for ethics tribunal
        if (context.gameState.meters.stability < 30) {
          throw new Error('System too unstable for ethical deliberation');
        }
        break;

      case 'final-merge':
        // Ensure player is ready for final challenge
        if (context.gameState.meters.insight < 90) {
          throw new Error('Insufficient understanding for the final merge');
        }
        break;

      default:
        // No special logic needed
        break;
    }
  }

  /**
   * Get the progression system for external access
   */
  getProgressionSystem(): RoomProgressionSystem {
    return this.progressionSystem;
  }
}