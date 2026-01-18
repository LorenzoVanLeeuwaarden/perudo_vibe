'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayerRow } from '@/components/PlayerRow';
import type { ServerPlayer } from '@/shared';

interface PlayerListProps {
  players: ServerPlayer[];
  myPlayerId: string;
  isHost: boolean;
  onKickPlayer: (playerId: string) => void;
}

const playerVariants = {
  initial: { opacity: 0, x: -20, height: 0 },
  animate: { opacity: 1, x: 0, height: 'auto' },
  exit: { opacity: 0, x: 20, height: 0 },
};

export function PlayerList({ players, myPlayerId, isHost, onKickPlayer }: PlayerListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {players.map((player) => (
          <motion.div
            key={player.id}
            layout
            variants={playerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <PlayerRow
              player={player}
              isMe={player.id === myPlayerId}
              showKick={isHost && player.id !== myPlayerId}
              onKick={() => onKickPlayer(player.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
