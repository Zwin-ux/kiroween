/**
 * Room Manager - Handles room navigation, transitions, and state management
 */

import type { 
  Room, 
  RoomTransition, 
  TransitionResult,
  GameState,
  HookContext,
  MCPTools
} from '@/types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private transitions: RoomTransition[] = [];
  private hooks: Map<string, (ctx: HookContext) => Promise<HookContext>> = new Map();

  constructor(
    rooms: Room[],
    transitions: RoomTransition[],
    private mcpTools: MCPTools
  ) {
    // Initialize rooms map
    rooms.forEach(room => {
      this.rooms.set(room.key, room);
    });
    
    this.transitions = transitions;
  }

  /**
   * Get current room from game state
   */
  getCurrentRoom(gameState: GameState): Room | null {
    return this.rooms.get(gameState.currentRoom) || null;
  }

  /**
   * Get all available rooms that can be transitioned to
   */
  getAvailableRooms(gameState: GameState): Room[] {
    const currentRoom = this.getCurrentRoom(gameState);
    if (!currentRoom) return [];

    return currentRoom.transitionsTo
      .map(roomKey => this.rooms.get(roomKey))
      .filter((room): room is Room => room !== undefined)
      .filter(room => this.checkTransitionConditions(gameState.currentRoom, room.key, gameState));
  }

  /**
   * Check if transition from one room to another is allowed
   */
  checkTransitionConditions(fromRoomKey: string, toRoomKey: string, gameState: GameState): boolean {
    // Find the transition rule
    const transition = this.transitions.find(t => 
      t.from === fromRoomKey && t.to === toRoomKey
    );

    if (!transition) {
      return false;
    }

    // Evaluate the transition condition
    return this.evaluateCondition(transition.condition, gameState);
  }

  /**
   * Attempt to transition to a new room
   */
  async transitionTo(roomKey: string, gameState: GameState): Promise<TransitionResult> {
    const currentRoom = this.getCurrentRoom(gameState);
    const targetRoom = this.rooms.get(roomKey);

    if (!currentRoom || !targetRoom) {
      return {
        success: false,
        error: 'Invalid room transition: room not found'
      };
    }

    // Check if transition is allowed
    if (!this.checkTransitionConditions(currentRoom.key, roomKey, gameState)) {
      return {
        success: false,
        error: 'Transition conditions not met'
      };
    }

    try {
      // Execute room entry logic
      await this.executeRoomEntry(targetRoom, gameState);

      return {
        success: true,
        newRoom: targetRoom
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to enter room: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Execute room entry logic including hooks
   */
  async executeRoomEntry(room: Room, gameState: GameState): Promise<void> {
    // Create hook context
    const hookContext: HookContext = {
      gameState,
      room,
      tools: this.mcpTools
    };

    // Execute onRoomEnter hook if it exists
    if (room.hooks.onEnter) {
      const hookFn = this.hooks.get(room.hooks.onEnter);
      if (hookFn) {
        await hookFn(hookContext);
      }
    }

    // Trigger ambient effects based on room atmosphere
    await this.triggerAmbientEffects(room);
  }

  /**
   * Register a hook function
   */
  registerHook(hookName: string, hookFn: (ctx: HookContext) => Promise<HookContext>): void {
    this.hooks.set(hookName, hookFn);
  }

  /**
   * Get room by key
   */
  getRoom(roomKey: string): Room | undefined {
    return this.rooms.get(roomKey);
  }

  /**
   * Get all rooms
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Check if room is unlocked based on game state
   */
  isRoomUnlocked(roomKey: string, gameState: GameState): boolean {
    return gameState.unlockedRooms.includes(roomKey);
  }

  /**
   * Mark room as solved
   */
  markRoomSolved(roomKey: string): void {
    const room = this.rooms.get(roomKey);
    if (room) {
      room.solved = true;
    }
  }

  /**
   * Check if room completion criteria are met
   */
  checkRoomCompletion(roomKey: string, gameState: GameState): boolean {
    const room = this.rooms.get(roomKey);
    if (!room) return false;

    const criteria = room.completionCriteria;
    
    // Check ghosts resolved (this would need to be tracked in game state)
    // For now, we'll assume this is tracked elsewhere
    
    // Check stability threshold
    if (criteria.stabilityThreshold && gameState.meters.stability < criteria.stabilityThreshold) {
      return false;
    }

    // Check insight threshold
    if (criteria.insightThreshold && gameState.meters.insight < criteria.insightThreshold) {
      return false;
    }

    // Check ethics violations
    if (criteria.ethicsViolations !== undefined) {
      // This would need to be tracked in game state
      // For now, assume no violations
    }

    // Check if all previous rooms are complete
    if (criteria.allPreviousRoomsComplete) {
      // This would need more complex logic to check room progression
      // For now, assume it's handled elsewhere
    }

    return true;
  }

  /**
   * Private method to evaluate condition strings
   */
  private evaluateCondition(condition: string, gameState: GameState): boolean {
    try {
      // Simple condition evaluation - in a real implementation, 
      // this would use a proper expression parser
      
      // Handle stability conditions
      if (condition.includes('stability >=')) {
        const threshold = parseInt(condition.match(/stability >= (\d+)/)?.[1] || '0');
        return gameState.meters.stability >= threshold;
      }
      
      if (condition.includes('stability <=')) {
        const threshold = parseInt(condition.match(/stability <= (\d+)/)?.[1] || '0');
        return gameState.meters.stability <= threshold;
      }

      // Handle insight conditions
      if (condition.includes('insight >=')) {
        const threshold = parseInt(condition.match(/insight >= (\d+)/)?.[1] || '0');
        return gameState.meters.insight >= threshold;
      }

      // Handle room solved conditions
      if (condition.includes('.solved == true')) {
        const roomKey = condition.match(/(\w+)\.solved == true/)?.[1];
        if (roomKey) {
          const room = this.rooms.get(roomKey);
          return room?.solved || false;
        }
      }

      // Handle compound conditions with &&
      if (condition.includes(' && ')) {
        const parts = condition.split(' && ');
        return parts.every(part => this.evaluateCondition(part.trim(), gameState));
      }

      // Default to false for unknown conditions
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  /**
   * Private method to trigger ambient effects for a room
   */
  private async triggerAmbientEffects(room: Room): Promise<void> {
    try {
      // Queue ambient sound effect
      if (room.atmosphere.ambientSound) {
        await this.mcpTools.sfx.queue({
          type: 'ambient',
          sound: room.atmosphere.ambientSound,
          loop: true,
          volume: 0.3
        } as any);
      }

      // Trigger visual effects
      for (const effect of room.atmosphere.visualEffects) {
        await this.mcpTools.shader.generate(effect as any);
      }
    } catch (error) {
      console.error('Error triggering ambient effects:', error);
      // Don't throw - ambient effects are non-critical
    }
  }
}