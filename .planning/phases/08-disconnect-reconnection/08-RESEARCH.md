# Phase 8: Disconnect and Reconnection - Research

**Researched:** 2026-01-18
**Domain:** WebSocket connection lifecycle, player state persistence, AI takeover
**Confidence:** HIGH

## Summary

Phase 8 implements graceful disconnection handling where AI maintains a player's position during disconnects, with a 60-second grace period before elimination. The codebase already has significant infrastructure in place: persistent client IDs via `useClientIdentity`, `isConnected` tracking on players, and reconnection message handling. The key additions are server-side disconnect timing using PartyKit alarms (same pattern as turn timers), an `isDisconnected` state separate from `isConnected`, and visual indicators in the UI.

PartyKit provides all needed primitives: `onClose` for detecting disconnects, custom connection IDs for reconnection matching, alarm API for grace period timing, and `getConnection(id)` for checking if a player reconnected.

**Primary recommendation:** Extend the existing alarm-based timer pattern (from Phase 7) to manage disconnect grace periods. Add `disconnectedAt` timestamp to track when disconnection occurred, and use a single alarm per disconnected player (stored with player ID prefix in room storage).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PartyKit | 0.0.115 | Real-time server, connection lifecycle | Already in use, provides onClose/onConnect/alarm |
| PartySocket | (bundled) | Client reconnection | Built-in auto-reconnect with same connection ID |
| nanoid | 5.1.6 | Persistent client ID generation | Already in use via useClientIdentity |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.468.0 | Disconnect icon (WifiOff already imported) | PlayerRow already shows disconnect state |
| sonner | (existing) | Toast for reconnection feedback | "Welcome back!" notification |
| framer-motion | 11.15.0 | Grayed-out animation transition | Smooth disconnect state visual |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-player alarm | Single room alarm checking all players | Single alarm is simpler but requires iterating all players on each fire |
| Server-side disconnect tracking | Client-side heartbeat | Server-side is authoritative and survives client crashes |

**Installation:**
```bash
# No new dependencies needed - all tools already in project
```

## Architecture Patterns

### Recommended State Structure

```typescript
// Extend ServerPlayer in src/shared/types.ts
interface ServerPlayer {
  // ... existing fields
  isConnected: boolean;        // WebSocket currently open (existing)
  disconnectedAt: number | null;  // Timestamp when disconnect detected (NEW)
}
```

### Disconnect State Machine

```
CONNECTED (isConnected: true, disconnectedAt: null)
    |
    v (onClose event)
SOFT_DISCONNECTED (isConnected: false, disconnectedAt: timestamp)
    |
    +-- (reconnects within 60s) --> CONNECTED
    |
    v (60s grace period expires)
ELIMINATED (isEliminated: true, remove from active play)
```

### Pattern 1: Soft Disconnect Delay (5-10 seconds)

**What:** Don't immediately mark player as disconnected visually - wait 5-10 seconds to avoid flicker on brief network blips.
**When to use:** When player's WebSocket closes
**Implementation:**
```typescript
// Server: Track disconnectedAt immediately in onClose
player.isConnected = false;
player.disconnectedAt = Date.now();

// Client: Only show disconnect visual after delay
const showDisconnected = !player.isConnected &&
  player.disconnectedAt &&
  (Date.now() - player.disconnectedAt > 5000);
```

### Pattern 2: Grace Period Alarm

**What:** Schedule alarm for 60 seconds after disconnect to eliminate player
**When to use:** In onClose when player disconnects during active game
**Implementation:**
```typescript
// In onClose handler
async onClose(connection: Party.Connection): Promise<void> {
  // ... existing disconnect logic ...

  // Schedule elimination alarm if game is in progress
  if (this.roomState?.gameState?.phase !== 'lobby' &&
      this.roomState?.gameState?.phase !== 'ended') {
    // Store which player should be eliminated and when
    await this.room.storage.put(`disconnect_${connection.id}`, {
      playerId: connection.id,
      eliminateAt: Date.now() + 60000, // 60 second grace period
    });

    // Schedule alarm
    await this.room.storage.setAlarm(Date.now() + 60000);
  }
}
```

### Pattern 3: Reconnection Restoration

**What:** When player reconnects, restore full state and clear disconnect tracking
**When to use:** In onConnect when matching clientId found
**Implementation:**
```typescript
// In onConnect when returning player found
player.isConnected = true;
player.disconnectedAt = null;

// Clear scheduled elimination
await this.room.storage.delete(`disconnect_${connection.id}`);

// Send full state restoration
this.sendToConnection(connection, {
  type: 'ROOM_STATE',
  state: this.getPublicRoomState(),
  yourPlayerId: connection.id,
  yourHand: player.hand, // Restore their current hand
  timestamp: Date.now(),
});
```

