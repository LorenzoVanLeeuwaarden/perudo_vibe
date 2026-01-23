'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Dice } from './Dice';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface SlotMachineProps {
  dice: number[];
  isRevealed: boolean;
  onPull: () => void;
  onReveal: () => void;
  playerColor: PlayerColor;
}

export function SlotMachine({
  dice,
  isRevealed,
  onPull,
  onReveal,
  playerColor
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const colorConfig = PLAYER_COLORS[playerColor];

  const handlePull = useCallback(() => {
    if (isRevealed || isSpinning) return;

    setLeverPulled(true);
    setIsSpinning(true);
    onPull();

    // Spin animation
    setTimeout(() => {
      setIsSpinning(false);
      setLeverPulled(false);
      onReveal();
    }, 1200);
  }, [isRevealed, isSpinning, onPull, onReveal]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Slot Machine Frame */}
      <div className="relative">
        {/* Machine body */}
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: '320px',
            background: `linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 100%)`,
            border: `4px solid ${colorConfig.border}`,
            boxShadow: `
              0 10px 0 0 #0d0416,
              0 14px 0 0 #050208,
              0 20px 40px rgba(0, 0, 0, 0.6),
              inset 0 2px 0 rgba(255, 255, 255, 0.1),
              0 0 40px ${colorConfig.glow}
            `,
          }}
        >
          {/* Top decoration */}
          <div
            className="h-12 flex items-center justify-center"
            style={{
              background: colorConfig.bgGradient,
              borderBottom: `3px solid ${colorConfig.shadow}`,
            }}
          >
            <span
              className="text-lg font-bold uppercase tracking-widest"
              style={{ color: colorConfig.text }}
            >
              Roll Your Fate
            </span>
          </div>

          {/* Dice display area */}
          <div className="p-6 min-h-[180px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isRevealed && !isSpinning && (
                <motion.div
                  key="mystery"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex gap-2"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #4a2c7a 0%, #2d1b4e 100%)',
                        border: '2px solid #7b4bb9',
                        boxShadow: '0 4px 0 #1a0a2e, inset 0 2px 0 rgba(255,255,255,0.1)',
                      }}
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    >
                      <span className="text-2xl text-purple-glow/50">?</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {isSpinning && (
                <motion.div
                  key="spinning"
                  className="flex gap-2"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-12 rounded-lg overflow-hidden"
                      style={{
                        background: colorConfig.bgGradient,
                        border: `2px solid ${colorConfig.border}`,
                        boxShadow: `0 4px 0 ${colorConfig.shadow}`,
                      }}
                    >
                      {/* Spinning numbers */}
                      <motion.div
                        className="flex flex-col items-center"
                        animate={{ y: [0, -200] }}
                        transition={{
                          duration: 0.2,
                          repeat: 6 - i,
                          ease: 'linear',
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4].map((n, j) => (
                          <div
                            key={j}
                            className="w-12 h-12 flex items-center justify-center text-xl font-bold"
                            style={{ color: colorConfig.text }}
                          >
                            {n === 1 ? '★' : n}
                          </div>
                        ))}
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {isRevealed && (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 flex-wrap justify-center"
                >
                  {dice.map((value, index) => (
                    <Dice
                      key={index}
                      value={value}
                      index={index}
                      isRevealing={true}
                      size="md"
                      color={playerColor}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom panel with pull instruction */}
          <div
            className="h-10 flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0416 100%)',
              borderTop: '2px solid #2d1b4e',
            }}
          >
            {!isRevealed && (
              <motion.span
                className="text-xs uppercase tracking-wider"
                style={{ color: colorConfig.border }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isSpinning ? 'Rolling...' : 'Pull the lever!'}
              </motion.span>
            )}
            {isRevealed && (
              <span className="text-xs uppercase tracking-wider text-green-crt">
                Your Hand
              </span>
            )}
          </div>
        </motion.div>

        {/* Lever */}
        <motion.div
          className="absolute -right-16 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={handlePull}
          whileHover={!isRevealed && !isSpinning ? { scale: 1.05 } : {}}
        >
          {/* Lever arm */}
          <motion.div
            className="relative"
            animate={leverPulled ? { rotate: 45 } : { rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ transformOrigin: 'bottom center' }}
          >
            {/* Stick */}
            <div
              className="w-4 h-28 rounded-full mx-auto"
              style={{
                background: 'linear-gradient(90deg, #888 0%, #ccc 50%, #888 100%)',
                boxShadow: '2px 0 4px rgba(0,0,0,0.3)',
              }}
            />
            {/* Ball handle */}
            <motion.div
              className="w-12 h-12 rounded-full -mt-2 mx-auto"
              style={{
                background: colorConfig.bgGradient,
                border: `3px solid ${colorConfig.border}`,
                boxShadow: `
                  0 4px 0 ${colorConfig.shadow},
                  0 6px 10px rgba(0,0,0,0.4),
                  inset 0 -4px 8px rgba(0,0,0,0.2),
                  inset 0 4px 8px rgba(255,255,255,0.2),
                  0 0 20px ${colorConfig.glow}
                `,
              }}
              whileHover={{ scale: 1.1 }}
              animate={!isRevealed && !isSpinning ? {
                y: [0, -3, 0],
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
          {/* Base */}
          <div
            className="w-8 h-6 mx-auto -mt-1 rounded-b-lg"
            style={{
              background: 'linear-gradient(180deg, #666 0%, #444 100%)',
              boxShadow: '0 4px 0 #222',
            }}
          />
        </motion.div>
      </div>

      {/* Shadow */}
      <motion.div
        className="w-80 h-6 mt-4 rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
          filter: 'blur(6px)',
        }}
        animate={{
          scale: isRevealed ? 1.2 : 1,
          opacity: isRevealed ? 0.3 : 0.5,
        }}
      />
    </div>
  );
}

export default SlotMachine;
