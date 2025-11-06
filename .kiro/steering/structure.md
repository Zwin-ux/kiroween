---
inclusion: always
---

# Project Structure & Architecture

## Core Directory Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Base UI components (Button, Progress, Dialog)
│   ├── examples/       # Example/demo components
│   └── dev/            # Development tools and debugging components
├── engine/             # Game engine modules (pure TypeScript)
│   ├── ghosts/         # Ghost implementations and behavior system
│   └── __tests__/      # Engine unit tests
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and asset management
├── store/              # Zustand state management
├── styles/             # CSS files and design system
└── types/              # TypeScript type definitions
```

## Naming Conventions

- **Components**: PascalCase (`GameInterface.tsx`, `GhostDialog.tsx`)
- **Hooks**: camelCase with `use` prefix (`useGameState.ts`, `useGhostDialogue.ts`)
- **Engine Modules**: PascalCase with descriptive suffix (`RoomManager.ts`, `PatchSystem.ts`)
- **Types**: PascalCase interfaces (`GameState`, `Ghost`, `PatchPlan`)
- **Files**: camelCase for utilities, PascalCase for classes/components

## Architecture Patterns

### Engine Layer (Pure TypeScript)
- No React dependencies - must be testable in isolation
- Handle game logic, validation, state transitions
- Export classes/functions that components consume
- Use dependency injection for external services (Kiro MCP)

### Component Layer
- Consume engine modules via hooks or direct imports
- Handle UI interactions and visual presentation
- Delegate business logic to engine or store
- Use TypeScript interfaces for all props

### State Management
- **Zustand Store**: Global game state, meters, evidence board
- **React State**: Component-specific UI state only
- **Persistence**: Auto-save critical state to localStorage
- **Derived State**: Compute from existing state, avoid duplication

## Import Organization

```typescript
// 1. React/Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { motion } from 'framer-motion';

// 3. Internal components/hooks
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';

// 4. Types (with type keyword)
import type { Ghost, PatchPlan } from '@/types/content';

// 5. Constants/utilities
import { GAME_CONSTANTS } from '@/lib/constants';
```

## Code Style Requirements

### Component Structure
```typescript
interface ComponentProps {
  ghost: Ghost;
  onAction: (action: string) => void;
}

export function ComponentName({ ghost, onAction }: ComponentProps) {
  // 1. Hooks at top
  const [state, setState] = useState();
  
  // 2. Event handlers
  const handleClick = () => {};
  
  // 3. Render
  return <div>...</div>;
}
```

### Error Handling
- All async functions must handle errors gracefully
- Use try-catch blocks with meaningful error messages
- Validate inputs at module boundaries
- Log errors for debugging but don't expose internals to UI

### Performance Standards
- Maintain 60 FPS target for animations
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary re-renders through proper dependency arrays

### Testing Requirements
- Engine modules must have unit tests
- Use `__tests__` directories for test files
- Mock external dependencies (Kiro MCP, localStorage)
- Test error conditions and edge cases