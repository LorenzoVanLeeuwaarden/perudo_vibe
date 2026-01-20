'use client';

import { motion } from 'framer-motion';
import { Target, ThumbsUp, ThumbsDown, Dice1, Trophy } from 'lucide-react';
import type { PlayerColor } from '@/lib/types';
import { PLAYER_COLORS } from '@/lib/types';
import { Dice } from './Dice';

interface PlayerStats {
  bidsPlaced: number;
  dudosCalled: number;
  dudosSuccessful: number;
  calzasCalled: number;
  calzasSuccessful: number;
  diceLost: number;
  diceGained: number;
}

interface StatCardProps {
  playerName: string;
  color: PlayerColor;
  stats: PlayerStats;
  isWinner: boolean;
  /** Current dice count - when provided, shows actual dice instead of winner trophy */
  currentDiceCount?: number;
  /** Whether this player is still in the game */
  isEliminated?: boolean;
}

export function StatCard({ playerName, color, stats, isWinner, currentDiceCount, isEliminated = false }: StatCardProps) {
  const colorConfig = PLAYER_COLORS[color];
  const dudoAccuracy = stats.dudosCalled > 0
    ? Math.round((stats.dudosSuccessful / stats.dudosCalled) * 100)
    : 0;

  // Show game in progress state when currentDiceCount is provided
  const gameInProgress = currentDiceCount !== undefined;

  return (
    <motion.div
      className={`retro-panel p-4 relative overflow-hidden ${isEliminated ? 'opacity-60' : ''}`}
      style={{
        borderColor: isWinner ? '#ffd700' : colorConfig.border,
        boxShadow: isWinner ? '0 0 20px rgba(255, 215, 0, 0.3)' : undefined,
      }}
    >
      {isWinner && (
        <div className="absolute top-2 right-2">
          <Trophy className="w-6 h-6 text-gold-accent" />
        </div>
      )}

      {/* Player name with color indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colorConfig.bg }}
        />
        <h3 className="font-bold text-lg text-white-soft">
          {playerName}
          {isEliminated && <span className="text-red-400 ml-2 text-sm">Eliminated</span>}
        </h3>
      </div>

      {/* Current dice display for game in progress */}
      {gameInProgress && !isEliminated && currentDiceCount > 0 && (
        <div className="mb-3 p-2 bg-purple-deep/50 rounded-lg">
          <p className="text-xs text-white-soft/60 uppercase mb-2">Current Dice:</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {Array.from({ length: currentDiceCount }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
              >
                <Dice
                  value={((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}
                  index={i}
                  size="xs"
                  color={color}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-light" />
          <span className="text-white-soft/70">Bids:</span>
          <span className="text-white-soft font-medium">{stats.bidsPlaced}</span>
        </div>

        <div className="flex items-center gap-2">
          <Dice1 className="w-4 h-4 text-purple-light" />
          <span className="text-white-soft/70">Dice lost:</span>
          <span className="text-red-400 font-medium">{stats.diceLost}</span>
        </div>

        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4 text-orange-400" />
          <span className="text-white-soft/70">Successful Dudo&apos;s:</span>
          <span className="text-white-soft font-medium">
            {stats.dudosSuccessful}
            {stats.dudosCalled > 0 && (
              <span className="text-white-soft/50 ml-1">({dudoAccuracy}%)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-green-400" />
          <span className="text-white-soft/70">Dice won via Calza:</span>
          <span className="text-white-soft font-medium">{stats.diceGained}</span>
        </div>
      </div>
    </motion.div>
  );
}
