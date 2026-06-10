# AGENTS.md

## Project

KiroWeen is a short browser game where each room is a different type of software bug. Fix the bug, unlock the next room. The ghosts are your code smells.

Built as a Halloween project. Probably still has bugs. That's the point.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind
- Zustand (state management)
- Framer Motion (animations)

## Game Structure

Rooms are in `haunted-debug-game/`:
- **Compiler Room** — syntax errors and type mismatches
- **Stack Trace Tower** — reading and following stack traces
- **Memory Leak Cellar** — resource management

Each room presents a bug, the player fixes it, and the next room unlocks.

## Design Direction

Spooky but readable. Dark backgrounds, subtle glow effects, terminal-adjacent aesthetic. The game should feel like exploring an old house, not like a corporate training module.

Keep animations tight — no long transitions, no unskippable intros.

## What Not To Do

- Don't turn it into an educational platform. It's a short game.
- Don't add auth, leaderboards, or multiplayer.
- Don't over-engineer the puzzle system — each room is hand-crafted.

## Development

```bash
cd haunted-debug-game
npm install
npm run dev
```

## Definition of Done

- Game runs locally with `npm run dev`
- Each room is completable (fix the bug, proceed)
- Animations are smooth
- Mobile layout is usable
