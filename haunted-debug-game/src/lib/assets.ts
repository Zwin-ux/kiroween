/**
 * Centralized Asset Registry for Haunted Debug Game
 * 
 * This module imports and categorizes all PNG assets from the public directory
 * using Next.js static imports for optimal performance and type safety.
 */

/**
 * Asset categories enum for type-safe asset classification
 */
export enum AssetCategory {
  Room = 'room',
  UIIcon = 'ui_icon',
  Entity = 'entity',
  VisualTheme = 'visual_theme'
}

/**
 * Asset metadata interface for rich descriptive information
 */
export interface AssetMetadata {
  description: string;
  category: AssetCategory;
  lighting?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  usage?: string[];
  zIndex?: number;
}

/**
 * Asset registry interface matching the categorized structure
 */
export interface AssetRegistryInterface {
  rooms: {
    compiler: string;
    stackTrace: string;
    graveyard: string;
    background: string;
    roomsheet: string;
  };
  ghosts: {
    base: string;
  };
  icons: {
    asset: string;
    ghost: string;
    file: string;
    globe: string;
    window: string;
  };
  entities: {
    pumpkin: string;
    candy: string;
    terminal: string;
  };
  ui: {
    background: string;
    palette: string;
    roomsheet: string;
  };
}

/**
 * Asset with metadata combination for enhanced asset information
 */
export interface AssetWithMetadata {
  path: string;
  metadata: AssetMetadata;
}

// Static asset paths for Next.js optimization
// Note: These are static paths that Next.js will optimize during build

/**
 * Typed asset registry with nested category structure
 * Provides type-safe access to all game assets organized by function
 */
export const assets = {
  rooms: {
    compiler: '/Compiler Room.png',
    stackTrace: '/Stack Trace Tower.png',
    graveyard: '/garbage.png',
    background: '/kiroween_background.png.png',
    roomsheet: '/kiroween_rooms.png',
  },
  ghosts: {
    base: '/icon_ghost_surprised.png',
    // Future: Add specific ghost variants when available
    // surprised: '/icon_ghost_surprised.png',
    // angry: '/icon_ghost_angry.png',
    // confused: '/icon_ghost_confused.png',
  },
  icons: {
    asset: '/asset icon.png',
    ghost: '/icon_ghost_surprised.png',
    file: '/file.svg',
    globe: '/globe.svg',
    window: '/window.svg',
  },
  entities: {
    pumpkin: '/pumpkin.png',
    candy: '/candypumpkin.png',
    terminal: '/terminal.png',
  },
  ui: {
    background: '/kiroween_background.png.png',
    palette: '/kiroween_clay_palette.png',
    roomsheet: '/kiroween_rooms.png',
  },
} as const;



export type AssetRegistry = typeof assets;

/**
 * Asset metadata definitions for each asset with category and description
 * Includes visual properties like lighting and usage context
 */
