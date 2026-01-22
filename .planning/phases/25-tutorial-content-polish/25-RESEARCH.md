# Phase 25: Tutorial Content & Polish - Research

**Researched:** 2026-01-22
**Domain:** Tutorial content expansion (wild ones, Calza), completion celebration, UX polish
**Confidence:** HIGH

## Summary

Phase 25 completes the tutorial by expanding the content to cover all core Perudo rules (wild ones, Calza) and adding completion celebration with confetti. The infrastructure from Phase 23-24 (scripted gameplay, tooltips, highlighting) is already in place - this phase focuses on content authoring and the celebration effect.

Key insight: The existing tutorial script (9 steps) teaches bidding and Dudo but does NOT teach wild ones or Calza. Per CONTEXT.md decisions, the teaching order is Bid -> Dudo -> Ones -> Calza (linear progression). The current script ends after the first Dudo reveal - new steps must be added to teach the remaining concepts.

For confetti, the project already has a custom particle system in VictoryScreen. The CONTEXT.md decision specifies "canvas-confetti style" which suggests using the established canvas-confetti library (6KB) rather than extending the existing VictoryScreen particle system - the tutorial completion celebration should be lighter and shorter (2-second auto-return).

**Primary recommendation:** Add 4-6 new tutorial steps teaching wild ones and Calza, then integrate canvas-confetti for a simple burst on the TutorialComplete screen with 2-second auto-return to main menu.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Framer Motion | ^11.15.0 | Tooltip animations, transitions | Already powering tutorial guidance |
| Zustand | ^5.0.10 | Tutorial state (currentStep, screen) | Already managing tutorialStore |
| Tailwind CSS | ^4.0.0 | Component styling | Existing styling system |

### New Addition
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| canvas-confetti | ^1.9.4 | Completion celebration burst | Single burst on tutorial completion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| canvas-confetti | Extend VictoryScreen particle system | VictoryScreen is heavy (8-10s celebration); tutorial needs 2s burst |
| canvas-confetti | react-confetti | canvas-confetti is simpler, no React wrapper needed for one-shot |
| canvas-confetti | Framer Motion particles | Manual physics; canvas-confetti is proven and lightweight |
| New content steps | Tooltip overlays only | Content steps allow teaching concepts with actual gameplay, not just text |

**Installation:**
```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    tutorial/
      TutorialComplete.tsx     # MODIFY: Add confetti burst, auto-return
      TutorialGameplay.tsx     # MODIFY: Update step handling if needed
      TutorialScreen.tsx       # MODIFY: Handle auto-return after completion
  lib/
    tutorial/
      script.ts                # MODIFY: Add steps for wild ones, Calza
      types.ts                 # VERIFY: Types support new content
  stores/
    tutorialStore.ts           # MODIFY: Update totalSteps to match new script
```

### Pattern 1: Tutorial Content Expansion (Ones and Calza)

**What:** Add new scripted steps that teach wild ones (ones count as any value) and Calza (exact match challenge)

**When to use:** After the current Dudo teaching sequence

**Current script flow (9 steps):**
1. roll-dice: Welcome, game overview
2. first-bid: Player bids 3x threes (has two 3s)
3. explain-turns: Turn passing and bid rules
4. alex-bids: Alex bids 4x fours
5. explain-alex-bid: Explain Alex's reasoning
6. sam-bids: Sam bids 5x fives
7. explain-dudo: Introduce Dudo concept
8. player-dudo: Player calls Dudo on Sam
9. reveal: Show Dudo resolution (player wins)

**New steps to add (ones teaching):**
```typescript
// After reveal, start a new round with dice that show wild ones
{
  id: 'ones-intro',
  playerDice: [1, 1, 5, 5, 3],  // Two 1s and two 5s
  opponentDice: [
    [3, 3, 1, 6, 2],  // Alex: one 1
    [5, 4, 4, 2, 6],  // Sam: no 1s
  ],
  requiredAction: { type: 'wait' },
  currentBid: null,
  tooltip: {
    content: "New round! Notice the 1s in your hand - they're wild! Ones count as ANY face value. Your two 1s can be fives, threes, or whatever you need.",
    position: 'top',
    targetElement: 'player-dice',
    dismissMode: 'click',
  },
  highlightDice: { type: 'jokers', targets: ['player'] },
},

{
  id: 'ones-bid',
  playerDice: [1, 1, 5, 5, 3],
  opponentDice: [
    [3, 3, 1, 6, 2],
    [5, 4, 4, 2, 6],
  ],
  requiredAction: { type: 'bid', bid: { count: 5, value: 5 } },
  currentBid: null,
  tooltip: {
    content: "You have two 5s PLUS two wild 1s = four 5s! Sam has one more 5. Let's bid 5x fives - you're confident there are at least five 5s total.",
    position: 'top',
    targetElement: 'bid-button',
    dismissMode: 'click',
  },
  highlightDice: { type: 'matching-value', value: 5, targets: ['player', 1] },
  highlightButton: 'bid',
},
```

