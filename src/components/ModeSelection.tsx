'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Users } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { CasinoLogo } from '@/components/CasinoLogo';

interface ModeSelectionProps {
  onSelectAI: () => void;
  onSelectMultiplayer: () => void;
  playerColor: PlayerColor;
}

type GameMode = 'ai' | 'multiplayer' | null;

export function ModeSelection({ onSelectAI, onSelectMultiplayer, playerColor }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const colorConfig = PLAYER_COLORS[playerColor];

  const handleSelectAI = useCallback(() => {
    if (selectedMode !== null) return; // Prevent double-click
    setSelectedMode('ai');
    setTimeout(() => {
      onSelectAI();
    }, 500);
  }, [selectedMode, onSelectAI]);

  const handleSelectMultiplayer = useCallback(() => {
    if (selectedMode !== null) return; // Prevent double-click
    setSelectedMode('multiplayer');
    setTimeout(() => {
      onSelectMultiplayer();
      // Reset selection after callback (in case it stays on this screen)
      setSelectedMode(null);
    }, 500);
  }, [selectedMode, onSelectMultiplayer]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      {/* Logo/Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 sm:mb-10 scale-90 sm:scale-100"
      >
        <CasinoLogo color={playerColor} />
      </motion.div>

      {/* Mode buttons container */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
        {/* Play vs AI Button */}
        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{
            opacity: selectedMode === 'multiplayer' ? 0 : 1,
            y: 0,
            scale: selectedMode === 'ai' ? 1.1 : 1,
            filter: selectedMode === 'ai' ? 'brightness(1.2)' : 'brightness(1)',
          }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.5, delay: 0.2 },
            scale: { duration: 0.3 },
            filter: { duration: 0.3 },
          }}
          whileHover={selectedMode === null ? { scale: 1.05, y: -4 } : undefined}
          whileTap={selectedMode === null ? { scale: 0.98, y: 0 } : undefined}
          onClick={handleSelectAI}
          disabled={selectedMode !== null}
          className="retro-panel p-4 sm:p-6 w-full text-left transition-all disabled:cursor-default"
          style={{
            background: `linear-gradient(135deg, rgba(3, 15, 15, 0.95) 0%, rgba(10, 31, 31, 0.9) 100%)`,
            border: `3px solid ${colorConfig.border}`,
            boxShadow: selectedMode === 'ai'
              ? `0 0 30px ${colorConfig.glow}, 0 6px 0 0 ${colorConfig.shadow}`
              : `0 6px 0 0 ${colorConfig.shadow}`,
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
              style={{
                background: colorConfig.bgGradient,
                boxShadow: `0 4px 0 0 ${colorConfig.shadowDark}`,
              }}
              animate={selectedMode === 'ai' ? { rotate: [0, -10, 10, 0] } : undefined}
              transition={{ duration: 0.5 }}
            >
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white-soft mb-0.5 sm:mb-1">Play vs AI</h2>
              <p className="text-xs sm:text-sm text-white-soft/60">Challenge computer opponents</p>
            </div>
          </div>
        </motion.button>

        {/* Play with Friends Button */}
        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{
            opacity: selectedMode === 'ai' ? 0 : 1,
            y: 0,
            scale: selectedMode === 'multiplayer' ? 1.1 : 1,
            filter: selectedMode === 'multiplayer' ? 'brightness(1.2)' : 'brightness(1)',
          }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.5, delay: 0.4 },
            scale: { duration: 0.3 },
            filter: { duration: 0.3 },
          }}
          whileHover={selectedMode === null ? { scale: 1.05, y: -4 } : undefined}
          whileTap={selectedMode === null ? { scale: 0.98, y: 0 } : undefined}
          onClick={handleSelectMultiplayer}
          disabled={selectedMode !== null}
          className="retro-panel p-4 sm:p-6 w-full text-left transition-all disabled:cursor-default"
          style={{
            background: `linear-gradient(135deg, rgba(3, 15, 15, 0.95) 0%, rgba(10, 31, 31, 0.9) 100%)`,
            border: `3px solid ${colorConfig.border}`,
            boxShadow: selectedMode === 'multiplayer'
              ? `0 0 30px ${colorConfig.glow}, 0 6px 0 0 ${colorConfig.shadow}`
              : `0 6px 0 0 ${colorConfig.shadow}`,
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
              style={{
                background: colorConfig.bgGradient,
                boxShadow: `0 4px 0 0 ${colorConfig.shadowDark}`,
              }}
              animate={selectedMode === 'multiplayer' ? { rotate: [0, -10, 10, 0] } : undefined}
              transition={{ duration: 0.5 }}
            >
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white-soft mb-0.5 sm:mb-1">Play with Friends</h2>
              <p className="text-xs sm:text-sm text-white-soft/60">Create or join a room</p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

export default ModeSelection;
