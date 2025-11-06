/**
 * Mock GameEngine for testing
 */

export class GameEngine {
  private initialized = false;
  private gameState: any = {
    currentRoom: 'boot-sector',
    meters: { stability: 60, insight: 40 },
    activeEncounters: {},
    evidenceBoard: { entries: [] },
    unlockedRooms: ['boot-sector']
  };

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }

  getGameState() {
    return this.gameState;
  }

  async updateGameState(newState: any): Promise<void> {
    this.gameState = { ...this.gameState, ...newState };
  }

  async saveGameState(): Promise<void> {
    // Mock save
  }

  async loadGameState(): Promise<any> {
    return this.gameState;
  }

  getEncounterOrchestrator() {
    return new MockEncounterOrchestrator();
  }

  getDialogueEngine() {
    return new MockDialogueEngine();
  }

  getPatchSystem() {
    return new MockPatchSystem();
  }

  getEffectCoordinator() {
    return new MockEffectCoordinator();
  }

  getNavigationManager() {
    return new MockNavigationManager();
  }

  getProgressionSystem() {
    return new MockProgressionSystem();
  }

  getAccessibilityManager() {
    return new MockAccessibilityManager();
  }

  getPerformanceOptimizer() {
    return new MockPerformanceOptimizer();
  }

  getSettingsPersistence() {
    return new MockSettingsPersistence();
  }

  getSessionManager() {
    return new MockSessionManager();
  }

  getGhostManager() {
    return new MockGhostManager();
  }

  async validateRequirements(requirements: string[]) {
    return {
      allRequirementsMet: true,
      failedRequirements: [],
      results: requirements.reduce((acc, req) => {
        acc[req] = { passed: true, details: 'Mock validation passed' };
        return acc;
      }, {} as any)
    };
  }
}

class MockEncounterOrchestrator {
  async startEncounter(ghost: any, context: any) {
    return {
      id: 'mock-encounter-' + Date.now(),
      ghostId: ghost.id,
      roomId: context.currentRoom?.key || 'boot-sector',
      startTime: new Date(),
      currentPhase: 'dialogue',
      isComplete: false
    };
  }

  async processDialogueChoice(sessionId: string, choice: any) {
    return {
      success: true,
      ghostResponse: 'Mock ghost response',
      shouldGeneratePatches: true
    };
  }

  async generatePatchOptions(intent: string, ghost: any) {
    return [
      { id: 'patch-1', action: 'apply', description: 'Apply fix' },
      { id: 'patch-2', action: 'refactor', description: 'Refactor code' },
      { id: 'patch-3', action: 'question', description: 'Ask question' }
    ];
  }

  async applyPatchChoice(patchId: string, action: string) {
    return {
      success: true,
      consequences: ['Mock consequence'],
      meterChanges: { stability: -5, insight: 10, description: 'Mock change' }
    };
  }

  async completeEncounter(sessionId: string) {
    return {
      success: true,
      completedAt: new Date(),
      totalDuration: 120000,
      learningPoints: ['Mock learning point']
    };
  }

  async recoverEncounter(sessionId: string) {
    return {
      success: true,
      newPhase: 'dialogue'
    };
  }
}

class MockDialogueEngine {
  async startDialogue(ghost: any, context?: any) {
    return {
      id: 'mock-dialogue-' + Date.now(),
      ghostId: ghost.id,
      messages: [{ role: 'ghost', content: 'Mock initial message' }]
    };
  }

  async getSession(sessionId: string) {
    return {
      id: sessionId,
      messages: [
        { role: 'ghost', content: 'Mock message 1' },
        { role: 'player', content: 'Mock message 2' }
      ]
    };
  }
}

class MockPatchSystem {
  async generatePatchOptions(intent: string, ghost: any) {
    return [
      { id: 'patch-1', action: 'apply', description: 'Apply fix' },
      { id: 'patch-2', action: 'refactor', description: 'Refactor code' },
      { id: 'patch-3', action: 'question', description: 'Ask question' }
    ];
  }
}

class MockEffectCoordinator {
  processGameEvent = jest.fn();
  
  getAccessibilityConstraints() {
    return {
      reduceMotion: false,
      disableFlashing: false,
      maxIntensity: 1.0,
      audioVolume: 1.0
    };
  }

