# Perudo Vibe

## What This Is

A browser-based Perudo (liar's dice) game with real-time multiplayer support. Players create rooms with shareable links, invite up to 6 friends, and play together with a polished, animated experience featuring a Dia de los Muertos visual theme. Also supports single-player against AI opponents, and a Gauntlet mode for competitive high-score chasing.

## Core Value

Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction — just share a link and play.

## Last Completed Milestone: v3.1 Tutorial (shipped 2026-01-23)

**Delivered:** Interactive tutorial guiding new players through their first game with scripted rounds teaching bidding, Dudo, jokers, and Calza.

**Features delivered:**
- 4-round scripted tutorial teaching basic bidding, challenging with Dudo, wild jokers, and Calza exact matches
- Predetermined dice rolls with visible opponent hands (god mode for learning)
- Guidance system with click-to-dismiss overlays, spotlights, and whisper-style messages
- Constrained actions with disabled button tooltips explaining why options aren't available
- Completion screen with confetti celebration and comprehensive rules modal
- First-time visitor prompt encouraging new players to try the tutorial

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
- ✓ Gauntlet mode selection from main menu — v3.0
- ✓ 1v1 duel game loop with persistent player dice — v3.0
- ✓ AI opponent always starts with 5 dice — v3.0
- ✓ Escalating AI difficulty (Turtle → Calculator → Shark) — v3.0
- ✓ Streak counter displayed during run — v3.0
- ✓ Game over when player loses all dice — v3.0
- ✓ Global leaderboard with Cloudflare D1 — v3.0
- ✓ Leaderboard submission with nickname prompt — v3.0
- ✓ Leaderboard display (top 100 scores, "near you" section) — v3.0
- ✓ Daily leaderboard reset at midnight UTC — v3.0
- ✓ Personal best tracking with localStorage — v3.0
- ✓ Achievement system for streak milestones (5, 10, 25, 50, 100) — v3.0
- ✓ Hidden achievements for special conditions — v3.0
- ✓ Achievement gallery accessible from Gauntlet — v3.0
- ✓ Tutorial mode accessible from main menu — v3.1
- ✓ Scripted game with predetermined dice — v3.1
- ✓ Constrained move selection with inline guidance — v3.1
- ✓ Covers bidding, Dudo, wild ones, and Calza rules — v3.1

### Out of Scope

- Persistent accounts/login — guests with nicknames sufficient for v1
- Text chat — quick reactions provide enough communication, avoids moderation
- Spectator mode — only active players in game
- Matchmaking/random lobbies — private rooms via link sharing only
- Mobile app — web-only, but responsive design works on mobile browsers
- Healing mechanics — once a die is lost, it's gone (pure endurance)
- Cosmetic unlocks — defer to future milestone

## Current State (v3.1 shipped 2026-01-23)

**Production URLs:**
- Frontend: https://faroleo.pages.dev
- Backend: perudo-vibe.lorenzovanleeuwaarden.partykit.dev

**Codebase:**
- ~22,000 lines of TypeScript across 120+ files
- Tech stack: Next.js 16, React 19, PartyKit, Zustand, Framer Motion, Tailwind CSS 4, Cloudflare D1
- Server-authoritative multiplayer with WebSocket real-time sync
- GPU-optimized animations with Firefox simplified mode
- Unified UI components across single-player and multiplayer
- Zero lint errors (ESLint flat config)
- Sophisticated AI with 6 personalities, session memory, pattern recognition
- Gauntlet mode with escalating AI difficulty and leaderboard
- Achievement system with localStorage persistence
- Interactive tutorial teaching all core rules

**Known Issues:**
- Sound files are placeholders (need download from royalty-free sources)
- AI sometimes calls DUDO on guaranteed bids (pre-existing bug)

**Tech Debt:**
- None

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
| No healing in Gauntlet | Pure endurance test, creates tension, mobile-friendly short sessions | ✓ Good |
| Opponents always 5 dice | Fair start each duel, player's disadvantage grows naturally | ✓ Good |
| Escalating AI difficulty | Rewards skill, early runs accessible, late runs challenging | ✓ Good |
| Cloudflare D1 for leaderboard | Free tier (5M reads/day), SQL queries, daily reset via scheduled worker | ✓ Good |
| Daily leaderboard reset | Fresh competition daily, encourages return visits | ✓ Good |
| Achievements in localStorage | No account needed, instant persistence, matches personal best pattern | ✓ Good |
| Toast-only achievements | Cleaner UI per user preference, no progress clutter during gameplay | ✓ Good |
| Gallery in Gauntlet section | Contextually appropriate, achievements only apply to Gauntlet | ✓ Good |
| Scripted tutorial with god mode | Show all dice face-up so players can count and verify | ✓ Good |
| Click-to-dismiss overlays | Simple interaction, no complex state tracking | ✓ Good |
| Rules modal on completion | Players can review rules after learning, not before | ✓ Good |

---
*Last updated: 2026-01-23 after v3.1 milestone shipped*
