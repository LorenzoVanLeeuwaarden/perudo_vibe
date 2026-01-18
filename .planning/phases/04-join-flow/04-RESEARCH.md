# Phase 4: Join Flow - Research

**Researched:** 2026-01-18
**Domain:** PartyKit room joining, client identity persistence, nickname validation, page transitions
**Confidence:** HIGH

## Summary

Phase 4 implements the join flow for users accessing a room via shareable link. Users opening a room link see a nickname entry form with real-time validation, room info preview (code + player count), and a "Join Game" button. After joining, they transition smoothly to the room lobby.

The implementation builds on the existing PartyKit infrastructure from Phase 3. Key additions include: (1) a client-side identity system using nanoid and localStorage to identify returning users, (2) server-side join validation with duplicate nickname checking and room state verification, (3) a join form component with real-time character counting and validation states, and (4) Framer Motion transitions between join form and lobby.

The existing `useRoomConnection` hook and `party/index.ts` server need expansion to handle the JOIN_ROOM message flow. The `uiStore` already persists `playerName` via Zustand persist middleware, which covers the "pre-fill saved nickname" requirement.

**Primary recommendation:** Use a client-generated ID (via nanoid) stored in localStorage to identify returning users. Send this ID with JOIN_ROOM message. Server maintains a mapping of client IDs to player IDs for reconnection. Join form validates nickname length client-side but server performs authoritative duplicate check.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `partysocket` | ^1.1.10 | WebSocket client with custom ID support | Already installed, supports custom connection IDs |
| `nanoid` | ^5.1.6 | Client identity generation | Already installed, secure, 21-char default is collision-proof |
| `zustand` | ^5.0.10 | Persist nickname + client ID | Already installed with persist middleware configured |
| `zod` | ^4.3.5 | Nickname validation schema | Already installed, consistent with message validation |
| `framer-motion` | ^11.15.0 | Page transitions | Already installed, AnimatePresence for mount/unmount |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | ^2.x | Toast notifications | For "player joined" notifications (NEW - needs install) |
| `lucide-react` | ^0.468.0 | Icons for form states | Already installed (Check, AlertCircle, Loader2) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast | Both work, sonner has better DX and shadcn integration |
| nanoid for client ID | FingerprintJS | Fingerprinting is fragile with privacy protections; localStorage + nanoid is simpler |
| Custom client ID | PartyKit auto-generated ID | Auto-generated changes on refresh; custom ID enables reconnection |

**Installation:**
```bash
npm install sonner
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    room/
      [code]/
        page.tsx          # Route handler, determines join vs lobby view
  components/
    JoinForm.tsx          # NEW: Nickname input form with validation
    RoomLobby.tsx         # Existing, receives joined player state
    RoomShare.tsx         # Existing share UI
  hooks/
    useRoomConnection.ts  # Expand to handle join flow states
    useClientIdentity.ts  # NEW: Client ID generation and persistence
  stores/
    uiStore.ts            # Already persists playerName
party/
  index.ts                # Expand handleJoinRoom implementation
```

### Pattern 1: Client Identity with Persistent ID

**What:** Generate a unique client ID on first visit, store in localStorage, send with all connections.
**When to use:** To identify returning users across page refreshes and reconnections.
**Example:**
```typescript
// src/hooks/useClientIdentity.ts
import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

const CLIENT_ID_KEY = 'perudo-client-id';

export function useClientIdentity() {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = nanoid(); // 21 chars, collision-proof
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    setClientId(id);
  }, []);

  return clientId;
}
```

### Pattern 2: PartySocket with Custom Connection ID

**What:** Pass client ID to PartySocket so server can identify returning users.
**When to use:** When connecting to a room, to enable reconnection with same identity.
**Example:**
```typescript
// Source: PartyKit docs - partysocket-api
import usePartySocket from 'partysocket/react';

function useRoomConnection({ roomCode, clientId, onMessage }) {
  const ws = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: roomCode,
    id: clientId, // Custom ID persists across reconnections

    onOpen() {
      // Connection established, but player not yet joined
      // Must send JOIN_ROOM message with nickname
    },
    onMessage(event) {
      // Handle server messages
    },
  });

  return ws;
}
```

