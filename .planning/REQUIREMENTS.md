# Requirements: Perudo Vibe v3.0 The Gauntlet

**Defined:** 2026-01-21
**Core Value:** Fast-paced endurance mode where players face sequential 1v1 duels against AI, carrying dice between matches until eliminated.

## v3.0 Requirements

Requirements for The Gauntlet milestone. Each maps to roadmap phases.

### Core Gauntlet Loop

- [ ] **GAUN-01**: Player can start Gauntlet mode from main menu
- [ ] **GAUN-02**: Player plays 1v1 duels against AI opponents
- [ ] **GAUN-03**: Player's dice count carries over between duels (no healing)
- [ ] **GAUN-04**: AI opponent always starts with 5 dice each duel
- [ ] **GAUN-05**: AI difficulty escalates as streak grows (Turtle → Calculator → Shark)
- [ ] **GAUN-06**: Streak counter displays during gameplay
- [ ] **GAUN-07**: Game ends when player loses all dice
- [ ] **GAUN-08**: Player can immediately restart after game over

### Duel Transition Screen

- [ ] **TRAN-01**: Victory splash shows defeated opponent after winning a duel
- [ ] **TRAN-02**: Round number announcement displays ("ROUND 3", "ROUND 4", etc.)
- [ ] **TRAN-03**: Next opponent introduction with name and personality flair
- [ ] **TRAN-04**: Animated transition sequence (Tekken/boxing style fight card)

### Leaderboard

- [ ] **LEAD-01**: Global leaderboard stored in Cloudflare D1
- [ ] **LEAD-02**: Player submits score with nickname (30 chars, alphanumeric)
- [ ] **LEAD-03**: Leaderboard displays top 100 scores with nicknames
- [ ] **LEAD-04**: Player sees personal best score tracking
- [ ] **LEAD-05**: Score fraud limits reject impossible scores
- [ ] **LEAD-06**: "Near you" section shows scores immediately above/below player's rank
- [ ] **LEAD-07**: Daily leaderboard resets at midnight UTC with countdown timer

### Achievements

- [ ] **ACHI-01**: Streak milestone achievements at 5, 10, 25, 50, 100 opponents defeated
- [ ] **ACHI-02**: Achievement toast notification on unlock
- [ ] **ACHI-03**: Achievements persist in localStorage
- [ ] **ACHI-04**: Progress indicators show "X/Y to next achievement" during run
- [ ] **ACHI-05**: Hidden challenge achievements (e.g., "Win duel with only 1 die remaining")

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Polish

- **POLI-01**: Achievement gallery to browse all achievements
- **POLI-02**: Opponent personality reveal before each duel
- **POLI-03**: Difficulty tier badges (Bronze/Silver/Gold zones)
- **POLI-04**: "Personal best" notification when passing previous best mid-run

### Social

- **SOCL-01**: Shareable achievement unlocks
- **SOCL-02**: Weekly leaderboard in addition to daily
- **SOCL-03**: Recent scores feed showing live submissions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Healing/power-ups | Undermines core tension mechanic (dice carry-over) |
| Custom difficulty | Invalidates leaderboard comparability |
| User accounts | Friction; nickname + localStorage sufficient for v1 |
| Multiplayer gauntlet | Complexity; single-player focus for v3.0 |
| Unlockable characters | Scope creep; all AI personalities available from start |
| Pause mid-duel | Reduces flow state; browser handles "pause" naturally |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAUN-01 | Phase 20 | Pending |
| GAUN-02 | Phase 20 | Pending |
| GAUN-03 | Phase 20 | Pending |
| GAUN-04 | Phase 20 | Pending |
| GAUN-05 | Phase 20 | Pending |
| GAUN-06 | Phase 20 | Pending |
| GAUN-07 | Phase 20 | Pending |
| GAUN-08 | Phase 20 | Pending |
| TRAN-01 | Phase 20 | Pending |
| TRAN-02 | Phase 20 | Pending |
| TRAN-03 | Phase 20 | Pending |
| TRAN-04 | Phase 20 | Pending |
| LEAD-01 | Phase 21 | Pending |
| LEAD-02 | Phase 21 | Pending |
| LEAD-03 | Phase 21 | Pending |
| LEAD-04 | Phase 21 | Pending |
| LEAD-05 | Phase 21 | Pending |
| LEAD-06 | Phase 21 | Pending |
| LEAD-07 | Phase 21 | Pending |
| ACHI-01 | Phase 22 | Pending |
| ACHI-02 | Phase 22 | Pending |
| ACHI-03 | Phase 22 | Pending |
| ACHI-04 | Phase 22 | Pending |
| ACHI-05 | Phase 22 | Pending |

**Coverage:**
- v3.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-21 after roadmap creation*
