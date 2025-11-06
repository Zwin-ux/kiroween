/**
 * Example script to demonstrate asset validation functionality
 * This can be used for development and debugging
 */

import { 
  validateAssets, 
  getAssetValidationStatus, 
  getRoomBackgroundAsset, 
  getGhostBaseAsset,
  hasRoomBackgroundAsset,
  ROOM_ASSET_MAPPING 
} from './assets';

export async function runAssetValidationExample() {
  console.log('🎮 Asset Integration Fix - Validation Example');
  console.log('='.repeat(50));

  // 1. Test room mapping functionality
  console.log('\n📁 Room Asset Mapping:');
  Object.entries(ROOM_ASSET_MAPPING).forEach(([roomId, assetKey]) => {
    const assetPath = getRoomBackgroundAsset(roomId);
    console.log(`  ${roomId} -> ${assetKey} -> ${assetPath}`);
  });

  // 2. Test ghost asset functionality
  console.log('\n👻 Ghost Assets:');
  const ghostAsset = getGhostBaseAsset();
  console.log(`  Base ghost asset: ${ghostAsset}`);

  // 3. Test room background checks
  console.log('\n🏠 Room Background Checks:');
  const testRooms = ['boot-sector', 'dependency-crypt', 'nonexistent-room'];
  testRooms.forEach(roomId => {
    const hasAsset = hasRoomBackgroundAsset(roomId);
    console.log(`  ${roomId}: ${hasAsset ? '✅ Has asset' : '❌ No asset'}`);
  });

  // 4. Run full asset validation (in a real browser environment)
  console.log('\n🔍 Asset Validation:');
  try {
    const validationResult = await validateAssets();
    console.log(`  Total assets: ${validationResult.totalAssets}`);
    console.log(`  Valid assets: ${validationResult.validAssets}`);
    console.log(`  Overall valid: ${validationResult.valid ? '✅' : '❌'}`);
    
    if (validationResult.missing.length > 0) {
      console.log('  Missing assets:');
      validationResult.missing.forEach(asset => {
        console.log(`    ❌ ${asset}`);
      });
    }
    
    if (validationResult.warnings.length > 0) {
      console.log('  Warnings:');
      validationResult.warnings.forEach(warning => {
        console.log(`    ⚠️  ${warning}`);
      });
    }
  } catch (error) {
    console.log(`  ⚠️  Validation failed (likely not in browser): ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n✅ Asset validation example completed!');
}

// This function is already exported above