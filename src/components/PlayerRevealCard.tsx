'use client';

import { motion } from 'framer-motion';
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

  // Callback functions for determining dice state
  isDieRevealed: (globalIdx: number) => boolean;
  isDieHighlighted: (globalIdx: number) => boolean;
  isDieMatching: (value: number) => boolean;

  // Dying die state (supports both single player format and multiplayer string IDs)
  dyingDieOwner: 'player' | number | string | null;
  dyingDieIndex: number | null;

  // Spawning die state (for Calza success)
  countingComplete: boolean;
  calzaSuccess: boolean;
  spawningDieOwner: 'player' | number | string | null;
  spawningDieValue: number;

  // Player identifier (for matching dying/spawning die owner)
  playerId: string;

  // Optional: use compact size for mobile
  compactSize?: boolean;
}

export function PlayerRevealCard({
  playerName,
  hand,
  color,
  isEliminated: _isEliminated = false,
  baseIdx,
  isRevealed: _isRevealed, // Kept for API compatibility
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
  compactSize = false,
}: PlayerRevealCardProps) {
  const colorConfig = PLAYER_COLORS[color];

  // Helper to check if this player is the owner (supports single player and multiplayer)
  const isOwner = (owner: 'player' | number | string | null): boolean => {
    if (owner === null) return false;
    // Single player mode: 'player' string literal
    if (playerId === 'player' && owner === 'player') return true;
    // Single player mode: opponent number ID
    if (playerId !== 'player' && typeof owner === 'number') {
      return owner.toString() === playerId;
    }
    // Multiplayer mode: string player ID comparison
    if (typeof owner === 'string' && owner !== 'player') {
      return owner === playerId;
    }
    return false;
  };

  // Use xs size on mobile (via compactSize prop or default for grid layout)
  const diceSize = compactSize ? 'xs' : 'xs';

  // Calculate placeholder slots to reserve space for 5 dice
  // This prevents layout jumping as dice are revealed
  const maxDice = 5;
  const placeholderSlots = Math.max(0, maxDice - hand.length);

  return (
    <div
      className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-purple-deep/50 border border-purple-mid"
    >
      <p className="text-[10px] sm:text-xs text-white-soft/60 uppercase mb-1 sm:mb-2 font-semibold truncate max-w-full">
        <span style={{ color: colorConfig.bg }}>{playerName}</span>
      </p>
      {/* Dice container with fixed min-width for 5 dice: 5 * w-7 (28px) + 4 * gap-1 (4px) = 156px */}
      <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 min-w-[148px] sm:min-w-[156px]">
        {hand.map((value, i) => {
          const globalIdx = baseIdx + i;
          const isHighlighted = isDieHighlighted(globalIdx);
          const isMatching = isDieMatching(value);
          const dieIsRevealed = isDieRevealed(globalIdx);
          const isDying = isOwner(dyingDieOwner) && dyingDieIndex === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={dieIsRevealed ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="w-7 h-7"
            >
              {isDying ? (
                <DyingDie value={value} color={color} size={diceSize} />
              ) : (
                <Dice
                  value={value}
                  index={baseIdx + i}
                  size={diceSize}
                  color={color}
                  highlighted={isHighlighted}
                  dimmed={countingComplete && !isMatching}
                />
              )}
            </motion.div>
          );
        })}
        {/* Spawning die for Calza success - appears right after existing dice */}
        {countingComplete && calzaSuccess && isOwner(spawningDieOwner) && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
            className="w-7 h-7"
          >
            <SpawningDie value={spawningDieValue} color={color} size={diceSize} />
          </motion.div>
        )}
        {/* Invisible placeholder slots to maintain width for up to 5 dice */}
        {/* Subtract 1 if spawning die is showing since it takes a slot */}
        {Array.from({ length: Math.max(0, placeholderSlots - (countingComplete && calzaSuccess && isOwner(spawningDieOwner) ? 1 : 0)) }).map((_, i) => (
          <div key={`placeholder-${i}`} className="w-7 h-7" />
        ))}
      </div>
    </div>
  );
}

export default PlayerRevealCard;
