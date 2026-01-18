# Project Research Summary

**Project:** Perudo Multiplayer
**Domain:** Real-time multiplayer browser game (turn-based dice)
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

Adding real-time multiplayer to an existing Next.js 16 / React 19 browser game requires a fundamental architecture shift from client-side to server-authoritative state management. The recommended approach uses **PartyKit** for WebSocket infrastructure (edge-deployed on Cloudflare, generous free tier, excellent room abstractions) combined with **Zustand** for client-side UI state. The existing `gameLogic.ts` is a significant asset that can be ported directly to the server.

The primary risk is the current codebase structure: 40+ useState hooks in `page.tsx` with tightly coupled game and UI state. Attempting to "layer networking on top" will fail. The correct approach is to treat multiplayer as a new architecture where the server becomes the single source of truth for game state, and clients become "dumb terminals" that send intentions and render server state. This requires explicit state separation before any networking code is written.

Research reveals consistent patterns across Board Game Arena, Jackbox, and skribbl.io for what users expect: frictionless room joining via links (no accounts), reliable reconnection handling, and graceful disconnect management via AI takeover. The feature set is well-defined with clear table stakes versus differentiators.

## Key Findings

### Recommended Stack

PartyKit is the clear winner over alternatives (Liveblocks, Socket.IO self-hosted, Supabase Realtime). It provides WebSocket infrastructure with built-in room abstractions, automatic reconnection, and edge deployment via Cloudflare. The free tier supports approximately 1,000 complete games per day -- far exceeding expected casual game usage.

**Core technologies:**
- **PartyKit** (latest): Real-time WebSocket server with room management -- edge-deployed, built-in reconnection, free tier generous
- **Zustand** (^5.0.0): Client-side UI state -- simpler than Redux, works well with SSR, ideal for animation/interaction state
- **nanoid** (^5.1.6): Room code generation -- short, URL-safe codes (e.g., "X7KM3P")
- **zod** (^3.23.0): Message validation -- type-safe message protocol between client/server

### Expected Features

**Must have (table stakes):**
- Room creation with shareable link (standard pattern: skribbl.io, Jackbox)
- Guest nickname join without account (critical for casual games)
- Player list with host indicator
- Real-time game state sync (sub-200ms latency)
- Turn indicator and timer (60-90 seconds for Perudo)
- Reconnection support (return to game on refresh)
- Visual disconnect indicator
- Host can start game

**Should have (competitive):**
- AI takeover on disconnect (stated project goal, good UX)
- Quick reactions/emotes (stated project goal, social layer)
- Return to lobby for rematch (stated project goal)
- Host kick from lobby

**Defer (v2+):**
- Account system / login
- Text chat (moderation complexity)
- Matchmaking / public lobbies (requires player base)
- Spectator mode
- Global leaderboards
- Tournament mode

### Architecture Approach

Server-authoritative model where the server maintains all game state, validates all actions, and broadcasts to clients. Clients send only intentions (BID, DUDO, CALZA) and render server state. The existing `gameLogic.ts` contains reusable validation and AI logic that moves to the server unchanged. UI state (animations, modals, selections) stays client-side in Zustand.

**Major components:**
1. **PartyKit Server** -- Room lifecycle, game state machine, action validation, AI controller
2. **Client Socket Hook** -- Connection management, message serialization, state subscription
3. **Zustand UI Store** -- Animation states, modal visibility, player preferences (local-only)
4. **Shared Types/Protocol** -- TypeScript interfaces and Zod schemas for client-server contract

### Critical Pitfalls

1. **Client-Side State Authority** -- Current game runs all logic client-side. Server MUST be source of truth. Clients are dumb terminals. Existing `gameLogic.ts` moves to server.

2. **Refactoring Single-Player to Multiplayer** -- The 40+ useState hooks cannot have "networking layered on top." Requires explicit separation of ServerGameState (authoritative) vs UIState (animations). Accept this is a new architecture, not an addon.

3. **Naive Reconnection Handling** -- Players close laptop lids, switch tabs, have network hiccups. Implement: session persistence (localStorage), heartbeat mechanism, 30-60 second grace period before AI takeover, exponential backoff reconnection.

4. **Room Management Edge Cases** -- Multiple players joining simultaneously, host leaving, room fills while joining. Implement room state machine: WAITING -> STARTING -> IN_GAME -> ENDED. Use atomic join operations.

5. **Hidden Information Leakage** -- Never send all dice to all clients. Server filters per-player: each player only receives their own hand. Revealed dice sent only after Dudo is called.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Architecture Foundation
**Rationale:** Research unanimously indicates that state architecture must be correct from the start. Attempting to add networking to the current structure will fail.
**Delivers:** Shared types, state separation (game vs UI), message protocol definition, project structure for multiplayer
**Addresses:** Turn indicator, action confirmation (table stakes -- via protocol design)
**Avoids:** Client-Side State Authority pitfall, Refactoring trap pitfall

