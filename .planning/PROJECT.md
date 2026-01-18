# Perudo Vibe

## What This Is

A browser-based Perudo (liar's dice) game with real-time multiplayer support. Players create rooms with shareable links, invite up to 6 friends, and play together with a polished, animated experience featuring a Dia de los Muertos visual theme. Also supports single-player against AI opponents.

## Core Value

Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction — just share a link and play.

## Requirements

### Validated

- ✓ Perudo game rules (bidding, Dudo, Calza, wild ones) — existing
- ✓ AI opponents with strategic decision-making — existing
- ✓ Animated dice rolling and reveal sequences — existing
- ✓ Player elimination and victory/defeat flow — existing
- ✓ Responsive UI with Dia de los Muertos theme — existing
- ✓ Single-player lobby with opponent count selection — existing
- ✓ Mode selection: single-player vs AI or multiplayer — v1.0
- ✓ Room creation with unique shareable link — v1.0
- ✓ Join room via link with guest nickname — v1.0
- ✓ Real-time game state sync across all players — v1.0
- ✓ Host controls: start game, kick players, configure settings — v1.0
- ✓ Game settings: starting dice count, wild ones toggle — v1.0
- ✓ Turn timers with AI timeout handling — v1.0
- ✓ AI takeover for disconnected players with reconnection support — v1.0
- ✓ Quick reactions/emotes during gameplay — v1.0
- ✓ Return to lobby after game ends for rematches — v1.0
- ✓ Game statistics displayed at end — v1.0
- ✓ Maximum 6 players per room — v1.0

### Active

(Next milestone requirements would go here)

### Out of Scope

- Persistent accounts/login — guests with nicknames sufficient for v1
- Text chat — quick reactions provide enough communication, avoids moderation
- Spectator mode — only active players in game
- Matchmaking/random lobbies — private rooms via link sharing only
- Mobile app — web-only, but responsive design works on mobile browsers

## Context

**Current State (v1.0 shipped 2026-01-18):**
- ~30,700 lines of TypeScript across 56 files
- Tech stack: Next.js 16, React 19, PartyKit, Zustand, Framer Motion, Tailwind CSS 4
- Server-authoritative multiplayer with WebSocket real-time sync
- Deployed on Vercel (frontend) + PartyKit (backend)

**Known Issues:**
- `npm run lint` / `next lint` failing with directory error (using tsc --noEmit instead)
- Sound files are placeholders (need download from royalty-free sources)

## Constraints

- **Cost**: Must work on free tier for backend services — PartyKit free tier used
- **Stack**: Must integrate with existing Next.js 16 / React 19 codebase
- **UX**: Polished experience required — smooth animations and clear feedback
- **Latency**: Real-time gameplay requires low-latency sync (sub-200ms achieved)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guest nicknames only for v1 | Reduces complexity, faster to ship, can add accounts later | ✓ Good |
| AI takeover on disconnect | Better UX than pausing or eliminating, keeps game flowing | ✓ Good |
| Quick reactions over text chat | Simpler to implement, less moderation concern, fits game pace | ✓ Good |
| PartyKit for real-time infrastructure | Edge-deployed, generous free tier, room abstractions built-in | ✓ Good |
| Server-authoritative architecture | Prevents cheating, single source of truth, cleaner state sync | ✓ Good |
| Zustand store separation | Network state vs local state cleanly separated | ✓ Good |
| 60-second grace period for reconnection | Allows page refresh without losing position | ✓ Good |
| Turn-based Calza (not interrupt) | Matches standard Perudo rules, cleaner implementation | ✓ Good |
| 8-second celebration before results | Ensures winner celebration is properly seen | ✓ Good |

---
*Last updated: 2026-01-18 after v1.0 milestone*
