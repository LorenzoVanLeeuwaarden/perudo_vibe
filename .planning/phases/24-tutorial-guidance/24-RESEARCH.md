# Phase 24: Tutorial Guidance - Research

**Researched:** 2026-01-22
**Domain:** Interactive tutorial tooltips, action constraints, and visual cues
**Confidence:** HIGH

## Summary

Phase 24 adds the guidance layer to Phase 23's tutorial skeleton: tooltips with arrow pointers, action constraints with disabled-state explanations, and visual cues (dice highlighting, pulsing elements). The project already has Framer Motion (v11.15) which provides all needed animation capabilities. No new dependencies required.

The key insight: this is NOT a generic product tour (react-joyride would be wrong). Tutorial tooltips must be tightly coupled to game state, positioned adjacent to game elements, and dismiss via simple click-anywhere pattern. The existing Dice component already supports `highlighted` prop for selection state—reuse that exact visual style for tutorial highlighting.

**Primary recommendation:** Build custom tooltip components using Framer Motion for animations and manual positioning logic. Use wrapper `<div>` pattern with `aria-disabled` for disabled button tooltips. Highlight dice by passing `highlighted={true}` to existing Dice component.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Framer Motion | ^11.15.0 | Tooltip animations, element highlighting | Already powering all game animations; AnimatePresence for enter/exit |
| React 19 | ^19.0.0 | Tooltip component rendering | Existing framework |
| Tailwind CSS | ^4.0.0 | Tooltip styling, glow effects | Existing styling system; built-in `animate-pulse` |
| Lucide React | ^0.468.0 | Arrow icons for pointers | Already in use; ArrowDown, ArrowUp, etc. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS `filter: drop-shadow()` | native | Glow/pulse effects | Player-color glows on highlighted elements |
| ARIA attributes | native | Accessibility for disabled states | `aria-disabled="true"` for focusable disabled buttons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual positioning | Floating UI (@floating-ui/react) | Floating UI adds 20KB for auto-positioning; tutorial tooltips have fixed positions |
| Custom tooltips | React Joyride | Tour libraries can't control game state; style mismatch with retro theme |
| Generic product tour | OnboardJS / Reactour | Built for SaaS tours, not interactive game tutorials |
| Wrapper divs | Radix UI Tooltip | Radix adds complexity; simple wrapper pattern sufficient |

**Installation:**
```bash
# No new dependencies required
# All libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    tutorial/
      TutorialTooltip.tsx        # NEW: Tooltip with arrow pointer
      TutorialOverlay.tsx        # NEW: Click-to-dismiss backdrop
      TutorialGameplay.tsx       # MODIFY: Add tooltip logic
  lib/
    tutorial/
      script.ts                  # MODIFY: Add tooltip content
      types.ts                   # MODIFY: Add tooltip/guidance types
```

### Pattern 1: Custom Tooltip with Arrow Pointer
**What:** Framer Motion `motion.div` positioned adjacent to target, arrow using Lucide icons or CSS triangle
**When to use:** Every tutorial explanation moment (dice, buttons, bid display)
**Example:**
```typescript
// Custom pattern - no external library needed
interface TutorialTooltipProps {
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetRef: React.RefObject<HTMLElement>;
  playerColor: PlayerColor;
  onDismiss: () => void;
}

export function TutorialTooltip({ content, position, targetRef, playerColor, onDismiss }: TutorialTooltipProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      // Position based on position prop
      if (position === 'bottom') {
        setCoords({
          top: rect.bottom + 12,
          left: rect.left + rect.width / 2,
        });
      }
      // ... other positions
    }
  }, [targetRef, position]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[100] max-w-xs"
      style={{
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Arrow pointer */}
      {position === 'bottom' && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent"
          style={{
            borderBottomColor: PLAYER_COLORS[playerColor].border,
          }}
        />
      )}

      {/* Tooltip body */}
      <div
        className="rounded-lg p-4 text-sm text-white-soft shadow-2xl"
        style={{
          background: 'rgba(13, 4, 22, 0.95)',
          border: `2px solid ${PLAYER_COLORS[playerColor].border}`,
          boxShadow: `0 0 20px ${PLAYER_COLORS[playerColor].glow}`,
        }}
      >
        {content}
      </div>
    </motion.div>
  );
}
```

