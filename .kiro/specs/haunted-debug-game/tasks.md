# Implementation Plan

- [x] 1. Set up project structure and core interfaces








  - Create Next.js 15 project with TypeScript configuration
  - Set up Tailwind CSS and Radix UI component library
  - Install and configure Zustand for state management
  - Install Framer Motion for animations and WebAudio setup
  - Create core TypeScript interfaces for GameState, Room, Ghost, and Patch systems
  - _Requirements: 5.1, 5.2, 6.4_

- [x] 2. Implement Kiro orchestration foundation





  - Create .kiro directory structure with specs/, hooks/, steering/, vibe/, and mcp/ folders
  - Write initial game.yaml spec defining rooms, meters, and basic transitions
  - Write ghosts.yaml spec cataloging the 8 software smell types with metadata
  - Create rooms.yaml spec defining the six-area room graph structure
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 3.1_

- [x] 3. Build core game engine components




  - [x] 3.1 Implement Room Manager with navigation logic


    - Code RoomManager class with currentRoom state and transition methods
    - Implement checkTransitionConditions function using meter thresholds
    - Create executeRoomEntry method that triggers Kiro hooks
    - _Requirements: 3.1, 3.2, 3.4, 5.2_



  - [x] 3.2 Implement Ghost Manager with dialogue generation






    - Code GhostManager class with ghost-to-room mapping
    - Implement generateDialogue method using Kiro vibe prompts
    - Create createPatchPlan method that generates fix suggestions


    - _Requirements: 1.2, 7.3, 7.4, 5.4_

  - [x] 3.3 Implement Patch System with validation





    - Code PatchSystem class with plan generation and application


    - Implement validatePatch method with security checks
    - Create applyPatch method that triggers compile events
    - _Requirements: 1.3, 1.4, 8.2, 8.4_

  - [x] 3.4 Implement Meter System with game over conditions





    - Code MeterSystem class managing Stability and Insight values
    - Implement applyEffects method with bounds checking
    - Create checkGameOverConditions method for win/lose states
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [-] 4. Create sandbox execution environment



  - [x] 4.1 Implement secure code execution sandbox


    - Set up vm2 or WASM-based isolation environment
    - Create game-DSL parser for safe patch operations
    - Implement code validation and linting pipeline
    - _Requirements: 8.1, 8.2, 8.3, 8.4_


  - [ ] 4.2 Implement compile event system
    - Code CompileEvent processor with deterministic and stochastic effects
    - Create effect calculation logic based on patch risk and type
    - Implement event chaining for complex consequences
    - _Requirements: 1.5, 2.3, 10.4_

- [ ] 5. Build MCP tool integrations
  - [ ] 5.1 Implement diff.apply MCP tool
    - Create diff application logic with rollback capability
    - Implement patch preview and validation
    - Add error handling for malformed diffs
    - _Requirements: 5.5, 8.1_

  - [ ] 5.2 Implement sfx.queue MCP tool
    - Create audio effect queuing system with WebAudio
    - Implement risk-based sound triggering
    - Add volume controls and accessibility options
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ] 5.3 Implement lint.run MCP tool
    - Create code linting integration for patch validation
    - Implement rule-based validation for game-DSL
    - Add helpful error messages with ghost commentary
    - _Requirements: 8.2, 8.4_

  - [ ]* 5.4 Implement shader.gen and lore.kb.search MCP tools
    - Create shader generation for visual effects
    - Implement lore knowledge base search functionality
    - _Requirements: 6.5, 4.4_

- [ ] 6. Create game UI components
  - [ ] 6.1 Build room navigation interface
    - Create room display component with haunted module indicators
    - Implement room transition UI with progress tracking
    - Add visual feedback for locked/unlocked areas
    - _Requirements: 3.1, 3.3, 3.5, 6.1_

  - [ ] 6.2 Build ghost interaction interface
    - Create conversation UI with dialogue display
    - Implement patch planning interface with diff preview
    - Add Apply/Refactor/Question action buttons
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 6.3 Build meter display and evidence board
    - Create Stability and Insight meter visualizations
    - Implement Evidence Board timeline component
    - Add exportable post-mortem report functionality
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3_

  - [ ] 6.4 Implement horror IDE aesthetic
    - Create cursed IDE theme with clay token accents
    - Implement CRT scanline overlays and glitch effects
    - Add 60 FPS animations with performance monitoring
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 7. Implement Kiro hooks system
  - [ ] 7.1 Create onRoomEnter hook
    - Implement ambient effect triggering on room entry
    - Add room-specific setup and ghost activation
    - Create atmospheric sound and visual cues
    - _Requirements: 3.4, 5.2, 9.1_

  - [ ] 7.2 Create onPatchPlan hook
    - Implement risk scoring for patch plans
    - Add soundtrack cue triggering based on risk level
    - Create ghost response enhancement logic
    - _Requirements: 1.3, 9.1, 9.2_

  - [ ] 7.3 Create onCompile and onMeterChange hooks
    - Implement compile event processing and effect application
    - Add meter change notifications and visual feedback
    - Create cascading effect logic for complex interactions
    - _Requirements: 1.5, 2.3, 5.2_

- [ ] 8. Add persistence and state management
  - [ ] 8.1 Implement game state persistence
    - Create local storage integration for game saves
    - Implement Supabase integration for run tracking
    - Add state recovery and corruption handling
    - _Requirements: 4.1, 4.4_

  - [ ] 8.2 Create replay and export functionality
    - Implement evidence board export as post-mortem report
    - Add game replay functionality with decision timeline
    - Create shareable run summaries
    - _Requirements: 4.3, 10.2_

- [ ] 9. Implement accessibility and performance features
  - [ ] 9.1 Add accessibility compliance
    - Implement 4.5:1 contrast ratio validation
    - Add keyboard navigation support for all interactions
    - Create subtitle toggles and reduced-motion modes
    - _Requirements: 6.3, 6.4, 9.4, 9.5_

  - [ ] 9.2 Optimize performance for 60 FPS target
    - Implement animation frame budgets and performance monitoring
    - Add asset preloading and caching strategies
    - Create mobile-responsive design with touch support
    - _Requirements: 6.1, 6.4_

- [ ] 10. Create content and populate ghost catalog
  - [ ] 10.1 Implement the 8 core ghost types
    - Create CircularDependency ghost with dependency cycle detection
    - Implement StaleCache ghost with cache invalidation scenarios
    - Add UnboundedRecursion ghost with stack overflow simulation
    - Create PromptInjection ghost with input validation challenges
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.2 Add remaining ghost types and room content
    - Implement DataLeak, DeadCode, RaceCondition, and MemoryLeak ghosts
    - Create room-specific entry texts and atmospheric descriptions
    - Add lore entries and narrative content for each area
    - _Requirements: 7.1, 7.5, 3.5_

- [ ] 11. Integration and deployment setup
  - [ ] 11.1 Set up deployment pipeline
    - Configure Vercel deployment with edge functions
    - Set up environment variables and build optimization
    - Create production database configuration
    - _Requirements: 10.2, 10.3_

  - [ ] 11.2 Final integration and testing
    - Integrate all components and test end-to-end gameplay flow
    - Validate Kiro orchestration across all surfaces
    - Test security sandbox and performance under load
    - _Requirements: 1.1-1.5, 5.1-5.5, 8.1-8.5_

  - [ ]* 11.3 Create comprehensive test suite
    - Write unit tests for core game logic and ghost behaviors
    - Add integration tests for Kiro hook execution and MCP tools
    - Create accessibility and performance regression tests
    - _Requirements: All requirements validation_