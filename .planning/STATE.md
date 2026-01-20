# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v2.1 Animation Performance - Phase 14 complete

## Current Position

Phase: 14 of 15 (Other Component Optimization) - Complete
Plan: 01 of 01
Status: Phase complete
Last activity: 2026-01-20 - Completed 14-01-PLAN.md

Progress: [######--] 2/3 v2.1 phases complete (67%)

## Production URLs

- **Frontend:** https://faroleo.pages.dev
- **Backend:** perudo-vibe.lorenzovanleeuwaarden.partykit.dev

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 22
- Total phases: 9
- Total execution time: ~5h
- Git commits: 56 feature commits

**v2.0 Metrics:**
- Plans completed: 4
- Phases complete: 2 of 3 (Phase 10, 11 complete)
- Total execution time: ~38min
- Backend URL: perudo-vibe.lorenzovanleeuwaarden.partykit.dev
- Frontend URL: faroleo.pages.dev

**v2.1 Metrics:**
- Plans completed: 2
- Phases complete: 2 of 3 (Phase 13, 14 complete)
- Total execution time: ~51min

## Accumulated Context

### Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 10 | PartyKit managed deployment | No direct Cloudflare account needed, handles infrastructure |
| 11-01 | Server/client component split for room page | generateStaticParams requires server component, room UI uses client hooks |
| 11-01 | PLACEHOLDER param + _redirects for SPA routing | Static export needs known params; SPA fallback handles actual room codes |
| 11-01 | build:production script | .env.local overrides .env.production; explicit env var ensures correct host |
| 11-02 | 404.html SPA fallback | _redirects wasn't sufficient; 404.html serves index.html content for SPA routing |
| 11-02 | Client-side room code extraction | useParams returns PLACEHOLDER; extract from window.location.pathname |
| 11-02 | Connection guard in useRoomConnection | Prevent WebSocket before valid room code is extracted |
| 13-01 | Firefox simplified mode | Solid backgrounds instead of backdrop-blur for Firefox performance |
| 13-01 | Particle systems disabled on Firefox | Prevents frame drops while maintaining visual experience |
| 13-01 | useFirefox hook pattern | Reusable browser detection for conditional rendering |
| 14-01 | useSimplifiedAnimations pattern | Combined Firefox + reduced motion into single guard for cleaner code |
| 14-01 | Static style fallbacks | Preserve visual appearance when animations disabled |
| 14-01 | Shared hooks in src/hooks/ | Cross-component reuse for useIsFirefox and useReducedMotion |

### Pending Todos

None.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (using tsc --noEmit instead)
- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders

## Session Continuity

Last session: 2026-01-20T13:03:49Z
Stopped at: Completed 14-01-PLAN.md
Resume file: None

## Next Steps

Phase 14 complete! All targeted animation-heavy components optimized for 60fps on both Chrome and Firefox, plus accessibility support via prefers-reduced-motion.

Next: Run `/gsd:plan-phase` for Phase 15 (Cross-Device Testing) to verify performance across browsers and devices.

---
*Updated: 2026-01-20 after 14-01-PLAN.md completion*
