'use client';

import { motion } from 'framer-motion';
import { Crown, WifiOff, X } from 'lucide-react';
import { PLAYER_COLORS } from '@/lib/types';
import type { ServerPlayer } from '@/shared';

interface PlayerRowProps {
  player: ServerPlayer;
  isMe: boolean;
  showKick: boolean;
  onKick: () => void;
  showDisconnectedVisual?: boolean;
}

export function PlayerRow({ player, isMe, showKick, onKick, showDisconnectedVisual }: PlayerRowProps) {
  const colorConfig = PLAYER_COLORS[player.color];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
        showDisconnectedVisual ? 'opacity-50 grayscale' : ''
      } ${
        isMe
          ? 'bg-purple-mid/30 border-purple-glow'
          : 'bg-purple-deep/30 border-purple-mid'
      }`}
    >
      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ background: colorConfig.bg }}
      />

      {/* Name */}
      <span className="flex-1 text-white-soft font-medium truncate">
        {player.name}
      </span>

      {/* Crown for host */}
      {player.isHost && (
        <Crown className="w-5 h-5 text-gold-accent flex-shrink-0" />
      )}

      {/* Disconnected indicator */}
      {!player.isConnected && (
        <WifiOff className="w-4 h-4 text-white-soft/40 flex-shrink-0" />
      )}

      {/* Kick button */}
      {showKick && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onKick}
          className="w-6 h-6 rounded flex items-center justify-center text-white-soft/50 hover:text-red-danger transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