### Pattern 2: Click-Anywhere-to-Dismiss Overlay
**What:** Transparent full-screen div with `onClick` handler that dismisses tooltip
**When to use:** Key concept tooltips that require user acknowledgment
**Example:**
```typescript
// Light dismiss pattern - standard UX
export function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99] cursor-pointer"
      onClick={onDismiss}
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    />
  );
}

// Usage in TutorialGameplay:
{showTooltip && (
  <>
    <TutorialOverlay onDismiss={() => setShowTooltip(false)} />
    <TutorialTooltip {...tooltipProps} />
  </>
)}
```

### Pattern 3: Disabled Button Wrapper with Tooltip
**What:** Wrapper `<div>` with `tabindex="0"` for accessibility, tooltip on hover/focus
**When to use:** When bid/dudo buttons are disabled during constrained tutorial steps
**Example:**
```typescript
// Accessibility-compliant disabled state with tooltip
// Source: https://css-tricks.com/making-disabled-buttons-more-inclusive/

interface DisabledButtonWrapperProps {
  children: React.ReactNode;
  tooltipText: string;
  playerColor: PlayerColor;
}

export function DisabledButtonWrapper({ children, tooltipText, playerColor }: DisabledButtonWrapperProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block"
      tabIndex={0}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      aria-label={tooltipText}
    >
      {children}

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded text-xs text-white-soft whitespace-nowrap pointer-events-none"
            style={{
              background: 'rgba(13, 4, 22, 0.95)',
              border: `1px solid ${PLAYER_COLORS[playerColor].border}`,
            }}
          >
            {tooltipText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Usage in BidUI (tutorial mode):
{requiredAction.type !== 'dudo' && currentBid && (
  <DisabledButtonWrapper
    tooltipText="First, let's learn basic bidding"
    playerColor={playerColor}
  >
    <motion.button
      disabled
      className="retro-button retro-button-danger opacity-50 cursor-not-allowed"
    >
      DUDO!
    </motion.button>
  </DisabledButtonWrapper>
)}
```

### Pattern 4: Pulsing Glow Highlight on Correct Action
**What:** Combine Tailwind `animate-pulse` with player-color glow filter
**When to use:** Highlight the ONE button user should click
**Example:**
```typescript
// Existing Dice component already supports highlighted prop
// For buttons, add similar pulsing glow:

<motion.button
  className="retro-button retro-button-orange"
  animate={{
    filter: [
      `drop-shadow(0 0 10px ${PLAYER_COLORS[playerColor].glow})`,
      `drop-shadow(0 0 25px ${PLAYER_COLORS[playerColor].glow})`,
      `drop-shadow(0 0 10px ${PLAYER_COLORS[playerColor].glow})`,
    ],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
  BID
</motion.button>

// Arrow pointer positioned next to button:
<motion.div
  className="absolute -right-12 top-1/2 -translate-y-1/2"
  animate={{
    x: [0, 8, 0],
  }}
  transition={{
    duration: 1,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
  <ArrowLeft className="w-8 h-8" style={{ color: PLAYER_COLORS[playerColor].glow }} />
</motion.div>
```

