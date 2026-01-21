# Phase 20: Core Gauntlet Loop & Transitions - Research

**Researched:** 2026-01-21
**Domain:** Sequential game flow with cinematic transitions (React + Next.js)
**Confidence:** HIGH

## Summary

Phase 20 implements a sequential 1v1 gauntlet mode where players face escalating AI opponents with persistent dice counts and cinematic transitions between duels. The research domain covers multi-screen game flow management, cinematic UI transitions, persistent state across game rounds, and AI difficulty scaling.

The standard approach uses Zustand for lightweight game state management, Framer Motion's AnimatePresence for screen transitions, and a state machine pattern to orchestrate the sequential flow. The existing codebase already uses these libraries (Zustand 5.0.10, Framer Motion 11.15.0) with established patterns for AI personalities, victory/defeat screens, and game state management.

**Primary recommendation:** Build on existing single-player infrastructure with a dedicated Zustand store for gauntlet state (current round, streak, opponent queue) and use AnimatePresence with mode="wait" for sequential screen transitions. Leverage existing AI personality system (Turtle, Calculator, Shark) with round-based selection logic.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.0.10 | Game state management | <1KB, 30%+ YoY growth, handles React concurrency without zombie child problems. Already used in codebase. |
| Framer Motion | 11.15.0 | Screen transitions & animations | Production-ready motion library, 30.6k GitHub stars, 8.1M weekly NPM downloads. Industry standard for React animations. Already used in codebase. |
| React 19 | 19.0.0 | UI framework | Latest stable, already in use. Concurrent rendering features support smooth transitions. |
| Next.js 16 | 16.1.2 | App framework | Already in use, handles routing if needed for mode entry. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-sound | 5.0.0 | Sound effects | Already in use. Trigger sounds for victory/defeat/transitions. |
| TypeScript | 5.x | Type safety | Already in use. Critical for game state flow correctness. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | XState | XState provides explicit state machines but adds 12KB+ and complexity overhead. Zustand is sufficient for sequential flow with less boilerplate. |
| Framer Motion | React Spring | React Spring uses physics-based animations but Framer Motion's declarative API and AnimatePresence are better suited for mount/unmount transitions. |

**Installation:**
Already installed in project. No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   ├── gauntletStore.ts       # Gauntlet-specific state (round, streak, opponent queue)
│   └── gameStore.ts            # Existing game state (already present)
├── components/
│   ├── gauntlet/
│   │   ├── GauntletModeScreen.tsx      # Main container managing screen flow
│   │   ├── RulesScreen.tsx             # Rules reminder with "Enter" CTA
│   │   ├── FightCard.tsx               # Opponent introduction card
│   │   ├── VictorySplash.tsx           # Post-duel victory screen
│   │   ├── GameOverScreen.tsx          # Final game over with retry
│   │   └── StreakCounter.tsx           # Persistent counter overlay
│   ├── VictoryScreen.tsx       # Existing (can be reused/adapted)
│   └── DefeatScreen.tsx        # Existing (can be reused/adapted)
└── lib/
    └── ai/
        └── personalities.ts    # Existing AI system (Turtle, Calculator, Shark)
```

### Pattern 1: Sequential Screen Flow with AnimatePresence
**What:** Use AnimatePresence with mode="wait" to orchestrate sequential screen transitions where each screen animates out before the next animates in.

**When to use:** For gauntlet flow where only one screen should be visible at a time: RulesScreen → FightCard → GamePlay → VictorySplash → FightCard → ...

**Example:**
```typescript
// Source: https://motion.dev/docs/react-animate-presence
import { AnimatePresence, motion } from 'framer-motion';

type ScreenState = 'rules' | 'fightCard' | 'gameplay' | 'victory' | 'gameOver';

