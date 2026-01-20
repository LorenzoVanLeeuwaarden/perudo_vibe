'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PLAYER_COLORS } from '@/lib/types';
import { SortedDiceDisplay } from './SortedDiceDisplay';
import { DyingDie } from './DyingDie';
import { Dice } from './Dice';
import type { ServerPlayer, Bid } from '@/shared';
import type { PlayerColor } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RoundResult {
  bid: Bid;
  actualCount: number;
  loserId: string | null;
  winnerId: string | null;
  isCalza: boolean;
  lastBidderId?: string;
}

interface RevealPhaseProps {
  players: ServerPlayer[];
  revealedHands: Record<string, number[]>;
  roundResult: RoundResult;
  onContinue: () => void;
  showOverlay: boolean;
}

type RevealStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function RevealPhase({
  players,
  revealedHands,
  roundResult,
  onContinue,
  showOverlay,
}: RevealPhaseProps) {
  const [step, setStep] = useState<RevealStep>(0);
  const [dyingDieVisible, setDyingDieVisible] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [countedDice, setCountedDice] = useState<number>(0);
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  const handleSkip = () => {
    setSkipped(true);
    setStep(7);
    setCountedDice(roundResult.actualCount); // Show full count immediately
    // Also show dying die immediately if there's a loser
    if (roundResult.loserId && !roundResult.isCalza) {
      setDyingDieVisible(true);
    }
  };

  // Reset counted dice when step changes or overlay resets
  useEffect(() => {
    if (showOverlay) {
      setCountedDice(0);
    }
  }, [showOverlay]);

  // Incremental dice counting animation (during step 4)
  useEffect(() => {
    if (step < 4 || skipped) return;

    // Start counting from 0 up to actualCount
    if (countedDice < roundResult.actualCount) {
      const timer = setTimeout(() => {
        setCountedDice(prev => prev + 1);
      }, 150); // 150ms between each die count
      return () => clearTimeout(timer);
    }
  }, [step, countedDice, roundResult.actualCount, skipped]);

  // Animation sequence timing
  useEffect(() => {
    // Wait for overlay to dismiss before starting reveal sequence
    if (showOverlay) {
      setStep(0);
      return;
    }

    // If skipped, don't run timers
    if (skipped) {
      return;
    }

    // Step 1: Start revealing (overlay just dismissed)
    const step1 = setTimeout(() => setStep(1), 100);

    // Step 2: Dice reveal (staggered appearance)
    const step2 = setTimeout(() => setStep(2), 1000);

    // Step 3: Highlight matching dice
    const step3 = setTimeout(() => setStep(3), 2000);

    // Step 4: Show count comparison
    const step4 = setTimeout(() => setStep(4), 3000);

    // Step 5: Show result (winner/loser)
    const step5 = setTimeout(() => setStep(5), 4000);

    // Step 6: Die removal animation
    const step6 = setTimeout(() => {
      setStep(6);
      if (roundResult.loserId && !roundResult.isCalza) {
        setDyingDieVisible(true);
      }
    }, 5500);

    // Step 7: Show continue button
    const step7 = setTimeout(() => setStep(7), 7000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);
      clearTimeout(step5);
      clearTimeout(step6);
      clearTimeout(step7);
    };
  }, [showOverlay, roundResult.loserId, roundResult.isCalza, skipped]);

  const { bid, actualCount, loserId, winnerId, isCalza, lastBidderId } = roundResult;
  const loser = players.find((p) => p.id === loserId);
  const winner = players.find((p) => p.id === winnerId);
  const lastBidder = players.find((p) => p.id === lastBidderId);

  // Determine if this is a successful challenge
  const dudoSuccess = !isCalza && actualCount < bid.count;
  const calzaSuccess = isCalza && actualCount === bid.count;

  // Counting is complete when we've reached actualCount
  const countingComplete = countedDice >= actualCount || skipped;
  const isCountingStarted = step >= 4 || skipped;

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

  // Filter to only active (non-eliminated) players for display
  const activePlayers = players.filter((p) => !p.isEliminated || p.id === loserId);

  // Get last bidder color config (fallback to orange if not found)
  const bidderColorConfig = lastBidder
    ? PLAYER_COLORS[lastBidder.color as PlayerColor]
    : PLAYER_COLORS.orange;

  return (
    <AnimatePresence>
      {step > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          style={{
            background: useSimplifiedAnimations
              ? 'linear-gradient(180deg, rgba(26, 15, 46, 0.98) 0%, rgba(13, 7, 23, 1) 100%)'
              : 'linear-gradient(180deg, rgba(26, 15, 46, 0.95) 0%, rgba(13, 7, 23, 0.98) 100%)',
            backdropFilter: useSimplifiedAnimations ? 'none' : 'blur(8px)',  // Skip blur on Firefox/reduced motion
          }}
        >
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-gold-accent mb-4 sm:mb-6 text-center"
          >
            {isCalza ? 'CALZA!' : 'DUDO!'} Called
          </motion.h2>

          {/* Bid vs Actual comparison - stacks on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            {/* BID block - uses last bidder's color */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 p-2 sm:p-4 rounded-lg bg-purple-deep/70 border-2 max-w-none sm:max-w-[200px] mx-auto sm:mx-0"
              style={{ borderColor: bidderColorConfig.border }}
            >
              <p
                className="text-[10px] sm:text-xs uppercase font-bold mb-2 sm:mb-3 tracking-wider"
                style={{ color: bidderColorConfig.bg }}
              >
                The Bid
                {lastBidder && (
                  <span className="ml-1 sm:ml-2 opacity-70">
                    ({lastBidder.name})
                  </span>
                )}
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
                      color={lastBidder?.color as PlayerColor || 'orange'}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: bidderColorConfig.bg }}>
                {bid.count}x
              </p>
            </motion.div>

            {/* VS divider - horizontal on mobile */}
            <div className="flex items-center justify-center py-1 sm:py-0">
              <motion.div
                animate={useSimplifiedAnimations ? {} : { scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-white-soft/40 font-bold text-sm sm:text-lg"
              >
                VS
              </motion.div>
            </div>

            {/* ACTUAL block - shows dice incrementally */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`flex-1 p-2 sm:p-4 rounded-lg bg-purple-deep/70 border-2 max-w-none sm:max-w-[250px] mx-auto sm:mx-0 ${getActualBlockBorderColor()}`}
            >
              <p className={`text-[10px] sm:text-xs uppercase font-bold mb-2 sm:mb-3 tracking-wider ${getActualBlockTextColor()}`}>
                Actual
              </p>
              <div className="flex flex-wrap justify-center gap-1 mb-1 sm:mb-2 min-h-[28px] sm:min-h-[40px]">
                {isCountingStarted ? (
                  <>
                    {/* Show matching dice incrementally as they're counted */}
                    {Array.from({ length: countedDice }).map((_, i) => (
                      <motion.div
                        key={`match-${i}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Dice
                          value={bid.value}
                          index={i}
                          size="xs"
                          color="orange"
                          highlighted
                        />
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <motion.div
                    animate={useSimplifiedAnimations ? {} : { opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-purple-glow text-xl sm:text-2xl"
                  >
                    ?
                  </motion.div>
                )}
              </div>
              <motion.p
                key={countedDice}
                initial={countedDice > 0 ? { scale: 1.3, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-xl sm:text-2xl font-bold ${getActualBlockTextColor()}`}
              >
                {isCountingStarted ? `${countedDice}x` : '...'}
              </motion.p>
            </motion.div>
          </div>

          {/* Players' revealed hands - 2-column grid on mobile, flexible row on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: (step >= 2 || skipped) ? 1 : 0 }}
            transition={{ duration: skipped ? 0 : 0.5 }}
            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 mb-4 sm:mb-6 max-w-4xl mx-auto"
          >
            {activePlayers.map((player, index) => {
              const hand = revealedHands[player.id] || [];
              const colorConfig = PLAYER_COLORS[player.color as PlayerColor];
              const isLoser = player.id === loserId;
              const isWinner = player.id === winnerId && isCalza;
              const matchingCount = hand.filter(
                (d) => d === bid.value || (!roundResult.isCalza && d === 1)
              ).length;

              // Determine border style based on result (after step 5)
              const getBorderClass = () => {
                if (step < 5 && !skipped) return 'border-purple-mid';
                if (isLoser) return 'border-red-danger border-2';
                if (isWinner) return 'border-green-crt border-2';
                return 'border-purple-mid';
              };

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, type: 'spring', stiffness: 400, damping: 25 }}
                  className={`flex flex-col p-2 sm:p-3 rounded-lg bg-purple-deep/50 border min-w-[120px] sm:min-w-[140px] ${getBorderClass()}`}
                >
                  {/* Player name header */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs sm:text-sm font-bold truncate"
                      style={{ color: colorConfig.bg }}
                    >
                      {player.name}
                    </span>
                    {/* Matching count badge */}
                    {(step >= 3 || skipped) && matchingCount > 0 && (
                      <motion.span
                        initial={skipped ? false : { opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-gold-accent/20 text-gold-accent font-bold ml-1"
                      >
                        {matchingCount}x
                      </motion.span>
                    )}
                  </div>

                  {/* Dice display */}
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {hand.map((value, dieIndex) => {
                      const isMatching = value === bid.value || (!isCalza && value === 1);
                      const showHighlight = (step >= 3 || skipped) && isMatching;
                      const showDim = (step >= 3 || skipped) && !isMatching;
                      const isDying = dyingDieVisible && isLoser && dieIndex === hand.length - 1;

                      if (isDying) {
                        return (
                          <DyingDie
                            key={dieIndex}
                            value={value}
                            color={player.color as PlayerColor}
                          />
                        );
                      }

                      return (
                        <motion.div
                          key={dieIndex}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{
                            opacity: showDim ? 0.3 : 1,
                            scale: 1,
                            rotate: 0,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                            delay: 0.05 * dieIndex,
                          }}
                          className={`relative ${showHighlight ? 'z-10' : ''}`}
                        >
                          {/* Glow effect for matching dice - simplified on Firefox/reduced motion */}
                          {showHighlight && !useSimplifiedAnimations && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="absolute -inset-1 rounded-lg"
                              style={{
                                background: `radial-gradient(circle, ${colorConfig.glow}80 0%, transparent 70%)`,
                                filter: 'blur(4px)',
                              }}
                            />
                          )}
                          {/* Firefox/reduced motion: Simple border highlight instead */}
                          {showHighlight && useSimplifiedAnimations && (
                            <div
                              className="absolute -inset-1 rounded-lg border-2"
                              style={{ borderColor: colorConfig.glow }}
                            />
                          )}
                          <SortedDiceDisplay
                            dice={[value]}
                            color={player.color as PlayerColor}
                            size="sm"
                            animateSort={false}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Result */}
          <AnimatePresence>
            {(step >= 5 || skipped) && (
              <motion.div
                initial={skipped ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-8"
              >
                {/* Success/Failure banner */}
                {isCalza ? (
                  calzaSuccess ? (
                    <motion.div
                      initial={{ y: 10 }}
                      animate={{ y: 0 }}
                      className="text-green-500 font-bold text-xl mb-2"
                    >
                      Calza Successful!
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ y: 10 }}
                      animate={{ y: 0 }}
                      className="text-red-danger font-bold text-xl mb-2"
                    >
                      Calza Failed!
                    </motion.div>
                  )
                ) : dudoSuccess ? (
                  <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    className="text-green-500 font-bold text-xl mb-2"
                  >
                    Dudo Correct!
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    className="text-red-danger font-bold text-xl mb-2"
                  >
                    Dudo Wrong!
                  </motion.div>
                )}

                {/* Winner/Loser labels */}
                {loser && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-red-danger"
                  >
                    <span
                      className="font-bold"
                      style={{ color: PLAYER_COLORS[loser.color as PlayerColor].bg }}
                    >
                      {loser.name}
                    </span>{' '}
                    loses a die!
                  </motion.p>
                )}
                {winner && isCalza && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-green-500"
                  >
                    <span
                      className="font-bold"
                      style={{ color: PLAYER_COLORS[winner.color as PlayerColor].bg }}
                    >
                      {winner.name}
                    </span>{' '}
                    gains a die!
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button - shown during animation steps 1-6 */}
          <AnimatePresence>
            {step >= 1 && step < 7 && !skipped && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSkip}
                className="fixed bottom-6 right-6 px-4 py-2 bg-purple-mid/80 text-white-soft/70 font-medium rounded-lg text-sm uppercase tracking-wider border border-purple-light/30 hover:bg-purple-light/50 hover:text-white-soft transition-colors"
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>

          {/* Continue button */}
          <AnimatePresence>
            {step >= 7 && (
              <motion.button
                initial={skipped ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className="px-8 py-3 bg-gold-accent text-purple-deep font-bold rounded-lg uppercase tracking-wider shadow-lg"
                style={{
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                }}
              >
                Continue
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RevealPhase;
