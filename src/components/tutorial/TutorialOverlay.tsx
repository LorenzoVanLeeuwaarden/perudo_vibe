'use client';

import { motion } from 'framer-motion';

interface TutorialOverlayProps {
  onDismiss: () => void;
}

export function TutorialOverlay({ onDismiss }: TutorialOverlayProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent tap-through on mobile
    e.stopPropagation();
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[99] cursor-pointer"
      onClick={handleClick}
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
      }}
    />
  );
}
