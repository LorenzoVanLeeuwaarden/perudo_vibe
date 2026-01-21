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

---
---

# Architecture Research: Gauntlet Mode Integration

**Project:** Perudo Gauntlet Mode
**Researched:** 2026-01-21
**Focus:** Integration with existing Perudo architecture

## Executive Summary

Gauntlet mode is a natural extension of the existing single-player architecture. The core game loop, AI system, and UI components can be reused with minimal modification. The primary new requirements are:

1. **New route** (`/gauntlet`) with dedicated game orchestration
2. **Backend storage** for global leaderboard (Cloudflare D1 recommended)
3. **Achievement tracking** (local storage + optional cloud sync)
4. **Gauntlet-specific game state** (wave tracking, streak counting)

The existing architecture already separates concerns well: game logic in `gameLogic.ts`, AI in `src/lib/ai/`, and UI components in `src/components/`. Gauntlet mode can compose these pieces into a new page-level orchestrator.

---

## Existing Components to Reuse

### AI System (Reuse As-Is)

| Component | Location | Reuse Strategy |
|-----------|----------|----------------|
| `makeDecision()` | `src/lib/ai/sophisticatedAgent.ts` | Direct import - no changes |
| `createAgentContext()` | `src/lib/ai/sophisticatedAgent.ts` | Direct import - no changes |
| `createSessionMemory()` | `src/lib/ai/sessionMemory.ts` | Direct import - no changes |
| `updateMemory()` | `src/lib/ai/sessionMemory.ts` | Direct import - no changes |
| `PERSONALITIES` | `src/lib/ai/personalities.ts` | Direct import - no changes |
| `getPersonalityForName()` | `src/lib/ai/personalities.ts` | Direct import - no changes |

**Note:** The AI system is already fully decoupled from UI. It takes context, returns decisions. Perfect for Gauntlet.

### Game Logic (Reuse As-Is)

| Function | Location | Purpose |
|----------|----------|---------|
| `rollDice()` | `src/lib/gameLogic.ts` | Generate random dice |
| `isValidBid()` | `src/lib/gameLogic.ts` | Validate bid rules |
| `countMatching()` | `src/lib/gameLogic.ts` | Count matching dice for reveal |

### UI Components (Reuse As-Is)

| Component | Location | Notes |
|-----------|----------|-------|
| `Dice` | `src/components/Dice.tsx` | Renders individual die |
| `DiceCup` | `src/components/DiceCup.tsx` | Rolling animation |
| `BidUI` | `src/components/BidUI.tsx` | Bid selection interface |
| `SortedDiceDisplay` | `src/components/SortedDiceDisplay.tsx` | Player's hand display |
| `PlayerDiceBadge` | `src/components/PlayerDiceBadge.tsx` | Opponent info display |
| `DudoOverlay` | `src/components/DudoOverlay.tsx` | Dudo/Calza call animation |
| `RevealContent` | `src/components/RevealContent.tsx` | Reveal phase display |
| `VictoryScreen` | `src/components/VictoryScreen.tsx` | Win celebration |
| `DefeatScreen` | `src/components/DefeatScreen.tsx` | Loss screen |
| `ShaderBackground` | `src/components/ShaderBackground.tsx` | Visual background |
| `CasinoLogo` | `src/components/CasinoLogo.tsx` | Branding |

### State Management (Reuse Pattern)

| Store | Location | Reuse Strategy |
|-------|----------|----------------|
| `useUIStore` | `src/stores/uiStore.ts` | Can reuse for animation state, preferences |

**Note:** The UI store uses Zustand with persist middleware for localStorage. Same pattern works for Gauntlet achievements.

### Types (Extend)

| Type | Location | Strategy |
|------|----------|----------|
| `Bid` | `src/lib/types.ts` | Reuse as-is |
| `PlayerColor` | `src/lib/types.ts` | Reuse as-is |
| `PLAYER_COLORS` | `src/lib/types.ts` | Reuse as-is |
| `GameState` | `src/lib/types.ts` | **Extend** with Gauntlet-specific states |

---

## New Components Needed

### 1. Gauntlet Page (`src/app/gauntlet/page.tsx`)

