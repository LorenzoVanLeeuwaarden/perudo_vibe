'use client';

import { motion, AnimatePresence, Reorder } from 'framer-motion';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { Dice } from './Dice';

// Highlight animation constants
const HIGHLIGHT_Y_OFFSET = -16;
const HIGHLIGHT_SCALE = 1.08;

interface SortedDiceDisplayProps {
  dice: number[];
  color: PlayerColor;
  isPalifico?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animateSort?: boolean;
  highlightValue?: number | null;
  draggable?: boolean;
}

/**
 * Determine if a die should be highlighted based on the current bid value
 * Jokers (value=1) match any non-joker bid unless in palifico
 */
function shouldHighlight(dieValue: number, bidValue: number | null, isPalifico: boolean): boolean {
  if (!bidValue) return false;
  if (dieValue === bidValue) return true;
  // Jokers are wild and match non-joker bids, except in palifico
  if (!isPalifico && dieValue === 1 && bidValue !== 1) return true;
  return false;
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
  highlightValue = null,
  draggable = false,
}: SortedDiceDisplayProps) {
  // Create stable IDs for each die position - use a unique ID per die instance
  const diceWithIds = useMemo(() => {
    return dice.map((value, index) => ({
      value,
      id: `die-${index}-${value}`,
      originalIndex: index,
    }));
  }, [dice]);

  // State to control when sorting happens
  const [isSorted, setIsSorted] = useState(!animateSort);
  const [displayDice, setDisplayDice] = useState<DiceWithId[]>(diceWithIds);
  // Track if user has manually reordered (prevents auto-sort override)
  const [hasManuallyOrdered, setHasManuallyOrdered] = useState(false);
  // Track previous dice values to detect new rolls
  const prevDiceRef = useRef(dice.join(','));

  // When dice change, reset to unsorted state then animate to sorted
  useEffect(() => {
    const currentDiceKey = dice.join(',');
    const diceChanged = currentDiceKey !== prevDiceRef.current;

    // If dice changed (new roll), reset manual ordering and update ref
    if (diceChanged) {
      setHasManuallyOrdered(false);
      prevDiceRef.current = currentDiceKey;
    }

    // If user has manually ordered and dice haven't changed, don't auto-sort
    if (hasManuallyOrdered && !diceChanged) {
      return;
    }

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
  }, [dice, animateSort, diceWithIds, hasManuallyOrdered]);

  // Handler for reorder events
  const handleReorder = (newOrder: DiceWithId[]) => {
    setDisplayDice(newOrder);
    setHasManuallyOrdered(true);
  };

  // Get glow color for highlights
  const glowColor = PLAYER_COLORS[color]?.glow || 'rgba(255, 215, 0, 0.8)';

  // Draggable mode with Reorder
  if (draggable) {
    return (
      <Reorder.Group
        as="div"
        axis="x"
        values={displayDice}
        onReorder={handleReorder}
        className="flex gap-3"
      >
        {displayDice.map((die, displayIndex) => {
          const isHighlighted = shouldHighlight(die.value, highlightValue, isPalifico);
          return (
            <Reorder.Item
              as="div"
              key={die.id}
              value={die}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{
                opacity: 1,
                scale: isHighlighted ? HIGHLIGHT_SCALE : 1,
                rotate: 0,
                y: isHighlighted ? HIGHLIGHT_Y_OFFSET : 0,
              }}
              whileDrag={{ scale: 1.1, zIndex: 10 }}
              transition={{
                layout: {
                  type: 'spring',
                  stiffness: 350,
                  damping: 25,
                },
                opacity: { duration: 0.2 },
                scale: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                },
                y: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                },
              }}
              style={{
                cursor: 'grab',
                filter: isHighlighted ? `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${glowColor})` : 'none',
                zIndex: isHighlighted ? 5 : 1,
              }}
            >
              <Dice
                value={die.value}
                index={displayIndex}
                size={size}
                isPalifico={isPalifico}
                color={color}
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    );
  }

  // Non-draggable mode (original behavior)
  return (
    <motion.div
      className="flex gap-3"
      layout
    >
      <AnimatePresence mode="popLayout">
        {displayDice.map((die, displayIndex) => {
          const isHighlighted = shouldHighlight(die.value, highlightValue, isPalifico);
          return (
            <motion.div
              key={die.id}
              layout
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{
                opacity: 1,
                scale: isHighlighted ? HIGHLIGHT_SCALE : 1,
                rotate: 0,
                y: isHighlighted ? HIGHLIGHT_Y_OFFSET : 0,
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
                y: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                },
              }}
              style={{
                filter: isHighlighted ? `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${glowColor})` : 'none',
                zIndex: isHighlighted ? 5 : 1,
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
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

export default SortedDiceDisplay;
