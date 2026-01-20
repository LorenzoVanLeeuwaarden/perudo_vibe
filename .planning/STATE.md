# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v2.2 UI Unification & Tech Debt - Phase 16: Shared Hooks (complete)

## Current Position

Phase: 16 of 19 (Shared Hooks)
Plan: 1 of 1 in current phase
Status: Phase complete
Last activity: 2026-01-20 - Completed 16-01-PLAN.md

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
- Plans completed: 1
- Phases complete: 1 (Phase 16)
- Tech debt addressed: HOOKS-01 through HOOKS-05

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

### Pending Todos

None.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (TOOL-01 will fix)
- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders

### Tech Debt

Addressed in Phase 16:
- [x] DudoOverlay, ShaderBackground, DiceRoller3D now use shared useIsFirefox (HOOKS-01 to HOOKS-04)
- [x] All 3 components now respect prefers-reduced-motion (HOOKS-05)

Remaining:
- Tooling issues (Phase 17)
- UI unification (Phase 18)
- Final testing (Phase 19)

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 16-01-PLAN.md (Phase 16 complete)
Resume file: None

## Next Steps

Run `/gsd:plan-phase 17` to create plan for Tooling phase.

---
*Updated: 2026-01-20 after Phase 16 completion*
