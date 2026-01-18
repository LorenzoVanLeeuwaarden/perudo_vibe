# Domain Pitfalls: Real-Time Multiplayer Browser Games

**Domain:** Browser-based real-time multiplayer game (Perudo/dice game)
**Researched:** 2026-01-18
**Confidence:** MEDIUM-HIGH (WebSearch verified with official documentation patterns)

## Executive Summary

Adding multiplayer to an existing single-player browser game is significantly harder than building multiplayer-first. The current Perudo codebase has 40+ useState hooks in `page.tsx` with client-side state management -- this is the #1 risk factor. The research reveals consistent patterns of failure around: (1) trusting client state, (2) poor reconnection handling, (3) room management edge cases, and (4) state synchronization timing issues.

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues. Address these first or pay heavily later.

### Pitfall 1: Client-Side State Authority

**What goes wrong:** The current game runs all logic client-side. Refactoring this to multiplayer often leads to developers keeping game logic on clients and only syncing results. Cheaters can then send fake dice rolls, fake bids, or claim wins they did not earn.

**Why it happens:** It feels easier to keep existing client logic and "just add networking." The mindset is "sync state between clients" rather than "server decides, clients display."

**Consequences:**
- Cheating becomes trivial (modify JS in browser dev tools)
- State conflicts between clients (who rolled first? whose bid counts?)
- Race conditions when two players act simultaneously
- "Desync" bugs where players see different game states

**Prevention:**
1. Server is the single source of truth for ALL game state
2. Clients send only intentions/actions: `{ type: "BID", count: 5, value: 3 }`
3. Server validates actions using `gameLogic.ts` (already extracted -- good!)
4. Server broadcasts authoritative state to all clients
5. Clients are "dumb terminals" that render server state

**Detection (warning signs you are doing this wrong):**
- Game logic running in React components instead of server
- Clients generating random numbers (dice rolls)
- Clients directly modifying shared state
- "Player X sees different state than Player Y" bugs

**Phase to address:** Phase 1 (Architecture) -- this is foundational. Cannot be deferred.

