/**
 * useEffectCoordinator - Hook for coordinating visual and audio effects
 */

import { useState, useCallback, useEffect } from 'react';
import { EffectCoordinatorImpl } from '@/engine/EffectCoordinator';
import { EffectsSystemImpl } from '@/engine/EffectsSystem';
import { useGameStore } from '@/store/gameStore';
import type { Ghost } from '@/types/content';
import type { MeterEffects } from '@/types/game';

interface UseEffectCoordinatorReturn {
  isInitialized: boolean;
  triggerEncounterStart: (ghost: Ghost) => void;
  triggerMeterChange: (effects: MeterEffects) => void;
  triggerRoomTransition: (roomId: string) => void;
  triggerPatchApplication: (success: boolean, risk: number) => void;
  triggerCriticalEvent: (eventType: string, intensity: number) => void;
  setAccessibilitySettings: (settings: any) => void;
}

export function useEffectCoordinator(): UseEffectCoordinatorReturn {
  const gameStore = useGameStore();
  const [effectCoordinator, setEffectCoordinator] = useState<EffectCoordinatorImpl | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize effect coordinator
  useEffect(() => {
    const initializeCoordinator = async () => {
      try {
        const effectsSystem = new EffectsSystemImpl();
        
        // Create mock event manager
        const mockEventManager = {
          emit: (event: any) => {
            console.log('Effect event:', event);
          },
          on: (eventType: string, handler: Function) => {
            // Mock event subscription
          },
          off: (eventType: string, handler: Function) => {
            // Mock event unsubscription
          },
          cleanup: () => {
            // Mock cleanup
          }
        };

        const coordinator = new EffectCoordinatorImpl(
          effectsSystem,
          mockEventManager as any
        );

        await coordinator.initialize();
        
        // Apply current accessibility settings
        const accessibilitySettings = gameStore.systemStates.effects.accessibilitySettings;
        coordinator.setAccessibilityMode(accessibilitySettings);

        setEffectCoordinator(coordinator);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('Failed to initialize effect coordinator:', error);
      }
    };

    if (!effectCoordinator) {
      initializeCoordinator();
    }
  }, [effectCoordinator, gameStore.systemStates.effects.accessibilitySettings]);

  const triggerEncounterStart = useCallback((ghost: Ghost) => {
    if (!effectCoordinator || !isInitialized) return;

    try {
      // Create encounter start event
      const eventData = {
        ghostId: ghost.id,
        ghostName: ghost.name,
        softwareSmell: ghost.softwareSmell,
        severity: ghost.severity,
        roomId: gameStore.currentRoom
      };

      effectCoordinator.processEncounterStart(eventData);
      
      // Update effect coordinator state in store
      gameStore.updateEffectCoordinatorState({
        activeEffects: [
          ...gameStore.systemStates.effects.activeEffects,
          {
            id: `encounter_${ghost.id}_${Date.now()}`,
            type: 'encounter_start',
            intensity: ghost.severity / 10,
            duration: 3000,
            startTime: new Date()
          }
        ]
      });
      
    } catch (error) {
      console.error('Failed to trigger encounter start effects:', error);
    }
  }, [effectCoordinator, isInitialized, gameStore]);

  const triggerMeterChange = useCallback((effects: MeterEffects) => {
    if (!effectCoordinator || !isInitialized) return;

    try {
      effectCoordinator.processMeterChange(effects);
      
      // Determine effect intensity based on meter changes
      const totalChange = Math.abs(effects.stability) + Math.abs(effects.insight);
      const intensity = Math.min(1.0, totalChange / 50); // Normalize to 0-1

      // Add visual feedback effect
      gameStore.updateEffectCoordinatorState({
        activeEffects: [
          ...gameStore.systemStates.effects.activeEffects,
          {
            id: `meter_change_${Date.now()}`,
            type: effects.stability > 0 ? 'stability_increase' : 'stability_decrease',
            intensity,
            duration: 2000,
            startTime: new Date()
          }
        ]
      });
      
    } catch (error) {
      console.error('Failed to trigger meter change effects:', error);
    }
  }, [effectCoordinator, isInitialized, gameStore]);

  const triggerRoomTransition = useCallback((roomId: string) => {
    if (!effectCoordinator || !isInitialized) return;

    try {
      const eventData = {
        fromRoom: gameStore.currentRoom,
        toRoom: roomId,
        timestamp: new Date()
      };

      effectCoordinator.processRoomChange(eventData);
      
      // Add room transition effect
      gameStore.updateEffectCoordinatorState({
        activeEffects: [
          ...gameStore.systemStates.effects.activeEffects,
          {
            id: `room_transition_${Date.now()}`,
            type: 'room_transition',
            intensity: 0.7,
            duration: 1500,
            startTime: new Date()
          }
        ]
      });
      
    } catch (error) {
      console.error('Failed to trigger room transition effects:', error);
    }
  }, [effectCoordinator, isInitialized, gameStore]);

  const triggerPatchApplication = useCallback((success: boolean, risk: number) => {
    if (!effectCoordinator || !isInitialized) return;

    try {
      // Create patch application event
      const eventData = {
        success,
        risk,
        timestamp: new Date()
      };

      // Process through effect coordinator (assuming it has this method)
      if ('processPatchApplication' in effectCoordinator) {
        (effectCoordinator as any).processPatchApplication(eventData);
      }
      
      // Add patch application effect
      const effectType = success ? 'patch_success' : 'patch_failure';
      const intensity = success ? Math.min(0.8, risk) : Math.min(1.0, risk + 0.3);

      gameStore.updateEffectCoordinatorState({
        activeEffects: [
          ...gameStore.systemStates.effects.activeEffects,
          {
            id: `patch_${success ? 'success' : 'failure'}_${Date.now()}`,
            type: effectType,
            intensity,
            duration: success ? 2000 : 3000,
            startTime: new Date()
          }
        ]
      });
      
    } catch (error) {
      console.error('Failed to trigger patch application effects:', error);
    }
  }, [effectCoordinator, isInitialized, gameStore]);

  const triggerCriticalEvent = useCallback((eventType: string, intensity: number) => {
    if (!effectCoordinator || !isInitialized) return;

    try {
      // Add critical event effect
      gameStore.updateEffectCoordinatorState({
        activeEffects: [
          ...gameStore.systemStates.effects.activeEffects,
          {
            id: `critical_${eventType}_${Date.now()}`,
            type: 'critical_event',
            intensity: Math.min(1.0, intensity),
            duration: 5000,
            startTime: new Date()
          }
        ]
      });
      
    } catch (error) {
      console.error('Failed to trigger critical event effects:', error);
    }
  }, [effectCoordinator, isInitialized, gameStore]);

  const setAccessibilitySettings = useCallback((settings: any) => {
    if (!effectCoordinator || !isInitialized) return;

    try {
      effectCoordinator.setAccessibilityMode(settings);
      
      // Update settings in store
      gameStore.updateEffectCoordinatorState({
        accessibilitySettings: settings
      });
      
    } catch (error) {
      console.error('Failed to update accessibility settings:', error);
    }
  }, [effectCoordinator, isInitialized, gameStore]);

  // Cleanup effects that have expired
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const activeEffects = gameStore.systemStates.effects.activeEffects;
      
      const stillActiveEffects = activeEffects.filter(effect => {
        const elapsed = now.getTime() - effect.startTime.getTime();
        return elapsed < effect.duration;
      });

      if (stillActiveEffects.length !== activeEffects.length) {
        gameStore.updateEffectCoordinatorState({
          activeEffects: stillActiveEffects
        });
      }
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [gameStore]);

  return {
    isInitialized,
    triggerEncounterStart,
    triggerMeterChange,
    triggerRoomTransition,
    triggerPatchApplication,
    triggerCriticalEvent,
    setAccessibilitySettings
  };
}