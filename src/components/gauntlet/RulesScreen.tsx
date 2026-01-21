'use client';

import { motion } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RulesScreenProps {
  onEnter: () => void;
  playerColor: PlayerColor;
}

export function RulesScreen({ onEnter, playerColor }: RulesScreenProps) {
  const colorConfig = PLAYER_COLORS[playerColor];
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  const rules = [
    'Your dice carry over between duels - no healing',
    'Each opponent starts fresh with 5 dice',
    'Difficulty escalates: Turtle → Calculator → Shark',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(60, 20, 80, 0.4) 0%, rgba(10, 5, 20, 0.95) 60%, #000000 100%)',
      }}
    >
      {/* Ominous background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={useSimplifiedAnimations ? {
          background: `radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)`,
        } : undefined}
        animate={useSimplifiedAnimations ? {} : {
          background: [
            'radial-gradient(circle at 40% 40%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
            'radial-gradient(circle at 60% 60%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
            'radial-gradient(circle at 40% 60%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
            'radial-gradient(circle at 60% 40%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
            'radial-gradient(circle at 40% 40%, rgba(139, 0, 0, 0.15) 0%, transparent 60%)',
          ],
        }}
        transition={useSimplifiedAnimations ? undefined : { duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Content container */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl md:text-8xl font-black mb-12 uppercase tracking-widest"
          style={{
            color: '#ff4444',
            textShadow: '0 0 30px rgba(255, 68, 68, 0.8), 0 0 60px rgba(255, 68, 68, 0.4), 0 4px 0 #8b0000',
            filter: 'drop-shadow(0 0 20px rgba(255, 68, 68, 0.6))',
          }}
        >
          THE GAUNTLET
        </motion.h1>

        {/* Rules section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-12 space-y-6"
        >
          {rules.map((rule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.15, duration: 0.5 }}
              className="flex items-start gap-4 text-left max-w-xl mx-auto"
            >
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{
                  background: colorConfig.bgGradient,
                  boxShadow: `0 0 10px ${colorConfig.glow}`,
                }}
              />
              <p className="text-xl md:text-2xl text-white-soft/90 font-medium">
                {rule}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Enter button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.5, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.08, y: -6 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={onEnter}
          className="px-16 py-6 rounded-2xl font-black uppercase tracking-wider text-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 50%, #8b0000 100%)',
            border: `4px solid ${colorConfig.border}`,
            boxShadow: `0 8px 0 0 #5a0000, 0 12px 0 0 #3d0000, 0 16px 40px rgba(0,0,0,0.6), 0 0 60px ${colorConfig.glow}40`,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">Enter the Gauntlet</span>
        </motion.button>

        {/* Flavor text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-8 text-white-soft/50 text-sm italic"
        >
          Only the strongest will survive...
        </motion.p>
      </div>
    </motion.div>
  );
}

export default RulesScreen;
