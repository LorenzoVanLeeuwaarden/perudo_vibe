'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Shield,
  Crown,
  Swords,
  Sparkles,
  Dice1,
  ArrowUp,
  Eye,
  Zap,
  Target,
  Snowflake,
  Smile,
  LucideIcon,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Achievement } from '@/lib/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onComplete: () => void;
}

// Map icon strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  shield: Shield,
  crown: Crown,
  swords: Swords,
  sparkles: Sparkles,
  'dice-1': Dice1,
  'arrow-up': ArrowUp,
  eye: Eye,
  zap: Zap,
  target: Target,
  snowflake: Snowflake,
  smile: Smile,
};

export function AchievementToast({
  achievement,
  isVisible,
  onComplete,
}: AchievementToastProps) {
  const prefersReducedMotion = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && achievement) {
      setShouldRender(true);

      // TODO: Play achievement unlock sound here
      // Example: playAchievementUnlock();
      // Can use useSoundEffects hook pattern:
      // const { playPop } = useSoundEffects();
      // playPop(); // Or a dedicated unlock sound

      // Auto-dismiss after 4.5 seconds
      timeoutRef.current = setTimeout(() => {
        onComplete();
      }, 4500);
    } else {
      setShouldRender(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible, achievement, onComplete]);

  if (!achievement) return null;

  const IconComponent = ICON_MAP[achievement.icon] || Trophy;
  const isMilestone = achievement.type === 'milestone';

  // Accent colors: golden/amber for milestones, purple/mysterious for hidden
  const accentColor = isMilestone
    ? 'rgb(251, 191, 36)' // amber-400
    : 'rgb(168, 85, 247)'; // purple-500
  const accentGlow = isMilestone
    ? 'rgba(251, 191, 36, 0.5)'
    : 'rgba(168, 85, 247, 0.5)';
  const accentBorder = isMilestone
    ? 'rgb(245, 158, 11)' // amber-500
    : 'rgb(147, 51, 234)'; // purple-600

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.8, y: -20 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: [0.8, 1.1, 1.0], y: 0 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -10 }
          }
          transition={{
            duration: 0.4,
            scale: {
              duration: 0.5,
              times: [0, 0.6, 1],
              ease: ['easeOut', 'easeInOut'],
            },
          }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          style={{
            maxWidth: '90vw',
            width: '400px',
          }}
        >
          <div
            className="rounded-xl px-6 py-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.95) 0%, rgba(20, 30, 40, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px ${accentBorder}, 0 0 20px ${accentGlow}`,
              border: `2px solid ${accentBorder}`,
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              }}
            />

            {/* Content */}
            <div className="flex items-center gap-4">
              {/* Icon */}
              <motion.div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentBorder})`,
                  boxShadow: `0 0 20px ${accentGlow}`,
                }}
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        rotate: [0, -5, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                }}
              >
                <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-wider text-turquoise/80 mb-0.5">
                  {isMilestone ? 'Milestone Reached' : 'Hidden Achievement'}
                </p>
                <h3
                  className="text-lg font-bold text-white mb-1 truncate"
                  style={{
                    textShadow: `0 0 10px ${accentGlow}`,
                  }}
                >
                  {achievement.name}
                </h3>
                <p className="text-sm text-white-soft/80 line-clamp-2">
                  {achievement.description}
                </p>
              </div>
            </div>

            {/* Sparkle effect for celebration */}
            {!prefersReducedMotion && (
              <>
                <motion.div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.1,
                  }}
                />
                <motion.div
                  className="absolute bottom-2 left-12 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.3,
                  }}
                />
                <motion.div
                  className="absolute top-1/2 right-4 w-1 h-1 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.5,
                  }}
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
