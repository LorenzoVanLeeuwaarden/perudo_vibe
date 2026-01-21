# Technology Stack for Tutorial Feature

**Project:** Perudo Vibe - Tutorial Mode
**Researched:** 2026-01-21
**Overall Confidence:** HIGH (verified against existing codebase and current documentation)

## Executive Summary

The tutorial system requires **no new library dependencies**. The existing stack (Zustand 5.x, Framer Motion 11.x, Tailwind CSS 4.x) fully supports all tutorial requirements. Adding libraries like XState or react-joyride would introduce unnecessary complexity and conflict with established patterns.

**Recommendation:** Build on existing patterns. The gauntlet mode's screen-state machine in `gauntletStore.ts` provides a proven template for tutorial state management.

---

## Existing Stack (DO NOT CHANGE)

| Technology | Version | Purpose | Verified |
|------------|---------|---------|----------|
| Next.js | ^16.1.2 | Framework | package.json |
| React | ^19.0.0 | UI library | package.json |
| TypeScript | ^5 | Type safety | package.json |
| Zustand | ^5.0.10 | State management | package.json |
| Framer Motion | ^11.15.0 | Animations | package.json |
| Tailwind CSS | ^4.0.0 | Styling | package.json |
| Zod | ^4.3.5 | Schema validation | package.json |

---

## Stack Additions for Tutorial

### Required: NONE

The existing stack handles all tutorial requirements:

| Requirement | Solution | Why No New Dependency |
|-------------|----------|----------------------|
| State machine | Zustand with screen-state pattern | `gauntletStore.ts` already implements this pattern |
| Predetermined dice | Seeded array in tutorial config | Simple array iteration; no PRNG library needed |
| Constrained moves | Validation in action handlers | Same pattern as `isValidBid()` in `gameLogic.ts` |
| Inline tooltips | Framer Motion + Tailwind | Existing animation patterns; absolute positioning |
| Callout overlays | Framer Motion AnimatePresence | Already used for DudoOverlay, VictoryScreen |

---

## Why NOT to Add These Libraries

### XState - NOT RECOMMENDED

**Why it seems attractive:**
- Formal state machine definitions
- Visualizer for complex flows
- Guards and actions built-in

**Why it's wrong for this project:**
1. **Overkill:** Tutorial has ~8-12 linear steps. XState shines for complex parallel/hierarchical states.
2. **Pattern conflict:** Codebase uses Zustand's simple store pattern. XState introduces actors, events, and services - a paradigm shift.
3. **Bundle size:** XState core is ~15KB min+gzip. The tutorial needs ~50 lines of state logic.
4. **Learning curve:** Team must learn XState patterns when Zustand patterns are already mastered.

**Evidence from codebase:** The `gauntletStore.ts` manages screen states (`'rules' | 'fightCard' | 'gameplay' | 'victory' | 'gameOver' | 'leaderboard' | 'achievements'`) with simple Zustand - no XState needed.

