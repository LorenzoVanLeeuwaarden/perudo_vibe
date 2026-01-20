# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v2.2 UI Unification & Tech Debt - Phase 17: Game UI Unification (in progress)

## Current Position

Phase: 17 of 19 (Game UI Unification)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-20 - Completed 17-01-PLAN.md

Progress: [################---] 16/19 phases complete (v1.0 + v2.0 + v2.1 done, v2.2 in progress)

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

**v2.2 Summary (in progress):**
- Plans completed: 2
- Phases complete: 1 (Phase 16)
- Tech debt addressed: HOOKS-01 through HOOKS-05
- UI unification: GAME-01, GAME-02, GAME-03 (bidding phase) complete

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full list.

Recent (v2.1):
- Firefox simplified mode: Solid backgrounds instead of backdrop-blur
- useSimplifiedAnimations pattern: Combined Firefox + reduced motion guard
- Static style fallbacks: Preserve visual appearance when animations disabled

Recent (v2.2):
- Keep Dice3D prop name as isFirefox for backward compatibility, pass combined value
- Update all JSX references to useSimplifiedAnimations for clarity
- Multiplayer adopts single-player bid display exactly (recessed table surface)
- Player dice section uses shelf layout with radial glow, no retro-panel
- BidUI uses hideBidDisplay={true} for consistent bid rendering

### Pending Todos

None.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (TOOL-01 will fix)
- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders

### Tech Debt

Addressed in Phase 16:
- [x] DudoOverlay, ShaderBackground now use shared useIsFirefox (HOOKS-01 to HOOKS-03)
- [x] DiceRoller3D deleted (unused dead code) — HOOKS-04 satisfied by removal
- [x] All animated components now respect prefers-reduced-motion (HOOKS-05)

Addressed in Phase 17 Plan 01:
- [x] Multiplayer bidding phase matches single-player styling (GAME-01)
- [x] PlayerDiceBadge renders identically in both modes (GAME-02)
- [x] BidUI uses hideBidDisplay={true} consistently (GAME-03)

Remaining:
- RevealPhase unification (Phase 17 Plan 02)
- Final testing (Phase 19)

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 17-01-PLAN.md
Resume file: None

## Next Steps

Run `/gsd:execute-phase 17-02` to continue with RevealPhase unification.

---
*Updated: 2026-01-20 after 17-01-PLAN.md completion*
