'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DiceCupProps {
  dice: number[];
  onRoll: () => void;
  onComplete: () => void;
  playerColor: PlayerColor;
  diceCount?: number;
}

// Dot patterns for dice values 2-6 (no 1/joker)
const GHOST_DOT_PATTERNS: Record<number, { x: number; y: number }[]> = {
  2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
  3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
  4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  6: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
};

// Ghost dice component - just outlines bouncing around wildly
function GhostDie({ index }: { index: number }) {
  const dieSize = 44;

  // Each die has its own random animation pattern
  const randomDuration = 0.8 + Math.random() * 0.6;
  const randomDelay = index * 0.1;

  // Random value 2-6 based on index (deterministic so it doesn't change on re-render)
  const dieValue = (index % 5) + 2; // Values 2, 3, 4, 5, 6
  const dots = GHOST_DOT_PATTERNS[dieValue];

  return (
    <motion.div
      className="absolute rounded-lg"
      style={{
        width: dieSize,
        height: dieSize,
        border: '2px dashed rgba(45, 212, 191, 0.25)',
        background: 'rgba(45, 212, 191, 0.03)',
      }}
      animate={{
        x: [
          50 + Math.sin(index * 1.5) * 80,
          150 + Math.cos(index * 2.1) * 100,
          80 + Math.sin(index * 0.8) * 120,
          200 + Math.cos(index * 1.3) * 60,
          50 + Math.sin(index * 1.5) * 80,
        ],
        y: [
          30 + Math.cos(index * 1.2) * 40,
          80 + Math.sin(index * 1.8) * 50,
          20 + Math.cos(index * 2.5) * 30,
          60 + Math.sin(index * 0.9) * 45,
          30 + Math.cos(index * 1.2) * 40,
        ],
        rotate: [0, 180, 360, 540, 720],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        duration: randomDuration * 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: randomDelay,
      }}
    >
      {/* Faint dot pattern showing dice value */}
      <div className="w-full h-full relative opacity-30">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-turquoise/60"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Cartoony impact cloud on slam
function SlamCloud({ isActive, color }: { isActive: boolean; color: PlayerColor }) {
  const colorConfig = PLAYER_COLORS[color];

  if (!isActive) return null;

  // Generate spiky cloud points
  const points = 16;
  const generateCloudPath = () => {
    let path = '';
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const isSpike = i % 2 === 0;
      const radius = isSpike ? 85 + Math.random() * 20 : 50 + Math.random() * 15;
      const x = 100 + Math.cos(angle) * radius;
      const y = 80 + Math.sin(angle) * radius;
      path += (i === 0 ? 'M' : 'L') + `${x},${y} `;
    }
    return path + 'Z';
  };

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.4, times: [0, 0.1, 0.6, 1] }}
    >
      {/* Main cloud burst */}
      <motion.svg
        width="200"
        height="160"
        viewBox="0 0 200 160"
        className="absolute"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: [0, 1.3, 1], rotate: [-10, 5, 0] }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.path
          d={generateCloudPath()}
          fill={colorConfig.bg}
          stroke={colorConfig.border}
          strokeWidth="3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
        {/* Inner highlight */}
        <ellipse
          cx="100"
          cy="80"
          rx="45"
          ry="35"
          fill="rgba(255, 255, 255, 0.3)"
        />
      </motion.svg>

      {/* Action lines radiating out */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const startR = 70;
        const endR = 110 + Math.random() * 30;
        return (
          <motion.div
            key={i}
            className="absolute w-1 rounded-full"
            style={{
              height: endR - startR,
              left: '50%',
              top: '50%',
              transformOrigin: 'center top',
              transform: `rotate(${angle}rad) translateX(-50%)`,
              backgroundColor: colorConfig.border,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 0.9, 0], scaleY: [0, 1, 0.5] }}
            transition={{ duration: 0.3, delay: 0.05 }}
          />
        );
      })}

      {/* Small puff clouds around the edges */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const distance = 60 + Math.random() * 20;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const size = 20 + Math.random() * 15;
        return (
          <motion.div
            key={`puff-${i}`}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: '50%',
              top: '50%',
              marginLeft: -size / 2,
              marginTop: -size / 2,
              backgroundColor: colorConfig.bg,
              boxShadow: `0 0 10px ${colorConfig.glow}`,
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: [0, x * 0.5, x],
              y: [0, y * 0.5, y],
              scale: [0, 1.2, 0],
              opacity: [0, 0.9, 0],
            }}
            transition={{ duration: 0.4, delay: 0.05 + i * 0.02 }}
          />
        );
      })}
    </motion.div>
  );
}

