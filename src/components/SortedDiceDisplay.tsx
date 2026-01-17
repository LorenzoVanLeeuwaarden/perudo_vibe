'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { PlayerColor } from '@/lib/types';
import { Dice } from './Dice';

interface SortedDiceDisplayProps {
  dice: number[];
  color: PlayerColor;
  isPalifico?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animateSort?: boolean;
}

interface DiceWithId {
  value: number;
  id: string;
  originalIndex: number;
}

export function SortedDiceDisplay({
  dice,
  color,
  isPalifico = false,
  size = 'md',
  animateSort = true,
}: SortedDiceDisplayProps) {
  // Create stable IDs for each die position
  const diceWithIds = useMemo(() => {
    return dice.map((value, index) => ({
      value,
      id: `die-${index}`,
      originalIndex: index,
    }));
  }, [dice]);

  // State to control when sorting happens
  const [isSorted, setIsSorted] = useState(!animateSort);
  const [displayDice, setDisplayDice] = useState<DiceWithId[]>(diceWithIds);

  // When dice change, reset to unsorted state then animate to sorted
  useEffect(() => {
    if (!animateSort) {
      setDisplayDice(diceWithIds);
      setIsSorted(true);
      return;
    }

    // First show unsorted
    setDisplayDice(diceWithIds);
    setIsSorted(false);

    // Then animate to sorted after a delay
    // Sort order: 2, 3, 4, 5, 6, 1 (Jokers at end, next to 6)
    const sortTimeout = setTimeout(() => {
      const getSortValue = (v: number) => v === 1 ? 7 : v;
      const sorted = [...diceWithIds].sort((a, b) => getSortValue(a.value) - getSortValue(b.value));
      setDisplayDice(sorted);
      setIsSorted(true);
    }, 800); // Delay before sorting animation starts

    return () => clearTimeout(sortTimeout);
  }, [dice, animateSort, diceWithIds]);

  return (
    <motion.div
      className="flex gap-3"
      layout
    >
      <AnimatePresence mode="popLayout">
        {displayDice.map((die, displayIndex) => (
          <motion.div
            key={die.id}
            layout
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              layout: {
                type: 'spring',
                stiffness: 350,
                damping: 25,
                duration: 0.5,
              },
              opacity: { duration: 0.2 },
              scale: {
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: die.originalIndex * 0.1,
              },
              rotate: {
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: die.originalIndex * 0.1,
              },
            }}
          >
            <Dice
              value={die.value}
              index={displayIndex}
              size={size}
              isPalifico={isPalifico}
              color={color}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export default SortedDiceDisplay;
