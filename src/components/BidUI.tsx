'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle, Send, Target, Bot, Lock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Bid, PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { isValidBid } from '@/lib/gameLogic';
import { Dice } from './Dice';

interface BidUIProps {
  currentBid: Bid | null;
  onBid: (bid: Bid) => void;
  onDudo: () => void;
  onCalza: () => void;
  isMyTurn: boolean;
  totalDice: number;
  isPalifico?: boolean;
  canCalza?: boolean;
  playerColor: PlayerColor;
  lastBidderColor?: PlayerColor;
  lastBidderName?: string;
  hideBidDisplay?: boolean;
  wasAutoPlayed?: boolean;  // True if current bid was made by timeout AI
  onValueChange?: (value: number) => void;  // Called when selected bid value changes
}

export function BidUI({
  currentBid,
  onBid,
  onDudo,
  onCalza,
  isMyTurn,
  totalDice,
  isPalifico = false,
  canCalza = false,
  playerColor,
  lastBidderColor,
  lastBidderName,
  hideBidDisplay = false,
  wasAutoPlayed = false,
  onValueChange,
}: BidUIProps) {
  const getInitialCount = () => {
    if (!currentBid) return 1;
    if (isPalifico) return currentBid.count + 1;
    return currentBid.count;
  };

  const getInitialValue = () => {
    if (!currentBid) return 2;
    if (isPalifico) return currentBid.value;
    // Start with same value, user must increase either count or value
    return currentBid.value;
  };

  const [count, setCount] = useState(getInitialCount);
  const [value, setValue] = useState(getInitialValue);
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('up');
  const [valueDirection, setValueDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (isMyTurn) {
      // Initialize count based on current bid
      if (!currentBid) {
        setCount(1);
      } else if (isPalifico) {
        setCount(currentBid.count + 1);
      } else {
        setCount(currentBid.count);
      }
      // Initialize value based on current bid
      if (!currentBid) {
        setValue(2);
      } else {
        setValue(currentBid.value);
      }
    }
  }, [isMyTurn, currentBid, isPalifico]);

  // Notify parent of value changes for dice highlighting
  useEffect(() => {
    if (isMyTurn && onValueChange) {
      onValueChange(value);
    }
  }, [value, isMyTurn, onValueChange]);

  const validation = isValidBid({ count, value }, currentBid, totalDice, isPalifico);

  // Don't render empty panel when there's nothing to show
  const hasBidToDisplay = currentBid && !hideBidDisplay;
  const hasContentToShow = isMyTurn || hasBidToDisplay || isPalifico;

  if (!hasContentToShow) {
    return null;
  }

  const handleBid = () => {
    if (validation.valid) {
      onBid({ count, value });
    }
  };

  const incrementCount = () => {
    setCountDirection('up');
    setCount((c) => Math.min(c + 1, totalDice));
  };
  const decrementCount = () => {
    setCountDirection('down');
    setCount((c) => Math.max(c - 1, 1));
  };
  // In palifico, value is only locked AFTER first bid is made
  const isValueLocked = isPalifico && currentBid !== null;
  // Opening bid cannot be jokers (value=1), so skip it when cycling
  const isOpeningBid = !currentBid;
  const incrementValue = () => {
    if (!isValueLocked) {
      setValueDirection('up');
      setValue((v) => {
        const next = v === 6 ? 1 : v + 1;
        // Skip jokers for opening bid
        if (isOpeningBid && next === 1) return 2;
        return next;
      });
    }
  };
  const decrementValue = () => {
    if (!isValueLocked) {
      setValueDirection('down');
      setValue((v) => {
        const next = v === 1 ? 6 : v - 1;
        // Skip jokers for opening bid
        if (isOpeningBid && next === 1) return 6;
        return next;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="retro-panel p-4 sm:p-6 max-w-md w-full"
      style={{
        borderColor: PLAYER_COLORS[playerColor].border,
        boxShadow: `
          0 4px 0 0 #061212,
          0 6px 10px 0 rgba(0, 0, 0, 0.5),
          0 10px 20px 0 rgba(0, 0, 0, 0.3),
          0 0 20px ${PLAYER_COLORS[playerColor].glow},
          inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {isPalifico && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-4 text-center"
        >
          <span className="px-4 py-1 bg-red-danger/20 border border-red-danger rounded-full text-red-danger text-xs font-bold uppercase tracking-wider">
            Palifico Round
          </span>
        </motion.div>
      )}

      {currentBid && !hideBidDisplay && (
        <div className="mb-6 relative">
          {/* Player chip badge - tucked into top border */}
          {lastBidderName && (
            <div
              className="absolute -top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-[0.15em] z-10"
              style={{
                background: `linear-gradient(135deg, ${lastBidderColor ? `var(--${lastBidderColor === 'orange' ? 'marigold' : lastBidderColor === 'blue' ? 'turquoise' : 'purple-light'})` : 'var(--purple-light)'} 0%, var(--purple-mid) 100%)`,
                border: '1px solid var(--turquoise-dark)',
                color: 'var(--bone-white)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {lastBidderName}
              {wasAutoPlayed && (
                <span className="inline-flex items-center ml-1.5">
                  <Bot className="w-3 h-3" />
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[280px] mx-auto pt-2">
            {Array.from({ length: currentBid.count }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 400 }}
              >
                <Dice
                  value={currentBid.value}
                  index={i}
                  size="sm"
                  isPalifico={isPalifico}
                  color={lastBidderColor || playerColor}
                />
              </motion.div>
            ))}
          </div>
          {/* Count badge */}
          <p
            className="text-center text-2xl font-black text-marigold mt-2"
            style={{ textShadow: '0 0 10px var(--marigold)' }}
          >
            {currentBid.count}×
          </p>
        </div>
      )}

      {isMyTurn && (
        <>
          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* COUNT selector */}
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={incrementCount}
                  className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center bg-purple-mid hover:bg-purple-light rounded border border-turquoise-dark transition-colors"
                >
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                </motion.button>
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                  {/* Tumbler animation container */}
                  <AnimatePresence mode="popLayout" initial={false} custom={countDirection}>
                    <motion.span
                      key={count}
                      custom={countDirection}
                      variants={{
                        enter: (dir: 'up' | 'down') => ({ y: dir === 'up' ? 40 : -40, opacity: 0 }),
                        center: { y: 0, opacity: 1, pointerEvents: 'auto' as const },
                        exit: (dir: 'up' | 'down') => ({ y: dir === 'up' ? -40 : 40, opacity: 0, pointerEvents: 'none' as const }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="text-4xl sm:text-5xl font-black text-marigold-glow absolute"
                      style={{ textShadow: '0 0 20px var(--marigold), 0 2px 0 var(--marigold)' }}
                    >
                      {count}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={decrementCount}
                  className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center bg-purple-mid hover:bg-purple-light rounded border border-turquoise-dark transition-colors"
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                </motion.button>
              </div>
            </div>

            {/* Large multiplication sign */}
            <span className="text-4xl sm:text-5xl font-black text-white-soft/30">×</span>

            {/* VALUE selector */}
            <div className="flex flex-col items-center relative">
              {/* Icon label - Lock when value is locked */}
              {isValueLocked && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-purple-deep px-1.5 py-0.5 rounded-sm z-10">
                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-danger/70" />
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <motion.button
                  whileHover={!isValueLocked ? { scale: 1.1 } : {}}
                  whileTap={!isValueLocked ? { scale: 0.95 } : {}}
                  onClick={incrementValue}
                  disabled={isValueLocked}
                  className={`w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center rounded border transition-colors ${
                    isValueLocked
                      ? 'bg-purple-deep border-purple-mid opacity-30 cursor-not-allowed'
                      : 'bg-purple-mid hover:bg-purple-light border-turquoise-dark'
                  }`}
                >
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                </motion.button>
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                  {/* Tumbler animation for dice */}
                  <AnimatePresence mode="popLayout" initial={false} custom={valueDirection}>
                    <motion.div
                      key={value}
                      custom={valueDirection}
                      variants={{
                        enter: (dir: 'up' | 'down') => ({ y: dir === 'up' ? 50 : -50, opacity: 0 }),
                        center: { y: 0, opacity: 1, pointerEvents: 'auto' as const },
                        exit: (dir: 'up' | 'down') => ({ y: dir === 'up' ? -50 : 50, opacity: 0, pointerEvents: 'none' as const }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="absolute"
                    >
                      <Dice value={value} size="md" isPalifico={isPalifico} color={playerColor} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <motion.button
                  whileHover={!isValueLocked ? { scale: 1.1 } : {}}
                  whileTap={!isValueLocked ? { scale: 0.95 } : {}}
                  onClick={decrementValue}
                  disabled={isValueLocked}
                  className={`w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center rounded border transition-colors ${
                    isValueLocked
                      ? 'bg-purple-deep border-purple-mid opacity-30 cursor-not-allowed'
                      : 'bg-purple-mid hover:bg-purple-light border-turquoise-dark'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            {/* BID button - always shown, full width */}
            <motion.button
              whileHover={validation.valid ? { scale: 1.02 } : {}}
              whileTap={validation.valid ? { scale: 0.98 } : {}}
              onClick={handleBid}
              disabled={!validation.valid}
              className={`
                w-full retro-button retro-button-orange
                flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base
                ${!validation.valid ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              BID
            </motion.button>

            {/* Calza and Dudo row - only shown when there's a current bid */}
            {currentBid && (
              <div className="flex gap-2 sm:gap-3">
                {canCalza && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCalza}
                    className="flex-1 py-2 sm:py-2.5 px-3 rounded-lg font-bold uppercase text-xs sm:text-[11px] flex items-center justify-center gap-1"
                    style={{
                      background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                      border: '2px solid #4ade80',
                      borderBottom: '3px solid #15803d',
                      color: '#fff',
                      letterSpacing: '0.15em',
                      boxShadow: '0 3px 0 0 #166534, 0 5px 10px 0 rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    CALZA!
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDudo}
                  className="flex-1 retro-button retro-button-danger flex items-center justify-center gap-1 text-xs sm:text-[11px] py-2 sm:py-2.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  DUDO!
                </motion.button>
              </div>
            )}
          </div>

        </>
      )}

    </motion.div>
  );
}

export default BidUI;