### Pattern 5: Dice Highlighting via Existing Component
**What:** Reuse Dice component's `highlighted` prop for tutorial focus
**When to use:** When explaining specific dice (e.g., "You have two 3s")
**Example:**
```typescript
// Source: Existing Dice.tsx component already has highlighted prop
// Phase 23 research confirmed this pattern

// In TutorialGameplay, determine which dice to highlight:
const isDieHighlighted = (dieValue: number, index: number): boolean => {
  if (!scriptStep.highlightDice) return false;

  // Example: Highlight all dice matching bid value
  if (scriptStep.highlightDice.type === 'matching-value') {
    return dieValue === scriptStep.highlightDice.value;
  }

  // Example: Highlight jokers when explaining wilds
  if (scriptStep.highlightDice.type === 'jokers') {
    return dieValue === 1;
  }

  return false;
};

// Pass to SortedDiceDisplay or Dice directly:
<SortedDiceDisplay
  dice={playerHand}
  color={playerColor}
  size="lg"
  highlightedIndices={playerHand
    .map((val, i) => isDieHighlighted(val, i) ? i : -1)
    .filter(i => i !== -1)
  }
/>
```

### Pattern 6: Auto-Advance vs Click-to-Continue
**What:** Use `setTimeout` for auto-advance, overlay click for key concepts
**When to use:** Auto-advance for flow (AI turns), click-to-continue for teaching moments
**Example:**
```typescript
// From CONTEXT.md decision: "Mixed approach"

// Auto-advance for observation steps (AI makes move):
useEffect(() => {
  if (scriptStep.autoAdvance && scriptStep.autoAdvance.delay) {
    const timer = setTimeout(() => {
      advanceStep();
    }, scriptStep.autoAdvance.delay);
    return () => clearTimeout(timer);
  }
}, [scriptStep]);

// Click-to-continue for teaching moments:
const handleTooltipDismiss = () => {
  setShowTooltip(false);
  advanceStep();
};

<TutorialOverlay onDismiss={handleTooltipDismiss} />
```

### Anti-Patterns to Avoid
- **Using Floating UI for static positions:** Tutorial tooltips have predetermined positions adjacent to game elements. Don't add 20KB dependency for auto-positioning.
- **Truly disabled buttons:** `disabled` attribute removes focus, breaking accessibility. Use `aria-disabled` with wrapper pattern instead.
- **Generic tooltip libraries:** Radix/Tippy designed for hover tooltips, not game-state-coupled explanations.
- **Dimming non-highlighted elements:** Context decision says "non-highlighted dice stay at normal visibility (not dimmed)".
- **Complex arrow positioning math:** Use CSS triangles via borders or simple Lucide icons. Don't over-engineer.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip enter/exit animations | Custom CSS transitions | Framer Motion `AnimatePresence` | Handles mount/unmount timing, cleanup |
| Pulse/glow animations | `@keyframes` CSS | Framer Motion `animate` prop | Syncs with React state, easier to customize |
| Click-outside detection | Custom event listeners | Transparent overlay with `onClick` | Simpler, works on mobile tap |
| Dice highlighting logic | New component | Existing `Dice` `highlighted` prop | Already styled with player-color glow |
| Arrow pointers | SVG paths | CSS border triangles or Lucide icons | 2 lines of CSS vs complex SVG math |

**Key insight:** Framer Motion handles 90% of animation needs. Existing Dice component has highlighting built-in. Tutorial guidance is orchestration, not new components.

## Common Pitfalls

### Pitfall 1: Tooltip Positioning on Scroll/Resize
**What goes wrong:** Tooltip points to wrong location after user scrolls or resizes window
**Why it happens:** Tooltip positioned once on mount, doesn't update
**How to avoid:** Use `position: fixed` with viewport coordinates, or update position in `useEffect` with window resize listener
**Warning signs:** Arrow points to empty space, tooltip misaligned

### Pitfall 2: Disabled Button Loses Focus
**What goes wrong:** Keyboard users can't tab to disabled button to read tooltip
**Why it happens:** `disabled` attribute removes element from tab order
**How to avoid:** Use wrapper `<div>` with `tabindex="0"` and `aria-disabled` on button
**Warning signs:** Screen reader users report button is "missing"

