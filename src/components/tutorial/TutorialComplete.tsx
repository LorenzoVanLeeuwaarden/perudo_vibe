'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface TutorialCompleteProps {
  playerColor: PlayerColor;
  onExit: () => void;
}

export function TutorialComplete({ playerColor, onExit }: TutorialCompleteProps) {
  const colorConfig = PLAYER_COLORS[playerColor];

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

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white-soft mb-3"
        >
          Tutorial Complete!
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white-soft/70 mb-8"
        >
          You&apos;ve learned the basics of Perudo. Ready to play for real?
        </motion.p>

        {/* Action button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
          className="retro-button retro-button-orange flex items-center gap-2 mx-auto"
        >
          Start Playing
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}

export default TutorialComplete;
