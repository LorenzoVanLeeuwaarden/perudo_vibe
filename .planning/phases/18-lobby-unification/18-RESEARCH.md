# Phase 18: Lobby Unification - Research

**Researched:** 2026-01-20
**Domain:** React component architecture, CSS styling, lobby UI patterns
**Confidence:** HIGH

## Summary

Phase 18 unifies the lobby experience between single-player (page.tsx "Lobby" gameState) and multiplayer (RoomLobby.tsx). Both lobbies need to share a visual foundation while preserving mode-specific features: single-player has opponent count/difficulty settings, multiplayer has player list/share link/kick functionality.

The codebase structure reveals that:
- **Single-player lobby** is embedded in page.tsx as a gameState, uses inline styling with `retro-panel` class
- **Multiplayer lobby** is a separate component (RoomLobby.tsx) with different layout structure
- **Shared CSS foundation exists:** `retro-panel`, `retro-button` classes in globals.css used by both
- **Static gradient fallback exists:** ShaderBackground already has simplified CSS gradient for Firefox/reduced motion users
- **Component patterns established:** PlayerRow, PlayerList, RoomShare, KickConfirmDialog for multiplayer; inline plus/minus opponent selector for single-player

**Primary recommendation:** Create a shared LobbyLayout component that provides the unified visual structure (header zone, content zone, footer zone), then refactor both lobbies to use this foundation while keeping their mode-specific content.

## Current State Analysis

### Single-Player Lobby (page.tsx lines 1393-1501)

**Structure:**
```
+------------------------------------------+
|          [CasinoLogo - header]           |
+------------------------------------------+
|                                          |
|         [retro-panel container]          |
|    +---------------------------------+   |
|    | [Back button]                   |   |
|    |                                 |   |
|    | [Dices icon - mode indicator]   |   |
|    |                                 |   |
|    | [Opponents selector +/-]        |   |
|    |                                 |   |
|    | [Preview dice] [Settings gear] |   |
|    |                                 |   |
|    | [START GAME button]            |   |
|    +---------------------------------+   |
|                                          |
+------------------------------------------+
```

**Key Features:**
- CasinoLogo above panel (separate from panel)
- Back button inside panel (top-left corner)
- Opponent count selector (1-5) with +/- buttons
- Dice preview row with settings gear
- "START GAME" button at bottom of panel

**Styling:**
- Uses `retro-panel p-5 sm:p-8 mb-4 sm:mb-6 relative` class
- Player color theming via `colorConfig.bgGradient`, `colorConfig.border`, `colorConfig.shadow`
- Responsive sizing (`sm:` breakpoints)

### Multiplayer Lobby (RoomLobby.tsx)

**Structure:**
```
+------------------------------------------+
| [Back button]     [Connection status]    |  <- Fixed position elements
+------------------------------------------+
|          [CasinoLogo - header]           |
+------------------------------------------+
|                                          |
|         [retro-panel container]          |
|    +---------------------------------+   |
|    | [Start Game button] (host only) |   |
|    | or [Waiting text] (non-host)    |   |
|    |                                 |   |
|    | [Players (X/6) label]          |   |
|    | [PlayerList component]          |   |
|    |                                 |   |
|    | [Configure Game button]         |   |
|    |                                 |   |
|    | [--- divider ---]               |   |
|    | [RoomShare - QR/code/buttons]   |   |
|    +---------------------------------+   |
|                                          |
+------------------------------------------+
```

**Key Features:**
- Back button OUTSIDE panel (fixed top-left)
- Connection status indicator (fixed top-right)
- CasinoLogo above panel
- Start Game button at TOP of panel (inverted from single-player)
- Player list section with label
- Settings accessed via "Configure Game" button opening modal
- Share section at bottom with divider

**Styling:**
- Uses `retro-panel p-6 w-full` class
- Max-width container (`max-w-md w-full`)
- Connection status has its own fixed positioning

### Layout Differences Summary

