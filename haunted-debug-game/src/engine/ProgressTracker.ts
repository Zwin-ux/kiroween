/**
 * ProgressTracker - Room completion and unlock logic integration
 */

import type { EvidenceTimelineEntry } from './EvidenceTimeline';
import type { GameState } from '../types/game';

export interface ProgressRequirement {
  type: 'encounters_completed' | 'patches_applied' | 'success_rate' | 'concepts_learned' | 'time_spent';
  value: number;
  description: string;
}

export interface RoomProgress {
  roomId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  completionPercentage: number;
  requirements: ProgressRequirement[];
  completedRequirements: string[];
  nextUnlockConditions?: ProgressRequirement[];
  estimatedTimeToComplete?: number; // minutes
}

export interface UnlockCondition {
  roomId: string;
  requirements: ProgressRequirement[];
  description: string;
}

export interface ProgressAnalytics {
  overallProgress: number; // 0.0 to 1.0
  roomsCompleted: number;
  totalRooms: number;
  currentStreak: number; // consecutive successful decisions
  longestStreak: number;
  averageTimePerRoom: number; // minutes
  learningVelocity: number; // concepts per hour
  efficiencyScore: number; // 0.0 to 1.0
}

export class ProgressTracker {
  private roomDefinitions: Map<string, RoomProgress> = new Map();
  private unlockConditions: Map<string, UnlockCondition> = new Map();
  
  constructor() {
    this.initializeRoomDefinitions();
    this.initializeUnlockConditions();
  }

  /**
   * Update progress based on timeline entries
   */
  updateProgress(timeline: EvidenceTimelineEntry[], gameState: GameState): ProgressAnalytics {
    // Update room progress
    for (const [roomId, roomProgress] of this.roomDefinitions.entries()) {
      this.updateRoomProgress(roomId, timeline, gameState);
    }

    // Calculate overall analytics
    return this.calculateProgressAnalytics(timeline, gameState);
  }

  /**
   * Get progress for a specific room
   */
  getRoomProgress(roomId: string): RoomProgress | null {
    return this.roomDefinitions.get(roomId) || null;
  }

  /**
   * Get all room progress
   */
  getAllRoomProgress(): RoomProgress[] {
    return Array.from(this.roomDefinitions.values());
  }

  /**
   * Check if a room should be unlocked
   */
  checkUnlockConditions(roomId: string, timeline: EvidenceTimelineEntry[], gameState: GameState): boolean {
    const condition = this.unlockConditions.get(roomId);
    if (!condition) return false;

    return condition.requirements.every(req => 
      this.checkRequirement(req, timeline, gameState)
    );
  }

  /**
   * Get next recommended room
   */
  getNextRecommendedRoom(timeline: EvidenceTimelineEntry[], gameState: GameState): string | null {
    const unlockedRooms = this.getAllRoomProgress()
      .filter(room => room.isUnlocked && !room.isCompleted)
      .sort((a, b) => a.completionPercentage - b.completionPercentage);

    return unlockedRooms.length > 0 ? unlockedRooms[0].roomId : null;
  }

  /**
   * Get rooms that can be unlocked next
   */
  getUnlockableRooms(timeline: EvidenceTimelineEntry[], gameState: GameState): string[] {
    const unlockable: string[] = [];
    
    for (const [roomId, condition] of this.unlockConditions.entries()) {
      const roomProgress = this.roomDefinitions.get(roomId);
      if (roomProgress && !roomProgress.isUnlocked) {
        if (this.checkUnlockConditions(roomId, timeline, gameState)) {
          unlockable.push(roomId);
        }
      }
    }
    
    return unlockable;
  }

