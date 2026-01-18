'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface KickConfirmDialogProps {
  isOpen: boolean;
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KickConfirmDialog({ isOpen, playerName, onConfirm, onCancel }: KickConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="retro-panel p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white-soft mb-2">
              Remove {playerName}?
            </h2>
            <p className="text-white-soft/60 mb-6">
              They will be removed from the lobby and redirected to the home page.
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg bg-purple-mid border border-purple-glow text-white-soft"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 py-2 rounded-lg bg-red-danger text-white font-bold"
              >
                Kick
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
