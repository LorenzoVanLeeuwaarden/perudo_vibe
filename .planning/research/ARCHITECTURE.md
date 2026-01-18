# Architecture Patterns: Real-Time Multiplayer Browser Games

**Domain:** Turn-based multiplayer browser game (Perudo dice game)
**Researched:** 2026-01-18
**Confidence:** HIGH (verified against multiple authoritative sources)

## Executive Summary

This document outlines architecture patterns for adding multiplayer to the existing Perudo single-player game. The recommended approach uses a **server-authoritative model** with **WebSocket communication**, **room-based lobbies**, and **state synchronization**. The existing client-side React game will be refactored to separate UI from game logic, with the server becoming the source of truth.

---

## Recommended Architecture

```
                    +------------------+
                    |  Client Browser  |
                    |   (Next.js App)  |
                    |                  |
                    |  +------------+  |
                    |  |   React    |  |
                    |  |    UI      |  |
                    |  +-----+------+  |
                    |        |         |
                    |  +-----v------+  |
                    |  |  Socket    |  |
                    |  |  Client    |  |
                    +--+-----+------+--+
                             |
                    WebSocket Connection
                             |
                    +--------v---------+
                    |   Game Server    |
                    |  (Node.js/WS)    |
                    |                  |
                    |  +------------+  |
                    |  |   Room     |  |
                    |  |  Manager   |  |
                    |  +-----+------+  |
                    |        |         |
                    |  +-----v------+  |
                    |  |   Game     |  |
                    |  |   State    |  |
                    |  +-----+------+  |
                    |        |         |
                    |  +-----v------+  |
                    |  |   Game     |  |
                    |  |   Logic    |  |
                    |  +------------+  |
                    +------------------+
```

### Core Principle: Server as Source of Truth

The server maintains authoritative game state. Clients send inputs (bids, dudo calls) and receive state updates. This prevents cheating and ensures all players see consistent game state.

**Sources:**
- [Gabriel Gambetta - Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Heroic Labs - Authoritative Multiplayer](https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/)

---

## Component Boundaries

### 1. Client Layer (Browser)

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **React UI** | Render game state, capture user input | Socket Client |
| **Socket Client** | WebSocket connection, message serialization | Game Server |
| **Local State** | UI-only state (animations, modals) | React UI |

**Key insight:** The existing 40+ useState hooks in page.tsx must be split:
- **UI State** (stays client-side): animation states, modal visibility, selected color
- **Game State** (moves to server): playerHand, currentBid, opponents, gameState

### 2. Server Layer (Node.js)

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Connection Manager** | Handle WebSocket connections, auth | Room Manager |
| **Room Manager** | Create/join/leave rooms, lobby management | Game State Manager |
| **Game State Manager** | Store authoritative state per room | Game Logic |
| **Game Logic** | Bid validation, turn order, win conditions | Game State Manager |
| **AI Controller** | Run AI turns, handle bot replacement | Game Logic |
| **Reconnection Handler** | Restore player sessions | Room Manager |

### 3. Shared Layer (Both Client and Server)

| Component | Responsibility | Used By |
|-----------|---------------|---------|
| **Types** | TypeScript interfaces for game state | Both |
| **Game Rules** | Bid validation (can be shared) | Server (authoritative), Client (optimistic) |
| **Message Protocol** | Event types, payloads | Both |

---

## Data Flow

### Turn Flow (Player Makes Bid)

```
1. Player clicks bid button
   Client: Capture input (count=4, value=5)
           ↓
2. Client sends message
   Socket: { type: "BID", payload: { count: 4, value: 5 } }
           ↓
3. Server validates bid
   Server: isValidBid(newBid, currentBid, totalDice, isPalifico)
           ↓
4. If valid: Server updates state
   State:  currentBid = { count: 4, value: 5 }
           lastBidder = playerId
           currentTurn = nextPlayerId
           ↓
5. Server broadcasts to room
   Broadcast: { type: "STATE_UPDATE", payload: { ...newState } }
           ↓
6. All clients update UI
   Clients: setGameState(newState)
```

### State Synchronization Pattern

Use **delta-update propagation** for efficiency:
- Server computes diff between old and new state
- Only changed fields are broadcast
- Clients apply delta to local state

**Alternative:** Full state broadcast (simpler, acceptable for turn-based games with small state)

