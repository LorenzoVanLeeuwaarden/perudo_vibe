# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v2.2 UI Unification & Tech Debt

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements for v2.2
Last activity: 2026-01-20 — Milestone v2.2 started

Progress: [###############] 15/15 phases complete (v1.0 + v2.0 + v2.1) | v2.2 in planning

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

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full list.

Recent (v2.1):
- Firefox simplified mode: Solid backgrounds instead of backdrop-blur
- useSimplifiedAnimations pattern: Combined Firefox + reduced motion guard
- Static style fallbacks: Preserve visual appearance when animations disabled

### Pending Todos

None.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (using tsc --noEmit instead)
- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders

### Tech Debt

From v2.1 audit:
- DudoOverlay, ShaderBackground, DiceRoller3D have local useIsFirefox instead of shared hook
- Same 3 components missing useReducedMotion support (accessibility incomplete)

## Session Continuity

Last session: 2026-01-20
Stopped at: v2.1 milestone shipped
Resume file: None

## Next Steps

**v2.2 UI Unification & Tech Debt** in progress.

Defining requirements for:
- Unified UI components (single-player base)
- Stats page in single-player
- Shared animation hooks
- Lint fix

Next: Complete requirements definition → create roadmap

---
*Updated: 2026-01-20 after v2.2 milestone start*
