'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DudoOverlayProps {
  isVisible: boolean;
  type: 'dudo' | 'calza';
  callerName: string;
  callerColor: PlayerColor;
  onComplete?: () => void;
}

export function DudoOverlay({ isVisible, type, callerName, callerColor, onComplete }: DudoOverlayProps) {
  const [showGlitch, setShowGlitch] = useState(false);
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;
  const colorConfig = PLAYER_COLORS[callerColor];

  const isDudo = type === 'dudo';
  const mainColor = isDudo ? '#ff3366' : '#22c55e';
  const glowColor = isDudo ? 'rgba(255, 51, 102, 0.8)' : 'rgba(34, 197, 94, 0.8)';

  useEffect(() => {
    if (isVisible) {
      // Trigger glitch effect on impact
      const glitchTimeout = setTimeout(() => {
        setShowGlitch(true);
        setTimeout(() => setShowGlitch(false), 150);
      }, 200);

      // Call onComplete after animation - give user time to see the overlay
      const completeTimeout = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => {
        clearTimeout(glitchTimeout);
        clearTimeout(completeTimeout);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence mode="popLayout">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop layer - simplified mode uses solid background, others get blur */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: useSimplifiedAnimations ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
              backdropFilter: useSimplifiedAnimations ? 'none' : 'blur(8px)',  // Skip blur on simplified mode
            }}
          />

          {/* Glitch/Impact flash - simplified on Firefox/reduced motion */}
          {!useSimplifiedAnimations && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: showGlitch ? [0, 1, 0.5, 1, 0] : 0,
                backgroundColor: showGlitch ? [
                  'transparent',
                  `${mainColor}30`,
                  'transparent',
                  `${mainColor}20`,
                  'transparent'
                ] : 'transparent'
              }}
              transition={{ duration: 0.15 }}
            />
          )}

          {/* Glitch lines - skip on Firefox/reduced motion */}
          {showGlitch && !useSimplifiedAnimations && (
            <>
              <motion.div
                className="absolute left-0 right-0 h-2"
                style={{
                  top: '30%',
                  background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`,
                  filter: 'blur(1px)'
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1.5, 0], opacity: [0, 1, 0], x: [-100, 100] }}
                transition={{ duration: 0.1 }}
              />
              <motion.div
                className="absolute left-0 right-0 h-1"
                style={{
                  top: '70%',
                  background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`,
                  filter: 'blur(1px)'
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1.2, 0], opacity: [0, 0.8, 0], x: [50, -50] }}
                transition={{ duration: 0.1, delay: 0.05 }}
              />
            </>
          )}

          {/* Main DUDO/CALZA text */}
          <motion.div
            className="relative"
            initial={{ scale: 5, opacity: 0, rotate: -5 }}
            animate={{
              scale: [5, 0.9, 1.1, 1],
              opacity: [0, 1, 1, 1],
              rotate: [-5, 2, -1, 0]
            }}
            transition={{
              duration: 0.4,
              times: [0, 0.5, 0.75, 1],
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {/* Shadow/depth layers */}
            <motion.div
              className="absolute inset-0 font-mono font-black text-8xl md:text-[12rem] uppercase tracking-tighter select-none"
              style={{
                color: 'transparent',
                WebkitTextStroke: `4px ${mainColor}40`,
                transform: 'translate(8px, 8px)',
                filter: 'blur(4px)'
              }}
            >
              {isDudo ? 'DUDO!' : 'CALZA!'}
            </motion.div>

            {/* Glow layer - simplified mode gets static glow, others get pulsing */}
            <motion.span
              className="absolute inset-0 font-mono font-black text-8xl md:text-[12rem] uppercase tracking-tighter select-none pointer-events-none"
              style={{
                color: mainColor,
                filter: useSimplifiedAnimations ? 'none' : 'blur(20px)',  // No blur on simplified mode
                opacity: useSimplifiedAnimations ? 0 : undefined,  // Hide on simplified mode (no glow layer)
              }}
              animate={useSimplifiedAnimations ? {} : { opacity: [0.4, 0.8, 0.4] }}  // Only animate on full mode
              transition={{ duration: 1, repeat: 2 }}
              aria-hidden="true"
            >
              {isDudo ? 'DUDO!' : 'CALZA!'}
            </motion.span>

            {/* RGB Glitch layers - skip entirely on Firefox/reduced motion */}
            {showGlitch && !useSimplifiedAnimations && (
              <>
                <motion.span
                  className="absolute inset-0 font-mono font-black text-8xl md:text-[12rem] uppercase tracking-tighter select-none pointer-events-none"
                  style={{ color: '#ff0000', mixBlendMode: 'screen' }}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ x: [-2, 2, -2], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.15 }}
                  aria-hidden="true"
                >
                  {isDudo ? 'DUDO!' : 'CALZA!'}
                </motion.span>
                <motion.span
                  className="absolute inset-0 font-mono font-black text-8xl md:text-[12rem] uppercase tracking-tighter select-none pointer-events-none"
                  style={{ color: '#00ffff', mixBlendMode: 'screen' }}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ x: [2, -2, 2], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.15, delay: 0.02 }}
                  aria-hidden="true"
                >
                  {isDudo ? 'DUDO!' : 'CALZA!'}
                </motion.span>
              </>
            )}

            {/* Main text - STATIC text-shadow, no animation */}
            <h1
              className="relative font-mono font-black text-8xl md:text-[12rem] uppercase tracking-tighter select-none"
              style={{
                color: mainColor,
                textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 4px 4px 0 ${isDudo ? '#990033' : '#166534'}`,  // Static
              }}
            >
              {isDudo ? 'DUDO!' : 'CALZA!'}
            </h1>

            {/* Caller name */}
            <motion.p
              className="text-center font-mono text-xl md:text-3xl mt-4 uppercase tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                color: colorConfig.bg,
                textShadow: `0 0 10px ${colorConfig.glow}, 0 0 20px ${colorConfig.glow}`
              }}
            >
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {callerName}
              </motion.span>
            </motion.p>
          </motion.div>

          {/* Impact particles - simplified mode gets 2, others get 5 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Impact sparks using CSS transforms */}
            {[...Array(useSimplifiedAnimations ? 2 : 5)].map((_, i) => {
              const particleCount = useSimplifiedAnimations ? 2 : 5;
              const angle = (i / particleCount) * Math.PI * 2;
              const distance = 120;
              const endX = Math.cos(angle) * distance;
              const endY = Math.sin(angle) * distance;
              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    marginTop: -4,
                    backgroundColor: mainColor,
                    boxShadow: useSimplifiedAnimations ? 'none' : `0 0 8px ${mainColor}`,  // No glow on simplified mode
                  }}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0],
                    x: [0, endX],
                    y: [0, endY]
                  }}
                  transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
                />
              );
            })}
          </div>

          {/* Screen shake container indicator */}
          <style jsx global>{`
            @keyframes screenShake {
              0%, 100% { transform: translate(0, 0); }
              10% { transform: translate(-5px, -5px); }
              20% { transform: translate(5px, -5px); }
              30% { transform: translate(-5px, 5px); }
              40% { transform: translate(5px, 5px); }
              50% { transform: translate(-3px, -3px); }
              60% { transform: translate(3px, -3px); }
              70% { transform: translate(-3px, 3px); }
              80% { transform: translate(3px, 3px); }
              90% { transform: translate(-1px, -1px); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DudoOverlay;
