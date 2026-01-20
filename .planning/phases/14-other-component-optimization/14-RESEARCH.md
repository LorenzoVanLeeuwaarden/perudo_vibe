# Phase 14: Other Component Optimization - Research

**Researched:** 2026-01-20
**Domain:** CSS Animation Performance / GPU Acceleration / Accessibility
**Confidence:** HIGH

## Summary

Phase 14 extends the optimization patterns established in Phase 13 (DudoOverlay) to VictoryScreen, DefeatScreen, and RevealPhase components. Analysis of these components reveals several categories of expensive animations that need attention:

1. **Animated text-shadow:** Both VictoryScreen (line 346) and DefeatScreen (line 268) animate text-shadow, but already have Firefox guards in place
2. **Animated filter/drop-shadow:** DefeatScreen (line 201) and page.tsx (line 1672) animate filter properties
3. **Animated background/gradients:** VictoryScreen (line 198) and DefeatScreen (line 110) animate background gradients
4. **Particle systems:** VictoryScreen and DefeatScreen have particle systems but already skip them on Firefox
5. **No prefers-reduced-motion support:** Zero usage of prefers-reduced-motion anywhere in the codebase

The good news: Much of the Firefox-specific optimization work is already done from earlier performance passes. The focus for Phase 14 should be:
- Add prefers-reduced-motion support (A11Y-01 requirement)
- Convert remaining animated text-shadow to pseudo-element technique (or verify Firefox guards are sufficient)
- Review animated filter properties and optimize if needed
- Audit CasinoLogo component which has animated textShadow without Firefox guard

**Primary recommendation:** Create a `useReducedMotion()` hook and apply it consistently across all animated components, providing simplified animations for users who prefer reduced motion.

## Standard Stack

No new libraries needed. Use existing Framer Motion and CSS capabilities.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | existing | React animation | Already in project, handles GPU-only animations well |
| CSS Media Query | - | prefers-reduced-motion | Native browser support, no library needed |

### Supporting
No additional libraries needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS media query | framer-motion `useReducedMotion` | Framer Motion has built-in hook but CSS is more universal |
| Manual Firefox detection | @supports query | @supports doesn't detect browser, user-agent is more reliable |

**Installation:**
No new packages required.

## Architecture Patterns

### Pattern 1: useReducedMotion Hook

**What:** Custom hook that detects user's prefers-reduced-motion preference
**When to use:** Any component with animations
**Why:** Provides consistent API for checking motion preference, memoized for performance

```typescript
// Source: MDN prefers-reduced-motion + React best practices

import { useState, useEffect, useMemo } from 'react';

export function useReducedMotion(): boolean {
  // Use useMemo for SSR-safe initial value (false on server, actual on client)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

### Pattern 2: Combining Firefox + Reduced Motion

**What:** Components check both Firefox AND reduced motion preference
**When to use:** Components that have complex animations
**Why:** Firefox users get simplified animations for performance; reduced-motion users get simplified animations for accessibility

```typescript
// Source: Phase 13 patterns + A11Y requirements

function AnimatedComponent() {
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();

  // Simplify animations if EITHER condition is true
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  return (
    <motion.div
      animate={useSimplifiedAnimations
        ? { opacity: 1 }  // Simple fade
        : { opacity: 1, scale: [0.9, 1.1, 1] }  // Full animation
      }
    />
  );
}
```

### Pattern 3: Reduced Motion Text Glow (VictoryScreen/DefeatScreen)

**What:** Replace animated text-shadow with pseudo-element opacity animation OR static glow when reduced motion
**When to use:** Victory/Defeat title text with pulsing glow
**Why:** Pulsing effects can trigger vestibular issues; static glow maintains visual impact without motion

```typescript
// Source: Phase 13 research + A11Y guidelines

// For users who prefer reduced motion: NO pulsing, just static glow
const shouldAnimate = !isFirefox && !prefersReducedMotion;

