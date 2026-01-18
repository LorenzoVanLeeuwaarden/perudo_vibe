'use client';

import { useEffect, useState } from 'react';
import { Dice } from './Dice';
import type { PlayerColor } from '@/lib/types';

interface ExplodingDie {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  value: number;
  life: number;
}

interface DiceExplosionProps {
  color: PlayerColor;
  onComplete?: () => void;
}

export function DiceExplosion({ color, onComplete }: DiceExplosionProps) {
  const [dice, setDice] = useState<ExplodingDie[]>([]);

  useEffect(() => {
    // Create initial explosion of 12 dice from center
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 200;

    const initialDice: ExplodingDie[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 8 + Math.random() * 8;
      initialDice.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8, // Upward bias
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 25,
        value: Math.floor(Math.random() * 6) + 1,
        life: 1,
      });
    }
    setDice(initialDice);

    // Animate physics
    const interval = setInterval(() => {
      setDice(prev => {
        const updated = prev
          .map(d => ({
            ...d,
            x: d.x + d.vx,
            y: d.y + d.vy,
            vy: d.vy + 0.4, // Gravity
            vx: d.vx * 0.99, // Air resistance
            rotation: d.rotation + d.rotationSpeed,
            life: d.life - 0.008,
          }))
          .filter(d => d.life > 0);

        if (updated.length === 0) {
          clearInterval(interval);
          onComplete?.();
        }

        return updated;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {dice.map(d => (
        <div
          key={d.id}
          className="absolute"
          style={{
            left: d.x,
            top: d.y,
            transform: `translate(-50%, -50%) rotate(${d.rotation}deg) scale(${0.5 + d.life * 0.5})`,
            opacity: d.life,
          }}
        >
          <Dice value={d.value} color={color} size="sm" />
        </div>
      ))}
    </div>
  );
}
