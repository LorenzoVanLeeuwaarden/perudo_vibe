'use client';

import { motion } from 'framer-motion';
import { PlayerColor } from '@/lib/types';
import { PERSONALITIES } from '@/lib/ai/personalities';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FightCardProps {
  opponentName: string;
  personalityId: string;
  roundNumber: number;
  playerColor: PlayerColor;
  onDismiss: () => void;
}

// Flavor quotes for each personality type
const PERSONALITY_QUOTES: Record<string, string[]> = {
  turtle: [
    "Patience is a virtue... and a strategy.",
    "Slow and steady wins the duel.",
  ],
  calculator: [
    "The odds are always in my favor.",
    "Let's see what the math says...",
  ],
  shark: [
    "I smell blood in the water.",
    "Time to separate the bluffers from the brave.",
  ],
  chaos: [
    "Let's make this interesting...",
    "Expect the unexpected.",
  ],
  bluffer: [
    "Trust me, I never lie.",
    "The best lies are wrapped in truth.",
  ],
  trapper: [
    "Every move is part of the plan.",
    "You'll see the trap when it's too late.",
  ],
};

// Difficulty indicators
const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  turtle: { label: 'Easy', color: '#22c55e' },
  calculator: { label: 'Medium', color: '#eab308' },
  shark: { label: 'Hard', color: '#ef4444' },
  chaos: { label: 'Medium', color: '#eab308' },
  bluffer: { label: 'Medium', color: '#eab308' },
  trapper: { label: 'Hard', color: '#ef4444' },
};

export function FightCard({
  opponentName,
  personalityId,
  roundNumber,
  onDismiss,
}: FightCardProps) {
  const personality = PERSONALITIES[personalityId] || PERSONALITIES.turtle;
  const quotes = PERSONALITY_QUOTES[personalityId] || PERSONALITY_QUOTES.turtle;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const difficulty = DIFFICULTY_MAP[personalityId] || DIFFICULTY_MAP.turtle;

  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0505 0%, #0d0202 70%, #000000 100%)',
        cursor: 'pointer',
      }}
    >
      {/* Pulsing red vignette - static on Firefox/reduced motion */}
      <motion.div
        className="absolute inset-0"
        style={useSimplifiedAnimations ? {
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.4) 100%)'
        } : {}}
        animate={useSimplifiedAnimations ? {} : {
          background: [
            'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.4) 100%)',
            'radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, 0.6) 100%)',
            'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.4) 100%)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main card */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        className="relative z-10 max-w-2xl w-full mx-4 p-8 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #2d0a0a 0%, #1a0505 50%, #0d0202 100%)',
          border: '3px solid #8b0000',
          boxShadow: '0 0 40px rgba(139, 0, 0, 0.6), 0 0 80px rgba(139, 0, 0, 0.3)',
        }}
      >
        {/* Pulsing border glow - static on Firefox/reduced motion */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={useSimplifiedAnimations ? {
            boxShadow: '0 0 30px rgba(220, 38, 38, 0.5)',
          } : {}}
          animate={useSimplifiedAnimations ? {} : {
            boxShadow: [
              '0 0 30px rgba(220, 38, 38, 0.5)',
              '0 0 50px rgba(220, 38, 38, 0.8)',
              '0 0 30px rgba(220, 38, 38, 0.5)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Round header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <h2
            className="text-4xl font-black uppercase tracking-widest"
            style={{
              color: '#dc2626',
              textShadow: '0 0 20px rgba(220, 38, 38, 0.8), 0 2px 0 #7f1d1d',
            }}
          >
            Round {roundNumber}
          </h2>
        </motion.div>

        {/* Opponent name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
          className="text-center mb-8"
        >
          <h1
            className="text-5xl md:text-6xl font-black uppercase mb-2"
            style={{
              color: '#ff6b6b',
              textShadow: useSimplifiedAnimations
                ? '0 0 30px rgba(255, 107, 107, 0.8), 0 4px 0 #991b1b'
                : undefined,
            }}
          >
            <motion.span
              animate={useSimplifiedAnimations ? {} : {
                textShadow: [
                  '0 0 30px rgba(255, 107, 107, 0.8), 0 4px 0 #991b1b',
                  '0 0 50px rgba(255, 107, 107, 1.0), 0 4px 0 #991b1b',
                  '0 0 30px rgba(255, 107, 107, 0.8), 0 4px 0 #991b1b',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {opponentName}
            </motion.span>
          </h1>
        </motion.div>

        {/* Flavor quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-8"
        >
          <div className="inline-block px-6 py-3 rounded-lg bg-black/30 border border-red-900/30">
            <p className="text-red-400/90 italic text-xl">
              "{quote}"
            </p>
          </div>
        </motion.div>

        {/* Click to begin hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <motion.p
            className="text-red-400/60 text-sm uppercase tracking-wider"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Click to begin
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default FightCard;
