# Requirements: Perudo Vibe

**Defined:** 2026-01-18
**Core Value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Mode Selection

- [ ] **MODE-01**: User can choose between single-player (vs AI) and multiplayer modes

### Room/Lobby

- [ ] **ROOM-01**: User can create a room and receive a unique shareable link
- [ ] **ROOM-02**: User can join a room via link with a guest nickname
- [ ] **ROOM-03**: User can see player list with host indicator in lobby
- [ ] **ROOM-04**: Host can kick players from lobby before game starts
- [ ] **ROOM-05**: Host can start game when 2-6 players are ready

### Game State Synchronization

- [ ] **SYNC-01**: All players see same game state in real-time (sub-200ms latency)
- [ ] **SYNC-02**: Current player's turn is clearly indicated to all players
- [ ] **SYNC-03**: Players receive visual confirmation when their action is received
- [ ] **SYNC-04**: Player can rejoin game after page refresh with state intact

### Turn Management

- [ ] **TURN-01**: Each turn has a timer visible to all players
- [ ] **TURN-02**: AI takes turn automatically if player times out
- [ ] **TURN-03**: Turn order and current player clearly displayed

### Disconnect Handling

- [ ] **DISC-01**: Disconnected player can reconnect within grace period
- [ ] **DISC-02**: AI takes over for disconnected player until they return
- [ ] **DISC-03**: Other players see visual indicator when player is disconnected

### Social Features

- [ ] **SOCL-01**: Players can send quick reactions/emotes during game
- [ ] **SOCL-02**: Players return to lobby after game ends for rematch option
- [ ] **SOCL-03**: Game statistics displayed at end (rounds played, dice lost, etc.)

### Host Controls

- [ ] **HOST-01**: Host can configure game settings (starting dice count, wild ones toggle)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Accessibility

- **ACCS-01**: Colorblind mode with patterns/shapes on dice
- **ACCS-02**: Reduced motion option respecting prefers-reduced-motion

### Host Power

- **HPWR-01**: Host can transfer host role to another player
- **HPWR-02**: Host can pause game (all players see pause screen)
- **HPWR-03**: Host can kick player during game (replaced by AI)

### Notifications

- **NOTF-01**: Browser notification when it's your turn (if tab inactive)

### Identity

- **IDNT-01**: Persistent username across sessions (localStorage or account)
- **IDNT-02**: Optional account system for persistent identity

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Text chat | Moderation concerns, complexity; emotes sufficient for casual game |
| Spectator mode | Low value for small friend groups; watch via Discord screenshare |
| Matchmaking / public lobbies | Requires player base, moderation, anti-cheat; private rooms via link only |
| Global leaderboards | Requires accounts, anti-cheat; per-game stats sufficient |
| Custom avatars / profiles | Scope creep, asset management; player colors sufficient |
| In-game voice chat | WebRTC complexity, moderation; use Discord externally |
| Tournament mode | Complex bracket management; single-game focus for v1 |
| Game variants | Each variant needs balancing, testing; wild ones toggle sufficient |
| Mobile app | Platform-specific development; responsive web covers mobile browsers |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODE-01 | TBD | Pending |
| ROOM-01 | TBD | Pending |
| ROOM-02 | TBD | Pending |
| ROOM-03 | TBD | Pending |
| ROOM-04 | TBD | Pending |
| ROOM-05 | TBD | Pending |
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SYNC-04 | TBD | Pending |
| TURN-01 | TBD | Pending |
| TURN-02 | TBD | Pending |
| TURN-03 | TBD | Pending |
| DISC-01 | TBD | Pending |
| DISC-02 | TBD | Pending |
| DISC-03 | TBD | Pending |
| SOCL-01 | TBD | Pending |
| SOCL-02 | TBD | Pending |
| SOCL-03 | TBD | Pending |
| HOST-01 | TBD | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 0
- Unmapped: 20 (pending roadmap creation)

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 after initial definition*