**Source:** [Longwelwind - Networking of a turn-based game](https://longwelwind.net/blog/networking-turn-based-game/)

---

## Room/Lobby Architecture

### Room Lifecycle

```
CREATE ROOM          JOIN ROOM           GAME START
    │                    │                   │
    v                    v                   v
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Empty  │ ──────> │ Waiting │ ──────> │ Playing │
│  Room   │         │ Players │         │  Game   │
└─────────┘         └─────────┘         └─────────┘
                         │                   │
                         v                   v
                    Player joins        Game ends
                    (2-6 players)           │
                                            v
                                    ┌─────────────┐
                                    │ Post-Game   │
                                    │ (rematch?)  │
                                    └─────────────┘
```

### Room State Structure

```typescript
interface Room {
  id: string;           // "ABC123" (shareable code)
  hostId: string;       // Player who created room
  players: Player[];    // Connected players
  settings: GameSettings;
  state: 'waiting' | 'playing' | 'finished';
  gameState?: AuthoritativeGameState;
}

interface Player {
  id: string;
  socketId: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isConnected: boolean;
  isAI: boolean;
  disconnectedAt?: number; // For reconnection window
}
```

### Host Authority Model

The **host** (room creator) has special privileges:
- Start game when ready
- Kick players in lobby
- Adjust game settings

The **server** retains authority over:
- Game rules and validation
- Turn order
- Win/lose determination

**Source:** [Photon Engine - Authoritative Server FAQ](https://doc.photonengine.com/bolt/current/troubleshooting/authoritative-server-faq)

---

## Reconnection with State Restoration

### Strategy: Grace Period with AI Takeover

```
DISCONNECT              RECONNECT WINDOW           RECONNECT/TIMEOUT
    │                        │                           │
    v                        v                           v
┌─────────┐            ┌───────────┐              ┌─────────────┐
│ Player  │  ───30s──> │ AI Takes  │  ───if───>  │  Restored   │
│ Drops   │            │   Over    │  reconnect  │   Player    │
└─────────┘            └───────────┘              └─────────────┘
                             │
                             │ if timeout (2min)
                             v
                       ┌───────────┐
                       │ Permanent │
                       │    AI     │
                       └───────────┘
```

### Implementation

```typescript
// Server-side reconnection handling
interface ReconnectionState {
  playerId: string;
  roomId: string;
  disconnectedAt: number;
  aiTookOver: boolean;
  savedPlayerState: {
    hand: number[];
    diceCount: number;
    color: PlayerColor;
  };
}

// Configuration
const GRACE_PERIOD_MS = 30000;      // 30s before AI takes over
const RECONNECT_WINDOW_MS = 120000; // 2min total reconnection window
```

### Socket.IO Connection State Recovery

Socket.IO 4.6+ has built-in connection state recovery:
- Server stores socket's id, rooms, and data on disconnect
- Client can reconnect and restore session
- Check `socket.recovered` on reconnect

**Source:** [Socket.IO - Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery)

---

## AI Takeover Pattern

### Architecture for Bot Replacement

```typescript
// AI controller runs server-side
class AIController {
  private aiPlayers: Map<string, AIPlayer>;

  takeOverPlayer(player: Player, gameState: GameState): void {
    const aiPlayer = new AIPlayer({
      id: player.id,
      hand: player.hand,
      style: 'balanced' // or aggressive, conservative
    });
    this.aiPlayers.set(player.id, aiPlayer);
  }

  releaseToPlayer(playerId: string): void {
    this.aiPlayers.delete(playerId);
  }

  async getAIAction(playerId: string, gameState: GameState): Promise<Action> {
    const ai = this.aiPlayers.get(playerId);
    // Use existing gameLogic.ts functions
    return ai.decideAction(gameState);
  }
}
```

### Reusing Existing AI Logic

The current `gameLogic.ts` already has:
- `shouldAICallDudo()` - Decide if AI should call Dudo
- `shouldAICallCalza()` - Decide if AI should call Calza
- `generateAIBid()` - Generate valid AI bids

These can be directly reused server-side for both:
1. AI opponents in mixed human/AI games
2. Bot replacement for disconnected players

**Source:** [Photon Quantum - Player Replacement Bots](https://doc.photonengine.com/quantum/current/manual/player/player-replacement)

---

## Technology Recommendations

### Primary: Socket.IO

**Why Socket.IO over raw WebSockets:**
- Automatic reconnection with exponential backoff
- Room/namespace abstractions built-in
- Fallback to long-polling if WebSockets blocked
- Connection state recovery (v4.6+)
- Mature, well-documented

**Alternative considered:** PartyKit (acquired by Cloudflare)
- Excellent for edge deployment
- Simpler API for many cases
- Consider if targeting global low-latency

**Source:** [Socket.IO Documentation](https://socket.io/docs/v4/)

### Deployment: Separate WebSocket Server

Next.js App Router does not natively support WebSockets. Options:

1. **Separate Node.js server** (Recommended)
   - Run Socket.IO server alongside Next.js
   - Deploy to Railway, Render, or Fly.io
   - Clear separation of concerns

2. **Custom Next.js server**
   - Lose Vercel deployment benefits
   - More complex setup

3. **Third-party services** (Ably, Pusher)
   - Higher cost at scale
   - Less control over game logic

**Source:** [Pedro Alonso - WebSockets with Next.js](https://www.pedroalonso.net/blog/websockets-nextjs-part-1/)

---

## Message Protocol

### Event Types

```typescript
// Client -> Server
type ClientMessage =
  | { type: 'CREATE_ROOM'; payload: { playerName: string; settings: GameSettings } }
  | { type: 'JOIN_ROOM'; payload: { roomCode: string; playerName: string } }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_GAME' }  // Host only
  | { type: 'ROLL_COMPLETE' }
  | { type: 'BID'; payload: Bid }
  | { type: 'DUDO' }
  | { type: 'CALZA' }
  | { type: 'CONTINUE_ROUND' }
  | { type: 'REMATCH' };

// Server -> Client
type ServerMessage =
  | { type: 'ROOM_CREATED'; payload: { roomCode: string; room: Room } }
  | { type: 'ROOM_JOINED'; payload: { room: Room } }
  | { type: 'PLAYER_JOINED'; payload: { player: Player } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string } }
  | { type: 'GAME_STARTED'; payload: { gameState: GameState } }
  | { type: 'STATE_UPDATE'; payload: Partial<GameState> }
  | { type: 'YOUR_TURN' }
  | { type: 'AI_ACTION'; payload: { playerId: string; action: Action } }
  | { type: 'ROUND_RESULT'; payload: RoundResult }
  | { type: 'GAME_OVER'; payload: { winnerId: string } }
  | { type: 'ERROR'; payload: { code: string; message: string } };
```

---

## Refactoring the Existing Codebase

### Current State (Problem)

```
page.tsx (2000+ lines)
├── 40+ useState hooks mixed together
├── UI state (animations, modals)
├── Game state (bids, turns, hands)
├── AI logic (inline timeouts)
└── All runs client-side
```

### Target State (Solution)

```
/src
├── /app
│   └── page.tsx          # Thin: renders based on state
├── /components           # UI components (keep existing)
├── /hooks
│   └── useMultiplayerGame.ts  # Socket connection + state
├── /lib
│   ├── types.ts          # Shared types (extend existing)
│   ├── gameLogic.ts      # Keep for AI logic reference
│   └── protocol.ts       # Message types
├── /state
│   └── gameStore.ts      # Zustand store for UI state
└── /server               # New: game server
    ├── index.ts          # Socket.IO server
    ├── roomManager.ts    # Room lifecycle
    ├── gameManager.ts    # Game state machine
    └── aiController.ts   # AI logic (port from gameLogic.ts)
```

### Refactoring Steps (Build Order)

**Phase 1: Extract and Organize (No Server Yet)**
1. Create shared types in `types.ts`
2. Extract UI-only state to Zustand store
3. Create game state interface separate from UI state
4. Extract game logic into pure functions (mostly done in gameLogic.ts)

**Phase 2: Create Server Foundation**
1. Set up Node.js + Socket.IO server
2. Implement room creation/joining
3. Implement basic state broadcast
4. Create `useMultiplayerGame` hook for client

**Phase 3: Implement Game Loop**
1. Move game state machine to server
2. Implement turn validation
3. Port AI logic to server
4. Implement state sync

**Phase 4: Add Robustness**
1. Implement reconnection handling
2. Add AI takeover for disconnects
3. Handle edge cases (all players leave, etc.)

---

## State Separation Guide

### What Stays Client-Side (UI State)

```typescript
// These are local-only, not synced
interface UIState {
  // Animation states
  isRolling: boolean;
  revealProgress: number;
  highlightedDiceIndex: number;
  dyingDieOwner: string | null;

  // Modal/overlay states
  showSettings: boolean;
  showDudoOverlay: boolean;

  // Transient display
  aiThinkingPrompt: string;

  // Player preferences (persisted locally)
  playerColor: PlayerColor;
  palificoEnabled: boolean;
}
```

### What Moves to Server (Game State)

```typescript
// Server-authoritative state, synced to all clients
interface AuthoritativeGameState {
  roomId: string;
  phase: 'lobby' | 'rolling' | 'bidding' | 'reveal' | 'roundEnd' | 'gameOver';

  // Players
  players: {
    id: string;
    name: string;
    color: PlayerColor;
    diceCount: number;
    hand: number[];  // Only sent to that player, hidden from others
    isEliminated: boolean;
    isConnected: boolean;
    isAI: boolean;
  }[];

  // Turn state
  currentTurnPlayerId: string;
  roundStarterPlayerId: string;

  // Bidding state
  currentBid: Bid | null;
  lastBidderId: string | null;

  // Round result (revealed)
  revealedHands?: Record<string, number[]>;  // All hands, shown during reveal
  actualCount?: number;
  roundWinnerId?: string;
  roundLoserId?: string;

  // Game settings
  isPalifico: boolean;
  palificoEnabled: boolean;
}
```

### Private vs Public State

**Private (per-player):** Each player's dice hand during bidding
**Public (all players):** Current bid, turn order, dice counts, revealed hands

```typescript
// Server sends different data per player
function getStateForPlayer(fullState: GameState, playerId: string): ClientGameState {
  return {
    ...fullState,
    players: fullState.players.map(p => ({
      ...p,
      // Only include hand for the requesting player
      hand: p.id === playerId ? p.hand : undefined
    }))
  };
}
```

---

## Scalability Considerations

| Concern | At 10 rooms | At 1000 rooms | At 10000 rooms |
|---------|-------------|---------------|----------------|
| **State Storage** | In-memory | In-memory | Redis |
| **AI Processing** | Same process | Same process | Worker threads |
| **WebSocket** | Single server | Single server | Redis adapter |
| **Room Cleanup** | setTimeout | Background job | Background job |

For the initial implementation, in-memory state on a single server is sufficient. Perudo games have small state and limited concurrency needs.

---

## Anti-Patterns to Avoid

### 1. Client-Side Game Logic Execution
**Problem:** Client runs game logic and tells server the result
**Why bad:** Easy to cheat, desync between players
**Instead:** Server validates all actions, broadcasts results

### 2. Full State Broadcast Every Frame
**Problem:** Sending entire game state on every change
**Why bad:** Bandwidth waste, potential for state desync
**Instead:** Use delta updates or send only changed fields

### 3. Trusting Reconnection Claims
**Problem:** Client claims to be a reconnecting player
**Why bad:** Impersonation attacks
**Instead:** Server validates session token, maintains reconnection state

### 4. Blocking AI Turns
**Problem:** AI decisions block the main thread
**Why bad:** Slow server, delayed broadcasts to other players
**Instead:** Keep AI fast (already is in gameLogic.ts), or use setImmediate

### 5. No Timeout on Turns
**Problem:** Player can hold game hostage by not taking turn
**Why bad:** Ruins experience for others
**Instead:** Implement turn timer, AI takes over on timeout

---

## Sources Summary

**Architecture Patterns:**
- [Gabriel Gambetta - Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Longwelwind - Networking of a turn-based game](https://longwelwind.net/blog/networking-turn-based-game/)
- [Generalist Programmer - Game Networking Fundamentals 2025](https://generalistprogrammer.com/tutorials/game-networking-fundamentals-complete-multiplayer-guide-2025)

**Socket.IO and Reconnection:**
- [Socket.IO - Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery)
- [Socket.IO - Rooms](https://socket.io/docs/v3/rooms/)
- [VideoSDK - Mastering Socket.IO Rooms 2025](https://www.videosdk.live/developer-hub/socketio/socketio-rooms)

**Next.js Integration:**
- [Pedro Alonso - WebSockets with Next.js](https://www.pedroalonso.net/blog/websockets-nextjs-part-1/)
- [LogRocket - WebSocket Communication in Next.js](https://blog.logrocket.com/implementing-websocket-communication-next-js/)

**AI Takeover:**
- [Photon Quantum - Player Replacement Bots](https://doc.photonengine.com/quantum/current/manual/player/player-replacement)

**Alternative Platforms:**
- [PartyKit Documentation](https://docs.partykit.io/)
- [Cloudflare acquires PartyKit](https://blog.cloudflare.com/cloudflare-acquires-partykit/)

---

## Build Order Dependencies

```
                    ┌─────────────────┐
                    │  Phase 1: Types │
                    │  & State Split  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              v                             v
     ┌────────────────┐           ┌────────────────┐
     │ Phase 2: Server│           │ Phase 2: Client│
     │   Foundation   │           │     Hooks      │
     └────────┬───────┘           └────────┬───────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             v
                    ┌────────────────┐
                    │ Phase 3: Game  │
                    │     Loop       │
                    └────────┬───────┘
                             │
                             v
                    ┌────────────────┐
                    │ Phase 4: Edge  │
                    │    Cases       │
                    └────────────────┘
```

**Critical dependency:** Shared types must be defined before both server and client work begins. The message protocol acts as a contract between them.