**New steps to add (Calza teaching):**
```typescript
{
  id: 'calza-intro',
  playerDice: [4, 4, 2, 6, 3],
  opponentDice: [
    [4, 1, 5, 5, 2],  // Alex: one 4 + one wild 1 = two 4s
    [3, 3, 6, 6, 1],  // Sam: one wild 1 = one 4
  ],
  requiredAction: { type: 'wait' },
  currentBid: { count: 5, value: 4 },
  lastBidder: 1, // Sam
  tooltip: {
    content: "There's also CALZA - you can call it when you think the bid is EXACTLY right (not too high, not too low). If correct, you gain a die! But if wrong, you lose one.",
    position: 'bottom',
    targetElement: 'bid-display',
    dismissMode: 'click',
  },
},

{
  id: 'calza-call',
  playerDice: [4, 4, 2, 6, 3],
  opponentDice: [
    [4, 1, 5, 5, 2],
    [3, 3, 6, 6, 1],
  ],
  requiredAction: { type: 'calza' },
  currentBid: { count: 5, value: 4 },
  lastBidder: 1,
  tooltip: {
    content: "Count the 4s: You have 2, Alex has 2 (one 4 + wild 1), Sam has 1 (wild 1). That's exactly 5! Call CALZA!",
    position: 'top',
    targetElement: 'calza-button',  // New target element needed
    dismissMode: 'click',
  },
  highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
  highlightButton: 'calza',  // New highlight type needed
},
```

### Pattern 2: Calza Button in TutorialBidPanel

**What:** Add Calza button to the constrained tutorial bid panel
**When to use:** When teaching the Calza concept

**Example:**
```typescript
// In TutorialBidPanel, add Calza button when currentBid exists
{currentBid && (
  isCalzaAction ? (
    <motion.button
      onClick={onCalza}
      className="w-full retro-button retro-button-success flex items-center justify-center gap-1"
      animate={shouldPulseCalza ? pulseAnimation : undefined}
    >
      <Target className="w-4 h-4" />
      CALZA!
    </motion.button>
  ) : (
    <DisabledButtonWrapper
      tooltipText="Calza is for exact matches only"
      playerColor={playerColor}
    >
      <button
        aria-disabled="true"
        className="w-full retro-button retro-button-success opacity-50 cursor-not-allowed"
      >
        <Target className="w-4 h-4" />
        CALZA!
      </button>
    </DisabledButtonWrapper>
  )
)}
```

### Pattern 3: Confetti Celebration on Completion

**What:** Use canvas-confetti for a celebratory burst when tutorial completes
**When to use:** TutorialComplete screen mount

**Example:**
```typescript
// Source: https://www.npmjs.com/package/canvas-confetti
import confetti from 'canvas-confetti';

export function TutorialComplete({ playerColor, onExit }: TutorialCompleteProps) {
  const colorConfig = PLAYER_COLORS[playerColor];

  // Fire confetti on mount
  useEffect(() => {
    // Burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [colorConfig.bg, colorConfig.glow, '#ffd700', '#ffffff'],
      disableForReducedMotion: true,
    });

    // Side cannons for extra celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [colorConfig.bg, colorConfig.glow, '#ffd700'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [colorConfig.bg, colorConfig.glow, '#ffd700'],
      });
    }, 200);
  }, [colorConfig]);

  // Auto-return to main menu after 2 seconds (per CONTEXT.md)
  useEffect(() => {
    const timer = setTimeout(() => {
      onExit();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onExit]);

  return (
    // ... simplified completion card
  );
}
```

### Pattern 4: Auto-Return to Main Menu

