/**
 * Atmospheric Audio System - Modular soundscape with compile heartbeat
 */

export interface AudioLayer {
  id: string;
  type: 'hum' | 'glitch' | 'event' | 'whisper' | 'heartbeat';
  volume: number; // 0-1
  loop: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export interface RoomSoundscape {
  roomId: string;
  layers: AudioLayer[];
  ambientVolume: number;
  stabilityModulation: boolean;
}

export interface CompileHeartbeatConfig {
  baseBPM: number;
  maxBPM: number;
  stabilityThreshold: number; // Below this, BPM increases
}

export class AtmosphericAudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private masterGain: GainNode | null = null;
  private currentSoundscape: RoomSoundscape | null = null;
  private heartbeatConfig: CompileHeartbeatConfig = {
    baseBPM: 60,
    maxBPM: 120,
    stabilityThreshold: 50
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Room soundscape configurations
  private readonly ROOM_SOUNDSCAPES: Record<string, RoomSoundscape> = {
    'boot-sector': {
      roomId: 'boot-sector',
      ambientVolume: 0.3,
      stabilityModulation: true,
      layers: [
        { id: 'cauldron-hum', type: 'hum', volume: 0.4, loop: true },
        { id: 'bubbling-loop', type: 'hum', volume: 0.3, loop: true },
        { id: 'ghost-chatter', type: 'whisper', volume: 0.2, loop: true },
        { id: 'boot-sequence', type: 'event', volume: 0.5, loop: false }
      ]
    },
    'dependency-crypt': {
      roomId: 'dependency-crypt',
      ambientVolume: 0.5,
      stabilityModulation: true,
      layers: [
        { id: 'cable-hums', type: 'hum', volume: 0.4, loop: true },
        { id: 'data-trickle', type: 'glitch', volume: 0.3, loop: true },
        { id: 'dependency-whispers', type: 'whisper', volume: 0.2, loop: true },
        { id: 'recursive-loading', type: 'glitch', volume: 0.3, loop: true }
      ]
    },
    'ghost-memory-heap': {
      roomId: 'ghost-memory-heap',
      ambientVolume: 0.7,
      stabilityModulation: true,
      layers: [
        { id: 'allocation-whispers', type: 'whisper', volume: 0.3, loop: true },
        { id: 'memory-hum', type: 'hum', volume: 0.4, loop: true },
        { id: 'gc-sweeps', type: 'glitch', volume: 0.2, loop: true },
        { id: 'floating-objects', type: 'event', volume: 0.3, loop: true }
      ]
    },
    'possessed-compiler': {
      roomId: 'possessed-compiler',
      ambientVolume: 0.9,
      stabilityModulation: true,
      layers: [
        { id: 'compilation-screams', type: 'glitch', volume: 0.5, loop: true },
        { id: 'syntax-whispers', type: 'whisper', volume: 0.3, loop: true },
        { id: 'error-echoes', type: 'event', volume: 0.4, loop: true },
        { id: 'compilation-fire', type: 'hum', volume: 0.6, loop: true }
      ]
    },
    'ethics-tribunal': {
      roomId: 'ethics-tribunal',
      ambientVolume: 0.6,
      stabilityModulation: false,
      layers: [
        { id: 'ethical-deliberation', type: 'whisper', volume: 0.4, loop: true },
        { id: 'justice-hum', type: 'hum', volume: 0.3, loop: true },
        { id: 'moral-whispers', type: 'whisper', volume: 0.2, loop: true },
        { id: 'gavel-echoes', type: 'event', volume: 0.3, loop: false }
      ]
    },
    'final-merge': {
      roomId: 'final-merge',
      ambientVolume: 1.0,
      stabilityModulation: true,
      layers: [
        { id: 'harmonic-resonance', type: 'hum', volume: 0.5, loop: true },
        { id: 'branch-whispers', type: 'whisper', volume: 0.3, loop: true },
        { id: 'convergence-hum', type: 'hum', volume: 0.4, loop: true },
        { id: 'final-merge-crescendo', type: 'event', volume: 0.6, loop: false }
      ]
    }
  };

  /**
   * Initialize the audio system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.7; // Master volume

      // Load audio buffers (in a real implementation, these would be actual audio files)
      await this.loadAudioBuffers();

      this.isInitialized = true;
      console.log('Atmospheric audio system initialized');
    } catch (error) {
      console.warn('Failed to initialize audio system:', error);
    }
  }

  /**
   * Load room soundscape
   */
  public async loadRoomSoundscape(roomId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const soundscape = this.ROOM_SOUNDSCAPES[roomId];
    if (!soundscape) {
      console.warn(`No soundscape found for room: ${roomId}`);
      return;
    }

    // Stop current soundscape
    if (this.currentSoundscape) {
      await this.stopSoundscape();
    }

    this.currentSoundscape = soundscape;
    await this.startSoundscape(soundscape);
  }

  /**
   * Update audio based on stability level
   */
  public updateStabilityLevel(stabilityLevel: number): void {
    if (!this.currentSoundscape || !this.audioContext) return;

    // Update compile heartbeat BPM
    this.updateCompileHeartbeat(stabilityLevel);

    // Modulate ambient layers based on stability
    if (this.currentSoundscape.stabilityModulation) {
      const instabilityFactor = (100 - stabilityLevel) / 100;
      
      this.currentSoundscape.layers.forEach(layer => {
        const gainNode = this.gainNodes.get(layer.id);
        if (gainNode) {
          let volumeMultiplier = 1;
          
          // Increase glitch and event volumes when unstable
          if (layer.type === 'glitch' || layer.type === 'event') {
            volumeMultiplier = 1 + instabilityFactor * 0.5;
          }
          // Decrease hum volumes when unstable
          else if (layer.type === 'hum') {
            volumeMultiplier = 1 - instabilityFactor * 0.3;
          }
          
          const targetVolume = layer.volume * volumeMultiplier * this.currentSoundscape!.ambientVolume;
          this.fadeToVolume(gainNode, targetVolume, 1000);
        }
      });
    }
  }

  /**
   * Play compile event sound
   */
  public playCompileEvent(eventType: 'success' | 'warning' | 'error'): void {
    if (!this.audioContext || !this.masterGain) return;

    const eventSounds = {
      success: 'compile-success',
      warning: 'compile-warning',
      error: 'compile-error'
    };

    const soundId = eventSounds[eventType];
    this.playOneShot(soundId, 0.5);
  }

  /**
   * Play ghost interaction sound
   */
  public playGhostSound(ghostType: string, interactionType: 'encounter' | 'dialogue' | 'resolution'): void {
    if (!this.audioContext) return;

    const soundId = `ghost-${ghostType}-${interactionType}`;
    const volume = interactionType === 'resolution' ? 0.7 : 0.4;
    this.playOneShot(soundId, volume);
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.fadeToVolume(this.masterGain, Math.max(0, Math.min(1, volume)), 500);
    }
  }

