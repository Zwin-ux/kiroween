/**
 * RoomAtmosphere - Dynamic atmospheric effects for each room
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getRoomBackgroundAsset, preloadImage } from '@/lib/assets';
import { SeasonalDecorations } from './SeasonalDecorations';
import { TerminalIntegration, MultiTerminalIntegration } from './TerminalIntegration';
import { ThemedAssetLayering } from './ThemedAssetLayering';
import { 
  getRoomAtmosphereClasses, 
  createAssetPerformanceProps,
  type PerformanceMode,
  type AssetLoadingState
} from '@/lib/assetPerformanceUtils';

interface RoomAtmosphereProps {
  roomId: string;
  intensity?: number; // 0-1, affects visual intensity
  stabilityLevel?: number; // 0-100, affects color temperature
  showDecorations?: boolean; // Whether to show seasonal decorations
  decorationIntensity?: number; // 0-1, affects decoration density
  showTerminals?: boolean; // Whether to show terminal interfaces
  terminalInteractive?: boolean; // Whether terminals are interactive
  enableAssetLayers?: boolean; // Whether to enable themed asset layering
  performanceMode?: 'low' | 'medium' | 'high'; // Asset layering performance mode
  children?: React.ReactNode;
  className?: string;
}

interface AtmosphericConfig {
  backgroundClass: string;
  backgroundImage?: string;        // NEW: PNG asset path
  backgroundPosition?: string;     // NEW: Background positioning
  backgroundSize?: string;         // NEW: Background sizing
  primaryColor: string;
  accentColor: string;
  ambientElements: React.ReactNode[];
  soundscape: string[];
}

const ROOM_CONFIGS: Record<string, AtmosphericConfig> = {
  'boot-sector': {
    backgroundClass: 'room-compiler',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    primaryColor: 'var(--light-stability)',
    accentColor: 'var(--metal-copper)',
    ambientElements: [
      <CauldronElement key="cauldron" />,
      <DataMist key="mist" intensity={0.3} />,
      <TerminalScanlines key="scanlines" />
    ],
    soundscape: ['cauldron-hum', 'bubbling-loop', 'ghost-chatter']
  },
  'dependency-crypt': {
    backgroundClass: 'room-crypt',
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom', // Focus on ground level for graveyard theme
    primaryColor: 'var(--light-dataflow)',
    accentColor: 'var(--metal-bronze)',
    ambientElements: [
      <CableVeins key="cables" />,
      <DataMist key="mist" intensity={0.5} />,
      <CircularHighlights key="highlights" />
    ],
    soundscape: ['cable-hums', 'data-trickle', 'dependency-whispers']
  },
  'ghost-memory-heap': {
    backgroundClass: 'room-heap',
    backgroundSize: 'cover',
    backgroundPosition: 'center center', // Center for heap visualization
    primaryColor: 'var(--light-insight)',
    accentColor: 'var(--metal-brass)',
    ambientElements: [
      <FloatingObjects key="objects" />,
      <MemoryLeakIndicators key="leaks" />,
      <DataMist key="mist" intensity={0.7} />
    ],
    soundscape: ['allocation-whispers', 'memory-hum', 'gc-sweeps']
  },
  'possessed-compiler': {
    backgroundClass: 'room-tower',
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom', // Focus on tower base for dramatic effect
    primaryColor: 'var(--light-error)',
    accentColor: 'var(--metal-steel)',
    ambientElements: [
      <SyntaxTreeAnimations key="syntax" />,
      <CompilationSparks key="sparks" />,
      <DataMist key="mist" intensity={0.9} />
    ],
    soundscape: ['compilation-screams', 'syntax-whispers', 'error-echoes']
  },
  'ethics-tribunal': {
    backgroundClass: 'room-graveyard',
    backgroundSize: 'cover',
    backgroundPosition: 'center center', // Center for tribunal setting
    primaryColor: 'var(--code-warning)',
    accentColor: 'var(--metal-iron)',
    ambientElements: [
      <MoralCodePillars key="pillars" />,
      <JusticeScales key="scales" />,
      <DataMist key="mist" intensity={0.6} />
    ],
    soundscape: ['ethical-deliberation', 'justice-hum', 'moral-whispers']
  },
  'final-merge': {
    backgroundClass: 'room-carnival',
    backgroundSize: 'cover',
    backgroundPosition: 'center center', // Center for final merge visualization
    primaryColor: 'var(--code-warning)',
    accentColor: 'var(--metal-copper)',
    ambientElements: [
      <BranchConvergence key="convergence" />,
      <FinalMergeAnimation key="merge" />,
      <DataMist key="mist" intensity={1.0} />
    ],
    soundscape: ['harmonic-resonance', 'branch-whispers', 'convergence-hum']
  }
};

export function RoomAtmosphere({ 
  roomId, 
  intensity = 0.5, 
  stabilityLevel = 50,
  showDecorations = true,
  decorationIntensity = 1.0,
  showTerminals = true,
  terminalInteractive = true,
  enableAssetLayers = true,
  performanceMode = 'medium',
  children,
  className 
}: RoomAtmosphereProps) {
  const [config, setConfig] = useState<AtmosphericConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Asset loading state for performance optimization
  const [assetLoadingState, setAssetLoadingState] = useState<AssetLoadingState>('idle');

  useEffect(() => {
    const roomConfig = ROOM_CONFIGS[roomId];
    if (roomConfig) {
      // Get background asset for this room
      const backgroundAsset = getRoomBackgroundAsset(roomId);
      const enhancedConfig = {
        ...roomConfig,
        backgroundImage: backgroundAsset || undefined
      };
      
      setConfig(enhancedConfig);
      setBackgroundImage(backgroundAsset);
      setIsLoaded(true);
    }
  }, [roomId]);

  // Preload background image with error handling and performance tracking
  useEffect(() => {
    if (backgroundImage && !imageLoaded && !imageError && !imageLoading) {
      setImageLoading(true);
      setImageError(false);
      setAssetLoadingState('loading');
      
      preloadImage(backgroundImage)
        .then(() => {
          setImageLoaded(true);
          setImageLoading(false);
          setAssetLoadingState('loaded');
        })
        .catch((error) => {
          console.warn(`Failed to load room background: ${backgroundImage}`, error);
          setImageError(true);
          setImageLoading(false);
          setAssetLoadingState('error');
        });
    }
  }, [backgroundImage, imageLoaded, imageError, imageLoading]);

  if (!config || !isLoaded) {
    return (
      <div className={cn("min-h-screen bg-black", className)}>
        {children}
      </div>
    );
  }

  const atmosphereIntensity = Math.min(1, intensity * (1 + (100 - stabilityLevel) / 200));
  const hasBackground = backgroundImage && imageLoaded && !imageError;

  // Get optimized CSS classes for performance
  const roomClasses = getRoomAtmosphereClasses(
    roomId, 
    !!hasBackground, 
    performanceMode
  );

  // Create performance-optimized CSS properties
  const performanceProps = createAssetPerformanceProps(
    atmosphereIntensity,
    stabilityLevel,
    performanceMode
  );

  // Wrap everything in themed asset layering if enabled
  const content = (
    <div 
      className={cn(
        "min-h-screen relative overflow-hidden transition-all duration-1000",
        roomClasses,
        config.backgroundClass,
        assetLoadingState === 'loading' && "room-loading-shimmer",
        className
      )}
      style={{
        ...performanceProps,
        '--room-intensity': atmosphereIntensity,
        '--stability-factor': stabilityLevel / 100,
        // Apply background image directly to the container with proper CSS utilities
        ...(hasBackground && {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: config.backgroundSize || 'cover',
          backgroundPosition: config.backgroundPosition || 'center'
        })
      } as React.CSSProperties}
    >

      {/* Loading indicator for background image */}
      {assetLoadingState === 'loading' && (
        <div className="asset-layer z-5" style={{ zIndex: 5 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="asset-loading-spinner" />
            <div className="text-white/70 text-sm font-code ml-4 asset-loading-dots">
              Loading room atmosphere
            </div>
          </div>
        </div>
      )}

      {/* Error indicator for failed background image */}
      {assetLoadingState === 'error' && (
        <div className="asset-layer asset-error-state z-5" style={{ zIndex: 5 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-400 text-sm font-code">Failed to load background</div>
          </div>
        </div>
      )}

      {/* Atmospheric effects overlay - layered above background */}
      <div className="asset-layer asset-layer-effects" style={{ zIndex: 20 }}>
        {config.ambientElements.map((element, index) => (
          <div 
            key={index}
            className={cn(
              "asset-transition-normal",
              performanceMode === 'low' && "asset-memory-optimized"
            )}
            style={{ 
              opacity: atmosphereIntensity * (hasBackground ? 0.9 : 1), // Slightly reduce opacity when background is present
              animationDelay: `${index * 0.5}s`,
              contain: 'paint' // Optimize individual elements
            }}
          >
            {element}
          </div>
        ))}
      </div>

      {/* CSS gradient overlay - blends with PNG background */}
      <div 
        className={cn(
          "asset-layer asset-layer-room",
          hasBackground && "asset-blend-multiply"
        )}
        style={{
          zIndex: 10,
          background: hasBackground
            ? 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
            : 'none', // Add subtle gradient overlay when PNG is present
          contain: 'paint' // Optimize overlay rendering
        }}
      />

      {/* Stability-based color temperature overlay */}
      <div 
        className={cn(
          "asset-layer asset-layer-effects asset-transition-slow",
          hasBackground ? "asset-blend-overlay" : "asset-blend-normal"
        )}
        style={{
          zIndex: 30,
          background: stabilityLevel < 30 
            ? 'radial-gradient(circle, rgba(255, 71, 87, 0.15) 0%, transparent 70%)'
            : stabilityLevel > 70
            ? 'radial-gradient(circle, rgba(92, 255, 150, 0.08) 0%, transparent 70%)'
            : 'transparent',
          opacity: Math.abs(50 - stabilityLevel) / 50,
          contain: 'paint' // Optimize overlay rendering
        }}
      />

      {/* Terminal integration layer */}
      {showTerminals && (
        <div className="asset-layer asset-layer-ui asset-interactive" style={{ zIndex: 32 }}>
          {roomId === 'possessed-compiler' || roomId === 'final-merge' ? (
            <MultiTerminalIntegration 
              roomId={roomId}
              interactive={terminalInteractive}
            />
          ) : (
            <TerminalIntegration 
              roomId={roomId}
              interactive={terminalInteractive}
            />
          )}
        </div>
      )}

      {/* Seasonal decorations layer */}
      {showDecorations && (
        <div className="asset-layer asset-layer-decorations asset-interactive" style={{ zIndex: 35 }}>
          <SeasonalDecorations 
            roomId={roomId}
            intensity={decorationIntensity}
            interactive={true}
          />
        </div>
      )}

      {/* Content layer - above all atmospheric effects */}
      <div className="relative asset-layer-overlay" style={{ zIndex: 40 }}>
        {children}
      </div>

      {/* Compile heartbeat effect */}
      <CompileHeartbeat stabilityLevel={stabilityLevel} />
    </div>
  );

  // Return with or without themed asset layering
  if (enableAssetLayers) {
    return (
      <ThemedAssetLayering
        roomId={roomId}
        stabilityLevel={stabilityLevel}
        intensity={atmosphereIntensity}
        performanceMode={performanceMode}
        className={className}
      >
        {content}
      </ThemedAssetLayering>
    );
  }

  return content;
}

// Atmospheric element components
function CauldronElement() {
  return (
    <div className="absolute bottom-10 left-10">
      <div className="cauldron">
        <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-t from-orange-500/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function DataMist({ intensity }: { intensity: number }) {
  return (
    <div 
      className="data-mist"
      style={{ opacity: intensity }}
    />
  );
}

function TerminalScanlines() {
  return (
    <div className="absolute inset-0 crt-scanlines opacity-30" />
  );
}

function CableVeins() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="cable absolute"
          style={{
            top: `${20 + i * 10}%`,
            left: `${10 + (i % 2) * 40}%`,
            width: `${30 + i * 5}%`,
            transform: `rotate(${-15 + i * 5}deg)`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
    </div>
  );
}

function CircularHighlights() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-cyan-400/20 animate-pulse"
          style={{
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            top: `${30 + i * 20}%`,
            left: `${40 + i * 10}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${2 + i * 0.5}s`
          }}
        />
      ))}
    </div>
  );
}

