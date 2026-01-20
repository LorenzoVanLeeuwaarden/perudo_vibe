# Phase 17: Game UI Unification - Research

**Researched:** 2026-01-20
**Domain:** React component architecture, CSS styling, Framer Motion animations
**Confidence:** HIGH

## Summary

Phase 17 unifies the game UI styling between single-player (page.tsx) and multiplayer (GameBoard.tsx via RoomPageClient.tsx). Both modes already use the same core components (PlayerDiceBadge, BidUI, SortedDiceDisplay, Dice), but they render these components with different wrapper layouts and some visual discrepancies.

The codebase structure reveals that:
- **Shared components already exist:** PlayerDiceBadge, BidUI, Dice, SortedDiceDisplay, DudoOverlay, VictoryScreen are imported in both modes
- **Single-player has richer reveal phase:** Uses PlayerRevealCard with staged animations, bid/actual comparison UI
- **Multiplayer uses simpler reveal:** RevealPhase component with different layout and animation sequence
- **Core styling is shared:** globals.css defines `.retro-panel`, `.retro-button`, color variables used everywhere

**Primary recommendation:** Adopt single-player's visual patterns into multiplayer's GameBoard and RevealPhase components. Focus on layout alignment, animation timing, and ensuring both modes render game elements with identical styling.

## Current State Analysis

### Component Usage Comparison

| Component | Single-Player (page.tsx) | Multiplayer (GameBoard.tsx) | Status |
|-----------|--------------------------|----------------------------|--------|
| `PlayerDiceBadge` | Used for player chips at top | Used for player row | SHARED - needs props alignment |
| `BidUI` | Used with `hideBidDisplay={true}` | Used with default props | SHARED - props differ |
| `SortedDiceDisplay` | Used for player's dice at bottom | Used for "Your Dice" section | SHARED - identical |
| `Dice` | Used throughout | Used throughout | SHARED - identical |
| `RevealPhase` | NOT USED - custom reveal in page.tsx | Used as overlay component | DIFFERENT implementations |
| `PlayerRevealCard` | Used in single-player reveal | NOT USED in multiplayer | Single-player only |
| `DudoOverlay` | Used for "DUDO!"/"CALZA!" announcement | Used identically | SHARED - identical |
| `VictoryScreen` | Used for winner celebration | Used for winner celebration | SHARED - identical |

### Layout Differences

**Single-Player Bidding Phase:**
```
+------------------------------------------+
|          [PlayerDiceBadge row]           |  <- ZONE A: Top
+------------------------------------------+
|                                          |
|     [Current Bid Display - custom]       |  <- ZONE B: Middle
|            [BidUI controls]              |
|                                          |
+------------------------------------------+
|         [SortedDiceDisplay]              |  <- ZONE C: Bottom (player's dice)
+------------------------------------------+
```

**Multiplayer Bidding Phase:**
```
+------------------------------------------+
|          [PlayerDiceBadge row]           |  <- Top (similar to single-player)
+------------------------------------------+
|                                          |
|              [BidUI full]                |  <- Middle (BidUI shows bid display)
|         (includes bid display)           |
|                                          |
+------------------------------------------+
|           [Your Dice panel]              |  <- Bottom (panel-wrapped)
+------------------------------------------+
```

**Key Layout Differences:**
1. Single-player shows bid display separately from BidUI (via custom "recessed table surface")
2. Single-player has elaborate 3D floating animation on bid display
3. Multiplayer wraps player's dice in a retro-panel with "Your Dice" label
4. Multiplayer has TurnTimer component not present in single-player

### Reveal Phase Differences

**Single-Player Reveal (in page.tsx lines 1738-1991):**
- Custom implementation with staged animation sequence
- Shows "BID vs ACTUAL" comparison with incremental dice counting
- Uses `PlayerRevealCard` for each player's dice
- Has "Skip" button during animation
- Shows result (Success/Failed) with colored borders
- Displays dying/spawning dice animations inline

