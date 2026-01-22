'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TutorialTooltipProps {
  content: string;
  position: TooltipPosition;
  playerColor: PlayerColor;
  onDismiss?: () => void;
  targetRef?: React.RefObject<HTMLElement | null>;
  style?: React.CSSProperties;
}

export function TutorialTooltip({
  content,
  position,
  playerColor,
  onDismiss,
  targetRef,
  style,
}: TutorialTooltipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const colors = PLAYER_COLORS[playerColor];

  // Calculate position from targetRef if provided
  useEffect(() => {
    if (targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const gap = 12; // Space between tooltip and target

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2;
          break;
        case 'top':
          top = rect.top - gap;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - gap;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + gap;
          break;
      }

      setCoords({ top, left });
    }
  }, [targetRef, position]);

  // Get arrow styles based on position
  const getArrowStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    switch (position) {
      case 'bottom':
        // Arrow points up
        return {
          ...baseStyles,
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '0 8px 8px 8px',
          borderColor: `transparent transparent ${colors.border} transparent`,
        };
      case 'top':
        // Arrow points down
        return {
          ...baseStyles,
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '8px 8px 0 8px',
          borderColor: `${colors.border} transparent transparent transparent`,
        };
      case 'left':
        // Arrow points right
        return {
          ...baseStyles,
          top: '50%',
          right: -8,
          transform: 'translateY(-50%)',
          borderWidth: '8px 0 8px 8px',
          borderColor: `transparent transparent transparent ${colors.border}`,
        };
      case 'right':
        // Arrow points left
        return {
          ...baseStyles,
          top: '50%',
          left: -8,
          transform: 'translateY(-50%)',
          borderWidth: '8px 8px 8px 0',
          borderColor: `transparent ${colors.border} transparent transparent`,
        };
    }
  };

  // Get transform styles based on position for centering
  const getTransformStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom':
        return { transform: 'translateX(-50%)' };
      case 'top':
        return { transform: 'translate(-50%, -100%)' };
      case 'left':
        return { transform: 'translate(-100%, -50%)' };
      case 'right':
        return { transform: 'translateY(-50%)' };
    }
  };

  // Use style override if provided, otherwise use calculated coords
  const positionStyles: React.CSSProperties = style
    ? style
    : coords
    ? {
        top: coords.top,
        left: coords.left,
        ...getTransformStyles(),
      }
    : { visibility: 'hidden' as const };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[100] max-w-xs"
      style={positionStyles}
      onClick={onDismiss}
    >
      {/* Arrow pointer */}
      <div style={getArrowStyles()} />

      {/* Tooltip body */}
      <div
        className="rounded-lg p-4 text-sm text-white-soft"
        style={{
          background: 'rgba(13, 4, 22, 0.95)',
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
      >
        {content}
      </div>
    </motion.div>
  );
}
