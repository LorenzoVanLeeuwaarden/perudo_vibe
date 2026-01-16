'use client';

import { motion } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface CasinoLogoProps {
  color: PlayerColor;
}

export function CasinoLogo({ color }: CasinoLogoProps) {
  const colorConfig = PLAYER_COLORS[color];

  return (
    <div className="relative">
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 blur-3xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: colorConfig.glow }}
      />

      {/* Main logo container */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative top element */}
        <motion.div
          className="flex items-center gap-2 mb-1"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.span
            className="text-2xl"
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎲
          </motion.span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: colorConfig.bg }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          <motion.span
            className="text-2xl"
            animate={{ rotate: [0, -10, 0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            🎲
          </motion.span>
        </motion.div>

        {/* Main title with skull */}
        <div className="relative">
          {/* Animated skull behind text */}
          <motion.div
            className="absolute -left-12 top-1/2 -translate-y-1/2"
            animate={{
              rotate: [-5, 5, -5],
              y: [0, -3, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <motion.g
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path
                  d="M16 4C10 4 6 9 6 14C6 17 7 19 8 21L8 24C8 25 9 26 10 26H22C23 26 24 25 24 24L24 21C25 19 26 17 26 14C26 9 22 4 16 4Z"
                  fill={colorConfig.bg}
                />
                <ellipse cx="12" cy="14" rx="2.5" ry="3" fill="#0d0416" />
                <ellipse cx="20" cy="14" rx="2.5" ry="3" fill="#0d0416" />
                <path d="M16 17L14.5 20H17.5L16 17Z" fill="#0d0416" />
                <rect x="11" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
                <rect x="14" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
                <rect x="17" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
              </motion.g>
              <motion.ellipse
                cx="12" cy="14" rx="1" ry="1.2"
                fill="#ff4444"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.ellipse
                cx="20" cy="14" rx="1" ry="1.2"
                fill="#ff4444"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </svg>
          </motion.div>

          {/* Title text */}
          <motion.h1
            className="text-6xl font-black tracking-tight relative"
            style={{
              color: colorConfig.bg,
              WebkitTextStroke: `2px ${colorConfig.border}`,
            }}
          >
            {/* Animated letters */}
            {'PERUDO'.split('').map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block"
                animate={{
                  y: [0, -4, 0],
                  textShadow: [
                    `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}, 0 4px 0 ${colorConfig.shadow}`,
                    `0 0 20px ${colorConfig.glow}, 0 0 40px ${colorConfig.glow}, 0 4px 0 ${colorConfig.shadow}`,
                    `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}, 0 4px 0 ${colorConfig.shadow}`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>

          {/* Animated skull on right */}
          <motion.div
            className="absolute -right-12 top-1/2 -translate-y-1/2"
            animate={{
              rotate: [5, -5, 5],
              y: [0, -3, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <motion.g
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              >
                <path
                  d="M16 4C10 4 6 9 6 14C6 17 7 19 8 21L8 24C8 25 9 26 10 26H22C23 26 24 25 24 24L24 21C25 19 26 17 26 14C26 9 22 4 16 4Z"
                  fill={colorConfig.bg}
                />
                <ellipse cx="12" cy="14" rx="2.5" ry="3" fill="#0d0416" />
                <ellipse cx="20" cy="14" rx="2.5" ry="3" fill="#0d0416" />
                <path d="M16 17L14.5 20H17.5L16 17Z" fill="#0d0416" />
                <rect x="11" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
                <rect x="14" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
                <rect x="17" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
              </motion.g>
              <motion.ellipse
                cx="12" cy="14" rx="1" ry="1.2"
                fill="#ff4444"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.ellipse
                cx="20" cy="14" rx="1" ry="1.2"
                fill="#ff4444"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Bottom decorative bar */}
        <motion.div
          className="flex items-center gap-2 mt-2"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-0.5 w-12 rounded-full" style={{ background: colorConfig.border }} />
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: colorConfig.bg }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="h-0.5 w-12 rounded-full" style={{ background: colorConfig.border }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default CasinoLogo;