**Multiplayer Reveal (RevealPhase.tsx):**
- Uses overlay component with different layout
- Shows all players' dice in rows
- Has `step` state machine (0-7) for animation phases
- Different animation timing (slower, more dramatic)
- Skip functionality built-in
- Shows result text (Dudo Correct!/Calza Successful! etc.)

### Styling Token Analysis

Both modes use the same CSS custom properties from `globals.css`:

| Token | Value | Used For |
|-------|-------|----------|
| `--purple-deep` | #0a1f1f | Background, panel backgrounds |
| `--turquoise` | #2dd4bf | Borders, accents |
| `--gold-accent` | #fcd34d | Highlights, continue buttons |
| `--red-danger` | #ec4899 | Dudo/danger elements |
| `.retro-panel` | Complex shadow/border | All panels in both modes |
| `.retro-button` | 3D button style | All buttons |
| `PLAYER_COLORS` | 6-color palette | Player dice, badges |

**Visual consistency is already HIGH** because both modes use the same CSS classes and design tokens.

## Architecture Patterns

### Recommended Component Organization

The CONTEXT.md states "Claude's discretion: Component organization (shared folder vs import from single-player)".

**Recommendation: Keep current organization** (components in `/src/components/`)

Rationale:
1. All game components are already in `/src/components/`
2. No "single-player" vs "multiplayer" folders exist
3. Components are already shared via imports
4. Adding folders would require updating all import paths

### Props vs Wrappers Pattern

The CONTEXT.md states "Claude's discretion: Whether to use props on shared components or wrapper components for multiplayer-specific features".

**Recommendation: Props on shared components**

Rationale:
1. Existing pattern in codebase: `BidUI` already has `hideBidDisplay` prop for mode-specific behavior
2. Components are already parametric: `PlayerDiceBadge` has `showDisconnectedVisual`, `isConnected` props for multiplayer
3. Wrapper components add complexity without benefit
4. Single-player can ignore multiplayer-specific props (they have defaults)

### Component Interface Alignment

To unify, ensure props match between modes:

**PlayerDiceBadge - Current Props:**
```typescript
interface PlayerDiceBadgeProps {
  playerName: string;
  diceCount: number;
  color: PlayerColor;
  isActive: boolean;
  hasPalifico?: boolean;
  isEliminated?: boolean;
  showThinking?: boolean;
  thinkingPrompt?: string;
  showDisconnectedVisual?: boolean;  // Multiplayer only
  isConnected?: boolean;              // Multiplayer only
}
```
- Already unified - multiplayer props are optional

**BidUI - Current Props:**
```typescript
interface BidUIProps {
  currentBid: Bid | null;
  onBid: (bid: Bid) => void;
  onDudo: () => void;
  onCalza: () => void;
  isMyTurn: boolean;
  totalDice: number;
  isPalifico?: boolean;
  canCalza?: boolean;
  playerColor: PlayerColor;
  lastBidderColor?: PlayerColor;
  lastBidderName?: string;
  hideBidDisplay?: boolean;    // Single-player uses true
  wasAutoPlayed?: boolean;     // Multiplayer only (AI auto-play indicator)
  onValueChange?: (value: number) => void;  // Single-player only (dice highlighting)
}
```
- Already unified - both modes can use all props

## Visual Unification Strategy

### Approach: Single-Player as Source of Truth

Per CONTEXT.md: "Single-player is the source of truth - multiplayer adopts single-player styling exactly"

**What to change in Multiplayer:**

1. **Bid Display Style:**
   - Single-player: Custom "recessed table surface" with 3D floating animation
   - Multiplayer: BidUI's built-in display
   - **Action:** Multiplayer should use `hideBidDisplay={true}` and render custom bid display matching single-player

2. **Player's Dice Section:**
   - Single-player: Full-width shelf with radial glow, no panel wrapper
   - Multiplayer: Wrapped in retro-panel with "Your Dice" label
   - **Action:** Multiplayer should adopt single-player's "shelf" layout

