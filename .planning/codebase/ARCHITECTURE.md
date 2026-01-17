# Architecture

**Analysis Date:** 2026-01-17

## Pattern Overview

**Overall:** Single-Page Application (SPA) with Component-Based Architecture

**Key Characteristics:**
- Next.js 16 App Router with single-page game
- Client-side state management via React hooks (useState, useCallback, useEffect, useRef)
- Colocation of game logic and UI in the main page component
- Presentational components for UI elements with business logic centralized in `page.tsx`

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle animations, visual effects
- Location: `src/components/`
- Contains: React components (Dice, BidUI, VictoryScreen, etc.)
- Depends on: Types from `src/lib/types.ts`, framer-motion for animations
- Used by: `src/app/page.tsx`

**Game State Layer:**
- Purpose: Manage all game state, turn logic, AI decisions
- Location: `src/app/page.tsx`
- Contains: All useState hooks, game flow handlers, AI turn processing
- Depends on: Game logic functions from `src/lib/gameLogic.ts`
- Used by: All components receive state as props

**Business Logic Layer:**
- Purpose: Core game rules, bid validation, AI decision-making, dice rolling
- Location: `src/lib/gameLogic.ts`
- Contains: `isValidBid()`, `countMatching()`, `shouldAICallDudo()`, `shouldAICallCalza()`, `generateAIBid()`, `rollDice()`
- Depends on: Types from `src/lib/types.ts`
- Used by: `src/app/page.tsx`, `src/components/BidUI.tsx`

**Type Definitions Layer:**
- Purpose: TypeScript interfaces, type aliases, color configurations
- Location: `src/lib/types.ts`
- Contains: `GameState`, `Bid`, `Player`, `PlayerColor`, `PLAYER_COLORS` constant
- Depends on: Nothing
- Used by: All components and game logic

## Data Flow

**Game State Flow:**

1. User action triggers handler in `page.tsx` (e.g., `handleBid()`, `handleDudo()`)
2. Handler calls game logic functions from `gameLogic.ts` for validation/calculation
3. Handler updates state via `setState` calls
4. State changes propagate to child components via props
5. Components re-render with new props

**AI Turn Flow:**

1. Player makes bid, triggering `handleBid()` in `page.tsx`
2. `runAITurns()` schedules sequential AI processing with `setTimeout`
3. For each AI: `processOneAITurn()` calls `shouldAICallDudo()`, `shouldAICallCalza()`, or `generateAIBid()` from `gameLogic.ts`
4. AI action updates state (new bid or triggers reveal)
5. Turn passes to next player or returns to human

**State Management:**
- All game state lives in `page.tsx` as local React state (40+ useState hooks)
- Refs (`useRef`) used to avoid stale closures in async callbacks (e.g., `opponentsRef`, `currentBidRef`)
- No external state management library (Redux, Zustand, etc.)

## Key Abstractions

**GameState (Finite State Machine):**
- Purpose: Controls which UI mode is displayed and which actions are valid
- Examples: `'Lobby' | 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat'`
- Pattern: String literal union type, conditionally renders components based on state

**PlayerColor:**
- Purpose: Theming system for dice and UI elements per player
- Examples: `'blue' | 'green' | 'orange' | 'yellow' | 'black' | 'red'`
- Pattern: Color key maps to `PLAYER_COLORS` object containing CSS values for gradients, borders, shadows, glows

**Bid:**
- Purpose: Represents a player's claim about dice on the table
- Examples: `{ count: 5, value: 3 }` means "five threes"
- Pattern: Simple object with count and value, validated by `isValidBid()`

**Opponent:**
- Purpose: Represents AI player state during game
- Examples: `{ id: 0, name: 'El Bloffo', hand: [1,3,5,2,4], diceCount: 5, color: 'red', isEliminated: false }`
- Pattern: Local interface in `page.tsx`, array of opponents managed in state

## Entry Points

**Application Entry:**
- Location: `src/app/page.tsx`
- Triggers: User navigating to root URL
- Responsibilities: Renders entire game UI, manages all state, orchestrates game flow

**Layout Entry:**
- Location: `src/app/layout.tsx`
- Triggers: All page renders
- Responsibilities: Sets HTML metadata, global styles, CRT overlay effects

**Styling Entry:**
- Location: `src/app/globals.css`
- Triggers: Loaded by layout
- Responsibilities: CSS variables, Tailwind setup, custom animations, retro effects

## Error Handling

**Strategy:** Graceful degradation with validation at action boundaries

**Patterns:**
- Bid validation returns `{ valid: boolean; reason?: string }` for UI feedback
- Conditional rendering prevents invalid actions (e.g., Dudo button only shows when there's a current bid)
- No try-catch blocks or error boundaries detected - assumes valid state transitions
- AI falls back to Dudo call if no valid bid can be generated

## Cross-Cutting Concerns

**Logging:** None (no console.log in production code, commented debug logs exist)

**Validation:** Handled by `isValidBid()` function, enforces Perudo rules for bid progression

**Authentication:** Not applicable (single-player local game)

**Animation:** Framer Motion library provides declarative animations throughout components

**Theming:** CSS custom properties in `globals.css` define color palette (Dia de los Muertos inspired), `PLAYER_COLORS` object provides per-player theming

---

*Architecture analysis: 2026-01-17*
