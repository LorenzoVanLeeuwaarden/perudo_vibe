# Phase 23: Tutorial Foundation - Research

**Researched:** 2026-01-22
**Domain:** Tutorial infrastructure with scripted gameplay reusing existing components
**Confidence:** HIGH

## Summary

Phase 23 builds the tutorial skeleton: entry point, scripted 3-player game, predetermined dice, and component reuse. The guidance UI (tooltips, highlights) and full educational content are deferred to Phases 24-25.

The existing codebase provides an ideal template in `GauntletGameplay.tsx` - a self-contained single-player game mode with local state, reusing all standard game components (BidUI, Dice, DiceCup, SortedDiceDisplay, RevealContent). The tutorial will follow this exact pattern with one key difference: scripted dice instead of random rolls.

**Primary recommendation:** Build `TutorialScreen` and `TutorialGameplay` following the Gauntlet pattern, add `tutorialStore` for progression state, and intercept `rollDice()` calls to return predetermined values from a script.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | ^5.0.10 | Tutorial state management | Already used for gauntletStore, uiStore; proven pattern |
| Framer Motion | ^11.15.0 | Animations (dice reveal, overlays) | Already powering all game animations |
| React 19 | ^19.0.0 | Component rendering | Existing framework |
| TypeScript 5 | ^5 | Type safety | Existing tooling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | native | Persist tutorial completion | Track `tutorial_completed` flag |
| CSS variables | native | Tutorial styling | Reuse existing `--turquoise`, `--marigold`, etc. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | XState | XState overkill for linear tutorial flow; paradigm mismatch |
| Custom tooltips | react-joyride | Tour libraries can't control game state; style mismatch |
| Scripted arrays | seedrandom | PRNG overkill when we're authoring specific dice values |

**Installation:**
```bash
# No new dependencies required
# All libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    tutorialStore.ts          # NEW: Tutorial progression state
  components/
    tutorial/                  # NEW: Tutorial-specific components
      index.ts
      TutorialScreen.tsx       # Main container (like GauntletModeScreen)
      TutorialGameplay.tsx     # Controlled game instance
  lib/
    tutorial/                  # NEW: Tutorial data and logic
      types.ts                 # Tutorial-specific types
      script.ts                # Predetermined dice and moves
```

### Pattern 1: Gauntlet-Style Screen Management
**What:** Dedicated screen component with screen-state enum managed by Zustand
**When to use:** Tutorial needs isolated state from main game, distinct screen flow
**Example:**
```typescript
// Source: Existing gauntletStore.ts pattern
type TutorialScreen = 'gameplay' | 'complete';

interface TutorialState {
  screen: TutorialScreen;
  currentStep: number;
  totalSteps: number;

  // Actions
  startTutorial: () => void;
  advanceStep: () => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  screen: 'gameplay',
  currentStep: 0,
  totalSteps: 8, // Placeholder count

  startTutorial: () => set({ screen: 'gameplay', currentStep: 0 }),
  advanceStep: () => set(s => ({ currentStep: s.currentStep + 1 })),
  completeTutorial: () => {
    localStorage.setItem('tutorial_completed', 'true');
    set({ screen: 'complete' });
  },
  exitTutorial: () => set({ screen: 'gameplay', currentStep: 0 }),
}));
```

### Pattern 2: Scripted Dice Roll Interception
**What:** Tutorial script provides predetermined dice; gameplay uses these instead of random rolls
**When to use:** When step requires specific dice configuration for teaching moment
**Example:**
```typescript
// Source: gameLogic.ts rollDice pattern + tutorial override
// In TutorialGameplay.tsx:

const handleRoll = useCallback(() => {
  setIsRolling(true);

  // Get scripted dice for current step instead of random
  const script = TUTORIAL_SCRIPT.steps[currentStep];
  const newPlayerHand = script.playerDice; // e.g., [3, 3, 5, 2, 1]
  setPlayerHand(newPlayerHand);

  // Set opponent dice (visible in tutorial "god mode")
  if (opponents.length > 0) {
    setOpponents(prev => prev.map((opp, i) => ({
      ...opp,
      hand: script.opponentDice[i] // e.g., [4, 4, 4, 1, 6]
    })));
  }
}, [currentStep, opponents]);
```

