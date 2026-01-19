'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface PlayerDiceBadgeProps {
  playerName: string;
  diceCount: number;
  color: PlayerColor;
  isActive: boolean;
  hasPalifico?: boolean;
  isEliminated?: boolean;
  showThinking?: boolean;
  thinkingPrompt?: string;
  showDisconnectedVisual?: boolean;
  isConnected?: boolean;
}

export function PlayerDiceBadge({
  playerName,
  diceCount,
  color,
  isActive,
  hasPalifico = false,
  isEliminated = false,
  showThinking = false,
  thinkingPrompt = 'Thinking',
  showDisconnectedVisual = false,
  isConnected = true,
}: PlayerDiceBadgeProps) {
  const colorConfig = PLAYER_COLORS[color];

  return (
    <motion.div
      className={`retro-panel px-3 py-1.5 sm:px-4 sm:py-2 relative transition-all duration-300 ${isEliminated ? 'opacity-40' : ''} ${showDisconnectedVisual ? 'opacity-50 grayscale' : ''}`}
      animate={{
        boxShadow: isActive
          ? `0 0 ${showThinking ? '25px' : '20px'} ${colorConfig.glow}, 0 0 ${showThinking ? '50px' : '40px'} ${colorConfig.glow}`
          : hasPalifico
          ? '0 0 15px rgba(255, 51, 102, 0.5), 0 8px 0 0 rgba(26, 10, 46, 0.9)'
          : '0 8px 0 0 rgba(26, 10, 46, 0.9)',
        borderColor: isActive ? colorConfig.bg : hasPalifico ? '#ff3366' : 'var(--purple-light)',
        scale: showThinking ? 1.05 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Palifico badge */}
      {hasPalifico && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, opacity: [0.7, 1, 0.7] }}
          transition={{ opacity: { duration: 1.5, repeat: Infinity } }}
          className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 bg-red-danger rounded text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-wider z-10"
          style={{ boxShadow: '0 0 10px rgba(255, 51, 102, 0.5)' }}
        >
          Palifico!
        </motion.div>
      )}

      {/* Thinking bubble */}
      <AnimatePresence>
        {showThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 10 }}
            className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 z-20"
          >
            <div
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap"
              style={{
                background: colorConfig.bgGradient,
                border: `2px solid ${colorConfig.border}`,
                boxShadow: `0 4px 0 ${colorConfig.shadow}, 0 0 15px ${colorConfig.glow}`,
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {thinkingPrompt}
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            </div>
            {/* Speech bubble tail */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 sm:-bottom-2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${colorConfig.border}`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <span className="text-[10px] sm:text-xs uppercase block text-center mb-0.5 sm:mb-1 font-bold flex items-center justify-center gap-1" style={{ color: colorConfig.bg }}>
        {playerName}
        {!isConnected && (
          <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white-soft/60" />
        )}
      </span>
      <div className="flex items-center gap-0.5 sm:gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              boxShadow: showThinking && i < diceCount
                ? `0 0 10px ${colorConfig.glow}`
                : i < diceCount ? `0 0 5px ${colorConfig.glow}` : 'none',
            }}
            transition={{ delay: i * 0.05 }}
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm"
            style={{
              background: i < diceCount ? colorConfig.bg : 'var(--purple-deep)',
              border: i < diceCount ? 'none' : '1px solid var(--purple-mid)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
