# Phase 6: Game State Sync - Research

**Researched:** 2026-01-18
**Domain:** Real-time multiplayer game state synchronization
**Confidence:** HIGH

## Summary

This phase implements real-time game state synchronization for multiplayer Perudo. The codebase already has comprehensive infrastructure in place: PartyKit server with game message handlers stubbed out, game logic functions for bid validation and resolution, Zustand stores for state management, and UI components for dice, bids, and reveals.

The primary work is completing the server-side message handlers (ROLL_DICE, PLACE_BID, CALL_DUDO, CALL_CALZA, CONTINUE_ROUND), updating client stores to handle game state messages, and building the game board UI that displays shared state while keeping dice hands private.

**Primary recommendation:** Complete the stubbed PartyKit handlers using existing `gameLogic.ts` functions, then build a GameBoard component that orchestrates existing UI components (PlayerDiceBadge, BidUI, DudoOverlay, PlayerRevealCard) with server-synced state from gameStore.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PartyKit | existing | Real-time WebSocket server | Already selected/configured in prior phases |
| Zustand | existing | Client state management | gameStore/uiStore already defined |
| Framer Motion | existing | Animations | Used throughout existing UI components |
| Zod | existing | Message validation | ClientMessageSchema/ServerMessageSchema defined |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | existing | Toast notifications | Player actions, errors |
| Lucide React | existing | Icons | UI indicators |

### No Additional Dependencies Needed
All required libraries are already installed. The work is implementation, not integration.

## Architecture Patterns

### Existing Project Structure
```
party/
  index.ts               # PartyKit server - handlers need completion

src/
  shared/
    types.ts             # ServerRoomState, ServerGameState, ServerPlayer, Bid
    messages.ts          # ClientMessage, ServerMessage schemas
    constants.ts         # Game constants (dice counts, timeouts)

  stores/
    gameStore.ts         # roomState, myPlayerId, myHand
    uiStore.ts           # isRolling, showDudoOverlay, connectionStatus

  lib/
    gameLogic.ts         # isValidBid, countMatching, rollDice

  components/
    Dice.tsx             # Single die with color/highlighting
    DiceCup.tsx          # Roll dice interaction
    BidUI.tsx            # Bid selector and action buttons
    DudoOverlay.tsx      # Full-screen Dudo/Calza announcement
    PlayerDiceBadge.tsx  # Player chip with dice count
    PlayerRevealCard.tsx # Player's revealed dice during reveal
    SortedDiceDisplay.tsx# Animated dice sorting
```

### Pattern 1: Server-Authoritative Game Flow
**What:** All game state transitions happen on server, clients receive updates
**When to use:** Every game action (roll, bid, dudo, calza)

```typescript
// Client sends intention
sendMessage({ type: 'PLACE_BID', bid: { count: 3, value: 5 }, timestamp: Date.now() });

// Server validates, updates state, broadcasts
// party/index.ts
private async handlePlaceBid(msg, sender) {
  // 1. Validate sender is current turn player
  // 2. Validate bid using isValidBid()
  // 3. Update gameState
  // 4. Broadcast BID_PLACED to all
  // 5. Send GAME_STATE with next turn info
}
```

### Pattern 2: Private Hands via Per-Player Messages
**What:** Server never broadcasts hand data; sends yourHand only to owner
**When to use:** DICE_ROLLED and GAME_STATE messages

```typescript
// party/index.ts - on roll dice
for (const conn of this.room.getConnections()) {
  const player = this.roomState!.players.find(p => p.id === conn.id);
  if (player) {
    this.sendToConnection(conn, {
      type: 'DICE_ROLLED',
      yourHand: player.hand, // Only their own dice
      timestamp: Date.now(),
    });
  }
}
```

### Pattern 3: Reveal Broadcast
**What:** All hands revealed simultaneously on Dudo/Calza resolution
**When to use:** ROUND_RESULT message after challenge

```typescript
// party/index.ts - on resolve challenge
const allHands: Record<string, number[]> = {};
this.roomState!.players.forEach(p => {
  allHands[p.id] = p.hand;
});

this.broadcast({
  type: 'ROUND_RESULT',
  bid: currentBid,
  actualCount,
  allHands,    // All dice revealed to everyone
  loserId,
  winnerId,
  isCalza,
  timestamp: Date.now(),
});
```

### Pattern 4: Game Phase State Machine
**What:** GamePhase controls what actions are valid
**When to use:** All handler validation

