# Phase 1: Architecture Foundation - Research

**Researched:** 2026-01-18
**Domain:** Server-authoritative multiplayer architecture with PartyKit, Zustand, and Zod
**Confidence:** HIGH

## Summary

This phase establishes the foundational architecture for transforming the existing single-player Perudo game into a multiplayer application. The research confirms the selected stack (PartyKit, Zustand, Zod, nanoid) is well-suited for this architecture.

The core pattern is **server-authoritative state**: PartyKit manages the canonical game state, clients send intentions as messages, and the server validates and broadcasts state updates. The existing 40+ useState hooks in `page.tsx` must be aggressively refactored into clean state objects before multiplayer can be added - this cannot be an incremental migration.

Key architectural decisions:
- **Shared types** live in `src/shared/` and are imported by both PartyKit server (`party/`) and Next.js client (`src/`)
- **Message protocol** uses Zod discriminated unions with a `type` field as discriminator
- **State separation** distinguishes server-authoritative state (game rules, player data) from client-only UI state (animations, preferences)
- **Zustand** manages client-side state with slices for game state (synced from server) and UI state (local only)

**Primary recommendation:** Create a `src/shared/` directory for all types and Zod schemas, define the message protocol as discriminated unions, then refactor existing useState hooks into typed state objects before adding any networking code.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| partykit | latest | WebSocket server, real-time rooms | Purpose-built for multiplayer, runs on Cloudflare edge, handles scaling |
| partysocket | latest | WebSocket client with auto-reconnect | Official PartyKit client, handles reconnection and buffering |
| zustand | ^4.x | Client-side state management | Minimal boilerplate, works with React 19, subscription-based updates |
| zod | ^3.23 | Runtime validation and type inference | TypeScript-first, discriminated unions support, shared schemas |
| nanoid | ^5.x | Room code generation | Tiny, secure, supports custom alphabets for readable codes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ^20 | Node.js types | Already in project for TypeScript support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PartyKit | Colyseus | Colyseus is more full-featured but requires self-hosting; PartyKit is simpler for this scale |
| Zustand | Redux Toolkit | Redux has more ceremony; Zustand is simpler for medium complexity |
| Zod | io-ts | io-ts is more functional; Zod has better DX and discriminated union support |

**Installation:**
```bash
npm install partykit partysocket zustand zod nanoid
```

## Architecture Patterns

### Recommended Project Structure
```
perudo_vibe/
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── page.tsx            # Main game page (refactored)
│   ├── components/             # React components (existing)
│   ├── lib/
│   │   ├── gameLogic.ts        # Pure game logic (existing, may duplicate to server)
│   │   └── types.ts            # Legacy types (migrate to shared/)
│   ├── shared/                 # NEW: Shared types and schemas
│   │   ├── types.ts            # Server-authoritative state types
│   │   ├── messages.ts         # Zod schemas for client-server messages
│   │   └── constants.ts        # Shared constants (room code length, etc.)
│   └── stores/                 # NEW: Zustand stores
│       ├── gameStore.ts        # Server-synced game state
│       └── uiStore.ts          # Client-only UI state
├── party/                      # NEW: PartyKit server
│   └── index.ts                # Main PartyKit server implementation
├── partykit.json               # PartyKit configuration
└── package.json
```

### Pattern 1: Server-Authoritative State

**What:** Server owns all game state. Clients send "intentions" (e.g., "I want to bid"), server validates, updates state, and broadcasts.

**When to use:** Always for game logic that affects other players or could be cheated.

**Example:**
```typescript
// src/shared/messages.ts
import { z } from 'zod';

// Client -> Server messages (intentions)
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('JOIN_ROOM'),
    playerName: z.string().min(1).max(20),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('PLACE_BID'),
    bid: z.object({ count: z.number(), value: z.number() }),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('CALL_DUDO'),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('CALL_CALZA'),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('START_GAME'),
    timestamp: z.number(),
  }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server -> Client messages (state updates and errors)
export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ROOM_STATE'),
    state: RoomStateSchema,  // Full room state
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('GAME_STATE'),
    state: GameStateSchema,  // Full game state
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('ERROR'),
    error: z.object({
      type: z.enum(['INVALID_BID', 'NOT_YOUR_TURN', 'GAME_NOT_STARTED', 'ROOM_FULL']),
      reason: z.string(),
    }),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('PLAYER_JOINED'),
    player: PlayerSchema,
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('PLAYER_LEFT'),
    playerId: z.string(),
    timestamp: z.number(),
  }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
```

### Pattern 2: State Type Separation

**What:** Separate server-authoritative state from client-only UI state.