### Pitfall 3: Tooltip z-index Below Game Elements
**What goes wrong:** Tooltip appears behind dice or bid UI
**Why it happens:** Game elements have high z-index for stacking animations
**How to avoid:** Tooltip and overlay should be `z-[99]` and `z-[100]`, above all game elements
**Warning signs:** Tooltip text cut off, arrow invisible

### Pitfall 4: Mobile Tap-Through on Overlay
**What goes wrong:** User taps overlay to dismiss tooltip, tap also triggers button underneath
**Why it happens:** Click event propagates to elements below overlay
**How to avoid:** Overlay `onClick` should call `e.stopPropagation()`
**Warning signs:** Dismissing tooltip makes unexpected bid

### Pitfall 5: Highlighting Wrong Dice After Sort
**What goes wrong:** Tutorial says "you have two 3s" but highlights wrong indices
**Why it happens:** Dice get sorted by value, but highlighting logic uses original indices
**How to avoid:** Highlight by value match, not by index: `dice.map((val, i) => val === 3 && highlighted)`
**Warning signs:** Highlighted dice don't match tooltip text

### Pitfall 6: Auto-Advance Races with User Click
**What goes wrong:** User clicks to dismiss tooltip at same time as auto-advance timer fires; step skips ahead 2 steps
**Why it happens:** Both actions call `advanceStep()` without debouncing
**How to avoid:** Clear auto-advance timer in tooltip dismiss handler, or use state flag to prevent double-advance
**Warning signs:** Tutorial jumps from step 2 to step 4

## Code Examples

Verified patterns from existing codebase and research:

### Tutorial Script with Tooltip Content
```typescript
// Add tooltip/guidance to each step in script.ts
interface TutorialStep {
  id: string;
  playerDice: number[];
  opponentDice: number[][];
  requiredAction: TutorialAction;

  // NEW: Guidance data
  tooltip?: {
    content: string;           // "Let's see what you rolled!"
    position: 'top' | 'bottom' | 'left' | 'right';
    targetElement: 'player-dice' | 'bid-button' | 'dudo-button' | 'bid-ui';
    dismissMode: 'click' | 'auto';  // Click-to-continue or auto-advance
    autoAdvanceDelay?: number;       // ms if auto mode
  };

  highlightDice?: {
    type: 'matching-value' | 'jokers' | 'all';
    value?: number;  // For matching-value type
    targets?: ('player' | 0 | 1)[];  // Which hands to highlight (god mode)
  };

  highlightButton?: 'bid' | 'dudo';  // Add pulsing glow to correct action

  scriptedAIMoves?: ScriptedAIMove[];
  currentBid?: Bid | null;
  lastBidder?: 'player' | 0 | 1;
}

// Example step with guidance:
{
  id: 'first-bid',
  playerDice: [3, 3, 5, 2, 6],
  opponentDice: [[4, 4, 2, 6, 2], [5, 5, 3, 3, 4]],
  requiredAction: { type: 'bid', bid: { count: 3, value: 3 } },
  tooltip: {
    content: "You have two 3s! Let's bid 3x threes to start.",
    position: 'bottom',
    targetElement: 'player-dice',
    dismissMode: 'click',
  },
  highlightDice: {
    type: 'matching-value',
    value: 3,
    targets: ['player'],
  },
  highlightButton: 'bid',
}
```

