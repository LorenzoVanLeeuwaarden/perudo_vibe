# Requirements: Perudo Vibe v3.1 Tutorial

**Defined:** 2026-01-21
**Core Value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction

## v3.1 Requirements

Requirements for tutorial mode. Each maps to roadmap phases.

### Tutorial Flow

- [x] **FLOW-01**: User can access tutorial from main menu ("How to Play" button)
- [ ] **FLOW-02**: User can skip tutorial at any point via visible skip button
- [ ] **FLOW-03**: User sees progress indicator showing current step and total steps
- [ ] **FLOW-04**: User can exit tutorial mid-way and return to main menu
- [ ] **FLOW-05**: User sees celebration on tutorial completion (confetti/toast)
- [ ] **FLOW-06**: Tutorial completion state persists (don't auto-prompt on return)

### Tutorial Gameplay

- [x] **GAME-01**: Tutorial runs as scripted 3-player game (user + 2 AI)
- [x] **GAME-02**: Dice rolls are predetermined to create specific teaching moments
- [ ] **GAME-03**: User makes every move but choices are constrained to intended action
- [ ] **GAME-04**: Constrained moves show explanation of why other options are disabled
- [x] **GAME-05**: Tutorial is a safe environment with no real game penalties

### Tutorial Content

- [ ] **CONT-01**: Tutorial teaches basic bidding (what a bid is, how to make one)
- [ ] **CONT-02**: Tutorial teaches calling Dudo (when and how to challenge)
- [ ] **CONT-03**: Tutorial teaches wild ones (ones count as any value)
- [ ] **CONT-04**: Tutorial teaches Calza as optional advanced concept

### Visual Guidance

- [ ] **VIS-01**: Inline tooltips appear with 1-2 sentence explanations
- [ ] **VIS-02**: Visual cues (highlights, arrows) point to interactive elements
- [ ] **VIS-03**: Relevant dice animate (pulse/glow) during explanations
- [x] **VIS-04**: Tutorial reuses actual game components (BidUI, Dice, etc.)

## Future Requirements

Deferred to potential v3.2 or later.

### Enhanced Tutorial

- **ETUT-01**: AI "thought bubbles" showing reasoning during their turns
- **ETUT-02**: Branching paths when user makes mistakes (explain, then retry)
- **ETUT-03**: Probability hints ("With 15 dice, expect 2-3 of any face")
- **ETUT-04**: Speed controls (fast-forward for impatient users)
- **ETUT-05**: Practice mode after tutorial (low-stakes games with gentle AI)

## Out of Scope

Explicitly excluded from this milestone.

| Feature | Reason |
|---------|--------|
| Palifico rules | Advanced mechanic, can be discovered organically in gameplay |
| Video tutorials | Text + interaction sufficient for dice game complexity |
| Voice narration | Adds accessibility complexity, defer to future |
| Multi-language support | English-only for v3.1 |
| Tutorial for multiplayer-specific features | Single-player rules apply to multiplayer |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FLOW-01 | Phase 23 | Complete |
| FLOW-02 | Phase 25 | Pending |
| FLOW-03 | Phase 25 | Pending |
| FLOW-04 | Phase 25 | Pending |
| FLOW-05 | Phase 25 | Pending |
| FLOW-06 | Phase 25 | Pending |
| GAME-01 | Phase 23 | Complete |
| GAME-02 | Phase 23 | Complete |
| GAME-03 | Phase 24 | Pending |
| GAME-04 | Phase 24 | Pending |
| GAME-05 | Phase 23 | Complete |
| CONT-01 | Phase 25 | Pending |
| CONT-02 | Phase 25 | Pending |
| CONT-03 | Phase 25 | Pending |
| CONT-04 | Phase 25 | Pending |
| VIS-01 | Phase 24 | Pending |
| VIS-02 | Phase 24 | Pending |
| VIS-03 | Phase 24 | Pending |
| VIS-04 | Phase 23 | Complete |

**Coverage:**
- v3.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-22 after Phase 23 complete*