### Anti-Patterns to Avoid

- **Removing player immediately on disconnect:** Players may return - use soft disconnect with grace period
- **Client-side disconnect detection:** Server must be authoritative; client can only show what server tells it
- **Multiple alarms per disconnect:** PartyKit only supports ONE alarm - must merge logic or use storage-based approach
- **Trusting connection.id for identity:** Use custom connection ID from localStorage, not PartyKit's auto-generated one

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reconnection retry logic | Custom retry loop | PartySocket auto-reconnect | Built-in exponential backoff, configurable |
| Persistent client identity | Session-based ID | useClientIdentity + localStorage | Already implemented, survives refresh |
| Turn timer during disconnect | Custom setTimeout | PartyKit alarm API | Survives hibernation, server-authoritative |
| Toast notifications | Custom notification system | sonner (existing) | Already integrated, consistent UX |

**Key insight:** The codebase already has most infrastructure for reconnection (useClientIdentity, isConnected tracking, PLAYER_RECONNECTED message). Phase 8 adds the grace period + AI takeover layer.

## Common Pitfalls

### Pitfall 1: Alarm Collision with Turn Timer

**What goes wrong:** Both turn timer and disconnect grace period want to use PartyKit's single alarm slot. Setting disconnect alarm cancels turn timer.
**Why it happens:** PartyKit only allows ONE alarm per room at a time.
**How to avoid:** Use storage-based approach:
1. Store pending actions in storage with timestamps
2. Set alarm for the NEAREST deadline
3. In onAlarm, check storage for all pending actions
4. Execute any that are due, reschedule for next
**Warning signs:** Turn timers stop working after player disconnects

### Pitfall 2: Race Condition on Reconnection During Turn

**What goes wrong:** Player disconnects, their turn comes, AI acts, player reconnects mid-action - conflicting state
**Why it happens:** Reconnection and AI action not properly synchronized
**How to avoid:**
1. AI action is atomic (single transaction)
2. Reconnection checks if it's player's turn and timer is still valid
3. If AI already acted, player just observes the result
**Warning signs:** Duplicate bids, corrupted game state

### Pitfall 3: Visual Flicker on Brief Disconnects

**What goes wrong:** Network hiccup causes player to appear disconnected for split second
**Why it happens:** Immediately showing disconnect state in UI
**How to avoid:** 5-10 second delay before showing disconnect visual (per CONTEXT.md decision)
**Warning signs:** Players appearing briefly grayed out during normal play

### Pitfall 4: Disconnect During Reveal Phase

**What goes wrong:** Player disconnects during dice reveal animation - unclear what state to restore
**Why it happens:** Reveal phase is transient, between rounds
**How to avoid:**
1. If in reveal phase when reconnecting, send full game state including revealed hands
2. Player can still see reveal and click "Continue"
3. Grace period still counts down during reveal
**Warning signs:** Reconnected player sees blank screen or wrong phase

### Pitfall 5: Host Disconnect Creates Orphan Room

**What goes wrong:** Host disconnects, host transfer happens, host reconnects - now they're not host but were
**Why it happens:** Host transfer happens independently of reconnection
**How to avoid:** Already handled - onClose transfers host to next connected player. Reconnected former-host is just a regular player. This is correct behavior per existing implementation.
**Warning signs:** None - this is already working correctly

## Code Examples

Verified patterns from existing codebase:

### Existing onClose Handler (to extend)
```typescript
// Source: party/index.ts lines 362-413
async onClose(connection: Party.Connection): Promise<void> {
  if (!this.roomState) return;

  const player = this.roomState.players.find(p => p.id === connection.id);
  if (player) {
    // Mark player as disconnected
    player.isConnected = false;
    // Host transfer logic...
    await this.persistState();

    // Notify other players
    this.broadcast({
      type: 'PLAYER_LEFT',
      playerId: connection.id,
      reason: 'disconnected',
      timestamp: Date.now(),
    }, [connection.id]);
  }
}
```

### Existing Reconnection Handler (to extend)
```typescript
// Source: party/index.ts lines 258-285
// In onConnect when returning player found
const existingPlayer = this.roomState.players.find(p => p.id === connection.id);
if (existingPlayer) {
  existingPlayer.isConnected = true;
  await this.persistState();

  this.sendToConnection(connection, {
    type: 'ROOM_STATE',
    state: this.getPublicRoomState(),
    yourPlayerId: connection.id,
    yourHand: safeHand,
    timestamp: Date.now(),
  });

  this.broadcast({
    type: 'PLAYER_RECONNECTED',
    playerId: connection.id,
    playerName: existingPlayer.name,
    timestamp: Date.now(),
  }, [connection.id]);
}
```

