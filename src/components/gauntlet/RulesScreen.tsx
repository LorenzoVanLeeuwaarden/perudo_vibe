'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Trophy } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RulesScreenProps {
  onEnter: () => void;
  onBack: () => void;
  onShowAchievements: () => void;
  playerColor: PlayerColor;
}

export function RulesScreen({ onEnter, onBack, onShowAchievements, playerColor }: RulesScreenProps) {
  const colorConfig = PLAYER_COLORS[playerColor];
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  const rules = [
    'Your dice carry over between duels - no healing',
    'Each opponent starts fresh with 5 dice',
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

      {/* Crossed Pixelated Swords */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sword 1 - from bottom-left to upper-right */}
        <svg
          className="absolute"
          style={{
            width: '450px',
            height: '450px',
            left: 'calc(50% - 60px)',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            opacity: 0.2,
            filter: 'drop-shadow(0 0 20px rgba(255, 68, 68, 0.6))',
          }}
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Blade */}
          <rect x="30" y="4" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="8" width="4" height="4" fill="#c0c0c0" />
          <rect x="30" y="12" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="16" width="4" height="4" fill="#c0c0c0" />
          <rect x="30" y="20" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="24" width="4" height="4" fill="#c0c0c0" />
          <rect x="30" y="28" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="32" width="4" height="4" fill="#c0c0c0" />
          {/* Crossguard */}
          <rect x="22" y="36" width="4" height="4" fill="#ffd700" />
          <rect x="26" y="36" width="4" height="4" fill="#ffec8b" />
          <rect x="30" y="36" width="4" height="4" fill="#ffd700" />
          <rect x="34" y="36" width="4" height="4" fill="#ffec8b" />
          <rect x="38" y="36" width="4" height="4" fill="#ffd700" />
          {/* Handle */}
          <rect x="30" y="40" width="4" height="4" fill="#8b4513" />
          <rect x="30" y="44" width="4" height="4" fill="#654321" />
          <rect x="30" y="48" width="4" height="4" fill="#8b4513" />
          {/* Pommel */}
          <rect x="30" y="52" width="4" height="4" fill="#ffd700" />
        </svg>

        {/* Sword 2 - from bottom-right to upper-left */}
        <svg
          className="absolute"
          style={{
            width: '450px',
            height: '450px',
            left: 'calc(50% + 60px)',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            opacity: 0.2,
            filter: 'drop-shadow(0 0 20px rgba(255, 68, 68, 0.6))',
          }}
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Blade */}
          <rect x="30" y="4" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="8" width="4" height="4" fill="#c0c0c0" />
          <rect x="30" y="12" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="16" width="4" height="4" fill="#c0c0c0" />
          <rect x="30" y="20" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="24" width="4" height="4" fill="#c0c0c0" />
          <rect x="30" y="28" width="4" height="4" fill="#e0e0e0" />
          <rect x="30" y="32" width="4" height="4" fill="#c0c0c0" />
          {/* Crossguard */}
          <rect x="22" y="36" width="4" height="4" fill="#ffd700" />
          <rect x="26" y="36" width="4" height="4" fill="#ffec8b" />
          <rect x="30" y="36" width="4" height="4" fill="#ffd700" />
          <rect x="34" y="36" width="4" height="4" fill="#ffec8b" />
          <rect x="38" y="36" width="4" height="4" fill="#ffd700" />
          {/* Handle */}
          <rect x="30" y="40" width="4" height="4" fill="#8b4513" />
          <rect x="30" y="44" width="4" height="4" fill="#654321" />
          <rect x="30" y="48" width="4" height="4" fill="#8b4513" />
          {/* Pommel */}
          <rect x="30" y="52" width="4" height="4" fill="#ffd700" />
        </svg>
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">Back</span>
      </motion.button>

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

        {/* Achievements button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowAchievements}
          className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl transition-colors mx-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
            border: '2px solid rgba(251, 191, 36, 0.4)',
            boxShadow: '0 4px 0 0 rgba(217, 119, 6, 0.3)',
          }}
        >
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-amber-200 font-semibold">Achievements</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default RulesScreen;
