# Phase 2: Mode Selection - Research

**Researched:** 2026-01-18
**Domain:** React UI / Framer Motion / Next.js App Router
**Confidence:** HIGH

## Summary

Phase 2 adds a mode selection screen as the new entry point before the existing game. The implementation requires adding a new UI state/screen to the existing single-page architecture rather than creating new routes, which aligns with the current `GameState` state machine pattern already in `page.tsx`.

The existing codebase already has all necessary dependencies (Framer Motion 11.15.0, lucide-react 0.468.0, Zustand with persist middleware), established animation patterns (AnimatePresence with mode="wait", whileHover/whileTap), and a consistent Dia de los Muertos visual theme. The mode selection screen should follow these existing patterns exactly.

**Primary recommendation:** Add 'ModeSelection' as a new GameState, render it before 'Lobby', use AnimatePresence mode="wait" for smooth transition to the selected flow, and extend the existing uiStore to persist the user's preferred mode.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 11.15.0 | All animations | Already used throughout, AnimatePresence for transitions |
| lucide-react | 0.468.0 | Icons | Already used, has Bot and Users icons needed |
| zustand | 5.0.10 | State + persistence | Already has persist middleware configured in uiStore |

### Supporting (Already in Codebase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.0.0 | Styling | All styling, existing CSS variables |
| @tailwindcss/postcss | 4.0.0 | Build | Tailwind processing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| State-based navigation | Next.js routes (/play-ai, /multiplayer) | Routes add complexity, break existing single-page pattern, cause full re-renders |
| Zustand persist | Raw localStorage | Zustand already configured with persist, handles SSR hydration |
| Custom transitions | View Transitions API | VTA still experimental, Framer Motion already works |

**Installation:** No new packages needed - all dependencies already present.

## Architecture Patterns

### Current Application Structure
```
src/app/
  layout.tsx          # Root layout with CRT overlay
  page.tsx            # Single page with GameState state machine
  globals.css         # Dia de los Muertos theme

src/components/       # All UI components
src/lib/types.ts      # GameState type, PlayerColor, PLAYER_COLORS
src/stores/uiStore.ts # Zustand store with persist middleware
```

### Recommended Approach: Extend GameState

**What:** Add 'ModeSelection' to the existing GameState type, render before 'Lobby'