### Phase 2: Core Multiplayer Infrastructure
**Rationale:** With architecture established, room and connection infrastructure comes next as foundation for all game features.
**Delivers:** PartyKit server setup, room creation/joining, player list in lobby, host controls, basic connection management
**Uses:** PartyKit, nanoid, zod from recommended stack
**Implements:** Room Manager, Connection Manager components
**Addresses:** Room creation, join via link, player list, host indicator, host can start game (table stakes)
**Avoids:** Room Management Edge Cases pitfall (implement state machine immediately)

### Phase 3: Game State Synchronization
**Rationale:** Once rooms work, implement the actual game loop with server-authoritative state.
**Delivers:** Server-side game logic, turn management, bid/dudo/calza handling, state broadcast, hidden information handling
**Implements:** Game State Manager, Game Logic (server-side), per-player state filtering
**Addresses:** Real-time state sync, turn indicator and timer, action confirmation (table stakes)
**Avoids:** Hidden Information Leakage pitfall, Message Ordering pitfall

### Phase 4: Disconnect and Reconnection
**Rationale:** With game working, add robustness for real-world network conditions.
**Delivers:** Reconnection with state restoration, AI takeover for disconnected players, grace period handling
**Implements:** Reconnection Handler, AI Controller components
**Addresses:** Reconnection support, visual disconnect indicator, AI takeover on disconnect (table stakes + differentiator)
**Avoids:** Naive Reconnection Handling pitfall

### Phase 5: Polish and Social Features
**Rationale:** With core multiplayer solid, add differentiating features and polish.
**Delivers:** Quick reactions/emotes, return to lobby for rematch, animation queue system, turn timeout handling
**Addresses:** Quick reactions, rematch flow, mute/volume controls (differentiators)
**Avoids:** Animation and State Sync Conflicts pitfall

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Types and protocol must be defined before server/client work begins. This is the contract.
- **Phase 2 before Phase 3:** Rooms must exist before game can be played in them. Room lifecycle is simpler to debug than game logic.
- **Phase 3 before Phase 4:** Game must work in happy path before adding reconnection complexity. Reconnection requires understanding of state to restore.
- **Phase 4 before Phase 5:** Robustness before polish. A working game with disconnects handled is more important than emotes.

This order follows the critical path identified in architecture research: Room Creation -> Join -> Player List -> Sync -> Turn Management -> Game Logic. Disconnect handling and emotes can technically be parallel tracks but are lower priority.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Disconnect/Reconnection):** Complex edge cases around "what happens if player reconnects mid-animation" or "during reveal phase." May need per-state-machine-state reconnection logic.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Architecture):** Well-documented in architecture research already. Pattern is clear: server-authoritative, types-first.
- **Phase 2 (Rooms/Lobby):** PartyKit has excellent documentation and examples. Standard room code pattern is well established.
- **Phase 3 (Game Sync):** Turn-based game sync is simpler than real-time. Pattern is send intention, validate, broadcast.
- **Phase 5 (Polish):** Emotes and rematch are straightforward feature additions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | PartyKit officially documented, Cloudflare acquisition verified, free tier limits confirmed |
| Features | HIGH | Consistent patterns across BGA, Jackbox, skribbl.io, FunNode Liar's Dice |
| Architecture | HIGH | Server-authoritative pattern well-documented by Gabriel Gambetta, Heroic Labs, Photon |
| Pitfalls | MEDIUM-HIGH | Verified against multiple sources; codebase-specific risks identified |

**Overall confidence:** HIGH

### Gaps to Address

- **PartyKit + Next.js 16 + React 19 specific integration:** PartyKit docs are general; no specific verified examples with Next.js 16 / React 19. Should work but may need adaptation.
- **Turn timer UX specifics:** Research suggests 60-90 seconds but optimal for Perudo (thinking game) needs user testing.
- **AI takeover behavior:** When AI takes over, should it play conservatively or match player's style? Needs design decision.
- **Animation queue implementation:** Architecture research identifies the need; specific Framer Motion queue pattern needs implementation research during Phase 5.

## Sources

### Primary (HIGH confidence)
- [PartyKit Documentation](https://docs.partykit.io/) -- server API, room management, pricing
- [Gabriel Gambetta: Client-Server Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html) -- authoritative server patterns
- [Socket.IO: Connection State Recovery](https://socket.io/docs/v4/connection-state-recovery) -- reconnection patterns
- [Heroic Labs: Authoritative Multiplayer](https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/) -- server authority design
- [Jackbox Blog: Kick Players](https://www.jackboxgames.com/blog/the-ability-to-kick-players-and-other-new-features-coming-to-party-pack-9) -- host controls patterns

### Secondary (MEDIUM confidence)
- [Playroom Kit: Multiplayer Edge Cases](https://docs.joinplayroom.com/blog/multiplayeredgecases) -- room management pitfalls
- [Getgud.io: Reconnection Guide](https://www.getgud.io/blog/how-to-successfully-create-a-reconnect-ability-in-multiplayer-games/) -- reconnection patterns
- [SmartFoxServer: Security for HTML5 Games](https://smartfoxserver.com/blog/security-for-html5-games/) -- client trust issues
- [BetterStack: Zustand vs Redux 2025](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/) -- state management choice

### Tertiary (LOW confidence)
- Community discussions on Colonist.io, Photon forums -- specific timeout and kick feature patterns

---
*Research completed: 2026-01-18*
*Ready for roadmap: yes*
