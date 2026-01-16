'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { Dice } from './Dice';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
}

interface DyingDieProps {
  value: number;
  color: PlayerColor;
  onComplete?: () => void;
}

export function DyingDie({ value, color, onComplete }: DyingDieProps) {
  const [phase, setPhase] = useState<'vibrate' | 'explode' | 'done'>('vibrate');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Phase 1: Vibrate for 800ms
    const vibrateTimeout = setTimeout(() => {
      // Generate particles for explosion
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const distance = 30 + Math.random() * 50;
        newParticles.push({
          id: i,
          x: 20 + Math.random() * 10, // Center of die
          y: 20 + Math.random() * 10,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: 3 + Math.random() * 5,
          delay: Math.random() * 0.1,
        });
      }
      setParticles(newParticles);
      setPhase('explode');
    }, 800);

    // Phase 2: After explosion animation
    const explodeTimeout = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1400);

    return () => {
      clearTimeout(vibrateTimeout);
      clearTimeout(explodeTimeout);
    };
  }, [onComplete]);

  const colorConfig = PLAYER_COLORS[color];

  return (
    <div className="relative w-[44px] h-[44px]">
      <AnimatePresence>
        {phase === 'vibrate' && (
          <motion.div
            className="die-dying"
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.05, 0.95, 1.1, 0.9, 1.15],
              filter: [
                'saturate(1) brightness(1)',
                'saturate(0) brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(6)',
              ],
            }}
            transition={{ duration: 0.8 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Dice value={value} size="sm" color={color} />
          </motion.div>
        )}

        {phase === 'explode' && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-full h-full" style={{ filter: 'saturate(0) brightness(0.3) sepia(1) hue-rotate(-50deg) saturate(8)' }}>
              <Dice value={value} size="sm" color={color} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pixel dust particles */}
      {phase === 'explode' && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-sm"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: '#ff3366',
                left: p.x,
                top: p.y,
                boxShadow: '0 0 4px #ff3366, 0 0 8px #ff0044',
              }}
              initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 0,
                x: p.dx,
                y: p.dy,
              }}
              transition={{
                duration: 0.5,
                delay: p.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Flash on death */}
      <AnimatePresence>
        {phase === 'explode' && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: '#ff3366' }}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default DyingDie;