### Conditional BidUI Rendering (Tutorial Mode)
```typescript
// In TutorialGameplay.tsx:
const isBidAllowed = scriptStep.requiredAction.type === 'bid';
const isDudoAllowed = scriptStep.requiredAction.type === 'dudo';

{/* BID button - always rendered, but may be disabled */}
{isBidAllowed ? (
  <motion.button
    onClick={handleBid}
    className="retro-button retro-button-orange"
    animate={scriptStep.highlightButton === 'bid' ? pulseAnimation : {}}
  >
    <Send className="w-5 h-5" />
    BID
  </motion.button>
) : (
  <DisabledButtonWrapper
    tooltipText="First, let's learn basic bidding"
    playerColor={playerColor}
  >
    <button
      aria-disabled="true"
      className="retro-button retro-button-orange opacity-50 cursor-not-allowed"
      onClick={(e) => e.preventDefault()}
    >
      <Send className="w-5 h-5" />
      BID
    </button>
  </DisabledButtonWrapper>
)}

{/* DUDO button - similar pattern */}
{currentBid && (
  isDudoAllowed ? (
    <motion.button
      onClick={handleDudo}
      className="retro-button retro-button-danger"
      animate={scriptStep.highlightButton === 'dudo' ? pulseAnimation : {}}
    >
      <AlertTriangle className="w-4 h-4" />
      DUDO!
    </motion.button>
  ) : (
    <DisabledButtonWrapper
      tooltipText="Not yet! Watch what happens first."
      playerColor={playerColor}
    >
      <button
        aria-disabled="true"
        className="retro-button retro-button-danger opacity-50 cursor-not-allowed"
        onClick={(e) => e.preventDefault()}
      >
        <AlertTriangle className="w-4 h-4" />
        DUDO!
      </button>
    </DisabledButtonWrapper>
  )
)}
```

### Dice Highlighting in SortedDiceDisplay
```typescript
// In TutorialGameplay.tsx, pass highlighted indices to display:
const getHighlightedIndices = useCallback((): number[] => {
  if (!scriptStep.highlightDice) return [];

  const { type, value, targets } = scriptStep.highlightDice;

  // Only highlight player's dice if targets include 'player'
  if (!targets?.includes('player')) return [];

  if (type === 'matching-value' && value) {
    return playerHand
      .map((dieValue, index) => dieValue === value ? index : -1)
      .filter(i => i !== -1);
  }

  if (type === 'jokers') {
    return playerHand
      .map((dieValue, index) => dieValue === 1 ? index : -1)
      .filter(i => i !== -1);
  }

  if (type === 'all') {
    return playerHand.map((_, i) => i);
  }

  return [];
}, [scriptStep, playerHand]);

// Render with highlighting:
<SortedDiceDisplay
  dice={playerHand}
  color={playerColor}
  size="lg"
  highlightedIndices={getHighlightedIndices()}
  animateSort={true}
/>
```

