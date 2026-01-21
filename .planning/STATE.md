# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v3.0 The Gauntlet - Phase 20: Core Gauntlet Loop & Transitions

## Current Position

Phase: 20 - Core Gauntlet Loop & Transitions
Plan: 01 of 3 in phase
Status: In progress
Last activity: 2026-01-21 — Completed 20-01-PLAN.md

Progress: [█                   ] 1/3 plans complete in phase 20 (1/3 phases v3.0)

## Production URLs

- **Frontend:** https://faroleo.pages.dev
- **Backend:** perudo-vibe.lorenzovanleeuwaarden.partykit.dev

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 22
- Total phases: 9
- Git commits: 56 feature commits

**v2.0 Summary:**
- Plans completed: 4
- Phases complete: 3 (Phase 10, 11, 12)
- Backend URL: perudo-vibe.lorenzovanleeuwaarden.partykit.dev
- Frontend URL: faroleo.pages.dev

**v2.1 Summary:**
- Plans completed: 3
- Phases complete: 3 (Phase 13, 14, 15)
- Requirements complete: 12/12 (100%)
- Animation performance: 60fps on Firefox and Chrome

**v2.2 Summary:**
- Plans completed: 8
- Phases complete: 4 (Phase 16, 17, 18, 19)
- Tech debt addressed: All hooks unified
- UI unification: Complete
- Zero lint errors

**v3.0 Summary:**
- Phases: 3 (Phases 20-22)
- Requirements: 24 total
- Coverage: 24/24 mapped (100%)

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full list.

Recent (v2.2):
- Keep Dice3D prop name as isFirefox for backward compatibility
- Multiplayer adopts single-player bid display exactly
- LobbyLayout uses static gradient background (GPU efficient)
- FlatCompat wrapper for eslint-config-next compatibility

Recent (outside GSD):
- Sophisticated AI system with 6 personalities implemented
- Session memory tracks opponent behavior
- Pattern deviation detection flags suspicious bids
- Liar's Leap strategy for dominant bluffing

v3.0 Decisions:
- No healing in Gauntlet (pure endurance test)
- AI opponents always start with 5 dice (fair challenge)
- Escalating AI difficulty: Turtle -> Calculator -> Shark
- Cloudflare D1 for leaderboard (5M reads/day free tier)
- Daily leaderboard resets at midnight UTC
- Achievements stored in localStorage (no account needed)

Phase 20-01 Decisions:
- AI difficulty escalates by round: turtle (1-3), calculator (4-6), shark (7+)
- GameMode type extended to include 'gauntlet' alongside 'ai' and 'multiplayer'
- RulesScreen uses ominous dark purple/red styling to differentiate from regular game modes
- Gauntlet store manages screen state machine with explicit transitions

### Pending Todos

None.

### Blockers/Concerns

- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders
- D1 database binding needs configuration in wrangler.toml

### Tech Debt

None (cleared in v2.2)

## Session Continuity

Last session: 2026-01-21 10:46 UTC
Stopped at: Completed 20-01-PLAN.md
Resume file: None

## Next Steps

1. Execute 20-02-PLAN.md (Fight Card & Victory/GameOver screens)
2. Execute 20-03-PLAN.md (Gameplay wiring)
3. Phase 21: Leaderboard backend and UI
4. Phase 22: Achievement system

---
*Updated: 2026-01-21 10:46 UTC after completing plan 20-01*
