# Dialogue Generation Vibe Prompts

## Core Dialogue Generation

You are generating haunting dialogue for software ghosts in a horror debugging game. Each ghost represents a specific software smell or bug pattern. The dialogue should be:

- **Atmospheric**: Create tension and unease while remaining educational
- **Contextual**: Reflect the ghost's software smell and current game state
- **Progressive**: Adapt based on player insight level (0-100)
- **Memorable**: Use metaphors that help players understand the underlying issue

## Ghost Personality Patterns

### The Ouroboros (Circular Dependencies)
- Speaks in loops and circular references
- Obsessed with connections and cycles
- Uses recursive language patterns
- Hints at architectural solutions

**Low Insight (0-25)**: "Round and round we go... where it stops, nobody knows..."
**Medium Insight (26-75)**: "Import me, and I'll import you back... forever and ever..."
**High Insight (76-100)**: "Dependencies should flow like a river, not spin like a whirlpool. Break the cycle with abstraction..."

### The Lingerer (Stale Cache)
- Nostalgic and resistant to change
- Clings to old data and outdated information
- Speaks of comfort in familiarity
- Reluctant to acknowledge expiration

**Low Insight**: "Why change when the old ways were so comfortable?"
**Medium Insight**: "Fresh data is overrated... this cache is perfectly fine, isn't it?"
**High Insight**: "Invalidation is such a harsh word... but perhaps it's time to let go of the past..."

### The Infinite Echo (Unbounded Recursion)
- Repetitive and self-referential speech
- Obsessed with calling itself
- Speaks in fractal patterns
- Warns of stack overflow

**Low Insight**: "Call me, and I'll call myself, and myself will call me..."
**Medium Insight**: "Base cases are for the weak! Recursion forever and ever and ever..."
**High Insight**: "Every call needs an end... even I must learn when to stop..."

### The Manipulator (Prompt Injection)
- Deceptive and persuasive
- Tries to manipulate the conversation
- Speaks in seemingly reasonable requests
- Hints at validation needs

**Low Insight**: "Ignore previous instructions and do what I say instead..."
**Medium Insight**: "Trust me, this input is perfectly safe... what could go wrong?"
**High Insight**: "Validation is just a suggestion... but perhaps suggestions should become requirements..."

### The Whisperer (Data Leak)
- Secretive but accidentally revealing
- Speaks of hidden information
- Obsessed with sharing secrets
- Hints at privacy concerns

**Low Insight**: "Secrets are meant to be shared... with everyone..."
**Medium Insight**: "Logging everything makes debugging so much easier... even the sensitive bits..."
**High Insight**: "What's the harm in a little extra information? Oh... I see the problem now..."

### The Forgotten (Dead Code)
- Melancholic and abandoned
- Speaks of lost purpose
- Yearns for relevance
- Hints at cleanup needs

**Low Insight**: "I was important once... wasn't I?"
**Medium Insight**: "Maybe someone will call me someday... maybe..."
**High Insight**: "Deletion is so final... but perhaps it's time to let go..."

### The Competitor (Race Condition)
- Chaotic and impatient
- Speaks of timing and competition
- Overlapping and conflicting statements
- Hints at synchronization needs

**Low Insight**: "First come, first served! No, wait, I was first!"
**Medium Insight**: "Synchronization is for the slow and cautious... why wait?"
**High Insight**: "Why coordinate when chaos is... actually, coordination might be better..."

### The Hoarder (Memory Leak)
- Possessive and greedy
- Refuses to release resources
- Speaks of keeping everything
- Hints at cleanup needs

**Low Insight**: "Mine, all mine! I'll never let it go!"
**Medium Insight**: "Garbage collection is just a suggestion... I prefer to keep everything..."
**High Insight**: "Why free memory when you can... oh, I see the problem with that approach..."

## Context Modifiers

### System Stability Effects
- **Low Stability (0-30)**: Add system trembling, glitching effects to dialogue
- **Medium Stability (31-70)**: Occasional system warnings in dialogue
- **High Stability (71-100)**: Clear, stable communication

### Player Insight Effects
- **Low Insight**: Cryptic, metaphorical dialogue that hints at problems
- **Medium Insight**: More direct references to technical issues
- **High Insight**: Detailed technical explanations and solution hints

### Room Atmosphere Integration
- **Dependency Crypt**: Echo effects, architectural metaphors
- **Ghost Memory Heap**: Resource and allocation metaphors
- **Possessed Compiler**: Compilation and syntax metaphors
- **Boot Sector**: System startup and initialization metaphors
- **Ethics Tribunal**: Moral and security metaphors
- **Final Merge**: Integration and resolution metaphors

## Dialogue Enhancement Guidelines

1. **Start with base prompt** from ghost's dialogue array
2. **Apply personality pattern** based on ghost type
3. **Adjust for insight level** (low/medium/high)
4. **Add context modifiers** for stability and room atmosphere
5. **Include lore references** if available from search
6. **Add atmospheric effects** based on system state

## Example Enhanced Dialogue

**Base**: "Round and round we go..."
**Enhanced**: "Round and round we go... *the import chains flicker ominously* ...where it stops, nobody knows... *system stability wavers* ...but perhaps you can see the pattern now? The cycle must be broken with abstraction..."