### Existing Alarm Pattern (reuse for disconnect)
```typescript
// Source: party/index.ts lines 38-54
private async setTurnTimer(): Promise<void> {
  if (!this.roomState?.gameState || this.roomState.gameState.phase !== 'bidding') return;

  const timeoutMs = this.roomState.settings.turnTimeoutMs;
  if (!timeoutMs || timeoutMs <= 0) return;

  const alarmTime = Date.now() + timeoutMs + 500;
  await this.room.storage.setAlarm(alarmTime);
}
```

### Client-side Reconnection Toast (to add)
```typescript
// Source: src/app/room/[code]/page.tsx lines 139-156
case 'PLAYER_RECONNECTED':
  setJoinState(prev => {
    if (prev.status === 'joined') {
      return {
        ...prev,
        roomState: {
          ...prev.roomState,
          players: prev.roomState.players.map(p =>
            p.id === message.playerId ? { ...p, isConnected: true } : p
          ),
        },
      };
    }
    return prev;
  });
  toast.success(`${message.playerName} reconnected`);
  break;
```

### Existing Visual Disconnect Indicator
```typescript
// Source: src/components/PlayerRow.tsx lines 43-45
{/* Disconnected indicator */}
{!player.isConnected && (
  <WifiOff className="w-4 h-4 text-white-soft/40 flex-shrink-0" />
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No reconnection support | Client ID matching | Phase 3-4 | Players can refresh and rejoin |
| Immediate disconnect removal | isConnected flag | Phase 3-4 | Soft disconnect tracking |
| No timeout AI | Alarm-based AI takeover | Phase 7 | Turn timers work server-side |

**Already implemented (reuse):**
- Client identity persistence (useClientIdentity)
- Connection status tracking (isConnected field)
- PLAYER_RECONNECTED message and handling
- Host transfer on disconnect
- WifiOff icon for disconnect visual
- Alarm-based server timing (turn timers)
- Conservative AI move generation (generateTimeoutAIMove)

**Needs implementation:**
- disconnectedAt timestamp tracking
- Grace period alarm scheduling
- Combined alarm handler (turn timer + disconnect)
- AI takeover on disconnect + turn
- Grayed-out visual styling for player cards
- Reconnection toast for the reconnecting player ("Welcome back!")

## Open Questions

Things that couldn't be fully resolved:

1. **Multiple player disconnects simultaneously**
   - What we know: PartyKit only allows one alarm per room
   - What's unclear: Best strategy when multiple players disconnect
   - Recommendation: Store all pending eliminations in storage, alarm fires for nearest, reschedules for next

2. **Disconnect during palifico round**
   - What we know: AI must bid same value (palifico rules)
   - What's unclear: Edge cases when disconnected player started the palifico round
   - Recommendation: Treat same as normal disconnect - AI follows palifico rules, existing generateTimeoutAIMove handles isPalifico

3. **Reconnection during AI action in progress**
   - What we know: AI action should be atomic
   - What's unclear: Exact timing if player reconnects during the few milliseconds of AI processing
   - Recommendation: Mark player as AI-controlled before acting, clear flag after. If reconnection happens during, player sees result of AI action.

## Sources

### Primary (HIGH confidence)
- [PartyKit Server API](https://docs.partykit.io/reference/partyserver-api/) - onClose, onConnect, getConnections, alarm API
- [PartyKit Scheduling with Alarms](https://docs.partykit.io/guides/scheduling-tasks-with-alarms/) - setAlarm, getAlarm patterns
- [PartySocket API](https://docs.partykit.io/reference/partysocket-api/) - custom ID, auto-reconnect configuration
- Existing codebase: party/index.ts, useClientIdentity.ts, useRoomConnection.ts

### Secondary (MEDIUM confidence)
- Phase 7 implementation patterns - alarm-based timing, AI takeover logic
- Phase 8 CONTEXT.md - user decisions on visual style, grace period, AI feedback

### Tertiary (LOW confidence)
- General WebSocket reconnection best practices - validated against PartyKit specifics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools already in codebase, documented APIs
- Architecture: HIGH - extends existing patterns (alarms, reconnection), clear path
- Pitfalls: MEDIUM - alarm collision is real risk, need careful implementation

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - PartyKit APIs stable)
