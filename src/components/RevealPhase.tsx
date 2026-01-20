'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { RevealContent } from './RevealContent';
import type { ServerPlayer, Bid } from '@/shared';
import type { PlayerColor } from '@/lib/types';

interface RoundResult {
  bid: Bid;
  actualCount: number;
  loserId: string | null;
  winnerId: string | null;
  isCalza: boolean;
  lastBidderId?: string | null;
}

interface RevealPhaseProps {
  players: ServerPlayer[];
  revealedHands: Record<string, number[]>;
  roundResult: RoundResult;
  onContinue: () => void;
  showOverlay: boolean;
  isPalifico?: boolean;
}

export function RevealPhase({
  players,
  revealedHands,
  roundResult,
  onContinue,
  showOverlay,
  isPalifico = false,
}: RevealPhaseProps) {
  const [visible, setVisible] = useState(false);
  const [skipped, setSkipped] = useState(false);
  // Granular reveal tracking (like single player)
  const [revealProgress, setRevealProgress] = useState<number>(0);
  const [highlightedDiceIndex, setHighlightedDiceIndex] = useState<number>(-1);
  const [countingComplete, setCountingComplete] = useState(false);
  const [dyingDieVisible, setDyingDieVisible] = useState(false);

  // Calculate active players and total dice for reveal
  const activePlayers = players.filter((p) => !p.isEliminated || p.id === roundResult.loserId);
  const totalDice = activePlayers.reduce((sum, p) => (revealedHands[p.id]?.length || 0) + sum, 0);

  const { bid, actualCount, loserId, winnerId, isCalza, lastBidderId } = roundResult;
  const lastBidder = players.find((p) => p.id === lastBidderId);
  const calzaSuccess = isCalza && actualCount === bid.count;

  // Check if game is over (only one player left)
  const isGameOver = activePlayers.filter(p => !p.isEliminated).length <= 1;

  // Get all matching dice with their player colors
  // Jokers (1s) count as wildcards for both Dudo and Calza, UNLESS it's palifico mode
  const getMatchingDice = useCallback(() => {
    const matches: Array<{ value: number; color: PlayerColor; globalIdx: number; isJoker: boolean }> = [];
    let globalIdx = 0;

    for (const player of activePlayers) {
      const hand = revealedHands[player.id] || [];
      for (const value of hand) {
        // In palifico, only exact matches count. Otherwise jokers (1s) are wild.
        const isMatch = isPalifico
          ? value === bid.value
          : (value === bid.value || (value === 1 && bid.value !== 1));
        if (isMatch) {
          matches.push({
            value,
            color: player.color as PlayerColor,
            globalIdx,
            isJoker: value === 1,
          });
        }
        globalIdx++;
      }
    }
    return matches;
  }, [activePlayers, revealedHands, bid.value, isPalifico]);

  // Get currently counted (revealed) matching dice
  const getCountedDice = useCallback(() => {
    const allMatches = getMatchingDice();
    return allMatches.filter(m => m.globalIdx <= highlightedDiceIndex);
  }, [getMatchingDice, highlightedDiceIndex]);

  // Handle skip
  const handleSkip = useCallback(() => {
    setSkipped(true);
    setRevealProgress(totalDice);
    const allMatches = getMatchingDice();
    setHighlightedDiceIndex(allMatches.length > 0 ? allMatches[allMatches.length - 1].globalIdx : -1);
    setCountingComplete(true);
    if (loserId && !isCalza) {
      setDyingDieVisible(true);
    }
  }, [totalDice, getMatchingDice, loserId, isCalza]);

  // Reset state when overlay shows/hides
  useEffect(() => {
    if (showOverlay) {
      setVisible(false);
      setRevealProgress(0);
      setHighlightedDiceIndex(-1);
      setCountingComplete(false);
      setSkipped(false);
      setDyingDieVisible(false);
    } else {
      // Overlay dismissed, start reveal
      setVisible(true);
    }
  }, [showOverlay]);

  // Incremental dice reveal animation
  useEffect(() => {
    if (!visible || skipped || showOverlay) return;
    if (revealProgress >= totalDice) return;

    const timer = setTimeout(() => {
      setRevealProgress(prev => prev + 1);
    }, 100);

    return () => clearTimeout(timer);
  }, [visible, revealProgress, totalDice, skipped, showOverlay]);

  // Once all dice revealed, start highlighting matching dice
  useEffect(() => {
    if (revealProgress < totalDice || skipped || showOverlay) return;
    // Small delay before starting highlight phase
    const timer = setTimeout(() => {
      // Trigger first highlight
      setHighlightedDiceIndex(-0.5); // Signal to start highlighting
    }, 300);
    return () => clearTimeout(timer);
  }, [revealProgress, totalDice, skipped, showOverlay]);

  // Incremental highlighting of matching dice
  useEffect(() => {
    if (skipped || showOverlay || countingComplete) return;
    if (highlightedDiceIndex < -0.5) return; // Not started yet

    const allMatches = getMatchingDice();
    const currentHighlightCount = highlightedDiceIndex >= 0
      ? allMatches.filter(m => m.globalIdx <= highlightedDiceIndex).length
      : 0;

    if (currentHighlightCount < allMatches.length) {
      const nextMatch = allMatches[currentHighlightCount];
      const timer = setTimeout(() => {
        setHighlightedDiceIndex(nextMatch.globalIdx);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // All matches highlighted
      setCountingComplete(true);
    }
  }, [highlightedDiceIndex, countingComplete, skipped, showOverlay, getMatchingDice]);

  // Show dying die after counting complete
  useEffect(() => {
    if (!countingComplete || skipped || showOverlay) return;
    if (loserId && !isCalza && !dyingDieVisible) {
      const timer = setTimeout(() => {
        setDyingDieVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countingComplete, skipped, showOverlay, loserId, isCalza, dyingDieVisible]);

  // Helper callbacks for RevealContent
  const isDieRevealed = useCallback((globalIdx: number) => {
    if (skipped) return true;
    return globalIdx < revealProgress;
  }, [revealProgress, skipped]);

  const isDieHighlighted = useCallback((globalIdx: number) => {
    if (!countingComplete && highlightedDiceIndex < 0) return false;
    return globalIdx <= highlightedDiceIndex;
  }, [highlightedDiceIndex, countingComplete]);

  const isDieMatching = useCallback((value: number) => {
    // In palifico, only exact matches. Otherwise jokers (1s) are wild (unless bidding on 1s).
    return isPalifico
      ? value === bid.value
      : (value === bid.value || (value === 1 && bid.value !== 1));
  }, [bid.value, isPalifico]);

  const isPlayerSectionRevealed = useCallback((startIdx: number) => {
    if (skipped) return true;
    return revealProgress > startIdx;
  }, [revealProgress, skipped]);

  const getPlayerBaseIdx = useCallback((playerId: string) => {
    let baseIdx = 0;
    for (const player of activePlayers) {
      if (player.id === playerId) return baseIdx;
      baseIdx += (revealedHands[player.id]?.length || 0);
    }
    return baseIdx;
  }, [activePlayers, revealedHands]);

  // Dying/spawning die info
  const dyingDieInfo = {
    owner: (loserId && dyingDieVisible) ? loserId : null,
    index: loserId && dyingDieVisible ? (revealedHands[loserId]?.length || 1) - 1 : null,
  };

  const spawningDieInfo = {
    owner: (winnerId && calzaSuccess && countingComplete) ? winnerId : null,
    value: Math.floor(Math.random() * 5) + 2,
  };

  // Format players for RevealContent
  const revealPlayers = activePlayers.map(p => ({
    id: p.id,
    name: p.name,
    hand: revealedHands[p.id] || [],
    color: p.color as PlayerColor,
    isEliminated: p.isEliminated,
  }));

  const isCountingStarted = highlightedDiceIndex >= 0 || countingComplete;
  const countedDice = getCountedDice();

  return (
    <AnimatePresence>
      {visible && !showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto"
          style={{
            background: 'linear-gradient(180deg, rgba(26, 15, 46, 0.98) 0%, rgba(13, 7, 23, 1) 100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center px-2 sm:px-0"
          >
            <RevealContent
              bid={bid}
              lastBidderName={lastBidder?.name || 'Unknown'}
              lastBidderColor={(lastBidder?.color as PlayerColor) || 'orange'}
              isPalifico={isPalifico}
              actualCount={actualCount}
              isCalza={isCalza}
              countingComplete={countingComplete}
              countedDice={countedDice}
              isCountingStarted={isCountingStarted}
              players={revealPlayers}
              getPlayerBaseIdx={getPlayerBaseIdx}
              isPlayerSectionRevealed={isPlayerSectionRevealed}
              isDieRevealed={isDieRevealed}
              isDieHighlighted={isDieHighlighted}
              isDieMatching={isDieMatching}
              dyingDieOwner={dyingDieInfo.owner}
              dyingDieIndex={dyingDieInfo.index}
              calzaSuccess={calzaSuccess}
              spawningDieOwner={spawningDieInfo.owner}
              spawningDieValue={spawningDieInfo.value}
              onSkip={handleSkip}
              onContinue={onContinue}
              isGameOver={isGameOver}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RevealPhase;
