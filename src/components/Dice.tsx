'use client';

import { motion } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface DiceProps {
  value: number;
  index?: number;
  isRevealing?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isPalifico?: boolean;
  color?: PlayerColor;
  highlighted?: boolean;
  dimmed?: boolean;
  hidden?: boolean; // Show dice back without dots (for opponent's hidden dice)
}

// Cool skull-style joker symbol
function JokerSymbol({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' }) {
  // Responsive: use percentage-based sizing that scales with container
  const sizeClasses = {
    xs: 'w-[60%] h-[60%]',
    sm: 'w-[60%] h-[60%]',
    md: 'w-[60%] h-[60%]',
    lg: 'w-[60%] h-[60%]',
  };

  return (
    <svg className={sizeClasses[size]} viewBox="0 0 32 32" fill="none">
      {/* Outer glow ring */}
      <circle cx="16" cy="16" r="14" stroke="#ffd700" strokeWidth="1" opacity="0.5" />

      {/* Main skull shape */}
      <g filter="url(#glow)">
        {/* Skull body */}
        <path
          d="M16 4C10 4 6 9 6 14C6 17 7 19 8 21L8 24C8 25 9 26 10 26H22C23 26 24 25 24 24L24 21C25 19 26 17 26 14C26 9 22 4 16 4Z"
          fill="#ffd700"
        />
        {/* Left eye */}
        <ellipse cx="12" cy="14" rx="2.5" ry="3" fill="#0d0416" />
        {/* Right eye */}
        <ellipse cx="20" cy="14" rx="2.5" ry="3" fill="#0d0416" />
        {/* Nose */}
        <path d="M16 17L14.5 20H17.5L16 17Z" fill="#0d0416" />
        {/* Teeth */}
        <rect x="11" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
        <rect x="14" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
        <rect x="17" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
        <rect x="20" y="22" width="2" height="3" fill="#0d0416" rx="0.5" />
      </g>

      {/* Inner eye glow */}
      <ellipse cx="12" cy="14" rx="1" ry="1.2" fill="#ff4444" opacity="0.8" />
      <ellipse cx="20" cy="14" rx="1" ry="1.2" fill="#ff4444" opacity="0.8" />

      {/* Sparkles around */}
      <circle cx="5" cy="8" r="1" fill="#ffd700" opacity="0.6" />
      <circle cx="27" cy="8" r="1" fill="#ffd700" opacity="0.6" />
      <circle cx="4" cy="20" r="0.8" fill="#ffd700" opacity="0.4" />
      <circle cx="28" cy="20" r="0.8" fill="#ffd700" opacity="0.4" />

      <defs>
        <filter id="glow" x="-2" y="-2" width="36" height="36">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

const dotPositions: Record<number, { top: string; left: string }[]> = {
  2: [
    { top: '25%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
  3: [
    { top: '25%', left: '25%' },
    { top: '50%', left: '50%' },
    { top: '75%', left: '75%' },
  ],
  4: [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '75%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
  5: [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '50%', left: '50%' },
    { top: '75%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
  6: [
    { top: '25%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '50%', left: '25%' },
    { top: '50%', left: '75%' },
    { top: '75%', left: '25%' },
    { top: '75%', left: '75%' },
  ],
};

const sizeClasses = {
  xs: { container: 'w-7 h-7', dot: 'w-1 h-1' },
  sm: { container: 'w-10 h-10', dot: 'w-1.5 h-1.5' },
  md: { container: 'w-14 h-14', dot: 'w-2.5 h-2.5' },
  lg: { container: 'w-14 h-14 sm:w-20 sm:h-20', dot: 'w-2.5 h-2.5 sm:w-4 sm:h-4' },
};

// Colors that need white dots for visibility
const DARK_COLORS: PlayerColor[] = ['purple', 'blue', 'red', 'green'];

export function Dice({
  value,
  index = 0,
  isRevealing = false,
  size = 'md',
  isPalifico = false,
  color = 'orange',
  highlighted = false,
  dimmed = false,
  hidden = false,
}: DiceProps) {
  const isJoker = value === 1 && !hidden; // Treat hidden dice as regular (no joker symbol)
  const dots = !isJoker && !hidden ? (dotPositions[value] || []) : [];
  const sizeClass = sizeClasses[size];
  const colorConfig = PLAYER_COLORS[color];
  const useWhiteDots = DARK_COLORS.includes(color);

  const tilt = ((index * 17 + value * 7) % 13) - 6;

  // Highlighted glow color - use player's color instead of hardcoded green
  const highlightGlow = colorConfig.glow.replace('0.5)', '0.8)'); // Increase opacity for highlight
  const highlightBorder = colorConfig.bg;
  const highlightShadow = colorConfig.shadow;
  const highlightShadowDark = colorConfig.shadowDark;

  // Joker styling (special golden skull)
  const jokerStyle = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0416 50%, #1a1a2e 100%)',
    border: highlighted ? `3px solid ${highlightBorder}` : '2px solid #ffd700',
    boxShadow: highlighted
      ? `
        0 4px 0 0 ${highlightShadow},
        0 6px 0 0 ${highlightShadowDark},
        0 8px 20px 0 rgba(0, 0, 0, 0.6),
        0 0 30px ${highlightGlow},
        0 0 60px ${highlightGlow},
        inset 0 0 20px ${colorConfig.glow}
      `
      : `
        0 4px 0 0 #b8860b,
        0 6px 0 0 #8b6914,
        0 8px 20px 0 rgba(0, 0, 0, 0.6),
        0 15px 35px 0 rgba(0, 0, 0, 0.4),
        0 0 20px rgba(255, 215, 0, 0.4),
        inset 0 0 20px rgba(255, 215, 0, 0.1)
      `,
  };

  const regularStyle = {
    background: colorConfig.bgGradient,
    border: highlighted ? `3px solid ${highlightBorder}` : `2px solid ${colorConfig.border}`,
    boxShadow: highlighted
      ? `
        0 4px 0 0 ${highlightShadow},
        0 6px 0 0 ${highlightShadowDark},
        0 8px 20px 0 rgba(0, 0, 0, 0.6),
        0 0 30px ${highlightGlow},
        0 0 60px ${highlightGlow},
        inset 0 2px 4px rgba(255, 255, 255, 0.3)
      `
      : `
        0 4px 0 0 ${colorConfig.shadow},
        0 6px 0 0 ${colorConfig.shadowDark},
        0 8px 20px 0 rgba(0, 0, 0, 0.6),
        0 15px 35px 0 rgba(0, 0, 0, 0.4),
        0 0 10px ${colorConfig.glow},
        inset 0 2px 4px rgba(255, 255, 255, 0.3),
        inset 0 -2px 4px rgba(0, 0, 0, 0.2)
      `,
  };

  const style = isJoker && !isPalifico ? jokerStyle : regularStyle;

  // Animation phases based on dice state
  const shouldAnimate = !highlighted && !dimmed && !isRevealing;

  // Joker-specific animations - more energetic bounce and glow
  const jokerBounceAnimation = isJoker && !isPalifico && shouldAnimate
    ? {
        y: [0, -4, 0, -3, 0],
        rotate: [tilt, tilt + 3, tilt, tilt - 2, tilt],
        scale: [1, 1.02, 1, 1.01, 1],
      }
    : {};

  const jokerBounceTransition = isJoker && !isPalifico && shouldAnimate
    ? {
        y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
        scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      }
    : {};

  // Regular dice - subtle floating animation
  const regularFloatAnimation = !isJoker && shouldAnimate
    ? {
        y: [0, -2, 0],
        rotate: [tilt, tilt + 0.5, tilt],
      }
    : {};

  const regularFloatTransition = !isJoker && shouldAnimate
    ? {
        y: { duration: 2.5 + (index * 0.3), repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 3 + (index * 0.2), repeat: Infinity, ease: 'easeInOut' },
      }
    : {};

  return (
    <motion.div
      initial={isRevealing ? { scale: 0, rotate: -180, opacity: 0, y: -50 } : {}}
      animate={{
        scale: highlighted ? 1.15 : 1,
        rotate: highlighted ? 0 : tilt,
        opacity: dimmed ? 0.4 : 1,
        y: highlighted ? -8 : 0,
        ...jokerBounceAnimation,
        ...regularFloatAnimation,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: isRevealing ? index * 0.08 : 0,
        ...jokerBounceTransition,
        ...regularFloatTransition,
      }}
      whileHover={{
        scale: 1.08,
        rotate: 0,
        y: -4,
        transition: { duration: 0.15 },
      }}
      className={`
        ${sizeClass.container}
        relative
        rounded-lg
        cursor-pointer
        transform-gpu
        ${highlighted ? 'z-10' : ''}
        ${isJoker && !isPalifico ? 'joker-glow' : ''}
        dice-shine
        dice-shine-delay-${index % 5}
      `}
      style={style}
    >
      {isJoker ? (
        <motion.div
          initial={isRevealing ? { scale: 0, rotate: -90 } : {}}
          animate={{
            scale: [1, 1.05, 1],
            rotate: 0
          }}
          transition={{
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              type: 'spring',
              stiffness: 500,
              damping: 25,
              delay: isRevealing ? index * 0.08 + 0.1 : 0,
            }
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <JokerSymbol size={size} />
        </motion.div>
      ) : (
        dots.map((pos, i) => (
          <motion.div
            key={i}
            initial={isRevealing ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 25,
              delay: isRevealing ? index * 0.08 + 0.12 : 0,
            }}
            className={`
              absolute
              ${sizeClass.dot}
              rounded-full
              transform -translate-x-1/2 -translate-y-1/2
            `}
            style={{
              top: pos.top,
              left: pos.left,
              background: useWhiteDots ? '#ffffff' : 'var(--bg-dark)',
              boxShadow: useWhiteDots
                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 4px rgba(255, 255, 255, 0.5)'
                : 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          />
        ))
      )}
    </motion.div>
  );
}

export default Dice;
