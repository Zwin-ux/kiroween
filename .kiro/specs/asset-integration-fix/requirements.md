# Asset Integration Fix Requirements

## Introduction

The haunted debug game has a comprehensive asset registry system that maps to PNG assets in the public folder, but the components are not actually using these assets for room backgrounds and ghost visuals. The system needs to be updated to properly integrate the existing public folder assets.

## Glossary

- **Asset Registry**: The centralized system in `src/lib/assets.ts` that maps asset categories to file paths
- **Room Components**: React components that render room atmospheres and backgrounds
- **Ghost Renderer**: Components that display ghost visuals and personalities
- **Public Assets**: PNG and SVG files stored in the `haunted-debug-game/public/` directory

## Requirements

### Requirement 1

**User Story:** As a player, I want to see the actual room background images when navigating between different rooms, so that each room has a unique visual identity.

#### Acceptance Criteria

1. WHEN the player enters the compiler room, THE Room_Atmosphere_Component SHALL display the "Compiler Room.png" as the background image
2. WHEN the player enters the stack trace tower, THE Room_Atmosphere_Component SHALL display the "Stack Trace Tower.png" as the background image  
3. WHEN the player enters the garbage collector graveyard, THE Room_Atmosphere_Component SHALL display the "garbage.png" as the background image
4. WHERE room background assets exist, THE Room_Atmosphere_Component SHALL layer the PNG background with the existing CSS atmospheric effects
5. IF a room background asset is missing, THEN THE Room_Atmosphere_Component SHALL fall back to the existing CSS gradient backgrounds

### Requirement 2

**User Story:** As a player, I want to see actual ghost images when encountering different ghost types, so that each ghost has a distinct visual appearance.

#### Acceptance Criteria

1. WHEN a ghost is rendered, THE Enhanced_Ghost_Renderer SHALL display the "icon_ghost_surprised.png" as the base ghost image
2. WHILE a ghost is active, THE Enhanced_Ghost_Renderer SHALL apply personality-specific color overlays to the base ghost image
3. WHEN multiple ghost types are present, THE Enhanced_Ghost_Renderer SHALL maintain distinct visual appearances through color and effect variations
4. WHERE ghost-specific assets exist, THE Enhanced_Ghost_Renderer SHALL use the appropriate asset for each ghost type
5. IF a ghost asset is missing, THEN THE Enhanced_Ghost_Renderer SHALL fall back to the existing symbol-based rendering

### Requirement 3

**User Story:** As a developer, I want the asset system to automatically validate and preload required assets, so that the game loads efficiently and handles missing assets gracefully.

#### Acceptance Criteria

1. WHEN the game initializes, THE Asset_System SHALL validate that all referenced assets exist in the public folder
2. WHEN assets are missing, THE Asset_System SHALL log warnings and provide fallback alternatives
3. WHILE the game is loading, THE Asset_System SHALL preload critical room and ghost assets
4. WHERE assets are successfully loaded, THE Asset_System SHALL cache them for optimal performance
5. IF asset loading fails, THEN THE Asset_System SHALL provide graceful degradation to CSS-based visuals

### Requirement 4

**User Story:** As a player, I want to see themed decorative elements using the available assets, so that the Halloween/Kiroween atmosphere is enhanced.

#### Acceptance Criteria

1. WHEN appropriate, THE UI_Components SHALL display pumpkin and candy assets as decorative elements
2. WHEN in terminal-focused areas, THE UI_Components SHALL use the terminal.png asset for enhanced theming
3. WHILE maintaining performance, THE UI_Components SHALL integrate themed assets with existing atmospheric effects
4. WHERE multiple themed assets are available, THE UI_Components SHALL use them contextually based on room or game state
5. IF themed assets enhance the experience, THEN THE UI_Components SHALL layer them appropriately with existing visual effects