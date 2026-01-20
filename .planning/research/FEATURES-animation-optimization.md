# Features Research: Animation Optimization Techniques

**Domain:** Web Animation Performance (Browser-based game, React/Framer Motion)
**Researched:** 2026-01-20
**Overall Confidence:** HIGH (MDN, official docs, Firefox bug trackers)

---

## Table Stakes (Must Have for 60fps)

These are non-negotiable optimizations. Missing any of these guarantees poor performance.

### 1. Animate Only Compositor Properties

| Property | GPU Accelerated | Triggers |
|----------|-----------------|----------|
| `transform` | YES | Composite only |
| `opacity` | YES | Composite only |
| `filter` (simple) | Partial | Paint + Composite |
| Everything else | NO | Layout + Paint + Composite |

**Why:** The browser rendering pipeline has three expensive steps: Layout, Paint, Composite. Transform and opacity skip Layout and Paint entirely, going straight to the GPU compositor.

**Current issue in DudoOverlay:** Animating `backdrop-filter`, `textShadow`, `backgroundColor` - all trigger paint.

**Fix:** Use `transform` (translate, scale, rotate) and `opacity` exclusively for motion. Use pseudo-elements with pre-rendered shadows that only animate opacity.

### 2. Avoid Animating backdrop-filter

| Browser | backdrop-filter Performance |
|---------|---------------------------|
| Chrome | Acceptable, but not great |
| Safari | Good |
| Firefox | Historically problematic (Bug 1718471, Bug 1798592) |

**Why:** `backdrop-filter: blur()` is computationally expensive because the browser must:
1. Capture the content behind the element
2. Apply the blur filter to that captured content
3. Composite the blurred result
4. Repeat every frame if animated

**Current issue:** DudoOverlay animates `backdropFilter: 'blur(0px)'` to `'blur(8px)'`

**Fix options:**
1. Apply blur instantly (no animation) - `transition: none` for backdrop-filter
2. Use a static blurred overlay that fades in with opacity
3. Use a solid semi-transparent background instead of blur
4. Feature-detect Firefox and disable blur: `@supports not (-moz-appearance: none)`

### 3. Avoid Animating box-shadow and text-shadow

**Why:** Shadow properties trigger paint on every frame. They are not GPU-accelerated.

**Current issue:** DudoOverlay animates `textShadow` with 3 shadow layers pulsing.

**Fix:** The pseudo-element technique:
```tsx
// Instead of animating text-shadow directly:
<motion.h1
  animate={{ textShadow: [...] }}  // BAD - triggers paint
/>

// Use a pseudo-element with pre-rendered shadow:
<motion.h1 className="relative">
  DUDO!
  <motion.span
    className="absolute inset-0 blur-lg"
    animate={{ opacity: [0.5, 1, 0.5] }}  // GOOD - opacity only
    style={{ textShadow: '...' }}  // Static shadow
  />
</motion.h1>
```

### 4. Limit Animated Elements

**Rule of thumb:** Keep animated elements under 20-30 for DOM-based animations.

**Current issue:** DudoOverlay creates 8 particle divs + glitch lines + text + backdrop = 12+ animated elements simultaneously.

**Fix:**
- Reduce particle count (4 instead of 8)
- Use CSS `@keyframes` for particles instead of Framer Motion (CSS animations can be optimized by browser)
- Consider canvas for particle effects (if > 20 particles needed)

### 5. Use will-change Sparingly

**What it does:** Hints to browser that a property will change, allowing pre-optimization.

**CRITICAL:** Overuse causes memory bloat and worse performance.

**Best practices:**
- Apply to maximum 2-3 elements per viewport
- Add via JavaScript before animation, remove after
- Never use `will-change: all`
- Target specific properties: `will-change: transform, opacity`

```tsx
// Framer Motion approach
<motion.div
  style={{ willChange: 'transform' }}
  onAnimationStart={() => /* will-change already set */}
  onAnimationComplete={(e) => {
    e.target.style.willChange = 'auto'; // Clean up
  }}
/>
```

### 6. Respect prefers-reduced-motion