  getEffectSettings() {
    return {
      visualIntensity: 1.0,
      audioVolume: 1.0,
      motionReduced: false,
      flashingDisabled: false,
      qualityLevel: 'high'
    };
  }

  getIntensityControls() {
    return {
      visual: { min: 0.0, max: 1.0, step: 0.1 },
      audio: { min: 0.0, max: 1.0, step: 0.1 }
    };
  }

  resolveEffectConflicts() {
    return {
      effectiveVisualIntensity: 0.5,
      motionEnabled: false,
      flashingEnabled: false,
      audioEnabled: false,
      alternativeFeedbackEnabled: true
    };
  }
}

class MockNavigationManager {
  private currentRoom = { key: 'boot-sector', name: 'Boot Sector', isUnlocked: true };
  private rooms: any[] = [];

  async loadRooms(rooms: any[]) {
    this.rooms = rooms;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getAvailableRooms() {
    return this.rooms.filter(r => r.isUnlocked);
  }

  canNavigateToRoom(roomId: string) {
    const room = this.rooms.find(r => r.key === roomId);
    return room?.isUnlocked || false;
  }

  async navigateToRoom(roomId: string) {
    const room = this.rooms.find(r => r.key === roomId);
    if (!room) {
      return {
        success: false,
        error: { type: 'room_not_found', message: `Room ${roomId} not found` }
      };
    }
    
    if (!room.isUnlocked) {
      return {
        success: false,
        error: { type: 'room_locked', missingConditions: [] }
      };
    }

    this.currentRoom = room;
    return {
      success: true,
      newRoom: room,
      transitionEffects: { fadeOut: 500, fadeIn: 500, duration: 1000 },
      loadedContent: {
        ghosts: room.ghosts,
        backgroundAsset: room.backgroundAsset,
        ambientSound: room.ambientSound
      }
    };
  }

  unlockRoom(roomId: string, condition: any) {
    const room = this.rooms.find(r => r.key === roomId);
    if (room) {
      room.isUnlocked = true;
    }
  }

  getUnlockConditions(roomId: string) {
    const room = this.rooms.find(r => r.key === roomId);
    return {
      conditions: room?.unlockConditions || []
    };
  }

  getNavigationState() {
    return {
      isTransitioning: false,
      loadingRoom: null
    };
  }

  loadRoomContent = jest.fn().mockResolvedValue({});
}

class MockProgressionSystem {
  private completedRooms = new Set<string>();
  private completedEncounters = new Map<string, Set<string>>();

  isRoomCompleted(roomId: string) {
    return this.completedRooms.has(roomId);
  }

  markRoomCompleted(roomId: string) {
    this.completedRooms.add(roomId);
  }

  markEncounterCompleted(roomId: string, ghostId: string) {
    if (!this.completedEncounters.has(roomId)) {
      this.completedEncounters.set(roomId, new Set());
    }
    this.completedEncounters.get(roomId)!.add(ghostId);
  }

  getRoomProgress(roomId: string) {
    const completed = this.completedEncounters.get(roomId)?.size || 0;
    return {
      completedEncounters: completed,
      totalEncounters: 1,
      isCompleted: completed >= 1
    };
  }

  getOverallProgress() {
    return {
      completedRooms: this.completedRooms.size,
      totalRooms: 4,
      percentage: (this.completedRooms.size / 4) * 100
    };
  }

  checkVictoryConditions() {
    return this.completedRooms.size >= 4;
  }

  getProgressionInsights() {
    return {
      completedRooms: Array.from(this.completedRooms),
      nextRecommendedRoom: 'dependency-crypt',
      skillsLearned: ['Mock skill'],
      overallPerformance: 'good'
    };
  }
}

class MockAccessibilityManager {
  private settings = {
    reduceMotion: false,
    disableFlashing: false,
    visualEffectIntensity: 1.0,
    audioEffectVolume: 1.0,
    alternativeText: false,
    highContrast: false,
    screenReaderSupport: false
  };

  getAccessibilitySettings() {
    return this.settings;
  }

  async updateAccessibilitySettings(newSettings: any) {
    this.settings = { ...this.settings, ...newSettings };
  }

  generateAlternativeFeedback(eventType: string, data: any) {
    return {
      textDescription: `Mock feedback for ${eventType}`,
      ariaLabel: `Mock aria label`,
      screenReaderText: `Mock screen reader text`,
      visualIndicator: 'Mock visual indicator',
      consequences: data.consequences || []
    };
  }

