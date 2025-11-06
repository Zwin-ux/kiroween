/**
 * useProgressTracking - Hook for room progression and completion tracking
 */

import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEvidenceTimeline } from './useEvidenceTimeline';
import { 
  ProgressTracker, 
  type RoomProgress, 
  type ProgressAnalytics,
  type ProgressRequirement 
} from '../engine/ProgressTracker';

export interface UseProgressTrackingReturn {
  // Progress tracker instance
  progressTracker: ProgressTracker;
  
  // Room progress
  allRoomProgress: RoomProgress[];
  currentRoomProgress: RoomProgress | null;
  nextRecommendedRoom: string | null;
  unlockableRooms: string[];
  
  // Analytics
  analytics: ProgressAnalytics;
  
  // Actions
  updateProgress: () => void;
  checkRoomUnlock: (roomId: string) => boolean;
  getRoomProgress: (roomId: string) => RoomProgress | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

export function useProgressTracking(): UseProgressTrackingReturn {
  const gameStore = useGameStore();
  const { entries: timelineEntries } = useEvidenceTimeline();
  
  const [progressTracker] = useState(() => new ProgressTracker());
  const [analytics, setAnalytics] = useState<ProgressAnalytics>({
    overallProgress: 0,
    roomsCompleted: 0,
    totalRooms: 6,
    currentStreak: 0,
    longestStreak: 0,
    averageTimePerRoom: 0,
    learningVelocity: 0,
    efficiencyScore: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update progress when timeline changes
  const updateProgress = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newAnalytics = progressTracker.updateProgress(timelineEntries, gameStore);
      setAnalytics(newAnalytics);
      
      // Check for newly unlockable rooms
      const unlockable = progressTracker.getUnlockableRooms(timelineEntries, gameStore);
      for (const roomId of unlockable) {
        if (!gameStore.unlockedRooms.includes(roomId)) {
          gameStore.unlockRoom(roomId);
          
          // Record room unlock event
          gameStore.recordTimelineEntry({
            category: 'progression',
            description: `Unlocked room: ${roomId}`,
            context: { roomId, unlockType: 'automatic' },
            outcome: 'success',
            learningPoints: [`Successfully met requirements to unlock ${roomId}`],
            conceptsInvolved: ['progression', 'achievement'],
            skillsApplied: ['goal_achievement', 'skill_development']
          });
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to update progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update progress');
      setIsLoading(false);
    }
  };

  // Auto-update progress when timeline changes
  useEffect(() => {
    updateProgress();
  }, [timelineEntries.length, gameStore.currentRoom]);

  // Get all room progress
  const allRoomProgress = useMemo(() => {
    return progressTracker.getAllRoomProgress();
  }, [progressTracker, analytics]); // Re-calculate when analytics change

  // Get current room progress
  const currentRoomProgress = useMemo(() => {
    return progressTracker.getRoomProgress(gameStore.currentRoom);
  }, [progressTracker, gameStore.currentRoom, analytics]);

  // Get next recommended room
  const nextRecommendedRoom = useMemo(() => {
    return progressTracker.getNextRecommendedRoom(timelineEntries, gameStore);
  }, [progressTracker, timelineEntries, gameStore.currentRoom, analytics]);

  // Get unlockable rooms
  const unlockableRooms = useMemo(() => {
    return progressTracker.getUnlockableRooms(timelineEntries, gameStore);
  }, [progressTracker, timelineEntries, analytics]);

  // Check if a specific room can be unlocked
  const checkRoomUnlock = (roomId: string): boolean => {
    return progressTracker.checkUnlockConditions(roomId, timelineEntries, gameStore);
  };

  // Get progress for a specific room
  const getRoomProgress = (roomId: string): RoomProgress | null => {
    return progressTracker.getRoomProgress(roomId);
  };

  return {
    progressTracker,
    allRoomProgress,
    currentRoomProgress,
    nextRecommendedRoom,
    unlockableRooms,
    analytics,
    updateProgress,
    checkRoomUnlock,
    getRoomProgress,
    isLoading,
    error
  };
}

// Helper hook for room completion status
export function useRoomCompletion(roomId: string) {
  const { getRoomProgress } = useProgressTracking();
  
  return useMemo(() => {
    const progress = getRoomProgress(roomId);
    return {
      isUnlocked: progress?.isUnlocked || false,
      isCompleted: progress?.isCompleted || false,
      completionPercentage: progress?.completionPercentage || 0,
      requirements: progress?.requirements || [],
      completedRequirements: progress?.completedRequirements || [],
      estimatedTimeToComplete: progress?.estimatedTimeToComplete || 0
    };
  }, [roomId, getRoomProgress]);
}

// Helper hook for progress analytics
export function useProgressAnalytics() {
  const { analytics } = useProgressTracking();
  
  return useMemo(() => ({
    ...analytics,
    progressPercentage: analytics.overallProgress * 100,
    isOnStreak: analytics.currentStreak > 0,
    isHighPerformer: analytics.efficiencyScore > 0.7,
    learningRate: analytics.learningVelocity > 1 ? 'fast' : 
                  analytics.learningVelocity > 0.5 ? 'moderate' : 'slow'
  }), [analytics]);
}