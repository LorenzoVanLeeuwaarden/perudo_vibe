# Stack Research: Animation Performance

**Project:** Perudo Vibe - Animation Performance Optimization
**Researched:** 2026-01-20
**Focus:** Optimizing DudoOverlay animations for 60fps across all browsers
**Existing Stack:** Framer Motion 11.15.0, React 19, Next.js 16, Tailwind CSS 4

---

## Executive Summary

The DudoOverlay component uses several performance-intensive CSS features: animated `backdrop-filter`, SVG filters (`feColorMatrix`), animated `text-shadow`, and particle effects. Firefox has historically had `backdrop-filter` performance issues, though recent WebRender improvements have largely addressed this. The primary optimization strategy should focus on:

1. **Replace CPU-bound property animations** with compositor-thread-friendly alternatives
2. **Profile using browser DevTools** to identify specific bottlenecks
3. **Use Framer Motion's hardware acceleration features** correctly
4. **Consider Firefox-specific fallbacks** for backdrop-filter

---

## Recommended Profiling Tools

### Chrome DevTools Performance Panel

**Why use it:** Most comprehensive animation profiling, with frame-by-frame analysis and layer visualization.

| Feature | How to Access | Use Case |
|---------|---------------|----------|
| FPS Meter | Rendering tab > Frame Rendering Stats | Real-time 60fps monitoring |
| Paint Flashing | Rendering tab > Paint Flashing | Identify unnecessary repaints (green flashes) |
| Layer Borders | Rendering tab > Layer Borders | Visualize compositor layers (orange outlines) |
| Paint Profiler | Performance tab > Enable advanced paint instrumentation | Detailed paint analysis |
| CPU Throttling | Performance tab > Capture Settings > 4x slowdown | Simulate mobile performance |

**Key shortcuts:**
- `Cmd+Shift+P` > "Show Rendering" to access rendering panel
- W/A/S/D keys to navigate Performance timeline
- Look for red bars in FPS chart = dropped frames

**What to look for:**
- Frame times exceeding 16.67ms (the 60fps budget)
- "Recalculate Style" and "Layout" events during animation
- Large paint areas (use Paint Profiler)

### Firefox Profiler

**Why use it:** Essential for Firefox-specific debugging, especially since backdrop-filter performance differs between browsers.

| Feature | How to Access | Use Case |
|---------|---------------|----------|
| Firefox Profiler | https://profiler.firefox.com/ or Shift+F5 | Full performance capture |
| Profiler Button | Enable via profiler.firefox.com | Quick toolbar access |
| Profile Sharing | Upload to Firefox Profiler storage | Share for debugging |

**Best practices:**
- Focus on "Recalculate Style", "Layout", and "Paint" activities
- Look for CSS animation offloading to compositor (efficient) vs main thread (slow)
- Compare profiles between Firefox and Chrome for the same animation

### Web Vitals Library (Measurement)

**Why use it:** Programmatic measurement of animation impact on interactivity.

```bash
npm install web-vitals
```

```typescript
import { onINP } from 'web-vitals/attribution';

onINP((metric) => {
  // INP > 200ms indicates animation blocking interactivity
  console.log('INP:', metric.value);
  console.log('Attribution:', metric.attribution);
});
```

**Target:** INP under 200ms during animations.

---

## Framer Motion Performance APIs

### GPU-Accelerated Properties (Use These)

Framer Motion automatically uses hardware acceleration for these properties:

| Property | GPU Accelerated | Notes |
|----------|-----------------|-------|
| `transform` (x, y, scale, rotate) | YES | Runs on compositor thread |
| `opacity` | YES | Runs on compositor thread |
| `filter` (drop-shadow, blur) | YES* | *Check browser support |
| `clipPath` | YES* | *Newer browsers only |

**Current DudoOverlay issues:**
- Animated `backdropFilter` in `initial`/`animate` - triggers repaint each frame
- Animated `textShadow` - NOT compositor-friendly, triggers paint
- Animated `backgroundColor` - triggers paint (though opacity change does not)

### Hardware Acceleration Control

```typescript
// Framer Motion uses willChange automatically for transform/opacity
// But you can hint for other properties:
<motion.div
  style={{
    willChange: 'transform, opacity' // Only when needed
  }}
  animate={{ x: 100, opacity: 0.5 }}
/>
```

**CRITICAL:** Do NOT set `willChange` permanently. Apply dynamically:

```typescript
const [isAnimating, setIsAnimating] = useState(false);

<motion.div
  style={{
    willChange: isAnimating ? 'transform, opacity' : 'auto'
  }}
  onAnimationStart={() => setIsAnimating(true)}
  onAnimationComplete={() => setIsAnimating(false)}
/>
```

