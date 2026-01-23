'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlayerColor } from '@/lib/types';
import { TerminalMessage } from './TerminalMessage';
import { PointerArrow } from './PointerArrow';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type TargetElement =
  | 'player-dice'
  | 'bid-button'
  | 'dudo-button'
  | 'calza-button'
  | 'bid-display'
  | 'opponent-dice';

interface TutorialTooltipProps {
  content: string;
  position: TooltipPosition;
  playerColor: PlayerColor;
  targetElement: TargetElement;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

/**
 * TutorialTooltip - Terminal-style tooltip with pointer arrow.
 *
 * Combines TerminalMessage (typewriter text) with PointerArrow (neon indicator)
 * for a system/terminal aesthetic tutorial experience.
 */
export function TutorialTooltip({
  content,
  position,
  playerColor,
  targetElement,
  style,
}: TutorialTooltipProps) {
  // Determine arrow direction based on position
  // Position is where tooltip appears relative to target
  // So arrow points in the opposite direction
  const arrowDirection = useMemo(() => {
    switch (position) {
      case 'top':
        return 'down'; // Tooltip above target, arrow points down
      case 'bottom':
        return 'up'; // Tooltip below target, arrow points up
      case 'left':
        return 'right';
      case 'right':
        return 'left';
    }
  }, [position]);

  // Calculate arrow position relative to tooltip
  const arrowPositionStyle = useMemo((): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
    };

    switch (position) {
      case 'top':
        // Tooltip is above target, arrow below tooltip pointing down
        return { ...base, bottom: -40, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        // Tooltip is below target, arrow above tooltip pointing up
        return { ...base, top: -40, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { ...base, right: -40, top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { ...base, left: -40, top: '50%', transform: 'translateY(-50%)' };
    }
  }, [position]);

  // Determine if we should show arrow for this target element
  const showArrow = useMemo(() => {
    // Show arrow for action-related targets
    return ['bid-button', 'dudo-button', 'calza-button', 'player-dice'].includes(targetElement);
  }, [targetElement]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[100] max-w-sm"
      style={style}
    >
      {/* Terminal message */}
      <TerminalMessage message={content} playerColor={playerColor} />

      {/* Pointer arrow */}
      {showArrow && (
        <div style={arrowPositionStyle}>
          <PointerArrow
            direction={arrowDirection}
            playerColor={playerColor}
            size={28}
          />
        </div>
      )}
    </motion.div>
  );
}
