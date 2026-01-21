'use client';

import { motion } from 'framer-motion';
import { PlayerColor } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Skull } from 'lucide-react';

interface VictorySplashProps {
  defeatedOpponentName: string;
  streak: number;
  playerColor: PlayerColor;
  onContinue: () => void;
}

export function VictorySplash({
  defeatedOpponentName,
  streak,
  onContinue,
}: VictorySplashProps) {
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Ominous messages emphasizing survival, not triumph
  const ominousMessages = [
    "One down, many to go...",
    "The gauntlet continues...",
    "No time to rest...",
    "They keep coming...",
  ];
  const message = ominousMessages[Math.floor(Math.random() * ominousMessages.length)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onContinue}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0505 70%, #000000 100%)',
        cursor: 'pointer',
      }}
    >
      {/* Dark pulsing vignette - static on Firefox/reduced motion */}
      <motion.div
        className="absolute inset-0"
        style={useSimplifiedAnimations ? {
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(80, 0, 0, 0.5) 100%)'
        } : {}}
        animate={useSimplifiedAnimations ? {} : {
          background: [
            'radial-gradient(ellipse at center, transparent 30%, rgba(80, 0, 0, 0.5) 100%)',
            'radial-gradient(ellipse at center, transparent 40%, rgba(80, 0, 0, 0.7) 100%)',
            'radial-gradient(ellipse at center, transparent 30%, rgba(80, 0, 0, 0.5) 100%)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Muted particles - skip on Firefox/reduced motion */}
      {!useSimplifiedAnimations && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: '#8b0000',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Skull icon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          className="mb-6 flex justify-center"
        >
          <motion.div
            animate={useSimplifiedAnimations ? { scale: [1, 1.05, 1] } : {
              scale: [1, 1.05, 1],
              filter: [
                'drop-shadow(0 0 15px #8b0000)',
                'drop-shadow(0 0 25px #8b0000)',
                'drop-shadow(0 0 15px #8b0000)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={useSimplifiedAnimations ? { filter: 'drop-shadow(0 0 15px #8b0000)' } : {}}
          >
            <Skull className="w-20 h-20 text-red-700" />
          </motion.div>
        </motion.div>

        {/* Defeated opponent text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-red-400/90">
            {defeatedOpponentName}
          </h2>
          <h1
            className="text-5xl md:text-6xl font-black uppercase tracking-wider mb-6"
            style={{
              color: '#9ca3af',
              textShadow: '0 0 20px rgba(139, 0, 0, 0.5), 0 2px 0 #1f2937',
            }}
          >
            Defeated
          </h1>
        </motion.div>

        {/* Streak counter with bump animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <motion.div
            key={streak}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.4 }}
            className="inline-block px-8 py-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
              border: '3px solid #4b5563',
              boxShadow: '0 0 30px rgba(139, 0, 0, 0.4)',
            }}
          >
            <div className="text-6xl font-black text-red-500 mb-1"
              style={{
                textShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
              }}
            >
              {streak}
            </div>
            <div className="text-lg text-gray-400 uppercase tracking-wider font-bold">
              Defeated
            </div>
          </motion.div>
        </motion.div>

        {/* Ominous message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-10"
        >
          <p className="text-2xl text-red-300/70 italic">
            {message}
          </p>
        </motion.div>

        {/* Continue hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <motion.p
            className="text-gray-500 text-sm uppercase tracking-wider"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Click to continue
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default VictorySplash;
