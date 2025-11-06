/**
 * Asset Performance Example
 * Demonstrates the CSS optimizations for asset performance
 */

import React, { useState } from 'react';
import { RoomAtmosphere } from '@/components/ui/RoomAtmosphere';
import { EnhancedGhostRenderer } from '@/components/ui/EnhancedGhostRenderer';
import { 
  getAssetContainerClasses,
  getOptimalPerformanceMode,
  type PerformanceMode 
} from '@/lib/assetPerformanceUtils';

export function AssetPerformanceExample() {
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('medium');
  const [stabilityLevel, setStabilityLevel] = useState(50);
  const [showDecorations, setShowDecorations] = useState(true);
  const [roomId, setRoomId] = useState('boot-sector');

  const optimalMode = getOptimalPerformanceMode();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Asset Performance Optimization Demo
        </h1>

        {/* Performance Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Performance Mode
              </label>
              <select
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value as PerformanceMode)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              >
                <option value="low">Low (Mobile/Reduced Motion)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Desktop/GPU Accelerated)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Room Type
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              >
                <option value="boot-sector">Compiler Room</option>
                <option value="dependency-crypt">Dependency Crypt</option>
                <option value="ghost-memory-heap">Memory Heap</option>
                <option value="possessed-compiler">Stack Trace Tower</option>
                <option value="ethics-tribunal">Ethics Tribunal</option>
                <option value="final-merge">Final Merge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Stability Level: {stabilityLevel}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={stabilityLevel}
                onChange={(e) => setStabilityLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDecorations}
                onChange={(e) => setShowDecorations(e.target.checked)}
                className="mr-2"
              />
              Show Decorations
            </label>
            
            <div className="text-sm text-gray-400">
              Optimal Mode for Device: <span className="text-green-400">{optimalMode}</span>
            </div>
          </div>

          {/* Performance Info */}
          <div className="bg-gray-800 rounded p-4">
            <h3 className="font-semibold mb-2">Current Optimizations:</h3>
            <ul className="text-sm space-y-1">
              {performanceMode === 'high' && (
                <>
                  <li>✓ GPU acceleration enabled</li>
                  <li>✓ Composite layers optimized</li>
                  <li>✓ Full animation complexity</li>
                </>
              )}
              {performanceMode === 'medium' && (
                <>
                  <li>✓ Balanced GPU usage</li>
                  <li>✓ Standard containment</li>
                  <li>✓ Moderate animation complexity</li>
                </>
              )}
              {performanceMode === 'low' && (
                <>
                  <li>✓ Memory optimized</li>
                  <li>✓ Reduced animations</li>
                  <li>✓ Layout stability prioritized</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Room Atmosphere Demo */}
        <div className="relative h-96 rounded-lg overflow-hidden mb-8">
          <RoomAtmosphere
            roomId={roomId}
            intensity={0.8}
            stabilityLevel={stabilityLevel}
            showDecorations={showDecorations}
            performanceMode={performanceMode}
            className="absolute inset-0"
          >
            <div className="relative z-50 flex items-center justify-center h-full">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Room: {roomId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <p className="text-gray-300">
                  Performance Mode: {performanceMode}
                </p>
                <p className="text-gray-300">
                  Stability: {stabilityLevel}%
                </p>
              </div>
            </div>
          </RoomAtmosphere>
        </div>

        {/* Ghost Renderer Demo */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ghost Performance Demo</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'circular_dependency',
              'stale_cache', 
              'unbounded_recursion',
              'data_leak'
            ].map((ghostType, index) => (
              <div key={ghostType} className="text-center">
                <div className="flex justify-center mb-2">
                  <EnhancedGhostRenderer
                    ghostType={ghostType}
                    severity={3 + index}
                    isActive={index === 1}
                    stabilityLevel={stabilityLevel}
                    performanceMode={performanceMode}
                  />
                </div>
                <p className="text-sm text-gray-400 capitalize">
                  {ghostType.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CSS Classes Demo */}
        <div className="bg-gray-900 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Generated CSS Classes</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Asset Container Classes:</h3>
              <code className="block bg-gray-800 p-2 rounded text-sm">
                {getAssetContainerClasses(performanceMode, true, 'loaded')}
              </code>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Performance Features:</h3>
              <ul className="text-sm space-y-1">
                <li>• CSS Containment: Isolates layout, style, and paint</li>
                <li>• GPU Layers: Forces hardware acceleration where beneficial</li>
                <li>• Loading States: Skeleton, pulse, and shimmer animations</li>
                <li>• Error Handling: Graceful fallbacks with visual indicators</li>
                <li>• Responsive: Adapts complexity based on device capabilities</li>
                <li>• Accessibility: Respects reduced motion and high contrast preferences</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}