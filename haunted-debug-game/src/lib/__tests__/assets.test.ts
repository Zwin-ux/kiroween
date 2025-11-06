/**
 * Asset registry tests
 */

import { 
  assets, 
  ROOM_ASSET_MAPPING, 
  getRoomBackgroundAsset, 
  getGhostBaseAsset, 
  hasRoomBackgroundAsset,
  getAssetMetadata,
  getAssetWithMetadata
} from '../assets';

describe('Asset Registry', () => {
  test('should have ghost assets defined', () => {
    expect(assets.ghosts).toBeDefined();
    expect(assets.ghosts.base).toBe('/icon_ghost_surprised.png');
  });

  test('should have room assets defined', () => {
    expect(assets.rooms.compiler).toBe('/Compiler Room.png');
    expect(assets.rooms.stackTrace).toBe('/Stack Trace Tower.png');
    expect(assets.rooms.graveyard).toBe('/garbage.png');
  });

  test('should map rooms to assets correctly', () => {
    expect(ROOM_ASSET_MAPPING['boot-sector']).toBe('rooms.compiler');
    expect(ROOM_ASSET_MAPPING['dependency-crypt']).toBe('rooms.graveyard');
    expect(ROOM_ASSET_MAPPING['possessed-compiler']).toBe('rooms.stackTrace');
  });

  test('getRoomBackgroundAsset should return correct paths', () => {
    expect(getRoomBackgroundAsset('boot-sector')).toBe('/Compiler Room.png');
    expect(getRoomBackgroundAsset('dependency-crypt')).toBe('/garbage.png');
    expect(getRoomBackgroundAsset('possessed-compiler')).toBe('/Stack Trace Tower.png');
    expect(getRoomBackgroundAsset('nonexistent-room')).toBeNull();
  });

  test('getGhostBaseAsset should return ghost base asset', () => {
    expect(getGhostBaseAsset()).toBe('/icon_ghost_surprised.png');
  });

  test('hasRoomBackgroundAsset should check room mapping', () => {
    expect(hasRoomBackgroundAsset('boot-sector')).toBe(true);
    expect(hasRoomBackgroundAsset('dependency-crypt')).toBe(true);
    expect(hasRoomBackgroundAsset('nonexistent-room')).toBe(false);
  });

  test('getAssetMetadata should return metadata for valid assets', () => {
    const ghostMetadata = getAssetMetadata('ghosts', 'base');
    expect(ghostMetadata).toBeDefined();
    expect(ghostMetadata?.description).toContain('Base ghost image');
    
    const roomMetadata = getAssetMetadata('rooms', 'compiler');
    expect(roomMetadata).toBeDefined();
    expect(roomMetadata?.description).toContain('compiler room');
  });

  test('getAssetWithMetadata should return asset with metadata', () => {
    const ghostAsset = getAssetWithMetadata('ghosts', 'base');
    expect(ghostAsset).toBeDefined();
    expect(ghostAsset?.path).toBe('/icon_ghost_surprised.png');
    expect(ghostAsset?.metadata.description).toContain('Base ghost image');
  });
});