**Why:**
- Follows existing pattern (GameState: 'Lobby' | 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat')
- No routing changes needed
- AnimatePresence already wraps state transitions
- Preserves existing single-player flow completely

**Pattern:**
```typescript
// src/lib/types.ts - Extend existing type
export type GameState = 'ModeSelection' | 'Lobby' | 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat';

// src/app/page.tsx - Change initial state
const [gameState, setGameState] = useState<GameState>('ModeSelection');
```

### Pattern 1: Mode Selection Component Structure

**What:** Two large, stacked buttons with icons and animated entry

**When to use:** Initial screen, equal prominence for both options

**Example:**
```typescript
// Source: Existing VictoryScreen.tsx pattern
<motion.button
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.98, y: 0 }}
  onClick={() => handleModeSelect('ai')}
  className="retro-panel p-8 w-full flex items-center gap-6"
>
  <Bot className="w-12 h-12" />
  <div className="text-left">
    <h2>Play vs AI</h2>
    <p>Challenge computer opponents</p>
  </div>
</motion.button>
```

### Pattern 2: Animated Transition on Selection

**What:** Selected button expands/glows, other fades, then transition

**When to use:** Mode selection confirmation

**Example:**
```typescript
// Source: Existing animation patterns in codebase
const [selectedMode, setSelectedMode] = useState<'ai' | 'multiplayer' | null>(null);

// On button click, set selectedMode first (triggers animation)
// After animation delay, change GameState
const handleModeSelect = (mode: 'ai' | 'multiplayer') => {
  setSelectedMode(mode);
  setTimeout(() => {
    if (mode === 'ai') {
      setGameState('Lobby'); // Existing single-player flow
    } else {
      // Future: navigate to multiplayer flow
    }
  }, 600); // Match animation duration
};
```

### Pattern 3: LocalStorage Preference with Zustand

**What:** Remember user's last selected mode

**When to use:** Auto-skip mode selection for returning users

**Example:**
```typescript
// Source: Existing uiStore.ts pattern
// Extend existing store
interface UIStore {
  // ... existing fields
  preferredMode: 'ai' | 'multiplayer' | null;
  setPreferredMode: (mode: 'ai' | 'multiplayer') => void;
}

// In persist partialize (already configured):
partialize: (state) => ({
  soundEnabled: state.soundEnabled,
  playerColor: state.playerColor,
  playerName: state.playerName,
  preferredMode: state.preferredMode, // Add this
}),
```

### Anti-Patterns to Avoid
- **Creating new routes for mode selection:** Breaks single-page pattern, adds complexity, no SEO benefit for game UI
- **Using React.lazy for ModeSelection:** Unnecessary code splitting for small component already on initial page
- **Animating with CSS only:** Lose spring physics and gesture handlers Framer Motion provides
- **Direct localStorage calls:** Bypass Zustand's SSR-safe hydration handling

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence | Custom localStorage logic | Zustand persist middleware (already configured) | Handles SSR hydration, serialization |
| Page transitions | CSS transitions or manual DOM | AnimatePresence mode="wait" | Already used, handles unmount animations |
| Button animations | Custom spring math | whileHover, whileTap props | Already in every button, consistent feel |
| Icon selection | Custom SVGs | lucide-react Bot, Users | Already imported, tree-shakeable |
| Glow effects | Custom CSS animations | Existing PLAYER_COLORS glow values | Already themed for Dia de los Muertos |

**Key insight:** The entire stack is already configured - this phase is pure UI addition following existing patterns, not new infrastructure.

## Common Pitfalls

### Pitfall 1: AnimatePresence Key Missing
**What goes wrong:** Exit animations don't play, components disappear instantly
**Why it happens:** AnimatePresence requires unique keys on direct children to track removal
**How to avoid:** Always add `key={gameState}` to the motion component inside AnimatePresence
**Warning signs:** Components disappear without exit animation

### Pitfall 2: SSR Hydration Mismatch with localStorage
**What goes wrong:** Server renders 'ModeSelection', client has preference and renders 'Lobby', React throws mismatch error
**Why it happens:** localStorage only exists on client, initial server render differs
**How to avoid:** Use Zustand's persist middleware which handles this; render ModeSelection on first render, then check preference after hydration via useEffect
**Warning signs:** Console hydration errors, flashing content

### Pitfall 3: Breaking Existing Single-Player Flow
**What goes wrong:** Lobby screen no longer works correctly after mode selection
**Why it happens:** Accidentally modifying Lobby state or props when adding ModeSelection
**How to avoid:** ModeSelection is purely additive - only changes initial GameState, rest of state machine unchanged
**Warning signs:** AI opponent count broken, settings don't persist, game doesn't start

### Pitfall 4: Framer Motion Exit Animation Interrupted
**What goes wrong:** Exit animations cut off mid-way
**Why it happens:** State change happens before exit animation completes with mode="wait"
**How to avoid:** Let AnimatePresence handle timing - mode="wait" means entering component waits for exit to complete
**Warning signs:** Choppy transitions, half-visible elements

### Pitfall 5: Forgetting Mobile Responsiveness
**What goes wrong:** Buttons overflow on small screens, icons too large
**Why it happens:** Designing for desktop first without checking mobile
**How to avoid:** Use responsive Tailwind classes (e.g., `w-full max-w-md`, `p-6 md:p-8`)
**Warning signs:** Horizontal scrollbar on mobile, buttons cropped

## Code Examples

Verified patterns from official sources and existing codebase:

### Animated Button with Icon (From Existing Codebase)
```typescript
// Source: src/components/VictoryScreen.tsx lines 329-353
<motion.button
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.98, y: 0 }}
  onClick={handleClick}
  className="retro-panel"
  style={{
    background: colorConfig.bgGradient,
    border: `3px solid ${colorConfig.border}`,
    boxShadow: `0 6px 0 0 ${colorConfig.shadow}, 0 0 40px ${colorConfig.glow}`,
  }}
>
  <Icon className="w-12 h-12" style={{ color: colorConfig.bg }} />
  <span>Button Text</span>
</motion.button>
```

### AnimatePresence with mode="wait" (From Existing Codebase)
```typescript
// Source: src/app/page.tsx lines 1302-1877
<AnimatePresence mode="wait">
  {gameState === 'Lobby' && (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* content */}
    </motion.div>
  )}
  {/* other states */}
</AnimatePresence>
```

### Staggered Entry Animation (From Existing Codebase)
```typescript
// Source: src/components/CasinoLogo.tsx pattern
{'PERUDO'.split('').map((letter, i) => (
  <motion.span
    key={i}
    animate={{ y: [0, -4, 0] }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay: i * 0.1, // Stagger each letter
      ease: 'easeInOut',
    }}
  >
    {letter}
  </motion.span>
))}
```

### Zustand Persist with Partial State (From Existing Codebase)
```typescript
// Source: src/stores/uiStore.ts lines 39-94
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      preferredMode: null,
      setPreferredMode: (mode) => set({ preferredMode: mode }),
      // ... other state
    }),
    {
      name: 'perudo-ui-preferences',
      partialize: (state) => ({
        preferredMode: state.preferredMode,
        // ... only persist what needs to survive reload
      }),
    }
  )
);
```

### Lucide Icons for Mode Selection
```typescript
// Source: lucide.dev/icons
import { Bot, Users } from 'lucide-react';

// Bot: tags "robot", "ai", "chat", "assistant" - for AI mode
// Users: tags "group", "people" - for multiplayer mode
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router transitions | App Router + AnimatePresence workarounds | Next.js 13+ | AnimatePresence still works in single-page, avoid route transitions |
| Framer Motion v10 | Framer Motion v11 | 2024 | Better React 19 support, improved layout animations |
| Manual localStorage | Zustand persist middleware | Zustand 4.0+ | SSR-safe, automatic serialization |
| Custom spring animations | whileHover/whileTap built-in | Always in Framer | Simpler API, consistent physics |

**Deprecated/outdated:**
- Pages Router page transitions with AnimatePresence: App Router breaks this pattern
- View Transitions API as primary solution: Still experimental, use AnimatePresence

## Open Questions

Things that couldn't be fully resolved:

1. **Direct room links skipping mode selection**
   - What we know: URL like `/room/ABC123` should bypass mode selection
   - What's unclear: No routes exist yet - will be addressed in Phase 3-5
   - Recommendation: For Phase 2, mode selection is just state-based; URL-based bypass is future work

2. **Multiplayer button behavior in Phase 2**
   - What we know: Clicking "Play with Friends" should lead to nickname + settings
   - What's unclear: That flow doesn't exist yet
   - Recommendation: In Phase 2, show toast/placeholder "Coming soon" or disable button until Phase 3

## Sources

### Primary (HIGH confidence)
- Existing codebase: src/app/page.tsx - GameState pattern, AnimatePresence usage
- Existing codebase: src/stores/uiStore.ts - Zustand persist configuration
- Existing codebase: src/components/VictoryScreen.tsx - Button animation patterns
- Existing codebase: src/lib/types.ts - PLAYER_COLORS, GameState type

### Secondary (MEDIUM confidence)
- [Motion.dev AnimatePresence docs](https://motion.dev/docs/react-animate-presence) - mode="wait" behavior
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - Partial persistence pattern
- [Lucide React icons](https://lucide.dev/icons/) - Bot and Users icon availability

### Tertiary (LOW confidence - needs validation)
- [Medium article on button hover effects](https://medium.com/@evanch98/button-hover-effect-in-react-using-framer-motion-and-tailwind-css-9173b13bb19f) - Additional animation ideas
- [Next.js App Router page transitions workaround](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router) - Not needed since we use state, not routes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing dependencies, no new packages
- Architecture: HIGH - Extending existing GameState pattern, verified in codebase
- Animation patterns: HIGH - Directly copied from existing components
- Pitfalls: MEDIUM - Some based on general React/Framer knowledge

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (stable - no fast-moving dependencies)
