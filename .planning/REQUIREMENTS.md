# Requirements: Perudo Vibe v2.1

**Defined:** 2026-01-20
**Core Value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction — just share a link and play.

## v2.1 Requirements

Requirements for animation performance optimization. Each maps to roadmap phases.

### DudoOverlay Optimization

- [ ] **DUDO-01**: Backdrop blur is static (not animated), with opacity fade-in
- [ ] **DUDO-02**: Text glow effect uses pseudo-element technique (no animated text-shadow)
- [ ] **DUDO-03**: SVG glitch filter replaced with CSS-only alternative or removed
- [ ] **DUDO-04**: Particle count reduced and uses only transform/opacity

### Victory/Defeat Screen Optimization

- [ ] **VICT-01**: VictoryScreen animations audited and optimized for 60fps
- [ ] **VICT-02**: DefeatScreen animations audited and optimized for 60fps

### Other Component Optimization

- [ ] **COMP-01**: RevealPhase dice animations audited for expensive properties
- [ ] **COMP-02**: Any identified expensive animations fixed across codebase

### Accessibility

- [ ] **A11Y-01**: prefers-reduced-motion respected - simplified animations when enabled

### Verification

- [ ] **VERF-01**: DudoOverlay runs at 60fps on Firefox
- [ ] **VERF-02**: DudoOverlay runs at 60fps on Chrome
- [ ] **VERF-03**: Users can see complete Dudo/Calza animation before transition

## Out of Scope

| Feature | Reason |
|---------|--------|
| Firefox-specific detection/fallbacks | Test first - may not be needed after fixes |
| Canvas-based particle system | DOM-based with reduced count should suffice |
| Bundle size optimization (LazyMotion) | Performance focus, not bundle size |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DUDO-01 | Phase 13 | Pending |
| DUDO-02 | Phase 13 | Pending |
| DUDO-03 | Phase 13 | Pending |
| DUDO-04 | Phase 13 | Pending |
| VICT-01 | Phase 14 | Pending |
| VICT-02 | Phase 14 | Pending |
| COMP-01 | Phase 14 | Pending |
| COMP-02 | Phase 14 | Pending |
| A11Y-01 | Phase 14 | Pending |
| VERF-01 | Phase 15 | Pending |
| VERF-02 | Phase 15 | Pending |
| VERF-03 | Phase 15 | Pending |

**Coverage:**
- v2.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after initial definition*