```typescript
type GamePhase = 'lobby' | 'rolling' | 'bidding' | 'reveal' | 'ended';

// In handlers:
if (this.roomState?.gameState?.phase !== 'bidding') {
  this.sendError(sender, 'INVALID_ACTION', 'Not in bidding phase');
  return;
}
```

### Anti-Patterns to Avoid
- **Sending all player hands:** Never include other players' hand arrays in broadcasts
- **Client-side game logic:** All validation must happen on server, client only displays
- **Direct state mutation:** Always use store actions to update state
- **Mixing UI state with game state:** Keep animation state in uiStore, game state in gameStore

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bid validation | Custom rules | `isValidBid()` in gameLogic.ts | Already handles palifico, ace rules |
| Dice counting | Manual loops | `countMatching()` in gameLogic.ts | Handles wild aces, palifico |
| Dice rolling | Custom random | `rollDice()` in gameLogic.ts | Consistent implementation |
| Message creation | Manual objects | `createClientMessage()` helper | Adds timestamp automatically |
| Connection handling | Manual WebSocket | `useRoomConnection` hook | Already handles lifecycle |

**Key insight:** The game logic layer is complete. The work is wiring it to the server handlers and UI components.

## Common Pitfalls

### Pitfall 1: Race Conditions on Turn Advancement
**What goes wrong:** Player sends action after turn changes
**Why it happens:** Network latency between state update and client receiving it
**How to avoid:** Server validates currentTurnPlayerId before processing any action
**Warning signs:** "Not your turn" errors appearing seemingly randomly

### Pitfall 2: Stale State in Message Handlers
**What goes wrong:** Client shows old state after action
**Why it happens:** Optimistic UI updates without server confirmation
**How to avoid:** Don't update UI until server confirms via GAME_STATE message
**Warning signs:** UI flickering or reverting after actions

### Pitfall 3: Hand Data Leaking in Logs
**What goes wrong:** Server logs reveal player hands
**Why it happens:** Debug logging of full state objects
**How to avoid:** Use `getPublicRoomState()` helper for logging
**Warning signs:** Hand values visible in server logs

### Pitfall 4: Missing Phase Transitions
**What goes wrong:** Game gets stuck after roll/reveal
**Why it happens:** Forgetting to transition from 'rolling' to 'bidding' or 'reveal' to 'bidding'
**How to avoid:** Each handler explicitly sets next phase
**Warning signs:** Players unable to take actions after state change

### Pitfall 5: Reveal Animation Timing
**What goes wrong:** Result shown before dramatic pause
**Why it happens:** Immediately showing ROUND_RESULT without animation delay
**How to avoid:** uiStore tracks reveal phase, GameBoard waits before showing winner/loser
**Warning signs:** Anticlimactic reveal experience

## Code Examples

### Server Handler: ROLL_DICE
```typescript
// party/index.ts
import { rollDice } from '../src/lib/gameLogic';

private async handleRollDice(
  msg: Extract<ClientMessage, { type: 'ROLL_DICE' }>,
  sender: Party.Connection
): Promise<void> {
  if (!this.roomState?.gameState) {
    this.sendError(sender, 'GAME_NOT_STARTED', 'No game in progress');
    return;
  }

  if (this.roomState.gameState.phase !== 'rolling') {
    this.sendError(sender, 'INVALID_ACTION', 'Not in rolling phase');
    return;
  }

  // Roll dice for all players
  for (const player of this.roomState.gameState.players) {
    if (!player.isEliminated) {
      player.hand = rollDice(player.diceCount);
    }
  }

  // Transition to bidding
  this.roomState.gameState.phase = 'bidding';
  this.roomState.gameState.turnStartedAt = Date.now();

  await this.persistState();

  // Send each player their own hand
  for (const conn of this.room.getConnections()) {
    const player = this.roomState.gameState.players.find(p => p.id === conn.id);
    if (player && !player.isEliminated) {
      this.sendToConnection(conn, {
        type: 'DICE_ROLLED',
        yourHand: player.hand,
        timestamp: Date.now(),
      });
    }
  }
}
```

