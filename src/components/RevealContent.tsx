'use client';

import { motion } from 'framer-motion';
import { Trophy, Dices } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { PlayerRevealCard } from './PlayerRevealCard';
import { Dice } from './Dice';

interface MatchedDie {
  value: number;
  color: PlayerColor;
  globalIdx: number;
  isJoker: boolean;
}

interface RevealPlayer {
  id: string;
  name: string;
  hand: number[];
  color: PlayerColor;
  isEliminated: boolean;
}

interface RevealContentProps {
  // Bid info
  bid: { count: number; value: number };
  lastBidderName: string;
  lastBidderColor: PlayerColor;
  isPalifico: boolean;

  // Result info
  actualCount: number;
  isCalza: boolean;
  countingComplete: boolean;
  countedDice: MatchedDie[];
  isCountingStarted: boolean;

  // Players
  players: RevealPlayer[];
  getPlayerBaseIdx: (playerId: string) => number;

  // Reveal state callbacks
  isPlayerSectionRevealed: (startIdx: number) => boolean;
  isDieRevealed: (globalIdx: number) => boolean;
  isDieHighlighted: (globalIdx: number) => boolean;
  isDieMatching: (value: number) => boolean;

  // Dying/Spawning die info
  dyingDieOwner: 'player' | number | string | null;
  dyingDieIndex: number | null;
  calzaSuccess: boolean;
  spawningDieOwner: 'player' | number | string | null;
  spawningDieValue: number;

  // Actions
  onSkip: () => void;
  onContinue: () => void;

  // Game over state (for button text/icon)
  isGameOver: boolean;
}

