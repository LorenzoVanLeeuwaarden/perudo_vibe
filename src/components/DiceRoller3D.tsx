'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DiceRoller3DProps {
  dice: number[];
  isRolling: boolean;
  onRoll: () => void;
  onComplete: () => void;
  playerColor: PlayerColor;
}

// 3D Dice face positions for CSS transform
// Note: rotateX positive tilts top toward viewer (shows bottom face)
//       rotateX negative tilts bottom toward viewer (shows top face)
const faceRotations: Record<number, { rotateX: number; rotateY: number }> = {
  1: { rotateX: 0, rotateY: 0 },      // Front face shows 1
  2: { rotateX: 0, rotateY: -90 },    // Right face shows 2
  3: { rotateX: -90, rotateY: 0 },    // Top face shows 3 (tilt bottom toward viewer)
  4: { rotateX: 90, rotateY: 0 },     // Bottom face shows 4 (tilt top toward viewer)
  5: { rotateX: 0, rotateY: 90 },     // Left face shows 5
  6: { rotateX: 180, rotateY: 0 },    // Back face shows 6
};

// Dot positions for each face value
const dotPatterns: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
  3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
  4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  6: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
};

function DiceFace({ value, color, isJoker }: { value: number; color: PlayerColor; isJoker: boolean }) {
  const colorConfig = PLAYER_COLORS[color];
  const dots = dotPatterns[value] || [];

  if (isJoker) {
    return (
      <div
        className="absolute w-full h-full rounded-lg flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0416 100%)',
          border: '2px solid #ffd700',
          boxShadow: 'inset 0 0 15px rgba(255, 215, 0, 0.3)',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C10 4 6 9 6 14C6 17 7 19 8 21L8 24C8 25 9 26 10 26H22C23 26 24 25 24 24L24 21C25 19 26 17 26 14C26 9 22 4 16 4Z"
            fill="#ffd700"
          />
          <ellipse cx="12" cy="14" rx="2.5" ry="3" fill="#0d0416" />
          <ellipse cx="20" cy="14" rx="2.5" ry="3" fill="#0d0416" />
          <path d="M16 17L14.5 20H17.5L16 17Z" fill="#0d0416" />
          <rect x="11" y="22" width="2" height="2" fill="#0d0416" rx="0.5" />
          <rect x="14" y="22" width="2" height="2" fill="#0d0416" rx="0.5" />
          <rect x="17" y="22" width="2" height="2" fill="#0d0416" rx="0.5" />
          <ellipse cx="12" cy="14" rx="1" ry="1.2" fill="#ff4444" opacity="0.8" />
          <ellipse cx="20" cy="14" rx="1" ry="1.2" fill="#ff4444" opacity="0.8" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="absolute w-full h-full rounded-lg"
      style={{
        background: colorConfig.bgGradient,
        border: `2px solid ${colorConfig.border}`,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
      }}
    >
      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-white"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      ))}
    </div>
  );
}

type DicePhase = 'waiting' | 'rolling' | 'settling' | 'settled';

function Dice3D({
  finalValue,
  index,
  phase,
  color,
  totalDice = 5,
  isFirefox = false,
}: {
  finalValue: number;
  index: number;
  phase: DicePhase;
  color: PlayerColor;
  totalDice?: number;
  isFirefox?: boolean;
}) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const startTime = useRef(0);

  // Calculate final resting position
  const getFinalPosition = () => {
    const spacing = 65;
    const totalWidth = (totalDice - 1) * spacing;
    const startX = -totalWidth / 2;
    return { x: startX + index * spacing, y: 0 };
  };

  useEffect(() => {
    if (phase === 'rolling') {
      // Firefox: Skip the expensive rAF loop, just show final position
      if (isFirefox) {
        setPosition(getFinalPosition());
        setRotation({ x: 0, y: 0, z: 0 });
        return;
      }

      startTime.current = Date.now();

      const animate = () => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const speed = 1 + index * 0.1;

        // Smooth tumbling rotation
        setRotation({
          x: elapsed * 400 * speed + Math.sin(elapsed * 3 + index) * 60,
          y: elapsed * 300 * speed + Math.cos(elapsed * 2.5 + index) * 60,
          z: Math.sin(elapsed * 4 + index * 0.7) * 15,
        });

        // Gentle floating movement - very constrained
        const finalPos = getFinalPosition();
        setPosition({
          x: finalPos.x + Math.sin(elapsed * 5 + index * 1.5) * 8,
          y: Math.sin(elapsed * 7 + index) * 10 - 5,
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    } else if (phase === 'settling' || phase === 'settled') {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      // Settle to final position and rotation
      const final = faceRotations[finalValue] || { rotateX: 0, rotateY: 0 };

      // Add some full rotations before settling to make it look like it tumbled there
      // Firefox: Skip extra spins for performance
      const extraSpins = isFirefox ? 0 : 2;
      setRotation({
        x: final.rotateX + (phase === 'settling' ? extraSpins * 360 : 0),
        y: final.rotateY + (phase === 'settling' ? extraSpins * 360 : 0),
        z: 0,
      });
      setPosition(getFinalPosition());
    }
  }, [phase, finalValue, index, totalDice, isFirefox]);

  const colorConfig = PLAYER_COLORS[color];

  return (
    <motion.div
      className="absolute"
      style={{
        width: 56,
        height: 56,
        perspective: 500,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: -100 }}
      animate={{
        opacity: 1,
        scale: phase === 'rolling' ? 1 : 1,
        x: position.x,
        y: position.y,
      }}
      transition={{
        opacity: { duration: 0.3, delay: index * 0.05 },
        scale: { duration: 0.3 },
        x: { type: 'spring', stiffness: 120, damping: 14 },
        y: { type: 'spring', stiffness: 120, damping: 14 },
      }}
    >
      <motion.div
        className="w-full h-full relative"
        style={{
          // Firefox: Skip preserve-3d for performance, show flat 2D dice
          transformStyle: isFirefox ? 'flat' : 'preserve-3d',
        }}
        animate={isFirefox ? {
          // Firefox: Simple 2D shake during rolling, then settle
          rotate: phase === 'rolling' ? [0, 10, -10, 5, -5, 0] : 0,
          scale: phase === 'rolling' ? [1, 1.1, 0.95, 1] : 1,
        } : {
          rotateX: rotation.x,
          rotateY: rotation.y,
          rotateZ: rotation.z,
        }}
        transition={
          phase === 'rolling'
            ? isFirefox ? { duration: 0.3, repeat: Infinity } : { duration: 0.05 }
            : { type: 'spring', stiffness: 60, damping: 12, delay: index * 0.1 }
        }
      >
        {/* Front face - 1 */}
        <div className="absolute w-full h-full" style={{ transform: 'translateZ(28px)' }}>
          <DiceFace value={1} color={color} isJoker={finalValue === 1} />
        </div>

        {/* Back face - 6 */}
        <div className="absolute w-full h-full" style={{ transform: 'rotateY(180deg) translateZ(28px)' }}>
          <DiceFace value={6} color={color} isJoker={false} />
        </div>

        {/* Right face - 2 */}
        <div className="absolute w-full h-full" style={{ transform: 'rotateY(90deg) translateZ(28px)' }}>
          <DiceFace value={2} color={color} isJoker={false} />
        </div>

        {/* Left face - 5 */}
        <div className="absolute w-full h-full" style={{ transform: 'rotateY(-90deg) translateZ(28px)' }}>
          <DiceFace value={5} color={color} isJoker={false} />
        </div>

        {/* Top face - 3 */}
        <div className="absolute w-full h-full" style={{ transform: 'rotateX(90deg) translateZ(28px)' }}>
          <DiceFace value={3} color={color} isJoker={false} />
        </div>

        {/* Bottom face - 4 */}
        <div className="absolute w-full h-full" style={{ transform: 'rotateX(-90deg) translateZ(28px)' }}>
          <DiceFace value={4} color={color} isJoker={false} />
        </div>
      </motion.div>

      {/* Shadow */}
      <motion.div
        className="absolute left-1/2 w-10 h-2 rounded-full"
        style={{
          bottom: -12,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
          transform: 'translateX(-50%)',
          filter: 'blur(2px)',
        }}
        animate={{
          scale: phase === 'rolling' ? [0.8, 1.2, 0.8] : 1,
          opacity: phase === 'rolling' ? 0.3 : 0.6,
        }}
        transition={{
          scale: { duration: 0.3, repeat: phase === 'rolling' ? Infinity : 0 },
        }}
      />
    </motion.div>
  );
}

export function DiceRoller3D({
  dice,
  isRolling,
  onRoll,
  onComplete,
  playerColor,
}: DiceRoller3DProps) {
  const [phase, setPhase] = useState<DicePhase>('waiting');
  const [showButton, setShowButton] = useState(true);
  const colorConfig = PLAYER_COLORS[playerColor];
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  const handleRoll = () => {
    if (phase !== 'waiting') return;

    setShowButton(false);
    setPhase('rolling');
    onRoll();

    // Rolling phase
    setTimeout(() => {
      setPhase('settling');

      // Settling phase - dice tumble to rest
      setTimeout(() => {
        setPhase('settled');
      }, 800);
    }, 1500);
  };

  // Notify parent when fully settled (with extra pause for user to see results)
  useEffect(() => {
    if (phase === 'settled') {
      // Give user time to see their dice before moving to bidding
      const timeout = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [phase, onComplete]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Rolling surface */}
      <motion.div
        className="relative rounded-2xl overflow-visible"
        style={{
          width: 420,
          height: 180,
          background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0416 100%)',
          border: `3px solid ${colorConfig.border}`,
          boxShadow: `
            inset 0 4px 30px rgba(0,0,0,0.6),
            0 8px 0 0 #050208,
            0 12px 30px rgba(0,0,0,0.5),
            0 0 40px ${colorConfig.glow}
          `,
        }}
      >
        {/* Felt texture overlay */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at center, ${colorConfig.glow}15 0%, transparent 60%)`,
          }}
        />

        {/* Inner border glow */}
        <div
          className="absolute inset-2 rounded-xl pointer-events-none"
          style={{
            border: `1px solid ${colorConfig.glow}30`,
          }}
        />

        {/* Dice container - centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          {phase !== 'waiting' && dice.map((value, i) => (
            <Dice3D
              key={i}
              finalValue={value}
              index={i}
              phase={phase}
              color={playerColor}
              totalDice={dice.length}
              isFirefox={useSimplifiedAnimations}
            />
          ))}

          {/* Placeholder dice when waiting */}
          {phase === 'waiting' && (
            <div className="flex gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-14 h-14 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #4a2c7a 0%, #2d1b4e 100%)',
                    border: '2px solid #7b4bb9',
                    boxShadow: '0 4px 0 #1a0a2e, inset 0 2px 0 rgba(255,255,255,0.1)',
                  }}
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="text-2xl text-purple-glow/50">?</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Rail decoration */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 rounded-b-xl"
          style={{
            background: `linear-gradient(90deg, ${colorConfig.shadow} 0%, ${colorConfig.bg} 50%, ${colorConfig.shadow} 100%)`,
          }}
        />
      </motion.div>

      {/* Roll button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            onClick={handleRoll}
            className="relative px-12 py-4 rounded-xl font-bold uppercase tracking-wider text-lg"
            style={{
              background: colorConfig.bgGradient,
              border: `3px solid ${colorConfig.border}`,
              boxShadow: `
                0 6px 0 0 ${colorConfig.shadow},
                0 8px 0 0 ${colorConfig.shadowDark},
                0 12px 20px rgba(0,0,0,0.4),
                0 0 30px ${colorConfig.glow}
              `,
              color: colorConfig.text,
            }}
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            whileHover={{
              scale: 1.05,
              y: -4,
            }}
            whileTap={{
              scale: 0.98,
              y: 2,
            }}
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <motion.span
              className="absolute -left-2 -top-2 text-2xl"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎲
            </motion.span>
            Roll Dice
            <motion.span
              className="absolute -right-2 -top-2 text-2xl"
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              🎲
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Status indicator */}
      <AnimatePresence mode="wait">
        {phase === 'rolling' && (
          <motion.div
            key="rolling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.span
              className="text-orange-neon text-glow-orange text-sm uppercase tracking-wider"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              Rolling...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DiceRoller3D;