**When to use:** Always when building multiplayer - prevents mixing network-synced state with local UI state.

**Example:**
```typescript
// src/shared/types.ts - Server-authoritative types
export interface ServerGameState {
  phase: 'lobby' | 'rolling' | 'bidding' | 'reveal' | 'ended';
  players: ServerPlayer[];
  currentBid: Bid | null;
  currentTurnPlayerId: string | null;
  roundStarterId: string | null;
  lastBidderId: string | null;
  isPalifico: boolean;
  roundNumber: number;
}

export interface ServerPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  diceCount: number;
  hand: number[];        // Only sent to that specific player
  isConnected: boolean;
  isEliminated: boolean;
}

export interface ServerRoomState {
  roomCode: string;
  hostId: string;
  players: ServerPlayer[];
  gameState: ServerGameState | null;
  settings: GameSettings;
}

// src/stores/uiStore.ts - Client-only UI state
interface UIState {
  // Animation state
  isRolling: boolean;
  showDudoOverlay: boolean;
  revealProgress: number;
  dyingDieOwner: string | null;
  dyingDieIndex: number;
  highlightedDiceIndex: number;

  // Local preferences
  soundEnabled: boolean;
  theme: 'dark' | 'light';

  // Connection state
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}
```

### Pattern 3: Zustand Store with Server Sync

**What:** Use Zustand to manage client state, with a slice that syncs from server messages.

**When to use:** For the main game state store that receives updates from PartyKit.

**Example:**
```typescript
// src/stores/gameStore.ts
import { create } from 'zustand';
import type { ServerRoomState, ServerGameState } from '@/shared/types';

interface GameStore {
  // Server-synced state
  roomState: ServerRoomState | null;
  myPlayerId: string | null;
  myHand: number[];  // Private - only my dice

  // Actions (called from WebSocket message handlers)
  setRoomState: (state: ServerRoomState) => void;
  setMyHand: (hand: number[]) => void;
  updatePlayer: (playerId: string, updates: Partial<ServerPlayer>) => void;
  reset: () => void;

  // Derived state (computed from server state)
  get isMyTurn(): boolean;
  get currentPlayer(): ServerPlayer | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  roomState: null,
  myPlayerId: null,
  myHand: [],

  setRoomState: (state) => set({ roomState: state }),
  setMyHand: (hand) => set({ myHand: hand }),
  updatePlayer: (playerId, updates) => set((state) => ({
    roomState: state.roomState ? {
      ...state.roomState,
      players: state.roomState.players.map(p =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    } : null,
  })),
  reset: () => set({ roomState: null, myPlayerId: null, myHand: [] }),

  get isMyTurn() {
    const { roomState, myPlayerId } = get();
    return roomState?.gameState?.currentTurnPlayerId === myPlayerId;
  },
  get currentPlayer() {
    const { roomState } = get();
    if (!roomState?.gameState) return null;
    return roomState.players.find(p => p.id === roomState.gameState!.currentTurnPlayerId) ?? null;
  },
}));
```

### Pattern 4: PartyKit Message Handler

**What:** Type-safe message handling with Zod validation on the server.

**When to use:** For all incoming messages in the PartyKit server.

**Example:**
```typescript
// party/index.ts
import type * as Party from 'partykit/server';
import { ClientMessageSchema, type ClientMessage } from '../src/shared/messages';

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    // Parse and validate incoming message
    let parsed: ClientMessage;
    try {
      const raw = JSON.parse(message);
      parsed = ClientMessageSchema.parse(raw);
    } catch (error) {
      sender.send(JSON.stringify({
        type: 'ERROR',
        error: { type: 'INVALID_MESSAGE', reason: 'Malformed message' },
        timestamp: Date.now(),
      }));
      return;
    }

    // Handle by type - TypeScript narrows the type automatically
    switch (parsed.type) {
      case 'JOIN_ROOM':
        await this.handleJoinRoom(parsed, sender);
        break;
      case 'PLACE_BID':
        await this.handlePlaceBid(parsed, sender);
        break;
      case 'CALL_DUDO':
        await this.handleCallDudo(parsed, sender);
        break;
      case 'CALL_CALZA':
        await this.handleCallCalza(parsed, sender);
        break;
      case 'START_GAME':
        await this.handleStartGame(parsed, sender);
        break;
    }
  }
}
```

### Anti-Patterns to Avoid