function FloatingObjects() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="absolute w-4 h-4 bg-teal-400/30 rounded-sm animate-bounce"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}

function MemoryLeakIndicators() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="absolute w-8 h-8 border-2 border-red-400/40 rounded-full animate-ping"
          style={{
            top: `${20 + i * 15}%`,
            left: `${15 + i * 12}%`,
            animationDelay: `${i * 0.8}s`
          }}
        />
      ))}
    </div>
  );
}

function SyntaxTreeAnimations() {
  return (
    <div className="absolute inset-0">
      <svg className="w-full h-full opacity-20" viewBox="0 0 400 400">
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i}>
            <line
              x1={200}
              y1={50 + i * 60}
              x2={150 + i * 20}
              y2={100 + i * 60}
              stroke="currentColor"
              strokeWidth="2"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
            <line
              x1={200}
              y1={50 + i * 60}
              x2={250 - i * 20}
              y2={100 + i * 60}
              stroke="currentColor"
              strokeWidth="2"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.2 + 0.1}s` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function CompilationSparks() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-orange-400 rounded-full animate-ping"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${0.5 + Math.random() * 1}s`
          }}
        />
      ))}
    </div>
  );
}

function MoralCodePillars() {
  return (
    <div className="absolute inset-0 flex justify-around items-end pb-20">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="w-8 bg-gradient-to-t from-yellow-600/30 to-yellow-400/10 rounded-t-lg animate-pulse"
          style={{
            height: `${60 + i * 20}%`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
    </div>
  );
}

function JusticeScales() {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="w-32 h-32 opacity-30">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="30" x2="80" y2="30" stroke="currentColor" strokeWidth="2" />
          <circle cx="25" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="75" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

function BranchConvergence() {
  return (
    <div className="absolute inset-0">
      <svg className="w-full h-full opacity-30" viewBox="0 0 400 400">
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M ${50 + i * 40} 350 Q 200 ${300 - i * 20} 200 50`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

function FinalMergeAnimation() {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="w-64 h-64 rounded-full border-4 border-white/20 animate-spin" 
           style={{ animationDuration: '10s' }}>
        <div className="w-full h-full rounded-full border-4 border-cyan-400/30 animate-spin" 
             style={{ animationDuration: '7s', animationDirection: 'reverse' }}>
          <div className="w-full h-full rounded-full border-4 border-orange-400/20 animate-spin" 
               style={{ animationDuration: '5s' }} />
        </div>
      </div>
    </div>
  );
}

function CompileHeartbeat({ stabilityLevel }: { stabilityLevel: number }) {
  const bpm = Math.max(60, Math.min(120, 60 + (100 - stabilityLevel) * 0.6));
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none compile-heartbeat z-25"
      style={{
        '--instability-bpm': bpm,
        opacity: (100 - stabilityLevel) / 200
      } as React.CSSProperties}
    />
  );
}