'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle, Send, Target, Bot } from 'lucide-react';
import { Bid, PlayerColor } from '@/lib/types';
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

  useEffect(() => {
    if (isMyTurn) {
      setCount(getInitialCount());
      setValue(getInitialValue());
    }
  }, [isMyTurn, currentBid]);

  const validation = isValidBid({ count, value }, currentBid, totalDice, isPalifico);

  const handleBid = () => {
    if (validation.valid) {
      onBid({ count, value });
    }
  };

  const incrementCount = () => setCount((c) => Math.min(c + 1, totalDice));
  const decrementCount = () => setCount((c) => Math.max(c - 1, 1));
  // In palifico, value is only locked AFTER first bid is made
  const isValueLocked = isPalifico && currentBid !== null;
  const incrementValue = () => {
    if (!isValueLocked) setValue((v) => v === 6 ? 1 : v + 1);
  };
  const decrementValue = () => {
    if (!isValueLocked) setValue((v) => v === 1 ? 6 : v - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="retro-panel p-6 max-w-md w-full"
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
          <p className="text-lg font-bold text-white-soft/80 mt-2 text-center">
            {currentBid.count}×
          </p>
        </div>
      )}

      {isMyTurn && (
        <>
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* COUNT selector */}
            <div className="flex flex-col items-center relative">
              {/* Micro-label tucked into top */}
              <span className="text-[10px] font-mono text-white-soft/40 uppercase tracking-[0.2em] absolute -top-1 left-1/2 -translate-x-1/2 bg-purple-deep px-1">
                cnt
              </span>
              <div className="flex flex-col items-center gap-1 pt-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={incrementCount}
                  className="w-12 h-8 flex items-center justify-center bg-purple-mid hover:bg-purple-light rounded border border-turquoise-dark transition-colors"
                >
                  <ChevronUp className="w-5 h-5 text-white-soft" />
                </motion.button>
                <div
                  className="w-20 h-20 flex items-center justify-center rounded-lg border-2 border-turquoise-dark"
                  style={{
                    background: 'linear-gradient(135deg, var(--purple-mid) 0%, var(--bg-dark) 100%)',
                    boxShadow: '0 4px 0 0 #061212, 0 6px 10px 0 rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <span className="text-5xl font-black text-marigold-glow" style={{ textShadow: '0 0 20px var(--marigold), 0 2px 0 var(--marigold)' }}>
                    {count}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={decrementCount}
                  className="w-12 h-8 flex items-center justify-center bg-purple-mid hover:bg-purple-light rounded border border-turquoise-dark transition-colors"
                >
                  <ChevronDown className="w-5 h-5 text-white-soft" />
                </motion.button>
              </div>
            </div>

            {/* Large multiplication sign */}
            <span className="text-5xl font-black text-white-soft/30 mt-4">×</span>

            {/* VALUE selector */}
            <div className="flex flex-col items-center relative">
              {/* Micro-label tucked into top */}
              <span className="text-[10px] font-mono text-white-soft/40 uppercase tracking-[0.2em] absolute -top-1 left-1/2 -translate-x-1/2 bg-purple-deep px-1">
                {isValueLocked ? 'lock' : 'val'}
              </span>
              <div className="flex flex-col items-center gap-1 pt-2">
                <motion.button
                  whileHover={!isValueLocked ? { scale: 1.1 } : {}}
                  whileTap={!isValueLocked ? { scale: 0.95 } : {}}
                  onClick={incrementValue}
                  disabled={isValueLocked}
                  className={`w-12 h-8 flex items-center justify-center rounded border transition-colors ${
                    isValueLocked
                      ? 'bg-purple-deep border-purple-mid opacity-30 cursor-not-allowed'
                      : 'bg-purple-mid hover:bg-purple-light border-turquoise-dark'
                  }`}
                >
                  <ChevronUp className="w-5 h-5 text-white-soft" />
                </motion.button>
                <div className="w-20 h-20 flex items-center justify-center">
                  <Dice value={value} size="lg" isPalifico={isPalifico} color={playerColor} />
                </div>
                <motion.button
                  whileHover={!isValueLocked ? { scale: 1.1 } : {}}
                  whileTap={!isValueLocked ? { scale: 0.95 } : {}}
                  onClick={decrementValue}
                  disabled={isValueLocked}
                  className={`w-12 h-8 flex items-center justify-center rounded border transition-colors ${
                    isValueLocked
                      ? 'bg-purple-deep border-purple-mid opacity-30 cursor-not-allowed'
                      : 'bg-purple-mid hover:bg-purple-light border-turquoise-dark'
                  }`}
                >
                  <ChevronDown className="w-5 h-5 text-white-soft" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <motion.button
                whileHover={validation.valid ? { scale: 1.02 } : {}}
                whileTap={validation.valid ? { scale: 0.98 } : {}}
                onClick={handleBid}
                disabled={!validation.valid}
                className={`
                  flex-1 retro-button retro-button-orange
                  flex items-center justify-center gap-2
                  ${!validation.valid ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Send className="w-5 h-5" />
                BID
              </motion.button>

              {currentBid && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDudo}
                  className="flex-1 retro-button retro-button-danger flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  DUDO!
                </motion.button>
              )}
            </div>

            {/* Calza button - only shown when there's a current bid to call Calza on */}
            {currentBid && canCalza && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCalza}
                className="w-full py-3 px-4 rounded-lg font-bold uppercase text-[13px] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                  border: '2px solid #4ade80',
                  borderBottom: '3px solid #15803d',
                  color: '#fff',
                  letterSpacing: '0.2em',
                  boxShadow: '0 3px 0 0 #166534, 0 5px 10px 0 rgba(0, 0, 0, 0.5)',
                }}
              >
                <Target className="w-5 h-5" />
                CALZA!
              </motion.button>
            )}
          </div>

          {value === 1 && !isPalifico && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-xs text-gold-accent text-center"
            >
              Jokers are wild!
            </motion.p>
          )}
        </>
      )}

    </motion.div>
  );
}

export default BidUI;