### LazyMotion (Bundle Size Optimization)

**Current bundle:** ~34kb for full `motion` component
**With LazyMotion:** ~6kb initial + lazy-loaded features

```typescript
// features.ts
import { domAnimation } from "motion/react"
export default domAnimation

// Component.tsx
import { LazyMotion } from "motion/react"
import * as m from "motion/react-m"

const loadFeatures = () => import("./features").then(res => res.default)

function DudoOverlay() {
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.div animate={{ opacity: 1, scale: 1 }} />
    </LazyMotion>
  )
}
```

| Package | Size | Features |
|---------|------|----------|
| `domAnimation` | +18kb | Animations, variants, exit animations, gestures |
| `domMax` | +28kb | All above + drag, layout animations |

**Recommendation:** Use `domAnimation` for DudoOverlay (no drag/layout needed).

### useReducedMotion Hook

```typescript
import { useReducedMotion } from 'framer-motion';

function DudoOverlay() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion
        ? { opacity: 1 } // Simple fade
        : { opacity: 1, scale: [5, 0.9, 1.1, 1], rotate: [-5, 2, -1, 0] } // Full animation
      }
    />
  );
}
```

### useAnimationFrame Hook

For custom frame-synced logic:

```typescript
import { useAnimationFrame } from 'framer-motion';

function ParticleEffect() {
  useAnimationFrame((time, delta) => {
    // delta = time since last frame (target: ~16.67ms)
    // Use for physics calculations, particle updates
  });
}
```

---

## GPU-Accelerated vs CPU-Bound Properties

### Tier 1: Compositor-Only (Best Performance)

These properties animate on the compositor thread, never touching the main thread:

| Property | CSS | Framer Motion |
|----------|-----|---------------|
| Transform | `transform: translate/scale/rotate` | `x`, `y`, `scale`, `rotate` |
| Opacity | `opacity` | `opacity` |

**Why fast:** Browser creates a GPU layer and transforms it without recalculating layout or repainting.

### Tier 2: Paint-Only (Moderate Performance)

These trigger repaint but not layout:

| Property | Impact | Alternative |
|----------|--------|-------------|
| `background-color` | Repaint | Animate `opacity` of colored overlay instead |
| `box-shadow` | Repaint | Use `filter: drop-shadow()` or pseudo-element with opacity |
| `text-shadow` | Repaint | Pre-render text layers, animate `opacity` |
| `filter: blur()` | Repaint | Still better than box-shadow |

### Tier 3: Layout-Triggering (Avoid Animating)

These trigger full layout recalculation:

| Property | Never Animate |
|----------|---------------|
| `width`, `height` | Use `scale` instead |
| `top`, `left` | Use `transform: translate()` instead |
| `margin`, `padding` | Use `transform` instead |
| `font-size` | Pre-calculate sizes |

### DudoOverlay-Specific Optimizations

**Current problematic patterns in DudoOverlay.tsx:**

```typescript
// SLOW: Animating backdropFilter (line 56-58)
animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}

// BETTER: Static blur, animate opacity only
<motion.div
  style={{ backdropFilter: 'blur(8px)' }}
  animate={{ opacity: 1 }}
/>
```

```typescript
// SLOW: Animating textShadow (lines 152-156)
animate={{
  textShadow: [
    `0 0 20px ${glowColor}...`,
    `0 0 40px ${glowColor}...`,
  ]
}}

// BETTER: Pre-rendered glow layers with opacity animation
<motion.div
  className="glow-layer-small"
  style={{ textShadow: `0 0 20px ${glowColor}` }}
  animate={{ opacity: [1, 0] }}
/>
<motion.div
  className="glow-layer-large"
  style={{ textShadow: `0 0 40px ${glowColor}` }}
  animate={{ opacity: [0, 1] }}
/>
```

```typescript
// SLOW: Many individual particle elements (lines 214-250)
{[...Array(8)].map((_, i) => (
  <motion.div animate={{ x: endX, y: endY, scale: [0, 1.5, 0] }} />
))}

// BETTER: Single canvas or CSS-only particles
// Or use transform3d to force GPU layer per particle
```

---

## Browser-Specific Considerations

### Firefox vs Chrome: backdrop-filter

| Aspect | Chrome | Firefox |
|--------|--------|---------|
| Implementation | GPU-dependent | WebRender (CPU/GPU hybrid) |
| History | Always had it | Added in Firefox 103 |
| Performance | Generally fast | Fixed in WebRender, but can stutter on Android |
| Workaround needed | Rarely | Sometimes on lower-end devices |

