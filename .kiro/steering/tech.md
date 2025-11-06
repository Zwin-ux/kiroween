---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Framework Stack
- **Next.js 16.0.1** with App Router - React framework for SSR/SSG
- **React 19.2.0** with React Compiler - UI library with automatic optimizations
- **TypeScript 5** - Strict type safety required for all code
- **Tailwind CSS 4** - Utility-first styling with custom horror theme
- **Zustand 5.0.8** - State management with localStorage persistence
- **Framer Motion 12.23.24** - 60 FPS animations and transitions

## Essential Libraries
- **Radix UI** - Accessible primitives (Dialog, Progress, Tooltip, Slot)
- **class-variance-authority** - Type-safe component variants
- **clsx + tailwind-merge** - Conditional CSS class utilities

## Architecture Requirements

### Engine Layer (Pure TypeScript)
- No React dependencies - must be unit testable in isolation
- Handle all game logic, validation, state transitions
- Use dependency injection for external services (Kiro MCP)
- Export classes/functions that components consume via hooks

### Component Layer
- Consume engine modules only through custom hooks
- Handle UI interactions and visual presentation only
- Delegate all business logic to engine or store
- Use TypeScript interfaces for all props

### State Management Pattern
- **Zustand Store**: Global game state, meters, evidence board
- **React State**: Component-specific UI state only
- **Persistence**: Auto-save critical state to localStorage
- **Derived State**: Compute from existing state, avoid duplication

## Code Style Requirements

### Import Organization (Strict Order)
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

### Naming Conventions
- **Components**: PascalCase (`GameInterface.tsx`, `GhostDialog.tsx`)
- **Hooks**: camelCase with `use` prefix (`useGameState.ts`)
- **Engine Modules**: PascalCase (`RoomManager.ts`, `PatchSystem.ts`)
- **Types**: PascalCase interfaces (`GameState`, `Ghost`)
- **Files**: camelCase for utilities, PascalCase for classes

### Error Handling (Required)
- All async functions must use try-catch with meaningful messages
- Validate inputs at module boundaries
- Log errors for debugging but never expose internals to UI
- Graceful degradation for non-critical failures

### Performance Standards
- Maintain 60 FPS target for all animations
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary re-renders through correct dependency arrays

## Development Commands
```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run test         # Run Jest tests
npm run lint         # ESLint validation
```

## Critical Rules
- Use TypeScript interfaces over types for extensibility
- Prefer named exports over default exports
- All engine modules must have unit tests in `__tests__/` directories
- Components must handle loading and error states gracefully
- Never bypass TypeScript strict mode or use `any` type