### God Mode Opponent Highlighting
```typescript
// Highlight opponent dice (e.g., when explaining jokers across all hands):
{opponents.map((opponent, oppIndex) => {
  const oppHighlightedIndices = (() => {
    if (!scriptStep.highlightDice) return [];
    if (!scriptStep.highlightDice.targets?.includes(oppIndex as 0 | 1)) return [];

    const { type, value } = scriptStep.highlightDice;

    if (type === 'matching-value' && value) {
      return opponent.hand
        .map((dieValue, index) => dieValue === value ? index : -1)
        .filter(i => i !== -1);
    }

    if (type === 'jokers') {
      return opponent.hand
        .map((dieValue, index) => dieValue === 1 ? index : -1)
        .filter(i => i !== -1);
    }

    return [];
  })();

  return (
    <div key={opponent.id} className="flex flex-col items-center">
      <span className="text-white-soft/60 text-xs mb-1">{opponent.name}</span>
      <div className="flex gap-1.5">
        {opponent.hand.map((value, i) => (
          <Dice
            key={i}
            value={value}
            index={i}
            size="sm"
            color={opponent.color}
            hidden={false} // God mode - all visible
            highlighted={oppHighlightedIndices.includes(i)}
          />
        ))}
      </div>
    </div>
  );
})}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Floating UI for all tooltips | Manual positioning for static elements | 2026 best practice | 20KB saved; simpler code |
| `disabled` attribute | `aria-disabled` with wrapper | WCAG 2.1 requirement | Keyboard accessibility maintained |
| Dim non-focused elements | Keep normal visibility | Modern onboarding UX | Less cognitive overload |
| Text-heavy explanations | 1-2 sentence inline tooltips | Product tour research | Higher completion rates |
| Auto-advance everything | Mixed auto/click-to-continue | User testing consensus | Balances pacing with control |

**Deprecated/outdated:**
- **react-joyride, driver.js:** Generic product tours can't control game state; style mismatch
- **Tooltip libraries (Radix, Tippy):** Built for hover tooltips, not game-coupled guidance
- **Complex arrow positioning logic:** CSS triangles are 2 lines, work everywhere

## Open Questions

Things that couldn't be fully resolved:

1. **Exact tooltip arrow positioning per element**
   - What we know: CSS triangle borders or Lucide arrow icons both work
   - What's unclear: Which looks better with retro theme?
   - Recommendation: Start with CSS triangles (simpler), switch to icons if arrows need animation

2. **Which steps count as "key concepts" vs auto-advance**
   - What we know: Context says "after rules explanations AND after reveal outcomes"
   - What's unclear: Should ALL rules explanations require click, or just core ones?
   - Recommendation: Click-to-continue for: initial rules, first bid explanation, reveal outcome. Auto-advance for: AI turns, repeated actions.

3. **Glow color intensity for highlights**
   - What we know: Existing Dice highlighted style uses player color glow
   - What's unclear: Should tutorial glow be MORE intense than regular game highlight?
   - Recommendation: Use same intensity (consistency), but add pulsing animation to draw attention

4. **Mobile tooltip positioning edge cases**
   - What we know: Tooltips must fit on mobile viewports
   - What's unclear: What if tooltip + arrow doesn't fit above/below target on small screen?
   - Recommendation: Phase 24 focuses on desktop; test mobile in verification, adjust positioning logic if needed

## Sources

### Primary (HIGH confidence)
- [Framer Motion official docs](https://www.framer.com/motion/) - AnimatePresence, animate prop patterns
- [Making Disabled Buttons More Inclusive | CSS-Tricks](https://css-tricks.com/making-disabled-buttons-more-inclusive/) - aria-disabled wrapper pattern
- [WCAG 1.4.13 Content on Hover or Focus](https://www.wcag.com/authors/1-4-13-content-on-hover-or-focus/) - Tooltip accessibility requirements
- Existing codebase:
  - `/src/components/Dice.tsx` - `highlighted` prop implementation (lines 123, 228-229)
  - `/src/components/BidUI.tsx` - Button structure and styling
  - `package.json` - Framer Motion v11.15.0 already installed

### Secondary (MEDIUM confidence)
- [Tooltip Best Practices | Userpilot](https://userpilot.com/blog/tooltip-best-practices/) - Click-to-dismiss patterns
- [Product Tour Best Practices | Thinkific](https://www.thinkific.com/blog/product-tour-best-practices/) - Auto-advance vs user control pacing
- [React Animation Libraries 2026 | Syncfusion](https://www.syncfusion.com/blogs/post/top-react-animation-libraries) - Framer Motion as de-facto standard
- [Tailwind CSS Animations](https://tailwindcss.com/docs/animation) - Built-in pulse animation

### Tertiary (LOW confidence)
- [5 Best React Onboarding Libraries | OnboardJS](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) - React Joyride comparison (not recommended for this use case)
- [Floating UI Tutorial](https://floating-ui.com/docs/tutorial) - Auto-positioning library (not needed for static positions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Framer Motion already installed, proven animation capabilities
- Architecture: HIGH - Custom tooltips with manual positioning is correct approach for game-state-coupled guidance
- Pitfalls: HIGH - Disabled button accessibility well-documented, z-index issues common and solvable

**Research date:** 2026-01-22
**Valid until:** 30 days (Framer Motion stable, but tutorial UX best practices evolve)