export const assetMetadata: Record<string, AssetMetadata> = {
  // Room Assets
  'rooms.compiler': {
    description: 'Main compiler room background with atmospheric lighting',
    category: AssetCategory.Room,
    lighting: 'green glow ambient',
    tags: ['background', 'compiler', 'main-room'],
    usage: ['room-background', 'main-interface'],
    zIndex: 0,
  },
  'rooms.stackTrace': {
    description: 'Stack Trace Tower room with vertical spire and red error logs',
    category: AssetCategory.Room,
    lighting: 'red error glow',
    tags: ['background', 'tower', 'stack-trace', 'errors'],
    usage: ['room-background', 'error-visualization'],
    zIndex: 0,
  },
  'rooms.graveyard': {
    description: 'Garbage Collector Graveyard with rusty scrapyard aesthetic',
    category: AssetCategory.Room,
    lighting: 'golden decay glow',
    tags: ['background', 'graveyard', 'garbage-collection', 'decay'],
    usage: ['room-background', 'memory-management'],
    zIndex: 0,
  },
  'rooms.background': {
    description: 'Kiroween themed atmospheric background',
    category: AssetCategory.Room,
    lighting: 'atmospheric horror',
    tags: ['background', 'kiroween', 'atmospheric'],
    usage: ['global-background', 'theme-overlay'],
    zIndex: -1,
  },
  'rooms.roomsheet': {
    description: 'Complete room layout reference sheet',
    category: AssetCategory.Room,
    tags: ['rooms', 'layout', 'reference', 'multiple'],
    usage: ['layout-reference', 'room-design'],
    zIndex: -1,
  },

  // UI Icon Assets
  'icons.asset': {
    description: 'Generic asset icon for UI elements and buttons',
    category: AssetCategory.UIIcon,
    tags: ['icon', 'ui', 'generic'],
    usage: ['button-icon', 'status-indicator'],
    zIndex: 10,
  },
  'icons.ghost': {
    description: 'Surprised ghost icon for ghost encounters and reactions',
    category: AssetCategory.UIIcon,
    lighting: 'soft white glow',
    tags: ['ghost', 'surprised', 'reaction'],
    usage: ['ghost-state', 'interaction-feedback'],
    zIndex: 10,
  },
  'icons.file': {
    description: 'File icon for code files and documents',
    category: AssetCategory.UIIcon,
    tags: ['file', 'document', 'code'],
    usage: ['file-representation', 'code-modules'],
    zIndex: 10,
  },
  'icons.globe': {
    description: 'Globe icon for network and global operations',
    category: AssetCategory.UIIcon,
    tags: ['globe', 'network', 'global'],
    usage: ['network-status', 'global-operations'],
    zIndex: 10,
  },
  'icons.window': {
    description: 'Window icon for UI panels and interfaces',
    category: AssetCategory.UIIcon,
    tags: ['window', 'panel', 'interface'],
    usage: ['panel-header', 'window-management'],
    zIndex: 10,
  },

  // Entity Assets
  'entities.pumpkin': {
    description: 'Interactive pumpkin entity for Halloween theme',
    category: AssetCategory.Entity,
    lighting: 'orange warm glow',
    tags: ['pumpkin', 'halloween', 'interactive'],
    usage: ['collectible', 'decoration', 'interactive-object'],
    zIndex: 5,
  },
  'entities.candy': {
    description: 'Candy pumpkin collectible with sweet Halloween appeal',
    category: AssetCategory.Entity,
    lighting: 'soft orange glow',
    tags: ['candy', 'collectible', 'sweet'],
    usage: ['collectible', 'reward', 'interactive-object'],
    zIndex: 5,
  },
  'entities.terminal': {
    description: 'Interactive terminal for code debugging and ghost encounters',
    category: AssetCategory.Entity,
    lighting: 'green screen glow',
    tags: ['terminal', 'code', 'debugging'],
    usage: ['interaction-point', 'debugging-interface'],
    zIndex: 5,
  },

  // Ghost Assets
  'ghosts.base': {
    description: 'Base ghost image for all ghost personalities with color overlay support',
    category: AssetCategory.Entity,
    lighting: 'soft ethereal glow',
    tags: ['ghost', 'base', 'personality', 'overlay'],
    usage: ['ghost-rendering', 'personality-base', 'color-overlay'],
    zIndex: 5,
  },

  // Visual Theme Assets
  'ui.background': {
    description: 'Kiroween themed background for overall visual consistency',
    category: AssetCategory.VisualTheme,
    lighting: 'atmospheric horror',
    tags: ['background', 'theme', 'kiroween'],
    usage: ['theme-reference', 'composite-background'],
    zIndex: -1,
  },
  'ui.palette': {
    description: 'Clay palette reference for maintaining visual theme consistency',
    category: AssetCategory.VisualTheme,
    tags: ['palette', 'colors', 'reference'],
    usage: ['color-reference', 'theme-guide'],
    zIndex: -1,
  },
  'ui.roomsheet': {
    description: 'Room layout reference sheet for spatial organization',
    category: AssetCategory.VisualTheme,
    tags: ['rooms', 'layout', 'reference'],
    usage: ['layout-reference', 'room-design'],
    zIndex: -1,
  },
};

/**
 * Metadata lookup functionality for retrieving asset information
 */
export function getAssetMetadata(category: keyof AssetRegistry, name: string): AssetMetadata | undefined {
  const key = `${category}.${name}`;
  return assetMetadata[key];
}

/**
 * Get asset path with metadata for enhanced asset information
 */
export function getAssetWithMetadata(category: keyof AssetRegistry, name: string): AssetWithMetadata | undefined {
  const categoryAssets = assets[category];
  const metadata = getAssetMetadata(category, name);
  
  if (categoryAssets && metadata && name in categoryAssets) {
    const assetPath = (categoryAssets as any)[name] as string;
    return {
      path: assetPath,
      metadata,
    };
  }
  
  return undefined;
}

