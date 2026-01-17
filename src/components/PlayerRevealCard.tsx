'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { Dice } from './Dice';
import { DyingDie } from './DyingDie';
import { SpawningDie } from './SpawningDie';

interface PlayerRevealCardProps {
  playerName: string;
  hand: number[];
  color: PlayerColor;
  isEliminated?: boolean;
  baseIdx: number;
  isRevealed: boolean;
  isPalifico: boolean;

  // Callback functions for determining dice state
  isDieRevealed: (globalIdx: number) => boolean;
  isDieHighlighted: (globalIdx: number) => boolean;
  isDieMatching: (value: number) => boolean;

  // Dying die state
  dyingDieOwner: 'player' | number | null;
  dyingDieIndex: number | null;

  // Spawning die state (for Calza success)
  countingComplete: boolean;
  calzaSuccess: boolean;
  spawningDieOwner: 'player' | number | null;
  spawningDieValue: number;

  // Player identifier (for matching dying/spawning die owner)
  playerId: string;
}

export function PlayerRevealCard({
  playerName,
  hand,
  color,
  isEliminated = false,
  baseIdx,
  isRevealed,
  isPalifico,
  isDieRevealed,
  isDieHighlighted,
  isDieMatching,
  dyingDieOwner,
  dyingDieIndex,
  countingComplete,
  calzaSuccess,
  spawningDieOwner,
  spawningDieValue,
  playerId,
}: PlayerRevealCardProps) {
  const colorConfig = PLAYER_COLORS[color];

  // Helper to check if this player is the owner
  const isOwner = (owner: 'player' | number | null): boolean => {
    if (owner === null) return false;
    if (playerId === 'player' && owner === 'player') return true;
    if (playerId !== 'player' && typeof owner === 'number') {
      return owner.toString() === playerId;
    }
    return false;
  };

  return (
    <AnimatePresence>
      {isRevealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`flex flex-col items-center p-3 rounded-lg bg-purple-deep/50 border ${
            isEliminated ? 'border-red-danger/50 opacity-50' : 'border-purple-mid'
          }`}
        >
          <p className="text-xs text-white-soft/60 uppercase mb-2 font-semibold">
            <span style={{ color: colorConfig.bg }}>{playerName}</span>
            {isEliminated && <span className="ml-1 text-red-danger">✗</span>}
          </p>
          <div className="flex gap-1">
            {hand.map((value, i) => {
              const globalIdx = baseIdx + i;
              const isHighlighted = isDieHighlighted(globalIdx);
              const isMatching = isDieMatching(value);
              const isRevealed = isDieRevealed(globalIdx);
              const isDying = isOwner(dyingDieOwner) && dyingDieIndex === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={isRevealed ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {isDying ? (
                    <DyingDie value={value} color={color} />
                  ) : (
                    <Dice
                      value={value}
                      index={baseIdx + i}
                      size="sm"
                      isPalifico={isPalifico}
                      color={color}
                      highlighted={isHighlighted}
                      dimmed={countingComplete && !isMatching}
                    />
                  )}
                </motion.div>
              );
            })}
            {/* Spawning die for Calza success */}
            {countingComplete && calzaSuccess && isOwner(spawningDieOwner) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
              >
                <SpawningDie value={spawningDieValue} color={color} />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PlayerRevealCard;
