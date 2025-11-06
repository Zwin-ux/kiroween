/**
 * Asset Integration Example
 * 
 * Demonstrates usage of the new asset integration system
 * including GameAsset component, useAssets hook, and preloading.
 */

import * as React from "react";
import { GameAsset, RoomBackground, EntityAsset, IconAsset } from "@/components/ui/GameAsset";
import { AssetPreloadProgress, useAssetPreloading } from "@/components/ui/AssetPreloadProgress";
import { useAssets } from "@/hooks/useAssets";
import { AssetCategory } from "@/lib/assets";
import { AssetPriority } from "@/lib/assetPreloader";
import { Button } from "@/components/ui/button";

/**
 * Example component showing asset integration features
 */
export const AssetIntegrationExample: React.FC = () => {
  const { getAsset, getAssetWithMetadata, preloadByCategory, preloadProgress } = useAssets();
  const { startPreloading, isPreloading } = useAssetPreloading();

  // Example: Get asset information
  const compilerRoomAsset = getAssetWithMetadata('rooms', 'compiler');
  const ghostIconAsset = getAsset('icons', 'ghost');

  return (
    <div className="p-6 space-y-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-center">Asset Integration Example</h1>

      {/* Preloading Progress */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Asset Preloading</h2>
        <div className="flex gap-4">
          <Button 
            onClick={startPreloading}
            disabled={isPreloading}
            variant="horror"
          >
            {isPreloading ? 'Preloading...' : 'Start Preloading'}
          </Button>
          <Button 
            onClick={() => preloadByCategory(AssetCategory.Entity, AssetPriority.High)}
            variant="outline"
          >
            Preload Entities
          </Button>
        </div>
        
        {preloadProgress && (
          <AssetPreloadProgress 
            showDetails={true}
            className="max-w-md"
          />
        )}
      </section>

      {/* Room Background Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Room Background</h2>
        <div className="relative w-full h-64 border border-gray-700 rounded-lg overflow-hidden">
          <RoomBackground roomName="compiler">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 p-4 rounded-lg">
                <p className="text-white font-mono">Compiler Room Background</p>
                {compilerRoomAsset && (
                  <p className="text-sm text-gray-300">
                    {compilerRoomAsset.metadata.description}
                  </p>
                )}
              </div>
            </div>
          </RoomBackground>
        </div>
      </section>

      {/* Entity Assets Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Entity Assets</h2>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <EntityAsset entityName="pumpkin" size="lg" />
            <p className="text-sm text-gray-400 mt-2">Pumpkin (Large)</p>
          </div>
          <div className="text-center">
            <EntityAsset entityName="candy" size="md" />
            <p className="text-sm text-gray-400 mt-2">Candy (Medium)</p>
          </div>
          <div className="text-center">
            <EntityAsset entityName="terminal" size="sm" />
            <p className="text-sm text-gray-400 mt-2">Terminal (Small)</p>
          </div>
        </div>
      </section>

      {/* Icon Assets Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Icon Assets</h2>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <IconAsset iconName="asset" size="lg" />
            <span>Asset Icon (Large)</span>
          </div>
          <div className="flex items-center gap-2">
            <IconAsset iconName="ghost" size="md" />
            <span>Ghost Icon (Medium)</span>
          </div>
        </div>
      </section>

      {/* Direct GameAsset Usage */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Direct GameAsset Usage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">UI Background</h3>
            <GameAsset
              category="ui"
              name="background"
              alt="Kiroween background"
              className="w-full h-32 rounded"
              priority={false}
              onLoad={() => console.log('UI background loaded')}
              onError={(error) => console.error('Failed to load UI background:', error)}
            />
          </div>
          
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Color Palette</h3>
            <GameAsset
              category="ui"
              name="palette"
              alt="Kiroween color palette"
              className="w-full h-32 rounded"
            />
          </div>
        </div>
      </section>

      {/* Asset Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Asset Information</h2>
        <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm">
          <p><strong>Compiler Room Asset:</strong></p>
          {compilerRoomAsset && (
            <div className="ml-4 space-y-1">
              <p>Path: {compilerRoomAsset.path}</p>
              <p>Category: {compilerRoomAsset.metadata.category}</p>
              <p>Description: {compilerRoomAsset.metadata.description}</p>
              <p>Lighting: {compilerRoomAsset.metadata.lighting}</p>
              <p>Z-Index: {compilerRoomAsset.metadata.zIndex}</p>
            </div>
          )}
          
          <p className="mt-4"><strong>Ghost Icon Path:</strong></p>
          <p className="ml-4">{ghostIconAsset}</p>
        </div>
      </section>
    </div>
  );
};

export default AssetIntegrationExample;