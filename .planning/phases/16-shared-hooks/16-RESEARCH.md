# Phase 16: Shared Hooks - Research

**Researched:** 2026-01-20
**Domain:** React hooks, browser detection, accessibility, animation optimization
**Confidence:** HIGH

## Summary

Phase 16 consolidates duplicated Firefox detection logic from three components (DudoOverlay, ShaderBackground, DiceRoller3D) into the existing shared `useIsFirefox` hook in `/src/hooks/`. The shared hooks (`useIsFirefox` and `useReducedMotion`) already exist and are used by 7 other components. This phase is purely a refactoring task - no new hooks need to be created.

The codebase currently has:
- **Shared hooks:** `useIsFirefox.ts` and `useReducedMotion.ts` in `/src/hooks/`
- **Components using shared hooks:** VictoryScreen, DefeatScreen, RevealPhase, CasinoLogo, DyingDie, DiceCup, page.tsx (7 files)
- **Components with duplicate Firefox logic:** DudoOverlay, ShaderBackground, DiceRoller3D (3 files)

**Primary recommendation:** Migrate the three components with local Firefox detection to use the shared `useIsFirefox` hook, and add `useReducedMotion` support to complete the accessibility pattern.

## Current State Analysis

### Existing Shared Hooks

| File | Purpose | Implementation | Status |
|------|---------|----------------|--------|
| `/src/hooks/useIsFirefox.ts` | Firefox browser detection | `useMemo` + navigator check, SSR-safe | PRODUCTION READY |
| `/src/hooks/useReducedMotion.ts` | prefers-reduced-motion detection | `useState` + `useEffect` + matchMedia listener, SSR-safe | PRODUCTION READY |

### Duplicate Firefox Detection Locations

| Component | Lines | Implementation | Pattern |
|-----------|-------|----------------|---------|
| `DudoOverlay.tsx` | 16-21 | Local `useIsFirefox()` function with `useMemo` | Identical to shared hook |
| `ShaderBackground.tsx` | 8, 11-15 | `useState` + `useEffect` for hydration safety | Different pattern (hydration-safe) |
| `DiceRoller3D.tsx` | 8-13 | Local `useIsFirefox()` function with `useMemo` | Identical to shared hook |

### Current Hook Implementations

**Shared `useIsFirefox` (HIGH confidence - source verified):**
```typescript
'use client';
import { useMemo } from 'react';

export function useIsFirefox(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);
}
```

**Shared `useReducedMotion` (HIGH confidence - source verified):**
```typescript
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

## Architecture Patterns

### Established `useSimplifiedAnimations` Pattern

All 7 components currently using shared hooks follow this pattern:

```typescript
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function Component() {
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Use useSimplifiedAnimations for conditional animation logic
  return (
    <motion.div
      style={useSimplifiedAnimations ? staticStyles : {}}
      animate={useSimplifiedAnimations ? {} : expensiveAnimation}
    />
  );
}
```

### Component-Specific Migration Patterns

**DudoOverlay.tsx:**
- Currently uses `isFirefox` for: backdrop blur, glitch effects, particle count, glow layers
- Migration: Replace local hook with import, add `useReducedMotion`, combine into `useSimplifiedAnimations`

**ShaderBackground.tsx:**
- Currently uses `isFirefox` for: skipping canvas animation entirely, returning static CSS fallback
- **Special case:** Uses `useState` + `useEffect` pattern for hydration safety
- Migration: The shared `useIsFirefox` uses `useMemo` which should also be hydration-safe (returns `false` during SSR)
- Add `useReducedMotion` to also skip animations for users with reduced motion preference

**DiceRoller3D.tsx:**
- Currently uses `isFirefox` for: skipping rAF loop, simpler 2D animations, no preserve-3d
- Migration: Replace local hook with import, add `useReducedMotion`, combine into `useSimplifiedAnimations`

## Technical Considerations

### SSR/Hydration Safety (HIGH confidence)

Both shared hooks are SSR-safe:

| Hook | SSR Behavior | Hydration Behavior |
|------|--------------|-------------------|
| `useIsFirefox` | Returns `false` (navigator undefined) | Returns actual value on client |
| `useReducedMotion` | Returns `false` (initial useState) | Updates after useEffect runs |

**Risk:** ShaderBackground uses `useState(false)` + `useEffect` explicitly for hydration, but the shared `useIsFirefox` hook with `useMemo` behaves identically - returns `false` initially, then correct value.

**Verification needed:** Confirm ShaderBackground doesn't flash canvas before switching to CSS fallback on Firefox.

### Framer Motion's Built-in Hook

Framer Motion provides `useReducedMotion` from `motion/react` (or `framer-motion`). However:

| Aspect | Custom Hook | Framer Motion Hook |
|--------|-------------|-------------------|
| Bundle size | ~0.5KB | ~1KB (tree-shakes if only hook used) |
| Reactive updates | Yes (listener) | Yes |
| Already in codebase | Yes | No |

**Recommendation:** Keep using custom hook - it's already implemented, tested, and has no additional dependencies.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Firefox detection | Inline `navigator.userAgent` checks | `useIsFirefox` from `/src/hooks/` | Single source of truth, SSR-safe |
| Reduced motion detection | Inline `matchMedia` calls | `useReducedMotion` from `/src/hooks/` | Handles listener cleanup, reactive updates |
| Combined animation guard | Separate checks in each component | `useSimplifiedAnimations = isFirefox \|\| prefersReducedMotion` pattern | Consistent approach, easier maintenance |

## Common Pitfalls

### Pitfall 1: Hydration Mismatch

**What goes wrong:** Server renders with `isFirefox=false`, client detects Firefox and re-renders
**Why it happens:** Browser APIs unavailable during SSR
**How to avoid:** Both hooks already return `false` during SSR, matching initial client render
**Warning signs:** React hydration warnings in console

### Pitfall 2: Missing Reduced Motion in Target Components

**What goes wrong:** DudoOverlay, ShaderBackground, DiceRoller3D don't respect prefers-reduced-motion
**Why it happens:** They only have Firefox detection, not accessibility detection
**How to avoid:** Add `useReducedMotion` hook import and use `useSimplifiedAnimations` pattern
**Warning signs:** Animations run for users who requested reduced motion

### Pitfall 3: Inconsistent Guard Patterns

**What goes wrong:** Some places use `isFirefox`, others use `useSimplifiedAnimations`
**Why it happens:** Migration leaves some guards unchanged
**How to avoid:** Replace ALL `isFirefox` checks with `useSimplifiedAnimations` during migration
**Warning signs:** Grep finds both patterns in same file

### Pitfall 4: ShaderBackground Canvas Flash

**What goes wrong:** Canvas renders briefly before switching to CSS fallback
**Why it happens:** `useIsFirefox` returns `false` on first render
**How to avoid:** The component already handles this - renders null canvas until Firefox detected
**Warning signs:** Brief visual flicker on Firefox

## Code Examples

### Migration Pattern for DudoOverlay

**Before (lines 15-25):**
```typescript
// Detect Firefox browser for simplified animations
function useIsFirefox(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);
}

