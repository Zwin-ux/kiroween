/**
 * Ghost Selection System - Manages ghost encounters and availability
 */

import type { Ghost } from '@/types/ghost';
import type { GameState } from '@/types/game';

export interface EncounterableGhost extends Ghost {
  isAvailable: boolean;
  isCompleted: boolean;
  difficultyLevel: number;
  estimatedTime: number;
  prerequisites?: string[];
}

export interface GhostEncounter {
  id: string;
  ghost: Ghost;
  state: EncounterState;
  dialogue: DialogueSession;
  patches: PatchSession[];
  startedAt: Date;
  completedAt?: Date;
}

export interface DialogueSession {
  id: string;
  ghostId: string;
  messages: DialogueMessage[];
  context: DialogueContext;
  educationalTopics: string[];
  isReadyForDebugging: boolean;
}

export interface DialogueMessage {
  id: string;
  speaker: 'player' | 'ghost';
  content: string;
  timestamp: Date;
  type: 'question' | 'explanation' | 'hint' | 'story';
  metadata?: Record<string, any>;
}

export interface DialogueContext {
  ghostType: string;
  roomContext: string;
  playerKnowledge: string[];
  previousEncounters: string[];
  currentMeterLevels: { stability: number; insight: number };
}

export interface PatchSession {
  id: string;
  ghostEncounterId: string;
  playerIntent: string;
  generatedPatches: any[]; // Will be properly typed when patch system is integrated
  selectedPatch?: any;
  applicationResult?: any;
  createdAt: Date;
}

export enum EncounterState {
  NotStarted = 'not_started',
  InDialogue = 'in_dialogue',
  GeneratingPatch = 'generating_patch',
  ReviewingPatch = 'reviewing_patch',
  ApplyingPatch = 'applying_patch',
  Completed = 'completed',
  Failed = 'failed'
}

export class GhostSelectionSystem {
  private encounters: Map<string, GhostEncounter> = new Map();
  private roomGhostMapping: Map<string, string[]> = new Map();

  constructor(private ghosts: Ghost[]) {
    this.initializeRoomMapping();
  }

  /**
   * Get available ghosts for a specific room
   */
  getAvailableGhosts(roomKey: string): EncounterableGhost[] {
    const ghostIds = this.roomGhostMapping.get(roomKey) || [];
    
    return ghostIds
      .map(id => this.ghosts.find(ghost => ghost.id === id))
      .filter((ghost): ghost is Ghost => ghost !== undefined)
      .map(ghost => this.createEncounterableGhost(ghost, roomKey));
  }

  /**
   * Start a new ghost encounter
   */
  async startEncounter(ghostId: string): Promise<GhostEncounter> {
    const ghost = this.ghosts.find(g => g.id === ghostId);
    if (!ghost) {
      throw new Error(`Ghost with id ${ghostId} not found`);
    }

    // Check if encounter already exists
    const existingEncounter = this.encounters.get(ghostId);
    if (existingEncounter && existingEncounter.state !== EncounterState.Completed) {
      return existingEncounter;
    }

    // Create new encounter
    const encounter: GhostEncounter = {
      id: `encounter_${ghostId}_${Date.now()}`,
      ghost,
      state: EncounterState.InDialogue,
      dialogue: this.createInitialDialogueSession(ghost),
      patches: [],
      startedAt: new Date()
    };

    this.encounters.set(ghostId, encounter);
    return encounter;
  }

  /**
   * Get current encounter state for a ghost
   */
  getEncounterState(ghostId: string): EncounterState {
    const encounter = this.encounters.get(ghostId);
    return encounter?.state || EncounterState.NotStarted;
  }

  /**
   * Update encounter state
   */
  updateEncounterState(ghostId: string, newState: EncounterState): void {
    const encounter = this.encounters.get(ghostId);
    if (encounter) {
      encounter.state = newState;
      
      if (newState === EncounterState.Completed) {
        encounter.completedAt = new Date();
      }
    }
  }

  /**
   * Get encounter by ghost ID
   */
  getEncounter(ghostId: string): GhostEncounter | undefined {
    return this.encounters.get(ghostId);
  }

  /**
   * Check if ghost is available based on room progress and prerequisites
   */
  isGhostAvailable(ghost: Ghost, roomKey: string, gameState: GameState): boolean {
    // Check if room is unlocked
    if (!gameState.unlockedRooms.includes(roomKey)) {
      return false;
    }

    // Check if ghost is already completed
    if (this.isGhostCompleted(ghost.id)) {
      return false;
    }

    // Check prerequisites (if any)
    const encounterableGhost = this.createEncounterableGhost(ghost, roomKey);
    if (encounterableGhost.prerequisites) {
      const completedGhosts = this.getCompletedGhostIds();
      return encounterableGhost.prerequisites.every(prereq => 
        completedGhosts.includes(prereq)
      );
    }

    // Check meter requirements for advanced ghosts
    if (ghost.severity > 7 && gameState.meters.insight < 30) {
      return false;
    }

    return true;
  }

  /**
   * Check if ghost encounter is completed
   */
  isGhostCompleted(ghostId: string): boolean {
    const encounter = this.encounters.get(ghostId);
    return encounter?.state === EncounterState.Completed;
  }

