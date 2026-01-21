# Roadmap: Perudo Vibe

## Milestones

- [x] **v1.0 MVP** - Phases 1-9 (shipped 2026-01-18) — [archive](milestones/v1.0-ROADMAP.md)
- [x] **v2.0 Cloudflare Deployment** - Phases 10-12 (shipped 2026-01-19) — [archive](milestones/v2.0-ROADMAP.md)
- [x] **v2.1 Animation Performance** - Phases 13-15 (shipped 2026-01-20) — [archive](milestones/v2.1-ROADMAP.md)
- [x] **v2.2 UI Unification & Tech Debt** - Phases 16-19 (shipped 2026-01-20) — [archive](milestones/v2.2-ROADMAP.md)
- [ ] **v3.0 The Gauntlet** - Phases 20-22 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-9) - SHIPPED 2026-01-18</summary>

### Phase 1: Architecture & Foundation
**Goal**: Project structure supporting both single-player and multiplayer modes
**Plans**: 3 plans (complete)

### Phase 2: Mode Selection
**Goal**: Users can choose between single-player and multiplayer
**Plans**: 1 plan (complete)

### Phase 3: Room Creation
**Goal**: Host can create a multiplayer room
**Plans**: 2 plans (complete)

### Phase 4: Join Flow
**Goal**: Players can join rooms via shareable link
**Plans**: 2 plans (complete)

### Phase 5: Lobby Experience
**Goal**: Players can see who's in the lobby and prepare to play
**Plans**: 2 plans (complete)

### Phase 6: Game State Sync
**Goal**: Real-time multiplayer gameplay works
**Plans**: 3 plans (complete)

### Phase 7: Turn Timers
**Goal**: Turns have time limits with AI fallback
**Plans**: 3 plans (complete)

### Phase 8: Disconnect & Reconnection
**Goal**: Players can reconnect and AI handles disconnects
**Plans**: 2 plans (complete)

### Phase 9: Social & Polish
**Goal**: Quick reactions and game completion flow
**Plans**: 4 plans (complete)

</details>

<details>
<summary>v2.0 Cloudflare Deployment (Phases 10-12) - SHIPPED 2026-01-19</summary>

### Phase 10: Backend Deployment
**Goal**: PartyKit backend running on Cloudflare Workers
**Plans**: 1 plan (complete)

### Phase 11: Frontend & Configuration
**Goal**: Next.js frontend deployed to Cloudflare Pages
**Plans**: 2 plans (complete)

### Phase 12: Production Verification
**Goal**: Full multiplayer experience verified working
**Plans**: 1 plan (complete)

</details>

<details>
<summary>v2.1 Animation Performance (Phases 13-15) - SHIPPED 2026-01-20</summary>

### Phase 13: DudoOverlay Optimization
**Goal**: DudoOverlay animations use only GPU-accelerated properties (transform/opacity)
**Plans**: 1 plan (complete)

### Phase 14: Other Component Optimization
**Goal**: All animated components use GPU-accelerated properties, accessibility supported
**Plans**: 1 plan (complete)

### Phase 15: Performance Verification
**Goal**: Verify 60fps animation performance across browsers
**Plans**: 1 plan (complete)

</details>

<details>
<summary>v2.2 UI Unification & Tech Debt (Phases 16-19) - SHIPPED 2026-01-20</summary>

### Phase 16: Shared Hooks
**Goal**: Animation components use centralized hooks for Firefox detection and reduced motion
**Plans**: 1 plan (complete)

### Phase 17: Game UI Unification
**Goal**: Multiplayer uses single-player game UI styling consistently
**Plans**: 2 plans (complete)

### Phase 18: Lobby Unification
**Goal**: Both lobby types share styling foundation with mode-specific features
**Plans**: 2 plans (complete)

### Phase 19: End Game & Tooling
**Goal**: Single-player has stats, multiplayer has celebration, lint works
**Plans**: 2 plans (complete)

</details>

<details open>
<summary>v3.0 The Gauntlet (Phases 20-22) - IN PROGRESS</summary>

### Phase 20: Core Gauntlet Loop & Transitions
**Goal**: Player can play sequential 1v1 duels with persistent dice and cinematic transitions

**Dependencies**: None (builds on existing single-player infrastructure)

**Requirements**: GAUN-01, GAUN-02, GAUN-03, GAUN-04, GAUN-05, GAUN-06, GAUN-07, GAUN-08, TRAN-01, TRAN-02, TRAN-03, TRAN-04

**Success Criteria:**
1. Player can select "Gauntlet" from main menu and enter a 1v1 duel with full 5 dice
2. After winning a duel, player sees victory splash with defeated opponent, then fight card introducing next opponent
3. Player's dice count persists across duels (if player has 3 dice after round 1, they start round 2 with 3 dice)
4. AI difficulty visibly escalates - early opponents are passive (Turtle), mid-game opponents calculate odds (Calculator), late-game opponents bluff aggressively (Shark)
5. Streak counter is visible during gameplay and updates after each duel victory
6. When player loses all dice, game over screen appears with final streak count and option to restart immediately

**Plans**: TBD

---

### Phase 21: Leaderboard System
**Goal**: Players can submit scores to a global leaderboard and see how they rank

**Dependencies**: Phase 20 (requires completed Gauntlet runs to generate scores)

**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06, LEAD-07

**Success Criteria:**
1. After game over, player can submit their streak score with a nickname (alphanumeric, max 30 chars)
2. Player can view leaderboard showing top 100 scores with nicknames and their own rank
3. Player sees "Near you" section showing 3 scores above and 3 below their current rank
4. Player's personal best is tracked and displayed even without submission
5. Daily leaderboard shows countdown timer to midnight UTC reset, and resets scores at that time

**Plans**: TBD

---

### Phase 22: Achievement System
**Goal**: Players earn achievements for milestones and special accomplishments

**Dependencies**: Phase 20 (requires working Gauntlet to track progress)

**Requirements**: ACHI-01, ACHI-02, ACHI-03, ACHI-04, ACHI-05

**Success Criteria:**
1. Player earns milestone achievements at 5, 10, 25, 50, and 100 opponents defeated in a single run
2. Toast notification appears when achievement is unlocked, showing achievement name and icon
3. Achievements persist across browser sessions (player sees previously earned achievements on return)
4. During a run, player sees progress toward next milestone (e.g., "3/5 to Streak Starter")
5. Hidden achievements unlock for special conditions (e.g., winning a duel with only 1 die remaining)

**Plans**: TBD

</details>

## Progress

**Execution Order:**
Phases 1-19 complete. Phase 20 in progress.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 22/22 | Complete | 2026-01-18 |
| 10-12 | v2.0 | 4/4 | Complete | 2026-01-19 |
| 13-15 | v2.1 | 3/3 | Complete | 2026-01-20 |
| 16-19 | v2.2 | 7/7 | Complete | 2026-01-20 |
| 20 | v3.0 | 0/? | Pending | — |
| 21 | v3.0 | 0/? | Pending | — |
| 22 | v3.0 | 0/? | Pending | — |

---
*Created: 2026-01-17 for v1.0 MVP milestone*
*Last updated: 2026-01-21 after v3.0 roadmap creation*
