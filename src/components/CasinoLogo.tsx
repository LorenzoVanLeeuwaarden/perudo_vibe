'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PlayerColor } from '@/lib/types';

interface CasinoLogoProps {
  color?: PlayerColor;
  size?: 'sm' | 'md' | 'lg';
}

// Dark theme colors matching game UI
const COLORS = {
  teal: '#14b8a6',
  tealDark: '#0d9488',
  tealGlow: 'rgba(20, 184, 166, 0.6)',
  red: '#dc2626',
  redGlow: 'rgba(220, 38, 38, 0.4)',
  dark: '#0a1515',
  bone: '#e5e5e5',
  boneGlow: 'rgba(229, 229, 229, 0.3)',
};

// Pip positions for each face value (percentage-based)
const pipPositions: Record<number, { top: string; left: string }[]> = {
  1: [{ top: '50%', left: '50%' }],
  2: [
    { top: '25%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
  3: [
    { top: '25%', left: '25%' },
    { top: '50%', left: '50%' },
    { top: '75%', left: '75%' },
  ],
  4: [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '75%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
  5: [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '50%', left: '50%' },
    { top: '75%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
  6: [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '50%', left: '25%' },
    { top: '50%', left: '75%' },
    { top: '75%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
};

// Single die face with pips
function DieFace({
  value,
  className,
  style
}: {
  value: number;
  className?: string;
  style?: CSSProperties;
}) {
  const pips = pipPositions[value] || [];

  return (
    <div
      className={`absolute w-full h-full ${className}`}
      style={{
        background: 'linear-gradient(145deg, #0f2828 0%, #0a1a1a 100%)',
        border: `3px solid ${COLORS.teal}`,
        boxShadow: `
          inset 0 0 30px rgba(20, 184, 166, 0.3),
          0 0 20px rgba(20, 184, 166, 0.6),
          0 0 40px rgba(20, 184, 166, 0.3)
        `,
        backfaceVisibility: 'hidden',
        ...style,
      }}
    >
      {pips.map((pos, i) => (
        <div
          key={i}
          className="absolute w-[18%] h-[18%] rounded-full transform -translate-x-1/2 -translate-y-1/2"
          style={{
            top: pos.top,
            left: pos.left,
            background: 'radial-gradient(circle at 30% 30%, #ffffff, #14b8a6)',
            boxShadow: `
              0 0 12px rgba(20, 184, 166, 0.9),
              0 0 24px rgba(20, 184, 166, 0.6),
              0 0 36px rgba(20, 184, 166, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.5)
            `,
          }}
        />
      ))}
    </div>
  );
}

// 3D Rotating Die
function GlowingDie3D({ size = 100 }: { size?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const halfSize = size / 2;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: '800px',
      }}
    >
      {/* Glow effect behind die */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(circle, rgba(20, 184, 166, 0.9) 0%, rgba(20, 184, 166, 0.4) 40%, transparent 70%)`,
          filter: 'blur(20px)',
          transform: 'scale(2)',
        }}
        animate={!prefersReducedMotion ? {
          opacity: [0.6, 1, 0.6],
          scale: [1.8, 2.2, 1.8],
        } : {}}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary glow layer for more intensity */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(circle, rgba(20, 184, 166, 0.7) 0%, transparent 50%)`,
          filter: 'blur(10px)',
          transform: 'scale(1.3)',
        }}
        animate={!prefersReducedMotion ? {
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 3D Die cube with hue rotation */}
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={!prefersReducedMotion ? {
          rotateX: ['-15deg', '15deg', '-15deg', '25deg', '-15deg'],
          rotateY: ['0deg', '120deg', '240deg', '360deg'],
          rotateZ: ['0deg', '5deg', '-5deg', '0deg'],
        } : {
          rotateX: '-15deg',
          rotateY: '-25deg',
        }}
        transition={{
          rotateX: {
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          rotateY: {
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          },
          rotateZ: {
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        {/* Front face - showing 1 (THE LAST one) */}
        <DieFace
          value={1}
          className="rounded-lg"
          style={{
            transform: `translateZ(${halfSize}px)`,
          }}
        />

        {/* Back face - 6 */}
        <DieFace
          value={6}
          className="rounded-lg"
          style={{
            transform: `rotateY(180deg) translateZ(${halfSize}px)`,
          }}
        />

        {/* Right face - 3 */}
        <DieFace
          value={3}
          className="rounded-lg"
          style={{
            transform: `rotateY(90deg) translateZ(${halfSize}px)`,
          }}
        />

        {/* Left face - 4 */}
        <DieFace
          value={4}
          className="rounded-lg"
          style={{
            transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
          }}
        />

        {/* Top face - 2 */}
        <DieFace
          value={2}
          className="rounded-lg"
          style={{
            transform: `rotateX(90deg) translateZ(${halfSize}px)`,
          }}
        />

        {/* Bottom face - 5 */}
        <DieFace
          value={5}
          className="rounded-lg"
          style={{
            transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
          }}
        />
      </motion.div>

      {/* Shadow beneath */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: '-15%',
          width: '80%',
          height: '20%',
          background: `radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)`,
          filter: 'blur(4px)',
        }}
      />
    </div>
  );
}

export function CasinoLogo({ size = 'lg' }: CasinoLogoProps = {}) {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: { die: 70, title: 'text-2xl', sub: 'text-xs', spacing: 'gap-3' },
    md: { die: 100, title: 'text-4xl', sub: 'text-sm', spacing: 'gap-4' },
    lg: { die: 130, title: 'text-5xl md:text-6xl', sub: 'text-sm md:text-base', spacing: 'gap-5' },
  };

  const config = sizes[size];

  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${COLORS.tealGlow} 0%, transparent 70%)`,
        }}
        animate={!prefersReducedMotion ? {
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main content - single hue-rotate wrapper for die + LAST sync */}
      <div className={`relative z-10 flex flex-col items-center die-hue-rotate ${config.spacing}`}>

        {/* 3D Glowing Die */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
        >
          <GlowingDie3D size={config.die} />
        </motion.div>

        {/* Typography */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* THE LAST DIE - stacked */}
          <div className="flex flex-col items-center -space-y-1">
            <span
              className={`${config.sub} font-semibold tracking-[0.4em] uppercase`}
              style={{
                color: '#ffffff',
                textShadow: `0 0 20px rgba(255, 255, 255, 0.4)`,
              }}
            >
              THE
            </span>

            <motion.h1
              className={`${config.title} font-black tracking-tight`}
              style={{
                color: COLORS.teal,
                textShadow: `
                  0 0 30px ${COLORS.tealGlow},
                  0 0 60px ${COLORS.tealGlow},
                  0 4px 0 ${COLORS.dark}
                `,
              }}
              animate={!prefersReducedMotion ? {
                textShadow: [
                  `0 0 30px ${COLORS.tealGlow}, 0 0 60px ${COLORS.tealGlow}, 0 4px 0 ${COLORS.dark}`,
                  `0 0 40px ${COLORS.tealGlow}, 0 0 80px ${COLORS.tealGlow}, 0 4px 0 ${COLORS.dark}`,
                  `0 0 30px ${COLORS.tealGlow}, 0 0 60px ${COLORS.tealGlow}, 0 4px 0 ${COLORS.dark}`,
                ],
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              LAST
            </motion.h1>

            <span
              className={`${config.sub} font-semibold tracking-[0.4em] uppercase`}
              style={{
                color: '#ffffff',
                textShadow: `0 0 20px rgba(255, 255, 255, 0.4)`,
              }}
            >
              DIE
            </span>
          </div>

          {/* Decorative line with danger accent */}
          <motion.div
            className="flex items-center gap-3 mt-4"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div
              className="h-px w-8 md:w-12"
              style={{ background: `linear-gradient(to right, transparent, #ffffff)` }}
            />
            <motion.div
              className="w-2 h-2 rotate-45"
              style={{
                background: '#ffffff',
                boxShadow: `0 0 8px rgba(255, 255, 255, 0.5)`,
              }}
              animate={!prefersReducedMotion ? {
                opacity: [0.6, 1, 0.6],
                boxShadow: [
                  `0 0 8px rgba(255, 255, 255, 0.5)`,
                  `0 0 16px rgba(255, 255, 255, 0.7)`,
                  `0 0 8px rgba(255, 255, 255, 0.5)`,
                ],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <div
              className="h-px w-8 md:w-12"
              style={{ background: `linear-gradient(to left, transparent, #ffffff)` }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default CasinoLogo;
