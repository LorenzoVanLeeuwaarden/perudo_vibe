# Phase 5: Lobby Experience - Research

**Researched:** 2026-01-18
**Domain:** React lobby UI, real-time player list, host controls, PartyKit message handling
**Confidence:** HIGH

## Summary

Phase 5 builds on the existing RoomLobby component to add a full lobby experience: player list with real-time updates, host controls (kick, settings), and game start flow. The codebase already has all required libraries installed and established patterns to follow.

The implementation requires:
1. Enhanced player list UI with animations for join/leave
2. Host indicator (crown icon) and kick controls
3. Settings modal for game configuration
4. Kick confirmation dialog
5. Start game button with player count validation
6. Server-side handlers for UPDATE_SETTINGS, KICK_PLAYER, START_GAME messages
7. Host transfer logic when host disconnects

**Primary recommendation:** Leverage existing framer-motion AnimatePresence patterns from the codebase, use the established modal pattern from SettingsPanel, and implement host transfer via automatic promotion of earliest-joined player.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 11.18.2 | List animations, modal transitions | Already used throughout codebase |
| lucide-react | 0.468.0 | Crown, X, Settings, Play icons | Already used for all icons |
| sonner | 2.0.7 | Toast notifications (kicked player) | Already configured with purple theme |
| partykit | 0.0.115 | Server-side WebSocket handling | Already handles room state |
| partysocket | 1.1.10 | Client WebSocket connection | Already in useRoomConnection hook |
| zod | 4.3.5 | Message validation | Already defines all message schemas |
| zustand | 5.0.10 | Client state management | Already manages UI state |

### No Additional Libraries Needed

The phase requirements are fully covered by existing dependencies:
- Player list animations: framer-motion AnimatePresence (used in 15+ components)
- Modal dialogs: framer-motion + existing SettingsPanel pattern
- Icons: lucide-react Crown, X, Settings, Play, UserMinus
- Toasts: sonner (already configured in layout.tsx)

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── RoomLobby.tsx         # Enhanced lobby container (existing)
│   ├── PlayerList.tsx        # NEW: Animated player list
│   ├── PlayerRow.tsx         # NEW: Individual player display
│   ├── KickConfirmDialog.tsx # NEW: Confirmation modal
│   ├── GameSettingsModal.tsx # NEW: Game settings configuration
│   └── SettingsPanel.tsx     # EXISTING: Reference for modal pattern
├── shared/
│   ├── types.ts              # Add turn time options (existing)
│   └── messages.ts           # Message schemas (existing, complete)
└── party/
    └── index.ts              # Server handlers (stubs exist)
```

### Pattern 1: Animated Player List with AnimatePresence

**What:** Use AnimatePresence to animate players entering/exiting the list
**When to use:** Displaying dynamic lists where items are added/removed
**Example:**
```typescript
// Source: Established pattern in codebase (SortedDiceDisplay.tsx, DiceCup.tsx)
import { motion, AnimatePresence } from 'framer-motion';

const playerVariants = {
  initial: { opacity: 0, x: -20, height: 0 },
  animate: { opacity: 1, x: 0, height: 'auto' },
  exit: { opacity: 0, x: 20, height: 0 }
};

