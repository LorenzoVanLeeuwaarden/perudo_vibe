'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PlayerColor } from '@/lib/types';

interface CasinoLogoProps {
  color?: PlayerColor;
  size?: 'sm' | 'md' | 'lg';
}

// Brand colors
const BRAND = {
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  goldDark: '#D97706',
  goldGlow: 'rgba(245, 158, 11, 0.5)',
  dark: '#0a1a1a',
  white: '#FAF5FF',
};

// Isometric Die SVG Component - clean 2D illustration
function IsometricDie({
  size = 120,
  glowIntensity = 1,
  animated = true
}: {
  size?: number;
  glowIntensity?: number;
  animated?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.8 }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="dieGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3 * glowIntensity} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Gradient for top face */}
        <linearGradient id="topFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.goldLight} />
          <stop offset="100%" stopColor={BRAND.gold} />
        </linearGradient>

        {/* Gradient for left face */}
        <linearGradient id="leftFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BRAND.gold} />
          <stop offset="100%" stopColor={BRAND.goldDark} />
        </linearGradient>

        {/* Gradient for right face */}
        <linearGradient id="rightFace" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={BRAND.goldDark} />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Glow layer */}
      <motion.g
        filter="url(#dieGlow)"
        animate={shouldAnimate ? {
          opacity: [0.6, 0.9, 0.6],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Top face - shows 1 pip */}
        <polygon
          points="50,15 85,35 50,55 15,35"
          fill="url(#topFace)"
        />
        {/* Left face - shows 4 pips */}
        <polygon
          points="15,35 50,55 50,90 15,70"
          fill="url(#leftFace)"
        />
        {/* Right face - shows 3 pips */}
        <polygon
          points="50,55 85,35 85,70 50,90"
          fill="url(#rightFace)"
        />
      </motion.g>

      {/* Edge highlights */}
      <polyline
        points="15,35 50,15 85,35"
        fill="none"
        stroke={BRAND.goldLight}
        strokeWidth="1.5"
        opacity="0.8"
      />
      <line x1="50" y1="55" x2="50" y2="90" stroke={BRAND.goldDark} strokeWidth="1" opacity="0.5" />

      {/* Top face pip (1) - centered */}
      <motion.circle
        cx="50"
        cy="35"
        r="6"
        fill={BRAND.dark}
        animate={shouldAnimate ? {
          r: [6, 6.5, 6],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Left face pips (4) */}
      <circle cx="28" cy="45" r="4" fill={BRAND.dark} opacity="0.9" />
      <circle cx="38" cy="45" r="4" fill={BRAND.dark} opacity="0.9" />
      <circle cx="28" cy="60" r="4" fill={BRAND.dark} opacity="0.9" />
      <circle cx="38" cy="60" r="4" fill={BRAND.dark} opacity="0.9" />

      {/* Right face pips (3) - diagonal */}
      <circle cx="62" cy="47" r="3.5" fill={BRAND.dark} opacity="0.85" />
      <circle cx="68" cy="58" r="3.5" fill={BRAND.dark} opacity="0.85" />
      <circle cx="74" cy="69" r="3.5" fill={BRAND.dark} opacity="0.85" />
    </motion.svg>
  );
}

export function CasinoLogo({ size = 'lg' }: CasinoLogoProps = {}) {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: { die: 60, title: 'text-xl', spacing: 'gap-2' },
    md: { die: 90, title: 'text-3xl', spacing: 'gap-3' },
    lg: { die: 130, title: 'text-5xl md:text-6xl', spacing: 'gap-4' },
  };

  const config = sizes[size];

  return (
    <div className="relative flex flex-col items-center">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-30 pointer-events-none"
        style={{ background: BRAND.goldGlow }}
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

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center ${config.spacing}`}>

        {/* Isometric Die */}
        <IsometricDie size={config.die} />

        {/* Typography lockup */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* THE LAST DIE - horizontal lockup */}
          <div className="flex items-baseline gap-3">
            <span
              className="text-sm md:text-base font-medium tracking-[0.3em] uppercase"
              style={{
                color: BRAND.goldLight,
                opacity: 0.8,
              }}
            >
              THE
            </span>

            <h1
              className={`${config.title} font-black tracking-tight`}
              style={{
                color: BRAND.gold,
                textShadow: `
                  0 0 20px ${BRAND.goldGlow},
                  0 0 40px ${BRAND.goldGlow},
                  0 2px 0 ${BRAND.goldDark}
                `,
              }}
            >
              LAST
            </h1>

            <span
              className="text-sm md:text-base font-medium tracking-[0.3em] uppercase"
              style={{
                color: BRAND.goldLight,
                opacity: 0.8,
              }}
            >
              DIE
            </span>
          </div>

          {/* Subtle decorative line */}
          <motion.div
            className="flex items-center gap-2 mt-3"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div
              className="h-px w-12 md:w-16"
              style={{ background: `linear-gradient(to right, transparent, ${BRAND.gold})` }}
            />
            <div
              className="w-1.5 h-1.5 rotate-45"
              style={{ background: BRAND.gold }}
            />
            <div
              className="h-px w-12 md:w-16"
              style={{ background: `linear-gradient(to left, transparent, ${BRAND.gold})` }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default CasinoLogo;