| Aspect | Single-Player | Multiplayer |
|--------|---------------|-------------|
| Back button | Inside panel, top-left | Outside panel, fixed position |
| Main action position | Bottom of panel | Top of panel |
| Settings | Inline (gear icon opens modal) | Button opens modal |
| Logo | Above panel | Above panel |
| Content scroll | N/A (fixed height) | Player list can grow |

## Architecture Patterns

### CONTEXT.md Decisions (Locked)

Per the CONTEXT.md, these decisions are LOCKED:

1. **Container style:** Solid retro panel (opaque with border/shadow)
2. **Background:** Simplified static gradient (CSS, not shader)
3. **Action buttons:** Primary accent buttons (bold colored, existing game style)
4. **Layout structure:** Same template for both - header/content/footer zones
5. **Main action button:** Fixed at bottom of panel
6. **Game settings:** Displayed inline, not collapsed/modal
7. **Panel height:** Fixed on mobile; content scrolls within

### Recommended Shared Component

Create `LobbyLayout.tsx` as the unified foundation:

```typescript
interface LobbyLayoutProps {
  title: string;               // "Single Player" or "Multiplayer Lobby"
  onBack: () => void;
  confirmBack?: boolean;       // If true, show confirmation dialog
  backConfirmMessage?: string;
  children: React.ReactNode;   // Content zone
  footer: React.ReactNode;     // Action buttons zone
  headerRight?: React.ReactNode; // Optional (connection status for MP)
}
```

**Why this structure:**
- Enforces consistent header (back button + title)
- Separates content zone from action zone
- Allows mode-specific header elements (connection status)
- Per CONTEXT.md, main action at bottom is fixed, content above scrolls

### Claude's Discretion Areas

1. **Heading typography:** Use existing `text-lg sm:text-xl font-bold text-white-soft` pattern from lobbies
2. **Spacing/padding:** Match existing `p-5 sm:p-8` from single-player or `p-6` from multiplayer (recommend: `p-5 sm:p-6`)
3. **Player card layout:** Maintain current PlayerRow structure (color dot, name, kick button)
4. **QR code:** CONTEXT says optional - recommend keeping it (already implemented, works well)

## Static Background Implementation

Per CONTEXT.md: "Background: Simplified version of game background - same colors as static gradient (less GPU usage than shader)"

The ShaderBackground.tsx already has this pattern (lines 148-162):

```typescript
// Simplified mode gets a static CSS gradient background instead of canvas animation
if (useSimplifiedAnimations) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(45, 212, 191, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at center, hsl(175, 50%, 10%) 0%, hsl(175, 40%, 4%) 70%, hsl(175, 35%, 2%) 100%)
        `,
      }}
    />
  );
}
```

**Recommendation:** Extract this to a separate `StaticBackground` component or use directly in lobby. The existing colors match the game palette exactly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Back confirmation dialog | New confirmation component | Existing `KickConfirmDialog` pattern | Same modal structure with different text |
| Player list styling | New list component | Existing `PlayerList` + `PlayerRow` | Already styled with retro panel aesthetics |
| Settings inline UI | New settings component | Adapt from `SettingsPanel.tsx` patterns | Toggle switches, +/- controls already exist |
| QR code generation | Custom SVG | `qrcode.react` (already used) | Already integrated in RoomShare |
| Share link copy | Manual clipboard API | `RoomShare.tsx` pattern | Already handles fallbacks |

## Common Pitfalls

### Pitfall 1: Breaking Mode-Specific Features

**What goes wrong:** Unifying visuals removes multiplayer-only features (kick, connection status)
**Why it happens:** Over-abstraction hides mode-specific slots
**How to avoid:** LobbyLayout must have explicit slots for mode-specific content, not hide them
**Warning signs:** Kick buttons missing, connection status gone, share section absent

### Pitfall 2: Inconsistent Scroll Behavior

**What goes wrong:** Single-player lobby scrolls when it shouldn't, multiplayer doesn't when it should
**Why it happens:** Different content heights handled differently
**How to avoid:** Panel height fixed, content zone has `overflow-y-auto max-h-[calc(100vh-X)]`
**Warning signs:** Page bounces on mobile, content cut off on small screens

### Pitfall 3: Mobile Layout Breaks

**What goes wrong:** Layout looks good on desktop, overlapping/broken on mobile
**Why it happens:** Fixed positioning conflicts with scrollable content
**How to avoid:** Keep back button inside panel (per CONTEXT.md pattern), use relative positioning
**Warning signs:** Back button covers content, action button not visible

### Pitfall 4: Settings Display Confusion

**What goes wrong:** Settings are inline but look like modals, or modals but look inline
**Why it happens:** CONTEXT says "inline" for single-player (where settings are opponent count) but multiplayer has more complex settings
**How to avoid:** Clarify: opponent count IS inline, game rules (palifico, turn time) can remain in modal for multiplayer
**Warning signs:** Too much content in main area, cluttered interface

### Pitfall 5: Lost Confirmation on Leave

**What goes wrong:** Multiplayer lobby exits without confirmation
**Why it happens:** Back button doesn't trigger confirmation dialog
**How to avoid:** Per CONTEXT.md: "Multiplayer lobby: Always confirm before leaving"
**Warning signs:** Users accidentally leave lobby without warning

## Code Examples

### Unified Panel Structure

Based on single-player pattern (page.tsx lines 1402-1499) with adaptations for unified use:

```typescript
// Unified lobby panel structure
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  className="retro-panel p-5 sm:p-6 w-full max-w-md relative flex flex-col"
  style={{ maxHeight: 'calc(100vh - 200px)' }}
