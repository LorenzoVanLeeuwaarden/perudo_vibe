# Project Research Summary

**Project:** Perudo - The Gauntlet
**Domain:** Browser-based dice game with single-player endless mode
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

Gauntlet mode is a single-player endless mode for Perudo where players face escalating AI opponents, carrying their dice count between duels until eliminated. Research confirms this is a natural extension of the existing architecture: the AI system, game logic, and UI components are already well-decoupled and can be composed into a new game mode with minimal modification. The recommended approach is to create a dedicated `/gauntlet` route with its own state management, reusing existing components through composition rather than modification.

The primary technical challenge is the global leaderboard system. PartyKit with Cloudflare D1 (SQLite) is recommended over KV due to leaderboard query requirements (sorting, ranking). The critical pitfall is score verification without authentication - research recommends server-side game replay verification with session tokens to prevent trivial score manipulation. Secondary concerns include Cloudflare KV write rate limits (1 write/sec/key) and difficulty scaling that feels fair rather than punishing.

Key success factors include: maintaining strict separation between game modes (gauntlet store vs existing stores), implementing buffered leaderboard writes to avoid rate limits, designing transparent difficulty progression (multiple AI personality dimensions, not stat inflation), and thorough edge case testing for the dice carryover mechanic.

## Key Findings

### Recommended Stack

For the Gauntlet mode extension, the existing stack (Next.js 16, React 19, PartyKit) serves as the foundation. New additions focus on storage and state management.

**Core technologies:**
- **PartyKit (existing)**: Real-time infrastructure, now used for leaderboard backend via Durable Objects
- **Cloudflare D1**: SQL database for global leaderboard - supports ORDER BY, COUNT for rankings (KV cannot)
- **Zustand (existing)**: Client state management - new `GauntletStore` for mode-specific state
- **localStorage**: Achievements, personal best, gauntlet run state persistence

**Why D1 over KV:**
- Leaderboards need `ORDER BY score DESC` - D1 supports native SQL
- Ranking queries need `COUNT(*) WHERE score > X` - KV cannot do this
- D1 has strong consistency vs KV's eventual consistency
- D1 free tier: 5GB, 5M reads/day (vs KV: 1GB, 100k reads/day)

### Expected Features

**Must have (table stakes):**
- Dice carryover between duels (player dice persist, opponent always starts with 5)
- Escalating AI difficulty (Turtle -> Calculator -> Shark progression)
- Streak counter prominently displayed during play
- Immediate restart on game over (one-tap "Try Again")
- Global leaderboard with nickname entry (no account required)
- Personal best tracking (local storage)
- Score fraud prevention (basic limits, reject impossible scores)

**Should have (differentiators):**
- AI personality reveal before each duel
- Difficulty tier badges (Bronze/Silver/Gold visual indicators)
- "Near you" leaderboard section showing scores above/below player
- "Personal best" notification during run
- Progressive achievement milestones (3, 5, 10, 25, 50, 100 opponents)
- Achievement notifications queued for round boundaries

**Defer (v2+):**
- Account system for cross-device sync
- Daily/weekly leaderboard resets
- Hidden/challenge achievements ("Win with 1 die remaining")
- Team/co-op gauntlet
- Unlockable characters/power-ups

### Architecture Approach

Gauntlet mode follows a composition architecture: a new `/gauntlet` route orchestrates existing components (AI system, game logic, UI) without modifying them. The existing PartyKit server remains untouched for single-player gauntlet - the game runs entirely client-side. Backend is only needed for leaderboard storage via a new D1-backed API route.

**Major components:**

1. **GauntletPage** (`src/app/gauntlet/page.tsx`) - Orchestrates game loop, wave progression, integrates leaderboard
2. **GauntletStore** (`src/stores/gauntletStore.ts`) - Zustand store for wave number, streak, achievements
3. **WaveGenerator** (`src/lib/gauntlet/waveGenerator.ts`) - Generates opponents with escalating difficulty
4. **ScoreCalculator** (`src/lib/gauntlet/scoreCalculator.ts`) - Computes points based on performance
5. **Leaderboard API** (`src/app/api/leaderboard/route.ts`) - D1-backed endpoints for score submission/retrieval
6. **Achievement System** (`src/lib/gauntlet/achievements.ts`) - Definitions and checking logic

**Reuse as-is (no changes):**
- AI system (`src/lib/ai/`) - makeDecision, personalities, session memory
- Game logic (`src/lib/gameLogic.ts`) - rollDice, isValidBid, countMatching
- UI components - Dice, BidUI, DudoOverlay, VictoryScreen, DefeatScreen

### Critical Pitfalls

1. **State Coupling Between Game Modes** - Create isolated `GauntletStore`, use composition over modification, do NOT modify existing PartyKit server. Add feature flag for clean separation.

2. **Cloudflare KV Write Rate Limit (1/sec/key)** - Use D1 instead of KV for leaderboard. If KV is used elsewhere, buffer writes in Durable Objects and flush periodically.

3. **Score Verification Without Authentication** - Implement server-side game replay verification: store move history during run, verify submission matches achievable game. Use session tokens generated at gauntlet start.

4. **Difficulty Scaling Frustration** - Use multiple AI dimensions (bluffing, risk tolerance, bid aggression) not stat inflation. Include difficulty plateaus every 3-5 rounds. Target: 50% reach round 5, 25% reach round 10.