**Why:** Required for accessibility, but also provides natural performance escape hatch.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Framer Motion approach:**
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: [0, 1] }}
/>
```

---

## Differentiators (Nice to Have)

Advanced optimizations that push performance further.

### 1. Hardware Layer Promotion

Force GPU layer creation for critical animated elements:

```css
.critical-animation {
  transform: translateZ(0); /* or translate3d(0,0,0) */
  backface-visibility: hidden;
}
```

**When to use:** Overlay backgrounds, main animated text.

**Caution:** Each layer uses GPU memory. Don't apply globally.

### 2. CSS Containment

Tell browser an element's layout/paint doesn't affect siblings:

```css
.overlay {
  contain: layout paint;
}
```

**Benefit:** Browser can skip recalculating unrelated elements.

### 3. Frame Budget Monitoring

Target: 16.7ms per frame (60fps) or 8ms (120fps displays).

**DevTools approach:**
- Chrome: Performance panel > Frame timing
- Firefox: Performance panel > Frames

**In code:**
```tsx
// Development-only frame monitoring
if (process.env.NODE_ENV === 'development') {
  let lastTime = performance.now();
  const checkFrame = () => {
    const now = performance.now();
    const delta = now - lastTime;
    if (delta > 20) console.warn(`Frame took ${delta.toFixed(1)}ms`);
    lastTime = now;
    requestAnimationFrame(checkFrame);
  };
  requestAnimationFrame(checkFrame);
}
```

### 4. Lazy Animation Loading

Only animate when visible:

```tsx
import { useInView } from 'framer-motion';

function AnimatedComponent() {
  const ref = useRef(null);
  const isInView = useInView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? 'visible' : 'hidden'}
    />
  );
}
```

### 5. Exit Animation Optimization

Keep exit animations short (< 200ms) and simple (opacity fade only).

```tsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      exit={{ opacity: 0 }}  // Simple, fast
      transition={{ exit: { duration: 0.15 } }}
    />
  )}
</AnimatePresence>
```

### 6. Layout Animation Batching

Use Framer Motion's `layoutId` for shared element transitions instead of manual coordinate calculations:

```tsx
// Efficient - browser handles layout
<motion.div layoutId="shared-element" />

// Less efficient - manual position tracking
<motion.div animate={{ x: calculatedX, y: calculatedY }} />
```

---

## Anti-Features (Avoid - These Kill Performance)

Properties and patterns that guarantee poor performance.

### Critical Anti-Patterns

| Anti-Feature | Why Avoid | What Happens |
|--------------|-----------|--------------|
| Animated `width`/`height` | Triggers layout | Entire page reflows |
| Animated `top`/`left`/`right`/`bottom` | Triggers layout | Use `transform: translate()` instead |
| Animated `margin`/`padding` | Triggers layout | Use transform instead |
| Animated `border-width` | Triggers layout + paint | Use transform: scale or pseudo-elements |
| Animated `box-shadow` | Triggers paint | Use pseudo-element with opacity |
| Animated `text-shadow` | Triggers paint | Use pseudo-element with opacity |
| Animated `backdrop-filter` | Very expensive | Apply instantly or use static blur |
| Animated `filter: blur()` | Expensive | Minimize blur radius, avoid on large elements |
| SVG filter animations | Not GPU accelerated | Causes massive FPS drops |
| Many simultaneous `will-change` | Memory bloat | Limit to 2-3 elements |

### SVG Filter Warning

**Current issue:** DudoOverlay uses SVG `<filter id="glitch">` with feColorMatrix and feBlend.

**Problem:** SVG filters are NOT GPU accelerated in any browser. Complex filter chains cause FPS to drop below 10fps on some devices.

**Fix options:**
1. Pre-render glitch frames as images/sprites
2. Use CSS-only RGB split technique with pseudo-elements
3. Apply glitch only on initial impact (150ms), not continuously
4. Skip glitch effect on Firefox entirely

**CSS-only RGB split alternative:**
```css
.glitch-text {
  position: relative;
}
.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.8;
}
.glitch-text::before {
  color: red;
  transform: translate(-2px, 0);
  animation: glitch-r 0.15s steps(1) forwards;
}
.glitch-text::after {
  color: cyan;
  transform: translate(2px, 0);
  animation: glitch-c 0.15s steps(1) forwards;
}
```

### Layout Thrashing

Reading and writing layout properties in alternation forces synchronous reflows:

```tsx
// BAD - layout thrashing
elements.forEach(el => {
  const height = el.offsetHeight;  // Read (forces layout)
  el.style.height = height + 10 + 'px';  // Write (invalidates layout)
});

// GOOD - batch reads, then writes
const heights = elements.map(el => el.offsetHeight);  // All reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';  // All writes
});
```

### Avoid These Framer Motion Patterns

```tsx
// BAD: Animating layout properties
<motion.div animate={{ width: 200, height: 200 }} />

// BAD: Complex backgroundColor animations
<motion.div animate={{ backgroundColor: ['#ff0', '#f00', '#0f0'] }} />

// BAD: Animating many child elements individually
{items.map(item => <motion.div key={item.id} animate={...} />)}