  /**
   * Calculate completion requirements for a room
   */
  calculateCompletionRequirements(roomId: string, timeline: EvidenceTimelineEntry[]): ProgressRequirement[] {
    const roomEntries = timeline.filter(entry => entry.roomId === roomId);
    const requirements: ProgressRequirement[] = [];

    // Base requirements for all rooms
    requirements.push({
      type: 'encounters_completed',
      value: 2, // At least 2 ghost encounters
      description: 'Complete at least 2 ghost encounters'
    });

    requirements.push({
      type: 'success_rate',
      value: 0.6, // 60% success rate
      description: 'Achieve 60% success rate in decisions'
    });

    // Room-specific requirements
    switch (roomId) {
      case 'boot-sector':
        requirements.push({
          type: 'concepts_learned',
          value: 3,
          description: 'Learn 3 basic debugging concepts'
        });
        break;
        
      case 'dependency-crypt':
        requirements.push({
          type: 'patches_applied',
          value: 5,
          description: 'Successfully apply 5 patches'
        });
        break;
        
      case 'ghost-memory-heap':
        requirements.push({
          type: 'success_rate',
          value: 0.7,
          description: 'Achieve 70% success rate (advanced room)'
        });
        break;
        
      case 'possessed-compiler':
        requirements.push({
          type: 'concepts_learned',
          value: 8,
          description: 'Master 8 debugging concepts'
        });
        break;
        
      case 'ethics-tribunal':
        requirements.push({
          type: 'encounters_completed',
          value: 3,
          description: 'Complete 3 ethical decision scenarios'
        });
        break;
        
      case 'final-merge':
        requirements.push({
          type: 'success_rate',
          value: 0.8,
          description: 'Achieve 80% success rate (final challenge)'
        });
        break;
    }

    return requirements;
  }

  // Private methods

  private initializeRoomDefinitions(): void {
    const rooms = [
      'boot-sector',
      'dependency-crypt', 
      'ghost-memory-heap',
      'possessed-compiler',
      'ethics-tribunal',
      'final-merge'
    ];

    for (const roomId of rooms) {
      this.roomDefinitions.set(roomId, {
        roomId,
        isUnlocked: roomId === 'boot-sector', // Boot sector starts unlocked
        isCompleted: false,
        completionPercentage: 0,
        requirements: this.calculateCompletionRequirements(roomId, []),
        completedRequirements: [],
        estimatedTimeToComplete: this.getEstimatedTimeForRoom(roomId)
      });
    }
  }

  private initializeUnlockConditions(): void {
    // Dependency Crypt unlocks after Boot Sector
    this.unlockConditions.set('dependency-crypt', {
      roomId: 'dependency-crypt',
      requirements: [
        {
          type: 'encounters_completed',
          value: 2,
          description: 'Complete 2 encounters in Boot Sector'
        }
      ],
      description: 'Complete basic encounters in Boot Sector'
    });

    // Ghost Memory Heap unlocks after Dependency Crypt
    this.unlockConditions.set('ghost-memory-heap', {
      roomId: 'ghost-memory-heap',
      requirements: [
        {
          type: 'patches_applied',
          value: 3,
          description: 'Apply 3 successful patches'
        },
        {
          type: 'concepts_learned',
          value: 5,
          description: 'Learn 5 debugging concepts'
        }
      ],
      description: 'Demonstrate patch application skills'
    });

    // Possessed Compiler unlocks after Ghost Memory Heap
    this.unlockConditions.set('possessed-compiler', {
      roomId: 'possessed-compiler',
      requirements: [
        {
          type: 'success_rate',
          value: 0.65,
          description: 'Achieve 65% overall success rate'
        },
        {
          type: 'encounters_completed',
          value: 6,
          description: 'Complete 6 total encounters'
        }
      ],
      description: 'Show consistent debugging performance'
    });

    // Ethics Tribunal unlocks after Possessed Compiler
    this.unlockConditions.set('ethics-tribunal', {
      roomId: 'ethics-tribunal',
      requirements: [
        {
          type: 'concepts_learned',
          value: 8,
          description: 'Master 8 debugging concepts'
        },
        {
          type: 'patches_applied',
          value: 10,
          description: 'Apply 10 successful patches'
        }
      ],
      description: 'Demonstrate advanced debugging mastery'
    });

    // Final Merge unlocks after Ethics Tribunal
    this.unlockConditions.set('final-merge', {
      roomId: 'final-merge',
      requirements: [
        {
          type: 'success_rate',
          value: 0.75,
          description: 'Achieve 75% overall success rate'
        },
        {
          type: 'encounters_completed',
          value: 12,
          description: 'Complete 12 total encounters'
        },
        {
          type: 'concepts_learned',
          value: 12,
          description: 'Master 12 debugging concepts'
        }
      ],
      description: 'Prove readiness for final challenge'
    });
  }

