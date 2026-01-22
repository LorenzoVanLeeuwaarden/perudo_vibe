# Roadmap: Perudo Vibe

## Milestones

- [x] **v1.0 MVP** - Phases 1-9 (shipped 2026-01-18) — [archive](milestones/v1.0-ROADMAP.md)
- [x] **v2.0 Cloudflare Deployment** - Phases 10-12 (shipped 2026-01-19) — [archive](milestones/v2.0-ROADMAP.md)
- [x] **v2.1 Animation Performance** - Phases 13-15 (shipped 2026-01-20) — [archive](milestones/v2.1-ROADMAP.md)
- [x] **v2.2 UI Unification & Tech Debt** - Phases 16-19 (shipped 2026-01-20) — [archive](milestones/v2.2-ROADMAP.md)
- [x] **v3.0 The Gauntlet** - Phases 20-22 (shipped 2026-01-21)
- [x] **v3.1 Tutorial** - Phases 23-25 (shipped 2026-01-22)

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

<details>
<summary>v3.0 The Gauntlet (Phases 20-22) - SHIPPED 2026-01-21</summary>

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

**Plans:** 3 plans

Plans:
- [x] 20-01-PLAN.md — Gauntlet store and mode entry (RulesScreen)
- [x] 20-02-PLAN.md — Transition UI components (FightCard, VictorySplash, GameOverScreen, StreakCounter)
- [x] 20-03-PLAN.md — GauntletModeScreen integration and full flow wiring

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

**Plans:** 5 plans

Plans:
- [x] 21-01-PLAN.md — D1 database infrastructure and leaderboard Worker skeleton
- [x] 21-02-PLAN.md — Client-side personal best tracking with localStorage
- [x] 21-03-PLAN.md — Leaderboard API endpoints (submit, fetch, rank, near)
- [x] 21-04-PLAN.md — Scheduled Worker for daily leaderboard reset
- [x] 21-05-PLAN.md — Leaderboard UI (LeaderboardScreen, SubmitScoreModal, countdown timer)

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

**Plans:** 3 plans

Plans:
- [x] 22-01-PLAN.md — Achievement system core (definitions, types, localStorage persistence)
- [x] 22-02-PLAN.md — Achievement detection and toast notifications
- [x] 22-03-PLAN.md — Achievement gallery (progress display removed per user request)

</details>

<details>
<summary>v3.1 Tutorial (Phases 23-25) - SHIPPED 2026-01-22</summary>

### Phase 23: Tutorial Foundation
**Goal**: Tutorial infrastructure exists with scripted gameplay that reuses existing components

**Dependencies**: None (builds on existing single-player infrastructure)

**Requirements**: FLOW-01, GAME-01, GAME-02, GAME-05, VIS-04

**Success Criteria:**
1. User can click "How to Play" button on main menu and enter tutorial mode
2. Tutorial presents a 3-player game with user and 2 AI opponents
3. Dice rolls produce predetermined values that create specific teaching scenarios
4. Tutorial uses actual game components (BidUI, Dice, SortedDiceDisplay) for authentic feel
5. No real game penalties apply — tutorial is explicitly a safe learning environment

**Plans:** 3 plans

Plans:
- [x] 23-01-PLAN.md — Tutorial store and main menu entry point
- [x] 23-02-PLAN.md — Tutorial script and gameplay component
- [x] 23-03-PLAN.md — Tutorial screen integration and first-time prompt

---

### Phase 24: Tutorial Guidance
**Goal**: Interactive guidance system teaches through constrained choices with inline explanations

**Dependencies**: Phase 23 (requires tutorial gameplay skeleton)

**Requirements**: GAME-03, GAME-04, VIS-01, VIS-02, VIS-03

**Success Criteria:**
1. User's move choices are constrained to the intended tutorial action at each step
2. Disabled options show tooltip explaining why they are unavailable ("First, let's learn basic bidding")
3. Inline tooltips appear with 1-2 sentence explanations at each teaching moment
4. Visual cues (highlights, subtle arrows) draw attention to interactive elements
5. Dice relevant to the current explanation pulse or glow to focus attention

**Plans:** 3 plans

Plans:
- [x] 24-01-PLAN.md — Tooltip components (TutorialTooltip, TutorialOverlay, DisabledButtonWrapper)
- [x] 24-02-PLAN.md — Script enhancement with tooltip and highlighting data
- [x] 24-03-PLAN.md — TutorialGameplay integration with constrained actions

---

### Phase 25: Tutorial Content & Polish
**Goal**: Complete tutorial teaches all core rules with completion celebration

**Dependencies**: Phase 24 (requires guidance system infrastructure)

**Requirements**: FLOW-04, FLOW-05, FLOW-06, CONT-01, CONT-02, CONT-03, CONT-04

**Note:** FLOW-02 (skip button) and FLOW-03 (progress indicator) descoped per CONTEXT.md decisions - tutorial is short enough to complete in one sitting.

**Success Criteria:**
1. User learns basic bidding (what a bid is, how to make one) - covered by Phase 23-24
2. User learns calling Dudo (when to challenge, what happens when you call) - covered by Phase 23-24
3. User learns wild ones rule (ones count as any face value)
4. User learns Calza (exact match challenge)
5. User can exit mid-tutorial and return to main menu (exit button visible throughout)
6. Celebration (confetti) plays on tutorial completion
7. Tutorial auto-returns to main menu after celebration
8. Tutorial completion persists (app does not auto-prompt returning players) - covered by Phase 23

**Plans:** 2 plans

Plans:
- [x] 25-01-PLAN.md — Tutorial content expansion (wild ones, Calza teaching steps)
- [x] 25-02-PLAN.md — Calza button and completion celebration (confetti, auto-return)

</details>

## Progress

**Execution Order:**
v3.1 Tutorial milestone complete. Phases 23-25 all shipped.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 22/22 | Complete | 2026-01-18 |
| 10-12 | v2.0 | 4/4 | Complete | 2026-01-19 |
| 13-15 | v2.1 | 3/3 | Complete | 2026-01-20 |
| 16-19 | v2.2 | 7/7 | Complete | 2026-01-20 |
| 20 | v3.0 | 3/3 | Complete | 2026-01-21 |
| 21 | v3.0 | 5/5 | Complete | 2026-01-21 |
| 22 | v3.0 | 3/3 | Complete | 2026-01-21 |
| 23 | v3.1 | 3/3 | Complete | 2026-01-22 |
| 24 | v3.1 | 3/3 | Complete | 2026-01-22 |
| 25 | v3.1 | 2/2 | Complete | 2026-01-22 |

---
*Created: 2026-01-17 for v1.0 MVP milestone*
*Last updated: 2026-01-22 after completing Phase 25 (v3.1 Tutorial milestone complete)*