export function DudoOverlay({ ... }) {
  const isFirefox = useIsFirefox();
```

**After:**
```typescript
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function DudoOverlay({ ... }) {
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Replace all `isFirefox` uses with `useSimplifiedAnimations`
```

### Migration Pattern for ShaderBackground

**Before (lines 7-15):**
```typescript
const [isFirefox, setIsFirefox] = useState(false);

useEffect(() => {
  if (typeof navigator !== 'undefined') {
    setIsFirefox(navigator.userAgent.toLowerCase().includes('firefox'));
  }
}, []);
```

**After:**
```typescript
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Replace all `isFirefox` uses with `useSimplifiedAnimations`
```

### Migration Pattern for DiceRoller3D

**Before (lines 7-13):**
```typescript
// Detect Firefox browser for simplified animations
function useIsFirefox(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);
}
```

**After:**
```typescript
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Remove local useIsFirefox function

export function DiceRoller3D({ ... }) {
  // ...existing code...
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;
```

## Verification Strategy

### Success Criteria Mapping

| Criterion | Verification Method |
|-----------|-------------------|
| Single useIsFirefox hook exists in /src/hooks/ | `ls /src/hooks/useIsFirefox.ts` - should exist |
| Only Firefox detection in codebase | `grep -r "useIsFirefox" --include="*.tsx"` should only show imports from `/hooks/` |
| DudoOverlay imports shared hook | Check import statement |
| ShaderBackground imports shared hook | Check import statement |
| DiceRoller3D imports shared hook | Check import statement |
| useReducedMotion in all animated components | All 3 target components import and use both hooks |
| No duplicate Firefox logic | `grep "navigator.userAgent.*firefox"` returns only `/src/hooks/useIsFirefox.ts` |

### Files to Verify Post-Migration

| File | Check |
|------|-------|
| `/src/hooks/useIsFirefox.ts` | Unchanged, still exports `useIsFirefox` |
| `/src/hooks/useReducedMotion.ts` | Unchanged, still exports `useReducedMotion` |
| `/src/components/DudoOverlay.tsx` | No local useIsFirefox, imports from /hooks/, uses useSimplifiedAnimations |
| `/src/components/ShaderBackground.tsx` | No useState for Firefox, imports from /hooks/, uses useSimplifiedAnimations |
| `/src/components/DiceRoller3D.tsx` | No local useIsFirefox, imports from /hooks/, uses useSimplifiedAnimations |

## Open Questions

1. **ShaderBackground hydration behavior:** Should verify in browser that switching from `useState`+`useEffect` pattern to `useMemo` pattern doesn't cause visual flicker on Firefox.

   - What we know: Both patterns return `false` on initial render
   - What's unclear: Timing of when `useMemo` evaluates vs when `useEffect` runs
   - Recommendation: Test manually, likely no difference in practice

## Sources

### Primary (HIGH confidence)
- `/src/hooks/useIsFirefox.ts` - Source code verified
- `/src/hooks/useReducedMotion.ts` - Source code verified
- `/src/components/DudoOverlay.tsx` - Lines 16-21, 25, 70-71, 76, 95, 150-159, 166, 225, 241
- `/src/components/ShaderBackground.tsx` - Lines 8, 11-15, 19, 153-167
- `/src/components/DiceRoller3D.tsx` - Lines 8-13, 293, 368
- `.planning/phases/14-other-component-optimization/14-VERIFICATION.md` - Verification of existing hook usage

### Secondary (MEDIUM confidence)
- [Motion docs - useReducedMotion](https://motion.dev/docs/react-use-reduced-motion) - Framer Motion's built-in hook reference

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH - all source files verified
- Migration patterns: HIGH - established pattern exists in 7 components
- Pitfalls: HIGH - based on actual codebase analysis
- Verification strategy: HIGH - concrete grep commands provided

**Research date:** 2026-01-20
**Valid until:** No expiration - codebase analysis is point-in-time accurate
