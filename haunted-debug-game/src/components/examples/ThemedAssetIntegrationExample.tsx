/**
 * ThemedAssetIntegrationExample - Comprehensive example of themed decorative elements
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { RoomAtmosphere } from '@/components/ui/RoomAtmosphere';
import { IndustrialButton, MeterDisplay } from '@/components/ui/IndustrialUI';
import { useThemedAssetLayers } from '@/components/ui/ThemedAssetLayering';

export function ThemedAssetIntegrationExample() {
  const [currentRoom, setCurrentRoom] = useState('boot-sector');
  const [stabilityLevel, setStabilityLevel] = useState(50);
  const [showControls, setShowControls] = useState(true);
  
  const {
    performanceMode,
    setPerformanceMode,
    intensity,
    setIntensity,
    layersEnabled,
    toggleLayers,
    adjustIntensity,
    optimizePerformance,
    maximizeQuality
  } = useThemedAssetLayers(currentRoom);

  const rooms = [
    { id: 'boot-sector', name: 'Boot Sector' },
    { id: 'dependency-crypt', name: 'Dependency Crypt' },
    { id: 'ghost-memory-heap', name: 'Memory Heap' },
    { id: 'possessed-compiler', name: 'Possessed Compiler' },
    { id: 'ethics-tribunal', name: 'Ethics Tribunal' },
    { id: 'final-merge', name: 'Final Merge' }
  ];

  return (
    <div className="themed-asset-integration-example relative min-h-screen">
      {/* Room atmosphere with all themed elements */}
      <RoomAtmosphere
        roomId={currentRoom}
        stabilityLevel={stabilityLevel}
        intensity={intensity}
        showDecorations={true}
        decorationIntensity={intensity}
        showTerminals={true}
        terminalInteractive={true}
        enableAssetLayers={layersEnabled}
        performanceMode={performanceMode}
      >
        {/* Main content area */}
        <div className="relative z-50 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                Themed Asset Integration Demo
              </h1>
              <p className="text-gray-300">
                Showcasing contextual decorations, terminal integration, and layered assets
              </p>
            </div>

            {/* Room information */}
            <div className="bg-black/50 rounded-lg p-6 mb-6 border border-gray-600">
              <h2 className="text-2xl font-bold text-white mb-4">
                Current Room: {rooms.find(r => r.id === currentRoom)?.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MeterDisplay
                  label="Stability Level"
                  value={stabilityLevel}
                  maxValue={100}
                  unit="%"
                />
                <MeterDisplay
                  label="Asset Intensity"
                  value={Math.round(intensity * 100)}
                  maxValue={100}
                  unit="%"
                />
                <MeterDisplay
                  label="Performance Mode"
                  value={performanceMode === 'low' ? 33 : performanceMode === 'medium' ? 66 : 100}
                  maxValue={100}
                  unit=""
                />
              </div>
            </div>

            {/* Controls panel */}
            {showControls && (
              <div className="bg-black/70 rounded-lg p-6 mb-6 border border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Controls</h3>
                  <IndustrialButton
                    size="sm"
                    onClick={() => setShowControls(false)}
                  >
                    Hide Controls
                  </IndustrialButton>
                </div>

                {/* Room selection */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Room Selection</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {rooms.map(room => (
                      <IndustrialButton
                        key={room.id}
                        variant={currentRoom === room.id ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setCurrentRoom(room.id)}
                      >
                        {room.name}
                      </IndustrialButton>
                    ))}
                  </div>
                </div>

                {/* Stability control */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Stability Level</h4>
                  <div className="flex items-center gap-4">
                    <IndustrialButton
                      size="sm"
                      onClick={() => setStabilityLevel(Math.max(0, stabilityLevel - 10))}
                    >
                      -10
                    </IndustrialButton>
                    <span className="text-white font-mono min-w-[60px] text-center">
                      {stabilityLevel}%
                    </span>
                    <IndustrialButton
                      size="sm"
                      onClick={() => setStabilityLevel(Math.min(100, stabilityLevel + 10))}
                    >
                      +10
                    </IndustrialButton>
                  </div>
                </div>

                {/* Asset controls */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Asset Controls</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <IndustrialButton
                      size="sm"
                      variant={layersEnabled ? 'success' : 'secondary'}
                      onClick={toggleLayers}
                    >
                      {layersEnabled ? 'Layers On' : 'Layers Off'}
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      onClick={() => adjustIntensity(-0.1)}
                    >
                      Dim
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      onClick={() => adjustIntensity(0.1)}
                    >
                      Brighten
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      onClick={() => setIntensity(1.0)}
                    >
                      Reset
                    </IndustrialButton>
                  </div>
                </div>

                {/* Performance controls */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Performance Mode</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <IndustrialButton
                      size="sm"
                      variant={performanceMode === 'low' ? 'primary' : 'secondary'}
                      onClick={() => setPerformanceMode('low')}
                    >
                      Low
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      variant={performanceMode === 'medium' ? 'primary' : 'secondary'}
                      onClick={() => setPerformanceMode('medium')}
                    >
                      Medium
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      variant={performanceMode === 'high' ? 'primary' : 'secondary'}
                      onClick={() => setPerformanceMode('high')}
                    >
                      High
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      variant="danger"
                      onClick={optimizePerformance}
                    >
                      Optimize
                    </IndustrialButton>
                    <IndustrialButton
                      size="sm"
                      variant="success"
                      onClick={maximizeQuality}
                    >
                      Max Quality
                    </IndustrialButton>
                  </div>
                </div>
              </div>
            )}

            {/* Show controls button when hidden */}
            {!showControls && (
              <div className="fixed top-4 right-4 z-50">
                <IndustrialButton
                  onClick={() => setShowControls(true)}
                >
                  Show Controls
                </IndustrialButton>
              </div>
            )}

            {/* Feature showcase */}
            <div className="bg-black/50 rounded-lg p-6 border border-gray-600">
              <h3 className="text-xl font-bold text-white mb-4">Features Demonstrated</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">🎃 Seasonal Decorations</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Contextual pumpkin and candy placement</li>
                    <li>• Interactive decoration elements</li>
                    <li>• Room-specific decoration themes</li>
                    <li>• Animation and glow effects</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">💻 Terminal Integration</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• PNG asset-enhanced terminals</li>
                    <li>• Room-specific terminal content</li>
                    <li>• Multiple terminal layouts</li>
                    <li>• Interactive terminal interfaces</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">🎨 Asset Layering</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Performance-aware layer management</li>
                    <li>• Blend mode and opacity control</li>
                    <li>• Conditional layer rendering</li>
                    <li>• Stability-based asset behavior</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">⚡ Performance</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Adaptive performance modes</li>
                    <li>• Asset preloading and caching</li>
                    <li>• Graceful fallback rendering</li>
                    <li>• Memory usage optimization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RoomAtmosphere>
    </div>
  );
}