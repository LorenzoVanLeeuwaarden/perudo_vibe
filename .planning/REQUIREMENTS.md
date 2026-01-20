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

- [ ] **GAME-01**: Single-player game UI styling applied to multiplayer GameBoard
- [ ] **GAME-02**: Consistent PlayerDiceBadge styling across both modes
- [ ] **GAME-03**: Consistent BidUI styling across both modes
- [ ] **GAME-04**: Consistent RevealPhase styling across both modes

### Lobby Unification

- [ ] **LOBBY-01**: Shared layout/styling foundation for both lobby types
- [ ] **LOBBY-02**: Single-player lobby uses unified styling
- [ ] **LOBBY-03**: Multiplayer lobby uses unified styling (with mode-specific features)

### Shared Hooks

- [ ] **HOOKS-01**: Create shared useIsFirefox hook in /src/hooks/
- [ ] **HOOKS-02**: DudoOverlay uses shared useIsFirefox hook
- [ ] **HOOKS-03**: ShaderBackground uses shared useIsFirefox hook
- [ ] **HOOKS-04**: DiceRoller3D uses shared useIsFirefox hook
- [ ] **HOOKS-05**: All animation components use shared useReducedMotion hook

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

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| END-01 | TBD | Pending |
| END-02 | TBD | Pending |
| END-03 | TBD | Pending |
| END-04 | TBD | Pending |
| GAME-01 | TBD | Pending |
| GAME-02 | TBD | Pending |
| GAME-03 | TBD | Pending |
| GAME-04 | TBD | Pending |
| LOBBY-01 | TBD | Pending |
| LOBBY-02 | TBD | Pending |
| LOBBY-03 | TBD | Pending |
| HOOKS-01 | TBD | Pending |
| HOOKS-02 | TBD | Pending |
| HOOKS-03 | TBD | Pending |
| HOOKS-04 | TBD | Pending |
| HOOKS-05 | TBD | Pending |
| TOOL-01 | TBD | Pending |

**Coverage:**
- v2.2 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17 (roadmap pending)

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after initial definition*