### Server Handler: PLACE_BID
```typescript
// party/index.ts
import { isValidBid } from '../src/lib/gameLogic';

private async handlePlaceBid(
  msg: Extract<ClientMessage, { type: 'PLACE_BID' }>,
  sender: Party.Connection
): Promise<void> {
  const gs = this.roomState?.gameState;
  if (!gs || gs.phase !== 'bidding') {
    this.sendError(sender, 'INVALID_ACTION', 'Not in bidding phase');
    return;
  }

  if (gs.currentTurnPlayerId !== sender.id) {
    this.sendError(sender, 'NOT_YOUR_TURN', 'Wait for your turn');
    return;
  }

  // Calculate total dice
  const totalDice = gs.players
    .filter(p => !p.isEliminated)
    .reduce((sum, p) => sum + p.diceCount, 0);

  // Validate bid
  const validation = isValidBid(msg.bid, gs.currentBid, totalDice, gs.isPalifico);
  if (!validation.valid) {
    this.sendError(sender, 'INVALID_BID', validation.reason || 'Invalid bid');
    return;
  }

  // Update state
  gs.currentBid = msg.bid;
  gs.lastBidderId = sender.id;

  // Advance turn
  const activePlayers = gs.players.filter(p => !p.isEliminated);
  const currentIdx = activePlayers.findIndex(p => p.id === sender.id);
  const nextIdx = (currentIdx + 1) % activePlayers.length;
  gs.currentTurnPlayerId = activePlayers[nextIdx].id;
  gs.turnStartedAt = Date.now();

  await this.persistState();

  // Broadcast bid
  this.broadcast({
    type: 'BID_PLACED',
    playerId: sender.id,
    bid: msg.bid,
    timestamp: Date.now(),
  });
}
```

### Server Handler: CALL_DUDO
```typescript
// party/index.ts
import { countMatching } from '../src/lib/gameLogic';

private async handleCallDudo(
  msg: Extract<ClientMessage, { type: 'CALL_DUDO' }>,
  sender: Party.Connection
): Promise<void> {
  const gs = this.roomState?.gameState;
  if (!gs || gs.phase !== 'bidding') {
    this.sendError(sender, 'INVALID_ACTION', 'Not in bidding phase');
    return;
  }

  if (gs.currentTurnPlayerId !== sender.id) {
    this.sendError(sender, 'NOT_YOUR_TURN', 'Wait for your turn');
    return;
  }

  if (!gs.currentBid) {
    this.sendError(sender, 'INVALID_ACTION', 'No bid to challenge');
    return;
  }

  // Transition to reveal phase
  gs.phase = 'reveal';

  // Broadcast that Dudo was called
  this.broadcast({
    type: 'DUDO_CALLED',
    callerId: sender.id,
    timestamp: Date.now(),
  });

  // Count actual dice
  let actualCount = 0;
  const allHands: Record<string, number[]> = {};

  for (const player of gs.players) {
    if (!player.isEliminated) {
      allHands[player.id] = player.hand;
      actualCount += countMatching(player.hand, gs.currentBid.value, gs.isPalifico);
    }
  }

  // Determine loser
  const bidder = gs.players.find(p => p.id === gs.lastBidderId)!;
  const challenger = gs.players.find(p => p.id === sender.id)!;

  let loserId: string;
  if (actualCount >= gs.currentBid.count) {
    // Bid was correct - challenger loses
    loserId = challenger.id;
    challenger.diceCount--;
  } else {
    // Bid was wrong - bidder loses
    loserId = bidder.id;
    bidder.diceCount--;
  }

  // Check for elimination
  const loser = gs.players.find(p => p.id === loserId)!;
  if (loser.diceCount <= 0) {
    loser.isEliminated = true;
  }

  await this.persistState();

  // Broadcast result
  this.broadcast({
    type: 'ROUND_RESULT',
    bid: gs.currentBid,
    actualCount,
    allHands,
    loserId,
    winnerId: null,
    isCalza: false,
    timestamp: Date.now(),
  });

  // Check for game end
  const remaining = gs.players.filter(p => !p.isEliminated);
  if (remaining.length === 1) {
    gs.phase = 'ended';
    await this.persistState();

    this.broadcast({
      type: 'GAME_ENDED',
      winnerId: remaining[0].id,
      timestamp: Date.now(),
    });
  }
}
```

### Client Message Handler Updates
```typescript
// src/app/room/[code]/page.tsx - add to handleMessage
case 'DICE_ROLLED':
  setJoinState(prev => {
    if (prev.status === 'joined') {
      // Update hand in gameStore or local state
      gameStore.setMyHand(message.yourHand);
      return {
        ...prev,
        roomState: {
          ...prev.roomState,
          gameState: prev.roomState.gameState
            ? { ...prev.roomState.gameState, phase: 'bidding' }
            : null,
        },
      };
    }
    return prev;
  });
  break;

case 'BID_PLACED':
  setJoinState(prev => {
    if (prev.status === 'joined' && prev.roomState.gameState) {
      // Update current bid, turn, etc
    }
    return prev;
  });
  // Trigger bid animation via uiStore
  break;

case 'DUDO_CALLED':
case 'CALZA_CALLED':
  // Show overlay animation
  uiStore.setDudoOverlay(true);
  break;

case 'ROUND_RESULT':
  // Store revealed hands, trigger reveal animation
  break;
```