**Source:** [XState vs Zustand comparison](https://stackshare.io/stackups/xstate-vs-zustand) - "The main difference between XState and Zustand lies in their core focus. XState is centered around state machines... Zustand is a minimalist store that provides a simple and efficient way to manage application state without the need for state machines."

### react-joyride / driver.js - NOT RECOMMENDED

**Why they seem attractive:**
- Pre-built tour components
- Element highlighting
- Step sequencing

**Why they're wrong for this project:**
1. **Wrong mental model:** Tour libraries are for "point at existing UI and explain." Tutorial needs to *control* the game, not explain it passively.
2. **Control conflict:** Joyride assumes you want to highlight DOM elements. Tutorial needs to intercept game actions and force specific dice.
3. **Style collision:** These libraries inject their own CSS. Project has strong visual identity with custom retro styling.
4. **Limited scripting:** Can't express "force these exact dice, allow only this bid, then show this callout."

**What tutorials need vs what tour libraries provide:**

| Tutorial Need | Tour Library Capability | Gap |
|---------------|------------------------|-----|
| Force specific dice rolls | None | Complete gap |
| Constrain available moves | Highlight elements only | Wrong paradigm |
| Custom styled callouts | Generic tooltips | Style mismatch |
| Game state control | DOM overlay only | Wrong layer |

**Source:** [React Onboarding Libraries 2026](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) - "OnboardJS takes a different approach than traditional tour libraries. Instead of attaching tooltips to DOM elements, it provides a state machine for managing onboarding flows. You bring your own UI."

### Floating UI / Radix Tooltip - NOT RECOMMENDED

**Why they seem attractive:**
- Smart positioning
- Portal rendering
- Accessibility

**Why they're wrong for this project:**
1. **Framer Motion conflict:** Floating UI's position measurement + Framer Motion's layout animations cause known bugs (position jumps, animation breaks).
2. **Simple needs:** Tutorial callouts are attached to known elements (BidUI, DiceCup, etc.). Position calculations are straightforward.
3. **Already have the pattern:** Existing overlays (DudoOverlay, VictoryScreen) use Framer Motion AnimatePresence successfully.

**Source:** [Animated Tooltip with Framer Motion](https://sinja.io/blog/animated-tooltip-with-react-framer-motion) - "For Floating UI to correctly position a floating element, it needs to know its dimensions... For Framer Motion, which is unaware of these Floating UI shenanigans, it appears as if the element has just changed position and needs to be animated."

### seedrandom - NOT RECOMMENDED

**Why it seems attractive:**
- Deterministic random sequences
- Reproducible dice rolls

**Why it's wrong for this project:**
1. **Tutorial dice are authored:** We're not generating random-looking sequences; we're scripting specific scenarios.
2. **Simple data structure:** A fixed array `[3, 3, 5, 2, 1]` is clearer than `seedrandom('tutorial-step-1').nextInt(1, 6)`.
3. **No iteration needed:** Each step uses a single predetermined dice configuration.

---

## Recommended Implementation Patterns

### 1. Tutorial State Store (Zustand)

```typescript
// src/stores/tutorialStore.ts
type TutorialStep =
  | 'intro'
  | 'your-dice'
  | 'opponent-dice-hidden'
  | 'first-bid-explain'
  | 'make-first-bid'
  | 'opponent-bids'
  | 'dudo-explain'
  | 'call-dudo'
  | 'reveal-explain'
  | 'complete';

interface TutorialState {
  isActive: boolean;
  currentStep: TutorialStep;
  scriptIndex: number;

  // Actions
  startTutorial: () => void;
  advanceStep: () => void;
  exitTutorial: () => void;

  // Derived
  getCurrentCallout: () => CalloutConfig | null;
  getAllowedActions: () => AllowedAction[];
  getScriptedDice: () => number[] | null;
}
```

**Rationale:** Mirrors `gauntletStore.ts` pattern. Simple, testable, no new concepts.

### 2. Predetermined Dice (No Library)

```typescript
// src/lib/tutorialScript.ts
export const TUTORIAL_SCRIPT = {
  steps: [
    {
      step: 'your-dice',
      playerDice: [3, 3, 5, 2, 1],  // Fixed dice for tutorial
      opponentDice: [4, 4, 4, 1, 6], // Known for scripted outcome
    },
    // ...
  ]
} as const;
```

**Rationale:** Tutorial dice are authored content, not random. A 5-element array is simpler than importing seedrandom.

### 3. Constrained Move Validation

```typescript
// In BidUI or tutorial wrapper
const isAllowedInTutorial = (action: GameAction): boolean => {
  const allowed = tutorialStore.getAllowedActions();
  return allowed.some(a => actionMatches(action, a));
};

// Disable buttons / show hints based on allowed actions
```

**Rationale:** Same validation pattern as `isValidBid()`. Layer on existing UI, don't replace it.

### 4. Callout Components (Framer Motion)

```typescript
// src/components/tutorial/TutorialCallout.tsx
export function TutorialCallout({
  target,
  content,
  position
}: CalloutProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-50 retro-panel p-4 max-w-xs"
        style={calculatePosition(target, position)}
      >
        {content}
        <TutorialArrow direction={position} />
      </motion.div>
    </AnimatePresence>
  );
}
```

**Rationale:** Uses existing `retro-panel` styling, Framer Motion patterns. Consistent with project aesthetic.

---

## Integration Points with Existing Code

### Game Store Integration

The tutorial will need to intercept/override certain game behaviors:

| Existing Code | Tutorial Override |
|--------------|-------------------|
| `rollDice()` in gameLogic.ts | Return scripted dice when `tutorialStore.isActive` |
| `BidUI` validation | Add tutorial constraints via `getAllowedActions()` |
| AI move generation | Replace with scripted opponent moves |

### Component Composition

```
// Existing
<GameBoard>
  <DiceCup />
  <BidUI />
</GameBoard>

// With tutorial
<TutorialWrapper>  {/* Provides callout layer */}
  <GameBoard>
    <DiceCup />
    <BidUI allowedActions={tutorialAllowed} />
  </GameBoard>
  <TutorialCallout />
</TutorialWrapper>
```

---

## What Needs to Be Built

| Component | Complexity | Notes |
|-----------|------------|-------|
| `tutorialStore.ts` | Low | Copy pattern from `gauntletStore.ts` |
| `tutorialScript.ts` | Low | Static configuration object |
| `TutorialCallout.tsx` | Medium | New component, uses existing patterns |
| `TutorialWrapper.tsx` | Medium | Orchestration component |
| BidUI tutorial mode | Low | Add `allowedActions` prop |
| Dice roll override | Low | Conditional in existing `rollDice()` |

**Estimated new code:** ~400-600 lines (not including tutorial script content)

---

## Alternatives Considered

| Approach | Verdict | Reason |
|----------|---------|--------|
| XState for state machine | Rejected | Overkill; paradigm mismatch with Zustand |
| react-joyride for tours | Rejected | Wrong tool; can't control game state |
| driver.js for highlighting | Rejected | Style mismatch; limited scripting |
| Floating UI for tooltips | Rejected | Framer Motion conflict; unnecessary |
| seedrandom for dice | Rejected | Overkill for fixed arrays |
| Separate tutorial game mode | Accepted | Clean separation from main game |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Callout positioning edge cases | Medium | Test on mobile/various screen sizes |
| Tutorial state desync | Low | Single source of truth in tutorialStore |
| Performance with overlay | Low | Framer Motion is already optimized |

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|------------|-----------|
| No new dependencies needed | HIGH | Verified existing patterns in gauntletStore.ts, gameLogic.ts |
| Zustand pattern applicability | HIGH | gauntletStore.ts proves the pattern works for screen states |
| Framer Motion for callouts | HIGH | DudoOverlay, VictoryScreen use same AnimatePresence pattern |
| XState rejection | HIGH | Multiple sources confirm Zustand is preferred for simpler needs |
| Tour library rejection | MEDIUM | Based on requirement analysis; no direct comparison tested |

---

## Sources

### State Management
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Official repository, v5.0.10
- [Zustand Flux-inspired practice](https://zustand.docs.pmnd.rs/guides/flux-inspired-practice) - Reducer patterns
- [State Management Trends 2025](https://makersden.io/blog/react-state-management-in-2025) - Zustand vs XState comparison
- [XState vs Zustand](https://stackshare.io/stackups/xstate-vs-zustand) - Core philosophy differences

### Animation & UI
- [Framer Motion Tooltip Tutorial](https://sinja.io/blog/animated-tooltip-with-react-framer-motion) - Positioning challenges with Floating UI
- [Ariakit Tooltip with Framer Motion](https://ariakit.org/examples/tooltip-framer-motion) - Integration example
- [Radix + Motion](https://motion.dev/docs/radix) - AnimatePresence patterns

### Tour Libraries (evaluated and rejected)
- [React Joyride GitHub](https://github.com/gilbarbara/react-joyride) - Feature reference
- [React Onboarding Libraries Comparison 2026](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) - Comparison data
- [Best React Product Tour Libraries 2026](https://whatfix.com/blog/react-onboarding-tour/) - Use case analysis

### Seeded Randomness (evaluated and rejected)
- [seedrandom GitHub](https://github.com/davidbau/seedrandom) - Feature reference
- [Prando GitHub](https://github.com/zeh/prando) - Alternative for games