/**
 * Get all assets by category with their metadata
 */
export function getAssetsByCategory(category: AssetCategory): AssetWithMetadata[] {
  const results: AssetWithMetadata[] = [];
  
  Object.entries(assetMetadata).forEach(([key, metadata]) => {
    if (metadata.category === category) {
      const [categoryKey, assetName] = key.split('.');
      const categoryAssets = assets[categoryKey as keyof AssetRegistry];
      
      if (categoryAssets && assetName in categoryAssets) {
        const assetPath = (categoryAssets as any)[assetName] as string;
        results.push({
          path: assetPath,
          metadata,
        });
      }
    }
  });
  
  return results;
}

/**
 * Room-to-asset mapping configuration
 * Maps room IDs to their corresponding background assets
 */
export const ROOM_ASSET_MAPPING: Record<string, string> = {
  'boot-sector': 'rooms.compiler',
  'dependency-crypt': 'rooms.graveyard',     // Using garbage.png for crypt theme
  'ghost-memory-heap': 'rooms.graveyard',   // Reusing graveyard for heap theme
  'possessed-compiler': 'rooms.stackTrace', // Using Stack Trace Tower for compiler
  'ethics-tribunal': 'rooms.graveyard',     // Using garbage.png for tribunal
  'final-merge': 'rooms.background',        // Using general background for final room
};

/**
 * Get room background asset path by room ID
 */
export function getRoomBackgroundAsset(roomId: string): string | null {
  const assetKey = ROOM_ASSET_MAPPING[roomId];
  if (!assetKey) return null;
  
  const [category, name] = assetKey.split('.');
  const categoryAssets = assets[category as keyof AssetRegistry];
  
  if (categoryAssets && name in categoryAssets) {
    return (categoryAssets as any)[name] as string;
  }
  
  return null;
}

/**
 * Get ghost base asset path
 */
export function getGhostBaseAsset(): string {
  return assets.ghosts.base;
}

/**
 * Check if a room has a background asset configured
 */
export function hasRoomBackgroundAsset(roomId: string): boolean {
  return roomId in ROOM_ASSET_MAPPING;
}

/**
 * Asset validation result interface
 */
export interface AssetValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  totalAssets: number;
  validAssets: number;
}

/**
 * Validate that all assets in the registry exist in the public folder
 * This is a client-side validation that attempts to load assets
 */
export async function validateAssets(): Promise<AssetValidationResult> {
  const missing: string[] = [];
  const warnings: string[] = [];
  let totalAssets = 0;
  let validAssets = 0;

  // Collect all asset paths from the registry
  const allAssetPaths: string[] = [];
  
  Object.values(assets).forEach(category => {
    Object.values(category).forEach(assetPath => {
      if (typeof assetPath === 'string') {
        allAssetPaths.push(assetPath);
        totalAssets++;
      }
    });
  });

  // Validate each asset by attempting to load it
  const validationPromises = allAssetPaths.map(async (assetPath) => {
    try {
      const response = await fetch(assetPath, { method: 'HEAD' });
      if (response.ok) {
        validAssets++;
        return { path: assetPath, valid: true };
      } else {
        missing.push(assetPath);
        return { path: assetPath, valid: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      missing.push(assetPath);
      return { path: assetPath, valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  await Promise.all(validationPromises);

  // Check for room mapping issues
  Object.entries(ROOM_ASSET_MAPPING).forEach(([roomId, assetKey]) => {
    const [category, name] = assetKey.split('.');
    const categoryAssets = assets[category as keyof AssetRegistry];
    
    if (!categoryAssets || !(name in categoryAssets)) {
      warnings.push(`Room "${roomId}" maps to invalid asset key "${assetKey}"`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    totalAssets,
    validAssets
  };
}

/**
 * Preload image utility with error handling
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Validate a specific asset exists
 */
export async function validateAsset(assetPath: string): Promise<boolean> {
  try {
    await preloadImage(assetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get asset validation status for development/debugging
 */
export async function getAssetValidationStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  const allAssetPaths: string[] = [];
  Object.values(assets).forEach(category => {
    Object.values(category).forEach(assetPath => {
      if (typeof assetPath === 'string') {
        allAssetPaths.push(assetPath);
      }
    });
  });

  const validationPromises = allAssetPaths.map(async (assetPath) => {
    const isValid = await validateAsset(assetPath);
    status[assetPath] = isValid;
  });

  await Promise.all(validationPromises);
  return status;
}