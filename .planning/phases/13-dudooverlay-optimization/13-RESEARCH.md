# Phase 13: DudoOverlay Optimization - Research

**Researched:** 2026-01-20
**Domain:** CSS Animation Performance / GPU Acceleration
**Confidence:** HIGH

## Summary

The DudoOverlay component currently animates several non-GPU-accelerated CSS properties that cause performance issues, particularly in Firefox. The main culprits are:

1. **Animated backdrop-filter** (lines 56-58) - Blur transitions are computationally expensive and don't animate smoothly
2. **Animated text-shadow** (lines 143-158) - Causes layout repaints on every frame
3. **SVG glitch filter** (lines 186-212) - Complex filter chain applied per-frame
4. **8 particles** (lines 214-250) - Excessive particle count with animating scale

The solution is straightforward: restrict all animations to GPU-accelerated properties (`transform` and `opacity` only), use pseudo-elements for glow effects, and eliminate or replace the SVG filter.

**Primary recommendation:** Replace all animated properties with transform/opacity equivalents while maintaining visual impact through layering techniques.

## Standard Stack

The project already uses the correct stack. No new libraries needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | existing | React animation | Already in project, handles transform/opacity efficiently |
| CSS | - | Static effects | text-shadow, backdrop-filter as STATIC styles |

### Supporting
No additional libraries needed. Pure CSS and existing Framer Motion capabilities are sufficient.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG glitch filter | CSS pseudo-element RGB split | CSS is faster, simpler, equally effective |
| Animated text-shadow | Pseudo-element with blur filter | Pseudo-element animates opacity, not the blur itself |

**Installation:**
No new packages required.

## Architecture Patterns

### Pattern 1: Static Backdrop with Opacity Fade

**What:** Apply backdrop-filter once (static), animate only the container's opacity
**When to use:** Any modal overlay that needs blur effect
**Why:** backdrop-filter animation causes severe performance issues especially on larger screens

```typescript
// Source: Current DudoOverlay.tsx analysis + web.dev performance guidelines

// BEFORE (BAD - animates backdrop-filter):
<motion.div
  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
  animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
/>

// AFTER (GOOD - static blur, animate opacity only):
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  style={{ backdropFilter: 'blur(8px)' }}  // Static, never animated
/>
```

### Pattern 2: Pseudo-Element Text Glow

**What:** Create glow effect using a blurred pseudo-element behind text instead of animated text-shadow
**When to use:** Any text that needs pulsing/glowing effect
**Why:** text-shadow animation triggers paint on every frame; pseudo-element opacity is GPU-accelerated

```typescript
// Source: WebSearch findings + CSS performance best practices

// BEFORE (BAD - animates text-shadow):
<motion.h1
  style={{ textShadow: '0 0 20px #ff3366...' }}
  animate={{
    textShadow: ['0 0 20px...', '0 0 40px...', '0 0 20px...']
  }}
>
  DUDO!
</motion.h1>

// AFTER (GOOD - static text-shadow, animate pseudo-element opacity):
<motion.div className="relative">
  {/* Glow layer (pseudo-element in CSS or separate div) */}
  <motion.span
    className="absolute inset-0 blur-xl"
    style={{ color: '#ff3366' }}
    animate={{ opacity: [0.5, 1, 0.5] }}  // Only opacity
    aria-hidden="true"
  >
    DUDO!
  </motion.span>

  {/* Main text - static text-shadow for base glow */}
  <h1 style={{ textShadow: '0 0 20px #ff3366...' }}>  {/* Static, not animated */}
    DUDO!
  </h1>
</motion.div>
```

### Pattern 3: CSS-Only RGB Glitch Effect

**What:** Replace SVG filter with CSS pseudo-elements using transform offset and mix-blend-mode
**When to use:** Digital glitch/chromatic aberration effects
**Why:** SVG filters are expensive; CSS transform is GPU-accelerated

```css
/* Source: freefrontend.com CSS glitch effects + dustri.org pure CSS glitch */

.glitch-text {
  position: relative;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Red channel shifted left */
.glitch-text::before {
  color: #ff0000;
  mix-blend-mode: screen;
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  transform: translateX(-2px);
  opacity: 0.8;
}

/* Cyan channel shifted right */
.glitch-text::after {
  color: #00ffff;
  mix-blend-mode: screen;
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  transform: translateX(2px);
  opacity: 0.8;
}
```

For Framer Motion, animate only the `transform` and `opacity` of these pseudo-elements:

```typescript
// Animate transform offset for glitch effect
animate={{
  x: showGlitch ? [-2, 2, -2] : 0,
  opacity: showGlitch ? [0, 0.8, 0] : 0
}}
```

### Pattern 4: Optimized Particle System

**What:** Reduce particle count to 4-6, animate only transform (x, y, scale) and opacity
**When to use:** Impact/explosion effects
**Why:** Each particle is a DOM element; fewer particles with GPU-only props = better performance

