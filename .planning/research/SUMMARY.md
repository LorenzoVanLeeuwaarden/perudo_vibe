# Research Summary: Animation Performance

**Project:** Perudo Vibe v2.1
**Researched:** 2026-01-20
**Confidence:** HIGH

## Executive Summary

The Dudo/Calza overlay is slow because it combines four expensive operations simultaneously:

1. **Animated `backdrop-filter: blur()`** — Firefox performance killer (documented bugs 1718471, 1798592)
2. **SVG filter for glitch effect** — Not GPU-accelerated in any browser
3. **Animated `text-shadow` with multiple layers** — Triggers paint every frame
4. **8 simultaneous particle animations** — At compositor threshold

The fix is straightforward: **only animate `transform` and `opacity`**. Everything else triggers expensive layout or paint operations.

## Key Findings

### Root Cause: Wrong Properties Animated

| Current | Problem | Fix |
|---------|---------|-----|
| `backdropFilter: 'blur(0px)' → 'blur(8px)'` | Renders ALL background content every frame | Static blur, animate opacity only |
| `textShadow: [glow1, glow2, glow3]` | Paint operation every frame | Pseudo-element with static shadow, animate opacity |
| `filter: url(#glitch)` with SVG feColorMatrix | Not GPU-accelerated | CSS-only RGB split or remove |
| 8 `motion.div` particles | Too many compositor layers | Reduce to 4-6, single SVG, or CSS @keyframes |

### GPU-Accelerated Properties (Safe)

Only these properties run on the compositor thread:
- `transform` (translate, scale, rotate)
- `opacity`

Everything else triggers layout or paint.

### Firefox-Specific Issues

| Issue | Status |
|-------|--------|
| backdrop-filter blur laggy | Partially fixed in Firefox 103+, still problematic |
| SVG filter animation slow | Known issue, 8-12 FPS at 1080p |
| blur + transform combination | Specific Firefox bug |

## Recommended Approach

### Phase 1: Profile & Audit
- Measure baseline FPS in Firefox and Chrome
- Identify all animated properties in DudoOverlay
- Document current frame times

### Phase 2: Fix DudoOverlay (Critical)
1. **backdrop-filter** → Static blur with opacity fade-in
2. **text-shadow animation** → Pseudo-element technique
3. **SVG glitch filter** → CSS-only alternative or remove
4. **Particles** → Reduce count, ensure transform/opacity only

### Phase 3: Apply to Other Components
- RevealPhase dice animations
- Any other components using expensive properties

### Phase 4: Browser-Specific Fallbacks
- Detect Firefox, reduce effects if still slow
- Implement `prefers-reduced-motion` support

## Anti-Patterns to Avoid

| Never Animate | Why | Use Instead |
|---------------|-----|-------------|
| `width`, `height` | Triggers layout | `transform: scale()` |
| `top`, `left` | Triggers layout | `transform: translate()` |
| `backdrop-filter` values | Very expensive | Static value, animate opacity |
| `text-shadow` values | Triggers paint | Pseudo-element with opacity |
| `box-shadow` values | Triggers paint | Pseudo-element with opacity |
| SVG `<filter>` | Not GPU-accelerated | CSS filters or remove |

## Profiling Tools

- **Chrome:** Performance panel + Paint flashing + Layer borders
- **Firefox:** Firefox Profiler (profiler.firefox.com)
- **Frame budget:** 16.67ms per frame (60fps), browser needs ~6ms, leaving ~10ms for animation

## Confidence Assessment

| Area | Confidence |
|------|------------|
| Root cause identification | HIGH |
| Fix strategies | HIGH |
| Firefox-specific issues | HIGH (Mozilla bug tracker) |
| Framer Motion patterns | HIGH (official docs) |

## Sources

- [MDN Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
- [Motion.dev Performance Guide](https://motion.dev/docs/performance)
- [Firefox Bug 1718471](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471) - backdrop-filter blur laggy
- [Firefox Bug 1798592](https://bugzilla.mozilla.org/show_bug.cgi?id=1798592) - Slow backdrop-filter
- [web.dev Animations Guide](https://web.dev/articles/animations-guide)
- [Tobias Ahlin: Animate box-shadow](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)

---
*Research completed: 2026-01-20*
*Ready for requirements: yes*