  getKeyboardNavigationSupport() {
    return {
      enabled: true,
      shortcuts: {
        navigateRooms: 'Tab',
        selectGhost: 'Enter',
        openSettings: 'Ctrl+,',
        toggleAccessibility: 'Ctrl+Alt+A'
      }
    };
  }

  onScreenReaderAnnouncement(callback: (text: string) => void) {
    // Mock implementation
  }

  async announceGameEvent(eventType: string, data: any) {
    // Mock announcement
  }
}

class MockPerformanceOptimizer {
  detectDeviceCapabilities() {
    return {
      cpuCores: 4,
      memoryGB: 8,
      gpuTier: 'medium' as const,
      isMobile: false,
      supportsWebGL: true,
      maxTextureSize: 2048,
      batteryLevel: 0.8,
      isLowPowerMode: false
    };
  }

  optimizeForDevice(capabilities: any) {
    return {
      effectQuality: capabilities.gpuTier,
      maxParticles: capabilities.gpuTier === 'low' ? 50 : 100,
      animationFrameRate: capabilities.isMobile ? 30 : 60,
      textureQuality: capabilities.gpuTier,
      enableShadows: capabilities.gpuTier !== 'low',
      enableBloom: capabilities.gpuTier === 'high'
    };
  }

  getPerformanceMetrics() {
    return {
      frameRate: 60,
      memoryUsage: 0.5,
      renderTime: 16,
      scriptTime: 8,
      totalTime: 24,
      sampleCount: 100
    };
  }

  updateMetrics(metrics: any) {
    // Mock update
  }

  async autoAdjustQuality() {
    return {
      qualityReduced: false,
      newSettings: {
        effectQuality: 'medium',
        maxParticles: 75
      },
      reason: 'performance'
    };
  }

  getMemoryInfo() {
    return {
      used: 100,
      total: 200,
      percentage: 50
    };
  }

  cleanupMemory() {
    return {
      freedBytes: 1024,
      itemsCleaned: 5
    };
  }

  getMobileOptimizations() {
    return {
      reducedAnimations: true,
      lowerTextureQuality: true,
      disableComplexEffects: true,
      batteryOptimization: true,
      thermalThrottling: true
    };
  }
}

class MockSettingsPersistence {
  async saveAccessibilitySettings(settings: any) {
    localStorage.setItem('haunted-debug-accessibility-settings', JSON.stringify(settings));
  }

  async loadAccessibilitySettings() {
    const stored = localStorage.getItem('haunted-debug-accessibility-settings');
    return stored ? JSON.parse(stored) : {
      reduceMotion: false,
      disableFlashing: false,
      visualEffectIntensity: 1.0,
      audioEffectVolume: 1.0,
      alternativeText: false,
      highContrast: false,
      screenReaderSupport: false
    };
  }

  async savePerformanceSettings(settings: any) {
    localStorage.setItem('haunted-debug-performance-settings', JSON.stringify(settings));
  }

  async loadPerformanceSettings() {
    const stored = localStorage.getItem('haunted-debug-performance-settings');
    return stored ? JSON.parse(stored) : {
      effectQuality: 'high',
      maxParticles: 100,
      animationFrameRate: 60,
      textureQuality: 'high',
      enableShadows: true,
      enableBloom: true,
      autoOptimize: true,
      batteryOptimization: false
    };
  }
}

class MockSessionManager {
  createSession(userId: string) {
    return {
      id: 'mock-session-' + Date.now(),
      gameState: {
        currentRoom: 'boot-sector',
        meters: { stability: 60, insight: 40 },
        activeEncounters: {},
        evidenceBoard: { entries: [] },
        unlockedRooms: ['boot-sector'],
        systemStates: {
          eventManager: {},
          navigation: {},
          encounters: {},
          effects: {},
          session: {}
        }
      },
      timestamp: new Date(),
      systemStates: {}
    };
  }

  async saveSession(session: any) {
    // Mock save
  }

  async getSessionHistory() {
    return [];
  }

  cleanup() {
    // Mock cleanup
  }
}

class MockGhostManager {
  async loadGhosts(ghosts: any[]) {
    // Mock load
  }
}