  /**
   * Get all completed ghost IDs
   */
  getCompletedGhostIds(): string[] {
    return Array.from(this.encounters.values())
      .filter(encounter => encounter.state === EncounterState.Completed)
      .map(encounter => encounter.ghost.id);
  }

  /**
   * Get encounter statistics for a room
   */
  getRoomEncounterStats(roomKey: string): {
    total: number;
    available: number;
    completed: number;
    inProgress: number;
  } {
    const ghostIds = this.roomGhostMapping.get(roomKey) || [];
    const total = ghostIds.length;
    
    let available = 0;
    let completed = 0;
    let inProgress = 0;

    ghostIds.forEach(ghostId => {
      const state = this.getEncounterState(ghostId);
      
      switch (state) {
        case EncounterState.NotStarted:
          available++;
          break;
        case EncounterState.Completed:
          completed++;
          break;
        default:
          inProgress++;
          break;
      }
    });

    return { total, available, completed, inProgress };
  }

  /**
   * Private method to initialize room-to-ghost mapping
   */
  private initializeRoomMapping(): void {
    this.ghosts.forEach(ghost => {
      ghost.rooms.forEach(roomKey => {
        const roomGhosts = this.roomGhostMapping.get(roomKey) || [];
        roomGhosts.push(ghost.id);
        this.roomGhostMapping.set(roomKey, roomGhosts);
      });
    });
  }

  /**
   * Private method to create an encounterable ghost with availability info
   */
  private createEncounterableGhost(ghost: Ghost, roomKey: string): EncounterableGhost {
    const isCompleted = this.isGhostCompleted(ghost.id);
    const difficultyLevel = this.calculateDifficultyLevel(ghost, roomKey);
    const estimatedTime = this.estimateEncounterTime(ghost);
    const prerequisites = this.getGhostPrerequisites(ghost, roomKey);

    return {
      ...ghost,
      isAvailable: !isCompleted,
      isCompleted,
      difficultyLevel,
      estimatedTime,
      prerequisites
    };
  }

  /**
   * Private method to create initial dialogue session
   */
  private createInitialDialogueSession(ghost: Ghost): DialogueSession {
    return {
      id: `dialogue_${ghost.id}_${Date.now()}`,
      ghostId: ghost.id,
      messages: [],
      context: {
        ghostType: ghost.softwareSmell,
        roomContext: ghost.rooms[0] || 'unknown',
        playerKnowledge: [],
        previousEncounters: [],
        currentMeterLevels: { stability: 60, insight: 10 }
      },
      educationalTopics: this.extractEducationalTopics(ghost),
      isReadyForDebugging: false
    };
  }

  /**
   * Private method to calculate difficulty level
   */
  private calculateDifficultyLevel(ghost: Ghost, roomKey: string): number {
    let difficulty = ghost.severity;
    
    // Adjust based on room complexity
    const roomDifficultyModifiers: Record<string, number> = {
      'boot-sector': 0,
      'dependency-crypt': 1,
      'ghost-memory-heap': 2,
      'possessed-compiler': 3,
      'ethics-tribunal': 4,
      'final-merge': 5
    };
    
    difficulty += roomDifficultyModifiers[roomKey] || 0;
    
    return Math.min(10, Math.max(1, difficulty));
  }

  /**
   * Private method to estimate encounter time
   */
  private estimateEncounterTime(ghost: Ghost): number {
    // Base time in minutes
    let baseTime = 5;
    
    // Adjust based on ghost complexity
    baseTime += ghost.severity * 2;
    
    // Adjust based on number of fix patterns
    baseTime += ghost.fixPatterns.length * 3;
    
    return baseTime;
  }

  /**
   * Private method to get ghost prerequisites
   */
  private getGhostPrerequisites(ghost: Ghost, roomKey: string): string[] | undefined {
    // Define prerequisites based on ghost type and room
    const prerequisites: Record<string, string[]> = {
      // Advanced ghosts require basic ones to be completed first
      'prompt_injection': ['circular_dependency'],
      'data_leak': ['memory_leak', 'dead_code'],
      'unbounded_recursion': ['circular_dependency', 'stale_cache'],
      'race_condition': ['memory_leak']
    };

    return prerequisites[ghost.id];
  }

  /**
   * Private method to extract educational topics from ghost
   */
  private extractEducationalTopics(ghost: Ghost): string[] {
    const topics = [ghost.softwareSmell.toString()];
    
    // Add related topics based on fix patterns
    ghost.fixPatterns.forEach(pattern => {
      topics.push(pattern.type);
    });
    
    // Add room-specific topics
    ghost.rooms.forEach(room => {
      switch (room) {
        case 'dependency-crypt':
          topics.push('dependency_management', 'architecture_patterns');
          break;
        case 'ghost-memory-heap':
          topics.push('memory_management', 'resource_lifecycle');
          break;
        case 'possessed-compiler':
          topics.push('compilation_process', 'static_analysis');
          break;
        case 'ethics-tribunal':
          topics.push('software_ethics', 'security_practices');
          break;
      }
    });
    
    return [...new Set(topics)]; // Remove duplicates
  }
}