### Pattern 3: Two-Phase Connection (Connect then Join)

**What:** WebSocket connects first, then client sends JOIN_ROOM with nickname to officially join.
**When to use:** To separate connection establishment from room membership.
**Example:**
```typescript
// Client flow:
// 1. Connect via PartySocket (automatic)
// 2. Server sends ROOM_INFO (player count, room status) to connected client
// 3. Client displays join form with room info
// 4. User submits nickname
// 5. Client sends JOIN_ROOM { playerName, timestamp }
// 6. Server validates (not full, no duplicate name, not in progress)
// 7. Server sends ROOM_STATE to joiner, PLAYER_JOINED to others

// Server message for pre-join info
z.object({
  type: z.literal('ROOM_INFO'),
  roomCode: z.string(),
  playerCount: z.number(),
  maxPlayers: z.number(),
  gameInProgress: z.boolean(),
  timestamp: z.number(),
})
```

### Pattern 4: Server-Side Duplicate Nickname Check

**What:** Server validates nickname uniqueness before allowing join.
**When to use:** When processing JOIN_ROOM messages.
**Example:**
```typescript
// party/index.ts
private async handleJoinRoom(
  msg: Extract<ClientMessage, { type: 'JOIN_ROOM' }>,
  sender: Party.Connection
): Promise<void> {
  const { playerName } = msg;

  // Check if room exists and is valid
  if (!this.roomState) {
    // First player creates room and becomes host
    this.roomState = this.createRoom(sender.id, playerName);
  } else {
    // Check for duplicate nickname
    const duplicateName = this.roomState.players.some(
      p => p.name.toLowerCase() === playerName.toLowerCase() && p.isConnected
    );
    if (duplicateName) {
      this.sendError(sender, 'INVALID_NAME', 'This name is taken. Choose another.');
      return;
    }

    // Check room capacity
    if (this.roomState.players.filter(p => p.isConnected).length >= MAX_PLAYERS) {
      this.sendError(sender, 'ROOM_FULL', `Room is full (${MAX_PLAYERS}/${MAX_PLAYERS} players).`);
      return;
    }

    // Check game state
    if (this.roomState.gameState?.phase !== 'lobby' && this.roomState.gameState !== null) {
      this.sendError(sender, 'INVALID_ACTION', 'Game in progress. Wait until it ends.');
      return;
    }
  }

  // Add player and broadcast
  const player = this.addPlayer(sender.id, playerName);
  await this.persistState();

  // Send full state to joiner
  this.sendToConnection(sender, {
    type: 'ROOM_STATE',
    state: this.getPublicRoomState(),
    yourPlayerId: sender.id,
    timestamp: Date.now(),
  });

  // Notify others
  this.broadcast({
    type: 'PLAYER_JOINED',
    player: this.getPublicPlayer(player),
    timestamp: Date.now(),
  }, [sender.id]);
}
```

### Pattern 5: Returning User Auto-Rejoin

