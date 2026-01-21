# Research Summary: Gauntlet Mode

**Project:** Perudo Vibe v3.0
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

The Gauntlet mode ("rapid 1v1 duels with persistent dice") is well-suited for implementation. The existing codebase has all the building blocks:

- **AI System:** Fully decoupled, 6 personalities ready to use
- **Game Logic:** Reusable as-is (isValidBid, countMatching, rollDice)
- **UI Components:** All composable without modification
- **Storage:** Cloudflare D1 for leaderboard, localStorage for achievements

The main work is a new `/gauntlet` route that orchestrates existing pieces with wave-based progression.

## Key Findings

### Stack Additions

| Technology | Purpose | Free Tier |
|------------|---------|-----------|
| **Cloudflare D1** | Global leaderboard | 5M reads/day, 100K writes/day, 5GB |

**No new npm dependencies.** D1 is accessed via Cloudflare bindings.

**Rejected:**
- KV: No sorted sets, can't do `ORDER BY score DESC`
- Upstash Redis: External service, costs money
- Server-side achievements: Cosmetic only, localStorage sufficient

### Feature Table Stakes

| Category | Features |
|----------|----------|
| **Core Loop** | Dice carry-over, escalating AI difficulty, streak counter, restart |
| **Leaderboard** | Global display, nickname submission, fraud limits, personal best |
| **Achievements** | Progressive milestones (5/10/25/50/100), notifications, persistence |

### Architecture

| Component | Action |
|-----------|--------|
| AI System (`src/lib/ai/`) | Reuse as-is |
| Game Logic (`gameLogic.ts`) | Reuse as-is |
| UI Components | Reuse as-is, compose into Gauntlet |
| **New:** Gauntlet page | Create `/gauntlet` route |
| **New:** Gauntlet store | Zustand for run state |
| **New:** D1 leaderboard | API routes + schema |
| **New:** Achievement system | Definitions + localStorage |

### Critical Pitfalls

| Pitfall | Prevention |
|---------|------------|
| State coupling | Separate GauntletStore, isolated `/gauntlet` route |
| D1 write limits | D1 handles 100K writes/day (sufficient) |
| Score fraud | Session tokens + server validation of game history |
| Difficulty frustration | Transparent progression, multiple AI dimensions |
| localStorage loss | Auto-save feedback, graceful degradation |

## Recommended Build Order

1. **Phase 20: Core Gauntlet Loop**
   - New route `/gauntlet`
   - Wave generator with escalating AI
   - Dice carry-over state
   - Streak counter UI

2. **Phase 21: Leaderboard**
   - D1 database setup
   - API routes (submit, fetch, rank)
   - Nickname submission UI
   - Leaderboard display

3. **Phase 22: Achievements**
   - Achievement definitions
   - LocalStorage tracking
   - Toast notifications
   - Progress display

4. **Phase 23: Polish & Integration**
   - Mode selection integration
   - Wave transition animations
   - Difficulty balancing
   - Personal best notifications

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Stack (D1) | HIGH | Verified free tier limits |
| AI reuse | HIGH | Analyzed code, fully decoupled |
| UI reuse | HIGH | Components are prop-driven |
| Feature scope | HIGH | Clear table stakes from research |
| Pitfalls | MEDIUM | General patterns, Perudo-specific needs testing |

## Open Questions

- Exact difficulty curve (when to introduce each personality)
- Whether palifico rules apply in 1v1 duels
- Leaderboard retention policy (keep all vs prune old)
- Daily vs all-time leaderboards in v1 or defer

---
*Research completed: 2026-01-21*
*Ready for requirements: yes*
