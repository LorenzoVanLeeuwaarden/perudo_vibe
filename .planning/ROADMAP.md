# Roadmap: Perudo Vibe

## Milestones

- [x] **v1.0 MVP** - Phases 1-9 (shipped 2026-01-18)
- [ ] **v2.0 Cloudflare Deployment** - Phases 10-12 (in progress)

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

### v2.0 Cloudflare Deployment (In Progress)

**Milestone Goal:** Deploy Perudo Vibe to Cloudflare so anyone can access and play via public URL.

- [x] **Phase 10: Backend Deployment** - PartyKit backend live on Cloudflare Workers (completed 2026-01-19)
- [ ] **Phase 11: Frontend & Configuration** - Next.js deployed with production config
- [ ] **Phase 12: Production Verification** - End-to-end multiplayer verified

## Phase Details

### Phase 10: Backend Deployment
**Goal**: PartyKit backend running on Cloudflare Workers with accessible WebSocket endpoint
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: BACK-01, BACK-02, BACK-03
**Success Criteria** (what must be TRUE):
  1. Cloudflare account exists with Workers capability enabled
  2. PartyKit server code deploys successfully to Cloudflare Workers
  3. WebSocket endpoint responds to connections at public URL
  4. Backend URL is known and ready for frontend configuration
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Deploy PartyKit backend to Cloudflare Workers (completed 2026-01-19)

### Phase 11: Frontend & Configuration
**Goal**: Next.js frontend deployed to Cloudflare Pages, configured to connect to production backend
**Depends on**: Phase 10 (needs backend URL)
**Requirements**: FRONT-01, FRONT-02, FRONT-03, CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. Next.js app builds successfully in Cloudflare Pages environment
  2. Frontend accessible via public Cloudflare Pages URL
  3. Static assets (CSS, JS, images) load correctly
  4. NEXT_PUBLIC_PARTYKIT_HOST points to production backend
  5. Frontend successfully establishes WebSocket connection to backend
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Production Verification
**Goal**: Full multiplayer experience verified working in production environment
**Depends on**: Phase 11 (needs both frontend and backend deployed)
**Requirements**: VERF-01, VERF-02, VERF-03, VERF-04
**Success Criteria** (what must be TRUE):
  1. User can create a room and receive shareable link
  2. Second user can join room via shareable link
  3. Complete game playable: bidding, Dudo, Calza all work
  4. Disconnected player reconnects and resumes game
  5. Game ends correctly with winner/statistics displayed
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 10. Backend Deployment | v2.0 | 1/1 | Complete | 2026-01-19 |
| 11. Frontend & Configuration | v2.0 | 0/TBD | Not started | - |
| 12. Production Verification | v2.0 | 0/TBD | Not started | - |

---
*Created: 2026-01-19 for v2.0 Cloudflare Deployment milestone*