3. **RevealPhase:**
   - Single-player: Inline with bid/actual comparison, PlayerRevealCard grid
   - Multiplayer: Overlay with row-based player display
   - **Action:** Multiplayer RevealPhase should adopt single-player's layout structure

### What Stays the Same

Both modes already share these correctly:
- PlayerDiceBadge styling (identical component)
- Dice component styling (identical)
- DudoOverlay animation (identical)
- VictoryScreen celebration (identical)
- Color scheme (same PLAYER_COLORS)
- Button styles (same .retro-button classes)
- Panel styles (same .retro-panel class)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode-specific styling | Separate CSS files per mode | Single globals.css with shared classes | Consistency, maintainability |
| Reveal phase animation | Different implementations per mode | Shared component with props | Animation timing consistency |
| Bid display | Different layouts per mode | Same bid display pattern | Visual consistency |
| Player dice layout | Different wrapper approaches | Same shelf/glow pattern | Responsive behavior consistency |

## Common Pitfalls

### Pitfall 1: Breaking Multiplayer-Specific Features

**What goes wrong:** Removing multiplayer features (disconnect indicator, turn timer, emotes) when unifying
**Why it happens:** Focus on visual match without preserving functionality
**How to avoid:** Treat multiplayer props as extensions, not replacements. SinglePlayer can ignore them.
**Warning signs:** Missing WifiOff icon, TurnTimer not showing, emotes broken

### Pitfall 2: Animation Timing Mismatch

**What goes wrong:** Reveal animations feel different between modes
**Why it happens:** Different timeout values, different step sequences
**How to avoid:** Use identical animation timing constants. Define shared timing values.
**Warning signs:** One mode feels "slower" or "faster" than other

### Pitfall 3: Responsive Layout Breaks

**What goes wrong:** Layout looks good on desktop but breaks on mobile in one mode
**Why it happens:** Different responsive handling between implementations
**How to avoid:** Test both modes on mobile. Use same breakpoints (sm:, md:).
**Warning signs:** Overlapping elements, truncated text, unclickable buttons on small screens

### Pitfall 4: State Management Collision

**What goes wrong:** Reveal phase state (revealed dice, highlighted dice) handled differently
**Why it happens:** Single-player uses local state, multiplayer uses uiStore
**How to avoid:** Keep state management approach per mode, only unify visual output
**Warning signs:** Dice highlighting out of sync, skip button not working

## Code Examples

### Unified Bid Display Pattern

Single-player uses this pattern for bid display (page.tsx lines 1566-1655):

```typescript
{currentBid && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative"
    style={{ perspective: '800px' }}
  >
    {/* Circular Player Token */}
    {lastBidderName && (
      <motion.div className="absolute -top-3 -left-3 z-20">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-mono font-bold uppercase"
          style={{
            background: `linear-gradient(135deg, ${PLAYER_COLORS[lastBidderColor].bg} 0%, ${PLAYER_COLORS[lastBidderColor].shadow} 100%)`,
            boxShadow: `0 3px 10px rgba(0,0,0,0.5), 0 0 15px ${PLAYER_COLORS[lastBidderColor].glow}`,
            border: `2px solid ${PLAYER_COLORS[lastBidderColor].border}`,
          }}
        >
          {lastBidderName.slice(0, 3)}
        </div>
      </motion.div>
    )}

    {/* Recessed table surface with floating animation */}
    <motion.div
      className="rounded-xl p-5 relative"
      style={{
        background: 'linear-gradient(180deg, rgba(3, 15, 15, 0.95) 0%, rgba(10, 31, 31, 0.9) 100%)',
        boxShadow: `inset 0 4px 20px rgba(0, 0, 0, 0.8), ...`,
        border: '2px solid rgba(45, 212, 191, 0.15)',
      }}
      animate={{ y: [0, -3, 0, 3, 0], rotateX: [5, 5.3, 5, 4.7, 5] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Dice display */}
      <div className="flex flex-wrap items-center justify-center gap-2 py-1">
        {Array.from({ length: currentBid.count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 400 }}
          >
            <Dice
              value={currentBid.value}
              index={i}
              size="sm"
              isPalifico={isPalifico}
              color={lastBidderColor || playerColor}
            />
          </motion.div>
        ))}
      </div>
      <p className="text-center text-lg font-bold text-white-soft/60 mt-1">
        {currentBid.count}x {currentBid.value === 1 ? 'Jokers' : `${currentBid.value}s`}
      </p>
    </motion.div>
  </motion.div>
)}
```

