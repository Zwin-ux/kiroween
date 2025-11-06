# Kiro Vibe Prompts Integration

This document describes the implementation of task 2.3: "Integrate Kiro vibe prompts for dialogue generation" from the interactive gameplay specification.

## Overview

The Kiro integration enhances the dialogue system with dynamic content generation, context-aware adaptation, and educational content delivery that scales with player progress. The implementation provides robust fallback mechanisms to ensure the game works even when Kiro MCP tools are not available.

## Key Components

### 1. KiroIntegration Service (`KiroIntegration.ts`)

The main service that interfaces with Kiro vibe prompts and MCP tools:

- **Dynamic Dialogue Generation**: Uses Kiro vibe prompts to generate contextual ghost dialogue
- **Educational Content Creation**: Leverages Kiro for adaptive educational explanations
- **Tone Adaptation**: Adjusts dialogue tone based on game state and player context
- **Fallback Support**: Provides pattern-based responses when Kiro is unavailable

Key features:
- Ghost personality patterns based on software smell types
- Atmospheric effects tied to system stability levels
- Room-specific context integration
- Educational content scaling by difficulty level

### 2. DialogueContextAdapter (`DialogueContextAdapter.ts`)

Advanced context-aware dialogue adaptation system:

- **Difficulty Scaling**: Automatically adjusts educational content complexity
- **Learning Style Detection**: Adapts content based on player interaction patterns
- **Atmospheric Intensity**: Modulates horror effects based on stability and preferences
- **Contextual Hints**: Generates relevant suggestions based on conversation state

Key features:
- Multi-factor difficulty calculation (insight, progress, engagement, experience)
- Technical language simplification for beginners
- Metaphor injection for better understanding
- Advanced concept delivery for experienced players

### 3. Enhanced DialogueEngine (`DialogueEngine.ts`)

The core dialogue engine now integrates with Kiro systems:

- **Context-Aware Responses**: Uses DialogueContextAdapter for comprehensive response generation
- **Dynamic Question Generation**: Creates questions based on player level and conversation state
- **Educational Integration**: Seamlessly delivers educational content through Kiro
- **Progressive Difficulty**: Adapts complexity as players demonstrate understanding

### 4. Enhanced DialogueSession (`DialogueSession.ts`)

Session management with context-aware capabilities:

- **Adaptive Difficulty Calculation**: Multi-factor assessment of player readiness
- **Contextual Hints**: Ghost-specific suggestions based on current state
- **Advanced Concept Readiness**: Determines when players are ready for complex topics
- **Progress Tracking**: Monitors educational engagement and conversation depth

## Integration Features

### Vibe Prompt Integration

The system loads dialogue generation prompts from `.kiro/vibe/dialogue-generation.md` and uses them to:

1. **Generate Ghost Personalities**: Each software smell has distinct personality traits
2. **Create Atmospheric Effects**: Stability-based environmental modifications
3. **Adapt Room Context**: Location-specific dialogue enhancements
4. **Scale Educational Content**: Difficulty-appropriate explanations

### Context-Aware Adaptation

The dialogue system adapts based on multiple factors:

- **Player Insight Level**: Low (0-25), Medium (26-75), High (76-100)
- **System Stability**: Affects atmospheric intensity and dialogue tone
- **Session Progress**: Influences available questions and content depth
- **Learning Style**: Visual, analytical, or practical approach detection
- **Previous Experience**: Adapts based on past ghost encounters

### Educational Content Delivery

Educational content scales automatically:

- **Beginner Level**: Simple explanations with metaphors and concrete examples
- **Intermediate Level**: Balanced technical content with practical applications
- **Advanced Level**: Deep technical concepts with architectural patterns

### Fallback Mechanisms

The system provides multiple fallback layers:

1. **Kiro MCP Available**: Full dynamic content generation
2. **Kiro Unavailable**: Pattern-based responses with vibe prompt data
3. **Complete Fallback**: Basic educational templates and static responses

## Usage Examples

### Basic Dialogue Generation

```typescript
import { kiroIntegration } from './KiroIntegration';

const response = await kiroIntegration.generateDialogue(
  ghost,
  dialogueContext,
  playerInput
);
```

### Context-Aware Adaptation

```typescript
import { dialogueContextAdapter } from './DialogueContextAdapter';

const adaptedResponse = await dialogueContextAdapter.adaptDialogueForContext({
  ghost,
  playerInput,
  session,
  adaptationLevel: 'extensive'
});
```

### Educational Content Scaling

```typescript
const scaledContent = dialogueContextAdapter.scaleEducationalDifficulty(
  baseContent,
  'beginner', // or 'intermediate', 'advanced'
  ghostType
);
```

## Configuration

The system uses configuration from:

- `.kiro/vibe/dialogue-generation.md`: Ghost personalities and atmospheric effects
- `.kiro/settings/mcp.json`: MCP tool configuration for Kiro integration
- Game state: Current meters, room context, and player progress

## Benefits

1. **Dynamic Content**: No more static dialogue - every conversation adapts to context
2. **Educational Effectiveness**: Content automatically scales to player understanding
3. **Atmospheric Immersion**: Horror effects respond to game state and player tolerance
4. **Robust Fallbacks**: Game works regardless of Kiro availability
5. **Progressive Learning**: Players naturally advance through difficulty levels
6. **Personalized Experience**: Adapts to individual learning styles and preferences

## Requirements Fulfilled

This implementation satisfies the following requirements from the specification:

- **Requirement 1.3**: Educational content delivery with appropriate difficulty scaling
- **Requirement 10.1**: Kiro vibe prompts for dynamic content generation
- **Context-aware dialogue adaptation**: Based on player progress and game state
- **Educational effectiveness**: Through adaptive difficulty and personalized content

The integration transforms the dialogue system from static responses to a dynamic, educational, and contextually aware conversation engine that enhances both learning outcomes and player engagement.