'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Dice } from './Dice';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface DiceCupProps {
  dice: number[];
  isLifted: boolean;
  onShake: () => void;
  onLift: () => void;
  isShaking?: boolean;
  isPalifico?: boolean;
  playerColor: PlayerColor;
}

export function DiceCup({
  dice,
  isLifted,
  onShake,
  onLift,
  isShaking = false,
  isPalifico = false,
  playerColor
}: DiceCupProps) {
  const [localShaking, setLocalShaking] = useState(false);
  const colorConfig = PLAYER_COLORS[playerColor];

  const handleClick = useCallback(() => {
    if (isLifted) return;

    setLocalShaking(true);
    onShake();

    setTimeout(() => {
      setLocalShaking(false);
      onLift();
    }, 800);
  }, [isLifted, onShake, onLift]);

  const shaking = isShaking || localShaking;

  return (
    <div className="relative flex flex-col items-center" style={{ minHeight: '280px' }}>
      {/* The Mystery Box / Card Container */}
      <AnimatePresence>
        {!isLifted && (
          <motion.div
            initial={{ y: 0, rotateX: 0 }}
            animate={
              shaking
                ? {
                    rotate: [0, -3, 3, -3, 3, -2, 2, 0],
                    scale: [1, 1.02, 1, 1.02, 1, 1.01, 1],
                  }
                : { rotate: 0, scale: 1 }
            }
            exit={{
              rotateX: -90,
              y: -50,
              opacity: 0,
              transition: { duration: 0.4, ease: 'easeInOut' }
            }}
            transition={
              shaking
                ? { duration: 0.5, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 300, damping: 25 }
            }
            onClick={handleClick}
            className="relative cursor-pointer group"
            style={{ perspective: '1000px' }}
            whileHover={!shaking ? { y: -8, scale: 1.02 } : {}}
          >
            {/* Main card body */}
            <div
              className="w-44 h-56 rounded-2xl relative overflow-hidden"
              style={{
                background: `
                  linear-gradient(145deg,
                    ${colorConfig.bg}22 0%,
                    var(--purple-deep) 30%,
                    var(--purple-mid) 70%,
                    ${colorConfig.bg}22 100%
                  )
                `,
                border: `3px solid ${colorConfig.border}`,
                boxShadow: `
                  0 8px 0 0 var(--purple-deep),
                  0 12px 0 0 rgba(13, 4, 22, 0.8),
                  0 20px 40px 0 rgba(0, 0, 0, 0.6),
                  0 30px 60px 0 rgba(0, 0, 0, 0.4),
                  0 0 30px ${colorConfig.glow},
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                `,
              }}
            >
              {/* Inner glow effect */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 50% 30%, ${colorConfig.glow} 0%, transparent 60%)`,
                  opacity: 0.3,
                }}
              />

              {/* Decorative pattern */}
              <div className="absolute inset-4 border-2 border-dashed rounded-xl opacity-20"
                style={{ borderColor: colorConfig.border }}
              />

              {/* Center icon area */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Question marks / mystery symbols */}
                <motion.div
                  animate={shaking ? { rotate: [0, 10, -10, 10, -10, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  {/* Stacked dice silhouettes */}
                  <div className="relative w-24 h-24">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-12 h-12 rounded-lg"
                        style={{
                          background: colorConfig.bgGradient,
                          border: `2px solid ${colorConfig.border}`,
                          boxShadow: `0 4px 0 0 ${colorConfig.shadow}`,
                          top: `${i * 8}px`,
                          left: `${30 + i * 8}px`,
                          transform: `rotate(${-10 + i * 10}deg)`,
                          opacity: 0.6 + i * 0.2,
                        }}
                        animate={shaking ? {
                          rotate: [-10 + i * 10, -5 + i * 10, -15 + i * 10, -10 + i * 10],
                          y: [0, -5, 5, 0],
                        } : {}}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* "?" symbol */}
                <motion.div
                  className="mt-4 text-4xl font-bold"
                  style={{
                    color: colorConfig.border,
                    textShadow: `0 0 20px ${colorConfig.glow}`,
                  }}
                  animate={shaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                >
                  ?
                </motion.div>
              </div>

              {/* Corner decorations */}
              {[
                { top: '8px', left: '8px' },
                { top: '8px', right: '8px' },
                { bottom: '8px', left: '8px' },
                { bottom: '8px', right: '8px' },
              ].map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4"
                  style={{
                    ...pos,
                    background: colorConfig.bgGradient,
                    borderRadius: '4px',
                    boxShadow: `0 2px 0 0 ${colorConfig.shadow}`,
                  }}
                />
              ))}

              {/* Shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                }}
                animate={{ x: [-200, 200] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              />
            </div>

            {/* Click prompt */}
            <motion.div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-2"
              animate={shaking ? { opacity: 0 } : { opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4" style={{ color: colorConfig.border }} />
              <span
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: colorConfig.border }}
              >
                {shaking ? 'Rolling...' : 'Click to Roll'}
              </span>
              <Sparkles className="w-4 h-4" style={{ color: colorConfig.border }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed dice */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 p-4"
        style={{ minHeight: '180px', width: '240px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLifted ? 1 : 0 }}
      >
        <AnimatePresence>
          {isLifted &&
            dice.map((value, index) => (
              <Dice
                key={index}
                value={value}
                index={index}
                isRevealing={true}
                size="lg"
                isPalifico={isPalifico}
                color={playerColor}
              />
            ))}
        </AnimatePresence>
      </motion.div>

      {/* Shadow on table */}
      <motion.div
        className="w-40 h-6 rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
          filter: 'blur(6px)',
        }}
        animate={{
          scale: isLifted ? 1.5 : 1,
          opacity: isLifted ? 0.2 : 0.5,
        }}
      />

      {/* Status label */}
      {isLifted && (
        <motion.p
          className="mt-4 text-sm font-bold uppercase tracking-widest"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: 'var(--green-crt)',
            textShadow: '0 0 10px var(--green-crt)',
          }}
        >
          Your Hand
        </motion.p>
      )}
    </div>
  );
}

export default DiceCup;