  /**
   * Mute/unmute audio
   */
  public setMuted(muted: boolean): void {
    if (this.masterGain) {
      this.fadeToVolume(this.masterGain, muted ? 0 : 0.7, 300);
    }
  }

  /**
   * Stop all audio
   */
  public async stopAll(): Promise<void> {
    if (this.currentSoundscape) {
      await this.stopSoundscape();
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Private methods

  private async loadAudioBuffers(): Promise<void> {
    // In a real implementation, this would load actual audio files
    // For now, we'll create placeholder entries
    const audioFiles = [
      'cauldron-hum', 'bubbling-loop', 'ghost-chatter', 'boot-sequence',
      'cable-hums', 'data-trickle', 'dependency-whispers', 'recursive-loading',
      'allocation-whispers', 'memory-hum', 'gc-sweeps', 'floating-objects',
      'compilation-screams', 'syntax-whispers', 'error-echoes', 'compilation-fire',
      'ethical-deliberation', 'justice-hum', 'moral-whispers', 'gavel-echoes',
      'harmonic-resonance', 'branch-whispers', 'convergence-hum', 'final-merge-crescendo',
      'compile-success', 'compile-warning', 'compile-error',
      'heartbeat-low', 'heartbeat-medium', 'heartbeat-high'
    ];

    // Create synthetic audio buffers for demonstration
    for (const fileName of audioFiles) {
      const buffer = await this.createSyntheticAudioBuffer(fileName);
      this.audioBuffers.set(fileName, buffer);
    }
  }

  private async createSyntheticAudioBuffer(type: string): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = type.includes('loop') || type.includes('hum') ? 4 : 2; // seconds
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate different waveforms based on sound type
    for (let i = 0; i < channelData.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      if (type.includes('hum')) {
        // Low frequency hum with harmonics
        sample = Math.sin(2 * Math.PI * 60 * t) * 0.3 +
                Math.sin(2 * Math.PI * 120 * t) * 0.1 +
                Math.sin(2 * Math.PI * 180 * t) * 0.05;
      } else if (type.includes('whisper')) {
        // Filtered noise for whispers
        sample = (Math.random() * 2 - 1) * 0.1 * Math.sin(2 * Math.PI * 200 * t);
      } else if (type.includes('glitch')) {
        // Digital glitch sounds
        sample = Math.sin(2 * Math.PI * (440 + Math.random() * 880) * t) * 0.2 * 
                (Math.random() > 0.7 ? 1 : 0);
      } else if (type.includes('heartbeat')) {
        // Heartbeat pattern
        const beatTime = t % 1; // 1 second cycle
        if (beatTime < 0.1) {
          sample = Math.sin(2 * Math.PI * 80 * t) * 0.5;
        } else if (beatTime > 0.6 && beatTime < 0.7) {
          sample = Math.sin(2 * Math.PI * 80 * t) * 0.3;
        }
      } else {
        // Default tone
        sample = Math.sin(2 * Math.PI * 440 * t) * 0.2;
      }

      // Apply envelope
      const envelope = Math.min(1, t * 4) * Math.min(1, (duration - t) * 4);
      channelData[i] = sample * envelope;
    }

    return buffer;
  }

  private async startSoundscape(soundscape: RoomSoundscape): Promise<void> {
    if (!this.audioContext || !this.masterGain) return;

    for (const layer of soundscape.layers) {
      const buffer = this.audioBuffers.get(layer.id);
      if (!buffer) continue;

      // Create source and gain nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.loop = layer.loop;
      
      // Set initial volume
      gainNode.gain.value = 0;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Store references
      this.activeSources.set(layer.id, source);
      this.gainNodes.set(layer.id, gainNode);

      // Start playback
      source.start();

      // Fade in
      const targetVolume = layer.volume * soundscape.ambientVolume;
      this.fadeToVolume(gainNode, targetVolume, layer.fadeInDuration || 2000);
    }

    // Start compile heartbeat
    this.startCompileHeartbeat();
  }

  private async stopSoundscape(): Promise<void> {
    const fadeOutPromises: Promise<void>[] = [];

    // Fade out all active sources
    for (const [layerId, gainNode] of this.gainNodes) {
      const fadePromise = new Promise<void>((resolve) => {
        this.fadeToVolume(gainNode, 0, 1000);
        setTimeout(() => {
          const source = this.activeSources.get(layerId);
          if (source) {
            source.stop();
            source.disconnect();
          }
          gainNode.disconnect();
          resolve();
        }, 1000);
      });
      fadeOutPromises.push(fadePromise);
    }

    await Promise.all(fadeOutPromises);

    // Clear references
    this.activeSources.clear();
    this.gainNodes.clear();
    this.currentSoundscape = null;

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private fadeToVolume(gainNode: GainNode, targetVolume: number, duration: number): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000);
  }

