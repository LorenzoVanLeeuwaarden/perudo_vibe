# Roadmap: Perudo Vibe

## Milestones

- [x] **v1.0 MVP** - Phases 1-9 (shipped 2026-01-18) — [archive](milestones/v1.0-ROADMAP.md)
- [x] **v2.0 Cloudflare Deployment** - Phases 10-12 (shipped 2026-01-19) — [archive](milestones/v2.0-ROADMAP.md)
- [x] **v2.1 Animation Performance** - Phases 13-15 (shipped 2026-01-20) — [archive](milestones/v2.1-ROADMAP.md)
- [x] **v2.2 UI Unification & Tech Debt** - Phases 16-19 (shipped 2026-01-20) — [archive](milestones/v2.2-ROADMAP.md)

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

### v2.2 UI Unification & Tech Debt (In Progress)

**Milestone Goal:** Consolidate single-player and multiplayer UI into one unified component set, clean up tech debt (shared hooks, lint fix).

### Phase 16: Shared Hooks
**Goal**: Animation components use centralized hooks for Firefox detection and reduced motion
**Depends on**: Phase 15
**Requirements**: HOOKS-01, HOOKS-02, HOOKS-03, HOOKS-04, HOOKS-05
**Success Criteria** (what must be TRUE):
  1. A single useIsFirefox hook exists in /src/hooks/ and is the only Firefox detection in the codebase
  2. DudoOverlay, ShaderBackground, and DiceRoller3D all import from the shared hook
  3. A useReducedMotion hook exists and all animated components respect prefers-reduced-motion
  4. No duplicate Firefox detection logic remains in component files
**Plans**: 1 plan

Plans:
- [x] 16-01-PLAN.md — Migrate DudoOverlay, ShaderBackground to shared hooks; DiceRoller3D deleted (unused)

### Phase 17: Game UI Unification
**Goal**: Multiplayer uses single-player game UI styling consistently
**Depends on**: Phase 16
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. Multiplayer GameBoard renders with the same visual styling as single-player
  2. PlayerDiceBadge looks identical in both single-player and multiplayer
  3. BidUI component uses consistent styling regardless of game mode
  4. RevealPhase animation and styling matches between both modes
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md — Unify GameBoard bidding phase styling (bid display + player dice shelf)
- [x] 17-02-PLAN.md — Unify RevealPhase styling (bid vs actual comparison)

### Phase 18: Lobby Unification
**Goal**: Both lobby types share styling foundation with mode-specific features
**Depends on**: Phase 16
**Requirements**: LOBBY-01, LOBBY-02, LOBBY-03
**Success Criteria** (what must be TRUE):
  1. A shared lobby layout/styling foundation exists that both lobbies use
  2. Single-player lobby renders using the unified styling system
  3. Multiplayer lobby renders using the unified styling with its mode-specific features (player list, share link, kick)
**Plans**: 2 plans

Plans:
- [x] 18-01-PLAN.md — Create LobbyLayout foundation and integrate single-player lobby
- [x] 18-02-PLAN.md — Integrate multiplayer lobby with LobbyLayout

### Phase 19: End Game & Tooling
**Goal**: Single-player has stats, multiplayer has celebration, lint works
**Depends on**: Phase 17
**Requirements**: END-01, END-02, END-03, END-04, TOOL-01
**Success Criteria** (what must be TRUE):
  1. Single-player shows stats page after Victory/Defeat celebration completes
  2. Multiplayer shows Victory/Defeat celebration before transitioning to stats page
  3. Stats page component works identically in both modes (same component, same data format)
  4. Single-player tracks and displays game stats (bids made, dudo/calza accuracy, dice lost/gained)
  5. `npm run lint` executes successfully without directory errors
**Plans**: 2 plans

Plans:
- [x] 19-01-PLAN.md — ESLint configuration migration (flat config for Next.js 16)
- [x] 19-02-PLAN.md — Single-player stats tracking and end game flow

## Progress

**Execution Order:**
Phases 1-15 complete. v2.2 starts at Phase 16.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 22/22 | Complete | 2026-01-18 |
| 10-12 | v2.0 | 4/4 | Complete | 2026-01-19 |
| 13-15 | v2.1 | 3/3 | Complete | 2026-01-20 |
| 16. Shared Hooks | v2.2 | 1/1 | Complete | 2026-01-20 |
| 17. Game UI | v2.2 | 2/2 | Complete | 2026-01-20 |
| 18. Lobby UI | v2.2 | 2/2 | Complete | 2026-01-20 |
| 19. End Game & Tooling | v2.2 | 2/2 | Complete | 2026-01-20 |

---
*Created: 2026-01-17 for v1.0 MVP milestone*
*Last updated: 2026-01-20 after Phase 19 execution (v2.2 complete)*