### GameBoard Component Structure
```typescript
// src/components/GameBoard.tsx
'use client';

import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { PlayerDiceBadge } from './PlayerDiceBadge';
import { BidUI } from './BidUI';
import { DudoOverlay } from './DudoOverlay';
import { SortedDiceDisplay } from './SortedDiceDisplay';

interface GameBoardProps {
  sendMessage: (msg: ClientMessage) => void;
}

export function GameBoard({ sendMessage }: GameBoardProps) {
  const { roomState, myPlayerId, myHand, isMyTurn, currentPlayer } = useGameStore();
  const { showDudoOverlay } = useUIStore();

  const gameState = roomState?.gameState;
  if (!gameState) return null;

  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const totalDice = activePlayers.reduce((sum, p) => sum + p.diceCount, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Player row at top */}
      <div className="flex justify-center gap-4 p-4">
        {gameState.players.map(player => (
          <PlayerDiceBadge
            key={player.id}
            playerName={player.name}
            diceCount={player.diceCount}
            color={player.color}
            isActive={gameState.currentTurnPlayerId === player.id}
            isEliminated={player.isEliminated}
          />
        ))}
      </div>

      {/* Center bid area */}
      <div className="flex-1 flex items-center justify-center">
        <BidUI
          currentBid={gameState.currentBid}
          onBid={(bid) => sendMessage({ type: 'PLACE_BID', bid, timestamp: Date.now() })}
          onDudo={() => sendMessage({ type: 'CALL_DUDO', timestamp: Date.now() })}
          onCalza={() => sendMessage({ type: 'CALL_CALZA', timestamp: Date.now() })}
          isMyTurn={isMyTurn()}
          totalDice={totalDice}
          isPalifico={gameState.isPalifico}
          playerColor={/* my color */}
        />
      </div>

      {/* My dice at bottom */}
      <div className="p-6">
        <SortedDiceDisplay
          dice={myHand}
          color={/* my color */}
          isPalifico={gameState.isPalifico}
        />
      </div>

      {/* Overlays */}
      <DudoOverlay
        isVisible={showDudoOverlay}
        type="dudo"
        callerName={/* from last message */}
        callerColor={/* from player data */}
      />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client game logic | Server-authoritative | Project start | Prevents cheating |
| Full state broadcasts | Per-player filtered | Project start | Keeps hands private |

**Deprecated/outdated:**
- None - the architecture established in Phase 1-5 is the current approach

## Open Questions

### 1. Rolling Phase Trigger
**What we know:** Game transitions from lobby to 'rolling' phase when host starts
**What's unclear:** Who triggers ROLL_DICE? Does server auto-roll or wait for player action?
**Recommendation:** Server auto-rolls immediately after GAME_STARTED, simplifying flow

### 2. Continue Round Flow
**What we know:** CONTINUE_ROUND message exists but handler is stubbed
**What's unclear:** When is this needed vs auto-continuing after reveal?
**Recommendation:** Auto-continue after 4-second reveal pause via server timeout

### 3. Bid History
**What we know:** CONTEXT.md mentions "compact bid history log"
**What's unclear:** How many bids to track, where to store (server or client only)
**Recommendation:** Track last 10 bids in gameState, display in collapsible panel

### 4. Connection Loss During Game
**What we know:** Player marked disconnected, can reconnect
**What's unclear:** Does turn skip or wait? How long?
**Recommendation:** Use existing turnTimeoutMs, AI auto-plays if timeout

## Sources

### Primary (HIGH confidence)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/party/index.ts` - Current server implementation
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/shared/types.ts` - Type definitions
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/shared/messages.ts` - Message schemas
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/lib/gameLogic.ts` - Game validation logic
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/stores/gameStore.ts` - Client state management
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/.planning/STATE.md` - Project decisions

### Secondary (HIGH confidence)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/components/*.tsx` - Existing UI components
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/.planning/phases/06-game-state-sync/06-CONTEXT.md` - Phase decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, just implementation
- Architecture: HIGH - Patterns established in prior phases, following existing code
- Pitfalls: HIGH - Based on actual code structure and common multiplayer patterns

**Research date:** 2026-01-18
**Valid until:** N/A - This is codebase-specific research, not library research