**Multiplayer should adopt this same pattern** in GameBoard.tsx.

### Unified Player Dice Shelf Pattern

Single-player uses this pattern for player's dice (page.tsx lines 1691-1733):

```typescript
<motion.div
  initial={{ y: 50, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  className="flex-none pb-4 relative"
>
  {/* Radial glow from bottom */}
  <div
    className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
    style={{
      background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${PLAYER_COLORS[playerColor].glow} 0%, transparent 70%)`,
      opacity: 0.35,
    }}
  />

  {/* Dice container with drop shadow */}
  <motion.div
    className="relative flex justify-center items-end"
    style={{ filter: `drop-shadow(0 0 18px ${PLAYER_COLORS[playerColor].glow})` }}
    animate={{ filter: [
      `drop-shadow(0 0 12px ${glow})`,
      `drop-shadow(0 0 25px ${glow})`,
      `drop-shadow(0 0 12px ${glow})`,
    ]}}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <SortedDiceDisplay
      dice={playerHand}
      color={playerColor}
      isPalifico={isPalifico}
      size="lg"
      animateSort={true}
      highlightValue={isMyTurn ? selectedBidValue : currentBid?.value}
      draggable={true}
    />
  </motion.div>
</motion.div>
```

**Multiplayer should adopt this shelf pattern** instead of retro-panel wrapper.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate single/multi components | Shared components with props | Phase 16 (shared hooks) | Components already unified |
| Mode-specific CSS | Shared globals.css | Initial architecture | No change needed |
| Different reveal implementations | Should unify in Phase 17 | This phase | Major unification task |

## Open Questions

1. **TurnTimer placement in unified layout:**
   - What we know: Single-player has no timer, multiplayer shows timer above BidUI
   - What's unclear: Should timer appear in same location after unification?
   - Recommendation: Keep timer above BidUI in multiplayer, position naturally integrates with unified bid display

2. **Emote picker position:**
   - What we know: Multiplayer has emote picker at fixed bottom-right
   - What's unclear: Should emotes be visible in unified layout?
   - Recommendation: Keep as-is, positioned independently from game board layout

3. **RevealPhase unification depth:**
   - What we know: Implementations are significantly different
   - What's unclear: Full port vs. visual alignment only
   - Recommendation: Visual alignment - use same layout structure, keep separate state management

## Sources

### Primary (HIGH confidence)
- `/src/app/page.tsx` - Single-player implementation source
- `/src/components/GameBoard.tsx` - Multiplayer game board source
- `/src/components/RevealPhase.tsx` - Multiplayer reveal phase source
- `/src/components/PlayerDiceBadge.tsx` - Shared component source
- `/src/components/BidUI.tsx` - Shared component source
- `/src/app/globals.css` - Shared styling definitions
- `/src/lib/types.ts` - PLAYER_COLORS definitions

### Secondary (MEDIUM confidence)
- `.planning/phases/17-game-ui-unification/17-CONTEXT.md` - User decisions and constraints

## Metadata

**Confidence breakdown:**
- Component analysis: HIGH - all source files verified
- Layout differences: HIGH - direct code comparison
- Styling system: HIGH - globals.css fully reviewed
- Unification strategy: HIGH - based on CONTEXT.md decisions

**Research date:** 2026-01-20
**Valid until:** No expiration - codebase analysis is point-in-time accurate