  private playOneShot(soundId: string, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const buffer = this.audioBuffers.get(soundId);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start();
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }

  private startCompileHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Start with base BPM
    let currentBPM = this.heartbeatConfig.baseBPM;
    
    const playHeartbeat = () => {
      this.playOneShot('heartbeat-low', 0.1);
    };

    const updateInterval = () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      const intervalMs = (60 / currentBPM) * 1000;
      this.heartbeatInterval = setInterval(playHeartbeat, intervalMs);
    };

    updateInterval();
  }

  private updateCompileHeartbeat(stabilityLevel: number): void {
    if (stabilityLevel < this.heartbeatConfig.stabilityThreshold) {
      const instabilityFactor = (this.heartbeatConfig.stabilityThreshold - stabilityLevel) / 
                               this.heartbeatConfig.stabilityThreshold;
      const targetBPM = this.heartbeatConfig.baseBPM + 
                       (this.heartbeatConfig.maxBPM - this.heartbeatConfig.baseBPM) * instabilityFactor;
      
      // Restart heartbeat with new BPM
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        const intervalMs = (60 / targetBPM) * 1000;
        this.heartbeatInterval = setInterval(() => {
          this.playOneShot('heartbeat-low', 0.1 + instabilityFactor * 0.2);
        }, intervalMs);
      }
    }
  }
}

// Singleton instance
export const atmosphericAudio = new AtmosphericAudioManager();