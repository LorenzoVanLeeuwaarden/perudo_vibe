# Perudo Vibe

## What This Is

A browser-based Perudo (liar's dice) game with real-time multiplayer support. Players create rooms with shareable links, invite up to 6 friends, and play together with a polished, animated experience featuring a Dia de los Muertos visual theme. Also supports single-player against AI opponents, and a Gauntlet mode for competitive high-score chasing.

## Core Value

Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction — just share a link and play.

## Current Milestone: v3.0 The Gauntlet

**Goal:** Add a fast-paced endurance mode where players face sequential 1v1 duels against AI, carrying dice between matches until eliminated.

**Target features:**
- Gauntlet mode: rapid 1v1 duels with persistent dice
- Escalating AI difficulty as streak grows
- Global leaderboard with nickname submission
- Achievements for milestone streaks

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
- ✓ PartyKit backend deployed to Cloudflare Workers — v2.0
- ✓ Next.js frontend deployed to Cloudflare Pages — v2.0
- ✓ Environment variables configured for production — v2.0
- ✓ End-to-end multiplayer verified in production — v2.0
- ✓ 60fps animation performance on Firefox — v2.1
- ✓ 60fps animation performance on Chrome — v2.1
- ✓ prefers-reduced-motion accessibility support — v2.1
- ✓ Unified UI components used in both single-player and multiplayer — v2.2
- ✓ Single-player stats page (port from multiplayer) — v2.2
- ✓ Shared useIsFirefox hook (replace local implementations) — v2.2
- ✓ Shared useReducedMotion hook for accessibility — v2.2
- ✓ Fix npm run lint / next lint directory error — v2.2

### Active

- Gauntlet mode selection from main menu
- 1v1 duel game loop with persistent player dice
- AI opponent always starts with 5 dice
- Escalating AI difficulty (Turtle → Calculator → Shark)
- Streak counter displayed during run
- Game over when player loses all dice
- Global leaderboard backend (Cloudflare KV or D1)
- Leaderboard submission with nickname prompt
- Leaderboard display (top scores)
- Achievement system for streak milestones

### Out of Scope

- Persistent accounts/login — guests with nicknames sufficient for v1
- Text chat — quick reactions provide enough communication, avoids moderation
- Spectator mode — only active players in game
- Matchmaking/random lobbies — private rooms via link sharing only
- Mobile app — web-only, but responsive design works on mobile browsers
- Healing mechanics — once a die is lost, it's gone (pure endurance)
- Cosmetic unlocks — defer to future milestone

## Current State (v2.2 shipped 2026-01-20)

**Production URLs:**
- Frontend: https://faroleo.pages.dev
- Backend: perudo-vibe.lorenzovanleeuwaarden.partykit.dev

**Codebase:**
- ~11,400 lines of TypeScript across 60+ files
- Tech stack: Next.js 16, React 19, PartyKit, Zustand, Framer Motion, Tailwind CSS 4
- Server-authoritative multiplayer with WebSocket real-time sync
- GPU-optimized animations with Firefox simplified mode
- Unified UI components across single-player and multiplayer
- Zero lint errors (ESLint flat config)
- Sophisticated AI with 6 personalities, session memory, pattern recognition

**Known Issues:**
- Sound files are placeholders (need download from royalty-free sources)

**Tech Debt:**
- None (cleared in v2.2)

## Constraints

- **Cost**: Must work on free tier — Cloudflare free tier (100K requests/day, unlimited Pages bandwidth)
- **Stack**: Must integrate with existing Next.js 16 / React 19 codebase
- **Platform**: Cloudflare ecosystem (Pages + Workers) for unified deployment
- **UX**: Polished experience required — smooth animations and clear feedback
- **Latency**: Real-time gameplay requires low-latency sync (sub-200ms achieved)
- **Leaderboard**: Must use Cloudflare KV or D1 (free tier compatible)

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
| Cloudflare for deployment | Single platform for frontend + backend, generous free tier, PartyKit now native to Cloudflare | ✓ Good |
| Firefox simplified mode | Solid backgrounds instead of backdrop-blur for Firefox performance | ✓ Good |
| useSimplifiedAnimations pattern | Combined Firefox + reduced motion into single guard for cleaner code | ✓ Good |
| No healing in Gauntlet | Pure endurance test, creates tension, mobile-friendly short sessions | — Pending |
| Opponents always 5 dice | Fair start each duel, player's disadvantage grows naturally | — Pending |
| Escalating AI difficulty | Rewards skill, early runs accessible, late runs challenging | — Pending |

---
*Last updated: 2026-01-21 after v3.0 milestone start*
