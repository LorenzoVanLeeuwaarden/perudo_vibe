'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PlayerColor } from '@/lib/types';

// Color stops for smooth cycling
const COLOR_CYCLE = [
  { hue: 0, sat: 70, light: 55, name: 'red' },
  { hue: 25, sat: 90, light: 55, name: 'orange' },
  { hue: 45, sat: 90, light: 55, name: 'yellow' },
  { hue: 140, sat: 60, light: 45, name: 'green' },
  { hue: 210, sat: 70, light: 55, name: 'blue' },
  { hue: 270, sat: 60, light: 55, name: 'purple' },
];

interface CasinoLogoProps {
  color?: PlayerColor;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function generateColorConfig(hue: number, sat: number, light: number) {
  const bg = `hsl(${hue}, ${sat}%, ${light}%)`;
  const bgSolid = `hsl(${hue}, ${sat}%, ${light}%)`; // Fully opaque
  const border = `hsl(${hue}, ${sat}%, ${light + 15}%)`;
  const shadow = `hsl(${hue}, ${sat}%, ${light - 20}%)`;
  const glow = `hsla(${hue}, ${sat}%, ${light}%, 0.6)`;
  const dark = `hsl(${hue}, ${sat}%, ${light - 25}%)`;
  const darker = `hsl(${hue}, ${sat}%, ${light - 35}%)`;
  return { bg, bgSolid, border, shadow, glow, dark, darker };
}

// Dot positions for each die face
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
};

export function CasinoLogo({ color }: CasinoLogoProps = {}) {
  const prefersReducedMotion = useReducedMotion();

  const fixedColorConfig = useMemo(() => {
    if (!color) return null;
    const colorData = COLOR_CYCLE.find(c => c.name === color);
    return generateColorConfig(
      colorData?.hue ?? 45,
      colorData?.sat ?? 90,
      colorData?.light ?? 55
    );
  }, [color]);

  const [colorConfig, setColorConfig] = useState(() =>
    fixedColorConfig ?? generateColorConfig(45, 90, 55)
  );

  // Color cycling animation
  useEffect(() => {
    if (fixedColorConfig) {
      setColorConfig(fixedColorConfig);
      return;
    }

    // Don't skip color cycling for reduced motion - just skip the die rotation
    let animationFrame: number;
    let startTime: number | null = null;
    const cycleDuration = 10000; // 10 seconds for full cycle

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % cycleDuration) / cycleDuration;

      const totalStops = COLOR_CYCLE.length;
      const scaledProgress = progress * totalStops;
      const currentIndex = Math.floor(scaledProgress);
      const nextIndex = (currentIndex + 1) % totalStops;
      const localProgress = scaledProgress - currentIndex;

      const current = COLOR_CYCLE[currentIndex];
      const next = COLOR_CYCLE[nextIndex];

      let hueFrom = current.hue;
      let hueTo = next.hue;
      if (Math.abs(hueTo - hueFrom) > 180) {
        if (hueTo > hueFrom) hueFrom += 360;
        else hueTo += 360;
      }

      const hue = lerp(hueFrom, hueTo, localProgress) % 360;
      const sat = lerp(current.sat, next.sat, localProgress);
      const light = lerp(current.light, next.light, localProgress);

      setColorConfig(generateColorConfig(hue, sat, light));
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [fixedColorConfig]);

  // Die face component - renders inline to access colorConfig
  const renderFace = (dots: number, faceStyle: React.CSSProperties) => (
    <div
      className="absolute rounded-xl flex items-center justify-center"
      style={{
        width: '120px',
        height: '120px',
        ...faceStyle,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: colorConfig.bg,
        border: `3px solid ${colorConfig.border}`,
        boxShadow: `inset 0 0 30px ${colorConfig.darker}`,
      }}
    >
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
        {DOT_POSITIONS[dots]?.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="10"
            fill="#0d0416"
          />
        ))}
      </svg>
    </div>
  );

  const dieSize = 120;
  const halfSize = dieSize / 2;

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-50"
        style={{ background: colorConfig.glow }}
      />

      {/* "THE" text - small above */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span
          className="text-xl md:text-2xl font-bold tracking-[0.4em] uppercase"
          style={{
            color: colorConfig.border,
            textShadow: `0 0 20px ${colorConfig.glow}`,
          }}
        >
          THE
        </span>
      </motion.div>

      {/* Big 3D Die - Central Focus */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotateZ: -180 }}
        animate={{ scale: 1, rotateZ: 0 }}
        transition={{ type: 'spring', duration: 0.8, bounce: 0.3 }}
        style={{
          perspective: '800px',
          perspectiveOrigin: 'center center',
        }}
      >
        <div
          className={prefersReducedMotion ? '' : 'animate-spin-die'}
          style={{
            width: `${dieSize}px`,
            height: `${dieSize}px`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: prefersReducedMotion ? 'rotateX(-15deg) rotateY(45deg)' : undefined,
          }}
        >
          {/* Front face - 1 */}
          {renderFace(1, { transform: `translateZ(${halfSize}px)` })}
          {/* Back face - 6 */}
          {renderFace(6, { transform: `rotateY(180deg) translateZ(${halfSize}px)` })}
          {/* Right face - 3 */}
          {renderFace(3, { transform: `rotateY(90deg) translateZ(${halfSize}px)` })}
          {/* Left face - 4 */}
          {renderFace(4, { transform: `rotateY(-90deg) translateZ(${halfSize}px)` })}
          {/* Top face - 2 */}
          {renderFace(2, { transform: `rotateX(90deg) translateZ(${halfSize}px)` })}
          {/* Bottom face - 5 */}
          {renderFace(5, { transform: `rotateX(-90deg) translateZ(${halfSize}px)` })}
        </div>
      </motion.div>

      {/* "LAST" text */}
      <motion.div
        className="relative z-10 -mt-2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <h1
          className="text-5xl md:text-6xl font-black tracking-tight"
          style={{
            color: colorConfig.bg,
            textShadow: `
              0 0 10px ${colorConfig.glow},
              0 0 30px ${colorConfig.glow},
              0 4px 0 ${colorConfig.shadow}
            `,
            WebkitTextStroke: `1px ${colorConfig.border}`,
          }}
        >
          LAST
        </h1>
      </motion.div>

      {/* "DIE" text - emphasized */}
      <motion.div
        className="relative z-10 -mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2
          className="text-7xl md:text-8xl font-black tracking-wider"
          style={{
            color: colorConfig.bg,
            textShadow: `
              0 0 20px ${colorConfig.glow},
              0 0 40px ${colorConfig.glow},
              0 0 60px ${colorConfig.glow},
              0 5px 0 ${colorConfig.shadow},
              0 8px 0 ${colorConfig.dark}
            `,
            WebkitTextStroke: `2px ${colorConfig.border}`,
          }}
        >
          DIE
        </h2>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-sm text-white-soft/60 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Liar&apos;s Dice
      </motion.p>

      {/* Decorative line */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="h-px w-16 md:w-20" style={{ background: colorConfig.border }} />
        <div
          className="w-2 h-2 rotate-45"
          style={{ background: colorConfig.bg, boxShadow: `0 0 10px ${colorConfig.glow}` }}
        />
        <div className="h-px w-16 md:w-20" style={{ background: colorConfig.border }} />
      </motion.div>

    </div>
  );
}

export default CasinoLogo;
