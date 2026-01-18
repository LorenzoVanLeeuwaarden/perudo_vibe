# Perudo Vibe

## What This Is

A browser-based Perudo (liar's dice) game that supports both single-player against AI opponents and real-time multiplayer with friends. Players can create rooms with shareable links, invite up to 6 players, and play together with a polished, animated experience featuring a Dia de los Muertos visual theme.

## Core Value

Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction — just share a link and play.

## Requirements

### Validated

- Perudo game rules (bidding, Dudo, Calza, wild ones) — existing
- AI opponents with strategic decision-making — existing
- Animated dice rolling and reveal sequences — existing
- Player elimination and victory/defeat flow — existing
- Responsive UI with Dia de los Muertos theme — existing
- Single-player lobby with opponent count selection — existing

### Active

- [ ] Room creation with unique shareable link
- [ ] Join room via link with guest nickname
- [ ] Real-time game state sync across all players
- [ ] Host controls: start game, kick players, configure settings
- [ ] Game settings: starting dice count, wild ones toggle
- [ ] AI takeover for disconnected players with reconnection support
- [ ] Quick reactions/emotes during gameplay
- [ ] Return to lobby after game ends for rematches
- [ ] Mode selection: single-player vs AI or multiplayer
- [ ] Maximum 6 players per room

### Out of Scope

- Persistent accounts/login — guests with nicknames sufficient for v1
- Text chat — quick reactions provide enough communication
- Spectator mode — only active players in game
- Matchmaking/random lobbies — private rooms via link sharing only
- Mobile app — web-only, but responsive design

## Context

**Existing Codebase:**
- Next.js 16 with App Router, React 19, TypeScript
- All game state in `page.tsx` with 40+ useState hooks and state machine
- Framer Motion for animations throughout
- Tailwind CSS 4 with custom Dia de los Muertos theme
- Game logic separated in `src/lib/gameLogic.ts`
- Currently client-side only, no backend

**Multiplayer Architecture Needs:**
- Real-time state synchronization between clients
- Room/lobby management with host authority
- Reconnection handling with state restoration
- Edge-deployed backend for low latency globally

**Backend Candidates:**
- PartyKit — edge-first on Cloudflare, generous free tier
- Liveblocks — real-time sync abstraction, more limited free tier
- Research needed to determine best fit

## Constraints

- **Cost**: Must work on free tier for backend services — no paid infrastructure for v1
- **Stack**: Must integrate with existing Next.js 16 / React 19 codebase
- **UX**: Polished experience required — not just functional, needs smooth animations and clear feedback
- **Latency**: Real-time gameplay requires low-latency sync (sub-200ms for good experience)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guest nicknames only for v1 | Reduces complexity, faster to ship, can add accounts later | — Pending |
| AI takeover on disconnect | Better UX than pausing or eliminating, keeps game flowing | — Pending |
| Quick reactions over text chat | Simpler to implement, less moderation concern, fits game pace | — Pending |

---
*Last updated: 2026-01-18 after initialization*
