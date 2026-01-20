'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Skull, X, Frown, AlertTriangle } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

// Detect Firefox browser for simplified animations
function useIsFirefox(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.toLowerCase().includes('firefox');
  }, []);
}

interface Ember {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

interface DefeatScreenProps {
  playerColor: PlayerColor;
  onPlayAgain: () => void;
}

export function DefeatScreen({ playerColor, onPlayAgain }: DefeatScreenProps) {
  const [embers, setEmbers] = useState<Ember[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(20);
  const colorConfig = PLAYER_COLORS[playerColor];
  const isFirefox = useIsFirefox();

  // Create floating embers - skip on Firefox for performance
  useEffect(() => {
    if (isFirefox) return; // Skip ember system on Firefox

    const createEmber = () => {
      const ember: Ember = {
        id: Date.now() + Math.random() * 100000,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -(1 + Math.random() * 2),
        size: 2 + Math.random() * 4,
        life: 1,
        color: Math.random() > 0.5 ? '#ff3366' : '#ff6b35',
      };
      setEmbers(prev => [...prev, ember]);
    };

    const interval = setInterval(createEmber, 50);
    return () => clearInterval(interval);
  }, [isFirefox]);

  // Ember physics - skip on Firefox for performance
  useEffect(() => {
    if (isFirefox) return; // Skip ember system on Firefox

    const interval = setInterval(() => {
      setEmbers(prev =>
        prev
          .map(e => ({
            ...e,
            x: e.x + e.vx + Math.sin(e.y * 0.02) * 0.5,
            y: e.y + e.vy,
            life: e.life - 0.008,
            vx: e.vx * 0.99,
          }))
          .filter(e => e.life > 0 && e.y > -50)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [isFirefox]);

  // Initial shake that calms down
  useEffect(() => {
    const timeout = setTimeout(() => setShakeIntensity(5), 500);
    const timeout2 = setTimeout(() => setShakeIntensity(0), 1500);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Dark red gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #2d0a0a 0%, #1a0505 50%, #0d0202 100%)',
        }}
      />

      {/* Pulsing red vignette - static on Firefox */}
      <motion.div
        className="absolute inset-0"
        style={isFirefox ? { background: 'radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, 0.3) 100%)' } : {}}
        animate={isFirefox ? {} : {
          background: [
            'radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, 0.3) 100%)',
            'radial-gradient(ellipse at center, transparent 40%, rgba(255, 0, 0, 0.5) 100%)',
            'radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, 0.3) 100%)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Blood drip effect at top */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 rounded-b-full"
            style={{
              left: `${i * 5 + Math.random() * 2}%`,
              width: 8 + Math.random() * 12,
              background: 'linear-gradient(180deg, #8b0000 0%, #ff3366 50%, transparent 100%)',
            }}
            initial={{ height: 0 }}
            animate={{ height: 40 + Math.random() * 60 }}
            transition={{
              delay: Math.random() * 0.5,
              duration: 1 + Math.random() * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Floating embers - skip on Firefox */}
      {!isFirefox && (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {embers.map(e => (
            <circle
              key={e.id}
              cx={e.x}
              cy={e.y}
              r={e.size * e.life}
              fill={e.color}
              opacity={e.life * 0.8}
              style={{ filter: `blur(${(1 - e.life) * 2}px)` }}
            />
          ))}
        </svg>
      )}

      {/* Cracked overlay effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d="M50 0 L48 20 L52 25 L47 40 L55 45 L45 60 L53 70 L50 100"
            stroke="#ff3366"
            strokeWidth="0.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <motion.path
            d="M50 0 L55 15 L45 30 L58 50 L42 65 L50 100"
            stroke="#ff3366"
            strokeWidth="0.3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
        </svg>
      </div>

      {/* Main content with shake */}
      <motion.div
        className="relative z-10 text-center"
        animate={{
          x: shakeIntensity > 0 ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0] : 0,
        }}
        transition={{ duration: 0.1, repeat: shakeIntensity > 0 ? Infinity : 0 }}
      >
        {/* Skull with X eyes */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          className="mb-6"
        >
          <motion.div
            // Skip animated filter on Firefox - it causes frame drops
            animate={isFirefox ? { scale: [1, 1.05, 1] } : {
              scale: [1, 1.05, 1],
              filter: [
                'drop-shadow(0 0 20px #ff3366)',
                'drop-shadow(0 0 40px #ff3366)',
                'drop-shadow(0 0 20px #ff3366)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative inline-block"
            style={isFirefox ? { filter: 'drop-shadow(0 0 20px #ff3366)' } : {}}
          >
            <svg width="160" height="160" viewBox="0 0 64 64" fill="none" className="mx-auto">
              {/* Skull shape */}
              <motion.path
                d="M32 8C18 8 10 18 10 28C10 34 12 38 14 42L14 48C14 50 16 52 18 52H46C48 52 50 50 50 48L50 42C52 38 54 34 54 28C54 18 46 8 32 8Z"
                fill="#8b0000"
                stroke="#ff3366"
                strokeWidth="2"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              />
              {/* Left eye socket */}
              <ellipse cx="24" cy="28" rx="6" ry="7" fill="#1a0505" />
              {/* Right eye socket */}
              <ellipse cx="40" cy="28" rx="6" ry="7" fill="#1a0505" />
              {/* X in left eye */}
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <line x1="20" y1="24" x2="28" y2="32" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" />
                <line x1="28" y1="24" x2="20" y2="32" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" />
              </motion.g>
              {/* X in right eye */}
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <line x1="36" y1="24" x2="44" y2="32" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" />
                <line x1="44" y1="24" x2="36" y2="32" stroke="#ff3366" strokeWidth="2" strokeLinecap="round" />
              </motion.g>
              {/* Nose */}
              <path d="M32 35L29 42H35L32 35Z" fill="#1a0505" />
              {/* Teeth */}
              <rect x="22" y="46" width="4" height="5" fill="#1a0505" rx="1" />
              <rect x="27" y="46" width="4" height="5" fill="#1a0505" rx="1" />
              <rect x="32" y="46" width="4" height="5" fill="#1a0505" rx="1" />
              <rect x="37" y="46" width="4" height="5" fill="#1a0505" rx="1" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Defeat text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-wider"
            style={{
              color: '#ff3366',
              textShadow: '0 0 20px #ff3366, 0 0 40px #ff0000, 0 4px 0 #8b0000',
            }}
            // Skip animated text-shadow on Firefox - it causes frame drops
            animate={isFirefox ? {} : {
              textShadow: [
                '0 0 20px #ff3366, 0 0 40px #ff0000, 0 4px 0 #8b0000',
                '0 0 40px #ff3366, 0 0 60px #ff0000, 0 4px 0 #8b0000',
                '0 0 20px #ff3366, 0 0 40px #ff0000, 0 4px 0 #8b0000',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Defeat
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-2xl text-red-300/80 mb-8"
          >
            You ran out of dice...
          </motion.p>

          {/* Dramatic message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center gap-4 mb-10"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/30">
              <Skull className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold">Eliminated</span>
            </div>
          </motion.div>

          {/* Falling dice animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                initial={{
                  top: '-10%',
                  left: `${10 + i * 12}%`,
                  rotate: 0,
                  opacity: 0.6,
                }}
                animate={{
                  top: '120%',
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: 0,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: 'easeIn',
                }}
              >
                🎲
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Try again button */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.98, y: 0 }}
          onClick={onPlayAgain}
          className="px-12 py-4 rounded-xl font-bold uppercase tracking-wider text-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
            border: '3px solid #f87171',
            boxShadow: '0 6px 0 0 #7f1d1d, 0 8px 0 0 #450a0a, 0 12px 30px rgba(0,0,0,0.5), 0 0 40px rgba(255, 51, 102, 0.2)',
            color: '#fef2f2',
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">Try Again</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default DefeatScreen;
