'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getProgressToNext } from '@/lib/achievements';

interface AchievementProgressProps {
  currentStreak: number;
  className?: string;
}

export function AchievementProgress({ currentStreak, className = '' }: AchievementProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = getProgressToNext(currentStreak);

  // If all milestones complete, don't render
  if (!progress) {
    return null;
  }

  const { current, target, achievement } = progress;
  const remaining = target - current;

  return (
    <motion.div
      key={currentStreak}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
      animate={prefersReducedMotion ? {} : {
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.8) 0%, rgba(10, 5, 2, 0.85) 100%)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Trophy icon */}
      <motion.div
        animate={prefersReducedMotion ? {} : {
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut',
        }}
      >
        <Trophy
          className="w-4 h-4"
          style={{
            color: '#fbbf24',
            filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.6))',
          }}
        />
      </motion.div>

      {/* Progress text */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{
            color: '#fcd34d',
          }}
        >
          {remaining} more
        </span>
        <span
          className="text-xs"
          style={{
            color: '#fde68a',
            opacity: 0.8,
          }}
        >
          to {achievement.name}
        </span>
      </div>
    </motion.div>
  );
}

export default AchievementProgress;
