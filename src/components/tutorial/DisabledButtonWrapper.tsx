'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface DisabledButtonWrapperProps {
  children: React.ReactNode;
  tooltipText: string;
  playerColor: PlayerColor;
}

export function DisabledButtonWrapper({
  children,
  tooltipText,
  playerColor,
}: DisabledButtonWrapperProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = PLAYER_COLORS[playerColor];

  return (
    <div
      className="relative inline-block"
      tabIndex={0}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      aria-label={tooltipText}
    >
      {children}

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded text-xs text-white-soft whitespace-nowrap pointer-events-none z-[100]"
            style={{
              background: 'rgba(13, 4, 22, 0.95)',
              border: `1px solid ${colors.border}`,
            }}
          >
            {tooltipText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