  private updateRoomProgress(roomId: string, timeline: EvidenceTimelineEntry[], gameState: GameState): void {
    const roomProgress = this.roomDefinitions.get(roomId);
    if (!roomProgress) return;

    const roomEntries = timeline.filter(entry => entry.roomId === roomId);
    const requirements = this.calculateCompletionRequirements(roomId, timeline);
    
    // Check each requirement
    const completedRequirements: string[] = [];
    let totalProgress = 0;

    for (const requirement of requirements) {
      if (this.checkRequirement(requirement, timeline, gameState)) {
        completedRequirements.push(requirement.description);
        totalProgress += 1;
      }
    }

    // Update progress
    roomProgress.requirements = requirements;
    roomProgress.completedRequirements = completedRequirements;
    roomProgress.completionPercentage = totalProgress / Math.max(1, requirements.length);
    roomProgress.isCompleted = roomProgress.completionPercentage >= 1.0;

    // Check if room should be unlocked
    if (!roomProgress.isUnlocked) {
      roomProgress.isUnlocked = this.checkUnlockConditions(roomId, timeline, gameState);
    }
  }

  private checkRequirement(
    requirement: ProgressRequirement, 
    timeline: EvidenceTimelineEntry[], 
    gameState: GameState
  ): boolean {
    switch (requirement.type) {
      case 'encounters_completed':
        const encounters = timeline.filter(e => e.category === 'encounter').length;
        return encounters >= requirement.value;
        
      case 'patches_applied':
        const patches = timeline.filter(e => 
          e.category === 'patch_application' && e.outcome === 'success'
        ).length;
        return patches >= requirement.value;
        
      case 'success_rate':
        const decisions = timeline.filter(e => 
          e.category === 'decision' || e.category === 'patch_application'
        );
        if (decisions.length === 0) return false;
        const successes = decisions.filter(e => e.outcome === 'success').length;
        return (successes / decisions.length) >= requirement.value;
        
      case 'concepts_learned':
        const concepts = new Set(timeline.flatMap(e => e.conceptsInvolved));
        return concepts.size >= requirement.value;
        
      case 'time_spent':
        const totalTime = this.calculateTotalTime(timeline);
        return totalTime >= requirement.value;
        
      default:
        return false;
    }
  }

  private calculateProgressAnalytics(timeline: EvidenceTimelineEntry[], gameState: GameState): ProgressAnalytics {
    const completedRooms = Array.from(this.roomDefinitions.values())
      .filter(room => room.isCompleted).length;
    
    const totalRooms = this.roomDefinitions.size;
    const overallProgress = completedRooms / totalRooms;

    // Calculate streaks
    const decisions = timeline
      .filter(e => e.category === 'decision' || e.category === 'patch_application')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = decisions.length - 1; i >= 0; i--) {
      if (decisions[i].outcome === 'success') {
        tempStreak++;
        if (i === decisions.length - 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate other metrics
    const totalTime = this.calculateTotalTime(timeline);
    const averageTimePerRoom = totalTime / Math.max(1, completedRooms);
    
    const concepts = new Set(timeline.flatMap(e => e.conceptsInvolved));
    const learningVelocity = concepts.size / Math.max(1, totalTime / 3600000); // concepts per hour
    
    const successfulDecisions = decisions.filter(d => d.outcome === 'success').length;
    const efficiencyScore = successfulDecisions / Math.max(1, decisions.length);

    return {
      overallProgress,
      roomsCompleted: completedRooms,
      totalRooms,
      currentStreak,
      longestStreak,
      averageTimePerRoom,
      learningVelocity,
      efficiencyScore
    };
  }

  private calculateTotalTime(timeline: EvidenceTimelineEntry[]): number {
    if (timeline.length === 0) return 0;
    
    const sorted = timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const start = sorted[0].timestamp;
    const end = sorted[sorted.length - 1].timestamp;
    
    return end.getTime() - start.getTime();
  }

  private getEstimatedTimeForRoom(roomId: string): number {
    const estimates: Record<string, number> = {
      'boot-sector': 15,
      'dependency-crypt': 20,
      'ghost-memory-heap': 25,
      'possessed-compiler': 30,
      'ethics-tribunal': 35,
      'final-merge': 40
    };
    
    return estimates[roomId] || 20;
  }
}