<motion.h1
  style={{
    color: '#ffd700',
    textShadow: '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',  // Static base
  }}
  animate={shouldAnimate ? {
    textShadow: [
      '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',
      '0 0 40px #ffd700, 0 0 60px #ffd700, 0 4px 0 #b8860b',
      '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',
    ],
  } : {}}
  transition={shouldAnimate ? { duration: 2, repeat: Infinity } : undefined}
>
  Victory!
</motion.h1>
```

### Pattern 4: Simplified Particle Systems

**What:** Skip particle systems entirely OR reduce count significantly for reduced motion
**When to use:** Fireworks, confetti, embers, sparks
**Why:** Rapid particle movement is a common vestibular trigger

```typescript
// Source: Current codebase patterns + A11Y requirements

// Skip particles for reduced motion AND Firefox
const skipParticles = isFirefox || prefersReducedMotion;

useEffect(() => {
  if (skipParticles) return;  // No particles for simplified mode

  // Regular particle logic
  const interval = setInterval(createParticle, 50);
  return () => clearInterval(interval);
}, [skipParticles]);
```

### Anti-Patterns to Avoid

- **Animated text-shadow without guard:** Always check Firefox AND reduced motion
- **Animated filter/drop-shadow without guard:** Same as text-shadow
- **Animated background gradients:** These are expensive; consider static gradients with opacity fade
- **Ignoring reduced motion for "important" animations:** ALL animations should respect reduced motion
- **Different logic paths for Firefox vs reduced motion:** Combine into single `useSimplifiedAnimations` for consistency

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Motion preference detection | Custom window.matchMedia wrapper | `useReducedMotion` hook (create once) | Consistency, SSR handling |
| Glow pulsing effect | Animated text-shadow | Pseudo-element opacity OR static for reduced motion | GPU acceleration + accessibility |
| Firefox detection | Custom regex each component | Shared `useIsFirefox` hook (already exists) | Already established pattern |

**Key insight:** Phase 13 established the Firefox optimization patterns. Phase 14 adds reduced motion support using the same conditional logic patterns.

## Common Pitfalls

### Pitfall 1: Not Respecting prefers-reduced-motion

**What goes wrong:** Users with vestibular disorders experience discomfort
**Why it happens:** Developers don't test with reduced motion enabled
**How to avoid:** Add `useReducedMotion` hook, test with "Reduce motion" system setting
**Warning signs:** No `prefers-reduced-motion` checks in codebase (current state)

### Pitfall 2: Animated filter/drop-shadow on Every Frame

**What goes wrong:** Frame drops, especially on lower-end devices
**Why it happens:** filter animations are not GPU-accelerated
**How to avoid:** Use static filter, animate opacity of container instead
**Warning signs:** `animate={{ filter: [...] }}` patterns in code

### Pitfall 3: Animated Background Gradients

**What goes wrong:** Performance issues, especially on mobile
**Why it happens:** Background gradient changes require full repaint
**How to avoid:** Use multiple layers with static gradients, animate opacity to cross-fade
**Warning signs:** `animate={{ background: [...] }}` patterns (found in VictoryScreen, DefeatScreen)

### Pitfall 4: Forgetting to Combine Firefox + Reduced Motion

**What goes wrong:** Inconsistent behavior - Firefox optimized but not accessible
**Why it happens:** Two separate concerns, easy to miss one
**How to avoid:** Single `useSimplifiedAnimations = isFirefox || prefersReducedMotion`
**Warning signs:** Components with isFirefox checks but no prefersReducedMotion

### Pitfall 5: CasinoLogo Animated textShadow

**What goes wrong:** Frame drops on title screen, especially problematic since it's first thing user sees
**Why it happens:** Letters have individual animated textShadow (line 130-134), no Firefox/reduced motion guard
**How to avoid:** Apply same pattern as VictoryScreen/DefeatScreen
**Warning signs:** Current code has animated textShadow without guards

## Code Examples

### Example 1: useReducedMotion Hook

```typescript
// Source: Standard React pattern + MDN prefers-reduced-motion
// File: src/hooks/useReducedMotion.ts

