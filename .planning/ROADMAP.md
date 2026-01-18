# Roadmap: Perudo Vibe Multiplayer

## Overview

This roadmap transforms Perudo Vibe from a single-player browser game into a real-time multiplayer experience where friends can play together via shareable links. The journey starts with architecture foundation (server-authoritative state, shared types) then builds progressively: room infrastructure, lobby experience, game synchronization, turn management, disconnect handling, and finally social polish. Each phase delivers a verifiable capability, culminating in a polished multiplayer Perudo game.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Architecture Foundation** - Establish server-authoritative types, state separation, and message protocol
- [x] **Phase 2: Mode Selection** - Landing page with single-player vs multiplayer choice
- [x] **Phase 3: Room Creation** - Create multiplayer rooms with shareable links
- [ ] **Phase 4: Join Flow** - Join rooms via link with guest nickname
- [ ] **Phase 5: Lobby Experience** - Player list, host controls, and game configuration
- [ ] **Phase 6: Game State Sync** - Real-time game state synchronization across players
- [ ] **Phase 7: Turn Timers** - Turn countdown timers with AI timeout handling
- [ ] **Phase 8: Disconnect and Reconnection** - Graceful disconnect handling with AI takeover and reconnection
- [ ] **Phase 9: Social and Polish** - Emotes, rematch flow, and end-game statistics

## Phase Details

### Phase 1: Architecture Foundation
**Goal**: Establish the server-authoritative architecture with shared types and message protocol that enables all multiplayer features
**Depends on**: Nothing (first phase)
**Requirements**: None directly (prerequisite infrastructure)
**Success Criteria** (what must be TRUE):
  1. Shared TypeScript types exist for game state, player state, and room state
  2. Message protocol defined with Zod schemas for all client-server messages
  3. Game state types separate server-authoritative state from client UI state
  4. Project structure supports both PartyKit server and Next.js client
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Install dependencies and create project structure
- [x] 01-02-PLAN.md — Define shared types and message protocol with Zod
- [x] 01-03-PLAN.md — Create Zustand stores and PartyKit server skeleton

### Phase 2: Mode Selection
**Goal**: Users can choose between single-player (vs AI) and multiplayer modes from the landing page
**Depends on**: Phase 1
**Requirements**: MODE-01
**Success Criteria** (what must be TRUE):
  1. User sees clear choice between "Play vs AI" and "Play with Friends" on landing page
  2. Selecting "Play vs AI" starts single-player game with existing flow
  3. Selecting "Play with Friends" initiates multiplayer room creation flow
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Add ModeSelection screen with AI/multiplayer choice and preference persistence

### Phase 3: Room Creation
**Goal**: Users can create multiplayer rooms and receive shareable links to invite friends
**Depends on**: Phase 2
**Requirements**: ROOM-01
**Success Criteria** (what must be TRUE):
  1. User clicking "Play with Friends" creates a new room
  2. Room has a short, memorable code (e.g., X7KM3P) in the URL
  3. User can copy the shareable link to clipboard
  4. Room persists and is joinable by others via the link
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Room code utilities and PartySocket connection infrastructure
- [x] 03-02-PLAN.md — RoomShare UI, RoomLobby, room page route, and ModeSelection integration

### Phase 4: Join Flow
**Goal**: Users can join rooms via link with a guest nickname
**Depends on**: Phase 3
**Requirements**: ROOM-02
**Success Criteria** (what must be TRUE):
  1. User opening a room link sees a nickname entry prompt
  2. User can enter nickname (2-12 characters) and join the room
  3. User is placed in the room lobby after joining
  4. Multiple users can join the same room via the same link
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Lobby Experience
**Goal**: Players in lobby can see each other, host can manage the room and start the game
**Depends on**: Phase 4
**Requirements**: ROOM-03, ROOM-04, ROOM-05, HOST-01
**Success Criteria** (what must be TRUE):
  1. All players in lobby see the player list with names in real-time
  2. Host is clearly indicated (crown icon or similar) to all players
  3. Host can kick players from the lobby before game starts
  4. Host can configure game settings (starting dice count, wild ones toggle)
  5. Host can start the game when 2-6 players are present
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Game State Sync
**Goal**: All players see the same public game state in real-time, with hidden information (dice) properly filtered per player
**Depends on**: Phase 5
**Requirements**: SYNC-01, SYNC-02, SYNC-03, TURN-03
**Success Criteria** (what must be TRUE):
  1. Each player only sees their own dice — server never sends other players' dice values to clients
  2. All players see identical public state (bids, dice counts, eliminations) in real-time
  3. State updates arrive within 200ms for all connected players
  4. Current player's turn is highlighted for all players
  5. Turn order is visible showing who plays next
  6. Players see visual confirmation when their action (bid, dudo, calza) is received
  7. On reveal (Dudo/Calza), all dice are shown to all players simultaneously
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Turn Timers
**Goal**: Each turn has a visible timer and AI takes over if player times out
**Depends on**: Phase 6
**Requirements**: TURN-01, TURN-02
**Success Criteria** (what must be TRUE):
  1. All players see a countdown timer during active player's turn
  2. Timer is synchronized across all clients (same time shown)
  3. If timer expires, AI automatically takes the turn for the player
  4. Other players see indication that AI made a move due to timeout
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Disconnect and Reconnection
**Goal**: Players can reconnect after disconnection, with AI maintaining their position until they return
**Depends on**: Phase 7
**Requirements**: SYNC-04, DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. Player refreshing the page can rejoin the game with their state intact
  2. Disconnected player has a grace period (30-60 seconds) to reconnect
  3. AI plays on behalf of disconnected player until they reconnect
  4. Other players see a visual indicator showing which player is disconnected
  5. Reconnecting player resumes control from AI seamlessly
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Social and Polish
**Goal**: Players can express themselves with emotes, rematch easily, and see game statistics
**Depends on**: Phase 8
**Requirements**: SOCL-01, SOCL-02, SOCL-03
**Success Criteria** (what must be TRUE):
  1. Players can send quick reactions/emotes visible to all players during the game
  2. After game ends, all players return to the lobby for potential rematch
  3. Game statistics are displayed at game end (rounds played, dice lost, who called dudo, etc.)
  4. Host can start a new game from the post-game lobby
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Architecture Foundation | 3/3 | ✓ Complete | 2026-01-18 |
| 2. Mode Selection | 1/1 | ✓ Complete | 2026-01-18 |
| 3. Room Creation | 2/2 | ✓ Complete | 2026-01-18 |
| 4. Join Flow | 0/TBD | Not started | - |
| 5. Lobby Experience | 0/TBD | Not started | - |
| 6. Game State Sync | 0/TBD | Not started | - |
| 7. Turn Timers | 0/TBD | Not started | - |
| 8. Disconnect and Reconnection | 0/TBD | Not started | - |
| 9. Social and Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-18*
*Last updated: 2026-01-18*