```typescript
// Source: Current DudoOverlay.tsx + Framer Motion best practices

// BEFORE (8 particles with scale animation):
{[...Array(8)].map((_, i) => (
  <motion.div
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],  // Scale is fine (GPU)
      x: [0, endX],
      y: [0, endY]
    }}
  />
))}

// AFTER (4-6 particles, same GPU properties but optimized):
{[...Array(5)].map((_, i) => (
  <motion.div
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],  // Slightly smaller scale
      x: [0, endX],
      y: [0, endY]
    }}
    // Use will-change sparingly
    style={{ willChange: 'transform, opacity' }}
  />
))}
```

### Anti-Patterns to Avoid

- **Animating backdrop-filter:** Never animate blur amount; apply static blur, animate container opacity
- **Animating text-shadow:** Never animate text-shadow values; use pseudo-element with static blur and animate opacity
- **SVG filters during animation:** Avoid feColorMatrix chains during animation; use CSS transforms for similar effects
- **Excessive will-change:** Don't apply will-change to static elements; only use on elements that actually animate
- **Animating filter on visible elements:** filter: blur() should be static on visible elements; if glow needs to pulse, animate a separate overlay's opacity

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pulsing glow | Animated text-shadow | Pseudo-element with static blur + opacity animation | text-shadow is not GPU-accelerated |
| Blur overlay | Animated backdrop-filter | Static backdrop-filter + opacity fade | backdrop-filter animation causes stutter |
| RGB split/glitch | SVG feColorMatrix filter | CSS pseudo-elements with transform | SVG filters are expensive |
| Screen shake | CSS transform animation | Framer Motion transform | Already using Framer Motion |

**Key insight:** The visual effect can look the same while using different underlying CSS properties. Human perception doesn't notice if we're animating opacity vs text-shadow - they see "glowing text."

## Common Pitfalls

### Pitfall 1: Assuming backdrop-filter Animates Smoothly

**What goes wrong:** Blur transitions appear choppy, especially on larger screens or Firefox
**Why it happens:** backdrop-filter requires compositing the entire background area per frame; browser can't efficiently handle blur amount changes
**How to avoid:** Apply backdrop-filter as static CSS, wrap in container that fades in with opacity
**Warning signs:** Visually, the blur snaps to final value; DevTools shows high paint times

### Pitfall 2: text-shadow Animation Performance

**What goes wrong:** Frame drops during text glow pulsing animation
**Why it happens:** text-shadow is not GPU-accelerated; triggers paint every frame
**How to avoid:** Use pseudo-element with filter: blur() (static) and animate only opacity
**Warning signs:** DevTools Performance panel shows frequent "Paint" events during animation

### Pitfall 3: Over-Using will-change

**What goes wrong:** Memory usage increases, performance actually decreases
**Why it happens:** will-change creates compositor layers; too many layers = memory bloat
**How to avoid:** Only use will-change on elements that actively animate; remove after animation if one-shot
**Warning signs:** DevTools Layers panel shows many unnecessary layers

### Pitfall 4: SVG Filter Overhead

**What goes wrong:** Heavy CPU usage during glitch effect
**Why it happens:** feColorMatrix operations are calculated on CPU, applied per-frame
**How to avoid:** Replace with CSS-only technique using pseudo-elements and mix-blend-mode
**Warning signs:** High CPU in DevTools, visible lag on lower-end devices

### Pitfall 5: Accessibility - Removing reduce motion support

**What goes wrong:** Users with vestibular disorders experience discomfort
**Why it happens:** Not checking prefers-reduced-motion media query
**How to avoid:** Wrap intense animations in reduced-motion check; provide simpler fade alternatives
**Warning signs:** No prefers-reduced-motion check in codebase (currently absent)

## Code Examples

### Example 1: Optimized Backdrop Overlay

```typescript
// Source: DudoOverlay.tsx refactored per research

// Container fades in; backdrop blur is STATIC
<motion.div
  className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Backdrop layer - blur is STATIC, never animated */}
  <div
    className="absolute inset-0"
    style={{
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',  // Static, applied immediately
    }}
  />
  {/* Content here */}
</motion.div>
```

### Example 2: Pseudo-Element Text Glow

```typescript
// Source: Research findings - pseudo-element glow technique

// Option A: Using a duplicate span for glow (recommended for React)
<motion.div className="relative inline-block">
  {/* Glow layer - blurred duplicate, animates ONLY opacity */}
  <motion.span
    className="absolute inset-0 text-8xl font-black uppercase tracking-tighter select-none pointer-events-none"
    style={{
      color: mainColor,
      filter: 'blur(20px)',  // Static blur
    }}
    animate={{ opacity: [0.4, 0.8, 0.4] }}  // Only opacity animates
    transition={{ duration: 1, repeat: Infinity }}
    aria-hidden="true"
  >
    DUDO!
  </motion.span>

  {/* Main text - static glow via text-shadow (no animation) */}
  <h1
    className="relative text-8xl font-black uppercase tracking-tighter select-none"
    style={{
      color: mainColor,
      textShadow: `0 0 10px ${glowColor}, 4px 4px 0 ${shadowColor}`,  // Static
    }}
  >
    DUDO!
  </h1>
</motion.div>
```

### Example 3: CSS-Only Glitch (Alternative to SVG)

