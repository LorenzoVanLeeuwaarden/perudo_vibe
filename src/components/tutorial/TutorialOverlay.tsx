'use client';

import { motion } from 'framer-motion';

type SpotlightTarget =
  | 'player-dice'
  | 'bid-button'
  | 'dudo-button'
  | 'calza-button'
  | 'bid-display'
  | 'opponent-dice'
  | 'center'
  | 'full-dim'
  | null;

interface TutorialOverlayProps {
  /** Called when user clicks anywhere to dismiss */
  onDismiss: () => void;
  /** Target element to spotlight (exclude from dim) */
  spotlightTarget?: SpotlightTarget;
  /** The whisper/message text to display */
  message?: string;
}

/**
 * TutorialOverlay - Simple click-to-dismiss overlay with spotlight and message.
 *
 * Click anywhere to dismiss. No complex state management.
 */
export function TutorialOverlay({
  onDismiss,
  spotlightTarget = null,
  message,
}: TutorialOverlayProps) {
  // Get spotlight position and size based on target
  // Using wider values for better mobile visibility
  const getSpotlight = (): { x: string; y: string; rx: string; ry: string } | null => {
    switch (spotlightTarget) {
      case 'player-dice':
        return { x: '50%', y: '85%', rx: '90%', ry: '18%' };
      case 'bid-button':
      case 'dudo-button':
      case 'calza-button':
        return { x: '50%', y: '55%', rx: '80%', ry: '25%' };
      case 'bid-display':
        return { x: '50%', y: '45%', rx: '90%', ry: '30%' };
      case 'opponent-dice':
        return { x: '50%', y: '12%', rx: '90%', ry: '15%' };
      case 'center':
        return { x: '50%', y: '50%', rx: '80%', ry: '30%' };
      case 'full-dim':
      case null:
      default:
        return null;
    }
  };

  const spotlight = getSpotlight();

  // Build the gradient for spotlight effect
  const getBackground = () => {
    if (!spotlight) {
      return 'rgba(0, 0, 0, 0.85)';
    }

    return `radial-gradient(
      ellipse ${spotlight.rx} ${spotlight.ry} at ${spotlight.x} ${spotlight.y},
      transparent 0%,
      transparent 60%,
      rgba(0, 0, 0, 0.7) 80%,
      rgba(0, 0, 0, 0.9) 100%
    )`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[99] cursor-pointer"
      onClick={onDismiss}
      style={{ background: getBackground() }}
    >
      {/* Message text - centered or positioned based on spotlight */}
      {message && (
        <div
          className="absolute left-0 right-0 flex justify-center px-6"
          style={{
            top: spotlightTarget === 'player-dice' ? '45%' :
                 spotlightTarget === 'opponent-dice' ? '35%' :
                 spotlightTarget === 'bid-display' ? '65%' : '50%',
          }}
        >
          <p
            className="text-xl sm:text-2xl italic text-center max-w-lg px-6 py-3 rounded-xl"
            style={{
              color: 'rgba(255, 248, 230, 0.95)',
              textShadow: '0 0 20px rgba(255, 200, 100, 0.6), 0 2px 4px rgba(0,0,0,0.9)',
              fontFamily: 'Georgia, serif',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 200, 100, 0.2)',
            }}
          >
            {message}
          </p>
        </div>
      )}

      {/* Click anywhere hint */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white-soft/40 text-sm">tap to continue</p>
      </div>
    </motion.div>
  );
}
