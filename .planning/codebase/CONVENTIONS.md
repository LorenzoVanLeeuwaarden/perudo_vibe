# Coding Conventions

**Analysis Date:** 2025-01-17

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `Dice.tsx`, `BidUI.tsx`, `PlayerRevealCard.tsx`)
- Utility/logic modules: camelCase with `.ts` extension (e.g., `gameLogic.ts`, `types.ts`)
- Page components: lowercase (Next.js App Router convention) - `page.tsx`, `layout.tsx`
- CSS: lowercase (e.g., `globals.css`)

**Functions:**
- React components: PascalCase function declarations (`export function Dice()`, `export function BidUI()`)
- Helper/utility functions: camelCase (`isValidBid`, `countMatching`, `generateAIBid`, `rollDice`)
- Event handlers: `handle` prefix with camelCase (`handleRoll`, `handleBid`, `handleDudo`, `handleReveal`)
- Boolean getters: `is`/`should`/`can` prefix (`isValidBid`, `shouldAICallDudo`, `isDieRevealed`, `canCalza`)
- Callback props: `on` prefix (`onBid`, `onRoll`, `onComplete`, `onPlayAgain`)

**Variables:**
- State variables: camelCase (`gameState`, `playerHand`, `currentBid`, `isRolling`)
- Constants: SCREAMING_SNAKE_CASE for static data (`PLAYER_COLORS`, `AI_NAMES`, `FIREWORK_COLORS`, `GAME_NAME`)
- Refs: camelCase with `Ref` suffix (`opponentsRef`, `currentBidRef`, `canvasRef`, `animationRef`)

**Types:**
- Interfaces: PascalCase with descriptive names (`DiceProps`, `BidUIProps`, `VictoryScreenProps`, `Opponent`)
- Type aliases: PascalCase (`GameState`, `PlayerColor`, `Bid`, `DicePhase`)
- Union types: PascalCase (`GameState = 'Lobby' | 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat'`)

## Code Style

**Formatting:**
- No explicit Prettier/ESLint config files beyond Next.js defaults
- 2-space indentation
- Single quotes for strings
- Semicolons at end of statements
- Max line length approximately 120 characters

**Linting:**
- ESLint via `eslint-config-next` (v15.1.4)
- Run with: `npm run lint`
- TypeScript strict mode enabled in `tsconfig.json`

## Import Organization

**Order:**
1. React imports (`'use client'` directive first, then `import { useState, useCallback, useRef, useEffect } from 'react'`)
2. Third-party libraries (`import { motion, AnimatePresence } from 'framer-motion'`, `import { Play, RotateCcw, Trophy } from 'lucide-react'`)
3. Internal types/lib (`import { GameState, Bid, PlayerColor, PLAYER_COLORS } from '@/lib/types'`)
4. Internal components (`import { Dice } from '@/components/Dice'`, `import { BidUI } from '@/components/BidUI'`)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` prefix for internal imports (e.g., `@/lib/types`, `@/components/Dice`)

## Error Handling

**Patterns:**
- Validation functions return objects with `valid` boolean and optional `reason` string:
  ```typescript
  function isValidBid(...): { valid: boolean; reason?: string } {
    if (condition) {
      return { valid: false, reason: 'Explanation message' };
    }
    return { valid: true };
  }
  ```
- Early returns for guard clauses:
  ```typescript
  if (!canvas) return;
  if (!ctx) return;
  if (!bid) return;
  ```
- No try-catch blocks observed (game logic doesn't involve external I/O)
- Null checks with optional chaining: `opponent?.hand`, `opp?.diceCount ?? 0`

## Logging

**Framework:** Browser console (no logging framework)

**Patterns:**
- Debug logging removed/commented out in production code
- No logging statements in current source files

## Comments

**When to Comment:**
- JSDoc-style comments for exported functions explaining game rules:
  ```typescript
  /**
   * Validates a bid according to Perudo rules:
   * 1. Normal bid: increase count OR increase value
   * 2. You can ONLY decrease value when switching TO aces
   * ...
   */
  export function isValidBid(...) { }
  ```
- Inline comments for complex game logic or CSS transformations:
  ```typescript
  // Note: rotateX positive tilts top toward viewer (shows bottom face)
  const faceRotations: Record<number, { rotateX: number; rotateY: number }> = {
  ```

**JSDoc/TSDoc:**
- Used sparingly for complex game rule functions in `src/lib/gameLogic.ts`
- Not used for component props (TypeScript interfaces suffice)

## Function Design

**Size:**
- Most utility functions are 10-50 lines
- Main page component (`PerudoGame`) is large (~1800 lines) with many callbacks and state
- Complex functions broken into smaller helpers when reused

**Parameters:**
- Destructured objects for component props:
  ```typescript
  export function Dice({
    value,
    index = 0,
    isRevealing = false,
    size = 'md',
    color = 'orange',
  }: DiceProps) { }
  ```
- Default parameter values used extensively

**Return Values:**
- Components return JSX
- Validation functions return `{ valid: boolean; reason?: string }`
- AI decision functions return `boolean` or `Bid | null`
- Utility functions return simple values (`number[]`, `number`, `boolean`)

## Module Design

**Exports:**
- Named exports preferred: `export function Dice()`, `export function isValidBid()`
- Default exports also provided for components: `export default Dice;`
- Types/interfaces exported with `export type` or `export interface`

**Barrel Files:**
- Single barrel file at `src/components/index.ts`:
  ```typescript
  export { Dice } from './Dice';
  export { DiceCup } from './DiceCup';
  export { BidUI } from './BidUI';
  export { PlayerDiceBadge } from './PlayerDiceBadge';
  export { PlayerRevealCard } from './PlayerRevealCard';
  ```

## React Patterns

**Client Components:**
- All components use `'use client'` directive (animation-heavy, interactive game)

**State Management:**
- useState for local component state
- useRef for mutable values that shouldn't trigger re-renders
- useCallback for memoized event handlers
- useEffect for side effects and animations
- Refs kept in sync with state via useEffect for avoiding stale closures in callbacks

**Component Props Interface:**
- Always define interface above component:
  ```typescript
  interface DiceProps {
    value: number;
    index?: number;
    size?: 'sm' | 'md' | 'lg';
    color?: PlayerColor;
  }

  export function Dice({ value, index = 0, size = 'md', color = 'orange' }: DiceProps) {
  ```

## Styling Patterns

**CSS-in-JS with Tailwind:**
- Tailwind CSS v4 for utility classes
- CSS custom properties in `globals.css` for design tokens
- Inline `style` prop for dynamic/computed styles:
  ```typescript
  style={{
    background: colorConfig.bgGradient,
    border: `2px solid ${colorConfig.border}`,
    boxShadow: `0 4px 0 0 ${colorConfig.shadow}`,
  }}
  ```

**Framer Motion:**
- `motion.div`, `motion.button` for animated elements
- `AnimatePresence` for enter/exit animations
- Animation variants defined inline:
  ```typescript
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
  >
  ```

**CSS Custom Properties:**
- Design tokens defined in `:root` in `src/app/globals.css`
- Día de los Muertos theme colors: `--purple-deep`, `--turquoise`, `--marigold`, `--magenta-bright`
- Accessed via Tailwind theme or direct CSS variable usage

---

*Convention analysis: 2025-01-17*
