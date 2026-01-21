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
  const dark = `hsl(${hue}, ${sat}%, ${light - 25}%)`;
  const darker = `hsl(${hue}, ${sat}%, ${light - 35}%)`;
  return { bg, border, shadow, glow, dark, darker };
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

    let animationFrame: number;
    let startTime: number | null = null;
    const cycleDuration = 10000;

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

  // Die face component - sharp edges, no rounded corners
  const renderFace = (dots: number, faceStyle: React.CSSProperties) => (
    <div
      className="absolute flex items-center justify-center"
      style={{
        width: '100px',
        height: '100px',
        ...faceStyle,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: colorConfig.bg,
        border: `2px solid ${colorConfig.border}`,
        boxShadow: `inset 0 0 20px ${colorConfig.darker}`,
      }}
    >
      <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
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

  const dieSize = 100;
  const halfSize = dieSize / 2;
  const circleSize = 200; // Circle around the die

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-40"
        style={{ background: colorConfig.glow }}
      />

      {/* Main emblem container */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 1, bounce: 0.3 }}
      >
        {/* SVG with curved text and circle */}
        <svg
          width={circleSize + 80}
          height={circleSize + 80}
          viewBox={`0 0 ${circleSize + 80} ${circleSize + 80}`}
          className="overflow-visible"
        >
          {/* Definitions for text paths */}
          <defs>
            {/* Top arc for "LAST" */}
            <path
              id="topArc"
              d={`M ${(circleSize + 80) / 2 - 80} ${(circleSize + 80) / 2}
                  A 80 80 0 0 1 ${(circleSize + 80) / 2 + 80} ${(circleSize + 80) / 2}`}
              fill="none"
            />
            {/* Bottom arc for "DIE" */}
            <path
              id="bottomArc"
              d={`M ${(circleSize + 80) / 2 + 70} ${(circleSize + 80) / 2 + 10}
                  A 80 80 0 0 1 ${(circleSize + 80) / 2 - 70} ${(circleSize + 80) / 2 + 10}`}
              fill="none"
            />
          </defs>

          {/* Outer circle */}
          <circle
            cx={(circleSize + 80) / 2}
            cy={(circleSize + 80) / 2}
            r={circleSize / 2 + 10}
            fill="none"
            stroke={colorConfig.border}
            strokeWidth="3"
            style={{
              filter: `drop-shadow(0 0 10px ${colorConfig.glow})`,
            }}
          />

          {/* Inner glow circle */}
          <circle
            cx={(circleSize + 80) / 2}
            cy={(circleSize + 80) / 2}
            r={circleSize / 2 + 5}
            fill="none"
            stroke={colorConfig.glow}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* "LAST" curved text at top */}
          <text
            fill={colorConfig.bg}
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '0.15em',
              filter: `drop-shadow(0 0 10px ${colorConfig.glow})`,
            }}
          >
            <textPath
              href="#topArc"
              startOffset="50%"
              textAnchor="middle"
            >
              LAST
            </textPath>
          </text>

          {/* "DIE" curved text at bottom */}
          <text
            fill={colorConfig.bg}
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '0.2em',
              filter: `drop-shadow(0 0 10px ${colorConfig.glow})`,
            }}
          >
            <textPath
              href="#bottomArc"
              startOffset="50%"
              textAnchor="middle"
            >
              DIE
            </textPath>
          </text>
        </svg>

        {/* 3D Die centered in the circle */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            perspective: '600px',
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
              transform: prefersReducedMotion ? 'rotateX(-20deg) rotateY(45deg)' : undefined,
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
        </div>
      </motion.div>

      {/* "THE" text above */}
      <motion.div
        className="relative z-10 -mb-4 -mt-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span
          className="text-lg font-bold tracking-[0.5em] uppercase"
          style={{
            color: colorConfig.border,
            textShadow: `0 0 15px ${colorConfig.glow}`,
          }}
        >
          THE
        </span>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-xs text-white-soft/50 tracking-widest uppercase mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Liar&apos;s Dice
      </motion.p>
    </div>
  );
}

export default CasinoLogo;
