---
inclusion: always
---

# Product Guidelines

## Core Game Mechanics

### Meter System
- **Stability**: 0-100 scale tracking code health and system integrity
- **Insight**: 0-100 scale tracking player understanding and debugging progress
- Both meters affect ghost behavior, room accessibility, and ending outcomes
- Meter changes must be meaningful and tied to player decisions

### Player Choice Framework
- **Apply**: Direct implementation of suggested patches
- **Refactor**: Alternative approach requiring deeper code changes
- **Question**: Seek clarification or challenge the ghost's assumptions
- Each choice type has distinct consequences for meters and story progression

### Ghost Encounter Pattern
- Ghosts represent specific software smells with educational value
- Each ghost has unique dialogue patterns and patch generation logic
- Encounters must balance horror atmosphere with learning objectives
- Ghost behavior adapts based on player's current meter levels

## Educational Design Principles

### Learning Integration
- Software smells and debugging concepts are core to gameplay, not superficial
- Player decisions demonstrate understanding of trade-offs and consequences
- Evidence board provides reflection on debugging journey and decision patterns
- Post-mortem analysis reinforces learning outcomes

### Accessibility Requirements
- Support for screen readers and keyboard navigation
- Adjustable text size and contrast options
- Audio cues complement visual horror elements
- Cognitive load management through clear UI patterns

## Technical Constraints

### Performance Standards
- Maintain 60 FPS for all animations and transitions
- Asset loading must not block core gameplay interactions
- State persistence ensures no progress loss on browser refresh
- Memory usage optimization for extended play sessions

### Integration Requirements
- Kiro MCP tools provide patch generation and validation
- Dialogue system supports dynamic content generation
- Room progression system enforces logical flow through codebase areas
- Security validation prevents execution of malicious code suggestions

## Content Guidelines

### Horror Atmosphere
- Maintain spooky ambiance without excessive gore or jump scares
- Use industrial/terminal aesthetics with subtle horror elements
- Audio design supports immersion without overwhelming educational content
- Visual effects enhance mood while preserving readability

### Code Authenticity
- All patches and code examples must be syntactically valid
- Software smells represented accurately reflect real-world issues
- Debugging scenarios based on common development challenges
- Technical terminology used correctly and consistently