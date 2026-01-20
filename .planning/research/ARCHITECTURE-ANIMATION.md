# Architecture Research: Animation Performance Patterns

**Project:** Perudo Vibe - DudoOverlay Animation Optimization
**Researched:** 2026-01-20
**Focus:** Framer Motion + React animation performance

## Executive Summary

The DudoOverlay component runs multiple expensive animation types simultaneously:
- Animated `backdrop-filter: blur()` (Firefox performance killer)
- Animated `text-shadow` with glow effects (triggers paint every frame)
- SVG filter for glitch effect (not GPU-accelerated)
- 8 particle animations with scale/opacity/position
- Multiple nested motion.div components

This architecture guide provides patterns for restructuring these animations for cross-browser performance.

---

## Component Structure

### Current Problem: Flat Simultaneous Animations

The current DudoOverlay renders all animations in a flat structure, starting simultaneously:

```tsx
// PROBLEMATIC: Everything animates at once
<AnimatePresence>
  <motion.div> {/* container */}
    <motion.div animate={{ backdropFilter }} /> {/* EXPENSIVE */}
    <motion.div animate={{ opacity, backgroundColor }} /> {/* flash */}
    <motion.div animate={{ x, scaleX, opacity }} /> {/* glitch lines */}
    <motion.div animate={{ scale, opacity, rotate }} /> {/* main text */}
      <motion.h1 animate={{ textShadow }} /> {/* EXPENSIVE */}
    {[...Array(8)].map(() => (
      <motion.div animate={{ x, y, scale, opacity }} /> {/* particles */}
    ))}
  </motion.div>
</AnimatePresence>
```

### Recommended Pattern: Layered Animation Groups

**Structure animations in layers by cost and timing:**

```tsx
// Layer 1: Static background (CSS only, no motion)
// Layer 2: Simple opacity/transform (GPU-accelerated)
// Layer 3: Expensive effects (deferred, reduced on low-end)

<AnimatePresence>
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {/* Layer 1: Static backdrop - CSS only */}
    <div className="backdrop-static" />

    {/* Layer 2: GPU-friendly animations */}
    <motion.div
      variants={mainTextVariants}
      initial="hidden"
      animate="visible"
    >
      <MainText /> {/* transform/opacity only */}
    </motion.div>

    {/* Layer 3: Particles - staggered, not simultaneous */}
    <ParticleGroup delay={0.2} count={8} />

    {/* Layer 4: Expensive effects - conditional */}
    {!prefersReducedMotion && <GlowEffects />}
  </motion.div>
</AnimatePresence>
```

### Component Extraction Pattern

**Extract animation-heavy elements into memoized components:**

```tsx
// Memoize particle calculations
const ParticleGroup = memo(function ParticleGroup({
  delay,
  count,
  color
}: ParticleGroupProps) {
  // Pre-calculate positions outside render
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      endX: Math.cos((i / count) * Math.PI * 2) * 150,
      endY: Math.sin((i / count) * Math.PI * 2) * 150,
    })),
    [count]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          variants={particleVariants}
          custom={p} // Pass pre-calculated values
        />
      ))}
    </motion.div>
  );
});
```

---

## Animation Sequencing

### When to Sequence (Run in Order)

Sequence animations when:
1. **User attention should follow a path** - Entrance animations
2. **One animation depends on another** - Text appears, then particles burst
3. **Performance budget is limited** - Spread CPU/GPU load over time
4. **Creating dramatic effect** - Impact, pause, reveal

**Implementation with Framer Motion variants:**

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",    // Parent animates first
      staggerChildren: 0.1,      // Children stagger
      delayChildren: 0.2,        // Children wait 200ms
    }
  }
};

const childVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400 }
  }
};
```

### When to Parallelize (Run Simultaneously)

Parallelize animations when:
1. **Animations are visually independent** - Background glow + foreground text
2. **Both are GPU-accelerated** - opacity + transform only
3. **Duration is very short** - Sub-200ms micro-interactions
4. **Creating ambient effects** - Subtle background movement

**Parallel with independent motion values:**

```tsx
// These can run in parallel because they're GPU-accelerated
const textX = useMotionValue(0);
const textScale = useMotionValue(1);
const bgOpacity = useMotionValue(0);