- **Mixing server and client state:** Never put UI animation state in the same store/type as server-authoritative state.
- **Trusting client data:** Never accept game-critical data (dice values, player positions) from clients without server validation.
- **Duplicating state:** Don't keep separate client-side copies of data the server manages - derive from server state.
- **Networking before refactoring:** Don't try to add PartyKit to the existing 40+ useState hooks - refactor first.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket reconnection | Manual reconnection logic | PartySocket | Handles reconnection, buffering, multi-platform |
| Message validation | typeof checks | Zod schemas | Type inference, discriminated unions, runtime safety |
| Unique IDs | Math.random() | nanoid | Cryptographically secure, shorter, custom alphabets |
| State management | Multiple useStates | Zustand | Subscription-based, avoids re-render cascades |
| Room code generation | Custom function | nanoid customAlphabet | Collision-proof, configurable length/alphabet |

**Key insight:** The existing `page.tsx` with 40+ useState hooks shows why hand-rolling state management doesn't scale. Zustand with typed stores prevents this complexity explosion.

## Common Pitfalls

### Pitfall 1: Trying to Layer Networking on Existing State

**What goes wrong:** Attempting to add WebSocket sync to the existing useState hooks creates a maze of stale closures, race conditions, and inconsistent state.

**Why it happens:** useState was designed for local UI state, not synchronized networked state. The current refs (`opponentsRef`, `currentBidRef`, etc.) are already a sign of fighting against React's model.

**How to avoid:** Complete the refactor to Zustand BEFORE adding any networking. Extract all game state to typed store slices first.

**Warning signs:** Finding yourself adding more refs to work around stale closures; having to call `setState` from multiple places for one logical update.

### Pitfall 2: Sending Private Data to All Clients

**What goes wrong:** Broadcasting game state includes all players' dice hands, allowing cheating.

**Why it happens:** It's easy to serialize the whole game state and broadcast it.

**How to avoid:** Server must construct per-player messages. Each player receives:
- Their own dice hand
- Other players' dice counts (not values)
- Public game state (bids, turn order)

**Warning signs:** Using `room.broadcast()` for everything without filtering sensitive fields.

### Pitfall 3: Not Validating Server Messages on Client

**What goes wrong:** Client crashes or behaves unexpectedly when server sends malformed or unexpected message types.

**Why it happens:** Assuming the server always sends valid data.

**How to avoid:** Use Zod to validate incoming server messages on the client too. Handle validation errors gracefully.

**Warning signs:** TypeScript says message is `ServerMessage` but runtime crashes on undefined properties.

### Pitfall 4: Forgetting Timestamps

**What goes wrong:** Out-of-order message processing causes inconsistent state.

**Why it happens:** Network latency can reorder messages.

**How to avoid:** Include `timestamp` on every message (per CONTEXT.md decision). Client can discard or reorder as needed.

**Warning signs:** Intermittent "impossible" state where old actions override new ones.

### Pitfall 5: Overloading PartyKit Room Memory

**What goes wrong:** Without hibernation, rooms are limited to ~100 connections.

**Why it happens:** Each connection consumes memory in the room.

**How to avoid:** For Perudo (max 6 players), this isn't an issue. But consider hibernation for future scaling.

**Warning signs:** Connection failures when testing with more users (not a concern for 2-6 player Perudo).

## Code Examples

Verified patterns from official sources:

### PartyKit Server Setup
```typescript
// party/index.ts
import type * as Party from 'partykit/server';

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Called when room starts or wakes from hibernation
  async onStart() {
    // Load persisted state if needed
    const savedState = await this.room.storage.get<GameState>('gameState');
    if (savedState) {
      this.gameState = savedState;
    }
  }

  // Called when a client connects
  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    // Access URL params: new URL(ctx.request.url).searchParams.get('name')
    connection.setState({ joined: Date.now() });
  }

  // Called when a message is received
  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    // Handle string messages (JSON)
    if (typeof message === 'string') {
      const data = JSON.parse(message);
      // Process and broadcast
      this.room.broadcast(JSON.stringify({ type: 'update', data }), [sender.id]);
    }
  }

  // Called when a client disconnects
  async onClose(connection: Party.Connection) {
    // Clean up player data
  }
}
```

### PartySocket Client Connection
```typescript
// src/hooks/usePartySocket.ts
import PartySocket from 'partysocket';
import { useEffect, useRef } from 'react';
import { ServerMessageSchema } from '@/shared/messages';
import { useGameStore } from '@/stores/gameStore';

export function usePartySocket(roomCode: string, playerName: string) {
  const socketRef = useRef<PartySocket | null>(null);
  const { setRoomState, setMyHand } = useGameStore();

  useEffect(() => {
    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
      room: roomCode,
      query: { name: playerName },
    });

    socket.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const message = ServerMessageSchema.parse(raw);

        switch (message.type) {
          case 'ROOM_STATE':
            setRoomState(message.state);
            break;
          case 'GAME_STATE':
            // Handle game state update
            break;
          case 'ERROR':
            console.error('Server error:', message.error);
            break;
        }
      } catch (error) {
        console.error('Invalid server message:', error);
      }
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [roomCode, playerName]);

  return socketRef;
}
```

