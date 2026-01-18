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

  if (!visible) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={{ opacity: 0, scale: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl pointer-events-none"
      >
        {emote}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl pointer-events-none"
    >
      {emote}
    </motion.div>
  );
}