**What:** Server recognizes returning users by client ID stored on connection.
**When to use:** When a user who already joined refreshes or reconnects.
**Example:**
```typescript
// party/index.ts
async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
  // Store client ID from connection
  const clientId = connection.id; // This is the custom ID from PartySocket

  if (this.roomState) {
    // Check if this client was already a player
    const existingPlayer = this.roomState.players.find(
      p => p.id === clientId
    );

    if (existingPlayer) {
      // Returning user - update connection status
      existingPlayer.isConnected = true;
      await this.persistState();

      // Check if their nickname is now taken by someone else
      // (shouldn't happen if we track by client ID, but defensive)

      // Send current state immediately - skip join form
      this.sendToConnection(connection, {
        type: 'ROOM_STATE',
        state: this.getPublicRoomState(),
        yourPlayerId: clientId,
        yourHand: existingPlayer.hand,
        timestamp: Date.now(),
      });

      // Notify others of reconnection
      this.broadcast({
        type: 'PLAYER_RECONNECTED',
        playerId: clientId,
        timestamp: Date.now(),
      }, [clientId]);

      return; // Don't send ROOM_INFO, they're already in
    }
  }

  // New user - send room info for join form
  this.sendToConnection(connection, {
    type: 'ROOM_INFO',
    roomCode: this.room.id,
    playerCount: this.roomState?.players.filter(p => p.isConnected).length ?? 0,
    maxPlayers: MAX_PLAYERS,
    gameInProgress: this.roomState?.gameState !== null &&
                    this.roomState?.gameState?.phase !== 'lobby',
    timestamp: Date.now(),
  });
}
```

### Pattern 6: AnimatePresence for Join/Lobby Transition

**What:** Smooth fade/slide animation between join form and lobby view.
**When to use:** When transitioning after successful join.
**Example:**
```typescript
// src/app/room/[code]/page.tsx
import { AnimatePresence, motion } from 'framer-motion';

function RoomPage() {
  const [isJoined, setIsJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  return (
    <AnimatePresence mode="wait">
      {!isJoined ? (
        <motion.div
          key="join-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <JoinForm
            roomInfo={roomInfo}
            onJoin={handleJoin}
          />
        </motion.div>
      ) : (
        <motion.div
          key="lobby"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <RoomLobby roomCode={roomCode} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Pattern 7: Toast Notifications with Sonner

**What:** Show toast when players join/leave.
**When to use:** When PLAYER_JOINED message received.
**Example:**
```typescript
// Install: npm install sonner
import { Toaster, toast } from 'sonner';

// In layout or app root
<Toaster position="top-center" richColors />

// In message handler
case 'PLAYER_JOINED':
  toast.success(`${message.player.name} joined`);
  break;
```

### Anti-Patterns to Avoid

- **Trusting client-provided nickname without server validation:** Always validate length and uniqueness on server.
- **Using PartyKit auto-generated connection ID for identity:** Changes on every page refresh; use custom persistent ID.
- **Showing lobby before JOIN_ROOM confirmed:** Wait for ROOM_STATE response before transitioning.
- **Blocking join form while waiting for ROOM_INFO:** Show form immediately with loading state for room info.
- **Case-sensitive nickname comparison:** Normalize to lowercase for duplicate check.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client identity persistence | Cookie-based session ID | nanoid + localStorage | Simple, no server session needed, works across reconnects |
| Nickname character validation | Regex patterns | Zod string schema | Already using Zod, consistent validation |
| Page transition animations | CSS transitions | Framer Motion AnimatePresence | Already in project, handles mount/unmount |
| Toast notifications | Custom overlay component | sonner | Minimal setup, accessible, styled well |
| Connection ID management | Manual tracking | PartySocket custom `id` option | Built-in support, handles reconnection |

**Key insight:** The existing infrastructure (PartyKit, Zustand persist, Framer Motion) handles most complexity. Focus on the join flow logic, not building new systems.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with localStorage

**What goes wrong:** Server-rendered page doesn't match client after hydration because localStorage isn't available on server.
**Why it happens:** Next.js SSR runs without localStorage; client reads stored values on mount.
**How to avoid:** Use `useEffect` to read localStorage; show loading/default state until hydrated; use `suppressHydrationWarning` if needed.
**Warning signs:** Console warnings about hydration mismatch; nickname field briefly empty then filled.

### Pitfall 2: Racing Between Connect and Room State

**What goes wrong:** Client sends JOIN_ROOM before receiving ROOM_INFO, missing room status.
**Why it happens:** usePartySocket fires onOpen immediately on connection.
**How to avoid:** Wait for ROOM_INFO message before enabling join button; track connection state vs. joined state separately.
**Warning signs:** Join fails with "room not found" when room exists but info hasn't loaded.

### Pitfall 3: Returning User with Taken Nickname

**What goes wrong:** User returns to room, but someone else took their nickname in the meantime.
**Why it happens:** Room persists players by client ID, but nickname could theoretically conflict.
**How to avoid:** Server should check on reconnect: if existing player's name matches another connected player, force re-entry. Track by client ID primarily, not nickname.
**Warning signs:** Two players with same name in lobby; reconnection silently fails.

### Pitfall 4: Join Form Submission While Processing

**What goes wrong:** User clicks "Join Game" multiple times, causing duplicate join attempts.
**Why it happens:** Button isn't disabled during processing; no loading state.
**How to avoid:** Track `isSubmitting` state; disable button and show spinner while awaiting server response.
**Warning signs:** Multiple PLAYER_JOINED notifications; error about already being in room.

### Pitfall 5: Not Handling Room Closed/Not Found

**What goes wrong:** User opens stale link, sees broken join form or endless loading.
**Why it happens:** Room may have been cleaned up by PartyKit after inactivity.
**How to avoid:** Server sends ROOM_NOT_FOUND error; client shows dedicated error page with link to home.
**Warning signs:** WebSocket connects but no ROOM_INFO received; perpetual "connecting" state.

### Pitfall 6: Emoji Nickname Length Validation

**What goes wrong:** User enters 12 emoji, but it exceeds expected "12 characters" due to multi-byte encoding.
**Why it happens:** JavaScript string.length counts UTF-16 code units, not grapheme clusters.
**How to avoid:** Decision: Allow emoji per CONTEXT.md. For length validation, use `[...string].length` to count grapheme clusters, or accept that string.length may overcount some emoji.
**Warning signs:** Nicknames appearing truncated; validation errors for seemingly valid lengths.

## Code Examples

Verified patterns from official sources and existing codebase:

### Client Identity Hook
```typescript
// src/hooks/useClientIdentity.ts
import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