**What:** Automatically return to main menu 2 seconds after completion celebration
**When to use:** Per CONTEXT.md: "Auto-return to main menu after 2 seconds. No manual button needed."

**Example:**
```typescript
// In TutorialComplete
useEffect(() => {
  const timer = setTimeout(() => {
    onExit();
  }, 2000);
  return () => clearTimeout(timer);
}, [onExit]);

// Remove the action button, keep only the celebration message
return (
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colorConfig.shadow} 100%)`,
          boxShadow: `0 0 30px ${colorConfig.glow}`,
        }}
      >
        <CheckCircle className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title - per CONTEXT.md */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-white-soft mb-3"
      >
        You&apos;re ready to play!
      </motion.h1>
    </motion.div>
  </div>
);
```

### Pattern 5: Content Tone (Per CONTEXT.md)

**What:** Use playful, encouraging tone with direct "you" voice
**When to use:** All tooltip content

**Example content patterns:**
```typescript
// Playful & encouraging
"You're getting the hang of this!"
"Nice bid! You're a natural."
"Great call! Sam was bluffing."

// Direct 'you' voice
"You have two 3s in your hand"
"Your wild 1s can count as fives"
"You figured out Sam was lying"

// Brief (1-2 sentences)
"Ones are wild! They count as any face value."
"When you think a bid is exactly right, call Calza to earn a die."

// AI personality (per Phase 23 patterns)
"Alex plays it safe with a small raise."
"Sam's getting bold with that bid..."
```

### Anti-Patterns to Avoid

- **Over-explaining:** Keep tooltips to 1-2 sentences. Don't write paragraphs.
- **Manual completion button:** CONTEXT.md says auto-return, no button needed.
- **Heavy VictoryScreen celebration:** Tutorial completion is lighter - one confetti burst, 2 seconds.
- **Skip button:** CONTEXT.md explicitly says "No skip button - tutorial is short."
- **Progress indicator:** CONTEXT.md says "No progress indicator - minimal UI."
- **Jokers in current script:** Phase 23 script has no jokers for clearer counting. Phase 25 adds ones teaching as separate steps.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti animation | Custom SVG particles | canvas-confetti | 6KB, proven, accessibility support |
| Tutorial completion persistence | Custom storage | Existing localStorage (tutorial_completed) | Already implemented in tutorialStore |
| Dice highlighting for wild ones | New component | Existing highlightDice with type: 'jokers' | Type already exists in TutorialStep |
| Calza button styling | New button style | Existing retro-button-success class | May need to add if not exists |
| Auto-return timing | Manual onClick | setTimeout with cleanup | Simpler, matches CONTEXT.md |

**Key insight:** Most infrastructure exists. Phase 25 is primarily content authoring (script steps) and one small celebration effect.

## Common Pitfalls

### Pitfall 1: Wild Ones Counting Confusion
**What goes wrong:** User doesn't understand that 1s count for the BID value, not as "1s"
**Why it happens:** Tooltip just says "ones are wild" without concrete example
**How to avoid:** Show explicit counting: "You have two 1s + two 5s = four 5s total"
**Warning signs:** User tries to bid on 1s during wild ones teaching

### Pitfall 2: Calza Button Missing from BidPanel
**What goes wrong:** Script references 'calza' action but TutorialBidPanel doesn't have Calza button
**Why it happens:** Phase 24 TutorialBidPanel only has BID and DUDO buttons
**How to avoid:** Add Calza button to TutorialBidPanel with same pattern as Dudo
**Warning signs:** TypeError or button not showing when step requires calza action

### Pitfall 3: totalSteps Out of Sync
**What goes wrong:** tutorialStore.totalSteps doesn't match TUTORIAL_SCRIPT.steps.length
**Why it happens:** Added new steps to script but forgot to update store
**How to avoid:** Derive totalSteps from script length, or update both in same commit
**Warning signs:** Tutorial ends early or never reaches completion

### Pitfall 4: Confetti Fires Multiple Times
**What goes wrong:** Confetti burst repeats on re-renders
**Why it happens:** useEffect without proper cleanup or dependency issues
**How to avoid:** Fire confetti once on mount with empty dependency array, use ref to track fired state
**Warning signs:** Multiple confetti bursts during completion screen

### Pitfall 5: Auto-Return Races with Exit Button
**What goes wrong:** User clicks exit button at same time as auto-return timer fires
**Why it happens:** Both call onExit without debouncing
**How to avoid:** Clear timer on unmount, use ref to track if already exiting
**Warning signs:** Console errors about setState on unmounted component

### Pitfall 6: Wild Ones Highlight Shows Wrong Dice
**What goes wrong:** highlightDice: { type: 'jokers' } doesn't highlight 1s in opponents' hands
**Why it happens:** getOpponentHighlightValue check may not handle 'jokers' type
**How to avoid:** Verify getOpponentHighlightValue handles type: 'jokers' (returns value 1)
**Warning signs:** Only player's 1s highlight, not opponents'

## Code Examples

Verified patterns from existing codebase and official docs:

### New Tutorial Steps for Wild Ones
```typescript
// Add to TUTORIAL_SCRIPT.steps after the reveal step

