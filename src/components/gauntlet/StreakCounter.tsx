'use client';

import { motion } from 'framer-motion';
import { Skull } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export function StreakCounter({ streak, className = '' }: StreakCounterProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key={streak}
      initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      animate={prefersReducedMotion ? { scale: [1, 1.15, 1] } : {
        opacity: 1,
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
      }}
      className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(20, 5, 5, 0.9) 0%, rgba(10, 2, 2, 0.95) 100%)',
        border: '2px solid rgba(220, 38, 38, 0.6)',
        boxShadow: '0 0 20px rgba(139, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Skull icon */}
      <motion.div
        animate={prefersReducedMotion ? {} : {
          rotate: [0, -5, 5, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <Skull
          className="w-5 h-5"
          style={{
            color: '#ef4444',
            filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))',
          }}
        />
      </motion.div>

      {/* Streak number */}
      <div className="flex items-baseline gap-1">
        <motion.span
          key={`number-${streak}`}
          initial={prefersReducedMotion ? {} : { y: -10, opacity: 0 }}
          animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
          className="text-3xl font-black tabular-nums"
          style={{
            color: '#ff6b6b',
            textShadow: '0 0 10px rgba(255, 107, 107, 0.6), 0 2px 0 #7f1d1d',
          }}
        >
          {streak}
        </motion.span>
        <span
          className="text-sm font-bold uppercase tracking-wide"
          style={{
            color: '#fca5a5',
          }}
        >
          Defeated
        </span>
      </div>

      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={prefersReducedMotion ? {} : {
          boxShadow: [
            '0 0 15px rgba(220, 38, 38, 0.3)',
            '0 0 25px rgba(220, 38, 38, 0.5)',
            '0 0 15px rgba(220, 38, 38, 0.3)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

export default StreakCounter;