const CLIENT_ID_KEY = 'perudo-client-id';

export function useClientIdentity(): string | null {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Only runs on client
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = nanoid();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    setClientId(id);
  }, []);

  return clientId;
}
```

### Extended Message Schema
```typescript
// src/shared/messages.ts - additions needed
z.object({
  type: z.literal('ROOM_INFO'),
  roomCode: z.string(),
  playerCount: z.number(),
  maxPlayers: z.number(),
  gameInProgress: z.boolean(),
  timestamp: z.number(),
}),

z.object({
  type: z.literal('PLAYER_RECONNECTED'),
  playerId: z.string(),
  timestamp: z.number(),
}),
```

### Nickname Validation Schema
```typescript
// Nickname validation with Zod
const NicknameSchema = z.string()
  .min(2, 'Nickname must be at least 2 characters')
  .max(12, 'Nickname must be at most 12 characters')
  .refine(s => s.trim().length > 0, 'Nickname cannot be empty');
```

### Join Form Component Structure
```typescript
// src/components/JoinForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface JoinFormProps {
  roomCode: string;
  roomInfo: { playerCount: number; maxPlayers: number } | null;
  isLoading: boolean;
  error: string | null;
  onSubmit: (nickname: string) => void;
}

export function JoinForm({ roomCode, roomInfo, isLoading, error, onSubmit }: JoinFormProps) {
  const { playerName, setPlayerName } = useUIStore();
  const [localName, setLocalName] = useState(playerName);

  const charCount = [...localName].length; // Grapheme-aware length
  const isValid = charCount >= 2 && charCount <= 12;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      setPlayerName(localName.trim());
      onSubmit(localName.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Room info */}
      <div className="text-center">
        <p className="text-4xl font-mono font-bold tracking-widest">{roomCode}</p>
        {roomInfo && (
          <p className="text-white-soft/60 text-sm mt-2">
            {roomInfo.playerCount} / {roomInfo.maxPlayers} players
          </p>
        )}
      </div>

      {/* Nickname input */}
      <div>
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="Enter nickname"
          autoFocus
          className="w-full p-3 bg-purple-deep/50 border border-purple-mid rounded-lg"
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={charCount < 2 || charCount > 12 ? 'text-red-danger' : 'text-white-soft/40'}>
            {charCount}/12
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-danger text-sm text-center">{error}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-3 bg-gold-accent text-purple-deep font-bold rounded-lg disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Joining...
          </span>
        ) : (
          'Join Game'
        )}
      </button>
    </form>
  );
}
```

### Room Page State Machine
```typescript
// src/app/room/[code]/page.tsx
type JoinState =
  | { status: 'connecting' }      // WebSocket connecting
  | { status: 'room-info'; info: RoomInfo }  // Got room info, show form
  | { status: 'joining' }         // Sent JOIN_ROOM, waiting
  | { status: 'joined' }          // In lobby
  | { status: 'error'; error: string }; // Failed
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session cookies for identity | localStorage + client ID | 2023+ | Simpler, no server session, works offline |
| Form libraries (Formik) | Native + Zustand | 2024+ | Less overhead for simple forms |
| Custom reconnection tracking | PartySocket custom ID | 2024 | Built-in support for persistent identity |
| react-toastify | sonner | 2023+ | Better DX, smaller bundle, shadcn integration |

