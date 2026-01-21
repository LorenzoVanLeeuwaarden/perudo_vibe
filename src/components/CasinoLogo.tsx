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
  const border = `hsl(${hue}, ${sat}%, ${light + 15}%)`;
  const shadow = `hsl(${hue}, ${sat}%, ${light - 20}%)`;
  const glow = `hsla(${hue}, ${sat}%, ${light}%, 0.6)`;
  const dark = `hsl(${hue}, ${sat}%, ${light - 30}%)`;
  return { bg, border, shadow, glow, dark };
}

// 3D Die face component
function DieFace({
  dots,
  transform,
  colorConfig
}: {
  dots: number;
  transform: string;
  colorConfig: ReturnType<typeof generateColorConfig>;
}) {
  const dotPositions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };

  return (
    <div
      className="absolute w-full h-full rounded-2xl border-2 flex items-center justify-center"
      style={{
        transform,
        backfaceVisibility: 'hidden',
        background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colorConfig.dark} 100%)`,
        borderColor: colorConfig.border,
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.3), 0 0 30px ${colorConfig.glow}`,
      }}
    >
      <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
        {dotPositions[dots]?.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="12"
            fill="#0d0416"
            style={{
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function CasinoLogo({ color }: CasinoLogoProps = {}) {
  const prefersReducedMotion = useReducedMotion();
  const [rotation, setRotation] = useState({ x: -20, y: 45 });

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

    if (prefersReducedMotion) {
      setColorConfig(generateColorConfig(45, 90, 55));
      return;
    }

    let animationFrame: number;
    let startTime: number | null = null;
    const cycleDuration = 12000;

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
  }, [prefersReducedMotion, fixedColorConfig]);

  // Continuous die rotation
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animationFrame: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Slow, smooth rotation
      const y = (elapsed * 0.02) % 360;
      const x = -20 + Math.sin(elapsed * 0.001) * 10;

      setRotation({ x, y });
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [prefersReducedMotion]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-40"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
          className="text-2xl md:text-3xl font-black tracking-[0.5em] uppercase"
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
        transition={{ type: 'spring', duration: 1, bounce: 0.3 }}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-32 h-32 md:w-40 md:h-40"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {/* Front - 1 */}
          <DieFace dots={1} transform="translateZ(64px)" colorConfig={colorConfig} />
          {/* Back - 6 */}
          <DieFace dots={6} transform="translateZ(-64px) rotateY(180deg)" colorConfig={colorConfig} />
          {/* Right - 3 */}
          <DieFace dots={3} transform="translateX(64px) rotateY(90deg)" colorConfig={colorConfig} />
          {/* Left - 4 */}
          <DieFace dots={4} transform="translateX(-64px) rotateY(-90deg)" colorConfig={colorConfig} />
          {/* Top - 2 */}
          <DieFace dots={2} transform="translateY(-64px) rotateX(90deg)" colorConfig={colorConfig} />
          {/* Bottom - 5 */}
          <DieFace dots={5} transform="translateY(64px) rotateX(-90deg)" colorConfig={colorConfig} />
        </div>
      </motion.div>

      {/* "LAST" text - Large, main word */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <h1
          className="text-5xl md:text-7xl font-black tracking-tight"
          style={{
            color: colorConfig.bg,
            textShadow: `
              0 0 10px ${colorConfig.glow},
              0 0 30px ${colorConfig.glow},
              0 4px 0 ${colorConfig.shadow},
              0 6px 0 ${colorConfig.dark}
            `,
            WebkitTextStroke: `1px ${colorConfig.border}`,
          }}
        >
          LAST
        </h1>
      </motion.div>

      {/* "DIE" text - emphasized with special styling */}
      <motion.div
        className="relative z-10 -mt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.h2
          className="text-6xl md:text-8xl font-black tracking-wider"
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
          animate={{
            textShadow: [
              `0 0 20px ${colorConfig.glow}, 0 0 40px ${colorConfig.glow}, 0 0 60px ${colorConfig.glow}, 0 5px 0 ${colorConfig.shadow}, 0 8px 0 ${colorConfig.dark}`,
              `0 0 30px ${colorConfig.glow}, 0 0 60px ${colorConfig.glow}, 0 0 80px ${colorConfig.glow}, 0 5px 0 ${colorConfig.shadow}, 0 8px 0 ${colorConfig.dark}`,
              `0 0 20px ${colorConfig.glow}, 0 0 40px ${colorConfig.glow}, 0 0 60px ${colorConfig.glow}, 0 5px 0 ${colorConfig.shadow}, 0 8px 0 ${colorConfig.dark}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          DIE
        </motion.h2>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-sm md:text-base text-white-soft/60 tracking-widest uppercase mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Liar&apos;s Dice
      </motion.p>

      {/* Decorative line */}
      <motion.div
        className="flex items-center gap-3 mt-1"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="h-px w-16 md:w-24" style={{ background: colorConfig.border }} />
        <div
          className="w-2 h-2 rotate-45"
          style={{ background: colorConfig.bg, boxShadow: `0 0 10px ${colorConfig.glow}` }}
        />
        <div className="h-px w-16 md:w-24" style={{ background: colorConfig.border }} />
      </motion.div>
    </div>
  );
}

export default CasinoLogo;