### Room Code Generation with nanoid
```typescript
// src/shared/roomCode.ts
import { customAlphabet } from 'nanoid';

// Readable alphabet - no confusing characters (0/O, 1/I/l)
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

export const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

// Usage: generateRoomCode() => "K7X3M2"
```

### Zod Discriminated Union for Error Types
```typescript
// src/shared/errors.ts
import { z } from 'zod';

export const GameErrorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INVALID_BID'),
    reason: z.string(),
    currentBid: z.object({ count: z.number(), value: z.number() }).optional(),
  }),
  z.object({
    type: z.literal('NOT_YOUR_TURN'),
    reason: z.string(),
    currentPlayerId: z.string(),
  }),
  z.object({
    type: z.literal('GAME_NOT_STARTED'),
    reason: z.string(),
  }),
  z.object({
    type: z.literal('ROOM_FULL'),
    reason: z.string(),
    maxPlayers: z.number(),
  }),
]);

export type GameError = z.infer<typeof GameErrorSchema>;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.io for WebSockets | PartyKit / partysocket | 2023-2024 | Simpler API, edge-first, auto-reconnect |
| Redux for state | Zustand | 2020-ongoing | Less boilerplate, better React 18/19 support |
| Manual type guards | Zod discriminated unions | 2022-ongoing | Automatic narrowing, runtime validation |
| UUID for IDs | nanoid | 2018-ongoing | 60% smaller IDs, faster, secure |

**Deprecated/outdated:**
- `PartyKitServer` type: Legacy, use `Party.Server` interface with class syntax
- `export default {} satisfies PartyKitServer`: Legacy pattern, use class exports
- Zustand `vars` in partykit.json: Deprecated, use environment variable management

## Open Questions

Things that couldn't be fully resolved:

1. **Game logic duplication strategy**
   - What we know: `gameLogic.ts` contains bid validation, dice counting, AI logic
   - What's unclear: Should server import from `src/lib/gameLogic.ts` or duplicate?
   - Recommendation: Move pure game logic functions to `src/shared/gameLogic.ts` and import from both. AI logic stays server-only.

2. **Player hand privacy implementation**
   - What we know: Server must not broadcast all hands to all players
   - What's unclear: Best pattern for per-player state in PartyKit
   - Recommendation: Use `connection.send()` for private data, `room.broadcast()` for public state. Store player ID on connection state.

3. **Existing component refactoring scope**
   - What we know: 40+ useState hooks must be consolidated
   - What's unclear: Which components need updates vs just prop changes
   - Recommendation: Start with page.tsx, components may only need prop type changes once store is in place.

## Sources

### Primary (HIGH confidence)
- [PartyKit Server API Documentation](https://docs.partykit.io/reference/partyserver-api/) - Server implementation patterns
- [PartyKit Configuration Reference](https://docs.partykit.io/reference/partykit-configuration/) - partykit.json schema
- [PartySocket Client API](https://docs.partykit.io/reference/partysocket-api/) - Client connection patterns
- [Zod Documentation](https://zod.dev/) - Schema validation and type inference
- [Zod API - Discriminated Unions](https://zod.dev/api) - discriminatedUnion pattern
- [Zustand GitHub](https://github.com/pmndrs/zustand) - State management patterns
- [Zustand Slices Pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern) - Store organization
- [nanoid GitHub](https://github.com/ai/nanoid) - ID generation with custom alphabets

### Secondary (MEDIUM confidence)
- [PartyKit Next.js Chat Template](https://github.com/partykit/partykit-nextjs-chat-template) - Project structure reference
- [Server Authoritative Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html) - Game networking fundamentals
- [Colyseus Framework](https://colyseus.io/) - TypeScript multiplayer patterns reference
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Type narrowing patterns

### Tertiary (LOW confidence)
- Various Medium/DEV.to articles on Next.js project structure - Community patterns (verified against official docs)
- Stack Overflow discussions on Zustand + React 19 - Compatibility confirmation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools have official documentation and active maintenance
- Architecture: HIGH - Patterns verified against PartyKit docs and real examples
- Pitfalls: MEDIUM - Based on general multiplayer patterns and PartyKit GitHub issues

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stack is stable)