**Firefox-specific workaround for backdrop-filter:**

```typescript
// Detect Firefox and use fallback
const isFirefox = typeof navigator !== 'undefined' &&
  navigator.userAgent.toLowerCase().includes('firefox');

// Option 1: Solid overlay instead of blur
<motion.div
  style={{
    background: isFirefox
      ? 'rgba(0, 0, 0, 0.85)' // Solid, no blur
      : 'rgba(0, 0, 0, 0.6)',
    backdropFilter: isFirefox ? 'none' : 'blur(8px)',
  }}
/>

// Option 2: Pseudo-element blur (better visual but more complex)
```

**Note:** Recent Firefox versions (103+) with WebRender have largely fixed backdrop-filter performance. Test on actual Firefox before implementing workarounds.

### SVG Filter Performance (feColorMatrix)

The DudoOverlay uses an SVG filter for glitch effects:

```typescript
// Current implementation (lines 186-212)
<filter id="glitch">
  <feColorMatrix ... />
  <feOffset dx="2" ... />
  <feBlend mode="screen" ... />
</filter>
```

**Performance notes:**
- SVG filters are applied per-frame during animation
- `feColorMatrix` is relatively fast
- `feBlend` and multiple filter stages add overhead
- Consider: Only apply filter during the 150ms glitch phase, not continuously

**Optimization:**

```typescript
// Only enable filter when glitch is active
style={{
  filter: showGlitch ? 'url(#glitch)' : 'none'
}}
```

This is already done in the current code (line 149), which is correct.

### Animation Frame Budget

| Target FPS | Frame Budget | Available for JS/CSS |
|------------|--------------|----------------------|
| 60 fps | 16.67ms | ~10ms (browser needs ~6ms) |
| 30 fps | 33.33ms | ~27ms (fallback target) |

**Testing methodology:**
1. Open Chrome DevTools Performance panel
2. Enable CPU 4x throttling (simulates mobile)
3. Record during DudoOverlay animation
4. Check if any frames exceed 16.67ms

---

## Recommended Implementation Order

### Phase 1: Profile and Measure (No Code Changes)

1. Set up Chrome Performance profiling with CPU throttling
2. Set up Firefox Profiler
3. Record baseline metrics during DudoOverlay display
4. Document specific frames/operations causing jank

### Phase 2: Quick Wins (Low Risk)

1. **Static backdrop-filter:** Remove `backdropFilter` from animation, make it a static style
2. **Conditional SVG filter:** Ensure filter is only applied during glitch phase (already done)
3. **Add useReducedMotion:** Provide simplified animation for accessibility

### Phase 3: Text-Shadow Optimization (Medium Risk)

1. Replace animated `textShadow` with layered opacity animation
2. Pre-render multiple glow intensities as separate elements
3. Cross-fade between layers using opacity

### Phase 4: LazyMotion (Bundle Optimization)

1. Implement `LazyMotion` wrapper
2. Switch from `motion` to `m` components
3. Use `domAnimation` feature set (not `domMax`)

### Phase 5: Firefox-Specific (If Needed After Testing)

1. Detect Firefox browser
2. Implement fallback for backdrop-filter if performance still poor
3. Consider reduced particle count for Firefox

---

## Sources

### Official Documentation (HIGH confidence)
- [Motion.dev Performance Guide](https://motion.dev/docs/performance)
- [Motion.dev Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size)
- [Motion.dev LazyMotion](https://motion.dev/docs/react-lazy-motion)
- [MDN will-change Property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)
- [MDN Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
- [Chrome DevTools Performance Reference](https://developer.chrome.com/docs/devtools/performance/reference)

### Browser-Specific (MEDIUM confidence)
- [Firefox Profiler](https://profiler.firefox.com/)
- [Firefox backdrop-filter Bug 1718471](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471) - Fixed
- [Firefox backdrop-filter Bug 1798592](https://bugzilla.mozilla.org/show_bug.cgi?id=1798592) - Android issues

### Community Resources (MEDIUM confidence)
- [Web.dev Animations Guide](https://web.dev/articles/animations-guide)
- [Smashing Magazine GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [Motion Magazine Performance Tier List](https://motion.dev/blog/web-animation-performance-tier-list)
- [Tobias Ahlin: Animate box-shadow with performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)

### Measurement Tools
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [DebugBear INP Guide](https://www.debugbear.com/docs/metrics/interaction-to-next-paint)