// GOOD: Use staggerChildren instead
<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(item => <motion.li key={item.id} variants={item} />)}
</motion.ul>
```

---

## Firefox-Specific Considerations

Firefox has historically had different animation performance characteristics.

### Known Firefox Issues

| Issue | Bug | Status |
|-------|-----|--------|
| backdrop-filter blur laggy with many elements | [Bug 1718471](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471) | Partially fixed |
| blur filter slower than Chrome | [Bug 925025](https://bugzilla.mozilla.org/show_bug.cgi?id=925025) | Long-standing |
| SVG filter animation slow | [Bug 1583828](https://bugzilla.mozilla.org/show_bug.cgi?id=1583828) | Known issue |
| backdrop-filter slow on Android | [Bug 1798592](https://bugzilla.mozilla.org/show_bug.cgi?id=1798592) | Open |

### Firefox-Specific Workarounds

**1. Feature detection to disable expensive effects:**
```css
/* Only apply backdrop-filter on non-Firefox browsers */
@supports not (-moz-appearance: none) {
  .overlay {
    backdrop-filter: blur(8px);
  }
}

/* Firefox fallback */
@supports (-moz-appearance: none) {
  .overlay {
    background: rgba(0, 0, 0, 0.8); /* Solid background instead */
  }
}
```

**2. Reduce blur intensity on Firefox:**
```tsx
const isFirefox = navigator.userAgent.includes('Firefox');
const blurAmount = isFirefox ? '4px' : '8px';
```

**3. Disable SVG filters on Firefox:**
```tsx
const isFirefox = navigator.userAgent.includes('Firefox');
const glitchFilter = isFirefox ? 'none' : 'url(#glitch)';
```

**4. Use CSS animations over JS for Firefox:**
Firefox sometimes handles CSS `@keyframes` more efficiently than JavaScript-driven animations.

### Firefox DevTools for Animation Performance

1. Open DevTools (F12)
2. Performance tab
3. Check "Enable Gecko Profiler" for detailed rendering info
4. Look for "Reflow" and "Paint" markers during animation

### Interop 2025 Note

backdrop-filter is part of Interop 2025 work, meaning cross-browser consistency is actively being improved. Performance parity should improve throughout 2025-2026.

---

## Recommended Optimization Priority

For the DudoOverlay specifically:

### Phase 1: Critical (Immediate Impact)
1. Stop animating `backdrop-filter` - apply blur instantly or use solid background
2. Stop animating `textShadow` - use pseudo-element with opacity
3. Remove or simplify SVG glitch filter - use CSS-only alternative or skip
4. Add `prefers-reduced-motion` support

### Phase 2: Important
5. Reduce particle count from 8 to 4
6. Add `will-change: transform` to main animated elements (remove after)
7. Detect Firefox and apply simpler effects

### Phase 3: Polish
8. Use CSS `@keyframes` for particles instead of Framer Motion
9. Add frame budget monitoring in development
10. Profile in Firefox and Chrome, optimize specific bottlenecks

---

## Sources

### Official Documentation (HIGH confidence)
- [MDN: Animation performance and frame rate](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
- [MDN: CSS performance optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)
- [MDN: will-change property](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)
- [Motion (Framer Motion) docs](https://motion.dev/)

### Firefox Bug Tracker (HIGH confidence)
- [Bug 1718471: backdrop-filter blur laggy](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471)
- [Bug 925025: CSS blur filter slower than Chrome](https://bugzilla.mozilla.org/show_bug.cgi?id=925025)
- [Bug 1583828: Slow SVG filter animation](https://bugzilla.mozilla.org/show_bug.cgi?id=1583828)
- [Bug 1798592: Slow backdrop-filter on Android Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1798592)

### Community Resources (MEDIUM confidence)
- [CSS Triggers - property rendering costs](https://csstriggers.com/)
- [Paul Irish: What forces layout/reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [Tobias Ahlin: How to animate box-shadow](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)
- [Smashing Magazine: SVG Displacement Filtering](https://www.smashingmagazine.com/2021/09/deep-dive-wonderful-world-svg-displacement-filtering/)
- [CSS-Tricks: High Performance SVGs](https://css-tricks.com/high-performance-svgs/)
- [LogRocket: When and how to use CSS will-change](https://blog.logrocket.com/when-how-use-css-will-change/)

### Framer Motion Resources (MEDIUM confidence)
- [Framer Motion Performance Tips](https://tillitsdone.com/blogs/framer-motion-performance-tips/)
- [Motion Discussion: Hardware acceleration questions](https://github.com/motiondivision/motion/discussions/1901)
- [Advanced Framer Motion Techniques](https://www.luxisdesign.io/blog/advanced-framer-motion-animation-techniques-for-react-developers)