'use client';

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

### Example 2: VictoryScreen Simplified Animations

```typescript
// Source: Current VictoryScreen.tsx + Phase 13 patterns

const isFirefox = useIsFirefox();
const prefersReducedMotion = useReducedMotion();
const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

// Skip particles entirely
useEffect(() => {
  if (useSimplifiedAnimations) return;
  // ... particle creation logic
}, [useSimplifiedAnimations]);

// Animated background - static for simplified mode
<motion.div
  className="absolute inset-0"
  style={useSimplifiedAnimations ? {
    background: `radial-gradient(circle at 50% 50%, ${colorConfig.glow} 0%, transparent 50%)`,
  } : undefined}
  animate={useSimplifiedAnimations ? {} : {
    background: [
      `radial-gradient(circle at 30% 30%, ${colorConfig.glow} 0%, transparent 50%)`,
      // ... rest of gradient animation
    ],
  }}
/>

// Text glow - static for simplified mode
<motion.h1
  style={{
    color: '#ffd700',
    textShadow: '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',
  }}
  animate={useSimplifiedAnimations ? {} : {
    textShadow: [/* animation values */],
  }}
/>
```

### Example 3: DefeatScreen Filter Animation Fix

```typescript
// Source: Current DefeatScreen.tsx line 199-209

// BEFORE: Only Firefox check
animate={isFirefox ? { scale: [1, 1.05, 1] } : {
  scale: [1, 1.05, 1],
  filter: [
    'drop-shadow(0 0 20px #ff3366)',
    'drop-shadow(0 0 40px #ff3366)',
    'drop-shadow(0 0 20px #ff3366)',
  ],
}}

// AFTER: Combined check
const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

animate={useSimplifiedAnimations
  ? { scale: [1, 1.02, 1] }  // Gentler scale, no filter animation
  : {
      scale: [1, 1.05, 1],
      filter: [
        'drop-shadow(0 0 20px #ff3366)',
        'drop-shadow(0 0 40px #ff3366)',
        'drop-shadow(0 0 20px #ff3366)',
      ],
    }
}
style={useSimplifiedAnimations ? { filter: 'drop-shadow(0 0 20px #ff3366)' } : {}}
```

### Example 4: CasinoLogo textShadow Fix

