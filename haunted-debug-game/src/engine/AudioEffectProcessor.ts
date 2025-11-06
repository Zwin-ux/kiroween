/**
 * AudioEffectProcessor - Handles dynamic sound based on game state
 */

import type { 
  AudioEffectSet, 
  AudioTrigger 
} from './DynamicMeterSystem';

export interface AudioEffectProcessor {
  processEffects(effects: AudioEffectSet): void;
  setMasterVolume(volume: number): void;
  getMasterVolume(): number;
  getAudioSettings(): AudioSettings;
  updateAudioSettings(settings: Partial<AudioSettings>): void;
  cleanup(): void;
}

export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  sfxVolume: number;
  ambientVolume: number;
  heartbeatVolume: number;
  whisperVolume: number;
  muteAll: boolean;
  enableSpatialAudio: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export interface AudioSource {
  id: string;
  type: 'heartbeat' | 'whisper' | 'ambient' | 'sfx' | 'glitch';
  audioContext: AudioContext;
  gainNode: GainNode;
  sourceNode?: AudioBufferSourceNode;
  buffer?: AudioBuffer;
  isPlaying: boolean;
  loop: boolean;
  startTime: number;
}

export class AudioEffectProcessorImpl implements AudioEffectProcessor {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private audioSources: Map<string, AudioSource> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeEffects: Map<string, number> = new Map(); // effect type -> intensity
  
