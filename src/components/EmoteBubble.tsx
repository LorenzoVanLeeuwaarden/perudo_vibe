'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EmoteBubbleProps {
  emote: string;
  onComplete: () => void;
}

export function EmoteBubble({ emote, onComplete }: EmoteBubbleProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 2 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Trigger onComplete after exit animation
  useEffect(() => {
    if (!visible) {
      const exitTimer = setTimeout(onComplete, 300);
      return () => clearTimeout(exitTimer);
    }
  }, [visible, onComplete]);

  const bubbleContent = (
    <div className="relative bg-white/95 rounded-xl px-3 py-2 shadow-lg">
      {/* Speech bubble pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white/95" />
      <span className="text-2xl">{emote}</span>
    </div>
  );

  if (!visible) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={{ opacity: 0, scale: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="absolute top-full mt-3 left-1/2 -translate-x-1/2 pointer-events-none z-10"
      >
        {bubbleContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 pointer-events-none z-10"
    >
      {bubbleContent}
    </motion.div>
  );
}