function GauntletFlow() {
  const [screen, setScreen] = useState<ScreenState>('rules');

  return (
    <AnimatePresence mode="wait">
      {screen === 'rules' && (
        <motion.div
          key="rules"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <RulesScreen onStart={() => setScreen('fightCard')} />
        </motion.div>
      )}
      {screen === 'fightCard' && (
        <motion.div
          key="fightCard"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          <FightCard onDismiss={() => setScreen('gameplay')} />
        </motion.div>
      )}
      {/* Additional screens... */}
    </AnimatePresence>
  );
}
```

**Key insight:** mode="wait" ensures entering elements wait until exiting elements complete their animation, creating clean sequential transitions perfect for one-at-a-time presentation.

### Pattern 2: Zustand Store for Gauntlet State
**What:** Create a dedicated Zustand store for gauntlet-specific state that persists across duel rounds but resets on game over.

**When to use:** For managing state that spans multiple duels: player dice count, current streak, opponent queue, round number.

**Example:**
```typescript
// Source: https://github.com/pmndrs/zustand + existing codebase pattern
import { create } from 'zustand';

interface GauntletState {
  // Persistent across duels
  playerDiceCount: number;
  streak: number;
  currentRound: number;
  opponentQueue: string[]; // AI names for upcoming opponents

  // Current duel state
  currentOpponent: string | null;
  isActive: boolean;

  // Actions
  startGauntlet: () => void;
  winDuel: () => void;
  loseDuel: () => void;
  restartGauntlet: () => void;
  selectOpponentForRound: () => string;
}

export const useGauntletStore = create<GauntletState>((set, get) => ({
  playerDiceCount: 5,
  streak: 0,
  currentRound: 1,
  opponentQueue: [],
  currentOpponent: null,
  isActive: false,

  startGauntlet: () => set({
    playerDiceCount: 5,
    streak: 0,
    currentRound: 1,
    isActive: true,
    opponentQueue: generateOpponentQueue(),
  }),

  winDuel: () => set((state) => ({
    streak: state.streak + 1,
    currentRound: state.currentRound + 1,
    // playerDiceCount persists (no healing)
  })),

  loseDuel: () => set((state) => ({
    playerDiceCount: 0,
    isActive: false,
  })),

  restartGauntlet: () => get().startGauntlet(),

  selectOpponentForRound: () => {
    const { currentRound } = get();
    // Escalating difficulty: Turtle (1-3) → Calculator (4-6) → Shark (7+)
    if (currentRound <= 3) return 'Turtle';
    if (currentRound <= 6) return 'Calculator';
    return 'Shark';
  },
}));
```

**Key insight:** Zustand's selector-based subscriptions prevent unnecessary re-renders. Use `get()` for derived logic like opponent selection without triggering component updates.

### Pattern 3: Persistent Overlay Components
**What:** Render UI elements like streak counter outside the AnimatePresence flow so they persist across screen transitions.

**When to use:** For UI that should remain visible throughout gameplay: streak counter, settings button, background effects.

**Example:**
```typescript
function GauntletModeScreen() {
  const [screen, setScreen] = useState<ScreenState>('rules');
  const streak = useGauntletStore(state => state.streak);

  return (
    <div className="relative">
      {/* Persistent overlay - outside AnimatePresence */}
      {screen === 'gameplay' && (
        <StreakCounter streak={streak} className="absolute top-4 right-4 z-50" />
      )}

      {/* Sequential screens - inside AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* Screen components... */}
      </AnimatePresence>
    </div>
  );
}
```

### Pattern 4: Number Counter Animation
**What:** Use Framer Motion's animate prop or spring animations to create satisfying number increment effects when streak increases.

**When to use:** For streak counter updates, score displays, round number transitions.

**Example:**
```typescript
// Source: https://motion.dev/docs/react-animate-number + community patterns
import { motion, useSpring, useTransform } from 'framer-motion';