function PlayerList({ players, myPlayerId, isHost, onKick }) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {players.map((player) => (
          <motion.div
            key={player.id}
            layout
            variants={playerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <PlayerRow
              player={player}
              isMe={player.id === myPlayerId}
              showKick={isHost && player.id !== myPlayerId}
              onKick={() => onKick(player.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### Pattern 2: Modal Dialog (Established Pattern)

**What:** Full-screen overlay with centered content, click-outside-to-close
**When to use:** Settings modal, kick confirmation dialog
**Example:**
```typescript
// Source: Existing SettingsPanel.tsx pattern
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="retro-panel p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 3: Server Message Handler Structure

**What:** Type-safe message handling in PartyKit server
**When to use:** All client->server message handlers
**Example:**
```typescript
// Source: Existing party/index.ts pattern
private async handleKickPlayer(
  msg: Extract<ClientMessage, { type: 'KICK_PLAYER' }>,
  sender: Party.Connection
): Promise<void> {
  if (!this.roomState) return;

  // Verify sender is host
  if (this.roomState.hostId !== sender.id) {
    this.sendError(sender, 'NOT_HOST', 'Only the host can kick players.');
    return;
  }

  // Find and remove player
  const playerIndex = this.roomState.players.findIndex(p => p.id === msg.playerId);
  if (playerIndex === -1) return;

  const kickedPlayer = this.roomState.players[playerIndex];
  this.roomState.players.splice(playerIndex, 1);
  await this.persistState();

  // Notify kicked player
  const kickedConnection = [...this.room.getConnections()].find(c => c.id === msg.playerId);
  if (kickedConnection) {
    this.sendToConnection(kickedConnection, {
      type: 'PLAYER_LEFT',
      playerId: msg.playerId,
      reason: 'kicked',
      timestamp: Date.now(),
    });
  }

  // Notify others
  this.broadcast({
    type: 'PLAYER_LEFT',
    playerId: msg.playerId,
    reason: 'kicked',
    timestamp: Date.now(),
  }, [msg.playerId]);
}
```

### Pattern 4: Host Transfer on Disconnect

**What:** Auto-promote next player to host when host leaves
**When to use:** In onClose handler when disconnected player is host
**Example:**
```typescript
// Recommended pattern for party/index.ts onClose
async onClose(connection: Party.Connection): Promise<void> {
  if (!this.roomState) return;

  const wasHost = this.roomState.hostId === connection.id;
  const player = this.roomState.players.find(p => p.id === connection.id);

  if (player) {
    player.isConnected = false;

    // Host transfer: promote earliest-joined connected player
    if (wasHost) {
      const connectedPlayers = this.roomState.players
        .filter(p => p.isConnected && p.id !== connection.id);

      if (connectedPlayers.length > 0) {
        // Players array is ordered by join time, so first is earliest
        const newHost = connectedPlayers[0];
        this.roomState.hostId = newHost.id;
        newHost.isHost = true;
        player.isHost = false;

        // Broadcast host change
        this.broadcast({
          type: 'HOST_CHANGED',
          newHostId: newHost.id,
          timestamp: Date.now(),
        });
      }
    }

    await this.persistState();

    this.broadcast({
      type: 'PLAYER_LEFT',
      playerId: connection.id,
      reason: 'disconnected',
      timestamp: Date.now(),
    }, [connection.id]);
  }
}
```

### Anti-Patterns to Avoid

- **Don't use native `<dialog>` element:** Project already has established framer-motion modal pattern; mixing would be inconsistent
- **Don't add react-modal or other modal libraries:** Unnecessary dependency when AnimatePresence pattern works well
- **Don't animate with CSS transitions for list items:** framer-motion's layout animations handle this better
- **Don't store host status only on server:** Keep `isHost` on each ServerPlayer for easy broadcast/display
- **Don't close room when host leaves:** Transfer host to maintain good UX for remaining players

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Player list animations | CSS transitions | framer-motion AnimatePresence + layout | Handles mount/unmount, layout shifts automatically |
| Modal dialogs | Custom portal + state | Existing SettingsPanel pattern | Already tested, consistent with app style |
| Toast notifications | Custom toast component | sonner (already configured) | Positioning, styling, auto-dismiss handled |
| Icon components | Custom SVGs | lucide-react imports | Consistent sizing, already in use |
| Connection ID persistence | Session storage | useClientIdentity hook | Already handles localStorage with clientId |

**Key insight:** This phase is primarily about wiring together existing patterns, not building new infrastructure. The message protocol, state management, and UI patterns are all established.

## Common Pitfalls

### Pitfall 1: Forgetting to Update Both Client and Server State on Kick

**What goes wrong:** Kicked player remains in local state until page refresh
**Why it happens:** Only sending server message without handling response
**How to avoid:** Handle PLAYER_LEFT message in room page's handleMessage callback (already exists, handles 'kicked' reason)
**Warning signs:** Player disappears for host but not for other players

### Pitfall 2: Race Condition on Host Transfer

**What goes wrong:** Multiple HOST_CHANGED messages when host disconnects during high activity
**Why it happens:** Checking host status after await without re-validating
**How to avoid:** Check wasHost before async operations, verify roomState.hostId still matches before transfer
**Warning signs:** Host badge flickering between players

### Pitfall 3: Not Blocking Joins During Game

**What goes wrong:** Player joins room after game starts, sees broken state
**Why it happens:** CONTEXT.md says max player handling is Claude's discretion, but game-in-progress blocking is critical
**How to avoid:** Server already checks `gameState.phase !== 'lobby'` in handleJoinRoom - verify this remains enforced
**Warning signs:** New player sees lobby UI when others see game

### Pitfall 4: Settings Modal Accessible to Non-Host

**What goes wrong:** Non-host can open settings modal and attempt changes
**Why it happens:** Forgetting to conditionally render based on isHost
**How to avoid:** Settings button only visible to host; server validates UPDATE_SETTINGS sender is host
**Warning signs:** Non-host sees "Configure Game" button, gets error on save

### Pitfall 5: AnimatePresence Key Collisions

**What goes wrong:** Animation glitches when player leaves and new player joins quickly
**Why it happens:** Using index instead of unique ID as key
**How to avoid:** Always use `player.id` as key prop, never array index
**Warning signs:** Wrong player animates out, new player doesn't animate in

## Code Examples

Verified patterns from existing codebase and official sources:

### Player Row Component

```typescript
// Pattern: Individual player display with host indicator and kick button
import { motion } from 'framer-motion';
import { Crown, X, Wifi, WifiOff } from 'lucide-react';
import { PLAYER_COLORS, type PlayerColor } from '@/lib/types';

interface PlayerRowProps {
  player: {
    id: string;
    name: string;
    color: PlayerColor;
    isHost: boolean;
    isConnected: boolean;
  };
  isMe: boolean;
  showKick: boolean;
  onKick: () => void;
}

export function PlayerRow({ player, isMe, showKick, onKick }: PlayerRowProps) {
  const colorConfig = PLAYER_COLORS[player.color];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isMe
          ? 'bg-purple-mid/30 border-purple-glow'
          : 'bg-purple-deep/30 border-purple-mid'
      }`}
    >
      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ background: colorConfig.bg }}
      />

      {/* Name */}
      <span className="flex-1 text-white-soft font-medium truncate">
        {player.name}
      </span>

      {/* Host badge */}
      {player.isHost && (
        <Crown className="w-5 h-5 text-gold-accent flex-shrink-0" />
      )}

      {/* Connection status */}
      {!player.isConnected && (
        <WifiOff className="w-4 h-4 text-white-soft/40 flex-shrink-0" />
      )}

      {/* Kick button (host only, not for self) */}
      {showKick && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onKick}
          className="w-6 h-6 rounded flex items-center justify-center text-white-soft/50 hover:text-red-danger hover:bg-red-danger/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
```

### Kick Confirmation Dialog

```typescript
// Pattern: Confirmation modal following SettingsPanel pattern
import { motion, AnimatePresence } from 'framer-motion';

interface KickConfirmDialogProps {
  isOpen: boolean;
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KickConfirmDialog({ isOpen, playerName, onConfirm, onCancel }: KickConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="retro-panel p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white-soft mb-2">
              Remove {playerName}?
            </h2>
            <p className="text-white-soft/60 mb-6">
              They will be removed from the lobby and redirected to the home page.
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg bg-purple-mid border border-purple-glow text-white-soft"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 py-2 rounded-lg bg-red-danger text-white font-bold"
              >
                Kick
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Game Settings Values

```typescript
// Pattern: Turn time options matching CONTEXT.md decisions
export const TURN_TIME_OPTIONS = [
  { value: 30000, label: '30s' },
  { value: 60000, label: '60s' },
  { value: 90000, label: '90s' },
  { value: 0, label: 'Unlimited' },
] as const;

export const DEFAULT_TURN_TIME_MS = 60000; // 60 seconds per CONTEXT.md

// In GameSettings type (already exists in shared/types.ts):
// turnTimeoutMs: 0 means unlimited
```

### Start Game Button Logic

```typescript
// Pattern: Conditional rendering based on host status and player count
const connectedCount = roomState.players.filter(p => p.isConnected).length;
const canStart = connectedCount >= 2 && connectedCount <= 6;
const isHost = roomState.hostId === myPlayerId;

{isHost ? (
  <motion.button
    whileHover={canStart ? { scale: 1.02 } : {}}
    whileTap={canStart ? { scale: 0.98 } : {}}
    disabled={!canStart}
    onClick={handleStartGame}
    className={`w-full py-3 rounded-lg font-bold ${
      canStart
        ? 'bg-gold-accent text-purple-deep'
        : 'bg-purple-mid/50 text-white-soft/50 cursor-not-allowed'
    }`}
  >
    {canStart ? 'Start Game' : `Need ${2 - connectedCount} more player${2 - connectedCount !== 1 ? 's' : ''}`}
  </motion.button>
) : (
  <div className="text-center py-3 text-white-soft/60">
    Waiting for host... ({connectedCount}/6 players)
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-modal library | Native `<dialog>` or framer-motion overlays | 2024 | Project uses framer-motion pattern |
| CSS transitions for lists | framer-motion layout + AnimatePresence | Ongoing | Better exit animations, auto layout |
| Framer Motion | Motion (rebranded) | Feb 2025 | Same API, import from 'framer-motion' still works |

**Deprecated/outdated:**
- None relevant - codebase uses current patterns

## Open Questions

Things that couldn't be fully resolved:

1. **HOST_CHANGED message type**
   - What we know: Need to broadcast when host changes
   - What's unclear: Message type doesn't exist in current schema
   - Recommendation: Add HOST_CHANGED to ServerMessageSchema, or use ROOM_STATE broadcast (simpler, already works)

2. **Kicked player redirect timing**
   - What we know: Kicked player should see toast then redirect
   - What's unclear: Delay before redirect? Immediate vs after toast appears?
   - Recommendation: Use router.push() after showing toast, sonner handles toast duration

3. **Max player handling when room full**
   - What we know: Server returns ROOM_FULL error (already implemented)
   - What's unclear: CONTEXT.md marks this as "Claude's Discretion"
   - Recommendation: Keep current behavior - error message shown to joining user, they stay on join form

## Sources

### Primary (HIGH confidence)
- Project codebase: `party/index.ts` - existing message handlers and room state structure
- Project codebase: `src/shared/messages.ts` - complete message schema with KICK_PLAYER, UPDATE_SETTINGS, START_GAME
- Project codebase: `src/shared/types.ts` - GameSettings with turnTimeoutMs, ServerPlayer with isHost
- Project codebase: `src/components/SettingsPanel.tsx` - established modal pattern

### Secondary (MEDIUM confidence)
- [Motion documentation](https://motion.dev/docs/react-animate-presence) - AnimatePresence patterns
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) - Crown, X icon imports

### Tertiary (LOW confidence)
- WebSearch results on host migration patterns - general multiplayer game patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used
- Architecture: HIGH - patterns established in codebase
- Pitfalls: MEDIUM - based on common React/real-time patterns
- Host transfer: MEDIUM - recommended pattern, not verified against PartyKit edge cases

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable stack, no expected changes)