**Deprecated/outdated:**
- Using `navigator.vibrate()` for form feedback: Inconsistent support
- Blocking form render until socket connected: Show form with loading state instead
- Per-room nickname storage: Use global preference (already in uiStore)

## Open Questions

Things that couldn't be fully resolved:

1. **Exact behavior when returning user's name is taken**
   - What we know: CONTEXT.md says "force new name entry"
   - What's unclear: Show error and keep them on join form? Or auto-append number?
   - Recommendation: Show join form with error "Your previous name is taken. Choose another."

2. **Welcome message for joining player (Claude's Discretion)**
   - What we know: CONTEXT.md lists as discretion
   - Options: Toast saying "Welcome, [name]!", or no explicit welcome (lobby shows them in list)
   - Recommendation: Skip welcome toast; seeing yourself in player list is sufficient feedback

3. **Room info refresh rate (Claude's Discretion)**
   - What we know: Show player count on join form
   - What's unclear: Update live while on join form? Or static snapshot?
   - Recommendation: Update live - server broadcasts PLAYER_JOINED/LEFT, form updates count

4. **Error page styling (Claude's Discretion)**
   - What we know: Room not found goes to dedicated error page
   - What's unclear: Full page or overlay?
   - Recommendation: Full page matching existing design system with CasinoLogo and link home

## Sources

### Primary (HIGH confidence)
- [PartyKit PartySocket API](https://docs.partykit.io/reference/partysocket-api/) - Custom connection ID, reconnection behavior
- [PartyKit Server API](https://docs.partykit.io/reference/partyserver-api/) - onConnect, connection.setState, message handling
- [nanoid GitHub](https://github.com/ai/nanoid) - Collision-proof ID generation
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - localStorage persistence pattern
- Existing codebase: `src/stores/uiStore.ts` - playerName already persisted
- Existing codebase: `src/shared/messages.ts` - Message schema patterns

### Secondary (MEDIUM confidence)
- [Framer Motion AnimatePresence](https://motion.dev/motion/animate-presence/) - Page transition patterns (docs redirect)
- [sonner npm](https://www.npmjs.com/package/sonner) - Toast notification library
- Various web searches on React form validation patterns - Character counter implementations

### Tertiary (LOW confidence)
- Browser fingerprinting articles (considered and rejected in favor of simpler localStorage approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed or verified via npm
- Architecture: HIGH - Builds on existing Phase 3 implementation patterns
- Pitfalls: MEDIUM - Based on general patterns and CONTEXT.md requirements
- Returning user flow: MEDIUM - Custom ID approach is standard but needs testing

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable patterns, no major version changes expected)
