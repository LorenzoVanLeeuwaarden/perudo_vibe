'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { Dice } from './Dice';

interface Particle {
  id: number;
  startX: number;
  startY: number;
  size: number;
  delay: number;
}

interface SpawningDieProps {
  value: number;
  color: PlayerColor;
  onComplete?: () => void;
}

export function SpawningDie({ value, color, onComplete }: SpawningDieProps) {
  const [phase, setPhase] = useState<'converge' | 'materialize' | 'done'>('converge');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles that will converge
    const newParticles: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      newParticles.push({
        id: i,
        startX: Math.cos(angle) * distance,
        startY: Math.sin(angle) * distance,
        size: 4 + Math.random() * 4,
        delay: Math.random() * 0.15,
      });
    }
    setParticles(newParticles);

    // Phase 1: Converge for 600ms
    const materializeTimeout = setTimeout(() => {
      setPhase('materialize');
    }, 600);

    // Phase 2: After materialize animation
    const doneTimeout = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1200);

    return () => {
      clearTimeout(materializeTimeout);
      clearTimeout(doneTimeout);
    };
  }, [onComplete]);

  const colorConfig = PLAYER_COLORS[color];

  return (
    <div className="relative w-[44px] h-[44px]">
      {/* Converging particles */}
      {phase === 'converge' && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: '#22c55e',
                left: 22,
                top: 22,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                boxShadow: '0 0 8px #22c55e, 0 0 16px #4ade80',
              }}
              initial={{
                opacity: 0,
                scale: 0.5,
                x: p.startX,
                y: p.startY
              }}
              animate={{
                opacity: [0, 1, 1],
                scale: [0.5, 1, 0],
                x: 0,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: p.delay,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}

      {/* Flash effect when particles converge */}
      <AnimatePresence>
        {phase === 'materialize' && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: '#22c55e' }}
            initial={{ opacity: 0.9, scale: 1.5 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* The die materializing */}
      <AnimatePresence>
        {(phase === 'materialize' || phase === 'done') && (
          <motion.div
            className="die-spawning"
            initial={{
              scale: 0,
              opacity: 0,
              filter: 'brightness(2) saturate(1.5)',
            }}
            animate={{
              scale: [0, 1.3, 1],
              opacity: 1,
              filter: 'brightness(1) saturate(1)',
            }}
            transition={{
              duration: 0.4,
              times: [0, 0.6, 1],
              ease: 'easeOut',
            }}
          >
            <Dice value={value} size="sm" color={color} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Golden sparkles around the new die */}
      {phase === 'materialize' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 25;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: '#ffd700',
                  left: 22,
                  top: 22,
                  marginLeft: -2,
                  marginTop: -2,
                  boxShadow: '0 0 6px #ffd700, 0 0 12px #ffb800',
                }}
                initial={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: 0
                }}
                animate={{
                  opacity: 0,
                  scale: 0,
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.03,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SpawningDie;
