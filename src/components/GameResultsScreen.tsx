'use client';

import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { StatCard } from './StatCard';
import type { PlayerColor } from '@/lib/types';

interface PlayerStats {
  bidsPlaced: number;
  dudosCalled: number;
  dudosSuccessful: number;
  calzasCalled: number;
  calzasSuccessful: number;
  diceLost: number;
  diceGained: number;
}

interface GameStats {
  roundsPlayed: number;
  totalBids: number;
  winnerId: string;
  playerStats: Record<string, PlayerStats>;
}

interface PlayerInfo {
  id: string;
  name: string;
  color: PlayerColor;
}

interface GameResultsScreenProps {
  stats: GameStats;
  players: PlayerInfo[];
  isHost: boolean;
  onReturnToLobby: () => void;
  onLeaveGame: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export function GameResultsScreen({
  stats,
  players,
  isHost,
  onReturnToLobby,
  onLeaveGame,
}: GameResultsScreenProps) {
  const winner = players.find(p => p.id === stats.winnerId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0416 70%, #050208 100%)',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-gold-accent" />
          <h1 className="text-3xl font-bold text-gold-accent">Game Over</h1>
          <Trophy className="w-8 h-8 text-gold-accent" />
        </div>
        {winner && (
          <p className="text-xl text-white-soft">
            <span className="font-bold">{winner.name}</span> wins!
          </p>
        )}
        <p className="text-white-soft/60 mt-1">
          {stats.roundsPlayed} rounds played - {stats.totalBids} bids made
        </p>
      </motion.div>

      {/* Player stat cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-8"
      >
        {players.map(player => (
          <motion.div key={player.id} variants={cardVariants}>
            <StatCard
              playerName={player.name}
              color={player.color}
              stats={stats.playerStats[player.id] || {
                bidsPlaced: 0,
                dudosCalled: 0,
                dudosSuccessful: 0,
                calzasCalled: 0,
                calzasSuccessful: 0,
                diceLost: 0,
                diceGained: 0,
              }}
              isWinner={player.id === stats.winnerId}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4"
      >
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReturnToLobby}
            className="flex items-center gap-2 px-6 py-3 bg-gold-accent text-purple-deep font-bold rounded-lg uppercase tracking-wider"
          >
            <RotateCcw className="w-5 h-5" />
            Return to Lobby
          </motion.button>
        ) : (
          <p className="text-white-soft/60 py-3">Waiting for host to return to lobby...</p>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveGame}
          className="flex items-center gap-2 px-6 py-3 bg-purple-mid/50 border border-purple-light/30 text-white-soft font-bold rounded-lg uppercase tracking-wider"
        >
          <Home className="w-5 h-5" />
          Leave Game
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
