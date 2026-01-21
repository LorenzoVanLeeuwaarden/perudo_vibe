# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v3.0 The Gauntlet - Phase 21: Leaderboard Backend & UI

## Current Position

Phase: 21 - Leaderboard System (IN PROGRESS)
Plan: 3 of 5 in phase
Status: In progress
Last activity: 2026-01-21 — Completed 21-03-PLAN.md

Progress: [████████████        ] 6/9 plans complete across v3.0 phases (20: 3/3, 21: 3/5, 22: 0/3)

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

Phase 20-02 Decisions:
- Fight card uses personality-specific quotes for immersion
- Victory splash emphasizes gauntlet continues not triumph
- Game over screen prioritizes instant retry over menu navigation
- Streak counter uses key={streak} for forced remount and animation
- Difficulty indicators: Turtle=Easy, Calculator/Chaos/Bluffer=Medium, Shark/Trapper=Hard

Phase 21-02 Decisions:
- Personal best stored in localStorage for no-auth requirement
- Auto-update on game over (loseDie and setPlayerDiceCount)
- SSR-safe with typeof window checks
- updatePersonalBest returns boolean to indicate new record

Phase 21-03 Decisions:
- Cursor format is 'score:id' for pagination with tie-breaking
- Daily filtering uses submitted_at >= date('now', 'start of day')
- GET /near returns 3 above and 3 below (reversed for above to show highest first)
- Client validates nickname before submission (2-30 chars, alphanumeric + spaces)
- Rank calculation uses COUNT(*) + 1 for efficiency

### Pending Todos

None.

### Known Bugs

- **AI calls DUDO on guaranteed bids:** AI sometimes calls DUDO on "1x joker" bids when they have 1+ jokers in their own hand. This is a clearly wrong move since the AI should know the bid is at minimum correct. Needs investigation in AI decision logic.

### Blockers/Concerns

- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders

### Tech Debt

None (cleared in v2.2)

## Session Continuity

Last session: 2026-01-21
Stopped at: Completed 21-03-PLAN.md (Leaderboard API Implementation)
Resume file: None

## Next Steps

1. Phase 21: Leaderboard backend and UI
2. Phase 22: Achievement system

---
*Updated: 2026-01-21 after completing 21-03*
