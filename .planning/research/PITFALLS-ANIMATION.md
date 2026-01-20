# Pitfalls Research: Animation Performance

**Domain:** Browser game animation (Framer Motion overlay effects)
**Researched:** 2026-01-20
**Confidence:** HIGH (verified with official documentation and browser bug trackers)

## Executive Summary

The Dudo/Calza overlay is slow because it likely combines multiple expensive operations: animated backdrop-filter blur, SVG filters, multi-layer text-shadow animation, and particle animations. Firefox is particularly affected because its backdrop-filter implementation is slower than Chrome's, and it has known issues with blur + transform combinations. The fixes are straightforward but require replacing animated properties with opacity-based alternatives.

---

## Critical Pitfalls

### 1. Animated backdrop-filter (blur) - Firefox Killer

**Warning signs:**
- Overlay animations stutter or freeze on Firefox
- CPU spikes when modal/overlay appears
- Animation works on Chrome but breaks on Firefox
- Performance degrades on larger screens

**Why it's slow:**
The `backdrop-filter` property requires the browser to:
1. Render ALL content behind the element first
2. Capture that rendered content as a GPU texture
3. Apply the blur filter to that texture
4. Composite the result with the element

This is fundamentally expensive because it breaks the "stacking context atomicity" - the browser cannot optimize by painting layers independently. When you ANIMATE this property (changing blur values), this entire process repeats every frame.

Firefox's implementation is particularly slow. Bug reports show backdrop-filter causing pages to become "very laggy" with even moderate usage. While patches have improved this, Firefox still struggles compared to Chrome, especially on non-trivial blur values or larger viewport sizes.

**Fix:**
1. **Do not animate backdrop-filter values** - Set a static blur value, animate only opacity
2. **Use pseudo-element trick**: Create a blurred background layer with `::before`, animate its opacity instead:
   ```css
   .overlay::before {
     content: '';
     position: absolute;
     inset: 0;
     backdrop-filter: blur(10px);
     opacity: 0;
     transition: opacity 0.3s;
   }
   .overlay.visible::before {
     opacity: 1;
   }
   ```
3. **Firefox fallback**: Use `@supports not (-moz-appearance: none)` to provide simpler effects for Firefox
4. **Reduce blur radius**: Keep blur values below 10px when possible

---

### 2. SVG Filters Are Performance Crimes

**Warning signs:**
- Fan noise increases during animation
- FPS drops below 15 on larger viewports
- Animation smooth at small sizes, stutters when viewport increases
- DevTools shows high paint/composite times

**Why it's slow:**
SVG filters are described as "the performance crimes kingpin" in browser rendering. They are NOT consistently GPU-accelerated across browsers:
- Chrome accelerates some primitives, Firefox accelerates others
- Some Android hardware cannot accelerate any
- Compound filters (chaining multiple primitives) are especially slow
- Any change to a filtered element requires complete filter recalculation

Bug reports show SVG filter animations dropping to "less than 8fps" at 1080p resolution, even with WebRender enabled in Firefox (improving only to 10-12fps).

**Fix:**
1. **Avoid animating filtered elements entirely** - If you must filter, do not animate the element or its children
2. **Use CSS filter shorthands instead of SVG filters** - `filter: blur()` performs better than `<feGaussianBlur>`
3. **Safari exception**: Safari handles CSS filter shorthands reasonably, but still struggles with SVG `<filter>`
4. **Pre-render to static image**: For complex effects, consider rendering once and animating opacity
5. **Reduce filter complexity**: Avoid chaining multiple filter primitives

---

### 3. Animated text-shadow with Multiple Layers

**Warning signs:**
- Text animations stutter, especially on mobile
- High paint times in DevTools Performance panel
- Glow effects cause visible lag
- Animation smooth without shadow, janky with it

**Why it's slow:**
Text shadow rendering requires:
1. Rendering the text
2. Creating offset copies for each shadow layer
3. Applying blur to each shadow (expensive!)
4. Compositing all layers together

When you animate shadow values (offset, blur, spread), this entire process runs every frame. Multiple shadow layers multiply the cost. Large blur radii are especially expensive as blur is O(n^2) with radius.

Unlike `box-shadow`, there is no pseudo-element trick for `text-shadow` because it is tied to the text content itself.

**Fix:**
1. **Do not animate text-shadow values directly** - Pre-render shadows at target values, animate opacity
2. **Duplicate text technique**: Stack two text elements - one with shadow (hidden), one without. Crossfade using opacity:
   ```jsx
   <div className="relative">
     <span className="text-glow opacity-0 transition-opacity">DUDO</span>
     <span className="absolute inset-0">DUDO</span>
   </div>
   ```
3. **Reduce shadow layers**: Use 1-2 shadows max, not 4-5 for "realistic" glow
4. **Minimize blur radius**: Keep blur under 10px for animated elements
5. **Consider CSS `filter: drop-shadow()`**: Sometimes performs better than text-shadow for single shadows