>
  {/* Header with back button */}
  <div className="flex items-center justify-between mb-4">
    <motion.button
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleBack}
      className="px-3 py-2 rounded-lg bg-purple-deep/80 border border-purple-mid text-white-soft/70 text-sm flex items-center gap-2 hover:bg-purple-mid/50 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </motion.button>
    <h2 className="text-lg sm:text-xl font-bold text-white-soft">{title}</h2>
    {/* Optional: connection status for multiplayer */}
    {headerRight}
  </div>

  {/* Content zone - scrollable */}
  <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
    {children}
  </div>

  {/* Footer - fixed at bottom */}
  <div className="flex-none pt-4 mt-4 border-t border-purple-mid">
    {footer}
  </div>
</motion.div>
```

### Inline Settings Pattern (Single-Player)

From single-player opponent selector (page.tsx lines 1418-1465):

```typescript
// Opponent count inline setting
<div className="mb-4">
  <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-2">
    Opponents
  </h3>
  <div className="flex items-center justify-center gap-4">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setOpponentCount(c => Math.max(1, c - 1))}
      disabled={opponentCount <= 1}
      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        opponentCount <= 1
          ? 'bg-purple-deep border border-purple-mid opacity-50 cursor-not-allowed'
          : 'bg-purple-mid hover:bg-purple-light border border-purple-glow'
      }`}
    >
      <Minus className="w-5 h-5 text-white-soft" />
    </motion.button>
    <div
      className="w-16 h-16 rounded-lg flex items-center justify-center"
      style={{
        background: colorConfig.bgGradient,
        border: `3px solid ${colorConfig.border}`,
        boxShadow: `0 4px 0 0 ${colorConfig.shadow}`,
      }}
    >
      <span className="text-3xl font-bold text-white">{opponentCount}</span>
    </div>
    <motion.button /* ... */ >
      <Plus />
    </motion.button>
  </div>
</div>
```

### Player List Pattern (Multiplayer)

From RoomLobby.tsx (lines 151-161):

```typescript
// Player list section
<div className="space-y-4">
  <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider">
    Players ({connectedCount}/6)
  </h3>
  <PlayerList
    players={roomState.players}
    myPlayerId={myPlayerId}
    isHost={isHost}
    onKickPlayer={(playerId) => setShowKickDialog(playerId)}
  />
</div>
```

### Share Link Section Pattern

From RoomLobby.tsx (lines 178-180):

```typescript
// Share section (multiplayer only)
<div className="space-y-4">
  <RoomShare roomCode={roomCode} playerColor={playerColor} />
</div>
```