function StreakCounter({ streak }: { streak: number }) {
  const spring = useSpring(streak, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      key={streak} // Force re-mount on change for bump animation
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 0.4 }}
      className="streak-display"
    >
      <motion.span className="streak-number">
        {Math.round(spring.get())}
      </motion.span>
      <span className="streak-label">Defeated</span>
    </motion.div>
  );
}
```

### Anti-Patterns to Avoid

- **Don't update state during render:** Setting state directly in component body causes infinite loops. Always use useEffect or event handlers.
- **Don't create new objects/functions as useEffect dependencies:** Functions and objects are recreated on every render, causing infinite loops. Use useCallback/useMemo or primitive dependencies.
- **Don't nest AnimatePresence inside animated components:** AnimatePresence must be able to detect direct children mounting/unmounting. Nesting breaks exit animations.
- **Don't use inline handlers that call setState in AnimatePresence:** Can cause timing issues with exit animations. Use callbacks that wait for animations to complete.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number increment animations | Custom setInterval counter with manual easing | Framer Motion spring animations or react-countup | Libraries handle easing curves, decimal precision, and frame timing correctly. Custom implementations often jank or drift. |
| Screen transition orchestration | Manual setTimeout chains for sequential screens | AnimatePresence mode="wait" | Handling cleanup, timing coordination, and interrupted transitions is complex. AnimatePresence handles all edge cases. |
| Persistent state across rerenders | Manual localStorage read/write in useEffect | Zustand store with selectors | Avoiding race conditions, sync issues, and re-render loops requires careful dependency management. Zustand handles this automatically. |
| Exit animations | Manual visibility state + setTimeout before unmount | AnimatePresence with exit prop | Keeping components mounted during exit animations while handling state cleanup is error-prone. AnimatePresence manages this automatically. |

**Key insight:** Game flow orchestration (sequential screens, persistent state, smooth transitions) has well-tested libraries. Custom implementations often have subtle timing bugs, race conditions, and edge cases that only appear in specific user flows.

## Common Pitfalls

### Pitfall 1: Infinite Re-render Loops with useEffect
**What goes wrong:** Component enters infinite loop: render → useEffect runs → setState → re-render → useEffect runs again...

**Why it happens:** Missing or incorrect useEffect dependency arrays, especially with object/array/function dependencies that are recreated on every render.

**How to avoid:**
- Always specify dependency array for useEffect
- Use primitive values (numbers, strings, booleans) as dependencies when possible
- Wrap functions in useCallback, objects in useMemo if they must be dependencies
- Use useRef for values that shouldn't trigger re-renders

**Warning signs:**
- Console warning: "Maximum update depth exceeded"
- Browser freezing/high CPU usage
- Component repeatedly mounting/unmounting

**Example fix:**
```typescript
// BAD: Object dependency recreated every render
useEffect(() => {
  updateGameState({ round: currentRound });
}, [{ round: currentRound }]); // New object each render!

// GOOD: Primitive dependency
useEffect(() => {
  updateGameState({ round: currentRound });
}, [currentRound]); // Stable value
```

### Pitfall 2: Exit Animations Not Working
**What goes wrong:** Component disappears instantly instead of animating out when removed.

**Why it happens:**
1. Component is not a direct child of AnimatePresence
2. Missing unique `key` prop on animated elements
3. Conditional rendering removes component before animation completes
4. State update unmounts component too quickly

**How to avoid:**
- Animated components must be direct children of AnimatePresence
- Every animated child needs a unique, stable `key` prop
- Use AnimatePresence mode="wait" for sequential transitions
- Let AnimatePresence handle unmounting (don't manually remove from DOM)

**Warning signs:**
- Screen transitions are instant, no animation
- Exit animations work in isolation but not in app
- Console errors about missing keys

**Example fix:**
```typescript
// BAD: Not a direct child, no key
<AnimatePresence>
  <div>
    {show && <motion.div exit={{ opacity: 0 }} />}
  </div>
</AnimatePresence>