**Purpose:** Main orchestrator for Gauntlet mode

**Responsibilities:**
- Gauntlet game loop (waves, progression)
- Gauntlet-specific state (wave number, total score, streak)
- Integration with leaderboard API
- Achievement checking and triggering

**Pattern:** Follow existing `src/app/page.tsx` structure but with:
- Wave-based game progression instead of single game
- Score accumulation across waves
- Leaderboard submission on game over

**Estimated Size:** ~800-1200 lines (much smaller than page.tsx's 2000+ because we can compose existing components more cleanly)

### 2. Gauntlet Store (`src/stores/gauntletStore.ts`)

**Purpose:** Manage Gauntlet-specific state

```typescript
interface GauntletStore {
  // Run state
  currentWave: number;
  totalScore: number;
  currentStreak: number;
  maxStreak: number;

  // Game state
  playerDice: number;
  waveOpponents: Opponent[];

  // Leaderboard
  lastSubmittedScore: number | null;
  leaderboardRank: number | null;

  // Achievements (persisted)
  achievements: Achievement[];

  // Actions
  startRun: () => void;
  advanceWave: () => void;
  endRun: () => void;
  submitScore: (score: number) => Promise<void>;
}
```

**Pattern:** Zustand with persist middleware for achievements

### 3. Gauntlet Types (`src/lib/gauntlet/types.ts`)

**Purpose:** Type definitions for Gauntlet mode

```typescript
interface GauntletWave {
  waveNumber: number;
  opponentCount: number;
  difficultyModifier: number;
  opponentPersonalities: string[];
}

interface GauntletScore {
  id: string;
  playerName: string;
  totalScore: number;
  wavesCleared: number;
  maxStreak: number;
  submittedAt: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null;
  progress?: number;
  target?: number;
}
```

### 4. Wave Generator (`src/lib/gauntlet/waveGenerator.ts`)

**Purpose:** Generate waves with increasing difficulty

```typescript
function generateWave(waveNumber: number): GauntletWave {
  // Wave 1: 1 opponent, easy personality
  // Wave 2-3: 1-2 opponents, mixed
  // Wave 4+: 2-3 opponents, harder personalities
  // Boss waves every 5: 3 opponents, aggressive personalities
}
```

### 5. Score Calculator (`src/lib/gauntlet/scoreCalculator.ts`)

**Purpose:** Calculate points for Gauntlet actions

```typescript
function calculateWaveScore(
  waveNumber: number,
  diceRemaining: number,
  roundsPlayed: number,
  dudosCalled: number,
  calzasSuccessful: number
): number;

function calculateBonuses(
  streak: number,
  perfectWave: boolean,  // No dice lost
  speedBonus: number     // Based on time
): number;
```

### 6. Leaderboard API Route (`src/app/api/leaderboard/route.ts`)

**Purpose:** API endpoints for leaderboard CRUD

**Endpoints:**
- `GET /api/leaderboard` - Fetch top scores
- `POST /api/leaderboard` - Submit new score
- `GET /api/leaderboard/rank/:score` - Get rank for a score

**Note:** Uses Next.js Route Handlers with Cloudflare D1 binding

### 7. Achievement System (`src/lib/gauntlet/achievements.ts`)

**Purpose:** Define and check achievements

```typescript
const ACHIEVEMENTS = {
  FIRST_BLOOD: { name: 'First Blood', check: (state) => state.wavesCleared >= 1 },
  STREAK_5: { name: 'Hot Streak', check: (state) => state.maxStreak >= 5 },
  WAVE_10: { name: 'Veteran', check: (state) => state.wavesCleared >= 10 },
  PERFECT_WAVE: { name: 'Untouchable', check: (state) => state.lastWavePerfect },
  // ...more
};
```

### 8. Gauntlet UI Components

| Component | Purpose |
|-----------|---------|
| `GauntletHeader` | Wave number, score, streak display |
| `WaveTransition` | Animation between waves |
| `LeaderboardDisplay` | Show top scores |
| `AchievementToast` | Achievement unlock notification |
| `GauntletResults` | End-of-run summary with stats |

---

## Integration Points

### 1. AI System Integration

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Gauntlet Page  │────▶│  AI System       │────▶│  AI Decision    │
│  (orchestrator) │     │  (makeDecision)  │     │  (bid/dudo/     │
│                 │◀────│                  │◀────│   calza)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Connection:** Gauntlet page creates `AgentContext` for each AI opponent, calls `makeDecision()`, receives action.

**No changes needed to AI system.**

### 2. Game Logic Integration

```
┌─────────────────┐     ┌──────────────────┐
│  Gauntlet Page  │────▶│  gameLogic.ts    │
│  (orchestrator) │     │  - isValidBid()  │
│                 │     │  - countMatching()│
│                 │     │  - rollDice()    │
└─────────────────┘     └──────────────────┘
```

**Connection:** Direct imports, same as current page.tsx

### 3. UI Component Integration

```
┌─────────────────┐
│  Gauntlet Page  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ BidUI │ │ Dice  │  ...existing components
└───────┘ └───────┘
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│ GauntletHeader  │  ...new Gauntlet-specific UI
│ WaveTransition  │
│ LeaderboardDisp │
└─────────────────┘
```

**Connection:** Compose existing components, add Gauntlet-specific wrappers

### 4. Storage Integration

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Gauntlet Page  │────▶│  Zustand Store   │────▶│  localStorage   │
│                 │     │  (achievements)  │     │  (persisted)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Route      │────▶│  Cloudflare D1   │────▶│  Leaderboard DB │
│  (/api/leader)  │     │  (SQL database)  │     │  (global)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Data Flow

### Gauntlet Game Loop

```
1. START RUN
   └─▶ Initialize gauntletStore
   └─▶ Generate Wave 1
   └─▶ Roll dice for all players

2. BIDDING PHASE (same as existing)
   └─▶ Player turn: BidUI -> handleBid() -> update state
   └─▶ AI turn: createAgentContext() -> makeDecision() -> process action
   └─▶ Continue until Dudo/Calza called

3. REVEAL PHASE (same as existing)
   └─▶ Count matching dice
   └─▶ Determine winner/loser
   └─▶ Update dice counts

4. WAVE CHECK
   ├─▶ If player eliminated: END RUN
   ├─▶ If all opponents eliminated: ADVANCE WAVE
   └─▶ Else: NEXT ROUND (go to step 2)

5. ADVANCE WAVE
   └─▶ Calculate wave score
   └─▶ Check achievements
   └─▶ Generate next wave
   └─▶ Award streak bonus
   └─▶ Reset for new wave (go to step 2)

6. END RUN
   └─▶ Calculate final score
   └─▶ Check final achievements
   └─▶ Submit to leaderboard
   └─▶ Show GauntletResults
```

### Leaderboard Flow

```
1. SUBMIT SCORE
   └─▶ POST /api/leaderboard { name, score, waves, streak }
   └─▶ D1: INSERT INTO leaderboard (...)
   └─▶ Return: { rank, id }

2. FETCH LEADERBOARD
   └─▶ GET /api/leaderboard?limit=10
   └─▶ D1: SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10
   └─▶ Return: [{ name, score, waves, rank }]

3. GET RANK
   └─▶ GET /api/leaderboard/rank/:score
   └─▶ D1: SELECT COUNT(*) FROM leaderboard WHERE score > :score
   └─▶ Return: { rank }
```

---

## Storage Recommendation: Cloudflare D1

### Why D1 over KV

| Criterion | D1 | KV | Verdict |
|-----------|----|----|---------|
| **Query capability** | Full SQL | Key-value only | D1 - need ORDER BY for rankings |
| **Consistency** | Strong | Eventually consistent | D1 - scores must be accurate |
| **Sorting** | Native SQL | Manual in code | D1 - `ORDER BY score DESC` |
| **Complex queries** | Supported | Not supported | D1 - need ranking queries |
| **Free tier** | 5GB, 5M reads/day | 1GB, 100k reads/day | D1 - better limits |

### D1 Schema

```sql
CREATE TABLE leaderboard (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  waves_cleared INTEGER NOT NULL,
  max_streak INTEGER NOT NULL,
  submitted_at INTEGER NOT NULL,

  -- Indexes for common queries
  INDEX idx_score (total_score DESC),
  INDEX idx_submitted (submitted_at DESC)
);
```

### Alternative: Durable Objects SQLite

PartyKit already uses Durable Objects. Could use DO's SQLite storage for leaderboard within the existing PartyKit infrastructure. However, D1 is simpler for global leaderboard data that isn't tied to a specific "room."

**Recommendation:** Use D1 for global leaderboard, keep PartyKit for potential multiplayer Gauntlet in future.

---

## Suggested Build Order

### Phase 1: Core Gauntlet Loop (No Backend)

1. **Create route structure**
   - `src/app/gauntlet/page.tsx` - Shell page
   - `src/lib/gauntlet/types.ts` - Type definitions

2. **Build wave generator**
   - `src/lib/gauntlet/waveGenerator.ts`
   - Unit test wave progression

3. **Build Gauntlet orchestrator**
   - Port game loop from page.tsx
   - Integrate wave system
   - Use existing AI and game logic

4. **Add Gauntlet UI**
   - `GauntletHeader` component
   - `WaveTransition` component
   - Integrate existing components

**Deliverable:** Playable Gauntlet mode with local state only

### Phase 2: Score System

1. **Build score calculator**
   - `src/lib/gauntlet/scoreCalculator.ts`
   - Define scoring rules

2. **Create Gauntlet store**
   - `src/stores/gauntletStore.ts`
   - Persist high score locally

3. **Build results screen**
   - `GauntletResults` component
   - Show score breakdown

**Deliverable:** Gauntlet with scoring and local high score

### Phase 3: Leaderboard Backend

1. **Set up D1 database**
   - Create D1 binding in wrangler.toml
   - Create schema/migrations

2. **Build API routes**
   - `src/app/api/leaderboard/route.ts`
   - Submit and fetch endpoints

3. **Build leaderboard UI**
   - `LeaderboardDisplay` component
   - Integrate with API

**Deliverable:** Global leaderboard working

### Phase 4: Achievements

1. **Define achievement system**
   - `src/lib/gauntlet/achievements.ts`
   - Achievement definitions

2. **Build achievement tracking**
   - Extend gauntletStore
   - Check achievements on events

3. **Build achievement UI**
   - `AchievementToast` component
   - Achievement gallery

**Deliverable:** Achievement system complete

### Phase 5: Polish

1. **Mode selection integration**
   - Add Gauntlet to mode selection screen
   - Navigation flow

2. **Visual polish**
   - Wave transition animations
   - Score popup animations
   - Streak effects

3. **Testing and balancing**
   - Difficulty curve
   - Score balance
   - Achievement thresholds

**Deliverable:** Production-ready Gauntlet mode

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI system changes needed | Low | Medium | AI is already well-abstracted |
| D1 setup complexity | Medium | Low | Good docs, simple schema |
| Score balancing | High | Medium | Iterative testing, tunable constants |
| page.tsx extraction | Medium | Medium | Extract incrementally, test often |
| Achievement edge cases | Medium | Low | Comprehensive unit tests |

---

## Confidence: HIGH

**Reasoning:**
- Existing architecture is well-suited for this extension
- AI system requires no changes
- UI components are reusable
- D1 for leaderboard is well-documented
- Clear separation of concerns makes this a composition problem, not a rewrite

**Verified against:**
- Existing codebase analysis (read all key files)
- [Cloudflare Storage Options Documentation](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/platform/limits/)
- [PartyKit Documentation](https://docs.partykit.io/how-partykit-works/)

---

## Sources

- [Cloudflare Storage Options](https://developers.cloudflare.com/workers/platform/storage-options/) - Official guide for choosing between KV, D1, Durable Objects
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/) - KV documentation and limitations
- [D1: our quest to simplify databases](https://blog.cloudflare.com/whats-new-with-d1/) - D1 capabilities
- [How PartyKit works](https://docs.partykit.io/how-partykit-works/) - PartyKit architecture
- [Deploy to your own Cloudflare account](https://docs.partykit.io/guides/deploy-to-cloudflare/) - PartyKit with D1/KV bindings
- [SQLite-backed Durable Object Storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) - DO SQLite alternative