### Leave Confirmation Dialog Pattern

Based on KickConfirmDialog.tsx:

```typescript
// Leave lobby confirmation
<AnimatePresence>
  {showLeaveConfirm && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setShowLeaveConfirm(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="retro-panel p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white-soft mb-2">
          Leave Lobby?
        </h2>
        <p className="text-white-soft/60 mb-6">
          You will be removed from the game room.
        </p>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLeaveConfirm(false)}
            className="flex-1 py-2 rounded-lg bg-purple-mid border border-purple-glow text-white-soft"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeave}
            className="flex-1 py-2 rounded-lg bg-red-danger text-white font-bold"
          >
            Leave
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

## Implementation Strategy

### Phase Tasks Overview

Based on CONTEXT.md requirements:

1. **LOBBY-01: Shared Layout Foundation**
   - Create `LobbyLayout` component with header/content/footer zones
   - Extract static background pattern (or reuse ShaderBackground simplified mode)
   - Define shared panel styling constants

2. **LOBBY-02: Single-Player Integration**
   - Refactor page.tsx "Lobby" state to use LobbyLayout
   - Keep opponent selector inline
   - Settings gear opens SettingsPanel modal (as-is)
   - Start Game button moves to footer zone

3. **LOBBY-03: Multiplayer Integration**
   - Refactor RoomLobby to use LobbyLayout
   - Player list in content zone
   - Settings button opens GameSettingsModal (as-is)
   - Share section below player list
   - Start Game button in footer zone
   - Add leave confirmation dialog

### Migration Order

1. Create LobbyLayout first (no changes to existing code)
2. Integrate single-player (simpler, no network state)
3. Integrate multiplayer (more complex, has to preserve networking)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate lobby implementations | Will be unified layout | This phase | Visual consistency |
| ShaderBackground always | Static gradient for lobbies | This phase | GPU savings per CONTEXT |
| Settings in modal only | Inline for simple settings | Already exists in SP | Better UX |

## Open Questions

1. **Settings scope for multiplayer:**
   - What we know: CONTEXT says "settings displayed inline"
   - What's unclear: Multiplayer has more settings (turn time, palifico) than single-player (just opponent count)
   - Recommendation: Keep GameSettingsModal for multiplayer, inline only applies to single-player's opponent count

2. **Connection status placement:**
   - What we know: Currently fixed top-right outside panel
   - What's unclear: Should it move inside panel header in unified layout?
   - Recommendation: Keep outside panel (less visual clutter, always visible)

3. **Player list max height:**
   - What we know: 6 players max, each row ~48px
   - What's unclear: On very small screens, does list need scroll?
   - Recommendation: Set max-height on content zone, let it scroll if needed

## Sources

### Primary (HIGH confidence)
- `/src/app/page.tsx` - Single-player lobby implementation (lines 1393-1501)
- `/src/components/RoomLobby.tsx` - Multiplayer lobby implementation
- `/src/components/PlayerList.tsx` - Player list component
- `/src/components/PlayerRow.tsx` - Player row component with kick button
- `/src/components/RoomShare.tsx` - Share link/QR code component
- `/src/components/KickConfirmDialog.tsx` - Confirmation dialog pattern
- `/src/components/SettingsPanel.tsx` - Single-player settings modal
- `/src/components/GameSettingsModal.tsx` - Multiplayer settings modal
- `/src/components/ShaderBackground.tsx` - Static gradient fallback pattern
- `/src/app/globals.css` - Shared CSS classes (.retro-panel, colors)

### Secondary (MEDIUM confidence)
- `.planning/phases/18-lobby-unification/18-CONTEXT.md` - User decisions and constraints

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH - all source files verified
- Layout structure: HIGH - direct code review of both lobbies
- Styling patterns: HIGH - globals.css and component styling reviewed
- Implementation strategy: HIGH - based on CONTEXT.md locked decisions

**Research date:** 2026-01-20
**Valid until:** No expiration - codebase analysis is point-in-time accurate
