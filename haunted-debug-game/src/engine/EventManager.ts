/**
 * EventManager - Event bus system for cross-system communication
 */

export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  source: string;
  data: Record<string, any>;
  priority: EventPriority;
  id?: string;
}

export enum GameEventType {
  // System events
  SYSTEM_INITIALIZED = 'system_initialized',
  SYSTEM_ERROR = 'system_error',
  CRITICAL_EVENT = 'critical_event',
  
  // Gameplay events
  ENCOUNTER_STARTED = 'encounter_started',
  ENCOUNTER_COMPLETED = 'encounter_completed',
  DIALOGUE_CHOICE_MADE = 'dialogue_choice_made',
  PATCH_APPLIED = 'patch_applied',
  PATCH_GENERATED = 'patch_generated',
  
  // State change events
  METER_CHANGED = 'meter_changed',
  ROOM_ENTERED = 'room_entered',
  CONTENT_UNLOCKED = 'content_unlocked',
  ACHIEVEMENT_EARNED = 'achievement_earned',
  
  // Player events
  PLAYER_ACTION = 'player_action',
  PLAYER_CHOICE = 'player_choice',
  LEARNING_PROGRESS = 'learning_progress',
  
  // Effect events
  VISUAL_EFFECT_TRIGGERED = 'visual_effect_triggered',
  AUDIO_EFFECT_TRIGGERED = 'audio_effect_triggered',
  EFFECT_COMPLETED = 'effect_completed',
  
  // Session events
  SESSION_SAVED = 'session_saved',
  SESSION_LOADED = 'session_loaded',
  
  // Navigation events
  ROOM_UNLOCKED = 'room_unlocked',
  ROOM_COMPLETED = 'room_completed',
  NAVIGATION_BLOCKED = 'navigation_blocked',
  
  // Educational events
  SKILL_IMPROVED = 'skill_improved',
  CONCEPT_LEARNED = 'concept_learned'
}

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export type EventHandler = (event: GameEvent) => Promise<void> | void;

export interface EventSubscription {
  id: string;
  eventType: GameEventType;
  handler: EventHandler;
  priority: EventPriority;
  once: boolean;
}

export interface EventManager {
  emit(event: GameEvent): void;
  on(eventType: GameEventType, handler: EventHandler, priority?: EventPriority): string;
  once(eventType: GameEventType, handler: EventHandler, priority?: EventPriority): string;
  off(subscriptionId: string): boolean;
  offAll(eventType?: GameEventType): void;
  getEventHistory(eventType?: GameEventType, limit?: number): GameEvent[];
  cleanup(): void;
}

export class EventManagerImpl implements EventManager {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: GameEvent[] = [];
  private eventQueue: GameEvent[] = [];
  private isProcessing: boolean = false;
  private maxHistorySize: number = 1000;
  private processingTimeout: number | null = null;

  /**
   * Emit an event to all subscribers
   */
  emit(event: GameEvent): void {
    // Add unique ID if not provided
    if (!event.id) {
      event.id = this.generateEventId();
    }

    // Add to history
    this.addToHistory(event);

    // Add to processing queue
    this.eventQueue.push(event);

    // Process queue asynchronously
    this.scheduleProcessing();
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: GameEventType, handler: EventHandler, priority: EventPriority = 'medium'): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      priority,
      once: false
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  /**
   * Subscribe to an event type for one-time execution
   */
  once(eventType: GameEventType, handler: EventHandler, priority: EventPriority = 'medium'): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      priority,
      once: true
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  /**
   * Unsubscribe from an event
   */
  off(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Unsubscribe all handlers for an event type, or all handlers if no type specified
   */
  offAll(eventType?: GameEventType): void {
    if (eventType) {
      // Remove all subscriptions for specific event type
      for (const [id, subscription] of this.subscriptions.entries()) {
        if (subscription.eventType === eventType) {
          this.subscriptions.delete(id);
        }
      }
    } else {
      // Remove all subscriptions
      this.subscriptions.clear();
    }
  }

  /**
   * Get event history
   */
  getEventHistory(eventType?: GameEventType, limit?: number): GameEvent[] {
    let events = this.eventHistory;

    // Filter by event type if specified
    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      events = events.slice(-limit);
    }

    return [...events]; // Return copy to prevent external modification
  }

  /**
   * Cleanup resources and clear all subscriptions
   */
  cleanup(): void {
    // Clear processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    // Clear all subscriptions
    this.subscriptions.clear();

    // Clear event queue
    this.eventQueue = [];

    // Clear history (keep some recent events for debugging)
    this.eventHistory = this.eventHistory.slice(-100);

    console.log('EventManager cleanup completed');
  }

  /**
   * Get current subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get subscription info for debugging
   */
  getSubscriptionInfo(): Array<{ eventType: GameEventType; count: number }> {
    const eventTypeCounts = new Map<GameEventType, number>();

    for (const subscription of this.subscriptions.values()) {
      const current = eventTypeCounts.get(subscription.eventType) || 0;
      eventTypeCounts.set(subscription.eventType, current + 1);
    }

    return Array.from(eventTypeCounts.entries()).map(([eventType, count]) => ({
      eventType,
      count
    }));
  }

  /**
   * Schedule event processing
   */
  private scheduleProcessing(): void {
    if (this.isProcessing || this.processingTimeout) {
      return; // Already scheduled or processing
    }

    this.processingTimeout = window.setTimeout(() => {
      this.processingTimeout = null;
      this.processEventQueue();
    }, 0);
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process events in batches to prevent blocking
      const batchSize = 10;
      const batch = this.eventQueue.splice(0, batchSize);

      for (const event of batch) {
        await this.processEvent(event);
      }

      // If there are more events, schedule next batch
      if (this.eventQueue.length > 0) {
        this.scheduleProcessing();
      }

    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: GameEvent): Promise<void> {
    // Get all subscriptions for this event type
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.eventType === event.type);

    // Sort by priority (critical > high > medium > low)
    relevantSubscriptions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Execute handlers
    const handlersToRemove: string[] = [];

    for (const subscription of relevantSubscriptions) {
      try {
        await this.executeHandler(subscription.handler, event);

        // Mark one-time subscriptions for removal
        if (subscription.once) {
          handlersToRemove.push(subscription.id);
        }

      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
        
        // Emit error event (but prevent infinite loops)
        if (event.type !== GameEventType.SYSTEM_ERROR) {
          this.emit({
            type: GameEventType.SYSTEM_ERROR,
            timestamp: new Date(),
            source: 'EventManager',
            data: {
              originalEvent: event,
              error: (error as Error).message,
              handlerInfo: {
                subscriptionId: subscription.id,
                eventType: subscription.eventType
              }
            },
            priority: 'high'
          });
        }
      }
    }

    // Remove one-time subscriptions
    for (const id of handlersToRemove) {
      this.subscriptions.delete(id);
    }
  }

  /**
   * Execute event handler with timeout protection
   */
  private async executeHandler(handler: EventHandler, event: GameEvent): Promise<void> {
    const timeoutMs = 5000; // 5 second timeout for handlers

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Event handler timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = handler(event);

        if (result instanceof Promise) {
          result
            .then(() => {
              clearTimeout(timeout);
              resolve();
            })
            .catch((error) => {
              clearTimeout(timeout);
              reject(error);
            });
        } else {
          clearTimeout(timeout);
          resolve();
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: GameEvent): void {
    this.eventHistory.push(event);

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}