// Step 9: Start new round for wild ones teaching
{
  id: 'round2-roll',
  playerDice: [1, 1, 5, 5, 3],
  opponentDice: [
    [3, 3, 1, 6, 2],
    [5, 4, 4, 2, 6],
  ],
  requiredAction: { type: 'wait' },
  currentBid: null,
  tooltip: {
    content: "New round! Notice the 1s - they're WILD! Ones count as any face value. Your two 1s can be 5s, 3s, whatever you need.",
    position: 'top',
    targetElement: 'player-dice',
    dismissMode: 'click',
  },
  highlightDice: { type: 'jokers', targets: ['player'] },
},

// Step 10: Player bids using wild ones
{
  id: 'wild-bid',
  playerDice: [1, 1, 5, 5, 3],
  opponentDice: [
    [3, 3, 1, 6, 2],
    [5, 4, 4, 2, 6],
  ],
  requiredAction: { type: 'bid', bid: { count: 5, value: 5 } },
  currentBid: null,
  tooltip: {
    content: "You have two 5s + two wild 1s = four 5s in your hand alone! Sam has one more. Bid 5x fives.",
    position: 'top',
    targetElement: 'bid-button',
    dismissMode: 'click',
  },
  highlightDice: { type: 'matching-value', value: 5, targets: ['player', 1] },
  highlightButton: 'bid',
},
```

### Calza Teaching Steps
```typescript
// Step N: Introduce Calza concept
{
  id: 'calza-intro',
  playerDice: [4, 4, 2, 6, 3],
  opponentDice: [
    [4, 1, 5, 5, 2],  // 1 four + 1 wild = 2 fours
    [3, 3, 6, 6, 1],  // 1 wild = 1 four
  ],
  requiredAction: { type: 'wait' },
  currentBid: { count: 5, value: 4 },
  lastBidder: 1,
  tooltip: {
    content: "One more trick: CALZA! Call it when you think the bid is EXACTLY right. Get it right and you gain a die. Get it wrong and you lose one.",
    position: 'bottom',
    targetElement: 'bid-display',
    dismissMode: 'click',
  },
},

// Step N+1: Player calls Calza
{
  id: 'calza-call',
  playerDice: [4, 4, 2, 6, 3],
  opponentDice: [
    [4, 1, 5, 5, 2],
    [3, 3, 6, 6, 1],
  ],
  requiredAction: { type: 'calza' },
  currentBid: { count: 5, value: 4 },
  lastBidder: 1,
  tooltip: {
    content: "Count all the 4s (including wilds): You=2, Alex=2, Sam=1. Exactly 5! Call CALZA!",
    position: 'top',
    targetElement: 'calza-button',
    dismissMode: 'click',
  },
  highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
  highlightButton: 'calza',
},
```

### Confetti Integration
```typescript
// In TutorialComplete.tsx
import confetti from 'canvas-confetti';

useEffect(() => {
  // Fire confetti burst on mount
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [colorConfig.bg, colorConfig.glow, '#ffd700', '#ffffff'],
    disableForReducedMotion: true, // Accessibility
  });
}, [colorConfig]);

// Auto-return after 2 seconds
useEffect(() => {
  const timer = setTimeout(onExit, 2000);
  return () => clearTimeout(timer);
}, [onExit]);
```

### Updated TutorialBidPanel with Calza
```typescript
// Add onCalza prop
interface TutorialBidPanelProps {
  // ... existing props
  onCalza: () => void;
}

