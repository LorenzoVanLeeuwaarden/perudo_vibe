'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';

// 8 preset emotes per CONTEXT.md decision
const EMOTES = ['😂', '🎉', '😱', '👍', '🔥', '💀', '🤔', '👀'];

interface EmotePickerProps {
  onSelect: (emote: string) => void;
  disabled?: boolean;
}

export function EmotePicker({ onSelect, disabled }: EmotePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emote: string) => {
    onSelect(emote);
    setOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={`p-2 rounded-lg bg-purple-mid/50 border border-purple-light/30
          hover:bg-purple-mid/70 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Open emote picker"
      >
        <Smile className="w-5 h-5 text-white-soft" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close picker */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 bg-purple-deep border border-purple-light/30 rounded-lg shadow-xl z-50"
              style={{ width: '200px' }}
            >
              <div className="p-3 grid grid-cols-4 gap-2">
                {EMOTES.map(emote => (
                  <button
                    key={emote}
                    onClick={() => handleSelect(emote)}
                    className="text-2xl w-10 h-10 flex items-center justify-center hover:bg-purple-mid/50 rounded transition-colors active:scale-90"
                  >
                    {emote}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
