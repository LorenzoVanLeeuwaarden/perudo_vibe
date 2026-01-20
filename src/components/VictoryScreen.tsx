'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Trophy, Star, Crown, Sparkles } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { DiceExplosion } from './DiceExplosion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  type: 'firework' | 'sparkle' | 'confetti';
  rotation: number;
  rotationSpeed: number;
}

interface VictoryScreenProps {
  playerColor: PlayerColor;
  onPlayAgain: () => void;
}

const FIREWORK_COLORS = [
  '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
];

export function VictoryScreen({ playerColor, onPlayAgain }: VictoryScreenProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [explosionComplete, setExplosionComplete] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const colorConfig = PLAYER_COLORS[playerColor];
  const { playVictory, playDiceRattle } = useSoundEffects();
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Play sounds on mount
  useEffect(() => {
    playVictory();
    const rattleTimer = setTimeout(() => playDiceRattle(), 500);
    return () => clearTimeout(rattleTimer);
  }, [playVictory, playDiceRattle]);

  // Enable skip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const createFirework = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    const particleCount = 30 + Math.floor(Math.random() * 20);
    const baseId = Date.now() + Math.random() * 100000;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      newParticles.push({
        id: baseId + i + Math.random() * 1000,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 3 === 0 ? '#ffffff' : color,
        size: 3 + Math.random() * 3,
        life: 1,
        type: 'firework',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    return newParticles;
  }, []);

  const createConfetti = useCallback(() => {
    const newParticles: Particle[] = [];
    const baseId = Date.now() + Math.random() * 100000;
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: baseId + i + Math.random() * 10000,
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        size: 8 + Math.random() * 8,
        life: 1,
        type: 'confetti',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
      });
    }
    return newParticles;
  }, []);

  // Firework launcher - skip on Firefox for performance
  useEffect(() => {
    if (useSimplifiedAnimations) return; // Skip particle system on Firefox/reduced motion

    const launchFirework = () => {
      const x = 100 + Math.random() * (window.innerWidth - 200);
      const y = 100 + Math.random() * (window.innerHeight * 0.4);
      setParticles(prev => [...prev, ...createFirework(x, y)]);
    };

    // Initial burst
    setTimeout(() => launchFirework(), 200);
    setTimeout(() => launchFirework(), 500);
    setTimeout(() => launchFirework(), 800);

    // Continuous fireworks
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        launchFirework();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [createFirework, isFirefox]);

  // Confetti spawner - skip on Firefox for performance
  useEffect(() => {
    if (useSimplifiedAnimations) return; // Skip particle system on Firefox/reduced motion

    const interval = setInterval(() => {
      setParticles(prev => [...prev, ...createConfetti()]);
    }, 100);

    return () => clearInterval(interval);
  }, [createConfetti, isFirefox]);

  // Particle physics - skip on Firefox for performance
  useEffect(() => {
    if (useSimplifiedAnimations) return; // Skip particle system on Firefox/reduced motion

    const interval = setInterval(() => {
      setParticles(prev => {
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + (p.type === 'firework' ? 0.15 : 0.05),
            vx: p.vx * (p.type === 'firework' ? 0.98 : 0.99),
            life: p.life - (p.type === 'firework' ? 0.02 : 0.005),
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter(p => p.life > 0 && p.y < window.innerHeight + 50);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isFirefox]);

  const handleClick = useCallback(() => {
    if (canSkip) {
      onPlayAgain();
    }
  }, [canSkip, onPlayAgain]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleClick}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0416 70%, #050208 100%)',
        cursor: canSkip ? 'pointer' : 'default',
      }}
    >
      {/* Dice explosion overlay */}
      {!explosionComplete && (
        <DiceExplosion
          color={playerColor}
          onComplete={() => setExplosionComplete(true)}
        />
      )}

      {/* Animated background glow - static on Firefox/reduced motion */}
      <motion.div
        className="absolute inset-0"
        style={useSimplifiedAnimations ? {
          background: `radial-gradient(circle at 50% 50%, ${colorConfig.glow} 0%, transparent 50%)`,
        } : undefined}
        animate={useSimplifiedAnimations ? {} : {
          background: [
            `radial-gradient(circle at 30% 30%, ${colorConfig.glow} 0%, transparent 50%)`,
            `radial-gradient(circle at 70% 70%, ${colorConfig.glow} 0%, transparent 50%)`,
            `radial-gradient(circle at 30% 70%, ${colorConfig.glow} 0%, transparent 50%)`,
            `radial-gradient(circle at 70% 30%, ${colorConfig.glow} 0%, transparent 50%)`,
            `radial-gradient(circle at 30% 30%, ${colorConfig.glow} 0%, transparent 50%)`,
          ],
        }}
        transition={useSimplifiedAnimations ? undefined : { duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Particles - skip on Firefox/reduced motion */}
      {!useSimplifiedAnimations && (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {particles.map(p => (
            <g key={p.id} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
              {p.type === 'firework' ? (
                <circle
                  r={p.size * p.life}
                  fill={p.color}
                  opacity={p.life}
                  style={{
                    filter: `blur(${(1 - p.life) * 2}px)`,
                    boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  }}
                />
              ) : (
                <rect
                  x={-p.size / 2}
                  y={-p.size / 4}
                  width={p.size}
                  height={p.size / 2}
                  fill={p.color}
                  opacity={p.life}
                  rx={1}
                />
              )}
            </g>
          ))}
        </svg>
      )}

      {/* Golden rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-[200%] h-2"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colorConfig.glow} 50%, transparent 100%)`,
              transformOrigin: 'left center',
            }}
            initial={{ rotate: i * 30, opacity: 0, scaleX: 0 }}
            animate={{
              rotate: i * 30,
              opacity: [0, 0.3, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Crown */}
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, -5, 5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Crown className="w-24 h-24 mx-auto" style={{ color: '#ffd700', filter: 'drop-shadow(0 0 20px #ffd700)' }} />
          </motion.div>
        </motion.div>

        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
          className="mb-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="relative inline-block"
          >
            <Trophy
              className="w-32 h-32"
              style={{
                color: '#ffd700',
                filter: 'drop-shadow(0 0 30px #ffd700) drop-shadow(0 0 60px #ffd700)',
              }}
            />
            {/* Sparkles around trophy */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Victory text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-wider"
            style={{
              color: '#ffd700',
              textShadow: '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',
            }}
            // Skip animated text-shadow on Firefox/reduced motion - it causes frame drops
            animate={useSimplifiedAnimations ? {} : {
              textShadow: [
                '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',
                '0 0 40px #ffd700, 0 0 60px #ffd700, 0 4px 0 #b8860b',
                '0 0 20px #ffd700, 0 0 40px #ffd700, 0 4px 0 #b8860b',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Victory!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-2xl text-white-soft/80 mb-8"
          >
            You defeated all opponents!
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4 }}
            className="flex justify-center gap-6 mb-10"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-deep/50 border border-gold-accent/30">
              <Star className="w-5 h-5 text-gold-accent" />
              <span className="text-gold-accent font-bold">Champion</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Play again button */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.98, y: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onPlayAgain();
          }}
          className="px-12 py-4 rounded-xl font-bold uppercase tracking-wider text-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%)',
            border: '3px solid #fde047',
            boxShadow: '0 6px 0 0 #92400e, 0 8px 0 0 #78350f, 0 12px 30px rgba(0,0,0,0.5), 0 0 40px rgba(255, 215, 0, 0.3)',
            color: '#1a0a2e',
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">Play Again</span>
        </motion.button>
      </div>

      {/* Skip hint */}
      {canSkip && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white-soft/40 text-sm"
        >
          Click anywhere to continue
        </motion.p>
      )}
    </motion.div>
  );
}

export default VictoryScreen;