5. **localStorage Loss of Progress** - Wrap localStorage access with error handling, show "Progress saved" feedback, support export/import of run state, detect private browsing mode upfront.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Gauntlet Loop
**Rationale:** Foundation must exist before leaderboard or achievements can be added. Isolating gauntlet state prevents coupling pitfalls.
**Delivers:** Playable gauntlet mode (local only), wave progression, streak tracking
**Addresses:** Core loop features (carryover, escalation, streak counter, restart)
**Avoids:** State coupling pitfall by establishing `GauntletStore` upfront
**Uses:** Existing AI system, game logic, UI components (no modifications)

### Phase 2: Leaderboard Backend
**Rationale:** Leaderboard is the primary engagement driver for endless modes. Backend must be designed with anti-cheat and rate limits from the start.
**Delivers:** Global leaderboard with score submission, nickname handling, basic fraud limits
**Uses:** Cloudflare D1 for storage, Next.js API routes
**Implements:** Leaderboard API component, score verification
**Avoids:** KV write limits by using D1; score manipulation by implementing session tokens

### Phase 3: Achievements & Polish
**Rationale:** Achievements sustain long-term engagement but require core loop to be stable first. Polish can be added incrementally.
**Delivers:** Achievement milestones, notifications, persistence, UI polish
**Implements:** Achievement system, toast notifications, wave transitions
**Avoids:** Achievement timing issues by queuing notifications for round boundaries

### Phase 4: Integration & Testing
**Rationale:** Mode selection integration and regression testing ensure gauntlet doesn't break existing modes.
**Delivers:** Mode selector with gauntlet entry, difficulty balancing, full regression suite
**Validates:** Existing single-player/multiplayer modes still work correctly
**Avoids:** Breaking existing mode pitfall through comprehensive testing

### Phase Ordering Rationale

- **Dependencies:** Leaderboard (Phase 2) requires game loop (Phase 1) to produce scores. Achievements (Phase 3) require both loop and leaderboard context.
- **Risk mitigation:** Phase 1 establishes isolation boundaries before any shared code is touched. Phase 4 validates no regressions.
- **Architecture alignment:** Each phase maps to a component boundary from ARCHITECTURE.md - GauntletPage, Leaderboard API, Achievement System.
- **Pitfall prevention:** Critical pitfalls (state coupling, KV limits, score verification) are addressed in Phases 1-2 before technical debt accumulates.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Leaderboard):** D1 integration with Next.js may need specific binding research if deploying outside Cloudflare Pages. Score verification replay logic is non-trivial.
- **Phase 3 (Achievements):** Achievement notification UX patterns could benefit from additional design research if complex animations are desired.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core Loop):** Well-established patterns - existing AI and game logic are battle-tested, composition approach is straightforward.
- **Phase 4 (Integration):** Standard testing and feature flag patterns, no novel research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | PartyKit/D1 recommendations verified from official Cloudflare docs; existing stack proven |
| Features | HIGH | Consistent patterns across roguelikes (Slay the Spire, Balatro), mobile endless modes, gauntlet implementations |
| Architecture | HIGH | Existing codebase analysis confirms clean separation; composition approach is low-risk |
| Pitfalls | MEDIUM | Cloudflare limits verified from docs; difficulty scaling and anti-cheat are general best practices, not Perudo-specific |

**Overall confidence:** HIGH

### Gaps to Address

- **Difficulty curve tuning:** Specific percentiles (50% reach round 5) are targets, not verified. Requires playtesting during Phase 3.
- **Score verification complexity:** Game replay verification is conceptually clear but implementation details need Phase 2 spike.
- **React 19 + D1 binding:** PartyKit tutorials target general Next.js; D1 bindings with React 19 not explicitly verified.

## Sources

### Primary (HIGH confidence)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/platform/limits/) - Storage choice rationale
- [PartyKit Documentation](https://docs.partykit.io/how-partykit-works/) - Architecture integration
- [Cloudflare KV Limits](https://developers.cloudflare.com/kv/platform/limits/) - Write rate constraints
- [Heroic Labs: Leaderboard Best Practices](https://heroiclabs.com/docs/nakama/concepts/leaderboards/best-practices/) - Anti-cheat, nickname handling
- [Android Developers: Achievements](https://developer.android.com/games/pgs/achievements) - Achievement design patterns

### Secondary (MEDIUM confidence)
- [Gabriel Gambetta - Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html) - Server authority patterns
- [Slay the Spire Endless Mode](https://steamcommunity.com/sharedfiles/filedetails/?id=1719337474) - Difficulty progression patterns
- [GameDev.net: Infinite Metagame Pacing](https://www.gamedev.net/blogs/entry/2294544-how-to-set-up-pacing-difficulty-and-progression-within-an-infinite-metagame/) - Difficulty scaling
- [Plotline: Streaks for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps) - Streak engagement psychology

### Tertiary (LOW confidence - needs validation)
- Community steam discussions on difficulty "walls" - anecdotal but consistent feedback patterns
- Anti-cheat approaches for anonymous leaderboards - general patterns, not verified implementations

---
*Research completed: 2026-01-21*
*Ready for roadmap: yes*