// Animate independently without re-renders
useEffect(() => {
  animate(textX, [0, 10, 0], { duration: 0.3 });
  animate(textScale, [1, 1.1, 1], { duration: 0.3 });
  animate(bgOpacity, [0, 1], { duration: 0.2 });
}, []);
```

### DudoOverlay Recommended Sequence

```
Time (ms)    Animation
0            Container fade in (opacity)
0-100        Backdrop appears (static blur, not animated)
100-400      Main text slam (scale + rotate via transform)
200          Particles burst (8 staggered by 25ms each)
200-350      Glitch flash (conditional, reduced motion skip)
400-1400     Text glow pulse (use pseudo-element, not text-shadow)
1500         onComplete callback
```

---

## CSS vs Framer Motion

### Property Performance Tiers

| Tier | Properties | Render Path | Use Case |
|------|------------|-------------|----------|
| **S-Tier** | `transform`, `opacity` | Compositor only | Always prefer |
| **A-Tier** | `filter` (simple), `clip-path` | Compositor (mostly) | Use cautiously |
| **B-Tier** | `background-color`, `color` | Paint only | Short transitions OK |
| **C-Tier** | `box-shadow`, `text-shadow` | Paint (expensive) | Avoid animating |
| **F-Tier** | `width`, `height`, `top`, `left`, `backdrop-filter` | Layout + Paint | Never animate |

### Use Pure CSS When

1. **Hover/focus states** - CSS `:hover` is more performant than `whileHover`
2. **Simple keyframe loops** - `@keyframes` runs off main thread
3. **Static transitions** - CSS `transition` is fine for non-continuous
4. **Reduced motion fallback** - CSS `prefers-reduced-motion` is cleaner

```css
/* CSS is better for ambient loops */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.glow-element {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .glow-element {
    animation: none;
  }
}
```

### Use Framer Motion When

1. **Orchestration needed** - Sequencing, staggering, variants
2. **Gesture-driven** - Drag, pan, tap interactions
3. **Layout animations** - `layoutId`, shared element transitions
4. **Complex interpolation** - `useTransform` with multiple inputs
5. **Exit animations** - `AnimatePresence` unmount animations

```tsx
// Framer Motion is better for orchestration
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants} layoutId={item.id} />
  ))}