  private audioSettings: AudioSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.6,
    heartbeatVolume: 0.7,
    whisperVolume: 0.5,
    muteAll: false,
    enableSpatialAudio: true,
    audioQuality: 'medium'
  };

  private heartbeatInterval: number | null = null;
  private ambientSource: AudioSource | null = null;

  constructor() {
    this.initializeAudioSystem();
    this.loadAudioSettings();
  }

  /**
   * Process audio effects based on game state
   */
  processEffects(effects: AudioEffectSet): void {
    if (this.audioSettings.muteAll || !this.audioContext) return;

    // Update heartbeat intensity
    this.updateHeartbeat(effects.heartbeatIntensity);

    // Update whisper volume
    this.updateWhispers(effects.whisperVolume);

    // Update ambient tension
    this.updateAmbientTension(effects.ambientTension);

    // Process effect triggers
    for (const trigger of effects.effectTriggers) {
      this.processAudioTrigger(trigger);
    }
  }

  /**
   * Set master volume for all audio
   */
  setMasterVolume(volume: number): void {
    this.audioSettings.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.audioSettings.masterVolume;
    }
    this.saveAudioSettings();
  }

  /**
   * Get current master volume
   */
  getMasterVolume(): number {
    return this.audioSettings.masterVolume;
  }

  /**
   * Get current audio settings
   */
  getAudioSettings(): AudioSettings {
    return { ...this.audioSettings };
  }

  /**
   * Update audio settings
   */
  updateAudioSettings(settings: Partial<AudioSettings>): void {
    this.audioSettings = {
      ...this.audioSettings,
      ...settings
    };
    
    // Apply settings immediately
    this.applyAudioSettings();
    this.saveAudioSettings();
  }

  /**
   * Cleanup audio resources
   */
  cleanup(): void {
    // Stop all audio sources
    for (const source of this.audioSources.values()) {
      this.stopAudioSource(source);
    }
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  /**
   * Update heartbeat audio based on intensity
   */
  private updateHeartbeat(intensity: number): void {
    const finalVolume = intensity * this.audioSettings.heartbeatVolume * this.audioSettings.masterVolume;
    
    if (intensity > 0.1) {
      this.startHeartbeat(intensity, finalVolume);
    } else {
      this.stopHeartbeat();
    }
  }

  /**
   * Start heartbeat audio loop
   */
  private startHeartbeat(intensity: number, volume: number): void {
    if (this.heartbeatInterval) return; // Already running

    // Calculate heartbeat rate based on intensity
    const baseRate = 1000; // 1 second base interval
    const rate = baseRate - (intensity * 600); // Faster when more intense
    
    this.heartbeatInterval = window.setInterval(() => {
      this.playHeartbeatSound(volume, intensity);
    }, rate);
  }

  /**
   * Stop heartbeat audio loop
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Play single heartbeat sound
   */
  private playHeartbeatSound(volume: number, intensity: number): void {
    if (!this.audioContext) return;

    // Create synthetic heartbeat sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode!);
    
    // Configure heartbeat sound
    oscillator.frequency.setValueAtTime(60 + intensity * 40, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Create heartbeat envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    // Play sound
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  /**
   * Update whisper audio
   */
  private updateWhispers(volume: number): void {
    const finalVolume = volume * this.audioSettings.whisperVolume * this.audioSettings.masterVolume;
    
    if (volume > 0.1) {
      this.startWhispers(finalVolume);
    } else {
      this.stopWhispers();
    }
  }

  /**
   * Start whisper audio
   */
  private startWhispers(volume: number): void {
    const whisperId = 'whispers';
    let whisperSource = this.audioSources.get(whisperId);
    
    if (!whisperSource) {
      whisperSource = this.createWhisperSource(whisperId, volume);
      this.audioSources.set(whisperId, whisperSource);
    }
    
    // Update volume
    whisperSource.gainNode.gain.value = volume;
    
    if (!whisperSource.isPlaying) {
      this.startAudioSource(whisperSource);
    }
  }

  /**
   * Stop whisper audio
   */
  private stopWhispers(): void {
    const whisperSource = this.audioSources.get('whispers');
    if (whisperSource && whisperSource.isPlaying) {
      this.stopAudioSource(whisperSource);
    }
  }

  /**
   * Create synthetic whisper source
   */
  private createWhisperSource(id: string, volume: number): AudioSource {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGainNode!);
    gainNode.gain.value = volume;

    return {
      id,
      type: 'whisper',
      audioContext: this.audioContext,
      gainNode,
      isPlaying: false,
      loop: true,
      startTime: 0
    };
  }

  /**
   * Update ambient tension audio
   */
  private updateAmbientTension(tension: number): void {
    const finalVolume = tension * this.audioSettings.ambientVolume * this.audioSettings.masterVolume;
    
    if (tension > 0.1) {
      this.startAmbientTension(tension, finalVolume);
    } else {
      this.stopAmbientTension();
    }
  }

  /**
   * Start ambient tension audio
   */
  private startAmbientTension(tension: number, volume: number): void {
    const ambientId = 'ambient_tension';
    let ambientSource = this.audioSources.get(ambientId);
    
    if (!ambientSource) {
      ambientSource = this.createAmbientSource(ambientId, tension, volume);
      this.audioSources.set(ambientId, ambientSource);
    }
    
    // Update volume and frequency based on tension
    ambientSource.gainNode.gain.value = volume;
    
    if (!ambientSource.isPlaying) {
      this.startAudioSource(ambientSource);
    }
  }

  /**
   * Stop ambient tension audio
   */
  private stopAmbientTension(): void {
    const ambientSource = this.audioSources.get('ambient_tension');
    if (ambientSource && ambientSource.isPlaying) {
      this.stopAudioSource(ambientSource);
    }
  }

  /**
   * Create ambient tension source
   */
  private createAmbientSource(id: string, tension: number, volume: number): AudioSource {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGainNode!);
    gainNode.gain.value = volume;

    return {
      id,
      type: 'ambient',
      audioContext: this.audioContext,
      gainNode,
      isPlaying: false,
      loop: true,
      startTime: 0
    };
  }

  /**
   * Process individual audio trigger
   */
  private processAudioTrigger(trigger: AudioTrigger): void {
    const delay = trigger.delay || 0;
    
    setTimeout(() => {
      this.playTriggerSound(trigger);
    }, delay);
  }

  /**
   * Play trigger sound effect
   */
  private playTriggerSound(trigger: AudioTrigger): void {
    if (!this.audioContext) return;

    const finalVolume = trigger.volume * this.audioSettings.sfxVolume * this.audioSettings.masterVolume;
    
    switch (trigger.type) {
      case 'warning':
        this.playWarningSound(finalVolume);
        break;
      case 'success':
        this.playSuccessSound(finalVolume);
        break;
      case 'glitch':
        this.playGlitchSound(finalVolume, trigger.duration || 1000);
        break;
      case 'heartbeat':
        this.playHeartbeatSound(finalVolume, 0.5);
        break;
      case 'whisper':
        this.playWhisperSound(finalVolume, trigger.duration || 2000);
        break;
    }
  }

  /**
   * Play warning sound
   */
  private playWarningSound(volume: number): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode!);
    
    // Warning sound: descending tone
    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.5);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  /**
   * Play success sound
   */
  private playSuccessSound(volume: number): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode!);
    
    // Success sound: ascending chord
    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.linearRampToValueAtTime(660, now + 0.3);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  /**
   * Play glitch sound
   */
  private playGlitchSound(volume: number, duration: number): void {
    if (!this.audioContext) return;

    const noiseBuffer = this.createNoiseBuffer(duration / 1000);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    source.buffer = noiseBuffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGainNode!);
    
    // Configure filter for glitch effect
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    gainNode.gain.value = volume;
    
    source.start();
    source.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * Play whisper sound
   */
  private playWhisperSound(volume: number, duration: number): void {
    if (!this.audioContext) return;

    // Create filtered noise for whisper effect
    const noiseBuffer = this.createNoiseBuffer(duration / 1000);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    source.buffer = noiseBuffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGainNode!);
    
    // Configure filter for whisper effect
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;
    
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration / 1000 - 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    
    source.start();
    source.stop(now + duration / 1000);
  }

  /**
   * Create noise buffer for sound effects
   */
  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    return buffer;
  }

  /**
   * Start audio source
   */
  private startAudioSource(source: AudioSource): void {
    if (source.isPlaying) return;

    // Create oscillator for synthetic sounds
    const oscillator = source.audioContext.createOscillator();
    oscillator.connect(source.gainNode);
    
    // Configure based on source type
    switch (source.type) {
      case 'whisper':
        oscillator.frequency.value = 200 + Math.random() * 100;
        oscillator.type = 'sawtooth';
        break;
      case 'ambient':
        oscillator.frequency.value = 40 + Math.random() * 20;
        oscillator.type = 'sine';
        break;
    }
    
    source.sourceNode = oscillator as any; // Type assertion for compatibility
    source.isPlaying = true;
    source.startTime = source.audioContext.currentTime;
    
    if (source.loop) {
      oscillator.start();
    }
  }

  /**
   * Stop audio source
   */
  private stopAudioSource(source: AudioSource): void {
    if (!source.isPlaying || !source.sourceNode) return;

    source.sourceNode.stop();
    source.sourceNode = undefined;
    source.isPlaying = false;
  }

  /**
   * Initialize audio system
   */
  private initializeAudioSystem(): void {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = this.audioSettings.masterVolume;
      
      // Handle audio context state
      if (this.audioContext.state === 'suspended') {
        // Resume on user interaction
        const resumeAudio = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      }
      
    } catch (error) {
      console.warn('Failed to initialize audio system:', error);
    }
  }

  /**
   * Apply current audio settings
   */
  private applyAudioSettings(): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.audioSettings.muteAll ? 0 : this.audioSettings.masterVolume;
    }
    
    // Update individual source volumes
    for (const source of this.audioSources.values()) {
      let volumeMultiplier = 1;
      
      switch (source.type) {
        case 'heartbeat':
          volumeMultiplier = this.audioSettings.heartbeatVolume;
          break;
        case 'whisper':
          volumeMultiplier = this.audioSettings.whisperVolume;
          break;
        case 'ambient':
          volumeMultiplier = this.audioSettings.ambientVolume;
          break;
        case 'sfx':
        case 'glitch':
          volumeMultiplier = this.audioSettings.sfxVolume;
          break;
      }
      
      source.gainNode.gain.value *= volumeMultiplier;
    }
  }

  /**
   * Load audio settings from localStorage
   */
  private loadAudioSettings(): void {
    try {
      const saved = localStorage.getItem('haunted-debug-audio');
      if (saved) {
        this.audioSettings = {
          ...this.audioSettings,
          ...JSON.parse(saved)
        };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  /**
   * Save audio settings to localStorage
   */
  private saveAudioSettings(): void {
    try {
      localStorage.setItem('haunted-debug-audio', 
        JSON.stringify(this.audioSettings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }
}