// GOOD: Direct child with key
<AnimatePresence>
  {show && (
    <motion.div
      key="unique-id"
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

### Pitfall 3: State Updates During Opponent Transition
**What goes wrong:** Player dice count resets when transitioning to next opponent, or game state gets corrupted.

**Why it happens:** Zustand store actions are called in wrong order during screen transitions, or actions modify state while components are mounting/unmounting.

**How to avoid:**
- Update persistent state (dice count, streak) immediately after duel ends, not during transitions
- Use store actions (not direct state updates) to ensure consistency
- Separate "duel state" (current game) from "gauntlet state" (persistent)
- Test state transitions with rapid navigation

**Warning signs:**
- Player starts new duel with wrong dice count
- Streak counter shows incorrect value
- Game state desync between screens

### Pitfall 4: AI Difficulty Not Escalating Visibly
**What goes wrong:** Player doesn't notice AI getting harder, difficulty feels flat.

**Why it happens:** Difficulty calculation is correct but not communicated to player, or threshold points are too subtle.

**How to avoid:**
- Show AI personality name on fight card ("Shark" vs "Turtle")
- Use visual indicators (color coding, threat level) for difficulty
- Make difficulty jumps noticeable: rounds 1-3 = easy, 4-6 = medium, 7+ = hard
- Test with non-developers to verify difficulty is perceivable

**Warning signs:**
- Players report "AI doesn't get harder"
- No visible feedback when difficulty changes
- Playtesting shows confusion about progression

## Code Examples

Verified patterns from existing codebase:

### Existing Victory/Defeat Screen Pattern
```typescript
// Source: /src/components/VictoryScreen.tsx
export function VictoryScreen({ playerColor, onPlayAgain }: VictoryScreenProps) {
  const [canSkip, setCanSkip] = useState(false);

  // Play sounds on mount
  useEffect(() => {
    playVictory();
    const rattleTimer = setTimeout(() => playDiceRattle(), 500);
    return () => clearTimeout(rattleTimer);
  }, [playVictory, playDiceRattle]);

  // Enable skip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={canSkip ? onPlayAgain : undefined}
      className="fixed inset-0 z-50"
    >
      {/* Victory content... */}
      {canSkip && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8"
        >
          Click anywhere to continue
        </motion.p>
      )}
    </motion.div>
  );
}
```

**Pattern:** Full-screen overlay with delayed interactivity. Player can't skip immediately (prevents accidental clicks), then can click anywhere to continue.

### Existing AI Personality Selection
```typescript
// Source: /src/lib/ai/personalities.ts
export const PERSONALITIES: Record<string, Personality> = {
  shark: {
    id: 'shark',
    name: 'Shark',
    description: 'Aggressive predator that punishes bluffers',
    params: {
      dudoThreshold: 0.55,
      aggression: 0.75,
      riskTolerance: 0.7,
      // ...
    },
  },
  turtle: {
    id: 'turtle',
    name: 'Turtle',
    description: 'Conservative player that waits for certainty',
    params: {
      dudoThreshold: 0.85,
      aggression: 0.15,
      riskTolerance: 0.2,
      // ...
    },
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    description: 'Pure mathematical player',
    params: {
      dudoThreshold: 0.70,
      aggression: 0.4,
      riskTolerance: 0.5,
      // ...
    },
  },
};

export function getPersonalityForName(name: string): Personality {
  const personalityId = NAME_TO_PERSONALITY[name];
  return PERSONALITIES[personalityId] || getPersonalityByHash(name);
}
```

**Pattern:** AI personalities are already implemented with distinct behavior parameters. Gauntlet mode can select personality based on round number.

### Existing Zustand Store Pattern
```typescript
// Source: /src/stores/gameStore.ts
export const useGameStore = create<GameStore>((set, get) => ({
  roomState: null,
  myPlayerId: null,
  myHand: [],

  setRoomState: (state) => set({ roomState: state }),

  // Derived getter using get()
  isMyTurn: () => {
    const { roomState, myPlayerId } = get();
    return roomState?.gameState?.currentTurnPlayerId === myPlayerId;
  },

  // Action with immutable update
  updateGameState: (state) => set((prev) => ({
    roomState: prev.roomState ? { ...prev.roomState, gameState: state } : null,
  })),
}));
```

**Pattern:** Store defines state, actions, and derived getters. Actions use `set()` for updates, getters use `get()` for derived values. Components subscribe with selectors: `useGameStore(state => state.field)`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for all state | Zustand/Jotai for client state | React 18 (2022) | Zustand uses useSyncExternalStore for concurrent rendering. Lighter weight, less boilerplate. |
| react-transition-group | Framer Motion AnimatePresence | ~2020-2021 | Declarative API, layout animations, better exit animation handling. Industry standard for React animations. |
| Manual setInterval counters | Spring-based animations | Ongoing | Physics-based springs feel more natural. Libraries like Framer Motion provide optimized implementations. |
| Manual setTimeout chains for flow | State machine libraries (XState) or sequential patterns | Ongoing | For simple sequential flows, AnimatePresence mode="wait" is simpler than full state machines. |

**Deprecated/outdated:**
- **react-transition-group**: Still maintained but Framer Motion is preferred for new projects
- **Redux Saga for game flow**: Overkill for simple sequential flows, Zustand actions are sufficient
- **Class components for game state**: Functional components + hooks are standard, class lifecycle methods are legacy pattern

## Open Questions

Things that couldn't be fully resolved:

1. **Should gauntlet state persist across browser sessions?**
   - What we know: User can close browser mid-gauntlet. Should progress be saved?
   - What's unclear: CONTEXT.md doesn't specify. Pros: Better UX if player returns. Cons: More complexity, localStorage management.
   - Recommendation: Start without persistence (session-only). Can add localStorage in later phase if users request it. Mark as "Claude's discretion" decision.

2. **How many opponents should be in the queue?**
   - What we know: AI always starts with 5 dice. Difficulty escalates by personality.
   - What's unclear: Should opponents be randomly selected or predetermined? Infinite gauntlet or fixed number?
   - Recommendation: Infinite gauntlet (no fixed end). Select personality based on round number. Generate random AI name for each opponent from existing name pool.

3. **Should victory splash show any stats besides streak?**
   - What we know: Victory splash shows defeated opponent and streak. Game over shows final stats.
   - What's unclear: What metrics matter to players mid-gauntlet vs. end-of-run?
   - Recommendation: Victory splash keeps it minimal (opponent defeated, streak, "X Defeated"). Save detailed stats for game over screen. Matches ominous tone ("one down, many to go").

## Sources

### Primary (HIGH confidence)
- Zustand GitHub: https://github.com/pmndrs/zustand - Core API patterns and usage
- Framer Motion AnimatePresence: https://motion.dev/docs/react-animate-presence - Exit animations and mode options
- State Management 2026: https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns - Current ecosystem landscape
- Existing codebase: `/src/stores/gameStore.ts`, `/src/lib/ai/personalities.ts`, `/src/components/VictoryScreen.tsx`, `/src/components/DefeatScreen.tsx` - Established patterns

### Secondary (MEDIUM confidence)
- React State Machines: https://blog.codeminer42.com/finite-state-machines-and-how-to-build-any-step-by-step-flow-in-react/ - Sequential flow patterns
- Advanced Framer Motion Patterns: https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/ - Animation orchestration
- Dynamic Difficulty Adjustment: https://en.wikipedia.org/wiki/Dynamic_game_difficulty_balancing - Game design patterns for escalating difficulty
- Number Counter Animations: https://motion.dev/docs/react-animate-number - Counter animation patterns

### Tertiary (LOW confidence)
- Fighting Game UI: https://www.gameuidatabase.com/index.php?tag=2 - Visual design inspiration (not technical implementation)
- React Infinite Loop Prevention: https://alexsidorenko.com/blog/react-infinite-loop - Common pitfall documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zustand and Framer Motion are already in project, extensively documented, production-proven
- Architecture: HIGH - Patterns verified from existing codebase and official docs
- Pitfalls: HIGH - Common React patterns, verified with official documentation and community resources

**Research date:** 2026-01-21
**Valid until:** 30 days (stable libraries with infrequent breaking changes)

---

**Notes for planner:**
- All required libraries already installed, no new dependencies needed
- Existing AI personality system (Turtle, Calculator, Shark) can be used directly
- Existing victory/defeat screens provide pattern for full-screen overlays
- User decisions from CONTEXT.md locked key UI patterns (RPG-style fight cards, ominous tone, player-controlled pacing)