// Add Calza button rendering
const isCalzaAction = scriptStep.requiredAction.type === 'calza';
const shouldPulseCalza = scriptStep.highlightButton === 'calza';

{currentBid && (
  // After DUDO button...
  isCalzaAction ? (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onCalza}
      className="w-full retro-button retro-button-success flex items-center justify-center gap-1"
      animate={shouldPulseCalza && !useSimplifiedAnimations ? pulseAnimation : undefined}
      transition={shouldPulseCalza && !useSimplifiedAnimations ? pulseTransition : undefined}
    >
      <Target className="w-4 h-4" />
      CALZA!
    </motion.button>
  ) : (
    <DisabledButtonWrapper tooltipText="Calza is for exact matches only" playerColor={playerColor}>
      <button
        aria-disabled="true"
        className="w-full retro-button retro-button-success opacity-50 cursor-not-allowed"
      >
        <Target className="w-4 h-4" />
        CALZA!
      </button>
    </DisabledButtonWrapper>
  )
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-confetti component | canvas-confetti direct | 2024-2025 | Simpler, no React wrapper needed for one-shot |
| Manual completion buttons | Auto-return timers | Modern UX patterns | Reduces friction, feels more polished |
| Long text explanations | 1-2 sentence tooltips | Mobile-first design | Better retention, less abandonment |
| Generic tutorial tone | Playful direct "you" voice | Game tutorial research | Higher engagement |

**Deprecated/outdated:**
- **react-confetti for simple bursts:** Overkill for single celebration effect
- **Manual "Continue" buttons after completion:** Auto-return is cleaner UX

## Open Questions

Things that couldn't be fully resolved:

1. **Exact step count for expanded tutorial**
   - What we know: Current = 9 steps. Need to add ones (2-3 steps) + Calza (2-3 steps)
   - What's unclear: Should there be a "round 2 reveal" step showing wild ones counting?
   - Recommendation: Add reveal step after ones bid to show the counting with wild ones

2. **Calza button styling**
   - What we know: Needs distinct visual from Bid and Dudo buttons
   - What's unclear: Does retro-button-success class exist? What color?
   - Recommendation: If not exists, create it with green/turquoise theme (matches existing Calza green in DudoOverlay)

3. **Wild ones visual during reveal**
   - What we know: Phase 23 script says "no jokers for clearer counting"
   - What's unclear: How to visually show wild ones counting AS the bid value during reveal?
   - Recommendation: Add tooltip or annotation during reveal: "The 1s count as 5s here!"

4. **Target element for Calza button**
   - What we know: tooltip.targetElement currently supports 5 targets
   - What's unclear: Need to add 'calza-button' as valid target
   - Recommendation: Update TutorialTooltipData type and getTooltipPosition function

## Sources

### Primary (HIGH confidence)
- Existing codebase:
  - `/src/lib/tutorial/script.ts` - Current 9-step tutorial script
  - `/src/lib/tutorial/types.ts` - TutorialStep, TutorialAction types
  - `/src/components/tutorial/TutorialGameplay.tsx` - Step handling, highlighting
  - `/src/components/tutorial/TutorialComplete.tsx` - Current completion screen
  - `/src/stores/tutorialStore.ts` - totalSteps = 9 currently
  - `/src/lib/gameLogic.ts` - countMatching function with wild ones logic
- [canvas-confetti npm](https://www.npmjs.com/package/canvas-confetti) - Official API documentation
- Phase 25 CONTEXT.md - User decisions on teaching order, celebration, tone

### Secondary (MEDIUM confidence)
- Phase 24 RESEARCH.md - Tooltip patterns, disabled button patterns
- VictoryScreen.tsx - Existing celebration implementation (not reused but referenced)
- DudoOverlay.tsx - Calza type handling (type: 'calza' already exists)

### Tertiary (LOW confidence)
- Tutorial completion UX best practices (WebSearch) - Auto-return timing

## Metadata

**Confidence breakdown:**
- Content expansion: HIGH - Script structure clear, just need to author new steps
- Confetti integration: HIGH - canvas-confetti is well-documented, simple API
- Calza teaching: MEDIUM - Need to add Calza button to TutorialBidPanel (minor addition)
- Auto-return: HIGH - Simple setTimeout pattern

**Research date:** 2026-01-22
**Valid until:** 30 days (content patterns stable)