export function RevealContent({
  bid,
  lastBidderName,
  lastBidderColor,
  isPalifico,
  actualCount,
  isCalza,
  countingComplete,
  countedDice,
  isCountingStarted,
  players,
  getPlayerBaseIdx,
  isPlayerSectionRevealed,
  isDieRevealed,
  isDieHighlighted,
  isDieMatching,
  dyingDieOwner,
  dyingDieIndex,
  calzaSuccess,
  spawningDieOwner,
  spawningDieValue,
  onSkip,
  onContinue,
  isGameOver,
}: RevealContentProps) {
  const bidderConfig = PLAYER_COLORS[lastBidderColor];

  // Get border color based on result after counting complete
  const getActualBlockBorderColor = () => {
    if (!countingComplete) return 'border-purple-glow';
    if (isCalza) {
      return actualCount === bid.count ? 'border-green-crt' : 'border-red-danger';
    }
    // For Dudo: correct if actualCount < bid.count (the caller was right)
    return actualCount < bid.count ? 'border-green-crt' : 'border-red-danger';
  };

  const getActualBlockTextColor = () => {
    if (!countingComplete) return 'text-purple-glow';
    if (isCalza) {
      return actualCount === bid.count ? 'text-green-crt' : 'text-red-danger';
    }
    return actualCount < bid.count ? 'text-green-crt' : 'text-red-danger';
  };

  // Get container styling based on call type (Dudo vs Calza)
  const getContainerStyle = () => {
    if (isCalza) {
      return {
        border: '3px solid #22c55e',
        boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2), inset 0 0 30px rgba(34, 197, 94, 0.1)',
      };
    }
    // Dudo
    return {
      border: '3px solid #ef4444',
      boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.1)',
    };
  };

  return (
    <div
      className="retro-panel p-3 sm:p-6 max-w-4xl relative overflow-hidden"
      style={getContainerStyle()}
    >
      {/* Diagonal watermark text - DUDO or CALZA - 8-bit pixel style */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute left-1/2 top-1/2 whitespace-nowrap"
          style={{
            transform: 'translate(-50%, -50%) rotate(-35deg)',
          }}
        >
          <span
            className="uppercase"
            style={{
              fontSize: 'clamp(100px, 28vw, 220px)',
              color: isCalza ? '#22c55e' : '#ef4444',
              opacity: 0.18,
              fontFamily: '"Press Start 2P", cursive',
              textShadow: isCalza
                ? '0 0 40px #22c55e, 0 0 80px #22c55e, 6px 6px 0 #14532d'
                : '0 0 40px #ef4444, 0 0 80px #ef4444, 6px 6px 0 #7f1d1d',
            }}
          >
            {isCalza ? 'CALZA' : 'DUDO'}
          </span>
        </div>
      </div>

      {/* Bid vs Actual comparison - stacks on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 relative" style={{ zIndex: 1 }}>
        {/* BID block - uses last bidder's color */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 p-2 sm:p-4 rounded-lg bg-purple-deep/70 border-2 max-w-none sm:max-w-[200px] mx-auto sm:mx-0"
          style={{ borderColor: bidderConfig.border }}
        >
          <p
            className="text-[10px] sm:text-xs uppercase font-bold tracking-wider"
            style={{ color: bidderConfig.bg }}
          >
            The Bid
          </p>
          <p
            className="text-[9px] sm:text-[10px] font-mono opacity-60 mb-2 sm:mb-3"
            style={{ color: bidderConfig.bg }}
          >
            by {lastBidderName}
          </p>
          <div className="flex flex-wrap justify-center gap-1 mb-1 sm:mb-2">
            {Array.from({ length: bid.count }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.03, type: 'spring' }}
              >
                <Dice
                  value={bid.value}
                  index={i}
                  size="xs"
                  isPalifico={isPalifico}
                  color={lastBidderColor}
                />
              </motion.div>
            ))}
          </div>
          <p className="text-xl sm:text-2xl font-bold" style={{ color: bidderConfig.bg }}>
            {bid.count}×
          </p>
        </motion.div>

        {/* VS divider */}
        <div className="flex items-center justify-center py-1 sm:py-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-white-soft/40 font-bold text-sm sm:text-lg"
          >
            VS
          </motion.div>
        </div>

        {/* ACTUAL block - shows dice with their owner's colors */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`flex-1 p-2 sm:p-4 rounded-lg bg-purple-deep/70 border-2 max-w-none sm:max-w-[250px] mx-auto sm:mx-0 ${getActualBlockBorderColor()}`}
        >
          <p
            className={`text-[10px] sm:text-xs uppercase font-bold mb-2 sm:mb-3 tracking-wider ${getActualBlockTextColor()}`}
          >
            The Truth
          </p>
          <div className="flex flex-wrap justify-center gap-1 mb-1 sm:mb-2 min-h-[28px] sm:min-h-[40px]">
            {isCountingStarted ? (
              <>
                {countedDice.map((match, i) => (
                  <motion.div
                    key={`match-${match.globalIdx}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Dice
                      value={match.value}
                      index={i}
                      size="xs"
                      isPalifico={isPalifico && !match.isJoker}
                      color={match.color}
                      highlighted
                    />
                  </motion.div>
                ))}
              </>
            ) : (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-purple-glow text-xl sm:text-2xl"
              >
                ?
              </motion.div>
            )}
          </div>
          <motion.p
            key={countedDice.length}
            initial={countedDice.length > 0 ? { scale: 1.3, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-xl sm:text-2xl font-bold ${getActualBlockTextColor()}`}
          >
            {isCountingStarted ? `${countedDice.length}×` : '...'}
          </motion.p>
        </motion.div>
      </div>

      {/* Dice reveal grid - 2-column on mobile, flexible on larger screens */}
      {/* Only show players who have dice to reveal this round */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 mb-4 sm:mb-6 max-w-4xl mx-auto relative" style={{ zIndex: 1 }}>
        {players
          .filter((player) => player.hand.length > 0)
          .map((player) => {
            const baseIdx = getPlayerBaseIdx(player.id);
            return (
              <PlayerRevealCard
                key={player.id}
                playerName={player.name}
                hand={player.hand}
                color={player.color}
                isEliminated={player.isEliminated}
                baseIdx={baseIdx}
                isRevealed={isPlayerSectionRevealed(baseIdx)}
                isPalifico={isPalifico}
                isDieRevealed={isDieRevealed}
                isDieHighlighted={isDieHighlighted}
                isDieMatching={isDieMatching}
                dyingDieOwner={dyingDieOwner}
                dyingDieIndex={dyingDieIndex}
                countingComplete={countingComplete}
                calzaSuccess={calzaSuccess}
                spawningDieOwner={spawningDieOwner}
                spawningDieValue={spawningDieValue}
                playerId={player.id}
              />
            );
          })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3 relative" style={{ zIndex: 1 }}>
        {/* Skip button - shown while animation is running */}
        {!countingComplete && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSkip}
            className="px-6 py-2 bg-purple-mid/80 text-white-soft/70 font-medium rounded-lg text-sm uppercase tracking-wider border border-purple-light/30 hover:bg-purple-light/50 hover:text-white-soft transition-colors"
          >
            Skip
          </motion.button>
        )}

        {/* Continue button - Día de los Muertos style */}
        {countingComplete && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.98, y: 0 }}
            onClick={onContinue}
            className="group relative flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto mx-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold uppercase tracking-wider overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
              border: '3px solid #fcd34d',
              borderBottom: '5px solid #92400e',
              color: '#1f2937',
              boxShadow:
                '0 6px 0 0 #78350f, 0 8px 20px 0 rgba(0,0,0,0.4), 0 0 30px rgba(245, 158, 11, 0.3)',
            }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transform: 'skewX(-20deg)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {isGameOver ? <Trophy className="w-6 h-6" /> : <Dices className="w-6 h-6" />}
            </motion.div>
            <span className="text-lg relative z-10">
              {isGameOver ? 'SEE RESULTS' : 'CONTINUE'}
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default RevealContent;
