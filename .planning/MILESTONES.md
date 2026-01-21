# Project Milestones: Perudo Vibe

## v3.0 The Gauntlet (Shipped: 2026-01-21)

**Delivered:** Endless 1v1 survival mode with escalating AI difficulty, global leaderboard with daily reset, and achievement system for milestone streaks.

**Phases completed:** 20-22 (11 plans total)

**Key accomplishments:**

- Gauntlet mode with persistent dice carry-over and escalating AI (Turtle → Calculator → Shark)
- Cinematic transitions with Tekken-style fight cards and victory splash screens
- Cloudflare D1 leaderboard with daily reset, top 100 scores, and "near you" section
- Personal best tracking with localStorage (no account required)
- Achievement system with 5 milestones + 7 hidden achievements and toast notifications
- Achievement gallery accessible from Gauntlet intro screen

**Stats:**

- 58 files created/modified
- ~9,000 lines of TypeScript added
- 3 phases, 11 plans
- 1 day from start to ship

**Git range:** `65b8b62` → `a442c41`

**What's next:** Sound effects (replace placeholders), cosmetic unlocks, or multiplayer gauntlet.

---

## v2.2 UI Unification & Tech Debt (Shipped: 2026-01-20)

**Delivered:** Unified single-player and multiplayer UI components, shared animation hooks, ESLint tooling migration, and single-player stats tracking with zero lint errors.

**Phases completed:** 16-19 (7 plans total)

**Key accomplishments:**

- Consolidated Firefox detection and reduced motion into shared hooks (useIsFirefox, useReducedMotion)
- Unified game UI - multiplayer matches single-player styling (bid display, player dice shelf, RevealPhase)
- Created LobbyLayout foundation for unified lobby styling across both modes
- Migrated ESLint to flat config format for Next.js 16 with FlatCompat wrapper
- Added single-player stats tracking with end game flow matching multiplayer
- Fixed all 31 lint issues to achieve zero errors/warnings

**Stats:**

- 15+ files created/modified
- ~500 lines of TypeScript added/refactored
- 4 phases, 7 plans
- 1 day from start to ship

**Git range:** `5269768` → `25c7105`

**What's next:** Sound effects (replace placeholder audio), additional accessibility (colorblind mode), or new game features.

---

## v2.1 Animation Performance (Shipped: 2026-01-20)

**Delivered:** 60fps animation performance across all browsers with Firefox-specific optimizations and prefers-reduced-motion accessibility support.

**Phases completed:** 13-15 (3 plans total)

**Key accomplishments:**

- GPU-optimized DudoOverlay with transform/opacity-only animations
- Firefox-specific simplified mode across all animation-heavy components
- Shared animation hooks (useReducedMotion, useIsFirefox) with useSimplifiedAnimations pattern
- prefers-reduced-motion accessibility support in 7 components
- 60fps performance verified in Firefox and Chrome (zero dropped frames)
- Animation visibility increased to 2+ seconds before transitions

**Stats:**

- 11 files created/modified
- ~200 lines of TypeScript added
- 3 phases, 3 plans
- 1 day from start to ship

**Git range:** `ab5b46f` → `4bcbb97`

**What's next:** Sound effects (replace placeholder audio), additional accessibility (colorblind mode), or new game features.

---

## v2.0 Cloudflare Deployment (Shipped: 2026-01-19)

**Delivered:** Production deployment of Perudo Vibe to Cloudflare infrastructure with PartyKit backend and Pages frontend.

**Phases completed:** 10-12 (4 plans total)

**Key accomplishments:**

- PartyKit backend deployed to Cloudflare Workers (perudo-vibe.lorenzovanleeuwaarden.partykit.dev)
- Next.js frontend deployed to Cloudflare Pages (faroleo.pages.dev)
- Environment variables configured for production
- SPA routing fixed with 404.html fallback
- Full multiplayer verified working in production

**Stats:**

- 8 files created/modified
- ~100 lines of TypeScript added
- 3 phases, 4 plans
- 1 day from start to ship

**Git range:** `feat(10-01)` → `feat(12-01)`

**What's next:** Animation performance optimization (v2.1).

---

## v1.0 Multiplayer MVP (Shipped: 2026-01-18)

**Delivered:** Real-time multiplayer Perudo where friends can instantly play together via shareable links without downloads, accounts, or friction.

**Phases completed:** 1-9 (22 plans total)

**Key accomplishments:**

- Server-authoritative multiplayer architecture with PartyKit and real-time WebSocket sync
- Room creation with shareable links and guest nickname join flow
- Full game loop with bidding, Dudo, Calza, dice reveal animations, and player elimination
- Turn timers with AI timeout handling and conservative decision-making
- Disconnect handling with 60-second grace period, AI takeover, and seamless reconnection
- Social polish with emotes, game statistics, celebration screens, and rematch flow

**Stats:**

- 56 files created/modified
- ~8,600 lines of TypeScript added
- 9 phases, 22 plans
- 1 day from start to ship

**Git range:** `feat(01-01)` → `feat(09-04)`

**What's next:** Cloudflare deployment (v2.0).

---

*Milestones created: 2026-01-18*
*Last updated: 2026-01-21 after v3.0 milestone*