```typescript
// Source: Pure CSS glitch research + codebase patterns

// For React, use data-text attribute pattern
const GlitchText = ({ text, color, show }: { text: string; color: string; show: boolean }) => (
  <motion.div
    className="relative"
    data-text={text}
    initial={{ opacity: 0 }}
    animate={{ opacity: show ? 1 : 0 }}
    transition={{ duration: 0.15 }}
  >
    {/* Red channel */}
    <motion.span
      className="absolute inset-0 text-8xl font-black"
      style={{ color: '#ff0000', mixBlendMode: 'screen' }}
      animate={show ? { x: [-2, 2, -2], opacity: [0, 0.5, 0] } : { opacity: 0 }}
      transition={{ duration: 0.15 }}
      aria-hidden="true"
    >
      {text}
    </motion.span>

    {/* Cyan channel */}
    <motion.span
      className="absolute inset-0 text-8xl font-black"
      style={{ color: '#00ffff', mixBlendMode: 'screen' }}
      animate={show ? { x: [2, -2, 2], opacity: [0, 0.5, 0] } : { opacity: 0 }}
      transition={{ duration: 0.15, delay: 0.02 }}
      aria-hidden="true"
    >
      {text}
    </motion.span>

    {/* Main text */}
    <span className="relative text-8xl font-black" style={{ color }}>
      {text}
    </span>
  </motion.div>
);
```

### Example 4: Reduced Particle System

```typescript
// Source: DudoOverlay.tsx refactored

// Reduce from 8 to 5 particles
const PARTICLE_COUNT = 5;

{[...Array(PARTICLE_COUNT)].map((_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 120;  // Slightly reduced distance
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance;

  return (
    <motion.div
      key={i}
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: 8,
        height: 8,
        marginLeft: -4,
        marginTop: -4,
        backgroundColor: mainColor,
        boxShadow: `0 0 8px ${mainColor}`,  // Static glow
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
        x: [0, endX],
        y: [0, endY]
      }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
    />
  );
})}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Animate any CSS property | Restrict to transform/opacity | 2016+ (GPU acceleration mainstream) | 60fps achievable |
| SVG filters for effects | CSS filters + pseudo-elements | 2020+ (better browser support) | Less CPU overhead |
| Animated backdrop-filter | Static backdrop-filter | 2024 (backdrop-filter Baseline) | Eliminates stutter |
| Single element glow | Pseudo-element layered glow | Always preferred | Separates concerns |

**Deprecated/outdated:**
- Animating backdrop-filter blur amount - known performance issue, use opacity fade instead
- SVG feColorMatrix for runtime effects - CSS transform-based alternatives are faster

## Open Questions

None significant. The techniques are well-established and the current codebase is compatible.

1. **Glitch effect necessity**
   - What we know: Current SVG glitch is used briefly (150ms) during impact
   - What's unclear: Whether glitch effect is critical to visual identity
   - Recommendation: Implement CSS alternative first; if visually insufficient, can skip glitch entirely (simpler = faster)

## Sources

### Primary (HIGH confidence)
- web.dev animations guide - https://web.dev/articles/animations-guide (GPU acceleration)
- MDN backdrop-filter - https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter (browser support)
- Smashing Magazine GPU Animation - https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/ (transform/opacity)

### Secondary (MEDIUM confidence)
- GitHub shadcn-ui issue #327 - backdrop-filter performance issues documented
- Mozilla bug #1718471 - backdrop-filter blur lag with many elements
- freefrontend.com CSS glitch effects - https://freefrontend.com/css-glitch-effects/ (pure CSS patterns)

### Tertiary (LOW confidence)
- Various Medium articles on hardware acceleration (concepts verified against primary sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, using existing Framer Motion
- Architecture patterns: HIGH - Well-documented CSS performance principles
- Pitfalls: HIGH - Known issues with backdrop-filter/text-shadow widely documented
- Code examples: HIGH - Based on current codebase analysis + verified patterns

**Research date:** 2026-01-20
**Valid until:** 2026-04-20 (3 months - CSS animation best practices are stable)

---

## Appendix: Current DudoOverlay Analysis

### Lines requiring changes:

| Line(s) | Current Issue | Fix |
|---------|---------------|-----|
| 56-58 | Animated backdropFilter | Make static, animate container opacity |
| 143-158 | Animated textShadow | Use pseudo-element glow with opacity |
| 171 | Static textShadow (OK) | Keep as-is |
| 186-212 | SVG glitch filter | Remove or replace with CSS pseudo-elements |
| 214-250 | 8 particles | Reduce to 4-6, keep transform/opacity only |

### Properties currently animated (to fix):
1. `backdropFilter: 'blur(0px)' -> 'blur(8px)'` - line 56-58
2. `textShadow: [array of values]` - lines 152-158
3. `filter: 'url(#glitch)'` applied conditionally - line 149

### Properties correctly using GPU (keep as-is):
1. `opacity` - lines 47-50, 68-70, etc.
2. `scale` - line 114, 239
3. `x`, `y` (transform) - lines 237-238
4. `rotate` - lines 117-118