**Sources:**
- [SmartFoxServer: Security for HTML5 Games](https://smartfoxserver.com/blog/security-for-html5-games/)
- [Gabriel Gambetta: Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)

---

### Pitfall 2: Refactoring Single-Player to Multiplayer (The "Convert Later" Trap)

**What goes wrong:** The current architecture has 40+ useState hooks tightly coupled in `page.tsx`. Developers attempt to "add multiplayer" by syncing these hooks, creating a tangled mess of local state fighting with server state.

**Why it happens:** The single-player code works. The temptation is to preserve it and layer networking on top. This creates dual-authority problems where React state and server state compete.

**Consequences:**
- State conflicts: local optimistic updates vs server corrections
- Animation timing breaks (animations tied to local state changes)
- Complex debugging: "is this bug in local state, server state, or sync?"
- Eventually requires full rewrite anyway

**Prevention:**
1. Accept that multiplayer is a different architecture, not an addon
2. Create clear separation: `ServerGameState` vs `UIState` (animations, selections)
3. Server state flows DOWN only (server -> client, never client -> server mutations)
4. Local UI state is purely ephemeral (hover states, animation flags, etc.)
5. Existing `gameLogic.ts` moves to server; clients only get `types.ts`

**Recommended refactor approach:**
```
Current: page.tsx (40+ useState) -> renders game
Target:
  - Server: game state machine + gameLogic.ts
  - Client: useGameConnection() hook -> renders server state
  - UIState: only animation/interaction state (useState still okay here)
```

**Detection:**
- Multiple sources of truth for the same data
- `useState` holding game state that also exists on server
- Needing to "sync" local state with server state
- Race conditions between local and server updates

**Phase to address:** Phase 1 (Architecture) -- must establish clean architecture before building features.

**Sources:**
- [Quora: Is it a good idea to start single player first?](https://www.quora.com/Is-it-a-good-idea-to-start-making-a-game-with-single-player-first-and-then-after-everything-is-ready-convert-it-into-multiplayer-Unity-5) -- consensus is "no"
- [Lance.gg: Architecture of a Multiplayer Game](https://lance-gg.github.io/docs_out/tutorial-overview_architecture.html)

---

### Pitfall 3: Naive Reconnection Handling

**What goes wrong:** Player closes laptop lid, switches tabs, or has brief network hiccup. Connection drops. On reconnect, player either loses their place in the game, sees stale state, or causes the game to break for everyone.

**Why it happens:** Developers test on stable localhost connections. Reconnection is treated as edge case rather than normal operation. Mobile users switch networks constantly.

**Consequences:**
- Players lose games due to technical issues (rage quit, bad reviews)
- Zombie sessions: server thinks player is connected, they are not
- State corruption: player rejoins mid-action
- Full game state re-download on every reconnect (bandwidth/latency)

**Prevention:**
1. **Session persistence:** Store session ID in localStorage, not just WebSocket connection
2. **Heartbeat mechanism:** Server pings clients every 10-30 seconds; client responds
3. **Grace period:** Do not immediately remove player on disconnect (30-60 second window)
4. **AI takeover:** If grace period expires, AI takes over (PROJECT.md already specifies this)
5. **State recovery:** On reconnect, send only delta from last known state
6. **Exponential backoff:** Client reconnection attempts: 1s, 2s, 4s, 8s... up to max

**Implementation approach for Perudo:**
```
Client disconnects:
  -> Server marks player as "disconnected" (not removed)
  -> AI takes over player's turns if needed
  -> Grace period timer starts (60s)

Client reconnects within grace period:
  -> Validate session ID
  -> Restore player to game
  -> Send current game state
  -> Resume as human player

Client does not reconnect:
  -> AI continues for remainder of game
  -> Session can still reconnect as spectator? (out of scope per PROJECT.md)
```

**Detection:**
- No explicit disconnect handling in code
- Player removal happens immediately on WebSocket close
- No session ID persistence
- Full state sent on every reconnect
- No heartbeat mechanism

**Phase to address:** Phase 2 (Core Multiplayer) -- but architecture must support it from Phase 1.

**Sources:**
- [Socket.IO: Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery)
- [AccelByte: Lobby WebSocket Recovery](https://docs.accelbyte.io/gaming-services/knowledge-base/graceful-disruption-handling/lobby-websocket-recovery/)

---

### Pitfall 4: Room Management Edge Cases

**What goes wrong:** Multiple players try to join at once, host leaves mid-game, room fills while someone is joining, player joins just as game starts. Each edge case breaks the game in different ways.

**Why it happens:** Happy path testing: "Alice creates room, Bob joins, they play." Real world: "Alice creates room while Bob and Charlie race to join the last spot while Dave's connection is flaky and Eve is trying to kick Fred."

**Consequences:**
- Players stuck in broken rooms
- Games starting with wrong number of players
- Host migration failures leave room orphaned
- Duplicate player entries
- Room state corruption

**Prevention (room lifecycle state machine):**
```
Room States:
  WAITING -> STARTING -> IN_GAME -> ENDED

Transitions:
  - WAITING: players can join/leave, host can configure, host can start
  - STARTING: brief lock period, validate all players ready, roll all dice
  - IN_GAME: no join/leave (disconnect -> AI takeover)
  - ENDED: return to WAITING for rematch, or dispose room
```

**Key edge cases to handle explicitly:**

| Edge Case | Solution |
|-----------|----------|
| Host leaves in WAITING | Promote next player to host |
| Host leaves in IN_GAME | Game continues, host powers transfer |
| Player joins during STARTING | Reject with "game starting" message |
| Room fills while joining | Race condition -- use atomic join operation |
| Last player leaves | Dispose room after timeout |
| Player joins twice (race) | Dedupe by session ID |

**Detection:**
- No explicit room state machine
- Join/leave operations not atomic
- Host leaving not handled
- No "starting" transition state

**Phase to address:** Phase 2 (Rooms & Lobby) -- but room state design is Phase 1 architecture.

**Sources:**
- [Playroom Kit: Multiplayer Edge Cases](https://docs.joinplayroom.com/blog/multiplayeredgecases)
- [Gamedeveloper: Working with Generic Room-Based Matchmaking](https://www.gamedeveloper.com/programming/working-with-generic-room-based-matchmaking)

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt. Plan for these but can address iteratively.

### Pitfall 5: Turn Timing and Timeout Handling

**What goes wrong:** It is Player A's turn. They walk away. Game freezes for everyone else. Or: timeout fires, but Player A was actually playing -- they just had lag.

**Why it happens:** Turn-based games need timeouts, but implementing them correctly is tricky. Network latency makes "is player active?" hard to answer.

**Prevention:**
1. Server-side turn timer (never trust client timer)
2. Generous timeout: 60-90 seconds for Perudo (thinking time matters)
3. Activity detection: reset timer on any client activity, not just final action
4. Warning at 15 seconds remaining
5. Auto-action on timeout: AI makes the move for them

**For Perudo specifically:**
- On timeout: AI makes a reasonable bid or calls Dudo
- Player retains control next turn (not permanently AI)
- Show countdown timer to all players

**Detection:**
- Client-side timers for turns
- No timeout handling at all
- Timeout causes game to break

**Phase to address:** Phase 2 (Core Multiplayer)

---

### Pitfall 6: Animation and State Sync Conflicts

**What goes wrong:** Server sends state update. Client is mid-animation. Animation gets interrupted, looks janky. Or animation finishes, but state has already changed again.

**Why it happens:** Current Perudo has extensive Framer Motion animations. Server updates are immediate; animations take time. Without coordination, they fight.

**Prevention:**
1. Separate "game state" from "presentation state"
2. Server state updates queue, presentation consumes at animation speed
3. Critical updates (turn change) can interrupt; visual updates (dice rolling) complete
4. Use animation completion callbacks to signal "ready for next state"

**Architecture approach:**
```
Server: GameState (immediate, authoritative)
Client:
  - GameState (synced from server)
  - PresentationState (derived from GameState, animated)
  - AnimationQueue (pending visual updates)
```

**For Perudo:**
- Dice roll animation: queue until complete before showing results
- Bid announcement: can be immediate
- Dudo reveal: animate reveal, then update totals
- Player elimination: complete death animation before removing from board

**Detection:**
- Animations getting cut off
- State changes visible before animations complete
- Jarring visual jumps

**Phase to address:** Phase 3 (Polish) -- but architecture in Phase 1 must support animation queuing.

---

### Pitfall 7: Message Ordering and Race Conditions

**What goes wrong:** Player A bids, Player B calls Dudo. Messages arrive at server in wrong order. Or: two players both try to act "at the same time."

**Why it happens:** WebSocket messages can arrive out of order due to network jitter. Two players on fast connections can create legitimate race conditions.

**Prevention:**
1. **Sequence numbers:** Each message has incrementing sequence ID
2. **Action validation:** Server rejects actions that do not match current game state
3. **Turn enforcement:** Only current player's actions are accepted
4. **Idempotent actions:** Receiving same action twice is harmless

**For Perudo (turn-based, simpler than real-time):**
- Only current player can bid/dudo/calza
- Actions from non-current-player are rejected (not queued)
- Sequence numbers still useful for duplicate detection

**Detection:**
- "Impossible" game states occurring
- Actions being applied in wrong order
- Same action being processed multiple times

**Phase to address:** Phase 2 (Core Multiplayer)

---

### Pitfall 8: Visibility and Hidden Information

**What goes wrong:** Player A's dice are visible to Player B. Or: server sends all dice to all clients, trusting clients to only show their own. Cheaters inspect network traffic and see everyone's hands.

**Why it happens:** It is easier to send full state to all clients. Hidden information requires per-player state filtering.

**Consequences:**
- Cheating: players can see each other's dice
- Trust violation: even if UI hides it, data is exposed

**Prevention:**
1. Server filters state per-player before sending
2. Each player only receives: their own dice, public info (bids, dice counts)
3. Reveal sequence: server sends revealed dice only after Dudo is called
4. Never send data client "should not see" even if UI hides it

**Implementation for Perudo:**
```typescript
// Server sends to Player A:
{
  myHand: [1, 3, 4, 5, 6],  // Only A's dice
  players: [
    { id: "A", diceCount: 5 },  // No hand visible
    { id: "B", diceCount: 4 },
    { id: "C", diceCount: 5 }
  ],
  currentBid: { count: 7, value: 3 },
  currentPlayer: "B"
}

// After Dudo:
{
  revealedHands: {
    "A": [1, 3, 4, 5, 6],
    "B": [2, 3, 3, 5],
    "C": [1, 1, 3, 4, 6]
  }
}
```

**Detection:**
- Sending full game state to all clients
- Client-side filtering of visible data
- Dice visible in network inspector

**Phase to address:** Phase 2 (Core Multiplayer) -- must be correct from the start.

---

## Minor Pitfalls

Annoying but fixable issues.

### Pitfall 9: Socket.IO Overhead

**What goes wrong:** Using Socket.IO without understanding its overhead. Initial connection uses polling before upgrading to WebSocket. Extra latency on first connection.

**Prevention:**
- Configure Socket.IO to use WebSocket transport only: `{ transports: ['websocket'] }`
- Or use PartyKit/Colyseus which handle this correctly
- Or use raw WebSocket if full control needed

**Phase to address:** Phase 1 (Stack Selection)

**Sources:**
- [Seangoedecke: Building multiplayer games with socket.io](https://www.seangoedecke.com/socket-io-game/)

---

### Pitfall 10: No Rate Limiting

**What goes wrong:** Malicious or buggy client sends hundreds of messages per second. Server CPU spikes, game lags for everyone.

**Prevention:**
- Rate limit per client: max 10-20 messages per second for Perudo
- Ignore excess messages (do not queue indefinitely)
- Disconnect clients that consistently exceed limits
- Log rate limit violations for debugging

**Phase to address:** Phase 3 (Hardening)

---

### Pitfall 11: Insufficient Logging for Debugging

**What goes wrong:** Production bug: "Game broke for room XYZ." No logs to understand what happened.

**Prevention:**
- Log all state transitions (room state, game state)
- Log all client messages (with timestamps)
- Log all disconnections/reconnections
- Structured logging (JSON) for searchability
- Include room ID and player IDs in all logs

**Phase to address:** Phase 3 (Launch Prep)

---

### Pitfall 12: Testing Only Happy Path

**What goes wrong:** Tests cover "normal game flow." Production sees: disconnects, simultaneous actions, malformed messages, timeouts.

**Prevention:**
- Test disconnect during each game phase
- Test reconnect during each game phase
- Test simultaneous actions (race conditions)
- Test malformed/invalid messages
- Test room edge cases (host leave, full room, etc.)

**Phase to address:** All phases -- test as you build.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1 (Architecture) | Keeping client authority | Design server-authoritative from day 1 |
| Phase 1 (Architecture) | Not separating game/UI state | Explicit state separation in types |
| Phase 2 (Rooms) | Race conditions on join | Atomic room operations |
| Phase 2 (Rooms) | Host leaving breaks game | Host migration logic |
| Phase 2 (Game) | Dice visible to all clients | Per-player state filtering |
| Phase 2 (Game) | Reconnect loses game state | Session persistence + grace period |
| Phase 3 (Polish) | Animations break on updates | Animation queue system |
| Phase 3 (Hardening) | No rate limiting | Add before launch |

---

## Perudo-Specific Considerations

Given the existing codebase analysis:

**Existing strengths:**
- `gameLogic.ts` is already separated from UI -- can move to server
- `types.ts` defines clean data structures
- Turn-based game simpler than real-time action

**Existing risks:**
- 40+ useState hooks in `page.tsx` -- high refactor complexity
- Animations tightly coupled to state changes
- All random (dice rolls) happens client-side

**Recommended architecture for Perudo multiplayer:**

```
Server (PartyKit or similar):
├── RoomState (players, host, settings, status)
├── GameState (hands, bids, current player, round)
├── gameLogic.ts (validation, AI, game rules)
└── Event handlers (join, leave, bid, dudo, etc.)

Client (Next.js):
├── useRoom() hook (connection, room state)
├── useGame() hook (game state, my hand only)
├── UIState (animations, selections, hover)
└── Components (mostly unchanged, but read from hooks)
```

---

## Sources Summary

**Architecture & Security:**
- [Gabriel Gambetta: Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html) - HIGH confidence
- [SmartFoxServer: Security for HTML5 Games](https://smartfoxserver.com/blog/security-for-html5-games/) - HIGH confidence
- [Genieee: Top Security Risks in HTML5 Multiplayer Games](https://genieee.com/top-security-risks-in-html5-multiplayer-games-and-how-to-fix-them/) - MEDIUM confidence

**State Synchronization:**
- [Socket.IO: Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery) - HIGH confidence
- [Pusher: WebSockets in Realtime Gaming](https://pusher.com/blog/websockets-realtime-gaming-low-latency/) - MEDIUM confidence
- [Medium: Making a multiplayer web game scalable](https://medium.com/@dragonblade9x/making-a-multiplayer-web-game-with-websocket-that-can-be-scalable-to-millions-of-users-923cc8bd4d3b) - MEDIUM confidence

**Room Management:**
- [Playroom Kit: Multiplayer Edge Cases](https://docs.joinplayroom.com/blog/multiplayeredgecases) - HIGH confidence
- [Gamedeveloper: Working with Generic Room-Based Matchmaking](https://www.gamedeveloper.com/programming/working-with-generic-room-based-matchmaking) - MEDIUM confidence

**Reconnection:**
- [AccelByte: Lobby WebSocket Recovery](https://docs.accelbyte.io/gaming-services/knowledge-base/graceful-disruption-handling/lobby-websocket-recovery/) - HIGH confidence
- [Ably: WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices) - MEDIUM confidence

**Turn-Based Games:**
- [LinkedIn: Best Practices for Synchronizing Networks in Turn-Based Games](https://www.linkedin.com/advice/0/what-best-practices-synchronizing-networks-turn-based-7yg3e) - MEDIUM confidence