### Pattern 3: Constrained Move with Required Action
**What:** Tutorial step specifies which action user must take; other actions disabled
**When to use:** When teaching specific mechanic (Phase 24 adds explanations)
**Example:**
```typescript
// From CONTEXT.md decision: "only the right action is available"
interface TutorialStep {
  playerDice: number[];
  opponentDice: number[][];  // Array per opponent
  requiredAction:
    | { type: 'bid'; bid: { count: number; value: number } }
    | { type: 'dudo' }
    | { type: 'wait' };  // Observe AI turn
  scriptedAIMoves?: { type: 'bid'; bid: { count: number; value: number } }[];
}

// In BidUI wrapper:
const isActionAllowed = (action: 'bid' | 'dudo' | 'calza') => {
  if (!tutorialMode) return true;
  const required = tutorialStore.getCurrentStep().requiredAction;
  return required.type === action;
};
```

### Pattern 4: Component Reuse via Props
**What:** Existing components accept tutorial-mode props without internal changes
**When to use:** BidUI, Dice, SortedDiceDisplay all support needed customization
**Example:**
```typescript
// Source: Existing BidUI props
<BidUI
  currentBid={currentBid}
  onBid={handleBid}
  onDudo={handleDudo}
  onCalza={handleCalza}
  isMyTurn={isMyTurn}
  totalDice={totalDice}
  playerColor={playerColor}
  isPalifico={false}  // Tutorial doesn't teach Palifico
  canCalza={false}    // Calza taught in Phase 24-25
  hideBidDisplay={true}  // Display managed separately in tutorial
  onValueChange={setSelectedBidValue}
/>
```

### Anti-Patterns to Avoid
- **Forking game logic:** Do NOT copy game loop from page.tsx. Reuse components, script state.
- **Global tutorial flags:** Do NOT add `isTutorial` checks throughout existing components. Isolate in TutorialGameplay.
- **Tight coupling to step numbers:** Do NOT use `if (step === 5)`. Step objects declare their requirements.
- **Real game penalties:** Do NOT show die loss in tutorial. Safe environment means no consequences.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screen state management | Custom useState logic | `useTutorialStore` (Zustand) | Gauntlet pattern proven; handles persistence |
| Dice roll animation | Separate tutorial dice | `DiceCup` + predetermined values | Animation logic already handles any dice array |
| Bid display | Tutorial-specific bid UI | `BidUI` with `hideBidDisplay={true}` | Existing component fully customizable |
| Reveal sequence | New reveal component | `RevealContent` with controlled props | Complex animation already built |
| Player badges | Tutorial player display | `PlayerDiceBadge` | Supports `showThinking`, `isActive` props |

**Key insight:** The existing game components are already props-driven and reusable. Tutorial should be a thin orchestration layer, not a rebuild.

## Common Pitfalls

### Pitfall 1: Breaking Existing Game State
**What goes wrong:** Tutorial modifies `useUIStore` or other shared state; main game has stale state after tutorial exit
**Why it happens:** Reusing components that read/write shared stores
**How to avoid:** Tutorial uses isolated `useTutorialStore`. Clear any shared state on exit.
**Warning signs:** Main game has stuck overlays or unexpected state after tutorial

### Pitfall 2: Dice Roll Animation Mismatch
**What goes wrong:** Predetermined dice displayed before animation completes; player sees dice "snap" to final values
**Why it happens:** Bypassing `DiceCup` component which handles animation timing
**How to avoid:** Pass predetermined dice to `DiceCup.onRoll` callback; let animation play normally
**Warning signs:** No shake animation, instant dice reveal

### Pitfall 3: Opponent Dice Not Visible
**What goes wrong:** Tutorial claims opponents' dice are visible but they show as hidden
**Why it happens:** Using regular `Dice` component which respects `hidden` prop
**How to avoid:** In TutorialGameplay, render opponent dice with `hidden={false}` regardless of turn
**Warning signs:** Opponent section shows "?" dice instead of actual values

### Pitfall 4: AI Turn Not Scripted
**What goes wrong:** AI makes unexpected move instead of scripted action
**Why it happens:** Using `makeDecision()` from AI engine instead of script
**How to avoid:** When `isMyTurn=false`, use `scriptedAIMoves[opponentIndex]` not AI logic
**Warning signs:** AI calls Dudo when script says it should bid

### Pitfall 5: No State Reset on Exit
**What goes wrong:** Player exits tutorial mid-flow, returns, sees corrupted state
**Why it happens:** Tutorial state not cleared on exit
**How to avoid:** `exitTutorial()` resets all tutorial state to initial values
**Warning signs:** Tutorial starts at step 5 after exit/re-enter

## Code Examples

Verified patterns from existing codebase:

### Main Menu Entry Point (ModeSelection Pattern)
```typescript
// Source: ModeSelection.tsx - add tutorial handler
interface ModeSelectionProps {
  onSelectAI: () => void;
  onSelectMultiplayer: () => void;
  onSelectGauntlet: () => void;
  onSelectTutorial: () => void;  // NEW
  playerColor: PlayerColor;
}

// "How to Play" button - secondary position, smaller styling
<motion.button
  onClick={handleSelectTutorial}
  className="text-sm text-white-soft/60 hover:text-white-soft/80 underline mt-4"
>
  How to Play
</motion.button>
```