```typescript
// Source: Current CasinoLogo.tsx lines 124-145

// BEFORE: No guards on animated textShadow
{'FAROLEO'.split('').map((letter, i) => (
  <motion.span
    animate={{
      y: [0, -4, 0],
      textShadow: [
        `0 0 10px ${colorConfig.glow}...`,
        `0 0 20px ${colorConfig.glow}...`,
        `0 0 10px ${colorConfig.glow}...`,
      ],
    }}
  />
))}

// AFTER: Add guards
const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

{'FAROLEO'.split('').map((letter, i) => (
  <motion.span
    style={{
      textShadow: `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}, 0 4px 0 ${colorConfig.shadow}`,
    }}
    animate={useSimplifiedAnimations
      ? { y: [0, -2, 0] }  // Gentler bounce only
      : {
          y: [0, -4, 0],
          textShadow: [/* animation values */],
        }
    }
  />
))}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ignore reduced motion | Respect prefers-reduced-motion | 2020+ (WCAG 2.1 adoption) | Required for accessibility compliance |
| Animate text-shadow freely | Avoid or use pseudo-elements | 2016+ (GPU acceleration mainstream) | 60fps achievable |
| Per-component Firefox checks | Shared useIsFirefox hook | Phase 13 (current project) | Consistency, maintainability |

**Current codebase status:**
- Firefox optimizations: Partially done (VictoryScreen, DefeatScreen, RevealPhase have guards)
- Reduced motion: NOT implemented (zero usage)
- CasinoLogo: NO guards on animated textShadow

## Component Audit Summary

### VictoryScreen.tsx
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 198-206 | Animated background gradient | Has no Firefox guard | Add useSimplifiedAnimations |
| 346-351 | Animated textShadow | Has Firefox guard | Add reduced motion check |
| 111-133 | Particle fireworks | Has Firefox guard | Add reduced motion check |
| 136-144 | Particle confetti | Has Firefox guard | Add reduced motion check |
| 219-223 | SVG filter blur | Only on particles (already guarded) | OK |

### DefeatScreen.tsx
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 109-116 | Animated background gradient | Has Firefox guard | Add reduced motion check |
| 199-206 | Animated filter (drop-shadow) | Has Firefox guard | Add reduced motion check |
| 267-274 | Animated textShadow | Has Firefox guard | Add reduced motion check |
| 39-58 | Ember particles | Has Firefox guard | Add reduced motion check |

### RevealPhase.tsx
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 113-117 | Static backdropFilter | Properly static | OK - already optimal |
| 199-209 | Glow effect with filter blur | Has Firefox guard | Add reduced motion check |

### CasinoLogo.tsx
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 130-134 | Animated textShadow per letter | NO guards | Add useSimplifiedAnimations |
| 52-54 | Animated scale/opacity dots | No guards (minor) | Consider adding guards |

### DyingDie.tsx
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 84-87 | Animated filter (saturation/sepia) | No guards | Add useSimplifiedAnimations |

### page.tsx (main game)
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 1672-1676 | Animated filter (drop-shadow) | No guards | Add useSimplifiedAnimations |

### DiceCup.tsx
| Line(s) | Issue | Status | Fix Required |
|---------|-------|--------|--------------|
| 318-322 | Animated boxShadow | No guards but brief (waiting state only) | Consider adding guards |

## Open Questions

None significant. Requirements are clear:
1. Add useReducedMotion hook
2. Apply to all components with animations
3. Ensure no animated backdrop-filter, text-shadow, or SVG filters remain unguarded

## Sources

### Primary (HIGH confidence)
- Phase 13 Research & Implementation - `.planning/phases/13-dudooverlay-optimization/`
- MDN prefers-reduced-motion - https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- web.dev animations guide - https://web.dev/articles/animations-guide
- WCAG 2.1 Success Criterion 2.3.3 - Animation from Interactions

### Secondary (MEDIUM confidence)
- Current codebase analysis (VictoryScreen, DefeatScreen, RevealPhase, etc.)
- Phase 13 patterns (useIsFirefox, Firefox simplified mode)

### Tertiary (LOW confidence)
- None - all findings verified against codebase and official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, patterns from Phase 13
- Architecture patterns: HIGH - Direct extension of Phase 13, MDN-documented
- Pitfalls: HIGH - Identified via codebase grep, verified patterns
- Code examples: HIGH - Based on current codebase + Phase 13 research

**Research date:** 2026-01-20
**Valid until:** 2026-04-20 (3 months - accessibility patterns are stable)

---

## Appendix: Expensive Animation Properties Found

```bash
# Animated textShadow (needs guard):
src/components/CasinoLogo.tsx:130-134      # No guard
src/components/DefeatScreen.tsx:268-272    # Has Firefox guard
src/components/VictoryScreen.tsx:346-350   # Has Firefox guard

# Animated filter (needs guard):
src/components/DefeatScreen.tsx:201-204    # Has Firefox guard
src/components/DyingDie.tsx:84-87          # No guard
src/app/page.tsx:1672-1676                 # No guard

# Animated background/gradient (expensive):
src/components/VictoryScreen.tsx:198-206   # No guard
src/components/DefeatScreen.tsx:110-114    # Has Firefox guard

# Animated boxShadow (minor concern):
src/components/DiceCup.tsx:318-322         # No guard (waiting state only)

# SVG with animated blur (already guarded via Firefox check):
src/components/VictoryScreen.tsx:219-223   # Inside isFirefox guard

# prefers-reduced-motion usage:
NONE FOUND - This is the main gap to address
```
