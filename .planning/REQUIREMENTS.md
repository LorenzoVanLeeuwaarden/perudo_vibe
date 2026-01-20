# Requirements: Perudo Vibe v2.2

**Defined:** 2026-01-20
**Core Value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction

## v2.2 Requirements

Requirements for UI Unification & Tech Debt milestone. Each maps to roadmap phases.

### End Game Unification

- [ ] **END-01**: Single-player shows stats page after Victory/Defeat celebration
- [ ] **END-02**: Multiplayer shows Victory/Defeat celebration before stats page
- [ ] **END-03**: Stats page works identically in both modes (same component)
- [ ] **END-04**: Single-player tracks game stats (bids, dudo/calza accuracy, dice lost/gained)

### Game UI Unification

- [x] **GAME-01**: Single-player game UI styling applied to multiplayer GameBoard
- [x] **GAME-02**: Consistent PlayerDiceBadge styling across both modes
- [x] **GAME-03**: Consistent BidUI styling across both modes
- [x] **GAME-04**: Consistent RevealPhase styling across both modes

### Lobby Unification

- [x] **LOBBY-01**: Shared layout/styling foundation for both lobby types
- [x] **LOBBY-02**: Single-player lobby uses unified styling
- [x] **LOBBY-03**: Multiplayer lobby uses unified styling (with mode-specific features)

### Shared Hooks

- [x] **HOOKS-01**: Create shared useIsFirefox hook in /src/hooks/
- [x] **HOOKS-02**: DudoOverlay uses shared useIsFirefox hook
- [x] **HOOKS-03**: ShaderBackground uses shared useIsFirefox hook
- [x] **HOOKS-04**: DiceRoller3D uses shared useIsFirefox hook (satisfied by deletion — unused component)
- [x] **HOOKS-05**: All animation components use shared useReducedMotion hook

### Tooling

- [ ] **TOOL-01**: npm run lint / next lint works without directory error

## Future Requirements

Deferred to future milestones.

### Sound Effects

- **SND-01**: Replace placeholder victory.mp3 with real audio
- **SND-02**: Replace placeholder pop.mp3 with real audio
- **SND-03**: Replace placeholder dice-rattle.mp3 with real audio

### Accessibility

- **A11Y-01**: Colorblind-friendly dice faces
- **A11Y-02**: Screen reader support for game actions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Emotes in single-player | No one to communicate with; AI doesn't react |
| Turn timer in single-player | AI responds instantly; no need for timeout |
| Kick functionality in single-player | AI can't be kicked |
| Full component rewrite | Unification, not redesign; preserve working code |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOOKS-01 | Phase 16 | Complete |
| HOOKS-02 | Phase 16 | Complete |
| HOOKS-03 | Phase 16 | Complete |
| HOOKS-04 | Phase 16 | Complete |
| HOOKS-05 | Phase 16 | Complete |
| GAME-01 | Phase 17 | Complete |
| GAME-02 | Phase 17 | Complete |
| GAME-03 | Phase 17 | Complete |
| GAME-04 | Phase 17 | Complete |
| LOBBY-01 | Phase 18 | Complete |
| LOBBY-02 | Phase 18 | Complete |
| LOBBY-03 | Phase 18 | Complete |
| END-01 | Phase 19 | Pending |
| END-02 | Phase 19 | Pending |
| END-03 | Phase 19 | Pending |
| END-04 | Phase 19 | Pending |
| TOOL-01 | Phase 19 | Pending |

**Coverage:**
- v2.2 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after Phase 18 completion*