// Smoke/spark particle effect on slam
function SlamParticles({ isActive, color }: { isActive: boolean; color: PlayerColor }) {
  const colorConfig = PLAYER_COLORS[color];
  const particles = Array.from({ length: 16 });

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sparks */}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 50 + Math.random() * 60;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 30;
        const size = 3 + Math.random() * 5;
        const isGold = i % 3 === 0;

        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              background: isGold ? '#fbbf24' : colorConfig.bg,
              boxShadow: `0 0 ${size * 2}px ${isGold ? '#fbbf24' : colorConfig.bg}`,
            }}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1, 0],
              x: [0, endX * 0.5, endX],
              y: [0, endY * 0.5 - 15, endY + 30],
            }}
            transition={{
              duration: 0.5,
              delay: i * 0.015,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {/* Smoke puffs at base */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`smoke-${i}`}
          className="absolute left-1/2 bottom-8 rounded-full"
          style={{
            width: 25 + i * 8,
            height: 25 + i * 8,
            marginLeft: -(25 + i * 8) / 2,
            background: `radial-gradient(circle, rgba(45, 212, 191, 0.25) 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            scale: [0.3, 1.2, 1.8],
            y: [0, -20 - i * 10, -40 - i * 15],
            x: (i % 2 === 0 ? 1 : -1) * (8 + i * 4),
          }}
          transition={{
            duration: 0.7,
            delay: i * 0.03,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Revealed dice component - uses percentage-based positioning for responsive container
function RevealedDie({
  value,
  index,
  color,
  totalDice,
}: {
  value: number;
  index: number;
  color: PlayerColor;
  totalDice: number;
}) {
  const colorConfig = PLAYER_COLORS[color];
  const isJoker = value === 1;

  const dotPatterns: Record<number, { x: number; y: number }[]> = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
    3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
    4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
    5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
    6: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  };

  const dots = dotPatterns[value] || [];

  // Calculate spacing as percentage of container width
  // Each die is ~14% of container width, with ~2.5% gap between them
  const dieWidthPercent = 14;
  const gapPercent = 2.5;
  const totalWidthPercent = totalDice * dieWidthPercent + (totalDice - 1) * gapPercent;
  const startPercent = (100 - totalWidthPercent) / 2;
  const xPosPercent = startPercent + index * (dieWidthPercent + gapPercent);

  return (
    <motion.div
      className="absolute w-[14%] aspect-square"
      style={{ left: `${xPosPercent}%`, top: '50%', transform: 'translateY(-50%)' }}
      initial={{ opacity: 0, scale: 0, y: '-150%', rotate: -180 + Math.random() * 360 }}
      animate={{ opacity: 1, scale: 1, y: '-50%', rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 22,
        delay: index * 0.06,
      }}
    >
      <motion.div
        className="w-full h-full rounded-lg relative"
        style={{
          background: isJoker
            ? 'linear-gradient(135deg, #1a1a2e 0%, #0d0416 100%)'
            : colorConfig.bgGradient,
          border: isJoker ? '2px solid #ffd700' : `2px solid ${colorConfig.border}`,
          boxShadow: isJoker
            ? '0 4px 0 #b8860b, 0 6px 10px rgba(0,0,0,0.5), 0 0 20px rgba(255, 215, 0, 0.4)'
            : `0 4px 0 ${colorConfig.shadow}, 0 6px 10px rgba(0,0,0,0.5), 0 0 15px ${colorConfig.glow}`,
        }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
      >
        {isJoker ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-[60%] h-[60%]" viewBox="0 0 32 32" fill="none">
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
              <motion.ellipse
                cx="12" cy="14" rx="1" ry="1.2"
                fill="#ff4444"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.ellipse
                cx="20" cy="14" rx="1" ry="1.2"
                fill="#ff4444"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </svg>
          </div>
        ) : (
          dots.map((dot, i) => (
            <div
              key={i}
              className="absolute w-[15%] aspect-square rounded-full bg-white"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
          ))
        )}
      </motion.div>

      {/* Shadow */}
      <div
        className="absolute left-1/2 -bottom-[15%] w-[80%] h-[15%] rounded-full -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
    </motion.div>
  );
}

export function DiceCup({
  dice,
  onRoll,
  onComplete,
  playerColor,
  diceCount = 5,
}: DiceCupProps) {
  const [phase, setPhase] = useState<'waiting' | 'slamming' | 'revealed'>('waiting');
  const [showParticles, setShowParticles] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const colorConfig = PLAYER_COLORS[playerColor];
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  const handleSlam = useCallback(() => {
    if (phase !== 'waiting') return;

    // Trigger the roll to get dice values
    onRoll();

    // Start slam animation
    setPhase('slamming');

    // Show cartoon slam cloud immediately
    setShowCloud(true);

    // Trigger screen shake
    document.body.classList.add('dice-slam-shake');
    setTimeout(() => document.body.classList.remove('dice-slam-shake'), 300);

    // Show particles and reveal
    setTimeout(() => {
      setShowParticles(true);
      setPhase('revealed');
    }, 250);

    // Hide cloud and particles after animation
    setTimeout(() => setShowCloud(false), 450);
    setTimeout(() => setShowParticles(false), 900);
  }, [phase, onRoll]);

  // Notify parent when fully revealed
  useEffect(() => {
    if (phase === 'revealed') {
      const timeout = setTimeout(() => {
        onComplete();
      }, 1800);
      return () => clearTimeout(timeout);
    }
  }, [phase, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Main cup container - clickable */}
      <motion.div
        onClick={handleSlam}
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: 'clamp(280px, 85vw, 500px)',
          height: 180,
          cursor: phase === 'waiting' ? 'pointer' : 'default',
          background: 'linear-gradient(180deg, rgba(15, 46, 46, 0.85) 0%, rgba(3, 15, 15, 0.95) 100%)',
          border: '3px solid',
          borderColor: colorConfig.shadow,
        }}
        animate={
          phase === 'waiting'
            ? useSimplifiedAnimations
              ? {
                  borderColor: [colorConfig.shadow, colorConfig.bg, colorConfig.shadow],
                  // Static boxShadow for Firefox/reduced motion - only animate borderColor
                }
              : {
                  borderColor: [colorConfig.shadow, colorConfig.bg, colorConfig.shadow],
                  boxShadow: [
                    `inset 0 4px 40px rgba(0,0,0,0.7), 0 8px 0 0 #030f0f, 0 12px 30px rgba(0,0,0,0.5), 0 0 25px ${colorConfig.glow}`,
                    `inset 0 4px 40px rgba(0,0,0,0.7), 0 8px 0 0 #030f0f, 0 12px 30px rgba(0,0,0,0.5), 0 0 45px ${colorConfig.glow}`,
                    `inset 0 4px 40px rgba(0,0,0,0.7), 0 8px 0 0 #030f0f, 0 12px 30px rgba(0,0,0,0.5), 0 0 25px ${colorConfig.glow}`,
                  ],
                }
            : phase === 'slamming'
            ? {
                scale: [1, 1.06, 0.97],
                y: [0, -12, 18],
              }
            : {
                scale: 1,
                y: 0,
                boxShadow: `inset 0 4px 40px rgba(0,0,0,0.7), 0 8px 0 0 #030f0f, 0 12px 30px rgba(0,0,0,0.5), 0 0 20px ${colorConfig.glow}`,
              }
        }
        transition={
          phase === 'waiting'
            ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
        }
        whileHover={phase === 'waiting' ? { scale: 1.015, y: -3 } : {}}
        whileTap={phase === 'waiting' ? { scale: 0.99 } : {}}
      >
        {/* Dark glass reflection */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(45, 212, 191, 0.08) 0%, transparent 50%)',
          }}
        />

        {/* Inner border */}
        <div
          className="absolute inset-3 rounded-xl pointer-events-none"
          style={{
            border: '1px solid rgba(45, 212, 191, 0.15)',
          }}
        />

        {/* Ghost dice container */}
        <AnimatePresence>
          {phase === 'waiting' && (
            <motion.div
              className="absolute inset-0"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {Array.from({ length: diceCount }).map((_, i) => (
                <GhostDie key={i} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revealed dice */}
        {phase === 'revealed' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {dice.map((value, i) => (
              <RevealedDie
                key={i}
                value={value}
                index={i}
                color={playerColor}
                totalDice={dice.length}
              />
            ))}
          </div>
        )}

        {/* Cartoon slam cloud */}
        <SlamCloud isActive={showCloud} color={playerColor} />

        {/* Slam particles */}
        <SlamParticles isActive={showParticles} color={playerColor} />

        {/* Curved "Slam the Dice" label */}
        <AnimatePresence>
          {phase === 'waiting' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <motion.svg
                width="280"
                height="100"
                viewBox="0 0 280 100"
                className="overflow-visible slam-text-glow"
                style={{
                  '--slam-glow-color': colorConfig.bg,
                } as React.CSSProperties}
                animate={{
                  y: [0, -4, 0],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <defs>
                  <path
                    id="slamTextArc"
                    d="M 20 70 Q 140 20 260 70"
                    fill="none"
                  />
                </defs>
                <text
                  fill={colorConfig.bg}
                  fontSize="22"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.15em"
                  textAnchor="middle"
                  stroke={colorConfig.shadow}
                  strokeWidth="0.5"
                >
                  <textPath href="#slamTextArc" startOffset="50%">
                    SLAM THE DICE
                  </textPath>
                </text>
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rail decoration */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 rounded-b-xl"
          style={{
            background: `linear-gradient(90deg, ${colorConfig.shadow} 0%, ${colorConfig.bg} 50%, ${colorConfig.shadow} 100%)`,
          }}
        />
      </motion.div>

      {/* Screen shake CSS */}
      <style jsx global>{`
        @keyframes diceSlamShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-4px, -3px) rotate(-0.5deg); }
          30% { transform: translate(4px, -2px) rotate(0.5deg); }
          45% { transform: translate(-3px, 3px) rotate(-0.3deg); }
          60% { transform: translate(3px, 2px) rotate(0.3deg); }
          75% { transform: translate(-2px, -1px) rotate(-0.1deg); }
          90% { transform: translate(1px, 1px) rotate(0.1deg); }
        }

        .dice-slam-shake {
          animation: diceSlamShake 0.3s ease-out;
        }

        @keyframes slamTextGlow {
          0%, 100% {
            filter: drop-shadow(0 0 8px var(--slam-glow-color, rgba(45, 212, 191, 0.6)))
                    drop-shadow(0 0 16px var(--slam-glow-color, rgba(45, 212, 191, 0.3)));
          }
          50% {
            filter: drop-shadow(0 0 12px var(--slam-glow-color, rgba(45, 212, 191, 0.9)))
                    drop-shadow(0 0 30px var(--slam-glow-color, rgba(45, 212, 191, 0.5)))
                    drop-shadow(0 0 50px var(--slam-glow-color, rgba(45, 212, 191, 0.2)));
          }
        }

        .slam-text-glow {
          animation: slamTextGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default DiceCup;
