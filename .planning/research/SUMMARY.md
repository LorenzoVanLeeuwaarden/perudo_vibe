# Research Summary: Tutorial Mode

**Project:** Perudo Vibe v3.1
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

The tutorial system requires **no new library dependencies**. The existing stack (Zustand, Framer Motion, Tailwind) fully supports all requirements. The Gauntlet mode architecture provides a proven template: a dedicated store for mode-specific state combined with wrapper components that reuse existing game UI. The critical design principle is "learn by doing" — first player interaction must happen within 5 seconds, with inline tooltips teaching concepts at the moment of relevance.

## Key Findings

### Stack: No New Dependencies

| Requirement | Solution | Why No Library |
|-------------|----------|----------------|
| State machine | Zustand screen-state pattern | gauntletStore.ts already proves this |
| Predetermined dice | Static array in config | Not random, just authored content |
| Constrained moves | Validation in handlers | Same as isValidBid() pattern |
| Inline tooltips | Framer Motion + Tailwind | Existing overlay patterns |

**Rejected libraries:** XState (overkill), react-joyride (wrong paradigm - can't control game state), Floating UI (conflicts with Framer Motion).

### Features: Table Stakes

Must have for effective tutorial:
- **Skip option** — accessibility requirement, returning players
- **Progress indicator** — "Step X of Y" orientation
- **Learn by doing** — action within 5 seconds
- **Visual cues** — highlights, arrows on interactive elements
- **Concise text** — max 1-2 sentences per tooltip
- **Replayable** — always accessible from menu

### Architecture: Hybrid Store + Wrapper

```
ModeSelection → TutorialScreen → tutorialStore.ts
                              → TutorialGameplay (reuses BidUI, Dice, etc.)
                              → TutorialOverlay (inline guidance)
```

**Why NOT wrap existing single-player:** 900+ lines of complex state in page.tsx. Cleaner to build standalone TutorialGameplay like GauntletGameplay.

**Component reuse:** BidUI, Dice, SortedDiceDisplay, RevealContent all accept props for customization. Tutorial adds minimal props (e.g., `constrainedBid`).

### Pitfalls to Avoid

| Pitfall | Prevention |
|---------|------------|
| Wall of text before play | First interaction in 5 seconds |
| No skip option | Add skip infrastructure in Phase 1 |
| Reset entire tutorial on error | Step-level checkpoints, not full reset |
| Constraints without explanation | Always show WHY moves are limited |
| Harsh punishment for mistakes | Tutorial = safe space, gentle correction |
| Teaching all concepts at once | Progressive: Bidding → Dudo → Wild Ones → Calza |

## Recommended Approach

### Tutorial Structure (2-3 minutes total)

1. **Basic Bidding** (60-90 sec) — what is a bid, how to make one
2. **Calling Dudo** (60-90 sec) — when and how to challenge
3. **Wild Ones** (30-45 sec) — critical rule about ones as wild
4. **Calza** (30-45 sec) — optional advanced move

### Phase Structure

1. **Phase 1: Foundation** — tutorialStore, TutorialScreen, TutorialGameplay with scripted dice
2. **Phase 2: Guidance** — TutorialOverlay, constrained moves, inline tooltips
3. **Phase 3: Content** — Full lesson script covering bidding, Dudo, wild ones, Calza
4. **Phase 4: Polish** — Skip option, progress indicator, completion celebration

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| No new dependencies | HIGH | Verified against gauntletStore.ts, gameLogic.ts |
| Architecture pattern | HIGH | Gauntlet mode proves the approach |
| Tutorial UX principles | HIGH | Multiple authoritative sources agree |
| Pitfall prevention | HIGH | Well-documented in game design literature |

## Sources

### Primary
- [Eight Ways to Make a Bad Tutorial - Game Developer](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/)
- [CHI 2012: Impact of Tutorials on Games](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/)

### Codebase Analysis
- `/src/stores/gauntletStore.ts` — mode-specific store pattern
- `/src/components/gauntlet/GauntletGameplay.tsx` — standalone gameplay component
- `/src/components/BidUI.tsx` — reusable bidding interface

---
*Research completed: 2026-01-21*
*Ready for requirements: yes*