---

### 4. Too Many Simultaneous Particle Animations (8+ divs)

**Warning signs:**
- Animation starts smooth, becomes choppy after a few seconds
- Memory usage climbs during animation
- Mobile devices struggle more than desktop
- DevTools shows many paint operations

**Why it's slow:**
Each animated div creates compositor overhead. While CSS/Framer Motion animations using `transform` and `opacity` are GPU-accelerated, there is still cost per element:
- Layer promotion memory cost
- Compositor thread scheduling
- DOM node overhead for style recalculation

8 particles is at the threshold where problems emerge, especially if particles also have shadows, filters, or other expensive properties.

**Fix:**
1. **Canvas for high particle counts**: If you need 8+ particles, use Canvas API or WebGL instead of DOM elements
2. **Reduce particle count**: 4-6 particles often achieves similar visual effect with better performance
3. **Ensure particles use ONLY transform/opacity**: No shadows, filters, or blur on particles
4. **Stagger removal**: Do not create/destroy many particles simultaneously
5. **Pool and reuse**: Reuse particle elements instead of creating/destroying
6. **Use requestAnimationFrame for JS-controlled particles**: Avoids layout thrashing

---

## Firefox-Specific Pitfalls

### 5. Firefox Backdrop-Filter Memory Bug

**Warning signs:**
- Firefox memory usage grows over time
- Performance degrades the longer the page is open
- Closing and reopening tab "fixes" performance temporarily

**Why it happens:**
Firefox retains `will-change` hints for too long when used with backdrop-filter, consuming excessive memory. This is a documented browser bug.

**Fix:**
- Remove `will-change` after animation completes (use JS to toggle)
- Do not set `will-change: backdrop-filter` permanently in CSS
- Consider disabling backdrop-filter entirely for Firefox users

### 6. Firefox blur + transform Combination

**Warning signs:**
- Elements with both blur and transform animate poorly
- Static blur OK, animated transform with blur is slow

**Why it happens:**
The slowness specifically occurs when CSS blur filter is used together with CSS transform, or when blur is on an element whose children have transform transitions.

**Fix:**
- Separate blur and transform into different elements
- Apply blur to a static container, animate transform on a child
- Use `will-change: transform` on the animated element (not the blurred one)

### 7. Firefox WebRender Inconsistencies

**Warning signs:**
- Animation performance varies between Firefox installations
- Some users report smooth, others report lag
- Works fine on some hardware, breaks on others

**Why it happens:**
Firefox's WebRender (hardware compositor) is disabled on some hardware configurations. Users may be running in software rendering mode without knowing.

**Detection:**
Check `about:support` > "Compositing" row:
- "WebRender" = hardware accelerated
- "WebRender (software)" = software fallback (slow)

**Fix:**
- Accept that some Firefox users will have degraded experience
- Provide simpler fallback effects for Firefox
- Test on Firefox with both WebRender enabled and disabled

---

## Framer Motion Pitfalls

### 8. Animating Layout Properties Instead of Transforms

**Warning signs:**
- Using Framer Motion to animate `width`, `height`, `margin`, `padding`
- Animations feel "heavy" compared to simple transforms
- Layout shifts during animation

**Why it's slow:**
Animating layout properties triggers browser reflow on every frame. Even though Framer Motion is smooth, the browser must recalculate layout for the entire page.

**Fix:**
- Use `layout` prop for size changes - Framer Motion will use transforms under the hood
- Animate `scale` instead of `width`/`height` when possible
- If you must animate size, use `layout` prop and accept some overhead

### 9. AnimatePresence with layout Prop Conflicts

**Warning signs:**
- Exit animations do not play or play partially
- Elements disappear instantly instead of animating out
- Works if you wait between interactions, breaks with fast clicks

**Why it happens:**
AnimatePresence does not reliably perform exit animations when children have the `layout` prop, especially if a current exit animation is in progress.

**Fix:**
- Use `mode="popLayout"` on AnimatePresence
- Wrap in `LayoutGroup` if mixing exit and layout animations
- Ensure parent has `position: relative` (not static)
- For critical overlays, avoid mixing `layout` and exit animations

### 10. Overusing willChange in Framer Motion

**Warning signs:**
- Memory usage high even when not animating
- Mobile devices slow down over time
- DevTools shows many compositor layers

**Why it happens:**
Framer Motion's `willChange` prop (or CSS `will-change`) promotes elements to GPU layers. Too many layers exhaust GPU memory.

**Fix:**
- Do not set `willChange` on many elements simultaneously
- Remove `will-change` after animation completes:
  ```jsx
  <motion.div
    onAnimationComplete={() => setWillChange(false)}
    style={{ willChange: willChange ? 'transform' : 'auto' }}
  />
  ```