### Tutorial Screen Container
```typescript
// Source: GauntletModeScreen.tsx pattern
export function TutorialScreen({
  playerColor,
  onExit,
}: {
  playerColor: PlayerColor;
  onExit: () => void;
}) {
  const { screen } = useTutorialStore();

  return (
    <div className="relative w-full h-full">
      <ShaderBackground />

      {screen === 'gameplay' && (
        <TutorialGameplay
          playerColor={playerColor}
          onComplete={() => useTutorialStore.getState().completeTutorial()}
        />
      )}

      {screen === 'complete' && (
        <TutorialComplete onExit={onExit} />
      )}
    </div>
  );
}
```

### Predetermined Dice in Script Format
```typescript
// Source: Design decision - simple data structure
export const TUTORIAL_SCRIPT = {
  steps: [
    {
      // Step 0: Opening - show player's dice
      playerDice: [3, 3, 5, 2, 1],
      opponentDice: [[4, 4, 4, 1, 6], [2, 5, 5, 3, 3]],
      requiredAction: { type: 'wait' },
    },
    {
      // Step 1: First bid - constrained to specific bid
      playerDice: [3, 3, 5, 2, 1],
      opponentDice: [[4, 4, 4, 1, 6], [2, 5, 5, 3, 3]],
      requiredAction: { type: 'bid', bid: { count: 2, value: 3 } },
    },
    // ... more steps
  ],
} as const;
```

### First-Time Prompt Modal
```typescript
// Source: CONTEXT.md decision - gentle prompt for new visitors
// Check localStorage for dismissal
const [showPrompt, setShowPrompt] = useState(false);

useEffect(() => {
  const dismissed = localStorage.getItem('tutorial_prompt_dismissed');
  const completed = localStorage.getItem('tutorial_completed');
  if (!dismissed && !completed) {
    setShowPrompt(true);
  }
}, []);

const handleDismiss = () => {
  localStorage.setItem('tutorial_prompt_dismissed', 'true');
  setShowPrompt(false);
};

// Modal suggests tutorial, dismisses on "Skip" or outside click
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate tutorial UI | Reuse existing components | Current best practice | 80% less code, consistent UX |
| Force linear flow | Allow skip/exit | Current best practice | Accessibility compliance |
| Text walls before play | Interaction-first teaching | Current best practice | Higher completion rates |
| Random dice in tutorial | Predetermined scripted dice | Current best practice | Reliable teaching moments |

**Deprecated/outdated:**
- Tour libraries (react-joyride, driver.js): Cannot control game state, only highlight DOM
- XState: Overkill for linear tutorial; paradigm mismatch with Zustand-based codebase

## Open Questions

Things that couldn't be fully resolved:

1. **Animation timing for predetermined dice**
   - What we know: DiceCup has ~1.8s animation before `onComplete` fires
   - What's unclear: Best timing for tutorial text to appear (during animation? after?)
   - Recommendation: Show text immediately, animation provides natural pause before action

2. **How to handle mobile viewport constraints**
   - What we know: Game is mobile-optimized, tutorials often break on small screens
   - What's unclear: Will tooltips/overlays (Phase 24) fit on mobile?
   - Recommendation: Phase 23 focuses on gameplay; test mobile in Phase 24 tooltip work

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis:
  - `/src/stores/gauntletStore.ts` - Screen state pattern
  - `/src/components/gauntlet/GauntletGameplay.tsx` - Standalone gameplay component
  - `/src/components/BidUI.tsx` - Reusable bid interface with all needed props
  - `/src/lib/gameLogic.ts` - `rollDice()` function to intercept
  - `/src/components/ModeSelection.tsx` - Entry point pattern

- Prior research documents:
  - `.planning/research/ARCHITECTURE-tutorial.md` - Architecture patterns
  - `.planning/research/STACK-tutorial.md` - Stack decisions
  - `.planning/research/FEATURES-tutorial.md` - UX requirements
  - `.planning/research/PITFALLS-tutorial.md` - Common mistakes

### Secondary (MEDIUM confidence)
- CONTEXT.md user decisions (23-CONTEXT.md)
- REQUIREMENTS.md v3.1 requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, verified existing usage
- Architecture: HIGH - Gauntlet pattern proven in production
- Pitfalls: HIGH - Derived from codebase analysis and prior research

**Research date:** 2026-01-22
**Valid until:** 60+ days (stable patterns, no external dependencies)