</motion.div>
```

### Hybrid Approach (Recommended)

```tsx
// Use CSS for the animation, Framer Motion for lifecycle
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="glow-pulse" // CSS handles the loop
/>
```

---

## Composite Layers (GPU Management)

### How GPU Layers Work

The browser creates composite layers for elements that can be animated independently. Properties that trigger layer creation:
- `transform: translateZ(0)` or `translate3d(0,0,0)`
- `will-change: transform` or `will-change: opacity`
- Elements with `opacity` less than 1
- Elements with CSS filters
- Framer Motion's `motion.div` with transform animations

### When Layers Help

```tsx
// GOOD: Layer helps because transform animation is continuous
<motion.div
  style={{ willChange: "transform" }}
  animate={{ x: [0, 100, 0] }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

### When Layers Hurt

```tsx
// BAD: Too many layers (8 particles + text + background = GPU memory)
{[...Array(50)].map((_, i) => (
  <motion.div style={{ willChange: "transform" }} /> // 50 layers!
))}

// BETTER: Single container layer, CSS transforms inside
<motion.div style={{ willChange: "transform" }}>
  <svg>
    {particles.map((p) => (
      <circle transform={`translate(${p.x}, ${p.y})`} />
    ))}
  </svg>
</motion.div>
```

### Memory Budgets

| Device | Max Layers | Max Layer Size |
|--------|------------|----------------|
| Desktop | 50-100 | 4096x4096px |
| Mobile | 10-20 | 2048x2048px |
| Low-end mobile | 5-10 | 1024x1024px |

### will-change Best Practices

```tsx
// DON'T: Set will-change permanently
<div style={{ willChange: "transform" }}> // Layer always exists

// DO: Add will-change before animation, remove after
const [isAnimating, setIsAnimating] = useState(false);

<motion.div
  style={{ willChange: isAnimating ? "transform" : "auto" }}
  onAnimationStart={() => setIsAnimating(true)}
  onAnimationComplete={() => setIsAnimating(false)}
/>
```

---

## Recommended Refactoring Approach

### Phase 1: Audit Current Performance

1. **Profile in Firefox DevTools** - Firefox is the problem browser
2. **Identify paint operations** - Enable "Paint flashing" in DevTools
3. **Measure frame rate** - Use Performance tab, look for frames > 16ms
4. **List all animated properties** - Categorize by performance tier

**Current DudoOverlay expensive operations:**
- `backdrop-filter: blur()` - animated from 0px to 8px
- `text-shadow` - animated with multiple glow values
- SVG filter `#glitch` - applied during animation
- 8 particles animating `x, y, scale, opacity`

### Phase 2: Replace Expensive Animations

| Current | Replacement | Rationale |
|---------|-------------|-----------|
| Animated `backdrop-filter` | Static `backdrop-filter: blur(8px)` with opacity fade | Firefox chokes on animated blur |
| Animated `text-shadow` | Pseudo-element with opacity | Shadow animation triggers paint |
| SVG glitch filter | CSS `clip-path` or pre-rendered | SVG filters not GPU-accelerated |
| Multiple `motion.div` particles | Single SVG with transforms | Fewer layers, single composite |

### Phase 3: Restructure Component

```tsx
// Before: Flat structure, everything simultaneous
export function DudoOverlay({ isVisible, type, ... }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div>
          {/* 10+ simultaneous animations */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// After: Layered structure, sequenced, extracted
export function DudoOverlay({ isVisible, type, ... }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Layer 1: Static backdrop */}
          <StaticBackdrop />

          {/* Layer 2: Main animation (transform only) */}
          <MainTextAnimation type={type} />

          {/* Layer 3: Particles (single SVG) */}
          <ParticleBurst color={mainColor} delay={0.2} />

          {/* Layer 4: Optional effects */}
          {!prefersReducedMotion && <GlitchEffect />}

          {/* Layer 5: Caller info */}
          <CallerLabel name={callerName} color={callerColor} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Phase 4: Firefox-Specific Mitigations

```tsx
// Detect Firefox
const isFirefox = typeof navigator !== 'undefined' &&
  navigator.userAgent.toLowerCase().includes('firefox');

// Reduce animation complexity on Firefox
const particleCount = isFirefox ? 4 : 8;
const useBackdropBlur = !isFirefox; // Static opacity overlay instead
const enableGlitchFilter = !isFirefox; // Skip SVG filter
```

### Phase 5: Implement Motion Values

```tsx
// Replace state-driven animations with MotionValues
function MainTextAnimation({ type }) {
  const scale = useMotionValue(5);
  const rotate = useMotionValue(-5);
  const opacity = useMotionValue(0);

  // Transform runs without re-renders
  const textStyle = useTransform(
    [scale, rotate],
    ([s, r]) => `scale(${s}) rotate(${r}deg)`
  );

  useEffect(() => {
    // Sequence with animate()
    const controls = animate(opacity, 1, { duration: 0.1 });
    animate(scale, [5, 0.9, 1.1, 1], {
      duration: 0.4,
      times: [0, 0.5, 0.75, 1]
    });
    animate(rotate, [-5, 2, -1, 0], {
      duration: 0.4,
      times: [0, 0.5, 0.75, 1]
    });

    return () => controls.stop();
  }, []);

  return (
    <motion.div style={{ transform: textStyle, opacity }}>
      {/* text content */}
    </motion.div>
  );
}
```

### Performance Checklist

- [ ] No animated `backdrop-filter` (use static or opacity)
- [ ] No animated `text-shadow` (use pseudo-element technique)
- [ ] No animated `width`/`height`/`top`/`left` (use transform)
- [ ] SVG filters removed or conditionally loaded
- [ ] Particles reduced to single composite layer
- [ ] `will-change` added only during animation
- [ ] `useMemo` for particle calculations
- [ ] Variants used for orchestration
- [ ] `prefers-reduced-motion` respected
- [ ] Firefox-specific reductions applied

---

## Sources

### Official Documentation
- [Motion Animation Performance Guide](https://motion.dev/docs/performance)
- [Motion useTransform Documentation](https://www.framer.com/motion/use-transform/)
- [Motion MotionValue Documentation](https://www.framer.com/motion/motionvalue/)
- [MDN CSS and JavaScript Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

### Performance Research
- [Web Animation Performance Tier List - Motion Magazine](https://motion.dev/blog/web-animation-performance-tier-list)
- [How to Create High-Performance CSS Animations - web.dev](https://web.dev/articles/animations-guide)
- [CSS GPU Animation: Doing It Right - Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [How to Animate Box-Shadow with Performance - Tobias Ahlin](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)

### Firefox-Specific Issues
- [Firefox Bug 1718471 - backdrop-filter blur is laggy](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471)
- [Firefox Bug 1798592 - Slow backdrop-filter:blur](https://bugzilla.mozilla.org/show_bug.cgi?id=1798592)
- [shadcn/ui Issue #327 - CSS Backdrop filter causing performance issues](https://github.com/shadcn-ui/ui/issues/327)

### SVG Filter Performance
- [SVG Filter Effects - Codrops](https://tympanus.net/codrops/2019/02/26/svg-filter-effects-moving-forward/)
- [Improving SVG Runtime Performance - CodePen](https://codepen.io/tigt/post/improving-svg-rendering-performance)
- [High Performance SVGs - CSS-Tricks](https://css-tricks.com/high-performance-svgs/)

### React Optimization
- [When to useMemo and useCallback - Kent C. Dodds](https://kentcdodds.com/blog/usememo-and-usecallback)
- [Understanding useMemo and useCallback - Josh Comeau](https://www.joshwcomeau.com/react/usememo-and-usecallback/)
- [Framer Motion Performance Tips](https://tillitsdone.com/blogs/framer-motion-performance-tips/)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| GPU-accelerated properties | HIGH | Verified via MDN, web.dev, Motion docs |
| Firefox backdrop-filter issues | HIGH | Confirmed via Mozilla Bugzilla |
| text-shadow animation cost | HIGH | Verified via multiple sources |
| SVG filter performance | HIGH | Confirmed via Smashing Magazine, CodePen |
| MotionValue patterns | MEDIUM | Official docs, but needs codebase testing |
| Particle layer optimization | MEDIUM | General principle, needs profiling |