- Let Framer Motion manage this automatically in most cases

### 11. Exit Animations Breaking Due to Improper Keys

**Warning signs:**
- Exit animations stop working after list reorder
- Some items animate out, others disappear
- Using array index as React key

**Why it happens:**
AnimatePresence tracks elements by key. If you use index as key, the key can be reassigned to a different component when items reorder, breaking animation tracking.

**Fix:**
- Always use unique, stable IDs as keys: `key={item.id}` not `key={index}`
- Ensure keys do not change between renders for the same logical item

### 12. CSS Variable Animations Trigger Paint

**Warning signs:**
- Animating CSS custom properties (variables)
- Paint flashing in DevTools during animation
- Animation not as smooth as transform animations

**Why it happens:**
Animating CSS variables always triggers paint - they cannot be compositor-accelerated.

**Fix:**
- Use Framer Motion's MotionValues instead of CSS variables for animations
- Pre-calculate values and animate standard properties
- Accept paint cost for CSS variable animations (they are inherently slower)

---

## Quick Reference: What Is Safe to Animate

| Property | Performance | Notes |
|----------|-------------|-------|
| `transform` | Excellent | GPU-accelerated, no layout/paint |
| `opacity` | Excellent | GPU-accelerated, no layout/paint |
| `filter: blur()` | OK | Accelerated in most browsers |
| `background-color` | OK | Triggers paint but not layout |
| `backdrop-filter` | Poor | Expensive, especially animated |
| `text-shadow` | Poor | Expensive with multiple layers |
| `box-shadow` | Poor | Use pseudo-element trick |
| `width`/`height` | Poor | Triggers layout reflow |
| SVG `<filter>` | Very Poor | Inconsistent acceleration |

---

## Recommended Fix Priority for Dudo/Calza Overlay

Based on the known issues (animated backdrop-filter blur, SVG filters, animated text-shadow, 8 particles):

1. **FIRST: backdrop-filter** - This is likely the Firefox killer. Change from animated blur to static blur with animated opacity.

2. **SECOND: text-shadow animation** - Replace with dual-element crossfade technique.

3. **THIRD: SVG filters** - Remove or replace with CSS filter shorthands. If decorative, remove entirely for performance mode.

4. **FOURTH: Particle count** - Reduce from 8 to 4-6, ensure particles only animate transform/opacity.

---

## Sources

### Browser Bug Reports
- [Mozilla Bug 1798592 - Slow backdrop-filter:blur](https://bugzilla.mozilla.org/show_bug.cgi?id=1798592)
- [Mozilla Bug 1718471 - backdrop-filter: blur is laggy with many elements](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471)
- [Mozilla Bug 1583828 - Slow SVG filter animation](https://bugzilla.mozilla.org/show_bug.cgi?id=1583828)
- [Mozilla Bug 1566942 - Very slow animations with SVG filters](https://bugzilla.mozilla.org/show_bug.cgi?id=1566942)
- [GitHub Issue #441 - Framer Motion laggy in Firefox](https://github.com/framer/motion/issues/441)
- [GitHub Issue #1983 - AnimatePresence not working with layout animations](https://github.com/framer/motion/issues/1983)

### Official Documentation
- [MDN - CSS will-change property](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [MDN - CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [Motion.dev - AnimatePresence documentation](https://motion.dev/docs/react-animate-presence)
- [Motion.dev - Layout animations](https://www.framer.com/motion/layout-animations/)
- [Chrome Developers - Hardware-accelerated animation capabilities](https://developer.chrome.com/blog/hardware-accelerated-animations)

### Performance Guides
- [Tobias Ahlin - How to animate box-shadow with smooth performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)
- [SitePoint - CSS Box Shadow Animation Performance](https://www.sitepoint.com/css-box-shadow-animation-performance/)
- [O'Reilly - Planning for Performance with SVG](https://oreillymedia.github.io/Using_SVG/extras/ch19-performance.html)
- [LogRocket - When and how to use CSS will-change](https://blog.logrocket.com/when-how-use-css-will-change/)
- [Maxime Heckel - Framer Motion layout animations](https://blog.maximeheckel.com/posts/framer-motion-layout-animations/)
- [DEV Community - Optimizing Performance in CSS Animations](https://dev.to/nasehbadalov/optimizing-performance-in-css-animations-what-to-avoid-and-how-to-improve-it-bfa)

### Framer Motion Resources
- [GitHub Issue #442 - Performance Guide request](https://github.com/framer/motion/issues/442)
- [TillItsDone - Framer Motion Tips for Performance in React](https://tillitsdone.com/blogs/framer-motion-performance-tips/)
- [Goodspeed Studio - Troubleshooting Framer Performance Issues](https://goodspeed.studio/blog/how-to-troubleshoot-common-framer-performance-issues)
