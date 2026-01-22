'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface TutorialCompleteProps {
  playerColor: PlayerColor;
  onExit: () => void;
}

export function TutorialComplete({ playerColor, onExit }: TutorialCompleteProps) {
  const colorConfig = PLAYER_COLORS[playerColor];

  // Fire confetti on mount
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Main burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [colorConfig.bg, colorConfig.glow, '#ffd700', '#ffffff'],
      disableForReducedMotion: true,
    });

    // Side cannons after 200ms
    const sideTimer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [colorConfig.bg, colorConfig.glow, '#ffd700'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [colorConfig.bg, colorConfig.glow, '#ffd700'],
      });
    }, 200);

    return () => clearTimeout(sideTimer);
  }, [colorConfig]);

  // Auto-return to main menu after 2 seconds (per CONTEXT.md)
  useEffect(() => {
    const timer = setTimeout(() => {
      onExit();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onExit]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colorConfig.shadow} 100%)`,
            boxShadow: `0 0 30px ${colorConfig.glow}`,
          }}
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title - per CONTEXT.md: "You're ready to play!" */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white-soft"
        >
          You&apos;re ready to play!
        </motion.h1>
      </motion.div>
    </div>
  );
}

export default TutorialComplete;
