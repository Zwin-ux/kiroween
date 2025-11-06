/**
 * EventManager Test - Verify event bus functionality
 */

import { EventManagerImpl, GameEventType, type GameEvent } from '../EventManager';

describe('EventManager', () => {
  let eventManager: EventManagerImpl;

  beforeEach(() => {
    eventManager = new EventManagerImpl();
  });

  afterEach(() => {
    eventManager.cleanup();
  });

  test('should emit and handle events', async () => {
    const mockHandler = jest.fn();
    
    // Subscribe to event
    const subscriptionId = eventManager.on(GameEventType.METER_CHANGED, mockHandler);
    
    // Emit event
    const testEvent: GameEvent = {
      type: GameEventType.METER_CHANGED,
      timestamp: new Date(),
      source: 'test',
      data: { stability: 50, insight: 75 },
      priority: 'medium'
    };
    
    eventManager.emit(testEvent);
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockHandler).toHaveBeenCalledWith(testEvent);
    expect(eventManager.off(subscriptionId)).toBe(true);
  });

  test('should handle event priorities correctly', async () => {
    const callOrder: string[] = [];
    
    const lowHandler = jest.fn(() => callOrder.push('low'));
    const highHandler = jest.fn(() => callOrder.push('high'));
    const criticalHandler = jest.fn(() => callOrder.push('critical'));
    
    eventManager.on(GameEventType.CRITICAL_EVENT, lowHandler, 'low');
    eventManager.on(GameEventType.CRITICAL_EVENT, highHandler, 'high');
    eventManager.on(GameEventType.CRITICAL_EVENT, criticalHandler, 'critical');
    
    const testEvent: GameEvent = {
      type: GameEventType.CRITICAL_EVENT,
      timestamp: new Date(),
      source: 'test',
      data: {},
      priority: 'critical'
    };
    
    eventManager.emit(testEvent);
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(callOrder).toEqual(['critical', 'high', 'low']);
  });

  test('should maintain event history', () => {
    const testEvent: GameEvent = {
      type: GameEventType.ENCOUNTER_STARTED,
      timestamp: new Date(),
      source: 'test',
      data: { ghostId: 'test-ghost' },
      priority: 'high'
    };
    
    eventManager.emit(testEvent);
    
    const history = eventManager.getEventHistory(GameEventType.ENCOUNTER_STARTED);
    expect(history).toHaveLength(1);
    expect(history[0].data.ghostId).toBe('test-ghost');
  });

  test('should handle one-time subscriptions', async () => {
    const mockHandler = jest.fn();
    
    eventManager.once(GameEventType.PATCH_GENERATED, mockHandler);
    
    const testEvent: GameEvent = {
      type: GameEventType.PATCH_GENERATED,
      timestamp: new Date(),
      source: 'test',
      data: { patchId: 'test-patch' },
      priority: 'medium'
    };
    
    // Emit twice
    eventManager.emit(testEvent);
    eventManager.emit(testEvent);
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should only be called once
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});