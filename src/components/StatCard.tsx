'use client';

import { motion } from 'framer-motion';
import { Target, ThumbsUp, ThumbsDown, Dice1, Trophy } from 'lucide-react';
import type { PlayerColor } from '@/lib/types';
import { PLAYER_COLORS } from '@/lib/types';

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
}

export function StatCard({ playerName, color, stats, isWinner }: StatCardProps) {
  const colorConfig = PLAYER_COLORS[color];
  const dudoAccuracy = stats.dudosCalled > 0
    ? Math.round((stats.dudosSuccessful / stats.dudosCalled) * 100)
    : 0;
  const calzaAccuracy = stats.calzasCalled > 0
    ? Math.round((stats.calzasSuccessful / stats.calzasCalled) * 100)
    : 0;

  return (
    <motion.div
      className="retro-panel p-4 relative overflow-hidden"
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
        <h3 className="font-bold text-lg text-white-soft">{playerName}</h3>
      </div>

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
          <span className="text-white-soft/70">Dudo:</span>
          <span className="text-white-soft font-medium">
            {stats.dudosSuccessful}/{stats.dudosCalled}
            {stats.dudosCalled > 0 && (
              <span className="text-white-soft/50 ml-1">({dudoAccuracy}%)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-green-400" />
          <span className="text-white-soft/70">Calza:</span>
          <span className="text-white-soft font-medium">
            {stats.calzasSuccessful}/{stats.calzasCalled}
            {stats.calzasCalled > 0 && (
              <span className="text-white-soft/50 ml-1">({calzaAccuracy}%)</span>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
