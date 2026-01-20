# Roadmap: Perudo Vibe

## Milestones

- [x] **v1.0 MVP** - Phases 1-9 (shipped 2026-01-18)
- [x] **v2.0 Cloudflare Deployment** - Phases 10-12 (shipped 2026-01-19)
- [ ] **v2.1 Animation Performance** - Phases 13-15 (in progress)

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

### v2.1 Animation Performance (In Progress)

**Milestone Goal:** Optimize animations for smooth 60fps performance across all browsers, especially Firefox.

- [x] **Phase 13: DudoOverlay Optimization** - Fix the main performance culprits
- [ ] **Phase 14: Other Component Optimization** - Victory, Defeat, RevealPhase + accessibility
- [ ] **Phase 15: Performance Verification** - Verify 60fps across browsers

## Phase Details

### Phase 13: DudoOverlay Optimization
**Goal**: DudoOverlay animations use only GPU-accelerated properties (transform/opacity)
**Depends on**: Nothing (first phase of v2.1)
**Requirements**: DUDO-01, DUDO-02, DUDO-03, DUDO-04
**Success Criteria** (what must be TRUE):
  1. backdrop-filter is static (not animated), container fades in with opacity
  2. Text glow uses pseudo-element technique, no animated text-shadow
  3. SVG glitch filter removed or replaced with CSS-only approach
  4. Particles reduced to 4-6, animate only transform/opacity
  5. Animation visually complete and impactful
**Plans**: 1 plan

Plans:
- [x] 13-01-PLAN.md — Optimize DudoOverlay for 60fps performance (complete)

### Phase 14: Other Component Optimization
**Goal**: All animated components use GPU-accelerated properties, accessibility supported
**Depends on**: Phase 13 (apply same patterns)
**Requirements**: VICT-01, VICT-02, COMP-01, COMP-02, A11Y-01
**Success Criteria** (what must be TRUE):
  1. VictoryScreen audited and any expensive animations fixed
  2. DefeatScreen audited and any expensive animations fixed
  3. RevealPhase audited and any expensive animations fixed
  4. prefers-reduced-motion respected with simplified animations
  5. No animated backdrop-filter, text-shadow, or SVG filters in codebase
**Plans**: 1 plan

Plans:
- [ ] 14-01-PLAN.md — Audit and optimize Victory, Defeat, RevealPhase, add reduced motion support

### Phase 15: Performance Verification
**Goal**: Verify 60fps animation performance across browsers
**Depends on**: Phase 14 (all optimizations complete)
**Requirements**: VERF-01, VERF-02, VERF-03
**Success Criteria** (what must be TRUE):
  1. DudoOverlay runs at 60fps on Firefox (no dropped frames)
  2. DudoOverlay runs at 60fps on Chrome (no dropped frames)
  3. Users can see complete Dudo/Calza animation before game transitions
  4. No visual regression — animations still look good
**Plans**: 1 plan

Plans:
- [ ] 15-01-PLAN.md — Cross-browser performance verification and testing

## Progress

**Execution Order:**
Phases execute in numeric order: 13 -> 14 -> 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 13. DudoOverlay Optimization | v2.1 | 1/1 | ✓ Complete | 2026-01-20 |
| 14. Other Component Optimization | v2.1 | 0/1 | Not started | - |
| 15. Performance Verification | v2.1 | 0/1 | Not started | - |

---
*Created: 2026-01-20 for v2.1 Animation Performance milestone*
